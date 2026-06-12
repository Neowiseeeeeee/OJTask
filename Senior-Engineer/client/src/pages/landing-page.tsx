import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  Briefcase, Clock, ListTodo, Users, CalendarDays, FileText, MessageSquare,
  CheckCircle, ArrowRight, Zap, GraduationCap, Building2, BookOpen,
  Sun, Moon, Menu, X, BarChart3, ShieldCheck, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/theme-provider";

const features = [
  {
    icon: Clock,
    title: "Time Tracking",
    desc: "Accurately log your daily OJT hours and get instant supervisor sign-off. No emails, no spreadsheets, no delays.",
    gradient: "from-violet-500 to-purple-600",
    light: "bg-violet-50 dark:bg-violet-950/40",
    text: "text-violet-600 dark:text-violet-400",
  },
  {
    icon: Users,
    title: "Daily Scrum",
    desc: "A two-minute structured check-in replaces long status meetings. Share yesterday's progress, today's goals, and blockers in seconds.",
    gradient: "from-indigo-500 to-blue-600",
    light: "bg-indigo-50 dark:bg-indigo-950/40",
    text: "text-indigo-600 dark:text-indigo-400",
  },
  {
    icon: ListTodo,
    title: "Task Board",
    desc: "Kanban-style OJT task management built around how interns actually work. Simple, visual, and fast to use from day one.",
    gradient: "from-emerald-500 to-teal-600",
    light: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: CalendarDays,
    title: "Attendance",
    desc: "Log your internship attendance in seconds with a single tap. Supervisors and school coordinators get real-time visibility, always.",
    gradient: "from-amber-500 to-orange-500",
    light: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-600 dark:text-amber-400",
  },
  {
    icon: FileText,
    title: "Document Hub",
    desc: "Upload endorsement letters, MOAs, and OJT progress reports in one secure hub. Organized and ready for review anytime.",
    gradient: "from-rose-500 to-pink-600",
    light: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-600 dark:text-rose-400",
  },
  {
    icon: MessageSquare,
    title: "Team Chat",
    desc: "Communicate in dedicated channels for work updates and team discussions, without flooding anyone's personal inbox.",
    gradient: "from-cyan-500 to-sky-600",
    light: "bg-cyan-50 dark:bg-cyan-950/40",
    text: "text-cyan-600 dark:text-cyan-400",
  },
];

const stats = [
  { value: "—", label: "Students Onboarded" },
  { value: "—", label: "Companies Using It" },
  { value: "—", label: "Schools Enrolled" },
  { value: "—", label: "Supervisor Satisfaction" },
];




const howItWorks = [
  { step: "01", title: "Create Your Space", desc: "Supervisors set up a dedicated OJT workspace and share a unique join code with their interns. Ready in under two minutes.", icon: Layers },
  { step: "02", title: "Students Join and Set Up", desc: "Interns join using the code, choose their role, and get instant access to all six modules. No training or setup required.", icon: GraduationCap },
  { step: "03", title: "Track and Report Daily", desc: "Students log hours, submit daily scrum reports, and update their task boards. Supervisors approve everything with a single click.", icon: BarChart3 },
  { step: "04", title: "Review and Close Out", desc: "Coordinators access complete records, verify documents, and finalize OJT evaluations without chasing anyone for updates.", icon: ShieldCheck },
];

