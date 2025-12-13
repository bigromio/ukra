
export interface CatalogItem {
  id: string;
  name: string;
  category: 'furniture' | 'furnishing' | 'accessories' | 'appliances';
  subcategory: string;
  unit: string;
  options?: string[]; // For wood types or sizes
}

export const FURNITURE_CATALOG: CatalogItem[] = [
  // --- 1. Furniture (الأثاث الخشبي) ---
  { id: 'f-headboard', name: 'ظهر سرير (Headboard) - خشب سادة', category: 'furniture', subcategory: 'غرف النوم', unit: 'm2', options: ['شيبورد ألماني', 'شيبورد إسباني', 'شيبورد تايلاندي', 'ميلامين وطني'] },
  { id: 'f-bedbase-single', name: 'بوكس سرير - هيكل مقاس مفرد', category: 'furniture', subcategory: 'غرف النوم', unit: 'عدد' },
  { id: 'f-bedbase-double', name: 'بوكس سرير - هيكل مقاس مزدوج', category: 'furniture', subcategory: 'غرف النوم', unit: 'عدد' },
  { id: 'f-nightstand-s', name: 'كومودينو - مقاس صغير', category: 'furniture', subcategory: 'غرف النوم', unit: 'عدد' },
  { id: 'f-nightstand-m', name: 'كومودينو - مقاس وسط', category: 'furniture', subcategory: 'غرف النوم', unit: 'عدد' },
  { id: 'f-dresser', name: 'تسريحة - وحدة أدراج مع سطح', category: 'furniture', subcategory: 'غرف النوم', unit: 'عدد' },
  { id: 'f-wardrobe-hinge', name: 'دولاب ملابس - أبواب خشبية (دلف)', category: 'furniture', subcategory: 'الدواليب', unit: 'm2' },
  { id: 'f-wardrobe-slide', name: 'دولاب ملابس - أبواب خشبية (سحاب)', category: 'furniture', subcategory: 'الدواليب', unit: 'm2' },
  { id: 'f-luggage', name: 'وحدة تخزين أحذية / حقائب', category: 'furniture', subcategory: 'الدواليب', unit: 'عدد' },
  { id: 'f-dining-table', name: 'طاولة طعام (سطح خشب + قاعدة)', category: 'furniture', subcategory: 'غرفة الطعام', unit: 'عدد' },
  { id: 'f-coffee-corner', name: 'كوفي كورنر (علوي + سفلي)', category: 'furniture', subcategory: 'الضيافة', unit: 'm2' },
  { id: 'f-reception', name: 'كاونتر استقبال (Reception Desk)', category: 'furniture', subcategory: 'الاستقبال', unit: 'm2' },
  { id: 'f-coffee-table', name: 'طاولة وسط (Coffee Table)', category: 'furniture', subcategory: 'الضيافة', unit: 'عدد' },
  { id: 'f-side-table', name: 'طاولة جانبية (Side Table)', category: 'furniture', subcategory: 'الضيافة', unit: 'عدد' },
  { id: 'f-office-desk', name: 'مكتب موظف / مدير', category: 'furniture', subcategory: 'المكاتب', unit: 'عدد' },
  { id: 'f-meeting-table', name: 'طاولة اجتماعات', category: 'furniture', subcategory: 'المكاتب', unit: 'm2' },
  { id: 'f-kitchen-low', name: 'مطبخ تحضيري - خزائن سفلية', category: 'furniture', subcategory: 'المطابخ', unit: 'm2' },
  { id: 'f-kitchen-high', name: 'مطبخ تحضيري - خزائن علوية', category: 'furniture', subcategory: 'المطابخ', unit: 'm2' },
  { id: 'f-vanity', name: 'وحدة مغسلة (Vanity) - خشب مقاوم', category: 'furniture', subcategory: 'الحمامات', unit: 'm2' },
  { id: 'f-cladding', name: 'تكسيات جدارية (Wall Cladding)', category: 'furniture', subcategory: 'الديكور', unit: 'm2' },
  { id: 'f-door-leaf', name: 'باب خشبي داخلي (درفة فقط)', category: 'furniture', subcategory: 'الأبواب', unit: 'عدد' },
  { id: 'f-armchair', name: 'كرسي مفرد (Armchair)', category: 'furniture', subcategory: 'الأثاث المتحرك', unit: 'عدد' },

  // --- 2. Furnishings (المراتب والبياضات) ---
  { id: 'l-mattress-lux-k', name: 'مرتبة فاخرة (Pocket Spring) 200x200', category: 'furnishing', subcategory: 'المراتب', unit: 'عدد' },
  { id: 'l-mattress-med-k', name: 'مرتبة وسط (Pocket Spring) 200x200', category: 'furnishing', subcategory: 'المراتب', unit: 'عدد' },
  { id: 'l-mattress-eco-k', name: 'مرتبة اقتصادي (Bonnel Spring) 200x200', category: 'furnishing', subcategory: 'المراتب', unit: 'عدد' },
  { id: 'l-mattress-lux-s', name: 'مرتبة فاخرة (Pocket Spring) 120x200', category: 'furnishing', subcategory: 'المراتب', unit: 'عدد' },
  
  { id: 'l-sheet-k-300', name: 'شرشف فلات King (300 TC) مقلم', category: 'furnishing', subcategory: 'بياضات السرير', unit: 'عدد' },
  { id: 'l-sheet-s-300', name: 'شرشف فلات Twin (300 TC) مقلم', category: 'furnishing', subcategory: 'بياضات السرير', unit: 'عدد' },
  { id: 'l-duvet-k-300', name: 'كيس لحاف King (300 TC) مقلم', category: 'furnishing', subcategory: 'بياضات السرير', unit: 'عدد' },
  { id: 'l-sheet-k-250', name: 'شرشف فلات King (250 TC) CVC', category: 'furnishing', subcategory: 'بياضات السرير', unit: 'عدد' },
  
  { id: 'l-pillow-microgel', name: 'مخدة نوم Microgel (بديل ريش)', category: 'furnishing', subcategory: 'الوسائد', unit: 'عدد' },
  { id: 'l-pillow-fiber', name: 'مخدة نوم Fiber Ball (اقتصادية)', category: 'furnishing', subcategory: 'الوسائد', unit: 'عدد' },
  { id: 'l-duvet-insert', name: 'حشوة لحاف (بديل ريش)', category: 'furnishing', subcategory: 'الوسائد', unit: 'عدد' },

  { id: 'l-towel-body', name: 'منشفة جسم 650 GSM', category: 'furnishing', subcategory: 'المناشف', unit: 'عدد' },
  { id: 'l-towel-face', name: 'منشفة وجه 600 GSM', category: 'furnishing', subcategory: 'المناشف', unit: 'عدد' },
  { id: 'l-bath-mat', name: 'دعاسة حمام 800 GSM', category: 'furnishing', subcategory: 'المناشف', unit: 'عدد' },
  { id: 'l-robe-waffle', name: 'روب حمام Waffle', category: 'furnishing', subcategory: 'المناشف', unit: 'عدد' },

  // --- 3. Accessories & Appliances ---
  { id: 'a-kettle-steel', name: 'غلاية 0.8L Steel (Strix)', category: 'appliances', subcategory: 'أجهزة الغرفة', unit: 'عدد' },
  { id: 'a-kettle-plastic', name: 'غلاية 1.0L Plastic', category: 'appliances', subcategory: 'أجهزة الغرفة', unit: 'عدد' },
  { id: 'a-safe-laptop', name: 'خزنة لابتوب 15 بوصة', category: 'appliances', subcategory: 'أجهزة الغرفة', unit: 'عدد' },
  { id: 'a-minibar-glass', name: 'ثلاجة ميني بار 40L (باب زجاج)', category: 'appliances', subcategory: 'أجهزة الغرفة', unit: 'عدد' },
  { id: 'a-hairdryer-wall', name: 'مجفف شعر مثبت بالجدار 1200W', category: 'appliances', subcategory: 'أجهزة الغرفة', unit: 'عدد' },
  
  { id: 'a-bin-pedal', name: 'سلة حمام ستيل 5L (Soft Close)', category: 'accessories', subcategory: 'سلات المهملات', unit: 'عدد' },
  { id: 'a-bin-room-leather', name: 'سلة غرفة جلد مزدوجة', category: 'accessories', subcategory: 'سلات المهملات', unit: 'عدد' },
  
  { id: 'a-mirror-led', name: 'مرآة تكبير LED', category: 'accessories', subcategory: 'اكسسوارات الحمام', unit: 'عدد' },
  { id: 'a-bath-set-resin', name: 'طقم حمام (Resin) مظهر حجري', category: 'accessories', subcategory: 'اكسسوارات الحمام', unit: 'طقم' },
  { id: 'a-iron-board', name: 'طاولة كي قائمة (Free Standing)', category: 'accessories', subcategory: 'مستلزمات الكي', unit: 'عدد' },
  { id: 'a-iron-steam', name: 'مكواة بخار Pro 2400W', category: 'accessories', subcategory: 'مستلزمات الكي', unit: 'عدد' }
];
