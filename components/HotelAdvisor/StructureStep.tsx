import React, { useState, useEffect } from 'react';
import { 
  Building2, Star, Edit, CheckCircle2, 
  ArrowLeft, ArrowRight, AlertTriangle 
} from 'lucide-react';
import { UnitDefinition } from '../../types';
import { UnitBuilder } from './UnitBuilder';
import { generateDefaultUnits, getMandatoryUnitTypes } from '../../services/advisorService';

interface StructureStepProps {
  stars: number;
  units: UnitDefinition[];
  onUpdate: (stars: number, units: UnitDefinition[]) => void;
  onNext: () => void;
}

export const StructureStep: React.FC<StructureStepProps> = ({ 
  stars, units, onUpdate, onNext 
}) => {
  const [isUnitBuilderOpen, setIsUnitBuilderOpen] = useState(false);
  const [mandatoryTypes, setMandatoryTypes] = useState<string[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  // تحديث قائمة الإلزاميات عند تغيير النجوم
  useEffect(() => {
    const loadMandatory = async () => {
      // هذه الدالة async وتعود بـ Promise، لذا يجب استخدام await أو .then
      const types = await getMandatoryUnitTypes(stars);
      setMandatoryTypes(types);
    };
    loadMandatory();
  }, [stars]);

  // دالة تغيير النجوم (مع التعبئة الذكية) - تم التصحيح هنا
  const handleStarChange = async (newStars: number) => {
    if (newStars === stars && units.length > 0) return;

    // تأثير بصري
    setIsAnimating(true);
    
    // جلب الوحدات الجديدة (يجب انتظارها)
    const defaults = await generateDefaultUnits(newStars);
    
    setIsAnimating(false);
    
    // نحدث الحالة في الأب (HotelAdvisor)
    onUpdate(newStars, defaults);
  };

  // حفظ التعديلات من UnitBuilder
  const handleUnitsSave = (newUnits: UnitDefinition[]) => {
    onUpdate(stars, newUnits);
    setIsUnitBuilderOpen(false);
  };

  // التحقق قبل الانتقال
  const canProceed = units && units.length > 0; // حماية إضافية

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 1. Header Section */}
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-ukra-navy mb-3">تكوين هوية المشروع</h2>
        <p className="text-gray-500 max-w-lg mx-auto">
          اختر تصنيف الفندق المستهدف، وسنقوم تلقائياً بتحديد المرافق والوحدات الإلزامية حسب اشتراطات وزارة السياحة (V2).
        </p>
      </div>

      {/* 2. Star Selector */}
      <div className="bg-white p-6 rounded-[32px] shadow-lg border border-gray-100 mb-8">
        <div className="flex justify-center gap-2 md:gap-4 flex-wrap">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onClick={() => handleStarChange(s)}
              className={`flex flex-col items-center justify-center w-16 h-20 md:w-24 md:h-28 rounded-2xl transition-all duration-300 ${
                stars === s
                  ? 'bg-ukra-navy text-ukra-gold shadow-xl scale-110 ring-4 ring-ukra-gold/20' 
                  : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
              }`}
            >
              <div className="flex gap-0.5 mb-2">
                {Array.from({ length: s }).map((_, i) => (
                  <Star key={i} className={`w-3 h-3 md:w-4 md:h-4 ${stars === s ? 'fill-current' : ''}`} />
                ))}
              </div>
              <span className="font-bold text-2xl md:text-4xl">{s}</span>
              <span className="text-[10px] md:text-xs font-normal opacity-80 mt-1">نجوم</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Configuration Summary (Smart Populate Result) */}
      <div className={`bg-white rounded-[32px] shadow-xl overflow-hidden border border-gray-200 transition-all duration-500 ${isAnimating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
        <div className="bg-gray-50 px-8 py-4 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-ukra-navy/10 p-2 rounded-lg">
              <Building2 className="w-6 h-6 text-ukra-navy" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">مكونات المشروع المقترحة</h3>
              <p className="text-xs text-gray-500">تم اختيارها بناءً على تصنيف {stars} نجوم</p>
            </div>
          </div>
          <button 
            onClick={() => setIsUnitBuilderOpen(true)}
            className="flex items-center gap-2 text-sm font-bold text-ukra-navy hover:bg-white hover:shadow-sm px-4 py-2 rounded-xl transition"
          >
            <Edit className="w-4 h-4" />
            تخصيص / تعديل
          </button>
        </div>

        <div className="p-8">
          {!units || units.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              {isAnimating ? 'جاري التحديث...' : 'اختر التصنيف أعلاه لعرض الوحدات المقترحة...'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {units.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-ukra-navy/20 transition group">
                  <div className="flex items-center gap-3">
                    <span className="bg-white w-8 h-8 flex items-center justify-center rounded-lg font-bold text-ukra-navy shadow-sm">
                      {u.quantity}
                    </span>
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm">{u.name}</h4>
                      {/* عرض شارة إلزامي إذا كانت الوحدة في قائمة الإلزاميات */}
                      {mandatoryTypes.includes(u.type) && (
                        <span className="text-[10px] text-red-500 bg-red-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                          إلزامي للفئة
                        </span>
                      )}
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
              
              {/* Add More Button */}
              <button 
                onClick={() => setIsUnitBuilderOpen(true)}
                className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:border-ukra-navy/50 hover:text-ukra-navy hover:bg-blue-50/50 transition"
              >
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-xl font-bold">+</span>
                </div>
                <span className="font-bold text-sm">إضافة مرافق أخرى</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-8 py-5 border-t border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
            <AlertTriangle className="w-3 h-3" />
            <span>تغيير التصنيف سيعيد تعيين الوحدات الافتراضية</span>
          </div>
          
          <button 
            onClick={onNext}
            disabled={!canProceed}
            className={`flex items-center gap-3 px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all ${
              canProceed 
                ? 'bg-ukra-navy hover:bg-ukra-navy/90 hover:scale-105' 
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            <span>التالي: التعهدات التشغيلية</span>
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Unit Builder Modal */}
      {isUnitBuilderOpen && (
        <UnitBuilder 
          initialUnits={units}
          mandatoryTypes={mandatoryTypes}
          onSave={handleUnitsSave}
          onCancel={() => setIsUnitBuilderOpen(false)}
        />
      )}

    </div>
  );
};