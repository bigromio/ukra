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

// رابط سيرفر الواتساب (Contabo Gateway)
const WHATSAPP_API_URL = 'http://167.86.73.97:8080';

// ==========================================
// 1. Utility Functions (أدوات مساعدة)
// ==========================================

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// ==========================================
// 2. WhatsApp Gateway Integration
// ==========================================

/**
 * دالة داخلية لإرسال أي طلب إلى البوابة الموحدة
 */
const sendToGateway = async (payload: any) => {
  try {
    const response = await fetch(`${WHATSAPP_API_URL}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return response.ok;
  } catch (error) {
    console.error('WhatsApp Gateway Error:', error);
    return false;
  }
};

export const uploadOrderPDF = async (pdfBlob: Blob, orderId: string): Promise<string | null> => {
  try {
    const fileName = `order_${orderId}_${Date.now()}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from('order_files')
      .upload(fileName, pdfBlob, { contentType: 'application/pdf', upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('order_files')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading PDF:', error);
    return null;
  }
};

export const sendWhatsAppPDF = async (phone: string, pdfUrl: string, caption: string): Promise<boolean> => {
  let formattedPhone = phone.replace(/\D/g, '');
  if (formattedPhone.startsWith('05')) formattedPhone = '966' + formattedPhone.substring(1);

  return await sendToGateway({
    phone: formattedPhone,
    message: caption,
    mediaUrl: pdfUrl,
    isFile: true
  });
};

// ==========================================
// --- Unified OTP Functions (النظام الموحد) ---
// ==========================================

export const requestUnifiedOTP = async (phone: string, email: string): Promise<boolean> => {
  try {
    let formattedPhone = phone ? phone.replace(/\D/g, '') : '';
    if (formattedPhone.startsWith('05')) formattedPhone = '966' + formattedPhone.substring(1);

    // 1. توليد رمز التحقق (4 أرقام)
    const code = Math.floor(1000 + Math.random() * 9000).toString(); 
    const expiresAt = new Date(Date.now() + 10 * 60000).toISOString();

    // 2. حفظ الرمز في قاعدة البيانات (هذا هو الأهم لكي يعمل التحقق لاحقاً)
    const { error: dbError } = await supabase.from('otp_codes').insert({
      phone: formattedPhone || null,
      email: email || null,
      code: code,
      expires_at: expiresAt
    });

    if (dbError) {
       console.error("Database Insert Error:", dbError);
       return false;
    }

    // 3. إرسال الواتساب (لا نجعله يوقف الكود إن فشل)
    if (formattedPhone) {
      const message = `*رمز تحقق UKRA:*\n👉 *${code}*\n\nيرجى عدم مشاركته مع أحد.`;
      sendToGateway({ phone: formattedPhone, message }).catch(e => console.error("WhatsApp Error:", e));
    }

    // 4. إرسال الإيميل (مع تجاوز خطأ الـ 500 الخاص بحدود Supabase)
    if (email) {
      try {
        const { error } = await supabase.auth.signInWithOtp({ email: email });
        if (error) {
           console.warn("تنبيه: لم يتم إرسال الإيميل بسبب قيود Supabase (الحد الأقصى 3 رسائل/ساعة):", error.message);
        }
      } catch (err) {
        console.warn("Supabase Auth Error:", err);
      }
    }

    // ✅ طالما تم حفظ الرمز في قاعدة البيانات بنجاح، نعتبر العملية ناجحة ليتمكن العميل من إدخال الرمز
    return true; 
  } catch (error) {
    console.error('Unified OTP Request Failed:', error);
    return false;
  }
};

export const verifyUnifiedOTP = async (identifier: string, code: string): Promise<any> => {
  try {
    // تنظيف المعرف إذا كان المستخدم أدخل رقم الجوال بدلاً من الإيميل
    let cleanIdentifier = identifier.replace(/\D/g, '');
    if (cleanIdentifier.startsWith('05')) cleanIdentifier = '966' + cleanIdentifier.substring(1);
    if (!cleanIdentifier || cleanIdentifier.length < 5) cleanIdentifier = identifier;

    // البحث عن الرمز الذي يطابق الكود والـ (إيميل أو جوال)
    const { data, error } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('code', code)
      .or(`phone.eq.${cleanIdentifier},email.eq.${identifier}`)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) return { success: false, message: 'الرمز غير صحيح أو منتهي الصلاحية' };

    // مسح الرمز من قاعدة البيانات بعد نجاح التحقق
    await supabase.from('otp_codes').delete().eq('id', data.id);

    // التحقق من وجود المستخدم أو إنشائه كضيف
    let { data: profile } = await supabase
      .from('customers')
      .select('*')
      .or(`phone.eq.${data.phone},email.eq.${data.email}`)
      .maybeSingle();
    
    if (!profile) {
      const { data: newProfile } = await supabase
        .from('customers')
        .insert([{ 
           phone: data.phone, 
           email: data.email, 
           full_name: 'Guest User', 
           role: 'customer' 
        }])
        .select().single();
      profile = newProfile;
    }

    return { 
      success: true, 
      user: { 
         id: profile.id, 
         name: profile.full_name, 
         role: profile.role || 'customer', 
         phone: profile.phone,
         email: profile.email
      }
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
};

// ==========================================
// 3. Auth Functions (Login & Register)
// ==========================================

export const loginClient = async (email: string, password: string): Promise<any> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) throw error;
    
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
        phone: profile?.phone
      }
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
};

export const registerClient = async (name: string, email: string, phone: string, password?: string): Promise<any> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: password || '12345678',
      options: { data: { full_name: name, phone: phone } }
    });
    
    if (error) throw error;

    if (data.user) {
      let formattedPhone = phone.replace(/\D/g, '');
      if (formattedPhone.startsWith('05')) formattedPhone = '966' + formattedPhone.substring(1);

      const { data: existing } = await supabase.from('customers').select('*').eq('phone', formattedPhone).maybeSingle();
      
      if (existing) {
        await supabase.from('customers').update({ user_id: data.user.id, email }).eq('id', existing.id);
      } else {
        await supabase.from('customers').insert({
          user_id: data.user.id,
          email,
          phone: formattedPhone,
          full_name: name,
          role: 'staff'
        });
      }
    }
    return { success: true, user: data.user };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
};

