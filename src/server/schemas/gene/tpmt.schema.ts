import { z } from "zod";

const id = z.coerce.number().int().positive();

// ✅ Schema สำหรับ POST (create)
export const newTPMTBodySchema = z.object({
  TPMTx3C_719A: z.string().min(1, "TPMTx3C_719A is required"),
  Predict_Geno: z.string().nullable().optional(),
  Predict_Pheno: z.string().nullable().optional(),
  Recommend: z.string().nullable().optional(),
  gene_id: id, // FK → Gene
});

// ✅ ใช้กับ middleware validate()
export const newTPMTSchema = z.object({ body: newTPMTBodySchema });

// ✅ Schema สำหรับ PUT/PATCH (update)
export const updateTPMTSchema = z.object({
  body: newTPMTBodySchema.partial(),
});

// ✅ Validate params เช่น /api/tpmt/:id
export const tpmtIdParamSchema = z.object({
  params: z.object({ id }),
});

// ✅ Query list (optional)
export const tpmtListQuerySchema = z.object({
  query: z.object({
    gene_id: id.optional(),
    limit: z.coerce.number().int().max(100).default(20).optional(),
    offset: z.coerce.number().int().min(0).default(0).optional(),
  }),
});
