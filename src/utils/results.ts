import apiClient from "./apiClient";

export type PatientResultDetail = {
  result: {
    Result_Id: number;
    Patient_Id: number;
    gene_id: number;
    gene_information: number;
    status: string;
    Requested_date: string;
    Reported_date: string | null;
  };
  gene: {
    gene_id: number;
    gene_name: string;
  };
  markers: Record<string, string>;
  predict_pheno: string | null;
  recommend: string | null;

  gene_meta?: {
    gene_name: string;         // เช่น "HLA_B" หรือ "CYP2C9"
    hla_gene?: string;         // เช่น "HLA-B*15:02"
    status?: string;           // "Positive" | "Negative"
    phenotype?: string | null; // บางที่ตั้งชื่อ predict_pheno
    predict_pheno?: string | null;
    recommend?: string | null;
    markers?: Record<string, string>; // เผื่อแนบ markers มาด้วย
  };
};


export async function fetchLatestResultForPatient(patientId: number) {
  try {
    const resp = await apiClient.get<PatientResultDetail | undefined>(
      `/results/by-patient/${patientId}/latest`
    );
    if (resp.status === 204) return undefined;
    return resp.data;
  } catch (e: unknown) {
    const status = (e as { response?: { status?: number } })?.response?.status;
    if (status === 204 || status === 404) return undefined;
    throw e;
  }
}

export async function updateResultStatus(resultId: number, status: string) {
  const payload: { status: string } = { status };
  const resp = await apiClient.put(`/results/${resultId}`, payload);
  return resp.data;
}

// Lightweight shape of a Result row
export type ResultRow = {
  Result_Id: number;
  Patient_Id: number;
  gene_id: number;
  gene_information: number;
  status: string;
  Requested_date: string;
  Reported_date: string | null;
};


export async function listResultsForPatient(patientId: number, limit = 50, offset = 0): Promise<{ items: ResultRow[]; count: number }>{
  const { data } = await apiClient.get<{ items: ResultRow[]; count: number; limit: number; offset: number }>(
    `/results`,
    { params: { patient: patientId, limit, offset } }
  );
  return { items: data.items || [], count: data.count || 0 };
}


export type LatestWithGeneDto = {
  patient: {
    Patient_Id: number;
    Fname: string;
    Lname: string;
    Age: number;
    Gender: string;
    Phone: string;
    Id_Card: string;
    Ethnicity: string;
    status: string;
    create_at?: string;
    approve_at?: string | null;
  };
  result: {
    Result_Id: number;
    Requested_date: string;
    Patient_Id: number;
    status: string;
    Reported_date: string | null;
    gene_id: number;
    gene_information: number;
    staff_id: number;
  };
  gene: {
    gene_id: number;
    gene_name: string; // เช่น "CYP2C9", "TPMT", "HLA-B*15:02"
  };
  markers: Record<string, string>; // เช่น { "TPMT*3C (719A>G)": "A/A" }
  predict_pheno: string | null;
  recommend: string | null;
};

// ดึงผลล่าสุด + gene + markers ด้วย idCard (HN)
export async function fetchLatestResultByIdCard(
  idCard: string
): Promise<LatestWithGeneDto> {
  const { data } = await apiClient.get<LatestWithGeneDto>(
    `/results/by-idcard/${(idCard)}/latest`
  );
  return data;
}