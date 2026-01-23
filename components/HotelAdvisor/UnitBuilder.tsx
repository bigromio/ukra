import React, { useState, useEffect } from 'react';
import { 
  Building2, BedDouble, Utensils, Dumbbell, 
  Check, X, Plus, Minus, ChefHat, Sofa, 
  Users, Waves, Coffee, Briefcase, 
  Accessibility, Bath, Bed, Trash2, ShoppingBag, 
  Shirt, Droplets
} from 'lucide-react';
import { UnitDefinition } from '../../types';

interface UnitBuilderProps {
  onSave: (units: UnitDefinition[]) => void;
  onCancel: () => void;
  initialUnits?: UnitDefinition[];
  mandatoryTypes?: string[];
}

type UnitCategory = 'ACCOMMODATION' | 'PUBLIC' | 'DINING' | 'SERVICES';

interface UnitTemplate {
  type: string;
  nameAr: string;
  icon: React.ElementType;
  defaultQty: number;
  hasOptions?: boolean;
  isMandatory?: boolean;
}

// الكتالوج
const UNIT_TEMPLATES: Record<UnitCategory, UnitTemplate[]> = {
  ACCOMMODATION: [
    { type: 'Single', nameAr: 'غرفة مفردة', icon: Bed, defaultQty: 5, hasOptions: true },
    { type: 'Double', nameAr: 'غرفة مزدوجة', icon: BedDouble, defaultQty: 10, hasOptions: true },
    { type: 'Twin', nameAr: 'غرفة توأم', icon: Users, defaultQty: 5, hasOptions: true },
    { type: 'Accessible', nameAr: 'غرفة ذوي الهمم', icon: Accessibility, defaultQty: 1, hasOptions: true },
    { type: 'Suite', nameAr: 'جناح فندقي', icon: Sofa, defaultQty: 2, hasOptions: true },
    { type: 'Apartment', nameAr: 'شقة فندقية', icon: Building2, defaultQty: 1, hasOptions: true },
    { type: 'Villa', nameAr: 'فيلا خاصة', icon: Building2, defaultQty: 1, hasOptions: true },
  ],
  PUBLIC: [
    { type: 'Reception', nameAr: 'الاستقبال (Reception)', icon: Briefcase, defaultQty: 1 },
    { type: 'Lobby', nameAr: 'بهو / صالة انتظار', icon: Sofa, defaultQty: 1 },
    { type: 'PublicToilet', nameAr: 'دورات مياه عامة', icon: Bath, defaultQty: 2 },
    { type: 'PrayerRoom', nameAr: 'مصلى', icon: Users, defaultQty: 1 },
    { type: 'MeetingRoom', nameAr: 'قاعة اجتماعات', icon: Briefcase, defaultQty: 1 },
    { type: 'BusinessCenter', nameAr: 'مركز أعمال', icon: Briefcase, defaultQty: 1 },
    { type: 'Parking', nameAr: 'مواقف سيارات', icon: Building2, defaultQty: 1 },
  ],
  DINING: [
    { type: 'Restaurant', nameAr: 'مطعم رئيسي', icon: Utensils, defaultQty: 1 },
    { type: 'CoffeeShop', nameAr: 'مقهى / كوفي شوب', icon: Coffee, defaultQty: 1 },
    { type: 'Kitchen', nameAr: 'مطبخ مركزي', icon: ChefHat, defaultQty: 1 },
  ],
  SERVICES: [
    { type: 'Gym', nameAr: 'نادي صحي (Gym)', icon: Dumbbell, defaultQty: 1 },
    { type: 'Pool', nameAr: 'مسبح', icon: Waves, defaultQty: 1 },
    { type: 'Spa', nameAr: 'سبا (SPA)', icon: Droplets, defaultQty: 1 },
    { type: 'KidsArea', nameAr: 'منطقة ألعاب أطفال', icon: Users, defaultQty: 1 },
    { type: 'Laundry', nameAr: 'مغسلة مركزية', icon: Shirt, defaultQty: 1 },
  ]
};

