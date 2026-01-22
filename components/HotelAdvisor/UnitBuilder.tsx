import React, { useState } from 'react';
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
  mandatoryTypes?: string[]; // القائمة القادمة من advisorService
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

// الكتالوج (تمت مراجعة الأسماء لتطابق advisorService)
const UNIT_TEMPLATES: Record<UnitCategory, UnitTemplate[]> = {
  ACCOMMODATION: [
    { type: 'Single', nameAr: 'غرفة مفردة', icon: Bed, defaultQty: 5, hasOptions: true },
    { type: 'Double', nameAr: 'غرفة مزدوجة', icon: BedDouble, defaultQty: 10, hasOptions: true },
    { type: 'Twin', nameAr: 'غرفة توأم', icon: Users, defaultQty: 5, hasOptions: true },
    { type: 'Accessible', nameAr: 'غرفة ذوي الهمم', icon: Accessibility, defaultQty: 1, hasOptions: true }, // الإلزامية ستأتي من mandatoryTypes
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
  const [selectedUnits, setSelectedUnits] = useState<UnitDefinition[]>(initialUnits);
  const [activeTemplateType, setActiveTemplateType] = useState<string | null>(null);
  
  const [currentConfig, setCurrentConfig] = useState<{
    qty: number; details: any;
  }>({ qty: 1, details: {} });

  const handleSelectTemplate = (template: UnitTemplate) => {
    setActiveTemplateType(template.type);
    const existing = selectedUnits.find(u => u.type === template.type);
    
    if (existing) {
      setCurrentConfig({
        qty: existing.quantity,
        details: {
          hasLiving: existing.hasLivingRoom,
          hasDining: existing.hasDining,
          kitchenType: existing.kitchenType,
          bedrooms: existing.bedrooms,
          bathrooms: existing.bathrooms
        }
      });
    } else {
      setCurrentConfig({
        qty: template.defaultQty,
        details: {
          hasLiving: template.type === 'Suite' || template.type === 'Apartment',
          hasDining: template.type === 'Apartment',
          kitchenType: template.type === 'Apartment' ? 'Full' : (template.type === 'Suite' ? 'Kitchenette' : 'Minibar'),
          bedrooms: template.type === 'Villa' ? 3 : 1,
          bathrooms: 1
        }
      });
    }
  };

  const handleUpdateBasket = () => {
    if (!activeTemplateType) return;
    const template = Object.values(UNIT_TEMPLATES).flat().find(t => t.type === activeTemplateType);
    if (!template) return;

    const newUnit: UnitDefinition = {
      id: crypto.randomUUID(),
      type: template.type as any,
      name: template.nameAr,
      quantity: currentConfig.qty,
      bedrooms: template.hasOptions ? currentConfig.details.bedrooms : undefined,
      bathrooms: template.hasOptions ? currentConfig.details.bathrooms : undefined,
      hasLivingRoom: template.hasOptions ? currentConfig.details.hasLiving : undefined,
      hasDining: template.hasOptions ? currentConfig.details.hasDining : undefined,
      kitchenType: template.hasOptions ? currentConfig.details.kitchenType : undefined,
    };

    setSelectedUnits(prev => {
      const filtered = prev.filter(u => u.type !== activeTemplateType);
      return currentConfig.qty > 0 ? [...filtered, newUnit] : filtered;
    });
    setActiveTemplateType(null); 
  };

  const handleRemoveFromBasket = (type: string) => {
    setSelectedUnits(prev => prev.filter(u => u.type !== type));
    if (activeTemplateType === type) setActiveTemplateType(null);
  };

  const handleFinalSave = () => {
    onSave(selectedUnits);
  };

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
              اختر الوحدات المطلوبة. العلامة <span className="text-red-300 font-bold">الحمراء</span> تعني أن الوحدة إلزامية لتصنيفك.
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
          {/* Catalog */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50 custom-scrollbar">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {UNIT_TEMPLATES[activeTab].map((template) => {
                const inBasket = selectedUnits.find(u => u.type === template.type);
                const isSelected = activeTemplateType === template.type;
                
                // التحقق من القائمة القادمة من advisorService
                const isMandatoryDynamic = mandatoryTypes.includes(template.type) || template.isMandatory;

                return (
                  <button key={template.type} onClick={() => handleSelectTemplate(template)} className={`relative flex flex-col items-center p-4 rounded-2xl border-2 transition-all duration-200 group ${isSelected ? 'border-ukra-navy bg-white shadow-md ring-2 ring-ukra-navy/10' : (inBasket ? 'border-ukra-gold bg-white' : 'border-white bg-white hover:border-gray-200')}`}>
                    {inBasket && <span className="absolute top-2 right-2 bg-ukra-gold text-ukra-navy text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">x{inBasket.quantity}</span>}
                    
                    {/* شارة إلزامي */}
                    {isMandatoryDynamic && !inBasket && (
                      <span className="absolute top-2 left-2 text-[9px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100 font-bold animate-pulse shadow-sm">
                        إلزامي
                      </span>
                    )}

                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors ${isSelected ? 'bg-ukra-navy text-white' : (inBasket ? 'bg-ukra-gold/20 text-ukra-navy' : 'bg-gray-100 text-gray-500 group-hover:bg-blue-50')}`}>
                      <template.icon className="w-6 h-6" />
                    </div>
                    <span className={`font-bold text-xs text-center ${isSelected ? 'text-ukra-navy' : 'text-gray-700'}`}>{template.nameAr}</span>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Config Panel */}
          {activeTemplate && (
            <div className="w-80 bg-white border-l border-gray-200 p-6 flex flex-col shadow-xl z-10 animate-in slide-in-from-left duration-300">
               <div className="flex items-center gap-3 mb-6 border-b pb-4">
                   <div className="bg-ukra-navy/10 p-2 rounded-lg text-ukra-navy"><activeTemplate.icon className="w-6 h-6" /></div>
                   <div><h3 className="font-bold text-ukra-navy text-sm">{activeTemplate.nameAr}</h3><p className="text-xs text-gray-400">تعديل الخيارات</p></div>
               </div>
               
               <div className="mb-6">
                   <label className="block text-xs font-bold text-gray-500 mb-2">العدد</label>
                   <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl border">
                      <button onClick={() => setCurrentConfig(p => ({...p, qty: Math.max(0, p.qty - 1)}))} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg">-</button>
                      <input type="number" value={currentConfig.qty} onChange={(e) => setCurrentConfig(p => ({...p, qty: parseInt(e.target.value) || 0}))} className="flex-1 text-center font-bold bg-transparent outline-none text-ukra-navy" />
                      <button onClick={() => setCurrentConfig(p => ({...p, qty: p.qty + 1}))} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg">+</button>
                   </div>
               </div>

               {/* خيارات تفصيلية */}
               {activeTemplate.hasOptions && (
                  <div className="space-y-4">
                     <div>
                       <label className="block text-xs font-bold text-gray-500 mb-2">تجهيزات</label>
                       <div className="grid grid-cols-2 gap-2">
                         {['Minibar', 'Kitchenette', 'Full', 'None'].map(k => (
                           <button key={k} onClick={() => setCurrentConfig(p => ({...p, details: {...p.details, kitchenType: k}}))} className={`text-[10px] py-2 px-1 rounded border font-bold ${currentConfig.details.kitchenType === k ? 'bg-ukra-navy text-white border-ukra-navy' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                             {k === 'Minibar' ? 'ميني بار' : k === 'Kitchenette' ? 'ركن قهوة' : k === 'Full' ? 'مطبخ كامل' : 'لا يوجد'}
                           </button>
                         ))}
                       </div>
                     </div>
                  </div>
               )}

               <div className="pt-4 mt-4 border-t border-gray-100 mt-auto">
                <button onClick={handleUpdateBasket} className="w-full bg-ukra-navy text-white py-3 rounded-xl font-bold text-sm hover:bg-ukra-navy/90 transition shadow-lg flex items-center justify-center gap-2">
                  {currentConfig.qty === 0 ? <Trash2 className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  {currentConfig.qty === 0 ? 'حذف من القائمة' : 'تأكيد الإضافة'}
                </button>
               </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-gray-200 p-4 shrink-0 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-4 overflow-x-auto flex-1 pb-1 custom-scrollbar">
            <div className="flex items-center gap-2 text-gray-400 pl-4 border-l"><ShoppingBag className="w-5 h-5" /><span className="text-xs font-bold whitespace-nowrap">السلة:</span></div>
            {selectedUnits.length === 0 ? (<span className="text-xs text-gray-400 italic">لم يتم اختيار أي وحدات...</span>) : (
               selectedUnits.map(u => (
                 <div key={u.id} className="flex items-center gap-2 bg-gray-100 pl-1 pr-3 py-1 rounded-full border border-gray-200 shrink-0 animate-in zoom-in">
                    <span className="bg-ukra-navy text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">{u.quantity}</span>
                    <span className="text-xs font-bold text-gray-700">{u.name}</span>
                    <button onClick={() => handleRemoveFromBasket(u.type)} className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-red-100 text-gray-400 hover:text-red-500 transition"><X className="w-3 h-3" /></button>
                 </div>
               ))
            )}
          </div>
          <div className="mr-6 pl-2">
            <button onClick={handleFinalSave} disabled={selectedUnits.length === 0} className={`px-8 py-3 rounded-xl font-bold text-white transition shadow-lg flex items-center gap-2 whitespace-nowrap ${selectedUnits.length > 0 ? 'bg-ukra-gold text-ukra-navy hover:bg-yellow-500 hover:scale-105' : 'bg-gray-300 cursor-not-allowed'}`}>
              <Check className="w-5 h-5" /> حفظ الكل ({selectedUnits.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};