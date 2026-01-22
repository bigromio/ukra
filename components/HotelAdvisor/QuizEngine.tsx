import React, { useState, useEffect } from 'react';
import { AdvisorQuestion, UserAnswer, UnitDefinition, AdvisorPhase } from '../../types';
import { 
  CheckCircle2, AlertTriangle, ArrowLeft, 
  HelpCircle, Building2, ShieldCheck, Sofa, 
  Check, X
} from 'lucide-react';
import { UnitBuilder } from './UnitBuilder';

interface QuizEngineProps {
  questions: AdvisorQuestion[];
  phase: AdvisorPhase;
  onPhaseComplete: (answers: UserAnswer[]) => void;
  onBack: () => void;
}

export const QuizEngine: React.FC<QuizEngineProps> = ({ 
  questions, phase, onPhaseComplete, onBack 
}) => {
  // --- State ---
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [feedback, setFeedback] = useState<'SUCCESS' | 'WARNING' | null>(null);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);

  // السؤال الحالي
  const currentQuestion = questions[currentIndex];
  
  // نسبة التقدم في هذه المرحلة
  const progress = questions.length > 0 ? ((currentIndex) / questions.length) * 100 : 0;

  // عند تغيير المرحلة، نعيد تصفير العدادات
  useEffect(() => {
    setCurrentIndex(0);
    setAnswers([]);
    setFeedback(null);
  }, [phase]);

  // --- Handlers ---

  const handleAnswer = (value: boolean) => {
    // 1. هل الإجابة تحقق الامتثال؟
    // إذا كان إلزامي: نعم = ممتثل، لا = غير ممتثل
    // إذا كان اختياري: نعم = ممتثل (نقاط)، لا = ممتثل (لكن بدون نقاط)
    const isCompliant = currentQuestion.isMandatory ? value === true : true;

    // 2. تحديد نوع التنبيه
    if (currentQuestion.isMandatory && !value) {
      // إجابة "لا" على سؤال إلزامي -> تحذير
      setFeedback('WARNING');
      return; // نوقف التنقل لنعطي المستخدم فرصة للتراجع أو التأكيد
    } 

    // إجابة إيجابية أو اختيارية -> نجاح
    if (value) {
        setFeedback('SUCCESS');
    }
    
    // حفظ وانتقال
    saveAndNext(value, isCompliant);
  };

  const saveAndNext = (value: any, isCompliant: boolean) => {
    const newAnswer: UserAnswer = {
      questionId: currentQuestion.id,
      value: value,
      isCompliant: isCompliant
    };

    setAnswers(prev => [...prev, newAnswer]);

    // تأخير بسيط لرؤية التنبيه (إن وجد) ثم الانتقال
    setTimeout(() => {
      setFeedback(null);
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        // انتهت الأسئلة في هذه المرحلة -> نرسل الإجابات للأب
        onPhaseComplete([...answers, newAnswer]);
      }
    }, feedback === 'SUCCESS' ? 1000 : 300); // تأخير أطول قليلاً للنجاح
  };

  // معالجة إضافة الوحدات (من UnitBuilder)
  const handleUnitSave = (unit: UnitDefinition) => {
    setIsUnitModalOpen(false);
    setFeedback('SUCCESS');
    // نعتبر إضافة الوحدة بمثابة إجابة "نعم" + بيانات الوحدة
    saveAndNext([unit], true); 
  };

  // بيانات رأس الصفحة حسب المرحلة
  const getPhaseHeader = () => {
    switch(phase) {
      case 'CONSTRUCTION': 
        return { title: 'المرحلة الأولى: التأسيس العمراني', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' };
      case 'REGULATORY': 
        return { title: 'المرحلة الثانية: التأسيس النظامي', icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-50' };
      case 'FURNISHING': 
        return { title: 'المرحلة الثالثة: الفرش والتجهيز', icon: Sofa, color: 'text-amber-600', bg: 'bg-amber-50' };
      default: 
        return { title: 'الاستبيان', icon: HelpCircle, color: 'text-gray-600', bg: 'bg-gray-50' };
    }
  };

  const header = getPhaseHeader();

  // حالة التحميل أو عدم وجود أسئلة
  if (!currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-gray-500">جاري تحميل أسئلة المرحلة...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-4 px-4 font-cairo animate-in fade-in slide-in-from-right duration-500">
      
      {/* 1. Header & Progress */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-5">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${header.bg} ${header.color}`}>
            <header.icon className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-ukra-navy">{header.title}</h2>
            <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
              <span>سؤال {currentIndex + 1} من {questions.length}</span>
              {currentQuestion.isMandatory && (
                <span className="bg-red-50 text-red-600 text-[10px] px-2 py-0.5 rounded-full font-bold border border-red-100">إلزامي</span>
              )}
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-gradient-to-l from-ukra-gold to-ukra-navy transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>

      {/* 2. Question Card */}
      <div className="bg-white rounded-[32px] p-8 md:p-10 shadow-xl border border-gray-100 relative overflow-hidden min-h-[420px] flex flex-col justify-center">
        
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full -mr-16 -mt-16 opacity-50 pointer-events-none"></div>

        {/* Question Text */}
        <div className="mb-10 text-center relative z-10">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-800 leading-relaxed mb-4">
            {currentQuestion.text}
          </h3>
          <p className="text-gray-400 text-sm">
             {currentQuestion.answerType === 'UNIT_SELECTION' 
               ? 'يتطلب هذا البند إضافة وحدات للمخطط' 
               : 'يرجى الإجابة بناءً على الوضع الحالي للمشروع'}
          </p>
        </div>

        {/* Interaction Buttons */}
        <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto w-full relative z-10">
          {currentQuestion.answerType === 'UNIT_SELECTION' ? (
             <button 
               onClick={() => setIsUnitModalOpen(true)}
               className="col-span-2 bg-ukra-navy text-white py-5 rounded-2xl font-bold text-lg hover:bg-ukra-navy/90 transition shadow-lg hover:shadow-xl flex items-center justify-center gap-3 group"
             >
               <Building2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
               إضافة الوحدات المطلوبة
             </button>
          ) : (
            <>
              <button 
                onClick={() => handleAnswer(false)}
                className="py-5 rounded-2xl font-bold text-lg border-2 border-gray-100 text-gray-500 hover:border-red-100 hover:bg-red-50 hover:text-red-600 transition flex items-center justify-center gap-2 group"
              >
                <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
                لا / غير متوفر
              </button>
              <button 
                onClick={() => handleAnswer(true)}
                className="py-5 rounded-2xl font-bold text-lg bg-ukra-navy text-white hover:bg-ukra-navy/90 transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
              >
                <Check className="w-5 h-5 group-hover:scale-110 transition-transform" />
                نعم / متوفر
              </button>
            </>
          )}
        </div>

        {/* 3. Feedback Overlay (Toast) */}
        {feedback && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center animate-in fade-in duration-200">
            {feedback === 'SUCCESS' ? (
              <div className="text-center animate-in zoom-in duration-300">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 shadow-sm">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-green-800">ممتاز!</h3>
                <p className="text-green-600 font-medium mt-2">تم تسجيل الامتثال لهذا البند ✅</p>
              </div>
            ) : (
              <div className="text-center animate-in zoom-in duration-300 px-6 max-w-md">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 shadow-sm">
                  <AlertTriangle className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-red-800 mb-2">تنبيه هام ⚠️</h3>
                <p className="text-red-600 font-medium mb-6 leading-relaxed">
                  هذا الاشتراط <b>إلزامي</b> للحصول على الترخيص. عدم توفيره سيؤثر على تقييم المشروع.
                </p>
                <div className="flex gap-3 justify-center">
                   <button 
                     onClick={() => saveAndNext(false, false)} // تأكيد الرفض (تجاوز)
                     className="px-6 py-3 rounded-xl border border-gray-300 text-gray-500 font-bold hover:bg-gray-50 transition"
                   >
                     تجاوز (غير متوفر)
                   </button>
                   <button 
                     onClick={() => setFeedback(null)} // عودة
                     className="px-6 py-3 rounded-xl bg-ukra-navy text-white font-bold hover:bg-ukra-navy/90 transition shadow-md"
                   >
                     تراجع (سأقوم بتوفيره)
                   </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Footer Navigation */}
      <div className="mt-8 text-center">
        <button 
          onClick={onBack} 
          className="text-gray-400 font-bold hover:text-ukra-navy flex items-center justify-center gap-2 mx-auto transition text-sm py-2 px-4 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" /> خروج مؤقت / عودة
        </button>
      </div>

      {/* Unit Builder Modal */}
      {isUnitModalOpen && (
        <UnitBuilder 
          onSave={handleUnitSave} 
          onCancel={() => setIsUnitModalOpen(false)} 
        />
      )}

    </div>
  );
};