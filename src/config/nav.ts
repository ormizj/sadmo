import {
  LayoutDashboard,
  Users,
  Building2,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  key: string;
  icon: LucideIcon;
  href: string;
  active?: boolean;
};

export const NAV: NavItem[] = [
  { key: "dashboard", icon: LayoutDashboard, href: "/dashboard", active: true },
  { key: "contacts", icon: Users, href: "#" },
  { key: "companies", icon: Building2, href: "#" },
  { key: "reports", icon: BarChart3, href: "#" },
  { key: "settings", icon: Settings, href: "#" },
];