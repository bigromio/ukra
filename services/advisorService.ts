import { supabase } from '../lib/supabase';
import { UnitDefinition } from '../types';

// خريطة لربط الكلمات المفتاحية في الاشتراطات بأنواع الوحدات
const KEYWORD_TO_UNIT_TYPE: Record<string, { type: string; name: string; defaultQty: number }> = {
  'استقبال': { type: 'Reception', name: 'الاستقبال (Reception)', defaultQty: 1 },
  'بهو': { type: 'Lobby', name: 'بهو الفندق (Lobby)', defaultQty: 1 },
  'مصلى': { type: 'PrayerRoom', name: 'مصلى', defaultQty: 1 },
  'دورة مياه': { type: 'PublicToilet', name: 'دورة مياه عامة', defaultQty: 2 },
  'مواقف': { type: 'Parking', name: 'مواقف سيارات', defaultQty: 1 },
  'مطعم': { type: 'Restaurant', name: 'مطعم رئيسي', defaultQty: 1 },
  'مطبخ': { type: 'Kitchen', name: 'مطبخ مركزي', defaultQty: 1 },
  'نادي صحي': { type: 'Gym', name: 'نادي صحي (Gym)', defaultQty: 1 },
  'لياقة': { type: 'Gym', name: 'نادي صحي (Gym)', defaultQty: 1 },
  'مسبح': { type: 'Pool', name: 'مسبح', defaultQty: 1 },
  'اجتماعات': { type: 'MeetingRoom', name: 'قاعة اجتماعات', defaultQty: 1 },
  'أعمال': { type: 'BusinessCenter', name: 'مركز أعمال', defaultQty: 1 },
  'مغسلة': { type: 'Laundry', name: 'مغسلة مركزية', defaultQty: 1 },
  'ذوي': { type: 'Accessible', name: 'غرفة ذوي الهمم', defaultQty: 1 },
};

// دالة مساعدة للتحقق من الإلزامية في قاعدة البيانات (مرنة)
const checkIsMandatory = (val: string): boolean => {
  if (!val) return false;
  const v = val.trim().toLowerCase();
  return (
    v.includes('إلزامي') || 
    v.includes('الزامي') || 
    v === '1' || 
    v === 'true' || 
    v === 'yes'
  );
};

/**
 * 1. التوليد الديناميكي للوحدات (Structure Logic)
 */
export const generateDefaultUnits = async (stars: number): Promise<UnitDefinition[]> => {
  const starCol = `star_${stars}`;
  
  // جلب الاشتراطات الإلزامية
  const { data } = await supabase
    .from('hotel_criteria')
    .select(`criteria_name_ar, ${starCol}`)
    .eq('is_active', true);

  if (!data) return [];

  const unitsMap = new Map<string, UnitDefinition>();

  // إضافة الغرف السكنية بشكل افتراضي (حسب العرف الفندقي للفئة)
  const baseRooms = stars * 10; 
  unitsMap.set('Single', { id: 'def-1', type: 'Single', name: 'غرفة مفردة', quantity: Math.floor(baseRooms * 0.4) || 5 });
  unitsMap.set('Double', { id: 'def-2', type: 'Double', name: 'غرفة مزدوجة', quantity: Math.floor(baseRooms * 0.6) || 10 });

  // تحليل النصوص وإضافة الوحدات
  data.forEach((row: any) => {
    const val = String(row[starCol] || '');
    if (checkIsMandatory(val)) {
      const text = row.criteria_name_ar || '';
      for (const [keyword, unitDef] of Object.entries(KEYWORD_TO_UNIT_TYPE)) {
        if (text.includes(keyword)) {
          if (!unitsMap.has(unitDef.type)) {
            unitsMap.set(unitDef.type, {
              id: crypto.randomUUID(),
              type: unitDef.type as any,
              name: unitDef.name,
              quantity: unitDef.defaultQty,
              bedrooms: 1, bathrooms: 1, hasLivingRoom: false, hasDining: false, kitchenType: 'None'
            });
          }
        }
      }
    }
  });

  return Array.from(unitsMap.values());
};

/**
 * 2. دالة مساعدة لمعرفة الأنواع الإلزامية (لحل الخطأ في StructureStep)
 */
export const getMandatoryUnitTypes = async (stars: number): Promise<string[]> => {
  const units = await generateDefaultUnits(stars);
  return units.map(u => u.type);
};

/**
 * 3. جلب التعهدات التشغيلية (Compliance Logic)
 */
