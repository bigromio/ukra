import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Sofa, CheckCircle2, 
  ArrowLeft, ArrowRight, FileCheck, 
  Calculator, Loader2, Info
} from 'lucide-react';
import { UnitDefinition, UserAnswer } from '../../types';
import { 
  getOperationalStandards, 
  getFurnishingStandards, 
  calculateEstimatedCost 
} from '../../services/advisorService';

interface ComplianceStepProps {
  stars: number;
  units: UnitDefinition[];
  onBack: () => void;
  onComplete: (answers: UserAnswer[], costResult?: { total: number; breakdown: any[] }) => void;
}

export const ComplianceStep: React.FC<ComplianceStepProps> = ({ 
  stars, units, onBack, onComplete 
}) => {
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  
  // البيانات
  const [opsStandards, setOpsStandards] = useState<string[]>([]);
  const [furnStandards, setFurnStandards] = useState<string[]>([]);

  // اختيارات العميل
  const [opsConfirmed, setOpsConfirmed] = useState(false);
  const [wantUkraFurniture, setWantUkraFurniture] = useState<boolean | null>(null);

  // تحميل المعايير عند البدء
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [ops, furn] = await Promise.all([
        getOperationalStandards(stars),
        getFurnishingStandards(stars)
      ]);
      setOpsStandards(ops);
      setFurnStandards(furn);
      setLoading(false);
    };
    loadData();
  }, [stars]);

  // إنهاء العملية
  const handleFinish = async () => {
    if (!opsConfirmed || wantUkraFurniture === null) return;

    setCalculating(true);

    // 1. بناء إجابات وهمية (Implicit Answers) لغرض التقرير
    // نعتبر أن العميل وافق على كل المعايير التشغيلية
    const implicitAnswers: UserAnswer[] = opsStandards.map((std, idx) => ({
      questionId: `OPS_${idx}`,
      value: true,
      isCompliant: true
    }));

    // 2. حساب التكلفة إذا اختار أوكرة
    let costResult = undefined;
    if (wantUkraFurniture) {
      // محاكاة تأخير بسيط للحساب لإعطاء شعور بالمعالجة
      await new Promise(r => setTimeout(r, 1500));
      costResult = await calculateEstimatedCost(units, stars);
    }

    onComplete(implicitAnswers, costResult);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-ukra-navy animate-spin mb-4" />
        <p className="text-gray-500">جاري جلب اشتراطات وزارة السياحة...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-ukra-navy mb-3">الالتزام والمعايير</h2>
        <p className="text-gray-500 max-w-lg mx-auto">
          للحصول على رخصة {stars} نجوم، يجب تحقيق المتطلبات التشغيلية ومواصفات التأثيث التالية.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        
        {/* Card 1: Operational Standards (The Pledge) */}
        <div className={`bg-white p-6 rounded-[32px] border-2 transition-all duration-300 ${opsConfirmed ? 'border-green-500 shadow-lg ring-4 ring-green-50' : 'border-gray-100 shadow-md'}`}>
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${opsConfirmed ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-ukra-navy'}`}>
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-800">المعايير التشغيلية</h3>
              <p className="text-xs text-gray-400">{opsStandards.length} معيار إلزامي</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 mb-6 h-40 overflow-y-auto custom-scrollbar text-sm text-gray-600 space-y-2">
            {opsStandards.slice(0, 5).map((std, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-ukra-navy shrink-0" />
                <span>{std}</span>
              </div>
            ))}
            {opsStandards.length > 5 && (
              <p className="text-xs text-gray-400 italic pt-2">+ {opsStandards.length - 5} معايير أخرى (مذكورة في التقرير)</p>
            )}
          </div>

          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-gray-50 transition border border-transparent hover:border-gray-200">
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${opsConfirmed ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
              {opsConfirmed && <CheckCircle2 className="w-4 h-4 text-white" />}
            </div>
            <input 
              type="checkbox" 
              className="hidden" 
              checked={opsConfirmed} 
              onChange={(e) => setOpsConfirmed(e.target.checked)} 
            />
            <span className="font-bold text-sm text-gray-700">أتعهد بالالتزام بتطبيق هذه المعايير</span>
          </label>
        </div>

        {/* Card 2: Furnishing (The Solution) */}
        <div className={`bg-white p-6 rounded-[32px] border-2 transition-all duration-300 ${wantUkraFurniture !== null ? 'border-ukra-gold shadow-lg' : 'border-gray-100 shadow-md'}`}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Sofa className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-800">مواصفات الفرش والتجهيز</h3>
              <p className="text-xs text-gray-400">{furnStandards.length} مواصفة فنية دقيقة</p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              تتطلب فئتك مواصفات خاصة للمراتب، الستائر، والأثاث (مثل: {furnStandards[0] || 'سماكة المرتبة'}...).
            </p>
            <div className="bg-ukra-navy/5 p-4 rounded-xl border border-ukra-navy/10">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-ukra-navy shrink-0 mt-0.5" />
                <p className="text-xs text-ukra-navy font-bold leading-relaxed">
                  نحن في أوكرة نمتلك "كتالوج الامتثال" الجاهز الذي يغطي جميع هذه الاشتراطات لفئة {stars} نجوم.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button 
              onClick={() => setWantUkraFurniture(true)}
              className={`w-full py-3 px-4 rounded-xl border-2 flex items-center justify-between transition-all ${wantUkraFurniture === true ? 'border-ukra-gold bg-orange-50 text-ukra-navy' : 'border-gray-200 hover:border-ukra-gold/50'}`}
            >
              <span className="font-bold text-sm">✅ اعتمد مواصفات أوكرة واحسب التكلفة</span>
              {wantUkraFurniture === true && <CheckCircle2 className="w-5 h-5 text-orange-500" />}
            </button>

            <button 
              onClick={() => setWantUkraFurniture(false)}
              className={`w-full py-3 px-4 rounded-xl border-2 flex items-center justify-between transition-all ${wantUkraFurniture === false ? 'border-gray-400 bg-gray-100 text-gray-700' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <span className="font-bold text-sm">❌ سأقوم بتوفير المواصفات بنفسي</span>
              {wantUkraFurniture === false && <CheckCircle2 className="w-5 h-5 text-gray-500" />}
            </button>
          </div>
        </div>

      </div>

      {/* Footer Actions */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-200">
        <button 
          onClick={onBack}
          className="text-gray-400 hover:text-ukra-navy font-bold flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
        >
          <ArrowRight className="w-5 h-5" />
          عودة للتكوين
        </button>

        <button 
          onClick={handleFinish}
          disabled={!opsConfirmed || wantUkraFurniture === null || calculating}
          className={`flex items-center gap-3 px-10 py-4 rounded-2xl font-bold text-white shadow-xl transition-all ${
            !opsConfirmed || wantUkraFurniture === null || calculating
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-ukra-navy hover:bg-ukra-navy/90 hover:scale-105'
          }`}
        >
          {calculating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>جاري تحليل البيانات وحساب التكلفة...</span>
            </>
          ) : (
            <>
              <span>{wantUkraFurniture ? 'حساب التكلفة وإصدار التقرير' : 'إصدار التقرير (بدون تسعير)'}</span>
              {wantUkraFurniture ? <Calculator className="w-5 h-5" /> : <FileCheck className="w-5 h-5" />}
            </>
          )}
        </button>
      </div>

    </div>
  );
};