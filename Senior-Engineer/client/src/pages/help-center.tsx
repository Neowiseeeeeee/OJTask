import { Link } from "wouter";
import { ArrowLeft, Clock, ListTodo, CalendarDays, FileText, MessageSquare, Users, BookOpen, ChevronDown, ChevronUp, GraduationCap, Building2, ShieldCheck } from "lucide-react";
import { useState } from "react";

const faqs = [
  {
    q: "How do I join a space?",
    a: "You can join a space by entering a space code provided by your supervisor or school coordinator. Go to the dashboard, click 'Join Space', and enter the code. Once approved, you'll have access to the space's features.",
  },
  {
    q: "How are time logs approved?",
    a: "After you submit a time log, your assigned supervisor receives a notification. They can review and approve or reject it from their dashboard. You'll be notified of the outcome. Approved logs are reflected in your total OJT hours.",
  },
  {
    q: "Can I edit a scrum report after submitting?",
    a: "Scrum reports cannot be edited once submitted to preserve record integrity. If you made a mistake, contact your supervisor directly through the messaging feature.",
  },
  {
    q: "What file types are accepted for document uploads?",
    a: "OJTask accepts PDF, Word (.doc, .docx), and common image formats (JPG, PNG) for document uploads. The maximum file size per upload is 20MB.",
  },
  {
    q: "How does attendance tracking work?",
    a: "Attendance is recorded per day within your active space. You mark your attendance manually, and supervisors can verify records. The system tracks present, absent, and late statuses.",
  },
  {
    q: "I forgot my password. What do I do?",
    a: "Click 'Forgot Password' on the sign-in page. Enter your registered email address and you'll receive a one-time code (OTP) to reset your password. The code expires in 10 minutes.",
  },
  {
    q: "Can I be part of multiple spaces?",
    a: "Yes. A student can be a member of multiple spaces — for example, if you have internships at different companies or within different departments. You can switch between spaces from the sidebar.",
  },
];

const sections = [
  {
    icon: GraduationCap,
    title: "For Students",
    color: "text-violet-600",
    bg: "bg-violet-50 dark:bg-violet-950/30",
    items: [
      { icon: Clock, label: "Time Logs", desc: "Log your daily OJT hours by navigating to 'Time Logs' and clicking 'New Entry'. Fill in your start time, end time, and a brief description of your work. Submit the entry — your supervisor will be notified for approval." },
      { icon: BookOpen, label: "Daily Scrum", desc: "Submit your daily scrum from the 'Scrums' page. The form asks for what you did yesterday, what you plan to do today, and any blockers. Scrums are visible to your supervisor in real time." },
      { icon: ListTodo, label: "Task Board", desc: "Your assigned tasks appear on the Kanban board under 'Tasks'. Move tasks from To Do → In Progress → Done as you complete them. Supervisors can track your progress without needing a separate update." },
      { icon: CalendarDays, label: "Attendance", desc: "Mark your attendance daily from the 'Attendance' page. The system records the timestamp of when you mark in. You can view your attendance history and summary at any time." },
      { icon: FileText, label: "Documents", desc: "Upload required internship documents (e.g., MOA, resume, endorsement letters) under the 'Documents' section. Each document goes through an approval workflow with your school coordinator or supervisor." },
    ],
  },
  {
    icon: Building2,
    title: "For Supervisors",
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    items: [
      { icon: Clock, label: "Approving Time Logs", desc: "Pending time logs from your interns appear in your dashboard. Open each submission to review the hours and work description, then approve or reject with optional feedback." },
      { icon: ListTodo, label: "Task Assignment", desc: "Create tasks from the Tasks page and assign them to specific interns. Set due dates and priority levels. You'll receive updates when interns move tasks across the board." },
      { icon: Users, label: "Managing Your Space", desc: "From the Space Admin panel, you can manage members, set roles, view attendance summaries, and monitor overall intern progress across all tracked categories." },
    ],
  },
  {
    icon: ShieldCheck,
    title: "For School Coordinators",
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    items: [
      { icon: FileText, label: "Document Review", desc: "School coordinators review and approve internship documents submitted by students. Navigate to the Documents section of your space to see pending submissions." },
      { icon: Users, label: "Student Monitoring", desc: "View progress summaries for all students enrolled under your school's space. Track completed OJT hours, attendance rates, and document compliance." },
    ],
  },
];

