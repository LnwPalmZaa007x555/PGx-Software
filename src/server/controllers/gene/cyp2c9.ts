import { Request, Response } from "express";
import { supabase } from "../../supabaseClient";
import { CYP2C9, NewCYP2C9, UpdateCYP2C9 } from "../../types/gene/cyp2c9";
import {
  newCYP2C9Schema,
  updateCYP2C9Schema,
} from "../../schemas/gene/cyp2c9.schema";
import { newResultSchema } from "../../schemas/result.schema";
import { NewResult } from "../../types/result";
import { PK_FIELD_BY_TABLE } from "../../util/constant";
import { ZodError } from "zod";

// GET /api/cyp2c9
export async function getCYP2C9(_req: Request, res: Response) {
  try {
    const { data, error } = await supabase
      .from("CYP2C9")
      .select("*")
      .limit(100)
      .returns<CYP2C9[]>();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}

// GET /api/cyp2c9/:id
export async function getCYP2C9ById(req: Request, res: Response) {
  const idNum = Number(req.params.id);
  if (!Number.isFinite(idNum)) {
    return res
      .status(400)
      .json({ error: "Invalid CYP2C9_Id (must be a number)" });
  }
  try {
    const { data, error } = await supabase
      .from("CYP2C9")
      .select("*")
      .eq("CYP2C9_Id", idNum)
      .single()
      .returns<CYP2C9>();
    if (error) return res.status(404).json({ error: error.message });
    return res.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}

// POST /api/cyp2c9
export async function createCYP2C9(req: Request, res: Response) {
  try {
    const { body: payload } = newCYP2C9Schema.parse({ body: req.body }) as { body: NewCYP2C9 };
    const { data, error } = await supabase
      .from("CYP2C9")
      .insert(payload)
      .select("*")
      .single()
      .returns<CYP2C9>();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json(data);
  } catch (e: unknown) {
    if (e instanceof ZodError)
      return res.status(400).json({ error: e.flatten() });
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}

// PUT /api/cyp2c9/:id
export async function updateCYP2C9ById(req: Request, res: Response) {
  const idNum = Number(req.params.id);
  if (!Number.isFinite(idNum)) {
    return res
      .status(400)
      .json({ error: "Invalid CYP2C9_Id (must be a number)" });
  }
  try {
    const patch = updateCYP2C9Schema.parse(req.body) as UpdateCYP2C9;
    const { data, error } = await supabase
      .from("CYP2C9")
      .update(patch)
      .eq("CYP2C9_Id", idNum)
      .select("*")
      .single()
      .returns<CYP2C9>();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json(data);
  } catch (e: unknown) {
    if (e instanceof ZodError)
      return res.status(400).json({ error: e.flatten() });
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}

// DELETE /api/cyp2c9/:id
export async function deleteCYP2C9ById(req: Request, res: Response) {
  const idNum = Number(req.params.id);
  if (!Number.isFinite(idNum)) {
    return res
      .status(400)
      .json({ error: "Invalid CYP2C9_Id (must be a number)" });
  }
  try {
    const { error } = await supabase
      .from("CYP2C9")
      .delete()
      .eq("CYP2C9_Id", idNum);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true, message: `CYP2C9 ${idNum} deleted` });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}


export async function saveToResult(req: Request, res: Response) {
  const geneid = Number(req.body?.geneid);
  const patientId = Number(req.body?.Patient_Id);
  const staffId = Number(req.body?.staff_id);

  if (!Number.isFinite(geneid))   return res.status(400).json({ error: "Invalid gene_id (must be a number)" });
  if (!Number.isFinite(patientId))return res.status(400).json({ error: "Invalid Patient_Id (must be a number)" });
  if (!Number.isFinite(staffId))  return res.status(400).json({ error: "Invalid staff_id (must be a number)" });

  try {
    // 1) หา gene_name จากตาราง Gene
    const { data: geneRows, error: geneError } = await supabase
      .from("Gene")
      .select("gene_name")
      .eq("gene_id", geneid)
      .limit(1);

    if (geneError) return res.status(500).json({ error: geneError.message });
    if (!geneRows?.length) return res.status(404).json({ error: "Gene not found" });

    const geneName = geneRows[0].gene_name as string;
    const pkField = PK_FIELD_BY_TABLE[geneName];
    if (!pkField) return res.status(400).json({ error: `Unsupported gene table: ${geneName}` });

    // 2) คิวรีตารางยีน (เลือกระเบียนที่ match ตามเงื่อนไขจาก body)
    // หมายเหตุ: ตัวอย่างนี้เขียนตาม CYP2C9; ถ้า gene อื่นให้ปรับเงื่อนไขตามฟิลด์ของตารางนั้น
    const { data: geneRow, error: tableErr } = await supabase
      .from(geneName)
      .select("*")
      .eq("CYP2C9x2_430C", req.body.CYP2C9x2_430C)
      .eq("CYP2C9x3_1075A", req.body.CYP2C9x3_1075A)
      .single();

    if (tableErr)   return res.status(404).json({ error: tableErr.message });
    if (!geneRow)   return res.status(404).json({ error: "Gene record not found" });

  const gene_information = Number((geneRow as Record<string, unknown>)[pkField] as unknown);
    if (!Number.isFinite(gene_information)) {
      return res.status(500).json({ error: `Primary key "${pkField}" not found in ${geneName} row` });
    }

    // 3) เตรียม payload ใส่ตาราง Result
    const createResult = {
      Requested_date: new Date().toISOString(), // หรือให้ DB ใส่ default ก็ได้
      Patient_Id: patientId,
      status: "pending",          // ปรับตาม workflow ของคุณได้
      Reported_date: null,        // ยังไม่รายงาน
      gene_id: geneid,
      gene_information,
      staff_id: staffId,      
    };

    // ถ้า route มี validate(newResultSchema) อยู่แล้ว ไม่ต้อง parse ซ้ำ
    // แต่ถ้าจะ parse ตรงนี้ ให้ดึง body schema ออกมา หรือดึง .body คืน
    const { body: payload } = newResultSchema.parse({ body: createResult }) as { body: NewResult };

    // 4) INSERT ลง Result
const { data: resultRow, error: insertErr } = await supabase
  .from("Result")
  .insert(payload)
  .select("*")        // คืนแถวที่เพิ่ง insert
  .single();
  

if (insertErr) return res.status(400).json({ error: insertErr.message });

//เปลี่ยน status

// 5) ดึง Result + ข้อมูล Staff แบบ embed (สั้น ๆ)
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
  .eq("Result_Id", resultRow.Result_Id)  // ใช้แถวที่เพิ่งสร้าง
  .single();

if (enrichErr) return res.status(500).json({ error: enrichErr.message });

const response = {
  ...enriched,
  gene_meta: {
    gene_name: geneName,
    //predict_geno: (geneRow as any).Predict_Geno ?? null,
  predict_pheno: (geneRow as Record<string, unknown>)["Predict_Pheno"] as string | null ?? null,
  recommend: (geneRow as Record<string, unknown>)["Recommend"] as string | null ?? null,
  },
};

return res.status(201).json(response);
  } catch (e: unknown) {
    console.error("[saveToResult ERROR]", e);
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}
