import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { fileToBase64, submitToGAS } from '../services/apiService';
import { Upload, Check, Loader2 } from 'lucide-react';

export const DesignRequest = () => {
  const { t, lang } = useLanguage();
  const [formData, setFormData] = useState<any>({
    source: '',
    salesCode: '',
    fullName: '',
    phone: '',
    email: '',
    location: '',
    projectCategory: 'residential',
    
    // Residential specific
    resType: 'Apartment',
    resName: '',

    // Commercial specific
    comType: 'Office',
    comName: '',
    comSpaceName: '',

    area: '',
    scope: [],
    style: [],
    colors: '',
    prefColors: '',
    dislikes: '',
    budget: '',
    notes: ''
  });

  const [images, setImages] = useState<{ id: string, base64: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>, group: string) => {
    const { value, checked } = e.target;
    setFormData((prev: any) => {
      const current = prev[group] as string[];
      if (checked) return { ...prev, [group]: [...current, value] };
      return { ...prev, [group]: current.filter(item => item !== value) };
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      if(file.size > 5 * 1024 * 1024) {
        alert("Image too large (Max 5MB)");
        return;
      }
      try {
        const base64 = await fileToBase64(file);
        setImages(prev => {
          const newImages = [...prev];
          newImages[index] = { id: `img-${index}`, base64 };
          return newImages;
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const finalPayload = {
      type: 'design',
      ...formData,
      images: images.map(i => i.base64),
      lang
    };

    const ok = await submitToGAS(finalPayload);
    setIsSubmitting(false);
    if (ok) setSuccess(true);
    else alert("Submission failed. Please try again.");
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
          <button onClick={() => window.location.reload()} className="btn-main w-full">Start New Request</button>
        </div>
      </div>
    );
  }

  return (
    <div className="form-page-bg pt-32 pb-20 px-4">
      <div className="text-center max-w-2xl mx-auto mb-10 text-white flow-up visible">
         <span className="section-tag">{t('hero_tag')}</span>
         <h1 className="text-4xl font-bold mb-4">{t('form_title')}</h1>
         <p className="opacity-90">{t('form_subtitle')}</p>
      </div>

      <div className="form-container flow-up visible">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Source */}
          <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
             <label className="block font-bold mb-2 text-ukra-navy">{t('lbl_source')}</label>
             <select name="source" required className="w-full p-3 rounded-lg border-gray-200" onChange={handleChange}>
                <option value="">{t('opt_select')}</option>
                <option value="Google">Google Search</option>
                <option value="Social">Instagram/Social</option>
                <option value="Sales">{t('opt_sales')}</option>
             </select>
             {formData.source === 'Sales' && (
                <div className="mt-4">
                   <label className="block text-sm font-bold mb-1">{t('lbl_sales_code')}</label>
                   <input type="text" name="salesCode" className="w-full p-3 rounded-lg border-gray-200" onChange={handleChange} />
                </div>
             )}
          </div>

          {/* Client Info */}
          <div>
            <h2 className="text-xl font-bold border-b pb-2 mb-4 text-ukra-navy">{t('head_client')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-bold mb-1">{t('lbl_name')}</label>
                 <input required type="text" name="fullName" className="w-full p-3 rounded-lg border border-gray-200" onChange={handleChange} />
               </div>
               <div>
                 <label className="block text-sm font-bold mb-1">{t('lbl_phone')}</label>
                 <input required type="tel" name="phone" className="w-full p-3 rounded-lg border border-gray-200" onChange={handleChange} />
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

          {/* Project Details */}
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
                      <option value="Apartment">{t('opt_apt')}</option>
                      <option value="Villa">{t('opt_villa')}</option>
                      <option value="Palace">{t('opt_palace')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">{t('lbl_space_name')}</label>
                    <input type="text" name="resName" className="w-full p-3 rounded-lg border border-gray-200" placeholder="e.g. Living Room" onChange={handleChange} />
                  </div>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-1">{t('lbl_com_type')}</label>
                    <select name="comType" className="w-full p-3 rounded-lg border-gray-200" onChange={handleChange}>
                      <option value="Office">{t('opt_office')}</option>
                      <option value="Restaurant">{t('opt_cafe')}</option>
                      <option value="Hotel">{t('opt_hotel')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">{t('lbl_project_name')}</label>
                    <input type="text" name="comName" className="w-full p-3 rounded-lg border border-gray-200" onChange={handleChange} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold mb-1">{t('lbl_space_name')}</label>
                    <input type="text" name="comSpaceName" className="w-full p-3 rounded-lg border border-gray-200" placeholder="e.g. Lobby" onChange={handleChange} />
                  </div>
               </div>
            )}
            
            <div className="mt-4">
              <label className="block text-sm font-bold mb-1">{t('lbl_area')}</label>
              <input required type="number" name="area" className="w-full p-3 rounded-lg border border-gray-200" onChange={handleChange} />
            </div>
          </div>

          {/* Scope */}
          <div>
            <h2 className="text-xl font-bold border-b pb-2 mb-4 text-ukra-navy">{t('head_scope')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['scope_2d', 'scope_3d', 'scope_360', 'scope_video'].map((scope) => (
                 <label key={scope} className={`style-card p-4 flex flex-col items-center justify-center gap-2 ${formData.scope.includes(scope) ? 'selected' : ''}`}>
                    <input type="checkbox" className="hidden" value={scope} onChange={(e) => handleCheckbox(e, 'scope')} />
                    <span className="text-2xl">✨</span>
                    <span className="font-bold text-sm">{t(scope as any)}</span>
                 </label>
              ))}
            </div>
          </div>

          {/* Style */}
          <div>
            <h2 className="text-xl font-bold border-b pb-2 mb-4 text-ukra-navy">{t('head_style')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {[
                 { id: 'st_modern', img: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=400' },
                 { id: 'st_neo', img: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=400' },
                 { id: 'st_lux', img: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=400' },
                 { id: 'st_islamic', img: 'https://images.unsplash.com/photo-1552353617-3bfd9797249d?q=80&w=400' }
               ].map((style) => (
                 <label key={style.id} className={`style-card ${formData.style.includes(style.id) ? 'selected' : ''}`}>
                    <input type="checkbox" className="hidden" value={style.id} onChange={(e) => handleCheckbox(e, 'style')} />
                    <img src={style.img} alt={style.id} />
                    <div className="p-3 font-bold text-sm">{t(style.id as any)}</div>
                 </label>
               ))}
            </div>
          </div>
          
          {/* Colors */}
          <div>
            <h2 className="text-xl font-bold border-b pb-2 mb-4 text-ukra-navy">{t('head_colors')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {[
                 { id: 'pal_warm_earth', colors: ['#8D6E63', '#D7CCC8', '#5D4037'] },
                 { id: 'pal_neutral_calm', colors: ['#F5F5F5', '#E0E0E0', '#9E9E9E'] },
                 { id: 'pal_ocean_breeze', colors: ['#E0F7FA', '#B2EBF2', '#00BCD4'] },
                 { id: 'pal_gold_black', colors: ['#000000', '#212121', '#FFD700'] },
               ].map((pal) => (
                 <label key={pal.id} className={`palette-card ${formData.colors === pal.id ? 'selected' : ''}`}>
                    <input type="radio" name="colors" value={pal.id} className="hidden" onChange={handleChange} />
                    <div className="color-bars">
                       {pal.colors.map(c => <div key={c} className="color-stripe" style={{background: c}} />)}
                    </div>
                    <span className="text-xs font-bold">{t(pal.id as any)}</span>
                 </label>
               ))}
            </div>
          </div>
          
          {/* Uploads */}
          <div>
            <h2 className="text-xl font-bold border-b pb-2 mb-4 text-ukra-navy">{t('head_budget')}</h2>
            <div className="mb-6">
               <label className="block text-sm font-bold mb-1">{t('lbl_budget')}</label>
               <select name="budget" className="w-full p-3 rounded-lg border border-gray-200" onChange={handleChange}>
                 <option value="Economic">{t('opt_eco')}</option>
                 <option value="Medium">{t('opt_med')}</option>
                 <option value="VIP">{t('opt_vip')}</option>
                 <option value="Not Specified">{t('opt_na')}</option>
               </select>
            </div>
            
            <p className="text-sm text-gray-500 mb-2">{t('lbl_upload_hint')}</p>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
               {[0,1,2,3,4,5].map(i => (
                 <label key={i} className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 relative overflow-hidden">
                    {images[i] ? (
                      <img src={images[i].base64} className="absolute inset-0 w-full h-full object-cover" />
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
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-main w-full flex items-center justify-center gap-2">
            {isSubmitting && <Loader2 className="animate-spin w-5 h-5" />}
            {t('btn_submit')}
          </button>

        </form>
      </div>
    </div>
  );
};