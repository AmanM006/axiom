"use client";

import { motion } from "framer-motion";

interface BenchmarkResult {
    name: string;
    score: number;
    highlight?: boolean;
    label?: string;
}

const benchmarks = [
    {
        category: "MTTR Reduction",
        unit: "% faster resolution vs baseline",
        results: [
            { name: "AXIOM V1", score: 94, highlight: true },
            { name: "PagerDuty AIOps", score: 38 },
            { name: "Datadog Watchdog", score: 29 },
            { name: "New Relic AI", score: 22 },
        ],
    },
    {
        category: "Root Cause Accuracy",
        unit: "% correct on multi-service incidents",
        results: [
            { name: "AXIOM V1", score: 91, highlight: true },
            { name: "Manual SRE (avg)", score: 73 },
            { name: "Dynatrace Davis", score: 64 },
            { name: "Datadog Watchdog", score: 51 },
        ],
    },
    {
        category: "Autonomous Resolution",
        unit: "% incidents resolved without human action",
        results: [
            { name: "AXIOM V1", score: 78, highlight: true },
            { name: "Dynatrace Davis", score: 22 },
            { name: "PagerDuty AIOps", score: 18 },
            { name: "New Relic AI", score: 14 },
        ],
    },
    {
        category: "Triage Speed",
        unit: "score (higher = faster, AXIOM = 60s)",
        results: [
            { name: "AXIOM V1", score: 97, highlight: true, label: "~60s" },
            { name: "Datadog Watchdog", score: 30, label: "~18min" },
            { name: "PagerDuty AIOps", score: 20, label: "~27min" },
            { name: "Manual SRE (avg)", score: 12, label: "~45min" },
        ],
    },
    {
        category: "Context Window (log lines)",
        unit: "millions of log lines in single pass",
        results: [
            { name: "AXIOM V1 (MI300X)", score: 96, highlight: true, label: "128k ctx" },
            { name: "Dynatrace Davis", score: 28, label: "~32k ctx" },
            { name: "Datadog Watchdog", score: 18, label: "~20k ctx" },
            { name: "New Relic AI", score: 14, label: "~16k ctx" },
        ],
    },
];

export default function Benchmarks() {
    return (
        <section className="relative py-32 px-10" style={{ background: "#070B1A" }}>
            <div className="relative z-10 max-w-7xl mx-auto">
                <span
                    className="text-[9px] font-bold tracking-[0.26em] uppercase mb-12 block"
                    style={{ fontFamily: "'Syne', sans-serif", color: "rgba(96,165,250,0.5)" }}
                >
                    — V1 IN ACTION —
                </span>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9 }}
                    className="mb-6"
                >
                    <h2
                        className="text-white leading-[1.1] tracking-tight mb-4"
                        style={{
                            fontFamily: "'Syne', sans-serif",
                            fontSize: "clamp(2rem, 3.5vw, 3rem)",
                            fontWeight: 500,
                        }}
                    >
                        Proven{" "}
                        <span style={{ fontStyle: "italic", fontWeight: 300, color: "#93C5FD" }}>
                            performance
                        </span>
                        <br />
                        across benchmarks
                    </h2>
                    <p className="text-[14px] leading-relaxed max-w-xl" style={{ color: "rgba(148,163,184,0.75)" }}>
                        AXIOM V1 excels in MTTR reduction, root cause accuracy, and autonomous resolution. Compare its scores against PagerDuty, Dynatrace, Datadog, and New Relic AI.
                    </p>
                </motion.div>

                <div className="mt-16 space-y-12">
                    {benchmarks.map((bench, bi) => (
                        <motion.div
                            key={bench.category}
                            initial={{ opacity: 0, y: 14 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7, delay: bi * 0.08 }}
                        >
                            <div className="flex items-baseline gap-3 mb-4">
                                <span
                                    className="text-[11px] font-bold tracking-[0.14em] uppercase"
                                    style={{ fontFamily: "'Syne', sans-serif", color: "rgba(148,163,184,0.6)" }}
                                >
                                    {bench.category}
                                </span>
                                <span className="text-[10px]" style={{ color: "rgba(100,116,139,0.6)" }}>
                                    — {bench.unit}
                                </span>
                            </div>
                            <div className="space-y-2.5">
                                {bench.results.map((r: BenchmarkResult, ri) => (
                                    <div key={r.name} className="flex items-center gap-4">
                                        <span
                                            className="text-[12px] shrink-0"
                                            style={{
                                                width: "180px",
                                                color: r.highlight ? "white" : "rgba(100,116,139,0.7)",
                                                fontWeight: r.highlight ? 600 : 400,
                                                fontFamily: r.highlight ? "'Syne', sans-serif" : "inherit",
                                            }}
                                        >
                                            {r.name}
                                        </span>
                                        <div className="flex-1 relative h-6 flex items-center">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                whileInView={{ width: `${r.score}%` }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 1, delay: 0.2 + ri * 0.08, ease: [0.16, 1, 0.3, 1] }}
                                                className="h-full rounded-sm"
                                                style={{
                                                    background: r.highlight
                                                        ? "linear-gradient(90deg, #1D4ED8 0%, #4F46E5 100%)"
                                                        : "rgba(255,255,255,0.06)",
                                                    minWidth: 2,
                                                    border: r.highlight ? "none" : "1px solid rgba(255,255,255,0.04)",
                                                }}
                                            />
                                        </div>
                                        <span
                                            className="text-[12px] w-14 text-right shrink-0"
                                            style={{
                                                fontFamily: "'JetBrains Mono', monospace",
                                                color: r.highlight ? "#93C5FD" : "rgba(100,116,139,0.6)",
                                                fontWeight: r.highlight ? 500 : 400,
                                            }}
                                        >
                                            {r.label ?? r.score}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}