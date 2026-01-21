import React, { useState, useEffect } from 'react';
import { UnitDefinition, UnitType } from '../../types';
import { Plus, X, BedDouble, Bath, Armchair, Utensils, ChefHat, Save, CheckCircle, Coffee, Bed, Building2, Dumbbell, Gamepad2, Briefcase, Waves } from 'lucide-react';

interface Props {
  onSave: (unit: UnitDefinition) => void;
  onCancel: () => void;
  initialData?: UnitDefinition;
}

// تعريف دقيق للأنواع لتتوافق مع قاعدة البيانات
const ROOM_TYPES: { id: UnitType; labelAr: string; defBeds: number; defBaths: number; defLiving: boolean; defKitchen: 'None'|'Minibar'|'Kitchenette'|'Full' }[] = [
  { id: 'Single', labelAr: 'غرفة مفردة', defBeds: 1, defBaths: 1, defLiving: false, defKitchen: 'Minibar' },
  { id: 'Twin', labelAr: 'غرفة ثنائية (Twin)', defBeds: 2, defBaths: 1, defLiving: false, defKitchen: 'Minibar' },
  { id: 'Double', labelAr: 'غرفة مزدوجة (King)', defBeds: 1, defBaths: 1, defLiving: false, defKitchen: 'Minibar' },
  { id: 'Triple', labelAr: 'غرفة ثلاثية', defBeds: 3, defBaths: 1, defLiving: false, defKitchen: 'Minibar' },
  { id: 'Suite', labelAr: 'جناح فندقي (Suite)', defBeds: 1, defBaths: 1, defLiving: true, defKitchen: 'Kitchenette' },
  { id: 'Apartment', labelAr: 'شقة فندقية', defBeds: 2, defBaths: 2, defLiving: true, defKitchen: 'Full' },
  { id: 'Studio', labelAr: 'ستوديو', defBeds: 1, defBaths: 1, defLiving: true, defKitchen: 'Kitchenette' },
  { id: 'Villa', labelAr: 'فيلا', defBeds: 3, defBaths: 3, defLiving: true, defKitchen: 'Full' },
];

// تعريف المرافق التي تؤثر على الاشتراطات (Trigger Mandatory Requirements)
const FACILITY_TYPES: { id: UnitType; labelAr: string; icon: any }[] = [
  { id: 'Reception', labelAr: 'استقبال (Reception)', icon: Building2 },
  { id: 'Lobby', labelAr: 'لوبي / صالة انتظار', icon: Armchair },
  { id: 'Restaurant', labelAr: 'مطعم رئيسي', icon: Utensils },
  { id: 'CoffeeShop', labelAr: 'كوفي شوب / مقهى', icon: Coffee },
  { id: 'MeetingRoom', labelAr: 'قاعة اجتماعات / أعمال', icon: Briefcase },
  { id: 'Gym', labelAr: 'نادي صحي (Gym)', icon: Dumbbell },
  { id: 'KidsArea', labelAr: 'منطقة ألعاب أطفال', icon: Gamepad2 },
  { id: 'PrayerRoom', labelAr: 'مصلى', icon: Building2 },
  { id: 'Pool', labelAr: 'مسبح', icon: Waves },
  { id: 'Spa', labelAr: 'سبا (SPA)', icon: Bath },
];

