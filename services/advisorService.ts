import { supabase } from '../lib/supabase';
import { UnitDefinition, HotelCriteriaDB, HotelProposal, BOQGroup, BOQItem } from '../types';

// واجهة مساعدة لنتائج التحقق
export interface ValidationResult {
  missingMandatory: string[]; // مرافق إلزامية مفقودة (مثل: مطعم لفندق 3 نجوم)
  regulatoryAlerts: string[]; // تنبيهات تنظيمية (مثل: توفير سعودة، تراخيص)
  areaAlerts: string[];       // تنبيهات مساحات (تحتاج لمنطق خاص)
}

// ------------------------------------------------------------------
// 1. جلب المعايير وفلترتها حسب النجوم
// ------------------------------------------------------------------
export const fetchHotelCriteria = async (stars: number): Promise<HotelCriteriaDB[]> => {
  const { data, error } = await supabase
    .from('hotel_criteria')
    .select('*')
    .eq('is_active', true)
    .order('criterion_number', { ascending: true });

  if (error) {
    console.error("Error fetching criteria:", error);
    return [];
  }

  // تحديد اسم العمود بناءً على عدد النجوم (star_1, star_2...)
  const starCol = `star_${stars}` as keyof HotelCriteriaDB;
  
  return data.map(item => {
    const rawVal = item[starCol];
    const val = String(rawVal || '').trim().toLowerCase();
    
    // تحديد الإلزامية بناءً على المحتوى النصي في قاعدة البيانات
    const mandatoryKeywords = [
      'إلزامي', 'الزامي', 'mandatory', 'required', 'true', '1', 'yes', 'متوفر'
    ];
    const isMandatory = mandatoryKeywords.some(keyword => val.includes(keyword));

    return {
      ...item,
      isMandatory: isMandatory,
      // نعتبره تنظيمي إذا كان التصنيف Regulatory أو لم يكن مرتبطاً بمنتجات مادية مباشرة
      isRegulatory: item.classification === 'Regulatory' || !item.category?.includes('تجهيز')
    };
  });
};

