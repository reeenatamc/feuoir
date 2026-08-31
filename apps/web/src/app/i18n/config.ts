import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const es = {
  // ── Vocabulario de FEUOIR ────────────────────────────────────────────────
  // Los terminos de la casa se traducen como cualquier otro texto. Si algun dia
  // se decide que una palabra debe quedar igual en los dos idiomas, se iguala su
  // valor aqui: la decision vive en las traducciones, que es donde se ve y se
  // cambia en una linea, y no repartida por los componentes.
  brand: {
    claim: 'Lo que ha sido transformado no puede volver.',
    claimSecondary: 'Objetos alterados más allá de la repetición.',
    home: 'feuoir — inicio',
  },
  feuoirNav: {
    objects: 'Objetos',
    archive: 'Archivo',
    commissions: 'Encargos',
    index: 'Indice',
    bag: 'Bolsa',
    close: 'Cerrar',
  },
  state: {
    available: 'Disponible',
    archived: 'Archivado',
    private: 'Privado',
  },
  material: {
    cotton: 'Algodón',
    steel: 'Acero',
    leather: 'Cuero',
    brass: 'Latón',
    griptape: 'Grip tape',
  },
  series: {
    title: 'Serie {{number}}',
    origin: 'Loja — Ecuador',
  },
  object: {
    label: 'Objeto',
    series: 'Serie',
    materials: 'Materiales',
    treatment: 'Tratamiento',
    treatmentThermal: 'Tratamiento térmico {{number}}',
    finish: 'Acabado',
    finishIndividual: 'Acabado individual',
    edition: 'Edición',
    origin: 'Procedencia',
    notFound: 'No existe ninguna pieza con ese número.',
    backToSeries: 'Volver a la serie',
    requestCommission: 'Solicitar un encargo',
    documentation: 'Documentación',
    view: {
      full: 'Pieza completa',
      texture: 'Textura',
      seams: 'Costuras',
      interior: 'Interior',
      label: 'Etiqueta y código',
    },
  },
  commissions: {
    title: 'Encargos privados',
    lead: 'Cada año se desarrolla un número limitado de piezas privadas.',
    subject: 'Pieza',
    subjectOption: { deck: 'Tabla', apparel: 'Prenda', lighter: 'Encendedor', other: 'Otra' },
    size: 'Medida',
    sizeHint: 'Talla, largo o ancho',
    intention: 'Intención',
    intentionHint: 'Qué buscas con la pieza',
    budget: 'Presupuesto aproximado',
    budgetOption: {
      under500: 'Hasta 500 USD',
      from500: '500 — 1000 USD',
      from1000: 'Más de 1000 USD',
      undecided: 'Sin definir',
    },
    name: 'Nombre',
    email: 'Correo',
    send: 'Solicitar un encargo',
    messageTitle: 'Solicitud de encargo — FEUOIR',
    noChannel: 'Canal de contacto sin configurar.',
    error: {
      intention: 'Falta describir la intención.',
      name: 'Falta el nombre.',
      email: 'El correo no parece válido.',
    },
  },
  // El registro cuando todavia no hay piezas en pantalla. Son tres situaciones
  // distintas y por eso son tres textos: esperando, sin nada cargado, y sin
  // servidor que conteste.
  catalog: {
    loading: 'Cargando el registro…',
    empty: 'Todavía no hay piezas registradas en esta serie.',
    unavailable: 'El registro no está disponible en este momento.',
    unavailableHint: 'No se pudo contactar el servidor. Intenta de nuevo en un momento.',
  },
  objectsPage: {
    title: 'Objetos',
    lead: 'Cada pieza se registra, se numera y no se repite.',
  },
  archivePage: {
    title: 'Archivo',
    lead: 'Nada sale del registro. Cada objeto sigue listado despues de haberse ido.',
  },
  nav: {
    uiMode: {
      cool: 'Modo cool',
      bored: 'Modo aburrido',
      coolShort: 'Cool',
      boredShort: 'Aburrido',
    },
  },
  hero: {
    title: 'Crea\nTu Fuego',
    subtitle: 'Transforma objetos cotidianos en declaraciones personales',
    cta: 'Empezar',
    philosophy: 'No creamos productos.\nEncendemos la expresión creativa.',
    philP1: 'Cada objeto es un lienzo. Cada diseño es una declaración. En un mundo de producción en masa, traemos calor a lo mundano.',
  },
  shop: {
    title: 'Shop',
    subtitle: 'Curado para la expresión creativa',
    empty: 'Todavía no hay productos disponibles',
    loadError: 'No pudimos cargar los productos. Intenta de nuevo en un momento.',
  },
  product: {
    view: 'Ver',
    category: {
      griptape: 'Grip Tape',
      lighter: 'Encendedor',
      hoodie: 'Ropa',
      custom: 'Personalizado',
    },
    comingSoon: 'Próximamente',
    comingSoonDesc: 'Pronto podrás subir tu arte, añadir texto y ver el diseño en tiempo real antes de ordenar.',
  },
  // ── La bolsa ─────────────────────────────────────────────────────────────
  // Los importes no llevan etiqueta escrita a mano: `totals.*` nombra las claves
  // que manda el servidor. Cuando el backend suma un concepto nuevo, se agrega
  // su nombre aqui y en el otro idioma; mientras tanto se muestra como llega,
  // que es preferible a esconder un importe que ya esta dentro del total.
  bag: {
    title: 'Bolsa',
    loading: 'Recuperando la bolsa…',
    empty: 'Todavía no hay ninguna pieza en la bolsa.',
    browse: 'Ver las piezas de la serie',
    add: 'Agregar a la bolsa',
    adding: 'Agregando…',
    added: 'La pieza está en la bolsa.',
    view: 'Ver la bolsa',
    unavailable: 'Esta pieza no se puede agregar en este momento.',
    unitPrice: 'Unidad',
    lineDiscount: 'Rebaja',
    increase: 'Sumar una unidad',
    decrease: 'Quitar una unidad',
    remove: 'Quitar',
    checkout: 'Continuar con la compra',
    discountLabel: 'Código de descuento',
    discountApply: 'Aplicar',
    discountApplied: 'Cupón aplicado:',
    discountRemove: 'Quitar el cupón',
    discountRejected: 'Ese código no corresponde a esta compra.',
    taxIdNotice:
      'Por el importe de esta compra, la factura necesita el nombre y el documento de quien la recibe.',
    totals: {
      subtotal: 'Subtotal',
      discount: 'Descuento',
      shipping: 'Envío',
      tax: 'Impuestos',
      total: 'Total',
    },
    failure: {
      offline: 'No se pudo contactar el servidor. Intenta de nuevo en un momento.',
      gone: 'Esa bolsa ya no está disponible. Vuelve a agregar la pieza: el registro sigue ahí.',
      rejected: 'El servidor no aceptó la operación.',
      throttled: 'Demasiadas peticiones seguidas. Espera unos segundos y vuelve a intentarlo.',
      unknown: 'Algo salió mal y la operación no se completó.',
    },
  },
  checkout: {
    pageTitle: 'Compra',
    title: 'Datos de envío',
    name: 'Nombre',
    email: 'Correo',
    phone: 'Teléfono',
    line1: 'Dirección',
    line2: 'Referencia',
    city: 'Ciudad',
    state: 'Provincia',
    postalCode: 'Código postal',
    country: 'País',
    countryHint: 'Código de dos letras: EC, AR, ES',
    billingTitle: 'Facturación',
    billingLead:
      'La factura va a la misma dirección del envío. Lo que hace falta aparte es el nombre y el documento de quien la recibe.',
    billingName: 'Nombre en la factura',
    taxIdKind: 'Tipo de documento',
    taxIdKindOption: {
      cedula: 'Cédula',
      ruc: 'RUC',
      passport: 'Pasaporte',
    },
    taxId: 'Número de documento',
    submit: 'Confirmar la compra',
    submitting: 'Confirmando…',
    back: 'Volver a la bolsa',
    error: {
      email: 'El correo no parece válido.',
      name: 'Falta el nombre.',
      line1: 'Falta la dirección.',
      city: 'Falta la ciudad.',
      country: 'El país va en código de dos letras.',
      billingName: 'Falta el nombre en la factura.',
      taxId: 'Falta el número de documento.',
    },
  },
  order: {
    title: 'Orden creada',
    number: 'Número de orden',
    lead: 'Guarda este número: es lo que identifica la compra y con lo que se coordina el cobro.',
    paymentTitle: 'Pago',
    paymentLead:
      'La orden todavía no está pagada. Crearla y cobrarla son dos pasos distintos, y el cobro se coordina por WhatsApp.',
    pay: 'Pagar por WhatsApp',
    preparing: 'Preparando el enlace de pago…',
    retry: 'Reintentar',
    keepShopping: 'Seguir viendo piezas',
    message: 'Hola! Quiero pagar la orden {{number}}. Total: {{total}} {{currency}}',
  },
  about: {
    title: 'Sobre Feuoir',
    description: 'Transformamos objetos cotidianos en declaraciones personales. Cada pieza es un lienzo para la expresión creativa, fusionando cultura urbana con filosofía de diseño minimalista.',
  },
  custom: {
    title: 'Diseños Personalizados',
    description: 'Pronto podrás subir tu propio arte, añadir texto y ver tu diseño cobrar vida antes de ordenar. Por ahora, explora nuestra colección fire series.',
    cta: 'Ver Colección',
  },
  login: {
    panel: 'Panel Admin',
    email: 'Email',
    password: 'Contraseña',
    submit: 'Ingresar',
    submitting: 'Ingresando...',
    error: 'Email o contraseña incorrectos',
  },
  admin: {
    title: 'Panel Admin',
    viewSite: 'Ver sitio',
    logout: 'Salir',
    stats: {
      products: 'Productos',
      active: 'Activos',
      orders: 'Órdenes',
      revenue: 'Revenue',
    },
    tabs: {
      products: 'Productos',
      orders: 'Órdenes',
      config: 'Config',
    },
    table: {
      product: 'Producto',
      category: 'Categoría',
      price: 'Precio',
      status: 'Estado',
      save: 'Guardar',
      saving: 'Guardando…',
      cancel: 'Cancelar',
      edit: 'Editar',
      noOrders: 'Sin órdenes todavía',
    },
    config: {
      description: 'Variables globales del negocio. Los cambios se guardan en Supabase.',
      businessName: 'Nombre del negocio',
      whatsapp: 'WhatsApp (con código de país)',
      currency: 'Moneda',
      shippingCost: 'Costo de envío ($)',
      taxRate: 'Tasa de impuesto (%)',
      save: 'Guardar cambios',
      saving: 'Guardando…',
      checkoutPreview: 'Preview link de checkout',
    },
    status: {
      active: 'activo',
      draft: 'borrador',
      archived: 'archivado',
    },
    error: {
      load: 'No pudimos cargar los datos.',
      save: 'No se pudo guardar. Revisa tu conexión y los permisos del panel.',
    },
  },
};

