import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { User, Mail, Shield, ShieldCheck, Key, BookOpen, Clock, Settings, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UserProfile() {
  const { user, updateProfile } = useAuth();
  
  // Profile state details
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    password: '',
    newPassword: ''
  });
  
  const [stats, setStats] = useState({
    projectsCount: 0,
    tasksCount: 0
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        password: '',
        newPassword: ''
      });
      
      // Fetch stats from backend profile route
      const fetchProfileDetails = async () => {
        try {
          const res = await fetch('/api/auth/profile');
          if (res.ok) {
            const data = await res.json();
            if (data.stats) {
              setStats(data.stats);
            }
          }
        } catch (err) {
          console.log(err);
        }
      };

      fetchProfileDetails();
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!profileData.name || !profileData.email) {
      return toast.error('Full Name and Email address are required fields');
    }

    if (profileData.newPassword && !profileData.password) {
      return toast.error('Verify your current password to apply updates');
    }

    const payload = {
      name: profileData.name,
      email: profileData.email
    };

    if (profileData.newPassword && profileData.password) {
      payload.password = profileData.password;
      payload.newPassword = profileData.newPassword;
    }

    const result = await updateProfile(payload);
    if (result.success) {
      // Clear password states
      setProfileData(prev => ({ ...prev, password: '', newPassword: '' }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 select-none select-text">
      
      {/* Header section banner */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
          <span>My Profile Portal</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">Manage credentials parameters, security keys, and inspect task assignments logs.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Profile Card overview Column */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-3xl flex flex-col items-center justify-between space-y-6 text-center select-none shadow-[0_4px_24px_-4px_rgba(0,0,0,0.02)]">
          <div className="space-y-3 flex flex-col items-center">
            <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg border-2 border-slate-100 dark:border-slate-800">
              {user?.name ? user.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : '?'}
            </div>
            
            <div>
              <h3 className="font-extrabold text-slate-905 dark:text-white leading-tight">{user?.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
            </div>

            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/15 uppercase">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{user?.role || 'Member'} clearance</span>
            </span>
          </div>

          {/* Stats widgets inside profile */}
          <div className="grid grid-cols-2 gap-4 w-full pt-4 border-t border-slate-100 dark:border-slate-850">
            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-900">
              <span className="block text-[10px] text-slate-450 uppercase font-black">Active Boards</span>
              <span className="text-xl font-black dark:text-white">{stats.projectsCount}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-955 p-3 rounded-xl border border-slate-200 dark:border-slate-900">
              <span className="block text-[10px] text-slate-450 uppercase font-black">My Task Cards</span>
              <span className="text-xl font-black dark:text-white">{stats.tasksCount}</span>
            </div>
          </div>
        </div>

        {/* Update credentials profile settings Column */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-3xl col-span-2 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.02)]">
          <h3 className="font-extrabold text-sm mb-4 border-b border-slate-100 dark:border-slate-850 pb-2 text-slate-900 dark:text-white uppercase tracking-wider">Account Specifications</h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Full Name</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="block w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Email Address</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="block w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-850 space-y-4">
              <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider flex items-center space-x-1.5 pt-2">
                <Key className="w-3.5 h-3.5" />
                <span>Security Credentials</span>
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Verify Current Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={profileData.password}
                    onChange={(e) => setProfileData({ ...profileData, password: e.target.value })}
                    className="block w-full p-2 border border-slate-300 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">New Password</label>
                  <input
                    type="password"
                    placeholder="At least 6 characters"
                    value={profileData.newPassword}
                    onChange={(e) => setProfileData({ ...profileData, newPassword: e.target.value })}
                    className="block w-full p-2 border border-slate-300 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer active:scale-95 transition-all"
              >
                Save profile parameters
              </button>
            </div>

          </form>
        </div>

      </div>

    </div>
  );
}
