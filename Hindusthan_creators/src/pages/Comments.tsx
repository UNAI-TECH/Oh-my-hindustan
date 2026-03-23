import React, { useState } from 'react';
import { 
  Filter, MessageSquare, ThumbsUp, ThumbsDown, 
  Heart, MoreVertical, Search, CornerDownRight, 
  CheckCircle2, Trash2, UserX, X
} from 'lucide-react';
import { cn } from '../lib/utils';

const tabs = ['Published', 'Held for review'];

const commentsData = [
  {
    id: 1,
    user: 'Alex Developer',
    avatar: 'https://picsum.photos/seed/alex/40/40',
    time: '2 hours ago',
    text: 'This was incredibly helpful! I was struggling with Tailwind configurations and your explanation on the custom utility classes completely solved my issue. Do you have a video on complex grid layouts?',
    likes: 12,
    hearted: false,
    video: {
      title: 'Building a Modern Dashboard with React & Tailwind CSS',
      thumbnail: 'https://picsum.photos/seed/vid1/120/68'
    }
  },
  {
    id: 2,
    user: 'Creative UX',
    avatar: 'https://picsum.photos/seed/ux/40/40',
    time: '5 hours ago',
    text: 'The glassmorphism effects at 8:45 are so sleek. I\'ve been trying to replicate that but mine always looks muddy. Thanks for sharing the exact exact drop-shadow values!',
    likes: 45,
    hearted: true,
    video: {
      title: '10 UI Design Tips for Better Dashboards',
      thumbnail: 'https://picsum.photos/seed/vid2/120/68'
    }
  },
  {
    id: 3,
    user: 'Tech Enthusiast',
    avatar: 'https://picsum.photos/seed/tech/40/40',
    time: '1 day ago',
    text: 'Great video, but I think you missed a crucial step when setting up the authentication flow. What happens if the token expires during the API call?',
    likes: 3,
    hearted: false,
    video: {
      title: 'How to use AI to generate code faster',
      thumbnail: 'https://picsum.photos/seed/vid3/120/68'
    }
  },
  {
    id: 4,
    user: 'Sarah Codes',
    avatar: 'https://picsum.photos/seed/sarah/40/40',
    time: '2 days ago',
    text: 'Loved this! Can you make a follow-up video on integrating this with Next.js?',
    likes: 128,
    hearted: false,
    video: {
      title: 'Mastering TypeScript in 2024 (Full Course)',
      thumbnail: 'https://picsum.photos/seed/vid4/120/68'
    }
  }
];

export default function Comments() {
  const [activeTab, setActiveTab] = useState('Published');
  const [comments, setComments] = useState(commentsData);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');

  const toggleHeart = (id: number) => {
    setComments(comments.map(c => c.id === id ? { ...c, hearted: !c.hearted } : c));
  };

  const handleReplySubmit = (e: React.FormEvent, id: number) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    // In a real app, we would add the reply to the comment thread here.
    setReplyingTo(null);
    setReplyText('');
  };

  return (
    <div className="max-w-[1200px] mx-auto pb-12 w-full animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Channel comments</h1>
      </div>
      
      {/* Search and Filter Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search comments..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl text-sm transition-all outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-8 border-b border-gray-200 mb-6">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "pb-4 text-[15px] font-medium transition-colors relative",
              activeTab === tab ? "text-blue-600" : "text-gray-500 hover:text-gray-900"
            )}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full shadow-[0_-2px_8px_rgba(37,99,235,0.4)]" />
            )}
          </button>
        ))}
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <div 
            key={comment.id} 
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-100 transition-all group"
          >
            <div className="flex gap-4 sm:gap-6">
              
              {/* Avatar */}
              <div className="shrink-0 relative">
                <img src={comment.avatar} alt={comment.user} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-transparent group-hover:border-blue-100 transition-colors" />
                {comment.hearted && (
                  <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full shadow-sm">
                    <div className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center">
                      <Heart className="w-2.5 h-2.5 text-red-500 fill-red-500" />
                    </div>
                  </div>
                )}
              </div>

              {/* Comment Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900 text-sm whitespace-nowrap">{comment.user}</span>
                  <span className="text-xs text-gray-500 whitespace-nowrap">{comment.time}</span>
                </div>
                
                <p className="text-gray-800 text-[15px] leading-relaxed mb-3">
                  {comment.text}
                </p>

                {/* Actions Toolbar */}
                <div className="flex items-center gap-1 sm:gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-900 transition-colors tooltip flex items-center gap-1.5" title="Like">
                    <ThumbsUp className="w-4 h-4" />
                    <span className="text-xs font-medium">{comment.likes > 0 && comment.likes}</span>
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-900 transition-colors tooltip" title="Dislike">
                    <ThumbsDown className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => toggleHeart(comment.id)} 
                    className={cn(
                      "p-2 rounded-full transition-colors tooltip",
                      comment.hearted ? "text-red-500 hover:bg-red-50" : "text-gray-500 hover:text-red-500 hover:bg-red-50"
                    )}
                    title={comment.hearted ? "Remove heart" : "Heart comment"}
                  >
                    <Heart className={cn("w-4 h-4", comment.hearted && "fill-current")} />
                  </button>
                  
                  <div className="w-px h-4 bg-gray-200 mx-2 hidden sm:block"></div>

                  <button 
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    className="px-3 py-1.5 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Reply
                  </button>

                  <div className="flex-1"></div>

                  {/* Hidden by default, shown on hover (desktop) */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <button className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-full transition-colors tooltip" title="Remove">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 text-gray-400 hover:text-gray-900 rounded-full transition-colors tooltip" title="Hide user from channel">
                      <UserX className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 text-gray-400 hover:text-gray-900 rounded-full transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Reply Form */}
                {replyingTo === comment.id && (
                  <div className="mt-4 flex gap-3 animate-in slide-in-from-top-2 fade-in duration-200">
                     <CornerDownRight className="w-5 h-5 text-gray-300 shrink-0 mt-3" />
                     <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
                       <form onSubmit={(e) => handleReplySubmit(e, comment.id)}>
                         <textarea 
                           className="w-full bg-transparent border-none focus:ring-0 p-3 text-sm text-gray-800 resize-none outline-none min-h-[80px]"
                           placeholder="Add a public reply..."
                           autoFocus
                           value={replyText}
                           onChange={(e) => setReplyText(e.target.value)}
                         />
                         <div className="flex justify-end gap-2 p-2 bg-white border-t border-gray-100">
                           <button 
                             type="button" 
                             onClick={() => setReplyingTo(null)}
                             className="px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                           >
                             Cancel
                           </button>
                           <button 
                             type="submit"
                             disabled={!replyText.trim()}
                             className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 rounded-full transition-colors shadow-sm"
                           >
                             Reply
                           </button>
                         </div>
                       </form>
                     </div>
                  </div>
                )}
              </div>

              {/* Video Reference */}
              <div className="hidden md:flex w-36 shrink-0 flex-col gap-2 opacity-80 group-hover:opacity-100 transition-opacity cursor-pointer">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                  <img src={comment.video.thumbnail} alt={comment.video.title} className="w-full h-full object-cover" />
                </div>
                <div className="text-xs text-gray-500 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
                  {comment.video.title}
                </div>
              </div>
            </div>
            
          </div>
        ))}
      </div>
    </div>
  );
}
