import React, { useState } from 'react';
import { 
  Search, Mic, Play, Pause, Download, Plus, 
  Moon, Sun, Music2, SlidersHorizontal, Heart
} from 'lucide-react';
import { cn } from '../lib/utils';

const tracks = [
  { id: 1, title: 'Upbeat Creator Beat', artist: 'Sarath', duration: '3:45', date: 'Mar 23', waveform: [40, 70, 45, 90, 60, 80, 50, 65, 30, 85, 45, 75, 55, 95, 60], gradient: 'from-blue-100 to-indigo-50' },
  { id: 2, title: 'Royalty Free Intro', artist: 'AudioJungle', duration: '1:20', date: 'Mar 20', waveform: [60, 40, 80, 30, 70, 50, 90, 65, 45, 85, 55, 75, 35, 95, 50], gradient: 'from-purple-100 to-fuchsia-50' },
  { id: 3, title: 'Cinematic Ambient Vibe', artist: 'EpicSounds', duration: '4:12', date: 'Mar 18', waveform: [30, 50, 40, 70, 60, 45, 80, 55, 65, 85, 50, 75, 60, 90, 45], gradient: 'from-teal-100 to-emerald-50' },
  { id: 4, title: 'Lofi Chill Hop Study', artist: 'Lofi Girl', duration: '2:55', date: 'Mar 15', waveform: [50, 45, 65, 55, 75, 60, 85, 70, 50, 80, 40, 90, 65, 75, 55], gradient: 'from-rose-100 to-pink-50' },
  { id: 5, title: 'Vlog Transition Whoosh', artist: 'FX Master', duration: '0:05', date: 'Mar 12', waveform: [20, 30, 50, 80, 100, 70, 40, 20, 10, 5, 0, 0, 0, 0, 0], gradient: 'from-amber-100 to-orange-50' },
];

