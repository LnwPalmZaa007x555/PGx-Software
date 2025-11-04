import { Request, Response, NextFunction } from "express";
import { supabase } from "../supabaseClient";
import type { Result, NewResult, UpdateResult } from "../types/result";
import { PK_FIELD_BY_TABLE } from "../util/constant";

// GET /api/results?limit=20&offset=0&status=completed&patient=123
export async function listResults(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = Number(req.query.limit ?? 20);
    const offset = Number(req.query.offset ?? 0);
    const status = req.query.status as Result["status"] | undefined;
    const patient = req.query.patient ? Number(req.query.patient) : undefined;

    let q = supabase.from("Result").select("*", { count: "exact" }).order("Result_Id", { ascending: false });

    if (status) q = q.eq("status", status);
    if (patient) q = q.eq("Patient_Id", patient);

    const { data, error, count } = await q.range(offset, offset + limit - 1).returns<Result[]>();
    if (error) return res.status(500).json({ error: error.message });

    return res.json({ items: data, count, limit, offset });
  } catch (e) { next(e); }
}

// GET /api/results/:id
export async function getResultById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const { data, error } = await supabase
      .from("Result")
      .select("*")
      .eq("Result_Id", id)
      .single()
      .returns<Result>();
    if (error) return res.status(404).json({ error: error.message });
    return res.json(data);
  } catch (e) { next(e); }
}

// POST /api/results
export async function createResult(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = req.body as NewResult;

    const { data, error } = await supabase
      .from("Result")
      .insert(payload)
      .select("*")
      .single()
      .returns<Result>();
    if (error) return res.status(500).json({ error: error.message });

    return res.status(201).json(data);
  } catch (e) { next(e); }
}

// PUT /api/results/:id
export async function updateResult(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const payload = req.body as UpdateResult;

    const { data, error } = await supabase
      .from("Result")
      .update(payload)
      .eq("Result_Id", id)
      .select("*")
      .single()
      .returns<Result>();
    if (error) return res.status(500).json({ error: error.message });

    return res.json(data);
  } catch (e) { next(e); }
}

// DELETE /api/results/:id
export async function deleteResult(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const { error } = await supabase.from("Result").delete().eq("Result_Id", id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).send();
  } catch (e) { next(e); }
}

// GET /api/results/by-patient/:patientId/latest
// Return latest result for a patient with gene_name, marker values (UI-mapped), and gene meta.
export async function getLatestByPatientWithGene(req: Request, res: Response, next: NextFunction) {
  try {
    const patientId = Number(req.params.patientId);
    if (!Number.isFinite(patientId)) return res.status(400).json({ error: "Invalid patient id" });

    // 1) Latest result for patient (any gene, including HLA_B)
    const { data: result, error: rErr } = await supabase
      .from("Result")
      .select("*")
      .eq("Patient_Id", patientId)
      .order("Result_Id", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (rErr) return res.status(500).json({ error: rErr.message });
    if (!result) return res.status(204).send(); // no result found
    const r = result as Result;

    // 2) Resolve gene name
    const { data: geneRow, error: gErr } = await supabase
      .from("Gene")
      .select("gene_id, gene_name")
  .eq("gene_id", r.gene_id)
      .single();
    if (gErr || !geneRow) return res.status(404).json({ error: gErr?.message || "Gene not found" });

    const dbGeneName = geneRow.gene_name as string; // e.g., CYP2C19 or HLA_B
    // Map to UI-friendly gene name (HLA_B -> HLA-B*15:02)
    const uiGeneName = dbGeneName === "HLA_B" ? "HLA-B*15:02" : dbGeneName;

    const pkField = PK_FIELD_BY_TABLE[dbGeneName];
    if (!pkField) return res.status(400).json({ error: `Unsupported gene table: ${dbGeneName}` });

    // 3) Fetch matched gene row by primary key stored in Result.gene_information
    const { data: geneInfoRow, error: giErr } = await supabase
      .from(dbGeneName)
      .select("*")
  .eq(pkField, r.gene_information)
      .single();
    if (giErr || !geneInfoRow) return res.status(404).json({ error: giErr?.message || "Gene information not found" });

    // 4) Map backend columns -> UI marker names
    const markers: Record<string, string> = {};
    switch (dbGeneName) {
      case "CYP2C19":
        markers["CYP2C19*2 (681G>A)"] = (geneInfoRow as any)["CYPx2_681G"] ?? "";
        markers["CYP2C19*3 (636G>A)"] = (geneInfoRow as any)["CYPx3_636G"] ?? "";
        markers["CYP2C19*17 (-806C>T)"] = (geneInfoRow as any)["CYPx17_806C"] ?? "";
        break;
      case "CYP2C9":
        markers["CYP2C9*2 (430C>T)"] = (geneInfoRow as any)["CYP2C9x2_430C"] ?? "";
        markers["CYP2C9*3 (1075A>C)"] = (geneInfoRow as any)["CYP2C9x3_1075A"] ?? "";
        break;
      case "CYP2D6":
        markers["CYP2D6*4 (1847G>A)"] = (geneInfoRow as any)["CYP2D6x4_1847G"] ?? "-";
        markers["CYP2D6*10 (100C>T)"] = (geneInfoRow as any)["CYP2D6x10_100C"] ?? "-";
        markers["CYP2D6*41 (2989G>A)"] = (geneInfoRow as any)["CYP2D6x41_2989G"] ?? "-";
        markers["CNV intron 2"] = (geneInfoRow as any)["CNV_Intron"] ?? "";
        markers["CNV exon 9"] = (geneInfoRow as any)["CNV_Exon"] ?? "";
        break;
      case "CYP3A5":
        markers["CYP3A5*3 (6986A>G)"] = (geneInfoRow as any)["CYP3A5x3_6986A"] ?? "";
        break;
      case "VKORC1":
        markers["VKORC1 (1173C>T)"] = (geneInfoRow as any)["VKORC1_1173C"] ?? "";
        markers["VKORC1 (-1639G>A)"] = (geneInfoRow as any)["VKORC1_1639G"] ?? "";
        break;
      case "TPMT":
        markers["TPMT*3C (719A>G)"] = (geneInfoRow as any)["TPMTx3C_719A"] ?? "";
        break;
      case "HLA_B":
        markers["HLA-B*15:02 status"] = (geneInfoRow as any)["status"] ?? "";
        break;
      default:
        // fallback: no markers
        break;
    }

  const predict_pheno = (geneInfoRow as any).Predict_Pheno ?? (geneInfoRow as any).phenotype ?? null;
  const recommend = (geneInfoRow as any).Recommend ?? (geneInfoRow as any).recommend ?? null;

    return res.json({
      result,
      gene: { gene_id: geneRow.gene_id, gene_name: uiGeneName },
      markers,
      predict_pheno,
      recommend,
    });
    
  } catch (e) { next(e); }
}


