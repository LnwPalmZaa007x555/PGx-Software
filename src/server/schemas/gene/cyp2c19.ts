import { z } from "zod";

const id = z.coerce.number().int().positive();

export const newCYP2C19BodySchema = z.object({
  CYPx2_681G: z.string().min(1, "CYPx2_681G is required"),
  CYPx3_636G: z.string().min(1, "CYPx3_636G is required"),
  CYPx17_806C: z.string().min(1, "CYPx17_806C is required"),
  Genotype: z.string().nullable().optional(),
  Predict_Pheno: z.string().nullable().optional(),
  Recommend: z.string().nullable().optional(),
  gene_id: id, // FK -> Gene
});

export const newCYP2C19Schema = z.object({ body: newCYP2C19BodySchema });

export const updateCYP2C19Schema = z.object({
  body: newCYP2C19BodySchema.partial(),
});

export const cyp2c19IdParamSchema = z.object({
  params: z.object({ id }),
});

export const cyp2c19ListQuerySchema = z.object({
  query: z.object({
    gene_id: id.optional(),
    limit: z.coerce.number().int().max(100).default(20).optional(),
    offset: z.coerce.number().int().min(0).default(0).optional(),
  }),
});
