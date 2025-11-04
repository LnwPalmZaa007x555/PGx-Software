import apiClient from "./apiClient";

export type DashboardData = {
  casesCount: number;
  execSummary?: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    totalTests: number;
  };
  tatTracking: {
    preAnalytic: number;
    analytic: number;
    postAnalytic: number;
  };
  kpiQuality: {
    rejectionRate: number;      // percent
    averageTatHours: number;    // integer hours
  };
  weeklyCases?: number[]; // length 4
};

export async function fetchDashboard(): Promise<DashboardData> {
  const { data } = await apiClient.get<DashboardData>("/patients/dashboard");
  return data;
}
