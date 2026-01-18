import React from 'react';
import { useCart } from '../context/CartContext';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, onClose }) => {
  const { items, removeFromCart, updateQuantity, totalAmount, totalItems } = useCart();

  return (
    <>
      {/* خلفية معتمة (Overlay) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] transition-opacity"
          onClick={onClose}
        />
      )}

      {/* السلة الجانبية */}
      <div className={`fixed top-0 left-0 h-full w-full sm:w-[400px] bg-white z-[70] shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* رأس السلة */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#2C3E50]" />
            <h2 className="text-lg font-bold text-[#2C3E50]">سلة المشتريات ({totalItems})</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* محتوى السلة */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">سلتك فارغة حالياً</p>
              <button onClick={onClose} className="text-[#D4AF37] font-bold hover:underline">
                تصفح المنتجات
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4 bg-white border border-gray-100 p-3 rounded-xl hover:border-[#D4AF37]/30 transition-colors">
                {/* صورة المنتج */}
                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                  <img src={item.image_url} alt={item.name_ar} className="w-full h-full object-cover" />
                </div>

                {/* التفاصيل */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#2C3E50] line-clamp-1">{item.name_ar}</h3>
                    <p className="text-xs text-gray-400">{item.main_category}</p>
                  </div>
                  
                  <div className="flex justify-between items-end mt-2">
                    <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 hover:bg-white rounded-md shadow-sm transition-all disabled:opacity-50"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-3 h-3 text-gray-600" />
                      </button>
                      <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 hover:bg-white rounded-md shadow-sm transition-all"
                      >
                        <Plus className="w-3 h-3 text-gray-600" />
                      </button>
                    </div>
                    <span className="text-sm font-bold text-[#D4AF37] font-num">
                      {(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* زر الحذف */}
                <button 
                  onClick={() => removeFromCart(item.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors self-start"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* تذييل السلة (الإجمالي وزر الدفع) */}
        {items.length > 0 && (
          <div className="p-5 border-t border-gray-100 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600 font-medium">الإجمالي التقديري</span>
              <span className="text-xl font-bold text-[#2C3E50] font-num">{totalAmount.toLocaleString()} ر.س</span>
            </div>
            
            {/* زر الانتقال لصفحة المراجعة */}
            <Link 
              to="/checkout" 
              className="w-full bg-[#2C3E50] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#1a252f] transition-all shadow-lg shadow-[#2C3E50]/20"
            >
              <span>متابعة الطلب</span>
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </div>
        )}
      </div>
    </>
  );
};