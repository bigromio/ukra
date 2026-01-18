import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { UnitDefinition, HotelCriteriaDB, HotelProposal, BOQItem } from '../types';
import { fetchHotelCriteria, getExecutiveSummary, saveHotelProposal } from '../services/advisorService';
import { UnitBuilder } from '../components/HotelAdvisor/UnitBuilder';
import { 
  Star, Check, ArrowRight, Building, Plus, Trash2, ShieldCheck, 
  DollarSign, Loader2, Download, Lock, Hotel, Search, AlertTriangle, 
  CheckCircle, Package, Layers, Info 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { HotelBOQDocument } from '../components/PDF/HotelBOQDocument';

export const HotelAdvisor = () => {
  const { lang, dir } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // --- Wizard State ---
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // --- Data State ---
  const [projectInfo, setProjectInfo] = useState({ name: '', type: 'Hotel', stars: 3 });
  const [criteria, setCriteria] = useState<HotelCriteriaDB[]>([]);
  const [units, setUnits] = useState<UnitDefinition[]>([]);
  const [summaryData, setSummaryData] = useState<any>(null);
  
  // --- UI State ---
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'Furnishing' | 'Regulatory'>('Furnishing');
  const [searchTerm, setSearchTerm] = useState('');
  const [quality, setQuality] = useState<'Value' | 'Med' | 'VIP'>('Med');

  // 1. Load Ministry Criteria (Step 2)
  useEffect(() => {
    if (step === 2) {
      const load = async () => {
        setLoading(true);
        const data = await fetchHotelCriteria(projectInfo.stars);
        setCriteria(data);
        setLoading(false);
      };
      load();
    }
  }, [step, projectInfo.stars]);

  // 2. Load Executive Summary (Step 3)
  useEffect(() => {
    if (step === 3) {
      const loadSummary = async () => {
        setLoading(true);
        const data = await getExecutiveSummary(units, projectInfo.stars, quality);
        setSummaryData(data);
        setLoading(false);
      };
      loadSummary();
    }
  }, [step, units, projectInfo.stars, quality]);

  // --- Handlers ---
  const handleNext = () => setStep(p => p + 1);
  const handleBack = () => setStep(p => p - 1);
  const handleSaveUnit = (unit: UnitDefinition) => { setUnits([...units, unit]); setIsUnitModalOpen(false); };
  const handleDeleteUnit = (id: string) => { setUnits(units.filter(u => u.id !== id)); };

  // --- Excel Export (The Golden Asset) ---
  const handleDownloadQuote = async () => {
  if (!isAuthenticated || !user) {
    if(window.confirm(lang === 'ar' ? "سجل دخولك لتحميل جدول الكميات المعتمد بمراجع الوزارة." : "Login to download BOQ with Ministry refs.")) {
       navigate('/client-login');
    }
    return;
  }
  if (!summaryData) return;

  try {
    setIsExporting(true);

    // الورقة الأولى: الملخص والميزانية
    const overview = [
      ["أوكرة - مستشار التجهيز الفندقي الذكي"],
      ["اسم المشروع", projectInfo.name],
      ["الفئة المستهدفة", `${projectInfo.stars} نجوم`],
      ["الميزانية الإجمالية", `${summaryData.totalEstimated.toLocaleString()} ريال سعودي`],
      ["عدد الوحدات", summaryData.totalKeys],
      ["حالة الامتثال", "مطابق لمعايير وزارة السياحة 2022"],
      ["تاريخ الإصدار", new Date().toLocaleDateString('ar-SA')]
    ];

  
    


    
    // حفظ في قاعدة البيانات للرجوع إليه لاحقاً
    await saveHotelProposal(user.id, projectInfo.name, projectInfo.stars, units, summaryData);

  } catch (e) {
    alert("حدث خطأ أثناء استخراج الملف.");
  } finally {
    setIsExporting(false);
  }
};
  // --- Step Renders ---

  const renderStep1 = () => (
    <div className="animate-in fade-in slide-in-from-right duration-500">
       <h2 className="text-2xl font-bold text-ukra-navy mb-6 text-center">{lang==='ar'?'هوية المشروع':'Project Identity'}</h2>
       <div className="space-y-6">
         <div>
            <label className="label-std">{lang==='ar'?'اسم المشروع':'Project Name'}</label>
            <input type="text" className="input-std" placeholder="e.g. Al Madinah Plaza" value={projectInfo.name} onChange={e => setProjectInfo({...projectInfo, name: e.target.value})} />
         </div>
         <div>
            <label className="label-std">{lang==='ar'?'فئة النجوم':'Hotel Rating'}</label>
            <div className="flex justify-between gap-2 bg-gray-50 p-4 rounded-xl border">
               {[1,2,3,4,5].map(star => (
                 <button key={star} onClick={() => setProjectInfo({...projectInfo, stars: star})} className={`flex-1 py-3 rounded-lg flex flex-col items-center transition-all ${projectInfo.stars === star ? 'bg-ukra-navy text-ukra-gold scale-105 shadow-lg' : 'bg-white text-gray-400 border'}`}>
                    <Star className={`w-5 h-5 ${projectInfo.stars === star ? 'fill-current' : ''}`} />
                    <span className="text-sm font-bold mt-1">{star}</span>
                 </button>
               ))}
            </div>
         </div>
         <div>
             <div className="flex justify-between items-center mb-2">
                <label className="label-std mb-0">{lang==='ar'?'وحدات المشروع':'Project Units'}</label>
                <button onClick={() => setIsUnitModalOpen(true)} className="text-xs bg-ukra-navy text-white px-4 py-1.5 rounded-full flex items-center gap-1 hover:bg-ukra-gold transition"><Plus className="w-3 h-3" /> {lang==='ar'?'إضافة':'Add'}</button>
             </div>
             {units.length === 0 ? (
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center text-gray-400 cursor-pointer hover:bg-gray-50 transition" onClick={() => setIsUnitModalOpen(true)}>
                   <p className="text-sm">{lang==='ar'?'لم يتم إضافة وحدات بعد.':'No units added yet.'}</p>
                </div>
             ) : (
                <div className="space-y-2">
                   {units.map((u, i) => (
                      <div key={i} className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                         <div className="flex items-center gap-4">
                            <span className="bg-ukra-navy text-white font-bold w-10 h-10 flex items-center justify-center rounded-lg shadow-sm">{u.quantity}</span>
                            <div><p className="font-bold text-sm text-ukra-navy">{u.name}</p></div>
                         </div>
                         <button onClick={() => handleDeleteUnit(u.id)} className="text-red-400 hover:text-red-600 transition"><Trash2 className="w-5 h-5" /></button>
                      </div>
                   ))}
                </div>
             )}
         </div>
         <button onClick={handleNext} disabled={!projectInfo.name || units.length === 0} className="btn-main w-full py-4 mt-4">{lang==='ar'?'التالي: فحص معايير الوزارة':'Next: Compliance Check'}</button>
       </div>
    </div>
  );

  const renderStep2 = () => {
    const filtered = criteria.filter(c => {
      const matchesTab = activeTab === 'Furnishing' ? !c.isRegulatory : c.isRegulatory;
      return matchesTab && c.criteria_name_ar.includes(searchTerm);
    });

    return (
      <div className="animate-in fade-in slide-in-from-right duration-500 h-full flex flex-col">
          <div className="text-center mb-6">
            <ShieldCheck className="w-12 h-12 text-green-600 mx-auto mb-2" />
            <h2 className="text-xl font-black text-ukra-navy">{lang==='ar'?'دليل امتثال وزارة السياحة':'Ministry Compliance Guide'}</h2>
          </div>
          <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-4">
             <button onClick={() => setActiveTab('Furnishing')} className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition ${activeTab === 'Furnishing' ? 'bg-white text-ukra-navy shadow-sm' : 'text-gray-500'}`}>{lang==='ar' ? 'تجهيزات أوكرة' : 'UKRA Items'}</button>
             <button onClick={() => setActiveTab('Regulatory')} className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition ${activeTab === 'Regulatory' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500'}`}>{lang==='ar' ? 'اشتراطات تنظيمية' : 'Regulatory'}</button>
          </div>
          <div className="relative mb-4">
             <Search className="absolute top-3 right-4 w-4 h-4 text-gray-400" />
             <input type="text" placeholder={lang==='ar' ? 'بحث في المتطلبات...' : 'Search...'} className="w-full pl-4 pr-10 py-3 border-2 border-gray-100 rounded-xl outline-none focus:border-ukra-gold" onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-1 min-h-[350px]">
             {loading ? <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-ukra-gold" /></div> : (
               <div className="space-y-3">
                  {filtered.map((c, i) => (
                    <div key={i} className={`p-4 rounded-2xl border text-sm flex gap-3 ${activeTab === 'Regulatory' ? 'bg-red-50/30 border-red-100' : 'bg-white border-gray-100 shadow-sm'}`}>
                       {c.isMandatory ? <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" /> : <Info className="w-5 h-5 text-ukra-gold flex-shrink-0" />}
                       <div>
                          <p className="text-ukra-navy font-bold leading-relaxed">{c.criteria_name_ar}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-2 inline-block ${c.isMandatory ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-ukra-gold'}`}>
                            {c.isMandatory ? (lang==='ar'?'إلزامي للحصول على الرخصة':'Mandatory for License') : (lang==='ar'?'اختياري (نقاط إضافية)':'Optional (Points)')}
                          </span>
                       </div>
                    </div>
                  ))}
               </div>
             )}
          </div>
          <div className="flex gap-4 mt-6">
            <button onClick={handleBack} className="px-8 py-4 border-2 border-gray-100 rounded-2xl font-bold text-gray-400 hover:bg-gray-50 transition">{lang==='ar'?'عودة':'Back'}</button>
            <button onClick={handleNext} className="btn-main flex-1 py-4">{lang==='ar'?'توليد الميزانية الذكية':'Generate Budget'}</button>
          </div>
      </div>
    );
  };

  const renderStep3 = () => {
    if (!summaryData) return <div className="p-20 text-center"><Loader2 className="animate-spin w-12 h-12 text-ukra-gold mx-auto" /></div>;

    return (
      <div className="animate-in fade-in slide-in-from-bottom duration-700">
        {/* Total Card */}
        <div className="bg-ukra-navy text-white p-8 rounded-[32px] shadow-2xl mb-8 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-ukra-gold text-xs font-bold uppercase tracking-widest mb-2">الميزانية التقديرية للتجهيزات</p>
            <h2 className="text-5xl font-black mb-6">{summaryData.totalEstimated.toLocaleString()} <span className="text-xl text-gray-400 font-normal">SAR</span></h2>
            
            <div className="flex bg-black/30 p-1.5 rounded-2xl border border-white/5 inline-flex backdrop-blur-sm">
              {['Value', 'Med', 'VIP'].map((q) => (
                <button key={q} onClick={() => setQuality(q as any)} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${quality === q ? 'bg-ukra-gold text-ukra-navy shadow-lg' : 'text-gray-400 hover:text-white'}`}>
                   {q === 'Value' ? 'توفير' : q === 'Med' ? 'قياسي' : 'فاخر'}
                </button>
              ))}
            </div>
          </div>
          <DollarSign className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 rotate-12" />
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {summaryData.groups.map((group: any, idx: number) => (
            <div key={idx} className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-ukra-navy"><Package className="w-5 h-5" /></div>
                  <h4 className="font-bold text-ukra-navy text-sm">{group.title}</h4>
                </div>
                <span className="text-sm font-black text-green-600">{group.totalCost.toLocaleString()} ر.س</span>
              </div>
              <div className="mb-4">
                 <div className="flex justify-between text-[10px] font-bold mb-1">
                    <span className="text-gray-400">مؤشر مطابقة الترخيص</span>
                    <span className="text-ukra-gold">{group.mandatoryMet} من {group.totalMandatory} إلزامي</span>
                 </div>
                 <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-ukra-gold transition-all duration-1000" style={{ width: `${(group.mandatoryMet / group.totalMandatory) * 100}%` }} />
                 </div>
              </div>
              <div className="space-y-1.5 mb-4">
                {group.items.slice(0, 3).map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-[11px] text-gray-500 bg-gray-50/50 p-2 rounded-lg">
                    <span className="flex items-center gap-1">{item.isMandatory ? <CheckCircle className="w-3 h-3 text-green-500" /> : <Info className="w-3 h-3 text-blue-400" />}{item.name_ar}</span>
                    <span className="font-bold text-gray-700">× {item.qty}</span>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-center text-gray-400 italic">+ يوجد {group.items.length - 3} تجهيزات فنية إضافية تظهر في الملف الكامل</p>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-ukra-gold/20 p-10 rounded-[40px] text-center shadow-inner relative overflow-hidden">
          <ShieldCheck className="w-16 h-16 text-ukra-gold mx-auto mb-6" />
          <h3 className="text-2xl font-black text-ukra-navy mb-3">هل تود تحميل جدول الكميات التفصيلي (BOQ)؟</h3>
          <p className="text-sm text-gray-600 mb-8 leading-relaxed max-w-md mx-auto">سجل دخولك مجاناً للحصول على المواصفات الفنية الكاملة، المقاسات المعتمدة، و<strong>دليل الامتثال لاشتراطات الوزارة</strong> الخاص بمشروعك.</p>
          {/* ضع هذا الكود الجديد مكانه */}
          <div className="flex flex-col gap-4 max-w-sm mx-auto">
            {isAuthenticated && user ? (
              <PDFDownloadLink
                document={
                  <HotelBOQDocument 
                    data={summaryData} 
                    projectInfo={projectInfo} 
                    user={user} 
                  />
                }
                fileName={`UKRA_BOQ_${projectInfo.name}.pdf`}
                className="w-full"
              >
                {({ blob, url, loading, error }) => (
                  <button 
                    disabled={loading}
                    className="w-full py-5 bg-ukra-navy text-white rounded-2xl font-bold hover:bg-black transition-all flex items-center justify-center gap-3 shadow-2xl"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <Download />}
                    <span className="text-lg">تحميل ملف BOQ (PDF)</span>
                  </button>
                )}
              </PDFDownloadLink>
            ) : (
              <button 
                onClick={() => {
                  if(confirm(lang === 'ar' ? "يجب تسجيل الدخول أو إنشاء حساب جديد لتحميل التقرير التفصيلي. هل تود الانتقال لصفحة الدخول؟" : "Login required to download full BOQ. Go to login?")) {
                    navigate('/client-login');
                  }
                }} 
                className="w-full py-5 bg-gray-200 text-gray-500 rounded-2xl font-bold hover:bg-gray-300 transition-all flex items-center justify-center gap-3"
              >
                <Lock className="w-5 h-5" />
                <span className="text-lg">{lang === 'ar' ? 'سجل دخولك للتحميل' : 'Login to Download'}</span>
              </button>
            )}

            <button onClick={handleBack} className="text-xs text-gray-400 font-bold hover:text-ukra-navy uppercase tracking-widest transition">
              {lang === 'ar' ? '← العودة لتعديل البيانات' : '← Back to Edit'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20 px-4 font-cairo" dir={dir}>
       <div className="max-w-4xl mx-auto">
          <div className="mb-8 max-w-2xl mx-auto">
             <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">
                <span className={step >= 1 ? 'text-ukra-gold' : ''}>Identity</span>
                <span className={step >= 2 ? 'text-ukra-gold' : ''}>Standards</span>
                <span className={step >= 3 ? 'text-ukra-gold' : ''}>Executive Summary</span>
             </div>
             <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-ukra-gold transition-all duration-700" style={{ width: `${(step / 3) * 100}%` }} />
             </div>
          </div>
          <div className="bg-white rounded-[40px] shadow-2xl p-6 md:p-12 min-h-[600px] border border-gray-100 relative">
             {step === 1 && renderStep1()}
             {step === 2 && renderStep2()}
             {step === 3 && renderStep3()}
          </div>
       </div>
       {isUnitModalOpen && <UnitBuilder onSave={handleSaveUnit} onCancel={() => setIsUnitModalOpen(false)} />}
    </div>
  );
};