import { supabase } from '../lib/supabase';
import { 
  FurnitureQuotePayload, 
  FeasibilityPayload, 
  DesignRequestPayload, 
  BookingPayload, 
  ProductDB, 
  Task,
  TaskNote, // 👈 أضفنا هذه الكلمة هنا
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

export const fetchBookedSlots = async (date: string): Promise<string[]> => {
  try {
    // جلب المواعيد المحجوزة في هذا اليوم (المؤكدة أو التي بانتظار الـ OTP)
    const { data, error } = await supabase
      .from('appointments')
      .select('appointment_date')
      .gte('appointment_date', `${date}T00:00:00`)
      .lte('appointment_date', `${date}T23:59:59`)
      .neq('status', 'Cancelled');

    if (error) throw error;

    // استخراج الأوقات المحجوزة بصيغة "HH:mm"
    return data.map(app => {
      // نأخذ الجزء الخاص بالوقت من السلسلة النصية (مثال: 2025-10-10T14:00:00 -> 14:00)
      return app.appointment_date.split('T')[1].substring(0, 5);
    });
  } catch (e) {
    console.error("Error fetching booked slots:", e);
    return [];
  }
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

    // 2. حفظ الرمز في قاعدة بيانات Supabase (لكي يعمل التحقق لاحقاً)
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

    // 3. تجهيز رسالة الواتساب
    const message = `*رمز تحقق UKRA:*\n👉 *${code}*\n\nيرجى عدم مشاركته مع أحد.`;

    // 4. تجهيز قالب الإيميل الاحترافي (مدمج فيه كود التحقق والشعار)
    const emailSubject = "رمز التحقق الخاص بك من UKRA";
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f5f7;">
        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
          
          <div style="background-color: #1a2a3a; padding: 40px 20px; text-align: center; border-bottom: 4px solid #c5a059;">
            <img src="https://i.imgur.com/DVM92N4.png" alt="UKRA Logo" style="max-width: 160px; height: auto;" />
          </div>
          
          <div style="padding: 50px 40px; text-align: center; color: #333333; direction: rtl;">
            <h1 style="color: #1a2a3a; font-size: 26px; margin-bottom: 20px; font-weight: 900;">تسجيل الدخول الآمن</h1>
            <p style="line-height: 1.8; margin-bottom: 10px; font-size: 16px; color: #555;">مرحباً بك في منصة <strong>UKRA</strong>،</p>
            <p style="line-height: 1.8; margin-bottom: 30px; font-size: 16px; color: #555;">لقد طلبت رمز التحقق للدخول إلى حسابك. يرجى استخدام الرمز أدناه لإتمام العملية:</p>
            
            <div style="background-color: #f8f9fa; border: 2px dashed #c5a059; color: #1a2a3a; padding: 25px; font-size: 38px; font-weight: 900; letter-spacing: 12px; border-radius: 12px; margin: 0 auto; width: fit-content; box-shadow: inset 0 2px 5px rgba(0,0,0,0.02);">
              ${code}
            </div>
            
            <p style="font-size: 13px; color: #888; margin-top: 40px; font-weight: bold;">صلاحية الرمز: 10 دقائق فقط.</p>
            <p style="font-size: 13px; color: #e74c3c;">يرجى عدم مشاركة هذا الرمز مع أي شخص لضمان أمان حسابك.</p>
          </div>
          
          <div style="background-color: #fbfbfb; padding: 25px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eeeeee;">
            <p style="margin: 0; line-height: 1.6;">&copy; 2026 UKRA Engineering & Construction.<br>المدينة المنورة، المملكة العربية السعودية</p>
            <p style="direction: ltr; font-family: monospace; margin-top: 10px; color: #ccc;">Access Type: OTP Verification via StackCP</p>
          </div>
          
        </div>
      </body>
      </html>
    `;

    // 5. إرسال الطلب إلى سيرفر الواتساب/الإيميل الخاص بك
    sendToGateway({ 
        phone: formattedPhone, 
        message: message,
        email: email,
        emailSubject: emailSubject,
        emailHtml: emailHtml
    });

    return true; 
  } catch (error) {
    console.error('Unified OTP Request Failed:', error);
    return false;
  }
};

// 2. التحقق من الرمز (محدثة لتجنب خطأ 406 و 409)
export const verifyUnifiedOTP = async (identifier: string, code: string): Promise<any> => {
  try {
    let cleanIdentifier = identifier.replace(/\D/g, '');
    if (cleanIdentifier.startsWith('05')) cleanIdentifier = '966' + cleanIdentifier.substring(1);
    if (!cleanIdentifier || cleanIdentifier.length < 5) cleanIdentifier = identifier;

    // استخدام limit(1) بدلاً من single
    const { data: codes, error: codeErr } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('code', code)
      .or(`phone.eq.${cleanIdentifier},email.eq.${identifier}`)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    const otpData = codes?.[0];

    if (codeErr || !otpData) return { success: false, message: 'الرمز غير صحيح أو منتهي الصلاحية' };

    await supabase.from('otp_codes').delete().eq('id', otpData.id);

    // استخدام limit(1)
    let { data: profiles } = await supabase
      .from('customers')
      .select('*')
      .or(`phone.eq.${otpData.phone},email.eq.${otpData.email}`)
      .limit(1);
    
    let profile = profiles?.[0];
    
    if (!profile) {
      const { data: newProfiles } = await supabase
        .from('customers')
        .insert([{ 
           phone: otpData.phone, 
           email: otpData.email, 
           full_name: 'Guest User', 
           role: 'customer' 
        }])
        .select().limit(1);
      profile = newProfiles?.[0];
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

export const updateUserTabs = async (userId: string, tabs: string[]) => {
  try {
    const { error } = await supabase.from('customers').update({ allowed_tabs: tabs }).eq('id', userId);
    return !error;
  } catch (e) {
    return false;
  }
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
    }

    const { error, data } = await supabase
      .from('orders')
      .insert({
        customer_id: orderData.clientId,
        service_type: 'Store Order',
        status: 'New',
        project_name: 'طلب متجر إلكتروني', 
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
      console.error('Supabase Error Details:', error); 
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

// 1. إنشاء الحجز المبدئي (محدثة لتجنب خطأ 409)
export const createLeadAndDraftBooking = async (payload: BookingPayload): Promise<{ success: boolean; appointmentId?: string; message?: string }> => {
  try {
    let formattedPhone = payload.phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('05')) formattedPhone = '966' + formattedPhone.substring(1);

    // استخدام limit(1) بدلاً من maybeSingle لتجنب أخطاء 406
    let { data: profiles } = await supabase.from('customers').select('*').or(`phone.eq.${formattedPhone},email.eq.${payload.email}`).limit(1);
    let profile = profiles?.[0];

    if (!profile) {
      const { data: newProfiles } = await supabase.from('customers').insert([{
        full_name: payload.name,
        phone: formattedPhone,
        email: payload.email,
        role: 'lead'
      }]).select().limit(1);
      profile = newProfiles?.[0];
    }

    const { data: appointment, error } = await supabase.from('appointments').insert({
      appointment_date: `${payload.date}T${payload.time}:00`,
      status: 'Pending OTP',
      notes: `Service: ${payload.service}, Client: ${payload.name}, Phone: ${payload.phone}\n⚠️ (بانتظار التحقق من الرمز)`
    }).select().single();

    if (error) throw error;
    
    return { success: true, appointmentId: appointment?.id };
  } catch (e: any) { 
    return { success: false, message: e.message }; 
  }
};

// 3. تأكيد الموعد وإرسال التذكرة (تحديث كامل)
export const confirmDraftBooking = async (
  appointmentId: string, 
  service: string, 
  name: string, 
  phone: string,
  email: string,
  date: string,
  time: string
): Promise<boolean> => {
  try {
    const { error } = await supabase.from('appointments').update({
      status: 'Scheduled',
      notes: `Service: ${service}, Client: ${name}, Phone: ${phone}\n✅ (تم التحقق من الهوية وتأكيد الموعد)`
    }).eq('id', appointmentId);
    
    if (error) throw error;

    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('05')) formattedPhone = '966' + formattedPhone.substring(1);

    const serviceName = service === 'Design' ? 'استشارة تصميم فندقي' : 'مبيعات وتوريد';
    const ticketNumber = String(appointmentId).padStart(5, '0').substring(0, 6).toUpperCase();

    // رسالة الواتساب
    const whatsappMessage = `*تذكرة موعد مؤكد - UKRA* 🏢\n\nأهلاً بك أستاذ/ة *${name}*،\nيسعدنا إخبارك بأنه تم تأكيد موعدك بنجاح.\n\n🎟️ *رقم التذكرة:* #${ticketNumber}\n📝 *الخدمة:* ${serviceName}\n📅 *التاريخ:* ${date}\n⏰ *الوقت:* ${time}\n\n📍 *الموقع:* المدينة المنورة\nنسعد بزيارتك!`;

    // إيميل التذكرة
    const emailSubject = "تأكيد موعدك مع UKRA - تذكرة الدخول";
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f5f7;">
        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
          <div style="background-color: #1a2a3a; padding: 30px; text-align: center; border-bottom: 4px solid #c5a059;">
            <img src="https://i.imgur.com/DVM92N4.png" alt="UKRA" style="max-width: 140px;" />
          </div>
          <div style="padding: 40px; color: #333; direction: rtl;">
            <h2 style="color: #1a2a3a; text-align: center; margin-bottom: 30px; font-weight: 900;">تذكرة موعد مؤكد</h2>
            <p style="font-size: 16px;">أهلاً بك <strong>${name}</strong>،</p>
            <p style="font-size: 16px;">يسعدنا إخبارك بأنه تم تأكيد حجز موعدك بنجاح. يرجى إبراز هذه التذكرة عند وصولك:</p>
            
            <div style="background-color: #f8f9fa; border: 1px dashed #c5a059; padding: 25px; border-radius: 12px; margin: 30px 0;">
              <div style="margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                <span style="color: #888; font-size: 14px;">رقم التذكرة:</span><br/>
                <strong style="color: #1a2a3a; font-size: 20px;">#${ticketNumber}</strong>
              </div>
              <div style="margin-bottom: 15px;">
                <span style="color: #888; font-size: 14px;">نوع الخدمة:</span><br/>
                <strong style="font-size: 16px;">${serviceName}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <div>
                  <span style="color: #888; font-size: 14px;">التاريخ:</span><br/>
                  <strong style="font-size: 16px; color: #c5a059;">${date}</strong>
                </div>
                <div>
                  <span style="color: #888; font-size: 14px;">الوقت:</span><br/>
                  <strong style="font-size: 16px; color: #c5a059;">${time}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendToGateway({ 
        phone: formattedPhone, 
        message: whatsappMessage,
        email: email,
        emailSubject: emailSubject,
        emailHtml: emailHtml
    });

    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};
// ==========================================
// 6. Data Fetching (Store & Dashboard)
// ==========================================

// هذه الدالة ستقوم مستقبلاً بجلب أوقات العمل والإجازات من لوحة تحكم الإدارة (جدول settings)
export const fetchBusinessSettings = async () => {
  try {
    // محاكاة لما سيعود من قاعدة البيانات لاحقاً
    return {
      success: true,
      settings: {
        workStartHour: 9, // يبدأ العمل 9 صباحاً
        workEndHour: 17,  // ينتهي 5 مساءً (بنظام 24 ساعة)
        holidays: ['2026-04-10', '2026-04-11'], // تواريخ الإجازات والأعياد (تغلق بالكامل)
        workDaysText: 'من الأحد إلى الخميس، 9:00 ص - 5:00 م' // النص الذي يظهر للعميل
      }
    };
  } catch (error) {
    return { success: false, settings: null };
  }
};

export const assignNewTask = async (taskData: Partial<Task>, employeePhone: string, employeeEmail: string): Promise<boolean> => {
  try {
    // 1. حفظ المهمة في قاعدة البيانات
    const { error } = await supabase.from('tasks').insert({
      title: taskData.title,
      description: taskData.description,
      assigned_to: employeePhone,
      assigned_to_name: taskData.assigned_to_name,
      assigned_by: taskData.assigned_by,
      due_date: taskData.due_date,
      status: 'Pending'
    });

    if (error) throw error;

    // 2. تجهيز الواتساب
    let formattedPhone = employeePhone.replace(/\D/g, '');
    if (formattedPhone.startsWith('05')) formattedPhone = '966' + formattedPhone.substring(1);

    const deadline = new Date(taskData.due_date!).toLocaleString('ar-SA');
    const whatsappMessage = `*تكليف بمهمة جديدة 📋*\n\nمرحباً *${taskData.assigned_to_name}*،\nتم إسناد مهمة جديدة إليك من قبل *${taskData.assigned_by}*:\n\n📌 *المهمة:* ${taskData.title}\n📝 *التفاصيل:* ${taskData.description}\n⏳ *موعد التسليم:* ${deadline}\n\nيرجى الدخول للوحة التحكم للبدء في التنفيذ. بالتوفيق!`;

    // 3. تجهيز الإيميل الاحترافي
    const emailSubject = "تكليف بمهمة جديدة - UKRA";
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f5f7;">
        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
          <div style="background-color: #1a2a3a; padding: 30px; text-align: center; border-bottom: 4px solid #c5a059;">
            <img src="https://i.imgur.com/DVM92N4.png" alt="UKRA" style="max-width: 140px;" />
          </div>
          <div style="padding: 40px; color: #333; direction: rtl;">
            <h2 style="color: #1a2a3a; text-align: center; margin-bottom: 30px; font-weight: 900;">تكليف بمهمة جديدة 📋</h2>
            <p style="font-size: 16px;">مرحباً <strong>${taskData.assigned_to_name}</strong>،</p>
            <p style="font-size: 16px;">تم إسناد مهمة جديدة إليك من قبل <strong>${taskData.assigned_by}</strong>. يرجى الاطلاع على التفاصيل أدناه:</p>
            
            <div style="background-color: #f8f9fa; border: 1px dashed #c5a059; padding: 25px; border-radius: 12px; margin: 30px 0;">
              <div style="margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                <span style="color: #888; font-size: 14px;">عنوان المهمة:</span><br/>
                <strong style="color: #1a2a3a; font-size: 20px;">${taskData.title}</strong>
              </div>
              <div style="margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                <span style="color: #888; font-size: 14px;">التفاصيل:</span><br/>
                <span style="font-size: 16px;">${taskData.description || 'لا توجد تفاصيل إضافية'}</span>
              </div>
              <div>
                <span style="color: #888; font-size: 14px;">موعد التسليم:</span><br/>
                <strong style="font-size: 16px; color: #e74c3c;">${deadline}</strong>
              </div>
            </div>
            
            <p style="text-align: center; margin-top: 30px;">
              <a href="https://ukra.sa" style="background-color: #c5a059; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">الذهاب للوحة التحكم</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // 4. الإرسال للبوابة الموحدة (واتس + إيميل)
    sendToGateway({ 
      phone: formattedPhone, 
      message: whatsappMessage,
      email: employeeEmail,
      emailSubject: emailSubject,
      emailHtml: emailHtml
    });

    return true;
  } catch (e) {
    console.error('Error assigning task:', e);
    return false;
  }
};

export const updateTaskProgress = async (taskId: string, newStatus: 'Pending' | 'In Progress' | 'Completed'): Promise<boolean> => {
  try {
    const updateData: any = { status: newStatus };
    
    // تسجيل أوقات البدء والانتهاء تلقائياً
    if (newStatus === 'In Progress') {
      updateData.started_at = new Date().toISOString();
    } else if (newStatus === 'Completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabase.from('tasks').update(updateData).eq('id', taskId);
    return !error;
  } catch (e) {
    return false;
  }
};

export const addTaskNote = async (taskId: string, content: string, author: string, currentNotes: TaskNote[] = []): Promise<boolean> => {
  try {
    const newNote: TaskNote = {
      id: Date.now().toString(),
      content,
      author,
      created_at: new Date().toISOString()
    };
    const updatedNotes = [...currentNotes, newNote];
    
    const { error } = await supabase.from('tasks').update({ notes: updatedNotes }).eq('id', taskId);
    return !error;
  } catch (e) {
    return false;
  }
};


export const deleteTask = async (taskId: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) throw error;
    return true;
  } catch (e) {
    console.error('Error deleting task:', e);
    return false;
  }
};

// تحديث دالة الجلب لتشمل كل البيانات الجديدة وترتيبها بالأحدث
export const fetchDailyTasks = async (userPhone?: string): Promise<Task[]> => {
  let query = supabase.from('tasks').select('*').order('created_at', { ascending: false });
  // إذا تم تمرير هاتف الموظف، يجلب مهامه فقط. وإلا يجلب كل المهام (للمدير)
  if (userPhone) {
    query = query.eq('assigned_to', userPhone);
  }
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