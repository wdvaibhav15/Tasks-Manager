import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { KeyRound, Mail, Eye, EyeOff, LayoutDashboard, ArrowLeft } from 'lucide-react';

export default function LoginPage({ onNavigate }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setPending(true);
    const result = await login(email, password);
    setPending(false);
    if (result.success) {
      onNavigate('dashboard');
    }
  };

  // Preset quick accounts for demo testing
  const applyPreset = (type) => {
    if (type === 'admin') {
      setEmail('admin@managetasks.com');
      setPassword('password123');
    } else {
      setEmail('member@managetasks.com');
      setPassword('password123');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-250">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        
        {/* Back Link */}
        <button 
          onClick={() => onNavigate('landing')}
          className="mx-auto flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-450 hover:text-blue-600 mb-6 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg active:scale-95 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Landing Page</span>
        </button>

        <div className="flex justify-center flex-col items-center">
          <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-extrabold shadow-lg shadow-blue-500/25 mb-4">
            MT
          </div>
          <h2 className="text-center text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-xs text-slate-550 max-w">
            Or{' '}
            <button 
              onClick={() => onNavigate('register')}
              className="font-semibold text-blue-600 dark:text-cyan-400 hover:underline"
            >
              create a new account under seconds
            </button>
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 py-8 px-4 shadow-sm border border-slate-200 dark:border-slate-800 sm:rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                Email Address
              </label>
              <div className="mt-2 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                Password
              </label>
              <div className="mt-2 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={pending}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-blue-500/10 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all cursor-pointer"
              >
                {pending ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
          </form>

          {/* Quick Demo Credentials Presets */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/80">
            <span className="block text-center text-xs font-semibold text-slate-550 uppercase tracking-wider mb-4">
              Demo Access Presets (Recommended)
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => applyPreset('admin')}
                className="flex items-center justify-center space-x-1.5 p-2.5 border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 shadow-sm transition-all cursor-pointer text-center"
              >
                <span>Admin Login</span>
              </button>
              <button
                onClick={() => applyPreset('member')}
                className="flex items-center justify-center space-x-1.5 p-2.5 border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 rounded-xl text-xs font-bold text-cyan-600 dark:text-cyan-400 shadow-sm transition-all cursor-pointer text-center"
              >
                <span>Member Login</span>
              </button>
            </div>
            <div className="mt-4 bg-slate-100/60 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 text-center leading-relaxed">
              If MongoDB Atlas is empty or unconnected, our engine instantly seeds these two accounts on first load so you can test team comments & socket updates immediately!
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
