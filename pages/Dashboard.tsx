import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { UserRole } from '../types';
import { 
  LayoutDashboard, LogOut, FileText, Settings, Users, Bell, 
  Palette, FileSpreadsheet, TrendingUp, Send, User, ShieldCheck
} from 'lucide-react';

// استيراد المكونات الفرعية
import { DailyTasks } from '../components/Dashboard/DailyTasks';
import { StaffManagement } from '../components/Dashboard/StaffManagement';
import { AnalyticsCharts } from '../components/Dashboard/AnalyticsCharts';
import { ProfileSettings } from '../components/Dashboard/ProfileSettings'; // سننشئه في الخطوة 3
import { ClientOrders } from '../pages/ClientOrders';

export const Dashboard = () => {
  const { user, logout } = useAuth(); // للموظفين
  const { t, dir, toggleLang, lang } = useLanguage();
  
  // تحديد هوية المستخدم
  const isClientAuth = localStorage.getItem('isAuthenticated') === 'true';
  const clientRole = localStorage.getItem('userRole'); // 'customer'
  
  // تحديد الصلاحيات
  const isOwner = user?.role === UserRole.OWNER;
  const isManager = user?.role === UserRole.MANAGER;
  const isStaff = user && !isOwner && !isManager;
  const isCustomer = isClientAuth && clientRole === 'customer';

  // الحالة
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // تعيين التبويب الافتراضي عند التحميل
  useEffect(() => {
    if (isCustomer) setActiveTab('my-orders');
    else setActiveTab('overview');
  }, [isCustomer]);

  // دالة الخروج (تميز بين العميل والموظف)
  const handleLogout = () => {
    if (isCustomer) {
      localStorage.clear();
      window.location.href = '/';
    } else {
      logout();
    }
  };

  return (
    <div className="flex h-screen bg-[#F1F5F9] overflow-hidden font-tajawal" dir={dir}>
      
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 z-50 w-72 bg-[#1a2a3a] text-white transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : (lang === 'ar' ? 'translate-x-full' : '-translate-x-full')}`}>
        <div className="p-8 border-b border-white/5 flex flex-col items-center">
          <ShieldCheck className="text-[#c5a059] w-10 h-10 mb-3" />
          <h2 className="text-2xl font-black tracking-widest uppercase">UKRA <span className="text-[#c5a059]">Core</span></h2>
          <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-[0.2em]">
            {isOwner ? 'Owner Access' : isCustomer ? 'Client Portal' : 'Staff Access'}
          </p>
        </div>

        <nav className="flex-grow p-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
          
          {/* تبويبات الموظفين والأونر */}
          {!isCustomer && (
            <>
              <NavItem icon={<LayoutDashboard />} label={t('dash_overview')} active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
              <NavItem icon={<FileText />} label={t('dash_orders')} active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
              <NavItem icon={<Palette />} label={lang === 'ar' ? 'التصاميم' : 'Designs'} active={activeTab === 'designs'} onClick={() => setActiveTab('designs')} />
              <NavItem icon={<FileSpreadsheet />} label="BOQ" active={activeTab === 'boq'} onClick={() => setActiveTab('boq')} />
            </>
          )}

          {/* تبويبات الأونر والمدير فقط */}
          {(isOwner || isManager) && (
            <>
              <div className="pt-4 pb-2 px-4 text-[10px] text-gray-500 font-bold uppercase">{lang === 'ar' ? 'الإدارة' : 'Admin'}</div>
              <NavItem icon={<TrendingUp />} label={lang === 'ar' ? 'التحليلات' : 'Analytics'} active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
              <NavItem icon={<Send />} label={lang === 'ar' ? 'التسويق' : 'Marketing'} active={activeTab === 'marketing'} onClick={() => setActiveTab('marketing')} />
              <NavItem icon={<Users />} label={t('dash_staff')} active={activeTab === 'staff'} onClick={() => setActiveTab('staff')} />
            </>
          )}

          {/* تبويبات العميل فقط */}
          {isCustomer && (
            <>
              <NavItem icon={<FileText />} label={lang === 'ar' ? 'طلباتي' : 'My Orders'} active={activeTab === 'my-orders'} onClick={() => setActiveTab('my-orders')} />
              <NavItem icon={<User />} label={lang === 'ar' ? 'الملف الشخصي' : 'Profile'} active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
            </>
          )}

        </nav>

        <div className="p-6 border-t border-white/5">
          <button onClick={handleLogout} className="flex items-center justify-center w-full px-4 py-4 bg-red-500/10 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all font-bold text-sm">
            <LogOut className="w-5 h-5 ltr:mr-2 rtl:ml-2" /> {t('dash_logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex justify-between items-center z-40">
           <div className="flex items-center gap-4">
             <button className="md:hidden" onClick={() => setSidebarOpen(!isSidebarOpen)}><Settings className="w-6 h-6" /></button>
             <h1 className="text-xl font-black text-[#1a2a3a] uppercase">{activeTab.replace('-', ' ')}</h1>
           </div>
           <div className="flex items-center gap-3">
             <button onClick={toggleLang} className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-bold">{lang === 'ar' ? 'EN' : 'عربي'}</button>
             <div className="text-right hidden md:block">
               <p className="text-sm font-bold text-[#1a2a3a]">{user?.name || (isCustomer ? 'Client' : 'User')}</p>
               <p className="text-[10px] text-[#c5a059] font-bold uppercase">{user?.role || 'Guest'}</p>
             </div>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          
          {/* محتوى الموظفين */}
          {!isCustomer && (
            <>
              {activeTab === 'overview' && <DailyTasks filterUserId={isStaff ? user?.id : undefined} />}
              {activeTab === 'staff' && (isOwner || isManager) && <StaffManagement />}
              {activeTab === 'analytics' && (isOwner || isManager) && <AnalyticsCharts />}
              {activeTab === 'marketing' && (isOwner || isManager) && (
                <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                  <Send className="w-16 h-16 mx-auto text-[#c5a059] mb-4" />
                  <h2 className="text-xl font-bold">WhatsApp Campaigns</h2>
                  <p className="text-gray-400">Campaign management module loading...</p>
                </div>
              )}
            </>
          )}

          {/* محتوى العميل */}
          {isCustomer && (
            <>
              {activeTab === 'my-orders' && (
              <ClientOrders />

              )}
              {activeTab === 'profile' && <ProfileSettings />}
            </>
          )}

          {/* محتوى مشترك (Orders Tables - Placeholder) */}
          {(activeTab === 'orders' || activeTab === 'designs' || activeTab === 'boq') && (
             <div className="bg-white p-10 rounded-3xl border border-gray-100 text-center">
               <p className="text-gray-400 font-bold">Data Table for {activeTab} goes here...</p>
             </div>
          )}

        </div>
      </main>
    </div>
  );
};

// Helper Component for Sidebar Items
const NavItem = ({ icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`flex items-center w-full px-5 py-4 rounded-2xl transition-all gap-3 ${active ? 'bg-[#c5a059] text-[#1a2a3a] shadow-lg' : 'hover:bg-white/5 text-gray-400'}`}>
    {React.cloneElement(icon, { size: 20 })} <span className="font-bold text-sm">{label}</span>
  </button>
);