'use client'

import Link from 'next/link'
import { ArrowRight, Coffee, Pizza, Croissant } from 'lucide-react'
import { motion, Variants } from 'framer-motion'

export function Hero() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 15 },
    },
  }

  return (
    <div className="relative overflow-hidden bg-black/40 backdrop-blur-xl border-b border-white/10 pt-24 pb-16 sm:pt-32 sm:pb-24 lg:pb-32 px-4 sm:px-6 lg:px-8 text-center mt-16">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-action-primary/10 via-transparent to-rose-500/10" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.5, scale: 1 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-action-primary/20 rounded-full blur-3xl" 
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.5, scale: 1 }}
          transition={{ duration: 2, delay: 1, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
          className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-rose-500/20 rounded-full blur-3xl" 
        />
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-4xl mx-auto flex flex-col items-center"
      >
        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-action-primary-fg text-sm font-medium mb-8">
          <span className="flex h-2 w-2 rounded-full bg-action-primary"></span>
          Fresh & delicious, every day
        </motion.div>
        
        <motion.h1 variants={itemVariants} className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6">
          Savor the <span className="text-transparent bg-clip-text bg-gradient-to-r from-action-primary to-rose-400">Flavor</span>,<br />
          Skip the Wait.
        </motion.h1>
        
        <motion.p variants={itemVariants} className="text-lg sm:text-xl text-gray-300 max-w-2xl mb-10 leading-relaxed">
          Order your favorite meals, snacks, and beverages with a single tap. Premium ingredients, crafted with care, and ready when you are.
        </motion.p>

        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <Link
            href="#menu"
            className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-semibold text-lg transition-all hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(249,115,22,0.5)] active:scale-95"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Order Now
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        <motion.div variants={itemVariants} className="mt-16 flex items-center justify-center gap-8 text-gray-400 opacity-70">
          <div className="flex flex-col items-center gap-2">
            <Pizza className="w-8 h-8" />
            <span className="text-sm">Hot Meals</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Coffee className="w-8 h-8" />
            <span className="text-sm">Beverages</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Croissant className="w-8 h-8" />
            <span className="text-sm">Bakery</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
