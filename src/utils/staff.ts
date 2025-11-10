import apiClient from "./apiClient";

export type StaffDto = {
  Staff_Id: number;
  Fname: string;
  Lname: string;
  Role: string;
  email: string;
  Hospital_Name: string;
};

export async function fetchStaff(): Promise<StaffDto[]> {
  const { data } = await apiClient.get<StaffDto[]>("/staff");
  return data;
}

export async function updateStaffById(id: number, patch: Partial<Omit<StaffDto, "Staff_Id">> & { password?: string }): Promise<StaffDto> {
  const { data } = await apiClient.put<StaffDto>(`/staff/${id}`, patch);
  return data;
}

export async function createStaff(newStaff: {
  Fname: string;
  Lname: string;
  Role: string;
  email: string;
  Hospital_Name: string;
  password?: string; // optional override
}): Promise<StaffDto> {
  const payload = { ...newStaff, password: newStaff.password || "secretpass123" };
  const { data } = await apiClient.post<StaffDto>("/staff", payload);
  return data;
}

export async function fetchStaffByEmail(email: string): Promise<StaffDto | null> {
  // There's no explicit endpoint; get all and filter client-side (admin-only view).
  // If dataset is large, consider adding /staff/by-email on server.
  const all = await fetchStaff();
  const found = all.find((s) => (s.email || "").toLowerCase() === email.toLowerCase());
  return found ?? null;
}

export async function resetStaffPasswordById(id: number, newPassword: string): Promise<StaffDto> {
  // Server will hash in updateStaffById when "password" provided
  return updateStaffById(id, { password: newPassword });
}
