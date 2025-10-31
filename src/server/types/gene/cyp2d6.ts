export interface CYP2D6 {
  "2D6_Id": number;          // PK (int8) — ใช้เครื่องหมาย "" ครอบ
  CYP2D6x4_1847G: string;
  CYP2D6x10_100C: string;
  CYP2D6x41_2989G: string;
  CNV_Intron: string;
  CNV_Exon: string;
  Result: string;
  Phenotype: string;
  Predict_Pheno: string;
  Recommend: string;
  gene_id: Number;
}

export type NewCYP2D6 = Omit<CYP2D6, "2D6_Id">;
export type UpdateCYP2D6 = Partial<NewCYP2D6>;
