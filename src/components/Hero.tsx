'use client'

import Link from 'next/link'
import { ArrowRight, Flame, Zap, ShieldCheck, Clock, Sparkles } from 'lucide-react'
import { motion, Variants } from 'framer-motion'

const MARQUEE_ITEMS = [
  '🔥 Crispy Chicken Burger',
  '🌯 Paneer Tikka Kathi Roll',
  '☕ Iced Caramel Cold Coffee',
  '🍟 Peri-Peri Loaded Fries',
  '🥟 Steamed Corn & Cheese Momos',
  '🍕 Double Cheese Margherita',
  '🧋 Classic Hazelnut Frappé',
  '🥪 Grilled Triple Club Sandwich',
]

export function Hero() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.05,
      },
    },
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 120, damping: 14 },
    },
  }

  return (
    <div className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 px-4 sm:px-6 lg:px-8 text-center">
      {/* Dynamic Background Aurora Mesh */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-primary/15 via-rose-500/10 to-transparent blur-[120px] rounded-full" />
        <div className="absolute top-1/4 left-1/10 w-72 h-72 bg-primary/20 rounded-full blur-[90px] animate-aurora" />
        <div className="absolute top-1/3 right-1/10 w-80 h-80 bg-rose-500/15 rounded-full blur-[100px] animate-aurora" style={{ animationDelay: '3s' }} />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-5xl mx-auto flex flex-col items-center"
      >
        {/* Top Floating Pill */}
        <motion.div
          variants={itemVariants}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-pill border border-white/10 text-xs font-bold text-orange-300 shadow-[0_0_20px_-3px_rgba(255,94,14,0.3)] mb-8"
        >
          <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
          <span className="tracking-wide uppercase text-[11px]">⚡ Fast-Track Campus Dining · Zero Waiting</span>
        </motion.div>

        {/* Hero Main Heading */}
        <motion.h1
          variants={itemVariants}
          className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter text-white mb-6 leading-[1.08] font-heading"
        >
          Craving Something <span className="gradient-hero-title">Legendary?</span>
          <br />
          <span className="gradient-text">Tap. Pay. Munch.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={itemVariants}
          className="text-base sm:text-xl text-slate-300 max-w-2xl mb-10 leading-relaxed font-medium"
        >
          Skip the endless cafeteria line. Order delicious hot meals, crispy snacks, and icy brews with instant 1-tap UPI QR. Made fresh, ready in minutes.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full max-w-md sm:max-w-none"
        >
          <Link
            href="#menu"
            onClick={(e) => {
              e.preventDefault()
              document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-primary via-orange-500 to-rose-500 text-white font-black text-base transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_35px_rgba(255,94,14,0.6)] active:scale-[0.98] border border-white/20"
          >
            <Flame className="w-5 h-5 fill-white" />
            <span>Order Your Bites</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>

          <a
            href="#perks"
            onClick={(e) => {
              e.preventDefault()
              document.getElementById('perks')?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl glass hover:bg-white/[0.08] text-slate-200 hover:text-white font-bold text-base transition-all border border-white/10 hover:border-white/20 active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Why Snaxy?</span>
          </a>
        </motion.div>

        {/* Dynamic Feature Badges */}
        <motion.div
          id="perks"
          variants={itemVariants}
          className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-3.5 w-full max-w-4xl"
        >
          {[
            { icon: Clock, title: '5-Min Prep', desc: 'Zero cafeteria waiting', color: 'text-orange-400' },
            { icon: Zap, title: 'Instant UPI', desc: 'Scan & pay seamlessly', color: 'text-amber-400' },
            { icon: Flame, title: 'Hot & Fresh', desc: 'Cooked right on order', color: 'text-rose-400' },
            { icon: ShieldCheck, title: '100% Verified', desc: 'Secure order receipts', color: 'text-emerald-400' },
          ].map((item, idx) => {
            const Icon = item.icon
            return (
              <div
                key={idx}
                className="flex flex-col items-center sm:items-start p-4 rounded-2xl glass border border-white/[0.07] hover:border-primary/30 transition-all duration-300 group text-center sm:text-left"
              >
                <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] mb-2.5 group-hover:scale-110 transition-transform">
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <h4 className="font-extrabold text-sm text-white leading-tight font-heading">{item.title}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{item.desc}</p>
              </div>
            )
          })}
        </motion.div>
      </motion.div>

      {/* Trending Bites Live Marquee Banner */}
      <div className="mt-14 -mx-4 sm:-mx-8 border-y border-white/[0.08] bg-black/40 backdrop-blur-md py-3 overflow-hidden">
        <div className="animate-marquee gap-8 items-center text-xs sm:text-sm font-black tracking-tight text-slate-300">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, index) => (
            <div key={index} className="flex items-center gap-6 shrink-0">
              <span className="hover:text-primary transition-colors cursor-default">{item}</span>
              <span className="text-white/20">✦</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