const en = {
  // ── FEUOIR vocabulary ────────────────────────────────────────────────────
  brand: {
    claim: 'What has been transformed cannot return.',
    claimSecondary: 'Objects altered beyond repetition.',
    home: 'feuoir — home',
  },
  feuoirNav: {
    objects: 'Objects',
    archive: 'Archive',
    commissions: 'Commissions',
    index: 'Index',
    bag: 'Bag',
    close: 'Close',
  },
  state: {
    available: 'Available',
    archived: 'Archived',
    private: 'Private',
  },
  material: {
    cotton: 'Cotton',
    steel: 'Steel',
    leather: 'Leather',
    brass: 'Brass',
    griptape: 'Grip tape',
  },
  series: {
    title: 'Series {{number}}',
    origin: 'Loja — Ecuador',
  },
  object: {
    label: 'Object',
    series: 'Series',
    materials: 'Materials',
    treatment: 'Treatment',
    treatmentThermal: 'Thermal treatment {{number}}',
    finish: 'Finish',
    finishIndividual: 'Individual finish',
    edition: 'Edition',
    origin: 'Origin',
    notFound: 'No object exists under that number.',
    backToSeries: 'Back to the series',
    requestCommission: 'Request a commission',
    documentation: 'Documentation',
    view: {
      full: 'Full piece',
      texture: 'Texture',
      seams: 'Seams',
      interior: 'Interior',
      label: 'Label and code',
    },
  },
  commissions: {
    title: 'Private commissions',
    lead: 'A limited number of private objects are developed each year.',
    subject: 'Piece',
    subjectOption: { deck: 'Deck', apparel: 'Apparel', lighter: 'Lighter', other: 'Other' },
    size: 'Measurement',
    sizeHint: 'Size, length or width',
    intention: 'Intention',
    intentionHint: 'What you are after',
    budget: 'Approximate budget',
    budgetOption: {
      under500: 'Up to 500 USD',
      from500: '500 — 1000 USD',
      from1000: 'Over 1000 USD',
      undecided: 'Undecided',
    },
    name: 'Name',
    email: 'Email',
    send: 'Request a commission',
    messageTitle: 'Commission request — FEUOIR',
    noChannel: 'Contact channel not configured.',
    error: {
      intention: 'The intention is missing.',
      name: 'The name is missing.',
      email: 'That email does not look valid.',
    },
  },
  catalog: {
    loading: 'Loading the record…',
    empty: 'No pieces recorded in this series yet.',
    unavailable: 'The record is unavailable right now.',
    unavailableHint: 'The server could not be reached. Please try again in a moment.',
  },
  objectsPage: {
    title: 'Objects',
    lead: 'Every piece is recorded, numbered and never repeated.',
  },
  archivePage: {
    title: 'Archive',
    lead: 'Nothing leaves the record. Every object remains listed after it is gone.',
  },
  nav: {
    uiMode: {
      cool: 'Cool mode',
      bored: 'Bored mode',
      coolShort: 'Cool',
      boredShort: 'Bored',
    },
  },
  hero: {
    title: 'Create\nYour Fire',
    subtitle: 'Transform everyday objects into personal statements',
    cta: 'Start Creating',
    philosophy: "We don't create products.\nWe fuel creative expression.",
    philP1: 'Every object is a canvas. Every design is a statement. In a world of mass production, we bring heat to the mundane.',
  },
  shop: {
    title: 'Shop',
    subtitle: 'Curated for creative expression',
    empty: 'No products available yet',
    loadError: "We couldn't load the products. Please try again in a moment.",
  },
  product: {
    view: 'View',
    category: {
      griptape: 'Grip Tape',
      lighter: 'Lighter',
      hoodie: 'Apparel',
      custom: 'Custom',
    },
    comingSoon: 'Coming Soon',
    comingSoonDesc: 'Soon you can upload your own artwork, add text, and preview your design in real time before ordering.',
  },
  // ── The bag ──────────────────────────────────────────────────────────────
  bag: {
    title: 'Bag',
    loading: 'Recovering the bag…',
    empty: 'There is no piece in the bag yet.',
    browse: 'See the pieces in the series',
    add: 'Add to bag',
    adding: 'Adding…',
    added: 'The piece is in the bag.',
    view: 'See the bag',
    unavailable: 'This piece cannot be added right now.',
    unitPrice: 'Unit',
    lineDiscount: 'Discount',
    increase: 'Add one unit',
    decrease: 'Remove one unit',
    remove: 'Remove',
    checkout: 'Continue with the purchase',
    discountLabel: 'Discount code',
    discountApply: 'Apply',
    discountApplied: 'Coupon applied:',
    discountRemove: 'Remove the coupon',
    discountRejected: 'That code does not apply to this purchase.',
    taxIdNotice:
      'At this amount, the invoice needs the name and tax document of whoever receives it.',
    totals: {
      subtotal: 'Subtotal',
      discount: 'Discount',
      shipping: 'Shipping',
      tax: 'Tax',
      total: 'Total',
    },
    failure: {
      offline: 'The server could not be reached. Please try again in a moment.',
      gone: 'That bag is no longer available. Add the piece again: the record is still there.',
      rejected: 'The server did not accept the operation.',
      throttled: 'Too many requests in a row. Wait a few seconds and try again.',
      unknown: 'Something went wrong and the operation did not complete.',
    },
  },
  checkout: {
    pageTitle: 'Purchase',
    title: 'Shipping details',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    line1: 'Address',
    line2: 'Additional details',
    city: 'City',
    state: 'Province',
    postalCode: 'Postal code',
    country: 'Country',
    countryHint: 'Two-letter code: EC, AR, ES',
    billingTitle: 'Invoicing',
    billingLead:
      'The invoice goes to the same shipping address. What is needed separately is the name and tax document of whoever receives it.',
    billingName: 'Name on the invoice',
    taxIdKind: 'Document type',
    taxIdKindOption: {
      cedula: 'National ID',
      ruc: 'Tax ID (RUC)',
      passport: 'Passport',
    },
    taxId: 'Document number',
    submit: 'Confirm the purchase',
    submitting: 'Confirming…',
    back: 'Back to the bag',
    error: {
      email: 'That email does not look valid.',
      name: 'The name is missing.',
      line1: 'The address is missing.',
      city: 'The city is missing.',
      country: 'The country goes as a two-letter code.',
      billingName: 'The name on the invoice is missing.',
      taxId: 'The document number is missing.',
    },
  },
  order: {
    title: 'Order created',
    number: 'Order number',
    lead: 'Keep this number: it identifies the purchase and is what the payment is arranged with.',
    paymentTitle: 'Payment',
    paymentLead:
      'The order is not paid yet. Creating it and charging it are two separate steps, and payment is arranged over WhatsApp.',
    pay: 'Pay over WhatsApp',
    preparing: 'Preparing the payment link…',
    retry: 'Try again',
    keepShopping: 'Keep looking at pieces',
    message: 'Hello! I want to pay order {{number}}. Total: {{total}} {{currency}}',
  },
  about: {
    title: 'About Feuoir',
    description: 'We transform everyday objects into personal statements. Each piece is a canvas for creative expression, merging urban culture with minimalist design philosophy.',
  },
  custom: {
    title: 'Custom Designs',
    description: 'Soon you will be able to upload your own artwork, add text, and see your design come to life before ordering. For now, browse our fire series collection.',
    cta: 'Shop Collection',
  },
  login: {
    panel: 'Admin Panel',
    email: 'Email',
    password: 'Password',
    submit: 'Sign In',
    submitting: 'Signing in...',
    error: 'Incorrect email or password',
  },
  admin: {
    title: 'Admin Panel',
    viewSite: 'View site',
    logout: 'Sign out',
    stats: {
      products: 'Products',
      active: 'Active',
      orders: 'Orders',
      revenue: 'Revenue',
    },
    tabs: {
      products: 'Products',
      orders: 'Orders',
      config: 'Config',
    },
    table: {
      product: 'Product',
      category: 'Category',
      price: 'Price',
      status: 'Status',
      save: 'Save',
      saving: 'Saving…',
      cancel: 'Cancel',
      edit: 'Edit',
      noOrders: 'No orders yet',
    },
    config: {
      description: 'Global business variables. Changes are saved to Supabase.',
      businessName: 'Business name',
      whatsapp: 'WhatsApp (with country code)',
      currency: 'Currency',
      shippingCost: 'Shipping cost ($)',
      taxRate: 'Tax rate (%)',
      save: 'Save changes',
      saving: 'Saving…',
      checkoutPreview: 'Checkout link preview',
    },
    status: {
      active: 'active',
      draft: 'draft',
      archived: 'archived',
    },
    error: {
      load: "We couldn't load the data.",
      save: 'Could not save. Check your connection and the panel permissions.',
    },
  },
};

const LANG_KEY = 'feuoir_lang';
const SUPPORTED_LANGS = ['es', 'en'] as const;
const DEFAULT_LANG = 'es';

// localStorage puede tirar (Safari en modo privado, cookies bloqueadas) y no
// existe fuera del navegador. Antes se accedia directo a nivel de modulo,
// asi que un throw aqui tumbaba el arranque de toda la app.
function readStoredLang(): string {
  try {
    const stored = globalThis.localStorage?.getItem(LANG_KEY);
    return SUPPORTED_LANGS.includes(stored as (typeof SUPPORTED_LANGS)[number])
      ? (stored as string)
      : DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
    },
    lng: readStoredLang(),
    supportedLngs: [...SUPPORTED_LANGS],
    fallbackLng: DEFAULT_LANG,
    interpolation: { escapeValue: false },
  });

i18n.on('languageChanged', (lng) => {
  try {
    globalThis.localStorage?.setItem(LANG_KEY, lng);
  } catch {
    // Persistir el idioma es best-effort; no vale romper la app por esto.
  }
});

export default i18n;
