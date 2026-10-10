import { apiClient } from "@/services/api/axios";
import { endpoints } from "@/services/api/endpoints";
import type { DashboardData, DashboardSiteCode } from "@/types/dashboard";

interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export async function fetchDashboard(
  siteCode: DashboardSiteCode,
  range?: { from?: string; to?: string },
): Promise<DashboardData> {
  const { data } = await apiClient.get<ApiSuccess<DashboardData>>(
    endpoints.admin.dashboard(siteCode),
    { params: range },
  );
  return data.data;
}
