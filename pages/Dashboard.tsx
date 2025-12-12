import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole, DashboardStats, OrderData } from '../types';
import { fetchDashboardData } from '../services/apiService';
import { MOCK_STATS, MOCK_ORDERS } from '../constants';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { LayoutDashboard, LogOut, FileText, Settings, Users, Bell } from 'lucide-react';

const COLORS = ['#c5a059', '#1a2a3a', '#9ca3af'];

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'orders'>('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (!user) return <div>Access Denied</div>;

  const pieData = stats ? [
    { name: 'Furniture', value: stats.furnitureCount },
    { name: 'Design', value: stats.designCount },
    { name: 'Feasibility', value: stats.feasibilityCount },
  ] : [];

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-ukra-navy text-white flex-shrink-0 hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-ukra-gold">UKRA Admin</h2>
          <p className="text-sm text-gray-400 mt-1">Welcome, {user.name.split(' ')[0]}</p>
        </div>
        <nav className="flex-grow p-4 space-y-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center w-full px-4 py-3 rounded-md transition-colors ${activeTab === 'overview' ? 'bg-ukra-gold text-ukra-navy font-bold' : 'hover:bg-gray-700 text-gray-300'}`}
          >
            <LayoutDashboard className="w-5 h-5 mr-3" /> Overview
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center w-full px-4 py-3 rounded-md transition-colors ${activeTab === 'orders' ? 'bg-ukra-gold text-ukra-navy font-bold' : 'hover:bg-gray-700 text-gray-300'}`}
          >
            <FileText className="w-5 h-5 mr-3" /> Orders
          </button>
          
          {user.role === UserRole.OWNER && (
            <>
            <button className="flex items-center w-full px-4 py-3 rounded-md hover:bg-gray-700 text-gray-300">
              <Users className="w-5 h-5 mr-3" /> Staff
            </button>
            <button className="flex items-center w-full px-4 py-3 rounded-md hover:bg-gray-700 text-gray-300">
              <Settings className="w-5 h-5 mr-3" /> Settings
            </button>
            </>
          )}
        </nav>
        <div className="p-4 border-t border-gray-700">
          <button onClick={logout} className="flex items-center w-full px-4 py-2 text-red-400 hover:text-red-300">
            <LogOut className="w-5 h-5 mr-3" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm p-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800 capitalize">{activeTab}</h1>
          <div className="relative">
             <Bell className="w-6 h-6 text-gray-400 cursor-pointer" />
             <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
          </div>
        </header>

        <div className="p-6">
          {loading ? (
             <div className="flex justify-center items-center h-64">Loading...</div>
          ) : activeTab === 'overview' ? (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-ukra-gold">
                  <p className="text-sm text-gray-500">Total Requests</p>
                  <p className="text-3xl font-bold text-ukra-navy">{stats?.totalRequests}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                  <p className="text-sm text-gray-500">Furniture</p>
                  <p className="text-3xl font-bold text-ukra-navy">{stats?.furnitureCount}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-purple-500">
                  <p className="text-sm text-gray-500">Design</p>
                  <p className="text-3xl font-bold text-ukra-navy">{stats?.designCount}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
                  <p className="text-sm text-gray-500">Feasibility</p>
                  <p className="text-3xl font-bold text-ukra-navy">{stats?.feasibilityCount}</p>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold mb-4 text-gray-700">Monthly Requests</h3>
                  <div className="h-80">
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
                  <h3 className="text-lg font-semibold mb-4 text-gray-700">Request Distribution</h3>
                  <div className="h-80">
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      {user.role !== UserRole.EMPLOYEE && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order.id}>
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
                            {order.status}
                          </span>
                        </td>
                        {user.role !== UserRole.EMPLOYEE && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-ukra-gold hover:text-yellow-600">Edit</button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};