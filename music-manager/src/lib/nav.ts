import {
  LayoutDashboard,
  Music4,
  CalendarDays,
  Users,
  Truck,
  Megaphone,
  Coins,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const NAV: NavItem[] = [
  // La agenda va primero y en la raíz: al abrir la app lo que se quiere
  // saber es qué toca hoy, no cuántas cosas hay en total.
  { href: "/", label: "Agenda", icon: CalendarDays },
  { href: "/songs", label: "Canciones", icon: Music4 },
  { href: "/resumen", label: "Resumen", icon: LayoutDashboard },
  { href: "/contacts", label: "Contactos", icon: Users },
  { href: "/distribution", label: "Distribución", icon: Truck },
  { href: "/marketing", label: "Marketing", icon: Megaphone },
  { href: "/royalties", label: "Royalties", icon: Coins },
  { href: "/resultados", label: "Resultados", icon: TrendingUp },
];
