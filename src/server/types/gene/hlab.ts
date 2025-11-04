export interface HLAB {
  HLA_B_Id: number;
  HLA_Gene: string;
  Drugs: string;
  Types_of_Scar: string;
  Ethic_groups: string;
  Odd_ratios: string;
  Referances: string;
  gene_id: number;           // ← ใช้ number ไม่ใช่ Number

  // mapping fields
  status?: "Positive" | "Negative";
  phenotype?: string | null;
  recommend?: string | null;
}

export type NewHLAB = Omit<HLAB, "HLA_B_Id">;
export type UpdateHLAB = Partial<NewHLAB>;
