import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  BadgePercent,
  Boxes,
  ClipboardList,
  FileText,
  FolderOpen,
  HelpCircle,
  ImageIcon,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Newspaper,
  Package,
  Settings,
  Shield,
  ShoppingBag,
  Star,
  Truck,
  Users,
  Wallet,
  Building2,
  GalleryHorizontal,
  Search,
  ScrollText,
} from "lucide-react";

import type { SiteCode } from "@/types/auth";

export type NavItemStatus = "active" | "planned";

export interface SidebarNavItem {
  id: string;
  label: string;
  href?: string;
  icon: LucideIcon;
  status: NavItemStatus;
  children?: SidebarNavItem[];
  restricted?: boolean;
}

export interface SidebarSection {
  id: string;
  label?: string;
  items: SidebarNavItem[];
}

function siteDashboardHref(siteCode: SiteCode): string {
  return `/admin/${siteCode.toLowerCase()}/dashboard`;
}

export function getSharedNav(siteCode: SiteCode): SidebarSection {
  return {
    id: "shared",
    label: "Workspace",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        href: siteDashboardHref(siteCode),
        icon: LayoutDashboard,
        status: "active",
      },
      {
        id: "switch-site",
        label: "Website switcher",
        href: "/select-site",
        icon: ArrowLeftRight,
        status: "active",
      },
      {
        id: "profile",
        label: "Profile / account",
        icon: Users,
        status: "planned",
      },
      {
        id: "logout",
        label: "Logout",
        icon: LogOut,
        status: "active",
      },
    ],
  };
}

export function getInNav(): SidebarSection[] {
  return [
    {
      id: "catalog",
      label: "Catalog",
      items: [
        {
          id: "catalog-root",
          label: "Catalog",
          icon: Package,
          status: "planned",
          children: [
            { id: "products", label: "Products", icon: Package, status: "planned" },
            { id: "categories", label: "Categories", icon: Boxes, status: "planned" },
            { id: "variants", label: "Product variants", icon: Boxes, status: "planned" },
            { id: "product-media", label: "Product media", icon: ImageIcon, status: "planned" },
          ],
        },
      ],
    },
    {
      id: "inventory",
      label: "Inventory",
      items: [
        {
          id: "inventory-root",
          label: "Inventory",
          icon: Boxes,
          status: "planned",
          children: [
            { id: "stock", label: "Stock overview", icon: Boxes, status: "planned" },
            { id: "low-stock", label: "Low-stock items", icon: Boxes, status: "planned" },
            { id: "adjustments", label: "Inventory adjustments", icon: ClipboardList, status: "planned" },
          ],
        },
      ],
    },
    {
      id: "orders",
      label: "Orders",
      items: [
        {
          id: "orders-root",
          label: "Orders",
          icon: ShoppingBag,
          status: "planned",
          children: [
            { id: "all-orders", label: "All orders", icon: ShoppingBag, status: "planned" },
            { id: "pending-orders", label: "Pending orders", icon: ClipboardList, status: "planned" },
            { id: "completed-orders", label: "Completed orders", icon: ClipboardList, status: "planned" },
            { id: "cancelled-orders", label: "Cancelled orders", icon: ClipboardList, status: "planned" },
            { id: "refunds", label: "Refunds", icon: Wallet, status: "planned" },
          ],
        },
      ],
    },
    {
      id: "payments",
      label: "Payments",
      items: [
        {
          id: "payments-root",
          label: "Payments",
          icon: Wallet,
          status: "planned",
          children: [
            { id: "payment-records", label: "Payment records", icon: Wallet, status: "planned" },
            { id: "payment-failures", label: "Payment failures", icon: Wallet, status: "planned" },
            { id: "reconciliation", label: "Reconciliation", icon: ClipboardList, status: "planned" },
          ],
        },
      ],
    },
    {
      id: "customers",
      label: "Customers",
      items: [
        {
          id: "customers-root",
          label: "Customers",
          icon: Users,
          status: "planned",
          children: [
            { id: "customer-list", label: "Customer list", icon: Users, status: "planned" },
            { id: "customer-details", label: "Customer details", icon: Users, status: "planned" },
          ],
        },
      ],
    },
    {
      id: "marketing",
      label: "Marketing",
      items: [
        {
          id: "marketing-root",
          label: "Marketing",
          icon: BadgePercent,
          status: "planned",
          children: [
            { id: "coupons", label: "Coupons and discounts", icon: BadgePercent, status: "planned" },
            { id: "featured", label: "Featured products", icon: Star, status: "planned" },
            { id: "promo-banners", label: "Promotional banners", icon: ImageIcon, status: "planned" },
          ],
        },
      ],
    },
    {
      id: "content",
      label: "Content",
      items: [
        {
          id: "content-root",
          label: "Content",
          icon: FileText,
          status: "planned",
          children: [
            { id: "pages", label: "Pages", icon: FileText, status: "planned" },
            { id: "navigation", label: "Navigation", icon: FolderOpen, status: "planned" },
            { id: "faqs", label: "FAQs", icon: HelpCircle, status: "planned" },
            { id: "blog", label: "Blog", icon: Newspaper, status: "planned" },
          ],
        },
      ],
    },
    {
      id: "ops",
      items: [
        { id: "reviews", label: "Reviews", icon: Star, status: "planned" },
        { id: "media", label: "Media Library", icon: ImageIcon, status: "planned" },
        { id: "reports", label: "Reports", icon: ClipboardList, status: "planned" },
        { id: "shipping", label: "Shipping", icon: Truck, status: "planned" },
        { id: "settings", label: "Settings", icon: Settings, status: "planned" },
        {
          id: "admin-users",
          label: "Admin Users & Permissions",
          icon: Shield,
          status: "planned",
          restricted: true,
        },
        {
          id: "audit-logs",
          label: "Audit Logs",
          icon: ScrollText,
          status: "planned",
          restricted: true,
        },
      ],
    },
  ];
}

