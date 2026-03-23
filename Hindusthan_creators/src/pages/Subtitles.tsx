import React, { useState } from 'react';
import { 
  Filter, Search, Globe, ChevronDown, 
  Plus, Subtitles as SubtitlesIcon, Settings,
  Edit2, Trash2, MoreVertical, FileText
} from 'lucide-react';
import { cn } from '../lib/utils';

const availableLanguages = ['All Languages', 'English', 'Spanish', 'Hindi', 'French', 'German', 'Japanese'];

const subtitlesData = [
  {
    id: 1,
    title: 'Building a Modern Dashboard with React & Tailwind CSS',
    thumbnail: 'https://picsum.photos/seed/vid1/120/68',
    date: 'Oct 24, 2023',
    languages: [
      { name: 'English (video language)', status: 'Published', type: 'Creator', date: 'Oct 24, 2023' },
      { name: 'Spanish', status: 'Published', type: 'Community', date: 'Oct 25, 2023' },
      { name: 'Hindi', status: 'Draft', type: 'Creator', date: 'Oct 26, 2023' }
    ]
  },
  {
    id: 2,
    title: '10 UI Design Tips for Better Dashboards',
    thumbnail: 'https://picsum.photos/seed/vid2/120/68',
    date: 'Oct 20, 2023',
    languages: [
      { name: 'English (Automatic)', status: 'Published', type: 'Automatic', date: 'Oct 20, 2023' },
      { name: 'French', status: 'Published', type: 'Creator', date: 'Oct 22, 2023' }
    ]
  },
  {
    id: 3,
    title: 'How to use AI to generate code faster',
    thumbnail: 'https://picsum.photos/seed/vid3/120/68',
    date: 'Oct 15, 2023',
    languages: [
      { name: 'English (video language)', status: 'Published', type: 'Creator', date: 'Oct 15, 2023' }
    ]
  }
];

export default function Subtitles() {
  const [selectedLanguage, setSelectedLanguage] = useState('All Languages');
  const [expandedVideo, setExpandedVideo] = useState<number | null>(1);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleExpand = (id: number) => {
    setExpandedVideo(expandedVideo === id ? null : id);
  };

  return (
    <div className="max-w-[1200px] mx-auto pb-12 w-full animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Channel subtitles</h1>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 bg-white rounded-full text-sm font-medium transition-colors">
            <Settings className="w-4 h-4" />
            <span>Channel Language Settings</span>
          </button>
        </div>
      </div>
      
      {/* Search and Language Filter Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search for a video..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl text-sm transition-all outline-none"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <select 
              className="appearance-none pl-10 pr-10 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl text-sm font-medium text-gray-700 transition-colors outline-none cursor-pointer"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
            >
              {availableLanguages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
            <Globe className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-4 h-4 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          
          <button className="flex items-center justify-center p-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-700 transition-colors tooltip" title="Advanced Filters">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Videos List Container */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 bg-gray-50/50 text-sm font-medium text-gray-500">
          <div className="col-span-8 sm:col-span-6 pl-4">Video</div>
          <div className="col-span-4 sm:col-span-3">Languages</div>
          <div className="hidden sm:block sm:col-span-3 text-right pr-4">Modified</div>
        </div>

        {/* Video Rows */}
        <div className="divide-y divide-gray-100">
          {subtitlesData.map((video) => (
            <div key={video.id} className="flex flex-col transition-colors hover:bg-blue-50/30">
              
              {/* Main Video Row */}
              <div 
                className={cn(
                  "grid grid-cols-12 gap-4 p-4 items-center cursor-pointer group",
                  expandedVideo === video.id && "bg-blue-50/50"
                )}
                onClick={() => toggleExpand(video.id)}
              >
                <div className="col-span-8 sm:col-span-6 flex gap-4 pr-4">
                  <div className="relative w-24 sm:w-32 aspect-video rounded-lg overflow-hidden shrink-0 border border-gray-200 bg-gray-100">
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col justify-center min-w-0">
                    <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {video.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{video.date}</div>
                  </div>
                </div>
                
                <div className="col-span-4 sm:col-span-3 flex items-center">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
                    <Globe className="w-3.5 h-3.5" />
                    {video.languages.length}
                  </div>
                </div>

                <div className="hidden sm:flex sm:col-span-3 items-center justify-end pr-4 text-sm text-gray-600 gap-4">
                  <span>{video.date}</span>
                  <ChevronDown className={cn(
                    "w-5 h-5 text-gray-400 transition-transform duration-300",
                    expandedVideo === video.id ? "rotate-180 text-blue-600" : "group-hover:text-gray-900"
                  )} />
                </div>
              </div>

              {/* Expanded Languages Details */}
              {expandedVideo === video.id && (
                <div className="bg-white border-t border-gray-100 p-0 animate-in slide-in-from-top-2 fade-in duration-200">
                  <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50/50 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="col-span-3 pl-12 sm:pl-40">Language</div>
                    <div className="col-span-3">Status</div>
                    <div className="col-span-3">Modified on</div>
                    <div className="col-span-3 text-right pr-4">Actions</div>
                  </div>
                  
                  <div className="divide-y divide-gray-50">
                    {video.languages.map((lang, index) => (
                      <div key={index} className="grid grid-cols-12 gap-4 px-4 py-4 items-center hover:bg-gray-50 transition-colors group/lang">
                        <div className="col-span-3 pl-12 sm:pl-40 flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{lang.name}</span>
                          {lang.type === 'Automatic' && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] uppercase font-bold tracking-wide">Auto</span>
                          )}
                        </div>
                        <div className="col-span-3 flex items-center">
                          <span className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                            lang.status === 'Published' ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"
                          )}>
                            {lang.status}
                          </span>
                        </div>
                        <div className="col-span-3 text-sm text-gray-600">
                          {lang.date}
                        </div>
                        <div className="col-span-3 flex justify-end pr-4 gap-2 opacity-0 group-hover/lang:opacity-100 transition-opacity">
                          {lang.status === 'Draft' ? (
                            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm">
                              <Edit2 className="w-3.5 h-3.5" />
                              Edit
                            </button>
                          ) : (
                            <>
                              <button className="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors tooltip" title="Edit">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button className="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors tooltip" title="Download">
                                <FileText className="w-4 h-4" />
                              </button>
                              <button className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded text-gray-600 transition-colors tooltip" title="Delete">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Language Button Row */}
                  <div className="px-4 py-4 bg-gray-50 pl-12 sm:pl-40 border-t border-gray-100 flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors shadow-sm">
                      <Plus className="w-4 h-4 text-blue-600" />
                      Add Language
                    </button>
                    <span className="text-xs text-gray-500">Reach a wider audience by adding more languages.</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
