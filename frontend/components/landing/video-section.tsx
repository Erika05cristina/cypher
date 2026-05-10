"use client"

import { motion } from "framer-motion"
import { Play, Volume2 } from "lucide-react"

export function VideoSection() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 cyber-grid opacity-30" />

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-soft mb-4">
            Watch <span className="gradient-text">CYPHER</span> in Action
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            See how CYPHER analyzes and detects risks in real-time
          </p>
        </motion.div>

        {/* Video Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative group"
        >
          {/* Animated gradient border */}
          <div className="absolute -inset-1 bg-gradient-to-r from-pink via-violet to-orange rounded-2xl opacity-50 blur-sm group-hover:opacity-75 transition-opacity duration-500" />
          
          {/* Video wrapper */}
          <div className="relative aspect-video rounded-2xl overflow-hidden glass">
            {/* Video placeholder background */}
            <div className="absolute inset-0 bg-gradient-to-br from-surface via-bg to-surface">
              {/* Grid pattern */}
              <div className="absolute inset-0 cyber-grid opacity-50" />
              
              {/* Animated glow spots */}
              <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-pink/20 rounded-full blur-3xl animate-pulse-glow" />
              <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-violet/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
            </div>

            {/* CYPHER logo/text overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl md:text-6xl font-bold gradient-text mb-4 text-glow-pink">
                  CYPHER
                </div>
                <div className="text-sm font-mono text-muted-foreground">
                  Demo Video Coming Soon
                </div>
              </div>
            </div>

            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-bg/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button className="w-20 h-20 rounded-full glass glow-pink flex items-center justify-center hover:scale-110 transition-transform">
                <Play className="w-8 h-8 text-pink ml-1" fill="currentColor" />
              </button>
            </div>

            {/* Video controls bar */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-bg to-transparent">
              <div className="flex items-center gap-4">
                {/* Progress bar */}
                <div className="flex-1 h-1 rounded-full bg-border overflow-hidden">
                  <div className="w-0 h-full bg-gradient-to-r from-pink to-violet" />
                </div>
                
                {/* Time */}
                <span className="text-xs font-mono text-muted-foreground">0:00 / 2:34</span>
                
                {/* Volume */}
                <Volume2 className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            {/* Corner accents */}
            <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-pink/50 rounded-tl-lg" />
            <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-violet/50 rounded-tr-lg" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-violet/50 rounded-bl-lg" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-pink/50 rounded-br-lg" />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
