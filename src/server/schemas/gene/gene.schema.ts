// src/server/schemas/gene/gene.schema.ts
import { z } from "zod";

// ✅ สำหรับสร้าง Gene ใหม่
export const newGeneSchema = z.object({
  gene_name: z.string()
    .min(1, "Gene name is required")
    .max(255, "Gene name too long"),
});

// ✅ สำหรับอัปเดต (optional)
export const updateGeneSchema = z.object({
  gene_name: z.string().min(1).max(255).optional(),
});

// ✅ สำหรับ validate params /id
export const geneIdParamSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive("Invalid gene_id"),
  }),
});

// ✅ Export type inference
export type NewGeneInput = z.infer<typeof newGeneSchema>;
export type UpdateGeneInput = z.infer<typeof updateGeneSchema>;
