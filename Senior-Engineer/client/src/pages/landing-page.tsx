import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "wouter";
import {
  Clock, ListTodo, Users, CalendarDays, FileText, MessageSquare,
  CheckCircle, ArrowRight, GraduationCap, Building2, BookOpen,
  Menu, X, BarChart3, ShieldCheck, Layers, Sun, Moon, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

// ── Hooks ───────────────────────────────────────────────────────────────────

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function useCounter(target: number, active: boolean, duration = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active || target === 0) return;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(ease * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [active, target, duration]);
  return value;
}

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
          <span key={i} className="inline-flex items-center text-lg font-semibold text-white/80 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-white/40 inline-block shrink-0 mx-6" />
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
    accent: "bg-violet-600", gradFrom: "#7c3aed", gradTo: "#6d28d9",
    lightBg: "#f5f3ff", darkBg: "rgba(124,58,237,0.28)",
    lightRing: "rgba(167,139,250,0.4)", darkRing: "rgba(167,139,250,0.35)",
    items: ["Log daily OJT hours and tasks", "Submit structured daily scrum reports", "Record attendance instantly", "Upload required internship documents"],
  },
  {
    icon: Building2, title: "Company Supervisors",
    subtitle: "Stay on top of every intern without the constant follow-ups.",
    accent: "bg-indigo-600", gradFrom: "#4f46e5", gradTo: "#3730a3",
    lightBg: "#eef2ff", darkBg: "rgba(79,70,229,0.28)",
    lightRing: "rgba(165,180,252,0.4)", darkRing: "rgba(165,180,252,0.35)",
    items: ["Approve time logs and scrums in one click", "Assign tasks and track progress visually", "Monitor attendance in real time", "Communicate via dedicated team channels"],
  },
  {
    icon: BookOpen, title: "School Coordinators",
    subtitle: "Full program visibility without chasing anyone for updates.",
    accent: "bg-emerald-600", gradFrom: "#059669", gradTo: "#047857",
    lightBg: "#ecfdf5", darkBg: "rgba(5,150,105,0.28)",
    lightRing: "rgba(110,231,183,0.4)", darkRing: "rgba(110,231,183,0.35)",
    items: ["View all student progress at a glance", "Monitor interns across multiple companies", "Review and approve submitted documents", "Track attendance program-wide"],
  },
];

const steps = [
  { step: "01", title: "Create Your Space",   desc: "Supervisors set up a workspace and share a unique join code. Ready in under two minutes.", icon: Layers },
  { step: "02", title: "Students Join",        desc: "Interns join with the code and get instant access to all six modules. No training needed.", icon: GraduationCap },
  { step: "03", title: "Track Daily",          desc: "Log hours, submit scrum reports, update task boards. Supervisors approve with one click.", icon: BarChart3 },
  { step: "04", title: "Close Out",            desc: "Coordinators access complete records, verify documents, and finalize evaluations.", icon: ShieldCheck },
];

// ── Animated Section wrapper ───────────────────────────────────────────────
function Section({ children, className = "", style = {}, id }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties; id?: string;
}) {
  const { ref, inView } = useInView(0.1);
  return (
    <section
      id={id}
      ref={ref}
      className={`min-h-screen flex flex-col justify-center ${className}`}
      style={style}
    >
      <div className={`transition-all duration-1000 ease-out ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
        {children}
      </div>
    </section>
  );
}

// ── Staggered card wrapper ─────────────────────────────────────────────────
function AnimCard({ children, delay = 0, className = "", style = {} }: {
  children: React.ReactNode; delay?: number; className?: string; style?: React.CSSProperties;
}) {
  const { ref, inView } = useInView(0.1);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${inView ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"} ${className}`}
      style={{ transitionDelay: `${delay}ms`, ...style }}
    >
      {children}
    </div>
  );
}

