"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

const terminalLines = [
  { text: "> Analyzing token...", color: "text-soft", delay: 0 },
  { text: "> Mint authority detected", color: "text-amber", delay: 800 },
  { text: "> Freeze authority active", color: "text-orange", delay: 1600 },
  { text: "> Simulating transaction...", color: "text-violet", delay: 2400 },
  { text: "> Risk score: 82/100", color: "text-pink", delay: 3200 },
  { text: "> STATUS: CRITICAL", color: "text-pink font-bold", delay: 4000 },
]

export function TerminalDemo() {
  const [visibleLines, setVisibleLines] = useState<number[]>([])
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    const timers: NodeJS.Timeout[] = []
    
    terminalLines.forEach((line, index) => {
      const timer = setTimeout(() => {
        setVisibleLines(prev => [...prev, index])
        if (index === terminalLines.length - 1) {
          setIsComplete(true)
        }
      }, line.delay)
      timers.push(timer)
    })

    // Reset animation after completion
    const resetTimer = setTimeout(() => {
      setVisibleLines([])
      setIsComplete(false)
    }, 7000)
    timers.push(resetTimer)

    return () => timers.forEach(t => clearTimeout(t))
  }, [isComplete])

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 cyber-grid opacity-50" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-soft mb-4">
            Live Risk Detection
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Watch CYPHER analyze blockchain transactions in real-time
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="glass rounded-2xl overflow-hidden glow-pink"
        >
          {/* Terminal header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-bg/80">
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-orange hover:bg-orange/80 transition-colors" />
                <div className="w-3 h-3 rounded-full bg-amber hover:bg-amber/80 transition-colors" />
                <div className="w-3 h-3 rounded-full bg-violet hover:bg-violet/80 transition-colors" />
              </div>
              <span className="ml-4 text-sm font-mono text-muted-foreground">CYPHER Terminal v1.0</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-pink animate-pulse" />
              <span className="text-xs font-mono text-pink">LIVE</span>
            </div>
          </div>
          
          {/* Terminal content */}
          <div className="p-8 font-mono text-base min-h-[280px] bg-bg/40">
            {terminalLines.map((line, index) => (
              <div
                key={index}
                className={`transition-all duration-300 ${
                  visibleLines.includes(index) 
                    ? 'opacity-100 translate-x-0' 
                    : 'opacity-0 -translate-x-4'
                } ${line.color} mb-3`}
              >
                {line.text}
              </div>
            ))}
            {isComplete && (
              <span className="text-pink cursor-blink text-lg">█</span>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