export const UnitBuilder: React.FC<UnitBuilderProps> = ({ 
  onSave, onCancel, initialUnits = [], mandatoryTypes = [] 
}) => {
  const [activeTab, setActiveTab] = useState<UnitCategory>('ACCOMMODATION');
  // السلة تحتوي على الوحدات المختارة
  const [selectedUnits, setSelectedUnits] = useState<UnitDefinition[]>(initialUnits);
  // الوحدة النشطة حالياً في اللوحة الجانبية
  const [activeTemplateType, setActiveTemplateType] = useState<string | null>(null);

  // --- المنطق الجديد: التبديل بضغطة واحدة (Toggle) ---
  const handleToggleUnit = (template: UnitTemplate) => {
    const existingIndex = selectedUnits.findIndex(u => u.type === template.type);
    
    if (existingIndex >= 0) {
      // إذا كانت موجودة -> حذفها (إلغاء الاختيار)
      // إذا كانت هي النشطة حالياً، نغلق اللوحة الجانبية
      if (activeTemplateType === template.type) {
        setActiveTemplateType(null);
      }
      setSelectedUnits(prev => prev.filter(u => u.type !== template.type));
    } else {
      // إذا غير موجودة -> إضافتها فوراً بالقيم الافتراضية
      const newUnit: UnitDefinition = {
        id: crypto.randomUUID(),
        type: template.type as any,
        name: template.nameAr,
        quantity: template.defaultQty,
        // قيم افتراضية للخيارات
        bedrooms: template.type === 'Villa' ? 3 : 1,
        bathrooms: 1,
        hasLivingRoom: template.type === 'Suite' || template.type === 'Apartment',
        hasDining: template.type === 'Apartment',
        kitchenType: template.type === 'Apartment' ? 'Full' : (template.type === 'Suite' ? 'Kitchenette' : 'Minibar'),
      };
      
      setSelectedUnits(prev => [...prev, newUnit]);
      // تفعيلها في اللوحة الجانبية للتعديل
      setActiveTemplateType(template.type);
    }
  };

  // --- المنطق الجديد: التحديث المباشر (Live Update) ---
  // أي تغيير في السايدبار يحدث السلة فوراً
  const updateActiveUnit = (updates: Partial<UnitDefinition>) => {
    if (!activeTemplateType) return;
    
    setSelectedUnits(prev => prev.map(u => {
      if (u.type === activeTemplateType) {
        return { ...u, ...updates };
      }
      return u;
    }));
  };

  // الوحدة النشطة حالياً (للعرض في السايدبار)
  const activeUnit = selectedUnits.find(u => u.type === activeTemplateType);
  const activeTemplate = activeTemplateType 
    ? Object.values(UNIT_TEMPLATES).flat().find(t => t.type === activeTemplateType) 
    : null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 font-cairo animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-6xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col h-[90vh]">
        
        {/* Header */}
        <div className="bg-ukra-navy px-8 py-5 flex justify-between items-center text-white shrink-0">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Building2 className="w-6 h-6 text-ukra-gold" /> تكوين وحدات ومرافق الفندق
            </h2>
            <p className="text-ukra-gold text-xs opacity-80 mt-1">
              اضغط على الوحدة لإضافتها أو إزالتها. الإلزاميات مميزة بوضوح.
            </p>
          </div>
          <button onClick={onCancel} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition"><X className="w-5 h-5" /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 bg-white shrink-0 overflow-x-auto">
          {[
            { id: 'ACCOMMODATION', label: 'الغرف والأجنحة', icon: BedDouble },
            { id: 'PUBLIC', label: 'المرافق العامة', icon: Briefcase },
            { id: 'DINING', label: 'المطاعم والضيافة', icon: Utensils },
            { id: 'SERVICES', label: 'الخدمات والترفيه', icon: Waves },
          ].map((tab) => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id as UnitCategory); }} className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all whitespace-nowrap px-4 border-b-4 ${activeTab === tab.id ? 'text-ukra-navy border-ukra-navy bg-blue-50/30' : 'text-gray-400 border-transparent hover:text-gray-600 hover:bg-gray-50'}`}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex">
          {/* Catalog Grid */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50 custom-scrollbar">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {UNIT_TEMPLATES[activeTab].map((template) => {
                const inBasket = selectedUnits.some(u => u.type === template.type);
                const isSelected = activeTemplateType === template.type;
                const isMandatoryDynamic = mandatoryTypes.includes(template.type) || template.isMandatory;

                return (
                  <button 
                    key={template.type} 
                    onClick={() => handleToggleUnit(template)} 
                    className={`relative flex flex-col items-center p-4 rounded-2xl border-2 transition-all duration-200 group ${
                      // ستايل حسب الحالة: مختار؟ في السلة؟
                      isSelected 
                        ? 'border-ukra-navy bg-blue-50/50 ring-2 ring-ukra-navy/10' 
                        : (inBasket ? 'border-ukra-gold bg-white' : 'border-white bg-white hover:border-gray-200')
                    }`}
                  >
                    {/* شارة العدد */}
                    {inBasket && (
                      <span className="absolute top-2 right-2 bg-ukra-gold text-ukra-navy text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-in zoom-in">
                        مضاف
                      </span>
                    )}
                    
                    {/* شارة إلزامي */}
                    {isMandatoryDynamic && (
                      <span className={`absolute top-2 left-2 text-[9px] px-1.5 py-0.5 rounded border font-bold ${inBasket ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-100 animate-pulse'}`}>
                        {inBasket ? 'تم' : 'إلزامي'}
                      </span>
                    )}

                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                      inBasket ? 'bg-ukra-navy text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-blue-50'
                    }`}>
                      <template.icon className="w-6 h-6" />
                    </div>
                    <span className={`font-bold text-xs text-center ${inBasket ? 'text-ukra-navy' : 'text-gray-700'}`}>{template.nameAr}</span>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Config Panel (تعديل مباشر) */}
          {activeUnit && activeTemplate && (
            <div className="w-80 bg-white border-l border-gray-200 p-6 flex flex-col shadow-xl z-10 animate-in slide-in-from-left duration-300">
               <div className="flex items-center gap-3 mb-6 border-b pb-4">
                   <div className="bg-ukra-navy/10 p-2 rounded-lg text-ukra-navy"><activeTemplate.icon className="w-6 h-6" /></div>
                   <div><h3 className="font-bold text-ukra-navy text-sm">{activeTemplate.nameAr}</h3><p className="text-xs text-gray-400">تعديل الخيارات</p></div>
               </div>
               
               <div className="mb-6">
                   <label className="block text-xs font-bold text-gray-500 mb-2">العدد المطلوب</label>
                   <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl border">
                      <button onClick={() => updateActiveUnit({ quantity: Math.max(1, activeUnit.quantity - 1) })} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg hover:bg-gray-100">-</button>
                      <input 
                        type="number" 
                        value={activeUnit.quantity} 
                        onChange={(e) => updateActiveUnit({ quantity: parseInt(e.target.value) || 1 })}
                        className="flex-1 text-center font-bold bg-transparent outline-none text-ukra-navy" 
                      />
                      <button onClick={() => updateActiveUnit({ quantity: activeUnit.quantity + 1 })} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg hover:bg-gray-100">+</button>
                   </div>
               </div>

               {activeTemplate.hasOptions && (
                  <div className="space-y-4">
                     <div>
                       <label className="block text-xs font-bold text-gray-500 mb-2">تجهيزات</label>
                       <div className="grid grid-cols-2 gap-2">
                         {['Minibar', 'Kitchenette', 'Full', 'None'].map(k => (
                           <button 
                             key={k} 
                             onClick={() => updateActiveUnit({ kitchenType: k as any })} 
                             className={`text-[10px] py-2 px-1 rounded border font-bold transition-all ${activeUnit.kitchenType === k ? 'bg-ukra-navy text-white border-ukra-navy' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                           >
                             {k === 'Minibar' ? 'ميني بار' : k === 'Kitchenette' ? 'ركن قهوة' : k === 'Full' ? 'مطبخ كامل' : 'لا يوجد'}
                           </button>
                         ))}
                       </div>
                     </div>
                     <label className="flex items-center gap-2 cursor-pointer p-2 border rounded-lg hover:bg-gray-50">
                        <input 
                          type="checkbox" 
                          checked={activeUnit.hasLivingRoom} 
                          onChange={e => updateActiveUnit({ hasLivingRoom: e.target.checked })} 
                          className="accent-ukra-navy"
                        />
                        <span className="text-xs font-bold text-gray-700">صالة جلوس مستقلة</span>
                     </label>
                  </div>
               )}

               <div className="mt-auto pt-6 text-center">
                  <p className="text-xs text-gray-400">يتم حفظ التعديلات تلقائياً</p>
               </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-gray-200 p-4 shrink-0 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-4 overflow-x-auto flex-1 pb-1 custom-scrollbar">
            <div className="flex items-center gap-2 text-gray-400 pl-4 border-l"><ShoppingBag className="w-5 h-5" /><span className="text-xs font-bold whitespace-nowrap">ملخص:</span></div>
            {selectedUnits.length === 0 ? (<span className="text-xs text-gray-400 italic">لم تختر شيئاً بعد...</span>) : (
               selectedUnits.map(u => (
                 <div key={u.id} 
                      onClick={() => setActiveTemplateType(u.type)} // عند النقر يفتح للتعديل
                      className={`flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border shrink-0 cursor-pointer hover:bg-gray-100 transition ${activeTemplateType === u.type ? 'border-ukra-navy bg-blue-50' : 'border-gray-200 bg-gray-50'}`}
                 >
                    <span className="bg-ukra-navy text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">{u.quantity}</span>
                    <span className="text-xs font-bold text-gray-700">{u.name}</span>
                 </div>
               ))
            )}
          </div>
          <div className="mr-6 pl-2">
            <button 
              type="button" 
              onClick={() => onSave(selectedUnits)} 
              className={`px-8 py-3 rounded-xl font-bold text-white transition shadow-lg flex items-center gap-2 whitespace-nowrap ${selectedUnits.length > 0 ? 'bg-ukra-gold text-ukra-navy hover:bg-yellow-500 hover:scale-105' : 'bg-gray-300'}`}
            >
              <Check className="w-5 h-5" /> حفظ وإنهاء ({selectedUnits.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};