export const fetchUserRole = async (phone: string): Promise<any> => {
  const { data } = await supabase.from('customers').select('role').eq('phone', phone).maybeSingle();
  return { success: true, role: data?.role || 'customer' };
};

export const adminUpdateUserRole = async (userId: string, role: string) => {
  await supabase.from('customers').update({ role }).eq('id', userId);
};

export const adminDeleteUser = async (userId: string) => {
  await supabase.from('customers').update({ is_active: false }).eq('id', userId);
};

export const fetchAllUsers = async (): Promise<any> => {
  const { data, error } = await supabase.from('customers').select('*');
  return { success: true, users: data?.map((u: any) => ({...u, name: u.full_name})) || [] };
};

// ==========================================
// 4. Order Management
// ==========================================

// --- Store Orders ---

export const createStoreOrder = async (orderData: any): Promise<{ success: boolean; orderId?: string; message?: string }> => {
  try {
    // التحقق من وجود معرف العميل
    if (!orderData.clientId) {
      console.error('Create Order Error: Missing Client ID');
      // لا نوقف العملية هنا، ربما الجدول يقبل null، لكن نسجل التحذير
    }

    const { error, data } = await supabase
      .from('orders')
      .insert({
        customer_id: orderData.clientId,
        service_type: 'Store Order',
        status: 'New',
        
        // --- الإضافة الهامة لحل مشكلة 400 ---
        project_name: 'طلب متجر إلكتروني', // إضافة اسم للمشروع لأنه غالباً إلزامي في قاعدتك
        // -----------------------------------

        total_amount: orderData.total,
        details: {
          items: orderData.items,
          address: orderData.address,
          notes: orderData.notes,
          payment_method: 'Pay on Delivery'
        }
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase Error Details:', error); // طباعة تفاصيل الخطأ في الكونسول
      throw error;
    }

    return { success: true, orderId: data.id };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
};

export const fetchAllOrders = async (): Promise<any> => {
  const { data, error } = await supabase
    .from('orders')
    .select(`*, customers:customer_id(full_name, phone)`)
    .order('created_at', { ascending: false });

  if (error) return { success: false, message: error.message };

  const orders = data.map((o: any) => ({
    id: o.id,
    type: o.service_type || o.order_type,
    status: o.status,
    client: o.customers?.full_name || 'Unknown',
    phone: o.customers?.phone,
    date: new Date(o.created_at).toLocaleDateString(),
    amount: o.total_amount ? `${o.total_amount} SAR` : '-',
    details: o.details,
    pdf_url: o.pdf_url
  }));

  return { success: true, orders };
};

export const fetchClientOrders = async (clientId: string): Promise<any> => {
    const { data } = await supabase.from('orders').select('*').eq('customer_id', clientId).order('created_at', { ascending: false });
    return { 
        success: true, 
        orders: data?.map((o: any) => ({
            id: o.id, type: o.service_type, status: o.status, date: new Date(o.created_at).toLocaleDateString(), 
            amount: o.total_amount, pdf_url: o.pdf_url, details: o.details 
        })) 
    };
};

export const updateOrderStatus = async (orderId: string, status: string): Promise<boolean> => {
  const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
  return !error;
};

export const updateOrderPDF = async (orderId: string, pdfUrl: string) => {
  await supabase.from('orders').update({ pdf_url: pdfUrl }).eq('id', orderId);
};

export const addOrderNote = async (orderId: string, note: string, author: string): Promise<{ success: boolean }> => {
  const { data: order } = await supabase.from('orders').select('details').eq('id', orderId).single();
  const currentDetails = order?.details || {};
  const logs = currentDetails.logs || [];
  await supabase.from('orders').update({
    details: { ...currentDetails, logs: [...logs, { content: note, author, created_at: new Date().toISOString() }] }
  }).eq('id', orderId);
  return { success: true };
};

// ==========================================
// 5. Form Submissions
// ==========================================

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

export const submitDesignRequest = async (payload: DesignRequestPayload, clientId?: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('orders').insert({
      customer_id: clientId,
      service_type: 'Design',
      status: 'Pending',
      details: payload,
      project_name: payload.unitType
    });
    return !error;
  } catch (e) { return false; }
};

export const submitFeasibilityStudy = async (payload: FeasibilityPayload, clientId?: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('orders').insert({
      customer_id: clientId,
      service_type: 'Feasibility Study',
      status: 'Pending',
      details: payload,
      project_name: payload.projectType || 'دراسة جدوى'
    });
    return !error;
  } catch (e) { return false; }
};

