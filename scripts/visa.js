/* =========================================================
   دروازه اسپانیا / Puerta España
   Static bilingual (FA/ES) content + rendering logic
   ========================================================= */

let currentLang = 'fa';

/* ---------------- Static UI strings ---------------- */
const I18N = {
  fa: {
    brandName: "دروازه اسپانیا",
    brandSub: "مشاوره تخصصی اقامت",
    navServices: "خدمات",
    navVisas: "انواع اقامت",
    navLegal: "وکالت رسمی",
    navTeam: "تیم ما",
    navContact: "تماس و دفاتر",
    callNowShort: "تماس فوری",
    heroTehran: "تهران",
    heroMadrid: "مادرید",
    heroEyebrow: "دفتر مادرید × دفتر تهران",
    heroTitle: "از تهران تا مادرید، مسیر اقامت‌تان را برای‌تان می‌سازیم",
    heroSub: "از اولین مشاوره تا مهر نهایی سفارت؛ مدارک، بانک، بیمه، ترجمه رسمی، انگیزه‌نامه و وکیل رسمی اسپانیایی — همه زیر یک سقف.",
    heroCta1: "مشاوره تلفنی رایگان",
    heroCta2: "مشاهده انواع اقامت",
    trust1n: "۵", trust1t: "مسیر اقامتی تخصصی",
    trust2n: "۲", trust2t: "دفتر — مادرید و تهران",
    trust3n: "۱۰۰٪", trust3t: "پیگیری تا مهر نهایی",
    servicesEyebrow: "همه چیز زیر یک سقف",
    servicesTitle: "کاری که ما برای شما انجام می‌دهیم",
    servicesSub: "شما فقط تصمیم می‌گیرید که به اسپانیا بروید؛ بقیه‌اش با ماست.",
    visasEyebrow: "پنج مسیر اصلی",
    visasTitle: "کدام نوع اقامت مناسب شماست؟",
    visasSub: "روی هرکدام بزنید تا مدارک، شرایط مالی و تفاوت درخواست از ایران با تمدید داخل اسپانیا را ببینید.",
    feesNote: "* ارقام مالی بر اساس آخرین به‌روزرسانی سال ۲۰۲۶ نهادهای رسمی اسپانیا است و ممکن است تغییر کند. برای هزینه دقیق خدمات ما و آخرین نرخ‌های سفارت تهران، تماس بگیرید.",
    legalBadge: "خدمت آپشنال",
    legalTitle: "وکیل رسمی اسپانیایی، پشت پرونده‌تان",
    legalBody: "در صورت تمایل، می‌توانید با هزینه‌ای جداگانه یک وکیل رسمی (Abogado) اسپانیایی را مستقیماً روی پرونده‌تان بگذارید. اگر درخواست رد شود یا پرونده به مرحله شکایت اداری یا دادگاهی (recurso) برسد، وکیل ما به‌صورت رسمی و حقوقی پیگیر آن خواهد بود.",
    legalP1: "بررسی حقوقی پرونده پیش از ارسال",
    legalP2: "پیگیری شکایت اداری (Recurso de Reposición / Alzada)",
    legalP3: "وکالت در دادگاه اداری اسپانیا در صورت نیاز",
    legalP4: "مکاتبات رسمی با اداره مهاجرت و سفارت",
    legalCta: "استعلام هزینه وکالت",
    teamEyebrow: "دو کشور، یک تیم",
    teamTitle: "با چه کسانی کار می‌کنید",
    officesEyebrow: "دو دفتر، یک مسیر",
    officesTitle: "دفاتر ما",
    footerNote: "مشاوره اقامت اسپانیا برای متقاضیان ایرانی — دفتر مادرید و دفتر تهران",
    fromIranKicker: "برای متقاضیان از ایران",
    renewKicker: "برای تمدید داخل اسپانیا",
    financeLabel: "حداقل تمکن مالی لازم (۲۰۲۶)"
  },
  es: {
    brandName: "Puerta España",
    brandSub: "Asesoría de residencia",
    navServices: "Servicios",
    navVisas: "Tipos de residencia",
    navLegal: "Representación legal",
    navTeam: "Nuestro equipo",
    navContact: "Contacto y oficinas",
    callNowShort: "Llamar ahora",
    heroTehran: "Teherán",
    heroMadrid: "Madrid",
    heroEyebrow: "Oficina en Madrid × Oficina en Teherán",
    heroTitle: "De Teherán a Madrid, construimos tu camino hacia la residencia",
    heroSub: "Desde la primera llamada hasta el sello final del consulado: documentación, banco, seguro, traducción jurada, carta de motivos y abogado español — todo bajo un mismo techo.",
    heroCta1: "Consulta telefónica gratuita",
    heroCta2: "Ver tipos de residencia",
    trust1n: "5", trust1t: "vías de residencia especializadas",
    trust2n: "2", trust2t: "oficinas — Madrid y Teherán",
    trust3n: "100%", trust3t: "seguimiento hasta el sello final",
    servicesEyebrow: "Todo bajo un mismo techo",
    servicesTitle: "Lo que hacemos por ti",
    servicesSub: "Tú solo decides irte a España; de lo demás nos encargamos nosotros.",
    visasEyebrow: "Cinco vías principales",
    visasTitle: "¿Qué tipo de residencia te conviene?",
    visasSub: "Haz clic en cada una para ver documentos, requisitos económicos y la diferencia entre solicitar desde Irán o renovar dentro de España.",
    feesNote: "* Las cifras económicas están actualizadas según las fuentes oficiales españolas de 2026 y pueden cambiar. Para el coste exacto de nuestros servicios y las tarifas más recientes del consulado en Teherán, llámanos.",
    legalBadge: "Servicio opcional",
    legalTitle: "Un abogado español, detrás de tu expediente",
    legalBody: "Si lo deseas, con un coste aparte, puedes contar con un abogado colegiado español directamente en tu expediente. Si la solicitud es denegada o el caso llega a vía de recurso administrativo o judicial, nuestro abogado lo defenderá de forma oficial.",
    legalP1: "Revisión jurídica del expediente antes de presentarlo",
    legalP2: "Recurso de Reposición / Alzada",
    legalP3: "Representación ante lo contencioso-administrativo si es necesario",
    legalP4: "Comunicación oficial con Extranjería y el consulado",
    legalCta: "Consultar coste de representación legal",
    teamEyebrow: "Dos países, un equipo",
    teamTitle: "Con quién vas a trabajar",
    officesEyebrow: "Dos oficinas, un camino",
    officesTitle: "Nuestras oficinas",
    footerNote: "Asesoría de residencia en España para solicitantes iraníes — oficina en Madrid y oficina en Teherán",
    fromIranKicker: "Para solicitantes desde Irán",
    renewKicker: "Para renovar dentro de España",
    financeLabel: "Medios económicos mínimos exigidos (2026)"
  }
};

