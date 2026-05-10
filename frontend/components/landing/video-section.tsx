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
            <iframe 
              src="https://www.youtube.com/embed/VH6lXPZUuvk" 
              title="Cypher Pitch Video" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
              className="absolute inset-0 w-full h-full border-0"
            ></iframe>

            {/* Corner accents */}
            <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-pink/50 rounded-tl-lg pointer-events-none" />
            <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-violet/50 rounded-tr-lg pointer-events-none" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-violet/50 rounded-bl-lg pointer-events-none" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-pink/50 rounded-br-lg pointer-events-none" />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
