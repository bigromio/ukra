import React, { useState, useEffect } from 'react';
import { 
  Building2, Star, Edit, CheckCircle2, 
  ArrowLeft, AlertTriangle, Plus 
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
  const [loading, setLoading] = useState(false);
  
  // حالة التحقق من الإلزامية
  const [validationError, setValidationError] = useState<string | null>(null);

  // 1. تحميل الإلزاميات عند تغيير النجوم
  useEffect(() => {
    const loadMandatory = async () => {
      try {
        const types = await getMandatoryUnitTypes(stars);
        setMandatoryTypes(types);
      } catch (e) {
        console.error("Error loading mandatory types", e);
      }
    };
    loadMandatory();
  }, [stars]);

  // 2. التحقق من الامتثال في الوقت الفعلي
  const checkCompliance = () => {
    const currentTypes = units.map(u => u.type);
    const missing = mandatoryTypes.filter(m => !currentTypes.includes(m));
    
    if (missing.length > 0) {
      // ترجمة الأنواع للعربية للعرض
      const arNames: Record<string, string> = {
        'Lobby': 'بهو الاستقبال',
        'Restaurant': 'المطعم',
        'Gym': 'النادي الصحي',
        'Kitchen': 'المطبخ'
      };
      const missingAr = missing.map(m => arNames[m] || m).join('، ');
      setValidationError(`عذراً، تصنيف ${stars} نجوم يتطلب وجود: ${missingAr}`);
      return false;
    }
    
    setValidationError(null);
    return true;
  };

  // التحقق عند كل تغيير في الوحدات
  useEffect(() => {
    checkCompliance();
  }, [units, mandatoryTypes]);

  // دالة تغيير النجوم (إعادة تعيين الافتراضي)
  const handleStarChange = async (newStars: number) => {
    if (newStars === stars) return;
    setLoading(true);
    try {
      const newDefaults = await generateDefaultUnits(newStars);
      onUpdate(newStars, newDefaults);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleNextClick = () => {
      if (checkCompliance()) {
        // نمرر الوحدات الحالية للدالة الأب
        onUpdate(stars, units);   
        onNext();
      }
    };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Info */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-ukra-navy mb-2">تكوين الفندق</h2>
        <p className="text-gray-500">قم بمراجعة وتعديل عدد الغرف والمرافق لتطابق الواقع</p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* Stars Selector */}
        <div className="bg-ukra-navy px-8 py-6 text-white flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-3 rounded-full">
              <Building2 className="w-6 h-6 text-ukra-gold" />
            </div>
            <div>
              <h3 className="font-bold text-lg">التصنيف المستهدف</h3>
              <p className="text-white/60 text-xs">يحدد المعايير الإلزامية</p>
            </div>
          </div>
          
          <div className="flex bg-black/20 p-1 rounded-xl">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() => handleStarChange(s)}
                disabled={loading}
                className={`px-4 py-2 rounded-lg font-bold flex items-center gap-1 transition-all ${
                  stars === s 
                    ? 'bg-ukra-gold text-ukra-navy shadow-lg scale-105' 
                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>{s}</span>
                <Star className={`w-3 h-3 ${stars === s ? 'fill-ukra-navy' : ''}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Units List */}
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              الوحدات المختارة
            </h3>
            <button 
              onClick={() => setIsUnitBuilderOpen(true)}
              className="text-ukra-navy hover:text-ukra-gold font-bold text-sm flex items-center gap-2 transition"
            >
              <Edit className="w-4 h-4" />
              تعديل القائمة
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-400">جاري تحديث المعايير...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {units.map((unit) => (
                <div key={unit.id} className="group relative bg-gray-50 border hover:border-ukra-navy/30 rounded-2xl p-4 transition-all hover:shadow-md flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center shadow-sm text-ukra-navy font-bold text-xl border border-gray-100">
                      {unit.quantity}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">{unit.name}</h4>
                      <div className="flex gap-2 text-[10px] text-gray-500 mt-1">
                        {mandatoryTypes.includes(unit.type) && (
                          <span className="text-red-500 bg-red-50 px-2 py-0.5 rounded-full font-bold">إلزامي</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Add Button */}
              <button 
                onClick={() => setIsUnitBuilderOpen(true)}
                className="border-2 border-dashed border-gray-300 rounded-2xl p-4 flex flex-col items-center justify-center text-gray-400 hover:border-ukra-navy hover:text-ukra-navy hover:bg-blue-50/50 transition gap-2 group min-h-[88px]"
              >
                <Plus className="w-6 h-6 group-hover:scale-110 transition" />
                <span className="font-bold text-sm">إضافة وحدة جديدة</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer & Validation */}
        <div className="bg-gray-50 px-8 py-5 border-t border-gray-100">
          
          {/* رسالة الخطأ إن وجدت */}
          {validationError && (
            <div className="mb-4 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 animate-pulse">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span className="font-bold text-sm">{validationError}</span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
              <AlertTriangle className="w-3 h-3" />
              <span>تغيير التصنيف سيعيد تعيين الوحدات الافتراضية</span>
            </div>
            
            <button 
              onClick={handleNextClick}
              disabled={!!validationError}
              className={`flex items-center gap-3 px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all ${
                validationError 
                  ? 'bg-gray-300 cursor-not-allowed opacity-70' 
                  : 'bg-ukra-navy hover:bg-ukra-navy/90 hover:scale-105 hover:shadow-xl'
              }`}
            >
              <span>التالي: التعهدات التشغيلية</span>
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Unit Builder Modal */}
      {isUnitBuilderOpen && (
        <UnitBuilder 
          initialUnits={units}
          mandatoryTypes={mandatoryTypes}
          onSave={(newUnits) => {
            onUpdate(stars, newUnits);
            setIsUnitBuilderOpen(false);
          }} 
          onCancel={() => setIsUnitBuilderOpen(false)} 
        />
      )}
    </div>
  );
};