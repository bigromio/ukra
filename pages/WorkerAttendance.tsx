import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getTodayTicketByPhone, updateTicketAttendance } from '../services/apiService';
import { MapPin, Clock, CheckCircle, AlertTriangle, Loader2, Factory, LogOut } from 'lucide-react';

const FACTORY_LAT = 24.386333;
const FACTORY_LNG = 39.491361;
const MAX_DISTANCE_METERS = 200; 

function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c * 1000; 
}

export const WorkerAttendance = () => {
  // 🔴 نقرأ رقم الجوال من الرابط
  const { phone } = useParams();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [locationStatus, setLocationStatus] = useState<'checking' | 'inside' | 'outside' | 'error' | 'denied'>('checking');
  const [distance, setDistance] = useState<number>(0);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (phone) loadTicket();
  }, [phone]);

  const loadTicket = async () => {
    setLoading(true);
    // البحث عن تذكرة اليوم الخاصة بهذا الجوال
    const data = await getTodayTicketByPhone(phone as string);
    setTicket(data);
    setLoading(false);
    
    if (data && data.status !== 'completed') {
      checkLocation();
    }
  };

  const checkLocation = () => {
    setLocationStatus('checking');
    if (!navigator.geolocation) { setLocationStatus('error'); return; }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const dist = getDistanceInMeters(position.coords.latitude, position.coords.longitude, FACTORY_LAT, FACTORY_LNG);
        setDistance(Math.round(dist));
        if (dist <= MAX_DISTANCE_METERS) setLocationStatus('inside');
        else setLocationStatus('outside');
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) setLocationStatus('denied');
        else setLocationStatus('error');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleCheckIn = async () => {
    setActionLoading(true);
    const success = await updateTicketAttendance(ticket.id, { check_in_time: new Date().toISOString(), status: 'checked_in' });
    if (success) {
      alert('تم تسجيل حضورك بنجاح!');
      loadTicket();
    } else alert('حدث خطأ.');
    setActionLoading(false);
  };

  const handleCheckOut = async () => {
    if (!window.confirm('هل أنت متأكد من تسجيل الانصراف؟')) return;
    setActionLoading(true);
    const success = await updateTicketAttendance(ticket.id, { check_out_time: new Date().toISOString(), status: 'completed' });
    if (success) {
      alert('تم تسجيل انصرافك بنجاح. شكراً لك!');
      loadTicket();
    } else alert('حدث خطأ.');
    setActionLoading(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-10 h-10 animate-spin text-[#c5a059]" /></div>;

  // إذا لم يكن هناك تذكرة لليوم
  if (!ticket) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-tajawal" dir="rtl">
      <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-sm w-full border border-gray-100">
        <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-[#1a2a3a] mb-2">لا يوجد عمل اليوم</h2>
        <p className="text-gray-500">مرحباً، لا يوجد لديك جدول عمل مسجل في المصنع لهذا اليوم. يرجى مراجعة الإدارة.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 font-tajawal flex items-center justify-center" dir="rtl">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 relative">
        <div className="bg-[#1a2a3a] p-6 text-center text-white">
          <Factory className="w-12 h-12 text-[#c5a059] mx-auto mb-3" />
          <h1 className="text-xl font-black uppercase tracking-widest">UKRA Factory</h1>
          <p className="text-sm text-gray-400 mt-1">بوابة الحضور والانصراف</p>
        </div>

        <div className="p-6">
          <div className="bg-gray-50 p-4 rounded-2xl mb-6 border border-gray-100 text-center">
            <h2 className="text-lg font-bold text-[#1a2a3a]">{ticket.worker_name}</h2>
            <div className="flex justify-center gap-4 mt-3 text-sm text-gray-600 font-bold">
              <span className="flex items-center gap-1"><Clock size={16} className="text-[#c5a059]"/> {ticket.start_time} - {ticket.end_time}</span>
            </div>
          </div>

          {ticket.status === 'completed' ? (
            <div className="bg-green-50 p-6 rounded-2xl text-center border border-green-100">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
              <h3 className="font-bold text-green-800 text-lg mb-1">انتهى العمل</h3>
              <p className="text-sm text-green-600">تم تسجيل حضورك وانصرافك بنجاح لهذا اليوم.</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                {locationStatus === 'checking' && <div className="text-center p-4"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[#c5a059] mb-2" /><p className="font-bold text-sm">جاري التحقق من موقعك...</p></div>}
                {locationStatus === 'denied' && <div className="text-center p-4 bg-red-50 text-red-600 rounded-xl"><AlertTriangle className="w-8 h-8 mx-auto mb-2" /><p className="font-bold text-sm">يجب السماح بالـ GPS لتسجيل الحضور!</p><button onClick={checkLocation} className="mt-2 underline text-sm">حاول مرة أخرى</button></div>}
                {locationStatus === 'outside' && <div className="text-center p-4 bg-orange-50 text-orange-700 rounded-xl"><MapPin className="w-8 h-8 mx-auto mb-2" /><p className="font-bold text-sm">أنت خارج نطاق المصنع!</p><p className="text-xs">تبعد {distance} متر. اقترب أكثر.</p><button onClick={checkLocation} className="mt-2 underline text-sm">تحديث الموقع</button></div>}
              </div>

              {locationStatus === 'inside' && (
                <div className="space-y-3">
                  {ticket.status === 'pending' && <button onClick={handleCheckIn} disabled={actionLoading} className="w-full bg-green-600 text-white p-4 rounded-xl font-bold flex justify-center items-center gap-2">{actionLoading ? <Loader2 className="animate-spin" /> : <MapPin />} تسجيل الحضور</button>}
                  {ticket.status === 'checked_in' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-center font-bold text-sm">حضورك مسجل في: <div className="font-num text-lg">{new Date(ticket.check_in_time).toLocaleTimeString('ar-SA')}</div></div>
                      <button onClick={handleCheckOut} disabled={actionLoading} className="w-full bg-red-600 text-white p-4 rounded-xl font-bold flex justify-center items-center gap-2">{actionLoading ? <Loader2 className="animate-spin" /> : <LogOut />} تسجيل الانصراف</button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};