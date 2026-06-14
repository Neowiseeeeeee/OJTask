import { Link, useParams } from "wouter";
import { useEffect } from "react";
import { ArrowLeft, Clock, ArrowRight, BookOpen } from "lucide-react";
import { getBlogPost, blogPosts } from "@/data/blog-posts";
import { useTheme } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";

function renderMarkdown(content: string, isDark: boolean): JSX.Element[] {
  const elements: JSX.Element[] = [];
  const lines = content.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="text-2xl font-black text-slate-900 dark:text-white mt-10 mb-4">
          {line.replace("## ", "")}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="text-lg font-black text-slate-900 dark:text-white mt-8 mb-3">
          {line.replace("### ", "")}
        </h3>
      );
    } else if (line.startsWith("---")) {
      elements.push(<hr key={i} className="border-slate-200 dark:border-white/10 my-8" />);
    } else if (line.startsWith("- [ ] ")) {
      elements.push(
        <div key={i} className="flex items-start gap-3 py-1.5">
          <span className="mt-0.5 w-4 h-4 rounded border-2 border-slate-300 dark:border-white/30 shrink-0" />
          <span className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{line.replace("- [ ] ", "")}</span>
        </div>
      );
    } else if (line.startsWith("- ")) {
      elements.push(
        <div key={i} className="flex items-start gap-3 py-1">
          <span className="mt-2 w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />
          <span className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatInline(line.replace("- ", "")) }}
          />
        </div>
      );
    } else if (line.startsWith("**") && line.endsWith("**")) {
      elements.push(
        <p key={i} className="font-black text-slate-900 dark:text-white mt-6 mb-2">
          {line.replace(/\*\*/g, "")}
        </p>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(
        <p key={i} className="text-slate-600 dark:text-slate-300 leading-relaxed text-base"
          dangerouslySetInnerHTML={{ __html: formatInline(line) }}
        />
      );
    }
    i++;
  }
  return elements;
}

function formatInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, `<code class="bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-sm font-mono text-violet-700 dark:text-violet-300">$1</code>`);
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const post = getBlogPost(slug);

  useEffect(() => {
    if (!post) return;

    document.title = `${post.title} — OJTask Blog`;

    const setMeta = (sel: string, attr: string, val: string) => {
      let el = document.querySelector(sel) as HTMLMetaElement | null;
      const created = !el;
      if (created) {
        el = document.createElement("meta");
        const [a, v] = attr.split("=");
        el.setAttribute(a, v ?? attr);
        document.head.appendChild(el);
      }
      const prev = el!.content;
      el!.content = val;
      return () => { if (created) el!.remove(); else el!.content = prev; };
    };

    const pageUrl = `https://ojtask.onrender.com/blog/${post.slug}`;

    const cleanups = [
      setMeta('meta[name="description"]',        'name=description',        post.description),
      setMeta('meta[property="og:title"]',        'property=og:title',       `${post.title} — OJTask Blog`),
      setMeta('meta[property="og:description"]',  'property=og:description', post.description),
      setMeta('meta[property="og:url"]',          'property=og:url',         pageUrl),
      setMeta('meta[property="og:type"]',         'property=og:type',        'article'),
      setMeta('meta[property="og:site_name"]',    'property=og:site_name',   'OJTask'),
      setMeta('meta[name="twitter:card"]',        'name=twitter:card',       'summary'),
      setMeta('meta[name="twitter:title"]',       'name=twitter:title',      `${post.title} — OJTask Blog`),
      setMeta('meta[name="twitter:description"]', 'name=twitter:description',post.description),
    ];

    return () => {
      document.title = "OJTask";
      cleanups.forEach(fn => fn?.());
    };
  }, [post]);

  if (!post) return <NotFound />;

  const otherPosts = blogPosts.filter((p) => p.slug !== slug).slice(0, 2);
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
          <Link href="/blog" className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" /> All posts
          </Link>
        </div>
      </nav>

      {/* Article */}
      <article className="max-w-2xl mx-auto px-6 pt-16 pb-24">

        {/* Meta */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">
            {post.category}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
            <Clock className="w-3 h-3" />{post.readTime}
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500">{post.date}</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight mb-6 text-slate-900 dark:text-white">
          {post.title}
        </h1>

        {/* Description */}
        <p className="text-lg text-slate-500 dark:text-slate-300 leading-relaxed mb-10 pb-10 border-b border-slate-200 dark:border-white/10">
          {post.description}
        </p>

        {/* Content */}
        <div className="space-y-1">
          {renderMarkdown(post.content, isDark)}
        </div>

        {/* CTA */}
        <div
          className="mt-16 rounded-2xl p-8 text-center"
          style={{
            background: isDark ? "rgba(124,58,237,0.2)" : "#f5f3ff",
            border: isDark ? "1px solid rgba(167,139,250,0.3)" : "1px solid #ddd6fe",
          }}
        >
          <BookOpen className="w-8 h-8 text-violet-500 mx-auto mb-3" />
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Try OJTask for free</h3>
          <p className="text-sm text-slate-500 dark:text-slate-300 mb-5">The free OJT management platform built for Philippine interns, supervisors, and school coordinators.</p>
          <Link href="/auth">
            <button className="inline-flex items-center gap-2 px-6 h-11 rounded-full bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm transition-colors">
              Get Started Free <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>

        {/* Related posts */}
        {otherPosts.length > 0 && (
          <div className="mt-16">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-5">More from the blog</h3>
            <div className="space-y-4">
              {otherPosts.map((p) => (
                <Link key={p.slug} href={`/blog/${p.slug}`}>
                  <div
                    className="group rounded-xl p-5 flex items-center justify-between gap-4 cursor-pointer hover:-translate-y-0.5 transition-all"
                    style={{
                      background: isDark ? "rgba(255,255,255,0.06)" : "#ffffff",
                      border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid #e2e8f0",
                    }}
                  >
                    <div>
                      <p className="text-xs text-violet-500 dark:text-violet-400 font-semibold mb-1">{p.category} · {p.readTime}</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors leading-snug">{p.title}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0 group-hover:text-violet-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
