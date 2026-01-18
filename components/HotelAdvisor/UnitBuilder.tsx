
import React, { useState, useEffect } from 'react';
import { UnitDefinition, HotelUnitType } from '../../types';
import { Plus, X, BedDouble, Bath, Armchair, Utensils, ChefHat, Save, CheckCircle, Coffee } from 'lucide-react';

interface Props {
  onSave: (unit: UnitDefinition) => void;
  onCancel: () => void;
  initialData?: UnitDefinition;
}

const UNIT_TYPES: { id: HotelUnitType; labelAr: string; labelEn: string; defBeds: number; defBaths: number; defLiving: boolean; defKitchen: 'None'|'Minibar'|'Kitchenette'|'Full' }[] = [
  { id: 'Single', labelAr: 'غرفة مفرد', labelEn: 'Single Room', defBeds: 1, defBaths: 1, defLiving: false, defKitchen: 'Minibar' },
  { id: 'Twin', labelAr: 'غرفة توين (سريرين)', labelEn: 'Twin Room', defBeds: 1, defBaths: 1, defLiving: false, defKitchen: 'Minibar' }, // 1 bedroom, 2 beds implies bedroom count is 1 zone
  { id: 'Double', labelAr: 'غرفة مزدوجة (كينج)', labelEn: 'Double Room', defBeds: 1, defBaths: 1, defLiving: false, defKitchen: 'Minibar' },
  { id: 'Triple', labelAr: 'غرفة ثلاثية', labelEn: 'Triple Room', defBeds: 1, defBaths: 1, defLiving: false, defKitchen: 'Minibar' },
  { id: 'Suite', labelAr: 'جناح (Suite)', labelEn: 'Suite', defBeds: 1, defBaths: 1, defLiving: true, defKitchen: 'Kitchenette' },
  { id: 'Apartment', labelAr: 'شقة فندقية', labelEn: 'Hotel Apartment', defBeds: 2, defBaths: 2, defLiving: true, defKitchen: 'Full' },
];

