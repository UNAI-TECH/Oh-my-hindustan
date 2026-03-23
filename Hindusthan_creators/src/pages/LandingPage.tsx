import React from 'react';
import { PlaySquare, Users, Star, ArrowRight, CheckCircle2 } from 'lucide-react';

interface LandingPageProps {
  onJoinClick: () => void;
  onLoginClick: () => void;
}

export default function LandingPage({ onJoinClick, onLoginClick }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-white text-[#0f0f0f] font-sans">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
            <PlaySquare className="w-6 h-6 text-white" fill="currentColor" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-gray-900">Hindusthan Creators</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={onLoginClick}
            className="px-6 py-2 text-sm font-semibold text-gray-600 hover:text-red-600 transition-colors"
          >
            Sign In
          </button>
          <button 
            onClick={onJoinClick}
            className="px-6 py-2.5 bg-red-600 text-white rounded-full text-sm font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 active:scale-95"
          >
            JOIN NOW
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 lg:py-32 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full text-sm font-bold mb-8 animate-bounce">
          <Star className="w-4 h-4 fill-current" />
          <span>Join the Voice of Bharat</span>
        </div>
        <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
          Share Your Story with <br />
          <span className="bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">Millions of Indians</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mb-12 leading-relaxed">
          The ultimate platform for Indian creators to share news, blogs, and analysis. Reach 1.4 billion people with your unique perspective.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={onJoinClick}
            className="group px-10 py-5 bg-red-600 text-white rounded-2xl text-lg font-bold hover:bg-red-700 transition-all shadow-xl shadow-red-200 flex items-center gap-3"
          >
            Start Your Journey 
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="px-10 py-5 bg-white text-gray-800 border-2 border-gray-100 rounded-2xl text-lg font-bold hover:bg-gray-50 transition-all">
            See What's Possible
          </button>
        </div>
      </section>

      {/* Stats/Features */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-12">
          <FeatureCard 
            icon={Users} 
            title="Massive Reach" 
            desc="Connect with an engaged audience across every state and language of India."
          />
          <FeatureCard 
            icon={Star} 
            title="Premium Tools" 
            desc="High-end dashboard to manage your content, analytics, and community."
          />
          <FeatureCard 
            icon={CheckCircle2} 
            title="Verified Status" 
            desc="Get the blue checkmark and build trust with your followers instantly."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-100 text-center text-gray-400 text-sm">
        <p>© 2026 Oh My Hindustan. Empowering Indian Voices.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }: any) {
  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 transition-all hover:shadow-xl hover:-translate-y-2">
      <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-2xl font-bold mb-4">{title}</h3>
      <p className="text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}
