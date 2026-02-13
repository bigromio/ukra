import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { UserRole } from '../types';
import { DailyTasks } from '../components/Dashboard/DailyTasks';
import { Leaderboard } from '../components/Dashboard/Leaderboard';
import { FacilityTracker } from '../components/Dashboard/FacilityTracker';
import { AnalyticsCharts } from '../components/Dashboard/AnalyticsCharts';
import { StaffManagement } from '../components/Dashboard/StaffManagement';
import { 
  LayoutDashboard, LogOut, FileText, Settings, Users, Bell, 
  Globe, Loader2, Palette, FileSpreadsheet, TrendingUp,
  Send, MessageSquare, PieChart, UserPlus, ShieldCheck, Clock
} from 'lucide-react';

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const { t, dir, toggleLang, lang } = useLanguage();
  
  // حالات التبويبات المتقدمة
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'designs' | 'boq' | 'staff' | 'analytics' | 'marketing'>('overview');
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // منطق التحقق من الصلاحيات
  const isOwner = user?.role === UserRole.OWNER;
  const isManager = user?.role === UserRole.MANAGER;
  const isPrivileged = isOwner || isManager;

  // منع العملاء من الوصول نهائياً
  if (localStorage.getItem('isAuthenticated') === 'true' && localStorage.getItem('userRole') === 'customer') {
    window.location.href = '#/client-orders';
    return null;
  }

  if (!user) return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-50 font-tajawal">
      <Loader2 className="animate-spin w-12 h-12 text-[#c5a059] mb-4" />
      <p className="text-gray-500">{lang === 'ar' ? 'جاري تأمين الاتصال...' : 'Securing connection...'}</p>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F4F7FE] overflow-hidden font-tajawal" dir={dir}>
      
      {/* Sidebar الاحترافي */}
      <aside className={`fixed inset-y-0 z-50 w-72 bg-[#1a2a3a] text-white flex-shrink-0 flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : (lang === 'ar' ? 'translate-x-full' : '-translate-x-full')}`}>
        
        {/* Logo */}
        <div className="p-8 flex flex-col items-center border-b border-white/5">
          <div className="w-12 h-12 bg-[#c5a059] rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-[#c5a059]/20">
            <ShieldCheck className="text-[#1a2a3a] w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black tracking-tighter">UKRA <span className="text-[#c5a059]">CORE</span></h2>
          <span className="text-[10px] text-gray-500 uppercase tracking-[0.3em] mt-1">Management Suite</span>
        </div>

        {/* User Badge */}
        <div className="px-6 py-6">
          <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-3 border border-white/5">
            <img 
              src={`https://ui-avatars.com/api/?name=${user.name}&background=c5a059&color=fff`} 
              className="w-10 h-10 rounded-lg" 
              alt="Avatar" 
            />
            <div className="overflow-hidden">
              <p className="font-bold text-sm truncate">{user.name}</p>
              <p className="text-[10px] text-[#c5a059] font-bold uppercase">{user.role}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-grow px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          <NavItem icon={<LayoutDashboard />} label={t('dash_overview')} active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
          
          <div className="pt-4 pb-2 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">{lang === 'ar' ? 'العمليات' : 'Operations'}</div>
          
          <NavItem icon={<FileText />} label={t('dash_orders')} active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
          <NavItem icon={<Palette />} label={lang === 'ar' ? 'التصاميم' : 'Designs'} active={activeTab === 'designs'} onClick={() => setActiveTab('designs')} />
          <NavItem icon={<FileSpreadsheet />} label={lang === 'ar' ? 'حساب الكميات' : 'BOQ'} active={activeTab === 'boq'} onClick={() => setActiveTab('boq')} />

          {isPrivileged && (
            <>
              <div className="pt-4 pb-2 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">{lang === 'ar' ? 'الإدارة والنمو' : 'Management & Growth'}</div>
              <NavItem icon={<TrendingUp />} label={lang === 'ar' ? 'تحليل المبيعات' : 'Sales Analytics'} active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
              <NavItem icon={<MessageSquare />} label={lang === 'ar' ? 'التسويق الذكي' : 'Smart Marketing'} active={activeTab === 'marketing'} onClick={() => setActiveTab('marketing')} />
              <NavItem icon={<Users />} label={lang === 'ar' ? 'إدارة الفريق' : 'Team Hub'} active={activeTab === 'staff'} onClick={() => setActiveTab('staff')} />
            </>
          )}
        </nav>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/5 space-y-2">
          <button onClick={toggleLang} className="flex items-center justify-center w-full gap-2 text-xs text-gray-400 hover:text-white transition-colors py-2">
            <Globe className="w-4 h-4" /> {lang === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
          </button>
          <button onClick={logout} className="flex items-center justify-center w-full px-4 py-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all font-bold text-sm">
            <LogOut className="w-4 h-4 ltr:mr-2 rtl:ml-2" /> {t('dash_logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Header المستقبلي */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-4 flex justify-between items-center z-40">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 bg-gray-100 rounded-lg" onClick={() => setSidebarOpen(true)}>
              <Settings className="w-5 h-5 text-[#1a2a3a]" />
            </button>
            <div>
              <h1 className="font-black text-xl text-[#1a2a3a] uppercase tracking-tight">
                {activeTab === 'overview' ? 'Command Center' : activeTab.replace(/([A-Z])/g, ' $1')}
              </h1>
              <div className="flex items-center gap-2 text-[10px] font-bold text-green-600 mt-0.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                SYSTEM ACTIVE & ENCRYPTED
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="hidden lg:block text-right ltr:mr-4 rtl:ml-4 border-l ltr:pl-4 rtl:pr-4 border-gray-100">
                <p className="text-[10px] text-gray-400 font-bold uppercase">{lang === 'ar' ? 'التوقيت الحالي' : 'System Time'}</p>
                <p className="text-sm font-black text-[#1a2a3a] font-num">{new Date().toLocaleTimeString()}</p>
             </div>
             <button className="w-11 h-11 rounded-2xl bg-[#c5a059]/5 flex items-center justify-center text-[#c5a059] hover:bg-[#c5a059] hover:text-white transition-all border border-[#c5a059]/10 relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
             </button>
          </div>
        </header>

        {/* Content Box */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          
          {/* 1. النظرة العامة */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <DailyTasks filterUserId={!isPrivileged ? user.id : undefined} />
                </div>
                <div className="lg:col-span-1">
                  <Leaderboard />
                </div>
              </div>
              <FacilityTracker />
            </div>
          )}

          {/* 2. تحليل المبيعات (للأونر والمدير) */}
          {activeTab === 'analytics' && isPrivileged && (
            <div className="animate-in zoom-in-95 duration-500">
               <div className="bg-[#1a2a3a] text-white p-8 rounded-[2rem] shadow-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div>
                    <h2 className="text-3xl font-black mb-2">{lang === 'ar' ? 'لوحة البيانات المالية' : 'Financial Intelligence'}</h2>
                    <p className="text-gray-400 text-sm max-w-md">{lang === 'ar' ? 'رؤية كاملة للمبيعات، عروض السعر، والأداء المالي للمؤسسة مع مقارنات ذكية.' : 'Complete visibility into sales, quotes, and financial performance.'}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex gap-8">
                     <div className="text-center">
                        <p className="text-[10px] text-[#c5a059] font-bold uppercase">ROI Rate</p>
                        <p className="text-xl font-black font-num">+24.8%</p>
                     </div>
                     <div className="text-center">
                        <p className="text-[10px] text-[#c5a059] font-bold uppercase">Active Projects</p>
                        <p className="text-xl font-black font-num">142</p>
                     </div>
                  </div>
               </div>
               <AnalyticsCharts />
            </div>
          )}

          {/* 3. التسويق الذكي (للأونر والمدير) */}
          {activeTab === 'marketing' && isPrivileged && (
            <MarketingPanel lang={lang} />
          )}

          {/* 4. إدارة الفريق (للأونر والمدير) */}
          {activeTab === 'staff' && isPrivileged && (
            <StaffManagement />
          )}

          {/* 5. الطلبات والـ BOQ (مع الخصوصية) */}
          {(activeTab === 'orders' || activeTab === 'designs' || activeTab === 'boq') && (
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-16 text-center animate-in fade-in duration-500">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-10 h-10 text-gray-200" />
              </div>
              <h2 className="text-2xl font-black text-[#1a2a3a]">
                {activeTab === 'orders' ? t('dash_orders') : activeTab === 'designs' ? 'Design Vault' : 'BOQ Systems'}
              </h2>
              <p className="text-gray-400 mt-2 max-w-md mx-auto">
                {isPrivileged 
                  ? 'Accessing Enterprise Records: All data is currently visible and exportable.' 
                  : 'Personal Workspace: Only records assigned to your ID are visible.'}
              </p>
              <div className="mt-8 flex justify-center gap-4">
                 <button className="px-8 py-3 bg-[#1a2a3a] text-white rounded-xl font-bold text-sm hover:bg-[#c5a059] transition-colors">
                    {lang === 'ar' ? 'تحديث البيانات' : 'Sync Records'}
                 </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

// مكون عنصر القائمة الجانبية
const NavItem = ({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick} 
    className={`flex items-center w-full px-5 py-3.5 rounded-2xl transition-all gap-4 group ${active ? 'bg-[#c5a059] text-[#1a2a3a] shadow-xl shadow-[#c5a059]/10' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
  >
    <span className={`w-5 h-5 transition-transform group-hover:scale-110 ${active ? 'text-[#1a2a3a]' : 'text-gray-500 group-hover:text-[#c5a059]'}`}>
      {React.cloneElement(icon, { size: 20, strokeWidth: 2.5 })}
    </span>
    <span className="font-bold text-sm tracking-tight">{label}</span>
  </button>
);

// مكون لوحة التسويق (ميزة الرسائل التلقائية)
const MarketingPanel = ({ lang }: { lang: string }) => {
  const [msg, setMsg] = useState('');
  const [isSending, setIsSending] = useState(false);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-in slide-in-from-right-8 duration-500">
       <div className="xl:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-green-50 rounded-xl"><Send className="text-green-600" /></div>
                <h3 className="text-xl font-black text-[#1a2a3a]">{lang === 'ar' ? 'إطلاق حملة واتساب جديدة' : 'New WhatsApp Campaign'}</h3>
             </div>
             
             <div className="space-y-6">
                <div>
                   <label className="block text-xs font-black text-gray-400 uppercase mb-2 ltr:ml-1 rtl:mr-1">{lang === 'ar' ? 'رسالة الحملة' : 'Campaign Content'}</label>
                   <textarea 
                      value={msg}
                      onChange={(e) => setMsg(e.target.value)}
                      placeholder={lang === 'ar' ? 'اكتب رسالتك هنا... استخدم [name] لإضافة اسم العميل تلقائياً' : 'Write message... use [name] for dynamic insertion'}
                      className="w-full h-48 bg-gray-50 border-gray-100 rounded-2xl p-6 focus:ring-2 focus:ring-[#c5a059] transition-all resize-none font-bold"
                   />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <Clock className="text-[#c5a059] w-5 h-5" />
                         <span className="text-xs font-bold">{lang === 'ar' ? 'الفاصل الزمني: 3 دقائق' : 'Interval: 3 Mins'}</span>
                      </div>
                      <Settings className="w-4 h-4 text-gray-300" />
                   </div>
                   <button 
                      onClick={() => setIsSending(true)}
                      className="bg-[#1a2a3a] text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-[#1a2a3a]/20 hover:bg-[#c5a059] transition-all flex items-center justify-center gap-3"
                   >
                      {isSending ? <Loader2 className="animate-spin" /> : <Send className="w-4 h-4" />}
                      {lang === 'ar' ? 'بدء البث المجدول' : 'Start Broadcast'}
                   </button>
                </div>
             </div>
          </div>
       </div>

       <div className="xl:col-span-1 space-y-8">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
             <h3 className="text-lg font-black text-[#1a2a3a] mb-6">{lang === 'ar' ? 'قائمة المستهدفين' : 'Target List'}</h3>
             <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center font-bold text-xs text-[#1a2a3a] shadow-sm">#{i}</div>
                      <div>
                        <p className="text-[11px] font-black">Customer_{i}02</p>
                        <p className="text-[10px] text-gray-400 font-num">+966 5x xxx xxxx</p>
                      </div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                  </div>
                ))}
             </div>
             <button className="w-full mt-6 py-3 border-2 border-dashed border-gray-100 rounded-xl text-gray-400 text-xs font-bold hover:bg-gray-50 transition-colors">
                + {lang === 'ar' ? 'رفع قائمة CSV' : 'Upload CSV List'}
             </button>
          </div>
       </div>
    </div>
  );
};