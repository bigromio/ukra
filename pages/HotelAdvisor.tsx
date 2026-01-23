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
  const { dir } = useLanguage();

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