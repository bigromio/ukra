import React from 'react';
import { LayoutDashboard, ClipboardList, ShoppingBag, ShoppingCart, Briefcase, Factory, Megaphone, Users, Settings, LogOut, Wallet } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) => {
  const { user, logout } = useAuth();

  const allowedTabs = user?.allowed_tabs || ['analytics', 'tasks'];
  const isOwner = user?.role?.toLowerCase() === 'owner';

  const menuItems = [
    { id: 'analytics', label: 'التحليلات الشاملة', icon: LayoutDashboard },
    { id: 'tasks', label: 'المهام اليومية', icon: ClipboardList },
    { id: 'ecommerce', label: 'إدارة المتجر والمنتجات', icon: ShoppingBag },
    { id: 'orders', label: 'الطلبات والمواعيد', icon: ShoppingCart },
    { id: 'projects', label: 'المشاريع والمقاولات', icon: Briefcase },
    { id: 'factory_manager', label: 'إدارة المصنع', icon: Factory },
    { id: 'accountant', label: 'المالية والعهد', icon: Wallet },
    { id: 'marketing', label: 'حملات التسويق', icon: Megaphone },
    { id: 'staff', label: 'إدارة الموظفين', icon: Users },
    { id: 'settings', label: 'إعدادات النظام', icon: Settings },
  ];

  const filteredMenu = isOwner ? menuItems : menuItems.filter(item => allowedTabs.includes(item.id));

  return (
    <div className="w-64 bg-ukra-navy h-full text-white flex flex-col shadow-xl">
      <div className="p-6 text-center border-b border-white/10">
        <h1 className="text-2xl font-bold text-ukra-gold tracking-widest">UKRA</h1>
        <p className="text-[10px] text-gray-400 mt-1 uppercase">Control Panel</p>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
        {filteredMenu.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
              ${activeTab === item.id 
                ? 'bg-ukra-gold text-white shadow-lg shadow-ukra-gold/20' 
                : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}
          >
            <item.icon size={20} />
            <span className="font-bold text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all">
          <LogOut size={20} />
          <span className="font-bold text-sm">تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );
};