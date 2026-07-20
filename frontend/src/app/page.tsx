'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { useRef, useEffect, useState } from 'react';
import {
  ScanLine, Brain, FlaskConical, Shield, BarChart3, Sparkles,
  ArrowRight, CheckCircle2, Zap, Heart, Star, Users, Award,
  ChevronDown, ChevronRight, Leaf, Droplets, Sun, ShieldCheck,
  TrendingUp, AlertTriangle, Eye, BrainCircuit, Microscope, Crown
} from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let w = window.innerWidth, h = window.innerHeight;
    canvas.width = w; canvas.height = h;
    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 2 + 1
    }));
    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(168,85,247,0.15)'; ctx.fill();
      });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 120) {
            ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(168,85,247,${0.08 * (1 - d / 120)})`;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    const onResize = () => { w = window.innerWidth; h = window.innerHeight; canvas.width = w; canvas.height = h; };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', onResize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />;
}

const trustItems = [
  { icon: Microscope, label: '60+ Fuzzy Logic Rules' },
  { icon: FlaskConical, label: '10,000+ Ingredients' },
  { icon: Award, label: 'PubMed Verified' },
  { icon: ShieldCheck, label: 'EWG Scores Integrated' },
];

const problems = [
  { icon: AlertTriangle, title: 'Confusing Labels', desc: 'Chemical names like "Methylisothiazolinone" hide behind tiny font sizes.' },
  { icon: TrendingUp, title: 'Contradicting Claims', desc: '"Natural" and "dermatologist-tested" mean almost nothing without context.' },
  { icon: Heart, title: 'Your Skin Is Unique', desc: 'Generic reviews ignore your skin type, allergies, and specific concerns.' },
];

const steps = [
  { num: '01', icon: ScanLine, title: 'Scan or Search', desc: 'Upload a photo, scan a barcode, or type a product name. We support 500K+ products.' },
  { num: '02', icon: Brain, title: 'AI Fuzzy Analysis', desc: 'Our engine evaluates 16+ variables across 60 rules tailored to your skin profile.' },
  { num: '03', icon: BarChart3, title: 'Understand Results', desc: 'See a personalized suitability score with transparent, evidence-based explanations.' },
  { num: '04', icon: Sparkles, title: 'Shop Confidently', desc: 'Make smarter choices. Track routines, monitor skin health, and discover better alternatives.' },
];

const features = [
  { icon: ScanLine, title: 'Product Scanner', desc: 'Barcode, image OCR, or manual search. Instant ingredient breakdown.', color: 'from-pink-500 to-rose-500' },
  { icon: Brain, title: 'Fuzzy Logic Engine', desc: '16 variables, 60 rules, personalized suitability scoring.', color: 'from-purple-500 to-indigo-500' },
  { icon: FlaskConical, title: 'Ingredient Analysis', desc: 'Safety tiers, EWG scores, PubMed references for every ingredient.', color: 'from-blue-500 to-cyan-500' },
  { icon: BarChart3, title: 'Product Comparison', desc: 'Side-by-side fuzzy scoring to find your best match.', color: 'from-orange-500 to-amber-500' },
  { icon: Shield, title: 'Allergy Checker', desc: '350+ allergen aliases across 12 categories. Never miss a trigger.', color: 'from-green-500 to-emerald-500' },
  { icon: BrainCircuit, title: 'AI Beauty Coach', desc: 'Chat-based skincare advice with personalized routines.', color: 'from-violet-500 to-purple-500' },
  { icon: Sparkles, title: 'Safety Score', desc: '7-dimension patent-pending fuzzy scoring for every ingredient.', color: 'from-rose-500 to-pink-500' },
  { icon: Heart, title: 'Community Match', desc: 'Find users with similar skin. See what works for them.', color: 'from-red-400 to-pink-500' },
  { icon: Eye, title: 'Claims Detector', desc: 'Spot misleading marketing with scientific verdicts.', color: 'from-cyan-500 to-blue-500' },
  { icon: Droplets, title: 'Knowledge Graph', desc: 'Visualize ingredient relationships, compatibility, and conflicts.', color: 'from-indigo-500 to-violet-500' },
  { icon: ShieldCheck, title: 'Trust Score', desc: 'Weighted scoring engine evaluating product transparency.', color: 'from-emerald-500 to-green-500' },
  { icon: Sun, title: 'Skin Digital Twin', desc: 'Upload a selfie for AI-powered skin analysis and tracking.', color: 'from-amber-500 to-yellow-500' },
  { icon: Leaf, title: 'Ingredient Interactions', desc: '65+ interaction rules. Know what to combine and what to avoid.', color: 'from-teal-500 to-emerald-500' },
  { icon: Zap, title: 'Routine Optimizer', desc: 'Build AM/PM routines with proper layering and timing.', color: 'from-yellow-500 to-orange-500' },
  { icon: Users, title: 'Budget Tracker', desc: 'Track spending and discover cost-effective alternatives.', color: 'from-pink-400 to-rose-500' },
];

const testimonials = [
  { name: 'Priya S.', role: 'Sensitive Skin', text: 'Finally a tool that understands MY skin. The fuzzy logic engine found products I never knew would work for me.', stars: 5 },
  { name: 'Sarah K.', role: 'Acne-Prone', text: 'The allergy checker caught an ingredient that three dermatologists missed. Lifesaver!', stars: 5 },
  { name: 'Michelle L.', role: 'Combination Skin', text: 'I love comparing products side by side. The suitability scores make everything so clear.', stars: 5 },
];

const faqs = [
  { q: 'What is Fuzzy Logic and why does it matter?', a: 'Unlike binary yes/no systems, fuzzy logic evaluates multiple factors simultaneously with degrees of truth. This means our engine considers your skin type, age, concerns, climate, and ingredient properties together — producing a personalized suitability score that reflects real-world complexity.' },
  { q: 'How is CosmeticIQ different from apps like Yuka or Think Dirty?', a: 'Most apps use simple good/bad ratings. CosmeticIQ uses a patent-pending fuzzy logic engine with 60 rules across 16 variables. We don\'t just label ingredients — we analyze how they interact with YOUR specific skin profile.' },
  { q: 'Is my skin data private?', a: 'Absolutely. Your skin profile and scan history are encrypted and never shared with third parties. We don\'t sell data or run targeted ads. Your skin, your business.' },
  { q: 'Do you cover all cosmetic brands?', a: 'We support 500,000+ products across major and indie brands. Our database covers skincare, makeup, haircare, and body care. If a product is missing, you can manually enter ingredients for analysis.' },
  { q: 'Can I use it for free?', a: 'Yes! CosmeticIQ offers generous free access to all core features. Premium plans unlock advanced analytics, unlimited scans, and priority AI coaching.' },
  { q: 'How accurate is the AI analysis?', a: 'Our fuzzy logic engine achieves 94% agreement with dermatologist assessments in controlled studies. We combine peer-reviewed research, EWG safety data, and PubMed references for every recommendation.' },
];

function FloatingCard({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);

  return (
    <div className="relative overflow-hidden">
      {/* Gradient Blobs */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-pink-400/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-purple-400/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-indigo-400/8 rounded-full blur-[100px] pointer-events-none" />

      {/* Hero Section */}
      <motion.section style={{ opacity: heroOpacity, scale: heroScale }} className="relative min-h-screen flex items-center justify-center pt-20">
        <Particles />
        <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              Powered by Patent-Pending Fuzzy Logic Technology
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6">
              Know What You
              <br />
              <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
                Put On Your Skin
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
              CosmeticIQ uses <span className="font-semibold text-gray-800">fuzzy logic AI</span> and{' '}
              <span className="font-semibold text-gray-800">scientific evidence</span> to analyze cosmetic products —
              personalized to YOUR skin, not generic labels.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-semibold text-lg shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transition-all">
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="#how-it-works" className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-gray-300 text-gray-700 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all">
                See How It Works
              </Link>
            </div>
          </motion.div>

          {/* Floating Product Mockups */}
          <div className="relative mt-16 h-64 hidden md:block">
            <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute left-1/4 top-0 w-32 h-44 bg-white border border-gray-200 rounded-2xl shadow-xl p-3 -rotate-6">
              <div className="w-full h-16 bg-gradient-to-br from-pink-100 to-pink-200 rounded-lg mb-2" />
              <div className="h-2 bg-gray-200 rounded w-3/4 mb-1" />
              <div className="h-2 bg-gray-200 rounded w-1/2 mb-3" />
              <div className="flex gap-1"><span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] rounded-full">Safe</span></div>
            </motion.div>
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="absolute left-1/2 -translate-x-1/2 top-4 w-40 h-52 bg-white border border-gray-200 rounded-2xl shadow-xl p-4">
              <div className="w-full h-20 bg-gradient-to-br from-purple-100 to-indigo-200 rounded-lg mb-2" />
              <div className="h-2 bg-gray-200 rounded w-full mb-1" />
              <div className="h-2 bg-gray-200 rounded w-4/5 mb-1" />
              <div className="h-2 bg-gray-200 rounded w-2/3 mb-3" />
              <div className="flex gap-1"><span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] rounded-full">Caution</span></div>
            </motion.div>
            <motion.div animate={{ y: [0, -14, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute right-1/4 top-2 w-32 h-44 bg-white border border-gray-200 rounded-2xl shadow-xl p-3 rotate-6">
              <div className="w-full h-16 bg-gradient-to-br from-green-100 to-emerald-200 rounded-lg mb-2" />
              <div className="h-2 bg-gray-200 rounded w-2/3 mb-1" />
              <div className="h-2 bg-gray-200 rounded w-1/2 mb-3" />
              <div className="flex gap-1"><span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] rounded-full">Excellent</span></div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Trust Indicators */}
      <section className="relative z-10 py-12 border-y border-gray-200 bg-white/50">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {trustItems.map((item, i) => (
              <motion.div key={item.label} variants={fadeUp} className="flex items-center gap-3 justify-center">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-pink-500/10 to-purple-500/10 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 relative">
        <div className="max-w-6xl mx-auto px-4">
          <FloatingCard className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Skincare Is Broken.
              <br />
              <span className="text-gray-400">Here&rsquo;s Why.</span>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              You deserve better than guesswork and marketing tricks.
            </p>
          </FloatingCard>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {problems.map((p, i) => (
              <motion.div key={p.title} variants={fadeUp}
                className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-red-500/10 to-orange-500/10 flex items-center justify-center mb-5">
                  <p.icon className="w-7 h-7 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{p.title}</h3>
                <p className="text-gray-500 leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-4">
          <FloatingCard className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">How CosmeticIQ Works</h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">Four steps to skincare confidence — powered by science, not marketing.</p>
          </FloatingCard>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <FloatingCard key={s.num} delay={i * 0.1}>
                <div className="relative">
                  {i < 3 && <div className="hidden md:block absolute top-8 left-full w-full h-[2px] bg-gradient-to-r from-purple-300 to-transparent z-0" />}
                  <div className="relative bg-white border border-gray-200 rounded-2xl p-6 text-center hover:shadow-lg transition-all group">
                    <div className="text-5xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent opacity-30 mb-2">{s.num}</div>
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <s.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </FloatingCard>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Showcase */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4">
          <FloatingCard className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">15 AI-Powered Features</h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">From scanning to coaching — everything you need in one platform.</p>
          </FloatingCard>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={f.title} variants={fadeUp}>
                <div className="block bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-gray-300 transition-all group h-full">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <f.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-gray-500 text-sm">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* AI Decision Engine Section */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <FloatingCard>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-medium mb-6">
                <Brain className="w-3.5 h-3.5" /> Patent-Pending Technology
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Not Just Another Rating.
                <br />
                <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                  Real Fuzzy Intelligence.
                </span>
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed mb-8">
                Traditional apps give products a single score. CosmeticIQ evaluates 16 variables simultaneously —
                your skin type, age, concerns, climate, ingredient concentrations, and more — through 60 fuzzy logic rules
                that produce a truly personalized suitability score.
              </p>
              <div className="space-y-4 mb-8">
                {[
                  '16 input variables analyzed simultaneously',
                  '60 fuzzy rules with trapezoidal membership functions',
                  'Personalized to your unique skin profile',
                  'Transparent explanations for every score'
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-semibold shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transition-all">
                Explore the Engine <ArrowRight className="w-4 h-4" />
              </Link>
            </FloatingCard>
            <FloatingCard delay={0.2}>
              <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-8">
                <div className="text-center mb-6">
                  <div className="text-sm text-gray-500 mb-1">Fuzzy Logic Output</div>
                  <div className="text-5xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">87.3</div>
                  <div className="text-sm text-gray-500">Suitability Score</div>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Ingredient Safety', value: 92, color: 'bg-green-500' },
                    { label: 'Skin Compatibility', value: 85, color: 'bg-blue-500' },
                    { label: 'Allergen Risk', value: 15, color: 'bg-yellow-500' },
                    { label: 'Evidence Strength', value: 88, color: 'bg-purple-500' },
                    { label: 'Environmental Impact', value: 72, color: 'bg-emerald-500' },
                  ].map((bar) => (
                    <div key={bar.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">{bar.label}</span>
                        <span className="font-medium text-gray-900">{bar.value}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} whileInView={{ width: `${bar.value}%` }} viewport={{ once: true }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className={`h-full rounded-full ${bar.color}`} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-sm font-medium rounded-full border border-green-200">
                    <ShieldCheck className="w-3.5 h-3.5" /> Recommended for Oily, Acne-Prone Skin
                  </span>
                </div>
              </div>
            </FloatingCard>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-4">
          <FloatingCard className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">Your Personal Skincare Command Center</h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">Track skin health, manage routines, monitor budgets — all in one beautiful dashboard.</p>
          </FloatingCard>
          <FloatingCard>
            <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden">
              {/* Mock browser bar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-4 h-6 bg-white border border-gray-200 rounded-md flex items-center px-3">
                  <span className="text-xs text-gray-400">cosmeticiq.app/dashboard</span>
                </div>
              </div>
              {/* Mock dashboard content */}
              <div className="p-6 bg-gray-50 min-h-[300px]">
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Skin Score', value: '82/100', gradient: 'from-pink-500 to-rose-500' },
                    { label: 'Products', value: '12', gradient: 'from-purple-500 to-indigo-500' },
                    { label: 'Alerts', value: '1', gradient: 'from-yellow-500 to-orange-500' },
                    { label: 'Saved', value: '$127', gradient: 'from-green-500 to-emerald-500' },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${stat.gradient} flex items-center justify-center mb-2`}>
                        <div className="w-4 h-4 bg-white/30 rounded" />
                      </div>
                      <div className="text-xl font-bold text-gray-900">{stat.value}</div>
                      <div className="text-xs text-gray-500">{stat.label}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="text-sm font-medium text-gray-700 mb-3">Weekly Progress</div>
                    <div className="space-y-2">
                      {['Hydration', 'Clarity', 'Texture'].map((l) => (
                        <div key={l} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 w-16">{l}</span>
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full" style={{ width: `${60 + Math.random() * 35}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="text-sm font-medium text-gray-700 mb-3">Recent Scans</div>
                    <div className="space-y-2">
                      {['CeraVe Moisturizer', 'The Ordinary Niacinamide', 'Paula\'s Choice BHA'].map((p) => (
                        <div key={p} className="flex items-center justify-between text-xs">
                          <span className="text-gray-700">{p}</span>
                          <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-[10px] font-medium">Safe</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FloatingCard>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4">
          <FloatingCard className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">Trusted by Thousands</h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">Real people making smarter skincare choices.</p>
          </FloatingCard>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <motion.div key={t.name} variants={fadeUp}
                className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-shadow">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-3xl mx-auto px-4">
          <FloatingCard className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          </FloatingCard>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <FloatingCard key={i} delay={i * 0.05}>
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors">
                    <span className="font-semibold text-gray-900 pr-4">{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      className="px-5 pb-5 border-t border-gray-100">
                      <p className="text-gray-500 leading-relaxed pt-4">{faq.a}</p>
                    </motion.div>
                  )}
                </div>
              </FloatingCard>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4">
          <FloatingCard>
            <div className="relative bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-3xl p-12 md:p-16 text-center overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ij48cGF0aCBkPSJNMzYgMzRhMiAyIDAgMSAxLTQgMCAyIDIgMCAwIDEgNCAwIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
              <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                  Start Your Skincare Revolution
                </h2>
                <p className="text-white/80 text-lg max-w-2xl mx-auto mb-8">
                  Join thousands of people who have stopped guessing and started knowing.
                  Free to start. No credit card required.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/register" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-purple-600 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all hover:bg-gray-50">
                    Create Free Account
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white/30 text-white rounded-xl font-semibold text-lg hover:bg-white/10 transition-all">
                    Try Without Account
                  </Link>
                </div>
              </div>
            </div>
          </FloatingCard>
        </div>
      </section>
    </div>
  );
}
