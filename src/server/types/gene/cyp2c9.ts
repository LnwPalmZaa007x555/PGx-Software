export interface CYP2C9 {
  CYP2C9_Id: number;        // PK (int8)
  CYP2C9x2_430C: string;    // varchar
  CYP2C9x3_1075A: string;   // varchar
  Predict_Geno: string;     // varchar
  Predict_Pheno: string;    // varchar
  Recommend: string;        // varchar
  gene_id: Number;
}

export type NewCYP2C9 = Omit<CYP2C9, "CYP2C9_Id">;
export type UpdateCYP2C9 = Partial<NewCYP2C9>;
