import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Check persistent login on mount
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const res = await fetch('/api/auth/profile');
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (err) {
        console.log('No existing session found');
      } finally {
        setLoading(false);
      }
    };
    checkLoggedIn();
  }, []);

  // Connect socket when user is active
  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Initialize socket connection
    const socketUrl = window.location.origin;
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling']
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket client connected:', newSocket.id);
      // Register user on socket session
      newSocket.emit('user:register', user);
    });

    newSocket.on('team:online_list', (list) => {
      setOnlineUsers(list);
    });

    newSocket.on('notification:received', (data) => {
      toast(data.message, {
        icon: '🔔',
        style: {
          borderRadius: '10px',
          background: '#0F172A',
          color: '#fff',
        }
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const login = async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }
      setUser(data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
      return { success: true };
    } catch (err) {
      toast.error(err.message);
      return { success: false, error: err.message };
    }
  };

  const register = async (name, email, password, confirmPassword, role) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, confirmPassword, role })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      setUser(data.user);
      toast.success(`Account created successfully! Welcome ${data.user.name}`);
      return { success: true };
    } catch (err) {
      toast.error(err.message);
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      if (socket) {
        socket.disconnect();
      }
      toast.success('Logged out successfully');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Profile update failed');
      }
      setUser(data.user);
      toast.success('Profile updated successfully');
      return { success: true };
    } catch (err) {
      toast.error(err.message);
      return { success: false, error: err.message };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, socket, onlineUsers }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
