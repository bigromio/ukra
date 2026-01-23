import { supabase } from '../lib/supabase';
import { UnitDefinition } from '../types';

// --- تعريف الثوابت للوحدات الإلزامية (تم تحديث الأعداد الافتراضية للغرف) ---
const MANDATORY_FACILITIES: Record<number, Partial<UnitDefinition>[]> = {
  // 1 نجمة
  1: [
    { type: 'Single', name: 'غرفة مفردة', quantity: 10 }, // عدد افتراضي
    { type: 'Double', name: 'غرفة مزدوجة', quantity: 5 },
    { type: 'Reception', name: 'الاستقبال (Reception)', quantity: 1 },
    { type: 'Lobby', name: 'منطقة انتظار (Lobby)', quantity: 1 },
    { type: 'PrayerRoom', name: 'مصلى', quantity: 1 },
    { type: 'PublicToilet', name: 'دورة مياه عامة', quantity: 1 },
    { type: 'Parking', name: 'مواقف سيارات', quantity: 1 },
  ],

  // 2 نجمة
  2: [
    { type: 'Single', name: 'غرفة مفردة', quantity: 15 },
    { type: 'Double', name: 'غرفة مزدوجة', quantity: 10 },
    { type: 'Reception', name: 'الاستقبال (Reception)', quantity: 1 },
    { type: 'Lobby', name: 'بهو الفندق (Lobby)', quantity: 1 },
    { type: 'CoffeeShop', name: 'مقهى / منطقة إفطار', quantity: 1 },
    { type: 'PrayerRoom', name: 'مصلى', quantity: 1 },
    { type: 'PublicToilet', name: 'دورات مياه عامة', quantity: 1 },
    { type: 'Parking', name: 'مواقف سيارات', quantity: 1 },
  ],

  // 3 نجوم
  3: [
    { type: 'Single', name: 'غرفة مفردة', quantity: 20 },
    { type: 'Double', name: 'غرفة مزدوجة', quantity: 25 },
    { type: 'Suite', name: 'جناح فندقي', quantity: 4 },
    { type: 'Reception', name: 'الاستقبال (Reception)', quantity: 1 },
    { type: 'Lobby', name: 'بهو الفندق (Lobby)', quantity: 1 },
    { type: 'Restaurant', name: 'مطعم رئيسي', quantity: 1 },
    { type: 'Kitchen', name: 'مطبخ مركزي', quantity: 1 },
    { type: 'PrayerRoom', name: 'مصلى', quantity: 1 },
    { type: 'PublicToilet', name: 'دورات مياه عامة', quantity: 2 },
    { type: 'Accessible', name: 'غرفة ذوي الهمم', quantity: 1 },
    { type: 'Parking', name: 'مواقف سيارات', quantity: 1 },
  ],

  // 4 نجوم
  4: [
    { type: 'Single', name: 'غرفة مفردة', quantity: 30 },
    { type: 'Double', name: 'غرفة مزدوجة', quantity: 40 },
    { type: 'Suite', name: 'جناح فندقي', quantity: 8 },
    { type: 'Reception', name: 'الاستقبال (Reception)', quantity: 1 },
    { type: 'Lobby', name: 'بهو الفندق (Lobby)', quantity: 1 },
    { type: 'Restaurant', name: 'مطعم رئيسي', quantity: 1 },
    { type: 'Kitchen', name: 'مطبخ مركزي', quantity: 1 },
    { type: 'PrayerRoom', name: 'مصلى', quantity: 1 },
    { type: 'PublicToilet', name: 'دورات مياه عامة', quantity: 2 },
    { type: 'Accessible', name: 'غرفة ذوي الهمم', quantity: 2 },
    { type: 'Parking', name: 'مواقف سيارات', quantity: 1 },
    { type: 'Gym', name: 'نادي صحي (Gym)', quantity: 1 },
    { type: 'MeetingRoom', name: 'قاعة اجتماعات', quantity: 1 },
    { type: 'Laundry', name: 'مغسلة مركزية', quantity: 1 },
    { type: 'Pool', name: 'مسبح خارجي', quantity: 1 },
  ],

  // 5 نجوم
  5: [
    { type: 'Single', name: 'غرفة مفردة', quantity: 40 },
    { type: 'Double', name: 'غرفة مزدوجة', quantity: 60 },
    { type: 'Suite', name: 'جناح فندقي', quantity: 15 },
    { type: 'Reception', name: 'الاستقبال (Reception)', quantity: 1 },
    { type: 'Lobby', name: 'بهو الفندق (Lobby)', quantity: 1 },
    { type: 'Restaurant', name: 'مطعم رئيسي', quantity: 1 },
    { type: 'Kitchen', name: 'مطبخ مركزي', quantity: 1 },
    { type: 'PrayerRoom', name: 'مصلى', quantity: 1 },
    { type: 'PublicToilet', name: 'دورات مياه عامة', quantity: 4 },
    { type: 'Accessible', name: 'غرفة ذوي الهمم', quantity: 3 },
    { type: 'Parking', name: 'مواقف سيارات', quantity: 1 },
    { type: 'Gym', name: 'نادي صحي (Gym)', quantity: 1 },
    { type: 'MeetingRoom', name: 'قاعة اجتماعات', quantity: 2 },
    { type: 'Laundry', name: 'مغسلة مركزية', quantity: 1 },
    { type: 'Pool', name: 'مسبح خارجي', quantity: 1 },
    { type: 'BusinessCenter', name: 'مركز أعمال', quantity: 1 },
    { type: 'Spa', name: 'سبا (SPA)', quantity: 1 },
  ]
};

