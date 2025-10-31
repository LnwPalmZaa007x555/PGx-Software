import { z } from "zod";

const id = z.coerce.number().int().positive();

// สำหรับสร้าง (POST)
export const newVKORC1BodySchema = z.object({
  VKORC1_1173C: z.string().min(1, "VKORC1_1173C is required"),
  VKORC1_1639G: z.string().min(1, "VKORC1_1639G is required"),
  Haplotype: z.string().nullable().optional(),
  Predict_Pheno: z.string().nullable().optional(),
  Recommend: z.string().nullable().optional(),
  gene_id: id, // FK
});

// ใช้กับ middleware validate()
export const newVKORC1Schema = z.object({ body: newVKORC1BodySchema });

// สำหรับอัปเดต (PUT/PATCH)
export const updateVKORC1Schema = z.object({
  body: newVKORC1BodySchema.partial(),
});

// :id params
export const vkorc1IdParamSchema = z.object({
  params: z.object({ id }),
});

// list query (optional)
export const vkorc1ListQuerySchema = z.object({
  query: z.object({
    gene_id: id.optional(),
    limit: z.coerce.number().int().max(100).default(20).optional(),
    offset: z.coerce.number().int().min(0).default(0).optional(),
  }),
});
