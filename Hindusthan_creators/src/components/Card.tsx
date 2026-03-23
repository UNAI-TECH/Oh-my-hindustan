import React from 'react';
import { cn } from '../lib/utils';

export const Card = ({ children, className = '', title, action }: { children: React.ReactNode, className?: string, title?: string, action?: React.ReactNode }) => (
  <div className={cn("bg-white rounded-xl border border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col", className)}>
    {(title || action) && (
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
        {title && <h2 className="text-lg font-medium text-gray-900">{title}</h2>}
        {action && <div>{action}</div>}
      </div>
    )}
    <div className="p-6 flex-1 flex flex-col">
      {children}
    </div>
  </div>
);
