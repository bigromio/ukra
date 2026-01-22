import React, { useState, useEffect, useCallback } from 'react';
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
  mandatoryUnitTypes: string[];
  onPhaseComplete: (answers: UserAnswer[]) => void;
  onBack: () => void;
}

export const QuizEngine: React.FC<QuizEngineProps> = ({ 
  questions, phase, mandatoryUnitTypes, onPhaseComplete, onBack 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [feedback, setFeedback] = useState<'SUCCESS' | 'WARNING' | null>(null);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex) / questions.length) * 100 : 0;

  // إعادة التعيين عند تغيير المرحلة
  useEffect(() => {
    setCurrentIndex(0);
    setAnswers([]);
    setFeedback(null);
    setIsUnitModalOpen(false);
  }, [phase]);

  // --- المنطق الأساسي للحفظ والانتقال ---
  
  // نستخدم useCallback لضمان ثبات الدالة
  const proceedToNext = useCallback((newAnswersList: UserAnswer[]) => {
    // إخفاء أي تنبيهات
    setFeedback(null);
    
    if (currentIndex < questions.length - 1) {
      // الانتقال للسؤال التالي
      setCurrentIndex(prev => prev + 1);
    } else {
      // انتهت الأسئلة -> إرسال الإجابات للأب
      onPhaseComplete(newAnswersList);
    }
  }, [currentIndex, questions.length, onPhaseComplete]);

  const saveAndNext = (value: any, isCompliant: boolean, delay: number = 500) => {
    const newAnswer: UserAnswer = {
      questionId: currentQuestion.id,
      value: value,
      isCompliant: isCompliant
    };

    // تحديث الإجابات محلياً
    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);

    // تأخير بسيط لعرض رسالة النجاح ثم الانتقال
    setTimeout(() => {
      proceedToNext(updatedAnswers);
    }, delay);
  };

  // --- معالجة الإجابات ---

  // 1. إجابة نعم/لا
  const handleAnswer = (value: boolean) => {
    if (currentQuestion.isMandatory && !value) {
      setFeedback('WARNING'); // إجابة مرفوضة (لأنه إلزامي)
      return; 
    } 

    if (value) setFeedback('SUCCESS');
    saveAndNext(value, true, value ? 1000 : 300); // تأخير أطول قليلاً عند النجاح
  };

  // 2. إجابة اختيار الوحدات (Unit Builder)
  const handleUnitSave = (units: UnitDefinition[]) => {
    // 1. إغلاق النافذة فوراً
    setIsUnitModalOpen(false);

    // 2. التحقق من وجود وحدات
    if (units.length > 0) {
      // 3. عرض رسالة نجاح وانتقال
      setFeedback('SUCCESS');
      saveAndNext(units, true, 800);
    } else {
      // إذا عاد بدون وحدات وكان السؤال إلزامياً
      if (currentQuestion.isMandatory) {
        setFeedback('WARNING');
      }
    }
  };

  // --- الواجهة ---

  const getPhaseHeader = () => {
    switch(phase) {
      case 'CONSTRUCTION': return { title: 'المرحلة الأولى: التأسيس العمراني', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' };
      case 'REGULATORY': return { title: 'المرحلة الثانية: التأسيس النظامي', icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-50' };
      case 'FURNISHING': return { title: 'المرحلة الثالثة: الفرش والتجهيز', icon: Sofa, color: 'text-amber-600', bg: 'bg-amber-50' };
      default: return { title: 'الاستبيان', icon: HelpCircle, color: 'text-gray-600', bg: 'bg-gray-50' };
    }
  };

  const header = getPhaseHeader();

  if (!currentQuestion) return <div className="p-10 text-center text-gray-400">جاري تحميل الأسئلة...</div>;

  return (
    <div className="max-w-3xl mx-auto py-4 px-4 font-cairo animate-in fade-in slide-in-from-right duration-500">
      
      {/* Header */}
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
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
          <div className="h-full bg-gradient-to-l from-ukra-gold to-ukra-navy transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-[32px] p-8 md:p-10 shadow-xl border border-gray-100 relative overflow-hidden min-h-[420px] flex flex-col justify-center">
        
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
               className="col-span-2 bg-ukra-navy text-white py-5 rounded-2xl font-bold text-lg hover:bg-ukra-navy/90 transition shadow-lg flex items-center justify-center gap-3"
             >
               <Building2 className="w-6 h-6" /> إضافة وتحديد الوحدات
             </button>
          ) : (
            <>
              <button onClick={() => handleAnswer(false)} className="py-5 rounded-2xl font-bold text-lg border-2 border-gray-100 text-gray-500 hover:border-red-100 hover:bg-red-50 hover:text-red-600 transition flex items-center justify-center gap-2">
                <X className="w-5 h-5" /> لا / غير متوفر
              </button>
              <button onClick={() => handleAnswer(true)} className="py-5 rounded-2xl font-bold text-lg bg-ukra-navy text-white hover:bg-ukra-navy/90 transition shadow-lg flex items-center justify-center gap-2">
                <Check className="w-5 h-5" /> نعم / متوفر
              </button>
            </>
          )}
        </div>

        {/* Feedback Overlay */}
        {feedback && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center animate-in fade-in duration-200">
            {feedback === 'SUCCESS' ? (
              <div className="text-center animate-in zoom-in duration-300">
                <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-green-800">ممتاز!</h3>
                <p className="text-green-600 font-medium mt-2">تم تسجيل الامتثال ✅</p>
              </div>
            ) : (
              <div className="text-center animate-in zoom-in duration-300 px-6 max-w-md">
                <AlertTriangle className="w-20 h-20 text-red-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-red-800 mb-2">تنبيه هام ⚠️</h3>
                <p className="text-red-600 font-medium mb-6">هذا الاشتراط إلزامي للحصول على الترخيص.</p>
                <div className="flex gap-3 justify-center">
                   <button onClick={() => saveAndNext(false, false, 300)} className="px-6 py-2 border rounded-lg hover:bg-gray-50">تجاوز</button>
                   <button onClick={() => setFeedback(null)} className="px-6 py-2 bg-ukra-navy text-white rounded-lg">تراجع</button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      <div className="mt-8 text-center">
        <button onClick={onBack} className="text-gray-400 hover:text-ukra-navy text-sm flex items-center justify-center gap-2 mx-auto"><ArrowLeft className="w-4 h-4" /> خروج مؤقت</button>
      </div>

      {/* Unit Builder Modal */}
      {isUnitModalOpen && (
        <UnitBuilder 
          onSave={handleUnitSave} 
          onCancel={() => setIsUnitModalOpen(false)} 
          mandatoryTypes={mandatoryUnitTypes} // تمرير الإلزاميات
        />
      )}
    </div>
  );
};