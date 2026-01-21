import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { UnitDefinition } from '../types';
import { getExecutiveSummary } from '../services/advisorService';
import { UnitBuilder } from '../components/HotelAdvisor/UnitBuilder';
import { 
  Star, ArrowRight, Building, Plus, Trash2, ShieldCheck, 
  DollarSign, Loader2, Download, Lock, AlertTriangle, 
  CheckCircle, Package, Info, Utensils, Coffee, Dumbbell, 
  BedDouble, ChevronLeft, Briefcase, FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { HotelBOQDocument } from '../components/PDF/HotelBOQDocument';

// دالة مساعدة لتحديد أيقونة الوحدة
const getUnitIcon = (type: string) => {
  switch (type) {
    case 'Restaurant': return <Utensils className="w-5 h-5" />;
    case 'CoffeeShop': return <Coffee className="w-5 h-5" />;
    case 'Gym': return <Dumbbell className="w-5 h-5" />;
    case 'MeetingRoom': return <Briefcase className="w-5 h-5" />;
    case 'Reception': 
    case 'Lobby': return <Building className="w-5 h-5" />;
    default: return <BedDouble className="w-5 h-5" />;
  }
};

export const HotelAdvisor = () => {
  const { lang, dir } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // --- Wizard State ---
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // --- Data State ---
  const [projectInfo, setProjectInfo] = useState({ name: '', stars: 3 });
  const [units, setUnits] = useState<UnitDefinition[]>([]);
  
  // التعريف الجديد للبيانات: يحتوي على المقترح المالي + التحقق
  const [summaryData, setSummaryData] = useState<{
    proposal: any;
    validation: { missingMandatory: string[]; regulatoryAlerts: string[]; areaAlerts: string[] };
  } | null>(null);
  
  // --- UI State ---
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [quality, setQuality] = useState<'Value' | 'Med' | 'VIP'>('Med');
  const [editingUnit, setEditingUnit] = useState<UnitDefinition | undefined>(undefined);

  // تحميل البيانات عند الانتقال للخطوة 2 أو تغيير الجودة
  useEffect(() => {
    if (step === 2) {
      const loadSummary = async () => {
        setLoading(true);
        try {
          const data = await getExecutiveSummary(units, projectInfo.stars, quality);
          setSummaryData(data);
        } catch (error) {
          console.error("Failed to load summary", error);
        }
        setLoading(false);
      };
      loadSummary();
    }
  }, [step, quality, units, projectInfo.stars]);

  // --- Handlers ---
  const handleNext = () => setStep(2); 
  const handleBack = () => setStep(1);
  
  const handleSaveUnit = (unit: UnitDefinition) => { 
    if (editingUnit) {
      setUnits(units.map(u => u.id === unit.id ? unit : u));
    } else {
      setUnits([...units, unit]); 
    }
    setIsUnitModalOpen(false);
    setEditingUnit(undefined);
  };

  const handleEditUnit = (unit: UnitDefinition) => {
    setEditingUnit(unit);
    setIsUnitModalOpen(true);
  };

  const handleDeleteUnit = (id: string) => { 
    setUnits(units.filter(u => u.id !== id)); 
  };

  const openNewUnitModal = () => {
    setEditingUnit(undefined);
    setIsUnitModalOpen(true);
  };

  // --- Render Step 1: المدخلات ---
  const renderStep1 = () => (
    <div className="animate-in fade-in slide-in-from-right duration-500">
       <h2 className="text-2xl font-bold text-ukra-navy mb-6 text-center">
         {lang === 'ar' ? 'هوية المشروع والمكونات' : 'Project Identity'}
       </h2>
       
       <div className="space-y-6">
         {/* Stars Selection */}
         <div>
            <label className="label-std">{lang === 'ar' ? 'فئة النجوم المستهدفة' : 'Target Rating'}</label>
            <div className="flex justify-between gap-2 bg-gray-50 p-2 md:p-4 rounded-xl border">
               {[1,2,3,4,5].map(star => (
                 <button 
                   key={star} 
                   onClick={() => setProjectInfo({...projectInfo, stars: star})} 
                   className={`flex-1 py-3 rounded-lg flex flex-col items-center transition-all duration-200 ${projectInfo.stars === star ? 'bg-ukra-navy text-ukra-gold scale-105 shadow-lg ring-2 ring-ukra-gold ring-offset-2' : 'bg-white text-gray-400 border hover:bg-gray-100'}`}
                 >
                    <Star className={`w-5 h-5 ${projectInfo.stars === star ? 'fill-current' : ''}`} />
                    <span className="text-sm font-bold mt-1">{star}</span>
                 </button>
               ))}
            </div>
         </div>

         {/* Project Name */}
         <div>
            <label className="label-std">{lang === 'ar' ? 'اسم المشروع' : 'Project Name'}</label>
            <input 
              type="text" 
              className="input-std" 
              placeholder="مثال: فندق المدينة بلازا" 
              value={projectInfo.name} 
              onChange={e => setProjectInfo({...projectInfo, name: e.target.value})} 
            />
         </div>

         {/* Units & Facilities */}
         <div>
             <div className="flex justify-between items-center mb-3">
                <label className="label-std mb-0">{lang === 'ar' ? 'وحدات ومرافق المشروع' : 'Project Components'}</label>
                <button 
                  onClick={openNewUnitModal} 
                  className="text-xs bg-ukra-navy text-white px-4 py-2 rounded-lg flex items-center gap-1 hover:bg-ukra-gold hover:text-ukra-navy transition font-bold shadow-sm"
                >
                  <Plus className="w-4 h-4" /> {lang === 'ar' ? 'إضافة وحدة / مرفق' : 'Add Unit'}
                </button>
             </div>
             
             {units.length === 0 ? (
                <div 
                  className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center text-gray-400 cursor-pointer hover:bg-gray-50 hover:border-ukra-gold/50 transition duration-300 group" 
                  onClick={openNewUnitModal}
                >
                   <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-ukra-gold/20 group-hover:text-ukra-gold transition">
                      <Building className="w-8 h-8 opacity-50 group-hover:opacity-100" />
                   </div>
                   <p className="text-sm font-bold text-gray-500 group-hover:text-ukra-navy transition">
                     {lang === 'ar' ? 'أضف الغرف، الاستقبال، المطعم، وغيرها...' : 'Add rooms, reception, restaurant...'}
                   </p>
                   <p className="text-xs text-gray-400 mt-1">اضغط هنا للبدء</p>
                </div>
             ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                   {units.map((u) => (
                      <div 
                        key={u.id} 
                        className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-ukra-gold/30 transition cursor-pointer group"
                        onClick={() => handleEditUnit(u)}
                      >
                          <div className="flex items-center gap-4">
                             <span className="bg-gray-50 text-ukra-navy font-bold w-12 h-12 flex items-center justify-center rounded-xl border border-gray-100 group-hover:bg-ukra-navy group-hover:text-ukra-gold transition">
                               {getUnitIcon(u.type)}
                             </span>
                             <div>
                               <p className="font-bold text-sm text-ukra-navy">{u.name}</p>
                               <div className="flex gap-2 text-[10px] text-gray-500 font-bold mt-0.5">
                                 <span className="bg-gray-100 px-1.5 py-0.5 rounded">العدد: {u.quantity}</span>
                                 <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{u.type}</span>
                               </div>
                             </div>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteUnit(u.id); }} 
                            className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                      </div>
                   ))}
                </div>
             )}
         </div>

         <button 
            onClick={handleNext} 
            disabled={!projectInfo.name || units.length === 0} 
            className={`btn-main w-full py-4 mt-4 shadow-xl flex items-center justify-center gap-2 ${(!projectInfo.name || units.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
         >
            {lang === 'ar' ? 'تحليل المشروع وحساب التكلفة' : 'Analyze & Calculate'} <ArrowRight className="w-5 h-5" />
         </button>
       </div>
    </div>
  );

  // --- Render Step 2: التقرير والملخص ---
  const renderStep2 = () => {
    if (!summaryData) {
      return (
        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
           <Loader2 className="animate-spin w-12 h-12 text-ukra-gold mb-4" />
           <p className="text-gray-400 font-bold">جاري تحليل الاشتراطات وحساب الكميات...</p>
        </div>
      );
    }

    const { proposal, validation } = summaryData;

    return (
      <div className="animate-in fade-in slide-in-from-bottom duration-700 space-y-6">
        
        {/* 1. Header Card: التكلفة الإجمالية */}
        <div className="bg-ukra-navy text-white p-6 md:p-8 rounded-[32px] shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-ukra-gold text-xs font-bold uppercase tracking-widest mb-2 opacity-80">
              التكلفة التقديرية (للتجهيزات المختارة)
            </p>
            <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">
              {proposal.totalEstimated.toLocaleString()} <span className="text-lg md:text-xl text-gray-400 font-normal">ر.س</span>
            </h2>
            
            <div className="flex bg-white/10 p-1 rounded-xl inline-flex backdrop-blur-md">
              {['Value', 'Med', 'VIP'].map((q) => (
                <button 
                  key={q} 
                  onClick={() => setQuality(q as any)} 
                  className={`px-4 md:px-6 py-2 rounded-lg text-xs font-bold transition-all ${quality === q ? 'bg-ukra-gold text-ukra-navy shadow-lg scale-105' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
                >
                   {q === 'Value' ? 'اقتصادي' : q === 'Med' ? 'قياسي' : 'فاخر'}
                </button>
              ))}
            </div>
          </div>
          <DollarSign className="absolute -bottom-6 -right-6 w-40 h-40 text-white/5 rotate-12" />
        </div>

        {/* 2. Validation Alerts: التنبيهات والاشتراطات */}
        {(validation.missingMandatory.length > 0 || validation.regulatoryAlerts.length > 0) && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* نواقص إلزامية */}
              {validation.missingMandatory.length > 0 && (
                 <div className="bg-red-50 border border-red-100 rounded-2xl p-5 relative overflow-hidden">
                    <div className="flex items-start gap-3 relative z-10">
                       <div className="bg-red-100 p-2 rounded-lg text-red-600">
                          <AlertTriangle className="w-5 h-5" />
                       </div>
                       <div>
                          <h4 className="font-bold text-red-900 text-sm mb-1">
                             نواقص إلزامية لفئة {projectInfo.stars} نجوم
                          </h4>
                          <p className="text-[11px] text-red-600/80 mb-2">يجب إضافة هذه المرافق لتحقيق التصنيف:</p>
                          <ul className="list-disc list-inside space-y-1">
                             {validation.missingMandatory.map((item, i) => (
                                <li key={i} className="text-xs font-bold text-red-800">{item}</li>
                             ))}
                          </ul>
                       </div>
                    </div>
                 </div>
              )}

              {/* اشتراطات تنظيمية */}
              {validation.regulatoryAlerts.length > 0 && (
                 <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                    <div className="flex items-start gap-3">
                       <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                          <FileText className="w-5 h-5" />
                       </div>
                       <div>
                          <h4 className="font-bold text-blue-900 text-sm mb-1">
                             تنبيهات تنظيمية وإجرائية
                          </h4>
                          <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                             {validation.regulatoryAlerts.map((item, i) => (
                                <p key={i} className="text-[10px] text-blue-800 font-medium flex items-center gap-2">
                                   <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> {item}
                                </p>
                             ))}
                          </div>
                       </div>
                    </div>
                 </div>
              )}
           </div>
        )}

        {/* 3. Groups Breakdown: تفاصيل التكلفة */}
        <div className="grid grid-cols-1 gap-4">
          <h3 className="font-bold text-gray-800 px-2 flex items-center gap-2">
            <Package className="w-5 h-5 text-ukra-gold" /> تفاصيل التجهيزات
          </h3>
          {proposal.groups.map((group: any, idx: number) => (
            <div 
              key={idx} 
              className={`border p-5 rounded-3xl transition-all duration-300 ${group.totalCost > 0 ? 'bg-white border-gray-100 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-90'}`}
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${group.totalCost > 0 ? 'bg-ukra-navy/10 text-ukra-navy' : 'bg-gray-200 text-gray-500'}`}>
                    {group.title.includes('المقاولين') ? <Building className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{group.title}</h4>
                    <span className="text-[10px] text-gray-500 font-bold">{group.items.length} بند</span>
                  </div>
                </div>
                {group.totalCost > 0 ? (
                    <span className="text-sm font-black text-ukra-navy">{group.totalCost.toLocaleString()} ر.س</span>
                ) : (
                    <span className="text-[10px] bg-gray-200 text-gray-500 px-2 py-1 rounded-lg font-bold">تنسيق خارجي / غير مسعر</span>
                )}
              </div>
              
              <div className="space-y-2 bg-gray-50/50 p-3 rounded-xl border border-gray-100/50">
                {group.items.slice(0, 3).map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-[11px]">
                    <span className="flex items-center gap-2 text-gray-700">
                        {item.isMandatory ? <CheckCircle className="w-3 h-3 text-green-500" /> : <Info className="w-3 h-3 text-blue-300" />}
                        {item.name_ar}
                    </span>
                    <span className="font-bold text-gray-500">
                        {item.qty > 0 ? `× ${item.qty}` : item.notes || '-'}
                    </span>
                  </div>
                ))}
                {group.items.length > 3 && (
                    <p className="text-[10px] text-center text-gray-400 italic pt-1 border-t border-gray-100 mt-2">
                        + {group.items.length - 3} بنود أخرى في التقرير التفصيلي
                    </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 4. Footer Actions: التحميل والعودة */}
        <div className="bg-gradient-to-br from-gray-900 to-ukra-navy p-6 md:p-8 rounded-[32px] text-center text-white relative overflow-hidden mt-8">
          <ShieldCheck className="w-16 h-16 text-ukra-gold mx-auto mb-4 opacity-20" />
          <h3 className="text-lg md:text-xl font-bold mb-2">تقرير المستشار الفندقي الشامل</h3>
          <p className="text-xs text-gray-300 mb-6 max-w-md mx-auto leading-relaxed">
            احصل على ملف PDF يحتوي على جدول الكميات (BOQ)، الاشتراطات الإلزامية الناقصة، وتوصيات التجهيز المعتمدة.
          </p>
          
          <div className="flex flex-col gap-3 max-w-xs mx-auto relative z-10">
             {isAuthenticated && user ? (
               <PDFDownloadLink
                 document={<HotelBOQDocument data={summaryData} projectInfo={projectInfo} user={user} />}
                 fileName={`UKRA_Advisor_${projectInfo.name}.pdf`}
                 className="w-full"
               >
                 {({ loading }) => (
                   <button 
                     disabled={loading} 
                     className="w-full py-3.5 bg-ukra-gold text-ukra-navy rounded-xl font-bold hover:bg-white hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-lg"
                   >
                     {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Download className="w-5 h-5" />}
                     تحميل التقرير (PDF)
                   </button>
                 )}
               </PDFDownloadLink>
             ) : (
               <button 
                 onClick={() => navigate('/client-login')} 
                 className="w-full py-3.5 bg-gray-700 text-white rounded-xl font-bold hover:bg-gray-600 transition flex items-center justify-center gap-2"
               >
                 <Lock className="w-4 h-4" /> تسجيل الدخول للتحميل
               </button>
             )}
             
             <button 
               onClick={handleBack} 
               className="text-xs text-gray-400 font-bold hover:text-white uppercase tracking-widest mt-2 flex items-center justify-center gap-1 py-2"
             >
               <ChevronLeft className="w-3 h-3" /> مراجعة المدخلات
             </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20 px-4 font-cairo" dir={dir}>
       <div className="max-w-4xl mx-auto">
         {/* Progress Bar */}
         <div className="mb-8 max-w-2xl mx-auto">
             <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">
                <span className={step >= 1 ? 'text-ukra-gold' : ''}>1. المكونات والمرافق</span>
                <span className={step >= 2 ? 'text-ukra-gold' : ''}>2. التقرير والتكلفة</span>
             </div>
             <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-ukra-gold transition-all duration-700 ease-out" 
                  style={{ width: `${(step / 2) * 100}%` }} 
                />
             </div>
         </div>
         
         <div className="bg-white rounded-[40px] shadow-xl p-6 md:p-12 min-h-[600px] border border-gray-100 relative">
             {step === 1 && renderStep1()}
             {step === 2 && renderStep2()}
         </div>
       </div>

       {isUnitModalOpen && (
         <UnitBuilder 
           onSave={handleSaveUnit} 
           onCancel={() => setIsUnitModalOpen(false)} 
           initialData={editingUnit}
         />
       )}
    </div>
  );
};