import React, { useState, useEffect } from 'react';
import { 
  X, Send, Phone, Mail, Box, DollarSign, UserCheck, 
  FileText, Image as ImageIcon, Trash2, Upload, ExternalLink, Loader2, Eye
} from 'lucide-react';
import { OrderData, DriveFile, UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { fetchOrderFiles, uploadOrderFile, deleteOrderFile } from '../../services/apiService';

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderData | null;
  onNotify: (id: string, status: string) => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ isOpen, onClose, order, onNotify }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'files'>('details');
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  
  // Preview Modal State
  const [previewFile, setPreviewFile] = useState<DriveFile | null>(null);

  const { user, isClient, isAdmin } = useAuth();
  
  // Permissions
  const canUpload = isAdmin; // Admins, Managers, Employees can upload
  const canDelete = user?.role === UserRole.OWNER || user?.role === UserRole.MANAGER; // Only Owner/Manager can delete

  useEffect(() => {
    if (isOpen && order && order.driveFolderUrl) {
      loadFiles();
    }
    setActiveTab('details');
    setPreviewFile(null);
  }, [isOpen, order]);

  const loadFiles = async () => {
    if (!order?.driveFolderUrl) return;
    setLoadingFiles(true);
    const res = await fetchOrderFiles(order.driveFolderUrl);
    if (res.success) {
      setFiles(res.files);
    }
    setLoadingFiles(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !order?.driveFolderUrl) return;

    setUploading(true);
    // Notify the client via email if the uploader is an admin
    const notifyEmail = isAdmin ? order.email : undefined; 

    const res = await uploadOrderFile(order.driveFolderUrl, file, order.id, notifyEmail, user?.name);
    setUploading(false);

    if (res.success) {
      alert("File uploaded successfully.");
      loadFiles(); // Refresh list
    } else {
      alert("Upload failed: " + res.message);
    }
  };

  const handleFileDelete = async (fileId: string) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;
    
    const res = await deleteOrderFile(fileId);
    if (res.success) {
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } else {
      alert("Delete failed.");
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
            <h2 className="text-2xl font-bold">{isAdmin ? order.client : order.details || 'Project Details'}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-gray-50">
          <button 
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider ${activeTab === 'details' ? 'bg-white text-ukra-navy border-t-2 border-ukra-gold' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            Project Details
          </button>
          <button 
            onClick={() => setActiveTab('files')}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider ${activeTab === 'files' ? 'bg-white text-ukra-navy border-t-2 border-ukra-gold' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            Files & Documents ({files.length})
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          
          {activeTab === 'details' && (
             <div className="space-y-8">
                {/* Details Grid (Same as before) */}
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
                      <DollarSign className="w-4 h-4 text-ukra-gold" /> Quote
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex justify-between"><span>Total:</span> <span className="font-medium text-green-700 font-bold">{order.amount || 'Pending'}</span></li>
                      {isAdmin && <li className="flex justify-between"><span>Client Budget:</span> <span className="font-medium text-gray-900">{order.budget || 'N/A'}</span></li>}
                    </ul>
                  </div>

                  {isAdmin && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <h3 className="text-sm font-bold text-ukra-navy uppercase mb-3 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-ukra-gold" /> Client
                      </h3>
                      <ul className="space-y-3 text-sm">
                        <li><a href={`tel:${order.phone}`} className="flex items-center gap-2 hover:text-ukra-navy"><Phone className="w-4 h-4" /> {order.phone}</a></li>
                        <li><a href={`mailto:${order.email}`} className="flex items-center gap-2 hover:text-ukra-navy"><Mail className="w-4 h-4" /> {order.email}</a></li>
                      </ul>
                    </div>
                  )}
                  {isClient && (
                     <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex flex-col justify-center items-center text-center">
                        <UserCheck className="w-8 h-8 text-ukra-gold mb-2" />
                        <p className="text-sm text-gray-600 mb-2">Need help?</p>
                        <a href="mailto:support@ukra.sa" className="text-ukra-navy font-bold text-sm underline">Contact Support</a>
                     </div>
                  )}
                </div>

                {order.type === 'Design' && (
                  <div>
                    <h3 className="text-lg font-bold text-ukra-navy mb-4">Design Specifications</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                       <div className="p-3 bg-gray-50 rounded border"><span className="text-xs text-gray-500 block">Scope</span>{order.scope}</div>
                       <div className="p-3 bg-gray-50 rounded border"><span className="text-xs text-gray-500 block">Style</span>{order.style}</div>
                       <div className="p-3 bg-gray-50 rounded border"><span className="text-xs text-gray-500 block">Colors</span>{order.colors}</div>
                       <div className="p-3 bg-gray-50 rounded border"><span className="text-xs text-gray-500 block">Project</span>{order.projectType}</div>
                    </div>
                  </div>
                )}
             </div>
          )}

          {activeTab === 'files' && (
            <div className="h-full flex flex-col">
              {!order.driveFolderUrl ? (
                <div className="text-center py-20 text-gray-400">
                  <Box className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>No Folder Linked yet. Please contact Admin.</p>
                </div>
              ) : (
                <>
                  {/* Upload Area (Admins Only) */}
                  {canUpload && (
                    <div className="mb-6">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
                         <div className="flex flex-col items-center justify-center pt-5 pb-6">
                             {uploading ? (
                               <Loader2 className="w-8 h-8 text-ukra-gold animate-spin" />
                             ) : (
                               <>
                                 <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                 <p className="text-sm text-gray-500"><span className="font-bold">Click to upload</span> or drag and drop</p>
                                 <p className="text-xs text-gray-400">PDF, PNG, JPG (MAX. 10MB)</p>
                               </>
                             )}
                         </div>
                         <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                      </label>
                    </div>
                  )}

                  {/* File Grid */}
                  {loadingFiles ? (
                    <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-ukra-gold" /></div>
                  ) : files.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">Folder is empty.</div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {files.map(file => {
                        const isImage = file.mimeType.includes('image');
                        const isPdf = file.mimeType.includes('pdf');
                        return (
                          <div key={file.id} className="group relative bg-white border rounded-lg p-3 hover:shadow-md transition">
                             <div 
                               className="aspect-square bg-gray-100 rounded-md mb-2 flex items-center justify-center overflow-hidden cursor-pointer"
                               onClick={() => setPreviewFile(file)}
                             >
                                {isImage ? (
                                  <img 
                                    src={`https://lh3.googleusercontent.com/d/${file.id}=s400`} 
                                    alt={file.name} 
                                    className="w-full h-full object-cover" 
                                    onError={(e) => { e.currentTarget.src = ''; e.currentTarget.classList.add('hidden') }} // Fallback if CORS/Auth fails
                                  />
                                ) : (
                                  <FileText className="w-12 h-12 text-gray-400" />
                                )}
                             </div>
                             
                             <div className="flex justify-between items-start">
                               <div className="truncate flex-1">
                                 <p className="text-xs font-bold text-gray-700 truncate" title={file.name}>{file.name}</p>
                                 <p className="text-[10px] text-gray-400">{(file.size ? (file.size / 1024 / 1024).toFixed(2) + ' MB' : '')}</p>
                               </div>
                               
                               {canDelete && (
                                 <button onClick={() => handleFileDelete(file.id)} className="text-red-400 hover:text-red-600 p-1">
                                   <Trash2 className="w-3 h-3" />
                                 </button>
                               )}
                             </div>
                             
                             <div className="mt-2 flex gap-2">
                               <button 
                                 onClick={() => setPreviewFile(file)}
                                 className="flex-1 py-1 text-xs bg-ukra-navy text-white rounded hover:bg-opacity-90 flex items-center justify-center gap-1"
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
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 border-t flex justify-between items-center">
            {isAdmin ? (
               <div className="flex items-center gap-2 w-full md:w-auto">
                   <select 
                     value={newStatus} 
                     onChange={(e) => setNewStatus(e.target.value)}
                     className="p-2 border border-gray-300 rounded text-sm bg-white"
                   >
                     <option value="" disabled>Update Status...</option>
                     <option value="In Progress">In Progress</option>
                     <option value="Completed">Completed</option>
                   </select>
                   <button onClick={handleStatusUpdate} className="px-4 py-2 bg-ukra-navy text-white rounded text-sm font-bold">Update</button>
               </div>
            ) : (
               <span className="text-xs text-gray-500">Files are updated in real-time.</span>
            )}
        </div>
        
        {/* Preview Modal */}
        {previewFile && (
          <div className="absolute inset-0 z-50 bg-black/90 flex flex-col animate-in fade-in duration-200">
             <div className="p-4 flex justify-between items-center text-white">
                <h3 className="font-bold truncate">{previewFile.name}</h3>
                <div className="flex gap-4">
                  <a href={previewFile.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-ukra-gold"><ExternalLink className="w-4 h-4" /> Open in Drive</a>
                  <button onClick={() => setPreviewFile(null)}><X className="w-6 h-6 hover:text-red-500" /></button>
                </div>
             </div>
             <div className="flex-1 bg-gray-800 flex items-center justify-center p-4 relative">
                <iframe 
                  src={`https://drive.google.com/file/d/${previewFile.id}/preview`}
                  className="w-full h-full border-0 rounded bg-white"
                  title="File Preview"
                  allow="autoplay"
                ></iframe>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};