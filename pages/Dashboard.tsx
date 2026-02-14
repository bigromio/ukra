import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  LayoutDashboard, LogOut, FileText, Settings, Users, Bell, 
  Palette, FileSpreadsheet, TrendingUp, Send, User, ShieldCheck, ShoppingBag 
} from 'lucide-react';

// استيراد المكونات الفرعية
import { DailyTasks } from '../components/Dashboard/DailyTasks';
import { StaffManagement } from '../components/Dashboard/StaffManagement';
import { AnalyticsCharts } from '../components/Dashboard/AnalyticsCharts';
import { ProfileSettings } from '../components/Dashboard/ProfileSettings';
import { ClientOrders } from './ClientOrders'; // تأكد أن المسار صحيح
import { BOQBuilder } from '../components/Dashboard/BOQBuilder';
import { MarketingHub } from '../components/Dashboard/MarketingHub';

export const Dashboard = () => {
  const { user, logout } = useAuth(); 
  const { t, dir, toggleLang, lang } = useLanguage();
  
  // 1. تحديد الهوية والصلاحية من المصدر الموحد
  const isClientAuth = localStorage.getItem('isAuthenticated') === 'true';
  const storedRole = localStorage.getItem('userRole'); // 'owner', 'manager', 'staff', 'customer'
  
  // دمج الصلاحيات (الأولوية للـ storedRole القادم من Login الجديد)
  const currentRole = user?.role || storedRole || 'customer';
  
  const isOwner = currentRole === 'owner';
  const isManager = currentRole === 'manager';
  const isStaff = currentRole === 'staff';
  const isCustomer = currentRole === 'customer';

  // 2. تحديد التبويب الافتراضي
  const [activeTab, setActiveTab] = useState(() => {
    if (isCustomer) return 'my-orders';
    return 'overview';
  });
  
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // دالة الخروج الموحدة
  const handleLogout = () => {
    localStorage.clear();
    logout(); // لتنظيف AuthContext أيضاً
    window.location.href = '/';
  };

return (
    <div className="flex h-screen bg-[#F1F5F9] overflow-hidden font-tajawal" dir={dir}>
      
      {/* Sidebar - القائمة الجانبية الذكية */}
      <aside className={`fixed inset-y-0 z-50 w-72 bg-[#1a2a3a] text-white transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : (lang === 'ar' ? 'translate-x-full' : '-translate-x-full')}`}>
        <div className="p-8 border-b border-white/5 flex flex-col items-center">
          <ShieldCheck className="text-[#c5a059] w-10 h-10 mb-3" />
          <h2 className="text-2xl font-black tracking-widest uppercase">UKRA <span className="text-[#c5a059]">Core</span></h2>
          <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-[0.2em] bg-white/5 px-2 py-1 rounded">
            {currentRole.toUpperCase()} ACCESS
          </p>
        </div>

        <nav className="flex-grow p-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
          
          {/* تبويبات الإدارة والموظفين */}
          {!isCustomer && (
            <>
              <div className="px-4 text-[10px] text-gray-500 font-bold uppercase mb-2">{t('dash_overview')}</div>
              <NavItem icon={<LayoutDashboard />} label={t('dash_overview')} active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
              <NavItem icon={<FileText />} label={t('dash_orders')} active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
              <NavItem icon={<FileSpreadsheet />} label="BOQ & Pricing" active={activeTab === 'boq'} onClick={() => setActiveTab('boq')} />
            </>
          )}

          {/* تبويبات الأونر والمدير فقط (الحساسة) */}
          {(isOwner || isManager) && (
            <>
              <div className="pt-6 pb-2 px-4 text-[10px] text-gray-500 font-bold uppercase">{lang === 'ar' ? 'الإدارة العليا' : 'Administration'}</div>
              <NavItem icon={<TrendingUp />} label={lang === 'ar' ? 'التحليلات المالية' : 'Financial Analytics'} active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
              <NavItem icon={<Users />} label={t('dash_staff')} active={activeTab === 'staff'} onClick={() => setActiveTab('staff')} />
              <NavItem icon={<Send />} label={lang === 'ar' ? 'التسويق (واتساب)' : 'Marketing Hub'} active={activeTab === 'marketing'} onClick={() => setActiveTab('marketing')} />
            </>
          )}

          {/* تبويبات العميل */}
          {isCustomer && (
            <>
               <NavItem icon={<ShoppingBag />} label={lang === 'ar' ? 'طلباتي' : 'My Orders'} active={activeTab === 'my-orders'} onClick={() => setActiveTab('my-orders')} />
               <NavItem icon={<User />} label={lang === 'ar' ? 'الملف الشخصي' : 'My Profile'} active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
            </>
          )}
        </nav>

        <div className="p-6 border-t border-white/5">
          <button onClick={handleLogout} className="flex items-center justify-center w-full px-4 py-4 bg-red-500/10 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all font-bold text-sm">
            <LogOut className="w-5 h-5 ltr:mr-2 rtl:ml-2" /> {t('dash_logout')}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex justify-between items-center z-40">
           <div className="flex items-center gap-4">
             <button className="md:hidden text-[#1a2a3a]" onClick={() => setSidebarOpen(!isSidebarOpen)}><Settings /></button>
             <h1 className="text-xl font-black text-[#1a2a3a] uppercase">{activeTab.replace('-', ' ')}</h1>
           </div>
           {/* User Info */}
           <div className="flex items-center gap-4">
              <div className="hidden md:block text-right">
                 <p className="text-sm font-bold text-[#1a2a3a]">{localStorage.getItem('ukra_client_phone') || 'User'}</p>
                 <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${isOwner ? 'bg-[#c5a059] text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {currentRole}
                 </span>
              </div>
           </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[#F1F5F9]">
          
          {/* محتوى الموظفين والإدارة */}
          {!isCustomer && (
            <>
              {activeTab === 'overview' && <DailyTasks filterUserId={isStaff ? user?.id : undefined} />}
              
              {/* تبويب الموظفين (للأونر والمدير) */}
              {activeTab === 'staff' && (isOwner || isManager) && <StaffManagement />}
              
              {/* تبويب التسويق (للأونر والمدير) */}
              {activeTab === 'marketing' && (isOwner || isManager) && <MarketingHub />}
              
              {/* تبويب التحليلات (للأونر والمدير) */}
              {activeTab === 'analytics' && (isOwner || isManager) && <AnalyticsCharts />}
              
              {/* تبويب الـ BOQ (للجميع ما عدا العميل) - صفحة الانتظار */}
              {activeTab === 'boq' && <BOQBuilder />}
              
              {/* تبويب الطلبات (مشترك للإدارة والموظفين) - Placeholder */}
              {activeTab === 'orders' && (
                 <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                    <FileText className="w-16 h-16 mx-auto text-gray-200 mb-4" />
                    <h2 className="text-xl font-bold text-gray-400">نظام إدارة الطلبات الشامل</h2>
                    <p className="text-gray-400">سيتم تفعيله بعد ربط المنتجات (المرحلة القادمة)</p>
                 </div>
              )}
            </>
          )}

          {/* محتوى العميل */}
          {isCustomer && (
            <>
              {activeTab === 'my-orders' && <ClientOrders />}
              {activeTab === 'profile' && <ProfileSettings />}
            </>
          )}

        </div>
      </main>
    </div>
  );
};

// Helper UI Component
const NavItem = ({ icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`flex items-center w-full px-5 py-3.5 rounded-xl transition-all gap-3 mb-1 ${active ? 'bg-[#c5a059] text-white shadow-lg shadow-[#c5a059]/20' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}>
    {React.cloneElement(icon, { size: 20 })} <span className="font-bold text-sm">{label}</span>
  </button>
);