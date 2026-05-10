"use client"

import { motion } from "framer-motion"

const technologies = [
  { name: "Solana", color: "from-violet to-pink", icon: "◎" },
  { name: "Anchor", color: "from-pink to-orange", icon: "⚓" },
  { name: "FastAPI", color: "from-orange to-amber", icon: "⚡" },
  { name: "Python", color: "from-amber to-violet", icon: "🐍" },
  { name: "React", color: "from-violet to-pink", icon: "⚛" },
  { name: "Tailwind", color: "from-pink to-orange", icon: "💨" },
  { name: "AI / LLM", color: "from-orange to-violet", icon: "🧠" },
]

export function TechStack() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 cyber-grid opacity-30" />
      
      {/* Background glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-violet/5 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-soft mb-4">
            Powered by <span className="gradient-text">Modern Tech</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Built with cutting-edge technologies for performance and reliability
          </p>
        </motion.div>

        {/* Tech cards grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {technologies.map((tech, index) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="group"
            >
              <div className="relative p-6 rounded-xl glass border border-border/50 hover:border-pink/30 transition-all duration-300 text-center hover:glow-violet">
                {/* Icon */}
                <div className={`text-3xl mb-3 group-hover:scale-125 transition-transform duration-300`}>
                  {tech.icon}
                </div>
                
                {/* Name */}
                <span className="text-sm font-medium text-soft group-hover:text-pink transition-colors font-mono">
                  {tech.name}
                </span>

                {/* Hover gradient line */}
                <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r ${tech.color} group-hover:w-3/4 transition-all duration-300 rounded-full`} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional tech highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 flex flex-wrap justify-center gap-3"
        >
          {["Framer Motion", "TypeScript", "Web3.js", "Rust", "PostgreSQL"].map((tech, index) => (
            <span 
              key={tech}
              className="px-4 py-2 rounded-full glass text-xs font-mono text-muted-foreground hover:text-soft hover:border-pink/30 transition-colors border border-transparent"
            >
              {tech}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
