import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, FileDown, ArrowRight, 
  Building2, Wallet, Loader2, 
  RefreshCcw, Phone, FileText, Share2 
} from 'lucide-react';
import { UnitDefinition } from '../../types';
// سنقوم بتحديث ملف الخدمة لاحقاً ليحتوي على هذه الدالة
import { getExecutiveSummary } from '../../services/advisorService'; 
// نفترض وجود دالة توليد PDF (يمكننا استبدالها بتنبيه مؤقت)
import { generateAdvisorPDF } from '../../utils/pdfGenerator'; 

interface AdvisorResultProps {
  stars: number;
  units: UnitDefinition[];
  onBack: () => void;
  onReset: () => void;
}

export const AdvisorResult: React.FC<AdvisorResultProps> = ({ 
  stars, units, onBack, onReset 
}) => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);

  // حساب التكلفة والملخص عند تحميل الصفحة
  useEffect(() => {
    const calculateResults = async () => {
      setLoading(true);
      try {
        // سنفعل هذا السطر في الخطوة القادمة عند تحديث ملف الخدمة
        // const result = await getExecutiveSummary(units, stars, 'Med'); 
        
        // حالياً: محاكاة لنتيجة الحساب لتجربة الواجهة
        const mockTotal = units.reduce((acc, u) => acc + (u.quantity * 15000), 0); 
        
        setSummary({
          totalEstimated: mockTotal,
          totalKeys: units.reduce((acc, u) => acc + u.quantity, 0),
          compliance: 100
        });
      } catch (error) {
        console.error("Calculation error", error);
      } finally {
        setLoading(false);
      }
    };
    
    // تأخير بسيط لمحاكاة المعالجة
    setTimeout(calculateResults, 1500);
  }, [units, stars]);

  const handleDownloadPDF = async () => {
    if (!summary) return;
    try {
      // هنا يتم استدعاء دالة توليد التقرير
      // await generateAdvisorPDF(summary, units, stars);
      alert("سيتم تحميل تقرير BOQ التفصيلي الآن بصيغة PDF...");
    } catch (e) {
      alert("حدث خطأ أثناء إنشاء الملف");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center font-cairo animate-in fade-in">
        <Loader2 className="w-12 h-12 text-ukra-navy animate-spin mb-4" />
        <h3 className="text-xl font-bold text-gray-800">جاري تحليل البيانات وحساب الكميات...</h3>
        <p className="text-gray-500 mt-2">يقوم النظام الآن بمطابقة وحداتك مع منتجات أوكرة وقاعدة بيانات الأسعار</p>
      </div>
    );
  }

  return (
    <div className="font-cairo animate-in slide-in-from-bottom duration-700 pb-10">
      
      {/* Success Banner */}
      <div className="bg-green-50 rounded-[32px] p-8 text-center border border-green-100 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 rounded-full blur-2xl -mr-10 -mt-10 opacity-60"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-ukra-gold/20 rounded-full blur-xl -ml-10 -mb-10 opacity-60"></div>
        
        <div className="relative z-10">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-green-500">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold text-ukra-navy mb-2">اكتملت خطة مشروعك بنجاح!</h2>
          <p className="text-gray-600 max-w-lg mx-auto">
            بناءً على المعطيات، فإن مخططك يمتثل لاشتراطات فئة 
            <span className="font-bold mx-1 text-ukra-navy">{stars} نجوم</span>
            بنسبة <span className="font-bold text-green-600">100%</span>
          </p>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        
        {/* Card 1: Units Summary */}
        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center text-blue-600">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-400 text-xs font-bold uppercase">إجمالي الوحدات</p>
            <p className="text-2xl font-bold text-ukra-navy">{summary?.totalKeys} <span className="text-sm font-normal text-gray-400">وحدة</span></p>
          </div>
        </div>

        {/* Card 2: Estimated Cost */}
        <div className="bg-ukra-navy p-6 rounded-[24px] shadow-lg border border-ukra-navy text-white flex items-center gap-4 col-span-1 md:col-span-2 relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-1/2 bg-white/5 skew-x-12 transform translate-x-10"></div>
          <div className="bg-white/10 w-12 h-12 rounded-xl flex items-center justify-center text-ukra-gold backdrop-blur-sm">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-ukra-gold text-xs font-bold uppercase mb-1">التكلفة التقديرية للتأثيث (مفتاح)</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl md:text-4xl font-bold tracking-tight">
                {summary?.totalEstimated?.toLocaleString()} 
              </p>
              <span className="text-sm opacity-80">ريال سعودي</span>
            </div>
            <p className="text-[10px] opacity-60 mt-1">* تشمل الأثاث، المراتب، وتجهيزات المرافق الأساسية (تقديري)</p>
          </div>
        </div>
      </div>

      {/* Action Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left: Next Steps */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-ukra-gold" />
            الخطوات التالية
          </h3>
          
          <button 
            onClick={handleDownloadPDF}
            className="w-full bg-white border-2 border-ukra-navy text-ukra-navy py-4 rounded-xl font-bold hover:bg-gray-50 transition flex items-center justify-center gap-3 group"
          >
            <FileDown className="w-5 h-5 group-hover:scale-110 transition-transform" />
            تحميل تقرير الكميات والمواصفات (PDF)
          </button>

          <button className="w-full bg-ukra-gold text-ukra-navy py-4 rounded-xl font-bold hover:bg-yellow-500 transition shadow-md flex items-center justify-center gap-3">
            <Phone className="w-5 h-5" />
            طلب عرض سعر نهائي من أوكرة
          </button>
        </div>

        {/* Right: What's Included */}
        <div className="bg-gray-50 rounded-[24px] p-6 border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4 text-sm">ماذا يشمل هذا التقرير؟</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-sm text-gray-600">
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>قائمة تفصيلية بالأثاث والمعدات المطلوبة لكل غرفة (سرير، مراتب، كراسي، إلخ).</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-gray-600">
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>تجهيزات المناطق العامة (الاستقبال، المطعم، الكوفي شوب).</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-gray-600">
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>المواصفات الفنية المعتمدة من وزارة السياحة لكل قطعة.</span>
            </li>
          </ul>
        </div>

      </div>

      {/* Restart Link */}
      <div className="text-center mt-12">
        <button 
          onClick={onReset}
          className="text-gray-400 text-sm hover:text-ukra-navy flex items-center justify-center gap-2 mx-auto transition"
        >
          <RefreshCcw className="w-4 h-4" />
          البدء من جديد (مشروع آخر)
        </button>
      </div>

    </div>
  );
};