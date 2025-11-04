import apiClient from "./apiClient";

export type LoginResponse = {
  token: string;
  refreshToken?: string;
  user: {
    Staff_Id: number;
    Fname: string;
    Lname: string;
    Role: string;
    email: string;
    Hospital_Name: string;
  };
};

export async function loginRequest(email: string, password: string): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>("/auth/login", { email, password });
  // persist tokens for interceptors and subsequent requests
  if (typeof window !== "undefined") {
    if (data.token) localStorage.setItem("token", data.token);
    if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
    console.log(data.token);
  }
  return data;
}

export async function meRequest() {
  const { data } = await apiClient.get<{ user: LoginResponse["user"] }>("/auth/me");
  return data.user;
}

export function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
  }
}
