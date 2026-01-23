import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { AdvisorWelcome } from '../components/HotelAdvisor/AdvisorWelcome';
import { StructureStep } from '../components/HotelAdvisor/StructureStep';
import { ComplianceStep } from '../components/HotelAdvisor/ComplianceStep';
import { AdvisorResult } from '../components/HotelAdvisor/AdvisorResult';
import { UnitDefinition, UserAnswer } from '../types';
import { generateDefaultUnits } from '../services/advisorService';

// تعريف مراحل الرحلة الجديدة
type AdvisorStep = 'WELCOME' | 'STRUCTURE' | 'COMPLIANCE' | 'RESULT';

export const HotelAdvisor = () => {
  const { dir } = useLanguage();

  // حالة التنقل بين الخطوات
  const [currentStep, setCurrentStep] = useState<AdvisorStep>('WELCOME');
  
  // البيانات الأساسية للمشروع
  const [stars, setStars] = useState(3);
  const [units, setUnits] = useState<UnitDefinition[]>([]);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);

  // 1. الانتقال من الترحيب إلى التكوين
  const handleStart = (selectedStars: number) => {
    setStars(selectedStars);
    // نولد الوحدات الافتراضية فوراً عند البدء
    const defaults = generateDefaultUnits(selectedStars);
    setUnits(defaults);
    setCurrentStep('STRUCTURE');
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