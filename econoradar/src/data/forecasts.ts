import type { Forecast } from '../types'

export const forecasts: Forecast[] = [
  {
    id: 'f1',
    title: '¿Hacia un giro en la política monetaria?',
    category: 'politica-monetaria',
    situation:
      'El banco central sostuvo las tasas pero moderó su discurso justo cuando la inflación cae a su nivel más bajo en dos años. El mercado empieza a descontar un recorte antes de fin de año.',
    relatedNewsIds: ['n1', 'n2'],
    autoAnalysis: {
      summary:
        'El cruce entre inflación a la baja y comunicación más flexible del banco central es una señal histórica de proximidad a un cambio de ciclo. La curva de tasas ya empezó a reflejar esa expectativa.',
      signals: [
        'Inflación de servicios aún por encima del objetivo, lo que podría demorar el recorte',
        'Los futuros de tasas asignan 68% de probabilidad a un recorte en la próxima reunión',
        'Comunicados previos del banco central suelen preceder decisiones por 1–2 reuniones',
      ],
      generatedAt: '2026-08-18',
    },
    expertOpinions: [
      {
        analystId: 'a1',
        opinion:
          'El cambio de tono es deliberado: el banco central está preparando al mercado para no generar sorpresas. Espero un recorte de 25 puntos básicos en octubre, seguido de una pausa para evaluar el traspaso a precios.',
        confidence: 4,
        horizon: 'corto',
        predictedEvents: [
          'Recorte de 25 pb en la reunión de octubre',
          'Apreciación moderada de bonos de corto plazo',
          'Nueva pausa hasta contar con dos lecturas más de inflación',
        ],
        publishedAt: '2026-08-18',
      },
      {
        analystId: 'a2',
        opinion:
          'El mercado se está adelantando demasiado. La inflación de servicios no cede al ritmo necesario y un recorte prematuro podría obligar al banco a revertirlo, dañando su credibilidad.',
        confidence: 3,
        horizon: 'medio',
        predictedEvents: [
          'El banco central mantiene tasas en la reunión de octubre',
          'Volatilidad en renta fija ante la corrección de expectativas',
          'Primer recorte recién en el primer trimestre de 2027',
        ],
        publishedAt: '2026-08-17',
      },
    ],
    scenarios: [
      {
        id: 'f1-s1',
        label: 'Recorte gradual iniciando en octubre',
        probability: 0.55,
        horizon: 'corto',
        description:
          'El banco central inicia un ciclo de recortes cautelosos de 25 pb, condicionado a los datos de inflación.',
        impacts: [
          'Abaratamiento gradual del crédito hipotecario y de consumo',
          'Impulso moderado a sectores sensibles a tasas (construcción, tecnología)',
          'Depreciación leve de la moneda frente a pares con tasas más altas',
        ],
      },
      {
        id: 'f1-s2',
        label: 'El banco central mantiene la pausa hasta 2027',
        probability: 0.3,
        horizon: 'medio',
        description:
          'La inflación de servicios resulta más persistente de lo esperado y obliga a posponer cualquier recorte.',
        impacts: [
          'Presión adicional sobre sectores endeudados',
          'Fortalecimiento de la moneda local',
          'Mayor probabilidad de enfriamiento del mercado laboral',
        ],
      },
      {
        id: 'f1-s3',
        label: 'Recorte agresivo por deterioro económico súbito',
        probability: 0.15,
        horizon: 'corto',
        description:
          'Un dato de empleo débil o un shock externo fuerza un recorte mayor a 50 pb fuera de calendario.',
        impacts: [
          'Señal de alarma para los mercados sobre el estado real de la economía',
          'Repunte fuerte pero volátil en renta variable',
          'Posible episodio de debilidad cambiaria',
        ],
      },
    ],
    updatedAt: '2026-08-18',
  },
  {
    id: 'f2',
    title: 'Fricción comercial y su efecto en cadenas de suministro',
    category: 'comercio',
    situation:
      'Los nuevos aranceles a componentes electrónicos, sumados al recorte de rutas navieras y la debilidad de divisas emergentes, apuntan a una reconfiguración forzada del comercio global de manufacturas.',
    relatedNewsIds: ['n3', 'n9', 'n10'],
    autoAnalysis: {
      summary:
        'La combinación de barreras arancelarias con menor demanda de transporte sugiere que empresas están anticipando costos más altos y reduciendo inventarios en tránsito, un patrón que históricamente precede a ajustes de precios al consumidor con 2 a 4 meses de rezago.',
      signals: [
        'Tres países concentran la mayor exposición arancelaria en semiconductores',
        'La capacidad naviera transpacífica cae mientras la transatlántica se mantiene estable',
        'Divisas emergentes exportadoras de manufactura muestran mayor debilidad relativa',
      ],
      generatedAt: '2026-08-16',
    },
    expertOpinions: [
      {
        analystId: 'a2',
        opinion:
          'Estamos viendo el inicio de una relocalización de cadenas de suministro hacia socios comerciales sin aranceles. El proceso será costoso a corto plazo pero reduce riesgo de concentración a mediano plazo.',
        confidence: 4,
        horizon: 'medio',
        predictedEvents: [
          'Anuncios de nuevas plantas de ensamblaje fuera de los países afectados',
          'Márgenes comprimidos en electrónica de consumo durante 2 a 3 trimestres',
          'Mayor volatilidad en divisas de países exportadores de manufactura',
        ],
        publishedAt: '2026-08-16',
      },
      {
        analystId: 'a4',
        opinion:
          'El componente energético no debe subestimarse: fletes más caros por menor eficiencia de rutas, combinados con crudo al alza, generan un efecto doble sobre el costo logístico total.',
        confidence: 3,
        horizon: 'corto',
        predictedEvents: [
          'Incremento de tarifas de flete en rutas alternativas',
          'Traspaso parcial a precios de electrónica en 3 a 4 meses',
          'Empresas aceleran diversificación de proveedores',
        ],
        publishedAt: '2026-08-15',
      },
    ],
    scenarios: [
      {
        id: 'f2-s1',
        label: 'Negociación parcial reduce aranceles en 90 días',
        probability: 0.4,
        horizon: 'corto',
        description:
          'Las partes alcanzan un acuerdo transitorio que reduce el arancel al 7-8%, aliviando presión de costos.',
        impacts: [
          'Recuperación parcial de márgenes en electrónica',
          'Estabilización de divisas emergentes ligadas a manufactura',
        ],
      },
      {
        id: 'f2-s2',
        label: 'Los aranceles se mantienen y se aceleran relocalizaciones',
        probability: 0.45,
        horizon: 'largo',
        description:
          'Sin acuerdo a la vista, las empresas invierten en capacidad productiva fuera de los países gravados.',
        impacts: [
          'Costos de transición elevados para fabricantes en el corto plazo',
          'Beneficio para economías receptoras de nueva inversión manufacturera',
          'Precios al consumidor de electrónica suben de forma sostenida',
        ],
      },
      {
        id: 'f2-s3',
        label: 'Escalada con aranceles recíprocos adicionales',
        probability: 0.15,
        horizon: 'medio',
        description:
          'Los países afectados responden con contramedidas, ampliando el conflicto a otros sectores.',
        impacts: [
          'Deterioro más amplio del comercio bilateral',
          'Mayor volatilidad en mercados de renta variable expuestos a tecnología',
        ],
      },
    ],
    updatedAt: '2026-08-16',
  },
  {
    id: 'f3',
    title: 'Empleo que se enfría mientras el estímulo fiscal busca sostener la demanda',
    category: 'empleo',
    situation:
      'El desempleo subió por segundo mes consecutivo justo cuando el gobierno lanza un paquete de estímulo para pequeñas empresas, en un intento de contener el enfriamiento del consumo antes de que se profundice.',
    relatedNewsIds: ['n4', 'n7'],
    autoAnalysis: {
      summary:
        'El aumento del desempleo coincide con mayor participación laboral, lo que matiza la lectura negativa, pero la desaceleración salarial reduce el poder de compra justo cuando llega el estímulo fiscal, generando una carrera entre ambos efectos.',
      signals: [
        'La participación laboral crece más rápido que la creación de empleo',
        'El crecimiento salarial real se acerca a cero',
        'El estímulo fiscal tarda entre 2 y 3 trimestres en reflejarse en indicadores de empleo',
      ],
      generatedAt: '2026-08-15',
    },
    expertOpinions: [
      {
        analystId: 'a3',
        opinion:
          'El deterioro es más de composición que de destrucción de empleo: más gente busca trabajo activamente. Aun así, si los salarios no aceleran, el consumo se resentirá antes de que el estímulo haga efecto.',
        confidence: 4,
        horizon: 'corto',
        predictedEvents: [
          'El desempleo se estabiliza entre 4.2% y 4.5% en los próximos dos meses',
          'El gasto en bienes discrecionales se desacelera en el tercer trimestre',
          'Los efectos del estímulo fiscal se notan recién hacia fin de año',
        ],
        publishedAt: '2026-08-15',
      },
      {
        analystId: 'a1',
        opinion:
          'Este dato de empleo le da flexibilidad al banco central para pensar en recortes, ya que reduce el riesgo de una espiral salarios-precios. Es una pieza más a favor de un giro monetario más laxo.',
        confidence: 3,
        horizon: 'medio',
        predictedEvents: [
          'El banco central incorpora el dato como argumento adicional para recortar tasas',
          'Menor presión salarial reduce riesgo de inflación de servicios',
        ],
        publishedAt: '2026-08-15',
      },
    ],
    scenarios: [
      {
        id: 'f3-s1',
        label: 'Estabilización con apoyo del estímulo fiscal',
        probability: 0.5,
        horizon: 'medio',
        description:
          'El estímulo llega a tiempo para sostener a las pequeñas empresas y el desempleo se estabiliza sin deteriorarse más.',
        impacts: [
          'Consumo se mantiene resiliente hacia fin de año',
          'Menor presión para recortes agresivos de tasas',
        ],
      },
      {
        id: 'f3-s2',
        label: 'Enfriamiento se profundiza antes de que el estímulo haga efecto',
        probability: 0.35,
        horizon: 'corto',
        description:
          'El desfase entre el deterioro del empleo y la llegada efectiva del estímulo genera una desaceleración más marcada del consumo.',
        impacts: [
          'Caída en ventas minoristas durante 1 a 2 trimestres',
          'Mayor probabilidad de un recorte de tasas más temprano',
        ],
      },
      {
        id: 'f3-s3',
        label: 'Recuperación rápida del empleo formal',
        probability: 0.15,
        horizon: 'corto',
        description:
          'La nueva fuerza laboral se absorbe más rápido de lo previsto gracias a sectores en expansión.',
        impacts: ['Confirma resiliencia del mercado laboral', 'Reduce urgencia de estímulo adicional'],
      },
    ],
    updatedAt: '2026-08-15',
  },
  {
    id: 'f4',
    title: 'Petróleo al alza: ¿repunte pasajero o nueva tendencia?',
    category: 'energia',
    situation:
      'El recorte de producción de la OPEP+ empujó al crudo a su nivel más alto en ocho meses, con potencial de trasladarse a costos de transporte y manufactura si se sostiene.',
    relatedNewsIds: ['n5'],
    autoAnalysis: {
      summary:
        'Recortes de oferta de esta magnitud suelen sostenerse entre 2 y 4 meses antes de que la demanda o la producción no convencional compensen el ajuste. El impacto en inflación general depende de si otros componentes siguen a la baja.',
      signals: [
        'Los inventarios de crudo en países desarrollados están por debajo del promedio de 5 años',
        'La producción de esquisto podría responder con rezago de 2 a 3 meses',
        'La demanda estacional de combustible tiende a bajar en el corto plazo',
      ],
      generatedAt: '2026-08-14',
    },
    expertOpinions: [
      {
        analystId: 'a4',
        opinion:
          'El recorte es una señal de que la OPEP+ prioriza precio sobre volumen. Si se mantiene, veremos traslado a precios de transporte en 6 a 8 semanas, aunque el efecto sobre la inflación general será acotado.',
        confidence: 4,
        horizon: 'corto',
        predictedEvents: [
          'Aumento gradual de precios de combustible al consumidor',
          'Presión al alza en costos logísticos durante el próximo trimestre',
          'Posible respuesta de producción no convencional si el precio se sostiene sobre el nivel actual',
        ],
        publishedAt: '2026-08-14',
      },
      {
        analystId: 'a1',
        opinion:
          'Un shock de energía sostenido complicaría el escenario de recortes de tasas, ya que reintroduce presión inflacionaria justo cuando el banco central buscaba una señal más clara de enfriamiento.',
        confidence: 3,
        horizon: 'medio',
        predictedEvents: [
          'El banco central vigila de cerca el traspaso a precios antes de decidir sobre tasas',
          'Mayor volatilidad en expectativas de inflación de mercado',
        ],
        publishedAt: '2026-08-14',
      },
    ],
    scenarios: [
      {
        id: 'f4-s1',
        label: 'El repunte se modera en 2-3 meses',
        probability: 0.5,
        horizon: 'corto',
        description: 'La producción no convencional y la demanda estacional compensan el recorte de oferta.',
        impacts: ['Impacto inflacionario limitado', 'El escenario de recortes de tasas se mantiene intacto'],
      },
      {
        id: 'f4-s2',
        label: 'Precios altos se sostienen todo el trimestre',
        probability: 0.35,
        horizon: 'medio',
        description: 'La OPEP+ mantiene la disciplina de oferta y los precios permanecen elevados.',
        impacts: [
          'Traspaso visible a precios de transporte y manufactura',
          'El banco central se vuelve más cauteloso con recortes de tasas',
        ],
      },
      {
        id: 'f4-s3',
        label: 'Nuevo salto de precios por tensión geopolítica adicional',
        probability: 0.15,
        horizon: 'corto',
        description: 'Un evento geopolítico no anticipado reduce aún más la oferta disponible.',
        impacts: ['Riesgo de shock inflacionario', 'Posible intervención con reservas estratégicas'],
      },
    ],
    updatedAt: '2026-08-14',
  },
  {
    id: 'f5',
    title: 'La adopción de IA empieza a mostrarse en los resultados corporativos',
    category: 'tecnologia',
    situation:
      'Mientras las bolsas globales cierran mixtas a la espera de resultados, la adopción de inteligencia artificial en empresas medianas se triplicó en un año, sugiriendo que el próximo ciclo de ganancias podría empezar a reflejar mejoras de productividad.',
    relatedNewsIds: ['n6', 'n8'],
    autoAnalysis: {
      summary:
        'La brecha entre la rápida adopción de IA y su reflejo aún incipiente en resultados corporativos es típica de tecnologías de propósito general: la inversión antecede a la ganancia de productividad medible por varios trimestres.',
      signals: [
        'El gasto de capital en infraestructura de IA sigue creciendo más rápido que los ingresos asociados',
        'Empresas medianas reportan primeras reducciones de costos operativos atribuibles a IA',
        'La dispersión entre ganadores y rezagados sectoriales se amplía',
      ],
      generatedAt: '2026-08-13',
    },
    expertOpinions: [
      {
        analystId: 'a5',
        opinion:
          'Estamos en la fase de inversión pesada, no de cosecha. Las empresas medianas que ya reportan ahorros de costos serán las primeras en mostrar mejoras de margen visibles hacia 2027.',
        confidence: 3,
        horizon: 'medio',
        predictedEvents: [
          'Mejoras de margen medibles en empresas medianas early-adopters durante 2027',
          'Consolidación entre proveedores de herramientas de IA menos diferenciados',
          'Mayor escrutinio de inversores sobre el retorno del gasto en IA',
        ],
        publishedAt: '2026-08-13',
      },
      {
        analystId: 'a2',
        opinion:
          'El mercado seguirá premiando el gasto en IA en el corto plazo, pero la temporada de resultados actual será el primer filtro real: las empresas que no muestren un camino claro a monetización sufrirán correcciones bruscas.',
        confidence: 4,
        horizon: 'corto',
        predictedEvents: [
          'Mayor dispersión de rendimientos entre empresas tecnológicas según evidencia de monetización',
          'Correcciones puntuales en compañías con alto gasto y bajo retorno demostrado',
        ],
        publishedAt: '2026-08-13',
      },
    ],
    scenarios: [
      {
        id: 'f5-s1',
        label: 'Adopción se traduce en ganancias de productividad graduales',
        probability: 0.5,
        horizon: 'largo',
        description: 'Las mejoras de eficiencia se difunden progresivamente entre sectores durante 2027.',
        impacts: ['Sostén para márgenes corporativos', 'Presión moderada sobre demanda de empleo en tareas rutinarias'],
      },
      {
        id: 'f5-s2',
        label: 'Corrección de expectativas en la próxima temporada de resultados',
        probability: 0.3,
        horizon: 'corto',
        description: 'El mercado penaliza a empresas que no demuestren retorno claro sobre la inversión en IA.',
        impacts: ['Volatilidad concentrada en el sector tecnológico', 'Rotación hacia sectores con flujos más estables'],
      },
      {
        id: 'f5-s3',
        label: 'Aceleración más rápida de lo esperado',
        probability: 0.2,
        horizon: 'medio',
        description: 'La curva de adopción se acelera y los beneficios de productividad aparecen antes de lo previsto.',
        impacts: ['Sorpresas positivas de ganancias en empresas medianas', 'Renovado apetito inversor por el sector'],
      },
    ],
    updatedAt: '2026-08-13',
  },
  {
    id: 'f6',
    title: 'Crédito más barato choca con una oferta de vivienda que no reacciona',
    category: 'vivienda',
    situation:
      'Las tasas hipotecarias caen ante la expectativa de recortes del banco central, pero la construcción de vivienda nueva sigue sin acelerar al ritmo necesario para cerrar el déficit habitacional.',
    relatedNewsIds: ['n11', 'n12'],
    autoAnalysis: {
      summary:
        'Cuando la demanda reacciona más rápido que la oferta —típico tras una caída de tasas—, el patrón histórico es una recuperación de precios de vivienda antes que un repunte real de construcción, que suele rezagarse 2 a 4 trimestres por restricciones de permisos y mano de obra.',
      signals: [
        'Las solicitudes de hipoteca ya muestran un repunte del 12% intermensual',
        'Los permisos de construcción crecen solo 1.5% frente al 4% que requeriría cerrar el déficit',
        'El costo de materiales de construcción se mantiene estable, sin ser el cuello de botella',
      ],
      generatedAt: '2026-08-19',
    },
    expertOpinions: [
      {
        analystId: 'a6',
        opinion:
          'Vamos hacia una nueva fase de presión sobre precios: más compradores con acceso a crédito compitiendo por una oferta que no crece. Sin una respuesta regulatoria sobre permisos, el alivio de tasas se traduce en precios, no en más viviendas.',
        confidence: 4,
        horizon: 'medio',
        predictedEvents: [
          'Repunte de precios de vivienda usada en los próximos 2 trimestres',
          'Mayor competencia por vivienda de entrada, afectando a compradores primerizos',
          'Presión política por reformas a permisos de construcción locales',
        ],
        publishedAt: '2026-08-19',
      },
      {
        analystId: 'a1',
        opinion:
          'El repunte del sector inmobiliario es justo el tipo de señal que el banco central vigila para no recortar tasas demasiado rápido: no quiere reinflar una burbuja de precios de activos.',
        confidence: 3,
        horizon: 'medio',
        predictedEvents: [
          'El banco central menciona explícitamente el mercado de vivienda en su próxima comunicación',
          'Posible moderación en el ritmo de futuros recortes si los precios aceleran demasiado',
        ],
        publishedAt: '2026-08-19',
      },
    ],
    scenarios: [
      {
        id: 'f6-s1',
        label: 'Precios suben mientras la oferta se ajusta con rezago',
        probability: 0.5,
        horizon: 'medio',
        description: 'La demanda reactivada por el crédito más barato presiona precios antes de que la construcción responda.',
        impacts: ['Menor accesibilidad para compradores primerizos', 'Mayor atractivo de la vivienda como inversión'],
      },
      {
        id: 'f6-s2',
        label: 'Reformas de permisos aceleran la construcción',
        probability: 0.25,
        horizon: 'largo',
        description: 'Gobiernos locales responden a la presión política flexibilizando permisos y zonificación.',
        impacts: ['Alivio gradual del déficit habitacional', 'Impulso al empleo en construcción'],
      },
      {
        id: 'f6-s3',
        label: 'El banco central modera recortes por temor a burbuja de activos',
        probability: 0.25,
        horizon: 'medio',
        description: 'La aceleración de precios de vivienda lleva a una postura más cautelosa sobre el ritmo de bajadas de tasas.',
        impacts: ['Menor alivio del que el mercado espera en el crédito hipotecario', 'Mayor volatilidad en expectativas de tasas'],
      },
    ],
    updatedAt: '2026-08-19',
  },
  {
    id: 'f7',
    title: 'Cripto entre la liquidez fácil y una regulación más estricta',
    category: 'cripto',
    situation:
      'Bitcoin repunta con fuerza ante expectativas de condiciones financieras más laxas, justo cuando los reguladores europeos endurecen las reglas para stablecoins, dos fuerzas que tironean en direcciones opuestas.',
    relatedNewsIds: ['n13', 'n14'],
    autoAnalysis: {
      summary:
        'Los repuntes de criptoactivos ligados a expectativas de liquidez tienden a ser más volátiles que los impulsados por adopción real. La nueva regulación de stablecoins, al reducir el riesgo sistémico percibido, podría paradójicamente atraer capital institucional a mediano plazo.',
      signals: [
        'La correlación entre bitcoin y los índices de renta variable de alto crecimiento se mantiene elevada',
        'El volumen en stablecoins reguladas crece más rápido que en las no reguladas desde el anuncio',
        'Los flujos hacia productos cotizados de criptoactivos se aceleran en las últimas dos semanas',
      ],
      generatedAt: '2026-08-19',
    },
    expertOpinions: [
      {
        analystId: 'a7',
        opinion:
          'El repunte actual está más ligado a expectativas de liquidez que a un cambio estructural de adopción, lo que lo hace vulnerable a una corrección si el banco central sorprende manteniendo tasas.',
        confidence: 3,
        horizon: 'corto',
        predictedEvents: [
          'Alta volatilidad de bitcoin alrededor de la próxima reunión del banco central',
          'Mayor diferenciación entre criptoactivos regulados y no regulados en flujos institucionales',
        ],
        publishedAt: '2026-08-19',
      },
      {
        analystId: 'a2',
        opinion:
          'La regulación de stablecoins, aunque restrictiva en lo inmediato, es el tipo de marco que los grandes inversores institucionales necesitaban para entrar con más confianza al sector.',
        confidence: 3,
        horizon: 'largo',
        predictedEvents: [
          'Entrada gradual de nuevos productos institucionales sobre stablecoins reguladas',
          'Consolidación de emisores de stablecoins que no cumplan los nuevos requisitos',
        ],
        publishedAt: '2026-08-19',
      },
    ],
    scenarios: [
      {
        id: 'f7-s1',
        label: 'Corrección tras el exceso de optimismo sobre tasas',
        probability: 0.4,
        horizon: 'corto',
        description: 'Si el banco central no confirma el recorte esperado, el repunte cripto se revierte parcialmente.',
        impacts: ['Alta volatilidad de corto plazo', 'Liquidaciones en posiciones apalancadas'],
      },
      {
        id: 'f7-s2',
        label: 'Adopción institucional se acelera con el nuevo marco regulatorio',
        probability: 0.35,
        horizon: 'largo',
        description: 'La claridad regulatoria sobre stablecoins atrae capital institucional de forma sostenida.',
        impacts: ['Menor volatilidad estructural en el mediano plazo', 'Mayor integración con el sistema financiero tradicional'],
      },
      {
        id: 'f7-s3',
        label: 'El repunte se sostiene y se amplía a otros criptoactivos',
        probability: 0.25,
        horizon: 'medio',
        description: 'La combinación de liquidez y regulación más clara sostiene el rally más allá de bitcoin.',
        impacts: ['Mayor apetito de riesgo generalizado', 'Renovado interés minorista en el sector'],
      },
    ],
    updatedAt: '2026-08-19',
  },
]

export function getForecast(id: string): Forecast | undefined {
  return forecasts.find((f) => f.id === id)
}
