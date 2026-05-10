"use client"

import { motion } from "framer-motion"
import { Shield, Zap, Database, Brain } from "lucide-react"

const features = [
  {
    icon: Shield,
    title: "Deterministic Risk Analysis",
    description: "Analyzes raw blockchain permissions and token authorities.",
    gradient: "from-pink/20 to-violet/10",
    iconColor: "text-pink",
    delay: 0,
  },
  {
    icon: Zap,
    title: "Transaction Simulation",
    description: "Simulates buys and sells before users risk real funds.",
    gradient: "from-orange/20 to-amber/10",
    iconColor: "text-orange",
    delay: 0.1,
  },
  {
    icon: Database,
    title: "Immutable Trust Registry",
    description: "Audit reports stored permanently on Solana using Anchor smart contracts.",
    gradient: "from-violet/20 to-pink/10",
    iconColor: "text-violet",
    delay: 0.2,
  },
  {
    icon: Brain,
    title: "AI Explanations",
    description: "Transforms forensic blockchain data into human-readable insights.",
    gradient: "from-amber/20 to-orange/10",
    iconColor: "text-amber",
    delay: 0.3,
  },
]

export function FeaturesBento() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 cyber-grid opacity-30" />
      
      {/* Background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink/5 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-soft mb-4">
            <span className="gradient-text">Forensic Intelligence</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Multi-layered security analysis powered by deterministic algorithms and AI
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: feature.delay }}
              className="group"
            >
              <div className={`
                relative h-full p-8 rounded-2xl glass 
                bg-gradient-to-br ${feature.gradient}
                border border-border/50
                hover:border-pink/30 transition-all duration-500
                hover:glow-violet
              `}>
                {/* Icon */}
                <div className={`
                  w-14 h-14 rounded-xl glass flex items-center justify-center mb-6
                  group-hover:scale-110 transition-transform duration-300
                `}>
                  <feature.icon className={`w-7 h-7 ${feature.iconColor}`} />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-soft mb-3 group-hover:text-pink transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>

                {/* Corner accent */}
                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-pink/50 group-hover:bg-pink transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
