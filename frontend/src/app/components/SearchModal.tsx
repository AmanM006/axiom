"use client";

import React, { useState, useEffect, useRef } from 'react';

interface SearchResult {
  id: string;
  type: 'incident' | 'service' | 'env' | 'tab';
  title: string;
  subtitle: string;
  target: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string, context?: string) => void;
}

const ALL_RESULTS: SearchResult[] = [
  { id: '1', type: 'incident', title: 'Cascading DB Failure', subtitle: 'Critical • payment-service', target: 'db_cascade' },
  { id: '2', type: 'incident', title: 'Memory Leak', subtitle: 'High • image-processor', target: 'memory_leak' },
  { id: '3', type: 'service', title: 'payment-service', subtitle: 'Core Service', target: 'payment-service' },
  { id: '4', type: 'service', title: 'api-gateway', subtitle: 'Infrastructure', target: 'api-gateway' },
  { id: '5', type: 'env', title: 'Production', subtitle: 'Cluster us-east-1', target: 'Production' },
  { id: '6', type: 'env', title: 'Staging', subtitle: 'Cluster us-west-2', target: 'Staging' },
  { id: '7', type: 'tab', title: 'SLO Tracking', subtitle: 'Infrastructure Views', target: 'slo' },
  { id: '8', type: 'tab', title: 'On-call Rotation', subtitle: 'Team Management', target: 'oncall' },
];

export default function SearchModal({ isOpen, onClose, onNavigate }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredResults = query === '' 
    ? ALL_RESULTS.slice(0, 5) 
    : ALL_RESULTS.filter(r => r.title.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') setSelectedIndex(s => (s + 1) % filteredResults.length);
      if (e.key === 'ArrowUp') setSelectedIndex(s => (s - 1 + filteredResults.length) % filteredResults.length);
      if (e.key === 'Enter') {
        const selected = filteredResults[selectedIndex];
        if (selected) {
           handleSelect(selected);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredResults, selectedIndex]);

  const handleSelect = (result: SearchResult) => {
    if (result.type === 'incident') onNavigate('issues', result.target);
    if (result.type === 'service') onNavigate('service-dashboard', result.target);
    if (result.type === 'env') onNavigate('env', result.target);
    if (result.type === 'tab') onNavigate(result.target);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative w-full max-w-[640px] bg-[#121214] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-4">
          <svg className="w-5 h-5 text-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input 
            ref={inputRef}
            className="flex-1 bg-transparent border-none outline-none text-[16px] text-white placeholder:text-white/20"
            placeholder="Search for incidents, services, or environments..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-[10px] font-bold text-white/20">ESC</div>
        </div>

        <div className="max-h-[400px] overflow-y-auto p-2 scrollbar-hide">
          {filteredResults.map((result, i) => (
            <div 
              key={result.id}
              onClick={() => handleSelect(result)}
              onMouseEnter={() => setSelectedIndex(i)}
              className={`flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer transition-all ${i === selectedIndex ? 'bg-white/[0.08] text-white' : 'text-white/40'}`}
            >
              <div className="flex items-center gap-4">
                 <div className={`w-8 h-8 rounded-md flex items-center justify-center text-[11px] font-bold ${i === selectedIndex ? 'bg-[#5E6AD2] text-white' : 'bg-white/5 text-white/20'}`}>
                    {result.type[0].toUpperCase()}
                 </div>
                 <div>
                    <div className="text-[14px] font-bold">{result.title}</div>
                    <div className="text-[11px] font-medium opacity-60 mt-0.5">{result.subtitle}</div>
                 </div>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-20">{result.type}</div>
            </div>
          ))}

          {filteredResults.length === 0 && (
            <div className="py-12 text-center text-white/20 text-[14px]">
               No results found for "{query}"
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-white/5 bg-white/[0.02] flex items-center gap-6">
           <div className="flex items-center gap-2">
              <div className="px-1 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-bold text-white/30">↑↓</div>
              <span className="text-[11px] text-white/20 font-medium tracking-tight">Navigate</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="px-1 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-bold text-white/30">ENTER</div>
              <span className="text-[11px] text-white/20 font-medium tracking-tight">Open</span>
           </div>
        </div>
      </div>
    </div>
  );
}
