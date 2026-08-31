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
    navFaq: "سوالات متداول",
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
    financeLabel: "حداقل تمکن مالی لازم (۲۰۲۶)",
    visaFaqTitle: "سوالات پرتکرار درباره همین اقامت",
    faqEyebrow: "قبل از تماس بخوانید",
    faqTitle: "سوالات متداول",
    faqSub: "این سوالات را واقعاً از ما پرسیده‌اند — شاید جواب سوال شما هم همین‌جا باشد."
  },
  es: {
    brandName: "Puerta España",
    brandSub: "Asesoría de residencia",
    navServices: "Servicios",
    navVisas: "Tipos de residencia",
    navFaq: "Preguntas frecuentes",
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
    financeLabel: "Medios económicos mínimos exigidos (2026)",
    visaFaqTitle: "Preguntas frecuentes sobre esta residencia",
    faqEyebrow: "Antes de llamarnos, lee esto",
    faqTitle: "Preguntas frecuentes",
    faqSub: "Estas son preguntas que nos han hecho de verdad — puede que la tuya ya esté respondida aquí."
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
    fa:{ name:"دکتر صادق اسحاق", role:"مهندس هوافضا — مادرید",
         bio:"دکترای مهندسی هوافضا از دانشگاه پلی‌تکنیک مادرید (UPM)، با بیش از ۱۰ سال تجربه در پهپادها، دینامیک پرواز و سامانه‌های خودران. ساکن و فعال در مادرید و کاملاً مسلط به فرآیندهای اداری و زندگی در اسپانیا." },
    es:{ name:"Dr. Sadeq", role:"Ingeniero Aeroespacial y de Robótica — Madrid",
         bio:"Doctor en Ingeniería Aeroespacial y Robótica por la Universidad Politécnica de Madrid (UPM), con más de 10 años de experiencia en drones, dinámica de vuelo y sistemas autónomos. Residente en Madrid y con dominio total de los trámites y la vida en España." }
  },
  {
    initials:"م", color:"var(--turquoise)", img:"../images/masoumeh.png",
    fa:{ name:"دکتر معصومه رضایی", role:"دکترای زبان‌شناسی — مادرید",
         bio:"دکترای زبان از دانشگاه خودمختار مادرید (UAM). متن معرفی تکمیلی به‌زودی اضافه می‌شود." },
    es:{ name:"Dra. Masumeh", role:"Doctora en Lingüística — Madrid",
         bio:"Doctora en Filología por la Universidad Autónoma de Madrid (UAM). Texto de presentación completo próximamente." }
  },
  {
    initials:"ر", color:"var(--gold)", img:"",
    fa:{ name:"رضا رضایی", role:"مسئول امور حضوری — تهران",
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

/* ---------------- General FAQ (site-wide) ---------------- */
const GENERAL_FAQ = [
  {
    fa:{ q:"آیا دو نفر می‌توانند با هم یک شرکت ثبت کنند و هر دو برای ویزای کارآفرین اقدام کنند؟",
         a:"بله، ثبت شرکت (SL) با چند شریک کاملاً قانونی است. اما نکته مهم این‌جاست: خودِ ویزای Emprendedor به «طرح کسب‌وکار» تعلق می‌گیرد، نه به شرکت به‌تنهایی — یعنی هر متقاضی باید نقش مدیریتی و اجرایی واقعی خودش در پروژه را برای ENISA و اداره مهاجرت اثبات کند. در پرونده‌های دو‌نفره معمولاً هرکدام باید مسئولیت مشخص و مستندی (مثلاً یکی CTO فنی، دیگری مدیر تجاری) داشته باشد تا هر دو پرونده مستقل تایید شود." },
    es:{ q:"¿Pueden dos personas registrar juntas una empresa y solicitar ambas el visado de emprendedor?",
         a:"Sí, constituir una SL con varios socios es totalmente legal. Pero el visado de Emprendedor se concede en base al plan de negocio, no solo a la empresa: cada solicitante debe acreditar ante ENISA y Extranjería su rol de gestión real y efectivo en el proyecto. En expedientes de dos socios, cada uno debe tener una responsabilidad clara y documentada (por ejemplo, uno como CTO técnico y otro como director comercial) para que ambos expedientes se aprueben de forma independiente." }
  },
  {
    fa:{ q:"آیا متراژ فیزیکی دفتر شرکت برای ویزای کارآفرین اهمیت دارد؟",
         a:"قانون هیچ متراژ ثابتی تعیین نکرده است؛ آنچه اهمیت دارد این است که آدرس ثبتی (Domicilio Social) واقعی، قابل تایید و قادر به دریافت مکاتبات رسمی باشد. آنچه بازرسان بیشتر روی آن حساسند تناسب فضا با نوع فعالیت است — یک استارتاپ نرم‌افزاری با دو نفر نیازی به دفتر بزرگ ندارد، اما یک کسب‌وکار تولیدی باید فضای متناسب با فعالیتش را نشان دهد." },
    es:{ q:"¿Importa el tamaño físico de la oficina para el visado de emprendedor?",
         a:"La ley no fija ningún metraje mínimo; lo que importa es que el domicilio social sea real, verificable y capaz de recibir notificaciones oficiales. Lo que sí se valora es la coherencia entre el espacio y la actividad: una startup de software con dos personas no necesita una oficina grande, pero un negocio de producción sí debe mostrar un espacio acorde a su actividad." }
  },
  {
    fa:{ q:"می‌شود آدرس شرکت یک فضای coworking باشد؟",
         a:"بله، فضاهای coworking برای ثبت آدرس شرکت (domicilio social) کاملاً پذیرفته می‌شوند و در عمل یکی از رایج‌ترین گزینه‌ها برای استارتاپ‌های خارجی در مادرید و بارسلونا هستند. فقط باید از coworking گواهی رسمی «قرارداد دامیسیلیو» یا میز اختصاصی بگیرید تا در پرونده به‌عنوان مدرک ارائه شود." },
    es:{ q:"¿Puede la dirección de la empresa ser un espacio de coworking?",
         a:"Sí, los espacios de coworking son totalmente aceptados como domicilio social y, de hecho, son una de las opciones más habituales para startups extranjeras en Madrid y Barcelona. Solo hay que obtener del coworking un certificado oficial de domiciliación o de mesa dedicada para aportarlo como prueba en el expediente." }
  },
  {
    fa:{ q:"سقف مالیات شرکتی (Impuesto de Sociedades) که باید سالانه بپردازیم چقدر است؟",
         a:"نرخ عمومی مالیات شرکت‌ها در اسپانیا ۲۵٪ سود است. اما شرکت‌های نوپا و نوآور (Empresa Emergente طبق قانون استارتاپ) در دو سال اول سودآوری از نرخ ترجیحی ۱۵٪ بهره‌مند می‌شوند. شرکت‌های کوچک با گردش مالی زیر ۱۰ میلیون یورو هم مشمول نرخ‌های پلکانی کاهش‌یافته (حدود ۲۳-۲۴٪ در سال ۲۰۲۶، با روند کاهشی تا ۲۰۲۹) هستند. رقم دقیق بسته به نوع و اندازه شرکت شما متفاوت است — در مشاوره تلفنی با جزئیات پروژه‌تان محاسبه‌اش می‌کنیم." },
    es:{ q:"¿Cuál es el tipo máximo de Impuesto de Sociedades que pagaremos cada año?",
         a:"El tipo general del Impuesto de Sociedades en España es del 25% sobre el beneficio. Sin embargo, las empresas emergentes (bajo la Ley de Startups) disfrutan de un tipo reducido del 15% durante los dos primeros años con beneficios. Las pequeñas empresas con facturación inferior a 10 millones de euros también aplican tipos reducidos escalonados (en torno al 23-24% en 2026, con una tendencia a la baja hasta 2029). La cifra exacta depende del tipo y tamaño de tu empresa — lo calculamos contigo en la llamada según los detalles de tu proyecto." }
  },
  {
    fa:{ q:"برای ویزای کارآفرین چند نفر کارمند اسپانیایی حتماً باید استخدام کنیم؟",
         a:"هیچ عدد ثابت و اجباری در قانون وجود ندارد — ویزای Emprendedor بر پایه «نوآوری و منافع اقتصادی برای اسپانیا» ارزیابی می‌شود نه تعداد استخدام. اما در عمل، طرح‌هایی که ایجاد اشتغال واقعی (معمولاً ۳ نفر یا بیشتر در میان‌مدت) را نشان می‌دهند، در گزارش ENISA و ارزیابی نهایی امتیاز بسیار بالاتری می‌گیرند. پس استخدام اجباری نیست، ولی برگ برنده‌ی قوی برای تایید سریع‌تر پرونده است." },
    es:{ q:"¿Cuántos empleados españoles estamos obligados a contratar para el visado de emprendedor?",
         a:"No existe una cifra fija ni obligatoria por ley — el visado de Emprendedor se evalúa según la innovación y el beneficio económico para España, no según el número de contrataciones. Sin embargo, en la práctica, los proyectos que demuestran creación real de empleo (habitualmente 3 o más puestos a medio plazo) obtienen una puntuación mucho más alta en el informe de ENISA. Así que no es obligatorio, pero es un argumento muy fuerte para una aprobación más rápida." }
  },
  {
    fa:{ q:"با ویزای دیجیتال نومد اسپانیا، می‌توانم به هلند یا کشور دیگر شینگن نقل مکان کنم؟",
         a:"نه به این شکل. اقامت دیجیتال نومد فقط اقامت در خاک اسپانیا را به شما می‌دهد. با کارت اقامت اسپانیایی (TIE) می‌توانید حداکثر ۹۰ روز در هر بازه ۱۸۰ روزه به‌صورت آزاد به سایر کشورهای شینگن (از جمله هلند) سفر کنید — اما این یعنی «سفر کوتاه»، نه اقامت یا زندگی دائم. اگر بخواهید در هلند زندگی یا کار کنید، باید مستقل از اسپانیا برای اقامت هلند اقدام کنید." },
    es:{ q:"Con el visado de nómada digital de España, ¿puedo mudarme a Países Bajos o a otro país Schengen?",
         a:"No de esa forma. La residencia de nómada digital te da derecho a residir en territorio español. Con tu TIE española puedes viajar libremente hasta 90 días dentro de cualquier periodo de 180 días a otros países Schengen (incluidos los Países Bajos) — pero eso es una estancia corta, no una residencia. Si quieres vivir o trabajar en Países Bajos, necesitas solicitar tu propia residencia allí, de forma independiente a España." }
  },
  {
    fa:{ q:"دوست من راننده است (پایه یک و دو) و بین ایران و کشورهای دیگر کار می‌کند؛ چه نوع اقامتی برایش مناسب است؟",
         a:"این حالت در هیچ‌کدام از پنج مسیر تخصصی بالا نمی‌گنجد، چون ویزای کاری معمولی (Autorización de Residencia y Trabajo por Cuenta Ajena) است که باید توسط یک کارفرمای اسپانیایی درخواست شود، نه خود فرد. نکته خوب این‌جاست که «حمل‌ونقل» یکی از بخش‌هایی است که در سال ۲۰۲۶ در «فهرست مشاغل کمبود نیرو» (Catálogo de Ocupaciones de Difícil Cobertura) قرار دارد و در این حالت کارفرما از نیاز به اثبات نبود نیروی داخلی معاف می‌شود و روند سریع‌تر پیش می‌رود. برای این مسیر باید حتماً یک کارفرمای اسپانیایی مشخص وجود داشته باشد؛ برای بررسی دقیق پرونده و پیدا کردن بهترین راه، تماس بگیرید." },
    es:{ q:"Mi amigo es conductor profesional (carnés tipo 1 y 2) y trabaja entre Irán y otros países; ¿qué tipo de residencia le conviene?",
         a:"Este caso no encaja en ninguna de las cinco vías especializadas de arriba, porque se trata de una Autorización de Residencia y Trabajo por Cuenta Ajena, que debe solicitar el empleador español, no el propio trabajador. La buena noticia es que el transporte es uno de los sectores incluidos en 2026 en el Catálogo de Ocupaciones de Difícil Cobertura, lo que exime al empleador de acreditar la falta de candidatos en España y agiliza el trámite. Para esta vía es imprescindible contar con un empleador español concreto; llámanos para revisar el caso a fondo y encontrar el mejor camino." }
  },
  {
    fa:{ q:"آیا می‌توانم خانواده‌ام (همسر، فرزندان، والدین) را همراه خودم بیاورم؟",
         a:"بله، در تمام پنج مسیر امکان همراه‌آوردن همسر یا شریک زندگی ثبت‌شده، فرزندان تحت تکفل و در برخی موارد والدین تحت تکفل وجود دارد. برای هر همراه، معمولاً باید مقدار اضافه‌ای به تمکن مالی خانواده اضافه شود و مدارک رابطه (سند ازدواج، شناسنامه) لگالایز و ترجمه شوند." },
    es:{ q:"¿Puedo traer a mi familia (cónyuge, hijos, padres) conmigo?",
         a:"Sí, en las cinco vías es posible incluir al cónyuge o pareja de hecho registrada, a los hijos dependientes y, en algunos casos, a los padres dependientes. Por cada familiar suele exigirse un importe adicional de solvencia económica, además de traducir y legalizar los documentos que acrediten el parentesco (partida de matrimonio, de nacimiento, etc.)." }
  },
  {
    fa:{ q:"روند رسیدگی به پرونده معمولاً چقدر طول می‌کشد؟",
         a:"بسته به نوع ویزا و مسیر درخواست فرق می‌کند: بیشتر ویزاهای ملی از طریق سفارت تهران حدود ۱۰ روز تا ۱ ماه کاری زمان می‌برند؛ پرونده‌های UGE-CE (کارآفرین، پژوهشگر، دیجیتال نومد در صورت درخواست داخل اسپانیا) معمولاً حدود ۲۰ روز کاری هستند. این زمان‌ها تقریبی‌اند و ممکن است تغییر کنند؛ زمان دقیق پرونده شما را در تماس تلفنی به شما می‌گوییم." },
    es:{ q:"¿Cuánto suele tardar la resolución del expediente?",
         a:"Depende del tipo de visado y de la vía de solicitud: la mayoría de visados nacionales tramitados en el consulado de Teherán tardan entre 10 días y 1 mes; los expedientes de la UGE-CE (emprendedor, investigador, nómada digital si se solicita dentro de España) suelen resolverse en unos 20 días hábiles. Estos plazos son orientativos y pueden cambiar; te damos el tiempo estimado exacto de tu caso en la llamada." }
  },
  {
    fa:{ q:"آیا داشتن سابقه کیفری قدیمی، پرونده را رد می‌کند؟",
         a:"لزوماً نه. اداره مهاجرت و سفارت هر پرونده را بر اساس نوع، شدت و قدم جرم (و اینکه در استانداردهای اسپانیایی/اروپایی چطور طبقه‌بندی می‌شود) بررسی می‌کنند. مهم‌ترین کار این است که هیچ‌چیزی را پنهان نکنید و مدارک را با ترجمه و لگالایز کامل ارائه دهید. در مشاوره اولیه وضعیت خاص شما را بررسی می‌کنیم." },
    es:{ q:"¿Un antecedente penal antiguo hace que rechacen el expediente?",
         a:"No necesariamente. Extranjería y el consulado valoran cada caso según el tipo, la gravedad y la antigüedad del delito (y cómo se clasifica según los estándares españoles/europeos). Lo más importante es no ocultar nada y presentar la documentación con traducción y legalización completas. En la consulta inicial revisamos tu situación concreta." }
  },
  {
    fa:{ q:"آیا می‌شود بعداً نوع اقامتم را عوض کنم (مثلاً از دانشجویی به کاری)؟",
         a:"در بسیاری موارد بله، از طریق «تغییر وضعیت اقامت» (Modificación de Residencia) — مثلاً دانشجویانی که فارغ‌التحصیل می‌شوند و پیشنهاد کاری می‌گیرند، یا کارآفرینانی که می‌خواهند مسیر را عوض کنند. شرایط دقیق بسته به نوع اقامت فعلی و مقصد فرق می‌کند؛ توجه کنید که برخی مسیرها (مثل تبدیل از No Lucrativo یا اقامت‌های غیرکاری به دیجیتال نومد) دیگر از داخل اسپانیا امکان‌پذیر نیست و باید از خارج دوباره اقدام شود." },
    es:{ q:"¿Puedo cambiar más adelante mi tipo de residencia (por ejemplo, de estudiante a laboral)?",
         a:"En muchos casos sí, mediante una Modificación de Residencia — por ejemplo, estudiantes que se gradúan y reciben una oferta de trabajo, o emprendedores que quieren cambiar de vía. Las condiciones exactas dependen del tipo de residencia actual y del destino; ten en cuenta que algunas conversiones (como pasar de No Lucrativo u otras residencias no laborales a nómada digital) ya no se pueden tramitar desde dentro de España y hay que solicitarlas de nuevo desde el extranjero." }
  }
];

/* ---------------- Per-visa FAQ ---------------- */
const VISA_FAQ = {
  nolucrativo: [
    { fa:{q:"با اقامت No Lucrativo می‌شود کار کرد؟", a:"خیر، این اقامت به‌طور کامل کار کردن (چه به‌صورت استخدامی و چه آزاد) در اسپانیا را ممنوع می‌کند. اگر قصد کار دارید، باید بعداً از طریق «تغییر وضعیت» به اقامت کاری تبدیل کنید یا از ابتدا مسیر دیگری انتخاب کنید."},
      es:{q:"¿Se puede trabajar con la residencia No Lucrativa?", a:"No, esta residencia prohíbe totalmente trabajar (por cuenta ajena o propia) en España. Si quieres trabajar, deberás solicitar más adelante una Modificación a una residencia laboral, o elegir otra vía desde el principio."} },
    { fa:{q:"آیا درآمد اجاره ملک در ایران هم به‌عنوان تمکن مالی قبول می‌شود؟", a:"بله، به شرط آن‌که با اسناد بانکی و رسمی قابل اثبات و ترجمه باشد. سفارت ترجیح می‌دهد درآمد پایدار و مستمر (اجاره، مستمری، سود سرمایه‌گذاری) را ببیند تا صرفاً یک موجودی یک‌باره در حساب."},
      es:{q:"¿Se acepta el alquiler de una propiedad en Irán como medio económico?", a:"Sí, siempre que se pueda acreditar y traducir mediante documentación bancaria y oficial. El consulado prefiere ver ingresos estables y recurrentes (alquiler, pensión, rendimientos de inversión) antes que un simple saldo puntual en cuenta."} },
    { fa:{q:"بعد از گرفتن No Lucrativo چقدر طول می‌کشد تا بشود به اقامت کاری تبدیلش کرد؟", a:"طبق اصلاحیه‌های اخیر آیین‌نامه خارجی‌ها، در برخی موارد می‌توان زودتر از پایان سال اول برای تبدیل به اقامت کاری اقدام کرد، اما شرایط دقیق (پیشنهاد کاری معتبر، وضعیت پرونده) باید بررسی شود. توصیه می‌کنیم پیش از تصمیم‌گیری با ما تماس بگیرید تا مسیر بهینه را طراحی کنیم."},
      es:{q:"¿Cuánto hay que esperar tras obtener la No Lucrativa para modificarla a una residencia laboral?", a:"Con las últimas reformas del Reglamento de Extranjería, en algunos casos es posible solicitar la modificación antes de completar el primer año, pero las condiciones exactas (oferta de trabajo válida, estado del expediente) deben revisarse caso por caso. Te recomendamos llamarnos antes de decidir para diseñar la mejor estrategia."} },
    { fa:{q:"آیا حتماً باید ملک بخرم یا اجاره‌نامه بلندمدت داشته باشم؟", a:"نه، فقط باید نشانی واقعی محل سکونت در اسپانیا را (اجاره کوتاه‌مدت، هتل آپارتمان یا دعوت‌نامه اقامت) در زمان مراجعه به Padrón ارائه دهید؛ مالکیت ملک الزامی نیست."},
      es:{q:"¿Es obligatorio comprar una vivienda o tener un contrato de alquiler largo?", a:"No, solo necesitas acreditar un domicilio real en España (alquiler de corta duración, apartahotel o carta de invitación) para el empadronamiento; la propiedad no es obligatoria."} }
  ],
  nomada: [
    { fa:{q:"آیا کارفرمای من باید حتماً سابقه‌ی شرکتی مشخصی داشته باشد؟", a:"بله، شرکت کارفرما باید حداقل ۱ سال از تاسیسش گذشته باشد و فعالیت واقعی داشته باشد؛ همچنین شما باید حداقل ۳ ماه سابقه همکاری با همان کارفرما یا مشتری داشته باشید."},
      es:{q:"¿Mi empleador debe tener un historial mínimo como empresa?", a:"Sí, la empresa empleadora debe llevar al menos 1 año constituida y tener actividad real; además, tú debes acreditar al menos 3 meses de relación laboral con ese mismo empleador o cliente."} },
    { fa:{q:"آیا اتونومو (خوداشتغال) هم می‌تواند برای این ویزا اقدام کند؟", a:"بله، فریلنسرها و خوداشتغال‌ها هم واجد شرایط هستند، به شرط آنکه حداکثر ۲۰٪ درآمدشان از مشتریان اسپانیایی باشد و بقیه از مشتریان خارج از اسپانیا."},
      es:{q:"¿Los autónomos también pueden solicitar este visado?", a:"Sí, los freelancers y autónomos también son elegibles, siempre que como máximo el 20% de sus ingresos provenga de clientes españoles y el resto de clientes fuera de España."} },
    { fa:{q:"اگر بخواهم بعداً به اقامت دیگری (مثلاً No Lucrativo) تغییر مسیر بدهم چه؟", a:"توجه کنید که مسیر برعکس آن ساده‌تر نیست: طبق قوانین جدید، تبدیل از اقامت‌های غیرکاری (مثل No Lucrativo) به دیجیتال نومد از داخل اسپانیا دیگر امکان‌پذیر نیست و باید دوباره از خارج اقدام کرد؛ پس بهتر است از ابتدا مسیر درستی را با مشورت ما انتخاب کنید."},
      es:{q:"¿Y si más adelante quiero cambiar a otra residencia (por ejemplo, No Lucrativa)?", a:"Ten en cuenta que el camino inverso no es sencillo: según la normativa vigente, ya no se puede modificar desde dentro de España una residencia no laboral (como la No Lucrativa) hacia el nómada digital; hay que volver a solicitarlo desde fuera. Por eso es mejor elegir bien la vía desde el principio, con nuestro asesoramiento."} },
    { fa:{q:"مالیات این ویزا چطور است؟ آیا از قانون بکهام استفاده کنم؟", a:"اگر کارمند رسمی (Employee) هستید و ظرف ۶ ماه از ثبت تامین اجتماعی درخواست دهید، می‌توانید از نرخ ثابت ۲۴٪ قانون بکهام استفاده کنید. خوداشتغال‌ها (اتونومو) مشمول این قانون نمی‌شوند و نرخ پلکانی عادی (۱۹٪ تا ۴۷٪) برایشان اعمال می‌شود."},
      es:{q:"¿Cómo funciona la fiscalidad de este visado? ¿Me conviene la Ley Beckham?", a:"Si eres empleado por cuenta ajena y solicitas dentro de los 6 meses posteriores al alta en la Seguridad Social, puedes optar al tipo fijo del 24% de la Ley Beckham. Los autónomos no pueden acogerse a esta ley y tributan por el IRPF general por tramos (entre el 19% y el 47%)."} }
  ],
  emprendedor: [
    { fa:{q:"آیا دو نفر می‌توانند با هم شریک شوند و هر دو ویزا بگیرند؟", a:"بله، اما هرکدام باید نقش اجرایی مستقل و مستندی در طرح داشته باشند تا هر دو پرونده جدا تایید شود (جزئیات کامل در بخش سوالات عمومی پایین صفحه)."},
      es:{q:"¿Pueden dos personas asociarse y obtener ambas el visado?", a:"Sí, pero cada una debe tener un rol ejecutivo independiente y documentado en el proyecto para que ambos expedientes se aprueben por separado (más detalles en las preguntas generales al final de la página)."} },
    { fa:{q:"آیا فضای coworking برای آدرس شرکت قابل قبول است؟", a:"بله، کاملاً پذیرفته می‌شود؛ فقط گواهی رسمی دامیسیلیو یا میز اختصاصی از coworking لازم است."},
      es:{q:"¿Se acepta un espacio de coworking como domicilio de la empresa?", a:"Sí, se acepta perfectamente; solo se necesita un certificado oficial de domiciliación o de mesa dedicada por parte del coworking."} },
    { fa:{q:"چند نفر باید استخدام کنیم؟", a:"عدد ثابتی در قانون نیست، اما نشان‌دادن ایجاد اشتغال واقعی (حدود ۳ نفر یا بیشتر) در گزارش ENISA بسیار مثبت ارزیابی می‌شود."},
      es:{q:"¿A cuántas personas debemos contratar?", a:"No hay una cifra fija en la ley, pero demostrar creación real de empleo (en torno a 3 o más puestos) se valora muy positivamente en el informe de ENISA."} },
    { fa:{q:"تهیه گزارش مثبت ENISA چقدر طول می‌کشد؟", a:"تدوین طرح کسب‌وکار، ترجمه رسمی مدارک و ثبت در سامانه ENISA معمولاً بین ۳۰ تا ۴۵ روز زمان می‌برد؛ ما در تمام این مراحل همراه‌تان هستیم."},
      es:{q:"¿Cuánto tarda conseguir el informe favorable de ENISA?", a:"Preparar el plan de negocio, traducir la documentación y registrarla en la plataforma de ENISA suele tardar entre 30 y 45 días; te acompañamos en todo el proceso."} },
    { fa:{q:"آیا می‌شود از قانون بکهام هم استفاده کرد؟", a:"بله، دارندگان ویزای کارآفرین در صورت واجدشرایط‌بودن (عدم اقامت مالیاتی اسپانیا در ۵ سال اخیر) می‌توانند از رژیم مالیاتی بکهام استفاده کنند."},
      es:{q:"¿Se puede acoger uno a la Ley Beckham?", a:"Sí, los titulares del visado de emprendedor pueden optar al régimen fiscal Beckham si cumplen los requisitos (no haber sido residente fiscal en España en los últimos 5 años)."} }
  ],
  investigador: [
    { fa:{q:"آیا این مسیر فقط برای اساتید دانشگاه است یا دانشجوی دکتری هم می‌تواند اقدام کند؟", a:"دانشجویان دکتری، پژوهشگران پسادکتری و پرسنل فنی پروژه‌های تحقیقاتی هم مشمول این قانون هستند، به شرط داشتن قرارداد یا توافق‌نامه پذیرش از یک نهاد پژوهشی یا دانشگاه مجاز اسپانیایی."},
      es:{q:"¿Esta vía es solo para catedráticos o también pueden acceder los doctorandos?", a:"Los doctorandos, investigadores postdoctorales y el personal técnico de proyectos de investigación también están cubiertos por esta ley, siempre que cuenten con un contrato o convenio de acogida de una universidad o centro de investigación español autorizado."} },
    { fa:{q:"آیا همسر پژوهشگر هم اجازه کار خواهد داشت؟", a:"بله، یکی از مزیت‌های مهم این مسیر این است که همسر (یا شریک زندگی ثبت‌شده) دارنده اقامت پژوهشگر به‌صورت خودکار مجوز کار در اسپانیا را نیز دریافت می‌کند."},
      es:{q:"¿El cónyuge del investigador también podrá trabajar?", a:"Sí, una de las grandes ventajas de esta vía es que el cónyuge (o pareja de hecho registrada) del titular de la residencia de investigador obtiene automáticamente autorización para trabajar en España."} },
    { fa:{q:"چه کسی پرونده را ثبت می‌کند، خودم یا دانشگاه؟", a:"روند از طریق UGE-CE و توسط نهاد میزبان (دانشگاه یا مرکز پژوهشی) آغاز می‌شود، اما ما مدارک هویتی، لگالایز و مشاوره کامل شما را در طول مسیر هماهنگ می‌کنیم."},
      es:{q:"¿Quién presenta el expediente, yo o la universidad?", a:"El trámite se inicia a través de la UGE-CE y lo impulsa la entidad de acogida (universidad o centro de investigación), pero nosotros coordinamos tu documentación identitaria, la legalización y el asesoramiento durante todo el proceso."} }
  ],
  estudiante: [
    { fa:{q:"آیا در طول تحصیل اجازه کار دارم؟", a:"دانشجویان دوره‌های آموزش عالی (دانشگاهی) می‌توانند تا ۳۰ ساعت در هفته کار کنند، به‌شرطی که با برنامه درسی تداخل نداشته باشد."},
      es:{q:"¿Puedo trabajar mientras estudio?", a:"Los estudiantes de programas de educación superior (universitarios) pueden trabajar hasta 30 horas semanales, siempre que no interfiera con el horario académico."} },
    { fa:{q:"بعد از فارغ‌التحصیلی چه اتفاقی می‌افتد؟", a:"می‌توانید از طریق «تغییر وضعیت» به اقامت کاری یا کارآفرینی تبدیل شوید، به‌شرط داشتن پیشنهاد کاری معتبر یا طرح کسب‌وکار. جزئیات دقیق بسته به مقطع تحصیلی و زمان فارغ‌التحصیلی متفاوت است."},
      es:{q:"¿Qué ocurre después de graduarme?", a:"Puedes solicitar una Modificación de Residencia hacia una vía laboral o de emprendimiento, siempre que cuentes con una oferta de trabajo válida o un plan de negocio. Los detalles exactos dependen del nivel de estudios y del momento de la graduación."} },
    { fa:{q:"آیا کمترین آستانه مالی در میان همه اقامت‌ها همین ویزای دانشجویی است؟", a:"بله، حدود ۶۰۰ یورو در ماه (۱۰۰٪ IPREM) پایین‌ترین رقم در میان پنج مسیر معرفی‌شده است، اما توصیه می‌کنیم برای اطمینان بیشتر رقمی بالاتر (۸,۰۰۰ تا ۱۰,۰۰۰ یورو برای یک سال) نشان دهید."},
      es:{q:"¿Es la residencia de estudiante la que exige el menor umbral económico?", a:"Sí, unos 600 €/mes (100% del IPREM) es la cifra más baja entre las cinco vías, aunque recomendamos acreditar un importe algo mayor (entre 8.000 y 10.000 € para un curso completo) para mayor seguridad."} }
  ]
};

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
  const faqs = VISA_FAQ[v.id] || [];
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
    ${faqs.length ? `
    <div class="visa-faq">
      <h4 class="visa-faq-title">${I18N[currentLang].visaFaqTitle}</h4>
      <div class="accordion">
        ${faqs.map((f,i)=>`
          <div class="accordion-item">
            <button class="accordion-q" data-idx="${i}">
              <span>${f[currentLang].q}</span>
              <span class="accordion-icon">+</span>
            </button>
            <div class="accordion-a"><p>${f[currentLang].a}</p></div>
          </div>
        `).join('')}
      </div>
    </div>` : ''}
  `;
  wireAccordion(panel);
}

function wireAccordion(scope){
  scope.querySelectorAll('.accordion-item').forEach(item=>{
    const btn = item.querySelector('.accordion-q');
    btn.addEventListener('click', ()=>{
      const wasOpen = item.classList.contains('open');
      item.parentElement.querySelectorAll('.accordion-item.open').forEach(i=>{
        if(i!==item) i.classList.remove('open');
      });
      item.classList.toggle('open', !wasOpen);
    });
  });
}

function renderGeneralFaq(){
  const list = document.getElementById('generalFaqList');
  if(!list) return;
  list.innerHTML = GENERAL_FAQ.map((f,i)=>`
    <div class="accordion-item">
      <button class="accordion-q" data-idx="${i}">
        <span>${f[currentLang].q}</span>
        <span class="accordion-icon">+</span>
      </button>
      <div class="accordion-a"><p>${f[currentLang].a}</p></div>
    </div>
  `).join('');
  wireAccordion(list.parentElement);
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
  renderGeneralFaq();
  refreshReveal();
}

/* ---------------- Scroll reveal ---------------- */
let revealObserver = null;
function refreshReveal(){
  if(!revealObserver){
    if(!('IntersectionObserver' in window)){
      document.querySelectorAll('.reveal').forEach(el=>el.classList.add('in-view'));
      return;
    }
    revealObserver = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.classList.add('in-view');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold:0.12, rootMargin:'0px 0px -40px 0px' });
  }
  document.querySelectorAll('.reveal:not(.in-view)').forEach(el=>revealObserver.observe(el));
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
  nav.querySelectorAll('a').forEach(a=>a.addEventListener('click', ()=>nav.classList.remove('open')));

  const topbar = document.querySelector('.topbar');
  const onScroll = ()=> topbar.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive:true });
  onScroll();

  setLanguage('fa');
});