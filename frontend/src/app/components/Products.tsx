"use client";

import { motion } from "framer-motion";

const footerLinks = {
    Research: ["AXIOM V1", "AxiomThink", "OODA Engine", "MI300X Runtime", "Safety Paper"],
    Product: ["AXIOM Chat", "API Platform", "Private Deploy", "AWS Marketplace", "Changelog"],
    "Legal & Safety": ["Privacy Policy", "Terms of Use", "HITL Compliance", "Report Vulnerability", "Service Status"],
    "Join Us": ["Open Roles", "Engineering Blog", "GitHub", "Discord"],
};

export default function Footer() {
    return (
        <>
            {/* CTA */}
            <section className="relative py-24 px-10 overflow-hidden" style={{ background: "#070B1A" }}>
                <div className="absolute inset-0 pointer-events-none">
                    <div
                        className="absolute rounded-full"
                        style={{
                            top: "0%",
                            left: "50%",
                            transform: "translateX(-50%)",
                            width: "60vw",
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
                        — START NOW —
                    </span>

                    <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.9 }}
                        >
                            <h2
                                className="text-white leading-[1.1] tracking-tight mb-5"
                                style={{
                                    fontFamily: "'Syne', sans-serif",
                                    fontSize: "clamp(2rem, 3.5vw, 3rem)",
                                    fontWeight: 500,
                                }}
                            >
                                Join the{" "}
                                <span style={{ fontStyle: "italic", fontWeight: 300, color: "#93C5FD" }}>
                                    revolution
                                </span>
                            </h2>
                            <p className="text-[14px] leading-relaxed max-w-lg" style={{ color: "rgba(148,163,184,0.75)" }}>
                                AXIOM V1 isn't just a model — it's a movement. Engineering teams worldwide are deploying autonomous SRE. Be part of the future of infrastructure reliability.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7, delay: 0.2 }}
                        >
                            <button
                                className="flex items-center gap-3 font-bold text-[12px] tracking-[0.1em] px-8 py-4 rounded-full transition-colors"
                                style={{
                                    fontFamily: "'Syne', sans-serif",
                                    background: "white",
                                    color: "#070B1A",
                                }}
                            >
                                START NOW
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m5 12h14m-7-7 7 7-7 7" />
                                </svg>
                            </button>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Footer links */}
            <footer className="px-10 py-16" style={{ background: "#040710", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 mb-14">
                        {Object.entries(footerLinks).map(([category, links]) => (
                            <div key={category}>
                                <span
                                    className="text-[9px] font-bold tracking-[0.22em] uppercase mb-4 block"
                                    style={{ fontFamily: "'Syne', sans-serif", color: "rgba(100,116,139,0.7)" }}
                                >
                                    {category}
                                </span>
                                <ul className="space-y-2.5">
                                    {links.map((link) => (
                                        <li key={link}>
                                            <a
                                                href="#"
                                                className="text-[12px] transition-colors"
                                                style={{ color: "rgba(100,116,139,0.65)" }}
                                                onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(148,163,184,0.9)")}
                                                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(100,116,139,0.65)")}
                                            >
                                                {link}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <div
                        className="flex items-center justify-between pt-8"
                        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                    >
                        <span
                            className="text-[12px] font-black tracking-[0.24em]"
                            style={{ fontFamily: "'Syne', sans-serif", color: "rgba(100,116,139,0.5)" }}
                        >
                            AXIOM
                        </span>
                        <p className="text-[11px]" style={{ color: "rgba(100,116,139,0.45)" }}>
                            © 2025 AXIOM Systems — Execution over suggestion.
                        </p>
                    </div>
                </div>
            </footer>
        </>
    );
}