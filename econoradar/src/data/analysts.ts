import type { Analyst } from '../types'

export const analysts: Analyst[] = [
  {
    id: 'a1',
    name: 'Elena Vidal',
    role: 'Economista Jefe',
    institution: 'Instituto Meridian de Estudios Económicos',
    initials: 'EV',
    specialty: ['politica-monetaria', 'inflacion'],
    bio: 'Especialista en bancos centrales y ciclos de tasas de interés, con foco en la transmisión de política monetaria a la economía real.',
    accuracyScore: 78,
  },
  {
    id: 'a2',
    name: 'Marco Ferretti',
    role: 'Estratega de Mercados Globales',
    institution: 'Altura Capital Research',
    initials: 'MF',
    specialty: ['mercados', 'comercio'],
    bio: 'Cubre renta variable y flujos de capital internacional, con énfasis en el impacto de tensiones comerciales sobre los mercados emergentes.',
    accuracyScore: 71,
  },
  {
    id: 'a3',
    name: 'Priya Nathan',
    role: 'Analista de Mercado Laboral',
    institution: 'Observatorio Laboral Cardinal',
    initials: 'PN',
    specialty: ['empleo', 'fiscal'],
    bio: 'Investiga dinámicas de empleo, salarios y su relación con el gasto público en economías desarrolladas.',
    accuracyScore: 82,
  },
  {
    id: 'a4',
    name: 'Diego Salcedo',
    role: 'Analista Senior de Energía',
    institution: 'Consultora Terra Energética',
    initials: 'DS',
    specialty: ['energia', 'comercio'],
    bio: 'Analiza mercados de commodities energéticos y su efecto en cadenas de suministro y precios al consumidor.',
    accuracyScore: 75,
  },
  {
    id: 'a5',
    name: 'Sofía Lindqvist',
    role: 'Economista de Innovación',
    institution: 'Nordic Tech & Economy Lab',
    initials: 'SL',
    specialty: ['tecnologia', 'mercados'],
    bio: 'Estudia el impacto económico de la adopción de inteligencia artificial y automatización en la productividad.',
    accuracyScore: 69,
  },
  {
    id: 'a6',
    name: 'Lucía Bermejo',
    role: 'Analista de Vivienda y Crédito',
    institution: 'Observatorio Inmobiliario Delta',
    initials: 'LB',
    specialty: ['vivienda', 'politica-monetaria'],
    bio: 'Sigue la relación entre tasas hipotecarias, oferta de vivienda y accesibilidad en mercados urbanos.',
    accuracyScore: 73,
  },
  {
    id: 'a7',
    name: 'Kenji Osawa',
    role: 'Estratega de Activos Digitales',
    institution: 'Ledger & Macro Partners',
    initials: 'KO',
    specialty: ['cripto', 'mercados'],
    bio: 'Analiza la correlación entre criptoactivos, liquidez global y política monetaria de los principales bancos centrales.',
    accuracyScore: 65,
  },
]

export function getAnalyst(id: string): Analyst | undefined {
  return analysts.find((a) => a.id === id)
}
