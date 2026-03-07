import React, { useState, useEffect } from 'react';
import { fetchAllUsers, adminUpdateUserRole, adminDeleteUser, assignNewTask, registerClient, updateUserTabs } from '../../services/apiService';
import { Shield, Trash2, UserPlus, ClipboardList, X, Loader2, CheckSquare, Square, Settings2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

// قائمة التبويبات المتوفرة في النظام لبرمجتها في الصلاحيات
const SYSTEM_TABS = [
  { id: 'dashboard', name: 'التحليلات والنظرة العامة' },
  { id: 'tasks', name: 'المهام اليومية (Kanban)' },
  { id: 'orders', name: 'إدارة الطلبات والمبيعات' },
  { id: 'inventory', name: 'المخزون والمنتجات' },
  { id: 'advisor', name: 'المستشار الفندقي' },
  { id: 'staff', name: 'إدارة الموظفين والصلاحيات' },
  { id: 'settings', name: 'إعدادات النظام' },
];

export const StaffManagement = () => {
  const { dir } = useLanguage();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // حالات النافذة الجانبية (درج الصلاحيات)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedUserForPerms, setSelectedUserForPerms] = useState<any>(null);
  const [userTabs, setUserTabs] = useState<string[]>([]);
  const [savingTabs, setSavingTabs] = useState(false);

  // حالات نافذة إضافة موظف جديد
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: '', phone: '', email: '', password: '', role: 'staff' });

  // حالات نافذة المهام (باقية كما هي)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [taskLoading, setTaskLoading] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', due_date: '' });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const res = await fetchAllUsers();
    if (res.success) setUsers(res.users);
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (window.confirm('هل أنت متأكد من تغيير صلاحية هذا المستخدم؟')) {
      await adminUpdateUserRole(userId, newRole);
      loadUsers();
    }
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm('هل أنت متأكد من إيقاف هذا الحساب؟')) {
      await adminDeleteUser(userId);
      loadUsers();
    }
  };

  // --- دوال إضافة موظف جديد ---
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    const res = await registerClient(newEmployee.name, newEmployee.email, newEmployee.phone, newEmployee.password);
    
    if (res.success && res.user) {
      // تحديث الصلاحية بعد الإنشاء (لأن الدالة الافتراضية تجعله staff)
      await adminUpdateUserRole(res.user.id, newEmployee.role);
      
      // إعطاؤه صلاحيات افتراضية مسموحة
      const defaultTabs = newEmployee.role === 'manager' || newEmployee.role === 'owner' 
        ? SYSTEM_TABS.map(t => t.id) 
        : ['dashboard', 'tasks'];
      await updateUserTabs(res.user.id, defaultTabs);

      alert('تم إنشاء حساب الموظف بنجاح!');
      setIsAddModalOpen(false);
      setNewEmployee({ name: '', phone: '', email: '', password: '', role: 'staff' });
      loadUsers();
    } else {
      alert(`خطأ: ${res.message}`);
    }
    setAddLoading(false);
  };

  // --- دوال صلاحيات التبويبات (الدرج) ---
  const openPermissionsDrawer = (user: any) => {
    setSelectedUserForPerms(user);
    // قراءة التبويبات المسموحة من قاعدة البيانات (أو افتراضية إذا لم تكن موجودة)
    setUserTabs(user.allowed_tabs || ['dashboard', 'tasks', 'orders']);
    setIsDrawerOpen(true);
  };

  const toggleTab = (tabId: string) => {
    setUserTabs(prev => 
      prev.includes(tabId) ? prev.filter(id => id !== tabId) : [...prev, tabId]
    );
  };

  const savePermissions = async () => {
    setSavingTabs(true);
    const success = await updateUserTabs(selectedUserForPerms.id, userTabs);
    setSavingTabs(false);
    if (success) {
      alert('تم حفظ صلاحيات التبويبات بنجاح!');
      setIsDrawerOpen(false);
      loadUsers();
    }
  };

  // --- دوال إسناد المهام ---
  const openTaskModal = (employee: any) => {
    setSelectedEmployee(employee);
    setTaskForm({ title: '', description: '', due_date: '' });
    setIsTaskModalOpen(true);
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    setTaskLoading(true);
    const success = await assignNewTask(
      { title: taskForm.title, description: taskForm.description, due_date: new Date(taskForm.due_date).toISOString(), assigned_to_name: selectedEmployee.name || selectedEmployee.full_name, assigned_by: "الإدارة" },
      selectedEmployee.phone, selectedEmployee.email
    );
    setTaskLoading(false);
    if (success) { alert('تم الإرسال!'); setIsTaskModalOpen(false); }
  };

  if (loading) return <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-ukra-gold" /></div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 font-cairo" dir={dir}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-ukra-navy flex items-center gap-2">
          <Shield className="text-ukra-gold" /> إدارة فريق العمل والصلاحيات
        </h2>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-ukra-navy text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-all text-sm font-bold"
        >
          <UserPlus size={18} /> إضافة موظف جديد
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-gray-50 text-gray-600 text-sm">
            <tr>
              <th className="p-4 rounded-r-lg">الاسم (اضغط للتحكم بالصلاحيات)</th>
              <th className="p-4">رقم الجوال</th>
              <th className="p-4">البريد الإلكتروني</th>
              <th className="p-4">الدور الوظيفي</th>
              <th className="p-4 rounded-l-lg text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((user, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 font-bold">
                  <button 
                    onClick={() => openPermissionsDrawer(user)}
                    className="text-ukra-navy hover:text-ukra-gold transition-colors flex items-center gap-2 text-right group"
                    title="التحكم بصلاحيات التبويبات"
                  >
                    <Settings2 size={16} className="text-gray-400 group-hover:text-ukra-gold" />
                    <span className="underline decoration-dashed decoration-gray-300 group-hover:decoration-ukra-gold underline-offset-4">
                      {user.name || user.full_name || 'غير محدد'}
                    </span>
                  </button>
                </td>
                <td className="p-4 text-gray-600 font-num" dir="ltr">{user.phone}</td>
                <td className="p-4 text-gray-600 font-num">{user.email || '-'}</td>
                <td className="p-4">
                  <select 
                    value={user.role} 
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className={`text-sm rounded-full px-3 py-1 font-bold outline-none cursor-pointer border-2
                      ${user.role === 'owner' ? 'bg-purple-100 text-purple-700 border-purple-200' : 
                        user.role === 'manager' ? 'bg-blue-100 text-blue-700 border-blue-200' : 
                        user.role === 'staff' ? 'bg-green-100 text-green-700 border-green-200' :
                        'bg-gray-100 text-gray-600 border-gray-200'}`}
                  >
                    <option value="owner">مالك (Owner)</option>
                    <option value="manager">مدير (Manager)</option>
                    <option value="staff">موظف (Staff)</option>
                    <option value="customer">عميل (Customer)</option>
                  </select>
                </td>
                <td className="p-4 text-center space-x-2 space-x-reverse">
                  {user.role !== 'customer' && user.role !== 'CLIENT' && (
                    <button onClick={() => openTaskModal(user)} title="إسناد مهمة" className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-colors inline-block">
                      <ClipboardList size={18} />
                    </button>
                  )}
                  <button onClick={() => handleDelete(user.id)} title="إيقاف الحساب" className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors inline-block">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- نافذة (درج) التحكم بصلاحيات التبويبات --- */}
      {isDrawerOpen && selectedUserForPerms && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-white w-full max-w-sm h-full shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col">
            <div className="bg-ukra-navy p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">صلاحيات التبويبات</h3>
                <p className="text-sm text-gray-300 mt-1">{selectedUserForPerms.name || selectedUserForPerms.full_name}</p>
              </div>
              <button onClick={() => setIsDrawerOpen(false)} className="hover:text-red-400"><X size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <p className="text-sm text-gray-500 mb-4">حدد التبويبات التي يحق لهذا الموظف رؤيتها والدخول إليها:</p>
              
              {SYSTEM_TABS.map(tab => {
                const isAllowed = userTabs.includes(tab.id);
                // منع إغلاق تبويب الإعدادات والموظفين عن المالك لتجنب حبس نفسه
                const isLockedForOwner = (selectedUserForPerms.role === 'owner') && (tab.id === 'settings' || tab.id === 'staff');
                
                return (
                  <div 
                    key={tab.id} 
                    onClick={() => !isLockedForOwner && toggleTab(tab.id)}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer
                      ${isAllowed ? 'border-ukra-navy bg-blue-50/50' : 'border-gray-100 bg-white hover:border-gray-300'}
                      ${isLockedForOwner ? 'opacity-50 cursor-not-allowed grayscale' : ''}
                    `}
                  >
                    <span className={`font-bold ${isAllowed ? 'text-ukra-navy' : 'text-gray-500'}`}>{tab.name}</span>
                    {isAllowed ? <CheckSquare className="text-ukra-gold" /> : <Square className="text-gray-300" />}
                  </div>
                );
              })}
            </div>

            <div className="p-6 border-t bg-gray-50">
              <button 
                onClick={savePermissions} 
                disabled={savingTabs}
                className="w-full bg-ukra-gold hover:bg-yellow-600 text-white font-bold py-3 rounded-xl transition-colors flex justify-center items-center"
              >
                {savingTabs ? <Loader2 className="animate-spin" /> : 'حفظ الصلاحيات'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- نافذة إضافة موظف جديد --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="bg-ukra-navy p-4 flex justify-between items-center text-white">
              <h3 className="font-bold flex items-center gap-2"><UserPlus size={20} className="text-ukra-gold" /> موظف جديد</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="hover:text-red-400"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleAddEmployee} className="p-6 space-y-4">
              <div><label className="block text-sm font-bold text-gray-700 mb-1">الاسم الكامل *</label><input required type="text" className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-ukra-gold bg-gray-50" value={newEmployee.name} onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})} /></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-1">رقم الجوال *</label><input required type="text" placeholder="05xxxxxxxx" className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-ukra-gold bg-gray-50 font-num" value={newEmployee.phone} onChange={(e) => setNewEmployee({...newEmployee, phone: e.target.value})} /></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-1">البريد الإلكتروني *</label><input required type="email" className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-ukra-gold bg-gray-50 font-num" value={newEmployee.email} onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})} /></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-1">كلمة المرور المؤقتة *</label><input required type="text" className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-ukra-gold bg-gray-50 font-num" value={newEmployee.password} onChange={(e) => setNewEmployee({...newEmployee, password: e.target.value})} /></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-1">الدور الوظيفي</label>
                <select className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-ukra-gold bg-gray-50" value={newEmployee.role} onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value})}>
                  <option value="staff">موظف (Staff)</option>
                  <option value="manager">مدير (Manager)</option>
                  <option value="owner">مالك (Owner)</option>
                </select>
              </div>
              <button type="submit" disabled={addLoading} className="w-full bg-ukra-navy hover:bg-opacity-90 text-white font-bold py-3 rounded-lg mt-4 flex justify-center">
                {addLoading ? <Loader2 className="animate-spin" /> : 'إنشاء الحساب'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- نافذة إسناد المهمة (كما هي مسبقاً) --- */}
      {isTaskModalOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
             <div className="bg-ukra-navy p-4 flex justify-between items-center text-white"><h3 className="font-bold text-ukra-gold">تكليف بمهمة</h3><button onClick={() => setIsTaskModalOpen(false)}><X /></button></div>
             <form onSubmit={handleTaskSubmit} className="p-6 space-y-4">
                <input required type="text" placeholder="عنوان المهمة" className="w-full border p-3 rounded-lg" value={taskForm.title} onChange={(e) => setTaskForm({...taskForm, title: e.target.value})} />
                <textarea rows={3} placeholder="التفاصيل" className="w-full border p-3 rounded-lg" value={taskForm.description} onChange={(e) => setTaskForm({...taskForm, description: e.target.value})} />
                <input required type="datetime-local" className="w-full border p-3 rounded-lg" value={taskForm.due_date} onChange={(e) => setTaskForm({...taskForm, due_date: e.target.value})} />
                <button type="submit" disabled={taskLoading} className="w-full bg-ukra-gold text-white font-bold py-3 rounded-lg">{taskLoading ? 'جاري الإرسال...' : 'إرسال التكليف'}</button>
             </form>
          </div>
        </div>
      )}

    </div>
  );
};  