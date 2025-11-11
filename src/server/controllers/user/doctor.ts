import { Request, Response } from "express";
import { supabase } from "../../supabaseClient";
import { newDoctorSchema, updateDoctorSchema } from "../../schemas/user/doctor.schema";
import type { Doctor, NewDoctor, UpdateDoctor, DoctorWithStaff } from "../../types/user/doctor";
import { ZodError } from "zod";

// 👇 แก้ให้ตรงชื่อ FK จริง ถ้าไม่ใช่ชื่อนี้
const FK_NAME = "doctor_staff_fk";

// util: normalize กรณี PostgREST ส่ง Staff เป็น array
function pickSingleStaff(row: unknown) {
  if (!row || typeof row !== "object") return row;
  const r = row as { Staff?: unknown } & Record<string, unknown>;
  const staff = Array.isArray(r.Staff) ? ((r.Staff as unknown[])[0] ?? null) : (r.Staff ?? null);
  return { ...r, Staff: staff };
}

/**
 * GET /api/doctor
 * รายการ Doctor (ไม่ join Staff)
 */
export async function getDoctors(_req: Request, res: Response) {
  try {
    const { data, error } = await supabase
      .from("Doctor")
      .select("*")
      .order("Doctor_id", { ascending: true })
      .returns<Doctor[]>();

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}

/**
 * GET /api/doctor/with-staff
 * รายการ Doctor พร้อมข้อมูล Staff (Fname, Lname, email, Role)
 */
export async function getDoctorsWithStaff(_req: Request, res: Response) {
  try {
    const { data, error } = await supabase
      .from("Doctor")
      .select(`
        Doctor_id,
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
    return res.json(normalized as DoctorWithStaff[]);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}

/**
 * GET /api/doctor/:id
 * Doctor แถวเดียว พร้อมข้อมูล Staff
 */
export async function getDoctorById(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "Invalid Doctor_id (must be a number)" });
  }

  try {
    const { data, error } = await supabase
      .from("Doctor")
      .select(`
        Doctor_id,
        Staff_Id,
        Staff:${FK_NAME} (
          Staff_Id,
          Fname,
          Lname,
          email,
          Role
        )
      `)
      .eq("Doctor_id", id)
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    if (!data)  return res.status(404).json({ error: "Doctor not found" });

    return res.json(pickSingleStaff(data) as DoctorWithStaff);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}

/**
 * POST /api/doctor
 * เพิ่มแถวใหม่ (โดยปกติไม่จำเป็นถ้ามี trigger จาก Staff อยู่แล้ว—แต่เปิดไว้ตามที่ขอ)
 */
export async function createDoctor(req: Request, res: Response) {
  try {
    const payload = newDoctorSchema.parse(req.body) as NewDoctor;

    const { data, error } = await supabase
      .from("Doctor")
      .insert(payload)
      .select("*")
      .single()
      .returns<Doctor>();

    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json(data);
  } catch (e: unknown) {
    if (e instanceof ZodError) return res.status(400).json({ error: e.flatten() });
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}

/**
 * PUT /api/doctor/:id
 * แก้ไขแถว (ส่วนใหญ่จะไม่ค่อยได้ใช้ หากใช้ trigger จาก Staff)
 */
export async function updateDoctorById(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "Invalid Doctor_id (must be a number)" });
  }

  try {
    const patch = updateDoctorSchema.parse(req.body) as UpdateDoctor;

    const { data, error } = await supabase
      .from("Doctor")
      .update(patch)
      .eq("Doctor_id", id)
      .select("*")
      .single()
      .returns<Doctor>();

    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch (e: unknown) {
    if (e instanceof ZodError) return res.status(400).json({ error: e.flatten() });
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}

/**
 * DELETE /api/doctor/:id
 * ลบแถว (ถ้าลบ Staff พร้อม cascade อยู่แล้วอาจไม่ต้องเรียก endpoint นี้)
 */
export async function deleteDoctorById(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "Invalid Doctor_id (must be a number)" });
  }

  try {
    const { error } = await supabase
      .from("Doctor")
      .delete()
      .eq("Doctor_id", id);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true, message: `Doctor ${id} deleted` });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}
