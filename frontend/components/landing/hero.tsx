"use client"

import { motion } from "framer-motion"
import { ArrowRight, Github, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"

import Link from "next/link"

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8"
        >
          <Shield className="w-4 h-4 text-pink" />
          <span className="text-sm font-mono text-muted-foreground">Dev3Pack Global Hackathon</span>
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6"
        >
          <span className="text-soft">Predict Before</span>
          <br />
          <span className="gradient-text text-glow-pink">You Sign.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
        >
          AI-powered forensic risk intelligence for the Solana ecosystem.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/scanner">
            <Button 
              size="lg" 
              className="bg-pink hover:bg-pink/90 text-primary-foreground glow-pink group px-8"
            >
              Analyze Transaction
              <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <a href="https://github.com/Erika05cristina" target="_blank" rel="noreferrer">
            <Button 
              size="lg" 
              variant="outline" 
              className="border-border bg-surface/50 hover:bg-surface hover:border-violet text-soft"
            >
              <Github className="mr-2 w-4 h-4" />
              View GitHub
            </Button>
          </a>
        </motion.div>

        {/* Terminal Panel Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-16 max-w-2xl mx-auto"
        >
          <div className="glass rounded-xl overflow-hidden glow-violet">
            {/* Terminal header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-bg/50">
              <div className="w-3 h-3 rounded-full bg-orange" />
              <div className="w-3 h-3 rounded-full bg-amber" />
              <div className="w-3 h-3 rounded-full bg-violet" />
              <span className="ml-4 text-xs font-mono text-muted-foreground">cypher_analysis.sol</span>
            </div>
            
            {/* Terminal content */}
            <div className="p-6 font-mono text-sm text-left space-y-2">
              <TerminalLine delay={1.0}>&gt; Initializing CYPHER risk engine...</TerminalLine>
              <TerminalLine delay={1.4} className="text-violet">&gt; Scanning token metadata...</TerminalLine>
              <TerminalLine delay={1.8} className="text-amber">&gt; Mint authority: DETECTED</TerminalLine>
              <TerminalLine delay={2.2} className="text-orange">&gt; Freeze authority: ACTIVE</TerminalLine>
              <TerminalLine delay={2.6} className="text-muted-foreground">&gt; Simulating transaction...</TerminalLine>
              <TerminalLine delay={3.0} className="text-pink">&gt; Risk Score: 82/100</TerminalLine>
              <TerminalLine delay={3.4} className="text-pink font-bold">
                &gt; STATUS: CRITICAL <span className="cursor-blink">█</span>
              </TerminalLine>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-bg to-transparent" />
    </section>
  )
}

function TerminalLine({ 
  children, 
  delay, 
  className = "" 
}: { 
  children: React.ReactNode
  delay: number
  className?: string 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`${className}`}
    >
      {children}
    </motion.div>
  )
}
