
import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { submitFurnitureQuote, fileToBase64 } from '../services/apiService';
import { generateSmartQuote, QuoteItem } from '../services/geminiQuote';
import { 
  Building, Home, Check, ChevronLeft, ChevronRight, 
  Plus, Trash2, Upload, Loader2, Sparkles, FileText, Camera
} from 'lucide-react';

type Step = 'category' | 'details' | 'specs' | 'review';

export const FurnitureRequest = () => {
  const { t, dir, lang } = useLanguage();
  const [currentStep, setCurrentStep] = useState<Step>('category');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // --- Form Data State ---
  const [formData, setFormData] = useState({
    referralSource: '',
    clientName: '',
    phone: '',
    email: '',
    
    // Category
    projectCategory: '' as 'residential' | 'commercial' | '',
    
    // Residential specific
    resType: 'Villa',
    resSpaces: [] as { name: string; area: string }[], // e.g., [{name: 'Master Bedroom', area: '30'}]
    
    // Commercial specific
    comType: 'Hotel',
    comProjectName: '',
    comSpaces: [] as { type: string; count: string; area: string }[], // e.g. [{type: 'Single Room', count: '50', area: '24'}]

    // Specs (Common)
    style: 'Modern',
    woodType: '',
    hasCladding: 'No',
    claddingArea: '',
    furnitureLevel: 'Medium', // Economic, Medium, VIP
    notes: '',
    
    // Images
    images: [] as { name: string; base64: string }[]
  });

  const [generatedQuote, setGeneratedQuote] = useState<QuoteItem[]>([]);

  // --- Helpers ---

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

  const addResSpace = () => {
    setFormData(prev => ({ ...prev, resSpaces: [...prev.resSpaces, { name: '', area: '' }] }));
  };
  const updateResSpace = (index: number, field: string, value: string) => {
    const newSpaces = [...formData.resSpaces];
    (newSpaces[index] as any)[field] = value;
    setFormData(prev => ({ ...prev, resSpaces: newSpaces }));
  };
  const removeResSpace = (index: number) => {
    setFormData(prev => ({ ...prev, resSpaces: prev.resSpaces.filter((_, i) => i !== index) }));
  };

  const addComSpace = () => {
    setFormData(prev => ({ ...prev, comSpaces: [...prev.comSpaces, { type: '', count: '', area: '' }] }));
  };
  const updateComSpace = (index: number, field: string, value: string) => {
    const newSpaces = [...formData.comSpaces];
    (newSpaces[index] as any)[field] = value;
    setFormData(prev => ({ ...prev, comSpaces: newSpaces }));
  };
  const removeComSpace = (index: number) => {
    setFormData(prev => ({ ...prev, comSpaces: prev.comSpaces.filter((_, i) => i !== index) }));
  };

  // --- Navigation & Submission ---

  const nextStep = () => {
    if (currentStep === 'category') setCurrentStep('details');
    else if (currentStep === 'details') setCurrentStep('specs');
    else if (currentStep === 'specs') generateQuote();
  };

  const prevStep = () => {
    if (currentStep === 'details') setCurrentStep('category');
    else if (currentStep === 'specs') setCurrentStep('details');
    else if (currentStep === 'review') setCurrentStep('specs');
  };

  const generateQuote = async () => {
    setIsGenerating(true);
    
    // Construct a descriptive prompt string for the AI
    let description = "";
    if (formData.projectCategory === 'residential') {
       description = `Residential Project (${formData.resType}). Spaces: ` + 
         formData.resSpaces.map(s => `${s.name} (${s.area}m2)`).join(', ');
    } else {
       description = `Commercial Project (${formData.comType}) - ${formData.comProjectName}. Spaces: ` + 
         formData.comSpaces.map(s => `${s.count}x ${s.type} (${s.area}m2)`).join(', ');
    }
    
    if (formData.hasCladding === 'Yes') description += `. Includes Wall Cladding: ${formData.claddingArea}m2.`;
    description += `. Style: ${formData.style}. Wood: ${formData.woodType}.`;
    description += ` Notes: ${formData.notes}`;

    // Call AI Service
    const items = await generateSmartQuote(description, formData.furnitureLevel);
    setGeneratedQuote(items);
    setIsGenerating(false);
    setCurrentStep('review');
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Prepare payload matching the structure expected by API Service and GAS
    const payload = {
      type: 'Furniture Request',
      client: {
        name: formData.clientName,
        phone: formData.phone,
        email: formData.email,
        source: formData.referralSource
      },
      project: {
        category: formData.projectCategory,
        type: formData.projectCategory === 'residential' ? formData.resType : formData.comType,
        name: formData.projectCategory === 'residential' ? formData.clientName + ' Res' : formData.comProjectName,
        details: formData.projectCategory === 'residential' ? JSON.stringify(formData.resSpaces) : JSON.stringify(formData.comSpaces),
        style: formData.style,
        level: formData.furnitureLevel,
        notes: formData.notes
      },
      items: generatedQuote.map(i => ({
        id: i.id,
        name: i.name,
        category: i.category,
        quantity: i.quantity,
        option: i.options ? i.options[0] : ''
      })),
      files: formData.images // Send images to GAS to save in Drive
    };

    const result = await submitFurnitureQuote(payload as any);
    setIsSubmitting(false);
    if (result) setSuccess(true);
    else alert("Error submitting request");
  };

  // --- Render Steps ---

  if (success) {
     return (
        <div className="min-h-screen bg-ukra-navy flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-lg text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
               <Check className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('alert_success_title')}</h2>
            <p className="text-gray-600 mb-6">
               تم إنشاء عرض السعر المبدئي وإرساله إلى بريدك الإلكتروني. سيقوم فريقنا بمراجعة التفاصيل والمرفقات والتواصل معك.
            </p>
            <button onClick={() => window.location.reload()} className="btn-main w-full">طلب جديد</button>
          </div>
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20 px-4 font-cairo" dir={dir}>
      <div className="max-w-4xl mx-auto">
        
        {/* Progress Header */}
        <div className="mb-8">
           <h1 className="text-3xl font-bold text-ukra-navy">استمارة التأثيث الذكية</h1>
           <p className="text-gray-500 mt-2">نظام تسعير فوري مدعوم بالذكاء الاصطناعي</p>
           
           <div className="flex items-center gap-2 mt-6">
              {[
                {id: 'category', label: 'النوع'}, 
                {id: 'details', label: 'المساحات'}, 
                {id: 'specs', label: 'المواصفات'}, 
                {id: 'review', label: 'العرض'}
              ].map((step, idx) => (
                 <div key={step.id} className={`flex-1 h-2 rounded-full transition-colors ${
                    ['category','details','specs','review'].indexOf(currentStep) >= idx ? 'bg-ukra-gold' : 'bg-gray-200'
                 }`} />
              ))}
           </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden min-h-[500px] flex flex-col">
           
           {/* Step 1: Category & Client */}
           {currentStep === 'category' && (
              <div className="p-8 animate-in fade-in slide-in-from-right duration-300">
                 <h2 className="text-xl font-bold text-ukra-navy mb-6">1. بيانات العميل ونوع المشروع</h2>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                       <label className="label-std">الاسم الكامل / الجهة</label>
                       <input required name="clientName" value={formData.clientName} onChange={handleInputChange} className="input-std" />
                    </div>
                    <div>
                       <label className="label-std">رقم الجوال</label>
                       <input required name="phone" value={formData.phone} onChange={handleInputChange} className="input-std" />
                    </div>
                    <div className="md:col-span-2">
                       <label className="label-std">البريد الإلكتروني (لاستلام العرض)</label>
                       <input required name="email" value={formData.email} onChange={handleInputChange} className="input-std" />
                    </div>
                    <div className="md:col-span-2">
                       <label className="label-std">مصدر المعرفة</label>
                       <select name="referralSource" value={formData.referralSource} onChange={handleInputChange} className="input-std">
                          <option value="">اختر...</option>
                          <option value="Google">Google</option>
                          <option value="Social">Social Media</option>
                       </select>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                      onClick={() => setFormData({...formData, projectCategory: 'residential'})}
                      className={`cursor-pointer p-6 rounded-xl border-2 flex flex-col items-center gap-3 transition hover:bg-gray-50 ${formData.projectCategory === 'residential' ? 'border-ukra-gold bg-yellow-50/50' : 'border-gray-200'}`}
                    >
                       <Home className={`w-12 h-12 ${formData.projectCategory === 'residential' ? 'text-ukra-gold' : 'text-gray-400'}`} />
                       <span className="font-bold text-lg">مشروع سكني</span>
                       <span className="text-xs text-gray-500">فلل، شقق، قصور</span>
                    </div>
                    <div 
                      onClick={() => setFormData({...formData, projectCategory: 'commercial'})}
                      className={`cursor-pointer p-6 rounded-xl border-2 flex flex-col items-center gap-3 transition hover:bg-gray-50 ${formData.projectCategory === 'commercial' ? 'border-ukra-gold bg-yellow-50/50' : 'border-gray-200'}`}
                    >
                       <Building className={`w-12 h-12 ${formData.projectCategory === 'commercial' ? 'text-ukra-gold' : 'text-gray-400'}`} />
                       <span className="font-bold text-lg">مشروع تجاري</span>
                       <span className="text-xs text-gray-500">فنادق، مكاتب، مطاعم</span>
                    </div>
                 </div>
              </div>
           )}

           {/* Step 2: Details (Spaces) */}
           {currentStep === 'details' && (
              <div className="p-8 animate-in fade-in slide-in-from-right duration-300">
                 <h2 className="text-xl font-bold text-ukra-navy mb-6">2. تفاصيل المساحات</h2>
                 
                 {formData.projectCategory === 'residential' ? (
                    <div className="space-y-6">
                       <div>
                          <label className="label-std">نوع الوحدة السكنية</label>
                          <select name="resType" value={formData.resType} onChange={handleInputChange} className="input-std">
                             <option value="Villa">فيلا</option>
                             <option value="Apartment">شقة</option>
                             <option value="Palace">قصر</option>
                             <option value="Majlis">مجلس خارجي</option>
                          </select>
                       </div>
                       
                       <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                          <h3 className="font-bold text-gray-700 mb-4 flex justify-between items-center">
                             قائمة الغرف والمساحات
                             <button onClick={addResSpace} type="button" className="text-xs bg-ukra-gold text-white px-2 py-1 rounded flex items-center gap-1 hover:bg-yellow-600">
                                <Plus className="w-3 h-3" /> إضافة مساحة
                             </button>
                          </h3>
                          {formData.resSpaces.map((space, idx) => (
                             <div key={idx} className="flex gap-2 mb-2">
                                <input 
                                  placeholder="اسم الغرفة (مثال: نوم رئيسية)" 
                                  value={space.name} 
                                  onChange={(e) => updateResSpace(idx, 'name', e.target.value)}
                                  className="flex-[2] input-std" 
                                />
                                <input 
                                  type="number" 
                                  placeholder="مساحة (م٢)" 
                                  value={space.area} 
                                  onChange={(e) => updateResSpace(idx, 'area', e.target.value)}
                                  className="flex-1 input-std" 
                                />
                                <button onClick={() => removeResSpace(idx)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 className="w-4 h-4" /></button>
                             </div>
                          ))}
                          {formData.resSpaces.length === 0 && <p className="text-sm text-gray-400 text-center py-4">أضف الغرف والمجالس لتتمكن من تسعيرها</p>}
                       </div>
                    </div>
                 ) : (
                    <div className="space-y-6">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                             <label className="label-std">نوع النشاط</label>
                             <select name="comType" value={formData.comType} onChange={handleInputChange} className="input-std">
                                <option value="Hotel">فندق / شقق مخدومة</option>
                                <option value="Office">مكتب إداري</option>
                                <option value="Restaurant">مطعم / كافيه</option>
                                <option value="Hall">قاعة أفراح / مناسبات</option>
                                <option value="Retail">معرض تجاري</option>
                             </select>
                          </div>
                          <div>
                             <label className="label-std">اسم المشروع</label>
                             <input name="comProjectName" value={formData.comProjectName} onChange={handleInputChange} className="input-std" placeholder="مثال: فندق الرواسي" />
                          </div>
                       </div>

                       <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                          <h3 className="font-bold text-gray-700 mb-4 flex justify-between items-center">
                             وحدات المشروع (الغرف، المكاتب، المرافق)
                             <button onClick={addComSpace} type="button" className="text-xs bg-ukra-gold text-white px-2 py-1 rounded flex items-center gap-1 hover:bg-yellow-600">
                                <Plus className="w-3 h-3" /> إضافة وحدة
                             </button>
                          </h3>
                          
                          {formData.comSpaces.length > 0 && (
                            <div className="flex gap-2 mb-2 text-xs font-bold text-gray-500 px-1">
                               <span className="flex-[2]">نوع الوحدة</span>
                               <span className="flex-1">العدد</span>
                               <span className="flex-1">مساحة الواحدة (م٢)</span>
                               <span className="w-8"></span>
                            </div>
                          )}

                          {formData.comSpaces.map((space, idx) => (
                             <div key={idx} className="flex gap-2 mb-2">
                                <select 
                                   value={space.type} 
                                   onChange={(e) => updateComSpace(idx, 'type', e.target.value)}
                                   className="flex-[2] input-std text-sm"
                                >
                                   <option value="">اختر...</option>
                                   {formData.comType === 'Hotel' && (
                                     <>
                                       <option value="Single Room">غرفة مفردة</option>
                                       <option value="Double Room">غرفة مزدوجة</option>
                                       <option value="Suite">جناح</option>
                                       <option value="Reception">استقبال</option>
                                       <option value="Corridor">ممرات</option>
                                     </>
                                   )}
                                   <option value="Office">مكتب</option>
                                   <option value="Meeting Room">قاعة اجتماعات</option>
                                   <option value="Seating Area">منطقة جلوس</option>
                                   <option value="Other">أخرى</option>
                                </select>
                                <input 
                                  type="number" 
                                  placeholder="0" 
                                  value={space.count} 
                                  onChange={(e) => updateComSpace(idx, 'count', e.target.value)}
                                  className="flex-1 input-std" 
                                />
                                <input 
                                  type="number" 
                                  placeholder="0" 
                                  value={space.area} 
                                  onChange={(e) => updateComSpace(idx, 'area', e.target.value)}
                                  className="flex-1 input-std" 
                                />
                                <button onClick={() => removeComSpace(idx)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 className="w-4 h-4" /></button>
                             </div>
                          ))}
                       </div>
                    </div>
                 )}
              </div>
           )}

           {/* Step 3: Specs & Uploads */}
           {currentStep === 'specs' && (
              <div className="p-8 animate-in fade-in slide-in-from-right duration-300">
                 <h2 className="text-xl font-bold text-ukra-navy mb-6">3. المواصفات والخامات</h2>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                       <label className="label-std">نمط التصميم (Style)</label>
                       <select name="style" value={formData.style} onChange={handleInputChange} className="input-std">
                          <option value="Modern">مودرن</option>
                          <option value="Classic">كلاسيك</option>
                          <option value="Neoclassic">نيوكلاسيك</option>
                          <option value="Boho">بوهيمي</option>
                          <option value="Islamic">إسلامي</option>
                       </select>
                    </div>
                    <div>
                       <label className="label-std">نوع الخشب المفضل</label>
                       <select name="woodType" value={formData.woodType} onChange={handleInputChange} className="input-std">
                          <option value="MDF German">MDF ألماني (عالي الجودة)</option>
                          <option value="Plywood">بليوود (مقاوم للماء)</option>
                          <option value="Solid Wood">خشب طبيعي (Solid)</option>
                          <option value="Melamine">ميلامين (اقتصادي)</option>
                       </select>
                    </div>
                    <div>
                       <label className="label-std">مستوى التأثيث</label>
                       <select name="furnitureLevel" value={formData.furnitureLevel} onChange={handleInputChange} className="input-std">
                          <option value="Economic">اقتصادي</option>
                          <option value="Medium">متوسط (فندقي 4 نجوم)</option>
                          <option value="VIP">فاخر (VIP / 5 نجوم)</option>
                       </select>
                    </div>
                    
                    {/* Cladding Logic */}
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 md:col-span-2">
                       <label className="label-std mb-2">هل ترغب بتكسيات جدارية؟</label>
                       <div className="flex gap-4 mb-3">
                          <label className="flex items-center gap-2"><input type="radio" name="hasCladding" value="Yes" checked={formData.hasCladding === 'Yes'} onChange={handleInputChange} /> نعم</label>
                          <label className="flex items-center gap-2"><input type="radio" name="hasCladding" value="No" checked={formData.hasCladding === 'No'} onChange={handleInputChange} /> لا</label>
                       </div>
                       {formData.hasCladding === 'Yes' && (
                          <div className="animate-in slide-in-from-top-2">
                             <label className="text-xs font-bold text-gray-600">المساحة التقديرية للجدران (م٢)</label>
                             <input type="number" name="claddingArea" value={formData.claddingArea} onChange={handleInputChange} className="input-std w-1/2 mt-1" />
                          </div>
                       )}
                    </div>

                    <div className="md:col-span-2">
                       <label className="label-std">ملاحظات إضافية</label>
                       <textarea name="notes" value={formData.notes} onChange={handleInputChange} className="input-std h-24" />
                    </div>

                    <div className="md:col-span-2">
                       <label className="label-std mb-2 flex items-center gap-2"><Camera className="w-4 h-4" /> صور للمخطط أو التصميم (اختياري)</label>
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

           {/* Step 4: Review & Quote */}
           {currentStep === 'review' && (
              <div className="p-8 animate-in fade-in slide-in-from-right duration-300">
                 <h2 className="text-xl font-bold text-ukra-navy mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-ukra-gold" /> عرض السعر المقترح
                 </h2>
                 <p className="text-sm text-gray-500 mb-6">قام النظام باختيار المنتجات التالية بناءً على مواصفات مشروعك. يمكنك اعتماد الطلب ليقوم فريقنا بتدقيقه.</p>

                 <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200 mb-6">
                    <table className="w-full text-sm">
                       <thead className="bg-ukra-navy text-white">
                          <tr>
                             <th className="p-3 text-start">المنتج</th>
                             <th className="p-3 text-center">الكمية</th>
                             <th className="p-3 text-end">سعر الوحدة (تقديري)</th>
                             <th className="p-3 text-end">الإجمالي</th>
                          </tr>
                       </thead>
                       <tbody>
                          {generatedQuote.map((item, i) => (
                             <tr key={i} className="border-b last:border-0 hover:bg-white">
                                <td className="p-3">
                                   <div className="font-bold">{item.name}</div>
                                   <div className="text-xs text-gray-500">{item.subcategory}</div>
                                </td>
                                <td className="p-3 text-center">{item.quantity}</td>
                                <td className="p-3 text-end">{item.price} SAR</td>
                                <td className="p-3 text-end font-bold">{(item.totalPrice).toLocaleString()} SAR</td>
                             </tr>
                          ))}
                       </tbody>
                       <tfoot className="bg-gray-100 font-bold">
                          <tr>
                             <td colSpan={3} className="p-3 text-end">الإجمالي التقديري:</td>
                             <td className="p-3 text-end text-ukra-navy text-lg">
                                {generatedQuote.reduce((sum, i) => sum + i.totalPrice, 0).toLocaleString()} SAR
                             </td>
                          </tr>
                       </tfoot>
                    </table>
                 </div>

                 <div className="flex items-start gap-2 bg-blue-50 p-4 rounded text-xs text-blue-800 mb-4">
                    <FileText className="w-4 h-4 flex-shrink-0" />
                    <p>هذا العرض مبدئي وتم توليده آلياً. قد تختلف الأسعار النهائية بناءً على الكميات الدقيقة والمواصفات الفنية المعتمدة بعد زيارة الموقع.</p>
                 </div>
              </div>
           )}

           {/* Footer Navigation */}
           <div className="mt-auto bg-gray-50 p-6 border-t flex justify-between items-center">
              {currentStep !== 'category' && (
                 <button onClick={prevStep} className="px-6 py-2 rounded-lg text-gray-600 hover:bg-gray-200 font-bold">
                    سابق
                 </button>
              )}
              
              <div className="mr-auto"> {/* Spacer */}</div>

              {currentStep === 'review' ? (
                 <button onClick={handleSubmit} disabled={isSubmitting} className="btn-main flex items-center gap-2">
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <Check className="w-5 h-5" />}
                    اعتماد وإرسال الطلب
                 </button>
              ) : currentStep === 'specs' ? (
                 <button onClick={nextStep} disabled={isGenerating} className="btn-main flex items-center gap-2">
                    {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    توليد عرض السعر
                 </button>
              ) : (
                 <button onClick={nextStep} className="btn-main flex items-center gap-2">
                    التالي {dir === 'rtl' ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                 </button>
              )}
           </div>

        </div>
      </div>
    </div>
  );
};
