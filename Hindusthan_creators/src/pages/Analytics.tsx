import React, { useState } from 'react';
import { 
  Sparkles, MoreVertical, ChevronDown, 
  Eye, Clock, Users, ArrowUpRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { BarChart, Bar, Tooltip as RechartsTooltip, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

const tabs = ['Overview', 'Content', 'Audience', 'Trends'];
const aiPrompts = [
  'How did viewers find my content?',
  'How many new viewers did I reach?',
  'Summarize my latest video performance'
];

const performanceData = [
  { name: 'Feb 22', v1: 1500, v2: 1000, v3: 1700, w1: 80, w2: 60, w3: 100, s1: 5, s2: 4, s3: 6 },
  { name: 'Feb 27', v1: 1200, v2: 1400, v3: 1200, w1: 70, w2: 50, w3: 90,  s1: 4, s2: 3, s3: 5 },
  { name: 'Mar 3',  v1: 2000, v2: 1800, v3: 1800, w1: 120, w2: 90, w3: 110, s1: 8, s2: 7, s3: 10 },
  { name: 'Mar 8',  v1: 3000, v2: 2500, v3: 3400, w1: 200, w2: 150, w3: 200, s1: 15, s2: 12, s3: 18 },
  { name: 'Mar 12', v1: 2200, v2: 2000, v3: 2300, w1: 140, w2: 120, w3: 150, s1: 10, s2: 8, s3: 12 },
  { name: 'Mar 17', v1: 3200, v2: 2800, v3: 3200, w1: 220, w2: 180, w3: 280, s1: 18, s2: 15, s3: 22 },
  { name: 'Mar 21', v1: 4000, v2: 3800, v3: 3600, w1: 280, w2: 240, w3: 300, s1: 25, s2: 20, s3: 33 },
];

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [activeMetric, setActiveMetric] = useState('Views');

  return (
    <div className="min-h-[calc(100vh-64px)] -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 bg-[#0f0f0f] text-white font-sans animate-in fade-in duration-300">
      <div className="max-w-[1600px] mx-auto w-full">
        
        {/* Header Region */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <h1 className="text-2xl font-bold text-white tracking-tight">Channel analytics</h1>
          <button className="px-4 py-1.5 text-sm font-medium text-white hover:bg-white/10 rounded-full transition-colors border border-white/20 whitespace-nowrap self-start md:self-auto">
            Advanced mode
          </button>
        </div>

        {/* AI Chips */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar mb-8 pb-2">
          {aiPrompts.map((prompt, i) => (
            <button key={i} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-neutral-800 to-neutral-900 hover:from-neutral-700 hover:to-neutral-800 rounded-full border border-white/10 transition-colors whitespace-nowrap group">
              <Sparkles className="w-4 h-4 text-purple-400 group-hover:text-purple-300" />
              <span className="text-sm font-medium text-gray-200">{prompt}</span>
            </button>
          ))}
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-300">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        {/* Secondary Header (Tabs + Date Range) */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-white/10 mb-6 gap-4">
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "pb-3 text-sm font-medium whitespace-nowrap transition-colors relative",
                  activeTab === tab ? "text-white" : "text-gray-400 hover:text-gray-200"
                )}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-t-full" />
                )}
              </button>
            ))}
          </div>
          
          <div className="pb-3 flex items-center gap-2 cursor-pointer hover:text-white text-gray-400 transition-colors group">
            <div className="text-right">
              <div className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">Feb 22 – Mar 21, 2026</div>
              <div className="text-sm font-medium text-white">Last 28 days</div>
            </div>
            <ChevronDown className="w-5 h-5" />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Chart Card */}
          <div className="lg:col-span-2 bg-[#1f1f1f] rounded-2xl border border-white/10 overflow-hidden flex flex-col shadow-lg">
            
            <div className="p-8 text-center border-b border-white/10">
              <h2 className="text-2xl font-bold text-white tracking-tight">Your channel got <span className="text-blue-400">45,200</span> views in the last 28 days</h2>
            </div>

            <div className="flex border-b border-white/10">
              <button 
                onClick={() => setActiveMetric('Views')}
                className={cn(
                  "flex-1 py-4 flex flex-col items-center justify-center transition-colors relative",
                  activeMetric === 'Views' ? "bg-white/5" : "hover:bg-white/5"
                )}
              >
                <span className="text-sm font-medium text-gray-400">Views</span>
                <span className="text-2xl text-white font-medium mt-1">45.2K</span>
                {activeMetric === 'Views' && <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#60a5fa] rounded-t-full shadow-[0_-2px_8px_rgba(96,165,250,0.5)]" />}
              </button>
              
              <div className="w-px bg-white/10 my-4" />
              
              <button 
                onClick={() => setActiveMetric('Watch')}
                className={cn(
                  "flex-1 py-4 flex flex-col items-center justify-center transition-colors relative",
                  activeMetric === 'Watch' ? "bg-white/5" : "hover:bg-white/5"
                )}
              >
                <span className="text-sm font-medium text-gray-400">Watch time (hours)</span>
                <span className="text-2xl text-white font-medium mt-1">3.2K</span>
                {activeMetric === 'Watch' && <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#34d399] rounded-t-full shadow-[0_-2px_8px_rgba(52,211,153,0.5)]" />}
              </button>
              
              <div className="w-px bg-white/10 my-4" />
              
              <button 
                onClick={() => setActiveMetric('Subscribers')}
                className={cn(
                  "flex-1 py-4 flex flex-col items-center justify-center transition-colors relative",
                  activeMetric === 'Subscribers' ? "bg-white/5" : "hover:bg-white/5"
                )}
              >
                <span className="text-sm font-medium text-gray-400">Subscribers</span>
                <span className="text-2xl text-white font-medium mt-1">+260</span>
                {activeMetric === 'Subscribers' && <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#a78bfa] rounded-t-full shadow-[0_-2px_8px_rgba(167,139,250,0.5)]" />}
              </button>
            </div>

            <div className="p-6 flex-1 flex flex-col min-h-[350px]">
              <div className="flex-1 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff" strokeOpacity={0.05} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#888', fontSize: 12 }} 
                      dy={15}
                      tickMargin={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#888', fontSize: 12 }} 
                      tickCount={5}
                      orientation="right"
                      dx={10}
                    />
                    <RechartsTooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.02)' }} 
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                      labelStyle={{ color: '#888', marginBottom: '8px' }}
                    />
                    
                    {activeMetric === 'Views' && (
                      <>
                        <Bar dataKey="v1" name="Direct" stackId="a" fill="#1e3a8a" />
                        <Bar dataKey="v2" name="Search" stackId="a" fill="#2563eb" />
                        <Bar dataKey="v3" name="Suggested" stackId="a" fill="#60a5fa" radius={[6, 6, 0, 0]} />
                      </>
                    )}
                    {activeMetric === 'Watch' && (
                      <>
                        <Bar dataKey="w1" name="Direct" stackId="a" fill="#064e3b" />
                        <Bar dataKey="w2" name="Search" stackId="a" fill="#059669" />
                        <Bar dataKey="w3" name="Suggested" stackId="a" fill="#34d399" radius={[6, 6, 0, 0]} />
                      </>
                    )}
                    {activeMetric === 'Subscribers' && (
                      <>
                        <Bar dataKey="s1" name="Direct" stackId="a" fill="#4c1d95" />
                        <Bar dataKey="s2" name="Search" stackId="a" fill="#7c3aed" />
                        <Bar dataKey="s3" name="Suggested" stackId="a" fill="#a78bfa" radius={[6, 6, 0, 0]} />
                      </>
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-4">
                <button className="px-4 py-1.5 text-sm font-medium text-white hover:bg-white/10 rounded-full transition-colors border border-white/20">
                  See more
                </button>
              </div>
            </div>
            
          </div>

          {/* Realtime Card */}
          <div className="bg-[#1f1f1f] rounded-2xl border border-white/10 p-6 flex flex-col shadow-lg">
            <h2 className="text-xl font-bold text-white mb-1">Realtime</h2>
            <div className="flex items-center gap-2 mb-8">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
              </span>
              <span className="text-sm text-gray-400">Updating live</span>
            </div>

            <div className="mb-6 border-b border-white/10 pb-6">
              <div className="text-4xl font-light text-white tracking-tight mb-1">12,459</div>
              <div className="text-sm text-gray-400 mb-4">Subscribers</div>
              <button className="px-4 py-1.5 text-sm font-medium text-white hover:bg-white/10 rounded-full transition-colors border border-white/20">
                See live count
              </button>
            </div>

            <div className="mb-6 flex-1">
              <div className="text-4xl font-light text-white tracking-tight mb-1">1,240</div>
              <div className="text-sm text-gray-400 mb-4">Views · Last 48 hours</div>
              
              {/* Fake Timeline Graph for 48h */}
              <div className="h-16 border-b border-white/10 relative flex items-end">
                <div className="absolute w-full h-[1px] bg-white/20 bottom-4 left-0"></div>
                {/* 48 bars for timeline */}
                <div className="w-full flex justify-between h-full items-end pb-4 px-1 gap-[2px]">
                   {Array.from({length: 48}).map((_, i) => (
                     <div key={i} className="flex-1 bg-blue-500 rounded-t-sm hover:bg-blue-400 transition-colors" style={{ height: `${Math.max(10, Math.random() * 100)}%` }}></div>
                   ))}
                </div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>-48h</span>
                <span>Now</span>
              </div>
            </div>

            <div className="mt-auto">
              <button className="px-4 py-1.5 text-sm font-medium text-white hover:bg-white/10 rounded-full transition-colors border border-white/20">
                See more
              </button>
            </div>
          </div>
          
        </div>

      </div>
    </div>
  );
}
