import React from 'react';
import { 
  AreaChart, Area, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';
import { 
  TrendingUp, Wallet, ArrowUpRight, Youtube, 
  ChevronRight, ArrowDownLeft, Clock, Banknote, MoreVertical
} from 'lucide-react';
import { cn } from '../lib/utils';

const earningsData = [
  { day: '1', amount: 1200 },
  { day: '5', amount: 1500 },
  { day: '10', amount: 900 },
  { day: '15', amount: 2200 },
  { day: '20', amount: 1800 },
  { day: '25', amount: 3500 },
  { day: '30', amount: 4800 }, // peaking recently
];

const pieData = [
  { name: 'Subscriptions', value: 55, color: '#3b82f6' }, // blue
  { name: 'Brand Deals', value: 30, color: '#10b981' }, // green
  { name: 'Tips', value: 15, color: '#8b5cf6' }, // purple
];

const transactions = [
  { id: 1, type: 'Brand Deal - TechCorp', date: 'Today, 2:45 PM', amount: '+₹15,000', status: 'Completed', icon: Banknote, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { id: 2, type: 'Subscription Payout', date: 'Yesterday, 9:00 AM', amount: '+₹4,200', status: 'Completed', icon: Wallet, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { id: 3, type: 'Viewer Tip - SuperChat', date: 'Oct 24, 8:15 PM', amount: '+₹500', status: 'Completed', icon: ArrowDownLeft, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { id: 4, type: 'Withdrawal to Bank', date: 'Oct 20, 10:30 AM', amount: '-₹8,000', status: 'Processing', icon: Clock, color: 'text-orange-400', bg: 'bg-orange-400/10' },
];

const GlassCard = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn(
    "bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden",
    className
  )}>
    {children}
  </div>
);

export default function Earn() {
  return (
    <div className="min-h-[calc(100vh-64px)] -m-4 sm:-m-6 lg:-m-8 bg-[#0a0a0c] text-white font-sans animate-in fade-in duration-500 overflow-y-auto pb-24">
      {/* 
        Container mimics mobile layout optionally on large screens,
        but since it's a dashboard, we center a max-width container 
        that looks stunning on both mobile and desktop.
      */}
      <div className="max-w-md mx-auto sm:max-w-xl md:max-w-4xl lg:max-w-[1200px] w-full p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Header CTA */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-medium text-gray-200">Earnings</h1>
          <button className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 transition-colors backdrop-blur-md">
            <MoreVertical className="w-5 h-5 text-gray-300" />
          </button>
        </div>

        {/* Hero Section */}
        <div className="flex flex-col items-center py-6">
          <p className="text-gray-400 text-sm font-medium tracking-wide uppercase mb-2">Total Revenue</p>
          <div className="flex items-start gap-2 mb-3">
            <h2 className="text-5xl sm:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-emerald-300 via-emerald-400 to-green-600 drop-shadow-[0_0_30px_rgba(52,211,153,0.3)]">
              ₹45,230
            </h2>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-bold shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <TrendingUp className="w-4 h-4" />
            +12% this month
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <GlassCard className="p-5 flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/20 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-orange-500/30 transition-colors"></div>
            <p className="text-xs font-medium text-gray-400 mb-1">Pending Payout</p>
            <p className="text-xl font-bold text-orange-400 tracking-tight">₹8,500</p>
          </GlassCard>

          <GlassCard className="p-5 flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/20 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-blue-500/30 transition-colors"></div>
            <p className="text-xs font-medium text-gray-400 mb-1">MRR</p>
            <p className="text-xl font-bold text-blue-400 tracking-tight">₹12,000</p>
          </GlassCard>

          <GlassCard className="p-5 flex flex-col justify-center relative overflow-hidden group col-span-2 md:col-span-1">
            <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/20 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-red-500/30 transition-colors"></div>
            <p className="text-xs font-medium text-gray-400 mb-1">Top Platform</p>
            <div className="flex items-center gap-2">
              <Youtube className="w-5 h-5 text-red-500" />
              <p className="text-xl font-bold text-gray-100 tracking-tight">YouTube</p>
            </div>
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trend Chart */}
          <GlassCard className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-100">30-Day Trend</h3>
              <button className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors">Detailed View</button>
            </div>
            <div className="h-48 w-full -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={earningsData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <RechartsTooltip 
                    cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }}
                    contentStyle={{ backgroundColor: 'rgba(20,20,25,0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ color: '#34d399', fontWeight: 'bold' }}
                    formatter={(value: number) => [`₹${value}`, 'Earned']}
                    labelStyle={{ display: 'none' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#34d399" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorAmount)" 
                    activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Revenue by Source Pie */}
          <GlassCard className="p-6 flex flex-col">
            <h3 className="text-lg font-semibold text-gray-100 mb-6">Revenue Sources</h3>
            <div className="flex items-center flex-1">
              <div className="w-1/2 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'rgba(20,20,25,0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value: number) => [`${value}%`, 'Share']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 flex flex-col justify-center gap-4 pl-4">
                {pieData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm text-gray-300 font-medium">{item.name}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-100">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Recent Transactions */}
        <GlassCard className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-100">Recent Transactions</h3>
            <button className="text-sm font-medium text-gray-400 hover:text-white transition-colors">See All</button>
          </div>
          <div className="space-y-4">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center cursor-pointer group hover:bg-white/[0.03] p-2 -mx-2 rounded-xl transition-colors">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 mr-4 transition-colors", tx.bg)}>
                  <tx.icon className={cn("w-6 h-6", tx.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-100 truncate group-hover:text-white transition-colors">{tx.type}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{tx.date}</p>
                </div>
                <div className="text-right">
                  <p className={cn("text-sm font-bold tracking-tight", tx.amount.startsWith('+') ? "text-emerald-400" : "text-gray-100")}>{tx.amount}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{tx.status}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

      </div>

      {/* Floating Request Payout CTA */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center px-6 z-50 pointer-events-none">
        <div className="max-w-[400px] w-full pointer-events-auto">
          <button className="w-full relative group overflow-hidden rounded-2xl p-[1px]">
            <span className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600 opacity-80 group-hover:opacity-100 transition-opacity blur-sm"></span>
            <div className="relative flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-4 rounded-2xl text-white font-bold text-lg shadow-[0_8px_32px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all">
              Request Payout
              <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </button>
        </div>
      </div>

    </div>
  );
}