/* ---------------- Services ---------------- */
const SERVICES = [
  { icon:"📋", fa:{t:"بررسی و آماده‌سازی مدارک", d:"چک‌لیست اختصاصی هر ویزا، بررسی مدرک به مدرک پیش از ارسال به سفارت تا رد نخورید."},
              es:{t:"Revisión y preparación documental", d:"Checklist específico para cada visado, revisado documento por documento antes de presentarlo."} },
  { icon:"🏦", fa:{t:"راهنمای بانکی و تمکن مالی", d:"راهنمایی برای افتتاح حساب، ترتیب صورت‌حساب و اثبات تمکن مالی مطابق استاندارد سفارت."},
              es:{t:"Asesoría bancaria y solvencia", d:"Apertura de cuenta, extractos bancarios y prueba de medios económicos según el estándar consular."} },
  { icon:"🩺", fa:{t:"بهترین بیمه سلامت اسپانیایی", d:"معرفی بیمه‌های تاییدشده، بدون فرانشیز و منطبق با الزامات سفارت اسپانیا."},
              es:{t:"El mejor seguro de salud español", d:"Seguros homologados, sin copago, conformes a los requisitos del consulado de España."} },
  { icon:"🌐", fa:{t:"مترجمین رسمی مورد تایید سفارت", d:"ترجمه رسمی اسپانیایی مدارک و پیگیری تاییدیه دادگستری، وزارت خارجه و لگالایز سفارت."},
              es:{t:"Traductores jurados homologados", d:"Traducción jurada al español y gestión de legalización en Justicia, Exteriores y el consulado."} },
  { icon:"✍️", fa:{t:"نگارش انگیزه‌نامه (Carta de Motivación)", d:"نگارش حرفه‌ای انگیزه‌نامه متناسب با نوع اقامت و پروفایل شخصی شما."},
              es:{t:"Redacción de carta de motivación", d:"Carta de motivos redactada a medida según el tipo de residencia y tu perfil."} },
  { icon:"⚖️", fa:{t:"وکیل رسمی اسپانیایی (آپشنال)", d:"در صورت نیاز، وکیل رسمی روی پرونده‌تان می‌نشیند و شکایت‌های اداری را پیگیری می‌کند."},
              es:{t:"Abogado español (opcional)", d:"Si lo necesitas, un abogado colegiado se hace cargo del expediente y de los recursos administrativos."} },
  { icon:"🗓️", fa:{t:"رزرو وقت سفارت و پیگیری پرونده", d:"هماهنگی وقت سفارت تهران و پیگیری مستمر وضعیت پرونده تا صدور ویزا."},
              es:{t:"Cita consular y seguimiento del caso", d:"Gestión de la cita en el consulado de Teherán y seguimiento continuo hasta la emisión del visado."} },
  { icon:"💬", fa:{t:"مشاوره کلی انتخاب نوع اقامت", d:"بررسی وضعیت شما و پیشنهاد بهترین مسیر اقامتی از میان پنج گزینه موجود."},
              es:{t:"Asesoría general para elegir el tipo de residencia", d:"Analizamos tu perfil y te recomendamos la vía más adecuada entre las cinco disponibles."} },
  { icon:"🏠", fa:{t:"همراهی پس از ورود به اسپانیا", d:"ثبت‌نام Padrón، گرفتن NIE/TIE و اولین قدم‌های اداری بعد از رسیدن به اسپانیا."},
              es:{t:"Acompañamiento tras la llegada a España", d:"Empadronamiento, obtención de NIE/TIE y primeros trámites administrativos al llegar."} }
];

