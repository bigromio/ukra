import { supabase } from '../lib/supabase';
import { UnitDefinition } from '../types';

// ============================================================================
// 1. التعريفات والتصنيفات
// ============================================================================

export type ProductDisplayCategory = 
  | 'ROOM_FURNITURE' | 'PUBLIC_FURNITURE' | 'ROOM_ACCESSORIES'
  | 'PUBLIC_ACCESSORIES' | 'LINENS' | 'ROOM_APPLIANCES'
  | 'PUBLIC_APPLIANCES' | 'BATHROOM' | 'OTHER';

export interface DetailedBOQItem {
  sku: string;
  name: string;
  originalCategory: string;
  displayCategory: ProductDisplayCategory;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isMandatory: boolean;
  criteriaRefs: { id: number; description: string }[];
}

export interface RequirementItem {
  id: number;
  description: string;
  classification: string;
  type: 'CONSTRUCTION' | 'OPERATIONAL' | 'PROCEDURAL';
  points: number;
  isMandatory: boolean;
}

export interface ComprehensiveReport {
  stats: ProjectStats;
  mandatoryProducts: Record<ProductDisplayCategory, DetailedBOQItem[]>;
  recommendedProducts: Record<ProductDisplayCategory, DetailedBOQItem[]>;
  requirements: {
    construction: RequirementItem[];
    operational: RequirementItem[];
    procedural: RequirementItem[];
  };
  totalEstimatedCost: number;
}

interface ProjectStats {
  totalUnits: number;
  totalGuests: number;
  singleBeds: number;
  doubleBeds: number;
  bathrooms: number;
  kitchens: number;
  hasLobby: boolean;
  hasGym: boolean;
  hasRestaurant: boolean;
}

// ============================================================================
// 2. دوال المنطق والتصنيف (Logic Helpers)
// ============================================================================

const mapToDisplayCategory = (pkgTag: string, dbCategory: string): ProductDisplayCategory => {
  const tag = (pkgTag || '').toUpperCase();
  const cat = (dbCategory || '').trim();

  if (tag.includes('LINEN') || tag.includes('BED-S') || tag.includes('BED-D') || cat.includes('بياضات') || cat.includes('مرتبة')) return 'LINENS';
  if (tag.includes('ROOM') || tag.includes('WARDROBE') || tag.includes('SUITE') || cat.includes('سرير') || cat.includes('أثاث')) return 'ROOM_FURNITURE';
  if (tag.includes('LOBBY') || tag.includes('REST') || tag.includes('MEET') || tag.includes('EVENT')) return 'PUBLIC_FURNITURE';
  if (tag.includes('TV') || tag.includes('MINIBAR') || tag.includes('SAFE') || tag.includes('HAIR') || tag.includes('IRON')) return 'ROOM_APPLIANCES';
  if (tag.includes('TECH') || tag.includes('KITCHEN') || tag.includes('LAUNDRY') || tag.includes('CLEAN')) return 'PUBLIC_APPLIANCES';
  if (tag.includes('ROOM-ACC') || tag.includes('CLOSET') || tag.includes('AMN')) return 'ROOM_ACCESSORIES';
  if (tag.includes('FAC-ACC') || tag.includes('DECOR') || tag.includes('SIGN')) return 'PUBLIC_ACCESSORIES';
  if (tag.includes('BATH') || cat.includes('سباكة') || cat.includes('حمام')) return 'BATHROOM';

  return 'OTHER';
};

// دالة التصنيف الصارمة (تعتمد على قاعدة البيانات فقط)
const mapRequirementType = (classification: string): 'CONSTRUCTION' | 'OPERATIONAL' | 'PROCEDURAL' => {
  const cls = (classification || '').trim(); // لا نستخدم الوصف (Description) أبداً للتخمين

  // 1. إنشائي
  if (['إنشائي', 'هندسي', 'مباني', 'مساحات', 'مرافق', 'تصميم'].some(k => cls.includes(k))) {
    return 'CONSTRUCTION';
  }
  
  // 2. تشغيلي
  if (['تشغيلي', 'HR', 'موظفين', 'نظافة', 'صيانة', 'إدارة'].some(k => cls.includes(k))) {
    return 'OPERATIONAL';
  }

  // 3. كل ما عدا ذلك يذهب للقسم العام (Procedural)
  // بما أننا قمنا بتحديث قاعدة البيانات، لن يكون هناك شيء "تائه"
  return 'PROCEDURAL'; 
};

