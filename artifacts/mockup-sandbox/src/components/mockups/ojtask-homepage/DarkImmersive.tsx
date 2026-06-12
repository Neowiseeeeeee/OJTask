import React from "react";
import { 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Users, 
  Building2, 
  GraduationCap, 
  KanbanSquare, 
  FileText, 
  MessageSquare,
  CalendarCheck,
  ChevronRight,
  Shield,
  Zap,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function DarkImmersive() {
  return (
    <div className="min-h-screen bg-[#030305] text-slate-200 selection:bg-violet-500/30 font-sans overflow-x-hidden">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute top-[40%] left-[50%] translate-x-[-50%] w-[80%] h-[20%] rounded-full bg-purple-500/5 blur-[100px]" />
        
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)]" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#030305]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.3)]">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">OJTask</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#roles" className="hover:text-white transition-colors">Roles</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5">
              Log in
            </Button>
            <Button className="bg-white text-black hover:bg-slate-200 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              Get Started Free
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="bg-violet-500/10 text-violet-300 border-violet-500/20 mb-8 px-4 py-1.5 backdrop-blur-sm">
            <span className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
              </span>
              OJTask v2.0 is now live
            </span>
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 max-w-4xl mx-auto leading-tight">
            Stop Coordinating Internships <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-500">Over Group Chats.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            The all-in-one OJT management platform for the Philippines. Connect students, supervisors, and coordinators in one secure, organized workspace.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Button size="lg" className="h-14 px-8 text-base bg-violet-600 hover:bg-violet-700 text-white shadow-[0_0_30px_rgba(139,92,246,0.3)] w-full sm:w-auto">
              Start Free Trial
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-base border-white/10 bg-white/5 hover:bg-white/10 text-white w-full sm:w-auto backdrop-blur-sm">
              Book a Demo
            </Button>
          </div>

          {/* Hero Image */}
          <div className="relative max-w-5xl mx-auto rounded-2xl border border-white/10 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] group">
            <div className="absolute inset-0 bg-gradient-to-t from-[#030305] via-transparent to-transparent z-10" />
            <img 
              src="/__mockup/images/hero-dark-immersive.png" 
              alt="Platform Dashboard Visualization" 
              className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
            />
            
            {/* Overlay Glass Elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-3/4 h-3/4 rounded-xl border border-white/5 bg-black/40 backdrop-blur-md shadow-2xl flex flex-col p-6 hidden md:flex">
              <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="grid grid-cols-3 gap-6 flex-1">
                <div className="col-span-1 border border-white/5 rounded-lg bg-white/5 p-4 space-y-4">
                  <div className="h-2 w-1/2 bg-white/20 rounded" />
                  <div className="h-8 w-full bg-violet-500/20 rounded border border-violet-500/30" />
                  <div className="h-8 w-full bg-white/5 rounded" />
                  <div className="h-8 w-full bg-white/5 rounded" />
                </div>
                <div className="col-span-2 border border-white/5 rounded-lg bg-white/5 p-4 flex flex-col gap-4">
                  <div className="h-32 w-full bg-gradient-to-br from-indigo-500/20 to-purple-500/5 rounded-lg border border-indigo-500/20" />
                  <div className="flex gap-4">
                    <div className="h-20 flex-1 bg-white/5 rounded-lg" />
                    <div className="h-20 flex-1 bg-white/5 rounded-lg" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 py-12 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/5">
            {[
              { label: "Active Students", value: "10,000+" },
              { label: "Partner Companies", value: "500+" },
              { label: "Universities", value: "50+" },
              { label: "Hours Logged", value: "1M+" }
            ].map((stat, i) => (
              <div key={i} className="text-center px-4">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-sm text-slate-500 font-medium uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section id="roles" className="relative z-10 py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">One Platform. <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">Three Perspectives.</span></h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">Designed specifically for the unique needs of everyone involved in the OJT process.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <GraduationCap className="w-8 h-8 text-violet-400" />,
                title: "For Students",
                desc: "Focus on learning, not paperwork. Log hours, submit requirements, and chat with supervisors seamlessly.",
                features: ["1-Tap Attendance", "Daily Scrum Logs", "Document Hub"]
              },
              {
                icon: <Building2 className="w-8 h-8 text-blue-400" />,
                title: "For Supervisors",
                desc: "Guide interns effectively without the overhead. Approve hours in bulk and assign tasks with ease.",
                features: ["Batch Approvals", "Kanban Task Board", "Performance Reviews"]
              },
              {
                icon: <Shield className="w-8 h-8 text-emerald-400" />,
                title: "For Coordinators",
                desc: "Get a bird's-eye view of your entire cohort. Track compliance, monitor progress, and intervene early.",
                features: ["Cohort Dashboard", "Compliance Tracking", "Automated Reports"]
              }
            ].map((role, i) => (
              <div key={i} className="group relative p-[1px] rounded-2xl overflow-hidden bg-gradient-to-b from-white/10 to-white/0 hover:from-violet-500/50 transition-colors duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative h-full bg-[#050508] p-8 rounded-2xl flex flex-col">
                  <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center mb-6 border border-white/5 group-hover:border-white/10 transition-colors">
                    {role.icon}
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-4">{role.title}</h3>
                  <p className="text-slate-400 mb-8 flex-1">{role.desc}</p>
                  <ul className="space-y-3">
                    {role.features.map((f, j) => (
                      <li key={j} className="flex items-center text-sm text-slate-300">
                        <CheckCircle2 className="w-4 h-4 mr-3 text-violet-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative z-10 py-32 px-6 bg-black/40 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Everything you need to <br/><span className="text-slate-500">run a modern OJT program.</span></h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Clock className="w-6 h-6" />,
                title: "Time Tracking",
                desc: "Precision time logging with geolocation support and supervisor sign-offs.",
                color: "from-blue-500/20 to-cyan-500/5",
                border: "group-hover:border-blue-500/50"
              },
              {
                icon: <MessageSquare className="w-6 h-6" />,
                title: "Daily Scrum",
                desc: "Quick, structured status check-ins to keep supervisors informed without meetings.",
                color: "from-violet-500/20 to-purple-500/5",
                border: "group-hover:border-violet-500/50"
              },
              {
                icon: <KanbanSquare className="w-6 h-6" />,
                title: "Task Board",
                desc: "Kanban-style task management to assign, track, and review intern deliverables.",
                color: "from-orange-500/20 to-red-500/5",
                border: "group-hover:border-orange-500/50"
              },
              {
                icon: <CalendarCheck className="w-6 h-6" />,
                title: "Smart Attendance",
                desc: "One-tap check-ins with automated flagging for absences and tardiness.",
                color: "from-emerald-500/20 to-green-500/5",
                border: "group-hover:border-emerald-500/50"
              },
              {
                icon: <FileText className="w-6 h-6" />,
                title: "Document Hub",
                desc: "Centralized storage for MOAs, endorsement letters, and final reports.",
                color: "from-pink-500/20 to-rose-500/5",
                border: "group-hover:border-pink-500/50"
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: "Team Chat",
                desc: "Contextual, channel-based communication specifically for your OJT cohort.",
                color: "from-indigo-500/20 to-blue-500/5",
                border: "group-hover:border-indigo-500/50"
              }
            ].map((feature, i) => (
              <div key={i} className={`group p-8 rounded-2xl bg-[#08080C] border border-white/5 transition-all duration-300 hover:bg-[#0A0A0F] ${feature.border}`}>
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 text-white border border-white/5`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="relative z-10 py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-center text-white mb-20">How it works</h2>
          
          <div className="space-y-12">
            {[
              { step: "01", title: "Setup Workspace", desc: "Schools create a cohort and invite partner companies to join the unified workspace." },
              { step: "02", title: "Onboard Interns", desc: "Students join via invite link, complete profiles, and sign necessary digital agreements." },
              { step: "03", title: "Track & Manage", desc: "Daily operations flow seamlessly: tasks are assigned, hours logged, and scrums submitted." },
              { step: "04", title: "Review & Graduate", desc: "Supervisors evaluate performance while coordinators generate final compliance reports." }
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-8 group">
                <div className="flex-shrink-0 text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white/20 to-white/5 group-hover:from-violet-400/50 transition-colors duration-500">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-lg text-slate-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-5xl mx-auto rounded-3xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-900/50 to-indigo-900/50 backdrop-blur-xl" />
          <div className="absolute inset-0 border border-white/10 rounded-3xl" />
          
          <div className="relative p-12 md:p-20 text-center flex flex-col items-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to upgrade your OJT program?</h2>
            <p className="text-xl text-violet-200 mb-10 max-w-2xl">Join hundreds of schools and companies standardizing their internship management with OJTask.</p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Button size="lg" className="h-14 px-10 text-base bg-white text-black hover:bg-slate-200 shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                Get Started Free
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-10 text-base border-white/20 text-white hover:bg-white/10">
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-6 border-t border-white/10 bg-[#020203]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-violet-500" />
            <span className="text-xl font-bold text-white">OJTask</span>
          </div>
          
          <div className="text-slate-500 text-sm">
            © {new Date().getFullYear()} OJTask. All rights reserved. Built for the Philippines.
          </div>
          
          <div className="flex gap-6 text-sm text-slate-400">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
