import React, { useState } from 'react';
import { Building2, ClipboardCheck, ShieldCheck, Clock, ArrowLeft, Star } from 'lucide-react';

interface AdvisorWelcomeProps {
  onStart: (stars: number) => void;
}

// تأكد من وجود كلمة 'export' قبل 'const'
export const AdvisorWelcome: React.FC<AdvisorWelcomeProps> = ({ onStart }) => {
  const [selectedStars, setSelectedStars] = useState<number>(3);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center font-cairo py-10 animate-in fade-in duration-700">
      
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto mb-8">
        <div className="bg-ukra-navy/5 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border border-ukra-navy/10 shadow-sm">
          <Building2 className="w-12 h-12 text-ukra-navy" />
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-ukra-navy mb-4 leading-tight">
          المستشار الفندقي الذكي
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          حدد تصنيف فندقك، وسنقوم بمحاورة تفاعلية للتحقق من امتثال مشروعك لاشتراطات وزارة السياحة وحساب تكلفة التأثيث.
        </p>
      </div>

      {/* Star Selection */}
      <div className="bg-white p-8 rounded-[32px] shadow-lg border border-gray-100 w-full max-w-2xl mb-10">
        <label className="block text-center text-gray-700 font-bold mb-6 text-lg">
          أولاً: ما هو تصنيف النجوم المستهدف للمشروع؟
        </label>
        <div className="flex justify-center gap-3 md:gap-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setSelectedStars(star)}
              className={`flex flex-col items-center justify-center w-16 h-20 md:w-20 md:h-24 rounded-2xl transition-all duration-300 ${
                selectedStars === star 
                  ? 'bg-ukra-navy text-ukra-gold shadow-xl scale-110 ring-4 ring-ukra-gold/20' 
                  : 'bg-gray-50 text-gray-300 hover:bg-gray-100 hover:text-gray-400'
              }`}
            >
              <Star className={`w-6 h-6 md:w-8 md:h-8 mb-1 ${selectedStars === star ? 'fill-current' : ''}`} />
              <span className="font-bold text-lg md:text-xl">{star}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Start Button */}
      <button 
        onClick={() => onStart(selectedStars)}
        className="group relative inline-flex items-center justify-center px-12 py-5 text-xl font-bold text-white transition-all duration-200 bg-ukra-navy rounded-2xl hover:bg-ukra-navy/90 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ukra-navy shadow-xl"
      >
        <span>ابدأ رحلة الاستشارة</span>
        <ArrowLeft className="w-6 h-6 mr-3 group-hover:-translate-x-2 transition-transform" />
        <div className="absolute -top-2 -right-2 bg-ukra-gold text-ukra-navy text-[10px] font-bold px-2 py-1 rounded-full animate-bounce">
          مجاني
        </div>
      </button>

      {/* Footer Info */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center text-xs text-gray-400 max-w-4xl">
        <div className="flex items-center justify-center gap-2">
          <Clock className="w-4 h-4" /> مدة الاستبيان: 3 دقائق
        </div>
        <div className="flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4" /> مطابق لاشتراطات الوزارة V2
        </div>
        <div className="flex items-center justify-center gap-2">
          <ClipboardCheck className="w-4 h-4" /> تقرير BOQ فوري
        </div>
      </div>

    </div>
  );
};