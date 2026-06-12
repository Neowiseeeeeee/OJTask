import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  Briefcase, Clock, ListTodo, Users, CalendarDays, FileText, MessageSquare,
  CheckCircle, ArrowRight, Zap, GraduationCap, Building2, BookOpen,
  Menu, X, BarChart3, ShieldCheck, Layers, Star, TrendingUp, Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const features = [
  {
    icon: Clock,
    title: "Time Tracking",
    desc: "Log daily OJT hours and get instant supervisor sign-off. No emails, no spreadsheets.",
    color: "from-violet-500 to-purple-600",
    glow: "shadow-violet-500/20",
    size: "large",
  },
  {
    icon: Users,
    title: "Daily Scrum",
    desc: "Structured two-minute check-ins replace long status meetings.",
    color: "from-indigo-500 to-blue-600",
    glow: "shadow-indigo-500/20",
    size: "small",
  },
  {
    icon: ListTodo,
    title: "Task Board",
    desc: "Kanban-style OJT task management built around how interns actually work.",
    color: "from-emerald-500 to-teal-600",
    glow: "shadow-emerald-500/20",
    size: "small",
  },
  {
    icon: CalendarDays,
    title: "Attendance",
    desc: "Real-time visibility for supervisors and coordinators.",
    color: "from-amber-500 to-orange-500",
    glow: "shadow-amber-500/20",
    size: "small",
  },
  {
    icon: FileText,
    title: "Document Hub",
    desc: "Secure central hub for MOAs, endorsement letters, and OJT reports.",
    color: "from-rose-500 to-pink-600",
    glow: "shadow-rose-500/20",
    size: "small",
  },
  {
    icon: MessageSquare,
    title: "Team Chat",
    desc: "Dedicated channels for work updates without flooding personal inboxes.",
    color: "from-cyan-500 to-sky-600",
    glow: "shadow-cyan-500/20",
    size: "large",
  },
];

const howItWorks = [
  { step: "01", title: "Create Your Space", desc: "Supervisors set up a workspace and share a unique join code. Ready in under two minutes.", icon: Layers },
  { step: "02", title: "Students Join", desc: "Interns join with the code and get instant access to all six modules. No training needed.", icon: GraduationCap },
  { step: "03", title: "Track Daily", desc: "Log hours, submit scrum reports, update task boards. Supervisors approve with one click.", icon: BarChart3 },
  { step: "04", title: "Close Out OJT", desc: "Coordinators access complete records, verify documents, finalize evaluations.", icon: ShieldCheck },
];

const roles = [
  {
    icon: GraduationCap,
    title: "Students",
    subtitle: "Interns managing daily internship tasks",
    accent: "from-violet-500 to-purple-600",
    border: "border-violet-500/20",
    bg: "bg-violet-500/5",
    items: ["Log daily OJT hours and tasks", "Submit structured daily scrum reports", "Record attendance instantly", "Upload required documents"],
  },
  {
    icon: Building2,
    title: "Company Supervisors",
    subtitle: "Overseeing intern performance",
    accent: "from-indigo-500 to-blue-600",
    border: "border-indigo-500/20",
    bg: "bg-indigo-500/5",
    items: ["Approve time logs and scrums", "Assign tasks and track progress", "Monitor attendance in real time", "Communicate via dedicated channels"],
  },
  {
    icon: BookOpen,
    title: "School Coordinators",
    subtitle: "Monitoring the full OJT program",
    accent: "from-emerald-500 to-teal-600",
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/5",
    items: ["View all student progress at a glance", "Monitor across multiple companies", "Review and approve documents", "Track attendance program-wide"],
  },
];

