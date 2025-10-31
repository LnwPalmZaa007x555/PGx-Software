export interface TPMT {
  TPMT_Id: number;        // PK (int8)
  TPMTx3C_719A: string;   // varchar
  Predict_Geno: string;   // varchar
  Predict_Pheno: string;  // varchar
  Recommend: string;      // varchar
  gene_id: Number;
}

export type NewTPMT = Omit<TPMT, "TPMT_Id">;
export type UpdateTPMT = Partial<NewTPMT>;
