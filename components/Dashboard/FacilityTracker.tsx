
import React, { useEffect, useState } from 'react';
import { fetchInventory } from '../../services/apiService';
import { InventoryItem } from '../../types';
import { Settings, AlertTriangle, CheckCircle, Package } from 'lucide-react';

export const FacilityTracker = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    const data = await fetchInventory();
    setItems(data);
  };

  const machines = items.filter(i => i.type === 'machine');
  const materials = items.filter(i => i.type === 'material');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      
      {/* Machines Status */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="font-num font-bold text-ukra-navy mb-4 flex items-center gap-2">
           <Settings className="w-5 h-5 text-ukra-gold" /> حالة المعدات
        </h3>
        <div className="space-y-4">
           {machines.map(m => (
             <div key={m.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                   <p className="font-bold text-sm text-gray-800">{m.item_name}</p>
                   <p className="text-xs text-gray-500 font-num">صيانة: {m.next_service_date || 'N/A'}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                   m.status === 'active' ? 'bg-green-100 text-green-700' :
                   m.status === 'warning' ? 'bg-yellow-100 text-yellow-700' : 
                   'bg-red-100 text-red-700'
                }`}>
                   {m.status.toUpperCase()}
                </span>
             </div>
           ))}
           {machines.length === 0 && <p className="text-center text-sm text-gray-400">No machines tracked.</p>}
        </div>
      </div>

      {/* Materials Stock */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="font-num font-bold text-ukra-navy mb-4 flex items-center gap-2">
           <Package className="w-5 h-5 text-ukra-gold" /> المخزون (المواد الخام)
        </h3>
        <div className="space-y-4">
           {materials.map(m => {
             const percentage = Math.min((m.quantity / (m.threshold * 2)) * 100, 100);
             const isLow = m.quantity <= m.threshold;
             
             return (
               <div key={m.id}>
                  <div className="flex justify-between text-sm mb-1">
                     <span className="font-bold text-gray-700">{m.item_name}</span>
                     <span className={`font-num ${isLow ? 'text-red-500 font-bold' : 'text-gray-600'}`}>
                        {m.quantity} {m.unit || 'unit'}
                     </span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                     <div 
                        className={`h-full rounded-full ${isLow ? 'bg-red-500' : 'bg-ukra-navy'}`} 
                        style={{width: `${percentage}%`}}
                     />
                  </div>
                  {isLow && <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> مخزون منخفض</p>}
               </div>
             )
           })}
           {materials.length === 0 && <p className="text-center text-sm text-gray-400">No materials tracked.</p>}
        </div>
      </div>

    </div>
  );
};
