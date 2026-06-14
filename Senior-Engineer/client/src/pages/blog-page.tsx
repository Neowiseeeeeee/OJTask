import { Link } from "wouter";
import { ArrowRight, Clock, BookOpen, ChevronRight } from "lucide-react";
import { blogPosts } from "@/data/blog-posts";
import { useTheme } from "@/components/theme-provider";

export default function BlogPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const pageBg = isDark
    ? "linear-gradient(160deg, #160d35 0%, #2a1260 20%, #1a0d45 45%, #0f0820 70%, #1a0a3e 100%)"
    : "linear-gradient(160deg, #f0ebff 0%, #e8d9ff 20%, #f5f0ff 55%, #faf7ff 100%)";

  return (
    <div className="min-h-screen text-slate-900 dark:text-white" style={{ background: pageBg }}>

      {/* Nav */}
      <nav className="border-b border-slate-200/60 dark:border-white/8 bg-white/80 dark:bg-[#0d0f1a]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center gap-4">
          <Link href="/">
            <img src="/ojtask-logo.png" className="h-12 w-auto object-contain mt-1" alt="OJTask logo" />
          </Link>
          <div className="flex-1" />
          <Link href="/" className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">← Back to Home</Link>
        </div>
      </nav>

      {/* Header */}
      <div className="max-w-5xl mx-auto px-6 pt-20 pb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-100 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-700/50 text-violet-700 dark:text-violet-300 text-sm font-semibold mb-6">
          <BookOpen className="w-3.5 h-3.5" /> OJTask Blog
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-slate-900 dark:text-white">
          Guides for Filipino Interns,<br />
          <span className="text-violet-600 dark:text-violet-300">Supervisors &amp; Coordinators</span>
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-300 max-w-2xl">
          Practical advice on OJT hours tracking, daily scrums, document requirements, and everything else that makes Philippine internships less stressful.
        </p>
      </div>

      {/* Posts */}
      <div className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}>
              <article
                className="group rounded-2xl p-7 h-full flex flex-col gap-4 cursor-pointer hover:-translate-y-1 transition-all duration-300"
                style={{
                  background: isDark ? "rgba(255,255,255,0.07)" : "#ffffff",
                  border: isDark ? "1px solid rgba(255,255,255,0.14)" : "1px solid #e2e8f0",
                  boxShadow: isDark ? "0 2px 16px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.06)",
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">
                    {post.category}
                  </span>
                </div>
                <div className="flex-1">
                  <h2 className="text-base font-black text-slate-900 dark:text-white mb-2 leading-snug group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                    {post.description}
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-white/8">
                  <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{post.readTime}</span>
                  <span className="flex items-center gap-1 text-violet-600 dark:text-violet-400 font-semibold group-hover:gap-2 transition-all">
                    Read <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="border-t border-slate-200/60 dark:border-white/8">
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Ready to organize your OJT?</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">OJTask is free. Set up your internship workspace in under five minutes.</p>
          <Link href="/auth">
            <button className="inline-flex items-center gap-2 px-7 h-12 rounded-full bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm transition-colors shadow-lg shadow-violet-500/25">
              Get Started Free <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
