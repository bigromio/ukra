import React, { useState } from 'react';
import { User } from '../../types';
import { updateClientProfile, deleteClientAccount } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';
import { X, Save, Trash2, AlertTriangle, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export const UserProfileModal: React.FC<Props> = ({ isOpen, onClose, user }) => {
  const { logout, login } = useAuth();
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    if (formData.email !== user.email) {
      if (!window.confirm("تحذير: تغيير البريد الإلكتروني سيؤدي إلى فقدان الوصول إلى المشاريع المرتبطة بالبريد الحالي. هل أنت متأكد؟\n\nWarning: Changing email will disconnect current projects. Are you sure?")) {
        return;
      }
    }

    setLoading(true);
    const res = await updateClientProfile(user.email || '', {
      newName: formData.name,
      newEmail: formData.email,
      newPhone: formData.phone,
      newPassword: formData.password || undefined
    });
    setLoading(false);

    if (res.success) {
      alert("Profile updated successfully. Please login again if you changed your email.");
      if (formData.email !== user.email) {
        logout();
      } else {
        // Update local session
        login({ ...user, name: formData.name, phone: formData.phone, email: formData.email });
        onClose();
      }
    } else {
      alert("Failed to update: " + res.message);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action is irreversible.")) {
      setLoading(true);
      const res = await deleteClientAccount(user.email || '');
      setLoading(false);
      if (res.success) {
        logout();
      } else {
        alert("Failed to delete account.");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
        
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-xl font-bold text-ukra-navy">Edit Profile</h2>
          <button onClick={onClose}><X className="text-gray-400 hover:text-red-500" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
            <input name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Phone</label>
            <input name="phone" value={formData.phone} onChange={handleChange} className="w-full p-2 border rounded" />
          </div>
          <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
             <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                Email <AlertTriangle className="w-4 h-4 text-yellow-600" />
             </label>
             <input name="email" value={formData.email} onChange={handleChange} className="w-full p-2 border rounded" />
             <p className="text-xs text-yellow-700 mt-1">Changing email may unlink existing projects.</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">New Password (Optional)</label>
            <input name="password" type="password" placeholder="Leave blank to keep current" onChange={handleChange} className="w-full p-2 border rounded" />
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button onClick={handleDelete} className="px-4 py-2 border border-red-200 text-red-600 rounded hover:bg-red-50 flex items-center gap-2">
             <Trash2 className="w-4 h-4" /> Delete
          </button>
          <button onClick={handleUpdate} disabled={loading} className="flex-1 bg-ukra-navy text-white rounded hover:bg-opacity-90 flex items-center justify-center gap-2 py-2">
             {loading ? <Loader2 className="animate-spin" /> : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </div>

      </div>
    </div>
  );
};