/* ---------------- Visa data ---------------- */
const VISAS = [
  {
    id:"nolucrativo", icon:"💰",
    fa:{
      title:"اقامت تمکن مالی (No Lucrativo)",
      tagline:"برای کسانی که بدون کار کردن در اسپانیا زندگی می‌کنند",
      overview:"مناسب افرادی است که از محل پس‌انداز، مستمری، اجاره ملک یا سود سرمایه‌گذاری درآمد دارند و قصد اشتغال در اسپانیا را ندارند. این ویزا اجازه کار (حقوقی یا آزاد) در خاک اسپانیا را نمی‌دهد.",
      finAmount:"۲۸,۸۰۰ یورو در سال (متقاضی اصلی)",
      finNote:"معادل ۴۰۰٪ شاخص IPREM سال ۲۰۲۶؛ به‌ازای هر همراه، ۷,۲۰۰ یورو در سال (۱۰۰٪ IPREM) اضافه می‌شود.",
      fromIranIntro:"مدارک صادره در ایران چون امکان آپوستیل ندارند، باید مسیر لگالایز سه‌مرحله‌ای طی کنند.",
      fromIranDocs:[
        "فرم درخواست ویزای ملی و فرم اقامت اولیه (EX-01) تکمیل‌شده",
        "گذرنامه معتبر با حداقل ۱ سال اعتبار و ۲ صفحه خالی",
        "گواهی عدم سوءپیشینه (حداکثر ۵ سال اخیر) با ترجمه رسمی و تاییدیه دادگستری، وزارت خارجه و سفارت اسپانیا",
        "گواهی پزشکی مطابق مقررات بین‌المللی بهداشت (IHR 2005) با ترجمه رسمی",
        "بیمه سلامت اسپانیایی بدون فرانشیز و با پوشش کامل",
        "اسناد بانکی اثبات تمکن مالی سالانه (پرینت حساب، سپرده یا درآمد منظم)",
        "شناسنامه و کارت ملی با ترجمه رسمی برای اثبات اقامت در حوزه کنسولی تهران",
        "فرم پرداخت عوارض ۷۹۰ کد ۰۵۲ (کادر ۲.۱)"
      ],
      renewIntro:"برای تمدید، تمرکز از مدارک هویتی ایران به اثبات اقامت واقعی و تداوم تمکن مالی در اسپانیا منتقل می‌شود.",
      renewDocs:[
        "فرم تمدید اقامت (EX-01) و کپی TIE فعلی",
        "گواهی ثبت‌نام Padrón شهرداری محل سکونت",
        "اثبات به‌روز تمکن مالی — برای تمدید دوساله معمولاً معادل دو سال کامل نیاز است",
        "بیمه سلامت معتبر و فعال در طول دوره اقامت",
        "اثبات حضور حداقل ۱۸۳ روز در سال در خاک اسپانیا",
        "فیش پرداخت عوارض تمدید (Modelo 790)"
      ]
    },
    es:{
      title:"Residencia No Lucrativa",
      tagline:"Para quienes viven en España sin trabajar",
      overview:"Pensada para personas con ingresos de ahorros, pensión, alquiler o inversiones, que no van a ejercer actividad laboral en España. Esta visa no permite trabajar por cuenta ajena ni propia en territorio español.",
      finAmount:"28.800 € al año (solicitante principal)",
      finNote:"Equivale al 400% del IPREM 2026; cada familiar añade 7.200 €/año (100% del IPREM).",
      fromIranIntro:"Como los documentos emitidos en Irán no admiten apostilla, deben seguir una legalización en tres pasos.",
      fromIranDocs:[
        "Formulario de visado nacional y formulario EX-01 de residencia inicial, cumplimentados",
        "Pasaporte válido con al menos 1 año de vigencia y 2 páginas en blanco",
        "Certificado de antecedentes penales (últimos 5 años) traducido y legalizado por Justicia, Exteriores y el consulado de España",
        "Certificado médico conforme al Reglamento Sanitario Internacional (IHR 2005), con traducción jurada",
        "Seguro médico español, sin copago y con cobertura completa",
        "Documentación bancaria que acredite la solvencia anual (extractos, depósitos o ingresos recurrentes)",
        "Partida de nacimiento y documento de identidad traducidos, para acreditar residencia en la demarcación consular de Teherán",
        "Modelo 790, código 052 (casilla 2.1)"
      ],
      renewIntro:"En la renovación, el foco pasa de los documentos de identidad iraníes a la residencia efectiva y a la continuidad de los medios económicos en España.",
      renewDocs:[
        "Formulario de renovación (EX-01) y copia de la TIE vigente",
        "Certificado de empadronamiento del municipio de residencia",
        "Prueba actualizada de solvencia — para la renovación de 2 años suele exigirse el importe de ambos años",
        "Seguro médico vigente durante todo el periodo",
        "Prueba de permanencia de al menos 183 días al año en España",
        "Justificante de pago del Modelo 790 de renovación"
      ]
    }
  },
  {
    id:"nomada", icon:"💻",
    fa:{
      title:"ویزای دیجیتال نومد (دورکاری)",
      tagline:"برای دورکارها و فریلنسرهای بین‌المللی",
      overview:"برای کسانی که برای کارفرما یا مشتریان خارج از اسپانیا به‌صورت دورکار فعالیت می‌کنند. خوداشتغال‌ها (اتونومو) هم می‌توانند حداکثر ۲۰٪ از درآمدشان را از مشتریان اسپانیایی داشته باشند.",
      finAmount:"حدود ۲,۸۵۰ یورو در ماه (~۳۴,۲۰۰ یورو در سال)",
      finNote:"معادل ۲۰۰٪ حداقل دستمزد اسپانیا (SMI) در سال ۲۰۲۶؛ همراه اول ٪۷۵ و هر همراه بعدی ٪۲۵ اضافه می‌شود.",
      fromIranIntro:"علاوه بر مدارک هویتی، باید رابطه کاری با کارفرما یا مشتریان خارجی مستند و اثبات شود.",
      fromIranDocs:[
        "فرم درخواست ویزای ملی و شماره NIE پیش از درخواست",
        "گواهی حداقل ۳ ماه سابقه همکاری و رضایت‌نامه صریح کارفرما برای دورکاری از اسپانیا",
        "مدارک ثبتی شرکت کارفرمای خارجی (تاریخ تاسیس و نوع فعالیت)",
        "مدرک کارشناسی/ارشد دانشگاهی یا حداقل ۳ سال سابقه کار مرتبط، با ترجمه و تاییدیه رسمی",
        "گواهی عدم سوءپیشینه ۲ سال اخیر + خوداظهاری عدم سابقه کیفری ۵ ساله، لگالایزشده",
        "فرم A1 یا تعهدنامه ثبت‌نام در تامین اجتماعی اسپانیا (RETA برای خوداشتغال‌ها)",
        "بیمه سلامت کامل بدون فرانشیز یا فرم S1"
      ],
      renewIntro:"اقامت اولیه (در صورت درخواست داخل اسپانیا) تا ۳ سال معتبر است و سپس دوره‌های ۲ ساله تا سقف ۵ سال تمدید می‌شود.",
      renewDocs:[
        "اثبات به‌روز درآمد دورکاری بالای آستانه ۲۰۰٪ SMI",
        "قراردادها یا فاکتورهای فعال با کارفرما/مشتریان خارج از اسپانیا",
        "گواهی پرداخت منظم حق بیمه تامین اجتماعی (RETA یا معادل آن)",
        "گواهی Padrón و کپی TIE فعلی",
        "بیمه سلامت معتبر در طول دوره تمدید"
      ]
    },
    es:{
      title:"Visado de Nómada Digital",
      tagline:"Para teletrabajadores y freelancers internacionales",
      overview:"Para quienes trabajan de forma remota para empleadores o clientes fuera de España. Los autónomos también pueden facturar hasta un 20% de sus ingresos a clientes españoles.",
      finAmount:"Aprox. 2.850 €/mes (~34.200 €/año)",
      finNote:"Equivale al 200% del SMI de 2026; +75% para el primer familiar y +25% por cada familiar adicional.",
      fromIranIntro:"Además de la documentación identitaria, hay que acreditar y documentar la relación laboral con el empleador o los clientes extranjeros.",
      fromIranDocs:[
        "Formulario de visado nacional y número de NIE obtenido antes de la solicitud",
        "Certificado de al menos 3 meses de relación laboral y autorización expresa del empleador para teletrabajar desde España",
        "Documentación registral de la empresa extranjera (fecha de constitución y actividad)",
        "Título universitario o al menos 3 años de experiencia relacionada, traducido y legalizado",
        "Certificado de antecedentes penales de los últimos 2 años + declaración jurada de los últimos 5, legalizados",
        "Formulario A1 o compromiso de alta en la Seguridad Social española (RETA para autónomos)",
        "Seguro médico completo sin copago, o formulario S1"
      ],
      renewIntro:"La autorización inicial (si se solicita dentro de España) es válida hasta 3 años, y luego se renueva en periodos de 2 años hasta un máximo de 5.",
      renewDocs:[
        "Prueba actualizada de ingresos por teletrabajo por encima del 200% del SMI",
        "Contratos o facturas activas con el empleador o clientes fuera de España",
        "Justificante de pago regular de la Seguridad Social (RETA o equivalente)",
        "Certificado de empadronamiento y copia de la TIE vigente",
        "Seguro médico vigente durante todo el periodo de renovación"
      ]
    }
  },
  {
    id:"emprendedor", icon:"🚀",
    fa:{
      title:"ویزای کارآفرین (Emprendedor)",
      tagline:"برای ایده‌های نوآورانه و کسب‌وکارهای مقیاس‌پذیر",
      overview:"مبتنی بر ماده ۷۰ قانون ۱۴/۲۰۱۳ است. برخلاف ویزای طلایی، حداقل سرمایه ثابتی وجود ندارد؛ محور اصلی، تایید نوآورانه بودن طرح کسب‌وکار توسط ENISA است.",
      finAmount:"بدون سقف سرمایه ثابت — تمرکز روی طرح کسب‌وکار",
      finNote:"تمکن مالی شخصی حداقل معادل ۱۰۰٪ IPREM (~۶۰۰ یورو در ماه) به‌علاوه ۵۰٪ IPREM برای هر همراه؛ سرمایه پروژه معمولاً بین ۱۰,۰۰۰ تا ۵۰,۰۰۰ یورو به بالا متغیر است.",
      fromIranIntro:"مهم‌ترین مرحله، تهیه طرح کسب‌وکار قابل قبول ENISA است؛ سپس مدارک هویتی و مالی لگالایز می‌شوند.",
      fromIranDocs:[
        "طرح کسب‌وکار مفصل با تاکید بر نوآوری، مقیاس‌پذیری و ایجاد اشتغال، ثبت‌شده در سامانه ENISA",
        "گزارش مثبت ENISA یا نهاد مربوطه پیش از ثبت درخواست ویزا",
        "رزومه بنیان‌گذار و مدارک تحصیلی/سابقه کاری مرتبط، ترجمه و تاییدشده",
        "گواهی عدم سوءپیشینه ۵ سال اخیر با لگالایز کامل",
        "اسناد بانکی اثبات تمکن مالی شخصی (۱۰۰٪ IPREM + ۵۰٪ به‌ازای همراه)",
        "بیمه سلامت (توصیه‌شده، حتی اگر تحت تامین اجتماعی قرار بگیرید)"
      ],
      renewIntro:"اقامت اولیه (در صورت درخواست داخل اسپانیا) ۳ ساله است؛ تمدید دوساله نیازمند اثبات تداوم واقعی فعالیت کسب‌وکار است.",
      renewDocs:[
        "اثبات فعالیت واقعی شرکت (فاکتور فروش، قراردادها، گردش حساب شرکتی)",
        "گواهی ثبت و پرداخت منظم تامین اجتماعی (RETA یا بیمه کارکنان در صورت استخدام نیرو)",
        "گزارش مختصر پیشرفت پروژه نسبت به طرح کسب‌وکار اولیه",
        "گواهی Padrón و کپی TIE فعلی",
        "اثبات تمکن مالی به‌روزشده"
      ]
    },
    es:{
      title:"Visado de Emprendedor",
      tagline:"Para proyectos innovadores y escalables",
      overview:"Se basa en el artículo 70 de la Ley 14/2013. A diferencia de la Golden Visa, no exige una inversión mínima fija; lo esencial es que ENISA certifique el carácter innovador del plan de negocio.",
      finAmount:"Sin tope de inversión fijo — el foco está en el plan de negocio",
      finNote:"Medios propios de al menos el 100% del IPREM (~600 €/mes) más 50% por cada familiar; el capital del proyecto suele oscilar entre 10.000 y 50.000 € o más.",
      fromIranIntro:"El paso más importante es preparar un plan de negocio que ENISA apruebe; después se legalizan la documentación identitaria y económica.",
      fromIranDocs:[
        "Plan de negocio detallado centrado en innovación, escalabilidad y creación de empleo, registrado en la plataforma de ENISA",
        "Informe favorable de ENISA (u organismo competente) previo a la solicitud del visado",
        "CV del fundador y documentación académica o experiencia relevante, traducidos y legalizados",
        "Certificado de antecedentes penales de los últimos 5 años, totalmente legalizado",
        "Documentación bancaria que acredite medios propios (100% IPREM + 50% por familiar)",
        "Seguro médico (recomendado, aunque se pueda acceder a la Seguridad Social)"
      ],
      renewIntro:"La autorización inicial (si se solicita dentro de España) es de 3 años; la renovación bienal exige demostrar que la actividad empresarial sigue siendo real.",
      renewDocs:[
        "Prueba de actividad real de la empresa (facturación, contratos, movimientos de la cuenta empresarial)",
        "Alta y pago regular en la Seguridad Social (RETA o cotización de empleados contratados)",
        "Breve informe de avance del proyecto respecto al plan de negocio inicial",
        "Certificado de empadronamiento y copia de la TIE vigente",
        "Prueba actualizada de medios económicos"
      ]
    }
  },
  {
    id:"investigador", icon:"🔬",
    fa:{
      title:"اقامت پژوهشگر (Ley 14/2013)",
      tagline:"برای پژوهشگران، اساتید و دانشجویان دکتری",
      overview:"برای اعضای هیات علمی، پژوهشگران و پرسنل فنی که در دانشگاه، مرکز پژوهشی یا شرکت R&D اسپانیایی فعالیت می‌کنند. مسیر پرونده توسط موسسه میزبان از طریق واحد UGE-CE انجام می‌شود.",
      finAmount:"بر اساس قرارداد پژوهشی/استخدامی — بدون آستانه ثابت عمومی",
      finNote:"تمکن مالی باید متناسب با حقوق قرارداد پژوهشی و هزینه زندگی شما و همراهان‌تان باشد؛ رقم دقیق بسته به قرارداد محاسبه می‌شود.",
      fromIranIntro:"برخلاف سایر مسیرها، درخواست معمولاً توسط دانشگاه یا مرکز پژوهشی میزبان آغاز می‌شود، اما مدارک هویتی همچنان باید لگالایز شوند.",
      fromIranDocs:[
        "قرارداد پژوهشی یا توافق‌نامه پذیرش (Convenio de Acogida) از دانشگاه/مرکز پژوهشی اسپانیایی",
        "تاییدیه UGE-CE برای پذیرش نهاد میزبان (پیگیری‌شده توسط کارفرمای اسپانیایی)",
        "گذرنامه معتبر و مدارک هویتی با ترجمه رسمی و لگالایز کامل",
        "گواهی عدم سوءپیشینه ۵ سال اخیر، لگالایزشده",
        "بیمه سلامت عمومی یا خصوصی معتبر در اسپانیا",
        "اسناد اثبات تمکن مالی متناسب با حقوق قرارداد، برای متقاضی و همراهان"
      ],
      renewIntro:"اعتبار اولیه ۳ سال یا مدت قرارداد است (هرکدام کوتاه‌تر)؛ تمدید هر دو سال یک‌بار و در صورت تداوم شرایط، خودکار انجام می‌شود.",
      renewDocs:[
        "قرارداد یا توافق‌نامه پژوهشی به‌روزشده که تداوم همکاری را نشان دهد",
        "گواهی پرداخت منظم بیمه تامین اجتماعی از سوی موسسه میزبان",
        "گواهی Padrón و کپی TIE فعلی",
        "بیمه سلامت معتبر در طول دوره تمدید",
        "اثبات تمکن مالی به‌روزشده برای متقاضی و همراهان"
      ]
    },
    es:{
      title:"Residencia para Investigadores (Ley 14/2013)",
      tagline:"Para investigadores, docentes y doctorandos",
      overview:"Dirigida a personal docente, investigador y técnico que trabaja en una universidad, centro de investigación o empresa de I+D+i española. La tramitación la impulsa la entidad de acogida a través de la UGE-CE.",
      finAmount:"Según el contrato de investigación o laboral — sin umbral fijo general",
      finNote:"Los medios económicos deben ser acordes al salario del contrato de investigación y al coste de vida del solicitante y sus familiares; el importe exacto se calcula caso por caso.",
      fromIranIntro:"A diferencia de otras vías, la solicitud suele iniciarla la universidad o el centro de investigación de acogida, pero la documentación identitaria debe legalizarse igualmente.",
      fromIranDocs:[
        "Contrato de investigación o Convenio de Acogida de la universidad/centro de investigación español",
        "Autorización de la UGE-CE para la entidad de acogida (gestionada por el empleador español)",
        "Pasaporte válido y documentación identitaria, traducida y legalizada por completo",
        "Certificado de antecedentes penales de los últimos 5 años, legalizado",
        "Seguro médico público o privado válido en España",
        "Documentación de medios económicos acorde al salario del contrato, para el solicitante y sus familiares"
      ],
      renewIntro:"La validez inicial es de 3 años o la duración del contrato (lo que sea menor); la renovación es cada dos años y, si se mantienen las condiciones, es prácticamente automática.",
      renewDocs:[
        "Contrato o convenio de investigación actualizado que acredite la continuidad",
        "Justificante de cotización regular a la Seguridad Social por parte de la entidad de acogida",
        "Certificado de empadronamiento y copia de la TIE vigente",
        "Seguro médico vigente durante el periodo de renovación",
        "Prueba actualizada de medios económicos para el solicitante y sus familiares"
      ]
    }
  },
  {
    id:"estudiante", icon:"🎓",
    fa:{
      title:"ویزای دانشجویی",
      tagline:"پایین‌ترین آستانه مالی در میان اقامت‌های اسپانیا",
      overview:"برای پذیرفته‌شدگان دوره‌های تمام‌وقت (حداقل ۲۰ ساعت در هفته) در موسسات مجاز اسپانیایی؛ دانشجویان دوره‌های عالی می‌توانند تا ۳۰ ساعت در هفته نیز کار کنند.",
      finAmount:"حدود ۶۰۰ یورو در ماه (معادل مدت دوره تحصیلی)",
      finNote:"معادل ۱۰۰٪ IPREM سال ۲۰۲۶؛ برای یک سال تحصیلی حدود ۷,۲۰۰ یورو، هرچند نشان‌دادن ۸,۰۰۰ تا ۱۰,۰۰۰ یورو توصیه می‌شود.",
      fromIranIntro:"علاوه بر مدارک استاندارد، نامه پذیرش از موسسه اسپانیایی و برنامه دقیق دوره الزامی است.",
      fromIranDocs:[
        "نامه پذیرش رسمی از دانشگاه یا موسسه آموزشی مجاز اسپانیایی (حداقل ۲۰ ساعت در هفته)",
        "فرم درخواست ویزای ملی تکمیل‌شده",
        "گذرنامه معتبر با حداقل ۱ سال اعتبار",
        "اثبات تمکن مالی معادل مدت دوره (۱۰۰٪ IPREM در ماه)، از طریق پس‌انداز، حمایت خانواده یا بورسیه",
        "گواهی پزشکی معتبر (الزامی برای همه متقاضیان از سال ۲۰۲۵)",
        "بیمه سلامت معتبر در طول دوره تحصیل",
        "گواهی عدم سوءپیشینه برای دوره‌های بالای ۶ ماه، با ترجمه و لگالایز"
      ],
      renewIntro:"تمدید سالانه و منوط به ثبت‌نام مجدد در دوره تحصیلی است؛ در دوره‌های عالی امکان تبدیل به اقامت کاری پس از فارغ‌التحصیلی وجود دارد.",
      renewDocs:[
        "گواهی ثبت‌نام یا ادامه تحصیل برای سال جدید",
        "اثبات به‌روز تمکن مالی معادل مدت باقی‌مانده دوره",
        "بیمه سلامت معتبر برای سال جدید",
        "گواهی Padrón و کپی TIE فعلی",
        "در صورت تمایل به تبدیل اقامت پس از فارغ‌التحصیلی: مدارک قرارداد کاری یا پروژه کارآفرینی"
      ]
    },
    es:{
      title:"Visado de Estudiante",
      tagline:"El umbral económico más bajo entre las residencias españolas",
      overview:"Para admitidos en programas a tiempo completo (mínimo 20 horas semanales) en centros autorizados españoles; los estudiantes de programas superiores pueden trabajar hasta 30 horas semanales.",
      finAmount:"Aprox. 600 €/mes (según la duración del curso)",
      finNote:"Equivale al 100% del IPREM 2026; para un curso académico completo, unos 7.200 €, aunque se recomienda acreditar entre 8.000 y 10.000 €.",
      fromIranIntro:"Además de la documentación estándar, es obligatoria la carta de admisión del centro español y el programa detallado del curso.",
      fromIranDocs:[
        "Carta de admisión oficial de una universidad o centro educativo español autorizado (mínimo 20 h/semana)",
        "Formulario de visado nacional cumplimentado",
        "Pasaporte válido con al menos 1 año de vigencia",
        "Prueba de medios económicos equivalente a la duración del curso (100% del IPREM mensual), mediante ahorros, apoyo familiar o beca",
        "Certificado médico vigente (obligatorio para todos los solicitantes desde 2025)",
        "Seguro médico vigente durante todo el curso",
        "Certificado de antecedentes penales para cursos de más de 6 meses, traducido y legalizado"
      ],
      renewIntro:"La renovación es anual y depende de la matrícula del nuevo curso; en programas superiores es posible modificar a una residencia laboral tras graduarse.",
      renewDocs:[
        "Certificado de matrícula o continuidad del curso para el nuevo año",
        "Prueba actualizada de medios económicos según la duración restante",
        "Seguro médico vigente para el nuevo curso",
        "Certificado de empadronamiento y copia de la TIE vigente",
        "Si se desea modificar la residencia tras graduarse: contrato laboral o documentación del proyecto emprendedor"
      ]
    }
  }
];

