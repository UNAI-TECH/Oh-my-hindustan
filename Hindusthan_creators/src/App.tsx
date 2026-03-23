/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Menu, Search, Video, Bell, LayoutDashboard,
  PlaySquare, BarChart2, MessageSquare, Subtitles as SubtitlesIcon,
  DollarSign, Settings as SettingsIcon, Send, Upload, Wand2
} from 'lucide-react';
import { cn } from './lib/utils';
import Dashboard from './pages/Dashboard';
import Content from './pages/Content';
import Analytics from './pages/Analytics';
import Comments from './pages/Comments';
import Subtitles from './pages/Subtitles';
import Earn from './pages/Earn';
import Customization from './pages/Customization';
import AudioLibrary from './pages/AudioLibrary';
import LandingPage from './pages/LandingPage';
import JoinForm from './pages/JoinForm';
import RequestPending from './pages/RequestPending';

const SidebarItem = ({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-4 px-6 py-3 text-sm font-medium transition-colors border-l-4",
      active 
        ? "bg-red-50 border-red-600 text-red-600" 
        : "border-transparent text-[#0f0f0f] hover:bg-[#f2f2f2]"
    )}
  >
    <Icon className={cn("w-5 h-5", active ? "text-red-600" : "text-[#606060]")} />
    <span>{label}</span>
  </button>
);

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState('Landing'); // Default to Landing
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Mock auth for now

  if (activePage === 'Landing') {
    return (
      <LandingPage 
        onJoinClick={() => setActivePage('JoinForm')} 
        onLoginClick={() => {
          // Mock login for now
          // In real app, redirect to login page
          setActivePage('Dashboard');
          setIsAuthenticated(true);
        }} 
      />
    );
  }

  if (activePage === 'JoinForm') {
    return (
      <JoinForm 
        onBack={() => setActivePage('Landing')} 
        onSubmitSuccess={() => setActivePage('RequestPending')} 
      />
    );
  }

  if (activePage === 'RequestPending') {
    return <RequestPending onBack={() => setActivePage('Landing')} />;
  }

  return (
    <div className="flex h-screen bg-[#f9f9f9] text-[#0f0f0f] font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        "bg-white border-r border-gray-200 flex flex-col transition-all duration-300 z-30",
        sidebarOpen ? "w-64" : "w-0 lg:w-20 overflow-hidden"
      )}>
        <div className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
          <div className="flex flex-col gap-1">
            <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activePage === 'Dashboard'} onClick={() => setActivePage('Dashboard')} />
            <SidebarItem icon={Video} label="Content" active={activePage === 'Content'} onClick={() => setActivePage('Content')} />
            <SidebarItem icon={BarChart2} label="Analytics" active={activePage === 'Analytics'} onClick={() => setActivePage('Analytics')} />
            <SidebarItem icon={MessageSquare} label="Comments" active={activePage === 'Comments'} onClick={() => setActivePage('Comments')} />
            <SidebarItem icon={SubtitlesIcon} label="Subtitles" active={activePage === 'Subtitles'} onClick={() => setActivePage('Subtitles')} />
            <SidebarItem icon={DollarSign} label="Earn" active={activePage === 'Earn'} onClick={() => setActivePage('Earn')} />
            <SidebarItem icon={Wand2} label="Customization" active={activePage === 'Customization'} onClick={() => setActivePage('Customization')} />
            <SidebarItem icon={PlaySquare} label="Audio Library" active={activePage === 'Audio Library'} onClick={() => setActivePage('Audio Library')} />
          </div>
        </div>
        <div className="border-t border-gray-200 py-4 flex flex-col gap-1">
          <SidebarItem icon={SettingsIcon} label="Settings" />
          <SidebarItem icon={Send} label="Send feedback" />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-20 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
            <div className="flex items-center gap-1 cursor-pointer">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <PlaySquare className="w-5 h-5 text-white" fill="currentColor" />
              </div>
              <span className="text-xl font-semibold tracking-tight hidden sm:block">Studio</span>
            </div>
          </div>

          <div className="flex-1 max-w-2xl px-4 sm:px-8 hidden md:block">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search across your channel"
                className="w-full pl-11 pr-4 py-2 bg-gray-100 border border-transparent focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-full text-sm transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button className="hidden sm:flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors">
              <Upload className="w-4 h-4" />
              <span>CREATE</span>
            </button>
            <button className="sm:hidden p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Search className="w-6 h-6 text-gray-600" />
            </button>
            <button className="sm:hidden p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Upload className="w-6 h-6 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full relative transition-colors">
              <Bell className="w-6 h-6 text-gray-600" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-600 border-2 border-white rounded-full"></span>
            </button>
            <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <img src="https://picsum.photos/seed/avatar/32/32" alt="Profile" className="w-8 h-8 rounded-full" />
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {activePage === 'Dashboard' && <Dashboard />}
          {activePage === 'Content' && <Content />}
          {activePage === 'Analytics' && <Analytics />}
          {activePage === 'Comments' && <Comments />}
          {activePage === 'Subtitles' && <Subtitles />}
          {activePage === 'Earn' && <Earn />}
          {activePage === 'Customization' && <Customization />}
          {activePage === 'Audio Library' && <AudioLibrary />}
          {activePage !== 'Dashboard' && activePage !== 'Content' && activePage !== 'Analytics' && activePage !== 'Comments' && activePage !== 'Subtitles' && activePage !== 'Earn' && activePage !== 'Customization' && activePage !== 'Audio Library' && (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p className="text-lg">The <strong>{activePage}</strong> page is under construction.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
