import React, { useState, useEffect } from 'react';
import { 
  Building2, BedDouble, Utensils, Dumbbell, 
  Check, X, ChefHat, Sofa, 
  Users, Bed, ShoppingBag, 
  Shirt, LayoutGrid, Info, Coffee
} from 'lucide-react';
import { UnitDefinition } from '../../types';

interface UnitBuilderProps {
  onSave: (units: UnitDefinition[]) => void;
  onCancel: () => void;
  initialUnits?: UnitDefinition[];
  mandatoryTypes?: string[]; // القائمة الإلزامية القادمة من السيستم
}

type UnitCategory = 'ACCOMMODATION' | 'PUBLIC' | 'DINING' | 'SERVICES';

interface UnitTemplate {
  type: string;
  nameAr: string;
  icon: React.ElementType;
  defaultQty: number;
  hasOptions?: boolean;
  description?: string;
  isMandatory?: boolean; // خاصية جديدة
}

// تعريف قوالب الوحدات (الكتالوج)
const UNIT_TEMPLATES_DATA: Record<UnitCategory, UnitTemplate[]> = {
  ACCOMMODATION: [
    { type: 'Single', nameAr: 'غرفة مفردة (Single)', icon: Bed, defaultQty: 5, hasOptions: true, description: 'سرير واحد' },
    { type: 'Double', nameAr: 'غرفة مزدوجة (Double)', icon: BedDouble, defaultQty: 10, hasOptions: true, description: 'سرير كبير لشخصين' },
    { type: 'Twin', nameAr: 'غرفة توأم (Twin)', icon: Users, defaultQty: 5, hasOptions: true, description: 'سريرين منفصلين' },
    { type: 'Suite', nameAr: 'جناح فندقي (Suite)', icon: Building2, defaultQty: 2, hasOptions: true, description: 'غرفة وصالة ومطبخ صغير' },
    { type: 'Apartment', nameAr: 'شقة فندقية', icon: LayoutGrid, defaultQty: 5, hasOptions: true, description: 'متكاملة الخدمات' },
  ],
  PUBLIC: [
    { type: 'Lobby', nameAr: 'بهو الاستقبال (Lobby)', icon: Sofa, defaultQty: 1, description: 'منطقة الجلوس والاستقبال' },
    { type: 'Gym', nameAr: 'نادي صحي (Gym)', icon: Dumbbell, defaultQty: 1, description: 'أجهزة رياضية ولياقة' },
    { type: 'Spa', nameAr: 'سبا (Spa)', icon: Droplets, defaultQty: 1, description: 'مساج وعناية' },
    { type: 'MeetingRoom', nameAr: 'قاعة اجتماعات', icon: Briefcase, defaultQty: 1, description: 'لرجال الأعمال' },
  ],
  DINING: [
    { type: 'Restaurant', nameAr: 'مطعم / منطقة إفطار', icon: Utensils, defaultQty: 1, description: 'تقديم الوجبات' },
    { type: 'CoffeeShop', nameAr: 'مقهى (Coffee Shop)', icon: Coffee, defaultQty: 1, description: 'مشروبات وحلويات' },
    { type: 'Kitchen', nameAr: 'مطبخ مركزي', icon: ChefHat, defaultQty: 1, description: 'لتحضير الطعام' },
  ],
  SERVICES: [
    { type: 'Laundry', nameAr: 'مغسلة مركزية', icon: Shirt, defaultQty: 1 },
    { type: 'MiniMarket', nameAr: 'ميني ماركت', icon: ShoppingBag, defaultQty: 1 },
  ]
};

// أيقونات إضافية نحتاجها
import { Briefcase, Droplets } from 'lucide-react';

