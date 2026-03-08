import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { fetchUserRole } from '../services/apiService';
import { 
  LayoutDashboard, LogOut, FileText, Settings, Users, Bell, 
  Palette, FileSpreadsheet, TrendingUp, Send, User, ShieldCheck, ShoppingBag, 
  Globe, Home, Menu, X, Factory, Briefcase, ShoppingCart
} from 'lucide-react';

// استيراد المكونات الفرعية
import { FactoryManagement } from '../components/Dashboard/FactoryManagement';
import { EcommerceManagement } from '../components/Dashboard/EcommerceManagement';
import { DailyTasks } from '../components/Dashboard/DailyTasks';
import { StaffManagement } from '../components/Dashboard/StaffManagement';
import { AnalyticsCharts } from '../components/Dashboard/AnalyticsCharts';
import { ProfileSettings } from '../components/Dashboard/ProfileSettings';
import { ClientOrders } from './ClientOrders';
import { BOQBuilder } from '../components/Dashboard/BOQBuilder';
import { MarketingHub } from '../components/Dashboard/MarketingHub';
import { OrdersManagement } from '../components/Dashboard/OrdersManagement';

export const Dashboard = () => {
  const { user, logout } = useAuth(); 
  const { t, dir, lang } = useLanguage();
  
  const [realRole, setRealRole] = useState(localStorage.getItem('userRole') || 'customer');
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // التحقق من الصلاحية عند التحميل
  useEffect(() => {
    const checkRole = async () => {
      const storedPhone = localStorage.getItem('ukra_client_phone');
      if (storedPhone) {
        const res = await fetchUserRole(storedPhone);
        if (res.success && res.role && res.role !== realRole) {
          localStorage.setItem('userRole', res.role);
          setRealRole(res.role);
        }
      }
    };
    checkRole();
  }, []);

  const currentRole = user?.role || realRole;
  const isOwner = currentRole === 'owner';
  const isManager = currentRole === 'manager';
  const isStaff = currentRole === 'staff';
  const isCustomer = currentRole === 'customer';

  // --- نظام الصلاحيات الذكي لإظهار وإخفاء التبويبات ---
  // نقرأ التبويبات المسموحة من حساب المستخدم، وإذا لم تكن موجودة نعطيه الأساسيات فقط
  const allowedTabs = user?.allowed_tabs || ['overview', 'orders'];
  // دالة مساعدة: الأونر يرى كل شيء دائماً، والموظف يرى المسموح له فقط
  const canSee = (tabId: string) => isOwner || allowedTabs.includes(tabId);

  const [activeTab, setActiveTab] = useState(() => {
    if (isCustomer) return 'my-orders';
    return 'overview';
  });

  const handleLogout = () => {
    localStorage.clear();
    logout();
    window.location.href = '/';
  };

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  // --- مكونات مؤقتة للتبويبات الجديدة حتى نبرمجها ---
  const EcommercePlaceholder = () => <div className="p-10 text-center mt-20"><ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" /><h2 className="text-2xl font-bold text-gray-400">🛒 إدارة المتجر والمنتجات (قيد البرمجة...)</h2></div>;
  const FactoryPlaceholder = () => <div className="p-10 text-center mt-20"><Factory className="w-16 h-16 text-gray-300 mx-auto mb-4" /><h2 className="text-2xl font-bold text-gray-400">🏭 إدارة المصنع والعمالة (قيد البرمجة...)</h2></div>;
  const SettingsPlaceholder = () => <div className="p-10 text-center mt-20"><Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" /><h2 className="text-2xl font-bold text-gray-400">⚙️ إعدادات النظام والإشعارات (قيد البرمجة...)</h2></div>;

  return (
    <div className="flex h-screen bg-[#F1F5F9] overflow-hidden font-tajawal" dir={dir}>
      
      {/* --- Mobile Overlay --- */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* --- Sidebar --- */}
      <aside 
        className={`
          fixed inset-y-0 z-50 w-72 bg-[#1a2a3a] text-white flex flex-col h-full
          transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : (lang === 'ar' ? 'translate-x-full' : '-translate-x-full')}
          md:relative md:translate-x-0
        `}
      >
        <div className="p-6 border-b border-white/5 flex flex-col items-center shrink-0 relative">
          <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 md:hidden text-gray-400 hover:text-white rtl:right-auto rtl:left-4">
            <X size={24} />
          </button>
          <ShieldCheck className="text-[#c5a059] w-10 h-10 mb-3" />
          <h2 className="text-2xl font-black tracking-widest uppercase">UKRA <span className="text-[#c5a059]">Core</span></h2>
          <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-[0.2em] bg-white/5 px-2 py-1 rounded">
            {currentRole.toUpperCase()} ACCESS
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
          
          <a href="/" className="flex items-center w-full px-5 py-3.5 mb-6 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-[#c5a059] hover:border-[#c5a059] transition-all gap-3 shadow-lg group">
            <Globe size={20} className="group-hover:animate-spin-slow" /> 
            <span className="font-bold text-sm">{lang === 'ar' ? 'تصفح الموقع' : 'Go to Website'}</span>
          </a>

          {/* تبويبات الإدارة والموظفين (تظهر حسب الصلاحيات المحددة من الأونر) */}
          {!isCustomer && (
            <>
              <div className="px-4 text-[10px] text-gray-500 font-bold uppercase mb-2 mt-4">إدارة العمليات</div>
              
              {canSee('overview') && <NavItem icon={<LayoutDashboard />} label="المهام اليومية" active={activeTab === 'overview'} onClick={() => handleTabClick('overview')} />}
              {canSee('ecommerce') && <NavItem icon={<ShoppingBag />} label="إدارة المتجر" active={activeTab === 'ecommerce'} onClick={() => handleTabClick('ecommerce')} />}
              {canSee('orders') && <NavItem icon={<ShoppingCart />} label="الطلبات والمواعيد" active={activeTab === 'orders'} onClick={() => handleTabClick('orders')} />}
              {canSee('projects') && <NavItem icon={<Briefcase />} label="المشاريع والمقاولات" active={activeTab === 'projects'} onClick={() => handleTabClick('projects')} />}
              {canSee('factory') && <NavItem icon={<Factory />} label="إدارة المصنع" active={activeTab === 'factory'} onClick={() => handleTabClick('factory')} />}

              {/* تبويبات الإدارة العليا والضبط */}
              {(canSee('analytics') || canSee('staff') || canSee('marketing') || canSee('settings')) && (
                <>
                  <div className="pt-6 pb-2 px-4 text-[10px] text-gray-500 font-bold uppercase">الإدارة والضبط</div>
                  {canSee('analytics') && <NavItem icon={<TrendingUp />} label="التحليلات الشاملة" active={activeTab === 'analytics'} onClick={() => handleTabClick('analytics')} />}
                  {canSee('staff') && <NavItem icon={<Users />} label="إدارة الموظفين" active={activeTab === 'staff'} onClick={() => handleTabClick('staff')} />}
                  {canSee('marketing') && <NavItem icon={<Send />} label="حملات التسويق" active={activeTab === 'marketing'} onClick={() => handleTabClick('marketing')} />}
                  {canSee('settings') && <NavItem icon={<Settings />} label="إعدادات النظام" active={activeTab === 'settings'} onClick={() => handleTabClick('settings')} />}
                </>
              )}
            </>
          )}

          {/* تبويبات العميل (ثابتة) */}
          {isCustomer && (
            <>
               <NavItem icon={<ShoppingBag />} label={lang === 'ar' ? 'طلباتي' : 'My Orders'} active={activeTab === 'my-orders'} onClick={() => handleTabClick('my-orders')} />
               <NavItem icon={<User />} label={lang === 'ar' ? 'الملف الشخصي' : 'My Profile'} active={activeTab === 'profile'} onClick={() => handleTabClick('profile')} />
            </>
          )}

          <div className="h-10"></div>
        </nav>

        <div className="p-4 border-t border-white/5 shrink-0 bg-[#1a2a3a]">
          <button onClick={handleLogout} className="flex items-center justify-center w-full px-4 py-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all font-bold text-sm">
            <LogOut className="w-5 h-5 ltr:mr-2 rtl:ml-2" /> {t('dash_logout')}
          </button>
        </div>
      </aside>

      {/* --- Main Content Area --- */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
        <header className="bg-white border-b border-gray-100 px-4 md:px-8 py-4 flex justify-between items-center z-30 shrink-0">
           <div className="flex items-center gap-4">
             <button className="md:hidden p-2 text-[#1a2a3a] bg-gray-100 rounded-lg hover:bg-gray-200" onClick={() => setSidebarOpen(true)}>
               <Menu size={24} />
             </button>
             <h1 className="text-lg md:text-xl font-black text-[#1a2a3a] uppercase truncate max-w-[150px] md:max-w-none">
               {activeTab.replace('-', ' ')}
             </h1>
           </div>

           <div className="flex items-center gap-2 md:gap-4">
              <a href="#/store" className="p-2 text-gray-400 hover:text-[#c5a059] transition-colors rounded-full hover:bg-gray-50"><ShoppingBag size={20} /></a>
              <a href="/" className="p-2 text-gray-400 hover:text-[#c5a059] transition-colors rounded-full hover:bg-gray-50"><Home size={20} /></a>
              <div className="h-6 w-px bg-gray-200 mx-1 md:mx-2"></div>
              
              <div className="flex items-center gap-2">
                 <div className="hidden md:block text-right">
                    <p className="text-sm font-bold text-[#1a2a3a]">{localStorage.getItem('ukra_client_phone') || 'User'}</p>
                    <span className="text-[10px] bg-[#c5a059] text-white px-2 py-0.5 rounded font-bold uppercase block w-fit ml-auto rtl:mr-auto rtl:ml-0">
                      {currentRole}
                    </span>
                 </div>
                 <div className="w-8 h-8 md:w-10 md:h-10 bg-[#1a2a3a] rounded-full flex items-center justify-center text-white font-bold text-sm">
                   {user?.name?.charAt(0) || 'U'}
                 </div>
              </div>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-[#F1F5F9]">
          
          {/* محتوى الإدارة والموظفين (يتم العرض حسب المسموح) */}
          {!isCustomer && (
            <>
              {activeTab === 'overview' && <DailyTasks filterUserId={isStaff ? user?.id : undefined} />}
              {activeTab === 'ecommerce' && <EcommerceManagement />}
              {activeTab === 'orders' && <OrdersManagement />}
              {activeTab === 'projects' && <BOQBuilder />}
              {activeTab === 'factory' && <FactoryManagement />}
              {activeTab === 'analytics' && <AnalyticsCharts />}
              {activeTab === 'marketing' && <MarketingHub />}
              {activeTab === 'staff' && <StaffManagement />}
              {activeTab === 'settings' && <SettingsPlaceholder />}
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

const NavItem = ({ icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick} 
    className={`
      flex items-center w-full px-5 py-3.5 rounded-xl transition-all gap-3 mb-1
      ${active 
        ? 'bg-[#c5a059] text-white shadow-lg shadow-[#c5a059]/20 font-bold translate-x-1 rtl:-translate-x-1' 
        : 'hover:bg-white/5 text-gray-400 hover:text-white font-medium'
      }
    `}
  >
    {React.cloneElement(icon, { size: 20 })} 
    <span className="text-sm">{label}</span>
  </button>
);