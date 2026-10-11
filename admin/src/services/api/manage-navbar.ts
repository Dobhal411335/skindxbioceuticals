import { apiClient } from "@/services/api/axios";
import { endpoints } from "@/services/api/endpoints";
import type { SiteCode } from "@/types/auth";
import type {
  NavbarSectionDto,
  NavbarSectionPayload,
} from "@/types/manage-navbar";

interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export async function fetchNavbarSections(
  siteCode: SiteCode,
): Promise<NavbarSectionDto[]> {
  const { data } = await apiClient.get<ApiSuccess<NavbarSectionDto[]>>(
    endpoints.admin.navbarSections(siteCode),
  );
  return data.data;
}

export async function createNavbarSection(
  siteCode: SiteCode,
  body: NavbarSectionPayload,
): Promise<NavbarSectionDto> {
  const { data } = await apiClient.post<ApiSuccess<NavbarSectionDto>>(
    endpoints.admin.navbarSections(siteCode),
    body,
  );
  return data.data;
}

export async function updateNavbarSection(
  siteCode: SiteCode,
  sectionId: string,
  body: NavbarSectionPayload,
): Promise<NavbarSectionDto> {
  const { data } = await apiClient.put<ApiSuccess<NavbarSectionDto>>(
    endpoints.admin.navbarSection(siteCode, sectionId),
    body,
  );
  return data.data;
}

export async function patchNavbarSectionActive(
  siteCode: SiteCode,
  sectionId: string,
  active: boolean,
): Promise<NavbarSectionDto> {
  const { data } = await apiClient.patch<ApiSuccess<NavbarSectionDto>>(
    endpoints.admin.navbarSection(siteCode, sectionId),
    { active },
  );
  return data.data;
}

export async function deleteNavbarSection(
  siteCode: SiteCode,
  sectionId: string,
): Promise<void> {
  await apiClient.delete(endpoints.admin.navbarSection(siteCode, sectionId));
}
