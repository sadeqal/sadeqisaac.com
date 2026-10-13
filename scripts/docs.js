/* ==========================================================================
   INDRA · Configuración de Plataformas Aéreas — docs.js
   Datos + render + navegación (sin dependencias)
   Rutas:  #/                       → inicio
           #/<modelo>               → esquema del modelo
           #/<modelo>/<capítulo>    → libro abierto en ese capítulo
           #/<modelo>/<cap>/<sub>   → libro abierto en una subsección
   ========================================================================== */
(() => {
  'use strict';

  const IMG = '../images/docs/';

  /* ------------------------------------------------------------------ */
  /* MODELOS                                                            */
  /* ------------------------------------------------------------------ */
  const MODELS = [
    { id: 'tarsis-v20', name: 'TARSIS VTOL F50 V2.0', family: 'TARSIS', img: 'tarsis-vtol-f50-v2.0.png', ready: false },
    { id: 'tarsis-v31', name: 'TARSIS VTOL F50 V3.1', family: 'TARSIS', img: 'tarsis-vtol-f50-v3.1.png', ready: true,
      tag: 'E-VTOL · CUAV X25 EVO', lead: 'Pasa el ratón (o toca) sobre cualquier equipo para abrir su configuración completa, directamente en el punto que necesitas.' },
    { id: 'tarsis-v32', name: 'TARSIS VTOL F50 V3.2', family: 'TARSIS', img: 'tarsis-vtol-f50-v3.2.png', ready: false },
    { id: 'mfe-fighter', name: 'MakeFlyEasy (MFE) VTOL Fighter', family: 'MFE', img: 'mfe-vtol-fighter.png', ready: false },
    { id: 'mfe-pioneer', name: 'MFE Pioneer', family: 'MFE', img: 'mfe-pioneer.png', ready: false },
    { id: 'drizzle-1', name: 'DRIZZLE I', family: 'DRIZZLE', img: 'drizzle-i.png', ready: false }
  ];

  /* ------------------------------------------------------------------ */
  /* COMPONENTES (TARSIS V3.1)                                          */
  /* Se colocan en círculo en este orden, empezando arriba.             */
  /* ------------------------------------------------------------------ */
  const COMPONENTS = [
    { id: 'autopiloto', center: true, name: 'Autopiloto', model: 'CUAV X25 EVO', img: 'cuav-x25evo.png', icon: 'chip' },
    { id: 'receptor', name: 'Receptor de mando', model: 'FrSky TD SR18', img: 'frsky-tdsr18.png', icon: 'radio' },
    { id: 'gnss', name: 'GNSS + brújula', model: 'CUAV NEO 3 Pro', img: 'cuav-neo3pro.png', icon: 'gps' },
    { id: 'pitot', name: 'Velocidad aire', model: 'CUAV SKYE 2 Nano', img: 'cuav-skye-nano2.png', icon: 'pitot' },
    { id: 'servos', name: 'Servos de superficies', model: 'Futaba BLA21 ×4', img: 'futaba-servo.png', icon: 'servo' },
    { id: 'esc-vertical', name: 'ESC + motores verticales', model: 'T-Motor VL200A / VL1165', img: 'tmotor-vl1165.png', icon: 'motor' },
    { id: 'motor-cola', name: 'ESC + motor de cola', model: 'T-Motor Thunder 200A', img: 'tmotor-thunder.png', icon: 'prop' },
    { id: 'baterias', name: 'Baterías', model: 'FCC · Cola · Booms', img: 'batt.png', icon: 'battery' },
    { id: 'pmu-cola', name: 'PMU de cola', model: 'Holybro PM08-CAN', img: 'holybro-pm08-can.png', icon: 'power' },
    { id: 'pmu-avionica', name: 'PMU aviónica', model: 'CUAV PMU 2 Lite', img: 'cuav-pmu2lite.png', icon: 'power' },
    { id: 'video', name: 'Vídeo FPV + relé', model: 'DJI O3 Air Unit', img: 'dji-o3air.png', icon: 'cam' },
    { id: 'radio', name: 'Radioenlace', model: 'Silvus SC4200', img: 'silvus4200.png', icon: 'antenna' },
    { id: 'can', name: 'Bus CAN', model: 'CAN2 · 8 nodos', img: 'bus-can-terminadores.png', icon: 'can' }
  ];

  const ICONS = {
    chip: '<rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M9 3v4M12 3v4M15 3v4M9 17v4M12 17v4M15 17v4M3 9h4M3 12h4M3 15h4M17 9h4M17 12h4M17 15h4"/>',
    radio: '<path d="M4 9h16v10H4zM8 9l8-5M8 14h4"/><circle cx="16" cy="14" r="1.5"/>',
    gps: '<circle cx="12" cy="12" r="4"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
    pitot: '<path d="M3 12h13l5-2v4l-5-2M8 12v5"/>',
    servo: '<rect x="4" y="8" width="12" height="9" rx="1.5"/><path d="M16 12h5M8 8V5"/><circle cx="10" cy="12.5" r="2"/>',
    motor: '<circle cx="12" cy="12" r="3"/><path d="M12 9V3M14.6 13.5l5.2 3M9.4 13.5l-5.2 3"/>',
    prop: '<path d="M3 12h6M12 4c3 2 3 6 0 8-3-2-3-6 0-8Zm0 8c3 2 3 6 0 8-3-2-3-6 0-8Z"/>',
    battery: '<rect x="3" y="8" width="16" height="9" rx="1.5"/><path d="M21 11v3M7 11v3M11 11v3"/>',
    power: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
    cam: '<rect x="3" y="7" width="13" height="10" rx="2"/><path d="m16 11 5-3v8l-5-3"/>',
    antenna: '<path d="M12 12v9M8 21h8"/><circle cx="12" cy="9" r="2"/><path d="M7.5 4.5a6.5 6.5 0 0 0 0 9M16.5 4.5a6.5 6.5 0 0 1 0 9"/>',
    can: '<path d="M4 8h16M4 16h16M8 8v8M16 8v8"/><circle cx="8" cy="8" r="1"/><circle cx="16" cy="16" r="1"/>'
  };
  const icon = (n) => `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;

  /* ------------------------------------------------------------------ */
  /* CONTENIDO DEL LIBRO · TARSIS V3.1                                  */
  /* Tipos de bloque: p h ul ol table note fig conn                     */
  /* note.k: info | warn | ok | pend (pendiente de documentar)          */
  /* ------------------------------------------------------------------ */
  const PEND = (x) => ({ t: 'note', k: 'pend', x });
  const FIG = (src, cap) => ({ t: 'fig', src, cap });
  /* Tabla de parámetros reales leídos del dump "Params VTOL F50, 07-10-2026" */
  const PARAMS = (rows, cap = 'Parámetros a revisar en el autopiloto') =>
    ({ t: 'table', cap, head: ['Parámetro', 'Valor real (dump 07/10/2026)', 'Descripción'], mono: [0, 1], cls: 'tablewrap--params', rows });
  /* Diagrama de conexión equipo ↔ autopiloto (ver CONN más abajo) */
  const CONN = (compId) => ({ t: 'conn', comp: compId });

  /* ------------------------------------------------------------------ */
  /* CONEXIONES · equipo ↔ autopiloto (para el diagrama SVG de cada capítulo) */
  /* ------------------------------------------------------------------ */
  const CONN_LINKS = {
    receptor: [{ label: 'RC IN (21) · SBUS', color: '#1e88e5' }],
    gnss: [{ label: 'CAN1 · puerto 1 (04) · CAN_H', color: '#f9a825' }, { label: 'CAN1 · puerto 1 (04) · CAN_L', color: '#2e7d32' }],
    pitot: [{ label: 'CAN1 · puerto 2 (05) · CAN_H', color: '#f9a825' }, { label: 'CAN1 · puerto 2 (05) · CAN_L', color: '#2e7d32' }],
    servos: [{ label: 'M1 / M2 / M4 / M9 · PWM', color: '#1e88e5' }, { label: 'CAN2 · puerto 09 · DroneCAN', color: '#f9a825' }],
    'esc-vertical': [{ label: 'M5 · M6 · M7 · M8 · PWM', color: '#1e88e5' }, { label: 'CAN2 · puerto 09 · DroneCAN', color: '#f9a825' }],
    'motor-cola': [{ label: 'M3 · PWM', color: '#1e88e5' }],
    'pmu-cola': [{ label: 'CAN1 · puerto 3 (06) · DroneCAN', color: '#f9a825' }],
    'pmu-avionica': [{ label: 'POWER C1 (22) · 15 V', color: '#d32f2f' }, { label: 'CAN1 · DroneCAN', color: '#f9a825' }],
    video: [{ label: 'TELEM1 (01) · TX FC → RX O3', color: '#8e24aa' }, { label: 'TELEM1 (01) · RX FC ← TX O3', color: '#00acc1' }, { label: 'M13 · relé (GPIO 62)', color: '#1e88e5', dash: '3 3' }],
    radio: [{ label: 'ETH (03) · TX±', color: '#ef6c00' }, { label: 'ETH (03) · RX±', color: '#6d4c41' }],
    can: [{ label: 'CAN1 · GNSS · Pitot · PMU cola', color: '#f9a825' }, { label: 'CAN2 · 8 nodos servos/ESC', color: '#2e7d32' }]
  };
  function connSVG(compId) {
    const c = compById(compId);
    const links = CONN_LINKS[compId];
    if (!c || !links) return '';
    const rowH = 40, top = 30;
    const h = top * 2 + (links.length - 1) * rowH + 70;
    const midY = h / 2;
    const rows = links.map((l, i) => {
      const y = top + 35 + i * rowH;
      return `<g>
        <line x1="96" y1="${y}" x2="244" y2="${y}" stroke="${l.color}" stroke-width="4" ${l.dash ? `stroke-dasharray="${l.dash}"` : ''}/>
        <circle cx="96" cy="${y}" r="4" fill="${l.color}"/><circle cx="244" cy="${y}" r="4" fill="${l.color}"/>
        <text x="170" y="${y - 9}" text-anchor="middle" class="conn__lbl">${esc(l.label)}</text>
      </g>`;
    }).join('');
    return `<div class="connwrap">
      <svg class="connsvg" viewBox="0 0 340 ${h}" role="img" aria-label="Conexi\u00f3n entre el autopiloto y ${esc(c.name)}">
        <rect x="4" y="${midY - 34}" width="90" height="68" rx="14" class="conn__box conn__box--ap"/>
        <text x="49" y="${midY - 6}" text-anchor="middle" class="conn__t conn__t--b">CUAV</text>
        <text x="49" y="${midY + 12}" text-anchor="middle" class="conn__t">X25 EVO</text>
        ${rows}
        <rect x="246" y="${midY - 34}" width="90" height="68" rx="14" class="conn__box conn__box--comp"/>
        <text x="291" y="${midY - 6}" text-anchor="middle" class="conn__t conn__t--b">${esc(c.model.split(' ')[0])}</text>
        <text x="291" y="${midY + 12}" text-anchor="middle" class="conn__t">${esc(c.model.split(' ').slice(1).join(' '))}</text>
      </svg>
    </div>`;
  }

  const BOOK = {
    meta: {
      title: 'Definición de Configuración VTOL F50 V3.1',
      doc: 'U-SCUAR-WK-9441505900-DES004',
      fw: 'ArduPlane v4.7.1',
      fecha: '09/10/2026',
      autores: 'Marta Sánchez · Sergio García',
      revisor: 'Sadeq Isaac'
    },
    groups: [
      { id: 'g-general', title: 'Información general', items: ['objeto', 'alcance', 'elementos', 'esquema', 'nomenclatura'] },
      { id: 'g-comp', title: 'Componentes', items: COMPONENTS.map(c => c.id) },
      { id: 'g-proc', title: 'Procedimientos generales', items: ['calibracion', 'prueba-motores', 'modos', 'transicion', 'ganancias'] }
    ],
    chapters: {
      /* ---------------------------- GENERAL ---------------------------- */
      objeto: {
        title: 'Objeto',
        blocks: [
          { t: 'p', x: 'Este documento tiene como objetivo **asegurar la correcta configuración de todo el sistema Ardupilot** según el último firmware estable (**v4.7.1**), tanto para los equipos de hardware como de software.' },
          { t: 'p', x: 'Se presentan todas las configuraciones previas necesarias para que el sistema funcione correctamente, ordenadas por equipo para poder localizar cada ajuste de forma inmediata.' }
        ]
      },
      alcance: {
        title: 'Alcance',
        blocks: [
          { t: 'p', x: 'El documento abarca tanto las **configuraciones previas** al primer vuelo como los **ajustes necesarios tras los primeros vuelos** (ganancias, calibraciones continuas y umbrales de batería).' }
        ]
      },
      elementos: {
        title: 'Elementos bajo ensayo',
        blocks: [
          { t: 'h', x: 'Tierra' },
          { t: 'ul', x: ['Equipo PC con Mission Planner y QGroundControl.', 'Radio de comunicaciones Silvus StreamCaster 4200 (lado tierra).', 'Mando manual FrSky X20S.'] },
          { t: 'h', x: 'Aire' },
          { t: 'table', head: ['Equipo', 'Modelo', 'Cantidad'], rows: [
            ['Autopiloto', 'CUAV X25 EVO', '1'],
            ['Receptor de mando manual', 'FrSky TD SR18', '1'],
            ['GNSS + brújula', 'CUAV NEO 3 Pro (DroneCAN)', '1'],
            ['Sensor de velocidad aire', 'CUAV SKYE 2 Nano (DroneCAN)', '1'],
            ['Servos de superficies', 'Futaba BLA21-28U-AB2', '4'],
            ['ESC motores verticales', 'T-Motor VL200A 24S', '4'],
            ['Motores verticales', 'T-Motor VL1165 KV60', '4'],
            ['ESC motor de cola', 'T-Motor Thunder 200A', '1'],
            ['PMU aviónica', 'CUAV PMU 2 Lite (15 V)', '1'],
            ['PMU de cola', 'Holybro PM08-CAN 200 A', '1'],
            ['Vídeo FPV', 'DJI O3 Air Unit + relé', '1'],
            ['Radioenlace', 'Silvus StreamCaster 4200 (SC4200)', '1'],
            ['Convertidor DC-DC', '6S → 12 V', '1']
          ] }
        ]
      },
      esquema: {
        title: 'Esquema general de conexiones',
        blocks: [
          { t: 'p', x: 'El esquema siguiente muestra **todo el cableado del lado aire** con el autopiloto en el centro, cada puerto en su posición real y cada cable con su nombre. Un único código de colores se usa en todo el documento.' },
          FIG('esquema-cableado-v3.1.svg', 'Esquema de cableado general E-VTOL TARSIS V3.1 · CUAV X25 EVO (Rev. 4)'),
          { t: 'h', x: 'Uso de puertos del CUAV X25 EVO' },
          { t: 'table', head: ['Puerto', 'Conectado a', 'Sección'], rows: [
            ['01 TELEM1', 'DJI O3 Air Unit (UART / OSD)', '#/video'],
            ['03 ETH', 'Silvus StreamCaster 4200 (Ethernet 100 Mb)', '#/radio'],
            ['04 CAN1-1', 'GNSS CUAV NEO 3 Pro', '#/gnss'],
            ['05 CAN1-2', 'Airspeed CUAV SKYE 2 Nano', '#/pitot'],
            ['06 CAN1-3', 'PMU de cola Holybro PM08-CAN', '#/pmu-cola'],
            ['09 CAN2-1', 'Bus CAN de 8 nodos: 4 servos + 4 ESC VL200A', '#/can'],
            ['22 POWER C1', 'CUAV PMU 2 Lite 15 V (+ CAN1)', '#/pmu-avionica'],
            ['21 RC IN', 'FrSky TD SR18 (SBUS)', '#/receptor'],
            ['M1 / M9', 'Servos alerón izquierdo / derecho', '#/servos'],
            ['M2 / M4', 'Servos ruddervator izquierdo / derecho', '#/servos'],
            ['M3', 'ESC Thunder 200A (motor de cola)', '#/motor-cola'],
            ['M5 · M6 · M7 · M8', 'ESC VL200A: FR · RL · FL · RR', '#/esc-vertical'],
            ['M13', 'Relé de alimentación DJI O3 (GPIO 62)', '#/video']
          ], link: 2 },
          { t: 'note', k: 'info', x: 'Puertos sin uso: 02, 08, 10, 20 · M10–M12 · M14–M16 · 11 RSSI · 12 SPI6 · 13 GPS2 · 14 UART4 · 15/16 ADC · 17 I2C2 · 18 DEBUG · 19 I2C3 · USB-C.' },
          { t: 'h', x: 'Tipos de cable' },
          { t: 'table', head: ['Función', 'Protocolo', 'Galga', 'Especificación', 'Blindaje EMI', 'Aislamiento'], rows: [
            ['CAN / Serie', 'CAN / SERIE', 'AWG 22', 'MIL-DTL-27500', 'Sí', 'ETFE'],
            ['Señal', 'SEÑAL', 'AWG 22', 'MIL-DTL-22759', 'No', 'ETFE'],
            ['Potencia', 'POTENCIA', 'AWG 8/10/12', 'DIN VDE 0295 Cl.5 / IEC 60228 Cl.5 / IEC 60754 / IEC 60332-1-2', 'No', 'Silicona'],
            ['Alimentación', 'ALIMENTACIÓN', 'AWG 22', 'MIL-DTL-22759', 'No', 'ETFE'],
            ['RF 2,4 GHz', 'RF', 'RG405', '—', 'Sí', 'FEP'],
            ['RF 868 MHz', 'RF', 'RG316D', '—', 'Sí', 'RADOX'],
            ['RF 2,4 GHz', 'RF', 'RG400', '—', 'Sí', 'RADOX']
          ] },
          { t: 'h', x: 'Código de colores' },
          { t: 'legend' },
          FIG('esquema-lado-tierra-v3.1.png', 'Esquema de conexiones lado tierra')
        ]
      },
      nomenclatura: {
        title: 'Nomenclatura',
        blocks: [
          { t: 'table', head: ['Abreviatura', 'Descripción'], rows: [
            ['AP', 'Autopilot (autopiloto)'], ['GCS', 'Ground Control Station'], ['FW', 'Firmware'],
            ['COG', 'Centro de gravedad'], ['IMU', 'Inertial Measurement Unit'], ['HW / SW', 'Hardware / Software'],
            ['ESC', 'Electronic Speed Controller'], ['PMU', 'Power Management Unit'],
            ['GNSS', 'Global Navigation Satellite System'], ['MANET', 'Mobile Ad-hoc Network'], ['FCC', 'Flight Control Computer']
          ] }
        ]
      },

      /* --------------------------- COMPONENTES -------------------------- */
      autopiloto: {
        title: 'Autopiloto · CUAV X25 EVO',
        lead: 'Cerebro del sistema. Todo el cableado converge aquí: alimentación, CAN, UART, Ethernet, SBUS y 16 salidas PWM.',
        blocks: [
          PARAMS([
            ['Q_ENABLE', '1', 'Habilita el modo cuadricóptero (QuadPlane) sobre ArduPlane'],
            ['Q_FRAME_CLASS', '1', 'Clase de trama VTOL: Quad'],
            ['Q_FRAME_TYPE', '1', 'Tipo de trama: X'],
            ['AHRS_EKF_TYPE', '3', 'Motor de estimación de actitud: EKF3'],
            ['EK3_ENABLE', '1', 'EKF3 habilitado'],
            ['SCHED_LOOP_RATE', '300', 'Frecuencia del bucle principal (Hz)'],
            ['BRD_SAFETY_DEFLT', '0', 'Interruptor de seguridad físico desactivado por defecto'],
            ['ARMING_REQUIRE', '1', 'Requiere armado explícito antes de volar'],
            ['ARMING_CHECK', '1', 'Todas las comprobaciones de armado activas']
          ]),
          { t: 'table', cap: 'Resumen', head: ['Característica', 'Valor'], rows: [
            ['Procesador', 'STM32H743'], ['Alimentación', '10–18 V (POWER C1 / C2)'],
            ['Firmware', 'ArduPlane v4.7.1 (QuadPlane)'], ['Fuente en configuración', 'USB-C al PC o batería BATT FCC']
          ] },
          { t: 'h', x: 'Instalación del firmware' },
          { t: 'ol', x: [
            'Conectar el CUAV X25 EVO al PC con un cable USB-C.',
            'Abrir **Mission Planner** → *Setup* → *Install Firmware* y elegir **ArduPlane**.',
            'Apagar y volver a encender el autopiloto para aplicar los cambios.',
            'Tras cada reinicio, pulsar *Disconnect* y después *Connect* (esquina superior derecha) en Mission Planner.',
            'En *Parámetros*, buscar `Q_ENABLE` y ponerlo a **1** para habilitar el modo cuadricóptero. Reiniciar.'
          ] },
          FIG('fw-instalar-plane.png', 'Instalación del firmware Plane en Mission Planner'),
          FIG('mp-conectar-desconectar.png', 'Conectar / desconectar con el AP en Mission Planner'),
          { t: 'note', k: 'info', x: 'La mayoría de las configuraciones se realizan en **Mission Planner**. El GNSS y el radiocontrol también pueden ajustarse en **QGroundControl**.' },
          { t: 'h', x: 'Asignación de salidas PWM' },
          { t: 'table', head: ['Salida', 'Función', 'Equipo'], rows: [
            ['M1', 'Alerón izquierdo', 'Servo Futaba BLA21'],
            ['M2', 'Ruddervator izquierdo', 'Servo Futaba BLA21'],
            ['M3', 'Motor de empuje horizontal (cola)', 'ESC Thunder 200A'],
            ['M4', 'Ruddervator derecho', 'Servo Futaba BLA21'],
            ['M5', 'Motor 1 · FR · hélice CCW-R', 'ESC VL200A'],
            ['M6', 'Motor 2 · RL · hélice CCW-R', 'ESC VL200A'],
            ['M7', 'Motor 3 · FL · hélice CW-L', 'ESC VL200A'],
            ['M8', 'Motor 4 · RR · hélice CW-L', 'ESC VL200A'],
            ['M9', 'Alerón derecho', 'Servo Futaba BLA21'],
            ['M13', 'Relé de alimentación DJI O3 (GPIO 62)', 'Relé DJI']
          ] },
          FIG('orden-motores.png', 'Orden y sentido de giro de los motores (Quad-X ArduPilot, vista superior)'),
          { t: 'h', x: 'Mapa GPIO / Relay_pin' },
          { t: 'table', head: ['Salida', 'RELAYx_PIN', 'Salida', 'RELAYx_PIN'], rows: [
            ['PWM1 (M1)', '50', 'PWM8 (M8)', '57'], ['PWM2 (M2)', '51', 'PWM9 (M9)', '58'],
            ['PWM3 (M3)', '52', 'PWM10 (M10)', '59'], ['PWM4 (M4)', '53', 'PWM11 (M11)', '60'],
            ['PWM5 (M5)', '54', 'PWM12 (M12)', '61'], ['PWM6 (M6)', '55', 'PWM13 (M13)', '62'],
            ['PWM7 (M7)', '56', 'PWM14 (M14)', '63']
          ] },
          { t: 'note', k: 'info', x: 'Para usar una salida como GPIO, poner `SERVOx_FUNCTION = -1` y guardar y reiniciar antes de configurar `RELAYx_*`.' },
          { t: 'h', x: 'Seguridad y arming' },
          { t: 'ul', x: [
            'Desactivar el interruptor de seguridad: `BRD_SAFETY_DEFLT = 0` (antes `BRD_SAFETY`).',
            'En *QGroundControl → Safety*, desmarcar *All* en **Arming Checks** únicamente durante las pruebas de banco.'
          ] },
          { t: 'note', k: 'warn', x: 'Restablecer los **Arming Checks** y el interruptor de seguridad antes de cualquier vuelo.' }
        ]
      },

      receptor: {
        title: 'Receptor de mando · FrSky TD SR18',
        lead: 'Enlace de control manual de respaldo. Dual-band 2,4 GHz + 868/900 MHz, 18 canales, salida SBUS al puerto RC IN.',
        blocks: [
          CONN('receptor'),
          PARAMS([
            ['RC_PROTOCOLS', '1', 'Protocolos de entrada RC habilitados (bit 0 · todos)'],
            ['RCMAP_ROLL', '1', 'Canal de alerones'],
            ['RCMAP_PITCH', '2', 'Canal de elevador'],
            ['RCMAP_THROTTLE', '3', 'Canal de empuje'],
            ['RCMAP_YAW', '4', 'Canal de rudder'],
            ['FLTMODE_CH', '8', 'Canal que conmuta los modos de vuelo'],
            ['FLTMODE1 / FLTMODE2', '11 / 11', 'QSTABILIZE'],
            ['FLTMODE3 / FLTMODE4', '5 / 5', 'FBWA'],
            ['FLTMODE5 / FLTMODE6', '0 / 0', 'MANUAL'],
            ['RC3_DZ', '30', 'Zona muerta del canal de empuje'],
            ['THR_FAILSAFE', '1', 'Failsafe de throttle activado'],
            ['THR_FS_VALUE', '950', 'Umbral PWM que dispara el failsafe de radio']
          ]),
          PEND('El dump real usa `FLTMODE_CH = 8`, no el canal 7 indicado en el procedimiento de mezclas del mando: confirmar en banco qué canal llega realmente al conmutador de modos.'),
          { t: 'table', cap: 'Resumen', head: ['Característica', 'Valor'], rows: [
            ['Modelo', 'FrSky TD SR18 (Tandem)'], ['Bandas', '2,4 GHz + 868/900 MHz'], ['Canales', '18'],
            ['Conexión AP', 'RC IN (21) · SBUS'], ['Alimentación', '5 V desde RC IN'], ['Mando', 'FrSky X20S']
          ] },
          { t: 'h', x: 'Actualización de firmware' },
          { t: 'note', k: 'warn', x: 'Antes de emparejar hay que **actualizar el firmware del mando y del receptor**; si no, no se reconocerán.' },
          { t: 'ol', x: [
            'Descargar el FW del mando y el FW del receptor desde la web del fabricante.',
            'Conectar el mando por USB y copiar los archivos a la tarjeta SD.',
            'Al desconectar el mando del PC, su FW se instala automáticamente.',
            'Emparejar el receptor con el mando.',
            'En *File Manager*, entrar en la carpeta del FW del receptor, pulsar el archivo y elegir **Flash RX by int. OTA**.'
          ] },
          { t: 'h', x: 'Emparejamiento y salida SBUS' },
          { t: 'ol', x: [
            'Entrar en *RF System* y pulsar sobre el receptor → *Ajustes*.',
            'Seleccionar **SBUS16**.',
            'Seleccionar el pin donde se conecta el cable al autopiloto (p. ej. pin 10 → *SBUS out*).'
          ] },
          FIG('frsky-sbus.png', 'Configuración del receptor para el autopiloto'),
          { t: 'h', x: 'Modelo y mixes (modo VTOL)' },
          { t: 'p', x: 'Crear un modelo **airplane** con las siguientes características:' },
          { t: 'table', head: ['Elemento', 'Valor'], rows: [
            ['Alerones', 'Dos canales'], ['Cola', 'V-tail'], ['Elevadores', 'Un canal'], ['Rudder', 'Un canal'], ['Flaps', 'Sin flaps'], ['Engine', 'Un canal']
          ] },
          { t: 'p', x: 'Asignar a un interruptor de **tres posiciones** los cambios de modo: en *Mixes* crear un **Free mix**, asignarle el *Switch A* y el canal **7**.' },
          { t: 'table', cap: 'Canales esperados en Mixes', head: ['Función', 'Canal'], rows: [
            ['Alerones', '1'], ['Empuje', '3'], ['Rudder', '4'], ['Elevadores', '5'], ['Free mix (modos de vuelo)', '7']
          ] },
          { t: 'ol', x: [
            'En QGroundControl o Mission Planner abrir *Radio calibration* y mover cada palanca para asignar su función.',
            'En QGroundControl → *Flight modes*, seleccionar el canal 7 para asociar los cambios de modo al Switch A.'
          ] },
          FIG('frsky-modos.png', 'Definición de modos de vuelo y USWs'),
          FIG('frsky-mixes.png', 'Mixes definidos en el mando manual'),
          { t: 'h', x: 'Interruptor SF y valores neutrales' },
          { t: 'p', x: 'Las funciones del mando solo actúan con **SF hacia arriba**. Al bajarlo, los comandos toman los valores neutrales de cada canal:' },
          { t: 'ul', x: ['Interruptores de 3 posiciones (USWs): modo central.', 'Interruptores de 2 posiciones: modo superior.', 'Roll, Pitch, Throttle y Rudder: valor 0.'] },
          { t: 'note', k: 'warn', x: 'Mantener **SA en la posición CENTRAL** cuando el vuelo está en AUTO. Si SA está arriba o abajo, al subir SF el AP cambiará a **Q-STABILIZE** o **Q-HOVER**.' }
        ]
      },

      gnss: {
        title: 'GNSS + brújula · CUAV NEO 3 Pro',
        lead: 'Módulo DroneCAN con receptor M9N y brújula RM3100. La flecha del módulo debe apuntar al morro del avión.',
        blocks: [
          CONN('gnss'),
          PARAMS([
            ['GPS1_TYPE', '9', 'GPS tipo DroneCAN (UAVCAN)'],
            ['GPS1_CAN_NODEID', '125', 'Node ID esperado en el bus DroneCAN'],
            ['GPS_AUTO_SWITCH', '1', 'Cambio automático entre receptores GPS'],
            ['GPS_BLEND_MASK', '5', 'Fusión de posición + velocidad entre GPS'],
            ['CAN_P1_DRIVER', '1', 'Driver DroneCAN habilitado en CAN1'],
            ['CAN_D1_PROTOCOL', '1', 'Protocolo DroneCAN en CAN1'],
            ['COMPASS_USE', '1', 'Brújula 1 (externa, NEO 3 Pro) habilitada'],
            ['COMPASS_USE2', '1', 'Brújula 2 (interna RM3100) habilitada'],
            ['COMPASS_EXTERNAL', '1', 'Brújula 1 marcada como externa'],
            ['COMPASS_DEV_ID', '97539', 'ID de dispositivo · brújula externa'],
            ['COMPASS_DEV_ID2', '1114658', 'ID de dispositivo · brújula interna'],
            ['AHRS_GPS_MINSATS', '6', 'Satélites mínimos para confiar en el GPS']
          ]),
          { t: 'table', cap: 'Resumen', head: ['Característica', 'Valor'], rows: [
            ['Modelo', 'CUAV NEO 3 Pro (CAN GNSS MODULE)'], ['GNSS / brújula', 'M9N + RM3100'], ['Interfaz', 'DroneCAN · 5 V'],
            ['Diámetro', 'Ø 60 mm'], ['Puerto AP', 'CAN1 · puerto 1 (04)']
          ] },
          { t: 'note', k: 'warn', x: 'Montar el módulo con la **flecha orientada al morro** del avión y lejos de cables de potencia.' },
          { t: 'h', x: 'Calibración del GNSS y la brújula' },
          { t: 'ul', x: ['**Compass 1**: externa (UAVCAN, NEO 3 Pro).', '**Compass 2**: interna RM3100 (SPI4).'] },
          { t: 'ol', x: [
            'En QGroundControl abrir *Sensors* → **Compass** y seguir los pasos indicados.',
            'Una vez calibrada, **reiniciar el CUAV** (reset de alimentación) para guardar los cambios.',
            'Si la calibración da error en QGroundControl, repetir o probar en Mission Planner.',
            'Repetir la calibración previa al primer vuelo.'
          ] },
          FIG('qgc-sensores.png', 'Calibración de sensores en QGroundControl')
        ]
      },

      pitot: {
        title: 'Velocidad aire · CUAV SKYE 2 Nano',
        lead: 'Tubo pitot DroneCAN (DLVR). Fundamental para la transición y el control en ala fija.',
        blocks: [
          CONN('pitot'),
          PARAMS([
            ['ARSPD_TYPE', '8', 'Sensor DroneCAN (DLVR)'],
            ['ARSPD_USE', '0', 'El sensor aún **no** se usa en el lazo de control'],
            ['ARSPD_BUS', '1', 'Bus DroneCAN donde responde el sensor'],
            ['ARSPD_AUTOCAL', '1', 'Autocalibración en vuelo activada'],
            ['ARSPD_RATIO', '2.0', 'Relación de calibración del tubo'],
            ['ARSPD_OPTIONS', '11', 'Uso en EKF + registro + comprobación de rango'],
            ['AIRSPEED_MIN', '30', 'Velocidad mínima de ala fija (m/s)'],
            ['AIRSPEED_MAX', '60', 'Velocidad máxima de ala fija (m/s)'],
            ['AIRSPEED_CRUISE', '32', 'Velocidad de crucero (m/s)'],
            ['AIRSPEED_STALL', '25', 'Velocidad de pérdida (m/s)']
          ]),
          PEND('`ARSPD_USE = 0` en el dump real: el pitot está instalado y calibrado pero todavía no se usa en el lazo de control. Cambiar a `1` antes de volar en modos de ala fija.'),
          { t: 'table', cap: 'Resumen', head: ['Característica', 'Valor'], rows: [
            ['Modelo', 'CUAV SKYE 2 Nano'], ['Interfaz', 'DroneCAN · 5 V'], ['Puerto AP', 'CAN1 · puerto 2 (05)'], ['Orientación', 'Tubo pitot hacia el viento']
          ] },
          { t: 'h', x: 'Calibración inicial del offset' },
          { t: 'ol', x: [
            'Encender el sensor y **esperar unos 5 minutos** (recomendación del fabricante).',
            'Colocar el pitot en un entorno **sin viento**.',
            'En Mission Planner: *Data* → *Actions* → **Preflight Calibration** → *Do action*.',
            'Comprobar que la velocidad mostrada está entre **0 y 3 m/s**.',
            'Sujetar el pitot y soplar sobre el sensor: el valor debe cambiar.'
          ] },
          FIG('mp-preflight-calibration.png', 'Calibración previa al vuelo'),
          { t: 'h', x: 'Calibración constante en vuelo' },
          { t: 'ol', x: [
            'Poner `ARSPD_AUTOCAL = 1`.',
            'Despegar en QSTABILIZE o QHOVER y cambiar a FBWA.',
            'Tras el vuelo, poner `ARSPD_AUTOCAL = 0`: la calibración queda guardada.'
          ] },
          { t: 'note', k: 'info', x: 'Realizar la calibración de offset **antes de cada vuelo**.' }
        ]
      },

      servos: {
        title: 'Servos de superficies · Futaba BLA21',
        lead: 'Cuatro servos DroneCAN + PWM: dos alerones y dos ruddervators (cola en V).',
        blocks: [
          CONN('servos'),
          PARAMS([
            ['SERVO1_FUNCTION', '4', 'Alerón izquierdo'],
            ['SERVO1_REVERSED', '1', 'Sentido invertido'],
            ['SERVO9_FUNCTION', '4', 'Alerón derecho'],
            ['SERVO9_REVERSED', '0', 'Sentido normal'],
            ['SERVO2_FUNCTION', '79', 'VTail izquierdo (ruddervator)'],
            ['SERVO4_FUNCTION', '80', 'VTail derecho (ruddervator)'],
            ['SERVO4_REVERSED', '1', 'Sentido invertido'],
            ['SERVO_RATE', '50', 'Frecuencia PWM de los servos (Hz)'],
            ['CAN_D1_UC_SRV_BM', '3855', 'Máscara de servos DroneCAN habilitados'],
            ['CAN_D1_UC_SRV_RT', '50', 'Frecuencia de los mensajes de servo DroneCAN (Hz)']
          ]),
          { t: 'table', cap: 'Resumen', head: ['Característica', 'Valor'], rows: [
            ['Modelo', 'Futaba BLA21-28U-AB2'], ['Cantidad', '4'], ['Interfaz', 'DroneCAN + PWM'], ['Alimentación', '20–32 V (bus 6S servos)'],
            ['Conexión', 'Mangueras IZQ / DER · bus CAN2']
          ] },
          { t: 'table', cap: 'Asignación', head: ['Salida', 'Superficie', 'Manguera'], rows: [
            ['M1', 'Alerón izquierdo', 'IZQ'], ['M2', 'Ruddervator izquierdo', 'IZQ'], ['M4', 'Ruddervator derecho', 'DER'], ['M9', 'Alerón derecho', 'DER']
          ] },
          { t: 'h', x: 'Configuración DroneCAN (Mission Planner)' },
          { t: 'table', head: ['Elemento', 'Valor'], rows: [
            ['Herramienta', 'Mission Planner 1.3.83'], ['Firmware AP', 'ArduPlane V4.6.3 en CUAV-X25-EVO (versión usada en esta prueba)'],
            ['Interfaz', 'DroneCAN/UAVCAN con SLCAN · MAVLinkCAN1/2 · MCastCan1/2'],
            ['Futaba.Servo.BLA21', 'Node ID 4 · SW 1.40.0'], ['Nodo Mission Planner', '127'], ['Nodo ArduPilot', '10']
          ] },
          { t: 'h', x: 'Ajuste mecánico y calibración' },
          { t: 'ol', x: [
            'Ajustar los servos con las guías del fuselaje para fijar cero, máximo y mínimo.',
            'Verificar sentido de movimiento y recorrido de cada superficie desde Mission Planner.',
            'Comprobar la respuesta en los modos FBWA y Manual.'
          ] },
          FIG('mp-servos.png', 'Ajuste de los servos'),
          PEND('Incluir tabla final de `SERVOx_MIN/MAX/TRIM` y de IDs DroneCAN por servo.')
        ]
      },

      'esc-vertical': {
        title: 'ESC + motores verticales · T-Motor VL200A / VL1165',
        lead: 'Cuatro conjuntos ESC-motor en configuración Quad-X para despegue, aterrizaje y estabilización vertical.',
        blocks: [
          CONN('esc-vertical'),
          PARAMS([
            ['SERVO5_FUNCTION', '33', 'Motor 1 (FR)'],
            ['SERVO6_FUNCTION', '34', 'Motor 2 (RL)'],
            ['SERVO7_FUNCTION', '35', 'Motor 3 (FL)'],
            ['SERVO8_FUNCTION', '36', 'Motor 4 (RR)'],
            ['Q_M_PWM_MIN / MAX', '1000 / 2000', 'Rango PWM de los motores VTOL'],
            ['Q_M_SPIN_ARM', '0.10', 'Empuje mínimo al armar'],
            ['Q_M_SPIN_MIN', '0.15', 'Empuje mínimo en vuelo'],
            ['Q_M_SPIN_MAX', '0.95', 'Empuje máximo permitido'],
            ['Q_M_THST_EXPO', '0.65', 'Curva de expo de empuje'],
            ['Q_M_THST_HOVER', '0.35', 'Empuje estimado en hover'],
            ['CAN_D1_UC_ESC_BM', '240', 'Máscara DroneCAN de las 4 ESC verticales'],
            ['Q_FRAME_CLASS / TYPE', '1 / 1', 'Quad · X']
          ]),
          { t: 'table', cap: 'Resumen', head: ['Característica', 'ESC', 'Motor'], rows: [
            ['Modelo', 'T-Motor VL200A 24S', 'T-Motor VL1165 KV60'],
            ['Control', 'PWM + CAN (2 × JR) · 108 V máx.', 'Fases A·B·C + encoder (auto rotor lock)'],
            ['Cantidad', '4', '4']
          ] },
          { t: 'table', cap: 'Disposición', head: ['Motor', 'Salida', 'Posición', 'Hélice', 'Manguera'], rows: [
            ['1', 'M5', 'FR · delantero der.', 'CCW-R', 'DER'], ['2', 'M6', 'RL · trasero izq.', 'CCW-R', 'IZQ'],
            ['3', 'M7', 'FL · delantero izq.', 'CW-L', 'IZQ'], ['4', 'M8', 'RR · trasero der.', 'CW-L', 'DER']
          ] },
          { t: 'note', k: 'info', x: 'Reparto de baterías de boom: **boom derecho → FR + RR**, **boom izquierdo → RL + FL**. Las baterías de cada pack se conectan **siempre en paralelo**.' },
          { t: 'h', x: 'Calibración de ESC' },
          { t: 'ol', x: [
            'Quitar las hélices.',
            'Buscar el parámetro `Q_ESC_CAL` y ponerlo a **1**.',
            'Cambiar el modo de vuelo a **QSTABILIZE**.',
            'Poner el empuje al máximo en el mando.',
            'Conectar la batería.',
            'Bajar el empuje al mínimo y desarmar el dron.'
          ] },
          { t: 'note', k: 'ok', x: 'Las ESC deben emitir un sonido que confirma que se ha registrado la calibración.' },
          PEND('Parámetros DroneCAN de las ESC (`Q_M_PWM_TYPE`, `ESC_*`, `DShot`/CAN) y verificación del sentido de giro de cada motor.')
        ]
      },

      'motor-cola': {
        title: 'ESC + motor de cola · T-Motor Thunder 200A',
        lead: 'Motor de empuje horizontal (pusher). Se activa en modos de ala fija.',
        blocks: [
          CONN('motor-cola'),
          PARAMS([
            ['SERVO3_FUNCTION', '70', 'Throttle (motor de cola)'],
            ['SERVO3_MIN / MAX', '1100 / 1900', 'Rango PWM del ESC'],
            ['SERVO3_TRIM', '1100', 'PWM de reposo (motor parado)'],
            ['TRIM_THROTTLE', '45', 'Empuje de crucero (%)'],
            ['THR_MIN / THR_MAX', '0 / 100', 'Límites de empuje (%)'],
            ['THR_SLEWRATE', '100', 'Tasa máxima de cambio de empuje (%/s)'],
            ['USE_REV_THRUST', '2', 'Empuje reverso permitido en modos manuales']
          ]),
          { t: 'table', cap: 'Resumen', head: ['Característica', 'Valor'], rows: [
            ['ESC', 'T-Motor Thunder 200A'], ['Salida AP', 'M3 (fuselaje)'], ['Motor', 'Modelo a confirmar'], ['Alimentación', 'Pack cola 12S2P · 44,4 V · 66 Ah']
          ] },
          { t: 'h', x: 'Calibración de ESC del motor de cola' },
          { t: 'note', k: 'warn', x: 'Procedimiento distinto al de los motores verticales. Retirar la hélice.' },
          { t: 'ol', x: [
            'Desconectar de los pines del autopiloto el motor de cola y conectarlo **directamente al receptor** del mando.',
            'Conectar el receptor a la entrada **RC IN** del autopiloto.',
            'Desconectar la batería.',
            'Poner el empuje al máximo en el mando.',
            'Conectar la batería.',
            'Bajar el empuje al mínimo y desarmar.'
          ] },
          { t: 'note', k: 'ok', x: 'Debe sonar un tono que confirma que la calibración se ha guardado. Después, volver a conectar el motor a M3.' },
          PEND('Confirmar modelo de motor de cola y rango PWM final (`SERVO3_MIN/MAX`).')
        ]
      },

      baterias: {
        title: 'Baterías',
        lead: 'Cuatro bloques de energía independientes. Las baterías de cada pack se conectan siempre en paralelo.',
        blocks: [
          PARAMS([
            ['BATT_MONITOR', '9', 'Monitor principal (DroneCAN BatteryInfo)'],
            ['BATT_CAPACITY', '10000', 'Capacidad declarada (mAh)'],
            ['BATT_LOW_VOLT', '80.0', 'Tensión de aviso bajo (V)'],
            ['BATT_SERIAL_NUM', '-1', 'Sin número de serie DroneCAN asignado'],
            ['BATT2_MONITOR', '8', 'Monitor de la batería de cola (DroneCAN)'],
            ['BATT2_CAPACITY', '33000', 'Capacidad declarada (mAh)'],
            ['BATT2_LOW_VOLT', '43.2', 'Tensión de aviso bajo (V) · 12S'],
            ['BATT2_SERIAL_NUM', '4', 'Número de serie DroneCAN del nodo PMU de cola'],
            ['BATT3_MONITOR', '8', 'Monitor de la batería FCC/aviónica (DroneCAN)'],
            ['BATT3_CAPACITY', '5000', 'Capacidad declarada (mAh)'],
            ['BATT3_LOW_VOLT', '21.0', 'Tensión de aviso bajo (V) · 6S'],
            ['BATT3_SERIAL_NUM', '2', 'Número de serie DroneCAN del nodo PMU aviónica'],
            ['BATT4…BATT9_MONITOR', '0', 'Resto de monitores sin usar']
          ], 'Parámetros reales de monitorización (BATT, BATT2, BATT3)'),
          PEND('Los `BATTx_LOW_MAH` / `CRT_MAH` del dump no coinciden con los umbrales del 30 %/20 % propuestos más abajo: revisar y alinear antes de volar.'),
          { t: 'table', head: ['Pack', 'Composición', 'Tensión nom.', 'Capacidad', 'Alimenta'], rows: [
            ['BATT FCC', '6S Li-ion (única)', '21,6 V', '5000 mAh', 'Aviónica: DC-DC 12 V, relé DJI, PMU 2 Lite, servos'],
            ['Pack COLA', '2 × 12S en paralelo (12S2P) · 10C', '44,4 V', '66 Ah', 'ESC Thunder · motor de cola'],
            ['Pack BOOM IZQ', '2 × 24S en paralelo (24S2P) · 10C', '81,6 V', '20 Ah', 'ESC RL + FL'],
            ['Pack BOOM DER', '2 × 24S en paralelo (24S2P) · 10C', '81,6 V', '20 Ah', 'ESC FR + RR']
          ] },
          { t: 'note', k: 'warn', x: 'Cada pack lleva su **cortacorriente**. Nunca conectar baterías de un pack en serie.' },
          { t: 'h', x: 'Umbrales por capacidad' },
          { t: 'table', head: ['Parámetro', 'Criterio', 'Significado'], mono: [0], rows: [
            ['BATT_ARM_MAH', '80 % de la capacidad', 'No se arma si la batería está descargada de forma significativa'],
            ['BATT_LOW_MAH', '30 % de la capacidad', 'Umbral de advertencia de batería baja'],
            ['BATT_CRT_MAH', '20 % de la capacidad', 'Umbral crítico: acción de emergencia']
          ] },
          { t: 'table', cap: 'Valores resultantes (criterio del documento base)', head: ['Pack', 'Capacidad', 'ARM_MAH', 'LOW_MAH', 'CRT_MAH'], rows: [
            ['Cola 12S2P', '66 000 mAh', '52 800', '19 800', '13 200'],
            ['Boom 24S2P', '20 000 mAh', '16 000', '6 000', '4 000'],
            ['FCC 6S', '5 000 mAh', '4 000', '1 500', '1 000']
          ] },
          { t: 'h', x: 'Umbrales de tensión por celda' },
          { t: 'table', head: ['Nivel', 'V por celda'], rows: [['Carga completa', '4,2 V'], ['Nominal', '3,7 V'], ['Mínimo seguro', '3,3 V']] },
          PEND('Validar los umbrales con las curvas reales de descarga de cada pack (en especial Boom 81,6 V) y definir `BATT_ARM_VOLT`, `BATT_LOW_VOLT` y `BATT_CRT_VOLT`.')
        ]
      },

      'pmu-cola': {
        title: 'PMU de cola · Holybro PM08-CAN',
        lead: 'Módulo de potencia DroneCAN de 200 A para el pack de cola. Informa de tensión y corriente al autopiloto.',
        blocks: [
          CONN('pmu-cola'),
          PARAMS([
            ['BATT2_MONITOR', '8', 'Monitor DroneCAN BatteryInfo'],
            ['BATT2_SERIAL_NUM', '4', 'Número de serie DroneCAN de este nodo PMU'],
            ['BATT2_CAPACITY', '33000', 'Capacidad del pack (mAh)'],
            ['BATT2_LOW_VOLT', '43.2', 'Aviso de tensión baja (V)']
          ]),
          { t: 'table', cap: 'Resumen', head: ['Característica', 'Valor'], rows: [
            ['Modelo', 'Holybro PM08-CAN'], ['Corriente máx.', '200 A'], ['Interfaz', 'DroneCAN'], ['Puerto AP', 'CAN1 · puerto 3 (06)'], ['Pack asociado', 'Cola · BATT2']
          ] },
          PEND('Mapeo `BATT2 → PMU de cola` inferido por `BATT2_SERIAL_NUM = 4`: confirmar en banco con el Node ID real del Holybro PM08-CAN.')
        ]
      },

      'pmu-avionica': {
        title: 'PMU aviónica · CUAV PMU 2 Lite',
        lead: 'Alimenta el autopiloto desde la batería FCC con salida regulada de 15 V.',
        blocks: [
          CONN('pmu-avionica'),
          PARAMS([
            ['BATT3_MONITOR', '8', 'Monitor DroneCAN BatteryInfo'],
            ['BATT3_SERIAL_NUM', '2', 'Número de serie DroneCAN de este nodo PMU'],
            ['BATT3_CAPACITY', '5000', 'Capacidad del pack FCC (mAh)'],
            ['BATT3_LOW_VOLT', '21.0', 'Aviso de tensión baja (V) · 6S']
          ]),
          { t: 'table', cap: 'Resumen', head: ['Característica', 'Valor'], rows: [
            ['Modelo', 'CUAV PMU 2 Lite (versión 15 V)'], ['Entrada', '20–70 V'], ['Salida', '15 V / 6 A'],
            ['Destino', 'POWER C1 (22) del autopiloto + CAN1'], ['Conector de batería', 'QS8']
          ] },
          { t: 'h', x: 'Distribución de aviónica desde BATT FCC' },
          { t: 'ul', x: ['Convertidor DC-DC 6S → 12 V (Silvus).', 'Relé DJI (M13) → DJI O3 Air Unit.', 'PMU 2 Lite → autopiloto.', 'Bus 6S servos (4 × Futaba BLA21).'] },
          PEND('Mapeo `BATT3 → PMU aviónica` inferido por `BATT3_SERIAL_NUM = 2`: confirmar Node ID real del CUAV PMU 2 Lite.')
        ]
      },

      video: {
        title: 'Vídeo FPV + relé · DJI O3 Air Unit',
        lead: 'Cámara FPV con OSD vía MSP DisplayPort. Se alimenta a través de un relé para estar apagada en tierra.',
        blocks: [
          CONN('video'),
          PARAMS([
            ['SERIAL1_PROTOCOL', '2 (real) → 42 (objetivo)', 'Actualmente MAVLink2; debe pasar a 42 = DisplayPort'],
            ['SERIAL1_BAUD', '57 (real) → 115 (objetivo)', 'Actualmente 57 600 baudios; DisplayPort necesita 115 200'],
            ['SERIAL1_OPTIONS', '0', 'Sin opciones adicionales'],
            ['OSD_TYPE', '0 (real) → 5 (objetivo)', 'El OSD de ArduPilot está deshabilitado; activar MSP'],
            ['RELAY1_FUNCTION', '0 (real) → 1 (objetivo)', 'El relé aún no está asignado como salida Relay'],
            ['SERVO13_FUNCTION', '0 (real) → -1 (objetivo)', 'M13 debe pasar a GPIO antes de usarlo como relé']
          ], 'Parámetros reales vs. objetivo (DJI O3 / relé)'),
          { t: 'note', k: 'warn', x: 'El dump actual **no tiene** configurado ni el puerto DisplayPort ni el relé de M13: son los próximos cambios a aplicar en banco antes de volar con vídeo FPV operativo.' },
          { t: 'table', cap: 'Resumen', head: ['Característica', 'Valor'], rows: [
            ['Equipo', 'DJI O3 Air Unit'], ['VTX', '7,4–26,4 V · hasta 16 W'], ['Cámara', '1/1,7" · 155°'], ['Antenas', '2 × 5,8 GHz'],
            ['Puerto AP', 'TELEM1 (01) · UART MSP DisplayPort'], ['Relé', 'M13 (GPIO 62) · ≥ 30 V · 3 A']
          ] },
          { t: 'note', k: 'info', x: 'El relé mantiene la O3 **apagada en tierra** para que no se caliente; se activa desde la emisora.' },
          { t: 'h', x: 'Cableado TELEM1' },
          { t: 'p', x: 'Cruce TX/RX: `RX ← TX` y `TX → RX`. Los pines 5V, RTS y CTS de TELEM1 **no se conectan**.' },
          { t: 'h', x: 'Control del relé (GPIO)' },
          { t: 'ol', x: [
            'Poner `SERVO13_FUNCTION = -1` (GPIO) y `RELAY1_FUNCTION = 1` (Relay).',
            'Guardar el parámetro y **reiniciar** el autopiloto.',
            'Configurar `RELAY1_DEFAULT = 0` (apagado) y `RELAY1_PIN = 62` (M13).',
            'En Mission Planner: *DATA* → *Servo/Relay*, **Low** para desactivar y **High** para activar.'
          ] },
          { t: 'note', k: 'info', x: 'Al activarse el relé recibe 3,3 V; desactivado, 0 V.' },
          FIG('mp-servo-relay.png', 'Servo/Relay en Mission Planner')
        ]
      },

      radio: {
        title: 'Radioenlace · Silvus StreamCaster 4200',
        lead: 'Radio MANET para telemetría y vídeo IP. Conectada al AP por Ethernet, con red IP propia en el autopiloto.',
        blocks: [
          CONN('radio'),
          PARAMS([
            ['NET_ENABLE', '1', 'Networking habilitado en el autopiloto'],
            ['NET_DHCP', '0', 'Cliente DHCP desactivado: IP fija'],
            ['NET_IPADDR0-3', '192.168.2.10', 'IP propia del autopiloto en el puerto ETH'],
            ['NET_GWADDR0-3', '192.168.2.1', 'Puerta de enlace'],
            ['NET_NETMASK', '24', 'Máscara /24 = 255.255.255.0'],
            ['NET_MACADDR0-5', 'C2:AF:51:BF:E2:9D', 'Dirección MAC de la interfaz ETH'],
            ['NET_P1_TYPE', '1', 'Puerto de red 1: UDP client'],
            ['NET_P1_IP0-3', '192.168.2.100', 'Destino del puerto 1: PC de tierra (GCS)'],
            ['NET_P1_PORT', '14550', 'Puerto UDP de MAVLink'],
            ['NET_P1_PROTOCOL', '2', 'MAVLink2 en el puerto de red 1'],
            ['NET_P2/P3/P4_TYPE', '0', 'Puertos de red 2 a 4 deshabilitados']
          ], 'Parámetros reales de red del autopiloto (ETH → Silvus)'),
          { t: 'note', k: 'warn', x: 'El **PC de tierra** debe configurarse con IP fija **192.168.2.100** y máscara **255.255.255.0** para que `NET_P1_IP = 192.168.2.100` pueda enlazar por UDP con el autopiloto (puerto 14550).' },
          { t: 'table', cap: 'Referencia completa de parámetros NET_ (ArduPilot)', head: ['Parámetro', 'Valor · opciones', 'Descripción'], mono: [0, 1], rows: [
            ['NET_DHCP', '0 = Disable · 1 = Enable', 'Activar/desactivar el cliente DHCP'],
            ['NET_ENABLE', '0 = Disable · 1 = Enable', 'Habilita el stack de red del autopiloto'],
            ['NET_GWADDR0-3', '0–255 cada octeto', 'Dirección IPv4 de la puerta de enlace'],
            ['NET_IPADDR0-3', '0–255 cada octeto', 'Dirección IPv4 propia del autopiloto'],
            ['NET_MACADDR0-5', '0–255 cada byte', 'Dirección MAC de la interfaz, byte a byte'],
            ['NET_NETMASK', '0–32 (bits consecutivos)', 'Máscara de subred: 24 = 255.255.255.0 · 16 = 255.255.0.0'],
            ['NET_OPTIONS', '—', 'Opciones adicionales de red'],
            ['NET_P1_IP0-3', '0–255 cada octeto', 'IP de destino del puerto de red 1'],
            ['NET_P1_PORT', '0–65535', 'Número de puerto UDP/TCP'],
            ['NET_P1_PROTOCOL', '1 = MAVLink1 · 2 = MAVLink2 · 5 = GPS · …', 'Protocolo del puerto de red (mismo catálogo que SERIALx_PROTOCOL)'],
            ['NET_P1_TYPE', '0 = Disabled · 1 = UDP client · 2 = UDP server · 3 = TCP client · 4 = TCP server', 'Tipo de puerto de red 1'],
            ['NET_P2_TYPE / P3_TYPE / P4_TYPE', 'igual que NET_P1_TYPE', 'Tipo de los puertos de red 2 a 4']
          ] },
          { t: 'table', cap: 'Resumen', head: ['Característica', 'Valor'], rows: [
            ['Modelo', 'Silvus StreamCaster 4200 (SC4200)'], ['Alimentación', '9–20 V (DC-DC 12 V)'], ['Conexión AP', 'ETH (03) · Ethernet 100 Mb cruzado'],
            ['Consumo', '4,8–24 W a 4 W TX'], ['Función', 'Telemetría + vídeo IP']
          ] },
          { t: 'h', x: 'Actualización de firmware' },
          { t: 'p', x: 'Acceder a la interfaz web de la radio → *Firmware Upgrade* y cargar **ss5_4200_v5.0.1.7**.' },
          { t: 'h', x: 'Parámetros de radio (interfaz web)' },
          { t: 'table', cap: 'RF Basic', head: ['Parámetro', 'Valor'], rows: [
            ['Frequency', '2385 MHz'], ['Bandwidth', '20 MHz'], ['Network ID', 'Silvus'], ['Link Distance', '150000 m'], ['Potencia', 'Enable Max Power']
          ] },
          { t: 'table', cap: 'Advanced', head: ['Parámetro', 'Valor'], rows: [
            ['Fragmentation Threshold', '1600 Bytes'], ['MCS', 'Extended Auto'], ['GI Mode', 'Variable 16/63'], ['Retransmissions', 'On'],
            ['Beam Forming', 'On'], ['Transmit / Receive channels', '1-2 On · 3-4 Off'], ['Radio Mode', 'Network Mode (0)']
          ] },
          FIG('silvus-rf-basic.png', 'Silvus · RF Basic'),
          FIG('silvus-advanced.png', 'Silvus · Advanced'),
          { t: 'h', x: 'Cableado Ethernet' },
          { t: 'table', head: ['Señal radio', 'Señal AP (ETH)'], rows: [['TXP', '→ RX+'], ['TXN', '→ RX−'], ['RXP', '← TX+'], ['RXN', '← TX−']] },
          { t: 'note', k: 'info', x: 'El pin VCC se alimenta a 12 V desde el convertidor DC-DC 6S → 12 V.' }
        ]
      },

      can: {
        title: 'Bus CAN',
        lead: 'Un bus CAN2 de 8 nodos repartido en dos mangueras (IZQ / DER). CAN1 conecta GNSS, pitot y PMU de cola.',
        blocks: [
          CONN('can'),
          PARAMS([
            ['CAN_P1_DRIVER', '1', 'Driver DroneCAN habilitado en CAN1'],
            ['CAN_P1_BITRATE', '1000000', 'Velocidad del bus CAN1 (1 Mbps)'],
            ['CAN_D1_PROTOCOL', '1', 'Protocolo DroneCAN en CAN1'],
            ['CAN_D1_UC_NODE', '10', 'Node ID del propio autopiloto en DroneCAN'],
            ['CAN_D1_UC_SRV_BM', '3855', 'Máscara de servos DroneCAN publicados'],
            ['CAN_D1_UC_ESC_BM', '240', 'Máscara de ESC DroneCAN publicados'],
            ['CAN_P2_DRIVER', '1', 'Driver DroneCAN habilitado en CAN2'],
            ['CAN_P2_BITRATE', '1000000', 'Velocidad del bus CAN2 (1 Mbps)'],
            ['CAN_D2_PROTOCOL', '1', 'Protocolo DroneCAN en CAN2']
          ]),
          { t: 'table', head: ['Bus', 'Puerto', 'Nodos'], rows: [
            ['CAN1', '04 / 05 / 06', 'GNSS NEO 3 Pro · SKYE 2 Nano · PM08-CAN'],
            ['CAN2', '09', '4 servos Futaba BLA21 + 4 ESC VL200A (8 nodos)']
          ] },
          { t: 'h', x: 'Terminación' },
          { t: 'ul', x: ['Resistencias de terminación de **120 Ω** en cada extremo del bus CAN2 («fin bus CAN2»).', 'Con todo apagado, medir entre CAN_H y CAN_L: debe haber **≈ 60 Ω**.'] },
          { t: 'note', k: 'warn', x: 'Valores muy distintos de 60 Ω indican falta o exceso de terminadores, o un cable cortado.' },
          PEND('Tabla de Node IDs de los 8 nodos de CAN2 y mapeo `SERVO_DRONECAN`/`ESC` por nodo.')
        ]
      },

      /* ----------------------------- PROCEDIMIENTOS ------------------------ */
      calibracion: {
        title: 'Calibración de sensores',
        blocks: [
          { t: 'p', x: 'En **QGroundControl** abrir el apartado *Sensors*. Tras cada calibración, reiniciar el CUAV con un reset de alimentación.' },
          { t: 'ol', x: [
            '**Compass** → seguir los pasos de QGroundControl → reiniciar.',
            '**Gyroscope** → reiniciar.',
            '**Accelerometer** → reiniciar.',
            '**Level Horizon** → reiniciar.'
          ] },
          { t: 'note', k: 'info', x: 'Si alguna calibración da error en QGroundControl, repetir o probar en Mission Planner.' },
          FIG('qgc-sensores.png', 'Apartado Sensors de QGroundControl')
        ]
      },
      'prueba-motores': {
        title: 'Prueba de armado de motores',
        blocks: [
          { t: 'ol', x: [
            'En QGroundControl → *Parameters*, desactivar los Safety Switches (valor 0).',
            'En *Safety*, comprobar que **Arming Checks** están desactivados (quitar *All*).',
            'Ir al apartado *Motors* y probar cada motor individualmente.',
            'Confirmar en el programa que **las hélices están desmontadas**; de lo contrario no permitirá subir el empuje.',
            'Subir el empuje de cada motor y comprobar **sentido de giro y número de motor**.',
            'Armar con el mando: según el modo se encienden los motores verticales (QSTABILIZE) o el de cola (MANUAL).'
          ] },
          { t: 'note', k: 'warn', x: 'Si algún motor no arranca, puede que las ESC no estén calibradas. Ver *ESC + motores verticales* y *ESC + motor de cola*.' },
          FIG('qgc-arming-checks.png', 'Arming checks'),
          FIG('qgc-motor-test.png', 'Prueba de motores')
        ]
      },
      modos: {
        title: 'Modos de vuelo',
        blocks: [
          { t: 'table', head: ['Modo', 'Tipo', 'Descripción'], rows: [
            ['QSTABILIZE', 'Cuadricóptero', 'El motor de empuje horizontal no se activa. El piloto controla pitch, roll y throttle. Modo de recuperación de control.'],
            ['QHOVER', 'Cuadricóptero', 'Como QSTABILIZE, pero con el stick al centro mantiene altitud; subir o bajar el stick asciende o desciende.'],
            ['FBWA', 'Ala fija', 'Asistencia de estabilidad: mantiene el nivel del avión. Las órdenes se ajustan para mantener la estabilidad.'],
            ['FBWB', 'Ala fija', 'Similar a FBWA pero mantiene altitud: el elevador regula la altitud y el throttle la velocidad.'],
            ['MANUAL', 'Ala fija', 'Control total del piloto: órdenes directas a servos y motor de cola.']
          ] },
          { t: 'note', k: 'warn', x: 'Mantener SA en posición central si se vuela en AUTO (ver *Receptor de mando*).' }
        ]
      },
      transicion: {
        title: 'Transición',
        blocks: [
          { t: 'h', x: 'Cuadricóptero → ala fija' },
          { t: 'ul', x: [
            'Hacia **MANUAL** o **ACRO**: los motores verticales se paran de inmediato.',
            'Hacia cualquier otro modo de ala fija: los motores VTOL siguen dando sustentación y estabilidad hasta alcanzar la velocidad mínima (`AIRSPEED_MIN`).'
          ] },
          { t: 'h', x: 'Ala fija → cuadricóptero' },
          { t: 'ul', x: [
            'El motor de empuje horizontal se detiene y se encienden los motores de cuadricóptero.',
            'Las superficies de control siguen aportando estabilidad mientras el avión reduce la velocidad.'
          ] }
        ]
      },
      ganancias: {
        title: 'Ganancias específicas E-VTOL',
        blocks: [
          { t: 'p', x: 'Ajustes basados en la guía de ganancias de Ardupilot y adaptados a las características de la aeronave.' },
          { t: 'table', head: ['Parámetro', 'Valor modificado', 'Valor por defecto'], mono: [0], rows: [
            ['INS_GYRO_FILTER', '17,5 Hz', '20 Hz'], ['Q_A_ACCEL_P_MAX', '20000', 'N/A'], ['Q_A_ACCEL_R_MAX', '20000', 'N/A'],
            ['Q_A_ACCEL_Y_MAX', '2250', 'N/A'], ['Q_A_RAT_PIT_FLTD', '10', 'N/A'], ['Q_A_RAT_PIT_FLTT', '10', 'N/A'],
            ['Q_A_RAT_YAW_FLTE', '2,5', 'N/A'], ['Q_A_RAT_YAW_FLTT', '10', 'N/A'], ['Q_A_RAT_YAW_P', '0,25', 'N/A'],
            ['Q_M_THST_EXPO', '0,85', 'N/A'], ['Q_M_THST_HOVER', '0,35', 'N/A'], ['Q_P_ACCZ_I', '0,7', 'N/A'], ['Q_P_ACCZ_P', '0,35', 'N/A']
          ] },
          PEND('Valores heredados del E-VTOL de la edición anterior (CUAV X7+ Pro): revalidar tras los primeros vuelos con el X25 EVO.')
        ]
      }
    }
  };

  const LEGEND = [
    ['#d32f2f', '+ positivo'], ['#111', 'GND / −'], ['#1e88e5', 'PWM (señal S)'], ['#f9a825', 'CAN_H'], ['#2e7d32', 'CAN_L'],
    ['#8e24aa', 'UART TX del FC'], ['#00acc1', 'UART RX del FC'], ['#ef6c00', 'Ethernet TX±'], ['#6d4c41', 'Ethernet RX±']
  ];

  /* ------------------------------------------------------------------ */
  /* UTILIDADES                                                          */
  /* ------------------------------------------------------------------ */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const inline = (s) => esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
  const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const canHover = matchMedia('(hover: hover) and (pointer: fine)');

  let toastT;
  function toast(msg) {
    const el = $('#toast'); el.textContent = msg; el.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 2600);
  }

  /* imagen con marcador cuando aún no existe el archivo */
  function img(file, alt, cls = '') {
    return `<img class="${cls}" src="${IMG}${file}" alt="${esc(alt)}" loading="eager" data-file="${esc(file)}">`;
  }
  document.addEventListener('error', (e) => {
    const t = e.target;
    if (t.tagName !== 'IMG' || !t.dataset.file) return;
    const holder = t.closest('[data-ph]') || t.parentElement;
    t.style.display = 'none';
    if (holder && !holder.querySelector('.ph')) {
      holder.classList.add('is-missing');
      holder.insertAdjacentHTML('beforeend', `<span class="ph" title="Falta imagen"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4V5Zm2 2v8l4-4 3 3 2-2 3 3V7H6Zm9 1.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z"/></svg><code>${esc(t.dataset.file)}</code></span>`);
    }
  }, true);

  /* ------------------------------------------------------------------ */
  /* INICIO · TARJETAS                                                   */
  /* ------------------------------------------------------------------ */
  function renderHome() {
    $('#cards').innerHTML = MODELS.map((m, i) => `
      <li class="card ${m.ready ? '' : 'is-soon'}" style="--i:${i}">
        <a href="#/${m.id}" class="card__link" ${m.ready ? '' : 'aria-describedby="soon-note"'}>
          <div class="card__media" data-ph>${img(m.img, m.name)}</div>
          <div class="card__body">
            <span class="card__fam">${esc(m.family)}</span>
            <h2 class="card__name">${esc(m.name)}</h2>
            <span class="card__state">${m.ready ? 'Configuración disponible' : 'En preparación'}</span>
            <span class="card__go" aria-hidden="true">${m.ready ? 'Ver esquema' : 'Próximamente'} <svg viewBox="0 0 24 24"><path d="m13 5 7 7-7 7-1.4-1.4 4.6-4.6H4v-2h12.2l-4.6-4.6L13 5Z"/></svg></span>
          </div>
        </a>
      </li>`).join('') + '<li id="soon-note" class="sr-only">Esta plataforma aún no tiene documentación publicada.</li>';
  }

  /* ------------------------------------------------------------------ */
  /* ESQUEMA FLOTANTE                                                    */
  /* ------------------------------------------------------------------ */
  let hoverTimer = null;

  function renderScheme(model) {
    const ring = COMPONENTS.filter(c => !c.center);
    const center = COMPONENTS.find(c => c.center);
    const n = ring.length;
    const lines = [], nodes = [];
    ring.forEach((c, i) => {
      const a = (-90 + (360 / n) * i) * Math.PI / 180;
      const x = 50 + 40 * Math.cos(a), y = 50 + 40 * Math.sin(a);
      lines.push(`<line data-for="${c.id}" x1="50" y1="50" x2="${x.toFixed(2)}" y2="${y.toFixed(2)}"/>`);
      const cs = Math.cos(a), sn = Math.sin(a);
      const side = cs > 0.3 ? 'right' : cs < -0.3 ? 'left' : sn < 0 ? 'top' : 'bottom';
      nodes.push(`
        <li class="node" style="--x:${x.toFixed(2)}%;--y:${y.toFixed(2)}%;--d:${(i * -0.7).toFixed(1)}s;--k:${(5 + (i % 4) * 0.6).toFixed(1)}s">
          <button class="node__btn" type="button" data-side="${side}" data-comp="${c.id}" aria-label="${esc(c.name)} · ${esc(c.model)}. Abrir configuración">
            <span class="node__float">
              <span class="node__img" data-ph>${img(c.img, '')}<span class="node__ico">${icon(c.icon)}</span></span>
              <span class="node__ring" aria-hidden="true"></span>
            </span>
            <span class="node__shadow" aria-hidden="true"></span>
            <span class="node__label"><strong>${esc(c.name)}</strong><small>${esc(c.model)}</small></span>
          </button>
        </li>`);
    });
    $('#scheme').innerHTML = `
      <div class="scheme__stage">
        <svg class="scheme__lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <circle class="orbit" cx="50" cy="50" r="40"/><circle class="orbit orbit--in" cx="50" cy="50" r="22"/>
          ${lines.join('')}
        </svg>
        <div class="core">
          <button class="core__btn" type="button" data-comp="${center.id}" aria-label="${esc(center.name)} · ${esc(center.model)}. Abrir configuración">
            <span class="core__pulse" aria-hidden="true"></span>
            <span class="core__float">
              <span class="core__img" data-ph>${img(center.img, '')}<span class="node__ico">${icon(center.icon)}</span></span>
              <span class="node__ring" aria-hidden="true"></span>
            </span>
            <span class="node__label node__label--core"><strong>${esc(center.name)}</strong><small>${esc(center.model)}</small></span>
          </button>
        </div>
        <ul class="nodes">${nodes.join('')}</ul>
      </div>`;
    $('#schemeHint').textContent = canHover.matches
      ? 'Mantén el cursor sobre un equipo para abrir su configuración · Clic para abrir al instante'
      : 'Toca un equipo para abrir su configuración';
    bindScheme(model);
  }

  function bindScheme(model) {
    const scheme = $('#scheme');
    const hl = (id, on) => {
      const ln = scheme.querySelector(`line[data-for="${id}"]`);
      if (ln) ln.classList.toggle('on', on);
    };
    scheme.querySelectorAll('[data-comp]').forEach(btn => {
      const id = btn.dataset.comp;
      btn.addEventListener('click', () => { clearTimeout(hoverTimer); go(`/${model}/${id}`); });
      btn.addEventListener('pointerenter', (e) => {
        hl(id, true);
        if (e.pointerType !== 'mouse' || !canHover.matches) return;
        btn.classList.add('arming');
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(() => { btn.classList.remove('arming'); go(`/${model}/${id}`); }, 520);
      });
      btn.addEventListener('pointerleave', () => { hl(id, false); btn.classList.remove('arming'); clearTimeout(hoverTimer); });
      btn.addEventListener('focus', () => hl(id, true));
      btn.addEventListener('blur', () => hl(id, false));
    });
  }

  /* ------------------------------------------------------------------ */
  /* LIBRO                                                               */
  /* ------------------------------------------------------------------ */
  const chapterList = () => BOOK.groups.flatMap(g => g.items);
  const compById = (id) => COMPONENTS.find(c => c.id === id);

  function renderBlocks(chId, blocks) {
    let h3n = 0;
    return blocks.map(b => {
      switch (b.t) {
        case 'p': return `<p>${inline(b.x)}</p>`;
        case 'h': { const sid = `${chId}--${slug(b.x)}`; h3n++; return `<h3 id="${sid}" data-sub>${inline(b.x)}<a class="anchor" href="#/tarsis-v31/${chId}/${slug(b.x)}" aria-label="Enlace a esta sección">#</a></h3>`; }
        case 'ul': return `<ul>${b.x.map(i => `<li>${inline(i)}</li>`).join('')}</ul>`;
        case 'ol': return `<ol class="steps">${b.x.map(i => `<li>${inline(i)}</li>`).join('')}</ol>`;
        case 'note': {
          const L = { info: 'Información', warn: 'Atención', ok: 'Correcto', pend: 'Pendiente de documentar' }[b.k];
          return `<aside class="note note--${b.k}"><span class="note__tag">${L}</span><p>${inline(b.x)}</p></aside>`;
        }
        case 'fig':
          return `<figure class="fig"><div class="fig__box" data-ph>${img(b.src, b.cap)}</div><figcaption>${esc(b.cap)}</figcaption></figure>`;
        case 'legend':
          return `<ul class="legend">${LEGEND.map(([c, t]) => `<li><i style="background:${c}"></i>${esc(t)}</li>`).join('')}</ul>`;
        case 'conn':
          return connSVG(b.comp);
        case 'table': {
          const mono = new Set(b.mono || []);
          const head = b.head.map(h => `<th scope="col">${esc(h)}</th>`).join('');
          const rows = b.rows.map(r => `<tr>${r.map((c, i) => {
            if (b.link === i) { const t = c.replace('#/', ''); return `<td><a class="xref" href="#/tarsis-v31/${t}">Ver sección →</a></td>`; }
            return `<td${mono.has(i) ? ' class="mono"' : ''}${i === 0 ? ' data-first' : ''}>${inline(c)}</td>`;
          }).join('')}</tr>`).join('');
          return `<div class="tablewrap${b.cls ? ' ' + b.cls : ''}">${b.cap ? `<div class="table__cap">${esc(b.cap)}</div>` : ''}<table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
        }
        default: return '';
      }
    }).join('');
  }

  function renderBook() {
    const ids = chapterList();
    let n = 0;
    const toc = [], body = [];
    BOOK.groups.forEach(g => {
      toc.push(`<div class="toc__group"><h2 class="toc__gh">${esc(g.title)}</h2><ol>`);
      body.push(`<div class="part"><p class="part__t">${esc(g.title)}</p></div>`);
      g.items.forEach(id => {
        const ch = BOOK.chapters[id]; const comp = compById(id); n++;
        const subs = ch.blocks.filter(b => b.t === 'h');
        toc.push(`<li><a class="toc__ch" href="#/tarsis-v31/${id}" data-ch="${id}"><span class="toc__n">${n}</span><span>${esc(ch.title)}</span></a>` +
          (subs.length ? `<ol class="toc__sub">${subs.map(s => `<li><a href="#/tarsis-v31/${id}/${slug(s.x)}" data-sub="${id}--${slug(s.x)}">${n}.${subs.indexOf(s) + 1} ${esc(s.x)}</a></li>`).join('')}</ol>` : '') + '</li>');
        let sn = 0;
        const blocks = renderBlocks(id, ch.blocks).replace(/<h3 id="([^"]+)" data-sub>/g, (_, sid) => `<h3 id="${sid}" data-sub><span class="h3n">${n}.${++sn}</span> `);
        body.push(`
          <section class="chapter" id="${id}" data-ch="${id}">
            <header class="chapter__head">
              ${comp ? `<div class="chapter__thumb" data-ph>${img(comp.img, '')}<span class="node__ico">${icon(comp.icon)}</span></div>` : `<span class="chapter__n">${n}</span>`}
              <div><p class="chapter__kicker">Capítulo ${n}${comp ? ' · ' + esc(comp.model) : ''}</p><h2>${esc(ch.title)}</h2>${ch.lead ? `<p class="chapter__lead">${esc(ch.lead)}</p>` : ''}</div>
            </header>
            ${blocks}
          </section>`);
      });
      toc.push('</ol></div>');
    });
    $('#toc').innerHTML = toc.join('');
    const m = BOOK.meta;
    $('#bookScroll').innerHTML = `
      <div class="cover">
        <p class="eyebrow">TARSIS VTOL F50 V3.1 · ${esc(m.fw)}</p>
        <h1>${esc(m.title)}</h1>
        <dl class="cover__meta">
          <div><dt>Documento</dt><dd>${esc(m.doc)}</dd></div>
          <div><dt>Fecha</dt><dd>${esc(m.fecha)}</dd></div>
          <div><dt>Preparado por</dt><dd>${esc(m.autores)}</dd></div>
          <div><dt>Revisado por</dt><dd>${esc(m.revisor)}</dd></div>
        </dl>
      </div>${body.join('')}`;
    $('#bookModel').textContent = 'TARSIS VTOL F50 V3.1';
    observeBook();
  }

  let spy, spyLock = 0, pin = null;
  // las imágenes cambian la altura al cargar: se re-ancla el destino durante un instante
  function repin() {
    if (!pin || Date.now() > pin.until) return;
    const s = $('#bookScroll');
    const top = pin.el.getBoundingClientRect().top - s.getBoundingClientRect().top + s.scrollTop - 12;
    const prev = s.style.scrollBehavior; s.style.scrollBehavior = 'auto'; s.scrollTop = top; s.style.scrollBehavior = prev;
  }
  ['load', 'error'].forEach(ev => document.addEventListener(ev, (e) => { if (e.target.closest && e.target.closest('#bookScroll')) setTimeout(repin, 0); }, true));
  addEventListener('wheel', () => { pin = null; }, { passive: true });
  addEventListener('touchmove', () => { pin = null; }, { passive: true });
  function observeBook() {
    if (spy) spy.disconnect();
    const root = $('#bookScroll');
    spy = new IntersectionObserver((es) => {
      if (Date.now() < spyLock) return;
      es.forEach(e => { if (e.isIntersecting) setActive(e.target.dataset.ch); });
    }, { root, rootMargin: '-10% 0px -80% 0px' });
    $$('.chapter', root).forEach(s => spy.observe(s));
  }

  function setActive(id) {
    $$('.toc__ch').forEach(a => {
      const on = a.dataset.ch === id;
      a.classList.toggle('on', on);
      a.closest('li').classList.toggle('open', on);
      if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
    });
    const ch = BOOK.chapters[id];
    if (ch) $('#bookWhere').textContent = ch.title;
    const on = $('.toc__ch.on');
    if (on) on.scrollIntoView({ block: 'nearest' });
  }

  function openBook(target, sub) {
    const book = $('#book');
    if (book.hidden) {
      book.hidden = false;
      document.body.classList.add('book-open');
      requestAnimationFrame(() => book.classList.add('on'));
    }
    $('#bookSide').classList.remove('open'); $('#bookMenu').setAttribute('aria-expanded', 'false');
    const scroller = $('#bookScroll');
    const el = target ? (sub ? document.getElementById(`${target}--${sub}`) : document.getElementById(target)) : null;
    if (el) {
      const top = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 12;
      const first = !book.dataset.shown;
      pin = { el, until: Date.now() + 2500 };
      spyLock = Date.now() + (first || reduceMotion.matches ? 250 : 900);
      scroller.style.scrollBehavior = first || reduceMotion.matches ? 'auto' : 'smooth';
      scroller.scrollTo({ top });
      setActive(target);
      el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
    } else { scroller.scrollTop = 0; setActive(chapterList()[0]); }
    book.dataset.shown = '1';
    setTimeout(() => $('#bookScroll').focus({ preventScroll: true }), 50);
  }

  function closeBook() {
    const book = $('#book');
    if (book.hidden) return;
    book.classList.remove('on');
    document.body.classList.remove('book-open');
    delete book.dataset.shown;
    setTimeout(() => { book.hidden = true; }, reduceMotion.matches ? 0 : 280);
  }

  /* búsqueda */
  function bindSearch() {
    const inp = $('#bookSearch');
    inp.addEventListener('input', () => {
      const q = inp.value.trim().toLowerCase();
      $$('.chapter').forEach(s => {
        $$('mark', s).forEach(m => m.replaceWith(document.createTextNode(m.textContent)));
        s.normalize();
      });
      $$('.toc li').forEach(li => li.hidden = false);
      if (q.length < 2) return;
      let first = null;
      $$('.chapter').forEach(s => {
        const hit = s.textContent.toLowerCase().includes(q);
        const a = $(`.toc__ch[data-ch="${s.id}"]`);
        a.closest('li').hidden = !hit;
        if (hit) {
          const w = document.createTreeWalker(s, NodeFilter.SHOW_TEXT);
          const found = [];
          while (w.nextNode()) { const t = w.currentNode; if (t.parentElement.closest('script,style')) continue; if (t.nodeValue.toLowerCase().includes(q)) found.push(t); }
          found.slice(0, 40).forEach(t => {
            const i = t.nodeValue.toLowerCase().indexOf(q);
            const r = t.splitText(i); r.splitText(q.length);
            const mk = document.createElement('mark'); r.parentNode.replaceChild(mk, r); mk.appendChild(r);
            first = first || mk;
          });
        }
      });
      if (first) first.scrollIntoView({ block: 'center', behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    });
  }

  /* ------------------------------------------------------------------ */
  /* ROUTER                                                              */
  /* ------------------------------------------------------------------ */
  function go(path) { location.hash = '#' + path; }

  function crumbs(parts) {
    $('#crumbs').innerHTML = parts.map((p, i) => p.href ? `<a href="${p.href}">${esc(p.t)}</a>` : `<span aria-current="page">${esc(p.t)}</span>`).join('<i aria-hidden="true">/</i>');
  }

  let renderedModel = null;

  function route() {
    const [, mid, ch, sub] = (location.hash.replace(/^#/, '') || '/').split('/');
    const model = MODELS.find(m => m.id === mid);
    const home = $('#viewHome'), view = $('#viewModel');

    if (!model) {
      closeBook();
      view.hidden = true; home.hidden = false;
      $('#btnBook').hidden = true;
      crumbs([{ t: 'Plataformas' }]);
      document.title = 'Configuración de Plataformas Aéreas · INDRA';
      return;
    }
    home.hidden = true; view.hidden = false;
    document.title = `${model.name} · Configuración · INDRA`;
    crumbs([{ t: 'Plataformas', href: '#/' }, { t: model.name }]);

    $('#modelEyebrow').textContent = model.ready ? model.tag : model.family;
    $('#modelTitle').textContent = model.name;

    if (!model.ready) {
      $('#modelLead').textContent = 'La documentación de esta plataforma está en preparación.';
      $('#scheme').innerHTML = `<div class="empty"><div class="empty__img" data-ph>${img(model.img, model.name)}</div><p>Esquema y libro de configuración próximamente.</p><a class="btn" href="#/">Volver a plataformas</a></div>`;
      $('#schemeHint').textContent = ''; $('#btnBook').hidden = true; renderedModel = null; closeBook();
      return;
    }

    $('#modelLead').textContent = model.lead;
    if (renderedModel !== model.id) { renderScheme(model.id); renderedModel = model.id; }
    $('#btnBook').hidden = false;

    if (ch) {
      if (ch !== 'libro' && !BOOK.chapters[ch]) { go(`/${model.id}`); return; }
      if (!$('#toc').children.length) renderBook();
      openBook(ch === 'libro' ? null : ch, sub);
    } else closeBook();
  }

  /* ------------------------------------------------------------------ */
  /* INIT                                                                */
  /* ------------------------------------------------------------------ */
  function init() {
    renderHome();
    bindSearch();
    $('#btnBook').addEventListener('click', () => go('/tarsis-v31/libro'));
    $('#book').addEventListener('click', (e) => { if (e.target.closest('[data-close]')) go('/tarsis-v31'); });
    $('#bookPrint').addEventListener('click', () => window.print());
    $('#bookMenu').addEventListener('click', () => {
      const s = $('#bookSide'); const o = s.classList.toggle('open'); $('#bookMenu').setAttribute('aria-expanded', o);
    });
    $('#toc').addEventListener('click', (e) => { if (e.target.closest('a')) $('#bookSide').classList.remove('open'); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !$('#book').hidden) go('/tarsis-v31');
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' && !$('#book').hidden) { e.preventDefault(); $('#bookSearch').focus(); }
    });
    addEventListener('hashchange', route);
    route();

    // marca de agua del fondo si falta el logo
    const probe = new Image();
    probe.onerror = () => document.body.classList.add('no-logo');
    probe.src = IMG + 'indra-logo.png';
  }

  init();
})();