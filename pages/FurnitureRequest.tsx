
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { submitFurnitureQuote, fileToBase64 } from '../services/apiService';
import { 
  Building, Home, Check, ChevronLeft, ChevronRight, 
  Plus, Trash2, Upload, Loader2, Sparkles, Sofa, 
  Lamp, Scissors, Ruler, Hotel, AlertCircle, Camera, Users, Gift, AlertTriangle, Coffee,
  DoorOpen, LayoutDashboard, Monitor, Briefcase, UserPlus, Phone, MapPin, Search, Youtube, Facebook, Instagram, Tv, Shirt
} from 'lucide-react';

// ==========================================
// 1. TYPES & INTERFACES
// ==========================================

type ProjectCategory = 'residential' | 'commercial';

interface RoomConfig {
  id: string;
  type: string;
  count: number;
  area: string;
  
  // A. Woodworks (النجارة)
  hasWood: boolean;
  woodType: string;
  // Bedroom Specifics
  wardrobeType: 'Hinged' | 'Sliding';
  wardrobeFacade: 'Wood' | 'Mirror' | 'Glass';
  headboardType: 'Plain' | 'Upholstered' | 'CNC';

  // B. Seating Zone
  needsSeatingZone: boolean; 
  sofaType?: 'L-Shape' | 'Separate Set' | 'Armchairs';
  hasSofa: boolean;
  hasArmchair: boolean;
  hasCoffeeTable: boolean;
  
  // C. Functional (Mixed)
  hasStudyDesk: boolean;       
  hasTVUnit: boolean;          
  hasEntranceConsole: boolean; 
  hasDresser: boolean;         
  hasLockers: boolean;         

  // D. Furnishing
  hasFurnishing: boolean;
  furnishLevel: string;
  hasCurtains: boolean;
  curtainType: string;
  curtainMeters: string;

  // E. Finishes
  hasFlooring: boolean;
  flooringTypes: string[]; 
  hasCladding: boolean;
  claddingType: 'WPC' | 'Wood' | 'Upholstered' | 'Mirror';
  claddingMeters: string;

  // F. Decor (New)
  hasDecor: boolean;
  hasChandelier: boolean;
  chandelierSize: 'Small' | 'Medium' | 'Large' | 'Custom'; 
  chandelierMeters: string; 
  hasArt: boolean;
  artType: 'Canvas' | 'Oil' | 'Custom';
  artMeters: string;
  
  // G. Amenities (Restored)
  hasAmenities: boolean;
  selectedAmenities: string[];
}

// ==========================================
// 2. CONSTANTS & LISTS
// ==========================================

const RES_ROOMS = ['Master Bedroom', 'General Bedroom', 'Kids Bedroom', 'Home Office', 'Living Room', 'Majlis', 'Entrance', 'Dining Room', 'Kitchen'];
const COM_ROOMS = ['Single Room', 'Double Room', 'Executive Suite', 'Reception', 'Lobby Waiting', 'Restaurant', 'Meeting Room', 'Gym'];

// Flattened Referral Sources
const FLAT_SOURCES = [
  { val: 'Google Search', label_ar: 'بحث جوجل', label_en: 'Google Search', icon: Search },
  { val: 'Google Maps', label_ar: 'خرائط جوجل', label_en: 'Google Maps', icon: MapPin },
  { val: 'TikTok', label_ar: 'تيك توك', label_en: 'TikTok', icon: Phone },
  { val: 'Instagram', label_ar: 'انستجرام', label_en: 'Instagram', icon: Camera },
  { val: 'Snapchat', label_ar: 'سناب شات', label_en: 'Snapchat', icon: Phone },
  { val: 'Twitter', label_ar: 'تويتر (X)', label_en: 'Twitter (X)', icon: Phone },
  { val: 'Facebook', label_ar: 'فيسبوك', label_en: 'Facebook', icon: Facebook },
  { val: 'YouTube', label_ar: 'يوتيوب', label_en: 'YouTube', icon: Youtube },
  { val: 'Sales Representative', label_ar: 'مندوب مبيعات', label_en: 'Sales Rep', icon: Briefcase },
  { val: 'Friend', label_ar: 'ترشيح من صديق', label_en: 'Friend Referral', icon: UserPlus },
];

const WOOD_TYPES = [
  { value: 'Melamine_National', label: 'ميلامين وطني (National Melamine)' },
  { value: 'Melamine_Thai', label: 'ميلامين تايلاندي (Thai Melamine)' },
  { value: 'Chipboard_Thai', label: 'شيبورد تايلاندي (Thai Chipboard)' },
  { value: 'Chipboard_Spanish', label: 'شيبورد إسباني (Spanish Chipboard)' },
  { value: 'Chipboard_German', label: 'شيبورد ألماني (Egger Germany)' },
];

const WARDROBE_MECHS = [
  { value: 'Hinged', label_ar: 'مفصلي (Dolf)', label_en: 'Hinged' },
  { value: 'Sliding', label_ar: 'سحاب (Sliding)', label_en: 'Sliding' }
];

const WARDROBE_FACES = [
  { value: 'Wood', label_ar: 'واجهة خشب', label_en: 'Wood Face' },
  { value: 'Mirror', label_ar: 'واجهة مرايا', label_en: 'Mirror Face' },
  { value: 'Glass', label_ar: 'واجهة زجاج', label_en: 'Glass Face' }
];

const HEADBOARD_STYLES = [
  { value: 'Plain', label_ar: 'خشب سادة (مودرن)', label_en: 'Plain Wood' },
  { value: 'Upholstered', label_ar: 'منجد (قماش/جلد)', label_en: 'Upholstered' },
  { value: 'CNC', label_ar: 'حفر زخرفي (CNC)', label_en: 'CNC Pattern' }
];

