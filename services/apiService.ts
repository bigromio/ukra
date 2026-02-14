import { supabase } from '../lib/supabase';
import { 
  FurnitureQuotePayload, 
  FeasibilityPayload, 
  DesignRequestPayload, 
  BookingPayload, 
  ProductDB, 
  Task, 
  InventoryItem 
} from '../types';


const WHATSAPP_API_URL = 'http://167.86.73.97:8080';


export const processOrderAndSendWhatsApp = async (
  orderId: string, 
  clientPhone: string, 
  pdfBlob: Blob
): Promise<boolean> => {
  try {
    // 1. رفع ملف الـ PDF إلى Supabase Storage
    const fileName = `order_${orderId}_${Date.now()}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('order_files') // تأكد من إنشاء هذا الـ Bucket في Supabase
      .upload(fileName, pdfBlob, {
        contentType: 'application/pdf'
      });

    if (uploadError) throw uploadError;

    // 2. الحصول على الرابط العام للملف
    const { data: { publicUrl } } = supabase.storage
      .from('order_files')
      .getPublicUrl(fileName);

    // 3. تحديث سجل الطلب في قاعدة البيانات برابط الملف
    await supabase
      .from('orders')
      .update({ pdf_url: publicUrl, status: 'New' }) // حفظنا الرابط للمستقبل
      .eq('id', orderId);

    // 4. إرسال الملف للعميل عبر الواتساب
    await fetch(`${WHATSAPP_API_URL}/send-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: clientPhone,
        pdfUrl: publicUrl,
        filename: `Order_${orderId}.pdf`,
        caption: `📄 *فاتورة طلبك رقم #${orderId}*\nشكراً لاختيارك UKRA.`
      })
    });

    // 5. إرسال نسخة للإدارة (Admin)
    const ADMIN_PHONE = '966569159938'; // رقم الأونر
    await fetch(`${WHATSAPP_API_URL}/send-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: ADMIN_PHONE,
        pdfUrl: publicUrl,
        filename: `Admin_Order_${orderId}.pdf`,
        caption: `🔔 *طلب جديد رقم #${orderId}*\nمن العميل: ${clientPhone}`
      })
    });

    return true;

  } catch (error) {
    console.error('Failed to process order PDF:', error);
    return false;
  }
};

// --- Utility Functions ---

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// --- Auth & User Management (The Core Identity) ---

/**
 * تسجيل عميل جديد (بريد إلكتروني)
 * يقوم بإنشاء حساب في Auth وإضافة سجل في جدول العملاء
 */
export const registerClient = async (fullName: string, email: string, phone: string, password: string): Promise<any> => {
  try {
    // 1. إنشاء الحساب في Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone: phone }
      }
    });
    
    if (error) throw error;

    if (data.user) {
      // 2. تحديث جدول العملاء لربطه بالحساب الجديد
      // نبحث عن العميل برقم الجوال (قد يكون مسجلاً مسبقاً عبر الواتساب)
      const { data: existingProfile } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', phone)
        .maybeSingle();

      if (existingProfile) {
        // تحديث السجل الموجود
        await supabase.from('customers').update({ 
          user_id: data.user.id,
          email: email,
          full_name: fullName // تحديث الاسم في حال كان مختلفاً
        }).eq('id', existingProfile.id);
      } else {
        // إنشاء سجل جديد في جدول العملاء
        await supabase.from('customers').insert({
          user_id: data.user.id,
          email: email,
          phone: phone,
          full_name: fullName,
          role: 'customer'
        });
      }
    }

    return { success: true, user: data.user };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
};

/**
 * تسجيل الدخول (بريد إلكتروني)
 * يجلب الصلاحية (Role) من جدول العملاء
 */
export const loginClient = async (email: string, password: string): Promise<any> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) throw error;
    
    // جلب الملف الشخصي لمعرفة الصلاحية
    const { data: profile } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', data.user.id)
      .single();
    
    return { 
      success: true, 
      user: {
        id: data.user.id,
        email: data.user.email,
        name: profile?.full_name || data.user.user_metadata.full_name || 'User',
        role: profile?.role || 'customer',
        phone: profile?.phone,
        address: profile?.address
      }
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
};

/**
 * التحقق من OTP (للواتساب)
 * يتحقق من الكود في جدول otp_codes
 */
