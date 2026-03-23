import React from 'react';
import { Clock, CheckCircle, ArrowLeft } from 'lucide-react';

interface RequestPendingProps {
  onBack: () => void;
}

export default function RequestPending({ onBack }: RequestPendingProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-8 animate-pulse">
        <Clock className="w-12 h-12" />
      </div>
      
      <h1 className="text-4xl font-extrabold mb-4">Request Pending</h1>
      <p className="text-xl text-gray-500 max-w-md mb-12 leading-relaxed">
        We've received your application! Our admin team is reviewing your profile. 
        You'll receive an email with your credentials once approved.
      </p>

      <div className="bg-gray-50 p-8 rounded-[2rem] max-w-md w-full mb-12 border border-gray-100">
        <div className="flex items-start gap-4 text-left">
          <div className="shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center mt-1">
            <CheckCircle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900">Application Submitted</h4>
            <p className="text-sm text-gray-500">Your details are safely stored in our database.</p>
          </div>
        </div>
        
        <div className="my-6 border-l-2 border-dashed border-gray-200 ml-3 h-8"></div>

        <div className="flex items-start gap-4 text-left">
          <div className="shrink-0 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center mt-1">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900">Admin Review</h4>
            <p className="text-sm text-gray-500">This usually takes 24-48 hours.</p>
          </div>
        </div>
      </div>

      <button 
        onClick={onBack}
        className="px-10 py-4 bg-gray-900 text-white rounded-2xl text-lg font-bold hover:bg-black transition-all flex items-center gap-3 active:scale-95"
      >
        <ArrowLeft className="w-5 h-5" />
        Return to Home
      </button>
    </div>
  );
}
