import { z } from "zod";

const id = z.coerce.number().int().positive();

// ใช้ตอนสร้าง
export const newHLABBodySchema = z.object({
  HLA_Gene: z.string().min(1, "HLA_Gene is required"),
  Drugs: z.string().nullable().optional(),
  Types_of_Scar: z.string().nullable().optional(),
  Ethic_groups: z.string().nullable().optional(),
  Odd_ratios: z.string().nullable().optional(),
  Referances: z.string().nullable().optional(), // ชื่อคอลัมน์ตามตาราง
  gene_id: id, // FK → Gene
});

// สำหรับ validate() middleware
export const newHLABSchema = z.object({ body: newHLABBodySchema });

// ใช้ตอนอัปเดต
export const updateHLABSchema = z.object({
  body: newHLABBodySchema.partial(),
});

// /:id params
export const hlaBIdParamSchema = z.object({
  params: z.object({ id }),
});

// list query (optional filters)
export const hlaBListQuerySchema = z.object({
  query: z.object({
    gene_id: id.optional(),
    limit: z.coerce.number().int().max(100).default(20).optional(),
    offset: z.coerce.number().int().min(0).default(0).optional(),
  }),
});
