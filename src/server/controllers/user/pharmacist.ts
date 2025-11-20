import { Request, Response } from "express";
import { supabase } from "../../supabaseClient";
import { NewPharmacist, Pharmacist, PharmacistWithStaff, UpdatePharmacist } from "../../types/user/pharmacist";
import { newPharmacistSchema, updatePharmacistSchema } from "../../schemas/user/pharmacist.schema";
import { ZodError } from "zod";

// 👇 แก้ให้ตรงชื่อ FK จริงถ้าไม่ใช่ชื่อนี้
const FK_NAME = "pharmacist_staff_fk";

// normalize: ถ้า Staff เป็น array ให้หยิบตัวแรก
function pickSingleStaff(row: unknown) {
  if (!row || typeof row !== "object") return row;
  const r = row as { Staff?: unknown } & Record<string, unknown>;
  const staff = Array.isArray(r?.Staff) ? ((r.Staff as unknown[])[0] ?? null) : (r?.Staff ?? null);
  return { ...r, Staff: staff };
}

/** GET /api/pharmacist */
export async function getPharmacists(_req: Request, res: Response) {
  try {
    const { data, error } = await supabase
      .from("Pharmacist")
      .select("*")
      .order("Phar_id", { ascending: true })
      .returns<Pharmacist[]>();

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}

/** GET /api/pharmacist/with-staff */
export async function getPharmacistsWithStaff(_req: Request, res: Response) {
  try {
    const { data, error } = await supabase
      .from("Pharmacist")
      .select(`
        Phar_id,
        Staff_Id,
        Staff:${FK_NAME} (
          Staff_Id,
          Fname,
          Lname,
          email,
          Role
        )
      `);

    if (error) return res.status(500).json({ error: error.message });

    const normalized = (data ?? []).map(pickSingleStaff);
    return res.json(normalized as PharmacistWithStaff[]);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}

/** GET /api/pharmacist/:id */
export async function getPharmacistById(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "Invalid Phar_id (must be a number)" });
  }

  try {
    const { data, error } = await supabase
      .from("Pharmacist")
      .select(`
        Phar_id,
        Staff_Id,
        Staff:${FK_NAME} (
          Staff_Id,
          Fname,
          Lname,
          email,
          Role
        )
      `)
      .eq("Phar_id", id)
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    if (!data)  return res.status(404).json({ error: "Pharmacist not found" });

    return res.json(pickSingleStaff(data) as PharmacistWithStaff);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}

/** POST /api/pharmacist */
export async function createPharmacist(req: Request, res: Response) {
  try {
    const payload = newPharmacistSchema.parse(req.body) as NewPharmacist;

    const { data, error } = await supabase
      .from("Pharmacist")
      .insert(payload)
      .select("*")
      .single()
      .returns<Pharmacist>();

    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json(data);
  } catch (e: unknown) {
    if (e instanceof ZodError) return res.status(400).json({ error: e.flatten() });
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}

/** PUT /api/pharmacist/:id */
export async function updatePharmacistById(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "Invalid Phar_id (must be a number)" });
  }

  try {
    const patch = updatePharmacistSchema.parse(req.body) as UpdatePharmacist;

    const { data, error } = await supabase
      .from("Pharmacist")
      .update(patch)
      .eq("Phar_id", id)
      .select("*")
      .single()
      .returns<Pharmacist>();

    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch (e: unknown) {
    if (e instanceof ZodError) return res.status(400).json({ error: e.flatten() });
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}

/** DELETE /api/pharmacist/:id */
export async function deletePharmacistById(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "Invalid Phar_id (must be a number)" });
  }

  try {
    const { error } = await supabase
      .from("Pharmacist")
      .delete()
      .eq("Phar_id", id);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true, message: `Pharmacist ${id} deleted` });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}
