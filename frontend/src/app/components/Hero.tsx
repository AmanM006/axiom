
import React from 'react';
import { Search, Brain, ArrowRight } from 'lucide-react';

interface HeroProps {
  onEnter?: () => void;
}

export default function Hero({ onEnter }: HeroProps) {
  return (
    <div
      className="min-h-screen font-sans text-white flex flex-col"
      style={{
        // Replicating the exact deep navy dark background with a very subtle center glow
        background: 'radial-gradient(ellipse 80% 80% at 50% 40%, #0c1226 0%, #050813 100%)'
      }}
    >
      {/* 1. TOP NAVIGATION */}
      <header className="w-full border-b border-white/[0.04] px-8 py-5">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-[8px] cursor-pointer" onClick={onEnter}>
            <div className="w-[18px] h-[18px] bg-[#2d5ce9] rounded-full"></div>
            <span className="font-bold text-[22px] tracking-tight leading-none mb-[2px]">deepseek</span>
          </div>

          {/* Center Links */}
          <nav className="hidden md:flex items-center gap-10">
            {['ADVANTAGES', 'CORE FEATURES', 'BENCHMARKS', 'API PLATFORM'].map((item) => (
              <a
                key={item}
                href="#"
                className="text-[11px] font-semibold text-[#8b92a5] tracking-[0.18em] hover:text-white transition-colors"
              >
                {item}
              </a>
            ))}
          </nav>

          {/* Right Section */}
          <div className="text-[13px] font-medium text-white cursor-pointer hover:opacity-80 transition-opacity">
            中文
          </div>
        </div>
      </header>

      {/* 2. HERO CONTENT */}
      <main className="flex-1 flex flex-col items-center pt-[130px] px-4">

        {/* Main Headline */}
        <h1 className="text-[68px] leading-[1.08] font-bold text-center tracking-[-0.03em]">
          DeepSeek <span className="text-[#4b7bf5] italic font-medium">V3</span> — the <span
            className="relative"
            style={{
              textDecoration: 'underline',
              textDecorationStyle: 'dotted',
              textDecorationThickness: '5px',
              textUnderlineOffset: '14px',
              textDecorationColor: 'rgba(255, 255, 255, 0.7)'
            }}
          >Future</span>
          <br />
          of generative <span
            className="italic font-medium"
            style={{
              textDecoration: 'underline',
              textDecorationStyle: 'dotted',
              textDecorationThickness: '5px',
              textUnderlineOffset: '14px',
              textDecorationColor: 'rgba(255, 255, 255, 0.7)'
            }}
          >models</span> is
          <br />
          here
        </h1>

        {/* 3. SEARCH BAR */}
        <div className="mt-16 w-full max-w-[680px] h-[60px] bg-[#161a2b] border border-white/[0.06] rounded-[20px] flex items-center px-2 pl-5 shadow-2xl transition-all focus-within:border-white/[0.15]">

          <Search className="w-[18px] h-[18px] text-[#6d758a] mr-3" strokeWidth={2.5} />

          <input
            type="text"
            placeholder="Ask DeepSeek anything..."
            className="flex-1 bg-transparent border-none outline-none text-[15px] text-white placeholder-[#6d758a]"
          />

          {/* Action Buttons */}
          <div className="flex items-center gap-[6px] pr-1">
            <button className="flex items-center gap-[6px] bg-[#2c3144] hover:bg-[#363c52] text-[#e2e4e9] text-[13px] font-medium h-[40px] px-4 rounded-[12px] transition-colors">
              <Brain className="w-4 h-4" />
              DeepThink
            </button>

            <button 
              onClick={onEnter}
              className="flex items-center justify-center bg-[#2d5ce9] hover:bg-[#2552d6] w-[40px] h-[40px] rounded-[12px] transition-colors"
            >
              <ArrowRight className="w-5 h-5 text-white" strokeWidth={2.5} />
            </button>
          </div>

        </div>

      </main>
    </div>
  );
}

