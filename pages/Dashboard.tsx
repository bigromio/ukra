
import React, { useEffect, useState } from 'react';
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
  Globe, User, Loader2
} from 'lucide-react';

export const Dashboard = () => {
  const { user, logout, isClient, isAdmin } = useAuth();
  const { t, dir, toggleLang, lang } = useLanguage();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'staff'>(isClient ? 'orders' : 'overview');
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin w-10 h-10 text-ukra-gold" /></div>;

  const sidebarTranslate = lang === 'ar' 
    ? (isSidebarOpen ? 'translate-x-0' : 'translate-x-full') 
    : (isSidebarOpen ? 'translate-x-0' : '-translate-x-full');

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-tajawal" dir={dir}>
      
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 z-30 w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${sidebarTranslate}`}>
        <div className="p-6 border-b border-gray-100 flex justify-between items-center text-center">
          <div className="mx-auto">
            <h2 className="text-2xl font-black text-ukra-navy tracking-widest font-num">UKRA <span className="text-ukra-gold">OPS</span></h2>
          </div>
        </div>
        
        {/* User Profile */}
        <div className="p-6 text-center border-b border-gray-100">
           <div className="w-20 h-20 mx-auto bg-gray-200 rounded-full mb-3 overflow-hidden border-4 border-white shadow-sm">
              <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.name}&background=1a2a3a&color=c5a059`} alt="User" />
           </div>
           <h3 className="font-bold text-ukra-navy">{user.name}</h3>
           <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">{user.role}</span>
        </div>

        <nav className="flex-grow p-4 space-y-2 mt-2">
          
          {isAdmin && (
            <button
              onClick={() => { setActiveTab('overview'); setSidebarOpen(false); }}
              className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-ukra-navy text-white shadow-lg shadow-ukra-navy/20' : 'hover:bg-gray-50 text-gray-500'}`}
            >
              <LayoutDashboard className="w-5 h-5 rtl:ml-3 ltr:mr-3" /> {t('dash_overview')}
            </button>
          )}

          <button
            onClick={() => { setActiveTab('orders'); setSidebarOpen(false); }}
            className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${activeTab === 'orders' ? 'bg-ukra-navy text-white shadow-lg shadow-ukra-navy/20' : 'hover:bg-gray-50 text-gray-500'}`}
          >
            <FileText className="w-5 h-5 rtl:ml-3 ltr:mr-3" /> 
            {isClient ? 'My Requests' : t('dash_orders')}
          </button>
          
          {(user.role === UserRole.OWNER || user.role === UserRole.MANAGER) && (
            <button 
              onClick={() => { setActiveTab('staff'); setSidebarOpen(false); }}
              className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${activeTab === 'staff' ? 'bg-ukra-navy text-white shadow-lg shadow-ukra-navy/20' : 'hover:bg-gray-50 text-gray-500'}`}
            >
              <Users className="w-5 h-5 rtl:ml-3 ltr:mr-3" /> {t('dash_staff')}
            </button>
          )}
        </nav>

        <div className="p-4">
          <button onClick={logout} className="flex items-center justify-center w-full px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition font-bold border border-transparent hover:border-red-100">
            <LogOut className="w-5 h-5 rtl:ml-2 ltr:mr-2" /> {t('dash_logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-100 px-6 py-4 flex justify-between items-center">
           <div className="flex items-center gap-4">
              <button className="md:hidden" onClick={() => setSidebarOpen(true)}>
                 <Settings className="w-6 h-6 text-ukra-navy" />
              </button>
              <div>
                 <h1 className="font-bold text-xl text-ukra-navy font-num">
                    {new Date().toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                 </h1>
                 <p className="text-xs text-green-600 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Operational System Online
                 </p>
              </div>
           </div>
           
           <div className="flex gap-4">
              <button onClick={toggleLang} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition">
                 <Globe className="w-5 h-5 text-gray-600" />
              </button>
              <button className="w-10 h-10 rounded-full bg-ukra-gold/10 flex items-center justify-center hover:bg-ukra-gold/20 transition relative">
                 <Bell className="w-5 h-5 text-ukra-gold" />
                 <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
              </button>
           </div>
        </header>

        <div className="p-6 max-w-7xl mx-auto">
           {activeTab === 'overview' && isAdmin ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                 {/* Top Row: Tasks & Leaderboard */}
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                       <DailyTasks />
                    </div>
                    <div className="lg:col-span-1">
                       <Leaderboard />
                    </div>
                 </div>

                 {/* Middle Row: Facility */}
                 <FacilityTracker />

                 {/* Bottom Row: Analytics */}
                 <AnalyticsCharts />
              </div>
           ) : activeTab === 'staff' ? (
              <StaffManagement />
           ) : (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-gray-400">
                 <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
                 <h2 className="text-xl font-bold">Orders Management</h2>
                 <p>Orders table component goes here (Migrated from original dashboard).</p>
              </div>
           )}
        </div>
      </main>
    </div>
  );
};
