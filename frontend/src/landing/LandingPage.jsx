import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BrainCircuit, Zap, ShieldCheck, BarChart3, Clock, Lock, Menu, X, Terminal, Cpu, Layers, Database, GitBranch, Server } from 'lucide-react';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Solutions', href: '#solutions' },
    { name: 'Architecture', href: '#architecture' },
    { name: 'Features', href: '#features' },
    { name: 'Pricing', href: '#pricing' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0B0F] text-gray-200 font-sans selection:bg-indigo-500/30 leading-relaxed">
      {/* Navbar - Balanced with content */}
      <nav className="fixed w-full bg-[#0A0B0F]/90 backdrop-blur-md z-50 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-xl font-bold tracking-tight text-white">NeuralOps</div>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex gap-8 text-sm font-normal text-gray-400">
            {navLinks.map(link => (
              <a key={link.name} href={link.href} className="hover:text-white transition">{link.name}</a>
            ))}
          </div>
          <div className="hidden md:flex gap-4">
            <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition">Login</Link>
            <Link to="/register" className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded hover:bg-indigo-500 transition">Get Started</Link>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Hero - More refined weight */}
      <section className="px-6 pt-32 pb-24 text-center max-w-5xl mx-auto">
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-6xl font-medium mb-6 tracking-tight text-white">
          Operational Excellence for AI Infrastructure
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto font-light">
          A production-grade platform to registry, monitor, and evaluate AI models at scale. Built for developers, engineered for production stability.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register" className="px-6 py-3 bg-indigo-600 text-white font-medium rounded hover:bg-indigo-500 transition">Start Free Trial</Link>
          <a href="#architecture" className="px-6 py-3 bg-[#13151C] text-gray-200 border border-gray-700 font-medium rounded hover:border-gray-500 transition">View Architecture</a>
        </motion.div>
      </section>

      {/* Solutions / Use Cases */}
      <section id="solutions" className="px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold mb-12 text-white">Solutions</h2>
          <div className="grid md:grid-cols-2 gap-12">
            {[
              { icon: Database, title: "Model Deployment & Versioning", desc: "Manage your model artifacts with semantic versioning. Seamlessly switch between versions in production environments with no downtime." },
              { icon: BarChart3, title: "Operational Analytics", desc: "Detailed breakdown of token consumption, latency distribution, and cost per request. Know exactly where your compute budget goes." },
            ].map((s, i) => (
              <div key={i} className="space-y-4">
                <s.icon className="w-8 h-8 text-indigo-500" />
                <h3 className="text-lg font-medium text-white">{s.title}</h3>
                <p className="text-sm text-gray-400 font-light">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Architecture */}
      <section id="architecture" className="px-6 py-24 bg-[#0F1118]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold mb-12 text-white">System Architecture</h2>
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div className="space-y-8">
              {[
                { title: "Asynchronous API Layer", desc: "Python 3.13, FastAPI for high-throughput model handling." },
                { title: "Distributed Task Queue", desc: "Celery-backed workers for offline evaluation and training." },
                { title: "Event-Driven Monitoring", desc: "Realtime SSE (Server-Sent Events) for live infrastructure state." },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-1.5 h-10 bg-indigo-500 rounded-full shrink-0" />
                  <div>
                    <h4 className="font-medium text-white mb-1">{item.title}</h4>
                    <p className="text-gray-400 text-sm font-light">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 bg-[#0A0B0F] rounded-lg border border-gray-800 text-gray-400 text-xs font-mono">
              <p># Core Monitoring Pipeline</p>
              <p className="text-indigo-400">async def monitor_service(service_id: str):</p>
              <p className="pl-4">{"  status = await redis.get(f'health:{service_id}')"}</p>
              <p className="pl-4">{"  if not status: raise HealthException()"}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing - Pro/Free */}
      <section id="pricing" className="px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold mb-12 text-white">Pricing Plans</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="p-8 bg-[#13151C] border border-gray-800 rounded">
              <h3 className="text-lg font-medium mb-4">Free Tier</h3>
              <p className="text-3xl font-normal mb-6 text-white">$0</p>
              <ul className="text-gray-400 text-sm space-y-3 font-light">
                <li>Up to 5 model registries</li>
                <li>Basic latency monitoring</li>
                <li>Standard Support</li>
              </ul>
            </div>
            <div className="p-8 bg-indigo-900/10 border border-indigo-500/20 rounded">
              <h3 className="text-lg font-medium mb-4 text-indigo-400">Pro Tier</h3>
              <p className="text-3xl font-normal mb-6 text-white">$49<span className="text-sm text-gray-500 font-light">/month</span></p>
              <ul className="text-gray-300 text-sm space-y-3 font-light">
                <li>Unlimited registries</li>
                <li>Realtime SSE monitoring & alerts</li>
                <li>Advanced analytics & audit logs</li>
                <li>Priority 24/7 support</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Balanced */}
      <footer className="px-6 py-12 border-t border-gray-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-lg font-bold">NeuralOps</div>
          <div className="flex gap-8 text-sm text-gray-500 font-light">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Security</span>
            <span>Contact</span>
          </div>
          <div className="text-sm text-gray-600 font-light">
            &copy; 2026 NeuralOps Enterprise.
          </div>
        </div>
      </footer>
    </div>
  );
}
