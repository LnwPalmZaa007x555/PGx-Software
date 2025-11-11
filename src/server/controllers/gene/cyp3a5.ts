import { Request, Response } from "express";
import { supabase } from "../../supabaseClient";
import { CYP3A5, NewCYP3A5, UpdateCYP3A5 } from "../../types/gene/cyp3a5";
import { newCYP3A5Schema, updateCYP3A5Schema } from "../../schemas/gene/cyp3a5.schema";
import { newResultSchema } from "../../schemas/result.schema";
import { NewResult } from "../../types/result";
import { PK_FIELD_BY_TABLE } from "../../util/constant";
import { ZodError } from "zod";

// GET /api/cyp3a5
export async function getCYP3A5(_req: Request, res: Response) {
  try {
    const { data, error } = await supabase
      .from("CYP3A5")
      .select("*")
      .limit(100)
      .returns<CYP3A5[]>();

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}

// GET /api/cyp3a5/:id
export async function getCYP3A5ById(req: Request, res: Response) {
  const idNum = Number(req.params.id);
  if (!Number.isFinite(idNum)) {
    return res.status(400).json({ error: "Invalid CYP3A5_Id (must be a number)" });
  }
  try {
    const { data, error } = await supabase
      .from("CYP3A5")
      .select("*")
      .eq("CYP3A5_Id", idNum)
      .single()
      .returns<CYP3A5>();

    if (error) return res.status(404).json({ error: error.message });
    return res.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}

// POST /api/cyp3a5
export async function createCYP3A5(req: Request, res: Response) {
  try {
    const { body : payload} = newCYP3A5Schema.parse({ body : req.body}) as { body: NewCYP3A5};

    const { data, error } = await supabase
      .from("CYP3A5")
      .insert(payload)
      .select("*")
      .single()
      .returns<CYP3A5>();

    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json(data);
  } catch (e: unknown) {
    if (e instanceof ZodError) {
      return res.status(400).json({ error: e.flatten() });
    }
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}

// PUT /api/cyp3a5/:id
export async function updateCYP3A5ById(req: Request, res: Response) {
  const idNum = Number(req.params.id);
  if (!Number.isFinite(idNum)) {
    return res.status(400).json({ error: "Invalid CYP3A5_Id (must be a number)" });
  }
  try {
    const patch = updateCYP3A5Schema.parse(req.body) as UpdateCYP3A5;

    const { data, error } = await supabase
      .from("CYP3A5")
      .update(patch)
      .eq("CYP3A5_Id", idNum)
      .select("*")
      .single()
      .returns<CYP3A5>();

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json(data);
  } catch (e: unknown) {
    if (e instanceof ZodError) {
      return res.status(400).json({ error: e.flatten() });
    }
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}

// DELETE /api/cyp3a5/:id
export async function deleteCYP3A5ById(req: Request, res: Response) {
  const idNum = Number(req.params.id);
  if (!Number.isFinite(idNum)) {
    return res.status(400).json({ error: "Invalid CYP3A5_Id (must be a number)" });
  }
  try {
    const { error } = await supabase
      .from("CYP3A5")
      .delete()
      .eq("CYP3A5_Id", idNum);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true, message: `CYP3A5 ${idNum} deleted` });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}


export async function saveToResult(req: Request, res: Response) {
    const geneid = Number(req.body?.geneid);
    const patientId = Number(req.body?.Patient_Id);
    const staffId = Number(req.body?.staff_id);

    if (!Number.isFinite(geneid)) return res.status(400).json({ error: "Invalid geneid (must be a number)" });
    if (!Number.isFinite(patientId)) return res.status(400).json({ error: "Invalid Patient_Id (must be a number)" });
    if (!Number.isFinite(staffId)) return res.status(400).json({ error: "Invalid staff_id (must be a number)" });  

    try {
        const { data: geneRows, error: geneError } = await supabase
          .from("Gene")
          .select("gene_name")
          .eq("gene_id", geneid)
          .limit(1)

          if (geneError) return res.status(500).json({ error: geneError.message });
          if (!geneRows?.length) return res.status(400).json({ error: "Gene not found" });

       const geneName = String(geneRows[0].gene_name);
             const pkField = PK_FIELD_BY_TABLE[geneName];
        if (!pkField) return res.status(400).json({ error: `Unsupported gene table: ${geneName}` });

        const { data: geneRow, error: tableErr} = await supabase
            .from(geneName)
            .select("*")
            .eq("CYP3A5x3_6986A", req.body.CYP3A5x3_6986A)
            .single();
          
        if (tableErr) return res.status(500).json({ error: tableErr.message });
    if (!geneRow) return res.status(404).json({ error: "No matching gene record found" });

    const giRaw = (geneRow as Record<string, unknown>)[pkField];
    const gene_information = typeof giRaw === "number" ? giRaw : Number(giRaw);
        
        if (!Number.isFinite(gene_information)) {
            return res.status(500).json({error: `Primary  key field "${pkField}" not found in ${geneName} row` });
        }

        const createResult = {
            Requested_date: new Date().toISOString(),
            Patient_Id: patientId,
            status: "pending",
            Reported_date: null,
            gene_id: geneid,
            gene_information,
            staff_id: staffId,
        };
        const { body: payload} = newResultSchema.parse({ body: createResult }) as { body: NewResult};

        const { data: resultRow, error: insertErr } = await supabase
            .from("Result")
            .insert(payload)
            .select("*")
            .single()

            if (insertErr) return res.status(500).json({ error: insertErr.message });

            const { data: enriched, error: enrichErr } = await supabase
                .from("Result")
                .select(`
            Result_Id,
            Requested_date,
            status,
            Patient_Id,
            gene_id,
            gene_information,
            staff:Staff!inner(Staff_Id, Role, Fname, Lname, Hospital_Name)
            `)
            .eq("Result_Id", resultRow.Result_Id)
            .single();

            if (enrichErr) return res.status(500).json({ error: enrichErr.message });

      const gr = geneRow as Record<string, unknown>;
      const predict_pheno = typeof gr["Predict_Pheno"] === "string" ? (gr["Predict_Pheno"] as string) : null;
      const recommend = typeof gr["Recommend"] === "string" ? (gr["Recommend"] as string) : null;

      const response = { 
                ...enriched,
                gene_meta:{
                    gene_name: geneName,
          predict_pheno,
          recommend,
                },
            }
            return res.status(201).json(response);
  } catch (e : unknown) {
    console.error("[saveToResult ERROR]", e);
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
    }
}