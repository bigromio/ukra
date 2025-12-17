
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { submitFurnitureQuote, fileToBase64 } from '../services/apiService';
import { 
  Building, Home, Check, ChevronLeft, ChevronRight, 
  Plus, Trash2, Upload, Loader2, Sparkles, Sofa, 
  Lamp, Scissors, Ruler, Hotel, AlertCircle, Camera, Users, Gift, AlertTriangle, Coffee
} from 'lucide-react';

// --- Types ---

type ProjectCategory = 'residential' | 'commercial';

interface RoomConfig {
  id: string;
  type: string;
  count: number;
  area: string;
  
  // A. Wood
  hasWood: boolean;
  woodType: string;
  hasSofa: boolean; // Generic Sofa/Seating
  hasCoffeeTable: boolean; // Combined with Sofa usually
  hasLockers: boolean; // For Gym/Showroom
  
  // New Specific Options
  hasStudyDesk: boolean; // Kids Room
  hasTVUnit: boolean; // Living/Majlis
  hasDisplayCabinet: boolean; // Living/Majlis
  hasEntranceStorage: boolean; // Entrance

  // B. Furnishing
  hasFurnishing: boolean;
  furnishLevel: string;
  hasCurtains: boolean;
  curtainType: string;
  curtainMeters: string;

  // C. Flooring & Cladding
  hasFlooring: boolean;
  flooringTypes: string[]; // ['Parquet', 'Carpet', 'Rugs']
  hasCladding: boolean;
  claddingMeters: string;

  // D. Decor & Lighting
  hasDecor: boolean;
  decorLevel: string;
  
  hasChandelier: boolean;
  chandelierSize: string; // 'Small' | 'Medium' | 'Large' | 'Custom'
  chandelierMeters: string; // If custom
  
  hasArt: boolean;
  artSize: string; // 'Small' | 'Medium' | 'Large' | 'Custom'
  artMeters: string; // If custom

  // E. Amenities (Commercial)
  hasAmenities: boolean;
  selectedAmenities: string[];
}

// --- Constants & Translations ---

const RES_ROOMS = ['Master Bedroom', 'General Bedroom', 'Kids Room', 'Office', 'Living Room', 'Majlis', 'Entrance', 'Outdoor Area'];
const COM_ROOMS = ['Single Room (1 Nightstand)', 'Queen Room (2 Nightstands)', 'Master Suite', 'Reception', 'Lobby Waiting', 'Restaurant', 'Cafe', 'Showroom', 'Gym'];

const WOOD_TYPES = [
  { value: 'Melamine_National', label: 'Melamine National' },
  { value: 'Melamine_Thai', label: 'Melamine Thai' },
  { value: 'Chipboard_Thai', label: 'Chipboard Thai' },
  { value: 'Chipboard_Spanish', label: 'Chipboard Spanish' },
  { value: 'Chipboard_German', label: 'Chipboard German (Egger)' },
];

const QUALITY_LEVELS = ['Economic', 'Medium', 'High', 'VIP'];
const CURTAIN_TYPES = ['Blackout', 'Sheer', 'Both'];
const FLOORING_OPTS = ['Parquet', 'Carpet (Moket)', 'Rugs'];

// UPDATED: Added new Amenities
const AMENITY_LIST = [
  'Kettle', 'Tray', 'Iron', 'Hangers', 'Safe', 'Hair Dryer',
  'Turkish Coffee Machine', 'Espresso Machine', 'Electric Arabic Coffee Dallah', 'Bathroom Set', 'Waste Bins'
];

const REFERRAL_SOURCES = ['Google Search', 'Google Maps', 'TikTok', 'Snapchat', 'Instagram', 'Facebook', 'YouTube', 'Sales Representative', 'Friend'];
const ITEM_SIZES = ['Small', 'Medium', 'Large', 'Custom'];

// Translation Dictionary
const UI_LABELS: Record<string, string> = {
  // Rooms
  'Master Bedroom': 'غرفة نوم رئيسية',
  'General Bedroom': 'غرفة نوم عامة',
  'Kids Room': 'غرفة أطفال',
  'Office': 'مكتب منزلي',
  'Living Room': 'غرفة معيشة',
  'Majlis': 'مجلس',
  'Entrance': 'مدخل',
  'Outdoor Area': 'منطقة خارجية',
  'Single Room (1 Nightstand)': 'غرفة مفردة (كومودينة واحدة)',
  'Queen Room (2 Nightstands)': 'غرفة مزدوجة (٢ كومودينة)',
  'Master Suite': 'جناح رئيسي',
  'Reception': 'استقبال',
  'Lobby Waiting': 'انتظار اللوبي',
  'Restaurant': 'مطعم',
  'Cafe': 'مقهى',
  'Showroom': 'معرض تجاري',
  'Gym': 'نادي رياضي',
  
  // Wood
  'Melamine_National': 'ميلامين وطني',
  'Melamine_Thai': 'ميلامين تايلاندي',
  'Chipboard_Thai': 'شيبورد تايلاندي',
  'Chipboard_Spanish': 'شيبورد إسباني',
  'Chipboard_German': 'شيبورد ألماني (Egger)',
  
  // Quality
  'Economic': 'اقتصادي',
  'Medium': 'متوسط',
  'High': 'عالي',
  'VIP': 'فاخر',
  
  // Curtains
  'Blackout': 'تعتيم (Blackout)',
  'Sheer': 'شيفون (Sheer)',
  'Both': 'طبقتين (Both)',
  
  // Flooring
  'Parquet': 'باركيه',
  'Carpet (Moket)': 'موكيت',
  'Rugs': 'سجاد قطع',
  
  // Amenities (UPDATED)
  'Kettle': 'غلاية',
  'Tray': 'صينية ضيافة',
  'Iron': 'مكواة',
  'Hangers': 'علاقات ملابس',
  'Safe': 'خزنة',
  'Hair Dryer': 'مجفف شعر',
  'Turkish Coffee Machine': 'ماكينة قهوة تركية',
  'Espresso Machine': 'ماكينة قهوة شاملة',
  'Electric Arabic Coffee Dallah': 'دلة قهوة عربية كهربائية',
  'Bathroom Set': 'طقم حمام',
  'Waste Bins': 'سلات مهملات',
  
  // Sizes
  'Small': 'صغير',
  'Large': 'كبير',
  'Custom': 'تفصيل (بالمتر)',

  // Sources
  'Google Search': 'بحث جوجل',
  'Google Maps': 'خرائط جوجل',
  'TikTok': 'تيك توك',
  'Snapchat': 'سناب شات',
  'Instagram': 'انستجرام',
  'Facebook': 'فيسبوك',
  'YouTube': 'يوتيوب',
  'Sales Representative': 'مندوب مبيعات',
  'Friend': 'صديق'
};