/* ---------------- Team ---------------- */
const TEAM = [
  {
    initials:"ص", color:"var(--terracotta)", img:"../images/sadeqLM.png",
    fa:{ name:"دکتر صادق", role:"مهندس هوافضا و رباتیک — مادرید",
         bio:"دکترای مهندسی هوافضا و رباتیک از دانشگاه پلی‌تکنیک مادرید (UPM)، با بیش از ۱۰ سال تجربه در پهپادها، دینامیک پرواز و سامانه‌های خودران. ساکن و فعال در مادرید و کاملاً مسلط به فرآیندهای اداری و زندگی در اسپانیا." },
    es:{ name:"Dr. Sadeq", role:"Ingeniero Aeroespacial y de Robótica — Madrid",
         bio:"Doctor en Ingeniería Aeroespacial y Robótica por la Universidad Politécnica de Madrid (UPM), con más de 10 años de experiencia en drones, dinámica de vuelo y sistemas autónomos. Residente en Madrid y con dominio total de los trámites y la vida en España." }
  },
  {
    initials:"م", color:"var(--turquoise)", img:"../images/masoumeh.png",
    fa:{ name:"دکتر معصومه", role:"دکترای زبان‌شناسی — مادرید",
         bio:"دکترای زبان از دانشگاه خودمختار مادرید (UAM). متن معرفی تکمیلی به‌زودی اضافه می‌شود." },
    es:{ name:"Dra. Masumeh", role:"Doctora en Lingüística — Madrid",
         bio:"Doctora en Filología por la Universidad Autónoma de Madrid (UAM). Texto de presentación completo próximamente." }
  },
  {
    initials:"ر", color:"var(--gold)", img:"",
    fa:{ name:"همکار تهران", role:"مسئول امور حضوری — تهران",
         bio:"مسئول رسیدگی حضوری به پرونده‌ها، هماهنگی وقت سفارت و پیگیری لگالایز مدارک در تهران. متن معرفی تکمیلی به‌زودی اضافه می‌شود." },
    es:{ name:"Colaborador en Teherán", role:"Responsable de gestión presencial — Teherán",
         bio:"Encargado de atender los expedientes en persona, coordinar las citas del consulado y la legalización de documentos en Teherán. Texto de presentación completo próximamente." }
  }
];

