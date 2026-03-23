import React, { useState } from 'react';
import { 
  Filter, Eye, Globe2, AlertCircle, 
  MessageSquare, ThumbsUp, ChevronDown, CheckCircle2 
} from 'lucide-react';
import { cn } from '../lib/utils';

const tabs = ['Videos', 'Shorts', 'Live', 'Posts', 'Playlists', 'Podcasts', 'Promotions'];

const videosData = [
  {
    id: 1,
    title: 'Building a Modern Dashboard with React & Tailwind CSS',
    description: 'React Tutorial • 10:24',
    thumbnail: 'https://picsum.photos/seed/vid1/320/180',
    visibility: 'Public',
    restrictions: 'None',
    date: 'Oct 24, 2023',
    dateLabel: 'Published',
    views: '12.4K',
    comments: 342,
    likes: '98.5%',
    likesCount: '1.2K likes'
  },
  {
    id: 2,
    title: '10 UI Design Tips for Better Dashboards',
    description: 'UI/UX Design • 8:15',
    thumbnail: 'https://picsum.photos/seed/vid2/320/180',
    visibility: 'Public',
    restrictions: 'None',
    date: 'Oct 20, 2023',
    dateLabel: 'Published',
    views: '8.2K',
    comments: 156,
    likes: '96.2%',
    likesCount: '800 likes'
  },
  {
    id: 3,
    title: 'How to use AI to generate code faster',
    description: 'AI Tools • 15:30',
    thumbnail: 'https://picsum.photos/seed/vid3/320/180',
    visibility: 'Unlisted',
    restrictions: 'Copyright claimed',
    date: 'Oct 15, 2023',
    dateLabel: 'Uploaded',
    views: '1.5K',
    comments: 45,
    likes: '92.0%',
    likesCount: '150 likes'
  },
  {
    id: 4,
    title: 'Mastering TypeScript in 2024 (Full Course)',
    description: 'TypeScript Course • 45:00',
    thumbnail: 'https://picsum.photos/seed/vid4/320/180',
    visibility: 'Private',
    restrictions: 'None',
    date: 'Oct 10, 2023',
    dateLabel: 'Draft',
    views: '-',
    comments: '-',
    likes: '-',
    likesCount: '-'
  },
  {
    id: 5,
    title: 'My Web Dev Setup Tour 2024',
    description: 'Vlog • 12:45',
    thumbnail: 'https://picsum.photos/seed/vid5/320/180',
    visibility: 'Public',
    restrictions: 'None',
    date: 'Oct 05, 2023',
    dateLabel: 'Published',
    views: '25.6K',
    comments: 890,
    likes: '99.1%',
    likesCount: '3.4K likes'
  }
];

