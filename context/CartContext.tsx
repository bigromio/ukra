import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

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
  totalItems: number; // أضفنا هذا الحقل
}

interface CartContextType extends CartState {
  addToCart: (item: CartItem) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  
  const getClientId = () => localStorage.getItem('ukra_client_id');

  const refreshCart = async () => {
    const clientId = getClientId();
    if (clientId) {
      try {
        const { data, error } = await supabase.from('cart_items').select('*').eq('customer_id', clientId);
        if (data) {
          const dbItems: CartItem[] = data.map((row: any) => ({
            id: row.product_id,
            quantity: row.quantity,
            ...row.product_data
          }));
          setItems(dbItems);
        }
      } catch (err) { console.error(err); }
    } else {
      const localCart = localStorage.getItem('ukra_guest_cart');
      if (localCart) setItems(JSON.parse(localCart));
    }
  };

  useEffect(() => { refreshCart(); }, []);

  const saveCart = async (newItems: CartItem[]) => {
    setItems(newItems);
    const clientId = getClientId();
    
    if (clientId) {
      try {
        await supabase.from('cart_items').delete().eq('customer_id', clientId);
        if (newItems.length > 0) {
          const dbRows = newItems.map(item => ({
            customer_id: clientId,
            product_id: item.id,
            quantity: item.quantity,
            product_data: {
              name_ar: item.name_ar,
              name_en: item.name_en,
              price: item.price,
              image_url: item.image_url,
              main_category: item.main_category
            }
          }));
          await supabase.from('cart_items').insert(dbRows);
        }
      } catch (err) { console.error(err); }
    } else {
      localStorage.setItem('ukra_guest_cart', JSON.stringify(newItems));
    }
  };

  const addToCart = async (newItem: CartItem) => {
    const existingItemIndex = items.findIndex(item => item.id === newItem.id);
    let updatedItems = [...items];
    if (existingItemIndex > -1) {
      updatedItems[existingItemIndex].quantity += 1;
    } else {
      updatedItems.push({ ...newItem, quantity: 1 });
    }
    await saveCart(updatedItems);
  };

  const removeFromCart = async (id: string) => {
    await saveCart(items.filter(item => item.id !== id));
  };

  const updateQuantity = async (id: string, quantity: number) => {
    if (quantity < 1) return;
    await saveCart(items.map(item => item.id === id ? { ...item, quantity } : item));
  };

  const clearCart = async () => { await saveCart([]); };

  // حساب القيم المشتقة
  const totalAmount = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const totalItems = items.reduce((count, item) => count + item.quantity, 0); // حساب عدد العناصر

  return (
    <CartContext.Provider value={{
      items,
      totalAmount,
      totalItems, // تصدير العدد للواجهة
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
  if (context === undefined) { throw new Error('useCart must be used within a CartProvider'); }
  return context;
};