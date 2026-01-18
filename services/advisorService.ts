import { supabase } from '../lib/supabase';
import { UnitDefinition, HotelCriteriaDB, SelectedFacilities, HotelProposal } from '../types';

// ------------------------------------------------------------------
// 1. جلب معايير الوزارة (Fetch Criteria)
// ------------------------------------------------------------------
export const fetchHotelCriteria = async (stars: number): Promise<HotelCriteriaDB[]> => {
  // نجلب كل المعايير، وسنقوم بالفلترة لاحقاً بناءً على العمود المناسب للنجمة
  const { data, error } = await supabase
    .from('hotel_criteria')
    .select('*')
    .eq('is_active', true)
    .order('criterion_number', { ascending: true });

  if (error) {
    console.error('Error fetching criteria:', error);
    return [];
  }

  // نقوم بفلترة بسيطة لإرجاع المعايير المطلوبة لهذه النجمة (سواء إلزامي أو اختياري)
  // العمود في الداتابيز يكون اسمه: star_1, star_2, star_3...
  const starCol = `star_${stars}` as keyof HotelCriteriaDB;

  return data.map(item => ({
    ...item,
    // نحدد هل هو إلزامي أم لا بناءً على قيمة العمود الخاص بالنجمة
    isMandatory: item[starCol] ? (item[starCol] as string).includes('إلزامي') : false
  }));
};