const CLADDING_MATS = [
  { value: 'WPC', label_ar: 'بديل خشب/رخام', label_en: 'WPC / PVC' },
  { value: 'Wood', label_ar: 'خشب طبيعي/قشرة', label_en: 'Natural Wood' },
  { value: 'Upholstered', label_ar: 'تنجيد جداري', label_en: 'Upholstered Panel' },
  { value: 'Mirror', label_ar: 'مرايا ديكورية', label_en: 'Decorative Mirror' }
];

const QUALITY_LEVELS = ['Economic', 'Medium', 'High', 'VIP'];
const CURTAIN_TYPES = ['Blackout', 'Sheer', 'Both'];
const FLOORING_OPTS = ['Parquet', 'Carpet', 'Rugs', 'Vinyl'];

// Full Hospitality Amenities List
const AMENITY_LIST = [
  'Ironing Board', 'Steam Iron', 'Electric Kettle', 'Welcome Tray',
  'Turkish Coffee Machine', 'Espresso Machine', 'Saudi Dallah (Electric)',
  'Bathroom Set', 'Waste Bins', 'Coat Hangers', 'Safe Box', 
  'Minibar', 'Hair Dryer', 'Slippers', 'Luggage Rack'
];

const CHANDELIER_SIZES = ['Small', 'Medium', 'Large', 'Custom'];
const ART_TYPES = ['Canvas', 'Oil', 'Custom'];

// Translations
const UI_LABELS: Record<string, string> = {
  // Rooms
  'Master Bedroom': 'غرفة نوم رئيسية',
  'General Bedroom': 'غرفة نوم عامة',
  'Kids Bedroom': 'غرفة أطفال',
  'Home Office': 'مكتب منزلي',
  'Office': 'مكتب',
  'Living Room': 'غرفة معيشة',
  'Majlis': 'مجلس',
  'Entrance': 'مدخل',
  'Dining Room': 'غرفة طعام',
  'Kitchen': 'مطبخ',
  'Single Room': 'غرفة مفردة (فندق)',
  'Double Room': 'غرفة مزدوجة (فندق)',
  'Executive Suite': 'جناح تنفيذي',
  'Reception': 'استقبال',
  'Lobby Waiting': 'انتظار اللوبي',
  'Restaurant': 'مطعم',
  'Meeting Room': 'غرفة اجتماعات',
  'Gym': 'نادي رياضي',
  
  // General
  'Economic': 'اقتصادي', 'Medium': 'متوسط', 'High': 'عالي', 'VIP': 'فاخر',
  'Blackout': 'تعتيم', 'Sheer': 'شيفون', 'Both': 'طبقتين',
  'Parquet': 'باركيه', 'Carpet': 'موكيت', 'Rugs': 'سجاد', 'Vinyl': 'فينيل',
  
  // Decor
  'Small': 'صغير (60سم)', 'Large': 'كبير (200سم)', 'Custom': 'تفصيل (بالمتر)',
  'Canvas': 'طباعة كانفاس', 'Oil': 'رسم زيتي',
  
  // Amenities
  'Ironing Board': 'طاولة كوي',
  'Steam Iron': 'مكواة بخار',
  'Electric Kettle': 'غلاية كهربائية',
  'Welcome Tray': 'صينية ضيافة',
  'Turkish Coffee Machine': 'ماكينة قهوة تركية',
  'Espresso Machine': 'ماكينة اسبريسو',
  'Saudi Dallah (Electric)': 'دلة قهوة سعودية',
  'Bathroom Set': 'طقم حمام (موزع..)',
  'Waste Bins': 'سلات مهملات',
  'Coat Hangers': 'علاقات ملابس',
  'Safe Box': 'خزنة أمان',
  'Minibar': 'ثلاجة ميني بار',
  'Hair Dryer': 'مجفف شعر',
  'Slippers': 'خف (Slippers)',
  'Luggage Rack': 'حامل حقائب'
};

// ==========================================
// 3. LOGIC HELPERS
// ==========================================

const getInitialRoomState = (type: string, category: ProjectCategory): RoomConfig => {
  const isBedroom = type.includes('Bedroom') || type.includes('Room') || type.includes('Suite');
  const isLiving = type.includes('Living') || type.includes('Majlis') || type.includes('Lobby') || type.includes('Reception');
  const isOffice = type.includes('Office') || type.includes('Meeting');
  const isEntrance = type.includes('Entrance');
  const isGym = type.includes('Gym');
  const isKids = type.includes('Kids');

  return {
    id: Date.now().toString() + Math.random(),
    type,
    count: 1,
    area: '',

    // Smart Wood Logic
    hasWood: isBedroom || isKids || isEntrance || isOffice, 
    woodType: '',
    wardrobeType: 'Hinged', wardrobeFacade: 'Wood', headboardType: 'Upholstered',

    // Smart Seating Logic
    needsSeatingZone: isLiving, // Automatically true for Living areas
    sofaType: isLiving ? 'Separate Set' : undefined,
    hasSofa: isLiving, 
    hasArmchair: false, 
    hasCoffeeTable: isLiving,

    // Smart Functional Logic
    hasStudyDesk: isOffice, // Mandatory for Office
    hasTVUnit: isLiving, // Default true for Living
    hasEntranceConsole: isEntrance, // Mandatory for Entrance
    hasDresser: isBedroom && !isKids, 
    hasLockers: isGym,

    // Furnishing
    hasFurnishing: isBedroom || isLiving,
    furnishLevel: '',
    hasCurtains: true, 
    curtainType: 'Blackout', curtainMeters: '',

    // Finishes
    hasFlooring: false, flooringTypes: [],
    hasCladding: false, claddingType: 'WPC', claddingMeters: '',

    // Finishes
    hasDecor: isLiving || isEntrance || isBedroom, 
    hasChandelier: false, chandelierSize: 'Medium', chandelierMeters: '',
    hasArt: false, artType: 'Canvas', artMeters: '',

    // Amenities
    hasAmenities: category === 'commercial' || isBedroom || isLiving, 
    selectedAmenities: []
  };
};