export const UnitBuilder: React.FC<Props> = ({ onSave, onCancel, initialData }) => {
  const [formData, setFormData] = useState<UnitDefinition>(initialData || {
    id: Date.now().toString(),
    name: 'غرفة مفرد',
    unitType: 'Single',
    quantity: 10,
    bedrooms: 1,
    bathrooms: 1,
    hasLivingRoom: false,
    hasDining: false,
    kitchenType: 'Minibar'
  });

  const handleTypeSelect = (typeId: HotelUnitType) => {
    const def = UNIT_TYPES.find(t => t.id === typeId);
    if (def) {
      setFormData(prev => ({
        ...prev,
        unitType: typeId,
        name: def.labelAr,
        bedrooms: def.defBeds,
        bathrooms: def.defBaths,
        hasLivingRoom: def.defLiving,
        kitchenType: def.defKitchen
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-ukra-navy px-6 py-4 flex justify-between items-center text-white flex-shrink-0">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Plus className="w-5 h-5 text-ukra-gold" /> إضافة وحدات جديدة
          </h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-8 flex-1">
          
          {/* 1. Unit Type Selection */}
          <div>
             <label className="block text-sm font-bold text-gray-700 mb-3 border-b pb-2">اختر نوع الوحدة</label>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {UNIT_TYPES.map(type => (
                   <button
                     key={type.id}
                     type="button"
                     onClick={() => handleTypeSelect(type.id)}
                     className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 text-center ${
                        formData.unitType === type.id 
                        ? 'border-ukra-gold bg-yellow-50 text-ukra-navy shadow-md' 
                        : 'border-gray-100 bg-white text-gray-500 hover:border-gray-300'
                     }`}
                   >
                      {formData.unitType === type.id ? <CheckCircle className="w-6 h-6 text-ukra-gold" /> : <div className="w-6 h-6 rounded-full border-2 border-gray-200" />}
                      <span className="font-bold text-sm">{type.labelAr}</span>
                   </button>
                ))}
             </div>
          </div>

          {/* 2. Quantity */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center justify-between">
             <div>
                <label className="block text-sm font-bold text-ukra-navy">العدد المطلوب</label>
                <p className="text-xs text-gray-500">كم عدد الوحدات من هذا النوع في الفندق؟</p>
             </div>
             <div className="flex items-center bg-white rounded-lg border shadow-sm">
                <button type="button" className="w-12 h-12 text-xl font-bold hover:bg-gray-100 border-l" onClick={() => setFormData(p => ({...p, quantity: Math.max(1, p.quantity - 1)}))}>-</button>
                <input 
                  type="number" 
                  className="w-20 text-center font-bold text-lg outline-none" 
                  value={formData.quantity}
                  onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                />
                <button type="button" className="w-12 h-12 text-xl font-bold hover:bg-gray-100 border-r" onClick={() => setFormData(p => ({...p, quantity: p.quantity + 1}))}>+</button>
             </div>
          </div>

          {/* 3. Specs & Details */}
          <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-4">
             <label className="block text-sm font-bold text-gray-700 border-b pb-2 mb-2">التفاصيل والمواصفات</label>
             
             {/* Bedrooms / Bathrooms Row */}
             <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between bg-white p-2 rounded border">
                   <span className="text-sm font-bold text-gray-600 px-2 flex items-center gap-2"><BedDouble className="w-4 h-4" /> غرف النوم</span>
                   <div className="flex items-center gap-2">
                      <button type="button" className="w-6 h-6 bg-gray-100 rounded hover:bg-gray-200" onClick={() => setFormData(p => ({...p, bedrooms: Math.max(1, p.bedrooms - 1)}))}>-</button>
                      <span className="font-bold w-4 text-center">{formData.bedrooms}</span>
                      <button type="button" className="w-6 h-6 bg-gray-100 rounded hover:bg-gray-200" onClick={() => setFormData(p => ({...p, bedrooms: p.bedrooms + 1}))}>+</button>
                   </div>
                </div>
                <div className="flex items-center justify-between bg-white p-2 rounded border">
                   <span className="text-sm font-bold text-gray-600 px-2 flex items-center gap-2"><Bath className="w-4 h-4" /> الحمامات</span>
                   <div className="flex items-center gap-2">
                      <button type="button" className="w-6 h-6 bg-gray-100 rounded hover:bg-gray-200" onClick={() => setFormData(p => ({...p, bathrooms: Math.max(1, p.bathrooms - 1)}))}>-</button>
                      <span className="font-bold w-4 text-center">{formData.bathrooms}</span>
                      <button type="button" className="w-6 h-6 bg-gray-100 rounded hover:bg-gray-200" onClick={() => setFormData(p => ({...p, bathrooms: p.bathrooms + 1}))}>+</button>
                   </div>
                </div>
             </div>

             {/* Living / Dining Toggles */}
             <div className="grid grid-cols-2 gap-4">
                <label className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition ${formData.hasLivingRoom ? 'bg-ukra-gold/10 border-ukra-gold' : 'bg-white border-gray-200'}`}>
                   <input type="checkbox" className="w-5 h-5 text-ukra-gold" checked={formData.hasLivingRoom} onChange={e => setFormData({...formData, hasLivingRoom: e.target.checked})} />
                   <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                      <Armchair className="w-4 h-4" /> صالة جلوس
                   </div>
                </label>
                <label className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition ${formData.hasDining ? 'bg-ukra-gold/10 border-ukra-gold' : 'bg-white border-gray-200'}`}>
                   <input type="checkbox" className="w-5 h-5 text-ukra-gold" checked={formData.hasDining} onChange={e => setFormData({...formData, hasDining: e.target.checked})} />
                   <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                      <Utensils className="w-4 h-4" /> طاولة طعام
                   </div>
                </label>
             </div>

             {/* Kitchen Options */}
             <div className="pt-2">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                   <ChefHat className="w-4 h-4" /> خدمات الطعام والمشروبات
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                   {[
                     { val: 'None', label: 'لا يوجد' },
                     { val: 'Minibar', label: 'ميني بار (ثلاجة)' },
                     { val: 'Kitchenette', label: 'ركن قهوة (كيتشن)' },
                     { val: 'Full', label: 'مطبخ كامل' }
                   ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setFormData({...formData, kitchenType: opt.val as any})}
                        className={`text-xs py-2 px-1 rounded border transition font-bold ${formData.kitchenType === opt.val ? 'bg-ukra-navy text-white border-ukra-navy' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                      >
                         {opt.label}
                      </button>
                   ))}
                </div>
             </div>
          </div>

        </div>

        {/* Footer Action */}
        <div className="p-4 border-t bg-gray-50 flex-shrink-0">
           <button 
             onClick={handleSubmit} 
             className="w-full bg-ukra-gold text-ukra-navy font-bold py-4 rounded-xl hover:bg-yellow-500 transition shadow-lg flex items-center justify-center gap-2 text-lg"
           >
             <Save className="w-5 h-5" /> إضافة {formData.quantity} وحدة للقائمة
           </button>
        </div>

      </div>
    </div>
  );
};
