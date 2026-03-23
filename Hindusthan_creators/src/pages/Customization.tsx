import React, { useState } from 'react';
import { Copy, Plus, HelpCircle, Check } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Customization() {
  const [activeTab, setActiveTab] = useState('Home tab');
  const [isCopied, setIsCopied] = useState(false);
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');

  const channelUrl = 'https://www.youtube.com/channel/UCWF6rBYjo7lMNfeAg-mEq_g';

  const handleCopy = () => {
    navigator.clipboard.writeText(channelUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const hasChanges = description.length > 0 || email.length > 0;

  return (
    <div className="max-w-[1000px] w-full pt-4 pb-24 font-sans animate-in fade-in duration-300">
      
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3 mb-6 px-2 sm:px-0">
        <button className="text-sm font-medium text-[#0f0f0f] hover:bg-[#E5E5E5] px-4 py-2 rounded-full transition-colors flex items-center justify-center">
          View channel
        </button>
        <div className="flex items-center justify-end gap-2">
          <button 
            className="text-sm font-medium px-4 py-2 rounded-full transition-colors text-[#065fd4] hover:bg-[#eef5fe]"
            disabled={!hasChanges}
          >
            Cancel
          </button>
          <button 
            className={cn(
              "text-sm font-medium px-4 py-2 rounded-full transition-colors",
              hasChanges 
                ? "bg-[#065fd4] text-white hover:bg-[#0056b3]" 
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            )}
            disabled={!hasChanges}
          >
            Publish
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-8 px-2 sm:px-0">
          {['Profile', 'Home tab'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "pb-3 text-[15px] font-medium transition-colors relative whitespace-nowrap",
                activeTab === tab ? "text-[#0f0f0f]" : "text-[#606060] hover:text-[#0f0f0f]"
              )}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0f0f0f] rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content Section */}
      <div className="px-2 sm:px-0 max-w-4xl space-y-10">
        
        {activeTab === 'Profile' && (
          <div className="space-y-10 animate-in fade-in duration-300">
            {/* Description / Text Area */}
            <div className="space-y-4">
              <div className="relative">
                <textarea 
                  className="w-full min-h-[140px] text-[15px] text-[#0f0f0f] resize-none outline-none p-3.5 bg-transparent border border-gray-300 rounded-md focus:border-[#065fd4] focus:ring-1 focus:ring-[#065fd4] transition-all placeholder:text-[#606060]"
                  placeholder="Tell viewers about your channel. Your description will appear in the About section of your channel and search results, among other places."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <button className="flex items-center gap-2 text-[14px] font-medium text-[#0f0f0f] hover:bg-gray-100 px-3 py-1.5 -ml-3 rounded transition-colors w-fit">
                <Plus className="w-5 h-5 text-[#606060]" />
                Add language
              </button>
            </div>

            <hr className="border-gray-200 my-8" />

            {/* Channel URL */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <h2 className="text-[15px] font-medium text-[#0f0f0f]">Channel URL</h2>
              </div>
              <p className="text-[13px] text-[#606060] mb-4 flex items-center flex-wrap gap-1">
                This is the standard web address for your channel. It includes your unique channel ID, which is the numbers and letters at the end of the URL.
                <HelpCircle className="w-4 h-4 text-[#606060] cursor-help" />
              </p>

              <div className="flex items-end gap-0 max-w-3xl">
                <div className="flex-1 border border-gray-300 rounded-l-md px-3.5 py-3 bg-[#f9f9f9]">
                  <span className="text-[15px] text-[#0f0f0f] select-all truncate block">
                    {channelUrl}
                  </span>
                </div>
                <button 
                  onClick={handleCopy}
                  className="p-3 border-y border-r border-gray-300 rounded-r-md bg-[#f9f9f9] hover:bg-gray-100 transition-colors flex items-center justify-center min-w-[48px]"
                  title="Copy URL"
                >
                  {isCopied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5 text-[#606060]" />}
                </button>
              </div>
            </div>

            <hr className="border-gray-200 my-8" />

            {/* Links */}
            <div>
              <h2 className="text-[15px] font-medium text-[#0f0f0f] mb-1.5">Links</h2>
              <p className="text-[13px] text-[#606060] mb-4">
                Share external links with your viewers. They'll be visible on your channel profile and about page.
              </p>

              <button className="flex items-center gap-2 text-[14px] font-medium text-[#065fd4] hover:bg-[#eef5fe] px-3 py-1.5 -ml-3 rounded transition-colors w-fit">
                <Plus className="w-5 h-5" />
                Add link
              </button>
            </div>

            <hr className="border-gray-200 my-8" />

            {/* Contact Info */}
            <div>
              <h2 className="text-[15px] font-medium text-[#0f0f0f] mb-1.5">Contact info</h2>
              <p className="text-[13px] text-[#606060] mb-6 max-w-3xl">
                Let people know how to contact you with business inquiries. The email address you enter may appear in the About section of your channel and be visible to viewers.
              </p>

              <div className="relative max-w-sm">
                <label className="absolute -top-2 left-2.5 bg-[#f9f9f9] px-1 text-xs text-[#606060]">
                  Email
                </label>
                <input 
                  type="email" 
                  placeholder="Email address"
                  className="w-full text-[15px] text-[#0f0f0f] outline-none p-3.5 bg-transparent border border-gray-300 rounded-md focus:border-[#065fd4] focus:ring-1 focus:ring-[#065fd4] transition-all placeholder:text-transparent"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <hr className="border-gray-200 my-8" />

            {/* Video Watermark */}
            <div>
              <h2 className="text-[15px] font-medium text-[#0f0f0f] mb-1.5">Video watermark</h2>
              <p className="text-[13px] text-[#606060] mb-6">
                The watermark will appear on your videos in the right-hand corner of the video player
              </p>

              <div className="flex pl-0 sm:pl-10 items-start gap-8 max-w-3xl flex-col sm:flex-row">
                {/* The Image Box */}
                <div className="shrink-0">
                   <div className="w-[300px] h-[169px] border bg-[#e5e5e5] rounded flex items-end justify-end p-2 relative overflow-hidden border-gray-300">
                      {/* Fake Youtube Player Elements */}
                      <div className="w-8 h-8 rounded bg-red-500/20 absolute bottom-3 right-3 flex items-center justify-center opacity-80 border border-red-500">
                        <div className="w-4 h-4 bg-red-600 clip-play"></div>
                      </div>
                   </div>
                </div>
                
                {/* Instructions & Upload */}
                <div className="flex-1 mt-1">
                  <p className="text-[13px] text-[#606060] mb-4">
                    An image that's 150 x 150 pixels is recommended. Use a PNG, GIF (no animations), BMP, or JPEG file that's 1MB or less.
                  </p>
                  <button className="text-[14px] font-medium text-[#065fd4] hover:text-[#0056b3] transition-colors leading-6 tracking-wide">
                    UPLOAD
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HOME TAB */}
        {activeTab === 'Home tab' && (
          <div className="space-y-10 animate-in fade-in duration-300">
            {/* Top Switch */}
            <div className="flex items-center justify-between pb-6 border-b border-gray-200">
              <p className="text-[14px] text-[#0f0f0f]">
                Show your channel home tab to highlight & showcase content for your audience
              </p>
              <div className="w-9 h-[14px] bg-[#065fd4] bg-opacity-30 rounded-full relative cursor-pointer flex items-center shrink-0">
                <div className="absolute right-0 w-5 h-5 bg-[#065fd4] rounded-full shadow-md hover:ring-8 hover:ring-[#065fd4]/10 transition-all"></div>
              </div>
            </div>

            {/* Layout Section */}
            <div>
              <div className="flex items-baseline justify-between mb-4">
                <div>
                   <h2 className="text-[16px] font-medium text-[#0f0f0f] mb-1">Layout</h2>
                   <p className="text-[13px] text-[#606060] flex items-center gap-1.5 font-medium">
                     Customize the layout of your channel homepage with up to 12 sections 
                     <HelpCircle className="w-4 h-4 text-[#606060] cursor-help" />
                   </p>
                </div>
                <button className="flex items-center gap-2 text-[14px] font-medium text-[#065fd4] hover:bg-[#eef5fe] px-3 py-1.5 -mr-3 rounded-full transition-colors relative top-1">
                   <Plus className="w-5 h-5" />
                   Add section
                </button>
              </div>

              {/* Section List */}
              <div className="space-y-3 mt-8">
                {[
                  { title: 'For You', desc: "YouTube recommends fresh content based on your viewers' interests. This is only visible to your viewers when you have enough content. ", link: 'More Settings' },
                  { title: 'Videos (0)', desc: 'This section will appear when a video has been uploaded' },
                  { title: 'Short videos (0)', desc: 'This section will appear after a short video has been uploaded' },
                  { title: 'Past live streams (0)', desc: 'This section will appear for when there are archived live streams' },
                  { title: 'Created playlists (0)', desc: "This section will appear when there's a public playlist" },
                  { title: 'Posts (0)', desc: 'This section will appear after a post has been created' },
                ].map((section, idx) => (
                  <div key={idx} className="flex items-start gap-5 p-4 py-5 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors bg-white group cursor-default">
                    <div className="flex flex-col gap-1 mt-1 opacity-20 group-hover:opacity-60 cursor-grab px-1">
                      <div className="w-[14px] h-[2px] bg-[#0f0f0f]"></div>
                      <div className="w-[14px] h-[2px] bg-[#0f0f0f]"></div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[14px] font-medium text-[#0f0f0f] mb-0.5">{section.title}</h3>
                      <p className="text-[13px] text-[#606060]">
                        {section.desc}
                        {section.link && <span className="text-[#065fd4] font-medium cursor-pointer ml-1">{section.link} <HelpCircle className="w-3.5 h-3.5 inline text-[#606060] -mt-0.5 ml-0.5 cursor-help" /></span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
