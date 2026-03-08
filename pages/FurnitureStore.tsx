import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ShoppingCart, Loader, AlertCircle, Search, CheckCircle, Filter } from 'lucide-react';
import { useCart } from '../context/CartContext'; // استدعاء السلة
import { CartSidebar } from '../components/CartSidebar'; // استدعاء القائمة الجانبية

interface StoreProduct {
  id: number;
  name_ar: string;
  description: string;
  price: number;
  main_category: string;
  sub_category: string;
  collection_name: string;
  dimensions: string;
  image_url: string;
  in_stock: boolean;
}

export default function FurnitureStore() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // حالات السلة والتنبيهات
  const { addToCart, totalItems } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // حالات الفلترة والبحث
  const [activeMainCat, setActiveMainCat] = useState<string>('الكل');
  const [activeSubCat, setActiveSubCat] = useState<string>('الكل');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchStoreProducts();
  }, []);

  async function fetchStoreProducts() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('store_products')
        .select('*')
        .eq('in_stock', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (err: any) {
      console.error('Error fetching store products:', err);
      setError('تعذر تحميل المنتجات، يرجى التأكد من الاتصال.');
    } finally {
      setLoading(false);
    }
  }

  // دالة إضافة للسلة مع التنبيه الاحترافي
  const handleAddToCart = (product: StoreProduct) => {
    addToCart(product);
    
    // إظهار علامة الصح
    setShowSuccessToast(true);
    
    // إخفاؤها بعد ثانيتين
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 2000);
  };

  // منطق الفلترة (نفس السابق)
  const mainCategories = ['الكل', ...new Set(products.map(p => p.main_category))];
  const subCategories = activeMainCat === 'الكل' ? [] : ['الكل', ...new Set(products.filter(p => p.main_category === activeMainCat).map(p => p.sub_category))];
  const displayedProducts = products.filter(p => {
    const matchMain = activeMainCat === 'الكل' || p.main_category === activeMainCat;
    const matchSub = activeSubCat === 'الكل' || p.sub_category === activeSubCat;
    const matchSearch = p.name_ar.includes(searchQuery) || p.description?.includes(searchQuery);
    return matchMain && matchSub && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-32 pb-12 px-4 sm:px-6 lg:px-8 relative" dir="rtl">
      
      {/* 1. السلة الجانبية */}
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* 2. زر السلة العائم (Floating Action Button) */}
      <button 
        onClick={() => setIsCartOpen(true)}
        className="fixed bottom-8 left-8 z-50 bg-[#2C3E50] text-white p-4 rounded-full shadow-2xl hover:bg-[#D4AF37] transition-all hover:scale-110 flex items-center justify-center group"
      >
        <div className="relative">
          <ShoppingCart className="w-7 h-7" />
          {totalItems > 0 && (
            <span className="absolute -top-3 -right-3 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-[#2C3E50] group-hover:border-[#D4AF37]">
              {totalItems}
            </span>
          )}
        </div>
      </button>

      {/* 3. تنبيه النجاح (Success Toast) */}
      <div className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-[80] transition-all duration-500 ease-out pointer-events-none ${showSuccessToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="bg-white/90 backdrop-blur border border-green-100 shadow-2xl rounded-full px-6 py-3 flex items-center gap-3">
          <div className="bg-green-100 p-1 rounded-full">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <span className="text-gray-700 font-bold text-sm">تمت الإضافة إلى السلة بنجاح</span>
        </div>
      </div>

      {/* Header & Search */}
      <div className="max-w-7xl mx-auto mb-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-3xl font-black text-[#1a2a3a] font-cairo mb-2">متجر الأثاث</h1>
            <p className="text-gray-500 text-sm">تصفح أحدث مجموعات الأثاث المنزلي والفندقي</p>
          </div>
          <div className="relative w-full md:w-96">
            <input 
              type="text" 
              placeholder="ابحث عن منتج..." 
              className="w-full pl-4 pr-12 py-3 rounded-full border border-gray-200 focus:ring-2 focus:ring-[#c5a059] focus:border-transparent shadow-sm outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute right-4 top-3.5 w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Categories Tabs */}
      <div className="max-w-7xl mx-auto mb-8 overflow-x-auto pb-2 scrollbar-hide">
        <div className="flex gap-3 min-w-max">
          {mainCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveMainCat(cat); setActiveSubCat('الكل'); }}
              className={`px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 whitespace-nowrap ${activeMainCat === cat ? 'bg-[#1a2a3a] text-[#c5a059] shadow-lg scale-105' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Sub Categories */}
      {activeMainCat !== 'الكل' && subCategories.length > 0 && (
        <div className="max-w-7xl mx-auto mb-10 animate-fade-in">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-bold text-gray-400 ml-2">تصفية بـ:</span>
            {subCategories.map((sub) => (
              <button
                key={sub}
                onClick={() => setActiveSubCat(sub)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${activeSubCat === sub ? 'bg-[#c5a059] text-white border-[#c5a059]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#c5a059]'}`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Loader className="w-10 h-10 animate-spin text-[#c5a059]" />
            <p className="text-gray-400 text-sm animate-pulse">جاري جلب الروائع...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 text-red-600 p-6 rounded-2xl flex flex-col items-center gap-3 text-center">
            <AlertCircle className="w-8 h-8" />
            <h3 className="font-bold">عذراً، حدث خطأ</h3>
            <p className="text-sm">{error}</p>
            <button onClick={() => window.location.reload()} className="text-sm underline mt-2">إعادة المحاولة</button>
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-gray-100">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
              <Filter className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">لا توجد منتجات مطابقة</h3>
            <p className="text-gray-500">حاول تغيير التصنيف أو كلمة البحث</p>
            {activeMainCat !== 'الكل' && (
              <button onClick={() => setActiveMainCat('الكل')} className="mt-6 text-[#c5a059] font-bold text-sm hover:underline">عرض كل المنتجات</button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {displayedProducts.map((product) => (
              <div key={product.id} className="group bg-white rounded-[20px] overflow-hidden hover:shadow-2xl transition-all duration-500 border border-gray-100 flex flex-col relative">
                {/* Image Area */}
                <div className="relative h-72 bg-gray-100 overflow-hidden">
                  <img 
                    src={product.image_url} 
                    onError={(e: any) => e.target.src = 'https://placehold.co/600x600/f8fafc/cbd5e1?text=No+Image'} 
                    alt={product.name_ar}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  {product.collection_name && (
                    <div className="absolute top-4 right-4 bg-black/30 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full border border-white/20">
                      مجموعة {product.collection_name}
                    </div>
                  )}
                  {/* Add Button Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <button 
                      onClick={() => handleAddToCart(product)}
                      className="bg-white text-[#1a2a3a] px-6 py-3 rounded-full font-bold text-sm transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 flex items-center gap-2 hover:bg-[#c5a059] hover:text-white"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      أضف للسلة
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="mb-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">
                      {product.main_category} • {product.sub_category}
                    </span>
                    <h3 className="text-lg font-bold text-[#1a2a3a] leading-snug group-hover:text-[#c5a059] transition-colors">{product.name_ar}</h3>
                  </div>
                  <p className="text-gray-400 text-xs line-clamp-2 mb-4 flex-1 font-light leading-relaxed">
                    {product.description || 'تصميم عصري يجمع بين الأناقة والعملية.'}
                  </p>
                  <div className="flex items-end justify-between border-t border-gray-50 pt-4 mt-auto">
                    <div>
                      <span className="text-xs text-gray-400 block mb-0.5">السعر</span>
                      <span className="text-xl font-bold text-[#1a2a3a] font-num">
                        {product.price > 0 ? product.price.toLocaleString() : 'عند الطلب'} 
                        {product.price > 0 && <span className="text-xs font-normal text-gray-400 mr-1">ر.س</span>}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleAddToCart(product)}
                      className="bg-[#F8FAFC] hover:bg-[#2C3E50] hover:text-white text-[#2C3E50] p-3 rounded-xl transition-colors shadow-sm"
                    >
                      <ShoppingCart className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}