function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm md:text-base">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/60 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-200 dark:border-slate-700">
          {a}
        </div>
      )}
    </div>
  );
}

export default function HelpCenter() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0d0f1a] text-slate-900 dark:text-white">
      <nav className="sticky top-0 z-50 bg-white/90 dark:bg-[#0d0f1a]/90 backdrop-blur-xl border-b border-slate-200 dark:border-white/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <img src="/ojtask-logo.png" className="h-10 w-auto object-contain mt-1" alt="OJTask" />
          </Link>
          <Link href="/">
            <button className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </button>
          </Link>
        </div>
      </nav>

      <header className="bg-gradient-to-br from-violet-50 via-white to-violet-50 dark:from-violet-950/30 dark:via-[#0d0f1a] dark:to-violet-950/20 border-b border-violet-100 dark:border-violet-900/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <p className="text-violet-600 dark:text-violet-400 font-bold text-xs uppercase tracking-widest mb-3">Documentation</p>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-3">Help Center</h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl text-sm sm:text-base leading-relaxed">
            Step-by-step guides for using OJTask — covering time logs, scrums, tasks, attendance, documents, and more.
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-16">
        <section>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-2">Getting Started</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">OJTask is organized around <strong className="text-slate-700 dark:text-slate-200">Spaces</strong> — shared workspaces where a group of interns, supervisors, and school coordinators collaborate. Each space has its own time logs, tasks, attendance records, and documents.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { step: "1", title: "Create an Account", desc: "Sign up with your full name, email address, username, and password. Choose your role: Student, Supervisor, or School Coordinator." },
              { step: "2", title: "Join or Create a Space", desc: "Students and supervisors join a space using a code. Supervisors and school coordinators can also create a new space and invite members." },
              { step: "3", title: "Start Tracking", desc: "Once inside a space, you can log time, submit daily scrums, update tasks, record attendance, and upload documents." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
                <div className="w-8 h-8 rounded-full bg-violet-600 text-white text-sm font-black flex items-center justify-center mb-3">{step}</div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1 text-sm">{title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {sections.map(({ icon: Icon, title, color, bg, items }) => (
          <section key={title}>
            <div className="flex items-center gap-2 mb-6">
              <Icon className={`w-5 h-5 ${color}`} />
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{title}</h2>
            </div>
            <div className="space-y-3">
              {items.map(({ icon: ItemIcon, label, desc }) => (
                <div key={label} className={`rounded-xl p-5 ${bg} border border-slate-200 dark:border-slate-700/50`}>
                  <div className="flex items-start gap-3">
                    <ItemIcon className={`w-5 h-5 mt-0.5 shrink-0 ${color}`} />
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-1">{label}</h3>
                      <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        <section>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-6">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq) => <FAQ key={faq.q} {...faq} />)}
          </div>
        </section>

        <section className="rounded-2xl bg-violet-600 dark:bg-violet-700 p-6 sm:p-8 text-white text-center">
          <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-80" />
          <h2 className="text-xl font-black mb-2">Still need help?</h2>
          <p className="text-white/80 text-sm mb-5">If your question isn't answered here, reach out to us directly.</p>
          <Link href="/contact">
            <button className="bg-white text-violet-700 font-bold text-sm px-6 py-2.5 rounded-full hover:bg-violet-50 transition-colors">
              Contact Us
            </button>
          </Link>
        </section>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 mt-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} OJTask. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <Link href="/privacy-policy" className="hover:text-violet-600 transition-colors">Privacy Policy</Link>
            <Link href="/terms-of-use" className="hover:text-violet-600 transition-colors">Terms of Use</Link>
            <Link href="/contact" className="hover:text-violet-600 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
