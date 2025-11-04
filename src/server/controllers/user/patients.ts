import { Request, Response } from "express";
import { supabase } from "../../supabaseClient";
import { Patient, NewPatient, UpdatePatient } from "../../types/user/patients";
import { newPatientSchema, updatePatientSchema } from "../../schemas/user/patients.schema";
import { toBangkokString, nowBangkokISO } from "../../util/constant";


// GET /api/patients
export async function getPatients(_req: Request, res: Response) {
  try {
    const { data, error } = await supabase
      .from("Patients")
      .select("*")
      .limit(50)
      .returns<Patient[]>(); // 👈 type-safe

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } catch (e: any) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}

// POST /api/patients
export async function createPatient(req: Request, res: Response) {
  try {
    // ✅ ตรวจสอบข้อมูลก่อน insert
    const payload = newPatientSchema.parse(req.body) as NewPatient;

    // ✅ เพิ่มเวลาไทยลงในฟิลด์ create_at (เก็บเป็น timestamptz)
    const toInsert: NewPatient = {
      ...payload,
      create_at: nowBangkokISO(),
    };

    // ✅ insert เข้า Supabase
    const { data, error } = await supabase
      .from("Patients")
      .insert(toInsert)
      .select("*")
      .single();

    if (error || !data) {
      return res.status(400).json({ error: error?.message || "Insert failed" });
    }

    // ✅ ส่งข้อมูลกลับตรง ๆ โดยไม่แปลงเวลา
    return res.status(201).json(data);
  } catch (e: any) {
    if (e?.name === "ZodError") {
      return res.status(400).json({ error: e.flatten() });
    }
    return res.status(500).json({ error: String(e?.message || e) });
  }
}

// GET /api/patients/:id
export async function getPatientById(req: Request, res: Response) {
  const idNum = Number(req.params.id);
  if (!Number.isFinite(idNum)) {
    return res.status(400).json({ error: "Invalid Patient_Id (must be a number)" });
  }

  try {
    const { data, error } = await supabase
      .from("Patients")
      .select("*")
      .eq("Patient_Id", idNum)
      .single()
      .returns<Patient>();

    if (error) return res.status(404).json({ error: error.message });
    return res.json(data);
  } catch (e: any) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}

// DELETE /api/patients/:id
export async function deletePatientById(req: Request, res: Response) {
  const idNum = Number(req.params.id);
  if (!Number.isFinite(idNum)) {
    return res.status(400).json({ error: "Invalid Patient_Id (must be a number)" });
  }

  try {
    const { error } = await supabase
      .from("Patients")
      .delete()
      .eq("Patient_Id", idNum);

    if (error) {
      console.error("[SUPABASE ERROR] DELETE /api/patients/:id:", error);
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ ok: true, message: `Patient ${idNum} deleted` });
  } catch (e: any) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}

// PUT /api/patients/:id
export async function updatePatientById(req: Request, res: Response) {
  const idNum = Number(req.params.id);
  if (!Number.isFinite(idNum)) {
    return res.status(400).json({ error: "Invalid Patient_Id (must be a number)" });
  }

  try {
    // ✅ validate fields ที่ส่งมาแก้
    const patch = updatePatientSchema.parse(req.body) as UpdatePatient;

    const { data, error } = await supabase
      .from("Patients")
      .update(patch)
      .eq("Patient_Id", idNum)
      .select("*")
      .single()
      .returns<Patient>();

    if (error) {
      console.error("[SUPABASE ERROR] PUT /api/patients/:id:", error);
      return res.status(400).json({ error: error.message });
    }
    return res.status(200).json(data);
  } catch (e: any) {
    if (e?.name === "ZodError") {
      return res.status(400).json({ error: e.flatten() });
    }
    return res.status(500).json({ error: String(e?.message || e) });
  }
}


