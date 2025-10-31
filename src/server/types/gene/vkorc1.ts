export interface VKORC1 {
  VKORC1_Id: number;
  VKORC1_1173C: string;        // 👈 เปลี่ยนให้ตรง DB
  VKORC1_1639G: string;        // 👈 เปลี่ยนให้ตรง DB
  Haplotype: string;
  Predict_Pheno: string;
  Recommend: string;
  gene_id: Number;
}

export type NewVKORC1 = Omit<VKORC1, "VKORC1_Id">;
export type UpdateVKORC1 = Partial<NewVKORC1>;
