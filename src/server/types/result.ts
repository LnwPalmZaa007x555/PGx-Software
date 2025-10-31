// src/server/types/result.ts

export interface Result {
  Result_Id: number;            // PK
  Requested_date: string;       // ISO string (timestamptz)
  Patient_Id: number;           // FK -> Patients.Patient_Id
  status: string;               // e.g. "pending" | "processing" | "completed" | "reviewed"
  Reported_date: string | null; // ISO string or null (timestamp)
  gene_id: number;              // FK -> Gene.gene_id
  gene_information: number | null; // FK -> (ตารางเก็บข้อมูลยีนเฉพาะ) หรือ null
  staff_id: number;             // FK -> Staff.Staff_Id
}

// ใช้ตอนสร้าง (Result_Id สร้างอัตโนมัติ)
export type NewResult = Omit<Result, "Result_Id">;

// ใช้ตอนอัปเดตบางส่วน
export type UpdateResult = Partial<NewResult>;