import {
  LayoutDashboard,
  Users,
  Building2,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  icon: LucideIcon;
  href: string;
  active?: boolean;
};

export const NAV: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", active: true },
  { label: "Contacts", icon: Users, href: "#" },
  { label: "Companies", icon: Building2, href: "#" },
  { label: "Reports", icon: BarChart3, href: "#" },
  { label: "Settings", icon: Settings, href: "#" },
];
