import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { HardHat, Hammer, Ruler } from 'lucide-react';

export const BOQBuilder = () => {
  const { lang } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 animate-in fade-in">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-[#c5a059] opacity-20 blur-xl rounded-full"></div>
        <div className="relative bg-white p-8 rounded-full shadow-lg border border-gray-100">
          <HardHat className="w-16 h-16 text-[#1a2a3a]" />
        </div>
        <Hammer className="absolute -bottom-2 -right-2 w-8 h-8 text-[#c5a059] animate-bounce" />
        <Ruler className="absolute -top-2 -left-2 w-8 h-8 text-[#c5a059]" />
      </div>

      <h2 className="text-3xl font-black text-[#1a2a3a] mb-4">
        {lang === 'ar' ? 'نظام التسعير الذكي' : 'Smart Pricing Engine'}
      </h2>
      
      <p className="text-gray-500 max-w-lg mb-8 text-lg leading-relaxed">
        {lang === 'ar' 
          ? 'جاري العمل على بناء قاعدة بيانات الخامات والمصنعيات لتوفير أدق تسعير ممكن. سيتم إطلاق هذه الميزة قريباً.' 
          : 'We are currently building the materials and labor database for precise pricing. This feature is coming soon.'}
      </p>

      <div className="flex gap-4">
        <span className="px-4 py-2 bg-gray-100 rounded-lg text-xs font-bold text-gray-400">
          {lang === 'ar' ? 'قاعدة بيانات الأخشاب' : 'Wood DB'}
        </span>
        <span className="px-4 py-2 bg-gray-100 rounded-lg text-xs font-bold text-gray-400">
          {lang === 'ar' ? 'حساب المصنعية' : 'Labor Cost'}
        </span>
        <span className="px-4 py-2 bg-gray-100 rounded-lg text-xs font-bold text-gray-400">
          {lang === 'ar' ? 'الاكسسوارات' : 'Accessories'}
        </span>
      </div>
    </div>
  );
};