export const createLeadAndDraftBooking = async (payload: BookingPayload): Promise<{ success: boolean; appointmentId?: string; message?: string }> => {
  try {
    // 1. فتح ملف للعميل فوراً (Lead Capture) حتى لو لم يكمل التحقق
    let formattedPhone = payload.phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('05')) formattedPhone = '966' + formattedPhone.substring(1);

    let { data: profile } = await supabase.from('customers').select('*').or(`phone.eq.${formattedPhone},email.eq.${payload.email}`).maybeSingle();

    if (!profile) {
      const { data: newProfile } = await supabase.from('customers').insert([{
        full_name: payload.name,
        phone: formattedPhone,
        email: payload.email,
        role: 'lead' // تسجيله كعميل محتمل
      }]).select().single();
      profile = newProfile;
    }

    // 2. تسجيل الموعد كـ (مسودة / بانتظار التحقق) - Abandoned Cart
    const { data: appointment, error } = await supabase.from('appointments').insert({
      appointment_date: `${payload.date}T${payload.time}:00`,
      status: 'Pending OTP', // حالة جديدة تعني أنه حجز مبدئي لم يكتمل
      notes: `Service: ${payload.service}, Client: ${payload.name}, Phone: ${payload.phone}\n⚠️ (بانتظار التحقق من الرمز - لم يكتمل)`
    }).select().single();

    if (error) throw error;
    
    return { success: true, appointmentId: appointment?.id };
  } catch (e: any) { 
    return { success: false, message: e.message }; 
  }
};

