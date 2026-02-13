import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { QuotationDocument } from '../components/PDF/QuotationDocument';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { FileText, Loader, AlertTriangle, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Checkout() {
  const { items, totalAmount } = useCart();
  const { user } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  
  const [clientName, setClientName] = useState(user?.name || '');
  const [clientPhone, setClientPhone] = useState(user?.phone || '');
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);

  // حسابات
  const tax = totalAmount * 0.15;
  const grandTotal = totalAmount + tax;
  const quotationNo = `Q-${Math.floor(1000 + Math.random() * 9000)}`;
  const today = new Date().toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US');

  // نصوص الواجهة
  const t = {
    title: lang === 'ar' ? 'مراجعة عرض السعر' : 'Review Quotation',
    login_alert: lang === 'ar' ? 'تسجيل الدخول مطلوب' : 'Login Required',
    login_desc: lang === 'ar' ? 'لحفظ العرض في حسابك ومتابعته لاحقاً، يفضل تسجيل الدخول.' : 'Please login to save this quotation to your account.',
    login_btn: lang === 'ar' ? 'تسجيل الدخول الآن' : 'Login Now',
    info_title: lang === 'ar' ? 'معلومات العرض' : 'Quotation Info',
    name_label: lang === 'ar' ? 'الاسم الكريم' : 'Full Name',
    phone_label: lang === 'ar' ? 'رقم الجوال' : 'Phone Number',
    products_title: lang === 'ar' ? 'المنتجات' : 'Products',
    empty_cart: lang === 'ar' ? 'السلة فارغة' : 'Cart is empty',
    qty: lang === 'ar' ? 'الكمية' : 'Qty',
    summary_title: lang === 'ar' ? 'الملخص' : 'Summary',
    total: lang === 'ar' ? 'المجموع' : 'Subtotal',
    tax_label: lang === 'ar' ? 'الضريبة (15%)' : 'VAT (15%)',
    grand_total: lang === 'ar' ? 'الإجمالي' : 'Grand Total',
    download_btn: lang === 'ar' ? 'تحميل عرض السعر (PDF)' : 'Download Quotation (PDF)',
    processing: lang === 'ar' ? 'جاري التجهيز...' : 'Processing...',
    fill_data: lang === 'ar' ? 'أدخل البيانات للتحميل' : 'Enter details to download',
    note: lang === 'ar' ? 'سيتم إرسال نسخة من عرض السعر وتفاصيل الحساب البنكي إلى الواتساب الخاص بك.' : 'A copy of the quotation and bank details will be sent to your WhatsApp.',
    currency: lang === 'ar' ? 'ر.س' : 'SAR'
  };

  // دالة إرسال الواتساب (جديد)
  const handleDownloadAndNotify = async () => {
    if (!clientPhone) return;

    setIsSendingWhatsApp(true);
    try {
      // تنسيق الرقم
      let formattedPhone = clientPhone.replace(/\D/g, '');
      if (formattedPhone.startsWith('05')) formattedPhone = '966' + formattedPhone.substring(1);
      else if (formattedPhone.startsWith('5')) formattedPhone = '966' + formattedPhone;

      // رسالة الواتساب
      const message = lang === 'ar' 
        ? `مرحباً ${clientName} 🌹\nشكراً لاهتمامكم بمنتجات أوكرة.\n\n📄 *عرض سعر رقم:* ${quotationNo}\n💰 *الإجمالي:* ${grandTotal.toLocaleString()} ر.س\n\n🏦 *لإتمام الطلب، يرجى التحويل على الحساب:*\nمصرف الراجحي\nSA 4680 0004 3260 8016 0966 77\nمؤسسة أوكرة للمقاولات\n\nنسعد بخدمتكم دائماً!`
        : `Hello ${clientName} 🌹\nThank you for choosing UKRA.\n\n📄 *Quotation No:* ${quotationNo}\n💰 *Total:* ${grandTotal.toLocaleString()} SAR\n\n🏦 *To proceed, please transfer to:*\nAl Rajhi Bank\nSA 4680 0004 3260 8016 0966 77\nUkra Contracting Est.\n\nBest Regards!`;

      await fetch('http://167.86.73.97:8080/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: formattedPhone,
          message: message
        })
      });
      console.log("WhatsApp sent successfully");
    } catch (error) {
      console.error("Error sending WhatsApp:", error);
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-32 pb-12 px-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#1a2a3a] mb-8 flex items-center gap-3">
          <FileText className="w-8 h-8 text-[#c5a059]" />
          {t.title}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* العمود الرئيسي */}
          <div className="lg:col-span-2 space-y-6">
            {!user && (
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-1" />
                <div>
                  <h3 className="font-bold text-yellow-800 text-sm">{t.login_alert}</h3>
                  <p className="text-xs text-yellow-700 mt-1">{t.login_desc}</p>
                  <button onClick={() => navigate('/client-login')} className="text-xs underline font-bold text-yellow-800 mt-2">
                    {t.login_btn}
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="font-bold text-lg mb-4 text-[#2C3E50]">{t.info_title}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">{t.name_label}</label>
                  <input 
                    type="text" 
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-3 outline-none focus:border-[#c5a059]"
                    placeholder={lang === 'ar' ? "الاسم كما سيظهر في الفاتورة" : "Name on Invoice"}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">{t.phone_label}</label>
                  <input 
                    type="tel" 
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-3 outline-none focus:border-[#c5a059]"
                    placeholder="05xxxxxxxx"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="font-bold text-lg mb-4 text-[#2C3E50]">{t.products_title} ({items.length})</h2>
              {items.length === 0 ? (
                <p className="text-gray-500">{t.empty_cart}</p>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                      <img src={item.image_url} className="w-16 h-16 rounded-lg object-cover bg-gray-100" />
                      <div className="flex-1">
                        <h3 className="font-bold text-[#1a2a3a] text-sm">{lang === 'ar' ? item.name_ar : (item.name_en || item.name_ar)}</h3>
                        <p className="text-xs text-gray-400">
                           {t.qty}: {item.quantity} | {item.main_category}
                        </p>
                      </div>
                      <div className="font-bold font-num text-[#1a2a3a] text-sm">
                        {(item.price * item.quantity).toLocaleString()} {t.currency}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* العمود الجانبي */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-32">
              <h2 className="font-bold text-lg mb-4 text-[#2C3E50]">{t.summary_title}</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600 text-sm">
                  <span>{t.total}</span>
                  <span className="font-num">{totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600 text-sm">
                  <span>{t.tax_label}</span>
                  <span className="font-num">{tax.toLocaleString()}</span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-lg text-[#1a2a3a]">
                  <span>{t.grand_total}</span>
                  <span className="font-num text-[#c5a059]">{grandTotal.toLocaleString()} {t.currency}</span>
                </div>
              </div>

              {items.length > 0 && clientName ? (
                <PDFDownloadLink
                  document={
                    <QuotationDocument 
                      cartItems={items} 
                      clientName={clientName} 
                      clientPhone={clientPhone}
                      quotationNo={quotationNo}
                      date={today}
                      lang={lang}
                    />
                  }
                  fileName={`UKRA_Quote_${quotationNo}.pdf`}
                  className="w-full"
                >
                  {({ loading }) => (
                    <button 
                      disabled={loading || isSendingWhatsApp}
                      // عند الضغط، يتم تحميل الملف وأيضاً إرسال الواتساب
                      onClick={() => handleDownloadAndNotify()}
                      className="w-full bg-[#1a2a3a] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#c5a059] transition-all disabled:opacity-70 shadow-lg"
                    >
                      {loading ? (
                        <>
                          <Loader className="animate-spin w-5 h-5" />
                          <span>{t.processing}</span>
                        </>
                      ) : (
                        <>
                          <FileText className="w-5 h-5" />
                          <span>{t.download_btn}</span>
                        </>
                      )}
                    </button>
                  )}
                </PDFDownloadLink>
              ) : (
                <button 
                  disabled
                  className="w-full bg-gray-200 text-gray-400 py-4 rounded-xl font-bold cursor-not-allowed"
                >
                  {t.fill_data}
                </button>
              )}
              
              <p className="text-[10px] text-gray-400 text-center mt-4 leading-relaxed flex items-center justify-center gap-1">
                <Send className="w-3 h-3" />
                {t.note}
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}