const SectionHeader = ({ title, icon: Icon, checked, onToggle, locked = false }: any) => (
  <div onClick={locked ? undefined : onToggle} className={`flex items-center justify-between p-3 rounded-t-lg transition-colors ${checked ? 'bg-ukra-navy text-white' : 'bg-gray-100 text-gray-500'} ${!locked && 'cursor-pointer'}`}>
    <div className="flex items-center gap-2 font-bold"><Icon className="w-5 h-5" /><span>{title}</span></div>
    <div className={`w-5 h-5 rounded border flex items-center justify-center ${checked ? 'bg-ukra-gold border-ukra-gold text-ukra-navy' : 'bg-white border-gray-300'}`}>
      {checked && <Check className="w-3 h-3" />}
    </div>
  </div>
);

// ==========================================
// 4. COMPONENT
// ==========================================

export const FurnitureRequest = () => {
  const { t, dir, lang } = useLanguage();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Client State
  const [client, setClient] = useState({ 
    name: '', phone: '', email: '', 
    source: '', salesCode: '', friendPhone: '', 
    projectName: '' 
  });
  
  const [category, setCategory] = useState<ProjectCategory>('residential');
  const [rooms, setRooms] = useState<RoomConfig[]>([]);
  const [images, setImages] = useState<{ name: string; base64: string }[]>([]);
  const [notes, setNotes] = useState('');

  // Helpers
  const tr = (val: string) => (lang === 'ar' ? (UI_LABELS[val] || val) : val);
  
  // Categorization Checks
  const isBedroom = (type: string) => ['Bedroom', 'Room', 'Suite'].some(k => type.includes(k));
  const isKidsRoom = (type: string) => type.includes('Kids');
  const isLivingArea = (type: string) => ['Living', 'Majlis', 'Reception', 'Lobby'].some(k => type.includes(k));
  const isOfficeArea = (type: string) => type.includes('Office') || type.includes('Meeting');
  const isEntrance = (type: string) => type.includes('Entrance');
  const isGym = (type: string) => type.includes('Gym');

  const addRoom = () => {
    const type = category === 'residential' ? RES_ROOMS[0] : COM_ROOMS[0];
    setRooms([...rooms, getInitialRoomState(type, category)]);
  };

  const updateRoom = (id: string, updates: Partial<RoomConfig>) => {
    setRooms(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const removeRoom = (id: string) => setRooms(prev => prev.filter(r => r.id !== id));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const base64Full = await fileToBase64(file);
        const base64 = base64Full.split(',')[1];
        setImages(prev => [...prev, { name: file.name, base64 }]);
      } catch (err) { console.error(err); }
    }
  };

  const validateStep = () => {
    if (currentStep === 1) {
      if (!client.name || !client.phone) return alert(lang==='ar'?"الاسم والجوال مطلوبان":"Name & Phone required");
      if (client.source === 'Sales Representative' && !client.salesCode) return alert(lang==='ar'?"الرجاء إدخال كود المندوب":"Sales Code required");
      if (client.source === 'Friend' && !client.friendPhone) return alert(lang==='ar'?"الرجاء إدخال جوال الصديق":"Friend Phone required");
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (rooms.length === 0) return alert(lang==='ar'?"أضف غرفة واحدة على الأقل":"Add at least 1 room");
      for(let r of rooms) {
          if(!r.area) return alert(lang==='ar'?`أدخل مساحة ${tr(r.type)}`:`Enter area for ${r.type}`);
      }
      setCurrentStep(3);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Mapping for Backend
    const ROOM_MAPPING: Record<string, string> = {
      'Master Bedroom': 'Bedroom', 'General Bedroom': 'Bedroom', 'Kids Bedroom': 'Kids Bedroom', 'Home Office': 'Office',
      'Living Room': 'Living Room', 'Majlis': 'Majlis', 'Entrance': 'Entrance', 'Dining Room': 'Dining Room',
      'Single Room': 'Single Room', 'Double Room': 'Double Room', 'Executive Suite': 'Double Room',
      'Reception': 'Reception', 'Lobby Waiting': 'Reception', 'Restaurant': 'Restaurant', 'Gym': 'Gym'
    };

    const payload = {
      action: 'submit_furniture',
      type: 'Furniture Request',
      lang: lang,
      client: client,
      project: {
        category: category,
        type: category === 'residential' ? 'Residential Unit' : 'Commercial Project',
        name: category === 'commercial' ? client.projectName : `${client.name} - ${category}`,
        notes: notes,
        packages: ['Furniture'], 
        details: JSON.stringify(rooms.map(r => ({
          type: ROOM_MAPPING[r.type] || r.type,
          uiType: r.type,
          count: r.count,
          area: r.area,
          options: { ...r }
        })))
      },
      files: images
    };

    const result = await submitFurnitureQuote(payload as any);
    setIsSubmitting(false);
    if (result) setSuccess(true);
    else alert("Error submitting request.");
  };

  if (success) {
    return (
      <div className="min-h-screen bg-ukra-navy flex items-center justify-center p-4" dir={dir}>
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-lg text-center animate-in zoom-in">
          <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-ukra-navy">{t('alert_success_title')}</h2>
          <p className="text-gray-600 mb-6">{lang==='ar'?'سيقوم فريقنا الهندسي بدراسة التفاصيل وإرسال عرض السعر قريباً.':'Our team will review details and send the quote shortly.'}</p>
          <button onClick={() => window.location.reload()} className="btn-main w-full">{t('btn_new_req')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20 px-4 font-cairo" dir={dir}>
      <div className="max-w-5xl mx-auto">
        
        {/* Header Progress */}
        <div className="mb-8 text-center">
           <h1 className="text-3xl font-bold text-ukra-navy">{lang==='ar'?'استمارة التوريد الهندسية':'Engineering Furnishing Form'}</h1>
           <div className="flex justify-center gap-2 mt-4">
              {[1, 2, 3].map(step => (
                 <div key={step} className={`h-2 w-12 rounded-full transition-all duration-500 ${currentStep >= step ? 'bg-ukra-gold w-16' : 'bg-gray-200'}`} />
              ))}
           </div>
           <p className="text-sm text-gray-500 mt-2 font-bold">
             {currentStep === 1 ? (lang==='ar'?'بيانات العميل':'Client Info') : currentStep === 2 ? (lang==='ar'?'توزيع المساحات':'Room Config') : (lang==='ar'?'المراجعة':'Review')}
           </p>
        </div>

        {/* STEP 1: CLIENT DETAILED INFO */}
        {currentStep === 1 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4">
             
             {/* 1.1 Personal Data */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="label-std">{t('furn_lbl_name')} <span className="text-red-500">*</span></label>
                  <input value={client.name} onChange={e => setClient({...client, name: e.target.value})} className="input-std" />
                </div>
                <div>
                  <label className="label-std">{t('auth_phone')} <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input value={client.phone} onChange={e => setClient({...client, phone: e.target.value})} className="input-std pl-10" dir="ltr" />
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="label-std">{t('auth_email')}</label>
                  <input value={client.email} onChange={e => setClient({...client, email: e.target.value})} className="input-std" dir="ltr" />
                </div>
             </div>

             {/* 1.2 Referral Logic (Flattened) */}
             <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 mb-8">
                <h3 className="text-sm font-bold text-ukra-navy mb-4 flex items-center gap-2"><Users className="w-4 h-4"/> {lang==='ar'?'كيف تعرفت علينا؟':'How did you hear about us?'}</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                   {FLAT_SOURCES.map((src) => (
                      <div 
                        key={src.val}
                        onClick={() => setClient({...client, source: src.val, salesCode: '', friendPhone: ''})}
                        className={`cursor-pointer p-3 rounded-lg border text-center transition-all ${client.source === src.val ? 'bg-ukra-navy text-white border-ukra-navy shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                      >
                         <src.icon className={`w-5 h-5 mx-auto mb-1 ${client.source === src.val ? 'text-ukra-gold' : 'text-gray-400'}`} />
                         <span className="text-xs font-bold">{lang==='ar' ? src.label_ar : src.label_en}</span>
                      </div>
                   ))}
                </div>

                {/* Conditional Inputs */}
                {client.source === 'Sales Representative' && (
                  <div className="mt-4 animate-in fade-in">
                     <label className="label-std text-xs mb-1">{lang==='ar'?'كود المندوب':'Sales Code'}</label>
                     <input value={client.salesCode} onChange={e => setClient({...client, salesCode: e.target.value})} className="input-std border-ukra-gold bg-yellow-50" placeholder="Ex: SA-102" />
                  </div>
                )}

                {client.source === 'Friend' && (
                  <div className="mt-4 animate-in fade-in">
                     <label className="label-std text-xs mb-1">{lang==='ar'?'جوال الصديق':'Friend Phone'}</label>
                     <input value={client.friendPhone} onChange={e => setClient({...client, friendPhone: e.target.value})} className="input-std border-green-500 bg-green-50" placeholder="05xxxxxxxx" />
                  </div>
                )}
             </div>

             {/* 1.3 Project Type Selector */}
             <div className="grid grid-cols-2 gap-4">
                <div onClick={() => setCategory('residential')} className={`cursor-pointer p-6 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${category === 'residential' ? 'border-ukra-gold bg-yellow-50 shadow-md' : 'border-gray-100 hover:border-gray-300'}`}>
                   <Home className={`w-8 h-8 ${category==='residential'?'text-ukra-gold':'text-gray-300'}`} />
                   <span className={`font-bold ${category==='residential'?'text-ukra-navy':'text-gray-400'}`}>{lang==='ar'?'سكني (فيلا/شقة)':'Residential'}</span>
                </div>
                <div onClick={() => setCategory('commercial')} className={`cursor-pointer p-6 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${category === 'commercial' ? 'border-ukra-gold bg-yellow-50 shadow-md' : 'border-gray-100 hover:border-gray-300'}`}>
                   <Building className={`w-8 h-8 ${category==='commercial'?'text-ukra-gold':'text-gray-300'}`} />
                   <span className={`font-bold ${category==='commercial'?'text-ukra-navy':'text-gray-400'}`}>{lang==='ar'?'تجاري (فندق/مطعم)':'Commercial'}</span>
                </div>
             </div>

             {category === 'commercial' && (
                <div className="mt-6 animate-in slide-in-from-top-2">
                   <label className="label-std">{lang==='ar'?'اسم المشروع التجاري':'Project Name'}</label>
                   <input value={client.projectName} onChange={e => setClient({...client, projectName: e.target.value})} className="input-std" />
                </div>
             )}
          </div>
        )}

        {/* STEP 2: GRANULAR ROOM LOGIC */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in">
             <div className="flex justify-between items-center sticky top-20 z-10 bg-gray-50/95 backdrop-blur py-2">
                <h2 className="text-xl font-bold text-ukra-navy">{lang==='ar'?'توزيع المساحات':'Space Config'}</h2>
                <button onClick={addRoom} className="btn-main flex items-center gap-2 px-4 py-2 text-sm shadow-lg hover:shadow-xl"><Plus className="w-4 h-4"/> {lang==='ar'?'إضافة فراغ':'Add Room'}</button>
             </div>

             {rooms.map((room, index) => (
                <div key={room.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative transition-all hover:shadow-md">
                   <button onClick={() => removeRoom(room.id)} className="absolute top-4 left-4 z-10 text-gray-300 hover:text-red-500 transition-colors p-1"><Trash2 className="w-5 h-5"/></button>

                   {/* Room Header */}
                   <div className="bg-gray-50 p-4 border-b grid grid-cols-1 md:grid-cols-12 gap-4 items-end pr-12">
                      <div className="md:col-span-1 flex items-center justify-center font-bold text-gray-300 text-lg">#{index + 1}</div>
                      <div className="md:col-span-5">
                         <label className="text-xs font-bold text-gray-500 mb-1 block">{lang==='ar'?'نوع الفراغ':'Room Type'}</label>
                         <select 
                            value={room.type} 
                            onChange={e => {
                               const newConfig = getInitialRoomState(e.target.value, category);
                               updateRoom(room.id, { ...newConfig, id: room.id, area: room.area, count: room.count }); 
                            }} 
                            className="input-std font-bold text-ukra-navy"
                         >
                            {(category === 'residential' ? RES_ROOMS : COM_ROOMS).map(t => <option key={t} value={t}>{tr(t)}</option>)}
                         </select>
                      </div>
                      <div className="md:col-span-3">
                         <label className="text-xs font-bold text-gray-500 mb-1 block">{lang==='ar'?'العدد':'Qty'}</label>
                         <input type="number" min="1" value={room.count} onChange={e => updateRoom(room.id, { count: parseInt(e.target.value) })} className="input-std h-10 text-center" />
                      </div>
                      <div className="md:col-span-3">
                         <label className="text-xs font-bold text-gray-500 mb-1 block">{lang==='ar'?'المساحة (م٢)':'Area'}</label>
                         <input type="number" value={room.area} onChange={e => updateRoom(room.id, { area: e.target.value })} className="input-std h-10 text-center border-ukra-gold" placeholder="25"/>
                      </div>
                   </div>

                   {/* Room Details Grid */}
                   <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                      
                      {/* SECTION 1: WOODWORKS (Smart Logic) */}
                      <div className="border rounded-xl border-gray-100 shadow-sm">
                         <SectionHeader title={lang==='ar'?'أعمال النجارة (دواليب، أسرة، مكاتب)':'Woodworks'} icon={DoorOpen} checked={room.hasWood} onToggle={() => updateRoom(room.id, { hasWood: !room.hasWood })} />
                         {room.hasWood && (
                            <div className="p-5 space-y-5 bg-yellow-50/20">
                               <div>
                                  <label className="label-std text-xs">{lang==='ar'?'نوع الخشب الأساسي للمشروع':'Base Wood Material'}</label>
                                  <select value={room.woodType} onChange={e => updateRoom(room.id, { woodType: e.target.value })} className="input-std bg-white">
                                     <option value="">{t('opt_select')}</option>
                                     {WOOD_TYPES.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
                                  </select>
                               </div>

                               {isBedroom(room.type) && (
                                  <div className="animate-in fade-in space-y-4">
                                     <div className="p-4 bg-white rounded border border-yellow-100">
                                        <div className="text-sm font-bold text-ukra-navy mb-3 flex items-center gap-2"><Scissors className="w-4 h-4"/> {lang==='ar'?'تخصيص الدواليب (أساسي)':'Wardrobes (Standard)'}</div>
                                        <div className="grid grid-cols-2 gap-3">
                                           <div>
                                              <label className="text-[10px] text-gray-500 font-bold block mb-1">آلية الفتح</label>
                                              <select value={room.wardrobeType} onChange={e => updateRoom(room.id, { wardrobeType: e.target.value as any })} className="input-std text-sm h-9">
                                                 {WARDROBE_MECHS.map(m => <option key={m.value} value={m.value}>{lang==='ar'?m.label_ar:m.label_en}</option>)}
                                              </select>
                                           </div>
                                           <div>
                                              <label className="text-[10px] text-gray-500 font-bold block mb-1">نوع الواجهة</label>
                                              <select value={room.wardrobeFacade} onChange={e => updateRoom(room.id, { wardrobeFacade: e.target.value as any })} className="input-std text-sm h-9">
                                                 {WARDROBE_FACES.map(f => <option key={f.value} value={f.value}>{lang==='ar'?f.label_ar:f.label_en}</option>)}
                                              </select>
                                           </div>
                                        </div>
                                     </div>

                                     {!isKidsRoom(room.type) && (
                                        <div className="p-4 bg-white rounded border border-yellow-100">
                                           <div className="text-sm font-bold text-ukra-navy mb-3 flex items-center gap-2"><LayoutDashboard className="w-4 h-4"/> {lang==='ar'?'نوع ظهر السرير':'Headboard'}</div>
                                           <select value={room.headboardType} onChange={e => updateRoom(room.id, { headboardType: e.target.value as any })} className="input-std text-sm">
                                              {HEADBOARD_STYLES.map(s => <option key={s.value} value={s.value}>{lang==='ar'?s.label_ar:s.label_en}</option>)}
                                           </select>
                                        </div>
                                     )}
                                  </div>
                               )}

                               <div className="grid grid-cols-2 gap-3 pt-2">
                                  {/* TV Unit (Option everywhere) */}
                                  <label className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${room.hasTVUnit ? 'bg-ukra-navy text-white border-ukra-navy' : 'bg-white hover:bg-gray-50'}`}>
                                     <input type="checkbox" className="hidden" checked={room.hasTVUnit} onChange={e => updateRoom(room.id, { hasTVUnit: e.target.checked })} />
                                     <span className="text-xs font-bold">{lang==='ar'?'وحدة تلفزيون':'TV Unit'}</span>
                                     {room.hasTVUnit && <Check className="w-3 h-3 ml-auto"/>}
                                  </label>

                                  {/* Desk: Mandatory in Office, Optional in Bedroom/Kids */}
                                  {isOfficeArea(room.type) ? (
                                     <div className="flex items-center gap-2 p-2 rounded border bg-gray-200 cursor-not-allowed">
                                        <span className="text-xs font-bold text-gray-500">{lang==='ar'?'مكتب عمل (أساسي)':'Desk (Standard)'}</span>
                                        <Check className="w-3 h-3 ml-auto text-gray-500"/>
                                     </div>
                                  ) : (
                                     <label className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${room.hasStudyDesk ? 'bg-ukra-navy text-white border-ukra-navy' : 'bg-white hover:bg-gray-50'}`}>
                                        <input type="checkbox" className="hidden" checked={room.hasStudyDesk} onChange={e => updateRoom(room.id, { hasStudyDesk: e.target.checked })} />
                                        <span className="text-xs font-bold">{lang==='ar'?'مكتب عمل/دراسة':'Desk'}</span>
                                        {room.hasStudyDesk && <Check className="w-3 h-3 ml-auto"/>}
                                     </label>
                                  )}

                                  {isEntrance(room.type) && (
                                     <label className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${room.hasEntranceConsole ? 'bg-ukra-navy text-white border-ukra-navy' : 'bg-white hover:bg-gray-50'}`}>
                                        <input type="checkbox" className="hidden" checked={room.hasEntranceConsole} onChange={e => updateRoom(room.id, { hasEntranceConsole: e.target.checked })} />
                                        <span className="text-xs font-bold">{lang==='ar'?'كونسول مدخل':'Console'}</span>
                                        {room.hasEntranceConsole && <Check className="w-3 h-3 ml-auto"/>}
                                     </label>
                                  )}
                                   {isBedroom(room.type) && !isKidsRoom(room.type) && (
                                     <div className="flex items-center gap-2 p-2 rounded border bg-gray-200 cursor-not-allowed">
                                        <span className="text-xs font-bold text-gray-500">{lang==='ar'?'تسريحة (أساسي)':'Dresser (Standard)'}</span>
                                        <Check className="w-3 h-3 ml-auto text-gray-500"/>
                                     </div>
                                  )}
                               </div>
                            </div>
                         )}
                      </div>

                      {/* SECTION 2: SEATING ZONE (Smart Logic) */}
                      <div className="border rounded-xl border-gray-100 shadow-sm">
                         <SectionHeader 
                            title={lang==='ar'?'منطقة الجلوس والكنب':'Seating Zone'} 
                            icon={Sofa} 
                            checked={room.needsSeatingZone} 
                            // Lock toggle for Living Rooms (it's mandatory)
                            locked={isLivingArea(room.type)}
                            onToggle={() => updateRoom(room.id, { needsSeatingZone: !room.needsSeatingZone })} 
                         />
                         
                         {room.needsSeatingZone && (
                            <div className="p-5 space-y-4">
                               {isLivingArea(room.type) ? (
                                  <div className="animate-in fade-in">
                                     <p className="text-xs text-gray-500 mb-3">{lang==='ar'?'تجهيز أساسي، اختر النوع:':'Standard setup, select type:'}</p>
                                     <div className="grid grid-cols-2 gap-3">
                                        <div onClick={() => updateRoom(room.id, { sofaType: 'L-Shape' })} className={`p-3 rounded border cursor-pointer text-center ${room.sofaType === 'L-Shape' ? 'bg-ukra-navy text-white' : 'hover:bg-gray-50'}`}>
                                           <div className="text-xs font-bold">{lang==='ar'?'كنب زاوية (L)':'L-Shape'}</div>
                                        </div>
                                        <div onClick={() => updateRoom(room.id, { sofaType: 'Separate Set' })} className={`p-3 rounded border cursor-pointer text-center ${room.sofaType === 'Separate Set' ? 'bg-ukra-navy text-white' : 'hover:bg-gray-50'}`}>
                                           <div className="text-xs font-bold">{lang==='ar'?'طقم منفصل':'Separate Set'}</div>
                                        </div>
                                     </div>
                                  </div>
                               ) : (
                                  <div className="animate-in fade-in space-y-3">
                                      <p className="text-xs text-gray-500 mb-2">{lang==='ar'?'إضافة اختيارية:':'Optional Add-on:'}</p>
                                      <label className="flex items-center gap-2 p-2 rounded border bg-gray-50 cursor-pointer">
                                         <input type="checkbox" checked={room.hasArmchair} onChange={e => updateRoom(room.id, { hasArmchair: e.target.checked })} />
                                         <span className="text-xs font-bold">{lang==='ar'?'كرسي مفرد (Armchair)':'Armchair'}</span>
                                      </label>
                                      <label className="flex items-center gap-2 p-2 rounded border bg-gray-50 cursor-pointer">
                                         <input type="checkbox" checked={room.hasSofa} onChange={e => updateRoom(room.id, { hasSofa: e.target.checked })} />
                                         <span className="text-xs font-bold">{lang==='ar'?'كنب ثنائي/ثلاثي':'Sofa'}</span>
                                      </label>
                                  </div>
                               )}
                            </div>
                         )}
                      </div>

                      {/* SECTION 3: DECOR (New) */}
                      <div className="border rounded-xl border-gray-100 shadow-sm">
                         <SectionHeader title={lang==='ar'?'الديكور والإضاءة':'Decor & Lighting'} icon={Lamp} checked={room.hasDecor} onToggle={() => updateRoom(room.id, { hasDecor: !room.hasDecor })} />
                         {room.hasDecor && (
                            <div className="p-5 space-y-5">
                               {/* Chandeliers */}
                               <div>
                                  <label className="flex items-center gap-2 mb-2 font-bold text-sm text-ukra-navy">
                                     <input type="checkbox" checked={room.hasChandelier} onChange={e => updateRoom(room.id, { hasChandelier: e.target.checked })} /> 
                                     {lang==='ar'?'ثريا / نجف':'Chandelier'}
                                  </label>
                                  {room.hasChandelier && (
                                     <div className="flex gap-2 animate-in fade-in">
                                        <select value={room.chandelierSize} onChange={e => updateRoom(room.id, { chandelierSize: e.target.value as any })} className="input-std text-xs h-9 flex-grow">
                                           {CHANDELIER_SIZES.map(s => <option key={s} value={s}>{tr(s)}</option>)}
                                        </select>
                                        {room.chandelierSize === 'Custom' && (
                                           <input type="number" placeholder="m" value={room.chandelierMeters} onChange={e => updateRoom(room.id, { chandelierMeters: e.target.value })} className="input-std text-xs h-9 w-20 text-center"/>
                                        )}
                                     </div>
                                  )}
                               </div>

                               {/* Artworks */}
                               <div className="border-t pt-3">
                                  <label className="flex items-center gap-2 mb-2 font-bold text-sm text-ukra-navy">
                                     <input type="checkbox" checked={room.hasArt} onChange={e => updateRoom(room.id, { hasArt: e.target.checked })} /> 
                                     {lang==='ar'?'لوحات فنية':'Artworks'}
                                  </label>
                                  {room.hasArt && (
                                     <div className="flex gap-2 animate-in fade-in">
                                        <select value={room.artType} onChange={e => updateRoom(room.id, { artType: e.target.value as any })} className="input-std text-xs h-9 flex-grow">
                                           {ART_TYPES.map(t => <option key={t} value={t}>{tr(t)}</option>)}
                                        </select>
                                        <input type="number" placeholder="m²" value={room.artMeters} onChange={e => updateRoom(room.id, { artMeters: e.target.value })} className="input-std text-xs h-9 w-20 text-center"/>
                                     </div>
                                  )}
                               </div>
                            </div>
                         )}
                      </div>

                      {/* SECTION 4: AMENITIES (Restored & Smart) */}
                      <div className="border rounded-xl border-gray-100 shadow-sm">
                         <SectionHeader title={lang==='ar'?'مستلزمات الضيافة (Amenities)':'Amenities'} icon={Coffee} checked={room.hasAmenities} onToggle={() => updateRoom(room.id, { hasAmenities: !room.hasAmenities })} />
                         {room.hasAmenities && (
                            <div className="p-5">
                               <div className="flex flex-wrap gap-2">
                                  {AMENITY_LIST.map(item => {
                                     // Logic: Highlight if standard
                                     const isStandard = (item === 'Safe Box' && isBedroom(room.type));
                                     return (
                                       <label key={item} className={`px-3 py-2 rounded border cursor-pointer text-xs font-bold transition flex items-center gap-2 ${room.selectedAmenities.includes(item) || isStandard ? 'bg-ukra-navy text-white border-ukra-navy' : 'bg-white text-gray-600 hover:border-ukra-gold'}`}>
                                          <input 
                                             type="checkbox" 
                                             className="hidden" 
                                             checked={room.selectedAmenities.includes(item) || isStandard} 
                                             onChange={() => {
                                                if (isStandard) return; // Cannot uncheck standard items
                                                const curr = room.selectedAmenities;
                                                updateRoom(room.id, { selectedAmenities: curr.includes(item) ? curr.filter(x => x !== item) : [...curr, item] });
                                             }} 
                                          />
                                          {tr(item)}
                                          {isStandard && <Check className="w-3 h-3"/>}
                                       </label>
                                     );
                                  })}
                               </div>
                            </div>
                         )}
                      </div>

                      {/* SECTION 5: FURNISHING (Standard) */}
                      <div className="border rounded-xl border-gray-100 shadow-sm">
                         <SectionHeader title={lang==='ar'?'المفروشات والستائر':'Furnishing'} icon={Scissors} checked={room.hasFurnishing} onToggle={() => updateRoom(room.id, { hasFurnishing: !room.hasFurnishing })} />
                         {room.hasFurnishing && (
                            <div className="p-5 space-y-5">
                               {isBedroom(room.type) && (
                                  <div>
                                     <label className="text-xs font-bold block mb-1 text-gray-600">{lang==='ar'?'مستوى المراتب والبياضات':'Bedding Level'}</label>
                                     <div className="flex rounded border overflow-hidden">
                                        {QUALITY_LEVELS.map(l => (
                                           <div key={l} onClick={() => updateRoom(room.id, { furnishLevel: l })} className={`flex-1 text-center py-2 text-xs cursor-pointer transition-colors ${room.furnishLevel === l ? 'bg-ukra-navy text-white' : 'hover:bg-gray-100'}`}>
                                              {tr(l).split(' ')[0]}
                                           </div>
                                        ))}
                                     </div>
                                  </div>
                               )}

                               <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                  <label className="flex items-center gap-2 mb-3 font-bold text-sm text-ukra-navy border-b pb-2">
                                     <input type="checkbox" checked={room.hasCurtains} onChange={e => updateRoom(room.id, { hasCurtains: e.target.checked })} /> 
                                     {lang==='ar'?'الستائر (Curtains)':'Curtains'}
                                  </label>
                                  {room.hasCurtains && (
                                     <div className="grid grid-cols-3 gap-2 animate-in fade-in">
                                        <div className="col-span-2">
                                           <label className="text-[10px] text-gray-500 font-bold block mb-1">النوع</label>
                                           <select value={room.curtainType} onChange={e => updateRoom(room.id, { curtainType: e.target.value })} className="input-std text-xs h-9">
                                              {CURTAIN_TYPES.map(t => <option key={t} value={t}>{tr(t)}</option>)}
                                           </select>
                                        </div>
                                        <div>
                                           <label className="text-[10px] text-gray-500 font-bold block mb-1">الأمتار</label>
                                           <input type="number" placeholder="m" value={room.curtainMeters} onChange={e => updateRoom(room.id, { curtainMeters: e.target.value })} className="input-std text-xs h-9 text-center"/>
                                        </div>
                                     </div>
                                  )}
                               </div>
                            </div>
                         )}
                      </div>

                   </div>
                </div>
             ))}
          </div>
        )}

        {/* STEP 3: REVIEW & SUBMIT */}
        {currentStep === 3 && (
           <div className="bg-white rounded-2xl shadow-lg p-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="text-center mb-8">
                 <Sparkles className="w-12 h-12 text-ukra-gold mx-auto mb-3" />
                 <h2 className="text-2xl font-bold text-ukra-navy">{lang==='ar'?'المراجعة والاعتماد':'Review & Submit'}</h2>
                 <p className="text-gray-500 text-sm">يرجى مراجعة البيانات قبل الإرسال النهائي</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 
                 {/* Project Summary */}
                 <div className="md:col-span-2 space-y-6">
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                       <h3 className="font-bold text-ukra-navy mb-4 flex items-center gap-2 border-b pb-2">
                          <Users className="w-4 h-4"/> ملخص العميل
                       </h3>
                       <div className="grid grid-cols-2 gap-4 text-sm">
                          <div><span className="text-gray-500 block text-xs">الاسم</span><span className="font-bold">{client.name}</span></div>
                          <div><span className="text-gray-500 block text-xs">الجوال</span><span className="font-bold" dir="ltr">{client.phone}</span></div>
                          <div><span className="text-gray-500 block text-xs">المصدر</span><span className="font-bold">{tr(client.source)}</span></div>
                          <div><span className="text-gray-500 block text-xs">نوع المشروع</span><span className="font-bold">{category === 'residential' ? 'سكني' : 'تجاري'}</span></div>
                       </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                       <h3 className="font-bold text-ukra-navy mb-4 flex items-center gap-2 border-b pb-2">
                          <Home className="w-4 h-4"/> ملخص الغرف ({rooms.length})
                       </h3>
                       <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                          {rooms.map((r, i) => (
                             <div key={i} className="flex justify-between items-center bg-white p-3 rounded border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3">
                                   <div className="bg-ukra-navy text-white text-xs w-6 h-6 flex items-center justify-center rounded-full font-bold">{i+1}</div>
                                   <div>
                                      <div className="font-bold text-sm text-ukra-navy">{tr(r.type)}</div>
                                      <div className="text-xs text-gray-500 flex gap-2">
                                         {r.hasWood && <span>نجارة</span>}
                                         {r.needsSeatingZone && <span>جلسة</span>}
                                         {r.hasDecor && <span>ديكور</span>}
                                      </div>
                                   </div>
                                </div>
                                <div className="text-right">
                                   <div className="font-bold text-sm">{r.area} م²</div>
                                   <div className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">x{r.count}</div>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>

                 {/* Attachments & Notes */}
                 <div className="space-y-6">
                    <div>
                       <label className="label-std flex items-center gap-2 mb-2">
                          <Camera className="w-4 h-4"/> {lang==='ar'?'المخططات والصور':'Attachments'}
                       </label>
                       <div className="grid grid-cols-3 gap-2">
                          {images.map((img, i) => (
                             <div key={i} className="relative aspect-square rounded border overflow-hidden group">
                                <img src={`data:image/png;base64,${img.base64}`} className="w-full h-full object-cover"/>
                                <button onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3"/></button>
                             </div>
                          ))}
                          <label className="aspect-square border-2 border-dashed border-gray-300 rounded hover:bg-gray-50 hover:border-ukra-gold cursor-pointer flex flex-col items-center justify-center transition-colors">
                             <Upload className="w-6 h-6 text-gray-400 mb-1"/>
                             <span className="text-[10px] text-gray-500 font-bold">{lang==='ar'?'رفع ملف':'Upload'}</span>
                             <input type="file" multiple className="hidden" onChange={handleImageUpload} accept="image/*" />
                          </label>
                       </div>
                    </div>

                    <div>
                       <label className="label-std mb-2">{lang==='ar'?'ملاحظات إضافية':'Notes'}</label>
                       <textarea className="input-std h-32 resize-none" placeholder="..." value={notes} onChange={e => setNotes(e.target.value)} />
                    </div>
                 </div>

              </div>
           </div>
        )}

        {/* Footer Navigation */}
        <div className="mt-8 flex justify-between items-center bg-white p-4 rounded-xl shadow border border-gray-100 sticky bottom-4 z-20">
           <div>
              {currentStep > 1 && (
                 <button onClick={() => setCurrentStep(curr => curr - 1)} className="px-6 py-2.5 rounded-lg font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center gap-2">
                    {dir==='rtl' ? <ChevronRight className="w-4 h-4"/> : <ChevronLeft className="w-4 h-4"/>} {lang==='ar'?'رجوع':'Back'}
                 </button>
              )}
           </div>
           <div>
              {currentStep < 3 ? (
                 <button onClick={validateStep} className="btn-main px-8 py-2.5 flex items-center gap-3 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                    {lang==='ar'?'التالي':'Next'} {dir==='rtl' ? <ChevronLeft className="w-5 h-5"/> : <ChevronRight className="w-5 h-5"/>}
                 </button>
              ) : (
                 <button onClick={handleSubmit} disabled={isSubmitting} className={`px-8 py-3 rounded-lg font-bold text-white flex items-center gap-3 shadow-lg transition-all ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : <Check className="w-5 h-5"/>} {lang==='ar'?'إرسال الطلب':'Submit'}
                 </button>
              )}
           </div>
        </div>

      </div>
    </div>
  );
};
