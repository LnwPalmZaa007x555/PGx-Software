export interface CYP2C19 {
  CYP2C19_Id: number;   // PK (int8)
  CYPx2_681G: string;    // varchar
  CYPx3_636G: string;    // varchar
  CYPx17_806C: string;   // varchar
  Genotype: string | null;      // varchar
  Predict_Pheno: string | null; // varchar
  Recommend: string | null;     // varchar
  gene_id: number;              // FK -> Gene.gene_id
}

export type NewCYP2C19 = Omit<CYP2C19, "CYP2C19_Id">;
export type UpdateCYP2C19 = Partial<NewCYP2C19>;
