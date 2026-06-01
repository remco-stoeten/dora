import { GitHubStats } from "@/components/github-stats"
import { FeaturesSection } from "@/components/features-section"
import { SiteNav } from "@/components/landing/site-nav"
import { Hero } from "@/components/landing/hero"
import { DemoSection } from "@/components/landing/demo-section"
import { Footer } from "@/components/landing/footer"
import { FrameShell, FrameSection, FrameFoot } from "@/components/landing/frame"

export default function Page() {
  return (
    <main className="frame-sharp min-h-screen bg-[#0a0a0a]">
      <SiteNav />
      <FrameShell>
        {/* Hero is the top of the column — no divider above it */}
        <FrameSection divider={false}>
          <Hero />
        </FrameSection>

        <FrameSection>
          <DemoSection />
        </FrameSection>

        <FrameSection id="interface">
          <FeaturesSection />
        </FrameSection>

        <FrameSection>
          <GitHubStats />
        </FrameSection>

        <FrameSection>
          <Footer />
        </FrameSection>

        <FrameFoot />
      </FrameShell>
    </main>
  )
}
