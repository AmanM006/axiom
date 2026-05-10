"use client";

import { motion } from "framer-motion";

export default function CostSavingsGraph() {
    // Data points for the SVG path
    // X goes from 0 to 800 (representing 0 to 120 minutes)
    // Y goes from 0 to 300 (inverted for SVG, representing $0 to $700k)
    
    // Human SRE cost curve: linearly increasing until minute 120 (X=800), reaching $672k (Y=20)
    const humanPath = "M 0 280 L 800 20";
    
    // AXIOM cost curve: increases at the same rate, but STOPS at minute 1.5 (X=10), capping cost at $8.4k (Y=275)
    // Then it stays flat (horizontal line) for the rest of the time.
    const axiomPath = "M 0 280 L 15 270 L 800 270";
    
    // Area representing the saved cost
    const savedAreaPath = "M 15 270 L 800 20 L 800 270 Z";

    return (
        <section className="relative py-32 px-10 border-t" style={{ background: "#040710", borderColor: "rgba(255,255,255,0.05)" }}>
            <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
                
                {/* Left Side: Text and Context */}
                <div className="flex-1">
                    <span
                        className="text-[9px] font-bold tracking-[0.26em] uppercase mb-6 block"
                        style={{ fontFamily: "'Syne', sans-serif", color: "rgba(75,123,245,0.7)" }}
                    >
                        — THE ROI OF AUTONOMY —
                    </span>
                    <h2
                        className="text-white leading-[1.1] tracking-tight mb-6"
                        style={{
                            fontFamily: "'Syne', sans-serif",
                            fontSize: "clamp(2rem, 3vw, 2.5rem)",
                            fontWeight: 500,
                        }}
                    >
                        Mitigating the <span style={{ fontStyle: "italic", fontWeight: 300, color: "#4b7bf5" }}>$336,000/hr</span> cost of downtime.
                    </h2>
                    <p className="text-[15px] leading-relaxed mb-6" style={{ color: "rgba(148,163,184,0.75)" }}>
                        According to Gartner and ITIC, enterprise IT downtime costs an average of <strong>$5,600 per minute</strong>. With manual incident response averaging 120 minutes (MTTR), a single Sev-1 outage can cost upwards of $672,000 in lost revenue and productivity.
                    </p>
                    <p className="text-[15px] leading-relaxed mb-8" style={{ color: "rgba(148,163,184,0.75)" }}>
                        AXIOM's autonomous OODA loop reduces MTTR from 2 hours to <strong>90 seconds</strong>, actively preventing massive financial hemorrhaging.
                    </p>
                    
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-4 h-[2px]" style={{ background: "#4b7bf5", boxShadow: "0 0 10px rgba(75,123,245,0.8)" }}></div>
                            <span className="text-sm text-slate-300 font-medium">AXIOM (Resolution in 1.5 mins | Cost: $8,400)</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-4 h-[2px] border-b border-dashed border-red-500/60"></div>
                            <span className="text-sm text-slate-500">Human SRE (Resolution in 120 mins | Cost: $672,000)</span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Animated SVG Graph */}
                <div className="flex-1 w-full max-w-[600px] relative">
                    {/* Graph Container */}
                    <div 
                        className="w-full aspect-[4/3] rounded-xl relative overflow-hidden"
                        style={{ 
                            background: "linear-gradient(180deg, rgba(20,24,39,0.5) 0%, rgba(10,13,24,0.8) 100%)",
                            border: "1px solid rgba(255,255,255,0.05)"
                        }}
                    >
                        {/* Grid Lines */}
                        <div className="absolute inset-0 flex flex-col justify-between p-8 pb-12 opacity-20 pointer-events-none">
                            {[0, 1, 2, 3, 4].map((i) => (
                                <div key={i} className="w-full h-px bg-slate-500"></div>
                            ))}
                        </div>

                        {/* Y-Axis Labels */}
                        <div className="absolute left-2 top-8 bottom-12 flex flex-col justify-between text-[10px] text-slate-600 font-mono pointer-events-none">
                            <span>$700k</span>
                            <span>$525k</span>
                            <span>$350k</span>
                            <span>$175k</span>
                            <span>$0</span>
                        </div>

                        {/* SVG Drawing Area */}
                        <svg 
                            viewBox="0 0 800 300" 
                            className="absolute inset-0 w-full h-full p-8 pb-12"
                            preserveAspectRatio="none"
                        >
                            {/* Saved Cost Area (Fills the gap between Human and Axiom) */}
                            <motion.path
                                d={savedAreaPath}
                                fill="rgba(75, 123, 245, 0.1)"
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: 2.5, duration: 1.5 }}
                            />

                            {/* Human SRE Line (Red Dashed) */}
                            <motion.path
                                d={humanPath}
                                fill="none"
                                stroke="rgba(239, 68, 68, 0.4)" // red-500
                                strokeWidth="3"
                                strokeDasharray="10 10"
                                initial={{ pathLength: 0 }}
                                whileInView={{ pathLength: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 2, ease: "linear" }}
                            />

                            {/* AXIOM Line (Glowing Blue) */}
                            <motion.path
                                d={axiomPath}
                                fill="none"
                                stroke="#4b7bf5"
                                strokeWidth="4"
                                style={{ filter: "drop-shadow(0px 4px 12px rgba(75,123,245,0.6))" }}
                                initial={{ pathLength: 0 }}
                                whileInView={{ pathLength: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 2, ease: "easeOut", delay: 0.2 }}
                            />
                            
                            {/* Final Point Glow for AXIOM */}
                            <motion.circle
                                cx="15"
                                cy="270"
                                r="5"
                                fill="#fff"
                                initial={{ scale: 0, opacity: 0 }}
                                whileInView={{ scale: 1, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.3, duration: 0.3 }}
                                style={{ filter: "drop-shadow(0 0 8px #4b7bf5)" }}
                            />
                        </svg>

                        {/* X-Axis Labels */}
                        <div className="absolute bottom-4 left-8 right-8 flex justify-between text-[10px] text-slate-600 font-mono border-t border-slate-800 pt-2">
                            <span>0m</span>
                            <span>30m</span>
                            <span>60m</span>
                            <span>90m</span>
                            <span>120m (MTTR)</span>
                        </div>
                        
                        {/* Saved Cost Label Overlay */}
                        <motion.div 
                            className="absolute right-12 top-24 flex flex-col items-end pointer-events-none"
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 3, duration: 0.8 }}
                        >
                            <span className="text-[24px] font-bold text-[#4b7bf5]" style={{ fontFamily: "'Syne', sans-serif", textShadow: "0 0 20px rgba(75,123,245,0.5)" }}>
                                $663,600
                            </span>
                            <span className="text-[10px] tracking-widest text-slate-400 uppercase font-semibold">
                                Saved Per Incident
                            </span>
                        </motion.div>
                    </div>
                </div>

            </div>
        </section>
    );
}
