import { Link } from "wouter";
import { ArrowLeft, Mail, Clock, MessageSquare, Send, CheckCircle } from "lucide-react";
import { useState } from "react";

const SUBJECTS = [
  "General Inquiry",
  "Account or Login Issue",
  "Bug Report",
  "Feature Request",
  "School or Company Partnership",
  "Data Privacy Concern",
  "Other",
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: SUBJECTS[0], message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus("sent");
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.message || "Something went wrong. Please try again.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Network error. Please check your connection and try again.");
      setStatus("error");
    }
  };

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
          <p className="text-violet-600 dark:text-violet-400 font-bold text-xs uppercase tracking-widest mb-3">Get in Touch</p>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-3">Contact Us</h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl text-sm sm:text-base leading-relaxed">
            Have a question, found a bug, or want to discuss a partnership? Send us a message and we'll get back to you.
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white mb-4">Contact Information</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-0.5">Email</p>
                    <a href="mailto:ojtask.connect@gmail.com" className="text-sm font-semibold text-violet-600 dark:text-violet-400 hover:underline break-all">
                      ojtask.connect@gmail.com
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-0.5">Response Time</p>
                    <p className="text-sm text-slate-700 dark:text-slate-200">Within 1–3 business days</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-0.5">Support Hours</p>
                    <p className="text-sm text-slate-700 dark:text-slate-200">Monday – Friday, 8 AM – 6 PM PHT</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/40 p-5">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-2">For urgent concerns</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                If you're experiencing a login issue or data access problem that is blocking your internship documentation, include "URGENT" in your subject line so we can prioritize your message.
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 p-5">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-3">Helpful before you write</h3>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-2"><span className="text-violet-500 mt-0.5">•</span><span>Check the <Link href="/help-center" className="text-violet-600 dark:text-violet-400 hover:underline font-semibold">Help Center</Link> — most questions are answered there.</span></li>
                <li className="flex items-start gap-2"><span className="text-violet-500 mt-0.5">•</span><span>For password issues, use the Forgot Password flow on the sign-in page.</span></li>
                <li className="flex items-start gap-2"><span className="text-violet-500 mt-0.5">•</span><span>When reporting a bug, describe what you did, what happened, and what you expected.</span></li>
              </ul>
            </div>
          </div>

          <div className="lg:col-span-3">
            {status === "sent" ? (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Message sent!</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs leading-relaxed">
                  We received your message and will reply to <strong className="text-slate-700 dark:text-slate-200">{form.email}</strong> within 1–3 business days.
                </p>
                <button
                  onClick={() => { setForm({ name: "", email: "", subject: SUBJECTS[0], message: "" }); setStatus("idle"); }}
                  className="mt-2 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Full Name <span className="text-red-400">*</span></label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      placeholder="Juan dela Cruz"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Email Address <span className="text-red-400">*</span></label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Subject</label>
                  <select
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                  >
                    {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Message <span className="text-red-400">*</span></label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    placeholder="Describe your question or issue in as much detail as possible..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition resize-none"
                  />
                </div>

                {status === "error" && (
                  <p className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl px-4 py-3">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-colors"
                >
                  {status === "sending" ? (
                    <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Sending...</>
                  ) : (
                    <><Send className="w-4 h-4" /> Send Message</>
                  )}
                </button>
                <p className="text-xs text-slate-400 text-center">We'll reply to the email address you provide above.</p>
              </form>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 mt-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} OJTask. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <Link href="/privacy-policy" className="hover:text-violet-600 transition-colors">Privacy Policy</Link>
            <Link href="/terms-of-use" className="hover:text-violet-600 transition-colors">Terms of Use</Link>
            <Link href="/help-center" className="hover:text-violet-600 transition-colors">Help Center</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
