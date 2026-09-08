'use client'

import { Code2, Heart, Sparkles } from 'lucide-react'

export function Footer() {
  return (
    <footer className="w-full border-t border-white/[0.08] bg-black/80 backdrop-blur-2xl py-8 px-4 sm:px-6 relative z-30 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        {/* Left: Brand tag */}
        <div className="flex items-center gap-2.5">
          <span className="font-brand text-lg font-black tracking-wider gradient-text">
            SNAXY
          </span>
          <span className="text-white/20">|</span>
          <span className="text-[11px] font-semibold text-slate-400 font-sans">
            Instant Campus Dining
          </span>
        </div>

        {/* Center: Designed and Developed by Vishnu Surya Teja */}
        <div className="flex items-center">
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl glass border border-white/15 bg-white/[0.03] shadow-[0_0_20px_-5px_rgba(255,85,0,0.3)] hover:border-primary/40 transition-all group">
            <Code2 className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-slate-300 font-medium font-sans">
              Designed & Developed by
            </span>
            <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-rose-400 to-amber-300 font-display text-sm tracking-tight drop-shadow-sm group-hover:scale-105 transition-transform inline-block">
              Vishnu Surya Teja
            </span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400 opacity-80" />
          </div>
        </div>

        {/* Right: Copyright & Status */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-sans">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
          <span>© {new Date().getFullYear()} Snaxy · All rights reserved</span>
        </div>
      </div>
    </footer>
  )
}
