import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const useMongoDB = !!process.env.MONGODB_URI;
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const demoPasswordHash = bcrypt.hashSync('password123', 10);

// Initialize local JSON DB structure
const initialData = {
  users: [
    {
      _id: 'admin_user_seed_id_99',
      id: 'admin_user_seed_id_99',
      name: 'Admin User',
      email: 'admin@managetasks.com',
      password: demoPasswordHash,
      role: 'Admin',
      createdAt: new Date().toISOString()
    },
    {
      _id: 'member_user_seed_id_88',
      id: 'member_user_seed_id_88',
      name: 'Member User',
      email: 'member@managetasks.com',
      password: demoPasswordHash,
      role: 'Member',
      createdAt: new Date().toISOString()
    }
  ],
  projects: [],
  tasks: [],
  comments: [],
  notifications: []
};

// Ensure direct connection or local directory setup
if (useMongoDB) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB: Connected successfully via Mongoose'))
    .catch((err) => {
      console.error('MongoDB: Connection failed, using Local JSON DB backup.', err);
    });
} else {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
  }
  console.log('Using Local JSON DB Store at:', DB_FILE);
}

// Helpers for read/write JSON file
function readLocalDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      return initialData;
    }
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content || JSON.stringify(initialData));
  } catch (err) {
    console.error('Error reading JSON DB file:', err);
    return initialData;
  }
}

function writeLocalDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing JSON DB file:', err);
  }
}

// Custom Id Generator
function generateId() {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

// Real MongoDB Schemas
let UserModel, ProjectModel, TaskModel, CommentModel, NotificationModel;

if (useMongoDB) {
  const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String, default: '' },
    role: { type: String, enum: ['Admin', 'Member'], default: 'Member' }
  }, { timestamps: true });

  const ProjectSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    dueDate: { type: String },
    status: { type: String, default: 'active' } // active, archived
  }, { timestamps: true });

  const TaskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
    status: { type: String, enum: ['Backlog', 'To Do', 'In Progress', 'Review', 'Completed'], default: 'To Do' },
    dueDate: { type: String },
    attachments: [{ type: String }]
  }, { timestamps: true });

  const CommentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    message: { type: String, required: true }
  }, { timestamps: true });

  const NotificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    type: { type: String, required: true },
    read: { type: Boolean, default: false }
  }, { timestamps: true });

  UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
  ProjectModel = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
  TaskModel = mongoose.models.Task || mongoose.model('Task', TaskSchema);
  CommentModel = mongoose.models.Comment || mongoose.model('Comment', CommentSchema);
  NotificationModel = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
}

