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
