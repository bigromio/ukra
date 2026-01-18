import React, { useState, useEffect } from 'react';
import { 
  X, Send, Phone, Mail, Box, DollarSign, UserCheck, 
  FileText, Trash2, Upload, ExternalLink, Loader2, Eye, MessageSquare, Clock
} from 'lucide-react';
import { OrderData, DriveFile, OrderLog, UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { fetchOrderDetails, uploadOrderFile, deleteOrderFile, addOrderNote } from '../../services/apiService';

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderData | null;
  onNotify: (id: string, status: string) => void;
  initialTab?: 'details' | 'files' | 'notes'; // New Prop
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  order, 
  onNotify,
  initialTab = 'details' // Default value
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'files' | 'notes'>('details');
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [logs, setLogs] = useState<OrderLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [noteInput, setNoteInput] = useState('');
  const [previewFile, setPreviewFile] = useState<DriveFile | null>(null);

  const { user } = useAuth();
  
  // Permissions Logic
  const canUpload = true; 
  const canDelete = user?.role === UserRole.OWNER || user?.role === UserRole.MANAGER;
  const canAddNote = true;

  useEffect(() => {
    if (isOpen && order) {
      // Respect the initialTab prop when modal opens
      setActiveTab(initialTab);
      if (order.driveFolderUrl) {
        loadDetails();
      }
    }
  }, [isOpen, order, initialTab]); // Added initialTab to dependency array

  const loadDetails = async () => {
    if (!order?.driveFolderUrl) return;
    setLoading(true);
    const res = await fetchOrderDetails(order.driveFolderUrl, order.id);
    if (res.success) {
      setFiles(res.data.files);
      setLogs(res.data.logs.reverse()); // Show newest first
    }
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !order?.driveFolderUrl || !user) return;

    setUploading(true);
    const clientEmailToNotify = (user.email !== order.email) ? order.email : undefined;

    const res = await uploadOrderFile(
      order.driveFolderUrl, 
      file, 
      order.id, 
      clientEmailToNotify, 
      user.name
    );
    setUploading(false);

    if (res.success) {
      loadDetails(); 
    } else {
      alert("Upload failed: " + (res.message || "Unknown error"));
    }
  };

  const handleFileDelete = async (fileId: string) => {
    if (!canDelete) return;
    if (!window.confirm("Are you sure you want to delete this file?")) return;
    
    setDeletingId(fileId);
    try {
      const res = await deleteOrderFile(fileId, order?.id || '', user?.name || 'Admin');
      if (res.success) {
        setFiles(prev => prev.filter(f => f.id !== fileId));
      } else {
        // IMPROVED: Show specific server error
        alert("Delete failed: " + (res.message || "Server returned error"));
      }
    } catch (e: any) {
      alert("Connection error: " + e.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSendNote = async () => {
    if (!noteInput.trim() || !order || !user) return;
    setUploading(true);
    
    const clientEmailToNotify = (user.email !== order.email) ? order.email : undefined;
    
    const res = await addOrderNote(order.id, noteInput, user.name, clientEmailToNotify);
    setUploading(false);
    
    if (res.success) {
      setNoteInput('');
      loadDetails();
    } else {
      alert("Failed to send note: " + (res.message || "Unknown error"));
    }
  };

  const handleStatusUpdate = () => {
    if (newStatus && order) {
      onNotify(order.id, newStatus);
      setNewStatus('');
    }
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900 bg-opacity-70 transition-opacity" onClick={onClose}></div>

      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-ukra-navy p-6 flex justify-between items-start text-white flex-shrink-0">
          <div>
             <div className="flex items-center gap-3 mb-2">
              <span className="text-ukra-gold font-mono text-sm tracking-widest uppercase">{order.id}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${order.status === 'Completed' ? 'bg-green-500' : 'bg-blue-500'}`}>
                {order.status}
              </span>
            </div>
            <h2 className="text-2xl font-bold">{order.client || order.type}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-gray-50">
          <button onClick={() => setActiveTab('details')} className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider ${activeTab === 'details' ? 'bg-white text-ukra-navy border-t-2 border-ukra-gold' : 'text-gray-500 hover:bg-gray-100'}`}>
            Details
          </button>
          <button onClick={() => setActiveTab('files')} className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider ${activeTab === 'files' ? 'bg-white text-ukra-navy border-t-2 border-ukra-gold' : 'text-gray-500 hover:bg-gray-100'}`}>
            Files ({files.length})
          </button>
          <button onClick={() => setActiveTab('notes')} className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider ${activeTab === 'notes' ? 'bg-white text-ukra-navy border-t-2 border-ukra-gold' : 'text-gray-500 hover:bg-gray-100'}`}>
            Notes & Activity
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-white min-h-[400px]">
          
          {/* TAB 1: DETAILS */}
          {activeTab === 'details' && (
             <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <h3 className="text-sm font-bold text-ukra-navy uppercase mb-3 flex items-center gap-2">
                      <Box className="w-4 h-4 text-ukra-gold" /> Specs
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex justify-between"><span>Date:</span> <span className="font-medium text-gray-900">{order.date}</span></li>
                      {order.location && <li className="flex justify-between"><span>Location:</span> <span className="font-medium text-gray-900">{order.location}</span></li>}
                      {order.areaSize && <li className="flex justify-between"><span>Area:</span> <span className="font-medium text-gray-900">{order.areaSize} sqm</span></li>}
                    </ul>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <h3 className="text-sm font-bold text-ukra-navy uppercase mb-3 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-ukra-gold" /> Financial
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex justify-between"><span>Total:</span> <span className="font-medium text-green-700 font-bold">{order.amount || 'Pending'}</span></li>
                      <li className="flex justify-between"><span>Budget:</span> <span className="font-medium text-gray-900">{order.budget || 'N/A'}</span></li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <h3 className="text-sm font-bold text-ukra-navy uppercase mb-3 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-ukra-gold" /> Contact
                      </h3>
                      <ul className="space-y-3 text-sm">
                        <li><a href={`tel:${order.phone}`} className="flex items-center gap-2 hover:text-ukra-navy"><Phone className="w-4 h-4" /> {order.phone || 'N/A'}</a></li>
                        <li><a href={`mailto:${order.email}`} className="flex items-center gap-2 hover:text-ukra-navy"><Mail className="w-4 h-4" /> {order.email || 'N/A'}</a></li>
                      </ul>
                  </div>
                </div>

                {order.type === 'Design' && (
                  <div>
                    <h3 className="text-lg font-bold text-ukra-navy mb-4">Design Specs</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                       <div className="p-3 bg-gray-50 rounded border"><span className="text-xs text-gray-500 block">Scope</span>{order.scope}</div>
                       <div className="p-3 bg-gray-50 rounded border"><span className="text-xs text-gray-500 block">Style</span>{order.style}</div>
                       <div className="p-3 bg-gray-50 rounded border"><span className="text-xs text-gray-500 block">Colors</span>{order.colors}</div>
                       <div className="p-3 bg-gray-50 rounded border"><span className="text-xs text-gray-500 block">Type</span>{order.projectType}</div>
                    </div>
                  </div>
                )}
             </div>
          )}

          {/* TAB 2: FILES */}
          {activeTab === 'files' && (
            <div className="h-full flex flex-col">
              {!order.driveFolderUrl ? (
                <div className="text-center py-20 text-gray-400">
                  <Box className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>No Folder Linked. Contact Admin to initialize project folder.</p>
                </div>
              ) : (
                <>
                  {/* Upload Area */}
                  {canUpload && (
                    <div className="mb-6">
                      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
                         <div className="flex flex-col items-center justify-center">
                             {uploading ? (
                               <Loader2 className="w-6 h-6 text-ukra-gold animate-spin" />
                             ) : (
                               <div className="flex items-center gap-2 text-gray-500">
                                 <Upload className="w-5 h-5" />
                                 <span className="font-bold">Upload Document / Image</span>
                               </div>
                             )}
                         </div>
                         <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                      </label>
                    </div>
                  )}

                  {/* File Grid */}
                  {loading ? (
                    <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-ukra-gold" /></div>
                  ) : files.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">Folder is empty.</div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {files.map(file => {
                        const isImage = file.mimeType.includes('image');
                        const isDeleting = deletingId === file.id;
                        
                        return (
                          <div key={file.id} className={`group relative bg-white border rounded-lg p-3 hover:shadow-md transition ${isDeleting ? 'opacity-50' : ''}`}>
                             <div 
                               className="aspect-square bg-gray-100 rounded-md mb-2 flex items-center justify-center overflow-hidden cursor-pointer"
                               onClick={() => setPreviewFile(file)}
                             >
                                {isImage ? (
                                  <img 
                                    src={`https://lh3.googleusercontent.com/d/${file.id}=s400`} 
                                    alt={file.name} 
                                    className="w-full h-full object-cover" 
                                    onError={(e) => { e.currentTarget.src = ''; e.currentTarget.classList.add('hidden') }} 
                                  />
                                ) : (
                                  <FileText className="w-12 h-12 text-gray-400" />
                                )}
                             </div>
                             
                             <div className="flex justify-between items-start">
                               <div className="truncate flex-1">
                                 <p className="text-xs font-bold text-gray-700 truncate" title={file.name}>{file.name}</p>
                                 <p className="text-[10px] text-gray-400">{new Date(file.date || '').toLocaleDateString()}</p>
                               </div>
                               
                               {canDelete && (
                                 <button 
                                   onClick={() => handleFileDelete(file.id)} 
                                   className="text-gray-300 hover:text-red-600 p-1"
                                   title="Delete File (Admin Only)"
                                   disabled={isDeleting}
                                 >
                                   {isDeleting ? <Loader2 className="w-4 h-4 animate-spin text-red-600" /> : <Trash2 className="w-4 h-4" />}
                                 </button>
                               )}
                             </div>
                             
                             <div className="mt-2">
                               <button 
                                 onClick={() => setPreviewFile(file)}
                                 className="w-full py-1 text-xs bg-gray-100 text-ukra-navy rounded hover:bg-ukra-navy hover:text-white flex items-center justify-center gap-1 transition"
                               >
                                 <Eye className="w-3 h-3" /> View
                               </button>
                             </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB 3: NOTES */}
          {activeTab === 'notes' && (
            <div className="flex flex-col h-full">
               <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                 {logs.length === 0 ? (
                    <div className="text-center text-gray-400 py-10">No notes or activity yet.</div>
                 ) : (
                    logs.map((log, idx) => (
                      <div key={idx} className={`flex gap-3 ${log.type === 'File' ? 'bg-gray-50' : 'bg-white'} p-3 rounded-lg border border-gray-100`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0 ${log.type === 'File' ? 'bg-blue-400' : 'bg-ukra-gold'}`}>
                           {log.type === 'File' ? <FileText className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                        </div>
                        <div className="flex-1">
                           <div className="flex justify-between items-start">
                             <span className="font-bold text-sm text-ukra-navy">{log.user}</span>
                             <span className="text-[10px] text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(log.timestamp).toLocaleString()}</span>
                           </div>
                           <p className="text-sm text-gray-600 mt-1">{log.content}</p>
                        </div>
                      </div>
                    ))
                 )}
               </div>
               
               {canAddNote && (
                 <div className="mt-auto pt-4 border-t">
                    <div className="flex gap-2">
                       <input 
                         type="text" 
                         className="flex-1 border rounded-lg px-4 py-2 focus:ring-ukra-gold focus:border-ukra-gold"
                         placeholder="Type a note or update..."
                         value={noteInput}
                         onChange={(e) => setNoteInput(e.target.value)}
                         onKeyPress={(e) => e.key === 'Enter' && handleSendNote()}
                       />
                       <button 
                         onClick={handleSendNote}
                         disabled={uploading || !noteInput.trim()}
                         className="bg-ukra-navy text-white px-4 py-2 rounded-lg hover:bg-opacity-90 disabled:opacity-50"
                       >
                         {uploading ? <Loader2 className="animate-spin" /> : <Send className="w-5 h-5" />}
                       </button>
                    </div>
                 </div>
               )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 border-t flex justify-between items-center text-xs text-gray-500">
             <span>Changes are auto-saved and notified.</span>
             {user?.role !== UserRole.CLIENT && (
                <div className="flex items-center gap-2">
                   <select 
                     value={newStatus} 
                     onChange={(e) => setNewStatus(e.target.value)}
                     className="p-1 border rounded bg-white"
                   >
                     <option value="" disabled>Change Status</option>
                     <option value="In Progress">In Progress</option>
                     <option value="Completed">Completed</option>
                   </select>
                   <button onClick={handleStatusUpdate} className="text-ukra-navy font-bold underline">Update</button>
                </div>
             )}
        </div>
        
        {/* Preview Modal */}
        {previewFile && (
          <div className="absolute inset-0 z-[60] bg-black/95 flex flex-col animate-in fade-in duration-200">
             <div className="p-4 flex justify-between items-center text-white">
                <h3 className="font-bold truncate">{previewFile.name}</h3>
                <div className="flex gap-4">
                  <a href={previewFile.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-ukra-gold"><ExternalLink className="w-4 h-4" /> Drive</a>
                  <button onClick={() => setPreviewFile(null)}><X className="w-6 h-6 hover:text-red-500" /></button>
                </div>
             </div>
             <div className="flex-1 flex items-center justify-center p-4">
                <iframe 
                  src={`https://drive.google.com/file/d/${previewFile.id}/preview`}
                  className="w-full h-full border-0 bg-white rounded"
                  title="Preview"
                />
             </div>
          </div>
        )}

      </div>
    </div>
  );
};
