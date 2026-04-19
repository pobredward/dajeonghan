import { Hero } from '@/components/Hero'
import { Features } from '@/components/Features'
import { AppScreenshots } from '@/components/AppScreenshots'
import { Testimonials } from '@/components/Testimonials'
import { CTA } from '@/components/CTA'
import { Footer } from '@/components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <AppScreenshots />
      <Testimonials />
      <CTA />
      <Footer />
    </main>
  )
}