export const UnitBuilder: React.FC<UnitBuilderProps> = ({ 
  onSave, onCancel, initialUnits = [], mandatoryTypes = [] 
}) => {
  const [activeTab, setActiveTab] = useState<UnitCategory>('ACCOMMODATION');
  const [selectedUnits, setSelectedUnits] = useState<UnitDefinition[]>(initialUnits);
  const [activeTemplateType, setActiveTemplateType] = useState<string | null>(null);

  // دالة لإضافة أو تحديث وحدة
  const handleAddOrUpdate = (template: UnitTemplate, quantity: number) => {
    if (quantity <= 0) {
      // حذف الوحدة
      // منع الحذف إذا كانت إلزامية وتنبيه المستخدم (اختياري هنا، لكن يفضل التنبيه)
      setSelectedUnits(prev => prev.filter(u => u.type !== template.type));
      return;
    }

    setSelectedUnits(prev => {
      const exists = prev.find(u => u.type === template.type);
      if (exists) {
        return prev.map(u => u.type === template.type ? { ...u, quantity } : u);
      }
      return [...prev, {
        id: `unit-${Date.now()}-${template.type}`,
        type: template.type,
        name: template.nameAr,
        quantity,
        bedrooms: template.type === 'Suite' ? 1 : 1,
        bathrooms: 1,
        hasLivingRoom: template.type === 'Suite' || template.type === 'Lobby',
        hasDining: template.type === 'Restaurant',
        kitchenType: template.type === 'Kitchen' ? 'Full' : 'None'
      }];
    });
  };

  const getQuantity = (type: string) => selectedUnits.find(u => u.type === type)?.quantity || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-8 py-6 bg-ukra-navy text-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-bold mb-1">بناء وتكوين الفندق</h2>
            <p className="text-ukra-gold/90 text-sm">أضف المرافق والغرف حسب مخططك الهندسي</p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Sidebar Tabs */}
          <div className="w-64 bg-gray-50 border-l overflow-y-auto shrink-0 py-6">
            <div className="flex flex-col gap-2 px-4">
              {(Object.keys(UNIT_TEMPLATES_DATA) as UnitCategory[]).map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`flex items-center gap-3 px-4 py-4 rounded-xl text-right transition-all ${
                    activeTab === cat 
                      ? 'bg-white text-ukra-navy shadow-md font-bold ring-1 ring-black/5' 
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                  }`}
                >
                  {cat === 'ACCOMMODATION' && <Bed className="w-5 h-5" />}
                  {cat === 'PUBLIC' && <Sofa className="w-5 h-5" />}
                  {cat === 'DINING' && <Utensils className="w-5 h-5" />}
                  {cat === 'SERVICES' && <LayoutGrid className="w-5 h-5" />}
                  <span>
                    {cat === 'ACCOMMODATION' ? 'الغرف والأجنحة' : 
                     cat === 'PUBLIC' ? 'المرافق العامة' : 
                     cat === 'DINING' ? 'المطاعم والكافيهات' : 'الخدمات المساندة'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Units Grid */}
          <div className="flex-1 overflow-y-auto p-8 bg-white scrollbar-thin">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {UNIT_TEMPLATES_DATA[activeTab].map(template => {
                const qty = getQuantity(template.type);
                const isMandatory = mandatoryTypes.includes(template.type); // فحص الإلزامية

                return (
                  <div 
                    key={template.type}
                    className={`relative border rounded-2xl p-5 transition-all duration-300 ${
                      qty > 0 ? 'border-ukra-navy bg-blue-50/30 ring-1 ring-ukra-navy/20' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Mandatory Badge */}
                    {isMandatory && (
                      <div className="absolute top-3 left-3 bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        <span>إلزامي للرخصة</span>
                      </div>
                    )}

                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${qty > 0 ? 'bg-ukra-navy text-white' : 'bg-gray-100 text-gray-400'}`}>
                        <template.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className={`font-bold text-lg ${qty > 0 ? 'text-ukra-navy' : 'text-gray-700'}`}>{template.nameAr}</h3>
                        <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-white rounded-xl p-2 border border-gray-100 shadow-sm">
                      <button 
                        onClick={() => handleAddOrUpdate(template, Math.max(0, qty - 1))}
                        className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-600 transition font-bold text-xl disabled:opacity-50"
                      >
                        -
                      </button>
                      <span className="font-mono font-bold text-xl text-ukra-navy w-12 text-center">
                        {qty}
                      </span>
                      <button 
                        onClick={() => handleAddOrUpdate(template, qty + 1)}
                        className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-50 hover:bg-green-50 text-gray-600 hover:text-green-600 transition font-bold text-xl"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t bg-gray-50 flex justify-between items-center shrink-0">
          <div className="flex gap-2 overflow-x-auto max-w-2xl pb-2 scrollbar-hide">
            {selectedUnits.length === 0 ? (
               <span className="text-gray-400 italic text-sm">لم تختر شيئاً بعد...</span>
            ) : (
               selectedUnits.map(u => (
                 <div key={u.id} className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-ukra-navy/20 bg-blue-50 text-ukra-navy shrink-0">
                    <span className="bg-ukra-navy text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">{u.quantity}</span>
                    <span className="text-xs font-bold">{u.name}</span>
                 </div>
               ))
            )}
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={onCancel}
              className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-200 transition"
            >
              إلغاء
            </button>
            <button 
              onClick={() => onSave(selectedUnits)} 
              disabled={selectedUnits.length === 0}
              className="px-8 py-3 rounded-xl font-bold text-white bg-ukra-navy hover:bg-ukra-navy/90 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Check className="w-5 h-5" />
              <span>حفظ وتأكيد</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};