/* ---------------- Offices ---------------- */
const OFFICES = [
  {
    city:{fa:"دفتر مادرید", es:"Oficina de Madrid"},
    icon:"🇪🇸",
    lines:[
      {fa:"Calle José Abascal, 6, 28006 Madrid", es:"Calle José Abascal, 6, 28006 Madrid"},
      {fa:"تلفن: +34 645 391 640", es:"Teléfono: +34 645 391 640"}
    ],
    tel:"+34645391640"
  },
  {
    city:{fa:"دفتر تهران", es:"Oficina de Teherán"},
    icon:"🇮🇷",
    lines:[
      {fa:"ونک، ده ونک، تهران", es:"Deh-e Vanak, Vanak, Teherán"},
      {fa:"تلفن: ۰۹۱۲۳۲۰۸۷۲۲", es:"Teléfono: 0912 320 8722"}
    ],
    tel:"+989123208722"
  }
];

/* ---------------- Rendering ---------------- */
let activeVisaId = VISAS[0].id;

function renderServices(){
  const grid = document.getElementById('servicesGrid');
  grid.innerHTML = SERVICES.map(s => `
    <div class="service-card">
      <span class="service-icon">${s.icon}</span>
      <h3>${s[currentLang].t}</h3>
      <p>${s[currentLang].d}</p>
    </div>
  `).join('');
}

