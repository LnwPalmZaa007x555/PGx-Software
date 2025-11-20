// src/controllers/auth.ts
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { supabase } from "../supabaseClient";
import { registerSchema, loginSchema } from "../schemas/auth.schema";
import { ZodError } from "zod";

const PUBLIC_COLUMNS = "Staff_Id, Fname, Lname, Role, email, Hospital_Name";

// อ่าน env + กันกรณีไม่มีค่า
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";
if (!JWT_SECRET) {
  throw new Error("Missing JWT_SECRET in .env");
}
// expiresIn accepts number of seconds or a string like "1d"
const expiresInValue: SignOptions["expiresIn"] = Number.isFinite(Number(JWT_EXPIRES_IN))
  ? Number(JWT_EXPIRES_IN)
  : (JWT_EXPIRES_IN as unknown as SignOptions["expiresIn"]);
const SIGN_OPTS: SignOptions = { expiresIn: expiresInValue };


// POST /api/auth/register
export async function register(req: Request, res: Response) {
  try {
    const payload = registerSchema.parse(req.body);

    // กัน email ซ้ำ
    const { data: existed, error: qErr } = await supabase
      .from("Staff")
      .select("Staff_Id, Role, email")
      .eq("email", payload.email)
      .maybeSingle();
    if (qErr) return res.status(500).json({ error: qErr.message });
    if (existed) return res.status(400).json({ error: "Email already in use" });

    // hash password
    const hashed = await bcrypt.hash(payload.password, 10);

    // insert staff (ไม่คืน password)
    const { data, error } = await supabase
      .from("Staff")
      .insert({ ...payload, password: hashed })
      .select(PUBLIC_COLUMNS)
      .single();

    if (error) return res.status(400).json({ error: error.message });

    // ออก token
    const token = jwt.sign(
      { sid: data!.Staff_Id, role: String(data!.Role).toLowerCase(), email: data!.email },
      JWT_SECRET as string,
      SIGN_OPTS
    );

    return res.status(201).json({ token, user: data });
  } catch (e: unknown) {
    if (e instanceof ZodError) return res.status(400).json({ error: e.flatten() });
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}

// POST /api/auth/login
export async function login(req: Request, res: Response) {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const { data: user, error } = await supabase
      .from("Staff")
      .select("Staff_Id, Fname, Lname, Role, email, password, Hospital_Name")
      .eq("email", email)
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const publicUser = {
      Staff_Id: user.Staff_Id,
      Fname: user.Fname,
      Lname: user.Lname,
      Role: user.Role,
      email: user.email,
      Hospital_Name: user.Hospital_Name,
    };

    const token = jwt.sign(
      { sid: user.Staff_Id, role: String(user.Role).toLowerCase(), email: user.email },
      JWT_SECRET as string,
      SIGN_OPTS
    );

    return res.json({ token, user: publicUser });
  } catch (e: unknown) {
    if (e instanceof ZodError) return res.status(400).json({ error: e.flatten() });
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}

// GET /api/auth/me  (ต้องแนบ Bearer token) — ต้องมี middleware auth ใส่ req.user ให้ก่อน
type AuthenticatedRequest = Request & { user?: { sid?: number; role?: string; email?: string } };
export async function me(req: AuthenticatedRequest, res: Response) {
  try {
    const sid = req.user?.sid;
    if (!sid) return res.status(401).json({ error: "Unauthenticated" });

    const { data, error } = await supabase
      .from("Staff")
      .select(PUBLIC_COLUMNS)
      .eq("Staff_Id", sid)
      .single();

    if (error) return res.status(404).json({ error: error.message });
    return res.json({ user: data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}
