"use client";

import { motion } from "framer-motion";

const footerLinks = {
    Research: ["AXIOM V1", "AxiomThink", "OODA Engine", "MI300X Runtime", "Safety Paper"],
    Product: ["AXIOM Chat", "API Platform", "Private Deploy", "AWS Marketplace", "Changelog"],
    "Legal & Safety": ["Privacy Policy", "Terms of Use", "HITL Compliance", "Report Vulnerability", "Service Status"],
    "Join Us": ["Open Roles", "Engineering Blog", "GitHub", "Discord Community"],
};

export default function Footer() {
    return (
        <>
            {/* CTA Section */}
            <section className="relative bg-[#070B1A] py-24 px-6 overflow-hidden">
                {/* Ambient glows */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70vw] h-[30vh] bg-blue-900/15 rounded-full blur-[100px]" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[50vw] h-[20vh] bg-indigo-900/15 rounded-full blur-[80px]" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto">
                    <span className="text-[9px] font-bold tracking-[0.25em] text-blue-400/60 uppercase mb-12 block">
                        — START NOW —
                    </span>

                    <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.9 }}
                        >
                            <h2 className="text-4xl sm:text-5xl font-medium text-white leading-[1.1] tracking-tight mb-5">
                                Join the{" "}
                                <span className="italic font-light text-blue-300">revolution</span>
                            </h2>
                            <p className="text-[14px] text-slate-400 max-w-lg leading-relaxed">
                                AXIOM V1 isn't just a model — it's a movement. Development teams worldwide are building on AXIOM, with 2.5M+ downloads on Hugging Face. Be part of the future of autonomous infrastructure.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7, delay: 0.2 }}
                        >
                            <button className="flex items-center gap-3 bg-white text-[#070B1A] hover:bg-blue-50 transition-colors font-bold text-sm tracking-[0.08em] px-8 py-4 rounded-full">
                                START NOW
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m5 12h14m-7-7 7 7-7 7" />
                                </svg>
                            </button>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-[#040710] border-t border-white/5 py-16 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 mb-16">
                        {Object.entries(footerLinks).map(([category, links]) => (
                            <div key={category}>
                                <span className="text-[9px] font-bold tracking-[0.2em] text-slate-500 uppercase mb-4 block">
                                    {category}
                                </span>
                                <ul className="space-y-2.5">
                                    {links.map((link) => (
                                        <li key={link}>
                                            <a
                                                href="#"
                                                className="text-[12px] text-slate-500 hover:text-slate-300 transition-colors"
                                            >
                                                {link}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-between border-t border-white/5 pt-8">
                        <span className="text-[11px] font-bold tracking-[0.22em] text-slate-600 font-mono">AXIOM</span>
                        <p className="text-[11px] text-slate-600">
                            © 2025 AXIOM Systems. Execution over suggestion.
                        </p>
                    </div>
                </div>
            </footer>
        </>
    );
}