export const getOperationalStandards = async (stars: number): Promise<string[]> => {
  const starCol = `star_${stars}`;
  
  const { data } = await supabase
    .from('hotel_criteria')
    .select(`criteria_name_ar, category, ${starCol}`)
    .eq('is_active', true)
    .not('category', 'ilike', '%فرش%')
    .not('category', 'ilike', '%أثاث%')
    .not('category', 'ilike', '%مبنى%'); 

  if (!data) return [];

  const standards: string[] = [];
  data.forEach((row: any) => {
    const val = String(row[starCol] || '');
    if (checkIsMandatory(val) && row.criteria_name_ar) {
      const text = row.criteria_name_ar;
      // استبعاد ما تم تحويله لوحدات
      const isFacilityRequirement = Object.keys(KEYWORD_TO_UNIT_TYPE).some(k => text.includes(k) && (text.includes('توفير') || text.includes('وجود')));
      
      if (!isFacilityRequirement) {
        standards.push(text);
      }
    }
  });

  return standards;
};

// دالة مساعدة لحساب أنواع الوحدات للتسعير
const countUnitTypes = (units: UnitDefinition[]) => {
  let totalRooms = 0;
  let singleBeds = 0;
  let doubleBeds = 0;

  units.forEach(u => {
    if (['Single', 'Double', 'Suite', 'Apartment', 'Studio', 'Villa'].includes(u.type)) {
      totalRooms += u.quantity;
      if (u.type === 'Single') singleBeds += u.quantity;
      if (u.type === 'Double') doubleBeds += (u.quantity * 2); // عادة الغرفة المزدوجة بها سريرين أو سرير كبير
      // يمكن تحسين المنطق هنا بناءً على تفاصيل الوحدة
    }
  });
  
  return { totalRooms, singleBeds, doubleBeds };
};

/**
 * 4. حساب التكلفة المربوط بالاشتراطات (Product Mapping)
 */
export const calculateEstimatedCost = async (units: UnitDefinition[], stars: number) => {
  const starCol = `star_${stars}`;

  const { data: criteriaWithProducts } = await supabase
    .from('hotel_criteria')
    .select(`criteria_name_ar, related_product_sku, ${starCol}`)
    .eq('is_active', true)
    .not('related_product_sku', 'is', null)
    .neq('related_product_sku', '');

  const { data: products } = await supabase
    .from('products')
    .select('*');
    
  if (!criteriaWithProducts || !products) return { total: 0, breakdown: [] };

  let total = 0;
  const breakdown: any[] = [];
  const unitCounts = countUnitTypes(units);

  criteriaWithProducts.forEach((crit: any) => {
    if (checkIsMandatory(crit[starCol])) {
      const sku = crit.related_product_sku;
      const product = products.find(p => p.sku === sku);
      
      if (product) {
        let qty = 0;
        // منطق حساب الكميات
        if (product.calc_type === 'per_room') qty = unitCounts.totalRooms;
        else if (product.calc_type === 'per_bed_single') qty = unitCounts.singleBeds;
        else if (product.calc_type === 'per_bed_double') qty = unitCounts.doubleBeds;
        else if (product.calc_type === 'fixed') qty = 1;
        // إضافة دعم لأنواع الوحدات المحددة في جدول المنتجات
        else if (product.calc_type === 'per_facility' && product.required_facility) {
             const facility = units.find(u => u.type === product.required_facility);
             if (facility) qty = facility.quantity;
        }

        if (qty > 0) {
           const price = stars > 3 ? (product.price_custom_high || product.price_ready_med) : (product.price_ready_eco || product.price_ready_med);
           const cost = qty * price;
           total += cost;
           breakdown.push({
             name: crit.criteria_name_ar,
             productName: product.name_ar,
             qty,
             cost,
             sku
           });
        }
      }
    }
  });

  return { total, breakdown };
};

/**
 * 5. جلب كافة الاشتراطات (لصفحة الدليل المرجعي في PDF)
 * هذه الدالة كانت مفقودة أيضاً وأضفناها الآن
 */
export const getAllCriteriaForStars = async (stars: number) => {
  const starCol = `star_${stars}`;
  
  const { data } = await supabase
    .from('hotel_criteria')
    .select(`criteria_name_ar, category, ${starCol}`)
    .eq('is_active', true)
    .order('category', { ascending: true });

  if (!data) return [];

  const criteriaList = data
    .filter((row: any) => checkIsMandatory(String(row[starCol] || '')))
    .map((row: any) => ({
      category: row.category || 'عام',
      name: row.criteria_name_ar
    }));

  const grouped: Record<string, string[]> = {};
  criteriaList.forEach(item => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item.name);
  });

  return grouped;
};

// للحفاظ على التوافق (في حال كان هناك استدعاء قديم)
export const getFurnishingStandards = getOperationalStandards;