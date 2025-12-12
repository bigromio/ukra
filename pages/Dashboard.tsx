import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { UserRole, DashboardStats, OrderData } from '../types';
import { fetchDashboardData } from '../services/apiService';
import { MOCK_STATS, MOCK_ORDERS } from '../constants';
import { OrderDetailsModal } from '../components/Dashboard/OrderDetailsModal';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { LayoutDashboard, LogOut, FileText, Settings, Users, Bell, Globe, Eye, Cog } from 'lucide-react';

const COLORS = ['#c5a059', '#1a2a3a', '#9ca3af'];

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const { t, dir, toggleLang, lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<'overview' | 'orders'>('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Mobile Sidebar State
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Modal State
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Simulate fetching data
    const loadData = async () => {
      setLoading(true);
      await fetchDashboardData(); 
      // Fallback to Mock Data because we don't have a real backend
      setStats(MOCK_STATS);
      setOrders(MOCK_ORDERS);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleViewDetails = (order: OrderData) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleNotifyClient = (id: string, newStatus: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus as any } : o));
    if (selectedOrder && selectedOrder.id === id) {
      setSelectedOrder(prev => prev ? { ...prev, status: newStatus as any } : null);
    }
    const clientName = orders.find(o => o.id === id)?.client || 'Client';
    alert(`Notification sent to ${clientName}:\n"Your order ${id} status has been updated to: ${newStatus}"`);
    setIsModalOpen(false);
  };

  if (!user) return <div>Access Denied</div>;

  const pieData = stats ? [
    { name: t('nav_supplies'), value: stats.furnitureCount },
    { name: t('nav_design'), value: stats.designCount },
    { name: t('feat_feasibility'), value: stats.feasibilityCount },
  ] : [];

  // Determine Sidebar Translation for Mobile
  const sidebarTranslate = lang === 'ar' 
    ? (isSidebarOpen ? 'translate-x-0' : 'translate-x-full') 
    : (isSidebarOpen ? 'translate-x-0' : '-translate-x-full');

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-cairo" dir={dir}>
      
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 z-30 w-64 bg-ukra-navy text-white flex-shrink-0 flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${sidebarTranslate}`}>
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-ukra-gold">UKRA Admin</h2>
            <p className="text-sm text-gray-400 mt-1">{t('dash_welcome')}, {user.name.split(' ')[0]}</p>
          </div>
          {/* Close button for mobile only inside sidebar */}
          <button className="md:hidden text-gray-400" onClick={() => setSidebarOpen(false)}>
            <LogOut className="w-5 h-5 rotate-180" />
          </button>
        </div>
        <nav className="flex-grow p-4 space-y-2">
          <button
            onClick={() => { setActiveTab('overview'); setSidebarOpen(false); }}
            className={`flex items-center w-full px-4 py-3 rounded-md transition-colors ${activeTab === 'overview' ? 'bg-ukra-gold text-ukra-navy font-bold' : 'hover:bg-gray-700 text-gray-300'}`}
          >
            <LayoutDashboard className="w-5 h-5 rtl:ml-3 ltr:mr-3" /> {t('dash_overview')}
          </button>
          <button
            onClick={() => { setActiveTab('orders'); setSidebarOpen(false); }}
            className={`flex items-center w-full px-4 py-3 rounded-md transition-colors ${activeTab === 'orders' ? 'bg-ukra-gold text-ukra-navy font-bold' : 'hover:bg-gray-700 text-gray-300'}`}
          >
            <FileText className="w-5 h-5 rtl:ml-3 ltr:mr-3" /> {t('dash_orders')}
          </button>
          
          {user.role === UserRole.OWNER && (
            <>
            <button className="flex items-center w-full px-4 py-3 rounded-md hover:bg-gray-700 text-gray-300">
              <Users className="w-5 h-5 rtl:ml-3 ltr:mr-3" /> {t('dash_staff')}
            </button>
            <button className="flex items-center w-full px-4 py-3 rounded-md hover:bg-gray-700 text-gray-300">
              <Settings className="w-5 h-5 rtl:ml-3 ltr:mr-3" /> {t('dash_settings')}
            </button>
            </>
          )}
        </nav>
        <div className="p-4 border-t border-gray-700">
          <button onClick={logout} className="flex items-center w-full px-4 py-2 text-red-400 hover:text-red-300">
            <LogOut className="w-5 h-5 rtl:ml-3 ltr:mr-3" /> {t('dash_logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm p-4 md:p-6 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-4">
             {/* Gear Icon Trigger for Mobile */}
             <button 
               onClick={() => setSidebarOpen(true)}
               className="md:hidden text-ukra-navy hover:text-ukra-gold p-1"
             >
               <Cog className="w-6 h-6" />
             </button>

             <h1 className="text-xl md:text-2xl font-bold text-gray-800 capitalize">
                {activeTab === 'overview' ? t('dash_overview') : t('dash_orders')}
             </h1>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
             <button 
               onClick={toggleLang}
               className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-sm font-bold text-ukra-navy transition"
             >
               <Globe className="w-4 h-4" />
               {lang === 'ar' ? 'EN' : 'عربي'}
             </button>
             <div className="relative">
               <Bell className="w-6 h-6 text-gray-400 cursor-pointer" />
               <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
             </div>
          </div>
        </header>

        <div className="p-4 md:p-6">
          {loading ? (
             <div className="flex justify-center items-center h-64"><div className="animate-spin h-8 w-8 border-4 border-ukra-gold border-t-transparent rounded-full"></div></div>
          ) : activeTab === 'overview' ? (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 rtl:border-l-0 rtl:border-r-4 border-ukra-gold">
                  <p className="text-sm text-gray-500">{t('dash_total_req')}</p>
                  <p className="text-3xl font-bold text-ukra-navy">{stats?.totalRequests}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 rtl:border-l-0 rtl:border-r-4 border-blue-500">
                  <p className="text-sm text-gray-500">{t('nav_supplies')}</p>
                  <p className="text-3xl font-bold text-ukra-navy">{stats?.furnitureCount}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 rtl:border-l-0 rtl:border-r-4 border-purple-500">
                  <p className="text-sm text-gray-500">{t('nav_design')}</p>
                  <p className="text-3xl font-bold text-ukra-navy">{stats?.designCount}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 rtl:border-l-0 rtl:border-r-4 border-green-500">
                  <p className="text-sm text-gray-500">{t('feat_feasibility')}</p>
                  <p className="text-3xl font-bold text-ukra-navy">{stats?.feasibilityCount}</p>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold mb-4 text-gray-700">{t('dash_monthly')}</h3>
                  <div className="h-80" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats?.monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="requests" fill="#c5a059" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold mb-4 text-gray-700">{t('dash_dist')}</h3>
                  <div className="h-80" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Orders Table */
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('col_id')}</th>
                      <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('col_type')}</th>
                      <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('col_client')}</th>
                      <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('col_date')}</th>
                      <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('col_amount')}</th>
                      <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('col_status')}</th>
                      <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('col_action')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.client}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.amount}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${order.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                              order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-blue-100 text-blue-800'}`}>
                            {t(`status_${order.status === 'In Progress' ? 'progress' : order.status.toLowerCase()}` as any) || order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={() => handleViewDetails(order)}
                            className="flex items-center gap-1 text-ukra-gold hover:text-yellow-600 font-bold transition"
                          >
                            <Eye className="w-4 h-4" /> View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Detail Modal */}
      <OrderDetailsModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        order={selectedOrder}
        onNotify={handleNotifyClient}
      />
    </div>
  );
};