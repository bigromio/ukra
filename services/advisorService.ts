import { supabase } from '../lib/supabase';
import { AdvisorPhase, AdvisorQuestion } from '../types';

/**
 * خريطة توزيع فئات الاشتراطات على مراحل المشروع الثلاث
 */
const CATEGORY_MAP: Record<string, AdvisorPhase> = {
  // --- مرحلة البناء والتشطيب (Construction) ---
  'المظهر الخارجي': 'CONSTRUCTION',
  'مواقف السيارات': 'CONSTRUCTION',
  'المصاعد': 'CONSTRUCTION',
  'الممرات والسلالم': 'CONSTRUCTION',
  'مساحة الغرف': 'CONSTRUCTION',
  'مساحة الشقق': 'CONSTRUCTION',
  'دورة المياه': 'CONSTRUCTION',
  'المطبخ': 'CONSTRUCTION',
  'ذوي الاحتياجات': 'CONSTRUCTION',
  'الاستقبال': 'CONSTRUCTION',
  'البهو': 'CONSTRUCTION',
  'المرافق العامة': 'CONSTRUCTION',
  'الإضاءة': 'CONSTRUCTION', // التأسيس
  'التهوية': 'CONSTRUCTION',
  'التكييف': 'CONSTRUCTION',

  // --- المرحلة النظامية والتشغيلية (Regulatory) ---
  'المتطلبات العامة': 'REGULATORY',
  'الموظفون': 'REGULATORY',
  'اللغات': 'REGULATORY',
  'السلامة': 'REGULATORY',
  'النظافة العامة': 'REGULATORY',
  'الصيانة': 'REGULATORY',
  'البيئة': 'REGULATORY',
  'الموارد البشرية': 'REGULATORY',
  'الجودة': 'REGULATORY',
  'موقع إلكتروني': 'REGULATORY',
  'التقنية': 'REGULATORY',

  // --- مرحلة الفرش والتأثيث (Furnishing) ---
  'الأثاث': 'FURNISHING',
  'الأسرة': 'FURNISHING',
  'المراتب': 'FURNISHING',
  'أغطية الأسرة': 'FURNISHING',
  'الوسائد': 'FURNISHING',
  'الستائر': 'FURNISHING',
  'الكهرباء': 'FURNISHING', // الأفياش
  'إلكترونيات': 'FURNISHING',
  'المناشف': 'FURNISHING',
  'العناية الشخصية': 'FURNISHING',
  'أدوات': 'FURNISHING',
  'المشروبات': 'FURNISHING',
  'اللوحات': 'FURNISHING',
  'الإكسسوارات': 'FURNISHING'
};

/**
 * دالة جلب الأسئلة وتحويلها إلى كائنات تفاعلية
 */
