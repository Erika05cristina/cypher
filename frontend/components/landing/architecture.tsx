"use client"

import { motion } from "framer-motion"

const architectureNodes = [
  { label: "Frontend", sublabel: "React + Tailwind", color: "bg-pink" },
  { label: "FastAPI", sublabel: "Python Backend", color: "bg-violet" },
  { label: "Risk Engine", sublabel: "Analysis Core", color: "bg-orange" },
  { label: "Solana", sublabel: "Blockchain", color: "bg-amber" },
  { label: "Anchor", sublabel: "Smart Contracts", color: "bg-pink" },
]

export function Architecture() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 cyber-grid opacity-30" />
      
      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-soft mb-4">
            System <span className="gradient-text">Architecture</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            A modular pipeline from user interaction to on-chain verification
          </p>
        </motion.div>

        {/* Architecture Diagram */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          {/* Desktop view */}
          <div className="hidden md:flex items-center justify-center gap-4">
            {architectureNodes.map((node, index) => (
              <div key={node.label} className="flex items-center">
                {/* Node */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group"
                >
                  <div className="relative p-6 rounded-xl glass hover:glow-violet transition-all duration-300 min-w-[140px]">
                    <div className={`w-3 h-3 rounded-full ${node.color} mb-3 group-hover:animate-pulse`} />
                    <h4 className="font-bold text-soft text-sm">{node.label}</h4>
                    <p className="text-xs text-muted-foreground font-mono mt-1">{node.sublabel}</p>
                    
                    {/* Glow effect */}
                    <div className={`absolute inset-0 rounded-xl ${node.color}/5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity -z-10`} />
                  </div>
                </motion.div>

                {/* Connection line */}
                {index < architectureNodes.length - 1 && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                    className="flex items-center"
                  >
                    <div className="w-8 h-px bg-gradient-to-r from-violet to-pink" />
                    <div className="w-0 h-0 border-t-4 border-b-4 border-l-6 border-transparent border-l-pink" />
                  </motion.div>
                )}
              </div>
            ))}
          </div>

          {/* Mobile view */}
          <div className="md:hidden space-y-4">
            {architectureNodes.map((node, index) => (
              <div key={node.label} className="flex flex-col items-center">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="w-full"
                >
                  <div className="p-5 rounded-xl glass flex items-center gap-4">
                    <div className={`w-4 h-4 rounded-full ${node.color}`} />
                    <div>
                      <h4 className="font-bold text-soft">{node.label}</h4>
                      <p className="text-xs text-muted-foreground font-mono">{node.sublabel}</p>
                    </div>
                  </div>
                </motion.div>

                {index < architectureNodes.length - 1 && (
                  <div className="w-px h-6 bg-gradient-to-b from-violet to-pink" />
                )}
              </div>
            ))}
          </div>

          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-pink/5 via-violet/5 to-orange/5 rounded-3xl blur-3xl -z-10" />
        </motion.div>
      </div>
    </section>
  )
}
