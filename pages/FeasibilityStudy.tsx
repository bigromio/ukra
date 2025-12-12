import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { submitFeasibilityStudy } from '../services/apiService';
import { Loader2, Check } from 'lucide-react';
import { FeasibilityPayload } from '../types';

export const FeasibilityStudy = () => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    location: '',
    budget: '',
    areaSize: '',
    projectType: 'Retail',
    contactName: '',
    contactEmail: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const payload: FeasibilityPayload = { 
      type: 'feasibility', 
      location: formData.location,
      budget: formData.budget,
      areaSize: formData.areaSize,
      projectType: formData.projectType,
      contactName: formData.contactName,
      contactEmail: formData.contactEmail,
      timestamp: new Date().toISOString()
    };
    
    const ok = await submitFeasibilityStudy(payload);
    setIsSubmitting(false);
    if(ok) setSuccess(true);
  };

  if (success) {
      return (
        <div className="form-page-bg flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-xl max-w-lg w-full text-center shadow-2xl">
            <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Request Received</h2>
            <p>Our consultants will analyze your project details and contact you shortly.</p>
          </div>
        </div>
      );
  }

  return (
    <div className="form-page-bg pt-32 pb-20 px-4">
      <div className="form-container flow-up visible">
        <h1 className="text-3xl font-bold text-ukra-navy mb-2 text-center">{t('development_title')}</h1>
        <p className="text-gray-500 text-center mb-8">{t('development_desc')}</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
               <label className="block text-sm font-bold mb-1 text-gray-700">{t('lbl_project_name')}</label>
               <select name="projectType" className="w-full p-3 rounded-lg border border-gray-200" onChange={handleChange}>
                 <option value="Retail">{t('feat_retail_fitout')}</option>
                 <option value="Hotel">{t('opt_hotel')}</option>
                 <option value="Restaurant">{t('opt_cafe')}</option>
               </select>
             </div>
             <div>
               <label className="block text-sm font-bold mb-1 text-gray-700">{t('lbl_location')}</label>
               <input required type="text" name="location" className="w-full p-3 rounded-lg border border-gray-200" onChange={handleChange} />
             </div>
             <div>
               <label className="block text-sm font-bold mb-1 text-gray-700">{t('lbl_budget')}</label>
               <input required type="number" name="budget" className="w-full p-3 rounded-lg border border-gray-200" onChange={handleChange} />
             </div>
             <div>
               <label className="block text-sm font-bold mb-1 text-gray-700">{t('lbl_area')}</label>
               <input required type="number" name="areaSize" className="w-full p-3 rounded-lg border border-gray-200" onChange={handleChange} />
             </div>
          </div>
          
          <div className="border-t pt-6 mt-6">
            <h3 className="font-bold mb-4 text-ukra-navy">{t('head_client')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <input required type="text" name="contactName" placeholder={t('lbl_name')} className="w-full p-3 rounded-lg border border-gray-200" onChange={handleChange} />
               <input required type="email" name="contactEmail" placeholder={t('lbl_email')} className="w-full p-3 rounded-lg border border-gray-200" onChange={handleChange} />
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-main w-full flex justify-center items-center gap-2">
            {isSubmitting && <Loader2 className="animate-spin" />}
            {t('btn_submit')}
          </button>
        </form>
      </div>
    </div>
  );
};