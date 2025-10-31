// src/server/types/gene/Gene.ts

export interface Gene {
  gene_id: number;      // Primary key
  gene_name: string;    // ชื่อยีน เช่น "CYP2C9", "VKORC1"
}

// ใช้เวลา insert (ไม่ต้องใส่ id)
export type NewGene = Omit<Gene, "gene_id">;

// ใช้เวลา update (optional ทั้งหมด)
export type UpdateGene = Partial<NewGene>;