export async function getDashboard(req: Request, res: Response) {
  try {
    // ---- Bangkok time helpers ----
    const offsetMs = 7 * 60 * 60 * 1000; // +07:00
    const now = new Date();
    const bkkNow = new Date(now.getTime() + offsetMs);
    const yyyy = bkkNow.getUTCFullYear();
    const mm = String(bkkNow.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(bkkNow.getUTCDate()).padStart(2, "0");

    const mondayDelta = ((bkkNow.getUTCDay() + 6) % 7); // 0=Mon,6=Sun delta from Monday
    const weekStartBkk = new Date(Date.UTC(bkkNow.getUTCFullYear(), bkkNow.getUTCMonth(), bkkNow.getUTCDate() - mondayDelta, 0, 0, 0));
    const monthStartBkk = new Date(Date.UTC(bkkNow.getUTCFullYear(), bkkNow.getUTCMonth(), 1, 0, 0, 0));
    const todayStartBkk = new Date(Date.UTC(bkkNow.getUTCFullYear(), bkkNow.getUTCMonth(), bkkNow.getUTCDate(), 0, 0, 0));

    function withTz(d: Date) {
      // format as YYYY-MM-DDTHH:mm:ss+07:00 for Postgres timestamptz compare
      const iso = d.toISOString().slice(0, 19);
      return `${iso}+07:00`;
    }

    const todayStart = withTz(todayStartBkk);
    const weekStart = withTz(weekStartBkk);
    const monthStart = withTz(monthStartBkk);

    // 1) รวมจำนวนเคสทั้งหมด
    const totalQ = supabase
      .from("Patients")
      .select("Patient_Id", { count: "exact", head: true });

    // 2) นับตามสถานะสำหรับ TAT Tracking
    const preQ = supabase
      .from("Patients")
      .select("Patient_Id", { count: "exact", head: true })
      .eq("status", "Pending");

    const analyticQ = supabase
      .from("Patients")
      .select("Patient_Id", { count: "exact", head: true })
      .eq("status", "Pending approval");

    const postQ = supabase
      .from("Patients")
      .select("Patient_Id", { count: "exact", head: true })
      .eq("status", "Post-analytic");

    // Executive summary cards
    const todayQ = supabase
      .from("Patients")
      .select("Patient_Id", { count: "exact", head: true })
      .gte("create_at", todayStart);

    const weekQ = supabase
      .from("Patients")
      .select("Patient_Id", { count: "exact", head: true })
      .gte("create_at", weekStart);

    const monthQ = supabase
      .from("Patients")
      .select("Patient_Id", { count: "exact", head: true })
      .gte("create_at", monthStart);

    // 3) KPI: อัตรา Reject — นับจากสถานะของตาราง Result (ไม่ใช่ Patients)
    const resultsTotalQ = supabase
      .from("Result")
      .select("Result_Id", { count: "exact", head: true });

    const rejectQ = supabase
      .from("Result")
      .select("Result_Id", { count: "exact", head: true })
      .eq("status", "rejected");

    // 4) KPI: Average TAT (ชั่วโมง) = avg(approve_at - create_at)
    const tatQ = supabase
      .from("Patients")
      .select("create_at, approve_at")
      .not("approve_at", "is", null)
      .not("create_at", "is", null);

    // Weekly breakdown for current month (4 buckets of 7 days)
    const w1Start = monthStartBkk;
    const w2Start = new Date(w1Start.getTime() + 7 * 24 * 3600 * 1000);
    const w3Start = new Date(w2Start.getTime() + 7 * 24 * 3600 * 1000);
    const w4Start = new Date(w3Start.getTime() + 7 * 24 * 3600 * 1000);
    const w5Start = new Date(w4Start.getTime() + 7 * 24 * 3600 * 1000);

    const w1Q = supabase.from("Patients").select("Patient_Id", { count: "exact", head: true })
      .gte("create_at", withTz(w1Start)).lt("create_at", withTz(w2Start));
    const w2Q = supabase.from("Patients").select("Patient_Id", { count: "exact", head: true })
      .gte("create_at", withTz(w2Start)).lt("create_at", withTz(w3Start));
    const w3Q = supabase.from("Patients").select("Patient_Id", { count: "exact", head: true })
      .gte("create_at", withTz(w3Start)).lt("create_at", withTz(w4Start));
    const w4Q = supabase.from("Patients").select("Patient_Id", { count: "exact", head: true })
      .gte("create_at", withTz(w4Start)).lt("create_at", withTz(w5Start));

    const [totalRes, preRes, analyticRes, postRes, resultsTotalRes, rejectRes, tatRes, todayRes, weekRes, monthRes, w1Res, w2Res, w3Res, w4Res] = await Promise.all([
      totalQ, preQ, analyticQ, postQ, resultsTotalQ, rejectQ, tatQ, todayQ, weekQ, monthQ, w1Q, w2Q, w3Q, w4Q,
    ]);

    // จัดการ error
    const errs = [totalRes.error, preRes.error, analyticRes.error, postRes.error, resultsTotalRes.error, rejectRes.error, tatRes.error, todayRes.error, weekRes.error, monthRes.error, w1Res.error, w2Res.error, w3Res.error, w4Res.error].filter(Boolean);
    if (errs.length) {
      return res.status(500).json({ error: errs[0]!.message });
    }

    const total = totalRes.count ?? 0;
    const pre = preRes.count ?? 0;
    const analytic = analyticRes.count ?? 0;
    const post = postRes.count ?? 0;
    const resultsTotal = resultsTotalRes.count ?? 0;
    const rejected = rejectRes.count ?? 0;
  const casesToday = todayRes.count ?? 0;
  const casesThisWeek = weekRes.count ?? 0;
  const casesThisMonth = monthRes.count ?? 0;
  const weeklyCases = [w1Res.count ?? 0, w2Res.count ?? 0, w3Res.count ?? 0, w4Res.count ?? 0];

    const rows = (tatRes.data || []) as Array<{ create_at: string; approve_at: string }>;
    let avgTatHours = 0;
    if (rows.length) {
      const sumHours = rows.reduce((acc, r) => {
        const start = new Date(r.create_at).getTime();
        const end = new Date(r.approve_at).getTime();
        if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
          acc += (end - start) / 3_600_000; // ms -> hours
        }
        return acc;
      }, 0);
      avgTatHours = Math.round(sumHours / rows.length);
    }

  // อัตรา Reject จากตาราง Result
  const rejectionRate = resultsTotal > 0 ? Number(((rejected / resultsTotal) * 100).toFixed(1)) : 0;

    return res.json({
      casesCount: total,
      execSummary: {
        today: casesToday,
        thisWeek: casesThisWeek,
        thisMonth: casesThisMonth,
        totalTests: resultsTotal,
      },
      tatTracking: {
        preAnalytic: pre,
        analytic,
        postAnalytic: post,
      },
      kpiQuality: {
        rejectionRate, // percent
        averageTatHours: avgTatHours,
      },
      weeklyCases,
    });
  } catch (e: any) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}