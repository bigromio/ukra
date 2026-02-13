import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// تعريف نوع المنتج في السلة
export interface CartItem {
  id: string;
  name_ar: string;
  name_en?: string;
  price: number;
  image_url: string;
  quantity: number;
  main_category?: string;
}

interface CartState {
  items: CartItem[];
  totalAmount: number;
}

interface CartContextType extends CartState {
  addToCart: (item: CartItem) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>; // دالة جديدة لتحديث السلة عند تسجيل الدخول
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// دوال مساعدة للحسابات
const calculateTotal = (items: CartItem[]) => {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  
  // دالة لجلب معرف العميل الحالي
  const getClientId = () => localStorage.getItem('ukra_client_id');

  // 1. تحميل السلة عند فتح الموقع
  const refreshCart = async () => {
    const clientId = getClientId();

    if (clientId) {
      // أ. إذا كان العميل مسجلاً: اجلب من Supabase
      try {
        const { data, error } = await supabase
          .from('cart_items')
          .select('*')
          .eq('customer_id', clientId);
        
        if (error) throw error;

        if (data) {
          // تحويل البيانات من شكل قاعدة البيانات إلى شكل التطبيق
          const dbItems: CartItem[] = data.map((row: any) => ({
            id: row.product_id,
            quantity: row.quantity,
            ...row.product_data // استرجاع تفاصيل المنتج (الاسم، السعر، الصورة)
          }));
          setItems(dbItems);
        }
      } catch (err) {
        console.error('Error fetching cart from DB:', err);
      }
    } else {
      // ب. إذا لم يكن مسجلاً: اجلب من LocalStorage
      const localCart = localStorage.getItem('ukra_guest_cart');
      if (localCart) {
        setItems(JSON.parse(localCart));
      }
    }
  };

  // تشغيل التحديث مرة واحدة عند التحميل
  useEffect(() => {
    refreshCart();
  }, []);

  // دالة مساعدة لحفظ السلة (توجه البيانات للمكان الصحيح: DB أو Local)
  const saveCart = async (newItems: CartItem[]) => {
    setItems(newItems); // تحديث الواجهة فوراً (Optimistic UI)
    
    const clientId = getClientId();
    
    if (clientId) {
      // حفظ في قاعدة البيانات (للمسجلين)
      // ملاحظة: لتبسيط المزامنة، سنحذف القديم ونضيف الجديد (أسهل طريقة لضمان التطابق)
      // في الإنتاج الضخم يفضل استخدام Upsert لكل عنصر، لكن هذا يكفي حالياً
      try {
        // 1. حذف عناصر السلة القديمة لهذا العميل
        await supabase.from('cart_items').delete().eq('customer_id', clientId);
        
        // 2. إضافة العناصر الجديدة (إذا وجدت)
        if (newItems.length > 0) {
          const dbRows = newItems.map(item => ({
            customer_id: clientId,
            product_id: item.id,
            quantity: item.quantity,
            product_data: { // نحفظ التفاصيل كاملة لتجنب الاستعلامات المعقدة
              name_ar: item.name_ar,
              name_en: item.name_en,
              price: item.price,
              image_url: item.image_url,
              main_category: item.main_category
            }
          }));
          
          const { error } = await supabase.from('cart_items').insert(dbRows);
          if (error) throw error;
        }
      } catch (err) {
        console.error('Failed to sync cart with DB:', err);
      }
    } else {
      // حفظ في LocalStorage (للضيوف)
      localStorage.setItem('ukra_guest_cart', JSON.stringify(newItems));
    }
  };

  // --- العمليات (Add, Remove, Update) ---

  const addToCart = async (newItem: CartItem) => {
    const existingItemIndex = items.findIndex(item => item.id === newItem.id);
    let updatedItems = [...items];

    if (existingItemIndex > -1) {
      // المنتج موجود، نزيد الكمية
      updatedItems[existingItemIndex].quantity += 1;
    } else {
      // منتج جديد
      updatedItems.push({ ...newItem, quantity: 1 });
    }
    await saveCart(updatedItems);
  };

  const removeFromCart = async (id: string) => {
    const updatedItems = items.filter(item => item.id !== id);
    await saveCart(updatedItems);
  };

  const updateQuantity = async (id: string, quantity: number) => {
    if (quantity < 1) return;
    const updatedItems = items.map(item => 
      item.id === id ? { ...item, quantity } : item
    );
    await saveCart(updatedItems);
  };

  const clearCart = async () => {
    await saveCart([]); // إرسال مصفوفة فارغة سيقوم بمسح البيانات من DB أو Local
  };

  return (
    <CartContext.Provider value={{
      items,
      totalAmount: calculateTotal(items),
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      refreshCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};