export const verifyClientOTP = async (phone: string, otp: string): Promise<any> => {
  try {
    // التحقق من صحة الكود وصلاحيته الزمنية
    const { data, error } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('phone', phone)
      .eq('code', otp)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      return { success: false, message: 'Invalid or expired OTP' };
    }

    // حذف الكود بعد الاستخدام (لزيادة الأمان)
    await supabase.from('otp_codes').delete().eq('id', data.id);

    // جلب أو إنشاء ملف العميل
    let { data: profile } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', phone)
      .maybeSingle();

    if (!profile) {
      const { data: newProfile, error: createError } = await supabase
        .from('customers')
        .insert([{ phone, full_name: 'New Client', role: 'customer' }])
        .select()
        .single();
      
      if (createError) throw createError;
      profile = newProfile;
    }

    return { 
      success: true, 
      user: {
        id: profile.id, // نستخدم ID الجدول وليس Auth ID للدخول بالواتس
        name: profile.full_name,
        role: profile.role || 'customer',
        phone: profile.phone
      }
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
};

// --- User Management (Admin Functions) ---

export const fetchAllUsers = async (): Promise<any> => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) return { success: false, message: error.message };
  return { success: true, users: data.map((u: any) => ({...u, name: u.full_name})) };
};

export const fetchUserRole = async (identifier: string): Promise<any> => {
  // البحث سواء بالـ ID أو رقم الجوال أو user_id
  const { data, error } = await supabase
    .from('customers')
    .select('role, full_name, phone')
    .or(`id.eq.${identifier},phone.eq.${identifier},user_id.eq.${identifier}`)
    .maybeSingle();
    
  if (error || !data) return { success: false };
  return { success: true, role: data.role, name: data.full_name, phone: data.phone };
};

export const updateClientProfile = async (clientId: string, updates: any): Promise<{ success: boolean; message?: string }> => {
  const { error } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', clientId);
  return { success: !error, message: error?.message };
};

export const adminUpdateUserRole = async (userId: string, role: string): Promise<{ success: boolean; message?: string }> => {
  const { error } = await supabase
    .from('customers')
    .update({ role })
    .eq('id', userId);
  return { success: !error, message: error?.message };
};

export const deleteClientAccount = async (clientId: string): Promise<{ success: boolean; message?: string }> => {
  // الحذف المنطقي (Soft Delete) أفضل من الحذف الكلي للحفاظ على سجلات الطلبات
  const { error } = await supabase
    .from('customers')
    .update({ is_active: false }) // تأكد من إضافة عمود is_active في الجدول
    .eq('id', clientId);
  return { success: !error, message: error?.message };
};

// --- Operational Dashboard (Tasks & Inventory) ---

