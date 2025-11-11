import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { supabase } from "../../supabaseClient";
import { newStaffSchema, updateStaffSchema, resetPasswordByEmailSchema } from "../../schemas/user/staff.schema";
import type { StaffPublic } from "../../types/user/staff";
import { ZodError } from "zod";

// ไม่คืน password
const PUBLIC_COLUMNS =
  "Staff_Id, Fname, Lname, Role, email, Hospital_Name"; // 👈 เพิ่ม Hospital_Name

// GET /api/staff
export async function getStaff(_req: Request, res: Response) {
  try {
    const { data, error } = await supabase
      .from("Staff")
      .select(PUBLIC_COLUMNS)
      .order("Staff_Id", { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data as StaffPublic[]);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}

// GET /api/staff/:id
export async function getStaffById(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid Staff_Id" });

  try {
    const { data, error } = await supabase
      .from("Staff")
      .select(PUBLIC_COLUMNS)
      .eq("Staff_Id", id)
      .single();

    if (error) return res.status(404).json({ error: error.message });
    return res.json(data as StaffPublic);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}

// POST /api/staff
export async function createStaff(req: Request, res: Response) {
  try {
    const payload = newStaffSchema.parse(req.body);

    // กัน email ซ้ำ
    const { data: existed, error: qErr } = await supabase
      .from("Staff")
      .select("Staff_Id")
      .eq("email", payload.email)
      .maybeSingle();
    if (qErr) return res.status(500).json({ error: qErr.message });
    if (existed) return res.status(400).json({ error: "Email already in use" });

    const hashed = await bcrypt.hash(payload.password, 10);

    const { data, error } = await supabase
      .from("Staff")
      .insert({ ...payload, password: hashed })
      .select(PUBLIC_COLUMNS)
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json(data as StaffPublic);
  } catch (e: unknown) {
    if (e instanceof ZodError) return res.status(400).json({ error: e.flatten() });
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}

// PUT /api/staff/:id
export async function updateStaffById(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid Staff_Id" });

  try {
  const patch = updateStaffSchema.parse(req.body);
  const toUpdate: Record<string, unknown> = { ...patch };

    if (patch.password) {
      toUpdate.password = await bcrypt.hash(patch.password, 10);
    }

    const { data, error } = await supabase
      .from("Staff")
      .update(toUpdate)
      .eq("Staff_Id", id)
      .select(PUBLIC_COLUMNS)
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.json(data as StaffPublic);
  } catch (e: unknown) {
    if (e instanceof ZodError) return res.status(400).json({ error: e.flatten() });
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}

// DELETE /api/staff/:id
export async function deleteStaffById(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid Staff_Id" });

  try {
    const { error } = await supabase.from("Staff").delete().eq("Staff_Id", id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true, message: `Staff ${id} deleted` });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}

// GET /api/staff/exists?email=...
export async function getStaffExists(req: Request, res: Response) {
  const email = String(req.query.email ?? "").toLowerCase().trim();
  if (!email) return res.status(400).json({ error: "email is required" });
  try {
    const { data, error } = await supabase
      .from("Staff")
      .select("Staff_Id")
      .eq("email", email)
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ exists: !!data, staffId: data?.Staff_Id ?? null });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}

// POST /api/staff/reset-password
export async function resetStaffPasswordByEmail(req: Request, res: Response) {
  try {
    const { email, password } = resetPasswordByEmailSchema.parse(req.body);
    // find staff by email
    const { data: staff, error: qErr } = await supabase
      .from("Staff")
      .select("Staff_Id")
      .eq("email", email)
      .maybeSingle();
    if (qErr) return res.status(500).json({ error: qErr.message });
    if (!staff) return res.status(404).json({ error: "Email not found" });

    const hashed = await bcrypt.hash(password, 10);
    const { error: uErr } = await supabase
      .from("Staff")
      .update({ password: hashed })
      .eq("Staff_Id", staff.Staff_Id);
    if (uErr) return res.status(400).json({ error: uErr.message });

    return res.json({ ok: true, message: `Password reset for ${email}` });
  } catch (e: unknown) {
    if (e instanceof ZodError) return res.status(400).json({ error: e.flatten() });
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}