// Unified Database CRUD API Interface
const db = {
  isMongoDB: useMongoDB,

  users: {
    find: async (query = {}) => {
      if (useMongoDB) {
        return UserModel.find(query).lean();
      }
      const data = readLocalDB();
      return data.users.filter(u => {
        for (const key in query) {
          if (u[key] !== query[key]) return false;
        }
        return true;
      });
    },
    findOne: async (query = {}) => {
      if (useMongoDB) {
        return UserModel.findOne(query).lean();
      }
      const data = readLocalDB();
      const user = data.users.find(u => {
        for (const key in query) {
          if (u[key] !== query[key]) return false;
        }
        return true;
      });
      return user || null;
    },
    findById: async (id) => {
      if (useMongoDB) {
        return UserModel.findById(id).lean();
      }
      const data = readLocalDB();
      const user = data.users.find(u => u._id === id || u.id === id);
      if (user && !user._id) user._id = user.id;
      return user || null;
    },
    create: async (doc) => {
      if (useMongoDB) {
        return (await UserModel.create(doc)).toObject();
      }
      const data = readLocalDB();
      const id = generateId();
      const newUser = { _id: id, id, ...doc, createdAt: new Date().toISOString() };
      data.users.push(newUser);
      writeLocalDB(data);
      return newUser;
    },
    findByIdAndUpdate: async (id, update) => {
      if (useMongoDB) {
        return UserModel.findByIdAndUpdate(id, update, { new: true }).lean();
      }
      const data = readLocalDB();
      const userIdx = data.users.findIndex(u => u._id === id || u.id === id);
      if (userIdx !== -1) {
        data.users[userIdx] = { ...data.users[userIdx], ...update, updatedAt: new Date().toISOString() };
        writeLocalDB(data);
        return data.users[userIdx];
      }
      return null;
    }
  },

  projects: {
    find: async (query = {}) => {
      if (useMongoDB) {
        return ProjectModel.find(query).populate('owner', 'name email avatar role').populate('members', 'name email avatar role').lean();
      }
      const data = readLocalDB();
      const projects = data.projects.filter(p => {
        for (const key in query) {
          if (key === 'members' && Array.isArray(p.members)) {
            if (!p.members.includes(query.members)) return false;
          } else if (p[key] !== query[key]) {
            return false;
          }
        }
        return true;
      });

      // Populate Owner & Members
      return projects.map(p => {
        const ownerInfo = data.users.find(u => u._id === p.owner) || { name: 'Unknown', email: '' };
        const memberInfos = (p.members || []).map(mId => data.users.find(u => u._id === mId)).filter(Boolean);
        return {
          ...p,
          _id: p._id || p.id,
          owner: { _id: p.owner, id: p.owner, ...ownerInfo },
          members: memberInfos.map(m => ({ _id: m._id, id: m._id, ...m }))
        };
      });
    },
    findById: async (id) => {
      if (useMongoDB) {
        return ProjectModel.findById(id).populate('owner', 'name email avatar role').populate('members', 'name email avatar role').lean();
      }
      const data = readLocalDB();
      const project = data.projects.find(p => p._id === id || p.id === id);
      if (!project) return null;
      const ownerInfo = data.users.find(u => u._id === project.owner) || { name: 'Unknown', email: '' };
      const memberInfos = (project.members || []).map(mId => data.users.find(u => u._id === mId)).filter(Boolean);
      return {
        ...project,
        _id: project._id || project.id,
        owner: { _id: project.owner, id: project.owner, ...ownerInfo },
        members: memberInfos.map(m => ({ _id: m._id, id: m._id, ...m }))
      };
    },
    create: async (doc) => {
      if (useMongoDB) {
        return (await ProjectModel.create(doc)).toObject();
      }
      const data = readLocalDB();
      const id = generateId();
      const newProject = { _id: id, id, members: [], status: 'active', ...doc, createdAt: new Date().toISOString() };
      data.projects.push(newProject);
      writeLocalDB(data);
      return newProject;
    },
    findByIdAndUpdate: async (id, update) => {
      if (useMongoDB) {
        return ProjectModel.findByIdAndUpdate(id, update, { new: true }).populate('owner', 'name email avatar role').populate('members', 'name email avatar role').lean();
      }
      const data = readLocalDB();
      const pIdx = data.projects.findIndex(p => p._id === id || p.id === id);
      if (pIdx !== -1) {
        // Handle array updates if specified
        let merged = { ...data.projects[pIdx] };
        if (update.$push && update.$push.members) {
          merged.members = merged.members || [];
          if (!merged.members.includes(update.$push.members)) {
            merged.members.push(update.$push.members);
          }
        } else if (update.$pull && update.$pull.members) {
          merged.members = merged.members || [];
          merged.members = merged.members.filter(m => m !== update.$pull.members);
        } else {
          merged = { ...merged, ...update };
        }
        
        // Remove operators
        delete merged.$push;
        delete merged.$pull;

        data.projects[pIdx] = { ...merged, updatedAt: new Date().toISOString() };
        writeLocalDB(data);
        return db.projects.findById(id);
      }
      return null;
    },
    findByIdAndDelete: async (id) => {
      if (useMongoDB) {
        return ProjectModel.findByIdAndDelete(id).lean();
      }
      const data = readLocalDB();
      data.projects = data.projects.filter(p => p._id !== id && p.id !== id);
      data.tasks = data.tasks.filter(t => t.project !== id);
      writeLocalDB(data);
      return { success: true };
    }
  },

  tasks: {
    find: async (query = {}) => {
      if (useMongoDB) {
        return TaskModel.find(query).populate('assignedTo', 'name email avatar role').lean();
      }
      const data = readLocalDB();
      const tasks = data.tasks.filter(t => {
        for (const key in query) {
          if (t[key] !== query[key]) return false;
        }
        return true;
      });

      return tasks.map(t => {
        const userInfo = t.assignedTo ? data.users.find(u => u._id === t.assignedTo) : null;
        return {
          ...t,
          _id: t._id || t.id,
          assignedTo: userInfo ? { _id: userInfo._id, id: userInfo._id, ...userInfo } : null
        };
      });
    },
    findById: async (id) => {
      if (useMongoDB) {
        return TaskModel.findById(id).populate('assignedTo', 'name email avatar role').lean();
      }
      const data = readLocalDB();
      const t = data.tasks.find(tk => tk._id === id || tk.id === id);
      if (!t) return null;
      const userInfo = t.assignedTo ? data.users.find(u => u._id === t.assignedTo) : null;
      return {
        ...t,
        _id: t._id || t.id,
        assignedTo: userInfo ? { _id: userInfo._id, id: userInfo._id, ...userInfo } : null
      };
    },
    create: async (doc) => {
      if (useMongoDB) {
        return (await TaskModel.create(doc)).toObject();
      }
      const data = readLocalDB();
      const id = generateId();
      const newTask = { _id: id, id, attachments: [], status: 'To Do', priority: 'Medium', ...doc, createdAt: new Date().toISOString() };
      data.tasks.push(newTask);
      writeLocalDB(data);
      return newTask;
    },
    findByIdAndUpdate: async (id, update) => {
      if (useMongoDB) {
        return TaskModel.findByIdAndUpdate(id, update, { new: true }).populate('assignedTo', 'name email avatar role').lean();
      }
      const data = readLocalDB();
      const idx = data.tasks.findIndex(t => t._id === id || t.id === id);
      if (idx !== -1) {
        data.tasks[idx] = { ...data.tasks[idx], ...update, updatedAt: new Date().toISOString() };
        writeLocalDB(data);
        return db.tasks.findById(id);
      }
      return null;
    },
    findByIdAndDelete: async (id) => {
      if (useMongoDB) {
        return TaskModel.findByIdAndDelete(id).lean();
      }
      const data = readLocalDB();
      data.tasks = data.tasks.filter(t => t._id !== id && t.id !== id);
      data.comments = data.comments.filter(c => c.task !== id);
      writeLocalDB(data);
      return { success: true };
    }
  },

  comments: {
    find: async (query = {}) => {
      if (useMongoDB) {
        return CommentModel.find(query).populate('user', 'name email avatar role').lean();
      }
      const data = readLocalDB();
      const comments = data.comments.filter(c => {
        for (const key in query) {
          if (c[key] !== query[key]) return false;
        }
        return true;
      });

      return comments.map(c => {
        const userInfo = data.users.find(u => u._id === c.user) || { name: 'Unknown User', email: '' };
        return {
          ...c,
          _id: c._id || c.id,
          user: { _id: c.user, id: c.user, ...userInfo }
        };
      });
    },
    create: async (doc) => {
      if (useMongoDB) {
        return (await CommentModel.create(doc)).toObject();
      }
      const data = readLocalDB();
      const id = generateId();
      const newComment = { _id: id, id, ...doc, createdAt: new Date().toISOString() };
      data.comments.push(newComment);
      writeLocalDB(data);
      // return with user details populated
      const userInfo = data.users.find(u => u._id === doc.user) || { name: 'Unknown User', email: '' };
      return {
        ...newComment,
        user: { _id: doc.user, id: doc.user, ...userInfo }
      };
    },
    findByIdAndDelete: async (id) => {
      if (useMongoDB) {
        return CommentModel.findByIdAndDelete(id).lean();
      }
      const data = readLocalDB();
      data.comments = data.comments.filter(c => c._id !== id && c.id !== id);
      writeLocalDB(data);
      return { success: true };
    }
  },

  notifications: {
    find: async (query = {}) => {
      if (useMongoDB) {
        return NotificationModel.find(query).sort({ createdAt: -1 }).lean();
      }
      const data = readLocalDB();
      const list = data.notifications.filter(n => {
        for (const key in query) {
          if (n[key] !== query[key]) return false;
        }
        return true;
      });
      // Sort reverse-chronological
      return list.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    create: async (doc) => {
      if (useMongoDB) {
        return (await NotificationModel.create(doc)).toObject();
      }
      const data = readLocalDB();
      const id = generateId();
      const newNotif = { _id: id, id, read: false, ...doc, createdAt: new Date().toISOString() };
      data.notifications.push(newNotif);
      writeLocalDB(data);
      return newNotif;
    },
    findByIdAndUpdate: async (id, update) => {
      if (useMongoDB) {
        return NotificationModel.findByIdAndUpdate(id, update, { new: true }).lean();
      }
      const data = readLocalDB();
      const idx = data.notifications.findIndex(n => n._id === id || n.id === id);
      if (idx !== -1) {
        data.notifications[idx] = { ...data.notifications[idx], ...update };
        writeLocalDB(data);
        return data.notifications[idx];
      }
      return null;
    },
    updateMany: async (filter, update) => {
      if (useMongoDB) {
        return NotificationModel.updateMany(filter, update);
      }
      const data = readLocalDB();
      let modifiedCount = 0;
      data.notifications = data.notifications.map(n => {
        let matches = true;
        for (const key in filter) {
          if (n[key] !== filter[key]) matches = false;
        }
        if (matches) {
          modifiedCount++;
          return { ...n, ...update };
        }
        return n;
      });
      writeLocalDB(data);
      return { modifiedCount };
    },
    findByIdAndDelete: async (id) => {
      if (useMongoDB) {
        return NotificationModel.findByIdAndDelete(id).lean();
      }
      const data = readLocalDB();
      data.notifications = data.notifications.filter(n => n._id !== id && n.id !== id);
      writeLocalDB(data);
      return { success: true };
    }
  }
};

export default db;
