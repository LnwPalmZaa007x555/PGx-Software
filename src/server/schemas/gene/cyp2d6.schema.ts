import { z } from "zod";

// ✅ ใช้ coercion เพื่อแปลง string → number อัตโนมัติ
const id = z.coerce.number().int().positive();

// 🔹 Body schema (ใช้กับ create)
export const newCYP2D6BodySchema = z.object({
  CYP2D6x4_1847G: z.string().min(1, "CYP2D6x4_1847G is required"),
  CYP2D6x10_100C: z.string().min(1, "CYP2D6x10_100C is required"),
  CYP2D6x41_2989G: z.string().min(1, "CYP2D6x41_2989G is required"),
  CNV_Intron: z.string().nullable().optional(),
  CNV_Exon: z.string().nullable().optional(),
  Result: z.string().nullable().optional(),
  Phenotype: z.string().nullable().optional(),
  Predict_Pheno: z.string().nullable().optional(),
  Recommend: z.string().nullable().optional(),
  gene_id: id, // FK ไปตาราง Gene
});

// 🔹 ใช้กับ middleware validate()
export const newCYP2D6Schema = z.object({ body: newCYP2D6BodySchema });

// 🔹 สำหรับ update (optional ทุกฟิลด์)
export const updateCYP2D6Schema = z.object({body: newCYP2D6BodySchema.partial(),});

// 🔹 สำหรับ validate params (เช่น :id)
export const cyp2d6IdParamSchema = z.object({
  params: z.object({id,}),
});

// 🔹 สำหรับ query list (กรองตาม gene_id, limit, offset)
export const cyp2d6ListQuerySchema = z.object({
  query: z.object({
    gene_id: id.optional(),
    limit: z.coerce.number().int().max(100).default(20).optional(),
    offset: z.coerce.number().int().min(0).default(0).optional(),
  }),
});
