/* ==========================================================================
   GINA Dental Studio / Clínica Dental SIRO — datos de tratamientos
   Contenido original de la propuesta de rediseño (no copiado del sitio real).
   ========================================================================== */
const GINA_TREATMENTS = [
  {
    slug: "ortodoncia-invisible",
    name: "Ortodoncia invisible",
    category: "Ortodoncia",
    icon: "fa-teeth-open",
    tagline: "Alinea tu sonrisa sin que nadie lo note.",
    summary: "Alineadores transparentes y removibles con seguimiento digital SureSmile®, para corregir tu mordida con total discreción.",
    paragraphs: [
      "La ortodoncia invisible sustituye los brackets metálicos por un juego de alineadores transparentes hechos a medida, diseñados a partir de un escaneo digital 3D de tu boca.",
      "Cada dos semanas cambias de alineador, y tu equipo dental supervisa el progreso comparando tu evolución real con la simulación digital inicial, ajustando el plan si es necesario.",
      "Al ser removibles, puedes comer, cepillarte y usar hilo dental con total normalidad, algo que no es posible con la ortodoncia tradicional."
    ],
    benefits: [
      "Prácticamente invisibles en el día a día",
      "Removibles para comer y para la higiene diaria",
      "Simulación 3D del resultado final antes de empezar",
      "Menos visitas a la clínica gracias al seguimiento digital"
    ],
    duration: "6–14 meses",
    sessions: "Revisión cada 6-8 semanas",
    idealFor: "Adultos y adolescentes con apiñamiento leve o moderado"
  },
  {
    slug: "blanqueamiento-dental",
    name: "Blanqueamiento dental",
    category: "Estética",
    icon: "fa-sun",
    tagline: "La sonrisa blanca y luminosa que siempre quisiste.",
    summary: "Aclaramos el tono de tus dientes varios niveles en una sesión, con un gel profesional activado por luz LED fría.",
    paragraphs: [
      "Nuestro protocolo de blanqueamiento combina un gel de peróxido de alta concentración de uso exclusivo clínico con activación por luz LED fría, minimizando la sensibilidad dental posterior.",
      "Antes de comenzar, revisamos el estado de tus encías y esmalte para asegurarnos de que el tratamiento es seguro y te explicamos exactamente cuántos tonos podrás ganar.",
      "Además, te entregamos un kit de mantenimiento para prolongar el resultado durante meses."
    ],
    benefits: [
      "Resultados visibles en una sola sesión de 60 minutos",
      "Protocolo de baja sensibilidad",
      "Kit de mantenimiento incluido",
      "Compatible con carillas y coronas existentes"
    ],
    duration: "1 sesión de 60 min",
    sessions: "1-2 sesiones según el caso",
    idealFor: "Cualquier persona con dientes sanos que busque un tono más blanco"
  },
  {
    slug: "carillas-dentales",
    name: "Carillas dentales",
    category: "Estética",
    icon: "fa-gem",
    tagline: "Transforma tu sonrisa con un diseño digital previo.",
    summary: "Láminas ultrafinas de porcelana que corrigen forma, color y pequeñas imperfecciones, diseñadas primero en pantalla.",
    paragraphs: [
      "Antes de tocar tus dientes, diseñamos digitalmente tu nueva sonrisa (Digital Smile Design) para que puedas verla y aprobarla antes de fabricar las carillas definitivas.",
      "Las carillas de porcelana son extremadamente finas, por lo que requieren un desgaste mínimo o nulo del diente natural, y su superficie imita a la perfección el brillo del esmalte real.",
      "Es una de las soluciones más solicitadas para cerrar pequeños espacios, alargar dientes desgastados o unificar el color de toda la arcada."
    ],
    benefits: [
      "Diseño de sonrisa digital antes de empezar",
      "Desgaste mínimo del diente natural",
      "Resistentes a manchas y muy duraderas",
      "Resultado natural indistinguible del esmalte"
    ],
    duration: "2-3 semanas",
    sessions: "2-3 citas",
    idealFor: "Manchas, desgaste, espacios o dientes irregulares"
  },
  {
    slug: "implantes-dentales",
    name: "Implantes dentales",
    category: "Cirugía",
    icon: "fa-bone",
    tagline: "La solución definitiva a la falta de dientes.",
    summary: "Sustituimos la raíz del diente perdido con un implante de titanio biocompatible y colocamos una corona a medida.",
    paragraphs: [
      "El implante dental es un pequeño tornillo de titanio que se integra con el hueso maxilar, actuando como una raíz artificial sobre la que se ancla la corona definitiva.",
      "Gracias a la planificación guiada por ordenador, calculamos la posición exacta del implante con precisión milimétrica, reduciendo el tiempo de cirugía y la incomodidad posterior.",
      "Es la alternativa más estable y duradera frente a las prótesis removibles, y evita la pérdida de hueso asociada a los espacios sin diente."
    ],
    benefits: [
      "Planificación 3D guiada por ordenador",
      "Recupera función masticatoria completa",
      "No daña los dientes vecinos, a diferencia de un puente",
      "Puede durar décadas con buenos cuidados"
    ],
    duration: "3-6 meses (con integración ósea)",
    sessions: "Cirugía + revisiones periódicas",
    idealFor: "Pérdida de una o varias piezas dentales"
  },
  {
    slug: "implantes-carga-inmediata",
    name: "Implantes de carga inmediata",
    category: "Cirugía",
    icon: "fa-bolt",
    tagline: "Recupera mucho más que la sonrisa, en un solo día.",
    summary: "Colocamos el implante y una prótesis provisional funcional el mismo día de la cirugía.",
    paragraphs: [
      "A diferencia del implante convencional, la carga inmediata permite colocar una prótesis provisional fija el mismo día de la cirugía, sin esperar meses con la boca sin dientes.",
      "Está especialmente indicada en casos de pérdida total o de varias piezas contiguas, donde la calidad y cantidad de hueso disponible lo permiten.",
      "Tras la fase de cicatrización, sustituimos la prótesis provisional por la definitiva, ajustada con la máxima precisión estética y funcional."
    ],
    benefits: [
      "Sales de la clínica con dientes fijos el mismo día",
      "Ideal para rehabilitaciones completas (All-on-4)",
      "Recuperación más rápida de la función masticatoria",
      "Menos impacto emocional que llevar una boca sin dientes"
    ],
    duration: "1 día para la carga provisional",
    sessions: "Cirugía + control a los 3-6 meses",
    idealFor: "Pérdida total o de varias piezas contiguas"
  },
  {
    slug: "coronas-puentes",
    name: "Coronas y puentes dentales",
    category: "Prótesis",
    icon: "fa-crown",
    tagline: "Recupera la funcionalidad y estética de tu sonrisa.",
    summary: "Restauramos dientes muy dañados o sustituimos piezas perdidas apoyándonos en los dientes adyacentes.",
    paragraphs: [
      "Una corona recubre por completo un diente debilitado por caries extensas, fracturas o tras una endodoncia, devolviéndole su forma, resistencia y aspecto original.",
      "Un puente, por su parte, sustituye una o varias piezas perdidas apoyándose en los dientes contiguos, evitando así que el resto de la arcada se desplace con el tiempo.",
      "Trabajamos con cerámicas de alta resistencia que reproducen fielmente la translucidez y el color del diente natural."
    ],
    benefits: [
      "Recupera la función masticatoria por completo",
      "Evita el desplazamiento de los dientes vecinos",
      "Materiales cerámicos de aspecto natural",
      "Alternativa fija frente a las prótesis removibles"
    ],
    duration: "2-3 semanas",
    sessions: "2-3 citas",
    idealFor: "Dientes muy dañados o ausencias puntuales"
  },
  {
    slug: "protesis-dentales",
    name: "Prótesis dentales",
    category: "Prótesis",
    icon: "fa-teeth",
    tagline: "¿Dientes perdidos? Hay una solución para cada caso.",
    summary: "Diseñamos prótesis removibles completas o parciales, cómodas, estéticas y adaptadas a tu boca.",
    paragraphs: [
      "Cuando la opción de implantes no es viable o no se desea, las prótesis removibles siguen siendo una solución eficaz para recuperar la función y la estética de la sonrisa.",
      "Tomamos registros precisos de tu boca para fabricar una prótesis completa o parcial que se ajuste con comodidad y no se mueva al hablar o comer.",
      "Revisamos periódicamente el ajuste, ya que la forma de las encías cambia ligeramente con el tiempo."
    ],
    benefits: [
      "Solución económica frente a otras alternativas",
      "Diseño personalizado para un ajuste cómodo",
      "Mejora inmediata de la masticación y el habla",
      "Revisiones incluidas para mantener el ajuste"
    ],
    duration: "3-4 semanas",
    sessions: "3-4 citas",
    idealFor: "Pérdida total o parcial de piezas dentales"
  },
  {
    slug: "odontologia-conservadora",
    name: "Odontología conservadora",
    category: "Salud bucal",
    icon: "fa-layer-group",
    tagline: "Reconstrucciones dentales con soluciones avanzadas.",
    summary: "Reparamos caries y fracturas con materiales estéticos que devuelven forma y función al diente original.",
    paragraphs: [
      "La odontología conservadora agrupa los tratamientos destinados a reparar el diente dañado por caries, desgaste o fracturas, conservando la mayor cantidad posible de estructura natural.",
      "Utilizamos resinas compuestas de última generación, estratificadas capa a capa para reproducir con fidelidad el color y la translucidez del diente.",
      "Cuanto antes se detecta una caries, más conservador y económico es el tratamiento — por eso recomendamos revisiones cada seis meses."
    ],
    benefits: [
      "Conserva al máximo el diente natural",
      "Resinas estéticas indistinguibles a simple vista",
      "Tratamiento en una sola visita en la mayoría de casos",
      "Frena la progresión de la caries"
    ],
    duration: "30-60 min por pieza",
    sessions: "1 cita por diente",
    idealFor: "Caries, fracturas o desgaste dental"
  },
  {
    slug: "endodoncia",
    name: "Endodoncia",
    category: "Salud bucal",
    icon: "fa-syringe",
    tagline: "La alternativa para salvar tus dientes.",
    summary: "Tratamos la infección del nervio dental para eliminar el dolor y conservar la pieza sin necesidad de extraerla.",
    paragraphs: [
      "Cuando la caries o una fractura alcanza el nervio del diente, aparece una inflamación o infección que provoca un dolor intenso. La endodoncia elimina ese tejido afectado y sella el conducto para detener la infección.",
      "Trabajamos con localizadores de ápice y magnificación óptica para garantizar la máxima precisión, minimizando las molestias durante y después del tratamiento.",
      "Tras la endodoncia, en la mayoría de los casos recomendamos colocar una corona para proteger el diente, que queda más frágil."
    ],
    benefits: [
      "Elimina el dolor de origen nervioso",
      "Evita la extracción del diente natural",
      "Tecnología de localización de precisión",
      "Procedimiento prácticamente indoloro con anestesia local"
    ],
    duration: "60-90 min",
    sessions: "1-2 citas",
    idealFor: "Dolor dental agudo o infección del nervio"
  },
  {
    slug: "periodoncia",
    name: "Periodoncia",
    category: "Salud bucal",
    icon: "fa-tooth",
    tagline: "Tratamos y prevenimos enfermedades de las encías.",
    summary: "Curetajes, tratamiento de periimplantitis y cirugía mucogingival para frenar la pérdida de encía y hueso.",
    paragraphs: [
      "La enfermedad periodontal es una infección crónica de las encías que, sin tratamiento, provoca la pérdida progresiva del hueso que sostiene los dientes.",
      "Realizamos curetajes y raspados para eliminar el sarro bajo la encía, tratamos casos de periimplantitis alrededor de implantes, y ofrecemos cirugía mucogingival para casos más avanzados.",
      "Un mantenimiento periodontal periódico es clave para conservar los dientes a largo plazo, especialmente en pacientes con antecedentes de sangrado o movilidad dental."
    ],
    benefits: [
      "Detiene la progresión de la enfermedad de encías",
      "Reduce el sangrado y la inflamación",
      "Protege los implantes frente a la periimplantitis",
      "Planes de mantenimiento personalizados"
    ],
    duration: "45-60 min por sesión",
    sessions: "2-4 sesiones + mantenimiento",
    idealFor: "Sangrado, movilidad o retracción de encías"
  },
  {
    slug: "higiene-dental",
    name: "Higiene dental profesional",
    category: "Salud bucal",
    icon: "fa-droplet",
    tagline: "Una sonrisa limpia, la base de todo lo demás.",
    summary: "Eliminamos placa y sarro con ultrasonidos y pulido, previniendo caries y enfermedad de encías.",
    paragraphs: [
      "La limpieza dental profesional elimina la placa bacteriana y el sarro acumulado en zonas que el cepillado diario no alcanza, especialmente entre los dientes y bajo la línea de la encía.",
      "Usamos ultrasonidos de baja frecuencia para un resultado eficaz y cómodo, seguido de un pulido que deja la superficie del diente lisa y menos propensa a nuevas acumulaciones.",
      "Recomendamos una higiene profesional cada 6 meses como base de cualquier plan de salud bucodental."
    ],
    benefits: [
      "Previene caries y enfermedad periodontal",
      "Elimina manchas superficiales de café, té o tabaco",
      "Aliento más fresco de forma duradera",
      "Sesión rápida y prácticamente indolora"
    ],
    duration: "30-40 min",
    sessions: "Cada 6 meses",
    idealFor: "Mantenimiento preventivo, recomendado para todos"
  },
  {
    slug: "odontopediatria",
    name: "Odontopediatría",
    category: "Infantil",
    icon: "fa-child-reaching",
    tagline: "La primera visita al dentista, sin miedo.",
    summary: "Cuidamos la salud bucal de los más pequeños en un ambiente cercano, pensado para que pierdan el miedo al dentista.",
    paragraphs: [
      "La odontopediatría se ocupa de la prevención y el tratamiento bucodental de bebés, niños y adolescentes, adaptando cada explicación y cada gesto a su edad.",
      "Priorizamos siempre la prevención: sellado de fisuras, aplicaciones de flúor y educación en hábitos de higiene, para evitar problemas mayores en el futuro.",
      "Nuestro objetivo es que cada visita sea una experiencia positiva, para que de adultos no arrastren miedo al dentista."
    ],
    benefits: [
      "Ambiente y trato adaptado a cada edad",
      "Programas de prevención de caries infantil",
      "Seguimiento de la erupción y el desarrollo dental",
      "Primeras visitas pensadas para generar confianza"
    ],
    duration: "20-30 min",
    sessions: "Revisión cada 6 meses",
    idealFor: "Bebés, niños y adolescentes"
  },
  {
    slug: "cirugia-oral",
    name: "Cirugía oral",
    category: "Cirugía",
    icon: "fa-hand-holding-medical",
    tagline: "Recupera tu salud bucal con cirugía especializada.",
    summary: "Extracciones simples y complejas, incluidas muelas del juicio, con protocolos de recuperación cómoda.",
    paragraphs: [
      "La cirugía oral incluye desde extracciones simples hasta procedimientos más complejos como la extracción de muelas del juicio incluidas o mal posicionadas.",
      "Planificamos cada intervención con estudio radiográfico previo para anticipar cualquier dificultad y minimizar el tiempo de recuperación.",
      "Te entregamos instrucciones postoperatorias claras y estamos disponibles ante cualquier duda durante los días siguientes."
    ],
    benefits: [
      "Estudio radiográfico previo a cada cirugía",
      "Protocolos de recuperación más cómoda",
      "Atención especializada en casos complejos",
      "Seguimiento postoperatorio cercano"
    ],
    duration: "20-60 min según el caso",
    sessions: "1 intervención + revisión",
    idealFor: "Muelas del juicio, extracciones complejas"
  },
  {
    slug: "elevacion-seno-maxilar",
    name: "Elevación de seno maxilar",
    category: "Cirugía",
    icon: "fa-lungs",
    tagline: "Procedimiento para aumentar la altura del hueso maxilar.",
    summary: "Aumentamos la cantidad de hueso disponible en el maxilar superior para poder colocar implantes con seguridad.",
    paragraphs: [
      "En el maxilar superior posterior, la pérdida de dientes junto con la proximidad del seno maxilar puede dejar poco hueso disponible para colocar un implante con garantías.",
      "La elevación de seno consiste en desplazar suavemente la membrana sinusal y rellenar el espacio con un material regenerativo que, con el tiempo, se convierte en hueso propio.",
      "Es un procedimiento muy predecible que ampliamos con años de experiencia, y que permite colocar implantes donde antes no era posible."
    ],
    benefits: [
      "Hace posible el implante en maxilares con poco hueso",
      "Procedimiento predecible y ampliamente documentado",
      "Puede combinarse con la colocación del implante",
      "Resultados estables a largo plazo"
    ],
    duration: "45-90 min",
    sessions: "1 intervención + espera de integración",
    idealFor: "Maxilar superior con hueso insuficiente para implantes"
  },
  {
    slug: "atm-bruxismo",
    name: "ATM y bruxismo",
    category: "Salud bucal",
    icon: "fa-moon",
    tagline: "Recupera el equilibrio y bienestar de tu mordida.",
    summary: "Diagnosticamos y tratamos el dolor mandibular y el desgaste dental provocado por apretar o rechinar los dientes.",
    paragraphs: [
      "El bruxismo (apretar o rechinar los dientes, a menudo durante el sueño) puede provocar dolor mandibular, dolores de cabeza y un desgaste progresivo del esmalte.",
      "Evaluamos la articulación temporomandibular (ATM) y diseñamos una férula de descarga a medida que protege tus dientes y relaja la musculatura durante la noche.",
      "En los casos más persistentes, combinamos la férula con pautas de fisioterapia y control del estrés para abordar el origen del problema."
    ],
    benefits: [
      "Reduce el dolor mandibular y de cabeza",
      "Frena el desgaste progresivo del esmalte",
      "Férulas de descarga hechas a medida",
      "Enfoque integral junto con hábitos de higiene del sueño"
    ],
    duration: "Adaptación 2-4 semanas",
    sessions: "Diagnóstico + revisiones periódicas",
    idealFor: "Dolor mandibular, desgaste dental, bruxismo nocturno"
  },
  {
    slug: "ortodoncia-convencional",
    name: "Ortodoncia convencional",
    category: "Ortodoncia",
    icon: "fa-grip-lines",
    tagline: "Alinea tus dientes de forma eficaz y económica.",
    summary: "Brackets metálicos o estéticos para corregir maloclusiones de cualquier complejidad, con la mejor relación coste-resultado.",
    paragraphs: [
      "La ortodoncia con brackets sigue siendo la opción más eficaz y económica para corregir maloclusiones complejas, apiñamientos severos o problemas de mordida.",
      "Ofrecemos brackets metálicos de baja fricción y brackets estéticos, más discretos, en función de tus preferencias y presupuesto.",
      "Realizamos ajustes periódicos para ir guiando el movimiento dental hasta alcanzar la posición planificada desde el inicio del tratamiento."
    ],
    benefits: [
      "La opción más económica para casos complejos",
      "Eficaz en cualquier tipo de maloclusión",
      "Opción de brackets estéticos disponibles",
      "Décadas de eficacia clínica demostrada"
    ],
    duration: "12-24 meses",
    sessions: "Ajuste cada 4-6 semanas",
    idealFor: "Maloclusiones moderadas o severas"
  },
  {
    slug: "armonizacion-orofacial",
    name: "Armonización orofacial y estética facial",
    category: "Estética",
    icon: "fa-spa",
    tagline: "Resalta la belleza de tu rostro junto con tu sonrisa.",
    summary: "Tratamientos de ácido hialurónico y toxina botulínica para complementar tu sonrisa dentro de la armonía de tu rostro.",
    paragraphs: [
      "La sonrisa no vive aislada: forma parte de la armonía general del rostro. Por eso complementamos los tratamientos dentales con procedimientos de estética facial mínimamente invasivos.",
      "Utilizamos ácido hialurónico para definir labios y surcos, y toxina botulínica para suavizar líneas de expresión y tratar casos de bruxismo o sonrisa gingival.",
      "Cada plan se diseña de forma personalizada, buscando siempre un resultado natural y proporcionado."
    ],
    benefits: [
      "Complementa el resultado de tu tratamiento dental",
      "Procedimientos mínimamente invasivos",
      "Resultado natural y progresivo",
      "Realizado por profesionales con formación específica"
    ],
    duration: "20-30 min",
    sessions: "Según el plan personalizado",
    idealFor: "Quienes buscan armonizar sonrisa y rostro"
  }
];

if (typeof module !== "undefined") { module.exports = GINA_TREATMENTS; }
