import { Request, Response } from "express";
import { supabase } from "../../supabaseClient";
import { NewVKORC1, UpdateVKORC1, VKORC1 } from "../../types/gene/vkorc1";
import { newVKORC1Schema, updateVKORC1Schema } from "../../schemas/gene/vkorc1.schema";
import { newResultSchema } from "../../schemas/result.schema";
import { NewResult } from "../../types/result";
import { PK_FIELD_BY_TABLE } from "../../util/constant";

// GET /api/vkorc1
export async function getVKORC1(_req: Request, res: Response) {
  try {
    const { data, error } = await supabase
      .from("VKORC1")
      .select("*")
      .limit(100)
      .returns<VKORC1[]>();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } catch (e: any) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}

// GET /api/vkorc1/:id
export async function getVKORC1ById(req: Request, res: Response) {
  const idNum = Number(req.params.id);
  if (!Number.isFinite(idNum)) {
    return res.status(400).json({ error: "Invalid VKORC1_Id (must be a number)" });
  }
  try {
    const { data, error } = await supabase
      .from("VKORC1")
      .select("*")
      .eq("VKORC1_Id", idNum)
      .single()
      .returns<VKORC1>();
    if (error) return res.status(404).json({ error: error.message });
    return res.json(data);
  } catch (e: any) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}

// POST /api/vkorc1
export async function createVKORC1(req: Request, res: Response) {
  try {
    const {body : payload} = newVKORC1Schema.parse({body : req.body}) as {body : NewVKORC1};
    const { data, error } = await supabase
      .from("VKORC1")
      .insert(payload)
      .select("*")
      .single()
      .returns<VKORC1>();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json(data);
  } catch (e: any) {
    if (e?.name === "ZodError") {
      return res.status(400).json({ error: e.flatten() });
    }
    return res.status(500).json({ error: String(e?.message || e) });
  }
}

// PUT /api/vkorc1/:id
export async function updateVKORC1ById(req: Request, res: Response) {
  const idNum = Number(req.params.id);
  if (!Number.isFinite(idNum)) {
    return res.status(400).json({ error: "Invalid VKORC1_Id (must be a number)" });
  }
  try {
    const patch = updateVKORC1Schema.parse(req.body) as UpdateVKORC1;
    const { data, error } = await supabase
      .from("VKORC1")
      .update(patch)
      .eq("VKORC1_Id", idNum)
      .select("*")
      .single()
      .returns<VKORC1>();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json(data);
  } catch (e: any) {
    if (e?.name === "ZodError") {
      return res.status(400).json({ error: e.flatten() });
    }
    return res.status(500).json({ error: String(e?.message || e) });
  }
}

// DELETE /api/vkorc1/:id
export async function deleteVKORC1ById(req: Request, res: Response) {
  const idNum = Number(req.params.id);
  if (!Number.isFinite(idNum)) {
    return res.status(400).json({ error: "Invalid VKORC1_Id (must be a number)" });
  }
  try {
    const { error } = await supabase
      .from("VKORC1")
      .delete()
      .eq("VKORC1_Id", idNum);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true, message: `VKORC1 ${idNum} deleted` });
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

          if (geneError) return res.status(500).json({ error: geneError.message });
          if (!geneRows?.length) return res.status(400).json({ error: "Gene not found" });

          const geneName = geneRows[0].gene_name as string;
             const pkField = PK_FIELD_BY_TABLE[geneName];
        if (!pkField) return res.status(400).json({ error: `Unsupported gene table: ${geneName}` });

        const { data: geneRow, error: tableErr} = await supabase
            .from(geneName)
            .select("*")
            .eq("VKORC1_1173C", req.body.VKORC1_1173C)
            .eq("VKORC1_1639G", req.body.VKORC1_1639G)
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