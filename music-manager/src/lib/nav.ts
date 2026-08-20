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

/**
 * En el móvil solo caben cuatro pestañas sin que se corten las etiquetas
 * ("Distribución" se quedaba en "Distribuci…"). Se dejan visibles las de uso
 * diario y el resto pasa al menú "Más".
 */
export const MOBILE_PRIMARY: NavItem[] = [
  NAV[0], // Resumen
  NAV[1], // Canciones
  NAV[2], // Agenda
  NAV[5], // Marketing
];

export const MOBILE_SECONDARY: NavItem[] = [
  NAV[3], // Contactos
  NAV[4], // Distribución
  NAV[6], // Royalties
];