export const getAdvisorQuestions = async (stars: number): Promise<AdvisorQuestion[]> => {
  const { data, error } = await supabase
    .from('hotel_criteria')
    .select('*')
    .eq('is_active', true)
    .order('criterion_number', { ascending: true });

  if (error || !data) {
    console.error("Error fetching questions:", error);
    return [];
  }

  const starCol = `star_${stars}`;
  const questions: AdvisorQuestion[] = [];

  data.forEach((row: any) => {
    // 1. قراءة القيمة وتحديد الإلزامية
    const rawVal = String(row[starCol] || '').trim();
    const isMandatory = rawVal.includes('إلزامي') || rawVal.includes('الزامي') || rawVal === '1' || valIsBooleanTrue(rawVal);
    const points = parseInt(row.points || '0');

    // إذا لم يكن إلزامياً وليس له نقاط، نتجاوزه
    if (!isMandatory && (!points || points === 0)) return;

    const text = row.criteria_name_ar || '';
    const category = row.category || 'عام';

    // 2. تحديد المرحلة (Phase)
    let phase: AdvisorPhase = 'REGULATORY'; // الافتراضي
    
    // البحث في الخريطة
    for (const [key, val] of Object.entries(CATEGORY_MAP)) {
      if (category.includes(key)) {
        phase = val;
        break;
      }
    }
    
    // تصحيح المرحلة بناءً على الكلمات المفتاحية في النص
    if (text.includes('مساحة') || text.includes('عرض') || text.includes('ارتفاع') || text.includes('م²') || text.includes('سم')) {
        phase = 'CONSTRUCTION';
    } else if (text.includes('سرير') || text.includes('مرتبة') || text.includes('تلفزيون') || text.includes('ثلاجة')) {
        phase = 'FURNISHING';
    }

    // 3. تحديد نوع السؤال وربطه بالوحدات
    let answerType: 'YES_NO' | 'NUMBER' | 'UNIT_SELECTION' = 'YES_NO';
    let relatedUnitType: string | undefined = undefined;

    // منطق ربط الكلمات المفتاحية بأنواع الوحدات في UnitBuilder
    if (text.includes('حجم الغرفة') || (text.includes('مساحة') && text.includes('الغرف'))) {
        answerType = 'UNIT_SELECTION'; relatedUnitType = 'Room';
    } else if (text.includes('حجم الشقة') || (text.includes('مساحة') && text.includes('الشقة'))) {
        answerType = 'UNIT_SELECTION'; relatedUnitType = 'Apartment';
    } else if (text.includes('استقبال') && (text.includes('كاونتر') || text.includes('مكتب'))) {
        answerType = 'UNIT_SELECTION'; relatedUnitType = 'Reception';
    } else if (text.includes('مطعم') && (text.includes('وجود') || text.includes('واحد'))) {
        answerType = 'UNIT_SELECTION'; relatedUnitType = 'Restaurant';
    } else if (text.includes('مطبخ') && (text.includes('مركزي') || text.includes('رئيسي'))) {
        answerType = 'UNIT_SELECTION'; relatedUnitType = 'Kitchen';
    } else if (text.includes('مقهى') || text.includes('كوفي')) {
        answerType = 'UNIT_SELECTION'; relatedUnitType = 'CoffeeShop';
    } else if (text.includes('مصلى') || text.includes('صلاة')) {
        answerType = 'UNIT_SELECTION'; relatedUnitType = 'PrayerRoom';
    } else if (text.includes('دورة مياه') && text.includes('عامة')) {
        answerType = 'UNIT_SELECTION'; relatedUnitType = 'PublicToilet';
    } else if (text.includes('مغسلة') && (text.includes('ملابس') || text.includes('مركزية'))) {
        answerType = 'UNIT_SELECTION'; relatedUnitType = 'Laundry';
    } else if (text.includes('ذوي الاحتياجات') && (text.includes('تخصيص') || text.includes('وحدات'))) {
        answerType = 'UNIT_SELECTION'; relatedUnitType = 'Accessible';
    } else if (text.includes('رياضي') || text.includes('لياقة') || text.includes('Gym')) {
        answerType = 'UNIT_SELECTION'; relatedUnitType = 'Gym';
    } else if (text.includes('مسبح')) {
        answerType = 'UNIT_SELECTION'; relatedUnitType = 'Pool';
    } else if (text.includes('اجتماعات') || text.includes('مؤتمرات')) {
        answerType = 'UNIT_SELECTION'; relatedUnitType = 'MeetingRoom';
    } else if (text.includes('أعمال') && text.includes('مركز')) {
        answerType = 'UNIT_SELECTION'; relatedUnitType = 'BusinessCenter';
    } else if (text.includes('مواقف') && (text.includes('سيارات') || text.includes('تخصيص'))) {
         // نتأكد أنه لا يسأل عن عرض الموقف بل عن وجوده
         if (!text.includes('عرض') && !text.includes('طول')) {
             answerType = 'UNIT_SELECTION'; relatedUnitType = 'Parking';
         }
    }

    // 4. صياغة السؤال للعرض
    let displayQuestion = text;
    if (answerType === 'UNIT_SELECTION') {
       displayQuestion = `هذا البند يتطلب توفير وحدة/مرفق: "${text}". هل قمت بإضافته للمخطط؟`;
    } else if (text.includes('م²') || text.includes('سم')) {
       displayQuestion = `هل التزمت بالمعيار الهندسي: ${text}؟`;
    } else {
       displayQuestion = `هل يتوفر لديكم: ${text}؟`;
    }

    questions.push({
      id: String(row.criterion_number),
      phase: phase,
      text: displayQuestion,
      requirement: text,
      isMandatory: isMandatory,
      points: points,
      answerType: answerType,
      relatedUnitType: relatedUnitType
    });
  });

  return questions;
};

/**
 * دالة تحديد أنواع الوحدات الإلزامية حسب الفئة (1-5 نجوم)
 * تستخدم لعرض الشارات الحمراء في نافذة الوحدات
 */
