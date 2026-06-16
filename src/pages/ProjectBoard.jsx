import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  FolderOpen, Plus, Calendar, Shield, Trash, UserPlus, Users, Edit2, 
  ChevronRight, ArrowRight, CornerDownRight, CheckSquare, Paperclip, 
  MessageSquare, User as UserIcon, Send, Search, Filter, Trash2, X, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

const KANBAN_COLUMNS = ['Backlog', 'To Do', 'In Progress', 'Review', 'Completed'];

export default function ProjectBoard({ globalSearchQuery }) {
  const { user, socket } = useAuth();
  
  // Projects states
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectMembers, setProjectMembers] = useState([]);
  const [allUsersList, setAllUsersList] = useState([]);
  
  // Tasks states
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  
  // Comments states
  const [comments, setComments] = useState([]);
  const [newCommentMsg, setNewCommentMsg] = useState('');
  const [typingUser, setTypingUser] = useState(null);
  
  // Form panels toggles
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [commentEditId, setCommentEditId] = useState(null);

  // Filters state
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterUser, setFilterUser] = useState('All');
  const [filterSearch, setFilterSearch] = useState('');

  // Draft project states
  const [draftProject, setDraftProject] = useState({ title: '', description: '', dueDate: '', members: [] });
  // Draft task states
  const [draftTask, setDraftTask] = useState({ title: '', description: '', priority: 'Medium', status: 'To Do', dueDate: '', assignedTo: '', attachments: '' });

  // Refs for typing debounce
  const typingTimeoutRef = useRef(null);

  // 1. Fetch Users List
  const fetchAllUsers = async () => {
    try {
      const res = await fetch('/api/auth/users');
      if (res.ok) {
        const data = await res.json();
        setAllUsersList(data);
      }
    } catch (err) {
      console.log('Error fetching team list:', err);
    }
  };

  // 2. Fetch Projects List
  const fetchProjects = async (autoSelectId = null) => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        if (data.length > 0) {
          if (autoSelectId) {
            const found = data.find(p => p._id === autoSelectId || p.id === autoSelectId);
            setSelectedProject(found || data[0]);
          } else if (!selectedProject) {
            setSelectedProject(data[0]);
          } else {
            // Update selected project structure
            const currentSelected = data.find(p => p._id === selectedProject._id || p.id === selectedProject.id);
            if (currentSelected) setSelectedProject(currentSelected);
          }
        } else {
          setSelectedProject(null);
        }
      }
    } catch (err) {
      console.log('Error fetching projects:', err);
    }
  };

  // 3. Fetch Tasks on selected project
  const fetchTasks = async () => {
    if (!selectedProject) return;
    try {
      const projectId = selectedProject._id || selectedProject.id;
      const res = await fetch(`/api/tasks?project=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.log('Error fetching tasks:', err);
    }
  };

  // On Mount
  useEffect(() => {
    fetchAllUsers();
    fetchProjects();
  }, []);

  // Sync tasks when project changes
  useEffect(() => {
    if (selectedProject) {
      fetchTasks();
      // Join project room on Socket
      if (socket) {
        const pId = selectedProject._id || selectedProject.id;
        socket.emit('project:join', pId);
      }
    }
    return () => {
      // Leave project room
      if (socket && selectedProject) {
        const pId = selectedProject._id || selectedProject.id;
        socket.emit('project:leave', pId);
      }
    };
  }, [selectedProject, socket]);

  // Handle Socket events
  useEffect(() => {
    if (!socket) return;

    socket.on('task:created', (newTask) => {
      setTasks(prev => {
        // Prevent dupes
        if (prev.some(t => t._id === newTask._id || t.id === newTask.id)) return prev;
        return [...prev, newTask];
      });
    });

    socket.on('task:updated', (updatedTask) => {
      setTasks(prev => prev.map(t => (t._id === updatedTask._id || t.id === updatedTask.id) ? updatedTask : t));
      // update details modal if open
      setSelectedTask(current => {
        if (current && (current._id === updatedTask._id || current.id === updatedTask._id)) {
          return updatedTask;
        }
        return current;
      });
    });

    socket.on('task:deleted', (deletedId) => {
      setTasks(prev => prev.filter(t => t._id !== deletedId && t.id !== deletedId));
      setSelectedTask(current => {
        if (current && (current._id === deletedId || current.id === deletedId)) {
          toast.error('This task was deleted by another member');
          return null;
        }
        return current;
      });
    });

    socket.on('comment:created', (newComment) => {
      setComments(prev => {
        if (prev.some(c => c._id === newComment._id || c.id === newComment.id)) return prev;
        return [...prev, newComment];
      });
    });

    socket.on('task:typing_start', ({ name }) => {
      setTypingUser(name);
    });

    socket.on('task:typing_stop', () => {
      setTypingUser(null);
    });

    socket.on('project:updated_globally', () => {
      fetchProjects();
    });

    return () => {
      socket.off('task:created');
      socket.off('task:updated');
      socket.off('task:deleted');
      socket.off('comment:created');
      socket.off('task:typing_start');
      socket.off('task:typing_stop');
      socket.off('project:updated_globally');
    };
  }, [socket, selectedProject]);

  // Fetch comments when task selected
  useEffect(() => {
    const fetchComments = async () => {
      if (!selectedTask) return;
      try {
        const taskId = selectedTask._id || selectedTask.id;
        const res = await fetch(`/api/comments?task=${taskId}`);
        if (res.ok) {
          const data = await res.json();
          setComments(data);
        }
        
        // Notify socket of join task
        if (socket) {
          socket.emit('task:join', taskId);
        }
      } catch (err) {
        console.log(err);
      }
    };

    fetchComments();

    return () => {
      if (socket && selectedTask) {
        const taskId = selectedTask._id || selectedTask.id;
        socket.emit('task:leave', taskId);
      }
    };
  }, [selectedTask, socket]);

  // Apply filters (priority, user, search, and globalSearchQuery)
  useEffect(() => {
    let result = [...tasks];

    if (filterPriority !== 'All') {
      result = result.filter(t => t.priority === filterPriority);
    }

    if (filterUser !== 'All') {
      result = result.filter(t => t.assignedTo?._id === filterUser || t.assignedTo?.id === filterUser || t.assignedTo === filterUser);
    }

    // Local filters text search
    const textSearch = (filterSearch || '').toLowerCase();
    if (textSearch) {
      result = result.filter(t => 
        (t.title && t.title.toLowerCase().includes(textSearch)) ||
        (t.description && t.description.toLowerCase().includes(textSearch))
      );
    }

    // Global navigation header search
    const globalSearch = (globalSearchQuery || '').toLowerCase();
    if (globalSearch) {
      result = result.filter(t => 
        (t.title && t.title.toLowerCase().includes(globalSearch)) ||
        (t.description && t.description.toLowerCase().includes(globalSearch))
      );
    }

    setFilteredTasks(result);
  }, [tasks, filterPriority, filterUser, filterSearch, globalSearchQuery]);

  // Project functions
  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!draftProject.title) return;
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draftProject)
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Project "${data.title}" established successfully!`);
        setProjectModalOpen(false);
        setDraftProject({ title: '', description: '', dueDate: '', members: [] });
        fetchProjects(data._id);
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error('Failed to create project');
    }
  };

  const handleDeleteProject = async (pId, pTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${pTitle}"? All task cards will be lost.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/projects/${pId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Project deleted successfully');
        fetchProjects();
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Failed to delete project');
      }
    } catch (err) {
      toast.error('Deletion request failed');
    }
  };

  // Invite member
  const handleInviteUser = async (e) => {
    e.preventDefault();
    const candidateId = draftProject.members[0]; // reuse draft selection
    if (!candidateId || !selectedProject) return;

    try {
      const pId = selectedProject._id || selectedProject.id;
      const res = await fetch('/api/projects/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: pId, userId: candidateId })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Member assigned to board!');
        setInviteModalOpen(false);
        fetchProjects(pId);
      } else {
        toast.error(data.error || 'User invite failed');
      }
    } catch (err) {
      console.log(err);
    }
  };

  // Task Card Functions
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!draftTask.title || !selectedProject) return;

    try {
      const pId = selectedProject._id || selectedProject.id;
      const attachmentsArray = draftTask.attachments ? [draftTask.attachments] : [];
      
      const payload = {
        title: draftTask.title,
        description: draftTask.description,
        project: pId,
        priority: draftTask.priority,
        status: draftTask.status,
        dueDate: draftTask.dueDate,
        assignedTo: draftTask.assignedTo || null,
        attachments: attachmentsArray
      };

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        toast.success('New Kanban card published!');
        setTaskModalOpen(false);
        
        // Reset state
        setDraftTask({ 
          title: '', description: '', priority: 'Medium', 
          status: 'To Do', dueDate: '', assignedTo: '', attachments: '' 
        });
        fetchTasks();
      } else {
        const d = await res.json();
        toast.error(d.error);
      }
    } catch (err) {
      console.log(err);
    }
  };

  // Move Column Trigger (Used for click interaction style too)
  const handleMoveColumn = async (taskObj, targetStatus) => {
    const tId = taskObj._id || taskObj.id;
    try {
      const res = await fetch(`/api/tasks/${tId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus })
      });
      if (res.ok) {
        fetchTasks();
      }
    } catch (err) {
      console.log(err);
    }
  };

  // Delete Card
  const handleDeleteTask = async (tId) => {
    if (!window.confirm('Delete this card elements permanently?')) return;
    try {
      const res = await fetch(`/api/tasks/${tId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Card removed from kanban board');
        setSelectedTask(null);
        fetchTasks();
      }
    } catch (err) {
      console.log(err);
    }
  };

  // Post comments & keystrokes typing simulation
  const handleCommentTyping = () => {
    if (!socket || !selectedTask) return;
    const tId = selectedTask._id || selectedTask.id;
    socket.emit('task:typing_start', { name: user.name, taskId: tId });
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('task:typing_stop', { taskId: tId });
    }, 1500);
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newCommentMsg || !selectedTask) return;

    try {
      const tId = selectedTask._id || selectedTask.id;
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: tId, message: newCommentMsg })
      });
      if (res.ok) {
        setNewCommentMsg('');
        if (socket) {
          socket.emit('task:typing_stop', { taskId: tId });
        }
        // reload task comments
        const commRes = await fetch(`/api/comments?task=${tId}`);
        if (commRes.ok) {
          const d = await commRes.json();
          setComments(d);
        }
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleDeleteComment = async (cId) => {
    try {
      const res = await fetch(`/api/comments/${cId}`, { method: 'DELETE' });
      if (res.ok) {
        setComments(prev => prev.filter(c => c._id !== cId));
        toast.success('Comment removed');
      }
    } catch (err) {
      console.log(err);
    }
  };

  // Collect project members
  const activeMembersList = selectedProject ? [selectedProject.owner, ...(selectedProject.members || [])].filter(Boolean) : [];

  return (
    <div className="space-y-6">
      
      {/* Top Projects Selection Panel Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-4.5 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 select-none shadow-[0_4px_24px_-4px_rgba(0,0,0,0.02)]">
        
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <FolderOpen className="text-[#2563EB] dark:text-cyan-400 w-5 h-5 flex-shrink-0" />
          <div className="text-xs font-black uppercase tracking-wider text-slate-500 mr-2">Active Board:</div>
          
          <select
            value={selectedProject ? (selectedProject._id || selectedProject.id) : ''}
            onChange={(e) => {
              const found = projects.find(p => p._id === e.target.value || p.id === e.target.value);
              setSelectedProject(found);
            }}
            className="p-2 border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white rounded-xl focus:outline-none min-w-48 max-w-sm cursor-pointer truncate"
          >
            {projects.length === 0 ? (
              <option value="">No Active Projects</option>
            ) : (
              projects.map(p => (
                <option key={p._id || p.id} value={p._id || p.id}>{p.title}</option>
              ))
            )}
          </select>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
          {/* Action trigger tags */}
          {user?.role === 'Admin' && (
            <button
              onClick={() => setProjectModalOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2.5 border border-[#2563EB]/10 bg-[#2563EB]/5 hover:bg-[#2563EB]/10 text-[#2563EB] dark:text-blue-400 text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </button>
          )}

          {selectedProject && (
            <>
              {/* Member Assignee addition */}
              <button
                onClick={() => setInviteModalOpen(true)}
                className="flex items-center space-x-1.5 px-3.5 py-2.5 border border-cyan-500/10 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95"
              >
                <UserPlus className="w-4 h-4" />
                <span>Invite Member</span>
              </button>

              {/* Delete Project */}
              {user?.role === 'Admin' && (
                <button
                  onClick={() => handleDeleteProject(selectedProject._id || selectedProject.id, selectedProject.title)}
                  className="p-2.5 text-rose-500 bg-rose-500/5 border border-rose-500/10 hover:bg-rose-500/15 rounded-xl transition-all cursor-pointer active:scale-95"
                  title="Delete project"
                >
                  <Trash className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>

      </div>

      {/* Selected Project Info Header */}
      {selectedProject ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 border-l-4 border-l-[#2563EB] dark:border-l-cyan-500 p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.035)]">
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-[#0F172A] dark:text-white leading-tight tracking-tight">{selectedProject.title}</h2>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed font-medium">{selectedProject.description || 'No description designated'}</p>
            <div className="flex flex-wrap items-center gap-2.5 font-mono text-[10px] text-slate-500 pt-1">
              <Calendar className="w-3.5 h-3.5 text-[#2563EB] dark:text-cyan-400" />
              <span className="font-bold">Deadline: {selectedProject.dueDate || 'No Date'}</span>
              <span className="text-slate-300 dark:text-slate-800">&bull;</span>
              <span className="text-[#2563EB] dark:text-cyan-400 font-extrabold bg-[#2563EB]/10 dark:bg-cyan-400/20 px-2 py-0.5 rounded tracking-wide uppercase">Owner: {selectedProject.owner?.name}</span>
            </div>
          </div>

          {/* Members bubble cluster */}
          <div className="flex items-center space-x-1 flex-shrink-0">
            <div className="flex -space-x-2 overflow-hidden">
              {activeMembersList.map((m, mIdx) => (
                <div 
                  key={mIdx} 
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-center flex items-center justify-center border border-slate-200 dark:border-slate-700 select-none cursor-help text-slate-700 dark:text-slate-300"
                  title={`${m.name} (${m.role})`}
                >
                  {m.name ? m.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : 'EX'}
                </div>
              ))}
            </div>
            <span className="text-[11px] text-slate-450 font-bold pl-2">({activeMembersList.length} members)</span>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-2xl border border-dashed border-slate-250 dark:border-slate-800">
          <FolderOpen className="text-slate-400 mx-auto w-12 h-12 mb-4" />
          <h3 className="text-lg font-bold">No projects assigned yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">Please select or register a new project board in order to publish cards and comment on tasks.</p>
        </div>
      )}

      {/* FILTER & CONTROL BAR PANEL */}
      {selectedProject && (
        <div className="bg-slate-100/40 dark:bg-slate-900/15 border border-slate-200 dark:border-slate-850 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 select-none">
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Priority Filter */}
            <div className="flex items-center space-x-2 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-450" />
              <span className="font-semibold text-slate-500">Priority:</span>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="p-1.5 border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold rounded-lg focus:outline-none"
              >
                <option value="All">All Priorities</option>
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>

            {/* User Filter */}
            <div className="flex items-center space-x-2 text-xs">
              <span className="font-semibold text-slate-500">Assignee:</span>
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="p-1.5 border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold rounded-lg focus:outline-none max-w-36"
              >
                <option value="All">All Users</option>
                {activeMembersList.map(u => (
                  <option key={u._id || u.id} value={u._id || u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            {/* Local Card Search */}
            <div className="relative">
              <Search className="h-3.5 h-3.5 text-slate-450 absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                placeholder="Search board cards..."
                className="pl-8 pr-3 py-1.5 border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs rounded-xl focus:outline-none w-44"
              />
            </div>

          </div>

          <button
            onClick={() => {
              if (!selectedProject) return toast.error('No project board selected');
              setTaskModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 cursor-pointer active:scale-95 transition-all w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Card</span>
          </button>
        </div>
      )}

      {/* KANBAN BOARD SYSTEM */}
      {selectedProject && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4 items-start select-none">
          {KANBAN_COLUMNS.map((colName) => {
            const columnTasks = filteredTasks.filter(t => t.status === colName);
            
            return (
              <div 
                key={colName}
                id={`kanban-col-${colName.replace(' ', '-')}`}
                className="bg-slate-100/60 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-850 p-4 rounded-3xl flex flex-col space-y-4 shadow-[0_2px_12px_rgba(0,0,0,0.01)]"
              >
                
                {/* Column header title */}
                <div className="flex items-center justify-between border-b border-slate-210 dark:border-slate-800 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${
                      colName === 'Backlog' ? 'bg-slate-400' :
                      colName === 'To Do' ? 'bg-blue-500' :
                      colName === 'In Progress' ? 'bg-cyan-500' :
                      colName === 'Review' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                    <span className="font-bold text-xs tracking-wider text-slate-800 dark:text-slate-250 uppercase">{colName}</span>
                  </div>
                  <span className="font-mono text-xs bg-slate-205 dark:bg-slate-950 text-slate-500 px-2 py-0.5 rounded font-bold">
                    {columnTasks.length}
                  </span>
                </div>

                {/* Column content - cards container list */}
                <div className="space-y-3 min-h-[350px]">
                  {columnTasks.length === 0 ? (
                    <div className="p-4 border border-dashed border-slate-200 dark:border-slate-800/40 rounded-xl text-center text-[10px] text-slate-400 italic">
                      Empty Lane
                    </div>
                  ) : (
                    columnTasks.map((tk) => (
                      <div
                        key={tk._id || tk.id}
                        id={`task-card-${tk._id || tk.id}`}
                        onClick={() => setSelectedTask(tk)}
                        className="bg-white dark:bg-slate-955 border border-slate-200/80 dark:border-slate-800/60 p-4.5 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all duration-200 hover:border-[#2563EB]/40 flex flex-col space-y-3.5 select-text"
                      >
                        
                        <div className="flex justify-between items-start gap-1">
                          <h4 className="font-bold text-xs leading-tight text-slate-900 dark:text-white">{tk.title}</h4>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                            tk.priority === 'High' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                            tk.priority === 'Medium' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                            'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}>
                            {tk.priority}
                          </span>
                        </div>

                        {tk.description && (
                          <p className="text-[10px] text-slate-500 pr-1 truncate break-all line-clamp-2 leading-relaxed">
                            {tk.description}
                          </p>
                        )}

                        {tk.dueDate && (
                          <div className="flex items-center space-x-1 text-slate-450 text-[10px] font-mono">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{tk.dueDate}</span>
                          </div>
                        )}

                        {/* Assignee & comments/clip counts */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-850">
                          
                          <div className="flex items-center space-x-1.5" title="Assignee name">
                            <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-[9px] font-bold">
                              {tk.assignedTo?.name ? tk.assignedTo.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : '?'}
                            </div>
                            <span className="text-[10px] font-medium text-slate-500 truncate max-w-16">
                              {tk.assignedTo?.name || 'Unassigned'}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                            {tk.attachments && tk.attachments.length > 0 && (
                              <div className="flex items-center space-x-0.5" title="Attached links">
                                <Paperclip className="w-3 h-3" />
                                <span>{tk.attachments.length}</span>
                              </div>
                            )}

                            <div className="flex items-center space-x-0.5" title="Flow lane actions">
                              <MessageSquare className="w-3 h-3" />
                              <span>Card detail</span>
                            </div>
                          </div>

                        </div>

                        {/* Lane Quick Movers Buttons (Outstanding mobile accessibility support!) */}
                        <div className="flex items-center justify-end space-x-1 pt-1.5 border-t border-dotted border-slate-105 dark:border-slate-850 gap-0.5 select-none md:opacity-0 hover:opacity-100 transition-opacity">
                          <span className="text-[9px] text-slate-400 mr-1.5">Move:</span>
                          {KANBAN_COLUMNS.filter(c => c !== colName).map(otherCol => (
                            <button
                              key={otherCol}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveColumn(tk, otherCol);
                              }}
                              className="text-[9px] hover:text-white hover:bg-blue-600 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1.5 px-2 rounded-md active:scale-90 font-bold"
                            >
                              {otherCol}
                            </button>
                          ))}
                        </div>

                      </div>
                    ))
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* 1. PROJECT CREATION MODAL OVERLAY */}
      {projectModalOpen && (
        <div id="project-modal" className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setProjectModalOpen(false)} />
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl w-full max-w-md relative z-10 shadow-2xl">
            <h3 className="font-extrabold text-base mb-4 text-slate-900 dark:text-white">Create Workspace Project</h3>
            
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Project Title</label>
                <input
                  type="text"
                  required
                  value={draftProject.title}
                  onChange={(e) => setDraftProject({ ...draftProject, title: e.target.value })}
                  placeholder="e.g. Website Redesign"
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Description</label>
                <textarea
                  value={draftProject.description}
                  onChange={(e) => setDraftProject({ ...draftProject, description: e.target.value })}
                  placeholder="Specify board scope and parameters..."
                  rows="3"
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Target Due Date</label>
                <input
                  type="date"
                  value={draftProject.dueDate}
                  onChange={(e) => setDraftProject({ ...draftProject, dueDate: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Onboard Initial Member</label>
                <select
                  onChange={(e) => setDraftProject({ ...draftProject, members: e.target.value ? [e.target.value] : [] })}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose team mate...</option>
                  {allUsersList.filter(u => u._id !== user.id).map(u => (
                    <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setProjectModalOpen(false)}
                  className="w-1/2 py-2.5 text-xs font-bold rounded-xl border border-slate-250 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl"
                >
                  Establish Board
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. TASK / CARD PUBLISHING OVERLAY */}
      {taskModalOpen && (
        <div id="task-modal" className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setTaskModalOpen(false)} />
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl w-full max-w-md relative z-10 shadow-2xl">
            <h3 className="font-extrabold text-base mb-4 text-slate-900 dark:text-white">Create Kanban Action Card</h3>
            
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Task Title</label>
                <input
                  type="text"
                  required
                  value={draftTask.title}
                  onChange={(e) => setDraftTask({ ...draftTask, title: e.target.value })}
                  placeholder="e.g. Audit security keys router"
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Description details</label>
                <textarea
                  value={draftTask.description}
                  onChange={(e) => setDraftTask({ ...draftTask, description: e.target.value })}
                  placeholder="Task scope details..."
                  rows="2"
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Priority</label>
                  <select
                    value={draftTask.priority}
                    onChange={(e) => setDraftTask({ ...draftTask, priority: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Urgency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Initial Status</label>
                  <select
                    value={draftTask.status}
                    onChange={(e) => setDraftTask({ ...draftTask, status: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-blue-500"
                  >
                    {KANBAN_COLUMNS.map((colName) => (
                      <option key={colName} value={colName}>{colName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Due Date</label>
                  <input
                    type="date"
                    value={draftTask.dueDate}
                    onChange={(e) => setDraftTask({ ...draftTask, dueDate: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Assign User</label>
                  <select
                    value={draftTask.assignedTo}
                    onChange={(e) => setDraftTask({ ...draftTask, assignedTo: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose assignee...</option>
                    {activeMembersList.map((m) => (
                      <option key={m._id || m.id} value={m._id || m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Attachment Web Link (URL)</label>
                <input
                  type="url"
                  value={draftTask.attachments}
                  onChange={(e) => setDraftTask({ ...draftTask, attachments: e.target.value })}
                  placeholder="https://drive.google.com/redesign-file"
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none"
                />
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setTaskModalOpen(false)}
                  className="w-1/2 py-2.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl"
                >
                  Publish Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. INVITE MEMBER MODAL OVERLAY */}
      {inviteModalOpen && (
        <div id="invite-modal" className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setInviteModalOpen(false)} />
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl w-full max-w-md relative z-10 shadow-2xl">
            <h3 className="font-extrabold text-base mb-2 text-slate-900 dark:text-white">Onboard Team Mate to Board</h3>
            <p className="text-xs text-slate-500 mb-4">Board members receive instant notifications whenever task cards get status-changed, created, or discussion comments get posted.</p>
            
            <form onSubmit={handleInviteUser} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Select Member from Directory</label>
                <select
                  required
                  onChange={(e) => setDraftProject({ ...draftProject, members: [e.target.value] })}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose team mate...</option>
                  {allUsersList
                    .filter(u => u._id !== user.id && !activeMembersList.some(m => m._id === u._id || m.id === u._id))
                    .map(u => (
                      <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                    ))
                  }
                </select>
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="w-1/2 py-2.5 text-xs font-bold rounded-xl border border-slate-205 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl whitespace-nowrap"
                >
                  Invite to Board
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. DETAILS CARD VIEW POPUP (INCLUDING COMMENTS TIMELINE & TYPING INDICATOR) */}
      {selectedTask && (
        <div id="detail-modal" className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm" onClick={() => setSelectedTask(null)} />
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl relative z-10 shadow-2xl h-[90vh] flex flex-col">
            
            {/* Modal sticky top header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-850 flex items-center justify-between flex-shrink-0">
              <div className="space-y-1">
                <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded">
                  LANES: {selectedTask.status}
                </span>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">{selectedTask.title}</h3>
              </div>
              
              <button 
                onClick={() => setSelectedTask(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal scrollable body scroll segments */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* Task descriptions/attributes */}
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-955 rounded-xl border border-slate-200 dark:border-slate-850 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[10px] text-slate-450 uppercase font-bold">Assignee</span>
                    <span className="font-bold text-slate-850 dark:text-slate-300">{selectedTask.assignedTo?.name || 'Unassigned'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-450 uppercase font-bold">Priority Card</span>
                    <span className="font-bold text-slate-850 dark:text-slate-300">{selectedTask.priority} priority</span>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="block text-[10px] text-slate-455 uppercase font-bold mb-1">Details Context</span>
                  <p className="text-slate-650 dark:text-slate-350 leading-relaxed font-semibold">
                    {selectedTask.description || 'No detailed specifications designated.'}
                  </p>
                </div>

                {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                  <div className="pt-2 border-t border-slate-210 dark:border-slate-850 mt-2">
                    <span className="block text-[10px] text-slate-450 uppercase font-bold mb-2">Attached Asset Link</span>
                    {selectedTask.attachments.map((link, lIdx) => (
                      <a 
                        key={lIdx} 
                        href={link} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1.5 text-[11px] text-blue-600 dark:text-cyan-400 hover:underline hover:text-cyan-300 font-bold break-all"
                      >
                        <Paperclip className="w-3 h-3 flex-shrink-0" />
                        <span>{link}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Comments stream panel wrapper */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-105 dark:border-slate-850 pb-2">
                  <h4 className="font-bold text-xs uppercase tracking-wide text-slate-500">Task Discussion & Activity</h4>
                  <span className="text-[10px] bg-slate-205 dark:bg-slate-950 font-mono text-slate-450 px-2 py-0.5 rounded">
                    {comments.length} Comments
                  </span>
                </div>

                {/* Live Comments History Timeline */}
                <div className="space-y-4 max-h-56 overflow-y-auto pr-1">
                  {comments.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-500 italic">
                      No discussions started yet. Mention user with @ to notify them!
                    </div>
                  ) : (
                    comments.map((c) => (
                      <div key={c._id || c.id} className="text-xs flex items-start space-x-3 select-text">
                        <div className="h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center text-white font-extrabold text-[9px] flex-shrink-0 mt-0.5">
                          {c.user?.name ? c.user.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : '?'}
                        </div>
                        <div className="flex-1 bg-slate-100/60 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl p-3 space-y-1">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold text-slate-905 dark:text-white capitalize">{c.user?.name}</span>
                            <div className="flex items-center space-x-2 text-[9px] text-slate-450 font-mono">
                              <span>{new Date(c.createdAt).toLocaleDateString([], {month:'short', day:'numeric'})} {new Date(c.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                              {(user.role === 'Admin' || c.user?._id === user.id) && (
                                <button 
                                  onClick={() => handleDeleteComment(c._id || c.id)}
                                  className="text-rose-500 hover:underline active:scale-90"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                          
                          {/* Parse and highlight mentions in message body */}
                          <p className="text-slate-700 dark:text-slate-350 leading-relaxed break-words pr-2">
                            {c.message.split(' ').map((word, wIdx) => {
                              if (word.startsWith('@')) {
                                return <span key={wIdx} className="text-blue-600 dark:text-cyan-400 font-bold">{word} </span>;
                              }
                              return word + ' ';
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Real-time Typing Status Indicator */}
                {typingUser && (
                  <div className="text-[10px] text-cyan-500 font-bold italic animate-pulse flex items-center space-x-1.5 select-none">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-ping" />
                    <span>{typingUser} is typing comments now...</span>
                  </div>
                )}

              </div>
            </div>

            {/* Modal bottom input chat footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 flex-shrink-0 rounded-b-2xl">
              <form onSubmit={handlePostComment} className="flex items-center space-x-2">
                <input
                  type="text"
                  required
                  value={newCommentMsg}
                  onChange={(e) => {
                    setNewCommentMsg(e.target.value);
                    handleCommentTyping();
                  }}
                  placeholder="Post comment... Try mentioning names (e.g. @john)"
                  className="flex-1 p-2.5 border border-slate-300 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow active:scale-95 transition-all text-center flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <div className="mt-1.5 text-[9px] text-slate-500 text-center select-none">
                Comments and typing states synchronized live using Server Web Sockets.
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