// --- Helper Components ---

const SectionHeader = ({ title, icon: Icon, checked, onToggle, lang }: any) => (
  <div 
    onClick={onToggle}
    className={`flex items-center justify-between p-3 rounded-t-lg cursor-pointer transition-colors ${checked ? 'bg-ukra-navy text-white' : 'bg-gray-100 text-gray-500'}`}
  >
    <div className="flex items-center gap-2 font-bold">
      <Icon className="w-5 h-5" />
      <span>{title}</span>
    </div>
    <div className={`w-5 h-5 rounded border flex items-center justify-center ${checked ? 'bg-ukra-gold border-ukra-gold text-ukra-navy' : 'bg-white border-gray-300'}`}>
      {checked && <Check className="w-3 h-3" />}
    </div>
  </div>
);

export const FurnitureRequest = () => {
  const { t, dir, lang } = useLanguage();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // --- Global State ---
  const [client, setClient] = useState({ 
    name: '', 
    phone: '', 
    email: '', 
    source: '', 
    salesCode: '',
    friendPhone: '',
    projectName: '' // New for Commercial
  });
  
  const [category, setCategory] = useState<ProjectCategory>('residential');
  const [rooms, setRooms] = useState<RoomConfig[]>([]);
  const [images, setImages] = useState<{ name: string; base64: string }[]>([]);
  const [notes, setNotes] = useState('');

  // --- Logic ---

  // Helper to translate any value
  const tr = (val: string) => (lang === 'ar' ? (UI_LABELS[val] || val) : val);

  const addRoom = () => {
    const newRoom: RoomConfig = {
      id: Date.now().toString(),
      type: category === 'residential' ? RES_ROOMS[0] : COM_ROOMS[0],
      count: 1,
      area: '',
      hasWood: false, woodType: '', 
      hasSofa: false, hasCoffeeTable: false, hasLockers: false,
      hasStudyDesk: false, hasTVUnit: false, hasDisplayCabinet: false, hasEntranceStorage: false,
      
      hasFurnishing: false, furnishLevel: '', hasCurtains: false, curtainType: '', curtainMeters: '',
      hasFlooring: false, flooringTypes: [], hasCladding: false, claddingMeters: '',
      hasDecor: false, decorLevel: '', 
      hasChandelier: false, chandelierSize: '', chandelierMeters: '', 
      hasArt: false, artSize: '', artMeters: '',
      hasAmenities: false, selectedAmenities: []
    };
    setRooms([...rooms, newRoom]);
  };

  const updateRoom = (id: string, updates: Partial<RoomConfig>) => {
    setRooms(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const removeRoom = (id: string) => {
    setRooms(prev => prev.filter(r => r.id !== id));
  };

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

  // --- Smart Visibility Functions ---

  const isSleeping = (r: RoomConfig) => ['Bedroom', 'Room', 'Suite', 'Kids'].some(k => r.type.includes(k)) && !r.type.includes('Living');

  const getVisibleAmenities = (type: string) => {
    // 1. Full Amenities (Sleep Areas)
    if (['Master Bedroom', 'General Bedroom', 'Single Room', 'Queen Room', 'Master Suite', 'Suite', 'Guest Room'].some(k => type.includes(k))) {
      return AMENITY_LIST;
    }
    
    // 2. Hospitality/Coffee Areas (Living, Majlis, Office, Cafe, Reception)
    if (['Living Room', 'Majlis', 'Office', 'Reception', 'Lobby', 'Cafe', 'Restaurant'].some(k => type.includes(k))) {
      return AMENITY_LIST.filter(a => 
        ['Kettle', 'Tray', 'Turkish Coffee Machine', 'Espresso Machine', 'Electric Arabic Coffee Dallah', 'Waste Bins'].includes(a)
      );
    }

    // 3. Functional Areas (Gym, Entrance, Showroom)
    return AMENITY_LIST.filter(a => ['Waste Bins'].includes(a));
  };

  // --- Validation ---
  const validateStep = () => {
    if (currentStep === 1) {
      if (!client.name || !client.phone) return alert(lang === 'ar' ? "الرجاء إدخال الاسم ورقم الجوال" : "Name and Phone are required");
      if (!client.source) return alert(lang === 'ar' ? "الرجاء اختيار مصدر المعرفة" : "Please select referral source");
      
      if (category === 'commercial' && !client.projectName) {
        return alert(lang === 'ar' ? "اسم المشروع التجاري إجباري" : "Commercial Project Name is mandatory");
      }

      if (client.source === 'Sales Representative' && !client.salesCode) {
        return alert(lang === 'ar' ? "الرجاء إدخال كود المندوب" : "Sales Code is mandatory");
      }

      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (rooms.length === 0) return alert(lang === 'ar' ? "الرجاء إضافة مساحة واحدة على الأقل" : "Add at least one space");
      
      for (const r of rooms) {
        const rName = tr(r.type);
        if (!r.area) return alert(lang === 'ar' ? `الرجاء تحديد المساحة لـ ${rName}` : `Area required for ${rName}`);
        
        if (r.hasWood && !r.woodType) return alert(lang === 'ar' ? `اختر نوع الخشب لـ ${rName}` : `Select wood type for ${rName}`);
        
        if (r.hasFurnishing && !r.furnishLevel && isSleeping(r)) return alert(lang === 'ar' ? `اختر مستوى التأثيث لـ ${rName}` : `Select furnishing level for ${rName}`);
        if (r.hasCurtains && !r.curtainMeters) return alert(lang === 'ar' ? `حدد أمتار الستائر لـ ${rName}` : `Enter curtain meters for ${rName}`);
        
        if (r.hasFlooring && r.flooringTypes.length === 0 && !r.hasCladding) return alert(lang === 'ar' ? `اختر نوع الأرضية أو التكسيات لـ ${rName}` : `Select flooring or cladding for ${rName}`);
        
        if (r.hasDecor) {
           if (!r.decorLevel) return alert(lang === 'ar' ? `اختر مستوى الديكور لـ ${rName}` : `Select decor level for ${rName}`);
           if (r.hasChandelier && !r.chandelierSize) return alert(lang === 'ar' ? `اختر مقاس الثريا لـ ${rName}` : `Select chandelier size for ${rName}`);
           if (r.hasChandelier && r.chandelierSize === 'Custom' && !r.chandelierMeters) return alert(lang === 'ar' ? `حدد مقاس الثريا بالمتر لـ ${rName}` : `Enter chandelier custom size for ${rName}`);
           if (r.hasArt && !r.artSize) return alert(lang === 'ar' ? `اختر مقاس اللوحات لـ ${rName}` : `Select artwork size for ${rName}`);
        }
      }
      
      setCurrentStep(3);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const packagesSet = new Set<string>();
    rooms.forEach(r => {
      if (r.hasWood) packagesSet.add('Furniture');
      if (r.hasFurnishing) packagesSet.add('Furnishing');
      if (r.hasFlooring || r.hasCladding) packagesSet.add('Flooring/Cladding');
      if (r.hasDecor) packagesSet.add('Decor');
      if (r.hasAmenities) packagesSet.add('Amenities');
    });

    const payload = {
      action: 'submit_furniture',
      type: 'Furniture Request',
      lang: lang,
      client: {
        name: client.name,
        phone: client.phone,
        email: client.email,
        source: client.source,
        salesCode: client.salesCode,
        friendPhone: client.friendPhone 
      },
      project: {
        category: category,
        type: category === 'residential' ? 'Residential Unit' : 'Commercial Project',
        name: category === 'commercial' ? client.projectName : `${client.name} - ${category}`,
        woodType: 'Mixed', 
        level: 'Mixed',
        style: 'Modern', 
        notes: notes,
        packages: Array.from(packagesSet),
        details: JSON.stringify(rooms.map(r => ({
          type: r.type,
          count: r.count,
          area: r.area,
          options: {
            hasWood: r.hasWood, woodType: r.woodType, 
            hasSofa: r.hasSofa, hasCoffeeTable: r.hasCoffeeTable, hasLockers: r.hasLockers,
            hasStudyDesk: r.hasStudyDesk, hasTVUnit: r.hasTVUnit, hasDisplayCabinet: r.hasDisplayCabinet, hasEntranceStorage: r.hasEntranceStorage,
            
            hasFurnishing: r.hasFurnishing, furnishLevel: r.furnishLevel, curtainType: r.curtainType, curtainMeters: r.curtainMeters,
            hasFlooring: r.hasFlooring, flooringTypes: r.flooringTypes, hasCladding: r.hasCladding, claddingMeters: r.claddingMeters,
            hasDecor: r.hasDecor, decorLevel: r.decorLevel, 
            chandelierSize: r.chandelierSize, chandelierMeters: r.chandelierMeters,
            artSize: r.artSize, artMeters: r.artMeters,
            hasAmenities: r.hasAmenities, selectedAmenities: r.selectedAmenities
          }
        })))
      },
      files: images
    };

    const result = await submitFurnitureQuote(payload as any);
    setIsSubmitting(false);
    if (result) setSuccess(true);
    else alert("Error submitting request.");
  };

  // --- Render ---

  if (success) {
    return (
      <div className="min-h-screen bg-ukra-navy flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-lg text-center animate-in zoom-in">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
             <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('alert_success_title')}</h2>
          <p className="text-gray-600 mb-6">{lang==='ar' ? 'تم استلام تفاصيل الغرف والمواصفات بنجاح.' : 'Room configurations received successfully.'}</p>
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
           <h1 className="text-3xl font-bold text-ukra-navy">{lang==='ar'?'استمارة التوريد المفصلة':'Detailed Furnishing Form'}</h1>
           <div className="flex items-center justify-center gap-2 mt-4">
              {[1, 2, 3].map((step) => (
                 <div key={step} className={`h-2 w-12 rounded-full transition-colors ${currentStep >= step ? 'bg-ukra-gold' : 'bg-gray-200'}`} />
              ))}
           </div>
        </div>

        {/* Step 1: Client & Type */}
        {currentStep === 1 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 animate-in fade-in slide-in-from-right">
             <h2 className="text-xl font-bold text-ukra-navy mb-6">1. {lang==='ar'?'بيانات المشروع':'Project Details'}</h2>
             
             {/* Client */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                   <label className="label-std">{t('furn_lbl_name')}</label>
                   <input value={client.name} onChange={e => setClient({...client, name: e.target.value})} className="input-std" />
                </div>
                <div>
                   <label className="label-std">{t('auth_phone')}</label>
                   <input value={client.phone} onChange={e => setClient({...client, phone: e.target.value})} className="input-std" dir="ltr" />
                </div>
                <div className="md:col-span-2">
                   <label className="label-std">{t('auth_email')}</label>
                   <input value={client.email} onChange={e => setClient({...client, email: e.target.value})} className="input-std" dir="ltr" />
                </div>
                
                {/* Source Selection with Logic */}
                <div className="md:col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-200">
                   <label className="label-std">{t('furn_lbl_source')}</label>
                   <select 
                     value={client.source} 
                     onChange={e => setClient({...client, source: e.target.value, salesCode: '', friendPhone: ''})} 
                     className="input-std bg-white mb-2"
                   >
                      <option value="">{t('opt_select')}</option>
                      {REFERRAL_SOURCES.map(src => (
                         <option key={src} value={src}>{tr(src)}</option>
                      ))}
                   </select>

                   {/* Conditional Logic: Sales Rep */}
                   {client.source === 'Sales Representative' && (
                      <div className="animate-in slide-in-from-top-2 bg-white p-3 rounded border border-ukra-gold">
                         <label className="label-std text-ukra-navy flex items-center gap-2">
                            <Users className="w-4 h-4" /> 
                            {lang==='ar'?'كود المندوب (إجباري)':'Sales Code (Mandatory)'}
                         </label>
                         <input 
                           value={client.salesCode} 
                           onChange={e => setClient({...client, salesCode: e.target.value})} 
                           className="input-std" 
                           placeholder="Ex: UK-105"
                         />
                      </div>
                   )}

                   {/* Conditional Logic: Friend */}
                   {client.source === 'Friend' && (
                      <div className="animate-in slide-in-from-top-2 bg-white p-3 rounded border border-green-200">
                         <label className="label-std text-green-700 flex items-center gap-2">
                            <Gift className="w-4 h-4" /> 
                            {lang==='ar'?'رقم جوال الصديق (للحصول على خصم)':'Friend Phone (For Discount)'}
                         </label>
                         <input 
                           value={client.friendPhone} 
                           onChange={e => setClient({...client, friendPhone: e.target.value})} 
                           className="input-std" 
                           placeholder="05xxxxxxxx"
                           dir="ltr"
                         />
                      </div>
                   )}
                </div>
             </div>

             {/* Type Selector */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div onClick={() => setCategory('residential')} className={`cursor-pointer p-6 rounded-xl border-2 flex flex-col items-center gap-3 transition ${category === 'residential' ? 'border-ukra-gold bg-yellow-50/50' : 'border-gray-200'}`}>
                   <Home className={`w-12 h-12 ${category === 'residential' ? 'text-ukra-gold' : 'text-gray-400'}`} />
                   <span className="font-bold text-lg">{lang==='ar'?'مشروع سكني':'Residential'}</span>
                </div>
                <div onClick={() => setCategory('commercial')} className={`cursor-pointer p-6 rounded-xl border-2 flex flex-col items-center gap-3 transition ${category === 'commercial' ? 'border-ukra-gold bg-yellow-50/50' : 'border-gray-200'}`}>
                   <Building className={`w-12 h-12 ${category === 'commercial' ? 'text-ukra-gold' : 'text-gray-400'}`} />
                   <span className="font-bold text-lg">{lang==='ar'?'مشروع تجاري':'Commercial'}</span>
                </div>
             </div>

             {/* Commercial Project Name */}
             {category === 'commercial' && (
                <div className="mt-6 animate-in slide-in-from-top-2">
                   <label className="label-std">{lang==='ar'?'اسم المشروع التجاري (إجباري)':'Commercial Project Name (Mandatory)'}</label>
                   <input 
                     value={client.projectName} 
                     onChange={e => setClient({...client, projectName: e.target.value})} 
                     className="input-std font-bold border-ukra-navy"
                     placeholder={lang==='ar'?'مثال: فندق الرواسي':'Ex: Al-Rawasi Hotel'}
                   />
                </div>
             )}
          </div>
        )}

        {/* Step 2: Space Configuration */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right">
             <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-ukra-navy">2. {lang==='ar'?'تكوين المساحات':'Space Configuration'}</h2>
                <button onClick={addRoom} className="btn-main flex items-center gap-2 px-4 py-2 text-sm">
                   <Plus className="w-4 h-4" /> {lang==='ar'?'إضافة مساحة':'Add Space'}
                </button>
             </div>

             {rooms.length === 0 && (
                <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-300 text-gray-400">
                   {lang==='ar'?'ابدأ بإضافة المساحات لتحديد المواصفات':'Start by adding spaces to configure specs'}
                </div>
             )}

             {rooms.map((room, idx) => {
                const isSleepingRoom = isSleeping(room);
                const visibleAmenities = getVisibleAmenities(room.type);
                
                return (
                <div key={room.id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                   {/* Room Header */}
                   <div className="bg-gray-50 p-4 border-b flex flex-wrap md:flex-nowrap gap-4 items-end">
                      <div className="flex-grow min-w-[200px]">
                         <label className="text-xs font-bold text-gray-500 mb-1 block">{lang==='ar'?'نوع الغرفة':'Space Type'}</label>
                         <select 
                            value={room.type} 
                            onChange={(e) => updateRoom(room.id, { type: e.target.value })}
                            className="input-std h-10 font-bold text-ukra-navy"
                         >
                            {(category === 'residential' ? RES_ROOMS : COM_ROOMS).map(t => <option key={t} value={t}>{tr(t)}</option>)}
                         </select>
                      </div>
                      <div className="w-24">
                         <label className="text-xs font-bold text-gray-500 mb-1 block">{lang==='ar'?'العدد':'Count'}</label>
                         <input type="number" min="1" value={room.count} onChange={(e) => updateRoom(room.id, { count: parseInt(e.target.value) })} className="input-std h-10 text-center" />
                      </div>
                      <div className="w-32">
                         <label className="text-xs font-bold text-gray-500 mb-1 block">{lang==='ar'?'المساحة (م٢)':'Area (m²)'}</label>
                         <input type="number" placeholder="20" value={room.area} onChange={(e) => updateRoom(room.id, { area: e.target.value })} className="input-std h-10 text-center" />
                      </div>
                      <button onClick={() => removeRoom(room.id)} className="p-2 text-red-400 hover:bg-red-50 rounded">
                         <Trash2 className="w-5 h-5" />
                      </button>
                   </div>

                   <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                      
                      {/* A. Wood Section */}
                      <div className="border rounded-lg">
                         <SectionHeader 
                            title={lang==='ar'?'الأثاث الخشبي':'Wood Furniture'} 
                            icon={Sofa} 
                            checked={room.hasWood} 
                            onToggle={() => updateRoom(room.id, { hasWood: !room.hasWood })} 
                         />
                         {room.hasWood && (
                            <div className="p-4 space-y-3 animate-in slide-in-from-top-2">
                               <label className="label-std text-xs">{lang==='ar'?'نوع الخشب':'Wood Type'}</label>
                               <select value={room.woodType} onChange={(e) => updateRoom(room.id, { woodType: e.target.value })} className="input-std text-sm">
                                  <option value="">{t('opt_select')}</option>
                                  {WOOD_TYPES.map(w => <option key={w.value} value={w.value}>{tr(w.value)}</option>)}
                               </select>
                               
                               {/* --- Specific Room Options --- */}
                               
                               {/* 1. Hotel Room/Suite (Commercial) */}
                               {(room.type.includes('Room') || room.type.includes('Suite')) && !room.type.includes('Kids') && !room.type.includes('Living') && category === 'commercial' && (
                                  <label className="flex items-center gap-2 p-2 border rounded cursor-pointer bg-gray-50 mt-2">
                                     <input type="checkbox" checked={room.hasSofa} onChange={(e) => updateRoom(room.id, { hasSofa: e.target.checked, hasCoffeeTable: e.target.checked })} />
                                     <span className="text-sm font-bold">{lang==='ar'?'إضافة كراسي/كنب مع طاولات ضيافة':'Include Armchairs/Sofa with Coffee Tables'}</span>
                                  </label>
                               )}

                               {/* 2. Residential Bedrooms (Master, General) */}
                               {(room.type === 'Master Bedroom' || room.type === 'General Bedroom') && (
                                  <div className="grid grid-cols-1 gap-2 mt-2">
                                     <label className="flex items-center gap-2 p-2 border rounded cursor-pointer bg-gray-50">
                                        <input type="checkbox" checked={room.hasStudyDesk} onChange={(e) => updateRoom(room.id, { hasStudyDesk: e.target.checked })} />
                                        <span className="text-sm font-bold">{lang==='ar'?'مكتب عمل وكرسي':'Work Desk & Chair'}</span>
                                     </label>
                                     <label className="flex items-center gap-2 p-2 border rounded cursor-pointer bg-gray-50">
                                        <input type="checkbox" checked={room.hasSofa} onChange={(e) => updateRoom(room.id, { hasSofa: e.target.checked, hasCoffeeTable: e.target.checked })} />
                                        <span className="text-sm font-bold">{lang==='ar'?'منطقة جلوس مع طاولات':'Seating Area with Tables'}</span>
                                     </label>
                                     <label className="flex items-center gap-2 p-2 border rounded cursor-pointer bg-gray-50">
                                        <input type="checkbox" checked={room.hasTVUnit} onChange={(e) => updateRoom(room.id, { hasTVUnit: e.target.checked })} />
                                        <span className="text-sm font-bold">{lang==='ar'?'مكتبة تلفزيون':'TV Unit'}</span>
                                     </label>
                                  </div>
                               )}

                               {/* 3. Kids Room */}
                               {room.type.includes('Kids') && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                                     <label className="flex items-center gap-2 p-2 border rounded cursor-pointer bg-gray-50">
                                        <input type="checkbox" checked={room.hasStudyDesk} onChange={(e) => updateRoom(room.id, { hasStudyDesk: e.target.checked })} />
                                        <span className="text-sm font-bold">{lang==='ar'?'مكتب دراسي وكرسي':'Study Desk & Chair'}</span>
                                     </label>
                                     <label className="flex items-center gap-2 p-2 border rounded cursor-pointer bg-gray-50">
                                        <input type="checkbox" checked={room.hasSofa} onChange={(e) => updateRoom(room.id, { hasSofa: e.target.checked })} />
                                        <span className="text-sm font-bold">{lang==='ar'?'كنب جلوس':'Sofa Seating'}</span>
                                     </label>
                                  </div>
                               )}

                               {/* 4. Living Room / Majlis / Office */}
                               {(room.type.includes('Living') || room.type.includes('Majlis')) && (
                                  <div className="grid grid-cols-1 gap-2 mt-2">
                                     <label className="flex items-center gap-2 p-2 border rounded cursor-pointer bg-gray-50">
                                        <input type="checkbox" checked={room.hasTVUnit} onChange={(e) => updateRoom(room.id, { hasTVUnit: e.target.checked })} />
                                        <span className="text-sm font-bold">{lang==='ar'?'مكتبة تلفزيون':'TV Unit'}</span>
                                     </label>
                                     <label className="flex items-center gap-2 p-2 border rounded cursor-pointer bg-gray-50">
                                        <input type="checkbox" checked={room.hasDisplayCabinet} onChange={(e) => updateRoom(room.id, { hasDisplayCabinet: e.target.checked })} />
                                        <span className="text-sm font-bold">{lang==='ar'?'وحدة تخزين (دولاب عرض)':'Storage/Display Cabinet'}</span>
                                     </label>
                                  </div>
                               )}

                               {/* 5. Entrance */}
                               {room.type.includes('Entrance') && (
                                  <label className="flex items-center gap-2 p-2 border rounded cursor-pointer bg-gray-50 mt-2">
                                     <input type="checkbox" checked={room.hasEntranceStorage} onChange={(e) => updateRoom(room.id, { hasEntranceStorage: e.target.checked })} />
                                     <span className="text-sm font-bold">{lang==='ar'?'مساحة تخزين (كونسول/أحذية)':'Storage Space (Console)'}</span>
                                  </label>
                               )}

                               {/* 6. Gym */}
                               {room.type.includes('Gym') && (
                                  <label className="flex items-center gap-2 p-2 border rounded cursor-pointer bg-gray-50 mt-2">
                                     <input type="checkbox" checked={room.hasSofa} onChange={(e) => updateRoom(room.id, { hasSofa: e.target.checked })} />
                                     <span className="text-sm font-bold">{lang==='ar'?'إضافة مقاعد انتظار (جلد)':'Include Waiting Bench (Leather)?'}</span>
                                  </label>
                               )}

                               {/* Lockers Logic */}
                               {(room.type.includes('Gym') || room.type.includes('Showroom')) && (
                                  <label className="flex items-center gap-2 p-2 border rounded cursor-pointer bg-gray-50 mt-2">
                                     <input type="checkbox" checked={room.hasLockers} onChange={(e) => updateRoom(room.id, { hasLockers: e.target.checked })} />
                                     <span className="text-sm font-bold">{lang==='ar'?'خزائن / دواليب عرض':'Lockers / Cabinets?'}</span>
                                  </label>
                               )}
                            </div>
                         )}
                      </div>

                      {/* B. Furnishing Section */}
                      <div className="border rounded-lg">
                         <SectionHeader 
                            title={lang==='ar'?'المفروشات والستائر':'Furnishing & Curtains'} 
                            icon={Scissors} 
                            checked={room.hasFurnishing} 
                            onToggle={() => updateRoom(room.id, { hasFurnishing: !room.hasFurnishing })} 
                         />
                         {room.hasFurnishing && (
                            <div className="p-4 space-y-4 animate-in slide-in-from-top-2">
                               {/* Bedding Level - HIDDEN if not a sleeping room */}
                               {isSleepingRoom ? (
                                 <div>
                                    <label className="label-std text-xs">{lang==='ar'?'مستوى المراتب والمفروشات':'Bedding Quality Level'}</label>
                                    <div className="grid grid-cols-4 gap-1">
                                       {QUALITY_LEVELS.map(l => (
                                          <div 
                                             key={l} 
                                             onClick={() => updateRoom(room.id, { furnishLevel: l })}
                                             className={`text-center py-2 text-xs border rounded cursor-pointer ${room.furnishLevel === l ? 'bg-ukra-navy text-white border-ukra-navy' : 'hover:bg-gray-100'}`}
                                          >
                                             {tr(l)}
                                          </div>
                                       ))}
                                    </div>
                                 </div>
                               ) : (
                                 <div className="text-xs text-gray-400 italic mb-2">
                                    {lang==='ar' ? 'خيارات المراتب غير متاحة لهذا النوع من المساحات.' : 'Bedding options hidden for this space type.'}
                                 </div>
                               )}

                               {/* Curtains - Always Available */}
                               <div className="border-t pt-3">
                                  <label className="flex items-center gap-2 mb-2 cursor-pointer">
                                     <input type="checkbox" checked={room.hasCurtains} onChange={(e) => updateRoom(room.id, { hasCurtains: e.target.checked })} />
                                     <span className="font-bold text-sm text-ukra-navy">{lang==='ar'?'إضافة ستائر':'Include Curtains?'}</span>
                                  </label>
                                  {room.hasCurtains && (
                                     <div className="flex gap-2">
                                        <select value={room.curtainType} onChange={(e) => updateRoom(room.id, { curtainType: e.target.value })} className="input-std text-sm w-2/3">
                                           <option value="">{lang==='ar'?'النوع...':'Type...'}</option>
                                           {CURTAIN_TYPES.map(t => <option key={t} value={t}>{tr(t)}</option>)}
                                        </select>
                                        <input 
                                           type="number" 
                                           placeholder={lang==='ar'?'متر طولي':'Width (m)'}
                                           value={room.curtainMeters} 
                                           onChange={(e) => updateRoom(room.id, { curtainMeters: e.target.value })} 
                                           className="input-std text-sm w-1/3 text-center"
                                        />
                                     </div>
                                  )}
                               </div>
                            </div>
                         )}
                      </div>

                      {/* C. Flooring & Cladding */}
                      <div className="border rounded-lg">
                         <SectionHeader 
                            title={lang==='ar'?'الأرضيات والجدران':'Flooring & Cladding'} 
                            icon={Ruler} 
                            checked={room.hasFlooring} 
                            onToggle={() => updateRoom(room.id, { hasFlooring: !room.hasFlooring })} 
                         />
                         {room.hasFlooring && (
                            <div className="p-4 space-y-4 animate-in slide-in-from-top-2">
                               <div>
                                  <label className="label-std text-xs mb-2">{lang==='ar'?'نوع الأرضية':'Flooring Type'}</label>
                                  <div className="flex flex-wrap gap-2">
                                     {FLOORING_OPTS.map(opt => (
                                        <div 
                                           key={opt}
                                           onClick={() => {
                                              const current = room.flooringTypes;
                                              const newTypes = current.includes(opt) ? current.filter(x => x !== opt) : [...current, opt];
                                              updateRoom(room.id, { flooringTypes: newTypes });
                                           }}
                                           className={`px-3 py-1 rounded-full text-xs border cursor-pointer ${room.flooringTypes.includes(opt) ? 'bg-ukra-gold text-white border-ukra-gold' : 'bg-white'}`}
                                        >
                                           {tr(opt)}
                                        </div>
                                     ))}
                                  </div>
                               </div>

                               <div className="border-t pt-3">
                                  <label className="flex items-center gap-2 mb-2 cursor-pointer">
                                     <input type="checkbox" checked={room.hasCladding} onChange={(e) => updateRoom(room.id, { hasCladding: e.target.checked })} />
                                     <span className="font-bold text-sm text-ukra-navy">{lang==='ar'?'تكسيات جدارية (خشب/بديل)':'Wall Cladding?'}</span>
                                  </label>
                                  {room.hasCladding && (
                                     <input 
                                        type="number" 
                                        placeholder={lang==='ar'?'المساحة (م٢)':'Area (sqm)'}
                                        value={room.claddingMeters} 
                                        onChange={(e) => updateRoom(room.id, { claddingMeters: e.target.value })} 
                                        className="input-std text-sm"
                                     />
                                  )}
                               </div>
                            </div>
                         )}
                      </div>

                      {/* D. Decor & Lighting */}
                      <div className="border rounded-lg">
                         <SectionHeader 
                            title={lang==='ar'?'الإضاءة والديكور':'Decor & Lighting'} 
                            icon={Lamp} 
                            checked={room.hasDecor} 
                            onToggle={() => updateRoom(room.id, { hasDecor: !room.hasDecor })} 
                         />
                         {room.hasDecor && (
                            <div className="p-4 space-y-4 animate-in slide-in-from-top-2">
                               
                               {/* Decor Level */}
                               <div>
                                  <label className="label-std text-xs">{lang==='ar'?'مستوى الديكور':'Decor Level'}</label>
                                  <select value={room.decorLevel} onChange={(e) => updateRoom(room.id, { decorLevel: e.target.value })} className="input-std text-sm">
                                     <option value="">{t('opt_select')}</option>
                                     {QUALITY_LEVELS.map(l => <option key={l} value={l}>{tr(l)}</option>)}
                                  </select>
                               </div>

                               {/* Chandeliers */}
                               <div className="border-t pt-3">
                                  <label className="flex items-center gap-2 text-sm mb-2 font-bold text-ukra-navy">
                                     <input type="checkbox" checked={room.hasChandelier} onChange={(e) => updateRoom(room.id, { hasChandelier: e.target.checked })} />
                                     {lang==='ar'?'إضافة ثريا (نجف)':'Chandelier / Pendant'}
                                  </label>
                                  {room.hasChandelier && (
                                     <div className="grid grid-cols-2 gap-2 animate-in slide-in-from-top-1">
                                        <select 
                                          value={room.chandelierSize} 
                                          onChange={(e) => updateRoom(room.id, { chandelierSize: e.target.value })}
                                          className="input-std text-sm"
                                        >
                                           <option value="">{lang==='ar'?'المقاس...':'Size...'}</option>
                                           {ITEM_SIZES.map(s => <option key={s} value={s}>{tr(s)}</option>)}
                                        </select>
                                        
                                        {room.chandelierSize === 'Custom' && (
                                          <input 
                                            type="number"
                                            placeholder={lang==='ar'?'العرض (م)':'Width (m)'}
                                            value={room.chandelierMeters}
                                            onChange={(e) => updateRoom(room.id, { chandelierMeters: e.target.value })}
                                            className="input-std text-sm"
                                          />
                                        )}
                                     </div>
                                  )}
                                  {/* Custom Size Warning */}
                                  {room.hasChandelier && room.chandelierSize === 'Custom' && parseFloat(room.chandelierMeters) > 3 && (
                                     <div className="mt-2 text-xs text-orange-600 bg-orange-50 p-2 rounded flex items-start gap-1">
                                        <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                        {lang==='ar' 
                                          ? 'تنبيه: المقاس كبير جداً، تأكد من تناسبه مع مساحة الغرفة.'
                                          : 'Warning: Size is very large, ensure it fits room area.'}
                                     </div>
                                  )}
                               </div>
                               
                               {/* Artworks */}
                               <div className="border-t pt-3">
                                  <label className="flex items-center gap-2 text-sm mb-2 font-bold text-ukra-navy">
                                     <input type="checkbox" checked={room.hasArt} onChange={(e) => updateRoom(room.id, { hasArt: e.target.checked })} />
                                     {lang==='ar'?'لوحات فنية':'Artworks'}
                                  </label>
                                  {room.hasArt && (
                                     <div className="grid grid-cols-2 gap-2 animate-in slide-in-from-top-1">
                                        <select 
                                          value={room.artSize} 
                                          onChange={(e) => updateRoom(room.id, { artSize: e.target.value })}
                                          className="input-std text-sm"
                                        >
                                           <option value="">{lang==='ar'?'المقاس...':'Size...'}</option>
                                           {ITEM_SIZES.map(s => <option key={s} value={s}>{tr(s)}</option>)}
                                        </select>
                                        
                                        {room.artSize === 'Custom' && (
                                          <input 
                                            type="number"
                                            placeholder={lang==='ar'?'العرض (م)':'Width (m)'}
                                            value={room.artMeters}
                                            onChange={(e) => updateRoom(room.id, { artMeters: e.target.value })}
                                            className="input-std text-sm"
                                          />
                                        )}
                                     </div>
                                  )}
                               </div>

                            </div>
                         )}
                      </div>

                      {/* E. Amenities (Context Aware) */}
                      {category === 'commercial' && (
                         <div className="border rounded-lg md:col-span-2 border-blue-100 bg-blue-50/30">
                            <SectionHeader 
                               title={lang==='ar'?'مستلزمات الضيافة':'Hotel Amenities'} 
                               icon={Hotel} 
                               checked={room.hasAmenities} 
                               onToggle={() => updateRoom(room.id, { hasAmenities: !room.hasAmenities })} 
                            />
                            {room.hasAmenities && (
                               <div className="p-4 flex flex-wrap gap-3 animate-in slide-in-from-top-2">
                                  {visibleAmenities.length === 0 ? (
                                     <span className="text-sm text-gray-400 italic">No amenities available for this space type.</span>
                                  ) : visibleAmenities.map(item => (
                                     <label key={item} className="flex items-center gap-2 bg-white px-3 py-2 rounded border cursor-pointer hover:border-ukra-gold">
                                        <input 
                                           type="checkbox" 
                                           checked={room.selectedAmenities.includes(item)}
                                           onChange={() => {
                                              const current = room.selectedAmenities;
                                              const newItems = current.includes(item) ? current.filter(x => x !== item) : [...current, item];
                                              updateRoom(room.id, { selectedAmenities: newItems });
                                           }}
                                        />
                                        <span className="text-xs font-bold">{tr(item)}</span>
                                     </label>
                                  ))}
                               </div>
                            )}
                         </div>
                      )}

                   </div>
                </div>
                );
             })}
          </div>
        )}

        {/* Step 3: Review */}
        {currentStep === 3 && (
           <div className="p-8 bg-white rounded-2xl shadow-lg text-center animate-in fade-in slide-in-from-right">
              <div className="w-16 h-16 bg-ukra-navy rounded-full flex items-center justify-center mx-auto mb-6 text-ukra-gold shadow-lg">
                 <Sparkles className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-ukra-navy mb-4">{lang==='ar'?'مراجعة واعتماد':'Review & Submit'}</h2>
              
              <div className="bg-gray-50 p-6 rounded-xl text-start max-w-2xl mx-auto border border-gray-200 mb-8 space-y-4">
                 <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">{lang==='ar'?'إجمالي الغرف':'Total Rooms'}</span>
                    <span className="font-bold text-ukra-navy">{rooms.length}</span>
                 </div>
                 <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">{lang==='ar'?'نوع المشروع':'Project Type'}</span>
                    <span className="font-bold text-ukra-navy uppercase">{category === 'residential' ? (lang==='ar'?'سكني':'Residential') : (lang==='ar'?'تجاري':'Commercial')}</span>
                 </div>
                 <div className="space-y-2">
                    <p className="text-xs text-gray-400 font-bold uppercase">{lang==='ar'?'المساحات المضافة:':'Configured Spaces:'}</p>
                    {rooms.map((r, i) => (
                       <div key={i} className="text-sm flex justify-between bg-white p-2 rounded border">
                          <span>{tr(r.type)} <span className="text-xs text-gray-400">({r.area}m²)</span></span>
                          <span className="font-mono bg-gray-100 px-2 rounded">x{r.count}</span>
                       </div>
                    ))}
                 </div>
                 
                 <div className="mt-4">
                    <label className="label-std">{lang==='ar'?'ملاحظات إضافية':'Additional Notes'}</label>
                    <textarea 
                       className="input-std h-24" 
                       placeholder={lang==='ar'?'طلبات خاصة...':'Special requests...'}
                       value={notes} 
                       onChange={e => setNotes(e.target.value)}
                    />
                 </div>

                 <div className="mt-4">
                    <label className="label-std flex items-center gap-2"><Camera className="w-4 h-4"/> {lang==='ar'?'مرفقات (مخطط/صور)':'Attachments'}</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                       {images.map((img, i) => (
                          <div key={i} className="w-16 h-16 rounded overflow-hidden border"><img src={`data:image/png;base64,${img.base64}`} className="w-full h-full object-cover"/></div>
                       ))}
                       <label className="w-16 h-16 border-2 border-dashed rounded flex items-center justify-center cursor-pointer hover:bg-gray-100">
                          <Plus className="w-6 h-6 text-gray-400"/>
                          <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                       </label>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* Footer Navigation */}
        <div className="mt-8 flex justify-between">
           {currentStep > 1 && (
              <button onClick={() => setCurrentStep(curr => curr - 1)} className="px-6 py-3 rounded-lg text-gray-600 font-bold bg-white border border-gray-200 hover:bg-gray-50">
                 {lang==='ar'?'سابق':'Back'}
              </button>
           )}
           <div className="mr-auto"></div>
           {currentStep < 3 ? (
              <button onClick={validateStep} className="btn-main flex items-center gap-2">
                 {lang==='ar'?'التالي':'Next'} <ChevronRight className={`w-5 h-5 ${dir==='rtl'?'rotate-180':''}`} />
              </button>
           ) : (
              <button onClick={handleSubmit} disabled={isSubmitting} className="btn-main flex items-center gap-2">
                 {isSubmitting ? <Loader2 className="animate-spin" /> : <Check className="w-5 h-5" />}
                 {lang==='ar'?'إرسال الطلب':'Submit Request'}
              </button>
           )}
        </div>

      </div>
    </div>
  );
};
