import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Users, Shield, Mail, CheckCircle, Trash, Award, Plus, RefreshCcw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TeamPage() {
  const { user, onlineUsers } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('Member');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.log('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Quick helper to see if a user has an active socket session
  const isUserOnline = (uId) => {
    return onlineUsers.some(ou => ou.id === uId || ou._id === uId);
  };

  const handleUpdateRole = async (userId, newRole) => {
    toast.error('Direct role modification requires Database administrative permission.');
  };

  const handleOnboardDummyMember = async (e) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: inviteName,
          email: inviteEmail,
          password: 'password123',
          confirmPassword: 'password123',
          role: inviteRole
        })
      });
      if (res.ok) {
        toast.success(`Account registered for ${inviteName}! Creds: password123`);
        setInviteModalOpen(false);
        setInviteName('');
        setInviteEmail('');
        setInviteRole('Member');
        fetchUsers();
      } else {
        const d = await res.json();
        toast.error(d.error || 'Failed to register teammate');
      }
    } catch (err) {
      toast.error('Failed to create account');
    }
  };

  return (
    <div className="space-y-6 select-none">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center space-x-2.5">
            <Users className="text-blue-600 w-6 h-6" />
            <span>Workspace Team Directory</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Onboard other members and review active Web Socket connectivity statuses.</p>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            onClick={fetchUsers}
            className="p-2 border border-slate-205 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-all"
          >
            <RefreshCcw className="w-4 h-4 text-slate-500" />
          </button>

          {user?.role === 'Admin' && (
            <button 
              onClick={() => setInviteModalOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Invite New User</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs text-slate-550 italic">
          Loading team details...
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {users.map((u) => {
            const online = isUserOnline(u._id || u.id);
            return (
              <div 
                key={u._id || u.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-3xl flex flex-col justify-between space-y-6 relative overflow-hidden shadow-[0_4px_24px_-4px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-blue-500/20 transition-all duration-200"
              >
                
                {/* Visual Status Tag top right */}
                <div className="absolute top-4 right-4 flex items-center space-x-1">
                  <span className={`h-2 w-2 rounded-full ${online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`} />
                  <span className="text-[9px] font-mono font-bold uppercase text-slate-400">
                    {online ? 'Online' : 'Offline'}
                  </span>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 text-white font-black text-sm flex items-center justify-center shadow-md">
                    {u.name ? u.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : '?'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{u.name}</h4>
                    <div className="flex items-center space-x-1 mt-0.5">
                      <Mail className="w-3.5 h-3.5 text-slate-450" />
                      <span className="text-xs text-slate-500 truncate max-w-44">{u.email}</span>
                    </div>
                  </div>
                </div>

                {/* Account Roles representation */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                  <div className="flex items-center space-x-1.5 font-bold">
                    <Shield className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-slate-500 font-medium">Role:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] ${u.role === 'Admin' ? 'bg-rose-500/15 text-rose-500 border border-rose-500/20' : 'bg-blue-500/10 text-blue-600'}`}>
                      {u.role}
                    </span>
                  </div>

                  {user?.role === 'Admin' && u._id !== user.id && (
                    <button 
                      onClick={() => handleUpdateRole(u._id || u.id, u.role === 'Admin' ? 'Member' : 'Admin')}
                      className="text-[10px] text-slate-450 hover:text-blue-600 font-semibold"
                    >
                      Toggle Level
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* DIRECTORY USER ASSIGNMENT REGULATION PANEL */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setInviteModalOpen(false)} />
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl w-full max-w-md relative z-10 shadow-2xl">
            <h3 className="font-extrabold text-base mb-2 text-slate-900 dark:text-white">Onboard Teammate Teaser</h3>
            <p className="text-xs text-slate-550 mb-4">Register account for a new engineer. Password defaults initially to "password123".</p>
            
            <form onSubmit={handleOnboardDummyMember} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Teammate Full Name</label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Rachel Green"
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Teammate Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="rachel@managetasks.com"
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Assigned Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Member">Member (Standard Task Operations)</option>
                  <option value="Admin">Admin (Full Board Authority)</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="w-1/2 py-2.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-850 hover:bg-slate-55"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl"
                >
                  Register Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
