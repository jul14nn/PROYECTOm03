import type { Metadata, Viewport } from "next";
import {
  Geist,
  Geist_Mono,
  Anton,
  Silkscreen,
  Instrument_Serif,
  Montserrat,
  Poppins,
  Bebas_Neue,
  Oswald,
  Roboto,
  JetBrains_Mono,
  Inter,
} from "next/font/google";
import "./globals.css";
import SplashScreen from "@/components/SplashScreen";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const anton = Anton({
  variable: "--font-poster",
  weight: "400",
  subsets: ["latin"],
});

// Fuentes de los temas opcionales. Solo las usa el CSS del tema activo.
const silkscreen = Silkscreen({
  variable: "--font-pixel",
  weight: ["400", "700"],
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-editorial",
  weight: "400",
  subsets: ["latin"],
});

/**
 * Tipografías para los subtítulos de los vídeos.
 *
 * Son las que se ven una y otra vez en los vídeos de fondo con subtítulo
 * centrado. Se cargan aquí, con next/font, y no como fuentes del sistema:
 * "Impact" o "Helvetica" no existen en la mitad de los ordenadores, y el
 * lienzo, cuando no encuentra una fuente, pinta con la de reserva sin
 * avisar de nada. Cargadas así, están siempre.
 *
 * Los grosores son los gruesos a propósito: un subtítulo sobre vídeo en
 * movimiento necesita peso para leerse.
 *
 * Se quedan precargadas aunque solo hagan falta al montar vídeo. Con
 * `preload: false` el navegador no llega a descargarlas y `document.fonts.load`
 * tampoco las trae: se dibuja con la métrica de reserva y los subtítulos salen
 * con otra tipografía sin avisar. Comprobado midiendo el texto en el lienzo —
 * las cinco daban exactamente el mismo ancho, que es la señal de que ninguna
 * se había cargado.
 */
const montserrat = Montserrat({
  variable: "--font-montserrat",
  weight: ["600", "700", "800"],
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["600", "700"],
  subsets: ["latin"],
});

const bebas = Bebas_Neue({
  variable: "--font-bebas",
  weight: "400",
  subsets: ["latin"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  weight: ["500", "700"],
  subsets: ["latin"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  weight: ["500", "700", "900"],
  subsets: ["latin"],
});

/**
 * Mono para etiquetas y cifras.
 *
 * Los rótulos y los datos técnicos en monoespaciada es lo que da a un panel
 * aspecto de instrumento y no de folleto. Y resuelve algo real: `.numeral`
 * pedía cifras tabulares para que los números no bailasen al cambiar, pero
 * la tipografía de cartel no las tiene. Una mono sí, por definición.
 */
/* Inter para los momentos de display: peso medio e interlínea muy cerrada,
   que es lo que hace que un título grande se lea como una afirmación y no
   como un cartel. */
const inter = Inter({
  variable: "--font-display",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-tech",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Music Manager",
  description: "Gestión integral de producción musical: canciones, agenda, distribución, marketing y royalties.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Music Manager",
    statusBarStyle: "black-translucent",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#08070b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${anton.variable} ${silkscreen.variable} ${instrumentSerif.variable} ${montserrat.variable} ${poppins.variable} ${bebas.variable} ${oswald.variable} ${roboto.variable} ${jetbrains.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <SplashScreen />
        {children}
      </body>
    </html>
  );
}
