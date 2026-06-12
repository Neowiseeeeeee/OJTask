import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  Users, 
  FileText, 
  ClipboardList, 
  ArrowRight,
  TrendingUp,
  Layout,
  Briefcase,
  GraduationCap
} from "lucide-react";

export function BoldEnergetic() {
  useEffect(() => {
    // Inject Space Grotesk font
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  return (
    <div className="min-h-screen bg-white text-zinc-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b-4 border-zinc-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-sm transform rotate-3 flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-full"></div>
          </div>
          <span className="text-2xl font-bold tracking-tight">OJTask</span>
        </div>
        <div className="hidden md:flex items-center gap-8 font-medium">
          <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
          <a href="#roles" className="hover:text-orange-500 transition-colors">Who it's for</a>
          <a href="#how-it-works" className="hover:text-emerald-500 transition-colors">How it works</a>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="font-bold hover:bg-zinc-100 hidden sm:flex">Log In</Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-none border-2 border-transparent hover:border-zinc-900 transition-all shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
            Get Started Free
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-20 md:py-32 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="inline-block bg-orange-500 text-white px-4 py-2 font-bold transform -rotate-2 border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
            #1 OJT Platform in the Philippines
          </div>
          <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight">
            Stop Coordinating Internships Over <span className="text-blue-600 underline decoration-8 decoration-emerald-400 underline-offset-8">Group Chats</span>
          </h1>
          <p className="text-xl md:text-2xl text-zinc-600 font-medium max-w-lg leading-relaxed">
            Your Internship, Actually Organized. Connect students, supervisors, and coordinators in one energetic workspace.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button className="h-14 px-8 text-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-none border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all w-full sm:w-auto">
              Try It Free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" className="h-14 px-8 text-lg font-bold rounded-none border-2 border-zinc-900 hover:bg-zinc-100 w-full sm:w-auto">
              Book a Demo
            </Button>
          </div>
        </div>
        <div className="relative">
          <div className="absolute inset-0 bg-blue-600 transform translate-x-4 translate-y-4 rounded-3xl border-4 border-zinc-900"></div>
          <img 
            src="/__mockup/images/hero-bold.png" 
            alt="Students collaborating" 
            className="relative w-full h-[500px] object-cover rounded-3xl border-4 border-zinc-900 shadow-2xl"
          />
        </div>
      </section>

      {/* Stats Strip */}
      <section className="bg-zinc-900 text-white py-16 border-y-4 border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center space-y-2">
            <h3 className="text-5xl md:text-6xl font-bold text-emerald-400">10k+</h3>
            <p className="text-lg font-medium text-zinc-300">Students Onboarded</p>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-5xl md:text-6xl font-bold text-blue-400">500+</h3>
            <p className="text-lg font-medium text-zinc-300">Companies</p>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-5xl md:text-6xl font-bold text-orange-400">50+</h3>
            <p className="text-lg font-medium text-zinc-300">Partner Schools</p>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-5xl md:text-6xl font-bold text-pink-400">99%</h3>
            <p className="text-lg font-medium text-zinc-300">Satisfaction</p>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section id="roles" className="py-24 px-6 bg-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">One Platform. <span className="text-blue-600">Three Worlds.</span></h2>
            <p className="text-xl text-zinc-600 max-w-2xl mx-auto font-medium">Everyone gets the tools they need without the clutter.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="rounded-none border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] bg-white overflow-hidden group">
              <div className="h-4 bg-emerald-500 w-full border-b-4 border-zinc-900"></div>
              <CardHeader>
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center border-2 border-zinc-900 mb-4 group-hover:scale-110 transition-transform">
                  <GraduationCap className="h-8 w-8 text-emerald-600" />
                </div>
                <CardTitle className="text-2xl font-bold">For Students</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-zinc-600 font-medium text-lg">Focus on learning, not paperwork. Log hours, manage tasks, and communicate with your supervisor easily.</p>
                <ul className="space-y-2 font-medium">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-500" /> One-tap attendance</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-500" /> Clear task boards</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-500" /> Instant feedback</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="rounded-none border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] bg-white overflow-hidden group">
              <div className="h-4 bg-blue-600 w-full border-b-4 border-zinc-900"></div>
              <CardHeader>
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center border-2 border-zinc-900 mb-4 group-hover:scale-110 transition-transform">
                  <Briefcase className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl font-bold">For Supervisors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-zinc-600 font-medium text-lg">Guide interns efficiently without adding overhead to your daily workload.</p>
                <ul className="space-y-2 font-medium">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-blue-600" /> Bulk hour approvals</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-blue-600" /> Daily scrum updates</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-blue-600" /> Easy evaluations</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="rounded-none border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] bg-white overflow-hidden group">
              <div className="h-4 bg-orange-500 w-full border-b-4 border-zinc-900"></div>
              <CardHeader>
                <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center border-2 border-zinc-900 mb-4 group-hover:scale-110 transition-transform">
                  <Layout className="h-8 w-8 text-orange-600" />
                </div>
                <CardTitle className="text-2xl font-bold">For Coordinators</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-zinc-600 font-medium text-lg">Bird's-eye view of every student's progress across dozens of partner companies.</p>
                <ul className="space-y-2 font-medium">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-orange-500" /> Real-time analytics</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-orange-500" /> Document tracking</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-orange-500" /> Intervention alerts</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div className="space-y-4 max-w-2xl">
              <h2 className="text-4xl md:text-6xl font-bold">Everything you need.<br/>Nothing you don't.</h2>
            </div>
            <Button className="h-12 px-6 text-lg bg-zinc-900 text-white font-bold rounded-none border-2 border-zinc-900 hover:bg-zinc-800 shadow-[4px_4px_0px_0px_rgba(59,130,246,1)]">
              View All Features
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Time Tracking", desc: "Log daily hours with easy supervisor sign-off.", icon: Clock, color: "text-blue-600", bg: "bg-blue-100", border: "border-blue-600" },
              { title: "Daily Scrum", desc: "Quick status check-ins to keep everyone aligned.", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-100", border: "border-emerald-500" },
              { title: "Task Board", desc: "Kanban-style task management for real work.", icon: ClipboardList, color: "text-orange-500", bg: "bg-orange-100", border: "border-orange-500" },
              { title: "Attendance", desc: "One-tap mark present/absent with geofencing.", icon: CheckCircle2, color: "text-pink-500", bg: "bg-pink-100", border: "border-pink-500" },
              { title: "Document Hub", desc: "Upload MOAs, reports, and endorsement letters.", icon: FileText, color: "text-purple-600", bg: "bg-purple-100", border: "border-purple-600" },
              { title: "Team Chat", desc: "Channel-based communication for quick questions.", icon: MessageSquare, color: "text-yellow-600", bg: "bg-yellow-100", border: "border-yellow-600" },
            ].map((feature, i) => (
              <Card key={i} className={`rounded-none border-4 border-zinc-900 bg-white hover:-translate-y-2 transition-transform duration-300`}>
                <CardContent className="p-6 space-y-4">
                  <div className={`w-12 h-12 ${feature.bg} rounded-none border-2 border-zinc-900 flex items-center justify-center transform -rotate-3`}>
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="text-zinc-600 font-medium">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6 bg-emerald-400 border-y-4 border-zinc-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-zinc-900">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "School Sets Up", desc: "Coordinators add students and partner companies." },
              { step: "02", title: "Students Connect", desc: "Interns join their designated company workspace." },
              { step: "03", title: "Track Progress", desc: "Log hours, complete tasks, and do daily scrums." },
              { step: "04", title: "Complete OJT", desc: "Supervisors evaluate and schools approve." }
            ].map((item, i) => (
              <div key={i} className="relative bg-white p-6 border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] transform hover:-translate-y-2 transition-transform">
                <div className="absolute -top-6 -right-6 w-12 h-12 bg-blue-600 text-white font-bold text-xl flex items-center justify-center border-4 border-zinc-900 rounded-full">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold mb-2 mt-4">{item.title}</h3>
                <p className="text-zinc-600 font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-32 px-6 bg-white text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <h2 className="text-5xl md:text-7xl font-bold leading-tight">Ready to upgrade your internship program?</h2>
          <p className="text-2xl text-zinc-600 font-medium">Join 50+ schools already using OJTask.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button className="h-16 px-10 text-xl bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-none border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all">
              Get Started Free
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-900 text-zinc-400 py-12 px-6 border-t-4 border-zinc-900">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white">
              <div className="w-6 h-6 bg-blue-600 rounded-sm transform rotate-3 flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
              <span className="text-xl font-bold tracking-tight">OJTask</span>
            </div>
            <p className="font-medium">Your Internship, Actually Organized.</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Product</h4>
            <ul className="space-y-2 font-medium">
              <li><a href="#" className="hover:text-emerald-400">Features</a></li>
              <li><a href="#" className="hover:text-emerald-400">Pricing</a></li>
              <li><a href="#" className="hover:text-emerald-400">Case Studies</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Company</h4>
            <ul className="space-y-2 font-medium">
              <li><a href="#" className="hover:text-emerald-400">About</a></li>
              <li><a href="#" className="hover:text-emerald-400">Careers</a></li>
              <li><a href="#" className="hover:text-emerald-400">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Legal</h4>
            <ul className="space-y-2 font-medium">
              <li><a href="#" className="hover:text-emerald-400">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-emerald-400">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t border-zinc-800 text-center font-medium text-sm">
          &copy; {new Date().getFullYear()} OJTask. All rights reserved. Designed with energy.
        </div>
      </footer>
    </div>
  );
}
