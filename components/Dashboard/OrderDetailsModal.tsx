import React, { useState } from 'react';
import { X, Folder, Send, Phone, Mail, MapPin, Calendar, DollarSign, Box } from 'lucide-react';
import { OrderData } from '../../types';

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderData | null;
  onNotify: (id: string, status: string) => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ isOpen, onClose, order, onNotify }) => {
  const [newStatus, setNewStatus] = useState<string>('');

  if (!isOpen || !order) return null;

  const handleStatusUpdate = () => {
    if (newStatus) {
      onNotify(order.id, newStatus);
      setNewStatus(''); // Reset
    } else {
      alert("Please select a status first.");
    }
  };

  const openDrive = () => {
    if (order.driveFolderUrl) {
      window.open(order.driveFolderUrl, '_blank');
    } else {
      // Toast would be better, but using alert for simplicity as per instructions
      alert("No Google Drive folder linked to this order.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-gray-900 bg-opacity-70 transition-opacity" onClick={onClose}></div>

      {/* Modal Content */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-ukra-navy p-6 flex justify-between items-start text-white">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-ukra-gold font-mono text-sm tracking-widest uppercase">{order.id}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>
            <h2 className="text-2xl font-bold">{order.client}</h2>
            <p className="text-gray-400 text-sm">{order.type} Request</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Top Grid: Info & Contact */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Project Info */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 className="text-sm font-bold text-ukra-navy uppercase mb-3 flex items-center gap-2">
                <Box className="w-4 h-4 text-ukra-gold" /> Project Details
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex justify-between"><span>Date:</span> <span className="font-medium text-gray-900">{order.date}</span></li>
                <li className="flex justify-between"><span>Location:</span> <span className="font-medium text-gray-900">{order.location || 'N/A'}</span></li>
                <li className="flex justify-between"><span>Area:</span> <span className="font-medium text-gray-900">{order.areaSize ? `${order.areaSize} sqm` : 'N/A'}</span></li>
                {order.projectType && <li className="flex justify-between"><span>Type:</span> <span className="font-medium text-gray-900">{order.projectType}</span></li>}
              </ul>
            </div>

            {/* Financials */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 className="text-sm font-bold text-ukra-navy uppercase mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-ukra-gold" /> Financials
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex justify-between"><span>Est. Amount:</span> <span className="font-medium text-gray-900">{order.amount || 'Pending Quote'}</span></li>
                <li className="flex justify-between"><span>Client Budget:</span> <span className="font-medium text-gray-900">{order.budget || 'N/A'}</span></li>
              </ul>
            </div>

            {/* Contact */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 className="text-sm font-bold text-ukra-navy uppercase mb-3 flex items-center gap-2">
                <Phone className="w-4 h-4 text-ukra-gold" /> Contact Client
              </h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href={`tel:${order.phone}`} className="flex items-center gap-2 text-gray-600 hover:text-ukra-navy transition">
                    <Phone className="w-4 h-4" /> {order.phone || 'No Phone'}
                  </a>
                </li>
                <li>
                  <a href={`mailto:${order.email}`} className="flex items-center gap-2 text-gray-600 hover:text-ukra-navy transition">
                    <Mail className="w-4 h-4" /> {order.email || 'No Email'}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Specifics based on Type */}
          <div>
            <h3 className="text-lg font-bold text-ukra-navy mb-4">Request Specifics</h3>
            
            {order.type === 'Furniture' && order.items && (
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specs</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {order.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{item.specs}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {order.type === 'Design' && (
              <div className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 border rounded-lg">
                      <span className="block text-xs text-gray-500 uppercase">Scope</span>
                      <span className="font-medium text-ukra-navy">{order.scope || 'N/A'}</span>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <span className="block text-xs text-gray-500 uppercase">Style</span>
                      <span className="font-medium text-ukra-navy">{order.style || 'N/A'}</span>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <span className="block text-xs text-gray-500 uppercase">Colors</span>
                      <span className="font-medium text-ukra-navy">{order.colors || 'N/A'}</span>
                    </div>
                 </div>
                 
                 {/* Images Grid */}
                 {order.images && order.images.length > 0 && (
                   <div className="mt-4">
                     <h4 className="text-sm font-bold text-gray-700 mb-2">Reference Images</h4>
                     <div className="flex gap-2 overflow-x-auto pb-2">
                        {order.images.map((img, i) => (
                          <img key={i} src={img} alt="ref" className="h-24 w-24 object-cover rounded-md border border-gray-200 shadow-sm" />
                        ))}
                     </div>
                   </div>
                 )}
              </div>
            )}

            {order.type === 'Feasibility' && (
               <div className="bg-blue-50 p-4 rounded-lg text-blue-800 text-sm">
                 <p><strong>Project Goal:</strong> Feasibility study for a {order.projectType} project in {order.location}.</p>
                 <p className="mt-1">Please review the budget of {order.budget} against the area size of {order.areaSize} sqm.</p>
               </div>
            )}
            
            {order.notes && (
              <div className="mt-6 bg-yellow-50 p-4 rounded-lg text-yellow-800 text-sm italic">
                <span className="font-bold not-italic">Client Notes:</span> "{order.notes}"
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 p-6 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
          
          <button 
            onClick={openDrive}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 hover:border-gray-400 transition w-full md:w-auto justify-center"
          >
            <Folder className="w-5 h-5 text-ukra-gold" />
            Open Drive Folder
          </button>

          <div className="flex items-center gap-2 w-full md:w-auto">
             <select 
               value={newStatus} 
               onChange={(e) => setNewStatus(e.target.value)}
               className="p-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-ukra-gold focus:border-ukra-gold flex-grow"
             >
               <option value="" disabled>Change Status...</option>
               <option value="In Progress">In Progress</option>
               <option value="Completed">Completed</option>
               <option value="Pending">Pending</option>
             </select>
             <button 
               onClick={handleStatusUpdate}
               className="flex items-center gap-2 px-5 py-2.5 bg-ukra-navy text-white rounded-lg font-medium hover:bg-opacity-90 transition shadow-lg w-auto whitespace-nowrap"
             >
               <Send className="w-4 h-4" />
               Update & Notify
             </button>
          </div>

        </div>
      </div>
    </div>
  );
};