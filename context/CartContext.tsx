import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// تعريف نوع المنتج في السلة
export interface CartItem {
  id: number;
  name_ar: string;
  price: number;
  image_url: string;
  quantity: number;
  main_category: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: any) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  totalAmount: number;
  totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  // 1. استرجاع السلة من التخزين المحلي عند فتح الموقع
  useEffect(() => {
    const savedCart = localStorage.getItem('ukra_cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }
  }, []);

  // 2. حفظ السلة في التخزين المحلي عند أي تغيير
  useEffect(() => {
    localStorage.setItem('ukra_cart', JSON.stringify(items));
  }, [items]);

  // إضافة منتج للسلة
  const addToCart = (product: any) => {
    setItems(currentItems => {
      const existingItem = currentItems.find(item => item.id === product.id);
      
      if (existingItem) {
        // إذا المنتج موجود، نزيد الكمية
        return currentItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      
      // إذا منتج جديد
      return [...currentItems, { 
        id: product.id, 
        name_ar: product.name_ar, 
        price: product.price, 
        image_url: product.image_url,
        main_category: product.main_category,
        quantity: 1 
      }];
    });
  };

  // حذف منتج
  const removeFromCart = (id: number) => {
    setItems(currentItems => currentItems.filter(item => item.id !== id));
  };

  // تعديل الكمية
  const updateQuantity = (id: number, quantity: number) => {
    if (quantity < 1) return;
    setItems(currentItems =>
      currentItems.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  // إفراغ السلة
  const clearCart = () => setItems([]);

  // الحسابات
  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      items, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart, 
      totalAmount,
      totalItems
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};