/**
 * 1. دالة التوليد التلقائي للوحدات
 */
export const generateDefaultUnits = (stars: number): UnitDefinition[] => {
  const safeStars = Math.max(1, Math.min(5, stars));
  const defaults = MANDATORY_FACILITIES[safeStars] || MANDATORY_FACILITIES[1];
  
  return defaults.map(def => ({
    id: crypto.randomUUID(),
    type: def.type as any,
    name: def.name || '',
    quantity: def.quantity || 1,
    bedrooms: 1,
    bathrooms: 1,
    hasLivingRoom: false,
    hasDining: false,
    kitchenType: 'None'
  }));
};

/**
 * 2. جلب قائمة التعهدات التشغيلية
 */
export const getOperationalStandards = async (stars: number): Promise<string[]> => {
  const starCol = `star_${stars}`;
  
  const { data } = await supabase
    .from('hotel_criteria')
    .select(`criteria_name_ar, ${starCol}, category`)
    .eq('is_active', true)
    .or('category.ilike.%نظامي%,category.ilike.%تشغيلي%,category.ilike.%موظفون%,category.ilike.%نظافة%');

  if (!data) return [];

  const standards: string[] = [];
  data.forEach((row: any) => {
    const val = String(row[starCol] || '').trim();
    const isMandatory = val.includes('إلزامي') || val === '1' || val.toLowerCase() === 'true';
    if (isMandatory && row.criteria_name_ar) {
      standards.push(row.criteria_name_ar);
    }
  });

  return standards;
};

/**
 * 3. جلب متطلبات الفرش
 */
export const getFurnishingStandards = async (stars: number): Promise<string[]> => {
  const starCol = `star_${stars}`;
  
  const { data } = await supabase
    .from('hotel_criteria')
    .select(`criteria_name_ar, ${starCol}, category`)
    .eq('is_active', true)
    .or('category.ilike.%أثاث%,category.ilike.%فرش%,category.ilike.%مراتب%');

  if (!data) return [];

  const standards: string[] = [];
  data.forEach((row: any) => {
    const val = String(row[starCol] || '').trim();
    const isMandatory = val.includes('إلزامي') || val === '1' || val.toLowerCase() === 'true';
    if (isMandatory && row.criteria_name_ar) {
      standards.push(row.criteria_name_ar);
    }
  });
  return standards;
};

/**
 * 4. حساب التكلفة التقديرية
 */
export const calculateEstimatedCost = async (units: UnitDefinition[], stars: number): Promise<{ total: number; breakdown: any[] }> => {
    const { data: products } = await supabase.from('products').select('*').eq('is_active', true);
    if (!products) return { total: 0, breakdown: [] };
    
    let total = 0;
    const breakdown: any[] = [];
    const unitTypes = new Set(units.map(u => u.type));

    products.forEach(p => {
        let qty = 0;
        if (p.calc_type === 'per_facility') {
            if (p.required_facility === 'General' || unitTypes.has(p.required_facility)) qty = 1;
        } else {
            units.forEach(u => {
                if (p.valid_unit_types === 'All' || p.valid_unit_types?.includes(u.type)) {
                    qty += u.quantity * (p.qty_multiplier || 1);
                }
            });
        }

        if (qty > 0) {
            let price = 0;
            if (stars <= 3) price = p.price_ready_eco || 0;
            else if (stars === 4) price = p.price_ready_med || 0;
            else price = p.price_custom_high || p.price_ready_med || 0;

            const cost = qty * price;
            total += cost;
            breakdown.push({ name: p.name_ar, qty, cost });
        }
    });

    return { total, breakdown };
};

/**
 * 5. دالة مساعدة لمعرفة الأنواع الإلزامية
 */
export const getMandatoryUnitTypes = async (stars: number): Promise<string[]> => {
  const safeStars = Math.max(1, Math.min(5, stars));
  const defaults = MANDATORY_FACILITIES[safeStars] || MANDATORY_FACILITIES[1];
  return defaults.map(u => u.type as string);
};

// ... (الكود السابق كما هو)

/**
 * 6. جلب كافة الاشتراطات (مرجع كامل)
 * هذه الدالة تجلب كل الاشتراطات (إنشائي، عام، تشغيلي، أثاث) للفئة المحددة
 * لغرض عرضها في التقرير كدليل مرجعي
 */
export const getAllCriteriaForStars = async (stars: number) => {
  const starCol = `star_${stars}`;
  
  const { data } = await supabase
    .from('hotel_criteria')
    .select(`criteria_name_ar, category, ${starCol}`)
    .eq('is_active', true)
    .order('category', { ascending: true }); // ترتيب حسب القسم

  if (!data) return [];

  // تصفية الاشتراطات المطلوبة لهذه الفئة فقط
  const criteriaList = data
    .filter((row: any) => {
      const val = String(row[starCol] || '').trim();
      // الشرط: أن يكون إلزامياً أو له نقاط (مطلوب)
      return val.includes('إلزامي') || val === '1' || val.toLowerCase() === 'true';
    })
    .map((row: any) => ({
      category: row.category || 'عام',
      name: row.criteria_name_ar
    }));

  // تجميعها حسب القسم (Categories)
  const grouped: Record<string, string[]> = {};
  criteriaList.forEach(item => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item.name);
  });

  return grouped;
};