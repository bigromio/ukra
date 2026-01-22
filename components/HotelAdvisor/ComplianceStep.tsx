import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, FileText, UserCheck, Check, 
  ArrowRight, CheckCircle2, AlertCircle, Loader2 
} from 'lucide-react';
import { getStarRequirements, StarRequirement } from '../../services/advisorService';

interface ComplianceStepProps {
  stars: number;
  onNext: () => void;
  onBack: () => void;
}

export const ComplianceStep: React.FC<ComplianceStepProps> = ({ stars, onNext, onBack }) => {
  const [requirements, setRequirements] = useState<StarRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [acknowledged, setAcknowledged] = useState(false);

  // جلب الاشتراطات التشغيلية فقط
  useEffect(() => {
    const fetchReqs = async () => {
      setLoading(true);
      const allReqs = await getStarRequirements(stars);
      // تصفية التشغيليات فقط
      const operational = allReqs.filter(r => r.type === 'Operational');
      setRequirements(operational);
      setLoading(false);
    };
    fetchReqs();
  }, [stars]);

  // دالة مساعدة لتحديد أيقونة مناسبة حسب النص
  const getIcon = (text: string) => {
    if (text.includes('موظف') || text.includes('زي')) return <UserCheck className="w-5 h-5 text-blue-500"/>;
    if (text.includes('تراخيص') || text.includes('شهادة')) return <ShieldCheck className="w-5 h-5 text-green-500"/>;
    return <FileText className="w-5 h-5 text-gray-400"/>;
  };

  return (
    <div className="font-cairo animate-in slide-in-from-right duration-500 pb-10">
      
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-ukra-navy">الخطوة 2: التعهدات التشغيلية والنظامية</h2>
        <p className="text-gray-500 text-sm">لإصدار الترخيص، يجب الالتزام بالسياسات والإجراءات التالية</p>
      </div>

      <div className="max-w-4xl mx-auto">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <p>جاري جلب قائمة التعهدات...</p>
          </div>
        ) : requirements.length === 0 ? (
          <div className="bg-green-50 p-8 rounded-[24px] text-center border border-green-100">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h3 className="font-bold text-green-900">لا توجد تعهدات إضافية</h3>
            <p className="text-sm text-green-700">لهذه الفئة، لا توجد اشتراطات تشغيلية معقدة إضافية مسجلة في النظام.</p>
          </div>
        ) : (
          <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden flex flex-col max-h-[60vh]">
            
            {/* Header of List */}
            <div className="bg-gray-50 px-8 py-4 border-b border-gray-100 flex justify-between items-center">
              <span className="font-bold text-gray-700 text-sm">قائمة المتطلبات ({requirements.length})</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md font-bold">فئة {stars} نجوم</span>
            </div>

            {/* Scrollable List */}
            <div className="overflow-y-auto p-6 space-y-3 custom-scrollbar">
              {requirements.map((req, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:border-ukra-gold/30 hover:bg-gray-50 transition group">
                  <div className="mt-1 bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                    {getIcon(req.description)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                        {req.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 font-bold leading-relaxed group-hover:text-ukra-navy transition-colors">
                      {req.description}
                    </p>
                  </div>

                  <div className="mt-2">
                    <CheckCircle2 className="w-5 h-5 text-gray-200 group-hover:text-green-500 transition-colors" />
                  </div>
                </div>
              ))}
            </div>

            {/* Acknowledgment Checkbox */}
            <div className="bg-gray-50 p-6 border-t border-gray-100">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox" 
                    className="peer sr-only" 
                    checked={acknowledged}
                    onChange={(e) => setAcknowledged(e.target.checked)}
                  />
                  <div className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all duration-300 ${acknowledged ? 'bg-ukra-navy border-ukra-navy' : 'bg-white border-gray-300 group-hover:border-ukra-navy'}`}>
                    <Check className={`w-4 h-4 text-white transition-transform duration-200 ${acknowledged ? 'scale-100' : 'scale-0'}`} />
                  </div>
                </div>
                <div>
                  <span className={`font-bold text-sm block mb-1 transition-colors ${acknowledged ? 'text-ukra-navy' : 'text-gray-700'}`}>
                    أقر بأنني اطلعت على كافة الاشتراطات التشغيلية والنظامية أعلاه
                  </span>
                  <span className="text-xs text-gray-500 block">
                    أتعهد بالعمل على توفيرها لضمان استخراج رخصة التشغيل للفندق.
                  </span>
                </div>
              </label>
            </div>

          </div>
        )}
      </div>

      {/* Navigation Actions */}
      <div className="max-w-4xl mx-auto flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
        <button 
          onClick={onBack}
          className="text-gray-500 font-bold hover:text-ukra-navy transition flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowRight className="w-5 h-5" /> خطوة 1: الهيكل
        </button>
        
        <button 
          onClick={onNext}
          disabled={!acknowledged && requirements.length > 0}
          className={`flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white transition shadow-lg ${
            (acknowledged || requirements.length === 0)
              ? 'bg-ukra-navy hover:bg-ukra-navy/90 hover:shadow-xl transform hover:-translate-y-0.5' 
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          إصدار التقرير وعرض السعر <Check className="w-5 h-5" />
        </button>
      </div>

    </div>
  );
};