export const fetchDailyTasks = async (userId?: string): Promise<Task[]> => {
  try {
    let query = supabase.from('tasks').select('*').eq('is_completed', false);
    
    // إذا كان هناك مستخدم محدد، نجلب مهامه + المهام العامة
    if (userId) {
      query = query.or(`assigned_to.eq.${userId},assigned_to.is.null`);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.warn('Tasks table might be missing or empty', e);
    return [];
  }
};

export const toggleTaskCompletion = async (taskId: number, isCompleted: boolean): Promise<boolean> => {
  const { error } = await supabase.from('tasks').update({ is_completed: isCompleted }).eq('id', taskId);
  return !error;
};

export const fetchInventory = async (): Promise<InventoryItem[]> => {
  try {
    const { data, error } = await supabase.from('inventory').select('*');
    if (error) throw error;
    return data || [];
  } catch (e) {
    return [];
  }
};

// --- Products (Store Engine) ---

export const getProducts = async (category?: string): Promise<ProductDB[]> => {
  // نقرأ من جدول store_products الجديد
  let query = supabase.from('store_products').select('*'); 
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

// --- Orders Management ---

// أضف هذه الدالة في apiService.ts
export const createStoreOrder = async (orderData: any): Promise<{ success: boolean; orderId?: string; message?: string }> => {
  try {
    const { error, data } = await supabase
      .from('orders')
      .insert({
        customer_id: orderData.clientId,
        service_type: 'Store Order',
        status: 'New', // الحالة الأولية
        total_amount: orderData.total,
        details: {
          items: orderData.items,
          address: orderData.address,
          notes: orderData.notes,
          shipping_cost: 0, // يمكن تعديله لاحقاً
          payment_method: 'Pay on Delivery / Bank Transfer'
        }
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, orderId: data.id };
  } catch (e: any) {
    console.error('Create Order Error:', e);
    return { success: false, message: e.message };
  }
};

export const fetchAllOrders = async (): Promise<any> => {
  // الربط مع جدول customers لجلب بيانات العميل
  const { data, error } = await supabase
    .from('orders')
    .select(`*, customers:customer_id(full_name, phone)`)
    .order('created_at', { ascending: false });

  if (error) return { success: false, message: error.message };

  const orders = data.map((o: any) => ({
    id: o.id,
    type: o.service_type || o.order_type, // دعم المسميين
    status: o.status,
    client: o.customers?.full_name || 'Unknown',
    phone: o.customers?.phone,
    date: new Date(o.created_at).toLocaleDateString(),
    amount: o.total_amount ? `${o.total_amount} SAR` : 'Pending',
    details: o.details 
  }));

  return { success: true, orders };
};

export const fetchClientOrders = async (clientId: string): Promise<any> => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_id', clientId)
    .order('created_at', { ascending: false });

  if (error) return { success: false };

  const orders = data.map((o: any) => ({
    id: o.id,
    type: o.service_type || o.order_type,
    status: o.status,
    date: new Date(o.created_at).toLocaleDateString(),
    details: o.details, // إرجاع التفاصيل كما هي (JSON)
    drive_folder_url: o.drive_folder_url
  }));

  return { success: true, orders };
};

// --- Files & Logs (Order Details) ---

export const uploadOrderFile = async (folderName: string, file: File, orderId: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${folderName}/${fileName}`;

    // رفع الملف للـ Storage
    const { error: uploadError } = await supabase.storage
      .from('orders_files')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // الحصول على الرابط العام
    const { data: { publicUrl } } = supabase.storage
      .from('orders_files')
      .getPublicUrl(filePath);

    // تحديث بيانات الطلب لإضافة الملف
    const { data: order } = await supabase.from('orders').select('details').eq('id', orderId).single();
    const currentDetails = order?.details || {};
    const currentFiles = currentDetails.files || [];
    
    await supabase.from('orders').update({
      details: {
        ...currentDetails,
        files: [...currentFiles, { name: file.name, url: publicUrl, date: new Date().toISOString() }]
      }
    }).eq('id', orderId);

    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
};

export const addOrderNote = async (orderId: string, note: string, author: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const { data: order } = await supabase.from('orders').select('details').eq('id', orderId).single();
    const currentDetails = order?.details || {};
    const currentLogs = currentDetails.logs || [];

    await supabase.from('orders').update({
      details: {
        ...currentDetails,
        logs: [...currentLogs, { content: note, author, created_at: new Date().toISOString() }]
      }
    }).eq('id', orderId);

    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
};

// --- Form Submissions (Public) ---

export const submitDesignRequest = async (payload: DesignRequestPayload, clientId?: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('orders').insert({
      customer_id: clientId,
      service_type: 'Design',
      status: 'Pending',
      details: payload,
      project_name: payload.unitType // تم التصحيح: استخدام unitType كاسم للمشروع
    });
    return !error;
  } catch (e) {
    console.error(e);
    return false;
  }
};

export const submitFurnitureQuote = async (payload: FurnitureQuotePayload, clientId?: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('orders').insert({
      customer_id: clientId,
      service_type: 'Furniture Quote',
      status: 'Pending',
      details: payload,
      project_name: 'تأثيث فندقي'
    });
    return !error;
  } catch (e) {
    return false;
  }
};

export const submitFeasibilityStudy = async (payload: FeasibilityPayload, clientId?: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('orders').insert({
      customer_id: clientId,
      service_type: 'Feasibility Study',
      status: 'Pending',
      details: payload,
      project_name: payload.projectType || 'دراسة جدوى' // تم التصحيح: استخدام projectType
    });
    return !error;
  } catch (e) {
    return false;
  }
};

export const submitBooking = async (payload: BookingPayload, clientId?: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const { error } = await supabase.from('appointments').insert({
      // user_id: clientId,
      appointment_date: `${payload.date}T${payload.time}:00`,
      status: 'Scheduled',
      notes: `Service: ${payload.service}, Client: ${payload.name}, Phone: ${payload.phone}` // تم التصحيح: استخدام payload.service
    });
    
    if (error) throw error;
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
};
// أضف هذا التصدير في apiService.ts لحل مشكلة StaffManagement
export const adminDeleteUser = deleteClientAccount;