import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { AdvisorWelcome } from '../components/HotelAdvisor/AdvisorWelcome';
import { StructureStep } from '../components/HotelAdvisor/StructureStep';
import { ComplianceStep } from '../components/HotelAdvisor/ComplianceStep';
import { AdvisorResult } from '../components/HotelAdvisor/AdvisorResult';
import { UnitDefinition, UserAnswer } from '../types';
import { generateDefaultUnits } from '../services/advisorService';
import { Loader2 } from 'lucide-react'; // إضافة أيقونة التحميل

// تعريف مراحل الرحلة الجديدة
type AdvisorStep = 'WELCOME' | 'STRUCTURE' | 'COMPLIANCE' | 'RESULT';

export const HotelAdvisor = () => {
  const { t, dir } = useLanguage();

  // --- خاصية الإيقاف المؤقت (تحت التطوير) ---
  const isUnderDevelopment = true; // يمكنك تغييرها لاحقاً إلى false لتشغيل الصفحة

  if (isUnderDevelopment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-cairo" dir={dir}>
        <div className="bg-white p-10 rounded-2xl shadow-xl max-w-lg text-center border-t-4 border-ukra-gold animate-in zoom-in duration-500">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-ukra-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-ukra-navy mb-4">المستشار الفندقي الذكي</h2>
          <p className="text-gray-600 mb-8 text-lg leading-relaxed">
            هذه الخاصية حالياً تحت التطوير والتحديث لتزويدكم بتجربة استشارية استثنائية. ستكون متاحة قريباً!
          </p>
          <button onClick={() => window.history.back()} className="btn-main w-full">
            العودة للصفحة السابقة
          </button>
        </div>
      </div>
    );
  }

  // 👇 من هنا يبدأ الكود الأصلي الخاص بك (لا تحذف منه شيئاً)...
  // const [step, setStep] = useState(0); 
  // ... إلخ
  
  

  // حالة التنقل بين الخطوات
  const [currentStep, setCurrentStep] = useState<AdvisorStep>('WELCOME');
  const [loading, setLoading] = useState(false); // حالة التحميل
  
  // البيانات الأساسية للمشروع
  const [stars, setStars] = useState(3);
  const [units, setUnits] = useState<UnitDefinition[]>([]);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);

  // 1. الانتقال من الترحيب إلى التكوين (تم التصحيح هنا)
  const handleStart = async (selectedStars: number) => {
    setLoading(true);
    try {
      setStars(selectedStars);
      // استخدام await لأن الدالة تتصل بقاعدة البيانات
      const defaults = await generateDefaultUnits(selectedStars);
      setUnits(defaults);
      setCurrentStep('STRUCTURE');
    } catch (error) {
      console.error("Error generating units:", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. تحديث البيانات في خطوة الهيكلة
  const handleStructureUpdate = (newStars: number, newUnits: UnitDefinition[]) => {
    setStars(newStars);
    setUnits(newUnits);
    console.log("Units Updated:", newUnits.length);
  };

  // 3. الانتقال من التكوين إلى التعهدات
  const handleStructureNext = () => {
    setCurrentStep('COMPLIANCE');
  };

  // 4. العودة من التعهدات إلى التكوين
  const handleComplianceBack = () => {
    setCurrentStep('STRUCTURE');
  };

  // 5. إتمام التعهدات والانتقال للنتيجة
  const handleComplianceComplete = (complianceAnswers: UserAnswer[]) => {
    setAnswers(complianceAnswers);
    setCurrentStep('RESULT');
  };

  // 6. العودة من النتيجة (للمراجعة)
  const handleResultBack = () => {
    setCurrentStep('COMPLIANCE');
  };

  // 7. إعادة البدء من الصفر
  const handleReset = () => {
    setStars(3);
    setUnits([]);
    setAnswers([]);
    setCurrentStep('WELCOME');
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20 px-4 font-cairo" dir={dir}>
      <div className="max-w-7xl mx-auto">
        
        {loading && (
          <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-ukra-navy animate-spin mb-3" />
            <p className="text-gray-600 font-bold">جاري تكوين الوحدات الافتراضية...</p>
          </div>
        )}

        {/* Step 1: Welcome Screen */}
        {currentStep === 'WELCOME' && (
          <AdvisorWelcome onStart={handleStart} />
        )}

        {/* Step 2: Structure Configuration (One-Page Configurator) */}
        {currentStep === 'STRUCTURE' && (
          <StructureStep 
            stars={stars}
            units={units}
            onUpdate={handleStructureUpdate}
            onNext={handleStructureNext}
          />
        )}

        {/* Step 3: Compliance & Furnishing Pledge */}
        {currentStep === 'COMPLIANCE' && (
          <ComplianceStep 
            stars={stars}
            units={units}
            onBack={handleComplianceBack}
            onComplete={handleComplianceComplete}
          />
        )}

        {/* Step 4: Final Results & BOQ */}
        {currentStep === 'RESULT' && (
          <AdvisorResult 
            stars={stars}
            units={units}
            answers={answers}
            onBack={handleResultBack}
            onReset={handleReset}
          />
        )}

      </div>
    </div>
  );
};