export default function LandingPage() {
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const [statsValues, setStatsValues] = useState<Record<string, string>>({
    "Students Onboarded": "—",
    "Companies Using It": "—",
    "Schools Enrolled": "—",
    "Supervisor Satisfaction": "—",
  });

  useEffect(() => {
    let mounted = true;
    fetch("/api/landing/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!mounted || !data) return;
        setStatsValues({
          "Students Onboarded": String(data.studentsOnboarded ?? "—"),
          "Companies Using It": String(data.companiesUsingIt ?? "—"),
          "Schools Enrolled": String(data.schoolsEnrolled ?? "—"),
          "Supervisor Satisfaction": String(data.supervisorSatisfaction ?? "—"),
        });
      })
      .catch(() => {
        // keep placeholders
      });
    return () => {
      mounted = false;
    };
  }, []);


  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.title = "OJTask | OJT Management System for Students, Supervisors and Coordinators";
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) { el = document.createElement("meta"); (el as HTMLMetaElement).name = name; document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    const setOg = (prop: string, content: string) => {
      let el = document.querySelector(`meta[property="${prop}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute("property", prop); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("description", "OJTask is an OJT management system built for Philippine schools and companies. Track internship hours, attendance, daily scrums, tasks, and documents in one shared workspace for students, supervisors, and school coordinators.");
    setMeta("keywords", "OJT management system, internship management software, on-the-job training tracker, OJT platform Philippines, student internship tracker, daily scrum for interns, OJT attendance monitoring, internship document hub");
    setOg("og:title", "OJTask | OJT Management System for Students, Supervisors and Coordinators");
    setOg("og:description", "Manage your entire OJT program in one place. Track hours, attendance, tasks, and daily reports without the back-and-forth. Built for Philippine schools and companies.");
    setOg("og:type", "website");
    return () => { document.title = "OJTask"; };
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0d0f1a] text-foreground">

      {/* ── NAVBAR ─────────────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/80 dark:bg-[#0d0f1a]/80 backdrop-blur-xl border-b border-black/8 dark:border-white/8 shadow-sm"
          : "bg-transparent"
      }`}>
        <div className="flex justify-center px-5 h-16">
          <div className="w-full max-w-7xl flex items-center gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 font-display font-bold text-lg text-foreground shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-purple-700 rounded-lg flex items-center justify-center shadow-sm shadow-violet-500/30">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span>OJTask</span>
          </Link>

          <div className="flex-1" />

          {/* Desktop nav links removed (landing page is minimal) */}
          <div className="flex-0" />


          <div className="flex-1" />

          {/* Controls */}
          <div className="flex items-center gap-2">
            <Link href="/auth" className="hidden md:block">
              <Button variant="ghost" size="sm" className="font-medium text-muted-foreground hover:text-foreground" data-testid="link-nav-signin">
                Sign In
              </Button>
            </Link>
            <Link href="/auth" className="hidden md:block">
              <Button
                size="sm"
                className="font-semibold bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-sm shadow-violet-500/30 border-0"
                data-testid="link-nav-getstarted"
              >
                Get Started
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        </div>

          {/* Mobile menu (minimal) */}
        {menuOpen && (
          <div className="md:hidden bg-white dark:bg-[#0d0f1a] border-t border-border/50 px-5 py-4 flex flex-col gap-3">
            <div className="flex gap-2 pt-2 border-t border-border/50">

              <Link href="/auth" className="flex-1">
                <Button variant="outline" className="w-full text-sm">Sign In</Button>
              </Link>
              <Link href="/auth" className="flex-1">
                <Button className="w-full text-sm bg-gradient-to-r from-violet-600 to-purple-600 text-white border-0">Get Started</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-36 pb-28 px-5">
        {/* Background blobs */}
        <div className="absolute -top-32 -right-40 w-[600px] h-[600px] rounded-full bg-violet-500/10 dark:bg-violet-500/5 blur-[100px] pointer-events-none" />
        <div className="absolute top-40 -left-32 w-[400px] h-[400px] rounded-full bg-amber-400/10 dark:bg-amber-400/5 blur-[80px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-200 dark:border-violet-800/50 bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 text-sm font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
            The OJT Management System Built for the Philippines
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-[4.5rem] font-display font-extrabold tracking-tight leading-[1.08] mb-6 text-slate-900 dark:text-white">
            Your Internship,{" "}
            <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-500 bg-clip-text text-transparent dark:from-violet-400 dark:via-purple-400 dark:to-indigo-300">
              Finally Organized
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            OJTask brings students, supervisors, and school coordinators into one shared OJT workspace, so daily reports, time logs, and document submissions happen without the constant back-and-forth.
          </p>

          <div className="flex flex-col sm:flex-row gap-3.5 justify-center">
            <Link href="/auth">
              <Button
                size="lg"
                className="font-bold text-base px-8 h-12 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/30 border-0 transition-all hover:shadow-xl hover:shadow-violet-500/40"
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
                className="font-semibold text-base px-8 h-12 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                data-testid="button-hero-signin"
              >
                Sign In to Your Space
              </Button>
            </Link>
          </div>

          <p className="mt-5 text-xs text-muted-foreground">
            Designed for OJT supervisors and students. Log in and create your space today.
          </p>

        </div>
      </section>

      {/* ── STATS STRIP ────────────────────────────────────── */}
      <section className="border-y border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 py-10">
        <div className="max-w-5xl mx-auto px-5 grid grid-cols-2 md:grid-cols-4 gap-6">
{stats.map((s) => (
            <div key={s.label} className="text-center" data-testid={`stat-${s.label.toLowerCase().replace(/\s+/g, '-')}`}>
              <div className="text-3xl md:text-4xl font-display font-extrabold bg-gradient-to-r from-violet-600 to-purple-500 bg-clip-text text-transparent dark:from-violet-400 dark:to-purple-300 mb-1">
                {statsValues[s.label] ?? s.value}
              </div>
              <div className="text-sm text-muted-foreground font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHO IS IT FOR ──────────────────────────────────── */}
      <section className="py-24 px-5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/40">Who Uses OJTask</Badge>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4 text-slate-900 dark:text-white">One OJT Platform Built for Everyone Involved</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">Students, supervisors, and school coordinators each get a tailored view with exactly the tools they need.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: GraduationCap,
                title: "Students",
                subtitle: "OJT students managing their daily internship tasks",
                bg: "bg-violet-50 dark:bg-violet-950/30",
                border: "border-violet-100 dark:border-violet-900/50",
                iconBg: "bg-violet-100 dark:bg-violet-900/50",
                iconColor: "text-violet-600 dark:text-violet-400",
                items: ["Log daily OJT hours and tasks", "Submit structured daily scrum reports", "Record attendance status instantly", "Upload required internship documents"]
              },
              {
                icon: Building2,
                title: "Company Supervisors",
                subtitle: "Company supervisors overseeing intern performance",
                bg: "bg-indigo-50 dark:bg-indigo-950/30",
                border: "border-indigo-100 dark:border-indigo-900/50",
                iconBg: "bg-indigo-100 dark:bg-indigo-900/50",
                iconColor: "text-indigo-600 dark:text-indigo-400",
                items: ["Approve intern time logs and scrums", "Assign tasks and track progress", "Monitor intern attendance in real time", "Communicate via dedicated team channels"]
              },
              {
                icon: BookOpen,
                title: "School Coordinators",
                subtitle: "School coordinators monitoring the full OJT program",
                bg: "bg-emerald-50 dark:bg-emerald-950/30",
                border: "border-emerald-100 dark:border-emerald-900/50",
                iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
                iconColor: "text-emerald-600 dark:text-emerald-400",
                items: ["View all student progress at a glance", "Monitor interns across multiple companies", "Review and approve submitted documents", "Track attendance across the entire program"]
              },
            ].map((role) => (
              <div
                key={role.title}
                className={`rounded-2xl border ${role.border} ${role.bg} p-7 hover:shadow-md transition-shadow`}
                data-testid={`card-role-${role.title.split(' ')[0].toLowerCase()}`}
              >
                <div className={`w-12 h-12 ${role.iconBg} rounded-xl flex items-center justify-center mb-4`}>
                  <role.icon className={`w-6 h-6 ${role.iconColor}`} />
                </div>
                <h3 className="text-lg font-display font-bold mb-0.5 text-slate-900 dark:text-white">{role.title}</h3>
                <p className="text-sm text-muted-foreground mb-5">{role.subtitle}</p>
                <ul className="space-y-2.5">
                  {role.items.map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────── */}
      <section id="features" className="py-24 px-5 bg-slate-50/60 dark:bg-slate-900/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/40">Six Core Modules</Badge>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4 text-slate-900 dark:text-white">Everything Your OJT Program Needs in One Place</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">Six focused modules that cover the complete internship workflow. No bloat, no steep learning curve, just tools that work.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="group p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/50 bg-white dark:bg-slate-900/60 hover:shadow-lg hover:border-violet-200 dark:hover:border-violet-800/50 transition-all duration-200"
                data-testid={`card-feature-${f.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className={`w-11 h-11 ${f.light} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <f.icon className={`w-5 h-5 ${f.text}`} />
                </div>
                <h3 className="text-base font-semibold mb-2 text-slate-900 dark:text-white">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/40">Getting Started</Badge>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4 text-slate-900 dark:text-white">Up and Running in Under Five Minutes</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">No IT setup required. No lengthy onboarding sessions. Just create your space and start tracking.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {howItWorks.map((step, i) => (
              <div
                key={step.step}
                className="relative bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/50 p-6 shadow-sm hover:shadow-md transition-shadow"
                data-testid={`card-step-${step.step}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm shadow-violet-500/30">
                    <step.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-4xl font-display font-extrabold text-slate-100 dark:text-slate-800 select-none">{step.step}</span>
                </div>
                <h3 className="font-display font-semibold text-slate-900 dark:text-white mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                {i < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                    <ArrowRight className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="py-28 px-5">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-14 shadow-2xl shadow-violet-500/30">
            {/* Decorative blobs inside CTA */}
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-indigo-400/20 blur-2xl pointer-events-none" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-display font-extrabold text-white mb-5 leading-tight">
                Your OJT Program Deserves Better Than Group Chats
              </h2>
              <p className="text-violet-200 text-lg mb-10 max-w-xl mx-auto">
                Give interns a dedicated space to log their work and give supervisors real-time visibility that needs zero follow-up.
              </p>
              <Link href="/auth">
                <Button
                  size="lg"
                  className="font-bold text-base px-10 h-12 bg-white text-violet-700 hover:bg-violet-50 shadow-xl transition-all hover:-translate-y-0.5 hover:shadow-2xl border-0"
                  data-testid="button-cta-getstarted"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <p className="mt-5 text-sm text-violet-300">No credit card needed · Set up in under 5 minutes</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0b14]">
        <div className="max-w-7xl mx-auto px-5 py-14 grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Brand col */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-display font-bold text-lg text-foreground mb-4">
              <div className="w-7 h-7 bg-gradient-to-br from-violet-600 to-purple-700 rounded-md flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              OJTask
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              The OJT management platform built for Philippine schools and companies. Reduce paperwork, boost visibility, and keep every internship on track.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Product</h4>
            <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
              <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:text-foreground transition-colors">Features</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:text-foreground transition-colors">How It Works</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:text-foreground transition-colors">Testimonials</a></li>

            </ul>
          </div>

          {/* Modules */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Modules</h4>
            <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
              <li><span>Time Tracking</span></li>
              <li><span>Daily Scrum</span></li>
              <li><span>Task Board</span></li>
              <li><span>Attendance</span></li>
              <li><span>Documents</span></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Account</h4>
            <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
              <li><Link href="/auth" className="hover:text-foreground transition-colors" data-testid="link-footer-signin">Sign In</Link></li>
              <li><Link href="/auth" className="hover:text-foreground transition-colors" data-testid="link-footer-register">Create Account</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-5 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <div>
              <span>© {new Date().getFullYear()} OJTask. All rights reserved.</span>
            </div>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center gap-2"
              aria-label="Toggle dark mode"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span className="text-xs hidden sm:inline">{theme === "dark" ? "Light" : "Dark"}</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
