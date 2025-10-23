export type MarkerOption = { label: string; value: string };

export type Marker = {
  name: string;
  description?: string;
  options: MarkerOption[];
};

export type GenotypeRow = {
  /** key ที่มนุษย์อ่านง่าย เช่น "*1/*2" */
  genotype: string;

  /** สรุป phenotype (ภาษาเริ่มต้นหรือใช้เมื่อไม่รองรับหลายภาษา) */
  phenotype?: string;

  /** สรุป phenotype แยกภาษา */
  phenotype_en?: string;
  phenotype_th?: string;

  /** คำแนะนำการรักษา (ภาษาเริ่มต้น) */
  recommendation?: string;

  /** คำแนะนำแยกภาษา */
  recommendation_en?: string;
  recommendation_th?: string;
};

export type GeneMapping = {
  /** ตัวเลือก SNP/marker per gene */
  markers: Marker[];
  /** ตาราง mapping ที่ “ครบตามแถว” ของไฟล์ */
  genotypes: GenotypeRow[];
  /** ฟังก์ชันคำนวณ genotype (diplotype/haplotype) จาก marker values */
  mapToGenotype: (values: Record<string, string>) => string;
};

export type MappingTable = Record<string, GeneMapping>;
