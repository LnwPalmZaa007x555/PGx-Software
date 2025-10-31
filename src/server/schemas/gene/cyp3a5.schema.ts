import { z } from "zod";

// ✅ แปลง string → number อัตโนมัติ
const id = z.coerce.number().int().positive();

// 🔹 Schema สำหรับสร้างข้อมูลใหม่ (POST)
export const newCYP3A5BodySchema = z.object({
  CYP3A5x3_6986A: z.string().min(1, "CYP3A5x3_6986A is required"),
  Predict_Geno: z.string().nullable().optional(),
  Likely_Pheno: z.string().nullable().optional(),
  Recommend: z.string().nullable().optional(),
  gene_id: id, // FK ไปตาราง Gene
});

// 🔹 ใช้กับ middleware validate()
export const newCYP3A5Schema = z.object({
  body: newCYP3A5BodySchema,
});

// 🔹 สำหรับ update (PATCH / PUT)
export const updateCYP3A5Schema = z.object({
  body: newCYP3A5BodySchema.partial(),
});

// 🔹 สำหรับ validate params (:id)
export const cyp3a5IdParamSchema = z.object({
  params: z.object({
    id,
  }),
});

// 🔹 สำหรับ query list
export const cyp3a5ListQuerySchema = z.object({
  query: z.object({
    gene_id: id.optional(),
    limit: z.coerce.number().int().max(100).default(20).optional(),
    offset: z.coerce.number().int().min(0).default(0).optional(),
  }),
});
