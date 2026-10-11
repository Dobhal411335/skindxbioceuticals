import type {
  NavbarSectionDto,
  NavbarSectionFormValues,
  NavbarSubSectionFormValues,
} from "@/types/manage-navbar";

export function createSubSectionFormValues(): NavbarSubSectionFormValues {
  return {
    title: "",
    url: "",
    order: "",
    active: true,
  };
}

export function createEmptyFormValues(): NavbarSectionFormValues {
  return {
    title: "",
    url: "#",
    order: "",
    active: true,
    subSections: [createSubSectionFormValues()],
  };
}

export function dtoToFormValues(section: NavbarSectionDto): NavbarSectionFormValues {
  return {
    title: section.title || "",
    url: section.url || "#",
    order: section.order != null ? String(section.order) : "",
    active: section.active ?? true,
    subSections:
      Array.isArray(section.subSections) && section.subSections.length > 0
        ? section.subSections.map((item) => ({
            title: item.title || "",
            url: item.url || "#",
            order: item.order != null ? String(item.order) : "",
            active: item.active ?? true,
          }))
        : [createSubSectionFormValues()],
  };
}
