import React, { useState } from 'react';
import { Terminal, Bot, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeroProps {
  onEnter?: () => void;
}

export default function Hero({ onEnter }: HeroProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="min-h-screen font-sans text-white flex flex-col relative overflow-hidden"
      style={{
        background: '#040710'
      }}
    >
      {/* Dynamic Background Glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[80vw] h-[60vh] bg-[#2d5ce9]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-1/4 w-[50vw] h-[50vh] bg-[#4b7bf5]/10 rounded-full blur-[100px]" />
      </div>

      {/* 1. TOP NAVIGATION */}
      <header className="relative z-10 w-full border-b border-white/[0.04] px-8 py-5">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-[10px] cursor-pointer group" onClick={onEnter}>
            <div className="w-[22px] h-[22px] bg-gradient-to-br from-[#4b7bf5] to-[#2d5ce9] rounded-[6px] shadow-[0_0_15px_rgba(75,123,245,0.4)] flex items-center justify-center transition-transform group-hover:scale-105">
              <span className="text-[12px] font-bold text-white leading-none mb-[1px]">A</span>
            </div>
            <span className="font-bold text-[20px] tracking-[0.1em] leading-none mb-[2px] group-hover:text-[#4b7bf5] transition-colors">AXIOM</span>
          </div>

          {/* Center Links */}
          <nav className="hidden md:flex items-center gap-10">
            {['ADVANTAGES', 'CORE FEATURES', 'BENCHMARKS', 'API PLATFORM'].map((item) => (
              <a
                key={item}
                href="#"
                className="text-[11px] font-semibold text-[#8b92a5] tracking-[0.18em] hover:text-[#4b7bf5] transition-colors"
              >
                {item}
              </a>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            <button className="text-[12px] font-semibold tracking-[0.1em] text-[#8b92a5] hover:text-white transition-colors">
              DOCS
            </button>
            <button 
              onClick={onEnter}
              className="text-[11px] font-bold tracking-[0.15em] bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.1] hover:border-white/[0.2] px-4 py-2 rounded-full transition-all"
            >
              DASHBOARD
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO CONTENT */}
      <main className="relative z-10 flex-1 flex flex-col items-center pt-[140px] px-4">
        
        {/* Status Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-[10px] font-bold tracking-[0.15em] text-blue-300 uppercase">V1.0 is Live</span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-[60px] md:text-[76px] leading-[1.05] font-bold text-center tracking-[-0.03em] max-w-4xl"
        >
          AXIOM <span className="text-[#4b7bf5] italic font-medium">V1</span> — the <span
            className="relative inline-block"
            style={{
              textDecoration: 'underline',
              textDecorationStyle: 'dotted',
              textDecorationThickness: '4px',
              textUnderlineOffset: '12px',
              textDecorationColor: 'rgba(75, 123, 245, 0.6)'
            }}
          >Future</span>
          <br />
          of Autonomous <span
            className="italic font-medium text-white/90"
          >SRE</span> is here
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-8 text-[18px] text-[#8b92a5] font-medium text-center max-w-2xl leading-relaxed"
        >
          Execution over suggestion. The world's first agentic reliability platform that not only finds root causes, but safely patches production in seconds.
        </motion.p>

        {/* 3. AGENT COMMAND PROMPT */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-14 w-full max-w-[720px] relative group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Animated glow border effect */}
          <div className={`absolute -inset-1 bg-gradient-to-r from-[#2d5ce9] to-[#4b7bf5] rounded-[24px] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200`}></div>
          
          <div className="relative h-[68px] bg-[#0A0D18]/80 backdrop-blur-xl border border-white/[0.08] rounded-[22px] flex items-center px-2 pl-6 shadow-2xl transition-all group-hover:border-[#4b7bf5]/30">
            <Terminal className="w-[20px] h-[20px] text-[#4b7bf5] mr-4" strokeWidth={2.5} />
            
            <input
              type="text"
              placeholder="Diagnose payment-service latency..."
              className="flex-1 bg-transparent border-none outline-none text-[16px] font-mono text-white placeholder-[#6d758a]"
            />

            {/* Action Buttons */}
            <div className="flex items-center gap-[8px] pr-1">
              <button 
                onClick={onEnter}
                className="flex items-center gap-[8px] bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.05] text-[#e2e4e9] text-[13px] font-bold tracking-wide h-[44px] px-5 rounded-[16px] transition-all"
              >
                <Bot className="w-4 h-4 text-[#8b92a5]" />
                Auto-Triage
              </button>

              <button 
                onClick={onEnter}
                className="flex items-center justify-center bg-gradient-to-r from-[#2d5ce9] to-[#4b7bf5] hover:opacity-90 w-[44px] h-[44px] rounded-[16px] transition-all shadow-[0_0_20px_rgba(75,123,245,0.3)]"
              >
                <ArrowRight className={`w-5 h-5 text-white transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </motion.div>
        
        {/* Trusted By (Subtle) */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="mt-20 flex flex-col items-center"
        >
          <span className="text-[10px] font-bold tracking-[0.2em] text-[#6d758a] uppercase mb-6">Powered by</span>
          <div className="flex items-center gap-12 opacity-50 grayscale">
            <div className="text-[16px] font-bold tracking-wider">AMD MI300X</div>
            <div className="text-[16px] font-bold tracking-wider">HUGGING FACE</div>
            <div className="text-[16px] font-bold tracking-wider">VLLM</div>
          </div>
        </motion.div>

      </main>
    </div>
  );
}

