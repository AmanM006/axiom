"use client";

import { motion } from "framer-motion";

const features = [
    {
        title: "Autonomous OODA Loop",
        subtitle: "Observe · Orient · Decide · Act",
        description:
            "Continuously monitors logs, metrics, and traces. Identifies root causes and executes repairs—restarts, patches, auto-scaling—without human intervention in under 60 seconds.",
    },
    {
        title: "AMD MI300X optimized",
        subtitle: "192GB unified VRAM",
        description:
            "Purpose-built for AMD's MI300X architecture. Holds entire codebases and millions of log lines in a single 128k context window for near-perfect cross-system reasoning.",
    },
    {
        title: "AxiomThink reasoning core",
        subtitle: "Next-gen inference engine",
        description:
            "Simultaneously cross-references GitHub PRs, cloud logs, and live metrics to unravel complex infrastructure puzzles. Outperforms traditional RCA tools on multi-service incidents.",
    },
    {
        title: "Human-in-the-Loop safety",
        subtitle: "Enterprise HITL controls",
        description:
            "Full reasoning trace shown before any high-risk action. Explicit confirmation required for irreversible changes. Audit logs, role-based approvals, and rollback support.",
    },
];

export default function CoreFeatures() {
    return (
        <section className="relative py-32 px-10 overflow-hidden" style={{ background: "#070B1A" }}>
            <div className="absolute inset-0 pointer-events-none">
                <div
                    className="absolute rounded-full"
                    style={{
                        top: "30%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "70vw",
                        height: "50vh",
                        background: "radial-gradient(ellipse, rgba(29,78,216,0.08) 0%, transparent 70%)",
                        filter: "blur(60px)",
                    }}
                />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto">
                <span
                    className="text-[9px] font-bold tracking-[0.26em] uppercase mb-12 block"
                    style={{ fontFamily: "'Syne', sans-serif", color: "rgba(96,165,250,0.5)" }}
                >
                    — CORE FEATURES —
                </span>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9 }}
                    className="mb-16"
                >
                    <h2
                        className="text-white leading-[1.1] tracking-tight"
                        style={{
                            fontFamily: "'Syne', sans-serif",
                            fontSize: "clamp(2rem, 3.5vw, 3rem)",
                            fontWeight: 500,
                        }}
                    >
                        What makes AXIOM
                        <br />
                        <span style={{ fontStyle: "italic", fontWeight: 300, color: "#93C5FD" }}>
                            unstoppable
                        </span>
                    </h2>
                </motion.div>

                <div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 overflow-hidden rounded-2xl"
                    style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.025)" }}
                >
                    {features.map((f, i) => (
                        <motion.div
                            key={f.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7, delay: i * 0.1 }}
                            className="p-8 transition-colors duration-300 group"
                            style={{
                                borderRight: i < 3 ? "1px solid rgba(255,255,255,0.06)" : "none",
                                background: "transparent",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                            <h3
                                className="text-white text-[13px] font-bold mb-1 leading-snug"
                                style={{ fontFamily: "'Syne', sans-serif" }}
                            >
                                {f.title}
                            </h3>
                            <p
                                className="text-[10px] font-bold tracking-[0.14em] uppercase mb-4"
                                style={{ fontFamily: "'Syne', sans-serif", color: "rgba(96,165,250,0.6)" }}
                            >
                                {f.subtitle}
                            </p>
                            <p className="text-[12.5px] leading-relaxed" style={{ color: "rgba(148,163,184,0.8)" }}>
                                {f.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}