export default function AudioLibrary() {
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [isDark, setIsDark] = useState(false);

  // The requested neumorphic box styling
  const neumorphicCard = "bg-[#f8f9fa] rounded-3xl shadow-[8px_8px_16px_rgba(200,208,224,0.4),-8px_-8px_16px_rgba(255,255,255,0.9)] border border-white/60";
  const neumorphicButton = "bg-[#f8f9fa] shadow-[4px_4px_10px_rgba(200,208,224,0.4),-4px_-4px_10px_rgba(255,255,255,0.9)] active:shadow-[inset_4px_4px_10px_rgba(200,208,224,0.4),inset_-4px_-4px_10px_rgba(255,255,255,0.9)] border border-white/60 transition-all";

  // When clicking play, toggle state
  const togglePlay = (id: number) => {
    setPlayingId(playingId === id ? null : id);
  };

  return (
    <div className={cn(
      "min-h-[calc(100vh-64px)] -m-4 sm:-m-6 lg:-m-8 transition-colors duration-500 font-sans overflow-x-hidden",
      isDark ? "bg-[#121214] text-gray-100" : "bg-[#eff1f5] text-gray-800"
    )}>
      
      {/* 9:16 Mobile App Container Constraint */}
      <div className="max-w-[480px] mx-auto min-h-full pb-28 relative">
        
        {/* Header - iPhone style navigation */}
        <div className={cn("flex items-center justify-between px-6 py-5 sticky top-0 z-30 backdrop-blur-3xl", isDark ? "border-b border-white/10" : "border-b border-gray-200/50")}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden shadow-sm ring-2 ring-white border-[0.5px] border-gray-200">
              <img src="https://picsum.photos/seed/creator/200/200" alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Audio Studio</h1>
          </div>
          <button 
            onClick={() => setIsDark(!isDark)}
            className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-all", !isDark ? neumorphicButton : "bg-white/10 hover:bg-white/20")}
          >
            {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-indigo-500" />}
          </button>
        </div>

        <div className="px-6 py-6 space-y-8">
          
          {/* Search Bar */}
          <div className="relative group">
            <div className={cn(
              "absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors",
              isDark ? "text-gray-400" : "text-indigo-400"
            )}>
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="Search your audio library"
              className={cn(
                "w-full pl-11 pr-12 py-4 rounded-2xl outline-none text-[15px] font-medium transition-all",
                isDark 
                  ? "bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:bg-white/10" 
                  : `${neumorphicCard} placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-100`
              )}
            />
            <button className="absolute inset-y-0 right-2 flex items-center px-3 text-indigo-500 hover:text-indigo-600 transition-colors">
              <Mic className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-6 px-6 snap-x">
            {['All Tracks', 'Sound Effects', 'Starred', 'Recently Added'].map((filter, i) => (
              <button 
                key={filter} 
                className={cn(
                  "shrink-0 px-5 py-2.5 rounded-full text-sm font-bold snap-start whitespace-nowrap",
                  i === 0 
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25" 
                    : isDark ? "bg-white/5 hover:bg-white/10 text-gray-300" : `${neumorphicButton} text-gray-600`
                )}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Tracks List */}
          <div className="space-y-4">
             <div className="flex justify-between items-center px-1 mb-2">
               <h2 className="text-sm font-bold uppercase tracking-wider opacity-50">Your Library ({tracks.length})</h2>
               <button className={cn("p-2 rounded-full", !isDark && neumorphicButton, isDark && "bg-white/5 hover:bg-white/10")}>
                 <SlidersHorizontal className="w-4 h-4 opacity-70" />
               </button>
             </div>

             {tracks.map((track) => (
               <div 
                 key={track.id} 
                 className={cn(
                   "group relative flex flex-col p-4 rounded-3xl transition-all duration-300 overflow-hidden",
                   isDark 
                    ? "bg-white/[0.02] border border-white/5 hover:bg-white/[0.04]" 
                    : `${neumorphicCard} hover:shadow-[12px_12px_20px_rgba(200,208,224,0.45),-12px_-12px_20px_rgba(255,255,255,1)]`
                 )}
               >
                 {/* Card Pastel Background Accent */}
                 <div className={cn("absolute inset-0 bg-gradient-to-br opacity-[0.15] dark:opacity-[0.05] z-0", track.gradient)}></div>

                 <div className="relative z-10 flex items-center gap-4">
                   
                   {/* Thumbnail / Play Button */}
                   <button 
                     onClick={() => togglePlay(track.id)}
                     className={cn(
                       "w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center relative overflow-hidden group/play transition-transform active:scale-95",
                       isDark ? "bg-white/10" : "bg-white shadow-sm border border-gray-100"
                     )}
                   >
                     <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50", track.gradient)}></div>
                     <Music2 className={cn("w-6 h-6 absolute opacity-20", isDark ? "text-white" : "text-gray-900", playingId === track.id && "opacity-0")} />
                     
                     <div className={cn(
                       "w-10 h-10 rounded-full flex items-center justify-center z-10 backdrop-blur-sm transition-all shadow-md",
                       playingId === track.id 
                        ? "bg-indigo-500 text-white" 
                        : isDark ? "bg-black/40 text-white" : "bg-white/80 text-indigo-500"
                     )}>
                       {playingId === track.id ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                     </div>
                   </button>

                   {/* Track Details */}
                   <div className="flex-1 min-w-0 py-1">
                     <h3 className="text-[16px] font-bold truncate mb-0.5 tracking-tight">{track.title}</h3>
                     <p className="text-[13px] font-medium opacity-60 truncate flex items-center gap-2">
                       {track.artist}
                       <span className="w-1 h-1 rounded-full bg-current opacity-40"></span>
                       {track.date}
                     </p>
                   </div>

                   {/* Actions */}
                   <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="text-[12px] font-bold opacity-70 tracking-wide font-mono bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-full">
                        {track.duration}
                      </span>
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:text-indigo-500 focus:opacity-100">
                          <Heart className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:text-indigo-500 focus:opacity-100">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                   </div>
                 </div>

                 {/* Waveform Visualization */}
                 <div className="relative z-10 w-full h-8 mt-4 flex items-end justify-between gap-[2px] px-1 opacity-60">
                    {track.waveform.map((height, idx) => (
                      <div 
                        key={idx} 
                        className={cn(
                          "flex-1 rounded-t-full transition-all duration-300",
                          playingId === track.id ? "bg-indigo-500 animate-pulse" : isDark ? "bg-white/20" : "bg-indigo-200"
                        )}
                        style={{ height: `${height}%`, animationDelay: `${idx * 0.05}s` }}
                      ></div>
                    ))}
                 </div>
                 
               </div>
             ))}
          </div>
        </div>

        {/* Floating Action Button (FAB) */}
        <div className="fixed bottom-8 right-6 lg:rightPart z-50">
           <button className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center shadow-[0_10px_30px_rgba(99,102,241,0.4)] hover:scale-105 active:scale-95 transition-all group">
             <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
           </button>
        </div>

      </div>
    </div>
  );
}