const getMandatoryColumn = (stars: number) => {
  if (stars >= 5) return 'is_mandatory_5star';
  if (stars === 4) return 'is_mandatory_4star';
  if (stars === 3) return 'is_mandatory_3star';
  if (stars === 2) return 'is_mandatory_2star';
  return 'is_mandatory_1star';
};

const getPriceColumn = (stars: number) => {
  if (stars >= 5) return 'price_lux';
  if (stars === 4) return 'price_mid';
  return 'price_eco';
};

// ============================================================================
// 3. المحرك الرئيسي
// ============================================================================

export const calculateComprehensiveReport = async (
  stars: number,
  units: UnitDefinition[]
): Promise<ComprehensiveReport> => {
  
  const stats: ProjectStats = {
    totalUnits: units.length,
    totalGuests: 0,
    singleBeds: 0,
    doubleBeds: 0,
    bathrooms: 0,
    kitchens: 0,
    hasLobby: units.some(u => u.type === 'Lobby'),
    hasGym: units.some(u => u.type === 'Gym'),
    hasRestaurant: units.some(u => u.type === 'Restaurant'),
  };

  units.forEach(u => {
    if (u.type === 'Single') { stats.singleBeds += 1; stats.totalGuests += 1; stats.bathrooms += 1; }
    else if (u.type === 'Double') { stats.doubleBeds += 1; stats.totalGuests += 2; stats.bathrooms += 1; }
    else if (u.type === 'Twin') { stats.singleBeds += 2; stats.totalGuests += 2; stats.bathrooms += 1; }
    else if (u.type === 'Suite') { stats.doubleBeds += 1; stats.totalGuests += 2; stats.bathrooms += 1; stats.kitchens += 1; }
  });

  const mandatoryCol = getMandatoryColumn(stars);
  const priceCol = getPriceColumn(stars);

  const [resCriteria, resProducts, resMapping] = await Promise.all([
    supabase.from('DB_Criteria').select(`id, description, classification, points, ${mandatoryCol}`),
    supabase.from('DB_Products').select('*'),
    supabase.from('DB_Mapping').select('*')
  ]);

  if (resCriteria.error || resProducts.error || resMapping.error) throw new Error("Database Error");

  const criteriaData = resCriteria.data;
  const productsData = resProducts.data;
  const mappingData = resMapping.data;

  const boqMap = new Map<string, DetailedBOQItem>();
  const recMap = new Map<string, DetailedBOQItem>();
  
  const reqs = {
    construction: [] as RequirementItem[],
    operational: [] as RequirementItem[],
    procedural: [] as RequirementItem[]
  };

  criteriaData.forEach((criterion: any) => {
    // إصلاح مشكلة الإلزامية النصية (إذا كانت "true" كنص)
    const rawMandatory = criterion[mandatoryCol];
    const isMandatory = rawMandatory === true || rawMandatory === 'true' || rawMandatory === 'TRUE';
    
    const mappings = mappingData.filter((m: any) => m.criteria_id === criterion.id);

    if (mappings.length > 0) {
      // --- معيار بمنتج ---
      mappings.forEach((mapItem: any) => {
        const product = productsData.find((p: any) => p.sku === mapItem.product_sku);
        if (product) {
          let qty = 1;
          const tag = product.pkg_tag || '';
          
          if (tag.includes('BED-S')) qty = stats.singleBeds;
          else if (tag.includes('BED-D') || tag.includes('BED-K')) qty = stats.doubleBeds;
          else if (tag.includes('BATH')) qty = stats.totalGuests;
          else if (tag.includes('ROOM') || tag.includes('TV')) qty = stats.totalUnits;
          else if (tag.includes('LOBBY') && !stats.hasLobby) qty = 0;
          else if (tag.includes('GYM') && !stats.hasGym) qty = 0;
          
          if (qty > 0) {
            const targetMap = isMandatory ? boqMap : recMap;
            
            // *** إصلاح مشكلة السعر الصفري ***
            // إذا كان السعر الاقتصادي 0، نحاول أخذ المتوسط ثم الفاخر
            let price = Number(product[priceCol]) || 0;
            if (price === 0) price = Number(product.price_mid) || Number(product.price_lux) || 0;

            if (targetMap.has(product.sku)) {
              const existing = targetMap.get(product.sku)!;
              if (!existing.criteriaRefs.find(r => r.id === criterion.id)) {
                existing.criteriaRefs.push({ id: criterion.id, description: criterion.description });
              }
            } else {
              targetMap.set(product.sku, {
                sku: product.sku,
                name: product.name_ar,
                originalCategory: product.category,
                displayCategory: mapToDisplayCategory(product.pkg_tag, product.category),
                quantity: qty,
                unitPrice: price,
                totalPrice: qty * price,
                isMandatory: isMandatory,
                criteriaRefs: [{ id: criterion.id, description: criterion.description }]
              });
            }
          }
        }
      });
    } else {
      // --- معيار بدون منتج ---
      // نضيفه إذا كان إلزامياً أو عليه نقاط
      if (isMandatory || (criterion.points && criterion.points > 0)) {
        // نستخدم الدالة الذكية الجديدة للتصنيف
        const type = mapRequirementType(criterion.classification, criterion.description);
        const item: RequirementItem = {
          id: criterion.id,
          description: criterion.description,
          classification: criterion.classification || 'عام',
          type: type,
          points: criterion.points || 0,
          isMandatory: isMandatory
        };
        
        if (type === 'CONSTRUCTION') reqs.construction.push(item);
        else if (type === 'OPERATIONAL') reqs.operational.push(item);
        else reqs.procedural.push(item);
      }
    }
  });

  const groupItems = (items: DetailedBOQItem[]) => {
    const grouped: Record<ProductDisplayCategory, DetailedBOQItem[]> = {
      'ROOM_FURNITURE': [], 'PUBLIC_FURNITURE': [], 'ROOM_ACCESSORIES': [],
      'PUBLIC_ACCESSORIES': [], 'LINENS': [], 'ROOM_APPLIANCES': [],
      'PUBLIC_APPLIANCES': [], 'BATHROOM': [], 'OTHER': []
    };
    items.forEach(item => {
      if (grouped[item.displayCategory]) {
        grouped[item.displayCategory].push(item);
      } else {
        grouped['OTHER'].push(item);
      }
    });
    return grouped;
  };

  const finalBoqList = Array.from(boqMap.values());
  const finalRecList = Array.from(recMap.values());

  return {
    stats,
    mandatoryProducts: groupItems(finalBoqList),
    recommendedProducts: groupItems(finalRecList),
    requirements: reqs,
    totalEstimatedCost: finalBoqList.reduce((sum, i) => sum + i.totalPrice, 0)
  };
};