// ------------------------------------------------------------------
// 2. المحرك الذكي (The Smart Logic Engine)
// كان اسمه سابقاً getSmartBOQ، أعدنا تسميته ليتطابق مع الواجهة
// ------------------------------------------------------------------
export const getExecutiveSummary = async (
  units: UnitDefinition[], 
  stars: number, 
  quality: 'Value' | 'Med' | 'VIP',
  facilities: SelectedFacilities
): Promise<HotelProposal | null> => {
  
  // أ) جلب الاشتراطات
  const criteriaList = await fetchHotelCriteria(stars);

  // ب) جلب المنتجات
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true);

  if (prodError || !products) {
    console.error('Error fetching products:', prodError);
    return null;
  }

  let totalEstimated = 0;
  const itemsMap = new Map<string, any>();
  
  // خريطة لتجميع المجموعات (Groups)
  // سنستخدم خريطة لضمان عدم تكرار أسماء المجموعات وتجميع التكلفة
  const groupsMap = new Map<string, {
    title: string;
    totalCost: number;
    items: any[];
    mandatoryMet: number;
    totalMandatory: number;
  }>();

  // --- تنفيذ المنطق ---
  criteriaList.forEach(crit => {
    // هل المعيار مطلوب؟ (إلزامي أو له نقاط)
    // إذا كان "-" (غير مطلوب) ولا يوجد منتج مرتبط به، نتجاهله.
    // لكن إذا كان له منتج، قد نعرضه كخيار إضافي.
    
    const relatedProducts = products.filter(p => p.criterion_number === crit.criterion_number);

    if (relatedProducts.length > 0) {
      relatedProducts.forEach(product => {
        let qty = 0;
        let showProduct = false;

        // 1. فلتر المرافق (Facility Check)
        const reqFacility = product.required_facility || 'General';
        if (reqFacility === 'General') showProduct = true;
        else if (reqFacility === 'Pool' && facilities.hasPool) showProduct = true;
        else if (reqFacility === 'Gym' && facilities.hasGym) showProduct = true;
        else if (reqFacility === 'Restaurant' && facilities.hasRestaurant) showProduct = true;
        else if (reqFacility === 'Meeting' && facilities.hasMeeting) showProduct = true;
        else if (reqFacility === 'Kids' && facilities.hasKidsArea) showProduct = true;
        else if (reqFacility === 'Prayer') showProduct = true;

        if (!showProduct) return;

        // 2. حساب الكميات (Quantity Logic)
        const calcType = product.calc_type || 'per_unit';
        const multiplier = product.qty_multiplier || 1;
        const validTypes = product.valid_unit_types || 'All';

        if (calcType === 'per_facility') {
          qty = 1 * multiplier;
        } 
        else if (calcType === 'per_sqm') {
           const totalRooms = units.reduce((sum, u) => sum + u.quantity, 0);
           const avgSqm = 24; 
           qty = totalRooms * avgSqm * multiplier;
        }
        else {
          // per_unit
          let unitBasedQty = 0;
          units.forEach(unit => {
            if (validTypes === 'All' || (validTypes && validTypes.includes(unit.type))) {
               unitBasedQty += (unit.quantity * multiplier);
            }
          });
          qty = unitBasedQty;
        }

        if (qty <= 0) return;

        // 3. السعر
        // نختار السعر بناءً على الجودة المطلوبة (حالياً لدينا سعر واحد، نجهزه للمستقبل)
        let price = product.price_ready_med || 0;
        if (quality === 'Value') price = product.price_ready_eco || (price * 0.85); // تخفيض افتراضي
        else if (quality === 'VIP') price = product.price_ready_vip || (price * 1.30); // زيادة افتراضية

        // إضافة المنتج
        const itemObj = {
            criterion_number: crit.criterion_number,
            name_ar: product.name_ar,
            sku: product.sku,
            qty: Math.ceil(qty),
            unitPrice: price,
            totalPrice: Math.ceil(qty * price),
            isMandatory: crit.isMandatory || false,
            category: product.category || crit.category || 'تجهيزات عامة',
            notes: calcType === 'per_sqm' ? '(متر مربع تقديري)' : ''
        };

        // تجميع في المجموعات (Groups)
        const catTitle = itemObj.category;
        if (!groupsMap.has(catTitle)) {
            groupsMap.set(catTitle, { 
                title: catTitle, 
                totalCost: 0, 
                items: [], 
                mandatoryMet: 0, 
                totalMandatory: 0 
            });
        }
        
        const group = groupsMap.get(catTitle)!;
        group.items.push(itemObj);
        group.totalCost += itemObj.totalPrice;
        if (crit.isMandatory) {
            group.totalMandatory += 1; // نحسبه كمعيار مطلوب
            group.mandatoryMet += 1;   // بما أننا وفرنا المنتج، فقد تم الامتثال
        }

        totalEstimated += itemObj.totalPrice;
      });

    } else if (crit.isMandatory) {
      // معيار إلزامي ليس له منتج (تنظيمي)
      // نضيفه لمجموعة "اشتراطات تنظيمية"
      const catTitle = 'اشتراطات تنظيمية وإدارية';
      if (!groupsMap.has(catTitle)) {
          groupsMap.set(catTitle, { 
              title: catTitle, 
              totalCost: 0, 
              items: [], 
              mandatoryMet: 0, 
              totalMandatory: 0 
          });
      }
      const group = groupsMap.get(catTitle)!;
      group.totalMandatory += 1;
      // لا نزيد mandatoryMet لأننا لا نبيعه، ولكن نظهره في القائمة
      group.items.push({
        criterion_number: crit.criterion_number,
        name_ar: crit.criteria_name_ar,
        sku: 'REG',
        qty: 1,
        unitPrice: 0,
        totalPrice: 0,
        isMandatory: true,
        category: catTitle,
        notes: 'مطلوب توفيره إدارياً'
      });
    }
  });

  return {
    totalEstimated,
    totalKeys: units.reduce((s, u) => s + u.quantity, 0),
    groups: Array.from(groupsMap.values()),
    breakdown: [] // legacy compatibility
  };
};

// ------------------------------------------------------------------
// 3. حفظ الاقتراح (Save Proposal)
// ------------------------------------------------------------------
export const saveHotelProposal = async (
  userId: string,
  projectName: string,
  stars: number,
  units: UnitDefinition[],
  summaryData: any
) => {
  // نقوم بحفظ الطلب في جدول orders كطلب استشارة
  const { error } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      type: 'Hotel Consultant', // نوع الطلب
      status: 'Draft',
      client_name: projectName, // مؤقتاً نضع اسم المشروع هنا
      details: {
        stars,
        units,
        total_estimated: summaryData.totalEstimated,
        generated_at: new Date().toISOString()
      },
      amount: summaryData.totalEstimated
    });

  if (error) {
    console.error('Error saving proposal:', error);
    throw error;
  }
};