export default function Content() {
  const [activeTab, setActiveTab] = useState('Videos');
  const [selectAll, setSelectAll] = useState(false);
  
  return (
    <div className="max-w-[1600px] mx-auto pb-10 w-full animate-in fade-in duration-300">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Channel content</h1>
      
      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-gray-200 mb-6 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "pb-3 text-sm font-medium whitespace-nowrap transition-colors relative",
              activeTab === tab ? "text-[#065fd4]" : "text-[#606060] hover:text-[#0f0f0f]"
            )}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#065fd4] rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col">
        {/* Filter Bar */}
        <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-200 text-sm text-[#606060]">
          <button className="p-2 hover:bg-[#f2f2f2] rounded-full transition-colors flex items-center justify-center">
            <Filter className="w-5 h-5 text-[#606060]" />
          </button>
          <input 
            type="text" 
            placeholder="Filter" 
            className="flex-1 bg-transparent border-none outline-none placeholder-[#606060] text-[#0f0f0f]"
          />
        </div>

        {/* Action Bar */}
        <div className="flex items-center px-4 py-2 border-b border-gray-200 bg-[#f9f9f9]/50 min-h-[48px]">
           <label className="flex items-center p-2 cursor-pointer hover:bg-[#f2f2f2] rounded transition-colors group">
             <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#065fd4] focus:ring-[#065fd4] cursor-pointer" checked={selectAll} onChange={(e) => setSelectAll(e.target.checked)} />
           </label>
           {/* Placeholder for bulk actions if selected */}
           {selectAll && (
             <span className="text-sm font-medium text-[#0f0f0f] ml-3 animate-in fade-in zoom-in-95 duration-200">
               {videosData.length} selected
             </span>
           )}
        </div>

        {/* Table - Added relative to ensure tooltip is visible */}
        <div className="overflow-x-auto relative">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-gray-200 text-sm text-[#606060] bg-white group transition-colors">
                <th className="py-3 px-4 font-medium w-[45%]">Video</th>
                <th className="py-3 px-4 font-medium w-[12%]">Visibility</th>
                <th className="py-3 px-4 font-medium w-[12%]">Restrictions</th>
                <th className="py-3 px-4 font-medium w-[12%]">Date</th>
                <th className="py-3 px-4 font-medium text-right w-[8%]">Views</th>
                <th className="py-3 px-4 font-medium text-right w-[8%]">Comments</th>
                <th className="py-3 px-4 font-medium text-right w-[8%]">Likes (vs. dislikes)</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-100 bg-white">
              {videosData.map((video) => (
                <tr key={video.id} className="hover:bg-[#f9f9f9] transition-colors group relative">
                  <td className="py-3 px-4">
                    <div className="flex gap-4">
                      <div className="flex items-center pt-2">
                        <input type="checkbox" className={cn(
                          "w-4 h-4 rounded border-gray-300 text-[#065fd4] focus:ring-[#065fd4] cursor-pointer transition-opacity",
                          selectAll ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        )} checked={selectAll} readOnly />
                      </div>
                      <div className="relative w-32 aspect-video rounded-lg bg-gray-200 overflow-hidden shrink-0 cursor-pointer shadow-sm">
                        <img src={video.thumbnail} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt="Thumbnail" />
                        <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-medium tracking-wide shadow-sm">
                          {video.description.split('•')[1].trim()}
                        </div>
                      </div>
                      <div className="flex flex-col min-w-0 pr-4 justify-center">
                        <div className="font-medium text-[#0f0f0f] line-clamp-2 cursor-pointer mb-1 group-hover:text-[#065fd4] transition-colors">
                          {video.title}
                        </div>
                        <div className="text-xs text-[#606060] truncate">{video.description.split('•')[0].trim()}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 align-top pt-5">
                    <div className="flex items-center gap-2 cursor-pointer py-1.5 px-2 -ml-2 rounded-md transition-colors w-fit border border-transparent hover:border-[#cccccc] hover:shadow-sm">
                      {video.visibility === 'Public' && <Globe2 className="w-4 h-4 text-[#00897b]" />}
                      {video.visibility === 'Unlisted' && <AlertCircle className="w-4 h-4 text-[#f29900]" />}
                      {video.visibility === 'Private' && <Eye className="w-4 h-4 text-[#606060]" />}
                      <span className={cn(
                        "font-medium transition-colors text-[#0f0f0f]",
                      )}>{video.visibility}</span>
                      <ChevronDown className="w-4 h-4 text-[#606060] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </td>
                  <td className="py-3 px-4 align-top pt-6">
                    <span className={cn(
                      "cursor-pointer transition-colors",
                      video.restrictions !== 'None' ? "text-[#f29900] font-medium" : "text-[#0f0f0f] hover:text-[#065fd4]"
                    )}>{video.restrictions}</span>
                  </td>
                  <td className="py-3 px-4 align-top pt-5 text-[#606060]">
                    <div className="cursor-pointer hover:text-[#065fd4] text-[#0f0f0f]">{video.date}</div>
                    <div className="text-xs mt-0.5">{video.dateLabel}</div>
                  </td>
                  <td className="py-3 px-4 align-top pt-6 text-right text-[#0f0f0f]">
                    {video.views}
                  </td>
                  <td className="py-3 px-4 align-top pt-6 text-right text-[#0f0f0f] group/comment">
                    <div className="cursor-pointer group-hover/comment:text-[#065fd4] transition-colors">{video.comments}</div>
                  </td>
                  <td className="py-3 px-4 align-top pt-5 text-right text-[#0f0f0f]">
                    {video.likes !== '-' ? (
                      <div className="flex flex-col items-end">
                        <div className="text-[#0f0f0f]">{video.likes}</div>
                        <div className="text-xs text-[#606060] mt-0.5">{video.likesCount}</div>
                      </div>
                    ) : (
                      <span className="text-[#606060]">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