function HeroMockup() {
  return (
    <div className="relative w-full max-w-lg mx-auto lg:mx-0">
      {/* Glow behind mockup */}
      <div className="absolute inset-0 bg-violet-600/20 blur-[80px] rounded-full scale-75" />

      {/* Main card */}
      <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden shadow-2xl shadow-black/60">
        {/* Card header bar */}
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/8 bg-white/3">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
          <span className="ml-3 text-xs text-white/30 font-mono">ojtask.app/dashboard</span>
        </div>

        <div className="p-5 space-y-4">
          {/* Top stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Hours Logged", value: "142h", color: "text-violet-400", bar: "bg-violet-500" },
              { label: "Tasks Done", value: "38", color: "text-emerald-400", bar: "bg-emerald-500" },
              { label: "Days Left", value: "21", color: "text-amber-400", bar: "bg-amber-500" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl bg-white/5 border border-white/8 p-3">
                <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-[10px] text-white/40 mt-0.5">{stat.label}</div>
                <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
                  <div className={`h-full rounded-full ${stat.bar} opacity-70`} style={{ width: "65%" }} />
                </div>
              </div>
            ))}
          </div>

          {/* Task list */}
          <div className="rounded-xl bg-white/5 border border-white/8 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-white/60">Today's Tasks</span>
              <span className="text-[10px] text-violet-400 font-medium">3 pending</span>
            </div>
            <div className="space-y-2">
              {[
                { task: "Finish API integration", done: true, tag: "Dev" },
                { task: "Daily scrum report", done: true, tag: "Report" },
                { task: "Submit timesheet", done: false, tag: "Admin" },
              ].map((t, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${t.done ? "bg-emerald-500/20 border border-emerald-500/40" : "bg-white/5 border border-white/15"}`}>
                    {t.done && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                  </div>
                  <span className={`text-xs flex-1 ${t.done ? "text-white/30 line-through" : "text-white/70"}`}>{t.task}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/8 text-white/40">{t.tag}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Attendance row */}
          <div className="flex gap-3">
            <div className="flex-1 rounded-xl bg-white/5 border border-white/8 p-3">
              <div className="text-[10px] text-white/40 mb-1">Attendance</div>
              <div className="flex gap-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className={`flex-1 h-3 rounded-sm ${i < 8 ? "bg-violet-500/60" : "bg-white/10"}`} />
                ))}
              </div>
              <div className="text-[10px] text-white/40 mt-1">8 / 10 days</div>
            </div>
            <div className="flex-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <div className="text-[10px] text-emerald-400 font-semibold">Approved</div>
                <div className="text-[10px] text-white/40">by Supervisor</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating badge top-right */}
      <div className="absolute -top-4 -right-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0D1117] border border-white/15 shadow-xl shadow-black/40 backdrop-blur-xl">
        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-[11px] font-semibold text-white">+40% faster reporting</span>
      </div>

      {/* Floating badge bottom-left */}
      <div className="absolute -bottom-4 -left-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0D1117] border border-white/15 shadow-xl shadow-black/40 backdrop-blur-xl">
        <Award className="w-3.5 h-3.5 text-violet-400" />
        <span className="text-[11px] font-semibold text-white">3-click approvals</span>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [statsValues, setStatsValues] = useState({
    students: "...",
    companies: "...",
    schools: "...",
    satisfaction: "...",
  });

  useEffect(() => {
    let mounted = true;
    fetch("/api/landing/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!mounted || !data) return;
        setStatsValues({
          students: String(data.studentsOnboarded ?? "..."),
          companies: String(data.companiesUsingIt ?? "..."),
          schools: String(data.schoolsEnrolled ?? "..."),
          satisfaction: String(data.supervisorSatisfaction ?? "..."),
        });
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.title = "OJTask | OJT Management System for Students, Supervisors and Coordinators";
    return () => { document.title = "OJTask"; };
  }, []);

  return (
    <div className="min-h-screen text-white" style={{ background: "#080C16" }}>

      {/* Dot grid background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* ── NAVBAR ─────────────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-[#080C16]/80 backdrop-blur-xl border-b border-white/8" : "bg-transparent"
      }`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-lg text-white shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-700 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/40">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="tracking-tight">OJTask</span>
          </Link>

          <div className="flex-1" />

          <div className="hidden md:flex items-center gap-2">
            <Link href="/auth">
              <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/8 font-medium">
                Sign In
              </Button>
            </Link>
            <Link href="/auth">
              <Button size="sm" className="font-semibold bg-violet-600 hover:bg-violet-500 text-white border-0 shadow-lg shadow-violet-500/30 px-5" data-testid="link-nav-getstarted">
                Get Started
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/8 transition-colors"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-[#080C16]/95 backdrop-blur-xl border-t border-white/8 px-6 py-4 flex gap-3">
            <Link href="/auth" className="flex-1">
              <Button variant="outline" className="w-full border-white/15 text-white/80 bg-transparent hover:bg-white/8">Sign In</Button>
            </Link>
            <Link href="/auth" className="flex-1">
              <Button className="w-full bg-violet-600 hover:bg-violet-500 text-white border-0">Get Started</Button>
            </Link>
          </div>
        )}
      </nav>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Radial glow top-left */}
        <div className="absolute top-0 left-1/4 w-[800px] h-[600px] rounded-full bg-violet-600/8 blur-[120px] pointer-events-none -translate-x-1/2" />
        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] rounded-full bg-indigo-600/6 blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left copy */}
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm font-medium mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                Built for OJT in the Philippines
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-[4rem] font-extrabold tracking-tight leading-[1.06] mb-6">
                Your Internship,{" "}
                <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                  Finally Organized
                </span>
              </h1>

              <p className="text-lg text-white/50 leading-relaxed mb-10 max-w-xl">
                OJTask brings students, supervisors, and school coordinators into one shared OJT workspace — so daily reports, time logs, and document submissions happen without the constant back-and-forth.
              </p>

              <div className="flex flex-col sm:flex-row gap-3.5 mb-10">
                <Link href="/auth">
                  <Button
                    size="lg"
                    className="font-bold px-8 h-12 bg-violet-600 hover:bg-violet-500 text-white border-0 shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50 transition-all hover:-translate-y-0.5"
                    data-testid="button-hero-getstarted"
                  >
                    Try It Free
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button
                    size="lg"
                    variant="outline"
                    className="font-semibold px-8 h-12 border-white/15 text-white/70 bg-transparent hover:bg-white/8 hover:text-white hover:border-white/25"
                    data-testid="button-hero-signin"
                  >
                    Sign In to Your Space
                  </Button>
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="flex items-center gap-5 text-sm text-white/35">
                <div className="flex items-center gap-1.5">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span>Loved by students</span>
                </div>
                <div className="w-px h-4 bg-white/15" />
                <span>No credit card needed</span>
                <div className="w-px h-4 bg-white/15" />
                <span>Free to start</span>
              </div>
            </div>

            {/* Right — product mockup */}
            <div className="relative flex justify-center lg:justify-end">
              <HeroMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ────────────────────────────────────── */}
      <section className="border-y border-white/6 bg-white/2 backdrop-blur-sm py-12 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: statsValues.students, label: "Students Onboarded" },
            { value: statsValues.companies, label: "Companies Using It" },
            { value: statsValues.schools, label: "Schools Enrolled" },
            { value: statsValues.satisfaction, label: "Supervisor Satisfaction" },
          ].map((s) => (
            <div key={s.label} className="text-center" data-testid={`stat-${s.label.toLowerCase().replace(/\s+/g, '-')}`}>
              <div className="text-4xl font-extrabold bg-gradient-to-r from-violet-400 to-purple-300 bg-clip-text text-transparent mb-1.5">
                {s.value}
              </div>
              <div className="text-sm text-white/40 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHO IS IT FOR ──────────────────────────────────── */}
      <section className="py-28 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-900/3 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/50 text-xs font-semibold uppercase tracking-widest mb-5">
              Who Uses OJTask
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-5">
              One Platform.{" "}
              <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Everyone Covered.</span>
            </h2>
            <p className="text-white/40 text-lg max-w-xl mx-auto">Students, supervisors, and coordinators each get a tailored view with exactly the tools they need.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {roles.map((role) => (
              <div
                key={role.title}
                className={`rounded-2xl border ${role.border} ${role.bg} p-7 backdrop-blur-sm hover:bg-white/5 transition-all duration-300 group`}
                data-testid={`card-role-${role.title.split(' ')[0].toLowerCase()}`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${role.accent} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                  <role.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-1 text-white">{role.title}</h3>
                <p className="text-sm text-white/40 mb-6">{role.subtitle}</p>
                <ul className="space-y-3">
                  {role.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES (BENTO GRID) ───────────────────────────── */}
      <section id="features" className="py-28 px-6 border-t border-white/6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/50 text-xs font-semibold uppercase tracking-widest mb-5">
              Six Core Modules
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-5">
              Everything Your OJT{" "}
              <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Program Needs</span>
            </h2>
            <p className="text-white/40 text-lg max-w-xl mx-auto">Six focused modules that cover the complete internship workflow. No bloat, just tools that work.</p>
          </div>

          {/* Bento grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Large feature — Time Tracking */}
            <div
              className="lg:col-span-2 group rounded-2xl border border-white/8 bg-white/3 hover:bg-white/5 hover:border-violet-500/30 p-7 transition-all duration-300 backdrop-blur-sm"
              data-testid="card-feature-time-tracking"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30 shrink-0 group-hover:scale-110 transition-transform">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Time Tracking</h3>
                  <p className="text-sm text-white/45 leading-relaxed">Accurately log your daily OJT hours and get instant supervisor sign-off. No emails, no spreadsheets, no delays. Every hour is verifiable and audit-ready.</p>
                </div>
              </div>
              {/* Mini bar chart decoration */}
              <div className="mt-4 flex items-end gap-1.5 h-10 px-1">
                {[6,8,5,9,7,10,8,6,9,7,8,10].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-gradient-to-t from-violet-600/60 to-violet-400/30"
                    style={{ height: `${h * 10}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Small features */}
            {features.slice(1, 5).map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-white/8 bg-white/3 hover:bg-white/5 p-6 transition-all duration-300 backdrop-blur-sm hover:border-white/15"
                data-testid={`card-feature-${f.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base font-bold text-white mb-1.5">{f.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
              </div>
            ))}

            {/* Large feature — Team Chat */}
            <div
              className="lg:col-span-2 group rounded-2xl border border-white/8 bg-white/3 hover:bg-white/5 hover:border-cyan-500/30 p-7 transition-all duration-300 backdrop-blur-sm"
              data-testid="card-feature-team-chat"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-sky-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 shrink-0 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Team Chat</h3>
                  <p className="text-sm text-white/45 leading-relaxed">Communicate in dedicated channels for work updates and team discussions, without flooding anyone's personal inbox. Real-time messaging with file sharing built in.</p>
                </div>
              </div>
              {/* Simulated chat bubbles */}
              <div className="mt-5 space-y-2">
                {[
                  { name: "Supervisor", msg: "Great progress on the API module!", align: "left", color: "bg-white/8" },
                  { name: "You", msg: "Thanks! Submitting time log now 👍", align: "right", color: "bg-cyan-500/20" },
                ].map((m, i) => (
                  <div key={i} className={`flex ${m.align === "right" ? "justify-end" : "justify-start"}`}>
                    <div className={`${m.color} border border-white/8 rounded-2xl px-3.5 py-2 max-w-xs`}>
                      <div className="text-[10px] text-white/30 mb-0.5">{m.name}</div>
                      <div className="text-xs text-white/70">{m.msg}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────── */}
      <section id="how-it-works" className="py-28 px-6 border-t border-white/6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/50 text-xs font-semibold uppercase tracking-widest mb-5">
              Getting Started
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-5">
              Up and Running in{" "}
              <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Five Minutes</span>
            </h2>
            <p className="text-white/40 text-lg max-w-xl mx-auto">No IT setup. No lengthy onboarding. Just create your space and start tracking.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {howItWorks.map((step, i) => (
              <div
                key={step.step}
                className="relative group rounded-2xl border border-white/8 bg-white/3 hover:bg-white/5 p-6 transition-all duration-300 backdrop-blur-sm"
                data-testid={`card-step-${step.step}`}
              >
                {/* Step number as watermark */}
                <div className="absolute top-4 right-5 text-6xl font-black text-white/4 select-none leading-none">{step.step}</div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-5 shadow-lg shadow-violet-500/30 group-hover:scale-110 transition-transform">
                  <step.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{step.desc}</p>
                {i < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute -right-2.5 top-1/2 -translate-y-1/2 z-10">
                    <ArrowRight className="w-5 h-5 text-white/20" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="py-28 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative rounded-3xl overflow-hidden p-[1px]" style={{
            background: "linear-gradient(135deg, rgba(124,58,237,0.6), rgba(99,102,241,0.2), rgba(124,58,237,0.05))"
          }}>
            <div className="relative rounded-3xl bg-gradient-to-br from-[#0F0A1E] to-[#0A0C1A] p-14">
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-violet-600/15 rounded-full blur-[60px] pointer-events-none" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-semibold uppercase tracking-widest mb-6">
                  Start for Free
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-5 tracking-tight leading-tight">
                  Your OJT Program Deserves Better Than Group Chats
                </h2>
                <p className="text-white/45 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
                  Give interns a dedicated space to log their work and give supervisors real-time visibility — zero follow-up required.
                </p>
                <Link href="/auth">
                  <Button
                    size="lg"
                    className="font-bold px-10 h-12 bg-violet-600 hover:bg-violet-500 text-white border-0 shadow-2xl shadow-violet-500/40 hover:shadow-violet-500/60 transition-all hover:-translate-y-0.5"
                    data-testid="button-cta-getstarted"
                  >
                    Get Started Free
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <p className="mt-5 text-sm text-white/25">No credit card needed · Set up in under 5 minutes</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="border-t border-white/6 bg-[#05080F]">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <Link href="/" className="flex items-center gap-2 font-bold text-lg text-white mb-4">
                <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-purple-700 rounded-md flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-white" />
                </div>
                OJTask
              </Link>
              <p className="text-sm text-white/30 leading-relaxed">The OJT management system built for Philippine schools and companies.</p>
            </div>

            {/* Links */}
            {[
              {
                title: "Product",
                links: ["Time Tracking", "Daily Scrum", "Task Board", "Documents"],
              },
              {
                title: "For",
                links: ["Students", "Supervisors", "Coordinators", "Schools"],
              },
              {
                title: "Account",
                links: ["Sign In", "Get Started", "Forgot Password"],
              },
            ].map((col) => (
              <div key={col.title}>
                <div className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-4">{col.title}</div>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link}>
                      <Link href="/auth" className="text-sm text-white/45 hover:text-white transition-colors">{link}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-white/6 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/25">© {new Date().getFullYear()} OJTask. All rights reserved.</p>
            <p className="text-sm text-white/25">Built for OJT students and supervisors in the Philippines.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
