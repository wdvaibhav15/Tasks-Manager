import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server as SocketServer } from 'socket.io';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';

// Routes imports
import authRouter from './server/routes/auth.js';
import projectsRouter from './server/routes/projects.js';
import tasksRouter from './server/routes/tasks.js';
import commentsRouter from './server/routes/comments.js';
import notificationsRouter from './server/routes/notifications.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Create HTTP Server
  const server = http.createServer(app);

  // Attach Socket.io
  const io = new SocketServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    }
  });

  // Store io on app instance
  app.set('io', io);

  // Middlewares
  app.use(cors({
    origin: true,
    credentials: true
  }));
  app.use(express.json());
  app.use(cookieParser());

  // Log API requests
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // Rest API routes
  app.use('/api/auth', authRouter);
  app.use('/api/projects', projectsRouter);
  app.use('/api/tasks', tasksRouter);
  app.use('/api/comments', commentsRouter);
  app.use('/api/notifications', notificationsRouter);

  // Active sockets user mappings
  const onlineUsers = new Map(); // socketId -> user profile

  // Real-time socket coordination
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Register active user session
    socket.on('user:register', (user) => {
      if (user && user.id) {
        onlineUsers.set(socket.id, user);
        socket.join(user.id); // join self user room for private notifications
        console.log(`User registered: ${user.name} (${user.role})`);
        
        // Broadcast updated active list
        const uniqueOnline = Array.from(onlineUsers.values()).filter(
          (value, index, self) => self.findIndex(u => u.id === value.id) === index
        );
        io.emit('team:online_list', uniqueOnline);
      }
    });

    // Join Kanban Project board room
    socket.on('project:join', (projectId) => {
      socket.join(`project:${projectId}`);
      console.log(`Socket ${socket.id} joined project room: project:${projectId}`);
    });

    // Leave project board room
    socket.on('project:leave', (projectId) => {
      socket.leave(`project:${projectId}`);
      console.log(`Socket ${socket.id} left project room: project:${projectId}`);
    });

    // Join Task conversation room
    socket.on('task:join', (taskId) => {
      socket.join(`task:${taskId}`);
      console.log(`Socket ${socket.id} joined task room: task:${taskId}`);
    });

    socket.on('task:leave', (taskId) => {
      socket.leave(`task:${taskId}`);
      console.log(`Socket ${socket.id} left task room: task:${taskId}`);
    });

    // Live typing indicators
    socket.on('task:typing_start', ({ name, taskId }) => {
      socket.to(`task:${taskId}`).emit('task:typing_start', { name });
    });

    socket.on('task:typing_stop', ({ taskId }) => {
      socket.to(`task:${taskId}`).emit('task:typing_stop');
    });

    // Drop connection
    socket.on('disconnect', () => {
      if (onlineUsers.has(socket.id)) {
        const user = onlineUsers.get(socket.id);
        onlineUsers.delete(socket.id);
        console.log(`User unregistered: ${user?.name}`);

        const uniqueOnline = Array.from(onlineUsers.values()).filter(
          (value, index, self) => self.findIndex(u => u.id === value.id) === index
        );
        io.emit('team:online_list', uniqueOnline);
      }
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  // Client SPA mounting
  if (process.env.NODE_ENV !== 'production') {
    // Mounting Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serving Static compiled files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Unified collaborative server running at http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to launch application server: ', err);
});
