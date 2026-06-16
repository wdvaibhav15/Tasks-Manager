import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Layers, Users, CheckSquare, Zap, BarChart2, Shield, ArrowRight, Play, 
  HelpCircle, ChevronDown, CheckCircle, ChevronUp, Github, Sparkles
} from 'lucide-react';

export default function LandingPage({ onNavigate }) {
  const [activeFaq, setActiveFaq] = useState(null);
  const [billingPeriod, setBillingPeriod] = useState('monthly'); // 'monthly' | 'yearly'

  const features = [
    {
      icon: <Layers className="w-6 h-6 text-blue-500" />,
      title: "Project Management",
      desc: "Create and manage unlimited projects with custom boards."
    },
    {
      icon: <CheckSquare className="w-6 h-6 text-cyan-500" />,
      title: "Task Assignment",
      desc: "Assign tasks to team members instantly with clear parameters."
    },
    {
      icon: <Users className="w-6 h-6 text-purple-500" />,
      title: "Team Collaboration",
      desc: "Comment and discuss inside task panels, featuring user tags."
    },
    {
      icon: <Zap className="w-6 h-6 text-amber-500" />,
      title: "Real-Time Updates",
      desc: "Instant notifications and live Kanban card movements."
    },
    {
      icon: <BarChart2 className="w-6 h-6 text-emerald-500" />,
      title: "Analytics",
      desc: "Track team performance with custom built-in productivity metrics."
    },
    {
      icon: <Shield className="w-6 h-6 text-rose-500" />,
      title: "Secure Authentication",
      desc: "JWT-secured session management keeps your workspace isolated."
    }
  ];

  const steps = [
    { num: "01", title: "Create Project", desc: "Define your project name, target due date and core team objectives." },
    { num: "02", title: "Invite Team", desc: "Easily onboarding team members and designate their access clearance." },
    { num: "03", title: "Assign Tasks", desc: "Draft tasks, set priority levels, and allocate assignees instantly." },
    { num: "04", title: "Track Progress", desc: "Follow progress visually on our collaborative live board." },
    { num: "05", title: "Complete Project", desc: "Deliver outstanding milestones faster and review performance." }
  ];

  const testimonials = [
    {
      quote: "MANAGE TASKS turned our chaotic Kanban boards into a streamlined pipeline. Real-time updates mean fewer alignment meetings.",
      author: "Sarah Jenkins",
      role: "VP of Product, CloudTech",
      initials: "SJ",
      color: "bg-blue-600"
    },
    {
      quote: "The visual interface is exceptionally clean, with light/dark adaptive options. Assigning and reassigning tasks is immediate.",
      author: "Alex Rivera",
      role: "Engineering Manager, Apex Labs",
      initials: "AR",
      color: "bg-cyan-600"
    },
    {
      quote: "JWT access and isolated workspace databases gave our Enterprise team full security piece of mind.",
      author: "Douglas Vance",
      role: "Security Director, SecureCore Corp",
      initials: "DV",
      color: "bg-violet-600"
    }
  ];

  const pricing = [
    {
      name: "Free Plan",
      price: 0,
      desc: "Perfect for freelancers and indie couples starting up.",
      features: ["Up to 3 active projects", "Kanban Board access", "Basic stats cards", "Standard user profile"],
      btnText: "Get Started Free",
      popular: false
    },
    {
      name: "Pro Plan",
      price: billingPeriod === 'monthly' ? 12 : 9,
      desc: "Supercharge your project managers with unlimited speed.",
      features: ["Unlimited projects & tasks", "Real-time task comments", "Global notifications panel", "Advanced analytics boards", "Premium Dark / Light modes"],
      btnText: "Start Free Trial",
      popular: true
    },
    {
      name: "Enterprise Plan",
      price: billingPeriod === 'monthly' ? 49 : 39,
      desc: "Tailored metrics, premium governance, and deep isolation.",
      features: ["All active Pro features", "Role-based access controls", "Dedicated server priority", "Priority SLA customer support", "Custom logo overlays"],
      btnText: "Contact Enterprise",
      popular: false
    }
  ];

  const faqs = [
    {
      q: "Does MANAGE TASKS support real-time team synchronization?",
      a: "Yes! Utilizing Socket.io on the backend, Kanban card drags, chat comments, and user assignments are broadcasted instantly to all active project members."
    },
    {
      q: "Are my secure tokens protected during authentication?",
      a: "Absolutely. Session cookies are HTTP-only, secure, and encrypted with top-grade bcryptjs hashing algorithms on our Express REST API."
    },
    {
      q: "Can I manage projects as a Member instead of Admin?",
      a: "Admins maintain global authority to create and delete projects, set up team roles, and track overall analytics, while Members can coordinate task items, comment, and track personal work."
    },
    {
      q: "How does the local database fallback work in the live demo editor?",
      a: "To guarantee zero-config, out-of-the-box preview success for development, our system automatically runs on an embedded JSON database to persist stats instantly, routing to MongoDB Atlas as soon as credentials are provided!"
    }
  ];

  return (
    <div id="landing-container" className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300">
      
      {/* Dynamic Floating Navigation Header */}
      <nav id="nav-bar" className="sticky top-0 z-50 backdrop-blur-md bg-slate-50/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-850 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-9 w-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold tracking-wider shadow-md shadow-blue-500/20">
              MT
            </div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              MANAGE TASKS
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-8 text-sm font-medium">
            <a href="#features" className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors">Pricing</a>
            <a href="#faqs" className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors">FAQ</a>
          </div>

          <div className="flex items-center space-x-3">
            <button 
              id="nav-login-btn"
              onClick={() => onNavigate('login')}
              className="px-4 py-2 text-sm font-medium hover:text-blue-600 transition-colors"
            >
              Log In
            </button>
            <button 
              id="nav-get-started-btn"
              onClick={() => onNavigate('register')}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-all"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header id="hero-sec" className="relative pt-20 pb-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center space-x-2 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-semibold tracking-wide mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Real-Time MERN Stack Architecture Configured</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight">
              Manage Projects. <br />
              <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
                Assign Tasks. Deliver Faster.
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Collaborate with your team in real time using MANAGE TASKS. Move cards, comment instantly, and track milestones within one elegant workspace.
            </p>
          </motion.div>

          <motion.div 
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <button 
              id="hero-cta-btn"
              onClick={() => onNavigate('register')}
              className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center space-x-2 transition-all cursor-pointer group"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              id="hero-demo-btn"
              onClick={() => onNavigate('login')}
              className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-905 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 font-semibold rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 text-blue-500 fill-current" />
              <span>Explore Live Demo</span>
            </button>
          </motion.div>

          {/* SaaS Mockup Preview Container */}
          <motion.div 
            id="hero-mockup"
            className="mt-16 mx-auto max-w-5xl border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl bg-white dark:bg-slate-900 p-3"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 50 }}
          >
            <div className="bg-slate-900 rounded-xl h-96 w-full relative flex items-center justify-center overflow-hidden">
              <div className="absolute top-4 left-4 flex space-x-1.5">
                <div id="dot-1" className="h-3.5 w-3.5 rounded-full bg-rose-500" />
                <div id="dot-2" className="h-3.5 w-3.5 rounded-full bg-amber-500" />
                <div id="dot-3" className="h-3.5 w-3.5 rounded-full bg-emerald-500" />
              </div>
              
              {/* Dynamic Abstract Board Animation */}
              <div className="absolute top-12 left-6 right-6 bottom-6 grid grid-cols-4 gap-4 select-none opacity-40">
                {['Backlog', 'To Do', 'In Progress', 'Completed'].map((col, cIdx) => (
                  <div key={col} className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-3 flex flex-col space-y-3">
                    <span className="font-semibold text-slate-400 text-xs text-left">{col}</span>
                    <div className="h-16 bg-slate-800 rounded-lg p-2 flex flex-col justify-between">
                      <div className="w-1/2 h-2 bg-slate-700 rounded" />
                      <div className="w-1/3 h-2 bg-blue-500 rounded" />
                    </div>
                    {cIdx !== 3 && (
                      <div className="h-20 bg-slate-800 rounded-lg p-2 flex flex-col justify-between">
                        <div className="w-4/5 h-2 bg-slate-700 rounded" />
                        <div className="w-2/3 h-2 bg-slate-700 rounded" />
                        <div className="w-1/4 h-2 bg-cyan-400 rounded" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Centered Decorative Interactive Card */}
              <div className="relative z-10 bg-slate-950/90 border border-slate-800 backdrop-blur-xl p-6 rounded-2xl shadow-xl max-w-sm text-left">
                <span className="bg-emerald-500/10 text-emerald-400 font-semibold text-xs px-2.5 py-1 rounded-full">
                  ● Real-time Sync Active
                </span>
                <h3 className="text-white font-bold text-lg mt-4">Redesign SaaS Landing Page</h3>
                <p className="text-slate-400 text-sm mt-2">Finish testing typography weights in both dark and light visual coordinates.</p>
                
                <div className="flex items-center justify-between mt-6 border-t border-slate-800 pt-4">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      VP
                    </div>
                    <span className="text-xs text-slate-300 font-medium">Vaibhav Patel</span>
                  </div>
                  <span className="text-xs bg-rose-500/10 text-rose-400 font-semibold px-2 py-0.5 rounded border border-rose-500/20">
                    High Priority
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Features Grid Sec */}
      <section id="features" className="py-24 border-t border-slate-200 dark:border-slate-900 bg-slate-100/40 dark:bg-slate-900/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Powerful Collaborators Engine
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-4 text-base">
              A comprehensive toolkit tailored to keep project managers and technical builders synchronized on daily targets.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            {features.map((feat, index) => (
              <div 
                key={index} 
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col space-y-4"
              >
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl w-fit border border-slate-200 dark:border-slate-800/50">
                  {feat.icon}
                </div>
                <h4 className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">{feat.title}</h4>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modern Step Timeline Progress */}
      <section id="how-it-works" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">How It Works</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-4">Simple onboarding sequence to get team objectives coordinated under five minutes.</p>
        </div>

        <div className="grid sm:grid-cols-5 gap-8">
          {steps.map((st, sIdx) => (
            <div key={st.num} className="relative flex flex-col space-y-4">
              <span className="text-5xl font-extrabold text-blue-600/20 dark:text-cyan-400/10 font-mono tracking-tighter">
                {st.num}
              </span>
              <h5 className="font-extrabold text-base text-slate-900 dark:text-white">{st.title}</h5>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">{st.desc}</p>
              {sIdx !== 4 && (
                <div className="hidden sm:block absolute top-6 right-[-20%] w-1/3 border-t border-dashed border-slate-300 dark:border-slate-800" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-slate-100/40 dark:bg-slate-900/20 border-y border-slate-200 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Trusted by Engineers and Managers</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((test, tIdx) => (
              <div key={tIdx} className="bg-white dark:bg-slate-905 border border-slate-200 dark:border-slate-800/80 p-8 rounded-2xl flex flex-col justify-between shadow-sm">
                <p className="text-slate-600 dark:text-slate-350 text-sm italic leading-relaxed">
                  "{test.quote}"
                </p>
                <div className="flex items-center space-x-3 mt-6 border-t border-slate-100 dark:border-slate-800/60 pt-4">
                  <div className={`h-10 w-10 ${test.color} rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                    {test.initials}
                  </div>
                  <div>
                    <h6 className="font-bold text-sm text-slate-900 dark:text-white">{test.author}</h6>
                    <span className="text-xs text-slate-450">{test.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Table Section */}
      <section id="pricing" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Flexible Plans Built for Growth</h2>
          <p className="text-slate-550 mt-4 text-sm">Designated options for small projects or full-scale enterprise governance.</p>
          
          {/* Calendar Duration Switch */}
          <div className="flex items-center justify-center mt-8 space-x-3 bg-slate-150 dark:bg-slate-900 p-1.5 rounded-lg w-fit mx-auto border border-slate-200 dark:border-slate-800">
            <button 
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${billingPeriod === 'monthly' ? 'bg-blue-600 text-white shadow' : 'text-slate-500'}`}
            >
              Monthly Billing
            </button>
            <button 
              onClick={() => setBillingPeriod('yearly')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${billingPeriod === 'yearly' ? 'bg-blue-600 text-white shadow' : 'text-slate-500'}`}
            >
              Yearly billing (Save 25%)
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-12 items-stretch">
          {pricing.map((plan, index) => (
            <div 
              key={index} 
              className={`border rounded-2xl p-8 flex flex-col justify-between relative transition-all ${plan.popular ? 'border-2 border-blue-600 bg-white dark:bg-slate-900 shadow-xl' : 'border-slate-200 dark:border-slate-800 bg-slate-100/10 dark:bg-slate-905/30'}`}
            >
              {plan.popular && (
                <span className="absolute top-0 right-8 transform -translate-y-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                  Most Popular
                </span>
              )}
              
              <div>
                <h5 className="font-extrabold text-slate-900 dark:text-white text-lg tracking-wide">{plan.name}</h5>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-2 leading-relaxed">{plan.desc}</p>
                
                <div className="mt-6 flex items-baseline">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white">${plan.price}</span>
                  <span className="text-slate-500 text-xs ml-1 font-medium">/ month</span>
                </div>

                <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-6 space-y-4">
                  {plan.features.map((f, fIdx) => (
                    <div key={fIdx} className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <span className="text-slate-600 dark:text-slate-300 text-xs font-medium">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => onNavigate('register')}
                className={`w-full py-3 px-4 mt-8 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer ${plan.popular ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-900 dark:text-white'}`}
              >
                {plan.btnText}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Accordion */}
      <section id="faqs" className="py-24 border-t border-slate-200 dark:border-slate-900 bg-slate-100/40 dark:bg-slate-900/15">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div 
                  key={index} 
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-all duration-250 cursor-pointer"
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                >
                  <button className="w-full flex items-center justify-between p-6 text-left focus:outline-none">
                    <span className="font-bold text-sm tracking-wide text-slate-900 dark:text-white">
                      {faq.q}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-blue-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 text-xs text-slate-500 dark:text-slate-350 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-4">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section className="py-20 px-6 max-w-7xl mx-auto mb-12">
        <div id="cta-card" className="bg-gradient-to-r from-slate-900 to-slate-950 dark:from-blue-650 dark:to-cyan-700/80 text-white rounded-3xl p-12 text-center relative overflow-hidden shadow-2xl border border-slate-850">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Start Managing Your Team Today
            </h2>
            <p className="mt-4 text-slate-300 text-sm leading-relaxed max-w-xl mx-auto">
              Ready to accelerate your delivery cycles? Register under minutes and invite your engineers to experience real-time sync.
            </p>
            <button 
              id="cta-get-started"
              onClick={() => onNavigate('register')}
              className="mt-8 px-8 py-4 bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-xl shadow-lg cursor-pointer hover:scale-[1.02] transition-all flex items-center justify-center space-x-2 mx-auto"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-4 h-4 text-blue-600" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-16 px-6 border-t border-slate-900">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm">
                MT
              </div>
              <span className="font-bold text-white text-lg tracking-widest uppercase">
                Manage Tasks
              </span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed mt-2">
              The real-time project board solution for modern SaaS builders.
            </p>
          </div>

          <div>
            <h6 className="text-white font-semibold text-xs tracking-wider uppercase mb-4">Product</h6>
            <div className="flex flex-col space-y-2.5 text-xs text-slate-400">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <span className="hover:text-white cursor-pointer transition-colors">Security Rules</span>
            </div>
          </div>

          <div>
            <h6 className="text-white font-semibold text-xs tracking-wider uppercase mb-4">Resources</h6>
            <div className="flex flex-col space-y-2.5 text-xs text-slate-400">
              <a href="#faqs" className="hover:text-white transition-colors">FAQs</a>
              <span className="hover:text-white cursor-pointer transition-colors">Live API documentation</span>
              <span className="hover:text-white cursor-pointer transition-colors">Vercel & Render Config</span>
            </div>
          </div>

          <div>
            <h6 className="text-white font-semibold text-xs tracking-wider uppercase mb-4">Legal</h6>
            <div className="flex flex-col space-y-2.5 text-xs text-slate-400">
              <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
              <span className="hover:text-white cursor-pointer transition-colors">Terms of Service</span>
              <span className="hover:text-white cursor-pointer transition-colors">License Agreement</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-550">
          <span>&copy; {new Date().getFullYear()} MANAGE TASKS. All rights reserved.</span>
          <div className="flex space-x-4 mt-4 sm:mt-0">
            <span className="hover:text-white cursor-pointer">Support Desk</span>
            <span>&middot;</span>
            <span className="hover:text-white cursor-pointer">Status Live</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
