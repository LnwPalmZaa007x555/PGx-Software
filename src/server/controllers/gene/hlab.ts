import { Request, Response } from "express";
import { supabase } from "../../supabaseClient";
import { HLAB, NewHLAB, UpdateHLAB } from "../../types/gene/hlab";
import { newHLABSchema, updateHLABSchema } from "../../schemas/gene/hlab.schema";
import { newResultSchema } from "../../schemas/result.schema";
import { NewResult } from "../../types/result";
import { PK_FIELD_BY_TABLE } from "../../util/constant";
import { ZodError } from "zod";

// GET /api/hlab
export async function getHLAB(_req: Request, res: Response) {
  try {
    const { data, error } = await supabase
      .from("HLA_B")
      .select("*")
      .limit(100)
      .returns<HLAB[]>();

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}

// GET /api/hlab/:id
export async function getHLABById(req: Request, res: Response) {
  const idNum = Number(req.params.id);
  if (!Number.isFinite(idNum)) {
    return res.status(400).json({ error: "Invalid HLA_B_Id (must be a number)" });
  }

  try {
    const { data, error } = await supabase
      .from("HLA_B")
      .select("*")
      .eq("HLA_B_Id", idNum)
      .single()
      .returns<HLAB>();

    if (error) return res.status(404).json({ error: error.message });
    return res.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}

// POST /api/hlab
export async function createHLAB(req: Request, res: Response) {
  try {
    const { body : payload} = newHLABSchema.parse({body : req.body}) as {body : NewHLAB};
    const { data, error } = await supabase
      .from("HLA_B")
      .insert(payload)
      .select("*")
      .single()
      .returns<HLAB>();

    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json(data);
  } catch (e: unknown) {
    if (e instanceof ZodError) return res.status(400).json({ error: e.flatten() });
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}

// PUT /api/hlab/:id
export async function updateHLABById(req: Request, res: Response) {
  const idNum = Number(req.params.id);
  if (!Number.isFinite(idNum)) {
    return res.status(400).json({ error: "Invalid HLA_B_Id (must be a number)" });
  }

  try {
    const patch = updateHLABSchema.parse(req.body) as UpdateHLAB;
    const { data, error } = await supabase
      .from("HLA_B")
      .update(patch)
      .eq("HLA_B_Id", idNum)
      .select("*")
      .single()
      .returns<HLAB>();

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json(data);
  } catch (e: unknown) {
    if (e instanceof ZodError) return res.status(400).json({ error: e.flatten() });
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}

// DELETE /api/hlab/:id
export async function deleteHLABById(req: Request, res: Response) {
  const idNum = Number(req.params.id);
  if (!Number.isFinite(idNum)) {
    return res.status(400).json({ error: "Invalid HLA_B_Id (must be a number)" });
  }

  try {
    const { error } = await supabase.from("HLA_B").delete().eq("HLA_B_Id", idNum);
    if (error) return res.status(500).json({ error: error.message });

    return res.json({ ok: true, message: `HLA_B ${idNum} deleted` });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}

// บอกให้เชี่ยนิวแก้ supabase
export async function saveToResult(req: Request, res: Response) {
  const geneid    = Number(req.body?.geneid);
  const patientId = Number(req.body?.Patient_Id);
  const staffId   = Number(req.body?.staff_id);
  const statusRaw = String(req.body?.status || "").trim(); // "Positive" | "Negative"
  const hlaGene   = String(req.body?.HLA_Gene || req.body?.hla_gene || "").trim(); // ← รับจาก body

  if (!Number.isFinite(geneid))    return res.status(400).json({ error: "Invalid geneid (must be a number)" });
  if (!Number.isFinite(patientId)) return res.status(400).json({ error: "Invalid Patient_Id (must be a number)" });
  if (!Number.isFinite(staffId))   return res.status(400).json({ error: "Invalid staff_id (must be a number)" });
  if (!statusRaw)                  return res.status(400).json({ error: "status is required (Positive/Negative)" });
  if (!hlaGene)                    return res.status(400).json({ error: "HLA_Gene is required" });

  // ปรับให้ตรงกับค่าที่เก็บใน DB (ขึ้นอยู่กับคุณว่าเก็บ P/N ยังไง)
  const status = statusRaw === "positive" ? "Positive"
               : statusRaw === "negative" ? "Negative"
               : statusRaw;

  try {
    // 1) หาชื่อตารางจาก Gene
    const { data: geneRows, error: geneError } = await supabase
      .from("Gene")
      .select("gene_name")
      .eq("gene_id", geneid)
      .limit(1);

    if (geneError)      return res.status(500).json({ error: geneError.message });
    if (!geneRows?.[0]) return res.status(400).json({ error: "Gene not found" });

    const geneName = geneRows[0].gene_name as string; // คาดว่า "HLA_B"
    const pkField  = PK_FIELD_BY_TABLE[geneName];     // HLA_B => "HLA_B_Id"
    if (!pkField) return res.status(400).json({ error: `Unsupported gene table: ${geneName}` });

    // 2) หาข้อมูล HLA_B ตาม HLA_Gene + status
    const { data: geneRow, error: tableErr } = await supabase
      .from(geneName)
      .select("*")
      .eq("HLA_Gene", hlaGene)
      .eq("status", status)
      .maybeSingle();         // ← ใช้ maybeSingle ป้องกัน error “Cannot coerce...”
      console.log(hlaGene, status);
      console.log(geneRow);
    if (tableErr)  return res.status(500).json({ error: tableErr.message });
    if (!geneRow)  return res.status(404).json({ error: "No HLA_B record found for provided HLA_Gene & status" });

    console.log(geneRow);
  const gene_information = Number((geneRow as Record<string, unknown>)[pkField] as unknown);
    if (!Number.isFinite(gene_information)) {
      return res.status(500).json({ error: `Primary key field "${pkField}" not found in ${geneName} row` });
    }
console.log(gene_information);
    // 3) เตรียม payload ใส่ Result
    const createResult = {
      Requested_date: new Date().toISOString(),
      Patient_Id: patientId,
      status: "pending",
      Reported_date: null,
      gene_id: geneid,
      gene_information,
      staff_id: staffId,
    };
    const { body: payload } = newResultSchema.parse({ body: createResult }) as { body: NewResult };

    // 4) INSERT Result
    const { data: resultRow, error: insertErr } = await supabase
      .from("Result")
      .insert(payload)
      .select("*")
      .single();

    if (insertErr) return res.status(500).json({ error: insertErr.message });

    // 5) ดึง Result + Staff
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

    // 6) รวมข้อมูลตีความจาก HLA_B (สคีมาใหม่ใช้ phenotype/recommend)
    const response = {
      ...enriched,
      gene_meta: {
        gene_name: geneName,
        hla_gene: hlaGene,
        status,
  phenotype: (geneRow as Record<string, unknown>)["phenotype"] as string | null ?? null,
  recommend: (geneRow as Record<string, unknown>)["recommend"] as string | null ?? null,
      },
    };
    return res.status(201).json(response);
  } catch (e: unknown) {
    console.error("[saveToResult ERROR]", e);
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}