export const getMandatoryUnitTypes = async (stars: number): Promise<string[]> => {
    // 1. القواعد الثابتة (V2 Standards Hardcoded Logic)
    const mandatoryTypes: Set<string> = new Set();

    // أ. أساسيات لكل الفئات (1-5)
    mandatoryTypes.add('Reception');
    mandatoryTypes.add('Lobby');
    mandatoryTypes.add('PrayerRoom');
    mandatoryTypes.add('PublicToilet'); // دورات مياه عامة

    // ب. نجمتين وأكثر (2+)
    if (stars >= 2) {
        mandatoryTypes.add('CoffeeShop'); // غالباً مطلوب تقديم مشروبات
    }

    // ج. 3 نجوم وأكثر (3+)
    if (stars >= 3) {
        mandatoryTypes.add('Restaurant'); // مطعم رئيسي
        mandatoryTypes.add('Kitchen');    // مطبخ للمطعم
        mandatoryTypes.add('Accessible'); // غرفة ذوي الهمم (1%)
        mandatoryTypes.add('Parking');    // مواقف سيارات
    }

    // د. 4 نجوم وأكثر (4+)
    if (stars >= 4) {
        mandatoryTypes.add('Gym');
        mandatoryTypes.add('Laundry');     // خدمة غسيل
        mandatoryTypes.add('MeetingRoom'); // قاعات
    }

    // هـ. 5 نجوم (5)
    if (stars >= 5) {
        mandatoryTypes.add('Pool');           // مسبح
        mandatoryTypes.add('BusinessCenter'); // مركز أعمال
        mandatoryTypes.add('Spa');            // سبا
    }

    // 2. التحقق من قاعدة البيانات (Fallback)
    // لجلب أي وحدة إضافية قد تكون محددة كـ "إلزامي" في الجدول ولم نذكرها
    const { data } = await supabase
      .from('hotel_criteria')
      .select('criteria_name_ar, star_' + stars)
      .eq('is_active', true);
  
    if (data) {
        const starCol = `star_${stars}`;
        data.forEach((row: any) => {
          const val = String(row[starCol] || '').trim();
          const isMandatory = val.includes('إلزامي') || val === '1' || val.toLowerCase() === 'true';
          
          if (isMandatory) {
            const text = row.criteria_name_ar || '';
            // التقاط الكلمات المفتاحية
            if (text.includes('مسبح')) mandatoryTypes.add('Pool');
            if (text.includes('نادي صحي')) mandatoryTypes.add('Gym');
            if (text.includes('مغسلة')) mandatoryTypes.add('Laundry');
            if (text.includes('مطبخ')) mandatoryTypes.add('Kitchen');
            if (text.includes('دورة مياه') && text.includes('عامة')) mandatoryTypes.add('PublicToilet');
          }
        });
    }
  
    return Array.from(mandatoryTypes);
};

// دالة مساعدة للقيم المنطقية
const valIsBooleanTrue = (val: string) => val.toLowerCase() === 'true';

/**
 * حساب التكلفة التقديرية (مع دعم الوحدات الجديدة)
 */
export const calculateEstimatedCost = async (units: any[], stars: number): Promise<{ total: number; breakdown: any[] }> => {
    const { data: products } = await supabase.from('products').select('*').eq('is_active', true);
    if (!products) return { total: 0, breakdown: [] };
    
    let total = 0;
    const breakdown: any[] = [];
    const unitTypes = new Set(units.map(u => u.type));

    products.forEach(p => {
        let qty = 0;
        // حساب الكميات
        if (p.calc_type === 'per_facility') {
            // إذا كان المنتج يتبع مرفق (مثل أجهزة الجيم تتبع Gym)
            if (p.required_facility === 'General' || unitTypes.has(p.required_facility)) {
                qty = 1;
            }
        } else {
            // إذا كان المنتج يتبع وحدة (مثل سرير يتبع Single Room)
            units.forEach(u => {
                if (p.valid_unit_types === 'All' || p.valid_unit_types?.includes(u.type)) {
                    qty += u.quantity * (p.qty_multiplier || 1);
                }
            });
        }

        if (qty > 0) {
            // تحديد السعر حسب الجودة (حالياً نأخذ المتوسط كتقدير)
            const price = p.price_ready_med || p.price_ready_eco || 0;
            const cost = qty * price;
            total += cost;
            breakdown.push({ name: p.name_ar, qty, cost });
        }
    });

    return { total, breakdown };
};