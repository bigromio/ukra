
export interface CatalogItem {
  id: string;
  name: string;
  category: 'furniture' | 'furnishing' | 'accessories' | 'appliances';
  subcategory: string;
  unit: string;
  options?: string[];
  price: number; // Estimated price in SAR
}

export const FURNITURE_CATALOG: CatalogItem[] = [
  // --- 1. Furniture ---
  { id: 'f-headboard', name: 'ظهر سرير (Headboard)', category: 'furniture', subcategory: 'غرف النوم', unit: 'm2', options: ['شيبورد ألماني', 'شيبورد إسباني', 'ميلامين وطني'], price: 450 },
  { id: 'f-bedbase-single', name: 'بوكس سرير مفرد 120cm', category: 'furniture', subcategory: 'غرف النوم', unit: 'عدد', price: 600 },
  { id: 'f-bedbase-double', name: 'بوكس سرير مزدوج 200cm', category: 'furniture', subcategory: 'غرف النوم', unit: 'عدد', price: 950 },
  { id: 'f-nightstand', name: 'كومودينو (Nightstand)', category: 'furniture', subcategory: 'غرف النوم', unit: 'عدد', price: 350 },
  { id: 'f-dresser', name: 'تسريحة مع مرآة', category: 'furniture', subcategory: 'غرف النوم', unit: 'عدد', price: 1200 },
  { id: 'f-wardrobe', name: 'دولاب ملابس (المتر المربع)', category: 'furniture', subcategory: 'الدواليب', unit: 'm2', price: 850 },
  { id: 'f-luggage', name: 'وحدة حقائب (Luggage Rack)', category: 'furniture', subcategory: 'غرف النوم', unit: 'عدد', price: 400 },
  { id: 'f-desk-chair', name: 'كرسي مكتب', category: 'furniture', subcategory: 'المكاتب', unit: 'عدد', price: 450 },
  { id: 'f-lounge-chair', name: 'كرسي استرخاء (Armchair)', category: 'furniture', subcategory: 'الجلوس', unit: 'عدد', price: 1100 },
  { id: 'f-sofa-2', name: 'كنبة مقعدين', category: 'furniture', subcategory: 'الجلوس', unit: 'عدد', price: 2200 },
  { id: 'f-coffee-table', name: 'طاولة وسط', category: 'furniture', subcategory: 'الجلوس', unit: 'عدد', price: 650 },
  { id: 'f-reception-desk', name: 'كاونتر استقبال (المتر الطولي)', category: 'furniture', subcategory: 'الاستقبال', unit: 'ml', price: 1800 },
  { id: 'f-restaurant-table', name: 'طاولة مطعم', category: 'furniture', subcategory: 'المطاعم', unit: 'عدد', price: 550 },
  { id: 'f-restaurant-chair', name: 'كرسي مطعم', category: 'furniture', subcategory: 'المطاعم', unit: 'عدد', price: 350 },
  { id: 'f-cladding-wood', name: 'تكسيات خشبية بديل خشب', category: 'furniture', subcategory: 'الديكور', unit: 'm2', price: 180 },
  { id: 'f-cladding-marble', name: 'تكسيات بديل رخام', category: 'furniture', subcategory: 'الديكور', unit: 'm2', price: 140 },

  // --- 2. Furnishings ---
  { id: 'l-mattress-vip', name: 'مرتبة فندقية VIP (Pocket Spring)', category: 'furnishing', subcategory: 'المراتب', unit: 'عدد', price: 1800 },
  { id: 'l-mattress-eco', name: 'مرتبة فندقية اقتصادية (Bonnel)', category: 'furnishing', subcategory: 'المراتب', unit: 'عدد', price: 850 },
  { id: 'l-sheet-set', name: 'طقم بياضات سرير كامل (300TC)', category: 'furnishing', subcategory: 'البياضات', unit: 'طقم', price: 350 },
  { id: 'l-duvet', name: 'حشوة لحاف (Microfiber)', category: 'furnishing', subcategory: 'البياضات', unit: 'عدد', price: 220 },
  { id: 'l-pillow', name: 'مخدة نوم فندقية (1000g)', category: 'furnishing', subcategory: 'الوسائد', unit: 'عدد', price: 65 },
  { id: 'l-towel-set', name: 'طقم مناشف (جسم+وجه+أرضية)', category: 'furnishing', subcategory: 'المناشف', unit: 'طقم', price: 120 },
  { id: 'l-curtain', name: 'ستائر Blackout + Sheer (متر طولي)', category: 'furnishing', subcategory: 'الستائر', unit: 'ml', price: 450 },

  // --- 3. Appliances & Accessories ---
  { id: 'a-minibar', name: 'ثلاجة ميني بار 40 لتر', category: 'appliances', subcategory: 'الأجهزة', unit: 'عدد', price: 650 },
  { id: 'a-safe', name: 'خزنة أرقام سرية', category: 'appliances', subcategory: 'الأجهزة', unit: 'عدد', price: 380 },
  { id: 'a-kettle-tray', name: 'طقم غلاية مع صينية تقديم', category: 'appliances', subcategory: 'الأجهزة', unit: 'طقم', price: 280 },
  { id: 'a-hairdryer', name: 'مجفف شعر جداري', category: 'appliances', subcategory: 'الأجهزة', unit: 'عدد', price: 120 },
  { id: 'a-iron-center', name: 'مركز كي (مكواة + طاولة + حامل)', category: 'accessories', subcategory: 'الأدوات', unit: 'طقم', price: 450 },
  { id: 'a-bath-acc', name: 'طقم اكسسوارات حمام (5 قطع)', category: 'accessories', subcategory: 'الأدوات', unit: 'طقم', price: 180 },
  { id: 'a-bin', name: 'سلة مهملات مزدوجة (جلد)', category: 'accessories', subcategory: 'الأدوات', unit: 'عدد', price: 140 }
];
