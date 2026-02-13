import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
// import { apiService } from '../services/apiService'; // تم تعليق هذا السطر مؤقتاً لحين تفعيل الباك إند
import { ArrowRight, CreditCard, Wallet } from 'lucide-react';

const Checkout = () => {
  const navigate = useNavigate();
  const { state: { items, total }, dispatch } = useCart();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    paymentMethod: 'card'
  });

  // --- دالة إرسال رسالة الواتساب ---
  const sendWhatsAppConfirmation = async (phone: string, customerName: string, orderTotal: number) => {
    try {
      // تنسيق الرقم لضمان وجود مفتاح الدولة (966)
      let formattedPhone = phone.replace(/\D/g, '');
      if (formattedPhone.startsWith('05')) {
        formattedPhone = '966' + formattedPhone.substring(1);
      }

      const message = `مرحباً ${customerName} 🌹
شكراً لثقتكم في أوكرة (UKRA).

تم استلام طلبكم بنجاح!
💰 إجمالي الطلب: ${orderTotal.toLocaleString()} ر.س
📦 حالة الطلب: قيد المعالجة

سيتم التواصل معكم قريباً لتأكيد تفاصيل التوصيل.
نتمنى لكم يوماً سعيداً!`;

      await fetch('http://167.86.73.97:8080/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: formattedPhone,
          message: message
        })
      });
      console.log('WhatsApp sent successfully');
    } catch (error) {
      console.error('Failed to send WhatsApp:', error);
    }
  };
  // --------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. إنشاء بيانات الطلب (للاستخدام المستقبلي)
      const orderData = {
        ...formData,
        items,
        total,
        status: 'pending',
        date: new Date().toISOString()
      };

      // محاكاة وقت المعالجة
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      
      // في المستقبل، عند جاهزية الباك إند، قم بإلغاء التعليق عن السطر التالي والسطر في الأعلى:
      // await apiService.placeOrder(orderData); 

      // 2. إرسال رسالة الواتساب
      if (formData.phone) {
        await sendWhatsAppConfirmation(formData.phone, formData.firstName, total);
      }

      // 3. إفراغ السلة والتوجيه
      dispatch({ type: 'CLEAR_CART' });
      navigate('/client-orders'); 
      
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="pt-24 pb-16 px-4 max-w-7xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 mb-8 hover:text-[#BFA78A] transition-colors">
        <ArrowRight className="ml-2 h-5 w-5" />
        العودة للسلة
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Form Section */}
        <div>
          <h2 className="text-2xl font-bold mb-6 font-display">معلومات الشحن</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الاسم الأول</label>
                <input
                  type="text"
                  name="firstName"
                  required
                  className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-[#BFA78A] focus:border-transparent outline-none"
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اسم العائلة</label>
                <input
                  type="text"
                  name="lastName"
                  required
                  className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-[#BFA78A] focus:border-transparent outline-none"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">رقم الجوال (مع الواتساب)</label>
              <input
                type="tel"
                name="phone"
                required
                placeholder="05xxxxxxxx"
                className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-[#BFA78A] focus:border-transparent outline-none text-left"
                dir="ltr"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني</label>
              <input
                type="email"
                name="email"
                required
                className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-[#BFA78A] focus:border-transparent outline-none"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">المدينة</label>
              <input
                type="text"
                name="city"
                required
                className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-[#BFA78A] focus:border-transparent outline-none"
                value={formData.city}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">العنوان التفصيلي</label>
              <input
                type="text"
                name="address"
                required
                className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-[#BFA78A] focus:border-transparent outline-none"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <div className="pt-6">
              <h3 className="text-lg font-bold mb-4">طريقة الدفع</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'card' }))}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    formData.paymentMethod === 'card'
                      ? 'border-[#BFA78A] bg-[#BFA78A]/10 text-[#BFA78A]'
                      : 'border-gray-200 text-gray-500 hover:border-[#BFA78A]'
                  }`}
                >
                  <CreditCard className="h-6 w-6" />
                  <span className="font-medium">بطاقة ائتمان</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'cash' }))}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    formData.paymentMethod === 'cash'
                      ? 'border-[#BFA78A] bg-[#BFA78A]/10 text-[#BFA78A]'
                      : 'border-gray-200 text-gray-500 hover:border-[#BFA78A]'
                  }`}
                >
                  <Wallet className="h-6 w-6" />
                  <span className="font-medium">الدفع عند الاستلام</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#3A5A7B] text-white py-4 rounded-xl font-bold hover:bg-[#2c445d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-8"
            >
              {loading ? 'جاري المعالجة...' : `إتمام الطلب (${total.toLocaleString()} ر.س)`}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="bg-gray-50 p-8 rounded-2xl h-fit">
          <h2 className="text-xl font-bold mb-6 font-display">ملخص الطلب</h2>
          <div className="space-y-4 mb-6">
            {items.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="relative w-20 h-20">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <span className="absolute -top-2 -right-2 bg-[#BFA78A] text-white text-xs w-6 h-6 flex items-center justify-center rounded-full">
                    {item.quantity}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{item.name}</h4>
                  <p className="text-sm text-gray-500">{item.category}</p>
                  <p className="text-[#BFA78A] font-medium mt-1">
                    {(item.price * item.quantity).toLocaleString()} ر.س
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>المجموع الفرعي</span>
              <span>{total.toLocaleString()} ر.س</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>الضريبة (15%)</span>
              <span>{(total * 0.15).toLocaleString()} ر.س</span>
            </div>
            <div className="flex justify-between text-gray-900 font-bold text-lg pt-2 border-t mt-2">
              <span>الإجمالي</span>
              <span>{(total * 1.15).toLocaleString()} ر.س</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;