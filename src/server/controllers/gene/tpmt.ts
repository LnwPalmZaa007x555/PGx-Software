import { Request, Response } from "express";
import { supabase } from "../../supabaseClient";
import { NewTPMT, TPMT, UpdateTPMT } from "../../types/gene/tpmt";
import { newTPMTSchema, updateTPMTSchema } from "../../schemas/gene/tpmt.schema";
import { newResultSchema } from "../../schemas/result.schema";
import { NewResult } from "../../types/result";
import { PK_FIELD_BY_TABLE } from "../../util/constant";
import { ZodError } from "zod";

// GET /api/tpmt
export async function getTPMT(_req: Request, res: Response) {
  try {
    const { data, error } = await supabase
      .from("TPMT")
      .select("*")
      .limit(100)
      .returns<TPMT[]>();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}

// GET /api/tpmt/:id
export async function getTPMTById(req: Request, res: Response) {
  const idNum = Number(req.params.id);
  if (!Number.isFinite(idNum)) {
    return res.status(400).json({ error: "Invalid TPMT_Id (must be a number)" });
  }
  try {
    const { data, error } = await supabase
      .from("TPMT")
      .select("*")
      .eq("TPMT_Id", idNum)
      .single()
      .returns<TPMT>();
    if (error) return res.status(404).json({ error: error.message });
    return res.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}

// POST /api/tpmt
export async function createTPMT(req: Request, res: Response) {
  try {
    const { body : payload} = newTPMTSchema.parse({body : req.body}) as {body : NewTPMT};
    const { data, error } = await supabase
      .from("TPMT")
      .insert(payload)
      .select("*")
      .single()
      .returns<TPMT>();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json(data);
  } catch (e: unknown) {
    if (e instanceof ZodError) return res.status(400).json({ error: e.flatten() });
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}

// PUT /api/tpmt/:id
export async function updateTPMTById(req: Request, res: Response) {
  const idNum = Number(req.params.id);
  if (!Number.isFinite(idNum)) {
    return res.status(400).json({ error: "Invalid TPMT_Id (must be a number)" });
  }
  try {
    const patch = updateTPMTSchema.parse(req.body) as UpdateTPMT;
    const { data, error } = await supabase
      .from("TPMT")
      .update(patch)
      .eq("TPMT_Id", idNum)
      .select("*")
      .single()
      .returns<TPMT>();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json(data);
  } catch (e: unknown) {
    if (e instanceof ZodError) return res.status(400).json({ error: e.flatten() });
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}

// DELETE /api/tpmt/:id
export async function deleteTPMTById(req: Request, res: Response) {
  const idNum = Number(req.params.id);
  if (!Number.isFinite(idNum)) {
    return res.status(400).json({ error: "Invalid TPMT_Id (must be a number)" });
  }
  try {
    const { error } = await supabase.from("TPMT").delete().eq("TPMT_Id", idNum);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true, message: `TPMT ${idNum} deleted` });
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
            .eq("TPMTx3C_719A", req.body.TPMTx3C_719A)
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