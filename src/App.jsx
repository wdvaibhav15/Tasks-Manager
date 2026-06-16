import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import { Toaster } from 'react-hot-toast';

// Import Page Screen Files
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardOverview from './pages/DashboardOverview.jsx';
import ProjectBoard from './pages/ProjectBoard.jsx';
import TeamPage from './pages/TeamPage.jsx';
import UserProfile from './pages/UserProfile.jsx';

// Import Structure Layout
import ShellLayout from './layouts/ShellLayout.jsx';

export default function App() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('landing');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  // Automatically forward logged-in users away from auth screens
  useEffect(() => {
    if (!loading) {
      if (user) {
        // If logged in, they enter dashboard
        if (['landing', 'login', 'register'].includes(currentTab)) {
          setCurrentTab('dashboard');
        }
      } else {
        // If logged out, throw back to landing
        if (!['landing', 'login', 'register'].includes(currentTab)) {
          setCurrentTab('landing');
        }
      }
    }
  }, [user, loading]);

  const handleNavigate = (tab) => {
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGlobalSearchChange = (query) => {
    setGlobalSearchQuery(query);
    // If user searches globally, auto-focus them to Projects/Kanban board
    if (query && currentTab !== 'projects') {
      setCurrentTab('projects');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-550 font-bold uppercase tracking-widest font-mono">Launching Workspace Hub...</span>
      </div>
    );
  }

  // Render Auth screens if logged out
  if (!user) {
    if (currentTab === 'login') {
      return (
        <>
          <Toaster position="top-right" />
          <LoginPage onNavigate={handleNavigate} />
        </>
      );
    }
    if (currentTab === 'register') {
      return (
        <>
          <Toaster position="top-right" />
          <RegisterPage onNavigate={handleNavigate} />
        </>
      );
    }
    return (
      <>
        <Toaster position="top-right" />
        <LandingPage onNavigate={handleNavigate} />
      </>
    );
  }

  // Render Shell layout with corresponding active tab panel if logged in
  return (
    <>
      <Toaster position="top-right" />
      
      <ShellLayout 
        currentTab={currentTab} 
        onNavigate={handleNavigate}
        onSearchQueryChange={handleGlobalSearchChange}
      >
        {currentTab === 'dashboard' && <DashboardOverview onNavigate={handleNavigate} />}
        {currentTab === 'projects' && <ProjectBoard globalSearchQuery={globalSearchQuery} />}
        {currentTab === 'team' && <TeamPage />}
        {currentTab === 'profile' && <UserProfile />}
      </ShellLayout>
    </>
  );
}
