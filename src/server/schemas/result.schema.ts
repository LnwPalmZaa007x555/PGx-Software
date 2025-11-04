// src/server/schemas/result.schema.ts
import { z } from "zod";

// helper
const id = z.coerce.number().int().positive();

// สถานะ แนะนำค่าเหล่านี้ (ถ้าใช้อิสระเป็น string ก็เปลี่ยนเป็น z.string().min(1) ได้)
const statusEnum = z.enum(["pending", "processing", "completed", "reviewed", "rejected"]);

export const newResultSchema = z.object({
  body: z.object({
    Requested_date: z.string().optional(),        // ส่งเป็น ISO string; ไม่ส่งมาให้ DB ใส่ default ได้
    Patient_Id: id,
    status: statusEnum.default("pending"),
    Reported_date: z.string().nullable().optional(),
    gene_id: id,
    gene_information: id.nullable().optional(),
    staff_id: id,
  })
});

export const updateResultSchema = z.object({
  body: z.object({
    Requested_date: z.string().optional(),
    Patient_Id: id.optional(),
    status: statusEnum.optional(),
    Reported_date: z.string().nullable().optional(),
    gene_id: id.optional(),
    gene_information: id.nullable().optional(),
    staff_id: id.optional(),
  })
});

// /api/results/:id
export const resultIdParamSchema = z.object({
  params: z.object({
    id: id,
  })
});

// /api/results?limit=..&offset=..&status=..&patient=..
export const resultListQuerySchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().positive().max(100).default(20).optional(),
    offset: z.coerce.number().int().min(0).default(0).optional(),
    status: statusEnum.optional(),
    patient: id.optional(),
  })
});