export const confirmDraftBooking = async (appointmentId: string, service: string, name: string, phone: string): Promise<boolean> => {
  try {
    // 3. تأكيد الموعد إذا قام بإدخال الرمز بنجاح
    const { error } = await supabase.from('appointments').update({
      status: 'Scheduled', // تحويله لموعد مؤكد
      notes: `Service: ${service}, Client: ${name}, Phone: ${phone}\n✅ (تم التحقق من الهوية وتأكيد الموعد)`
    }).eq('id', appointmentId);
    
    return !error;
  } catch (e) {
    return false;
  }
};

// ==========================================
// 6. Data Fetching (Store & Dashboard)
// ==========================================

export const fetchDailyTasks = async (userId?: string): Promise<Task[]> => {
  let query = supabase.from('tasks').select('*').eq('is_completed', false);
  if (userId) query = query.or(`assigned_to.eq.${userId},assigned_to.is.null`);
  const { data } = await query;
  return data || [];
};

export const fetchInventory = async (): Promise<InventoryItem[]> => {
  const { data } = await supabase.from('inventory').select('*');
  return data || [];
};

export const getProducts = async (category?: string): Promise<ProductDB[]> => {
  let query = supabase.from('store_products').select('*'); 
  if (category) query = query.eq('category', category);
  const { data } = await query;
  return (data as ProductDB[]) || [];
};

// ==========================================
// 7. Locations & Customer Profile (New)
// ==========================================

// جلب الدول المفعلة فقط
export const fetchActiveCountries = async () => {
  const { data } = await supabase
    .from('countries')
    .select('*')
    .eq('is_active', true)
    .order('name_ar');
  return data || [];
};

// جلب المدن التابعة لدولة معينة والمفعلة فقط
export const fetchActiveCities = async (countryId: string) => {
  const { data } = await supabase
    .from('cities')
    .select('*')
    .eq('country_id', countryId)
    .eq('is_active', true)
    .order('name_ar');
  return data || [];
};

// جلب بيانات العميل الكاملة (شاملة العنوان)
export const getCustomerProfile = async (userId: string) => {
  // نحاول البحث باستخدام user_id (للمسجلين عبر الـ Auth)
  let { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
    
  // إذا لم نجد، نحاول البحث باستخدام الـ id المباشر (للضيوف المسجلين برقم الجوال فقط)
  if (!data) {
     const { data: guestData } = await supabase
      .from('customers')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
     data = guestData;
  }

  return data;
};

// تحديث عنوان العميل (حفظ العنوان كافتراضي)
export const saveCustomerAddress = async (userId: string, address: any) => {
  try {
    await supabase
      .from('customers')
      .update({
        default_city: address.city,
        default_district: address.district,
        default_street: address.street
      })
      .eq('id', userId);
  } catch (error) {
    console.error('Error saving address:', error);
  }
};

export const validateCoupon = async (code: string) => {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code)
    .eq('is_active', true)
    .single();

  if (error || !data) return { valid: false, message: 'الكوبون غير صحيح' };
  
  // التحقق من تاريخ الانتهاء
  if (data.expiry_date && new Date(data.expiry_date) < new Date()) {
    return { valid: false, message: 'الكوبون منتهي الصلاحية' };
  }

  return { valid: true, coupon: data };
};