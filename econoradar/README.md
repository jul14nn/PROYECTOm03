# EconoRadar

Aplicación web sobre economía con dos secciones principales:

- **Noticias**: un feed de noticias económicas relevantes, filtrable por categoría (mercados, inflación, política monetaria, empleo, comercio internacional, energía, tecnología, política fiscal).
- **Proyecciones**: por cada situación relevante, combina tres capas de lectura sobre el futuro:
  1. **Qué está pasando** — resumen de la situación y las noticias que la originan.
  2. **Análisis automatizado** — señales detectadas y su lectura, generadas de forma automática ("la máquina de reportaje").
  3. **Lectura de analistas** — interpretación de analistas profesionales (ficticios en esta versión), con nivel de confianza, horizonte temporal y los eventos futuros concretos que anticipan.

  Cada proyección también incluye **escenarios futuros** con probabilidad estimada, horizonte e impactos esperados.

Los datos (noticias, analistas y proyecciones) son actualmente mock data en `src/data/`, modelados con tipos claros en `src/types/` para poder conectarse más adelante a una API de noticias real y a un motor de generación de análisis.

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

React + TypeScript + Vite, Tailwind CSS v4, React Router.
