import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updateCustomerProfile, deleteCustomerAccount } from '../../services/apiService';
import { User, Phone, Mail, ShieldAlert, Loader2, Save, Trash2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ProfileSettings = () => {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // تحديث البيانات
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.phone) return;
    
    setLoading(true);
    setMessage({ type: '', text: '' });

    const res = await updateCustomerProfile(user.phone, {
      full_name: formData.name,
      email: formData.email
    });

    if (res.success) {
      // تحديث الجلسة المحلية بالبيانات الجديدة
      login({ ...user, name: formData.name, email: formData.email });
      setMessage({ type: 'success', text: 'تم حفظ البيانات بنجاح!' });
    } else {
      setMessage({ type: 'error', text: 'حدث خطأ أثناء الحفظ.' });
    }
    setLoading(false);
  };

  // حذف الحساب
  const handleDeleteAccount = async () => {
    if (!user?.phone) return;
    
    setDeleteLoading(true);
    const res = await deleteCustomerAccount(user.phone);
    
    if (res.success) {
      logout();
      navigate('/');
      alert('تم حذف حسابك وجميع بياناتك المرتبطة به بنجاح.');
    } else {
      alert('حدث خطأ أثناء حذف الحساب، يرجى التواصل مع الدعم الفني.');
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
      
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-black text-[#1a2a3a] mb-6 border-b pb-4 flex items-center gap-2">
          <User className="text-[#c5a059]" /> إعدادات الحساب الشخصي
        </h2>

        {message.text && (
          <div className={`p-4 rounded-xl mb-6 font-bold text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-6 max-w-2xl">
          {/* الجوال (للقراءة فقط لأنه المعرف الأساسي) */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">رقم الجوال (المعرف الأساسي للحساب)</label>
            <div className="relative">
              <Phone className="absolute right-3 top-3.5 text-gray-400" size={20} />
              <input type="text" disabled value={user?.phone || ''} className="w-full bg-gray-100 border border-gray-200 rounded-xl py-3 pl-4 pr-10 text-gray-500 font-num text-right cursor-not-allowed" dir="ltr" />
            </div>
            <p className="text-xs text-gray-400 mt-1">لا يمكن تغيير رقم الجوال لأنه مرتبط بجميع فواتيرك ومواعيدك.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">الاسم الكامل</label>
              <div className="relative">
                <User className="absolute right-3 top-3.5 text-gray-400" size={20} />
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-4 pr-10 outline-none focus:border-[#c5a059]" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-3 top-3.5 text-gray-400" size={20} />
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-4 pr-10 outline-none focus:border-[#c5a059] font-num text-right" dir="ltr" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="bg-[#1a2a3a] hover:bg-opacity-90 text-white font-bold py-3 px-8 rounded-xl transition-all flex items-center gap-2">
            {loading ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>} حفظ التعديلات
          </button>
        </form>
      </div>

      {/* منطقة الخطر - Danger Zone */}
      <div className="bg-red-50 border border-red-200 p-6 md:p-8 rounded-3xl">
        <h3 className="text-lg font-black text-red-700 mb-2 flex items-center gap-2"><ShieldAlert /> منطقة الخطر (Danger Zone)</h3>
        <p className="text-sm text-red-600 mb-6 font-bold">عند حذف حسابك، سيتم مسح جميع بياناتك، طلباتك، ومواعيدك نهائياً من النظام ولن تتمكن من استعادتها.</p>
        
        {!showDeleteConfirm ? (
          <button type="button" onClick={() => setShowDeleteConfirm(true)} className="bg-red-100 hover:bg-red-200 text-red-700 font-bold py-3 px-6 rounded-xl transition-all flex items-center gap-2">
            <Trash2 size={20} /> حذف الحساب نهائياً
          </button>
        ) : (
          <div className="bg-white p-4 rounded-2xl border border-red-300 inline-block animate-in fade-in">
            <p className="font-bold text-[#1a2a3a] mb-4 flex items-center gap-2"><AlertTriangle className="text-red-500"/> هل أنت متأكد من قرار الحذف؟</p>
            <div className="flex gap-3">
              <button onClick={handleDeleteAccount} disabled={deleteLoading} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-xl transition-all flex items-center gap-2">
                {deleteLoading ? <Loader2 className="animate-spin" size={16}/> : 'نعم، احذف حسابي'}
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-6 rounded-xl transition-all">
                تراجع
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};