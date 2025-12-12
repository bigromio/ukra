import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchClientOrders } from '../services/apiService';
import { ClientOrder } from '../types';
import { FileText, Clock, CheckCircle, Loader2, Folder, User } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const ClientOrders = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [orders, setOrders] = useState<ClientOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.email) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    setLoading(true);
    const res = await fetchClientOrders(user?.email || '');
    if (res.success) {
      setOrders(res.orders);
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Completed</span>;
      case 'In Progress': return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center gap-1"><Loader2 className="w-3 h-3" /> In Progress</span>;
      default: return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20 px-4 font-cairo">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="bg-ukra-navy text-white rounded-2xl p-6 mb-6 shadow-lg flex justify-between items-center">
           <div>
             <h1 className="text-2xl font-bold">My Requests</h1>
             <p className="text-gray-300 text-sm mt-1">Welcome, {user?.name}</p>
           </div>
           <button onClick={logout} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition">
             <User className="w-6 h-6" />
           </button>
        </div>

        {/* List */}
        <div className="space-y-4">
          {loading ? (
             <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-ukra-gold" /></div>
          ) : orders.length > 0 ? (
            orders.map((order) => (
              <div key={order.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-3">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-ukra-navy">
                         <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">{order.type} Request</h3>
                        <span className="text-xs text-gray-500">{order.id} • {order.date}</span>
                      </div>
                   </div>
                   {getStatusBadge(order.status)}
                </div>
                
                <p className="text-sm text-gray-600 mb-4 ml-13 pl-13">
                  {order.details}
                </p>

                <div className="flex gap-2">
                  <button className="flex-1 py-2 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50">
                    View Details
                  </button>
                  <button className="flex-1 py-2 rounded-lg bg-ukra-gold text-white text-sm font-bold hover:bg-yellow-600 flex items-center justify-center gap-2">
                    <Folder className="w-4 h-4" /> Files
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-400">
               <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
               <p>No active requests found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};