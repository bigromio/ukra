
import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { submitFurnitureQuote } from '../services/apiService';
import { FURNITURE_CATALOG, CatalogItem } from '../data/furnitureCatalog';
import { 
  Loader2, Check, ChevronDown, ChevronUp, Sparkles, 
  Bed, Sofa, Bath, Cpu, Briefcase, Hotel, Building 
} from 'lucide-react';

interface SelectedItem {
  id: string;
  name: string;
  quantity: number;
  option?: string;
  category: string;
}

export const FurnitureRequest = () => {
  const { t, lang, dir } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Accordion State
  const [openSection, setOpenSection] = useState<string | null>('furniture');

  // Form State
  const [formData, setFormData] = useState({
    referralSource: '',
    clientName: '',
    phone: '',
    email: '',
    projectType: 'hotel', // hotel | commercial | residential
    projectName: '',
    floors: '',
    rooms: '',
    receptionCount: '',
    projectDesc: '', // For AI
  });

  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  // --- Handlers ---

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleItemToggle = (item: CatalogItem, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, { 
        id: item.id, 
        name: item.name, 
        quantity: 1, 
        option: item.options ? item.options[0] : undefined,
        category: item.category 
      }]);
    } else {
      setSelectedItems(prev => prev.filter(i => i.id !== item.id));
    }
  };

  const updateItemQuantity = (id: string, qty: number) => {
    setSelectedItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };

  const updateItemOption = (id: string, option: string) => {
    setSelectedItems(prev => prev.map(i => i.id === id ? { ...i, option } : i));
  };

  // --- AI "Magic" Logic ---
  const handleAiAutoFill = () => {
    if (!formData.projectDesc) return;
    setAiLoading(true);

    // Simulate AI Processing time
    setTimeout(() => {
      const desc = formData.projectDesc;
      const newItems: SelectedItem[] = [];
      
      // Simple Heuristics for Demo purposes
      // 1. Detect Room Count from description or input
      const roomMatch = desc.match(/(\d+)\s*(غرفة|غرف|room|rooms)/i);
      const rooms = roomMatch ? parseInt(roomMatch[1]) : (parseInt(formData.rooms) || 0);

      if (rooms > 0) {
        // Suggest Beds
        newItems.push({ id: 'f-headboard', name: 'ظهر سرير (Headboard)', quantity: rooms, category: 'furniture', option: 'شيبورد ألماني' });
        newItems.push({ id: 'f-bedbase-double', name: 'بوكس سرير مزدوج', quantity: rooms, category: 'furniture' });
        newItems.push({ id: 'l-mattress-lux-k', name: 'مرتبة فاخرة King', quantity: rooms, category: 'furnishing' });
        newItems.push({ id: 'f-wardrobe-slide', name: 'دولاب ملابس سحاب', quantity: rooms, category: 'furniture', option: 'شيبورد إسباني' });
        newItems.push({ id: 'a-kettle-steel', name: 'غلاية ستيل', quantity: rooms, category: 'appliances' });
        newItems.push({ id: 'a-minibar-glass', name: 'ميني بار زجاج', quantity: rooms, category: 'appliances' });
        newItems.push({ id: 'a-safe-laptop', name: 'خزنة لابتوب', quantity: rooms, category: 'appliances' });
      }

      // 2. Detect "Luxury" or "VIP" keyword
      if (desc.includes('فخمة') || desc.includes('VIP') || desc.includes('luxury')) {
         newItems.push({ id: 'a-bath-set-resin', name: 'طقم حمام Resin', quantity: rooms > 0 ? rooms : 10, category: 'accessories' });
         newItems.push({ id: 'l-robe-waffle', name: 'روب حمام Waffle', quantity: rooms > 0 ? rooms * 2 : 20, category: 'furnishing' });
      }

      // Merge with existing
      const currentIds = selectedItems.map(i => i.id);
      const toAdd = newItems.filter(i => !currentIds.includes(i.id));
      
      setSelectedItems(prev => [...prev, ...toAdd]);
      setAiLoading(false);
      
      // Feedback
      if(toAdd.length > 0) alert(lang === 'ar' ? `تم إضافة ${toAdd.length} منتجات مقترحة بناءً على وصفك` : `Added ${toAdd.length} items based on your description`);
      
    }, 1500);
  };

  // --- Submission ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      type: 'Furniture Request',
      client: {
        name: formData.clientName,
        phone: formData.phone,
        email: formData.email,
        source: formData.referralSource
      },
      project: {
        type: formData.projectType,
        name: formData.projectName,
        floors: formData.floors,
        rooms: formData.rooms,
        reception: formData.receptionCount,
        description: formData.projectDesc
      },
      items: selectedItems
    };

    // Fire and forget - Don't wait for Google Script response to keep UI snappy
    submitFurnitureQuote(payload as any).catch(err => console.error("Background submission error", err));

    // Show success immediately
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccess(true);
    }, 1000);
  };

  const renderAccordionSection = (
    key: string, 
    title: string, 
    icon: React.ReactNode, 
    filterFn: (i: CatalogItem) => boolean
  ) => {
    const isOpen = openSection === key;
    const items = FURNITURE_CATALOG.filter(filterFn);
    const selectedCount = selectedItems.filter(i => filterFn({ category: i.category } as any)).length;

    return (
      <div className="border border-gray-200 rounded-xl overflow-hidden mb-4 bg-white shadow-sm">
        <button 
          type="button"
          onClick={() => setOpenSection(isOpen ? null : key)}
          className={`w-full flex items-center justify-between p-4 transition-colors ${isOpen ? 'bg-ukra-navy text-white' : 'bg-white hover:bg-gray-50 text-gray-800'}`}
        >
          <div className="flex items-center gap-3">
             <div className={`${isOpen ? 'text-ukra-gold' : 'text-ukra-navy'}`}>{icon}</div>
             <div className="text-start">
               <h3 className="font-bold text-lg">{title}</h3>
               {selectedCount > 0 && <span className="text-xs opacity-80">{selectedCount} products selected</span>}
             </div>
          </div>
          {isOpen ? <ChevronUp /> : <ChevronDown />}
        </button>
        
        {isOpen && (
          <div className="p-4 bg-gray-50 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
             {items.map(item => {
               const isSelected = selectedItems.some(i => i.id === item.id);
               const currentSelection = selectedItems.find(i => i.id === item.id);

               return (
                 <div key={item.id} className={`p-4 rounded-lg border transition ${isSelected ? 'border-ukra-gold bg-white shadow-md' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                    <div className="flex items-start gap-3">
                       <input 
                         type="checkbox" 
                         checked={isSelected} 
                         onChange={(e) => handleItemToggle(item, e.target.checked)}
                         className="mt-1 w-5 h-5 text-ukra-gold rounded focus:ring-ukra-gold cursor-pointer"
                       />
                       <div className="flex-1">
                          <p className="font-bold text-gray-800">{item.name}</p>
                          <p className="text-xs text-gray-500 mb-2">{item.subcategory} • {item.unit}</p>
                          
                          {isSelected && (
                            <div className="mt-3 flex flex-wrap gap-2 items-center animate-in fade-in">
                               <div className="flex items-center border rounded-md overflow-hidden bg-gray-50">
                                  <span className="px-2 text-xs text-gray-500 bg-gray-100 border-r py-2">الكمية</span>
                                  <input 
                                    type="number" 
                                    min="1" 
                                    value={currentSelection?.quantity} 
                                    onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value))}
                                    className="w-20 p-1 text-center outline-none bg-white font-bold"
                                  />
                               </div>
                               
                               {item.options && (
                                 <select 
                                   value={currentSelection?.option} 
                                   onChange={(e) => updateItemOption(item.id, e.target.value)}
                                   className="text-sm p-1.5 border rounded bg-white max-w-[150px]"
                                 >
                                    {item.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                 </select>
                               )}
                            </div>
                          )}
                       </div>
                    </div>
                 </div>
               );
             })}
          </div>
        )}
      </div>
    );
  };

  if (success) {
    return (
      <div className="min-h-screen bg-ukra-navy flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-lg text-center animate-in zoom-in duration-500">
           <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
             <Check className="w-10 h-10 text-green-600" />
           </div>
           <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('alert_success_title')}</h2>
           <p className="text-gray-600 mb-6">
             تم استلام طلب تسعير الأثاث الخاص بمشروعك 
             <span className="font-bold block mt-1 text-ukra-navy">"{formData.projectName}"</span>
           </p>
           <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 mb-6">
              يتم الآن معالجة الطلب عبر نظامنا. سيصلك عرض السعر المبدئي والكتالوج التفصيلي على بريدك الإلكتروني خلال دقائق.
           </div>
           <button onClick={() => window.location.href = '/'} className="btn-main w-full">العودة للرئيسية</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-cairo" dir={dir}>
      {/* Hero Header */}
      <div className="bg-ukra-navy text-white pt-32 pb-16 px-4 relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1920')] bg-cover bg-center"></div>
         <div className="max-w-4xl mx-auto text-center relative z-10">
            <h1 className="text-3xl md:text-5xl font-black mb-4 text-ukra-gold">بناء تجارب ضيافة استثنائية</h1>
            <p className="text-lg md:text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto">
               شريكك المعتمد في تأثيث الفنادق والمشاريع التجارية. نلتزم بأعلى معايير الجودة ومتطلبات وزارة السياحة السعودية، لنضمن لضيوفك الراحة والفخامة التي يستحقونها.
            </p>
         </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-10 relative z-20 pb-20">
        <form onSubmit={handleSubmit} className="space-y-6">
           
           {/* 1. Project & Client Info */}
           <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border-t-4 border-ukra-gold">
              <h2 className="text-xl font-bold text-ukra-navy mb-6 flex items-center gap-2">
                 <Briefcase className="w-5 h-5 text-ukra-gold" /> بيانات العميل والمشروع
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Source */}
                 <div className="md:col-span-2 bg-yellow-50 p-4 rounded-xl border border-yellow-100 mb-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">كيف عرفت عن أوكرة؟</label>
                    <select name="referralSource" required className="w-full p-3 rounded-lg border-gray-200 bg-white" onChange={handleInputChange}>
                        <option value="">اختر...</option>
                        <option value="Google">بحث جوجل</option>
                        <option value="Social">وسائل التواصل</option>
                        <option value="Referral">توصية من صديق</option>
                        <option value="Ads">إعلان</option>
                    </select>
                 </div>

                 {/* Client */}
                 <div>
                    <label className="block text-sm font-bold mb-1">الاسم الكامل / اسم الشركة</label>
                    <input required name="clientName" className="w-full p-3 rounded-lg border border-gray-300 focus:ring-ukra-gold focus:border-ukra-gold" onChange={handleInputChange} />
                 </div>
                 <div>
                    <label className="block text-sm font-bold mb-1">رقم الجوال</label>
                    <input required name="phone" type="tel" className="w-full p-3 rounded-lg border border-gray-300 focus:ring-ukra-gold focus:border-ukra-gold" onChange={handleInputChange} />
                 </div>
                 <div className="md:col-span-2">
                    <label className="block text-sm font-bold mb-1">البريد الإلكتروني (لاستلام عرض السعر)</label>
                    <input required name="email" type="email" className="w-full p-3 rounded-lg border border-gray-300 focus:ring-ukra-gold focus:border-ukra-gold" onChange={handleInputChange} />
                 </div>

                 {/* Project Type */}
                 <div className="md:col-span-2 pt-4 border-t">
                    <label className="block text-sm font-bold mb-3">نوع المشروع</label>
                    <div className="flex gap-4">
                       <label className={`flex-1 p-4 rounded-xl border-2 cursor-pointer flex flex-col items-center gap-2 transition ${formData.projectType === 'hotel' ? 'border-ukra-gold bg-yellow-50 text-ukra-navy' : 'border-gray-200 text-gray-500'}`}>
                          <input type="radio" name="projectType" value="hotel" checked={formData.projectType === 'hotel'} onChange={handleInputChange} className="hidden" />
                          <Hotel className="w-6 h-6" />
                          <span className="font-bold">فندق / شقق فندقية</span>
                       </label>
                       <label className={`flex-1 p-4 rounded-xl border-2 cursor-pointer flex flex-col items-center gap-2 transition ${formData.projectType === 'commercial' ? 'border-ukra-gold bg-yellow-50 text-ukra-navy' : 'border-gray-200 text-gray-500'}`}>
                          <input type="radio" name="projectType" value="commercial" checked={formData.projectType === 'commercial'} onChange={handleInputChange} className="hidden" />
                          <Building className="w-6 h-6" />
                          <span className="font-bold">مبنى تجاري / مكاتب</span>
                       </label>
                    </div>
                 </div>

                 <div className="md:col-span-2">
                    <label className="block text-sm font-bold mb-1">اسم المشروع</label>
                    <input required name="projectName" placeholder="مثال: فندق الرواسي" className="w-full p-3 rounded-lg border border-gray-300" onChange={handleInputChange} />
                 </div>

                 {/* Hotel Specifics */}
                 {(formData.projectType === 'hotel' || formData.projectType === 'commercial') && (
                    <div className="md:col-span-2 grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl animate-in fade-in">
                       <div>
                          <label className="block text-xs font-bold mb-1">عدد الأدوار</label>
                          <input type="number" name="floors" placeholder="0" className="w-full p-2 rounded border" onChange={handleInputChange} />
                       </div>
                       <div>
                          <label className="block text-xs font-bold mb-1">عدد الغرف/المكاتب</label>
                          <input type="number" name="rooms" placeholder="0" className="w-full p-2 rounded border" onChange={handleInputChange} />
                       </div>
                       <div>
                          <label className="block text-xs font-bold mb-1">عدد الاستقبال</label>
                          <input type="number" name="receptionCount" placeholder="0" className="w-full p-2 rounded border" onChange={handleInputChange} />
                       </div>
                    </div>
                 )}
              </div>
           </div>

           {/* 2. AI Auto-Fill Section */}
           <div className="bg-gradient-to-r from-ukra-navy to-slate-800 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles className="w-32 h-32" /></div>
              
              <div className="relative z-10">
                 <h2 className="text-xl font-bold text-ukra-gold mb-2 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" /> مساعد التعبئة الذكي (AI)
                 </h2>
                 <p className="text-sm text-gray-300 mb-4">
                    لست متأكداً من الكميات؟ صف مشروعك هنا (مثال: فندق 4 نجوم يحتوي على 50 غرفة مزدوجة و 20 جناح ملكي)، وسيقوم النظام باقتراح الأثاث المناسب لك.
                 </p>
                 <div className="flex gap-2">
                    <textarea 
                      name="projectDesc"
                      className="flex-1 p-3 rounded-lg text-gray-900 border-none focus:ring-2 focus:ring-ukra-gold h-20"
                      placeholder="اكتب وصف المشروع هنا..."
                      value={formData.projectDesc}
                      onChange={handleInputChange}
                    ></textarea>
                    <button 
                      type="button" 
                      onClick={handleAiAutoFill}
                      disabled={aiLoading || !formData.projectDesc}
                      className="bg-ukra-gold text-ukra-navy font-bold px-6 rounded-lg hover:bg-white transition disabled:opacity-50 flex flex-col items-center justify-center gap-1 min-w-[100px]"
                    >
                       {aiLoading ? <Loader2 className="animate-spin w-6 h-6" /> : <><Sparkles className="w-6 h-6" /> <span>تحليل</span></>}
                    </button>
                 </div>
              </div>
           </div>

           {/* 3. Products Catalog (Accordions) */}
           <div>
              <h2 className="text-2xl font-bold text-ukra-navy mb-4 border-b pb-2">كتالوج المنتجات</h2>
              
              {renderAccordionSection(
                'furniture', 
                'الأثاث الخشبي الثابت والمتحرك', 
                <Bed className="w-6 h-6" />,
                (i) => i.category === 'furniture'
              )}

              {renderAccordionSection(
                'furnishing', 
                'المفروشات والمراتب', 
                <Sofa className="w-6 h-6" />,
                (i) => i.category === 'furnishing'
              )}

              {renderAccordionSection(
                'accessories', 
                'الأجهزة والإكسسوارات', 
                <Bath className="w-6 h-6" />,
                (i) => i.category === 'accessories' || i.category === 'appliances'
              )}
           </div>

           {/* Submit Button */}
           <div className="bg-white p-4 rounded-xl shadow-lg sticky bottom-4 border border-gray-200">
              <div className="flex justify-between items-center mb-4 text-sm text-gray-600">
                 <span>تم اختيار <b className="text-ukra-navy">{selectedItems.length}</b> منتج</span>
                 <span>جاهز للإرسال</span>
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting || selectedItems.length === 0}
                className="btn-main w-full flex justify-center items-center gap-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                 {isSubmitting ? (
                   <>جاري المعالجة <Loader2 className="animate-spin" /></>
                 ) : (
                   <>طلب عرض سعر رسمي <Check className="w-5 h-5" /></>
                 )}
              </button>
           </div>

        </form>
      </div>
    </div>
  );
};
