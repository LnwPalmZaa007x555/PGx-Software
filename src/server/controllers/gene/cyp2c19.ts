import { Request, Response } from "express";
import { supabase } from "../../supabaseClient";
import { CYP2C19 } from "../../types/gene/cyp2c19";
import { newCYP2C19Schema, updateCYP2C19Schema } from "../../schemas/gene/cyp2c19";
import { newResultSchema } from "../../schemas/result.schema";
import { NewResult } from "../../types/result";
import { PK_FIELD_BY_TABLE } from "../../util/constant";
import { ZodError } from "zod";


// get / api/cyp2c19
export async function getCYP2C19(_req: Request, res: Response) {
  try {
    const { data, error } = await supabase
        .from("CYP2C19")
        .select("*")
        .limit(100)
        .returns<CYP2C19[]>();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        return res.status(500).json({ error: msg });
  }
}

// get / api/cyp2c19/:id
export async function getCYP2C19ById(req: Request, res: Response) {
  const idNum = Number (req.params.id);
    if (!Number.isFinite(idNum)) {
    return res
      .status(400)
      .json({ error: "Invalid CYP2C19_Id (must be a number)" });
  }
  try {
    const { data, error } = await supabase
        .from("CYP2C19")
        .select("*")
        .eq("CYP2C19_Id", idNum)
        .single()
        .returns<CYP2C19>();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        return res.status(500).json({ error: msg });
  }
}

// post / api/cyp2c19
export async function createCYP2C19(req: Request, res: Response) {
 try {
    const { body: payload} = newCYP2C19Schema.parse({ body: req.body }) as { body: CYP2C19};
    const { data, error } = await supabase
      .from("CYP2C19")
      .insert (payload)
      .select("*")
      .single()
      .returns<CYP2C19>();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json(data);
 } catch (e: unknown) {
        if (e instanceof ZodError)
            return res.status(400).json({ error: e.flatten() });
        const msg = e instanceof Error ? e.message : String(e);
        return res.status(500).json({ error: msg });
 }
}

// PUT /api/cyp2c19/:id
export async function updateCYP2C19ById(req: Request, res: Response){
    const idNum = Number (req.params.id);
        if (!Number.isFinite(idNum)) {
            return res
              .status(400)
              .json({ error: "Invalid CYP2C19_Id (must be a number)" });
        }
    try {
        const patch = updateCYP2C19Schema.parse(req.body) as Partial<CYP2C19>;
        const { data, error } = await supabase
            .from("CYP2C19")
            .update(patch)
            .eq("CYP2C19_Id", idNum)
            .select("*")
            .single()
            .returns<CYP2C19>();
        if (error) return res.status(400).json({ error: error.message });
        return res.json(data);
    } catch (e : unknown) {
        if (e instanceof ZodError)
        return res.status(400).json({ error: e.flatten() });
        const msg = e instanceof Error ? e.message : String(e);
        return res.status(500).json({ error: msg });
    }
}

// DELETE /api/cyp2c19/:id
export async function deleteCYP2C19ById(req: Request, res: Response) {
    const idNum = Number (req.params.id);
    if (!Number.isFinite(idNum)) {
        return res
          .status(400)
          .json({ error: "Invalid CYP2C19_Id (must be a number)" });
    }
    try {
        const { error } = await supabase
            .from("CYP2C19")
            .delete()
            .eq("CYP2C19_Id", idNum);
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ ok: true, message: `CYP2C19 ${idNum} deleted` });
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

          const geneName = geneRows[0].gene_name as string;
             const pkField = PK_FIELD_BY_TABLE[geneName];
        if (!pkField) return res.status(400).json({ error: `Unsupported gene table: ${geneName}` });

        const { data: geneRow, error: tableErr} = await supabase
            .from(geneName)
            .select("*")
            .eq("CYPx2_681G", req.body.CYPx2_681G)
            .eq("CYPx3_636G", req.body.CYPx3_636G)
            .eq("CYPx17_806C", req.body.CYPx17_806C)
            .single();

        if (tableErr) return res.status(500).json({ error: tableErr.message });
        if (!geneRow) return res.status(404).json({ error: "No matching gene record found" });

    const gene_information = Number((geneRow as Record<string, unknown>)[pkField] as unknown);
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

            const response = { 
                ...enriched,
                gene_meta:{
                    gene_name: geneName,
                    predict_pheno: (geneRow as Record<string, unknown>)["Predict_Pheno"] as string | null ?? null,
                    recommend: (geneRow as Record<string, unknown>)["Recommend"] as string | null ?? null,
                },
            }
            return res.status(201).json(response);
    } catch (e : unknown) {
        console.error("[saveToResult ERROR]", e);
        const msg = e instanceof Error ? e.message : String(e);
        return res.status(500).json({ error: msg });
    }
}