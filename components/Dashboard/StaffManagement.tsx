import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { 
  fetchAllUsers, 
  adminUpdateUserRole, 
  adminDeleteUser, 
  registerClient 
} from '../../services/apiService';
import { Users, Trash2, Shield, UserPlus, X, Check, Loader2, Search } from 'lucide-react';

export const StaffManagement = () => {
  const { t, lang } = useLanguage();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // حالة النموذج الجديد
  const [newUser, setNewUser] = useState({ name: '', email: '', phone: '', password: '', role: 'staff' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const response = await fetchAllUsers();
    if (response.success) {
      setUsers(response.users);
    }
    setLoading(false);
  };

  const handleRoleUpdate = async (userId: string, newRole: string) => {
    // تحديث فوري في الواجهة (Optimistic UI)
    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    
    // إرسال للخادم
    await adminUpdateUserRole(userId, newRole);
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذا المستخدم؟' : 'Are you sure?')) {
      await adminDeleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // 1. تسجيل الحساب في Supabase Auth
    const result = await registerClient(newUser.name, newUser.email, newUser.phone, newUser.password);
    
    if (result.success) {
      // 2. تحديث الصلاحية مباشرة لأنه موظف
      // ملاحظة: registerClient ينشئ الحساب كـ customer افتراضياً، لذا نحدثه
      // نحتاج معرف المستخدم الجديد (User ID) من النتيجة
      if (result.user?.id) {
         // تحديث الصلاحية في جدول customers/profiles
         await adminUpdateUserRole(result.user.id, newUser.role);
      }
      
      alert(lang === 'ar' ? 'تم إضافة الموظف بنجاح' : 'Staff added successfully');
      setShowAddModal(false);
      setNewUser({ name: '', email: '', phone: '', password: '', role: 'staff' });
      loadUsers(); // إعادة تحميل القائمة
    } else {
      alert(lang === 'ar' ? 'خطأ: ' + result.message : 'Error: ' + result.message);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-[#1a2a3a]">{lang === 'ar' ? 'إدارة الفريق' : 'Staff Management'}</h2>
          <p className="text-gray-400 text-sm">{lang === 'ar' ? 'إضافة وتعديل صلاحيات الموظفين' : 'Manage access and roles'}</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-[#1a2a3a] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#c5a059] transition-all shadow-lg"
        >
          <UserPlus size={18} /> {lang === 'ar' ? 'إضافة موظف' : 'Add Staff'}
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-[#c5a059]" /></div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-6 text-start font-bold text-gray-500">{lang === 'ar' ? 'المستخدم' : 'User'}</th>
                <th className="p-6 text-start font-bold text-gray-500">{lang === 'ar' ? 'رقم الجوال' : 'Phone'}</th>
                <th className="p-6 text-start font-bold text-gray-500">{lang === 'ar' ? 'الصلاحية' : 'Role'}</th>
                <th className="p-6 text-end font-bold text-gray-500">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#1a2a3a]/5 rounded-full flex items-center justify-center text-[#1a2a3a] font-bold">
                        {user.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="font-bold text-[#1a2a3a]">{user.name || 'Unknown'}</div>
                        <div className="text-xs text-gray-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-6 font-bold text-gray-600" dir="ltr">{user.phone}</td>
                  <td className="p-6">
                    <select 
                      value={user.role}
                      onChange={(e) => handleRoleUpdate(user.id, e.target.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border-none outline-none cursor-pointer transition-colors
                        ${user.role === 'owner' ? 'bg-purple-100 text-purple-700' : 
                          user.role === 'manager' ? 'bg-[#c5a059]/10 text-[#c5a059]' : 
                          user.role === 'staff' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}
                    >
                      <option value="customer">Customer</option>
                      <option value="staff">Staff</option>
                      <option value="manager">Manager</option>
                      <option value="owner">Owner</option>
                    </select>
                  </td>
                  <td className="p-6 text-end">
                    <button 
                      onClick={() => handleDelete(user.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="Delete User"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal - إضافة موظف */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black">{lang === 'ar' ? 'بيانات الموظف الجديد' : 'New Staff Details'}</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-600">{lang === 'ar' ? 'الاسم الكامل' : 'Full Name'}</label>
                <input type="text" required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-bold mb-2 text-gray-600">{lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
                    <input type="email" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl font-bold" />
                 </div>
                 <div>
                    <label className="block text-sm font-bold mb-2 text-gray-600">{lang === 'ar' ? 'رقم الجوال' : 'Phone'}</label>
                    <input type="text" required value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl font-bold" />
                 </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-600">{lang === 'ar' ? 'كلمة المرور' : 'Password'}</label>
                <input type="password" required value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl font-bold" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-600">{lang === 'ar' ? 'الصلاحية' : 'Role'}</label>
                <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl font-bold">
                  <option value="staff">Staff (موظف مبيعات)</option>
                  <option value="manager">Manager (مدير فرع)</option>
                  <option value="owner">Owner (مالك)</option>
                </select>
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-[#1a2a3a] text-white rounded-xl font-bold hover:bg-[#c5a059] transition-all mt-4 flex justify-center">
                 {isSubmitting ? <Loader2 className="animate-spin" /> : (lang === 'ar' ? 'حفظ البيانات' : 'Create Account')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};