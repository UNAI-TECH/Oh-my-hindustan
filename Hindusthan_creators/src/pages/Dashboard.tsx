import React from 'react';
import {
  AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  ArrowUpRight, CheckCircle2, Trophy, Eye, Clock, Sparkles, Lightbulb, PlaySquare, ThumbsUp, MessageSquare
} from 'lucide-react';
import { Card } from '../components/Card';
import { videoService, Video } from '../services/videoService';
import { useEffect, useState } from 'react';

const chartData = [
  { name: 'Oct 1', views: 1200 },
  { name: 'Oct 5', views: 1800 },
  { name: 'Oct 10', views: 1500 },
  { name: 'Oct 15', views: 2400 },
  { name: 'Oct 20', views: 2100 },
  { name: 'Oct 25', views: 3200 },
  { name: 'Oct 28', views: 2900 },
];

export default function Dashboard() {
  const [recentVideos, setRecentVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      const videos = await videoService.getRecentVideos();
      if (videos.length > 0) {
        setRecentVideos(videos);
      }
      setLoading(false);
    };

    fetchVideos();
  }, []);
  return (
    <div className="max-w-[1600px] mx-auto w-full animate-in fade-in duration-300">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Channel dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Column 1: Latest Video & Achievements */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card title="Latest video performance">
            <div className="flex flex-col gap-4">
              <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 group cursor-pointer">
                <img src="https://picsum.photos/seed/thumbnail1/640/360" alt="Thumbnail" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                  10:24
                </div>
              </div>
              <h3 className="font-medium text-gray-900 line-clamp-2 hover:text-blue-600 cursor-pointer transition-colors">10 UI Design Tips for Better Dashboards</h3>
              <div className="text-sm text-gray-500">First 24 hours:</div>

              <div className="flex flex-col gap-3 mt-2">
                <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
                  <span className="text-gray-600 text-sm">Ranking by views</span>
                  <span className="font-medium text-gray-900 text-sm">1 of 10</span>
                </div>
                <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
                  <span className="text-gray-600 text-sm">Views</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 text-sm">1,234</span>
                    <ArrowUpRight className="w-4 h-4 text-green-600" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
                  <span className="text-gray-600 text-sm">Impressions CTR</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 text-sm">5.6%</span>
                    <ArrowUpRight className="w-4 h-4 text-green-600" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
                  <span className="text-gray-600 text-sm">Average view duration</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 text-sm">4:20</span>
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-4">
                <button className="w-full py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  GO TO VIDEO ANALYTICS
                </button>
              </div>
            </div>
          </Card>

          <Card title="Milestones">
            <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl border border-yellow-100">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center shrink-0">
                <Trophy className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">100,000 Subscribers!</h3>
                <p className="text-sm text-gray-600 mt-0.5">Congratulations on reaching this amazing milestone. Keep creating!</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Column 2: Channel Analytics & Recent Uploads */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Channel analytics" action={<button className="text-sm text-blue-600 font-medium hover:underline">ADVANCED MODE</button>}>
              <div className="flex flex-col h-full">
                <div>
                  <div className="text-sm text-gray-600">Current subscribers</div>
                  <div className="text-4xl font-light text-gray-900 mt-1">124,592</div>
                  <div className="text-sm text-green-600 flex items-center gap-1 mt-1">
                    <ArrowUpRight className="w-4 h-4" />
                    <span>+842 in last 28 days</span>
                  </div>
                </div>

                <div className="h-px bg-gray-200 w-full my-6"></div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Summary <span className="text-sm font-normal text-gray-500 ml-1">Last 28 days</span></h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-300 transition-colors cursor-pointer group">
                      <div className="text-sm text-gray-600 flex items-center gap-2">
                        <Eye className="w-4 h-4" /> Views
                      </div>
                      <div className="text-2xl font-medium text-gray-900 mt-2 group-hover:text-blue-600 transition-colors">45.2K</div>
                      <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                        <ArrowUpRight className="w-3 h-3" /> 12% more
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-300 transition-colors cursor-pointer group">
                      <div className="text-sm text-gray-600 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Watch time
                      </div>
                      <div className="text-2xl font-medium text-gray-900 mt-2 group-hover:text-blue-600 transition-colors">3.8K</div>
                      <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                        <ArrowUpRight className="w-3 h-3" /> 8% more
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-40 mt-6 -ml-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1a73e8" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#1a73e8" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        itemStyle={{ color: '#1a73e8', fontWeight: 500 }}
                      />
                      <Area type="monotone" dataKey="views" stroke="#1a73e8" strokeWidth={2} fillOpacity={1} fill="url(#colorViews)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-auto pt-4">
                  <button className="w-full py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    GO TO CHANNEL ANALYTICS
                  </button>
                </div>
              </div>
            </Card>

            <div className="flex flex-col gap-6">
              <Card title="Ideas for you">
                <div className="flex flex-col gap-4">
                  <div className="flex gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 text-sm">AI Title Suggestions</h3>
                      <p className="text-xs text-gray-600 mt-1">Try using our new AI tool to generate catchy titles for your next video.</p>
                      <button className="mt-3 text-xs font-medium text-blue-600 hover:underline">TRY IT NOW</button>
                    </div>
                  </div>
                  <div className="flex gap-4 p-4 bg-amber-50 rounded-xl border border-amber-100 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                      <Lightbulb className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 text-sm">Community Tab</h3>
                      <p className="text-xs text-gray-600 mt-1">Channels that post weekly polls see a 15% increase in returning viewers.</p>
                      <button className="mt-3 text-xs font-medium text-amber-700 hover:underline">CREATE A POST</button>
                    </div>
                  </div>
                </div>
              </Card>

              <Card title="Creator Insider">
                <div className="flex flex-col gap-4">
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 group cursor-pointer">
                    <img src="https://picsum.photos/seed/insider/640/360" alt="Thumbnail" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:bg-red-600 transition-colors">
                        <PlaySquare className="w-6 h-6 text-white" fill="currentColor" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer transition-colors">New features for Shorts creators</h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mt-1">Learn about the latest updates to YouTube Shorts, including new editing tools and analytics features.</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <Card title="Recent uploads" className="flex-1">
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-200 text-sm text-gray-500">
                    <th className="pb-3 font-medium px-4 w-1/2">Video</th>
                    <th className="pb-3 font-medium px-4">Visibility</th>
                    <th className="pb-3 font-medium px-4">Date</th>
                    <th className="pb-3 font-medium px-4 text-right">Views</th>
                    <th className="pb-3 font-medium px-4 text-right">Comments</th>
                    <th className="pb-3 font-medium px-4 text-right">Likes</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          Loading videos...
                        </div>
                      </td>
                    </tr>
                  ) : recentVideos.length > 0 ? (
                    recentVideos.map((video) => (
                      <tr key={video.id} className="hover:bg-gray-50 transition-colors group cursor-pointer">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-4">
                            <div className="relative w-24 aspect-video rounded bg-gray-200 overflow-hidden shrink-0">
                              <img src={video.thumbnail_url} className="w-full h-full object-cover" alt={video.title} />
                              <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded">{video.duration}</div>
                            </div>
                            <div className="max-w-[200px] sm:max-w-xs">
                              <div className="font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                {video.title}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">{video.category}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-green-600">
                            <Eye className="w-4 h-4" />
                            <span>{video.visibility}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          <div>{new Date(video.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                          <div className="text-xs text-gray-400">Published</div>
                        </td>
                        <td className="py-3 px-4 text-right text-gray-900">{video.views}</td>
                        <td className="py-3 px-4 text-right text-gray-900">{video.comments_count}</td>
                        <td className="py-3 px-4 text-right text-gray-900">
                          <div>{video.likes_percentage}%</div>
                          <div className="text-xs text-gray-400">{video.likes_count} likes</div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    // Fallback to mock loop if no videos found in DB (to keep the UI looking good while setting up)
                    [1, 2, 3].map((i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors group cursor-pointer">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-4">
                            <div className="relative w-24 aspect-video rounded bg-gray-200 overflow-hidden shrink-0">
                              <img src={`https://picsum.photos/seed/vid${i}/320/180`} className="w-full h-full object-cover" alt="Thumb" />
                              <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded">12:34</div>
                            </div>
                            <div className="max-w-[200px] sm:max-w-xs">
                              <div className="font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                {i === 1 ? "Building a Modern Dashboard with React & Tailwind CSS" : i === 2 ? "10 UI Design Tips for Better Dashboards" : "How to use AI to generate code faster"}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">React Tutorial</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-green-600">
                            <Eye className="w-4 h-4" />
                            <span>Public</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          <div>Oct {24 - i}, 2023</div>
                          <div className="text-xs text-gray-400">Published</div>
                        </td>
                        <td className="py-3 px-4 text-right text-gray-900">{12.4 - i}K</td>
                        <td className="py-3 px-4 text-right text-gray-900">{342 - i * 10}</td>
                        <td className="py-3 px-4 text-right text-gray-900">
                          <div>{98.5 - i}%</div>
                          <div className="text-xs text-gray-400">{1.2 - i * 0.1}K likes</div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-auto pt-4 border-t border-gray-100 text-center">
              <button className="text-sm font-medium text-blue-600 hover:underline">VIEW MORE</button>
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 mt-6">
        <Card title="Latest comments">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all bg-gray-50/50">
                <img src={`https://picsum.photos/seed/user${i}/32/32`} className="w-8 h-8 rounded-full shrink-0" alt="Avatar" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="font-medium text-gray-900">User Name {i}</span>
                    <span>•</span>
                    <span>{i * 2} hours ago</span>
                  </div>
                  <p className="text-sm text-gray-800 mt-1 line-clamp-2">
                    This is an amazing tutorial! I've been looking for something exactly like this to help me build my next project. Keep up the great work!
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <button className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors">
                      <ThumbsUp className="w-3 h-3" /> 12
                    </button>
                    <button className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors">
                      <MessageSquare className="w-3 h-3" /> Reply
                    </button>
                  </div>
                </div>
                <img src={`https://picsum.photos/seed/vid${i}/64/36`} className="w-16 h-9 rounded object-cover shrink-0" alt="Video" />
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <button className="text-sm font-medium text-blue-600 hover:underline">VIEW MORE</button>
          </div>
        </Card>
      </div>

    </div>
  );
}
