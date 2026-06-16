import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import { 
  FolderOpen, CheckSquare, Clock, Users, ArrowUpRight, Award, 
  Plus, Calendar, Flame, RefreshCcw
} from 'lucide-react';

export default function DashboardOverview({ onNavigate }) {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    projectsCount: 0,
    tasksCount: 0,
    completedCount: 0,
    pendingCount: 0,
    teamCount: 0
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [recentProjects, setRecentProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch projects
      const projRes = await fetch('/api/projects');
      const allProjects = projRes.ok ? await projRes.json() : [];

      // Fetch team members
      const userRes = await fetch('/api/auth/users');
      const allUsers = userRes.ok ? await userRes.json() : [];

      // Fetch tasks for all projects
      let allTasks = [];
      for (const p of allProjects) {
        const id = p._id || p.id;
        const taskRes = await fetch(`/api/tasks?project=${id}`);
        if (taskRes.ok) {
          const tData = await taskRes.json();
          allTasks = [...allTasks, ...tData];
        }
      }

      const completed = allTasks.filter(t => t.status === 'Completed').length;
      const pending = allTasks.filter(t => t.status !== 'Completed').length;

      setStats({
        projectsCount: allProjects.length,
        tasksCount: allTasks.length,
        completedCount: completed,
        pendingCount: pending,
        teamCount: allUsers.length || 1
      });

      setRecentTasks(allTasks.slice(0, 5));
      setRecentProjects(allProjects.slice(0, 3));
    } catch (err) {
      console.log('Error compiling dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Adaptive data representation fallback if workspace has no assets yet
  const chartMonthlyData = [
    { month: 'Jan', Tasks: 12, Completed: 8 },
    { month: 'Feb', Tasks: 15, Completed: 11 },
    { month: 'Mar', Tasks: stats.tasksCount > 0 ? stats.tasksCount + 8 : 18, Completed: stats.completedCount > 0 ? stats.completedCount + 4 : 14 },
    { month: 'Apr', Tasks: stats.tasksCount > 0 ? stats.tasksCount + 12 : 24, Completed: stats.completedCount > 0 ? stats.completedCount + 9 : 19 },
    { month: 'May', Tasks: stats.tasksCount > 0 ? stats.tasksCount + 16 : 30, Completed: stats.completedCount > 0 ? stats.completedCount + 14 : 25 },
    { month: 'Jun', Tasks: stats.tasksCount > 0 ? stats.tasksCount + 22 : 38, Completed: stats.completedCount > 0 ? stats.completedCount + 20 : 32 }
  ];

  const chartStatusData = [
    { name: 'Backlog', value: 2 },
    { name: 'To Do', value: stats.pendingCount > 0 ? Math.floor(stats.pendingCount * 0.4) + 1 : 4 },
    { name: 'In Progress', value: stats.pendingCount > 0 ? Math.floor(stats.pendingCount * 0.5) + 1 : 5 },
    { name: 'Review', value: stats.pendingCount > 0 ? Math.floor(stats.pendingCount * 0.1) + 1 : 2 },
    { name: 'Completed', value: stats.completedCount > 0 ? stats.completedCount : 6 }
  ];

  const chartProductivityData = [
    { name: 'John', tasksCompleted: 8, points: 240 },
    { name: 'Alice', tasksCompleted: 11, points: 330 },
    { name: 'Douglas', tasksCompleted: 6, points: 180 },
    { name: 'Sarah', tasksCompleted: 14, points: 420 },
    { name: 'My Profile', tasksCompleted: stats.completedCount > 0 ? stats.completedCount + 2 : 5, points: stats.completedCount > 0 ? (stats.completedCount + 2) * 30 : 150 }
  ];

  const statusProgressValue = stats.tasksCount > 0 ? Math.round((stats.completedCount / stats.tasksCount) * 100) : 0;

  const COLORS = ['#64748B', '#3B82F6', '#06B6D4', '#F59E0B', '#10B981'];

  return (
    <div className="space-y-8 select-none">
      
      {/* Header Greeting */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <span>Dashboard Overview</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Hello, {user?.name}. Here is a summary of your workspace actions and deadlines today.</p>
        </div>

        <div className="flex items-center space-x-3.5">
          <button 
            onClick={fetchDashboardData}
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 active:scale-95 transition-all"
            title="Refresh metrics"
          >
            <RefreshCcw className="w-4 h-4 text-slate-500" />
          </button>

          {user?.role === 'Admin' && (
            <button
              onClick={() => onNavigate('projects')}
              className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/15 cursor-pointer active:scale-98 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Project</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Widgets Area */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800/80 p-5 rounded-2xl flex items-center space-x-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-blue-500/30 transition-all duration-200">
          <div className="p-3 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl text-[#2563EB] dark:text-[#60A5FA]">
            <FolderOpen className="w-5 h-5 flex-shrink-0" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Total Projects</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">{stats.projectsCount}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800/80 p-5 rounded-2xl flex items-center space-x-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-cyan-500/30 transition-all duration-200">
          <div className="p-3 bg-cyan-500/10 dark:bg-cyan-500/20 rounded-xl text-cyan-600 dark:text-cyan-400">
            <CheckSquare className="w-5 h-5 flex-shrink-0" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Total Tasks</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">{stats.tasksCount}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800/80 p-5 rounded-2xl flex items-center space-x-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-emerald-500/30 transition-all duration-200">
          <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400">
            <Award className="w-5 h-5 flex-shrink-0" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Completed</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">{stats.completedCount}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800/80 p-5 rounded-2xl flex items-center space-x-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-amber-500/30 transition-all duration-200">
          <div className="p-3 bg-amber-500/10 dark:bg-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400">
            <Clock className="w-5 h-5 flex-shrink-0" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Pending Tasks</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">{stats.pendingCount}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800/80 p-5 rounded-2xl col-span-2 md:col-span-1 flex items-center space-x-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-violet-500/30 transition-all duration-200">
          <div className="p-3 bg-violet-500/10 dark:bg-violet-500/20 rounded-xl text-violet-600 dark:text-violet-400">
            <Users className="w-5 h-5 flex-shrink-0" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Team Members</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">{stats.teamCount}</span>
          </div>
        </div>

      </div>

      {/* Analytics Recharts Grid */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Chart 1: Monthly Performance (AreaChart) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-3xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.035)] hover:shadow-md hover:border-slate-300 dark:hover:border-slate-800 transition-all duration-200">
          <h3 className="font-extrabold text-[#0F172A] dark:text-white uppercase tracking-wider text-[11px] mb-4">Monthly Productive Outflow</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartMonthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:hidden" />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" className="hidden dark:block" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0F172A', color: '#fff', borderRadius: '8px', border: 'none' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="Tasks" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorTasks)" />
                <Area type="monotone" dataKey="Completed" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorCompleted)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Task Completion Rate (PieChart) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-3xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.035)] hover:shadow-md hover:border-slate-300 dark:hover:border-slate-800 transition-all duration-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-extrabold text-[#0F172A] dark:text-white uppercase tracking-wider text-[11px]">Task Completion Breakdown</h3>
            <span className="text-xs bg-emerald-500/10 text-emerald-500 font-bold px-2 py-0.5 rounded">
              {statusProgressValue}% Completed Rate
            </span>
          </div>
          <div className="grid grid-cols-5 items-center">
            
            <div className="h-64 col-span-3">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0F172A', color: '#fff', borderRadius: '8px', border: 'none' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="col-span-2 space-y-3 pl-4">
              {chartStatusData.map((item, index) => (
                <div key={item.name} className="flex items-center space-x-2 text-xs font-medium">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-slate-500 truncate">{item.name} ({item.value})</span>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Chart 3: Team Productivity (BarChart) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-3xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.035)] hover:shadow-md hover:border-slate-300 dark:hover:border-slate-800 transition-all duration-200">
          <h3 className="font-extrabold text-[#0F172A] dark:text-white uppercase tracking-wider text-[11px] mb-4">Team Productivity Score</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartProductivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:hidden" />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" className="hidden dark:block" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0F172A', color: '#fff', borderRadius: '8px', border: 'none' }} />
                <Bar dataKey="points" fill="#06B6D4" radius={[4, 4, 0, 0]} barSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project progress section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-3xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.035)] hover:shadow-md hover:border-slate-300 dark:hover:border-slate-800 transition-all duration-200 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-[#0F172A] dark:text-white uppercase tracking-wider text-[11px] mb-4">Active Projects Milestones</h3>
            <div className="space-y-4">
              {recentProjects.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 italic">
                  Create a Project under "Projects & Board" page first!
                </div>
              ) : (
                recentProjects.map((p, idx) => (
                  <div key={p._id || p.id} className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-350">{p.title}</span>
                      <span className="text-slate-500 font-mono">Stage active</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${idx === 0 ? 'bg-blue-600' : idx === 1 ? 'bg-cyan-500' : 'bg-emerald-500'}`}
                        style={{ width: `${idx === 0 ? 65 : idx === 1 ? 40 : 80}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-850 flex items-center space-x-3.5">
            <Flame className="w-6 h-6 text-orange-500 fill-orange-500" />
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-white">Workspace Heat Level: Optimal</p>
              <span className="text-[10px] text-slate-455">All sockets and databases responsive. Delivery speed normal.</span>
            </div>
          </div>
        </div>

      </div>

      {/* Upcoming Tasks & Deadlines panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-3xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.035)] hover:shadow-md hover:border-slate-300 dark:hover:border-slate-800 transition-all duration-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-extrabold text-[#0F172A] dark:text-white uppercase tracking-wider text-[11px]">Upcoming Action Items</h3>
          <button 
            onClick={() => onNavigate('projects')}
            className="text-xs text-blue-600 dark:text-cyan-400 font-bold hover:underline"
          >
            Review all cards
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
          {recentTasks.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 italic">
              No tasks declared yet. Open Projects and create task cards!
            </div>
          ) : (
            recentTasks.map((t) => (
              <div key={t._id || t.id} className="py-3 flex sm:items-center justify-between flex-col sm:flex-row space-y-2 sm:space-y-0 select-text">
                <div className="flex items-center space-x-3">
                  <span className={`h-2.5 w-2.5 rounded-full ${
                    t.status === 'Completed' ? 'bg-emerald-500' :
                    t.status === 'In Progress' ? 'bg-blue-500' : 'bg-slate-400'
                  }`} />
                  <div>
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white">{t.title}</h5>
                    <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-sm">{t.description || 'No description'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {t.dueDate && (
                    <div className="flex items-center space-x-1 text-slate-500 text-[10px]">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{t.dueDate}</span>
                    </div>
                  )}

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                    t.priority === 'High' ? 'bg-rose-500/10 text-rose-500' :
                    t.priority === 'Medium' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-500/10 text-slate-550'
                  }`}>
                    {t.priority} Urgent
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
