"use client"

import { motion } from "framer-motion"
import { Shield, Github, Twitter, ExternalLink } from "lucide-react"

import Image from 'next/image'

export function Footer() {
  return (
    <footer className="relative py-16 overflow-hidden">
      {/* Animated glow line at top */}
      <div className="absolute top-0 left-0 right-0 h-px">
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5 }}
          className="h-full bg-gradient-to-r from-transparent via-pink to-transparent"
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="flex flex-col items-center">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 mb-8"
          >
            <div className="p-2 rounded-lg bg-gradient-to-br from-pink/20 to-violet/20 flex items-center justify-center">
              <Image src="/cypher-logo.svg" alt="Cypher Logo" width={24} height={24} className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold gradient-text">CYPHER</span>
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl font-mono text-soft mb-8 text-center"
          >
            Don&apos;t Trust. <span className="text-pink">Verify.</span> CYPHER.
          </motion.p>

          {/* Links */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center gap-6 mb-12"
          >
            <a 
              href="https://github.com/Erika05cristina" 
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-pink transition-colors"
            >
              <Github className="w-5 h-5" />
              <span className="text-sm">GitHub</span>
            </a>
            <a 
              href="https://x.com/erika05cristin" 
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-pink transition-colors"
            >
              <span className="text-sm">Twitter</span>
            </a>
            <a 
              href="#" 
              className="flex items-center gap-2 text-muted-foreground hover:text-pink transition-colors"
            >
              <ExternalLink className="w-5 h-5" />
              <span className="text-sm">Docs</span>
            </a>
          </motion.div>

          {/* Hackathon badge */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="glass px-6 py-3 rounded-full mb-8"
          >
            <span className="text-sm font-mono text-muted-foreground">
              Built for <span className="text-violet">Dev3Pack Global Hackathon</span>
            </span>
          </motion.div>

          {/* Copyright */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-sm text-muted-foreground text-center"
          >
            © {new Date().getFullYear()} CYPHER. All rights reserved.
          </motion.p>
        </div>
      </div>

      {/* Bottom glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-pink/5 rounded-full blur-3xl" />
    </footer>
  )
}
