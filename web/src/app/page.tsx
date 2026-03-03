import Link from 'next/link';
import {
  Wrench, Cpu, BookOpen, Shield, Clock, ChevronRight,
  CheckCircle2, Zap, Building2, ArrowRight
} from 'lucide-react';

// ─── Nav ──────────────────────────────────────────────────────────────────────

function Navbar() {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Wrench className="h-6 w-6 text-motix-500" />
          <span className="text-xl font-bold text-neutral-900">
            Motix<span className="text-motix-500">AI</span>
          </span>
        </Link>
        <div className="hidden items-center gap-8 text-sm font-medium text-neutral-600 md:flex">
          <Link href="#features" className="hover:text-neutral-900 transition-colors">Features</Link>
          <Link href="#how-it-works" className="hover:text-neutral-900 transition-colors">How it works</Link>
          <Link href="/pricing" className="hover:text-neutral-900 transition-colors">Pricing</Link>
          <Link href="#enterprise" className="hover:text-neutral-900 transition-colors">Enterprise</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost hidden md:inline-flex">Sign in</Link>
          <Link href="/signup" className="btn-primary">Get started free</Link>
        </div>
      </div>
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-24">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-motix-50 blur-3xl opacity-60" />
      </div>

      <div className="mx-auto max-w-4xl px-6 text-center">
        <span className="badge-orange mb-6 inline-flex items-center gap-1">
          <Zap className="h-3 w-3" /> AI-powered repair intelligence
        </span>

        <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight text-neutral-900 md:text-6xl">
          Fix anything.<br />
          <span className="text-motix-500">Fast and right.</span>
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-lg text-neutral-600">
          Enter a VIN or vehicle model, name the part — MotixAI returns a structured,
          step-by-step repair guide with tools, safety notes, OEM specs, and time estimate.
          Instantly.
        </p>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link href="/signup" className="btn-primary px-8 py-3 text-base">
            Start for free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="#how-it-works" className="btn-secondary px-8 py-3 text-base">
            See how it works
          </Link>
        </div>

        <p className="mt-8 text-sm text-neutral-400">
          No credit card required · 10 free guides per month
        </p>
      </div>

      {/* Guide preview card */}
      <div className="mx-auto mt-16 max-w-3xl px-6">
        <div className="card overflow-hidden shadow-lg">
          <div className="border-b border-neutral-100 bg-neutral-50 px-5 py-3">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
              <span className="ml-3 text-xs text-neutral-400 font-mono">motixai.com/dashboard/search</span>
            </div>
          </div>
          <div className="p-6">
            <div className="mb-5 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-500">VIN or Vehicle</label>
                <div className="input">Toyota Camry 2020</div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-500">Part / OEM number</label>
                <div className="input">Brake pads front</div>
              </div>
            </div>
            <div className="rounded-md border border-motix-100 bg-motix-50 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-neutral-900 text-sm">Front Brake Pad Replacement — Toyota Camry 2020</p>
                <span className="badge-orange">Ready</span>
              </div>
              <div className="flex gap-4 text-sm text-neutral-500">
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> 1–2 hours</span>
                <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> Safety noted</span>
                <span className="flex items-center gap-1"><Wrench className="h-3.5 w-3.5" /> 8 steps</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: Cpu, title: 'AI-generated repair guides', desc: 'Claude AI synthesises accurate, step-by-step repair procedures tailored to your exact vehicle and part combination.' },
  { icon: BookOpen, title: 'OEM specification summary', desc: 'Every guide includes torque specs, part numbers, compatibility notes, and official reference data.' },
  { icon: Shield, title: 'Safety-first always', desc: 'Critical safety warnings and required protective equipment are highlighted before every repair begins.' },
  { icon: Clock, title: 'Time & difficulty estimate', desc: "Know what you're getting into. Each guide shows realistic time, skill level, and required tools upfront." },
  { icon: Wrench, title: 'Tools & materials list', desc: 'Complete shopping list generated automatically so you only go to the parts store once.' },
  { icon: Building2, title: 'Enterprise knowledge base', desc: 'Upload your service manuals. MotixAI indexes them and generates guides for your service network.' },
];

