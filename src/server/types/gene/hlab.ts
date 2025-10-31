export interface HLAB {
  HLA_B_Id: number;       // PK
  HLA_Gene: string;
  Drugs: string;
  Types_of_Scar: string;
  Ethic_groups: string;
  Odd_ratios: string;
  Referances: string;
  gene_id: Number;
}

export type NewHLAB = Omit<HLAB, "HLA_B_Id">;
export type UpdateHLAB = Partial<NewHLAB>;