export const UnitBuilder: React.FC<Props> = ({ onSave, onCancel, initialData }) => {
  const [activeTab, setActiveTab] = useState<'Rooms' | 'Facilities'>('Rooms');
  
  const [formData, setFormData] = useState<UnitDefinition>(initialData || {
    id: '',
    name: 'غرفة مفردة',
    type: 'Single',
    quantity: 1,
    bedrooms: 1,
    bathrooms: 1,
    hasLivingRoom: false,
    hasDining: false,
    kitchenType: 'Minibar'
  });

  // تحديد التبويب تلقائياً عند التعديل
  useEffect(() => {
    if (initialData) {
      const isFacility = FACILITY_TYPES.some(f => f.id === initialData.type);
      setActiveTab(isFacility ? 'Facilities' : 'Rooms');
    } else {
      // إعداد افتراضي جديد
      setFormData(prev => ({ ...prev, id: Date.now().toString() }));
    }
  }, [initialData]);

  const handleTypeSelect = (typeId: UnitType, isFacility: boolean) => {
    if (isFacility) {
      const def = FACILITY_TYPES.find(t => t.id === typeId);
      if (def) {
        setFormData(prev => ({
          ...prev,
          type: typeId,
          name: def.labelAr, // نستخدم الاسم القياسي لضمان التعرف عليه
          // تصفير خصائص الغرف لأنها لا تنطبق على المرافق
          bedrooms: 0,
          bathrooms: 0,
          hasLivingRoom: false,
          hasDining: false,
          kitchenType: 'None'
        }));
      }
    } else {
      const def = ROOM_TYPES.find(t => t.id === typeId);
      if (def) {
        setFormData(prev => ({
          ...prev,
          type: typeId,
          name: def.labelAr,
          bedrooms: def.defBeds,
          bathrooms: def.defBaths,
          hasLivingRoom: def.defLiving,
          kitchenType: def.defKitchen
        }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.quantity < 1) return;
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-ukra-navy px-6 py-4 flex justify-between items-center text-white flex-shrink-0">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Plus className="w-5 h-5 text-ukra-gold" /> 
            {initialData ? 'تعديل الوحدة' : 'إضافة وحدات ومرافق'}
          </h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-white transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-gray-50 flex-shrink-0">
          <button 
            onClick={() => setActiveTab('Rooms')}
            className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 transition ${activeTab === 'Rooms' ? 'text-ukra-navy border-b-2 border-ukra-navy bg-white shadow-sm' : 'text-gray-400 hover:bg-gray-100'}`}
          >
            <Bed className="w-4 h-4" /> الغرف والأجنحة
          </button>
          <button 
            onClick={() => setActiveTab('Facilities')}
            className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 transition ${activeTab === 'Facilities' ? 'text-ukra-navy border-b-2 border-ukra-navy bg-white shadow-sm' : 'text-gray-400 hover:bg-gray-100'}`}
          >
            <Coffee className="w-4 h-4" /> المرافق العامة
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-8 flex-1 custom-scrollbar">
          
          {/* 1. Type Selection */}
          <div>
             <label className="block text-sm font-bold text-gray-700 mb-3 border-b pb-2">
               {activeTab === 'Rooms' ? '1. اختر نوع الوحدة السكنية' : '1. اختر نوع المرفق'}
             </label>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {(activeTab === 'Rooms' ? ROOM_TYPES : FACILITY_TYPES).map(type => (
                   <button
                     key={type.id}
                     type="button"
                     onClick={() => handleTypeSelect(type.id, activeTab === 'Facilities')}
                     className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 text-center group ${
                       formData.type === type.id 
                       ? 'border-ukra-gold bg-ukra-gold/10 text-ukra-navy shadow-md ring-1 ring-ukra-gold' 
                       : 'border-gray-100 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                     }`}
                   >
                      {formData.type === type.id ? <CheckCircle className="w-6 h-6 text-ukra-gold" /> : (
                        'icon' in type ? <type.icon className="w-6 h-6 text-gray-400 group-hover:text-ukra-navy" /> : <div className="w-6 h-6 rounded-full border-2 border-gray-200" />
                      )}
                      <span className="font-bold text-xs md:text-sm">{type.labelAr}</span>
                   </button>
                ))}
             </div>
          </div>

          {/* 2. Quantity & Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <label className="block text-sm font-bold text-ukra-navy mb-1">العدد / الكمية</label>
                <div className="flex items-center bg-white rounded-lg border shadow-sm mt-2">
                  <button type="button" className="w-12 h-10 text-xl font-bold hover:bg-gray-100 border-l text-gray-500" onClick={() => setFormData(p => ({...p, quantity: Math.max(1, p.quantity - 1)}))}>-</button>
                  <input 
                    type="number" 
                    min="1"
                    className="flex-1 text-center font-bold text-lg outline-none text-ukra-navy" 
                    value={formData.quantity}
                    onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                  />
                  <button type="button" className="w-12 h-10 text-xl font-bold hover:bg-gray-100 border-r text-gray-500" onClick={() => setFormData(p => ({...p, quantity: p.quantity + 1}))}>+</button>
                </div>
                <p className="text-[10px] text-blue-600 mt-2 font-medium">
                  {activeTab === 'Rooms' ? 'عدد الغرف من هذا النوع' : 'عدد الوحدات (مثلاً: 1 مطعم)'}
                </p>
             </div>

             <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <label className="block text-sm font-bold text-gray-700 mb-1">مسمى الوحدة (للعرض)</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full mt-2 p-2.5 border rounded-lg font-bold text-ukra-navy focus:border-ukra-gold outline-none shadow-sm"
                  placeholder={activeTab === 'Rooms' ? "مثال: غرفة ديلوكس" : "مثال: المطعم الرئيسي"}
                />
             </div>
          </div>

          {/* 3. Specs & Details (Only for Rooms) */}
          {activeTab === 'Rooms' && (
             <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-4 animate-in fade-in">
                <label className="block text-sm font-bold text-gray-700 border-b pb-2 mb-2">تفاصيل الغرفة (للتأثيث)</label>
                
                {/* Bedrooms / Bathrooms Row */}
                <div className="grid grid-cols-2 gap-4">
                   <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border shadow-sm">
                      <span className="text-xs md:text-sm font-bold text-gray-600 px-2 flex items-center gap-2"><BedDouble className="w-4 h-4" /> غرف النوم</span>
                      <div className="flex items-center gap-2">
                         <button type="button" className="w-6 h-6 bg-gray-100 rounded hover:bg-gray-200 flex items-center justify-center" onClick={() => setFormData(p => ({...p, bedrooms: Math.max(1, (p.bedrooms || 0) - 1)}))}>-</button>
                         <span className="font-bold w-4 text-center text-sm">{formData.bedrooms}</span>
                         <button type="button" className="w-6 h-6 bg-gray-100 rounded hover:bg-gray-200 flex items-center justify-center" onClick={() => setFormData(p => ({...p, bedrooms: (p.bedrooms || 0) + 1}))}>+</button>
                      </div>
                   </div>
                   <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border shadow-sm">
                      <span className="text-xs md:text-sm font-bold text-gray-600 px-2 flex items-center gap-2"><Bath className="w-4 h-4" /> الحمامات</span>
                      <div className="flex items-center gap-2">
                         <button type="button" className="w-6 h-6 bg-gray-100 rounded hover:bg-gray-200 flex items-center justify-center" onClick={() => setFormData(p => ({...p, bathrooms: Math.max(1, (p.bathrooms || 0) - 1)}))}>-</button>
                         <span className="font-bold w-4 text-center text-sm">{formData.bathrooms}</span>
                         <button type="button" className="w-6 h-6 bg-gray-100 rounded hover:bg-gray-200 flex items-center justify-center" onClick={() => setFormData(p => ({...p, bathrooms: (p.bathrooms || 0) + 1}))}>+</button>
                      </div>
                   </div>
                </div>

                {/* Living / Dining Toggles */}
                <div className="grid grid-cols-2 gap-4">
                   <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition select-none ${formData.hasLivingRoom ? 'bg-ukra-gold/10 border-ukra-gold' : 'bg-white border-gray-200'}`}>
                      <input type="checkbox" className="w-4 h-4 accent-ukra-gold" checked={formData.hasLivingRoom} onChange={e => setFormData({...formData, hasLivingRoom: e.target.checked})} />
                      <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-gray-700">
                         <Armchair className="w-4 h-4" /> صالة جلوس
                      </div>
                   </label>
                   <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition select-none ${formData.hasDining ? 'bg-ukra-gold/10 border-ukra-gold' : 'bg-white border-gray-200'}`}>
                      <input type="checkbox" className="w-4 h-4 accent-ukra-gold" checked={formData.hasDining} onChange={e => setFormData({...formData, hasDining: e.target.checked})} />
                      <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-gray-700">
                         <Utensils className="w-4 h-4" /> طاولة طعام
                      </div>
                   </label>
                </div>

                {/* Kitchen Options */}
                <div className="pt-2">
                   <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                      <ChefHat className="w-4 h-4" /> خدمات الطعام والمشروبات (ميني بار / مطبخ)
                   </label>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {[
                         { val: 'None', label: 'لا يوجد' },
                         { val: 'Minibar', label: 'ميني بار' },
                         { val: 'Kitchenette', label: 'ركن قهوة' },
                         { val: 'Full', label: 'مطبخ كامل' }
                      ].map((opt) => (
                         <button
                           key={opt.val}
                           type="button"
                           onClick={() => setFormData({...formData, kitchenType: opt.val as any})}
                           className={`text-xs py-2 px-1 rounded-lg border transition font-bold ${formData.kitchenType === opt.val ? 'bg-ukra-navy text-white border-ukra-navy shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                         >
                             {opt.label}
                         </button>
                      ))}
                   </div>
                </div>
             </div>
          )}

        </div>

        {/* Footer Action */}
        <div className="p-4 border-t bg-gray-50 flex-shrink-0">
           <button 
             onClick={handleSubmit} 
             disabled={formData.quantity < 1}
             className="w-full bg-ukra-gold text-ukra-navy font-bold py-3.5 rounded-xl hover:bg-yellow-500 transition shadow-lg flex items-center justify-center gap-2 text-base disabled:opacity-50 disabled:cursor-not-allowed"
           >
             <Save className="w-5 h-5" /> {initialData ? 'حفظ التعديلات' : 'إضافة للقائمة'}
           </button>
        </div>

      </div>
    </div>
  );
};