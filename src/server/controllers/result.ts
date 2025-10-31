import { Request, Response, NextFunction } from "express";
import { supabase } from "../supabaseClient";
import type { Result, NewResult, UpdateResult } from "../types/result";

// GET /api/results?limit=20&offset=0&status=completed&patient=123
export async function listResults(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = Number(req.query.limit ?? 20);
    const offset = Number(req.query.offset ?? 0);
    const status = req.query.status as Result["status"] | undefined;
    const patient = req.query.patient ? Number(req.query.patient) : undefined;

    let q = supabase.from("Result").select("*", { count: "exact" }).order("Result_Id", { ascending: false });

    if (status) q = q.eq("status", status);
    if (patient) q = q.eq("Patient_Id", patient);

    const { data, error, count } = await q.range(offset, offset + limit - 1).returns<Result[]>();
    if (error) return res.status(500).json({ error: error.message });

    return res.json({ items: data, count, limit, offset });
  } catch (e) { next(e); }
}

// GET /api/results/:id
export async function getResultById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const { data, error } = await supabase
      .from("Result")
      .select("*")
      .eq("Result_Id", id)
      .single()
      .returns<Result>();
    if (error) return res.status(404).json({ error: error.message });
    return res.json(data);
  } catch (e) { next(e); }
}

// POST /api/results
export async function createResult(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = req.body as NewResult;

    const { data, error } = await supabase
      .from("Result")
      .insert(payload)
      .select("*")
      .single()
      .returns<Result>();
    if (error) return res.status(500).json({ error: error.message });

    return res.status(201).json(data);
  } catch (e) { next(e); }
}

// PUT /api/results/:id
export async function updateResult(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const payload = req.body as UpdateResult;

    const { data, error } = await supabase
      .from("Result")
      .update(payload)
      .eq("Result_Id", id)
      .select("*")
      .single()
      .returns<Result>();
    if (error) return res.status(500).json({ error: error.message });

    return res.json(data);
  } catch (e) { next(e); }
}

// DELETE /api/results/:id
export async function deleteResult(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const { error } = await supabase.from("Result").delete().eq("Result_Id", id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).send();
  } catch (e) { next(e); }
}