function Features() {
  return (
    <section id="features" className="py-24 bg-neutral-50">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-neutral-900">Everything a repair needs</h2>
          <p className="mt-3 text-neutral-600">One search. A complete, actionable guide.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-motix-50">
                <Icon className="h-5 w-5 text-motix-500" />
              </div>
              <h3 className="mb-2 font-semibold text-neutral-900">{title}</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How it works ─────────────────────────────────────────────────────────────

const HOW_STEPS = [
  { n: '01', title: 'Enter vehicle', desc: 'Type your VIN or select make, model, and year.' },
  { n: '02', title: 'Name the part', desc: 'Enter the part name or paste an OEM number.' },
  { n: '03', title: 'Get the guide', desc: 'MotixAI generates a full repair guide in seconds.' },
  { n: '04', title: 'Follow the steps', desc: 'Work through the guide — step by step, tool by tool.' },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-neutral-900">From question to repair guide in seconds</h2>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_STEPS.map(({ n, title, desc }) => (
            <div key={n}>
              <span className="text-5xl font-bold text-motix-100">{n}</span>
              <h3 className="mt-2 font-semibold text-neutral-900">{title}</h3>
              <p className="mt-1 text-sm text-neutral-600">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Enterprise ───────────────────────────────────────────────────────────────

function EnterpriseBanner() {
  return (
    <section id="enterprise" className="py-20 bg-neutral-900">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <Building2 className="mx-auto mb-4 h-10 w-10 text-motix-400" />
        <h2 className="mb-4 text-3xl font-bold text-white">Built for enterprise service networks</h2>
        <p className="mb-8 text-neutral-400">
          Upload your PDF service manuals. MotixAI indexes them into a structured knowledge base
          and generates guides for your entire model range. One platform for your whole service network.
        </p>
        <div className="mb-10 grid gap-3 sm:grid-cols-3 text-left">
          {['Multitenant isolation per brand', 'Upload & index PDF manuals', 'Auto-generate guides per model',
            'Share to service network', 'Export to PDF / API', 'Admin portal for your team'].map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm text-neutral-300">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-motix-400" />
              {item}
            </div>
          ))}
        </div>
        <Link href="/pricing#enterprise" className="btn-primary px-8 py-3 text-base">
          Talk to sales <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

// ─── Pricing teaser ───────────────────────────────────────────────────────────

const PLANS = [
  { name: 'Free', price: '$0', period: 'forever', features: ['10 guides / month', 'Step-by-step instructions', 'Basic OEM info', 'Email support'], cta: 'Get started', href: '/signup', highlight: false },
  { name: 'Pro', price: '$19', period: 'per month', features: ['Unlimited guides', 'Full OEM summaries', 'Favorites & history', 'Priority support'], cta: 'Start Pro free', href: '/signup?plan=pro', highlight: true },
  { name: 'Enterprise', price: 'Custom', period: 'per year', features: ['Manual upload & indexing', 'Multitenant isolation', 'Admin portal', 'Dedicated support'], cta: 'Contact sales', href: '/pricing#enterprise', highlight: false },
];

function PricingTeaser() {
  return (
    <section className="py-24 bg-neutral-50">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-neutral-900">Simple pricing</h2>
          <p className="mt-3 text-neutral-600">Start free. Upgrade when you need more.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div key={plan.name} className={`card p-6 ${plan.highlight ? 'ring-2 ring-motix-500' : ''}`}>
              {plan.highlight && <span className="badge-orange mb-4 inline-flex">Most popular</span>}
              <p className="text-sm font-medium text-neutral-500">{plan.name}</p>
              <p className="mt-2 text-4xl font-bold text-neutral-900">{plan.price}</p>
              <p className="text-sm text-neutral-500">{plan.period}</p>
              <ul className="my-6 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-neutral-700">
                    <CheckCircle2 className="h-4 w-4 text-motix-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={plan.href} className={plan.highlight ? 'btn-primary w-full' : 'btn-secondary w-full'}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white py-12">
      <div className="mx-auto max-w-7xl px-6 flex flex-col items-center justify-between gap-4 md:flex-row">
        <Link href="/" className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-motix-500" />
          <span className="font-bold text-neutral-900">Motix<span className="text-motix-500">AI</span></span>
        </Link>
        <div className="flex gap-6 text-sm text-neutral-500">
          <Link href="/pricing" className="hover:text-neutral-900 transition-colors">Pricing</Link>
          <Link href="#enterprise" className="hover:text-neutral-900 transition-colors">Enterprise</Link>
          <Link href="/login" className="hover:text-neutral-900 transition-colors">Sign in</Link>
        </div>
        <p className="text-sm text-neutral-400">© 2026 MotixAI. All rights reserved.</p>
      </div>
    </footer>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <EnterpriseBanner />
        <PricingTeaser />
      </main>
      <Footer />
    </>
  );
}
