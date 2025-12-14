
import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { submitFurnitureQuote, fileToBase64 } from '../services/apiService';
import { 
  Building, Home, Check, ChevronLeft, ChevronRight, 
  Plus, Trash2, Upload, Loader2, Sparkles, FileText, Camera
} from 'lucide-react';

type Step = 'category' | 'details' | 'specs' | 'review';

export const FurnitureRequest = () => {
  const { t, dir, lang } = useLanguage();
  const [currentStep, setCurrentStep] = useState<Step>('category');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // --- Form Data State ---
  const [formData, setFormData] = useState({
    referralSource: '',
    salesCode: '',
    clientName: '',
    phone: '',
    email: '',
    
    // Category
    projectCategory: 'residential' as 'residential' | 'commercial',
    
    // Spaces now include 'customName' for the "Other" option
    resSpaces: [] as { type: string; customName?: string; area: string; count: string }[], 
    comSpaces: [] as { type: string; customName?: string; count: string; area: string }[], 

    // Specs
    style: 'Modern',
    woodType: 'Chipboard_Thai',
    furnitureLevel: 'Medium',
    
    includedPackages: ['Furniture', 'Furnishing', 'Amenities'],

    hasCladding: 'No',
    claddingArea: '',
    notes: '',
    images: [] as { name: string; base64: string }[]
  });

  // --- Constants ---
  const residentialRoomTypes = [
    { label: lang === 'ar' ? 'غرفة نوم رئيسية' : 'Master Bedroom', value: 'Master Bedroom' },
    { label: lang === 'ar' ? 'غرفة معيشة' : 'Living Room', value: 'Living Room' },
    { label: lang === 'ar' ? 'مجلس' : 'Majlis', value: 'Majlis' },
    { label: lang === 'ar' ? 'غرفة طعام' : 'Dining Room', value: 'Dining Room' },
    { label: lang === 'ar' ? 'غرفة نوم عامة' : 'Bedroom', value: 'Bedroom' },
    { label: lang === 'ar' ? 'أخرى' : 'Other', value: 'Other' }, // Added Other
  ];

  const commercialRoomTypes = [
    { label: lang === 'ar' ? 'غرفة فندقية (مفرد)' : 'Hotel Single Room', value: 'Hotel Single Room' },
    { label: lang === 'ar' ? 'غرفة فندقية (مزدوج)' : 'Hotel Double Room', value: 'Hotel Double Room' },
    { label: lang === 'ar' ? 'استقبال / لوبي' : 'Reception', value: 'Reception' },
    { label: lang === 'ar' ? 'مطعم' : 'Restaurant', value: 'Restaurant' },
    { label: lang === 'ar' ? 'مكتب' : 'Office', value: 'Office' },
    { label: lang === 'ar' ? 'أخرى' : 'Other', value: 'Other' }, // Added Other
  ];

  const woodOptions = [
    { label: lang === 'ar' ? 'ميلامين وطني (اقتصادي)' : 'Melamine National', value: 'Melamine_National' },
    { label: lang === 'ar' ? 'ميلامين تايلاندي' : 'Melamine_Thai', value: 'Melamine_Thai' },
    { label: lang === 'ar' ? 'شيبورد تايلاندي (الأكثر طلباً)' : 'Chipboard_Thai', value: 'Chipboard_Thai' },
    { label: lang === 'ar' ? 'شيبورد إسباني' : 'Chipboard_Spanish', value: 'Chipboard_Spanish' },
    { label: lang === 'ar' ? 'شيبورد ألماني (فاخر)' : 'Chipboard_German', value: 'Chipboard_German' },
    { label: lang === 'ar' ? 'MDF تايلاندي (دهان/CNC)' : 'MDF_Thai', value: 'MDF_Thai' },
  ];

  const packageScopes = [
    { id: 'Furniture', label: lang === 'ar' ? 'الأثاث الخشبي' : 'Furniture (Wood)' },
    { id: 'Furnishing', label: lang === 'ar' ? 'المفروشات والمراتب' : 'Furnishing & Mattresses' },
    { id: 'Amenities', label: lang === 'ar' ? 'الأجهزة والاكسسوارات' : 'Appliances & Accessories' },
  ];

  // --- Helpers ---

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const togglePackage = (pkgId: string) => {
    setFormData(prev => {
      const current = prev.includedPackages;
      if (current.includes(pkgId)) return { ...prev, includedPackages: current.filter(p => p !== pkgId) };
      return { ...prev, includedPackages: [...current, pkgId] };
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const base64Full = await fileToBase64(file);
        const base64 = base64Full.split(',')[1];
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, { name: file.name, base64 }]
        }));
      } catch (err) {
        console.error(err);
      }
    }
  };

  // --- Dynamic Rows Logic ---

  const addSpace = (category: 'res' | 'com') => {
    const key = category === 'res' ? 'resSpaces' : 'comSpaces';
    const defaultType = category === 'res' ? 'Master Bedroom' : 'Hotel Single Room';
    setFormData(prev => ({ ...prev, [key]: [...prev[key], { type: defaultType, area: '', count: '1', customName: '' }] }));
  };

  const updateSpace = (category: 'res' | 'com', index: number, field: string, value: string) => {
    const key = category === 'res' ? 'resSpaces' : 'comSpaces';
    const newSpaces = [...formData[key]];
    (newSpaces[index] as any)[field] = value;
    setFormData(prev => ({ ...prev, [key]: newSpaces }));
  };

  const removeSpace = (category: 'res' | 'com', index: number) => {
    const key = category === 'res' ? 'resSpaces' : 'comSpaces';
    setFormData(prev => ({ ...prev, [key]: prev[key].filter((_, i) => i !== index) }));
  };

  // --- Navigation & Submission ---

  const nextStep = () => {
    if (currentStep === 'category') {
        if(!formData.clientName || !formData.phone) {
            alert(lang==='ar' ? "الرجاء إكمال البيانات" : "Please complete details");
            return;
        }
        setCurrentStep('details');
    }
    else if (currentStep === 'details') setCurrentStep('specs');
    else if (currentStep === 'specs') setCurrentStep('review');
  };

  const prevStep = () => {
    if (currentStep === 'details') setCurrentStep('category');
    else if (currentStep === 'specs') setCurrentStep('details');
    else if (currentStep === 'review') setCurrentStep('specs');
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    const spaces = formData.projectCategory === 'residential' ? formData.resSpaces : formData.comSpaces;
    
    // Process spaces: if type is 'Other', include the customName in the final details
    const processedSpaces = spaces.map(s => ({
        ...s,
        finalType: s.type === 'Other' ? (s.customName || 'Other') : s.type
    }));

    const validSpaces = processedSpaces.filter(s => s.area && parseFloat(s.area) > 0);
    
    // FLATTENED Payload to ensure Google Script reads it correctly
    // Most scripts expect top-level keys like 'fullName', not 'client.name'
    const payload = {
      type: 'Furniture Request',
      lang: lang,
      
      // Client Info (Flattened)
      fullName: formData.clientName,
      phone: formData.phone,
      email: formData.email,
      referralSource: formData.referralSource,
      salesCode: formData.salesCode,

      // Project Info
      projectCategory: formData.projectCategory, // residential / commercial
      
      // We send the list of rooms as a JSON string in 'details' or 'scope'
      details: JSON.stringify(validSpaces), 
      
      // Specs
      woodType: formData.woodType,
      furnitureLevel: formData.furnitureLevel,
      style: formData.style,
      notes: formData.notes,
      includedPackages: formData.includedPackages.join(', '),
      
      hasCladding: formData.hasCladding,
      claddingArea: formData.claddingArea
    };

    // Images are sent separately in the 'files' key handled by apiService
    const fullPayload = {
        ...payload,
        files: formData.images
    };

    const result = await submitFurnitureQuote(fullPayload as any);
    setIsSubmitting(false);
    if (result) setSuccess(true);
    else alert("Error submitting request. Please try again.");
  };

  // --- Render ---

  if (success) {
     return (
        <div className="min-h-screen bg-ukra-navy flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-lg text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
               <Check className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('alert_success_title')}</h2>
            <p className="text-gray-600 mb-6">
               {lang === 'ar' 
                 ? "تم استلام طلبك بنجاح! سيقوم النظام الآن بحساب الكميات والأسعار بناءً على المواصفات المختارة وإرسال ملف عرض السعر PDF إلى بريدك الإلكتروني والواتساب خلال لحظات."
                 : "Request received! The system is calculating quantities and prices. You will receive the PDF quotation via Email and WhatsApp shortly."}
            </p>
            <button onClick={() => window.location.reload()} className="btn-main w-full">{t('btn_new_req') || "New Request"}</button>
          </div>
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20 px-4 font-cairo" dir={dir}>
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
           <h1 className="text-3xl font-bold text-ukra-navy">{lang==='ar'?'استمارة التوريد الذكية':'Smart Furnishing Form'}</h1>
           <p className="text-gray-500 mt-2">{lang==='ar'?'نظام تسعير فوري دقيق (بدون ذكاء اصطناعي) يعتمد على المعايير الهندسية':'Precise algorithmic pricing system based on engineering standards'}</p>
           
           <div className="flex items-center gap-2 mt-6">
              {[
                {id: 'category', label: t('step_cat') || 'Type'}, 
                {id: 'details', label: t('step_det') || 'Spaces'}, 
                {id: 'specs', label: t('step_spec') || 'Specs'}, 
                {id: 'review', label: t('step_rev') || 'Review'}
              ].map((step, idx) => (
                 <div key={step.id} className={`flex-1 h-2 rounded-full transition-colors ${
                    ['category','details','specs','review'].indexOf(currentStep) >= idx ? 'bg-ukra-gold' : 'bg-gray-200'
                 }`} />
              ))}
           </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden min-h-[500px] flex flex-col">
           
           {/* Step 1: Client & Category */}
           {currentStep === 'category' && (
              <div className="p-8 animate-in fade-in slide-in-from-right duration-300">
                 <h2 className="text-xl font-bold text-ukra-navy mb-6">1. {lang==='ar'?'بيانات العميل ونوع المشروع':'Client & Project Type'}</h2>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                       <label className="label-std">{t('furn_lbl_name') || 'Client Name'}</label>
                       <input required name="clientName" value={formData.clientName} onChange={handleInputChange} className="input-std" />
                    </div>
                    <div>
                       <label className="label-std">{t('auth_phone')}</label>
                       <input required name="phone" value={formData.phone} onChange={handleInputChange} className="input-std" dir="ltr" />
                    </div>
                    <div className="md:col-span-2">
                       <label className="label-std">{t('auth_email')}</label>
                       <input required name="email" value={formData.email} onChange={handleInputChange} className="input-std" dir="ltr" />
                    </div>
                    
                    {/* Referral Source Section */}
                    <div className="md:col-span-2 bg-[#fffcf5] p-6 rounded-2xl border border-dashed border-ukra-gold">
                       <label className="label-std">{t('lbl_source')}</label>
                       <select name="referralSource" value={formData.referralSource} onChange={handleInputChange} className="input-std bg-white">
                          <option value="">{t('opt_select')}</option>
                          <option value="Google Search">{t('opt_google')}</option>
                          <option value="Instagram">{t('opt_instagram')}</option>
                          <option value="TikTok">{t('opt_tiktok')}</option>
                          <option value="Snapchat">{t('opt_snapchat')}</option>
                          <option value="Facebook">{t('opt_facebook')}</option>
                          <option value="Google Maps">{t('opt_google_maps')}</option>
                          <option value="Sales Representative">{t('opt_sales')}</option>
                          <option value="Other">{t('opt_other')}</option>
                       </select>
                       {(formData.referralSource === 'Sales Representative' || formData.referralSource === 'مندوب مبيعات') && (
                          <div className="mt-4 animate-in slide-in-from-top-2">
                             <label className="label-std">{t('lbl_sales_code')}</label>
                             <input type="text" name="salesCode" value={formData.salesCode} onChange={handleInputChange} placeholder="ex: UK-101" className="input-std bg-white" required />
                          </div>
                       )}
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                      onClick={() => setFormData({...formData, projectCategory: 'residential'})}
                      className={`cursor-pointer p-6 rounded-xl border-2 flex flex-col items-center gap-3 transition hover:bg-gray-50 ${formData.projectCategory === 'residential' ? 'border-ukra-gold bg-yellow-50/50' : 'border-gray-200'}`}
                    >
                       <Home className={`w-12 h-12 ${formData.projectCategory === 'residential' ? 'text-ukra-gold' : 'text-gray-400'}`} />
                       <span className="font-bold text-lg">{lang==='ar'?'مشروع سكني':'Residential'}</span>
                       <span className="text-xs text-gray-500">{lang==='ar'?'فلل، شقق، قصور (تفصيل حسب المساحة)':'Villas, Apartments (Custom fit)'}</span>
                    </div>
                    <div 
                      onClick={() => setFormData({...formData, projectCategory: 'commercial'})}
                      className={`cursor-pointer p-6 rounded-xl border-2 flex flex-col items-center gap-3 transition hover:bg-gray-50 ${formData.projectCategory === 'commercial' ? 'border-ukra-gold bg-yellow-50/50' : 'border-gray-200'}`}
                    >
                       <Building className={`w-12 h-12 ${formData.projectCategory === 'commercial' ? 'text-ukra-gold' : 'text-gray-400'}`} />
                       <span className="font-bold text-lg">{lang==='ar'?'مشروع تجاري':'Commercial'}</span>
                       <span className="text-xs text-gray-500">{lang==='ar'?'فنادق، مطاعم (وحدات قياسية)':'Hotels, Restaurants (Standard units)'}</span>
                    </div>
                 </div>
              </div>
           )}

           {/* Step 2: Details (Spaces) */}
           {currentStep === 'details' && (
              <div className="p-8 animate-in fade-in slide-in-from-right duration-300">
                 <h2 className="text-xl font-bold text-ukra-navy mb-6">2. {lang==='ar'?'تفاصيل الغرف والمساحات':'Rooms & Areas'}</h2>
                 
                 <div className="bg-blue-50 p-4 rounded-lg mb-6 text-sm text-blue-800 flex gap-2">
                    <FileText className="w-5 h-5 flex-shrink-0" />
                    <p>
                       {lang==='ar'
                         ? 'الرجاء اختيار نوع الغرفة بدقة، حيث أن النظام يقوم بحساب مكونات الغرفة (سرير، دولاب، ستائر...) تلقائياً بناءً على النوع والمساحة.'
                         : 'Please select room type accurately. The system automatically calculates room components (Bed, Wardrobe, Curtains...) based on type and area.'}
                    </p>
                 </div>

                 {formData.projectCategory === 'residential' ? (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                       {formData.resSpaces.map((space, idx) => (
                          <div key={idx} className="flex flex-col md:flex-row gap-2 mb-4 p-3 bg-white rounded border border-gray-100 shadow-sm relative">
                             <div className="flex-grow">
                                <label className="text-xs font-bold text-gray-500 mb-1 block">Type</label>
                                <select 
                                   value={space.type} 
                                   onChange={(e) => updateSpace('res', idx, 'type', e.target.value)}
                                   className="input-std h-10 text-sm"
                                >
                                   {residentialRoomTypes.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                                {/* Show custom name input if 'Other' is selected */}
                                {space.type === 'Other' && (
                                   <input 
                                     type="text"
                                     placeholder={lang === 'ar' ? 'اسم الغرفة' : 'Room Name'}
                                     value={space.customName || ''}
                                     onChange={(e) => updateSpace('res', idx, 'customName', e.target.value)}
                                     className="input-std h-10 mt-2 text-sm border-ukra-gold"
                                   />
                                )}
                             </div>
                             <div className="w-full md:w-24">
                                <label className="text-xs font-bold text-gray-500 mb-1 block">Count</label>
                                <input type="number" value={space.count} onChange={(e) => updateSpace('res', idx, 'count', e.target.value)} className="input-std h-10 text-center" />
                             </div>
                             <div className="w-full md:w-32">
                                <label className="text-xs font-bold text-gray-500 mb-1 block">Area (m²)</label>
                                <input type="number" placeholder="20" value={space.area} onChange={(e) => updateSpace('res', idx, 'area', e.target.value)} className="input-std h-10 text-center" />
                             </div>
                             <button onClick={() => removeSpace('res', idx)} className="h-10 w-10 md:mt-6 flex items-center justify-center text-red-500 hover:bg-red-50 rounded bg-gray-50 border border-red-100 absolute top-2 right-2 md:relative md:top-auto md:right-auto">
                                <Trash2 className="w-4 h-4" />
                             </button>
                          </div>
                       ))}
                       <button onClick={() => addSpace('res')} className="mt-4 w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-ukra-gold hover:text-ukra-gold font-bold flex items-center justify-center gap-2 transition">
                          <Plus className="w-5 h-5" /> {lang==='ar'?'إضافة غرفة':'Add Room'}
                       </button>
                    </div>
                 ) : (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                       {formData.comSpaces.map((space, idx) => (
                          <div key={idx} className="flex flex-col md:flex-row gap-2 mb-4 p-3 bg-white rounded border border-gray-100 shadow-sm relative">
                             <div className="flex-grow">
                                <label className="text-xs font-bold text-gray-500 mb-1 block">Unit Type</label>
                                <select 
                                   value={space.type} 
                                   onChange={(e) => updateSpace('com', idx, 'type', e.target.value)}
                                   className="input-std h-10 text-sm"
                                >
                                   {commercialRoomTypes.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                                {space.type === 'Other' && (
                                   <input 
                                     type="text"
                                     placeholder={lang === 'ar' ? 'اسم الوحدة' : 'Unit Name'}
                                     value={space.customName || ''}
                                     onChange={(e) => updateSpace('com', idx, 'customName', e.target.value)}
                                     className="input-std h-10 mt-2 text-sm border-ukra-gold"
                                   />
                                )}
                             </div>
                             <div className="w-full md:w-24">
                                <label className="text-xs font-bold text-gray-500 mb-1 block">Count</label>
                                <input type="number" placeholder="10" value={space.count} onChange={(e) => updateSpace('com', idx, 'count', e.target.value)} className="input-std h-10 text-center" />
                             </div>
                             <div className="w-full md:w-32">
                                <label className="text-xs font-bold text-gray-500 mb-1 block">Avg Area</label>
                                <input type="number" placeholder="25" value={space.area} onChange={(e) => updateSpace('com', idx, 'area', e.target.value)} className="input-std h-10 text-center" />
                             </div>
                             <button onClick={() => removeSpace('com', idx)} className="h-10 w-10 md:mt-6 flex items-center justify-center text-red-500 hover:bg-red-50 rounded bg-gray-50 border border-red-100 absolute top-2 right-2 md:relative md:top-auto md:right-auto">
                                <Trash2 className="w-4 h-4" />
                             </button>
                          </div>
                       ))}
                       <button onClick={() => addSpace('com')} className="mt-4 w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-ukra-gold hover:text-ukra-gold font-bold flex items-center justify-center gap-2 transition">
                          <Plus className="w-5 h-5" /> {lang==='ar'?'إضافة وحدة':'Add Unit'}
                       </button>
                    </div>
                 )}
              </div>
           )}

           {/* Step 3: Specs */}
           {currentStep === 'specs' && (
              <div className="p-8 animate-in fade-in slide-in-from-right duration-300">
                 <h2 className="text-xl font-bold text-ukra-navy mb-6">3. {lang==='ar'?'المواصفات الفنية والنطاق':'Technical Specs & Scope'}</h2>
                 
                 {/* Package Scope */}
                 <div className="mb-8">
                    <label className="label-std mb-3">{lang==='ar'?'نطاق العمل (ماذا يشمل العرض؟)':'Scope of Work (What to include?)'}</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                       {packageScopes.map(pkg => (
                          <div 
                             key={pkg.id} 
                             onClick={() => togglePackage(pkg.id)}
                             className={`cursor-pointer p-4 rounded-lg border-2 flex items-center gap-3 transition ${formData.includedPackages.includes(pkg.id) ? 'border-ukra-gold bg-yellow-50' : 'border-gray-200 bg-white'}`}
                          >
                             <div className={`w-6 h-6 rounded flex items-center justify-center ${formData.includedPackages.includes(pkg.id) ? 'bg-ukra-gold text-white' : 'bg-gray-200'}`}>
                                {formData.includedPackages.includes(pkg.id) && <Check className="w-4 h-4" />}
                             </div>
                             <span className="font-bold text-sm text-ukra-navy">{pkg.label}</span>
                          </div>
                       ))}
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                       <label className="label-std">{lang==='ar'?'نوع الخشب الأساسي':'Wood Material'}</label>
                       <select name="woodType" value={formData.woodType} onChange={handleInputChange} className="input-std">
                          {woodOptions.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
                       </select>
                       <p className="text-xs text-gray-400 mt-1">
                          {lang==='ar'?'سيتم تطبيق هذا النوع على الدواليب، الخلفيات، والمكاتب.':'Applied to Wardrobes, Headboards, and Desks.'}
                       </p>
                    </div>
                    <div>
                       <label className="label-std">{lang==='ar'?'مستوى المفروشات والمراتب':'Furnishing Level'}</label>
                       <select name="furnitureLevel" value={formData.furnitureLevel} onChange={handleInputChange} className="input-std">
                          <option value="Economic">{lang==='ar'?'اقتصادي (180 غرزة / بونيل)':'Economic (180 TC / Bonnel)'}</option>
                          <option value="Medium">{lang==='ar'?'متوسط (250 غرزة / بوكيت)':'Medium (250 TC / Pocket)'}</option>
                          <option value="VIP">{lang==='ar'?'فاخر (300 غرزة / ميموري فوم)':'VIP (300 TC / Memory Foam)'}</option>
                       </select>
                    </div>
                    
                    {/* Cladding Logic */}
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 md:col-span-2">
                       <label className="label-std mb-2">{t('furn_lbl_cladding') || 'Wall Cladding?'}</label>
                       <div className="flex gap-4 mb-3">
                          <label className="flex items-center gap-2"><input type="radio" name="hasCladding" value="Yes" checked={formData.hasCladding === 'Yes'} onChange={handleInputChange} /> {lang==='ar'?'نعم':'Yes'}</label>
                          <label className="flex items-center gap-2"><input type="radio" name="hasCladding" value="No" checked={formData.hasCladding === 'No'} onChange={handleInputChange} /> {lang==='ar'?'لا':'No'}</label>
                       </div>
                       {formData.hasCladding === 'Yes' && (
                          <div className="animate-in slide-in-from-top-2">
                             <label className="text-xs font-bold text-gray-600">{lang==='ar'?'المساحة التقديرية (م٢)':'Approx Area (m²)'}</label>
                             <input type="number" name="claddingArea" value={formData.claddingArea} onChange={handleInputChange} className="input-std w-1/2 mt-1" />
                          </div>
                       )}
                    </div>

                    <div className="md:col-span-2">
                       <label className="label-std mb-2 flex items-center gap-2"><Camera className="w-4 h-4" /> {lang==='ar'?'مخطط الغرف (اختياري)':'Floor Plan (Optional)'}</label>
                       <div className="flex gap-2 flex-wrap">
                          {formData.images.map((img, i) => (
                             <div key={i} className="w-20 h-20 relative rounded overflow-hidden border">
                                <img src={`data:image/png;base64,${img.base64}`} className="w-full h-full object-cover" alt="upload" />
                             </div>
                          ))}
                          <label className="w-20 h-20 border-2 border-dashed rounded flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 text-gray-400">
                             <Upload className="w-6 h-6" />
                             <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                          </label>
                       </div>
                    </div>
                 </div>
              </div>
           )}

           {/* Step 4: Review */}
           {currentStep === 'review' && (
              <div className="p-8 animate-in fade-in slide-in-from-right duration-300 text-center">
                 <div className="w-16 h-16 bg-ukra-navy rounded-full flex items-center justify-center mx-auto mb-6 text-ukra-gold shadow-lg">
                    <Sparkles className="w-8 h-8" />
                 </div>
                 
                 <h2 className="text-2xl font-bold text-ukra-navy mb-2">{lang==='ar'?'جاهز للمعالجة':'Ready to Process'}</h2>
                 <p className="text-gray-500 max-w-md mx-auto mb-8">
                    {lang==='ar'
                      ? 'سيقوم النظام الآن بمطابقة مدخلاتك مع قاعدة بيانات المنتجات، وحساب الكميات بناءً على مساحات الغرف، وإرسال عرض السعر النهائي إليك.'
                      : 'The system will now match your inputs with our product database, calculate quantities based on room areas, and send you the final quotation.'}
                 </p>

                 <div className="bg-gray-50 rounded-xl p-6 text-start max-w-lg mx-auto border border-gray-200 text-sm space-y-3">
                    <div className="flex justify-between border-b pb-2">
                       <span className="text-gray-500">{lang==='ar'?'نوع المشروع':'Project Type'}</span>
                       <span className="font-bold text-ukra-navy uppercase">{formData.projectCategory}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                       <span className="text-gray-500">{lang==='ar'?'عدد الغرف/الوحدات':'Rooms/Units'}</span>
                       <span className="font-bold text-ukra-navy">
                          {(formData.projectCategory === 'residential' ? formData.resSpaces : formData.comSpaces).length}
                       </span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                       <span className="text-gray-500">{lang==='ar'?'خامة الخشب':'Wood Material'}</span>
                       <span className="font-bold text-ukra-navy">{formData.woodType.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                       <span className="text-gray-500">{lang==='ar'?'المستوى':'Level'}</span>
                       <span className="font-bold text-ukra-navy">{formData.furnitureLevel}</span>
                    </div>
                    <div className="flex justify-between">
                       <span className="text-gray-500">{lang==='ar'?'النطاق':'Scope'}</span>
                       <span className="font-bold text-ukra-navy text-xs">
                          {formData.includedPackages.join(', ')}
                       </span>
                    </div>
                 </div>
              </div>
           )}

           {/* Footer Navigation */}
           <div className="mt-auto bg-gray-50 p-6 border-t flex justify-between items-center">
              {currentStep !== 'category' && (
                 <button onClick={prevStep} className="px-6 py-2 rounded-lg text-gray-600 hover:bg-gray-200 font-bold">
                    {lang==='ar'?'سابق':'Back'}
                 </button>
              )}
              
              <div className="mr-auto"> {/* Spacer */}</div>

              {currentStep === 'review' ? (
                 <button onClick={handleSubmit} disabled={isSubmitting} className="btn-main flex items-center gap-2">
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <Check className="w-5 h-5" />}
                    {lang==='ar'?'إرسال والحصول على العرض':'Submit & Get Quote'}
                 </button>
              ) : (
                 <button onClick={nextStep} className="btn-main flex items-center gap-2">
                    {lang==='ar'?'التالي':'Next'} {dir === 'rtl' ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                 </button>
              )}
           </div>

        </div>
      </div>
    </div>
  );
};
