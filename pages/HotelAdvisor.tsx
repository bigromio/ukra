import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { AdvisorWelcome } from '../components/HotelAdvisor/AdvisorWelcome';
import { QuizEngine } from '../components/HotelAdvisor/QuizEngine';
import { AdvisorResult } from '../components/HotelAdvisor/AdvisorResult';
import { getAdvisorQuestions, getMandatoryUnitTypes } from '../services/advisorService'; // تأكد من استيراد الدالة الجديدة
import { AdvisorQuestion, UserAnswer, AdvisorPhase, UnitDefinition } from '../types';
import { Loader2 } from 'lucide-react';

export const HotelAdvisor = () => {
  const { dir } = useLanguage();

  const [view, setView] = useState<'WELCOME' | 'QUIZ' | 'RESULT'>('WELCOME');
  const [loading, setLoading] = useState(false);
  
  const [stars, setStars] = useState(3);
  const [allQuestions, setAllQuestions] = useState<AdvisorQuestion[]>([]);
  const [currentPhase, setCurrentPhase] = useState<AdvisorPhase>('CONSTRUCTION');
  const [mandatoryUnitTypes, setMandatoryUnitTypes] = useState<string[]>([]); // حالة جديدة لقائمة الإلزاميات
  
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [units, setUnits] = useState<UnitDefinition[]>([]);

  // 1. بدء الرحلة
  const startJourney = async (selectedStars: number) => {
    setLoading(true);
    try {
      setStars(selectedStars);
      
      // جلب الأسئلة + الوحدات الإلزامية في نفس الوقت
      const [questions, mandatoryTypes] = await Promise.all([
        getAdvisorQuestions(selectedStars),
        getMandatoryUnitTypes(selectedStars)
      ]);

      setAllQuestions(questions);
      setMandatoryUnitTypes(mandatoryTypes); // حفظ الإلزاميات
      
      setCurrentPhase('CONSTRUCTION');
      setUserAnswers([]);
      setUnits([]);
      setView('QUIZ');
    } catch (error) {
      console.error("Failed to start journey:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhaseComplete = (phaseAnswers: UserAnswer[]) => {
    const updatedAnswers = [...userAnswers, ...phaseAnswers];
    setUserAnswers(updatedAnswers);

    const newUnits: UnitDefinition[] = [];
    phaseAnswers.forEach(ans => {
      if (Array.isArray(ans.value) && ans.value.length > 0 && 'type' in ans.value[0]) {
        newUnits.push(...ans.value);
      }
    });
    
    if (newUnits.length > 0) {
      setUnits(prev => [...prev, ...newUnits]);
    }

    if (currentPhase === 'CONSTRUCTION') {
      setCurrentPhase('REGULATORY');
    } else if (currentPhase === 'REGULATORY') {
      setCurrentPhase('FURNISHING');
    } else {
      setView('RESULT');
    }
  };

  const handleReset = () => {
    setStars(3);
    setUserAnswers([]);
    setUnits([]);
    setAllQuestions([]);
    setCurrentPhase('CONSTRUCTION');
    setView('WELCOME');
  };

  const handleBack = () => {
    if (view === 'RESULT') {
      setCurrentPhase('FURNISHING');
      setView('QUIZ');
    } else if (view === 'QUIZ') {
      if (currentPhase === 'FURNISHING') setCurrentPhase('REGULATORY');
      else if (currentPhase === 'REGULATORY') setCurrentPhase('CONSTRUCTION');
      else setView('WELCOME');
    }
  };

  const phaseQuestions = allQuestions.filter(q => q.phase === currentPhase);

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20 px-4 font-cairo" dir={dir}>
      <div className="max-w-7xl mx-auto">
        
        {loading && (
          <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-ukra-navy animate-spin mb-3" />
            <p className="text-gray-600 font-bold">جاري إعداد المستشار الذكي...</p>
          </div>
        )}

        {view === 'WELCOME' && (
          <AdvisorWelcome onStart={startJourney} />
        )}

        {view === 'QUIZ' && (
          <QuizEngine 
            key={currentPhase}
            questions={phaseQuestions}
            phase={currentPhase}
            mandatoryUnitTypes={mandatoryUnitTypes} // تمرير الإلزاميات للكويز
            onPhaseComplete={handlePhaseComplete}
            onBack={handleBack}
          />
        )}

        {view === 'RESULT' && (
          <AdvisorResult 
            stars={stars}
            units={units}
            answers={userAnswers}
            onBack={handleBack}
            onReset={handleReset}
          />
        )}

      </div>
    </div>
  );
};