// ------------------------------------------------------------------
// 2. المحرك الرئيسي: التحقق والحساب (Executive Engine)
// ------------------------------------------------------------------
export const getExecutiveSummary = async (
  units: UnitDefinition[], 
  stars: number, 
  quality: 'Value' | 'Med' | 'VIP'
): Promise<{ proposal: HotelProposal, validation: ValidationResult }> => {

  // أ. تعريف المرافق المختارة من قبل العميل للمقارنة
  const selectedFacilities = {
    hasRestaurant: units.some(u => u.type === 'Restaurant'),
    hasCoffee: units.some(u => u.type === 'CoffeeShop'),
    hasGym: units.some(u => u.type === 'Gym'),
    hasPool: units.some(u => u.type === 'Pool'),
    hasMeeting: units.some(u => u.type === 'MeetingRoom'),
    hasKids: units.some(u => u.type === 'KidsArea'),
    hasPrayer: units.some(u => u.type === 'PrayerRoom'),
    hasSpa: units.some(u => u.type === 'Spa'),
  };

  // ب. جلب البيانات (المعايير والمنتجات) بالتوازي
  const [criteriaRes, productsRes] = await Promise.all([
    fetchHotelCriteria(stars),
    supabase.from('products').select('*').eq('is_active', true)
  ]);

  const criteriaList = criteriaRes || [];
  const products = productsRes.data || [];

  // ج. التحقق من النواقص (Validation Logic)
  // نبحث في المعايير الإلزامية عن تلك التي تتحدث عن "وجود مرفق" ولم يقم العميل باختياره
  const missingMandatory: string[] = [];
  const regulatoryAlerts: string[] = [];

  criteriaList.forEach(crit => {
    if (crit.isMandatory) {
      const name = crit.criteria_name_ar;
      
      // منطق التحقق الذكي (Mapping Criteria to Facilities)
      if (name.includes('مطعم') && !selectedFacilities.hasRestaurant && !name.includes('إفطار')) missingMandatory.push('مطعم رئيسي (Restaurant)');
      if ((name.includes('مقهى') || name.includes('كوفي')) && !selectedFacilities.hasCoffee) missingMandatory.push('مقهى / كوفي شوب');
      if ((name.includes('رياضي') || name.includes('لياقة') || name.includes('Gym')) && !selectedFacilities.hasGym) missingMandatory.push('نادي صحي / منطقة لياقة');
      if (name.includes('سباحة') && !selectedFacilities.hasPool) missingMandatory.push('مسبح');
      if (name.includes('اجتماعات') && !selectedFacilities.hasMeeting) missingMandatory.push('قاعة اجتماعات / أعمال');
      if (name.includes('ألعاب') && name.includes('أطفال') && !selectedFacilities.hasKids) missingMandatory.push('منطقة ألعاب أطفال');
      
      // تجميع الاشتراطات التنظيمية
      if (crit.isRegulatory) {
        regulatoryAlerts.push(name);
      }
    }
  });

  // د. حساب التكاليف (Cost Calculation Logic)
  const groupsMap = new Map<string, BOQGroup>();
  const getOrCreateGroup = (key: string, title: string): BOQGroup => {
    if (!groupsMap.has(key)) {
      groupsMap.set(key, { title, items: [], totalCost: 0, totalMandatory: 0, mandatoryMet: 0 });
    }
    return groupsMap.get(key)!;
  };

  let totalEstimated = 0;

  products.forEach(product => {
    // 1. تحديد السعر حسب الجودة المختارة
    let price = product.price_ready_med || 0;
    if (quality === 'Value') price = product.price_ready_eco || (price * 0.85);
    else if (quality === 'VIP') price = product.price_ready_vip || (price * 1.30);

    // 2. التحقق: هل هذا المنتج يخص وحدة اختارها العميل؟
    let isValidForProject = false;
    let calculatedQty = 0;
    const calcType = product.calc_type || 'per_unit'; // الافتراضي: حسب الوحدة
    const multiplier = product.qty_multiplier || 1;

    // حالة: بكج للمرفق (per_facility)
    if (calcType === 'per_facility') {
      // نتحقق من الحقل required_facility في جدول المنتجات
      const reqFacility = product.required_facility;
      if (!reqFacility || reqFacility === 'General') {
         // منتجات عامة تحسب مرة واحدة للمشروع
         isValidForProject = true;
         calculatedQty = 1 * multiplier;
      } else {
         // منتجات خاصة بمرفق معين (مثل معدات الجيم)
         // نفحص ما إذا كان العميل قد اختار هذا المرفق
         const isSelected = units.some(u => 
            (reqFacility === 'Restaurant' && u.type === 'Restaurant') ||
            (reqFacility === 'Gym' && u.type === 'Gym') ||
            (reqFacility === 'Pool' && u.type === 'Pool') ||
            (reqFacility === 'Meeting' && u.type === 'MeetingRoom') ||
            (reqFacility === 'Kids' && u.type === 'KidsArea')
         );
         
         if (isSelected) {
           isValidForProject = true;
           calculatedQty = 1 * multiplier; // بكج واحد للمرفق
         }
      }
    } 
    // حالة: حسب عدد الغرف/الوحدات (per_unit)
    else {
      // نجمع الكميات من جميع الوحدات التي ينطبق عليها المنتج
      units.forEach(unit => {
        let unitMatches = false;
        
        // التحقق من نوع الوحدة المسموح به (valid_unit_types)
        if (!product.valid_unit_types || product.valid_unit_types === 'All') {
          unitMatches = true;
        } else {
          // مثال: "Single,Twin" موجودة في الـ DB
          if (product.valid_unit_types.includes(unit.type)) {
            unitMatches = true;
          }
        }

        if (unitMatches) {
          calculatedQty += unit.quantity * multiplier;
          isValidForProject = true;
        }
      });
    }

    // تقريب الكمية للأعلى
    calculatedQty = Math.ceil(calculatedQty);

    if (isValidForProject && calculatedQty > 0) {
      // ربط المنتج بالمعيار لمعرفة الإلزامية
      const linkedCrit = criteriaList.find(c => String(c.criterion_number) === String(product.criterion_number));
      const isMandatory = linkedCrit ? linkedCrit.isMandatory : false;
      const supplySource = product.supply_source || 'UKRA';

      const itemData: BOQItem = {
        sku: product.sku,
        name_ar: product.name_ar,
        category: product.category || 'تجهيزات',
        qty: calculatedQty,
        unitPrice: supplySource === 'UKRA' ? price : 0, // المقاول سعره 0 في تقديراتنا
        totalPrice: supplySource === 'UKRA' ? (calculatedQty * price) : 0,
        isMandatory: isMandatory || false,
        criterion_number: product.criterion_number,
        notes: supplySource !== 'UKRA' ? 'يتم توفيره عبر مقاول/طرف ثالث' : ''
      };

      // توزيع البنود على المجموعات
      if (supplySource === 'UKRA') {
        const groupKey = isMandatory ? 'UKRA_MANDATORY' : 'UKRA_OPTIONAL';
        const groupTitle = isMandatory ? 'تجهيزات أوكرة (إلزامية)' : 'تجهيزات أوكرة (كماليات/إضافية)';
        
        const group = getOrCreateGroup(groupKey, groupTitle);
        group.items.push(itemData);
        group.totalCost += itemData.totalPrice;
        totalEstimated += itemData.totalPrice;
        if (isMandatory) { group.totalMandatory++; group.mandatoryMet++; }
      } else {
        const group = getOrCreateGroup('CONTRACTOR', 'أعمال المقاولين والتجهيزات الخارجية');
        group.items.push(itemData);
        if (isMandatory) { group.totalMandatory++; group.mandatoryMet++; } // نعتبره محقق لأن العميل سيوفره
      }
    }
  });

  // هـ. إضافة الاشتراطات التنظيمية التي ليس لها منتجات (للعلم فقط)
  const regGroup = getOrCreateGroup('REGULATORY', 'الاشتراطات التنظيمية والإجرائية');
  criteriaList.forEach(crit => {
    if (crit.isMandatory && crit.isRegulatory) {
       // نتأكد أننا لم نضفها سابقاً عبر المنتجات
       const alreadyCovered = products.some(p => String(p.criterion_number) === String(crit.criterion_number));
       if (!alreadyCovered) {
         regGroup.items.push({
           sku: 'REG',
           name_ar: crit.criteria_name_ar,
           category: 'إجراءات',
           qty: 1,
           unitPrice: 0,
           totalPrice: 0,
           isMandatory: true,
           criterion_number: crit.criterion_number,
           notes: 'متطلب تنظيمي (رخصة/شهادة)'
         });
         regGroup.totalMandatory++;
       }
    }
  });

  // ترتيب المجموعات للعرض
  const sortedGroups = [
    groupsMap.get('UKRA_MANDATORY'),
    groupsMap.get('UKRA_OPTIONAL'),
    groupsMap.get('CONTRACTOR'),
    groupsMap.get('REGULATORY')
  ].filter(Boolean) as BOQGroup[];

  // إزالة التكرار من قائمة النواقص
  const uniqueMissing = [...new Set(missingMandatory)];

  return {
    proposal: {
      totalEstimated,
      totalKeys: units.reduce((acc, u) => acc + u.quantity, 0),
      groups: sortedGroups,
      breakdown: [] // Legacy
    },
    validation: {
      missingMandatory: uniqueMissing,
      regulatoryAlerts: [], // يمكن إضافتها إذا أردنا عرضها كتنبيهات
      areaAlerts: [] // يمكن تفعيلها لاحقاً
    }
  };
};

export const saveHotelProposal = async (userId: string, projectName: string, stars: number, units: UnitDefinition[], summaryData: any) => {
  await supabase.from('orders').insert({
      client_id: userId,
      project_name: projectName,
      type: 'Hotel Consultant',
      status: 'Draft',
      total_amount: summaryData.proposal.totalEstimated,
      details: { stars, units, summary: summaryData }
    });
};