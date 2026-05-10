"use client"

import { motion } from "framer-motion"
import { Fingerprint, Eye, Lock } from "lucide-react"

export function About() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 cyber-grid opacity-30" />
      
      {/* Decorative elements */}
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-pink/5 rounded-full blur-3xl" />
      <div className="absolute top-1/2 right-0 w-64 h-64 bg-violet/5 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="glass rounded-3xl p-8 md:p-12 glow-violet"
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-xl bg-gradient-to-br from-pink/20 to-violet/20">
              <Fingerprint className="w-6 h-6 text-pink" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-soft">
              About <span className="gradient-text">CYPHER</span>
            </h2>
          </div>

          {/* Main content */}
          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <p className="text-lg">
              <span className="text-soft font-medium">CYPHER</span> is a forensic risk intelligence platform built on Solana that helps users detect scam signals before interacting with malicious smart contracts.
            </p>
            
            <p>
              Instead of relying on &apos;magic AI&apos;, CYPHER combines <span className="text-pink">deterministic blockchain analysis</span>, <span className="text-violet">transaction simulation</span>, and <span className="text-amber">AI-powered explanations</span> to create transparent and explainable security insights.
            </p>
          </div>

          {/* Key points */}
          <div className="grid md:grid-cols-2 gap-6 mt-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex items-start gap-4"
            >
              <div className="p-2 rounded-lg bg-orange/10 mt-1">
                <Eye className="w-4 h-4 text-orange" />
              </div>
              <div>
                <h4 className="font-semibold text-soft mb-1">Transparent Analysis</h4>
                <p className="text-sm text-muted-foreground">Every risk score is backed by verifiable on-chain data</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex items-start gap-4"
            >
              <div className="p-2 rounded-lg bg-violet/10 mt-1">
                <Lock className="w-4 h-4 text-violet" />
              </div>
              <div>
                <h4 className="font-semibold text-soft mb-1">Immutable Records</h4>
                <p className="text-sm text-muted-foreground">Audit reports permanently stored on Solana</p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
