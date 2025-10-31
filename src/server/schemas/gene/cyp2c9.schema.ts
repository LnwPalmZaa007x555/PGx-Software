import { z } from "zod";

const id = z.coerce.number().int().positive();

export const newCYP2C9BodySchema = z.object({
  CYP2C9x2_430C: z.string().min(1, "CYP2C9x2_430C is required"),
  CYP2C9x3_1075A: z.string().min(1, "CYP2C9x3_1075A is required"),
  Predict_Geno: z.string().nullable().optional(),
  Predict_Pheno: z.string().nullable().optional(),
  Recommend: z.string().nullable().optional(),
  gene_id: id,
});

export const newCYP2C9Schema = z.object({ body: newCYP2C9BodySchema });
export const updateCYP2C9Schema = z.object({ body: newCYP2C9BodySchema.partial() });

export const cyp2c9IdParamSchema = z.object({
  params: z.object({ id }),
});

export const cyp2c9ListQuerySchema = z.object({
  query: z.object({
    gene_id: id.optional(),
    limit: z.coerce.number().int().max(100).default(20).optional(),
    offset: z.coerce.number().int().min(0).default(0).optional(),
  }),
});
