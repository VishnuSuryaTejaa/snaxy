'use client'

import { ExternalLink, Sparkles, Shield, Clock } from 'lucide-react'
import Link from 'next/link'

function LinkedInIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.45 1.45 0 0 0 0-2.9 1.45 1.45 0 0 0 0 2.9m1.4 9.74v-8.37H5.06v8.37h2.8z" />
    </svg>
  )
}

export function Footer() {
  const linkedInUrl = 'https://www.linkedin.com/in/vishnu-surya-teja-veeraganti-1b172827a'

  return (
    <footer className="w-full border-t border-white/[0.06] bg-slate-950/80 backdrop-blur-2xl py-8 px-4 sm:px-6 relative z-30 mt-auto">
      {/* Ambient background light line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-3xl h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
        {/* Left: Brand tag & Quick Links */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
          <span className="font-brand text-2xl font-black tracking-wider gradient-text drop-shadow-[0_0_15px_rgba(255,85,0,0.4)]">
            SNAXY
          </span>
          <span className="text-white/20 text-xs">/</span>
          <span className="text-xs font-semibold text-slate-400 font-sans tracking-wide">
            Instant Campus Bites
          </span>
          <span className="text-white/20 text-xs hidden sm:inline">•</span>
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 border border-white/[0.06] text-xs font-semibold transition"
          >
            <Clock className="w-3 h-3 text-primary" />
            <span>My Orders</span>
          </Link>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 border border-white/[0.06] text-xs font-semibold transition"
          >
            <Shield className="w-3 h-3 text-primary" />
            <span>Staff Portal</span>
          </Link>
        </div>

        {/* Right: Interactive High-Tech Creator Badge */}
        <div className="flex items-center">
          <a
            href={linkedInUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Connect with Vishnu Surya Teja on LinkedIn"
            className="relative group block rounded-2xl p-[1.5px] transition-all duration-300 hover:scale-[1.04] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {/* Pulsing Animated Neon Glow Backdrop */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-orange-500 via-rose-500 to-sky-500 opacity-40 blur-md group-hover:opacity-100 group-hover:blur-lg transition-all duration-500 animate-pulse" />

            {/* Glowing Border Wrap */}
            <div className="relative flex items-center gap-2.5 sm:gap-3 px-4 py-2 rounded-2xl bg-slate-950/90 backdrop-blur-xl border border-white/20 group-hover:border-primary/60 shadow-2xl transition-all">
              {/* Creator Icon */}
              <div className="w-6 h-6 rounded-lg bg-[#0077b5] flex items-center justify-center text-white shadow-[0_0_12px_rgba(0,119,181,0.6)] group-hover:scale-110 transition-transform">
                <LinkedInIcon className="w-3.5 h-3.5" />
              </div>

              <div className="flex items-center gap-1.5 font-sans">
                <span className="text-slate-300 font-medium text-xs">
                  Designed & Developed by
                </span>
                <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-rose-400 to-amber-300 font-display text-xs sm:text-sm tracking-tight drop-shadow-[0_0_12px_rgba(255,85,0,0.5)] group-hover:from-white group-hover:to-orange-300 transition-all underline-offset-4 group-hover:underline">
                  Vishnu Surya Teja
                </span>
              </div>

              {/* Action Prompt Pill */}
              <div className="flex items-center gap-1 pl-2 pr-2.5 py-0.5 rounded-full bg-white/[0.08] border border-white/10 text-[10px] font-bold text-sky-300 group-hover:bg-[#0077b5]/40 group-hover:border-sky-400/50 group-hover:text-white transition-all shadow-inner">
                <span>Connect</span>
                <ExternalLink className="w-2.5 h-2.5 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>

              {/* Sparkle badge */}
              <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:text-amber-300 group-hover:rotate-45 transition-all duration-300 opacity-90 hidden sm:inline-block" />
            </div>
          </a>
        </div>
      </div>
    </footer>
  )
}
