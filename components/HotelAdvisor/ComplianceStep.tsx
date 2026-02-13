import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, CheckCircle2, Check,
  ArrowRight, Coins, ScrollText,
  Loader2, AlertTriangle
} from 'lucide-react';
import { UnitDefinition, UserAnswer } from '../../types';
import { calculateComprehensiveReport, RequirementItem } from '../../services/advisorService';

interface ComplianceStepProps {
  stars: number;
  units: UnitDefinition[];
  onBack: () => void;
  onComplete: (answers: UserAnswer[], reportData: any) => void;
}

export const ComplianceStep: React.FC<ComplianceStepProps> = ({ 
  stars, units, onBack, onComplete 
}) => {
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  
  // البيانات القادمة من الخدمة
  const [reqs, setReqs] = useState<{ op: RequirementItem[], const: RequirementItem[], proc: RequirementItem[] }>({ op: [], const: [], proc: [] });
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [fullReport, setFullReport] = useState<any>(null);
  
  // نظام النقاط
  const [score, setScore] = useState({ current: 0, required: 0 });
  
  // حالة التعهد والعرض
  const [pledgedAll, setPledgedAll] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // 1. تحميل البيانات وحساب التقرير المبدئي
  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        // استدعاء المخ (Service) لحساب كل شيء
        const report = await calculateComprehensiveReport(stars, units);
        
        setReqs({
          op: report.requirements.operational,
          const: report.requirements.construction,
          proc: report.requirements.procedural
        });
        setEstimatedCost(report.totalEstimatedCost);
        setFullReport(report); // نحتفظ بالنسخة الكاملة للخطوة القادمة
        
        // حساب نقاط تقريبي للعرض (Logic: Base + Units)
        // هذا مجرد عرض تشجيعي، الحساب الحقيقي في التقرير النهائي
        const basePoints = stars === 3 ? 250 : stars === 4 ? 400 : 600;
        const unitPoints = units.length * 15;
        const required = stars === 3 ? 360 : stars === 4 ? 520 : 700;

        setScore({
          current: Math.min(required + 50, basePoints + unitPoints), // لا نتجاوز المطلوب بكثير في العرض
          required: required
        });
        
      } catch (error) {
        console.error("Failed to load compliance data", error);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [stars, units]);

  const handleFinish = async () => {
    setCalculating(true);
    // محاكاة معالجة لإعطاء شعور بالعمل
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // إرسال موافقة عامة (Bulk Approval)
    // نستخدم as any لتجاوز تدقيق Typescript الصارم هنا كما اتفقنا
    const answers: UserAnswer[] = (reqs.op.concat(reqs.const).concat(reqs.proc)).map(r => ({
      questionId: r.id,
      value: true,
      isCompliant: true
    } as any));

    onComplete(answers, fullReport);
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin w-12 h-12 text-ukra-navy"/>
        <p className="text-gray-500 font-bold">جاري تحليل متطلبات الرخصة...</p>
      </div>
    );
  }

  // حساب نسبة التقدم للنقاط
  const progressPercent = Math.min(100, (score.current / score.required) * 100);
  const isPassing = score.current >= score.required;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      
      {/* 1. Scorecard Dashboard (لوحة القيادة) */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
        
        {/* قسم النقاط */}
        <div className="flex items-center gap-5 w-full md:w-auto">
          <div className="bg-ukra-navy text-white p-4 rounded-2xl text-center min-w-[110px] shadow-lg">
            <span className="block text-[10px] opacity-70 mb-1">الحد الأدنى للنقاط</span>
            <span className="text-3xl font-bold font-mono tracking-wider">{score.required}</span>
          </div>
          
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
              نقاطك المتوقعة
              {isPassing && <CheckCircle2 className="w-5 h-5 text-green-500" />}
            </h2>
            <div className="h-4 w-full md:w-64 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${isPassing ? 'bg-green-500' : 'bg-orange-400'}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs mt-1 font-bold text-gray-500">
              <span>0</span>
              <span className={isPassing ? 'text-green-600' : 'text-orange-500'}>{score.current} نقطة</span>
            </div>
          </div>
        </div>

        {/* قسم الميزانية التقديرية */}
        <div className="flex items-center gap-4 bg-blue-50/50 px-6 py-4 rounded-2xl border border-blue-100 w-full md:w-auto justify-between md:justify-start">
           <div className="text-right">
             <p className="text-xs text-gray-500 mb-1 font-medium">ميزانية التجهيز التقديرية</p>
             <div className="flex items-baseline gap-1 text-ukra-navy">
               <span className="text-2xl font-bold font-mono">{estimatedCost.toLocaleString()}</span>
               <span className="text-xs font-bold text-ukra-gold">ر.س</span>
             </div>
           </div>
           <div className="bg-white p-3 rounded-full shadow-sm text-ukra-gold">
             <Coins className="w-6 h-6" />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* العمود الأيمن: التعهد الذكي */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-8 shadow-lg border border-ukra-navy/5 relative overflow-hidden group hover:border-ukra-navy/20 transition-all">
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
            
            <h3 className="font-bold text-xl text-ukra-navy mb-4 flex items-center gap-3 relative z-10">
              <ShieldCheck className="w-7 h-7 text-green-600" />
              الالتزام بالاشتراطات المعيارية
            </h3>
            
            <div className="text-gray-600 text-sm leading-relaxed mb-8 relative z-10 space-y-2">
              <p>لإصدار رخصة <strong>{stars} نجوم</strong>، حددت الوزارة مجموعة من الاشتراطات:</p>
              <ul className="list-disc list-inside text-gray-500 pr-2">
                <li><strong>{reqs.const.length}</strong> متطلب هندسي وإنشائي (مساحات، ممرات...).</li>
                <li><strong>{reqs.op.length}</strong> متطلب تشغيلي وإداري (موظفين، سياسات...).</li>
              </ul>
            </div>

            {/* زر التعهد الموحد */}
            <button
              onClick={() => setPledgedAll(!pledgedAll)}
              className={`w-full p-5 rounded-2xl border-2 transition-all flex items-center gap-4 group relative overflow-hidden ${
                pledgedAll 
                  ? 'border-green-500 bg-green-50 text-green-900' 
                  : 'border-gray-200 hover:border-ukra-navy/30 bg-white'
              }`}
            >
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                pledgedAll ? 'border-green-600 bg-green-600 text-white scale-110' : 'border-gray-300'
              }`}>
                {pledgedAll && <Check className="w-5 h-5" />}
              </div>
              <div className="text-right">
                <span className="block font-bold text-lg">أقر بالاطلاع والالتزام</span>
                <span className="text-xs opacity-80">أتعهد بتوفير جميع المتطلبات اللازمة للتصنيف</span>
              </div>
            </button>

            {/* زر التفاصيل */}
            <div className="mt-6 border-t border-gray-100 pt-4 text-center">
              <button 
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs text-gray-400 hover:text-ukra-navy flex items-center justify-center gap-1 mx-auto transition-colors"
              >
                <ScrollText className="w-4 h-4" />
                {showDetails ? 'إخفاء القائمة التفصيلية' : 'مراجعة القائمة التفصيلية (للمختصين)'}
              </button>
            </div>

            {/* القائمة المنسدلة */}
            {showDetails && (
              <div className="mt-4 h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 bg-gray-50 rounded-xl p-4 border border-gray-100 animate-in fade-in slide-in-from-top-2">
                <h4 className="text-xs font-bold text-gray-400 mb-2">المتطلبات الإنشائية:</h4>
                {reqs.const.map((req, i) => (
                  <div key={`c-${i}`} className="flex items-start gap-2 text-[11px] text-gray-600 border-b border-gray-200/50 pb-2 mb-2 last:border-0">
                    <CheckCircle2 className="w-3 h-3 text-blue-400 mt-0.5 shrink-0" />
                    <span>{req.description}</span>
                  </div>
                ))}
                <h4 className="text-xs font-bold text-gray-400 mb-2 mt-4">المتطلبات التشغيلية:</h4>
                {reqs.op.map((req, i) => (
                  <div key={`o-${i}`} className="flex items-start gap-2 text-[11px] text-gray-600 border-b border-gray-200/50 pb-2 mb-2 last:border-0">
                    <CheckCircle2 className="w-3 h-3 text-orange-400 mt-0.5 shrink-0" />
                    <span>{req.description}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* العمود الأيسر: الإجراء النهائي */}
        <div className="space-y-6 flex flex-col justify-center">
          <div className="bg-gradient-to-br from-ukra-navy to-blue-900 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden text-center">
            
            <div className="absolute top-0 left-0 w-full h-full bg-white/5 opacity-30 pattern-grid"></div>
            
            <Coins className="w-16 h-16 text-ukra-gold mx-auto mb-6 opacity-90" />
            
            <h3 className="font-bold text-2xl mb-3">تقرير التجهيز الشامل (BOQ)</h3>
            <p className="text-white/70 text-sm mb-8 leading-relaxed px-4">
              سيقوم المستشار الذكي الآن بمعالجة مدخلاتك وإصدار:
              <br/>
              1. جداول الكميات والمواصفات (أثاث وتشغيل).
              <br/>
              2. قوائم المراجعة النهائية للتراخيص.
              <br/>
              3. تقرير الامتثال الفني.
            </p>

            <button 
              onClick={handleFinish}
              disabled={!pledgedAll || calculating}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all transform ${
                !pledgedAll || calculating
                  ? 'bg-white/10 text-white/50 cursor-not-allowed' 
                  : 'bg-ukra-gold text-ukra-navy hover:bg-white hover:scale-105'
              }`}
            >
              {calculating ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  جاري بناء التقرير...
                </>
              ) : (
                <>
                  <span>اعتماد وإصدار الجداول</span>
                  <ArrowRight className="w-6 h-6" />
                </>
              )}
            </button>
            
            {!pledgedAll && (
              <div className="mt-4 flex items-center justify-center gap-2 text-red-300 text-xs bg-red-900/30 py-2 rounded-lg animate-pulse">
                <AlertTriangle className="w-4 h-4" />
                <span>يجب الموافقة على تعهد الالتزام أولاً</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};