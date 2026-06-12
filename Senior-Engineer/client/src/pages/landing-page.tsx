import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  Clock, ListTodo, Users, CalendarDays, FileText, MessageSquare,
  CheckCircle, ArrowRight, Zap, GraduationCap, Building2, BookOpen,
  Menu, X, BarChart3, ShieldCheck, Layers, Sun, Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

// ── Marquee ────────────────────────────────────────────────────────────────
const marqueeItems = [
  "Time Tracking", "Daily Scrum", "Task Board", "Attendance Logs",
  "Document Hub", "Team Chat", "Supervisor Approvals", "OJT Hours",
  "Evaluation Reports", "Student Progress", "Space Management", "Real-Time Updates",
];

function MarqueeStrip({ reverse = false }: { reverse?: boolean }) {
  const doubled = [...marqueeItems, ...marqueeItems];
  return (
    <div className="overflow-hidden py-3 select-none">
      <div className={`flex gap-0 w-max ${reverse ? "animate-marquee-reverse" : "animate-marquee"}`} style={{ willChange: "transform" }}>
        {doubled.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-4 px-6 text-lg font-semibold text-white/80 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-white/40 inline-block shrink-0" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Data ───────────────────────────────────────────────────────────────────
const features = [
  { icon: Clock,         title: "Time Tracking",  desc: "Log OJT hours daily and get instant supervisor sign-off. Zero spreadsheets.",              lightColor: "bg-violet-100 text-violet-600", darkColor: "bg-violet-900/40 text-violet-300" },
  { icon: Users,         title: "Daily Scrum",     desc: "Two-minute structured check-ins that replace long status meetings for good.",               lightColor: "bg-indigo-100 text-indigo-600", darkColor: "bg-indigo-900/40 text-indigo-300" },
  { icon: ListTodo,      title: "Task Board",      desc: "Kanban-style task management built around how interns actually work.",                       lightColor: "bg-emerald-100 text-emerald-600", darkColor: "bg-emerald-900/40 text-emerald-300" },
  { icon: CalendarDays,  title: "Attendance",      desc: "Real-time visibility for supervisors and coordinators with one tap.",                        lightColor: "bg-amber-100 text-amber-600", darkColor: "bg-amber-900/40 text-amber-300" },
  { icon: FileText,      title: "Document Hub",    desc: "Upload MOAs, endorsement letters, and reports in one secure place.",                        lightColor: "bg-rose-100 text-rose-600", darkColor: "bg-rose-900/40 text-rose-300" },
  { icon: MessageSquare, title: "Team Chat",       desc: "Dedicated channels for work updates without flooding personal inboxes.",                    lightColor: "bg-cyan-100 text-cyan-600", darkColor: "bg-cyan-900/40 text-cyan-300" },
];

const roles = [
  {
    icon: GraduationCap, title: "Students",
    subtitle: "Everything you need to get through OJT without the stress.",
    accent: "bg-violet-600",
    lightBg: "bg-violet-50", darkBg: "dark:bg-violet-950/40",
    lightRing: "ring-violet-200", darkRing: "dark:ring-violet-800/50",
    items: ["Log daily OJT hours and tasks", "Submit structured daily scrum reports", "Record attendance instantly", "Upload required internship documents"],
  },
  {
    icon: Building2, title: "Company Supervisors",
    subtitle: "Stay on top of every intern without the constant follow-ups.",
    accent: "bg-indigo-600",
    lightBg: "bg-indigo-50", darkBg: "dark:bg-indigo-950/40",
    lightRing: "ring-indigo-200", darkRing: "dark:ring-indigo-800/50",
    items: ["Approve time logs and scrums in one click", "Assign tasks and track progress visually", "Monitor attendance in real time", "Communicate via dedicated team channels"],
  },
  {
    icon: BookOpen, title: "School Coordinators",
    subtitle: "Full program visibility without chasing anyone for updates.",
    accent: "bg-emerald-600",
    lightBg: "bg-emerald-50", darkBg: "dark:bg-emerald-950/40",
    lightRing: "ring-emerald-200", darkRing: "dark:ring-emerald-800/50",
    items: ["View all student progress at a glance", "Monitor interns across multiple companies", "Review and approve submitted documents", "Track attendance program-wide"],
  },
];

const steps = [
  { step: "01", title: "Create Your Space",   desc: "Supervisors set up a workspace and share a unique join code. Ready in under two minutes.", icon: Layers },
  { step: "02", title: "Students Join",        desc: "Interns join with the code and get instant access to all six modules. No training needed.", icon: GraduationCap },
  { step: "03", title: "Track Daily",          desc: "Log hours, submit scrum reports, update task boards. Supervisors approve with one click.", icon: BarChart3 },
  { step: "04", title: "Close Out",            desc: "Coordinators access complete records, verify documents, and finalize evaluations.", icon: ShieldCheck },
];

// ── Component ──────────────────────────────────────────────────────────────
export default function LandingPage() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [statsValues, setStatsValues] = useState({ students: "...", companies: "...", schools: "...", satisfaction: "..." });

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

  // Gradient helpers — switch based on theme
  const heroGradient    = isDark ? "linear-gradient(160deg, #1e1b4b 0%, #2e1065 40%, #1e1b4b 100%)" : "linear-gradient(160deg, #f5f3ff 0%, #ede9fe 40%, #ddd6fe 100%)";
  const rolesGradient   = isDark ? "linear-gradient(175deg, #0f0a1e 0%, #150d2e 100%)"              : "linear-gradient(175deg, #fafafa 0%, #f5f3ff 100%)";
  const stepsGradient   = isDark ? "linear-gradient(175deg, #0f0a1e 0%, #1e1b4b 100%)"              : "linear-gradient(175deg, #f5f3ff 0%, #ede9fe 100%)";

  return (
    <div className="min-h-screen bg-white dark:bg-[#0d0f1a] text-slate-900 dark:text-white overflow-x-hidden transition-colors duration-300">

      {/* ── NAVBAR ──────────────────────────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 dark:bg-[#0d0f1a]/90 backdrop-blur-xl shadow-sm dark:shadow-black/40 border-b border-transparent dark:border-white/8"
          : "bg-transparent"
      }`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 font-black text-xl tracking-tight text-slate-900 dark:text-white shrink-0">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center shadow-md shadow-violet-500/30">
              <Zap className="w-4 h-4 text-white" />
            </div>
            OJTask
          </Link>

          <div className="flex-1" />

          <div className="hidden md:flex items-center gap-2">
            <Link href="/auth">
              <Button variant="ghost" size="sm" className="font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10" data-testid="link-nav-signin">
                Sign In
              </Button>
            </Link>
            <Link href="/auth">
              <Button size="sm" className="font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-full px-5 shadow-md shadow-violet-500/25" data-testid="link-nav-getstarted">
                Get Started <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-white dark:bg-[#0d0f1a] border-t border-slate-100 dark:border-white/8 px-6 py-4 flex gap-3">
            <Link href="/auth" className="flex-1">
              <Button variant="outline" className="w-full rounded-full dark:border-white/20 dark:text-white dark:bg-transparent dark:hover:bg-white/10">Sign In</Button>
            </Link>
            <Link href="/auth" className="flex-1">
              <Button className="w-full rounded-full bg-violet-600 hover:bg-violet-700 text-white">Get Started</Button>
            </Link>
          </div>
        )}
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section
        className="relative pt-36 pb-32 px-6 text-center overflow-hidden transition-colors duration-300"
        style={{ background: heroGradient }}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-violet-400/20 dark:bg-violet-600/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-indigo-400/15 dark:bg-indigo-600/10 blur-[80px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 dark:bg-white/10 backdrop-blur-sm border border-violet-200 dark:border-violet-700/50 text-violet-700 dark:text-violet-300 text-sm font-semibold mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
            Built for OJT in the Philippines 🇵🇭
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.04] mb-7 text-slate-900 dark:text-white">
            Your Internship,{" "}
            <span className="text-violet-600 dark:text-violet-400">Finally Organized</span>
          </h1>

          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            OJTask brings students, supervisors, and school coordinators into one shared workspace — daily reports, time logs, and documents handled without the back-and-forth.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/auth">
              <Button size="lg" className="font-black text-base px-8 h-14 rounded-full bg-violet-600 hover:bg-violet-700 text-white shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50 hover:-translate-y-0.5 transition-all" data-testid="button-hero-getstarted">
                Try OJTask for free
              </Button>
            </Link>
            <Link href="/auth">
              <Button size="lg" variant="outline" className="font-bold text-base px-8 h-14 rounded-full border-2 border-slate-300 dark:border-white/20 text-slate-700 dark:text-white hover:bg-white dark:hover:bg-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-sm" data-testid="button-hero-signin">
                Sign In to Your Space
              </Button>
            </Link>
          </div>

          <p className="text-sm text-slate-500 dark:text-slate-400">
            No credit card needed · Set up in under 5 minutes · Free to start
          </p>
        </div>
      </section>

      {/* ── MARQUEE ───────────────────────────────────────────────────────── */}
      <section className="py-2 overflow-hidden" style={{ background: "linear-gradient(90deg, #7c3aed, #6d28d9, #5b21b6)" }}>
        <MarqueeStrip />
        <MarqueeStrip reverse />
      </section>

      {/* ── STATS ─────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white dark:bg-[#0d0f1a]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: statsValues.students,    label: "Students Onboarded" },
            { value: statsValues.companies,   label: "Companies Using It" },
            { value: statsValues.schools,     label: "Schools Enrolled" },
            { value: statsValues.satisfaction, label: "Supervisor Satisfaction" },
          ].map((s) => (
            <div key={s.label} data-testid={`stat-${s.label.toLowerCase().replace(/\s+/g, '-')}`}>
              <div className="text-4xl md:text-5xl font-black text-violet-600 dark:text-violet-400 mb-2">{s.value}</div>
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHO IS IT FOR ─────────────────────────────────────────────────── */}
      <section className="py-28 px-6 transition-colors duration-300" style={{ background: rolesGradient }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-violet-600 dark:text-violet-400 font-bold text-sm uppercase tracking-widest mb-4">Who Uses OJTask</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-5 text-slate-900 dark:text-white">
              One Platform Built for{" "}<span className="text-violet-600 dark:text-violet-400">Everyone Involved</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xl max-w-xl mx-auto leading-relaxed">
              Students, supervisors, and coordinators each get a tailored view with exactly the tools they need.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {roles.map((role) => (
              <div
                key={role.title}
                className={`rounded-3xl ${role.lightBg} ${role.darkBg} ring-1 ${role.lightRing} ${role.darkRing} p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}
                data-testid={`card-role-${role.title.split(' ')[0].toLowerCase()}`}
              >
                <div className={`w-12 h-12 ${role.accent} rounded-2xl flex items-center justify-center mb-5 shadow-md`}>
                  <role.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-black mb-2 text-slate-900 dark:text-white">{role.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">{role.subtitle}</p>
                <ul className="space-y-3">
                  {role.items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────────── */}
      <section id="features" className="py-28 px-6 bg-white dark:bg-[#0d0f1a]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-violet-600 dark:text-violet-400 font-bold text-sm uppercase tracking-widest mb-4">Six Core Modules</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-5 text-slate-900 dark:text-white">
              Everything Your OJT{" "}<span className="text-violet-600 dark:text-violet-400">Program Needs</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xl max-w-xl mx-auto leading-relaxed">
              Six focused tools that cover the complete internship workflow from day one to sign-off.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="group p-7 rounded-3xl border border-slate-100 dark:border-white/8 bg-white dark:bg-white/3 hover:shadow-xl dark:hover:bg-white/5 hover:-translate-y-1 transition-all duration-300"
                data-testid={`card-feature-${f.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className={`w-12 h-12 ${isDark ? f.darkColor : f.lightColor} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black mb-2 text-slate-900 dark:text-white">{f.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-28 px-6 transition-colors duration-300" style={{ background: stepsGradient }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-violet-600 dark:text-violet-400 font-bold text-sm uppercase tracking-widest mb-4">Getting Started</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-5 text-slate-900 dark:text-white">
              Up and Running in{" "}<span className="text-violet-600 dark:text-violet-400">Five Minutes</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xl max-w-xl mx-auto leading-relaxed">
              No IT setup. No lengthy onboarding. Just create your space and start tracking.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((step, i) => (
              <div
                key={step.step}
                className="relative group bg-white dark:bg-white/5 rounded-3xl p-7 shadow-sm dark:shadow-none border border-transparent dark:border-white/8 hover:shadow-xl dark:hover:bg-white/8 hover:-translate-y-1 transition-all duration-300"
                data-testid={`card-step-${step.step}`}
              >
                <div className="text-6xl font-black text-violet-100 dark:text-violet-900/60 absolute top-5 right-6 leading-none select-none">{step.step}</div>
                <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center mb-5 shadow-md shadow-violet-500/30 group-hover:scale-110 transition-transform">
                  <step.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{step.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                    <ArrowRight className="w-5 h-5 text-violet-300 dark:text-violet-700" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="py-28 px-6 bg-white dark:bg-[#0d0f1a]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6 text-slate-900 dark:text-white">
            Your OJT Program Deserves{" "}
            <span className="text-violet-600 dark:text-violet-400">Better Than Group Chats</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xl mb-10 max-w-xl mx-auto leading-relaxed">
            Give interns a dedicated space to log their work and give supervisors real-time visibility — zero follow-up required.
          </p>
          <Link href="/auth">
            <Button size="lg" className="font-black text-base px-10 h-14 rounded-full bg-violet-600 hover:bg-violet-700 text-white shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50 hover:-translate-y-0.5 transition-all" data-testid="button-cta-getstarted">
              Get Started — it's free
            </Button>
          </Link>
          <p className="mt-5 text-sm text-slate-400 dark:text-slate-500">No credit card needed · Free to start</p>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer style={{ background: "linear-gradient(175deg, #7c3aed 0%, #6d28d9 30%, #5b21b6 70%, #4c1d95 100%)" }}>
        <div className="max-w-7xl mx-auto px-8 pt-16 pb-10">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 font-black text-xl text-white mb-5">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                OJTask
              </Link>
              <p className="text-white/60 text-sm leading-relaxed">The OJT management platform for Philippine schools and companies.</p>
            </div>

            {[
              { title: "Product", links: [{ label: "Time Tracking", href: "/auth" }, { label: "Daily Scrum", href: "/auth" }, { label: "Task Board", href: "/auth" }, { label: "Documents", href: "/auth" }] },
              { title: "For",     links: [{ label: "Students", href: "/auth" }, { label: "Supervisors", href: "/auth" }, { label: "Coordinators", href: "/auth" }, { label: "Schools", href: "/auth" }] },
              { title: "Account", links: [{ label: "Sign In", href: "/auth" }, { label: "Get Started", href: "/auth" }, { label: "Forgot Password", href: "/forgot-password" }] },
              { title: "Support", links: [{ label: "Help Center", href: "/auth" }, { label: "Contact Us", href: "/auth" }, { label: "Privacy Policy", href: "/auth" }, { label: "Terms of Use", href: "/auth" }] },
            ].map((col) => (
              <div key={col.title}>
                <div className="text-xs font-black uppercase tracking-widest text-white/50 mb-4">{col.title}</div>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-sm text-white/80 hover:text-white transition-colors font-medium">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-white/10 mx-8" />

        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
          <p className="text-sm text-white/40">© {new Date().getFullYear()} OJTask. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <p className="text-sm text-white/40 hidden md:block">Made with 💜 for Filipino interns</p>
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white/70 hover:text-white text-xs font-semibold transition-all"
              aria-label="Toggle dark mode"
            >
              {isDark ? <><Sun className="w-3.5 h-3.5" /> Light mode</> : <><Moon className="w-3.5 h-3.5" /> Dark mode</>}
            </button>
          </div>
        </div>

        {/* Giant wordmark */}
        <div className="w-full overflow-hidden leading-none select-none" aria-hidden="true">
          <div className="text-center font-black tracking-tight" style={{ fontSize: "clamp(80px, 18vw, 260px)", color: "rgba(255,255,255,0.08)", lineHeight: 0.88, paddingBottom: "0.05em", letterSpacing: "-0.03em" }}>
            OJTask
          </div>
        </div>
      </footer>

      {/* Marquee keyframes */}
      <style>{`
        @keyframes marquee         { from { transform: translateX(0); }    to { transform: translateX(-50%); } }
        @keyframes marquee-reverse { from { transform: translateX(-50%); } to { transform: translateX(0); } }
        .animate-marquee          { animation: marquee 28s linear infinite; }
        .animate-marquee-reverse  { animation: marquee-reverse 32s linear infinite; }
      `}</style>
    </div>
  );
}
