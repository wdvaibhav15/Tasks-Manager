import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { 
  LayoutDashboard, FolderKanban, Bell, LogOut, Search, Sun, Moon, 
  Users, User, Menu, X, ShieldAlert, CloudCheck, Globe
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ShellLayout({ children, currentTab, onNavigate, onSearchQueryChange }) {
  const { user, logout, socket, onlineUsers } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [searchText, setSearchText] = useState('');

  // Fetch recent notifications on mount & when socket triggers an alert
  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.log('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // Listen to socket triggers for live notification updates
  useEffect(() => {
    if (socket) {
      socket.on('notification:received', () => {
        fetchNotifications();
      });
      return () => {
        socket.off('notification:received');
      };
    }
  }, [socket]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchText(val);
    if (onSearchQueryChange) {
      onSearchQueryChange(val);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications/read', { method: 'POST' });
      if (res.ok) {
        toast.success('All marked as read');
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotif = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const sidebarLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'projects', label: 'Projects & Board', icon: <FolderKanban className="w-5 h-5" /> },
    { id: 'team', label: 'Team Directory', icon: <Users className="w-5 h-5" /> },
    { id: 'profile', label: 'My profile', icon: <User className="w-5 h-5" /> }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex transition-colors duration-250">
      
      {/* Sidebar - Desktop Layout */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0F172A] text-slate-100 border-r border-slate-800/80 flex-shrink-0">
        
        {/* Workspace Brand Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/80">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-[#2563EB] rounded-lg flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-blue-500/30">
              MT
            </div>
            <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-[#3B82F6] via-[#06B6D4] to-[#10B981] bg-clip-text text-transparent">
              MANAGE TASKS
            </span>
          </div>
          
          <div className="flex items-center space-x-1">
            <Globe className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span className="text-[9px] text-emerald-400 font-bold font-mono tracking-wide uppercase">Live</span>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 mx-3.5 my-4 bg-slate-800/40 border border-slate-700/40 rounded-2xl flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-[#2563EB] to-[#06B6D4] flex items-center justify-center text-white font-black text-sm shadow-md">
            {user?.name ? user.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : 'US'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black text-white truncate">{user?.name}</p>
            <span className="inline-flex items-center space-x-1 mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-[#2563EB]/25 text-blue-300 border border-blue-500/20">
              <span>{user?.role || 'Member'}</span>
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {sidebarLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                onNavigate(link.id);
                setMobileOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-black tracking-wider uppercase transition-all ${
                currentTab === link.id
                  ? 'bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white shadow-lg shadow-blue-500/25'
                  : 'hover:bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              <div className={currentTab === link.id ? 'text-white' : 'text-slate-400'}>
                {link.icon}
              </div>
              <span>{link.label}</span>
            </button>
          ))}
        </nav>

        {/* Sidebar Footer Details */}
        <div className="p-4 border-t border-slate-800/80 space-y-2.5">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl border border-slate-805 bg-slate-800/10 text-xs font-bold hover:bg-slate-805 transition-all"
          >
            <span className="text-slate-400">Visual Theme</span>
            {darkMode ? (
              <div className="flex items-center space-x-1 text-amber-400 hover:text-amber-300">
                <Sun className="w-4 h-4" />
                <span>Light</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-slate-100 hover:text-white">
                <Moon className="w-4 h-4" />
                <span>Dark</span>
              </div>
            )}
          </button>

          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-400 border border-rose-500/20 hover:bg-rose-500/10 transition-all text-left"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* Main Wrapper Content Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Top Navbar */}
        <header className="h-16 flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 relative z-30">
          
          <div className="flex items-center space-x-3 md:space-x-0">
            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="w-5 h-5 text-slate-500" />
            </button>
            
            {/* Real Search bar */}
            <div className="relative rounded-xl w-48 sm:w-80 shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchText}
                onChange={handleSearchChange}
                placeholder="Search projects, tasks, comments..."
                className="block w-full pl-9 pr-3 py-1.5 border border-slate-300 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            
            {/* Online indicators */}
            <div className="hidden sm:flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-3 py-1 rounded-xl text-[10px] font-bold">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-slate-500">{onlineUsers.length} Online</span>
            </div>

            {/* Notification drop hook */}
            <div className="relative">
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg relative focus:outline-none"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 block h-4 min-w-4 rounded-full bg-rose-500 font-mono text-[9px] font-bold text-white text-center px-1">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification dropdown overlay panel */}
              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden z-50">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="font-bold text-xs tracking-wider uppercase text-slate-900 dark:text-white">Workspace Alerts</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllAsRead}
                        className="text-[10px] text-blue-600 dark:text-cyan-400 font-bold hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500 italic">
                        No notification alerts at this moment
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div 
                          key={notif._id || notif.id} 
                          className={`p-3.5 text-xs flex flex-col space-y-1.5 hover:bg-slate-50 dark:hover:bg-slate-955 transition-colors ${!notif.read ? 'bg-blue-600/[0.03] border-l-2 border-blue-600' : ''}`}
                        >
                          <div className="flex justify-between items-start">
                            <p className="text-slate-700 dark:text-slate-350 leading-relaxed pr-2">{notif.message}</p>
                            <button 
                              onClick={(e) => deleteNotif(notif._id || notif.id, e)}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-rose-400 text-[10px]"
                            >
                              Dismiss
                            </button>
                          </div>
                          <span className="text-[10px] text-slate-450 font-mono">
                            {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar Trigger */}
            <button 
              onClick={() => onNavigate('profile')}
              className="flex items-center space-x-2 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-left"
            >
              <div className="h-8 w-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs shadow-sm shadow-blue-500/10">
                {user?.name ? user.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : 'US'}
              </div>
              <div className="hidden lg:block min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-24">{user?.name}</p>
                <span className="text-[9px] text-slate-450 font-mono uppercase">{user?.role}</span>
              </div>
            </button>
          </div>
        </header>

        {/* Content Container Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 relative z-10">
          {children}
        </main>

        <div className="absolute inset-x-0 bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-center py-2 text-[10px] text-slate-500 z-10 block select-none px-4">
          MANAGE TASKS Board - System status: <span className="text-emerald-500 font-bold font-mono">OK</span> &middot; WebSocket Connected.
        </div>
      </div>

      {/* Mobile Drawer Slide Navigation Menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-55 flex md:hidden" id="mobile-menu-drawer">
          {/* Backdrop screen lock */}
          <div 
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" 
          />
          
          <div className="relative flex flex-col w-64 max-w-xs bg-[#0F172A] text-slate-100 border-r border-slate-800/80 h-full p-5 z-10 transition-transform">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800/80">
              <span className="font-extrabold text-base bg-gradient-to-r from-[#3B82F6] via-[#06B6D4] to-[#10B981] bg-clip-text text-transparent">MANAGE TASKS</span>
              <button 
                onClick={() => setMobileOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1">
              {sidebarLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => {
                    onNavigate(link.id);
                    setMobileOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-black tracking-wider uppercase transition-all ${
                    currentTab === link.id
                      ? 'bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white shadow-lg'
                      : 'hover:bg-slate-800/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className={currentTab === link.id ? 'text-white' : 'text-slate-400'}>
                    {link.icon}
                  </div>
                  <span>{link.label}</span>
                </button>
              ))}
            </nav>

            <div className="pt-6 border-t border-slate-805 space-y-3">
              <button
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl border border-slate-805 bg-slate-800/10 text-xs font-bold hover:bg-slate-805 transition-all text-left"
              >
                <span className="text-slate-400 text-xs">Visual Theme</span>
                {darkMode ? (
                  <span className="text-amber-400">Light</span>
                ) : (
                  <span className="text-slate-100">Dark</span>
                )}
              </button>
              <button
                onClick={logout}
                className="w-full flex items-center space-x-2 text-xs font-bold text-rose-400 px-3.5 py-2.5 rounded-xl border border-rose-500/10 hover:bg-rose-500/5 text-left"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Logout Session</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