function renderVisaTabs(){
  const tabs = document.getElementById('visaTabs');
  tabs.innerHTML = VISAS.map(v => `
    <button class="visa-tab ${v.id===activeVisaId?'active':''}" data-visa="${v.id}">
      <span class="tab-ico">${v.icon}</span><span>${v[currentLang].title}</span>
    </button>
  `).join('');
  tabs.querySelectorAll('.visa-tab').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      activeVisaId = btn.dataset.visa;
      renderVisaTabs();
      renderVisaPanel();
    });
  });
}

function renderVisaPanel(){
  const v = VISAS.find(x=>x.id===activeVisaId);
  const t = v[currentLang];
  const panel = document.getElementById('visaPanel');
  panel.innerHTML = `
    <div class="visa-head">
      <div>
        <span class="visa-tagline">${t.tagline}</span>
        <h3>${v.icon} ${t.title}</h3>
      </div>
    </div>
    <p class="visa-overview">${t.overview}</p>
    <div class="finance-box">
      <div>
        <div class="fin-label">${I18N[currentLang].financeLabel}</div>
        <div class="fin-amount">${t.finAmount}</div>
      </div>
      <div class="fin-note">${t.finNote}</div>
    </div>
    <div class="audience-grid">
      <div class="audience-card from-iran">
        <span class="audience-kicker">${I18N[currentLang].fromIranKicker}</span>
        <h4>${t.fromIranIntro}</h4>
        <ul class="doc-list">${t.fromIranDocs.map(d=>`<li>${d}</li>`).join('')}</ul>
      </div>
      <div class="audience-card renew-spain">
        <span class="audience-kicker">${I18N[currentLang].renewKicker}</span>
        <h4>${t.renewIntro}</h4>
        <ul class="doc-list">${t.renewDocs.map(d=>`<li>${d}</li>`).join('')}</ul>
      </div>
    </div>
  `;
}

