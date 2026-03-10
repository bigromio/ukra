// --- Auth & User Types ---
export enum UserRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
  CLIENT = 'CLIENT'
}

export interface User {
  id?: string;
  email: string;
  role: UserRole;
  name: string;
  username?: string; // Legacy support
  pin?: string;      // Legacy support
  phone?: string;
  points_balance?: number;
  allowed_tabs?: string[];
}

// --- Product & Store Types ---
export interface ProductDB {
  id: number;
  sku: string | null;
  name_ar: string;
  name_en?: string | null;
  category: string | null;
  description_ar?: string | null;
  description_en?: string | null;
  price_ready_med?: number | null; // السعر المتوسط (الافتراضي)
  price_ready_eco?: number | null; // السعر الاقتصادي
  price_ready_vip?: number | null; // السعر الفاخر
  image_url?: string | null;
  is_active: boolean;
  stock_quantity?: number;
  
  // خصائص المستشار الفندقي الجديدة
  criterion_number?: string | null; // رقم المعيار المرتبط
  calc_type?: 'per_unit' | 'per_sqm' | 'per_facility' | null; // طريقة الحساب
  required_facility?: string | null; // المرفق المطلوب (Pool, Gym...)
  valid_unit_types?: string | null;  // أنواع الغرف الصالحة (Single, Suite...)
  supply_source?: 'UKRA' | 'CONTRACTOR' | string | null; // مصدر التوريد
  qty_multiplier?: number; // معامل الكمية
}

// --- Hotel Advisor & Unit Types (UPDATED) ---

// 1. القائمة الشاملة لأنواع الوحدات (غرف + مرافق)
export type UnitType = 
  // وحدات سكنية
  | 'Single' | 'Double' | 'Twin' | 'Triple'| 'Quad' | 'King' | 'Suite' | 'Studio' | 'Apartment' | 'Villa' | 'Accessible'
  // مرافق عامة وإدارية
  | 'Reception' | 'Lobby' | 'PublicToilet' | 'PrayerRoom' | 'MeetingRoom' | 'BusinessCenter' | 'Parking'
  // طعام وشراب
  | 'Restaurant' | 'CoffeeShop' | 'Kitchen' | 'Lounge'
  // ترفيه وخدمات
  | 'Gym' | 'Pool' | 'Spa' | 'KidsArea' | 'Laundry' | 'Barber';

// 2. تصنيف المرافق (للمنطق البرمجي)
export type FacilityCategory = 'Pool' | 'Gym' | 'Restaurant' | 'Meeting' | 'Prayer' | 'Kids' | 'General';

// 3. تعريف الوحدة الموحد (Unified Unit Definition)
export interface UnitDefinition {
  id: string;
  name: string;
  type: UnitType;
  quantity: number;
  
  // خيارات تفصيلية
  bedrooms?: number;
  bathrooms?: number;
  hasLivingRoom?: boolean;
  hasDining?: boolean;
  kitchenType?: 'None' | 'Minibar' | 'Kitchenette' | 'Full';
  
  // للتوافق مع الأكواد القديمة
  unitType?: UnitType;
}

// 4. معايير الوزارة (Criteria)
export interface HotelCriteriaDB {
  id: number;
  classification: string | null; // 'Regulatory' | 'Furnishing'
  category: string | null;
  criteria_name_ar: string;
  criterion_number: string | null;
  star_1?: string | null;
  star_2?: string | null;
  star_3?: string | null;
  star_4?: string | null;
  star_5?: string | null;
  star_5_lux?: string | null;
  is_active: boolean;
  
  // حقول محسوبة في الواجهة (ليست في قاعدة البيانات مباشرة)
  isMandatory?: boolean;
  isRegulatory?: boolean;
}

// 5. هيكل عرض السعر (BOQ Structure)
export interface BOQItem {
  sku: string | null;
  name_ar: string;
  category: string;
  qty: number;
  unitPrice: number;
  totalPrice: number;
  isMandatory: boolean;
  criterion_number?: string | null;
  notes?: string;
}

export interface BOQGroup {
  title: string;
  items: BOQItem[];
  totalCost: number;
  totalMandatory: number;
  mandatoryMet: number;
}

export interface HotelProposal {
  totalEstimated: number;
  totalKeys: number;
  groups: BOQGroup[];
  breakdown: BOQItem[]; // Legacy support
}

// --- Order & Dashboard Types ---
export interface Order {
  id: string;
  type: string;
  status: 'Pending' | 'Processing' | 'Completed' | 'Draft';
  client: string;
  phone?: string;
  date: string;
  amount: string;
  details?: Record<string, any>; // تم استبدال any هنا ليكون آمن برمجياً
}

// --- Tasks Management Types ---
export interface TaskNote {
  id: string;
  content: string;
  author: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  assigned_to: string; // هاتف الموظف أو الـ ID
  assigned_to_name?: string;
  assigned_by?: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  due_date: string;
  started_at?: string;
  completed_at?: string;
  notes?: TaskNote[];
  attachments?: string[];
  created_at?: string;
}

export interface InventoryItem {
  id: number;
  item_name: string;
  quantity: number;
  location: string;
  status: 'Good' | 'Needs Repair' | 'Damaged';
  last_checked: string;
}

// --- Form Payloads ---
export interface DesignRequestPayload {
  unitType: string;
  area: number;
  style: string;
  budget: string;
  notes: string;
  files: string[];
}

export interface FurnitureQuotePayload {
  items: Array<{ name: string; qty: number; notes?: string }>;
  contact: { name: string; phone: string };
}

export interface FeasibilityPayload {
  city: string;
  landArea: number;
  projectType: string;
  budget: string;
}

export interface BookingPayload {
  service: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  email: string;       // تمت الإضافة هنا لحل الخطأ
  notes?: string;
  timestamp?: string; // تمت الإضافة لكي يتوافق مع الدالة
}

export type AdvisorPhase = 'CONSTRUCTION' | 'REGULATORY' | 'FURNISHING';
export type QuestionAnswerType = 'YES_NO' | 'NUMBER' | 'UNIT_SELECTION' | 'CHECKLIST';

export interface AdvisorQuestion {
  id: string;
  phase: AdvisorPhase;
  text: string;
  requirement: string; // قد يكون نصاً أو JSON للقوائم
  isMandatory: boolean;
  points: number;
  answerType: QuestionAnswerType;
  relatedUnitType?: string;
}

export interface UserAnswer {
  questionId: string;
  value: string | number | boolean | string[] | Record<string, any>; // تم استبدال any بنوع آمن
  isCompliant: boolean;
}

export interface Product {
  id: string;
  name_ar: string;
  price_ready_eco: number;
  price_ready_med: number;
  price_custom_high: number;
  calc_type: 'per_unit' | 'per_facility' | 'fixed';
  valid_unit_types?: string[]; // All or specific types
  required_facility?: string;  // e.g. 'Gym'
  qty_multiplier?: number;
}