export function getComNav(): SidebarSection[] {
  return [
    {
      id: "company",
      items: [
        { id: "company-info", label: "Company Information", icon: Building2, status: "planned" },
        { id: "website-pages", label: "Website Pages", icon: FileText, status: "planned" },
        { id: "manage-nav", label: "Manage Navigation", icon: FolderOpen, status: "planned" },
      ],
    },
    {
      id: "banners",
      label: "Banners",
      items: [
        {
          id: "banners-root",
          label: "Banners",
          icon: GalleryHorizontal,
          status: "planned",
          children: [
            { id: "hero-banners", label: "Hero banners", icon: ImageIcon, status: "planned" },
            { id: "promo-banners", label: "Promotional banners", icon: ImageIcon, status: "planned" },
            { id: "featured-content", label: "Featured content", icon: Star, status: "planned" },
          ],
        },
      ],
    },
    {
      id: "products-info",
      items: [
        {
          id: "product-info",
          label: "Products / Product Information",
          icon: Package,
          status: "planned",
        },
      ],
    },
    {
      id: "enquiries",
      label: "Enquiries",
      items: [
        {
          id: "enquiries-root",
          label: "Enquiries",
          icon: MessageSquare,
          status: "planned",
          children: [
            { id: "new-enquiries", label: "New enquiries", icon: MessageSquare, status: "planned" },
            { id: "in-progress", label: "In progress", icon: ClipboardList, status: "planned" },
            { id: "resolved", label: "Resolved", icon: ClipboardList, status: "planned" },
          ],
        },
      ],
    },
    {
      id: "resources",
      items: [
        { id: "blog-resources", label: "Blog / Resources", icon: Newspaper, status: "planned" },
        { id: "faqs", label: "FAQs", icon: HelpCircle, status: "planned" },
        { id: "gallery", label: "Gallery / Media Library", icon: ImageIcon, status: "planned" },
        { id: "seo", label: "SEO Settings", icon: Search, status: "planned" },
        { id: "site-settings", label: "Site Settings", icon: Settings, status: "planned" },
        {
          id: "admin-users",
          label: "Admin Users & Permissions",
          icon: Shield,
          status: "planned",
          restricted: true,
        },
        {
          id: "audit-logs",
          label: "Audit Logs",
          icon: ScrollText,
          status: "planned",
          restricted: true,
        },
      ],
    },
  ];
}

export function getSidebarConfig(siteCode: SiteCode): SidebarSection[] {
  const siteSections = siteCode === "IN" ? getInNav() : getComNav();
  return [getSharedNav(siteCode), ...siteSections];
}
