

export enum UserRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
  CLIENT = 'CLIENT',
}

export interface User {
  id?: string;
  username?: string;
  email?: string;
  role: UserRole;
  name: string;
  phone?: string;
  points_balance?: number;
  avatar_url?: string;
}

// --- Hotel Advisor / Database Types ---

export interface HotelCriteriaDB {
  id: number;
  star_rating: number;
  criteria_name_ar: string; 
  criteria_name_en: string; 
  facility_type?: string;
  classification_level?: string;
  is_mandatory?: boolean;
  property_type?: string; 
  category?: string; // e.g. furnishing, safety, regulatory
  criterion_number?: number; // Critical for matching
  classification?: 'Regulatory' | 'Furnishing';
  related_tags?: string[];
  
  // UI Helper Properties (Computed)
  isRegulatory?: boolean;
  isMandatory?: boolean;
}

export interface ProductDB {
  id: number;
  sku: string;
  name_ar: string;
  name_en: string;
  description_ar?: string;
  image_url?: string;
  
  // Pricing
  price_ready_med: number; 
  price_ready_vip: number; 
  price_ready_eco?: number; 
  
  // Categorization
  category?: string;
  boq_group?: string;
  min_star_rating?: number;
  criterion_number?: number; 
  
  // Smart Linking
  related_tags?: string[];
  is_active?: boolean;

  // --- أضف هذه الأسطر الجديدة فقط ---
  valid_unit_types?: string;      // للربط بنوع الغرفة (King, Suite...)
  required_facility?: string;     // للربط بالمرفق (Pool, Gym...)
  calc_type?: 'per_unit' | 'per_sqm' | 'per_facility'; // طريقة الحساب
  qty_multiplier?: number;        // معامل التكرار (PAR)
}

export interface PackageItemDB {
  id: number;
  package_id: number;
  quantity: number;
  products: ProductDB; 
}

export interface PackageDB {
  id: number;
  name_ar: string;
  name_en: string;
  star_rating: number;
  classification_level?: string; 
  total_price?: number;
  package_items: PackageItemDB[];
}

export type HotelUnitType = 'Single' | 'Double' | 'Twin' | 'Triple' | 'Suite' | 'Apartment';
export type FacilityType = 'Pool' | 'Gym' | 'Restaurant' | 'Meeting' | 'Prayer' | 'Kids' | 'General';
// --- استبدل واجهة UnitDefinition القديمة بهذه النسخة الموحدة ---
export type UnitTypeUnion = 
  | 'Single' | 'Double' | 'King' | 'Suite' | 'Studio'  // أنواع المستشار الفندقي الجديد
  | 'Twin' | 'Triple' | 'Apartment' | 'Villa';         // أنواع قديمة للموقع

export interface UnitDefinition {
  id: string;
  name: string;
  
  // وحدنا النوع هنا ليعمل مع الاثنين (استخدمنا type بدلاً من unitType)
  type: UnitTypeUnion; 
  
  quantity: number;

  // جعلنا هذه الخصائص اختيارية (?) لكي لا يحدث خطأ في المستشار الفندقي الذي لا يحتاجها
  bedrooms?: number; 
  bathrooms?: number;
  hasLivingRoom?: boolean;
  hasDining?: boolean;
  kitchenType?: 'None' | 'Minibar' | 'Kitchenette' | 'Full';
  
  // خاصية للتوافق العكسي (إذا كان الكود القديم يطلب unitType)
  unitType?: UnitTypeUnion; 
}

// --- أضف هذا القسم الجديد (Logic Types) ---

// 1. خيارات المرافق (Checkboxes)
export type SelectedFacilities = {
  hasPool: boolean;
  hasGym: boolean;
  hasRestaurant: boolean;
  hasMeeting: boolean;
  hasKidsArea: boolean;
};

// 2. تنظيم مجموعات عرض السعر (مهم جداً للنتيجة النهائية)
export interface BOQGroup {
  title: string;
  totalCost: number;
  items: BOQItem[];
  mandatoryMet: number;
  totalMandatory: number;
}

// Updated for Smart BOQ Engine
// تحديث BOQItem
export interface BOQItem {
  id?: number; // جعلناه اختياري
  sku: string;
  name_ar: string;
  name_en?: string; // اختياري
  
  unitPrice: number;
  qty: number;
  totalPrice: number;
  
  // خصائص جديدة
  isMandatory: boolean; 
  category: string;     
  notes?: string;       
  criterion_number?: number;

  // خصائص قديمة (اتركها للتوافق)
  boq_group?: string;
  isCompliant?: boolean;
  complianceDetail?: string;
  optionLabel?: 'Value' | 'Med' | 'VIP';
  image_url?: string;
}

// تحديث HotelProposal (أضف groups)
export interface HotelProposal {
  totalEstimated: number;
  totalKeys: number;
  groups: BOQGroup[]; // <--- هذا هو السطر الأهم الذي كان ناقصاً
  breakdown: BOQItem[];
}

// ... (Keep other existing interfaces like OrderData, etc. if needed for other pages)
export interface OrderData {
  id: string;
  type: string;
  status: string;
  client: string;
  email?: string;
  phone?: string;
  date: string;
  amount?: string;
  driveFolderUrl?: string;
  details?: any;
  location?: string;
  budget?: string;
  scope?: string;
  style?: string;
  colors?: string;
  areaSize?: string;
  projectType?: string;
  items?: any[];
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  url: string;
  size?: number;
  date?: string;
}

export interface OrderLog {
  orderId: string;
  timestamp: string;
  user: string;
  type: 'Note' | 'File' | 'Delete';
  content: string;
}

export interface Task {
  id: number;
  assigned_to: string;
  title: string;
  is_completed: boolean;
  is_critical: boolean;
  points_value: number;
  due_date?: string;
}

export interface InventoryItem {
  id: number;
  item_name: string;
  type: 'machine' | 'material';
  status: 'active' | 'warning' | 'stopped' | 'ok' | 'low';
  quantity: number;
  threshold: number;
  next_service_date?: string;
  unit?: string;
}

export interface BookingPayload {
  name: string;
  phone: string;
  email: string;
  service: string;
  date: string;
  time: string;
  reason: string;
  timestamp: string;
}

export interface DesignRequestPayload {
  lang: string;
  referralSource: string;
  salesCode: string;
  fullName: string;
  phone: string;
  email: string;
  location: string;
  projectName: string;
  propertyType: string;
  area: string;
  scope: string;
  style: string;
  colors: string;
  prefColors: string;
  dislikes: string;
  budget: string;
  notes: string;
  images: any[];
}

export interface FurnitureQuotePayload {
  lang: string;
  type: 'Furniture Request';
  client: { name: string; phone: string; email: string; source: string; };
  project: any;
  files: { name: string; base64: string }[];
}

export interface FeasibilityPayload {
  type: 'feasibility';
  location: string;
  budget: any; 
  areaSize: any;
  projectType: string;
  contactName: string;
  contactEmail: string;
  timestamp?: string;
}

export interface FurnitureItem {
  id: string;
  name: string;
  quantity: number;
  specs: string;
  imageBase64: string | null;
}

export interface ClientOrder {
  id: string;
  type: string;
  status: string;
  date: string;
  details: string;
}