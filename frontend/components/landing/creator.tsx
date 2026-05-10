"use client"

import { motion } from "framer-motion"
import { Github, Linkedin, Twitter, Shield, Code, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"

import Image from 'next/image'

export function Creator() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="relative z-10 max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-soft mb-4">
            Meet the <span className="gradient-text">Creator</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative group"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-pink via-violet to-orange rounded-3xl opacity-30 blur-sm group-hover:opacity-50 transition-opacity duration-500" />
          
          <div className="relative glass rounded-3xl p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Real profile photo */}
              <div className="relative shrink-0">
                <div className="w-40 h-40 rounded-2xl overflow-hidden glow-pink border-2 border-pink/30">
                  <Image
                    src="/erika_villa.png"
                    alt="Erika Cristina Villa"
                    width={160}
                    height={160}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Status indicator */}
                <div className="absolute -bottom-2 -right-2 px-3 py-1 rounded-full glass border border-pink/30 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-pink animate-pulse" />
                  <span className="text-xs font-mono text-pink">Building</span>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl md:text-3xl font-bold text-soft mb-2">
                  Erika Cristina Villa
                </h3>
                <p className="text-pink font-medium mb-4">
                  Full Stack Engineer • Transitioning into Cybersecurity & Digital Forensics
                </p>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Passionate about blockchain security, AI systems, and forensic risk intelligence. Focused on building defensive technologies that improve trust and transparency in Web3 ecosystems.
                </p>

                {/* Skills tags */}
                <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-6">
                  <SkillTag icon={Shield} label="Cybersecurity" />
                  <SkillTag icon={Code} label="Blockchain" />
                  <SkillTag icon={Lock} label="Digital Forensics" />
                </div>

                {/* Social links */}
                <div className="flex justify-center md:justify-start gap-3">
                  <SocialButton icon={Github}   label="GitHub"   href="https://github.com/Erika05cristina" />
                  <SocialButton icon={Linkedin}  label="LinkedIn" href="https://linkedin.com/in/erika-villa-a63379120" />
                  <SocialButton icon={Twitter}   label="X/Twitter" href="https://x.com/erika05cristin" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function SkillTag({ icon: Icon, label }: { icon: typeof Shield; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass text-xs font-mono text-muted-foreground">
      <Icon className="w-3 h-3 text-violet" />
      {label}
    </span>
  )
}

function SocialButton({ icon: Icon, label, href }: { icon: typeof Github; label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm border border-border bg-surface/50 hover:bg-surface hover:border-pink/50 hover:text-pink transition-all"
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
    </a>
  )
}
