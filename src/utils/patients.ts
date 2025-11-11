import apiClient from "./apiClient";

// Shape of the Add Case form in the UI
export type AddCaseForm = {
  idCard: string;
  firstName: string;
  lastName: string;
  sex: string; // "male" | "female"
  age: number; // numeric age provided directly
  phone: string; // 10 digits
  ethnicity: string; // "thai" | "other"
  otherEthnicity?: string;
};

// Shape returned from backend
export type PatientDto = {
  Patient_Id: number;
  Fname: string;
  Lname: string;
  Age: number;
  Gender: string;
  Phone: string;
  Id_Card: string;
  Ethnicity: string;
  status: string;
  create_at: string;
  approve_at: string | null;
};

export async function createPatientFromForm(form: AddCaseForm): Promise<PatientDto> {
  const payload = {
    Fname: form.firstName.trim(),
    Lname: form.lastName.trim(),
    Age: Number(form.age),
    Gender: form.sex,
    Phone: form.phone,
    Id_Card: form.idCard,
    Ethnicity: form.ethnicity === "other" && form.otherEthnicity?.trim()
      ? form.otherEthnicity.trim()
      : "Thai",
    // status omitted to allow backend default
  };

  const { data } = await apiClient.post<PatientDto>("/patients", payload);
  return data;
}

export async function fetchPatients(): Promise<PatientDto[]> {
  const { data } = await apiClient.get<PatientDto[]>("/patients");
  return data;
}

export async function deletePatientById(patientId: number): Promise<void> {
  await apiClient.delete(`/patients/${patientId}`);
}

export async function updatePatientById<T extends Record<string, unknown>>(patientId: number, patch: T): Promise<void> {
  await apiClient.put(`/patients/${patientId}`, patch);
}
