# EconoRadar

Aplicación web sobre economía con tres secciones principales:

- **Panorama**: home con ticker de mercado, cifras clave, gráficos de tendencias y lo más destacado de noticias y proyecciones.
- **Noticias**: un feed económico filtrable por categoría (mercados, inflación, política monetaria, empleo, comercio internacional, energía, tecnología, política fiscal, criptomonedas, vivienda) y buscable por texto.
- **Proyecciones**: por cada situación relevante, combina tres capas de lectura sobre el futuro:
  1. **Qué está pasando** — resumen de la situación y las noticias que la originan.
  2. **Análisis automatizado** — señales detectadas y su lectura, generadas de forma automática ("la máquina de reportaje").
  3. **Lectura de analistas** — interpretación de analistas profesionales (ficticios en esta versión), con nivel de confianza, horizonte temporal y los eventos futuros concretos que anticipan.

  Cada proyección incluye además un **badge de consenso** (confianza promedio + escenario más probable) y **escenarios futuros** detallados con probabilidad estimada, horizonte e impactos esperados.

Los datos (noticias, analistas, proyecciones, cotizaciones de mercado y series históricas) viven en `src/data/`, modelados con tipos claros en `src/types/`.

## Noticias en vivo (opcional)

Por defecto, EconoRadar usa noticias curadas localmente. Para combinarlas con noticias reales:

1. Copia `.env.example` a `.env.local`.
2. Consigue una API key gratuita en [newsapi.org](https://newsapi.org) y pégala en `VITE_NEWS_API_KEY`.
3. Reinicia `npm run dev`.

Sin esa variable, la app funciona exactamente igual con los datos locales — no hay ninguna dependencia dura de la API externa. La lógica de integración vive en `src/services/newsApi.ts`.

**Nota sobre CORS**: el plan gratuito de NewsAPI solo permite peticiones desde el navegador en `localhost`; en producción esas peticiones deben pasar por un pequeño proxy backend que guarde la key del lado del servidor, en vez de exponerla en el bundle del cliente.

## Desarrollo

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Stack

React + TypeScript + Vite, Tailwind CSS v4, React Router. Gráficos en SVG nativo, sin librerías externas.