function renderTeam(){
  const grid = document.getElementById('teamGrid');
  grid.innerHTML = TEAM.map(p => `
    <div class="team-card">
      <div class="avatar" style="background:${p.color}">
        ${p.img
          ? `<img src="${p.img}" alt="${p[currentLang].name}" onerror="this.remove()">`
          : ''}
        <span class="avatar-fallback">${p.initials}</span>
      </div>
      <h3>${p[currentLang].name}</h3>
      <span class="role">${p[currentLang].role}</span>
      <p>${p[currentLang].bio}</p>
    </div>
  `).join('');
}

function renderOffices(){
  const grid = document.getElementById('officesGrid');
  grid.innerHTML = OFFICES.map(o => `
    <div class="office-card">
      <div class="office-city">${o.icon} ${o.city[currentLang]}</div>
      ${o.lines.map(l=>`<div class="office-line">${l[currentLang]}</div>`).join('')}
      <div class="office-line"><a href="tel:${o.tel}">${currentLang==='fa' ? 'تماس بگیرید' : 'Llamar'} →</a></div>
    </div>
  `).join('');
}

function applyStaticI18n(){
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key = el.getAttribute('data-i18n');
    if (I18N[currentLang][key] !== undefined){
      el.textContent = I18N[currentLang][key];
    }
  });
}

function setLanguage(lang){
  currentLang = lang;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
  document.getElementById('btnFa').classList.toggle('active', lang==='fa');
  document.getElementById('btnEs').classList.toggle('active', lang==='es');
  applyStaticI18n();
  renderServices();
  renderVisaTabs();
  renderVisaPanel();
  renderTeam();
  renderOffices();
}

/* ---------------- Init ---------------- */
document.addEventListener('DOMContentLoaded', ()=>{
  document.getElementById('btnFa').addEventListener('click', ()=>setLanguage('fa'));
  document.getElementById('btnEs').addEventListener('click', ()=>setLanguage('es'));

  const burger = document.getElementById('burgerBtn');
  const nav = document.getElementById('mainNav');
  burger.addEventListener('click', ()=>{
    nav.classList.toggle('open');
  });

  setLanguage('fa');
});