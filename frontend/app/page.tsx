import { Hero } from "@/components/landing/hero"
import { TerminalDemo } from "@/components/landing/terminal-demo"
import { FeaturesBento } from "@/components/landing/features-bento"
import { Architecture } from "@/components/landing/architecture"
import { About } from "@/components/landing/about"
import { VideoSection } from "@/components/landing/video-section"
import { TechStack } from "@/components/landing/tech-stack"
import { Creator } from "@/components/landing/creator"
import { Footer } from "@/components/landing/footer"

export default function CypherLanding() {
  return (
    <main className="min-h-screen bg-bg overflow-x-hidden">
      <Hero />
      <TerminalDemo />
      <FeaturesBento />
      <Architecture />
      <About />
      <VideoSection />
      <TechStack />
      <Creator />
      <Footer />
    </main>
  )
}