// ... دوال UI Helpers تبقى كما هي (generateDefaultUnits, getMandatoryUnitTypes) ...
export const generateDefaultUnits = async (stars: number): Promise<UnitDefinition[]> => {
  const units: UnitDefinition[] = [];
  const baseRooms = stars * 5 + 5;
  units.push({ id: 'def-single', type: 'Single', name: 'غرفة مفردة (Single)', quantity: Math.floor(baseRooms * 0.4), bedrooms: 1, bathrooms: 1, hasLivingRoom: false, hasDining: false, kitchenType: 'None' });
  units.push({ id: 'def-double', type: 'Double', name: 'غرفة مزدوجة (Double)', quantity: Math.floor(baseRooms * 0.6), bedrooms: 1, bathrooms: 1, hasLivingRoom: false, hasDining: false, kitchenType: 'None' });
  const mandatoryCol = getMandatoryColumn(stars);
  const { data } = await supabase.from('DB_Criteria').select('description').eq(mandatoryCol, true);
  if (data) {
    const text = JSON.stringify(data);
    if (text.includes('بهو') || text.includes('استقبال')) units.push({ id: 'def-lobby', type: 'Lobby', name: 'بهو الاستقبال', quantity: 1, bedrooms: 0, bathrooms: 1, hasLivingRoom: true, hasDining: false, kitchenType: 'None' });
    if (text.includes('مطعم') || text.includes('إفطار')) units.push({ id: 'def-rest', type: 'Restaurant', name: 'منطقة مطعم', quantity: 1, bedrooms: 0, bathrooms: 0, hasLivingRoom: false, hasDining: true, kitchenType: 'Full' });
    if (text.includes('رياضية') || text.includes('لياقة')) units.push({ id: 'def-gym', type: 'Gym', name: 'نادي صحي', quantity: 1, bedrooms: 0, bathrooms: 1, hasLivingRoom: false, hasDining: false, kitchenType: 'None' });
  }
  return units;
};

export const getMandatoryUnitTypes = async (stars: number): Promise<string[]> => {
  const types: string[] = [];
  const mandatoryCol = getMandatoryColumn(stars);
  const { data } = await supabase.from('DB_Criteria').select('description').eq(mandatoryCol, true);
  if (data) {
    const text = JSON.stringify(data);
    if (text.includes('بهو')) types.push('Lobby');
    if (text.includes('مطعم')) types.push('Restaurant');
    if (text.includes('رياضية')) types.push('Gym');
  }
  return types;
};