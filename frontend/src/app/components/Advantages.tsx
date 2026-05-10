"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const advantages = [
    {
        id: "ooda",
        title: "Autonomous OODA Loop",
        content:
            "AXIOM runs a continuous Observe-Orient-Decide-Act cycle across your entire stack. It monitors logs in real time, identifies root causes—distributed deadlocks, memory leaks, cascading failures—and executes targeted repairs automatically. No war rooms. No paging engineers at 3am.",
    },
    {
        id: "hitl",
        title: "Human-in-the-Loop safety",
        content:
            "Enterprise-grade HITL controls give your team full authority over high-risk production actions. AXIOM surfaces its complete reasoning trace before executing any irreversible change—restart, patch, or scale event—and waits for explicit confirmation.",
    },
    {
        id: "context",
        title: "Global context window",
        content:
            "Powered by AMD MI300X with 192GB of unified VRAM, AXIOM loads entire codebases, months of log history, and live metrics into a single 128k context window—enabling reasoning across time and system boundaries no human on-call engineer can match.",
    },
];

export default function Advantages() {
    const [open, setOpen] = useState<string>("ooda");

    return (
        <section
            className="relative overflow-hidden"
            style={{ background: "linear-gradient(to bottom, #F4F7FC 0%, #E8EDF7 30%, #c5cde0 52%, #1a2040 65%, #070B1A 100%)" }}
        >
            {/* Fluid dark blob that bleeds up from below */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div
                    className="absolute"
                    style={{
                        top: "38%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "180vw",
                        height: "80vh",
                        background: "#050B14",
                        borderRadius: "50%",
                        filter: "blur(60px)",
                    }}
                />
                <div
                    className="absolute"
                    style={{
                        top: "48%",
                        left: "5%",
                        width: "90vw",
                        height: "60vh",
                        background: "rgba(45,92,233,0.15)",
                        borderRadius: "50%",
                        filter: "blur(80px)",
                    }}
                />
                <div
                    className="absolute"
                    style={{
                        top: "46%",
                        right: "2%",
                        width: "70vw",
                        height: "60vh",
                        background: "rgba(75,123,245,0.1)",
                        borderRadius: "50%",
                        filter: "blur(90px)",
                    }}
                />
                <div
                    className="absolute bottom-0 left-0 right-0"
                    style={{ height: "45%", background: "#040710" }}
                />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-10 py-28">
                {/* Section label */}
                <span
                    className="text-[9px] font-bold tracking-[0.26em] text-slate-400 uppercase mb-20 block"
                    style={{ fontFamily: "'Syne', sans-serif" }}
                >
                    — ADVANTAGES —
                </span>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
                    {/* Left */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <h2
                            className="text-[#111827] leading-[1.1] tracking-tight mb-10"
                            style={{
                                fontFamily: "'Syne', sans-serif",
                                fontSize: "clamp(2rem, 3.5vw, 3rem)",
                                fontWeight: 500,
                            }}
                        >
                            Outsmart the{" "}
                            <span style={{ fontStyle: "italic", fontWeight: 400 }}>competition</span>
                            <br />
                            with{" "}
                            <span style={{ fontWeight: 700 }}>AXIOM</span>
                        </h2>
                        <button
                            className="flex items-center gap-3 border text-slate-700 text-sm font-semibold tracking-wide px-6 py-3 rounded-full transition-all duration-200 hover:border-blue-500 hover:text-blue-600"
                            style={{
                                fontFamily: "'Syne', sans-serif",
                                borderColor: "rgba(0,0,0,0.2)",
                                fontSize: "11px",
                                letterSpacing: "0.1em",
                            }}
                        >
                            TRY OUT
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m5 12h14m-7-7 7 7-7 7" />
                            </svg>
                        </button>
                    </motion.div>

                    {/* Right: Accordion */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                    >
                        {/* Top stat row */}
                        <div className="pb-7 border-b border-slate-200/60">
                            <span
                                className="text-[10px] font-bold tracking-[0.18em] text-slate-400 uppercase block mb-2"
                                style={{ fontFamily: "'Syne', sans-serif" }}
                            >
                                Zero-latency diagnostics
                            </span>
                            <p className="text-[13px] text-slate-500 leading-relaxed">
                                Top-tier performance. AXIOM replaces hours-long incident war rooms with 60-second autonomous triage sessions. From alert to root cause to remediation—automated.
                            </p>
                        </div>

                        {/* Accordion items */}
                        {advantages.map((adv) => (
                            <div key={adv.id} className="border-b border-slate-200/60">
                                <button
                                    onClick={() => setOpen(open === adv.id ? "" : adv.id)}
                                    className="w-full flex items-center justify-between text-left py-5 group"
                                >
                                    <span
                                        className="text-[14px] font-semibold transition-colors duration-300"
                                        style={{
                                            fontFamily: "'Syne', sans-serif",
                                            color: open === adv.id ? "#2d5ce9" : "#374151",
                                        }}
                                    >
                                        {adv.title}
                                    </span>
                                    <div
                                        className="w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 shrink-0 ml-4 group-hover:bg-blue-50"
                                        style={{
                                            borderColor: open === adv.id ? "rgba(45,92,233,0.3)" : "rgba(0,0,0,0.1)",
                                            backgroundColor: open === adv.id ? "rgba(45,92,233,0.05)" : "transparent",
                                        }}
                                    >
                                        <span
                                            className="text-[18px] font-light transition-transform duration-300"
                                            style={{ 
                                                transform: open === adv.id ? "rotate(45deg)" : "rotate(0deg)",
                                                color: open === adv.id ? "#2d5ce9" : "#94a3b8" 
                                            }}
                                        >
                                            +
                                        </span>
                                    </div>
                                </button>
                                <motion.div
                                    initial={false}
                                    animate={{
                                        height: open === adv.id ? "auto" : 0,
                                        opacity: open === adv.id ? 1 : 0,
                                    }}
                                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                                    className="overflow-hidden"
                                >
                                    <p className="text-[13px] text-slate-500 leading-relaxed pb-5">
                                        {adv.content}
                                    </p>
                                </motion.div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}