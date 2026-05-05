"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConfigModal({ isOpen, onClose }: ConfigModalProps) {
  const [config, setConfig] = useState({
    githubToken: "",
    repoName: "",
    supabaseUrl: "",
    supabaseKey: "",
  });

  useEffect(() => {
    const saved = localStorage.getItem("axiom_config");
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load config", e);
      }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem("axiom_config", JSON.stringify(config));
    onClose();
    window.location.reload(); // Refresh to apply config
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Environment Configuration</h2>
              <button onClick={onClose} className="text-white/40 hover:text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-white/40 mb-6">
                Enter your credentials below to connect AXIOM to your own infrastructure.
                Leave blank to use the <span className="text-white font-medium">Demo Sandbox</span>.
              </p>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-bold text-white/40 mb-1.5 ml-1">GitHub Personal Access Token</label>
                <input
                  type="password"
                  value={config.githubToken}
                  onChange={(e) => setConfig({ ...config, githubToken: e.target.value })}
                  placeholder="ghp_xxxxxxxxxxxx"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#5E6AD2] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-bold text-white/40 mb-1.5 ml-1">Target Repository (org/repo)</label>
                <input
                  type="text"
                  value={config.repoName}
                  onChange={(e) => setConfig({ ...config, repoName: e.target.value })}
                  placeholder="AmanM006/axiom"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#5E6AD2] transition-colors"
                />
              </div>

              <div className="pt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-bold text-white/40 mb-1.5 ml-1">Supabase URL</label>
                  <input
                    type="text"
                    value={config.supabaseUrl}
                    onChange={(e) => setConfig({ ...config, supabaseUrl: e.target.value })}
                    placeholder="https://xyz.supabase.co"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#5E6AD2] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-bold text-white/40 mb-1.5 ml-1">Supabase Key</label>
                  <input
                    type="password"
                    value={config.supabaseKey}
                    onChange={(e) => setConfig({ ...config, supabaseKey: e.target.value })}
                    placeholder="eyJhbGci..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#5E6AD2] transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-white/5 border-t border-white/5 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 rounded-lg bg-[#5E6AD2] text-white hover:bg-[#5E6AD2]/90 transition-all text-sm font-medium"
              >
                Save Configuration
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
