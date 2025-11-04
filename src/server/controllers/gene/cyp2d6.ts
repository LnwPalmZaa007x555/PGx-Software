import { Request, Response } from "express";
import { supabase } from "../../supabaseClient";
import { CYP2D6, NewCYP2D6, UpdateCYP2D6 } from "../../types/gene/cyp2d6";
import { newCYP2D6Schema, updateCYP2D6Schema } from "../../schemas/gene/cyp2d6.schema";
import { newResultSchema } from "../../schemas/result.schema";
import { NewResult } from "../../types/result";
import { PK_FIELD_BY_TABLE } from "../../util/constant";

// GET /api/cyp2d6
export async function getCYP2D6(_req: Request, res: Response) {
  try {
    const { data, error } = await supabase
      .from("CYP2D6")
      .select("*")
      .limit(100)
      .returns<CYP2D6[]>();

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } catch (e: any) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}

// GET /api/cyp2d6/:id
export async function getCYP2D6ById(req: Request, res: Response) {
  const idNum = Number(req.params.id);
  if (!Number.isFinite(idNum)) {
    return res.status(400).json({ error: "Invalid 2D6_Id (must be a number)" });
  }
  try {
    const { data, error } = await supabase
      .from("CYP2D6")
      .select("*")
      .eq("2D6_Id", idNum)   // 👈 ใช้ชื่อคอลัมน์เป็นสตริง
      .single()
      .returns<CYP2D6>();

    if (error) return res.status(404).json({ error: error.message });
    return res.json(data);
  } catch (e: any) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}

// POST /api/cyp2d6
export async function createCYP2D6(req: Request, res: Response) {
  try {
    const { body : payload} = newCYP2D6Schema.parse({ body : req.body}) as { body: NewCYP2D6};
    const { data, error } = await supabase
      .from("CYP2D6")
      .insert(payload)
      .select("*")
      .single()
      .returns<CYP2D6>();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json(data);
  } catch (e: any) {
    if (e?.name === "ZodError") return res.status(400).json({ error: e.flatten() });
    return res.status(500).json({ error: String(e?.message || e) });
  }
}

// PUT /api/cyp2d6/:id
export async function updateCYP2D6ById(req: Request, res: Response) {
  const idNum = Number(req.params.id);
  if (!Number.isFinite(idNum)) {
    return res.status(400).json({ error: "Invalid 2D6_Id (must be a number)" });
  }
  try {
    const patch = updateCYP2D6Schema.parse(req.body) as UpdateCYP2D6;
    const { data, error } = await supabase
      .from("CYP2D6")
      .update(patch)
      .eq("2D6_Id", idNum)
      .select("*")
      .single()
      .returns<CYP2D6>();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json(data);
  } catch (e: any) {
    if (e?.name === "ZodError") return res.status(400).json({ error: e.flatten() });
    return res.status(500).json({ error: String(e?.message || e) });
  }
}

// DELETE /api/cyp2d6/:id
export async function deleteCYP2D6ById(req: Request, res: Response) {
  const idNum = Number(req.params.id);
  if (!Number.isFinite(idNum)) {
    return res.status(400).json({ error: "Invalid 2D6_Id (must be a number)" });
  }
  try {
    const { error } = await supabase
      .from("CYP2D6")
      .delete()
      .eq("2D6_Id", idNum);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true, message: `CYP2D6 ${idNum} deleted` });
  } catch (e: any) {
    return res.status(500).json({ error: String(e?.message || e) });
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
          console.log(geneRows)

          if (geneError) return res.status(500).json({ error: geneError.message });
          if (!geneRows?.length) return res.status(400).json({ error: "Gene not found" });

          const geneName = geneRows[0].gene_name as string;
             const pkField = PK_FIELD_BY_TABLE[geneName];
        if (!pkField) return res.status(400).json({ error: `Unsupported gene table: ${geneName}` });

        const { data: geneRow, error: tableErr} = await supabase
            .from(geneName)
            .select("*")
            .eq("CYP2D6x4_1847G", req.body.CYP2D6x4_1847G)
            .eq("CYP2D6x10_100C", req.body.CYP2D6x10_100C)
            .eq("CYP2D6x41_2989G", req.body.CYP2D6x41_2989G)
            .eq("CNV_Intron", req.body.CNV_Intron)
            .eq("CNV_Exon", req.body.CNV_Exon)
            .single();



        if (tableErr) return res.status(500).json({ error: tableErr.message });
        if (!geneRow) return res.status(404).json({ error: "No matching gene record found" });

        const gene_information = Number((geneRow as any)[pkField]);
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
                    predict_pheno: (geneRow as any).Predict_Pheno ?? null,
                    recommend: (geneRow as any).Recommend ?? null,
                },
            }
            return res.status(201).json(response);
    } catch (e : any) {
        console.error("[saveToResult ERROR]", e);
        return res.status(500).json({ error: String(e?.message || e) });
    }
}