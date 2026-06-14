import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "wouter";

// ── Animated particle canvas ────────────────────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = canvas.offsetWidth;
    let height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;

    const particles = Array.from({ length: 90 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.6 + 0.3,
      dx: (Math.random() - 0.5) * 0.35,
      dy: (Math.random() - 0.5) * 0.35,
      alpha: Math.random() * 0.6 + 0.15,
      pulse: Math.random() * Math.PI * 2,
    }));

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.pulse += 0.018;
        const a = p.alpha * (0.6 + 0.4 * Math.sin(p.pulse));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,180,255,${a})`;
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
      });

      // Draw faint connecting lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(180,150,255,${0.12 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      raf = requestAnimationFrame(draw);
    };
    draw();

    const onResize = () => {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}
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
  { icon: Clock,         title: "OJT Hours Tracker",  desc: "Log OJT hours daily and auto-generate your DTR. Get instant supervisor sign-off — zero spreadsheets or manual hour sheets.",              lightColor: "bg-violet-100 text-violet-600", darkColor: "bg-violet-900/40 text-violet-300" },
  { icon: Users,         title: "Daily Scrum Reports", desc: "Submit structured daily scrum reports in under two minutes. Supervisors review and approve with one click — no long status meetings.",               lightColor: "bg-indigo-100 text-indigo-600", darkColor: "bg-indigo-900/40 text-indigo-300" },
  { icon: ListTodo,      title: "Task Board",          desc: "Kanban-style task management built around how OJT interns actually work — assign, track, and complete practicum tasks in real time.",                       lightColor: "bg-emerald-100 text-emerald-600", darkColor: "bg-emerald-900/40 text-emerald-300" },
  { icon: CalendarDays,  title: "Attendance Logs",     desc: "One-tap attendance logging gives supervisors and school coordinators real-time visibility into intern presence — no follow-up needed.",                        lightColor: "bg-amber-100 text-amber-600", darkColor: "bg-amber-900/40 text-amber-300" },
  { icon: FileText,      title: "Document Hub",        desc: "Upload and manage MOAs, endorsement letters, terminal reports, and weekly journals — all OJT requirements in one secure place.",                        lightColor: "bg-rose-100 text-rose-600", darkColor: "bg-rose-900/40 text-rose-300" },
  { icon: MessageSquare, title: "Team Chat",           desc: "Dedicated channels keep OJT communication organized between interns, supervisors, and school coordinators — without flooding personal inboxes.",                    lightColor: "bg-cyan-100 text-cyan-600", darkColor: "bg-cyan-900/40 text-cyan-300" },
];

const roles = [
  {
    icon: GraduationCap, title: "OJT Students",
    subtitle: "Everything you need to complete your practicum without the stress.",
    accent: "bg-violet-600", gradFrom: "#7c3aed", gradTo: "#6d28d9",
    lightBg: "#f5f3ff", darkBg: "rgba(124,58,237,0.28)",
    lightRing: "rgba(167,139,250,0.4)", darkRing: "rgba(167,139,250,0.35)",
    items: ["Track and export OJT hours and your DTR automatically", "Submit daily scrum reports and weekly journals in minutes", "Log attendance with one tap from any device", "Upload MOAs, endorsement letters, and all required OJT documents"],
  },
  {
    icon: Building2, title: "Company Supervisors",
    subtitle: "Stay on top of every intern without the constant follow-ups.",
    accent: "bg-indigo-600", gradFrom: "#4f46e5", gradTo: "#3730a3",
    lightBg: "#eef2ff", darkBg: "rgba(79,70,229,0.28)",
    lightRing: "rgba(165,180,252,0.4)", darkRing: "rgba(165,180,252,0.35)",
    items: ["Approve OJT hours, DTR, and daily scrums in one click", "Assign practicum tasks and track intern progress visually", "Monitor intern attendance in real time", "Communicate via dedicated OJT team channels"],
  },
  {
    icon: BookOpen, title: "School Coordinators",
    subtitle: "Manage 20–100 interns across multiple companies — without chasing anyone.",
    accent: "bg-emerald-600", gradFrom: "#059669", gradTo: "#047857",
    lightBg: "#ecfdf5", darkBg: "rgba(5,150,105,0.28)",
    lightRing: "rgba(110,231,183,0.4)", darkRing: "rgba(110,231,183,0.35)",
    items: ["Monitor OJT hours and attendance across all interns program-wide", "Review and approve MOAs, terminal reports, and evaluations", "Track practicum completion rates across multiple host companies", "Get full program visibility without chasing students for updates"],
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

  const pageBg = isDark ? "linear-gradient(160deg, #160d35 0%, #2a1260 20%, #1a0d45 45%, #0f0820 70%, #1a0a3e 100%)" : "linear-gradient(160deg, #f0ebff 0%, #e8d9ff 20%, #f5f0ff 55%, #faf7ff 100%)";

  return (
    <div className="text-slate-900 dark:text-white overflow-x-hidden transition-colors duration-300" style={{ background: pageBg }}>

      {/* ── Full-page persistent particle canvas ─────────────────────────── */}
      {isDark && (
        <div className="fixed inset-0 pointer-events-none z-0">
          <ParticleCanvas />
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }} />
        </div>
      )}
      {!isDark && (
        <div className="fixed inset-0 pointer-events-none z-0" style={{
          backgroundImage: "linear-gradient(rgba(124,58,237,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />
      )}

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
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center overflow-hidden z-10">
        {/* Animated background blobs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-violet-600/20 dark:bg-violet-500/15 blur-[130px] pointer-events-none animate-blob" />
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-indigo-500/15 dark:bg-fuchsia-600/10 blur-[110px] pointer-events-none animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-purple-500/15 dark:bg-indigo-500/10 blur-[100px] pointer-events-none animate-blob animation-delay-4000" />

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
            OJTask is the free OJT hours tracker built for Philippine college students, supervisors, and school coordinators — daily scrum reports, DTR generation, MOA documents, and practicum records managed in one shared workspace.
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

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 animate-bounce-slow opacity-60">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tracking-widest uppercase">Scroll</span>
          <ChevronDown className="w-4 h-4 text-violet-500 dark:text-violet-300" />
        </div>

      </section>

      {/* ── MARQUEE ───────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-2 overflow-hidden" style={{ background: "linear-gradient(90deg, #7c3aed, #6d28d9, #5b21b6)" }}>
        <MarqueeStrip />
        <MarqueeStrip reverse />
      </section>

      {/* ── STATS ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[50vh] flex items-center py-24 px-6 overflow-hidden z-10">
        {/* Decorative glowing orbs behind the cards */}
        <div className="absolute left-1/4 top-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-violet-600/30 dark:bg-violet-500/20 blur-[90px] pointer-events-none animate-blob" />
        <div className="absolute right-1/4 top-1/2 -translate-y-1/2 w-56 h-56 rounded-full bg-indigo-500/25 dark:bg-fuchsia-600/15 blur-[80px] pointer-events-none animate-blob animation-delay-2000" />
        <div className="absolute left-1/2 -translate-x-1/2 bottom-4 w-[600px] h-28 rounded-full bg-purple-600/20 dark:bg-purple-800/20 blur-[60px] pointer-events-none" />

        {/* Decorative SVG circuit lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.07] dark:opacity-[0.12]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="circuit" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
              <path d="M0 60 H40 M40 60 V20 H80 M80 20 H120" stroke="#a78bfa" strokeWidth="1" fill="none"/>
              <path d="M0 90 H20 M20 90 V60 M60 120 V80 H100 M100 80 V60 H120" stroke="#818cf8" strokeWidth="1" fill="none"/>
              <circle cx="40" cy="60" r="3" fill="#a78bfa"/>
              <circle cx="80" cy="20" r="3" fill="#818cf8"/>
              <circle cx="20" cy="90" r="2.5" fill="#c084fc"/>
              <circle cx="100" cy="80" r="2.5" fill="#a78bfa"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#circuit)"/>
        </svg>

        <div className="relative max-w-5xl mx-auto w-full">
          {/* Section label */}
          <div className="text-center mb-12">
            <p className="text-violet-500 dark:text-violet-300 font-bold text-sm uppercase tracking-widest mb-2">By the Numbers</p>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">OJTask is already making an impact</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { value: statsValues.students,  label: "Students Onboarded",  icon: "🎓", color: "from-violet-500/20 to-purple-600/20", border: "border-violet-400/30 dark:border-violet-500/30", glow: "shadow-violet-500/20" },
              { value: statsValues.companies, label: "Companies Using It",   icon: "🏢", color: "from-indigo-500/20 to-blue-600/20",   border: "border-indigo-400/30 dark:border-indigo-500/30",  glow: "shadow-indigo-500/20" },
              { value: statsValues.schools,   label: "Schools Enrolled",     icon: "📚", color: "from-fuchsia-500/20 to-pink-600/20",  border: "border-fuchsia-400/30 dark:border-fuchsia-500/30", glow: "shadow-fuchsia-500/20" },
            ].map((s, i) => (
                <AnimCard key={s.label} delay={i * 120}>
                  <div className={`relative rounded-3xl p-8 text-center bg-gradient-to-br ${s.color} backdrop-blur-md border ${s.border} shadow-2xl ${s.glow} overflow-hidden hover:-translate-y-2 transition-all duration-300`}
                    style={{ background: isDark ? undefined : "rgba(255,255,255,0.6)" }}>
                    {/* Shimmering top edge */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-violet-400/60 to-transparent" />
                    <div className="text-3xl mb-3">{s.icon}</div>
                    <StatCard raw={s.value} label={s.label} />
                    {/* Bottom glow dot */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-violet-400/40 blur-sm" />
                  </div>
                </AnimCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO IS IT FOR ─────────────────────────────────────────────────── */}
      <Section className="px-6 py-20 z-10 relative">
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
      <Section id="features" className="px-6 py-20 z-10 relative">
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
      <Section id="how-it-works" className="px-6 py-20 z-10 relative">
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

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <Section id="faq" className="px-6 py-20 z-10 relative">
        <div className="max-w-3xl mx-auto w-full">
          <div className="text-center mb-14">
            <p className="text-violet-600 dark:text-violet-300 font-bold text-sm uppercase tracking-widest mb-4">Common Questions</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
              Everything About <span className="text-violet-600 dark:text-violet-300">OJT Management</span>
            </h2>
          </div>
          <div className="space-y-5">
            {[
              {
                q: "How do I track OJT hours as a Philippine college student?",
                a: "OJTask lets you log your OJT hours every day from any device. Each entry is time-stamped and submitted to your supervisor for approval. At the end of your internship, you can export a complete DTR (Daily Time Record) with one click — no spreadsheets or manual counting required.",
              },
              {
                q: "What is a daily scrum in OJT and why does it matter?",
                a: "A daily scrum is a short structured update where interns report what they did, what they plan to do, and any blockers they're facing. In OJTask, this takes under two minutes to fill out and gives supervisors real-time visibility into each intern's progress — replacing the need for lengthy status meetings or manual reports.",
              },
              {
                q: "Can school coordinators monitor interns across multiple companies?",
                a: "Yes. School coordinators in OJTask get a program-wide dashboard that shows OJT hours, attendance, document submissions, and practicum progress for all their students — even if those students are deployed to different host companies. No more chasing 50 students individually for updates.",
              },
              {
                q: "What OJT documents can I manage in OJTask?",
                a: "OJTask's Document Hub supports all standard Philippine OJT requirements: MOA (Memorandum of Agreement), endorsement letters, acceptance letters, weekly journals, terminal reports, and evaluation forms. Everything is stored securely and can be reviewed or approved by coordinators directly in the platform.",
              },
              {
                q: "Is OJTask free for students and schools?",
                a: "Yes — OJTask is completely free to start. Students can join a space with a code shared by their supervisor. There is no credit card required and no time limit on the free tier.",
              },
            ].map((item, i) => (
              <AnimCard key={i} delay={i * 80}>
                <div
                  className="rounded-2xl p-7"
                  style={{
                    background: isDark ? "rgba(255,255,255,0.07)" : "#ffffff",
                    border: isDark ? "1px solid rgba(255,255,255,0.14)" : "1px solid #e2e8f0",
                  }}
                >
                  <h3 className="text-base font-black text-slate-900 dark:text-white mb-3">{item.q}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-300 leading-relaxed">{item.a}</p>
                </div>
              </AnimCard>
            ))}
          </div>
        </div>
      </Section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <Section className="px-6 py-20 relative overflow-hidden z-10">
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
      <footer className="relative z-10" style={{ background: "linear-gradient(175deg, #7c3aed 0%, #6d28d9 30%, #5b21b6 70%, #4c1d95 100%)" }}>
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