// ── Stat counter card ──────────────────────────────────────────────────────
function StatCard({ raw, label }: { raw: string; label: string }) {
  const { ref, inView } = useInView(0.2);
  const numericVal = parseInt(raw, 10);
  const isNumber = !isNaN(numericVal) && raw !== "...";
  const count = useCounter(isNumber ? numericVal : 0, inView && isNumber);
  return (
    <div ref={ref} className={`text-center transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <div className="text-4xl md:text-5xl font-black text-violet-600 dark:text-violet-300 mb-2 tabular-nums">
        {isNumber && inView ? count : raw}
      </div>
      <div className="text-sm font-medium text-slate-500 dark:text-slate-300">{label}</div>
    </div>
  );
}

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

  const rolesGradient   = isDark ? "linear-gradient(175deg, #13102a 0%, #1a1040 100%)"              : "linear-gradient(175deg, #fafafa 0%, #f5f3ff 100%)";
  const stepsGradient   = isDark ? "linear-gradient(175deg, #13102a 0%, #1e1b4b 100%)"              : "linear-gradient(175deg, #f5f3ff 0%, #ede9fe 100%)";

  return (
    <div className="bg-white dark:bg-[#0d0f1a] text-slate-900 dark:text-white overflow-x-hidden transition-colors duration-300">

      {/* ── NAVBAR ──────────────────────────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 dark:bg-[#0d0f1a]/90 backdrop-blur-xl shadow-sm dark:shadow-black/40 border-b border-slate-200/60 dark:border-white/8"
          : "bg-transparent"
      }`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-0.5 shrink-0">
            <img src="/ojtask-logo.png" className="h-14 w-auto object-contain mt-2" alt="OJTask logo" />
          </Link>
          <div className="flex-1" />
          <div className="hidden md:flex items-center gap-2">
            <Link href="/auth">
              <Button variant="ghost" size="sm" className="font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10">
                Sign In
              </Button>
            </Link>
            <Link href="/auth">
              <Button size="sm" className="font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-full px-5 shadow-md shadow-violet-500/25">
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
        className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center overflow-hidden"
        style={{ background: isDark ? "linear-gradient(160deg, #1e1b4b 0%, #2e1065 40%, #1e1b4b 100%)" : "linear-gradient(160deg, #f5f3ff 0%, #ede9fe 40%, #ddd6fe 100%)" }}
      >
        {/* Animated background blobs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-violet-500/20 dark:bg-violet-600/15 blur-[120px] pointer-events-none animate-blob" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-indigo-500/15 dark:bg-indigo-600/10 blur-[100px] pointer-events-none animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full bg-purple-500/15 dark:bg-purple-600/10 blur-[90px] pointer-events-none animate-blob animation-delay-4000" />

        {/* Floating decorative chips */}
        <div className="absolute top-28 left-[8%] hidden lg:flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-white/20 backdrop-blur-sm border border-white/60 dark:border-white/30 shadow-lg text-xs font-semibold text-slate-700 dark:text-white animate-float">
          <Clock className="w-3.5 h-3.5 text-violet-500 dark:text-violet-300" /> Time Tracking
        </div>
        <div className="absolute top-44 right-[7%] hidden lg:flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-white/20 backdrop-blur-sm border border-white/60 dark:border-white/30 shadow-lg text-xs font-semibold text-slate-700 dark:text-white animate-float animation-delay-1000">
          <Users className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-300" /> Daily Scrum
        </div>
        <div className="absolute bottom-36 left-[10%] hidden lg:flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-white/20 backdrop-blur-sm border border-white/60 dark:border-white/30 shadow-lg text-xs font-semibold text-slate-700 dark:text-white animate-float animation-delay-2000">
          <FileText className="w-3.5 h-3.5 text-rose-500 dark:text-rose-300" /> Document Hub
        </div>
        <div className="absolute bottom-48 right-[9%] hidden lg:flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-white/20 backdrop-blur-sm border border-white/60 dark:border-white/30 shadow-lg text-xs font-semibold text-slate-700 dark:text-white animate-float animation-delay-3000">
          <ListTodo className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-300" /> Task Board
        </div>

        <div className="relative max-w-4xl mx-auto animate-hero-enter">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 dark:bg-white/10 backdrop-blur-sm border border-violet-200 dark:border-violet-700/50 text-violet-700 dark:text-violet-300 text-sm font-semibold mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
            Built for OJT in the Philippines 🇵🇭
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight leading-[1.04] mb-7 text-slate-900 dark:text-white">
            Your Internship,{" "}
            <span className="animate-gradient-text bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-600 dark:from-fuchsia-300 dark:via-violet-200 dark:to-indigo-300 bg-clip-text text-transparent" style={{ backgroundSize: "200% 100%" }}>
              Finally Organized
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed px-2">
            OJTask brings students, supervisors, and school coordinators into one shared workspace — daily reports, time logs, and documents handled without the back-and-forth.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/auth">
              <Button size="lg" className="font-black text-base px-8 h-14 rounded-full bg-violet-600 hover:bg-violet-700 text-white shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50 hover:-translate-y-1 active:translate-y-0 transition-all duration-200">
                Try OJTask for free
              </Button>
            </Link>
            <Link href="/auth">
              <Button size="lg" variant="outline" className="font-bold text-base px-8 h-14 rounded-full border-2 border-slate-300 dark:border-white/20 text-slate-700 dark:text-white hover:bg-white dark:hover:bg-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-sm hover:-translate-y-1 transition-all duration-200">
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
      <section className="min-h-[50vh] flex items-center py-20 px-6 bg-white dark:bg-[#0d0f1a]">
        <div className="max-w-5xl mx-auto w-full grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: statsValues.students,  label: "Students Onboarded" },
            { value: statsValues.companies, label: "Companies Using It" },
            { value: statsValues.schools,   label: "Schools Enrolled" },
          ].map((s) => (
            <StatCard key={s.label} raw={s.value} label={s.label} />
          ))}
        </div>
      </section>

      {/* ── WHO IS IT FOR ─────────────────────────────────────────────────── */}
      <Section className="px-6 py-20" style={{ background: rolesGradient }}>
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-16">
            <p className="text-violet-600 dark:text-violet-300 font-bold text-sm uppercase tracking-widest mb-4">Who Uses OJTask</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-5 text-slate-900 dark:text-white">
              One Platform Built for{" "}<span className="text-violet-600 dark:text-violet-300">Everyone Involved</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-300 text-xl max-w-xl mx-auto leading-relaxed">
              Students, supervisors, and coordinators each get a tailored view with exactly the tools they need.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {roles.map((role, i) => (
              <AnimCard key={role.title} delay={i * 120}>
                <div
                  className="rounded-3xl p-8 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full"
                  style={{
                    background: isDark ? role.darkBg : role.lightBg,
                    border: `1px solid ${isDark ? role.darkRing : role.lightRing}`,
                  }}
                >
                  <div className={`w-12 h-12 ${role.accent} rounded-2xl flex items-center justify-center mb-5 shadow-md`}>
                    <role.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-black mb-2 text-slate-900 dark:text-white">{role.title}</h3>
                  <p className="text-slate-500 dark:text-slate-300 text-sm mb-6 leading-relaxed">{role.subtitle}</p>
                  <ul className="space-y-3">
                    {role.items.map((item, j) => (
                      <li key={item} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300"
                        style={{ animationDelay: `${j * 80}ms` }}>
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </AnimCard>
            ))}
          </div>
        </div>
      </Section>

      {/* ── FEATURES ──────────────────────────────────────────────────────── */}
      <Section id="features" className="px-6 py-20 bg-white dark:bg-[#0d0f1a]">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-16">
            <p className="text-violet-600 dark:text-violet-300 font-bold text-sm uppercase tracking-widest mb-4">Six Core Modules</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-5 text-slate-900 dark:text-white">
              Everything Your OJT{" "}<span className="text-violet-600 dark:text-violet-300">Program Needs</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-300 text-xl max-w-xl mx-auto leading-relaxed">
              Six focused tools that cover the complete internship workflow from day one to sign-off.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <AnimCard key={f.title} delay={i * 80}>
                <div
                  className="group p-7 rounded-3xl hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full"
                  style={{
                    background: isDark ? "rgba(255,255,255,0.09)" : "#ffffff",
                    border: isDark ? "1px solid rgba(255,255,255,0.18)" : "1px solid #e2e8f0",
                    boxShadow: isDark ? "0 2px 16px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.06)",
                  }}
                >
                  <div className={`w-12 h-12 ${isDark ? f.darkColor : f.lightColor} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                    <f.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black mb-2 text-slate-900 dark:text-white">{f.title}</h3>
                  <p className="text-slate-500 dark:text-slate-300 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </AnimCard>
            ))}
          </div>
        </div>
      </Section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <Section id="how-it-works" className="px-6 py-20" style={{ background: stepsGradient }}>
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-16">
            <p className="text-violet-600 dark:text-violet-300 font-bold text-sm uppercase tracking-widest mb-4">Getting Started</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-5 text-slate-900 dark:text-white">
              Up and Running in{" "}<span className="text-violet-600 dark:text-violet-300">Five Minutes</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-300 text-xl max-w-xl mx-auto leading-relaxed">
              No IT setup. No lengthy onboarding. Just create your space and start tracking.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((step, i) => (
              <AnimCard key={step.step} delay={i * 130}>
                <div
                  className="relative group rounded-3xl p-7 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full overflow-hidden"
                  style={{
                    background: isDark ? "rgba(255,255,255,0.09)" : "#ffffff",
                    border: isDark ? "1px solid rgba(255,255,255,0.18)" : "1px solid #e2e8f0",
                    boxShadow: isDark ? "0 2px 16px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.06)",
                  }}
                >
                  {/* Shimmering step number */}
                  <div className="text-6xl font-black absolute top-4 right-5 leading-none select-none transition-all duration-300 group-hover:scale-110 group-hover:opacity-60" style={{ color: isDark ? "rgba(167,139,250,0.4)" : "#ddd6fe" }}>{step.step}</div>
                  <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center mb-5 shadow-md shadow-violet-500/30 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                    <step.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-300 leading-relaxed">{step.desc}</p>
                  {i < steps.length - 1 && (
                    <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                      <ArrowRight className="w-5 h-5 text-violet-300 dark:text-violet-400" />
                    </div>
                  )}
                </div>
              </AnimCard>
            ))}
          </div>
        </div>
      </Section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <Section className="px-6 py-20 bg-white dark:bg-[#0d0f1a] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-400/10 dark:bg-violet-600/8 blur-[100px] animate-blob" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6 text-slate-900 dark:text-white">
            Your OJT Program Deserves{" "}
            <span className="text-violet-600 dark:text-violet-300">Better Than Group Chats</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-300 text-xl mb-10 max-w-xl mx-auto leading-relaxed">
            Give interns a dedicated space to log their work and give supervisors real-time visibility — zero follow-up required.
          </p>
          <Link href="/auth">
            <Button size="lg" className="font-black text-base px-10 h-14 rounded-full bg-violet-600 hover:bg-violet-700 text-white shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50 hover:-translate-y-1 transition-all duration-200">
              Get Started — it's free
            </Button>
          </Link>
          <p className="mt-5 text-sm text-slate-500 dark:text-slate-300">No credit card needed · Free to start</p>
        </div>
      </Section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer style={{ background: "linear-gradient(175deg, #7c3aed 0%, #6d28d9 30%, #5b21b6 70%, #4c1d95 100%)" }}>
        <div className="max-w-7xl mx-auto px-8 pt-16 pb-10">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-0.5 mb-5">
                <img src="/ojtask-logo.png" className="h-10 w-auto object-contain brightness-0 invert" alt="OJTask logo" />
              </Link>
              <p className="text-white/60 text-sm leading-relaxed">The OJT management platform for Philippine schools and companies.</p>
            </div>

            {[
              { title: "Product", links: [{ label: "Time Tracking", href: "/auth" }, { label: "Daily Scrum", href: "/auth" }, { label: "Task Board", href: "/auth" }, { label: "Documents", href: "/auth" }] },
              { title: "For",     links: [{ label: "Students", href: "/auth" }, { label: "Supervisors", href: "/auth" }, { label: "Coordinators", href: "/auth" }, { label: "Schools", href: "/auth" }] },
              { title: "Account", links: [{ label: "Sign In", href: "/auth" }, { label: "Get Started", href: "/auth" }, { label: "Forgot Password", href: "/forgot-password" }] },
              { title: "Legal",   links: [{ label: "Privacy Policy", href: "/privacy-policy" }, { label: "Terms of Use", href: "/terms-of-use" }, { label: "Contact Us", href: "/contact" }] },
            ].map((col) => (
              <div key={col.title}>
                <p className="text-white/90 font-bold text-sm mb-4">{col.title}</p>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="text-white/55 hover:text-white text-sm transition-colors">{l.label}</Link>
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

        <div className="w-full overflow-hidden leading-none select-none" aria-hidden="true">
          <div className="text-center font-black tracking-tight" style={{ fontSize: "clamp(80px, 18vw, 260px)", color: "rgba(255,255,255,0.08)", lineHeight: 0.88, paddingBottom: "0.05em", letterSpacing: "-0.03em" }}>
            OJTask
          </div>
        </div>
      </footer>

      {/* ── Keyframes ─────────────────────────────────────────────────────── */}
      <style>{`
        @keyframes marquee         { from { transform: translateX(0); }    to { transform: translateX(-50%); } }
        @keyframes marquee-reverse { from { transform: translateX(-50%); } to { transform: translateX(0); } }
        .animate-marquee          { animation: marquee 28s linear infinite; }
        .animate-marquee-reverse  { animation: marquee-reverse 32s linear infinite; }

        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(30px, -20px) scale(1.05); }
          66%       { transform: translate(-20px, 15px) scale(0.97); }
        }
        .animate-blob { animation: blob 12s ease-in-out infinite; }
        .animation-delay-1000 { animation-delay: 1s; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-3000 { animation-delay: 3s; }
        .animation-delay-4000 { animation-delay: 4s; }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }

        @keyframes hero-enter {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-hero-enter { animation: hero-enter 0.9s cubic-bezier(0.22,1,0.36,1) both; }

        @keyframes gradient-text {
          0%, 100% { background-position: 0% 50%; }
          50%       { background-position: 100% 50%; }
        }
        .animate-gradient-text { animation: gradient-text 4s ease infinite; background-size: 200% auto !important; }

        @keyframes bounce-slow {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50%       { transform: translateX(-50%) translateY(6px); }
        }
        .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
