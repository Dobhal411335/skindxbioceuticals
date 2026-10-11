export type NavbarSubSection = {
  id: string;
  title: string;
  url: string;
  active: boolean;
  order: number;
};

export type NavbarSection = {
  id: string;
  siteCode: "IN" | "COM";
  title: string;
  url: string;
  active: boolean;
  order: number;
  subSections: NavbarSubSection[];
  createdAt?: string;
  updatedAt?: string;
};

export type StorefrontNavLink = {
  id: string;
  label: string;
  href: string;
  children: Array<{ id: string; label: string; href: string }>;
};
