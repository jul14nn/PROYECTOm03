import {
  LayoutDashboard,
  Music4,
  CalendarDays,
  Users,
  Truck,
  Megaphone,
  Coins,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const NAV: NavItem[] = [
  { href: "/", label: "Resumen", icon: LayoutDashboard },
  { href: "/songs", label: "Canciones", icon: Music4 },
  { href: "/calendar", label: "Agenda", icon: CalendarDays },
  { href: "/contacts", label: "Contactos", icon: Users },
  { href: "/distribution", label: "Distribución", icon: Truck },
  { href: "/marketing", label: "Marketing", icon: Megaphone },
  { href: "/royalties", label: "Royalties", icon: Coins },
];
