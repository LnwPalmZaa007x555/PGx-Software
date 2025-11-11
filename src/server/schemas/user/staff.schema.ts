import { z } from "zod";

export const newStaffSchema = z.object({
  Fname: z.string().min(1).trim(),
  Lname: z.string().min(1).trim(),
  Role: z.string().min(1).trim(),
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  Hospital_Name: z.string().min(1).trim(), // 👈 เพิ่ม
}).strict();

export const updateStaffSchema = z.object({
  Fname: z.string().min(1).trim().optional(),
  Lname: z.string().min(1).trim().optional(),
  Role: z.string().min(1).trim().optional(),
  email: z.string().email().toLowerCase().trim().optional(),
  password: z.string().min(8).optional(),
  Hospital_Name: z.string().min(1).trim().optional(), // 👈 เพิ่ม
}).strict();

export type NewStaffInput = z.infer<typeof newStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;

// Reset password by email
export const resetPasswordByEmailSchema = z
  .object({
    email: z.string().email().toLowerCase().trim(),
    password: z.string().min(8, "Password must be at least 8 characters"),
  })
  .strict();

export type ResetPasswordByEmailInput = z.infer<typeof resetPasswordByEmailSchema>;
