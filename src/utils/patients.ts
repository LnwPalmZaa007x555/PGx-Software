import apiClient from "./apiClient";

// Shape of the Add Case form in the UI
export type AddCaseForm = {
  idCard: string;
  firstName: string;
  lastName: string;
  sex: string; // "male" | "female"
  dob: string; // yyyy-mm-dd
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

function yearsBetween(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return Math.max(0, age);
}

export async function createPatientFromForm(form: AddCaseForm): Promise<PatientDto> {
  const payload = {
    Fname: form.firstName.trim(),
    Lname: form.lastName.trim(),
    Age: yearsBetween(form.dob),
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

export async function updatePatientById<T extends Record<string, any>>(patientId: number, patch: T): Promise<void> {
  await apiClient.put(`/patients/${patientId}`, patch);
}
