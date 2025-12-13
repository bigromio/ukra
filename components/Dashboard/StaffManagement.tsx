import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types';
import { fetchAllUsers, adminUpdateUserRole, adminDeleteUser } from '../../services/apiService';
import { Users, Shield, Trash2, Edit2, Loader2, Check } from 'lucide-react';

export const StaffManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'staff' | 'clients'>('staff');
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const res = await fetchAllUsers();
    if (res.success) {
      setUsers(res.users);
    }
    setLoading(false);
  };

  const handleRoleUpdate = async (email: string, newRole: string) => {
    if (!window.confirm(`Change role for ${email} to ${newRole}?`)) return;
    
    setProcessing(email);
    const res = await adminUpdateUserRole(email, newRole);
    setProcessing(null);
    setEditingEmail(null);

    if (res.success) {
      setUsers(prev => prev.map(u => u.email === email ? { ...u, role: newRole as UserRole } : u));
    } else {
      alert("Failed to update role");
    }
  };

  const handleDeleteUser = async (email: string) => {
    if (!window.confirm("Are you sure? This will delete the user permanently.")) return;
    
    setProcessing(email);
    const res = await adminDeleteUser(email);
    setProcessing(null);

    if (res.success) {
      setUsers(prev => prev.filter(u => u.email !== email));
    } else {
      // Improved error alerting
      alert("Failed to delete user: " + (res.message || "Unknown error"));
    }
  };

  // Filter lists: Staff (Owner/Manager/Employee) vs Clients
  const staffMembers = users.filter(u => 
    u.role === UserRole.OWNER || u.role === UserRole.MANAGER || u.role === UserRole.EMPLOYEE
  );
  const clients = users.filter(u => !u.role || u.role === UserRole.CLIENT);

  const displayedUsers = activeTab === 'staff' ? staffMembers : clients;

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden min-h-[500px]">
      <div className="p-6 border-b flex justify-between items-center bg-gray-50">
        <div>
           <h2 className="text-xl font-bold text-ukra-navy flex items-center gap-2">
             <Users className="w-6 h-6 text-ukra-gold" /> User Management
           </h2>
           <p className="text-sm text-gray-500 mt-1">Manage staff roles and client access</p>
        </div>
        
        <div className="flex bg-white rounded-lg border p-1">
          <button 
            onClick={() => setActiveTab('staff')}
            className={`px-4 py-2 rounded-md text-sm font-bold transition ${activeTab === 'staff' ? 'bg-ukra-navy text-white' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            Staff ({staffMembers.length})
          </button>
          <button 
             onClick={() => setActiveTab('clients')}
             className={`px-4 py-2 rounded-md text-sm font-bold transition ${activeTab === 'clients' ? 'bg-ukra-navy text-white' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            Clients ({clients.length})
          </button>
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="text-center py-20"><Loader2 className="w-8 h-8 animate-spin mx-auto text-ukra-gold" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Phone</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayedUsers.map((user, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phone || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingEmail === user.email ? (
                         <select 
                           className="text-sm border rounded p-1"
                           defaultValue={user.role}
                           onChange={(e) => handleRoleUpdate(user.email!, e.target.value)}
                         >
                           <option value="CLIENT">Client</option>
                           <option value="EMPLOYEE">Employee</option>
                           <option value="MANAGER">Manager</option>
                           <option value="OWNER">Owner</option>
                         </select>
                      ) : (
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${user.role === 'OWNER' ? 'bg-purple-100 text-purple-800' : 
                            user.role === 'MANAGER' ? 'bg-indigo-100 text-indigo-800' : 
                            user.role === 'EMPLOYEE' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'}`}>
                          {user.role}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                       {processing === user.email ? (
                         <Loader2 className="w-5 h-5 animate-spin ml-auto text-ukra-gold" />
                       ) : (
                         <div className="flex justify-end gap-3">
                           <button 
                             onClick={() => setEditingEmail(editingEmail === user.email ? null : user.email!)}
                             className="text-gray-400 hover:text-ukra-navy"
                             title="Edit Role"
                           >
                             <Edit2 className="w-4 h-4" />
                           </button>
                           <button 
                             onClick={() => handleDeleteUser(user.email!)}
                             className="text-gray-400 hover:text-red-600"
                             title="Delete User"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                         </div>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {displayedUsers.length === 0 && (
              <div className="text-center py-10 text-gray-400">No users found in this category.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
