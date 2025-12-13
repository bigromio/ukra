import React, { useState } from 'react';
import { X, Folder, Send, Phone, Mail, MapPin, Calendar, DollarSign, Box, UserCheck } from 'lucide-react';
import { OrderData } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderData | null;
  onNotify: (id: string, status: string) => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ isOpen, onClose, order, onNotify }) => {
  const [newStatus, setNewStatus] = useState<string>('');
  const { isClient, isAdmin } = useAuth();

  if (!isOpen || !order) return null;

  const handleStatusUpdate = () => {
    if (newStatus) {
      onNotify(order.id, newStatus);
      setNewStatus('');
    } else {
      alert("Please select a status first.");
    }
  };

  const openDrive = () => {
    if (order.driveFolderUrl) {
      window.open(order.driveFolderUrl, '_blank');
    } else {
      alert(isClient ? "Project files are not ready yet." : "No Google Drive folder linked.");
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
      <div className="absolute inset-0 bg-gray-900 bg-opacity-70 transition-opacity" onClick={onClose}></div>

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
            {/* Show Client Name only to Admins, for Clients show "My Project" */}
            <h2 className="text-2xl font-bold">{isAdmin ? order.client : order.details || 'My Project'}</h2>
            <p className="text-gray-400 text-sm">{order.type} Request</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 className="text-sm font-bold text-ukra-navy uppercase mb-3 flex items-center gap-2">
                <Box className="w-4 h-4 text-ukra-gold" /> Details
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex justify-between"><span>Date:</span> <span className="font-medium text-gray-900">{order.date}</span></li>
                {order.location && <li className="flex justify-between"><span>Location:</span> <span className="font-medium text-gray-900">{order.location}</span></li>}
                {order.areaSize && <li className="flex justify-between"><span>Area:</span> <span className="font-medium text-gray-900">{order.areaSize} sqm</span></li>}
              </ul>
            </div>

            {/* Financials - Hide sensitive internal budget from client if needed, or show Quote */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 className="text-sm font-bold text-ukra-navy uppercase mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-ukra-gold" /> Quote
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex justify-between"><span>Total:</span> <span className="font-medium text-green-700 font-bold">{order.amount || 'Pending'}</span></li>
                {isAdmin && <li className="flex justify-between"><span>Client Budget:</span> <span className="font-medium text-gray-900">{order.budget || 'N/A'}</span></li>}
              </ul>
            </div>

            {/* Contact - Only for Admin */}
            {isAdmin && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <h3 className="text-sm font-bold text-ukra-navy uppercase mb-3 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-ukra-gold" /> Client Info
                </h3>
                <ul className="space-y-3 text-sm">
                  <li><a href={`tel:${order.phone}`} className="flex items-center gap-2 hover:text-ukra-navy"><Phone className="w-4 h-4" /> {order.phone}</a></li>
                  <li><a href={`mailto:${order.email}`} className="flex items-center gap-2 hover:text-ukra-navy"><Mail className="w-4 h-4" /> {order.email}</a></li>
                </ul>
              </div>
            )}
            
            {/* Support - For Client */}
            {isClient && (
               <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex flex-col justify-center items-center text-center">
                  <UserCheck className="w-8 h-8 text-ukra-gold mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Need help with this order?</p>
                  <a href="mailto:support@ukra.sa" className="text-ukra-navy font-bold text-sm underline">Contact Support</a>
               </div>
            )}
          </div>

          <hr className="border-gray-100" />

          {/* Details Section */}
          <div>
             <h3 className="text-lg font-bold text-ukra-navy mb-4">Project Specifications</h3>
             
             {/* Dynamic Content based on Type */}
             {order.type === 'Design' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   <div className="p-3 bg-gray-50 rounded border"><span className="text-xs text-gray-500 block">Scope</span>{order.scope}</div>
                   <div className="p-3 bg-gray-50 rounded border"><span className="text-xs text-gray-500 block">Style</span>{order.style}</div>
                   <div className="p-3 bg-gray-50 rounded border"><span className="text-xs text-gray-500 block">Colors</span>{order.colors}</div>
                   <div className="p-3 bg-gray-50 rounded border"><span className="text-xs text-gray-500 block">Project</span>{order.projectType}</div>
                </div>
             )}

             {/* Client Notes */}
             {order.notes && (
                <div className="mt-4 bg-yellow-50 p-4 rounded text-sm text-yellow-800 italic">
                   <span className="font-bold not-italic block mb-1">Notes:</span> {order.notes}
                </div>
             )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 p-6 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
          
          <button 
            onClick={openDrive}
            className={`flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition w-full md:w-auto justify-center ${!order.driveFolderUrl && 'opacity-50 cursor-not-allowed'}`}
          >
            <Folder className="w-5 h-5 text-ukra-gold" />
            {isClient ? 'View Project Files' : 'Open Drive Folder'}
          </button>

          {/* Admin Only Actions */}
          {isAdmin && (
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
                 Update
               </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};