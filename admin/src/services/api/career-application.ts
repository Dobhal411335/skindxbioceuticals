import { apiClient } from "@/services/api/axios";
import { endpoints } from "@/services/api/endpoints";
import type { SiteCode } from "@/types/auth";
import type {
  CareerApplicationDto,
  CareerApplicationListParams,
  CareerApplicationStatus,
  CareerResumeAccess,
} from "@/types/career-application";

interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export async function fetchCareerApplications(
  siteCode: SiteCode,
  params: CareerApplicationListParams = {},
): Promise<CareerApplicationDto[]> {
  const { data } = await apiClient.get<ApiSuccess<CareerApplicationDto[]>>(
    endpoints.admin.careerApplications(siteCode),
    { params },
  );
  return data.data;
}

export async function patchCareerApplicationStatus(
  siteCode: SiteCode,
  applicationId: string,
  status: CareerApplicationStatus,
): Promise<CareerApplicationDto> {
  const { data } = await apiClient.patch<ApiSuccess<CareerApplicationDto>>(
    endpoints.admin.careerApplication(siteCode, applicationId),
    { status },
  );
  return data.data;
}

export async function fetchCareerResumeAccess(
  siteCode: SiteCode,
  applicationId: string,
): Promise<CareerResumeAccess> {
  const { data } = await apiClient.get<ApiSuccess<CareerResumeAccess>>(
    endpoints.admin.careerApplicationResume(siteCode, applicationId),
  );
  return data.data;
}
