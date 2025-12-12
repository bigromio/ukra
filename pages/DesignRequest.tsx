import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { fileToBase64, submitDesignRequest } from '../services/apiService';
import { Upload, Check, Loader2 } from 'lucide-react';
import { DesignRequestPayload } from '../types';

export const DesignRequest = () => {
  const { t, lang } = useLanguage();
  const [formData, setFormData] = useState<any>({
    referralSource: '',
    salesCode: '',
    fullName: '',
    phone: '',
    email: '',
    location: '',
    
    projectCategory: 'residential', // 'residential' | 'commercial'
    
    // Residential specific
    resType: 'شقة سكنية',
    resName: '',

    // Commercial specific
    comType: 'مكتب تجاري',
    comName: '',
    commName: '', // This corresponds to 'Space Name' in commercial context

    area: '',
    scope: [], // Array of strings
    style: [], // Array of strings
    colors: '', // Single string
    prefColors: '',
    dislikes: '',
    budget: 'غير محدد',
    notes: ''
  });

  // Stores images as objects { boxId, name, type, data } to match original script
  const [images, setImages] = useState<{ boxId: string, name: string, type: string, data: string, preview: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleCheckbox = (value: string, group: string) => {
    setFormData((prev: any) => {
      const current = prev[group] as string[];
      if (current.includes(value)) {
        return { ...prev, [group]: current.filter(item => item !== value) };
      } else {
        return { ...prev, [group]: [...current, value] };
      }
    });
  };

  const handleRadio = (value: string, group: string) => {
    setFormData((prev: any) => ({ ...prev, [group]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      if(file.size > 5 * 1024 * 1024) {
        alert(lang === 'ar' ? "حجم الصورة كبير جداً" : "Image too large (Max 5MB)");
        return;
      }
      try {
        const base64Full = await fileToBase64(file);
        const base64Data = base64Full.split(',')[1];
        const boxId = `box${index + 1}`;
        
        setImages(prev => {
          const newImages = prev.filter(img => img.boxId !== boxId); // Remove existing for this box
          newImages.push({
            boxId: boxId,
            name: file.name,
            type: file.type,
            data: base64Data,
            preview: base64Full
          });
          return newImages;
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const getImagePreview = (index: number) => {
    const boxId = `box${index + 1}`;
    return images.find(img => img.boxId === boxId)?.preview;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // --- Data Mapping Logic (Matching original form-logic.js) ---
    let finalProjectName = "";
    let finalPropertyType = "";

    if (formData.projectCategory === 'residential') {
        finalProjectName = formData.resName;
        finalPropertyType = formData.resType;
    } else {
        const cName = formData.comName;
        const cSpace = formData.commName;
        finalProjectName = cSpace ? `${cName} - ${cSpace}` : cName;
        finalPropertyType = formData.comType;
    }

    const scopeValues = formData.scope.join(" + ");
    const styleValues = formData.style.join(", ");

    const payload: DesignRequestPayload = {
      lang,
      referralSource: formData.referralSource,
      salesCode: formData.salesCode,
      fullName: formData.fullName,
      phone: formData.phone,
      email: formData.email,
      location: formData.location,
      
      projectName: finalProjectName,
      propertyType: finalPropertyType,
      
      area: formData.area,
      scope: scopeValues,
      style: styleValues,
      colors: formData.colors,
      prefColors: formData.prefColors,
      dislikes: formData.dislikes,
      budget: formData.budget,
      notes: formData.notes,
      images: images.map(({ preview, ...rest }) => rest) // Remove preview before sending
    };

    const ok = await submitDesignRequest(payload);
    setIsSubmitting(false);
    if (ok) setSuccess(true);
    else alert(lang === 'ar' ? "فشل الإرسال" : "Submission failed");
  };

  if (success) {
    return (
      <div className="form-page-bg flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl max-w-lg w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('alert_success_title')}</h2>
          <p className="text-gray-600 mb-6">{t('alert_success_msg')}</p>
          <button onClick={() => window.location.reload()} className="btn-main w-full">{t('btn_submit')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="form-page-bg pt-32 pb-20 px-4">
      <div className="text-center max-w-2xl mx-auto mb-10 text-white flow-up visible">
         <span className="section-tag">{t('story_tag')}</span>
         <h1 className="text-4xl font-bold mb-4">{t('form_title')}</h1>
         <p className="opacity-90">{t('form_subtitle')}</p>
      </div>

      <div className="form-container flow-up visible">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* 1. Referral Source */}
          <div className="bg-[#fffcf5] p-6 rounded-2xl border border-dashed border-ukra-gold">
             <label className="block font-bold mb-2 text-ukra-navy">{t('lbl_source')}</label>
             <select name="referralSource" required className="w-full p-3 rounded-lg border-gray-200 bg-white" onChange={handleChange}>
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
                <div className="mt-4">
                   <label className="block text-sm font-bold mb-1">{t('lbl_sales_code')}</label>
                   <input type="text" name="salesCode" placeholder="ex: UK-101" className="w-full p-3 rounded-lg border-gray-200" onChange={handleChange} required />
                </div>
             )}
          </div>

          {/* 2. Client Info */}
          <div>
            <h2 className="text-xl font-bold border-b pb-2 mb-4 text-ukra-navy">{t('head_client')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-bold mb-1">{t('lbl_name')}</label>
                 <input required type="text" name="fullName" className="w-full p-3 rounded-lg border border-gray-200" onChange={handleChange} />
               </div>
               <div>
                 <label className="block text-sm font-bold mb-1">{t('lbl_phone')}</label>
                 <input required type="tel" name="phone" placeholder="05xxxxxxxx" className="w-full p-3 rounded-lg border border-gray-200" onChange={handleChange} />
               </div>
               <div className="md:col-span-2">
                 <label className="block text-sm font-bold mb-1">{t('lbl_email')}</label>
                 <input required type="email" name="email" className="w-full p-3 rounded-lg border border-gray-200" onChange={handleChange} />
               </div>
               <div className="md:col-span-2">
                 <label className="block text-sm font-bold mb-1">{t('lbl_location')}</label>
                 <input required type="text" name="location" className="w-full p-3 rounded-lg border border-gray-200" onChange={handleChange} />
               </div>
            </div>
          </div>

          {/* 3. Project Details */}
          <div>
            <h2 className="text-xl font-bold border-b pb-2 mb-4 text-ukra-navy">{t('head_project')}</h2>
            
            <div className="mb-4">
               <label className="block text-sm font-bold mb-2">{t('lbl_category')}</label>
               <div className="flex gap-4">
                 <label className="flex items-center gap-2 cursor-pointer">
                   <input type="radio" name="projectCategory" value="residential" checked={formData.projectCategory === 'residential'} onChange={handleChange} />
                   <span className="font-bold">{t('cat_res')}</span>
                 </label>
                 <label className="flex items-center gap-2 cursor-pointer">
                   <input type="radio" name="projectCategory" value="commercial" checked={formData.projectCategory === 'commercial'} onChange={handleChange} />
                   <span className="font-bold">{t('cat_com')}</span>
                 </label>
               </div>
            </div>

            {formData.projectCategory === 'residential' ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-1">{t('lbl_res_type')}</label>
                    <select name="resType" className="w-full p-3 rounded-lg border-gray-200" onChange={handleChange}>
                      <option value="شقة سكنية">{t('opt_apt')}</option>
                      <option value="فيلا">{t('opt_villa')}</option>
                      <option value="قصر">{t('opt_palace')}</option>
                      <option value="مجلس / صالة">{t('opt_majlis')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">{t('lbl_space_name')}</label>
                    <input type="text" name="resName" className="w-full p-3 rounded-lg border border-gray-200" placeholder="مثال: غرفة معيشة" onChange={handleChange} />
                  </div>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-1">{t('lbl_com_type')}</label>
                    <select name="comType" className="w-full p-3 rounded-lg border-gray-200" onChange={handleChange}>
                      <option value="مكتب تجاري">{t('opt_office')}</option>
                      <option value="كافيه / مطعم">{t('opt_cafe')}</option>
                      <option value="فندق">{t('opt_hotel')}</option>
                      <option value="محل تجاري(Retail)">{t('opt_retail')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">{t('lbl_project_name')}</label>
                    <input type="text" name="comName" className="w-full p-3 rounded-lg border border-gray-200" onChange={handleChange} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold mb-1">{t('lbl_space_name')}</label>
                    <input type="text" name="commName" className="w-full p-3 rounded-lg border border-gray-200" placeholder="مثال: اللوبي، المكتب الرئيسي" onChange={handleChange} />
                  </div>
               </div>
            )}
            
            <div className="mt-4">
              <label className="block text-sm font-bold mb-1">{t('lbl_area')}</label>
              <input required type="number" name="area" placeholder="150" className="w-full p-3 rounded-lg border border-gray-200" onChange={handleChange} />
            </div>
          </div>

          {/* 4. Scope */}
          <div>
            <h2 className="text-xl font-bold border-b pb-2 mb-4 text-ukra-navy">{t('head_scope')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                  { val: 'مخطط 2D توزيع اثاث', key: 'scope_2d', icon: '📐' },
                  { val: 'صور واقعية 3D', key: 'scope_3d', icon: '🖼️' },
                  { val: 'جولة 360', key: 'scope_360', icon: '🔄' },
                  { val: 'فيديو', key: 'scope_video', icon: '🎬' }
              ].map((item) => (
                 <div 
                    key={item.key} 
                    onClick={() => handleCheckbox(item.val, 'scope')}
                    className={`style-card p-6 flex flex-col items-center justify-center gap-3 ${formData.scope.includes(item.val) ? 'selected' : ''}`}
                 >
                    <span className="text-3xl text-ukra-gold">{item.icon}</span>
                    <strong className="font-bold text-sm text-ukra-navy">{t(item.key as any)}</strong>
                 </div>
              ))}
            </div>
          </div>

          {/* 5. Style */}
          <div>
            <h2 className="text-xl font-bold border-b pb-2 mb-4 text-ukra-navy">{t('head_style')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {[
                 { id: 'st_modern', val: 'Modern', img: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=400' },
                 { id: 'st_neo', val: 'Neoclassic', img: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=400' },
                 { id: 'st_lux', val: 'Luxury', img: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=400' },
                 { id: 'st_boho', val: 'Boho', img: 'https://images.unsplash.com/photo-1522771753035-a15806bb6376?q=80&w=400' },
                 { id: 'st_ind', val: 'Industrial', img: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?q=80&w=400' },
                 { id: 'st_islamic', val: 'Islamic Modern', img: 'https://images.unsplash.com/photo-1552353617-3bfd9797249d?q=80&w=400' },
                 { id: 'st_scandinavian', val: 'Scandinavian', img: 'https://images.unsplash.com/photo-1532323544230-7191fd51bc1b?q=80&w=400' },
                 { id: 'st_minimal', val: 'Minimalist', img: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=400' },
               ].map((style) => (
                 <div 
                    key={style.id} 
                    onClick={() => handleCheckbox(style.val, 'style')}
                    className={`style-card ${formData.style.includes(style.val) ? 'selected' : ''}`}
                 >
                    <img src={style.img} alt={style.id} />
                    <div className="p-3 font-bold text-sm text-ukra-navy">{t(style.id as any)}</div>
                 </div>
               ))}
            </div>
          </div>
          
          {/* 6. Colors */}
          <div>
            <h2 className="text-xl font-bold border-b pb-2 mb-4 text-ukra-navy">{t('head_colors')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {[
                 { id: 'pal_warm_earth', val: 'Warm Earth', colors: ['#8D6E63', '#D7CCC8', '#5D4037', '#A1887F'] },
                 { id: 'pal_neutral_calm', val: 'Neutral Calm', colors: ['#F5F5F5', '#E0E0E0', '#9E9E9E', '#FFFFFF'] },
                 { id: 'pal_ocean_breeze', val: 'Ocean Breeze', colors: ['#E0F7FA', '#B2EBF2', '#00BCD4', '#0097A7'] },
                 { id: 'pal_forest_nature', val: 'Forest Nature', colors: ['#E8F5E9', '#C8E6C9', '#4CAF50', '#2E7D32'] },
                 { id: 'pal_moody_dark', val: 'Moody Dark', colors: ['#212121', '#424242', '#757575', '#000000'] },
                 { id: 'pal_greige_luxury', val: 'Greige Luxury', colors: ['#CFC6BD', '#A89F91', '#EFEBE9', '#D7CCC8'] },
                 { id: 'pal_royal_blue', val: 'Royal Blue', colors: ['#E8EAF6', '#C5CAE9', '#3F51B5', '#1A237E'] },
                 { id: 'pal_gold_black', val: 'Gold & Black', colors: ['#000000', '#212121', '#FFD700', '#FFECB3'] },
               ].map((pal) => (
                 <div 
                    key={pal.id} 
                    onClick={() => handleRadio(pal.val, 'colors')}
                    className={`palette-card ${formData.colors === pal.val ? 'selected' : ''}`}
                 >
                    <div className="color-bars">
                       {pal.colors.map(c => <div key={c} className="color-stripe" style={{background: c}} />)}
                    </div>
                    <span className="text-xs font-bold text-gray-700">{t(pal.id as any)}</span>
                 </div>
               ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div>
                    <label className="block text-sm font-bold mb-1">{t('lbl_prefColors')}</label>
                    <input type="text" name="prefColors" className="w-full p-3 rounded-lg border border-gray-200" onChange={handleChange} />
                </div>
                <div>
                    <label className="block text-sm font-bold mb-1">{t('lbl_dislikes')}</label>
                    <input type="text" name="dislikes" className="w-full p-3 rounded-lg border border-gray-200" onChange={handleChange} />
                </div>
            </div>
          </div>
          
          {/* 7. Budget & Images */}
          <div>
            <h2 className="text-xl font-bold border-b pb-2 mb-4 text-ukra-navy">{t('head_budget')}</h2>
            <div className="mb-6">
               <label className="block text-sm font-bold mb-1">{t('lbl_budget')}</label>
               <select name="budget" className="w-full p-3 rounded-lg border border-gray-200" onChange={handleChange}>
                 <option value="اقتصادية">{t('opt_eco')}</option>
                 <option value="متوسطة">{t('opt_med')}</option>
                 <option value="فخمة / VIP">{t('opt_vip')}</option>
                 <option value="غير محدد">{t('opt_na')}</option>
               </select>
            </div>
            
            <p className="text-sm text-gray-500 mb-2">{t('lbl_upload_hint')}</p>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
               {[0,1,2,3,4,5].map(i => (
                 <label key={i} className={`aspect-square border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 relative overflow-hidden transition-colors ${getImagePreview(i) ? 'border-ukra-gold bg-white' : 'border-gray-300 bg-gray-50'}`}>
                    {getImagePreview(i) ? (
                      <img src={getImagePreview(i)} className="absolute inset-0 w-full h-full object-cover" alt="preview" />
                    ) : (
                      <div className="text-center">
                        <Upload className="w-6 h-6 text-gray-300 mx-auto" />
                        <span className="text-xs text-gray-400">{t('txt_upload')}</span>
                      </div>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, i)} />
                 </label>
               ))}
            </div>
            
            <div className="mt-6">
                <label className="block text-sm font-bold mb-1">{t('lbl_notes')}</label>
                <textarea rows={4} name="notes" className="w-full p-3 rounded-lg border border-gray-200" onChange={handleChange} />
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-main w-full flex items-center justify-center gap-2 text-lg">
            {isSubmitting && <Loader2 className="animate-spin w-5 h-5" />}
            {t('btn_submit')}
          </button>

        </form>
      </div>
    </div>
  );
};