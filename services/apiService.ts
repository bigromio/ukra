import { supabase } from '../lib/supabase';
import { FurnitureQuotePayload, FeasibilityPayload, DesignRequestPayload, BookingPayload, ProductDB, Task, InventoryItem, User } from '../types';

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// --- Auth & Users (Supabase Wrapper) ---

export const registerClient = async (fullName: string, email: string, phone: string, password: string): Promise<any> => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone: phone, role: 'CLIENT' }
    }
  });
  
  if (error) return { success: false, message: error.message };
  return { success: true, user: data.user };
};

export const loginClient = async (email: string, password: string): Promise<any> => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  
  if (error) return { success: false, message: error.message };
  
  // Fetch profile to get role
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
  
  return { 
    success: true, 
    user: {
      id: data.user.id,
      email: data.user.email,
      name: profile?.full_name || 'User',
      role: profile?.role || 'CLIENT',
      phone: profile?.phone,
      points_balance: profile?.points_balance
    }
  };
};

export const fetchAllUsers = async (): Promise<any> => {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) return { success: false, message: error.message };
  return { success: true, users: data.map((u: any) => ({...u, name: u.full_name})) };
};

// [تعديل هام] البحث بالمعرف بدلاً من الإيميل لتجنب خطأ 400
export const fetchUserRole = async (userId: string): Promise<any> => {
  const { data, error } = await supabase.from('profiles').select('role, full_name, phone').eq('id', userId).single();
  if (error) return { success: false };
  return { success: true, role: data.role, name: data.full_name, phone: data.phone };
};

// --- Tasks (Operational Dashboard) ---

export const fetchDailyTasks = async (userId?: string): Promise<Task[]> => {
  let query = supabase.from('tasks').select('*').eq('due_date', new Date().toISOString().split('T')[0]);
  if (userId) {
    query = query.eq('assigned_to', userId);
  }
  const { data } = await query;
  return data || [];
};

export const toggleTaskCompletion = async (taskId: number, isCompleted: boolean): Promise<boolean> => {
  const { error } = await supabase.from('tasks').update({ is_completed: isCompleted }).eq('id', taskId);
  return !error;
};

// --- Inventory (Facility Tracker) ---

export const fetchInventory = async (): Promise<InventoryItem[]> => {
  const { data } = await supabase.from('inventory').select('*');
  return data || [];
};

// --- Products (Store) ---

export const getProducts = async (category?: string): Promise<ProductDB[]> => {
  let query = supabase.from('products').select('*').eq('is_active', true);
  if (category) {
    query = query.eq('category', category);
  }
  const { data, error } = await query;
  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }
  return data as ProductDB[];
};

// --- Orders ---

export const fetchAllOrders = async (): Promise<any> => {
  const { data, error } = await supabase
    .from('orders')
    .select(`*, profiles:client_id(full_name, phone)`) // أزلنا email لأنه قد لا يكون موجوداً في profiles
    .order('created_at', { ascending: false });

  if (error) return { success: false, message: error.message };

  const orders = data.map((o: any) => ({
    id: o.id,
    type: o.service_type,
    status: o.status,
    client: o.profiles?.full_name || 'Unknown',
    phone: o.profiles?.phone,
    date: new Date(o.created_at).toLocaleDateString(),
    amount: o.amount ? `${o.amount} SAR` : 'Pending',
    details: o.details 
  }));

  return { success: true, orders };
};

// [تعديل هام] استخدام المعرف مباشرة لجلب الطلبات
export const fetchClientOrders = async (userId: string): Promise<any> => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('client_id', userId)
    .order('created_at', { ascending: false });

  if (error) return { success: false };

  const orders = data.map((o: any) => ({
    id: o.id,
    type: o.service_type,
    status: o.status,
    date: new Date(o.created_at).toLocaleDateString(),
    details: JSON.stringify(o.details)
  }));

  return { success: true, orders };
};

// --- Form Submissions ---

export const submitDesignRequest = async (payload: DesignRequestPayload): Promise<boolean> => {
  try {
    const { error } = await supabase.from('orders').insert({
      id: `DES-${Date.now()}`,
      service_type: 'Design',
      status: 'Pending',
      details: payload
    });
    return !error;
  } catch (e) {
    console.error(e);
    return false;
  }
};

export const submitFurnitureQuote = async (payload: FurnitureQuotePayload): Promise<boolean> => {
  try {
    const { error } = await supabase.from('orders').insert({
      id: `FUR-${Date.now()}`,
      service_type: 'Furniture',
      status: 'Pending',
      details: payload
    });
    return !error;
  } catch (e) {
    return false;
  }
};

export const submitFeasibilityStudy = async (payload: FeasibilityPayload): Promise<boolean> => {
  try {
    const { error } = await supabase.from('orders').insert({
      id: `FEA-${Date.now()}`,
      service_type: 'Feasibility',
      status: 'Pending',
      details: payload
    });
    return !error;
  } catch (e) {
    return false;
  }
};

// --- Deprecated / Mock Functions ---
export const verifyClientOTP = async (email: string, otp: string, data?: any): Promise<{ success: boolean; user: { name: string; role: string; email: string; phone?: string }; message?: string }> => ({ success: true, user: { name: 'Client', role: 'CLIENT', email, phone: data?.phone }, message: '' }); 
export const updateClientProfile = async (email: string, updates: any): Promise<{ success: boolean; message?: string }> => ({ success: true, message: '' });
export const deleteClientAccount = async (email: string): Promise<{ success: boolean; message?: string }> => ({ success: true, message: '' });
export const adminUpdateUserRole = async (email: string, role: string): Promise<{ success: boolean; message?: string }> => ({ success: true, message: '' });
export const adminDeleteUser = async (email: string): Promise<{ success: boolean; message?: string }> => ({ success: true, message: '' });
export const uploadOrderFile = async (folderUrl: string, file: File, orderId: string, notifyEmail?: string, uploaderName?: string): Promise<{ success: boolean; message?: string }> => ({ success: true, message: '' });
export const addOrderNote = async (orderId: string, note: string, author: string, notifyEmail?: string): Promise<{ success: boolean; message?: string }> => ({ success: true, message: '' });
export const fetchOrderDetails = async (folderUrl: string, orderId: string): Promise<{ success: boolean; data: { files: any[]; logs: any[] }; message?: string }> => ({ success: true, data: { files: [], logs: [] }, message: '' });
export const deleteOrderFile = async (fileId: string, orderId: string, userName: string): Promise<{ success: boolean; message?: string }> => ({ success: true, message: '' });
export const submitBooking = async (payload: BookingPayload): Promise<{ success: boolean; message?: string }> => ({ success: true, message: '' });