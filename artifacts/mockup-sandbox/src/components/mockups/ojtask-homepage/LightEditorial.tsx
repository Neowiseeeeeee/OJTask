import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  Users, 
  FileText, 
  Kanban,
  Calendar,
  Building,
  GraduationCap,
  ArrowRight,
  Menu
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function LightEditorial() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 font-sans">
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap');
        .font-serif { font-family: 'Playfair Display', serif; }
        .font-sans { font-family: 'Inter', sans-serif; }
      `}} />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#FDFBF7]/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center">
              <span className="text-[#FDFBF7] font-serif font-bold text-lg leading-none">O</span>
            </div>
            <span className="font-serif font-bold text-xl tracking-tight">OJTask</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#roles" className="hover:text-slate-900 transition-colors">For Who</a>
            <a href="#how" className="hover:text-slate-900 transition-colors">How it Works</a>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" className="font-medium">Log in</Button>
            <Button className="bg-slate-900 text-white hover:bg-slate-800 rounded-full px-6">
              Try It Free
            </Button>
          </div>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-20 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="max-w-xl">
              <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.1] mb-8 text-slate-900">
                Your Internship,<br />
                <span className="italic text-slate-600">Actually Organized.</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed font-light">
                Stop coordinating internships over group chats. A single, refined workspace for students, supervisors, and coordinators to track progress together.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-slate-900 text-white hover:bg-slate-800 rounded-full px-8 text-base h-14">
                  Get Started Free
                </Button>
                <Button size="lg" variant="outline" className="rounded-full px-8 text-base h-14 border-slate-300">
                  Book a Demo
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <img 
                  src="/__mockup/images/hero-editorial.png" 
                  alt="Students working in a bright office" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-[#F0EBE1] rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
              <div className="absolute -top-8 -right-8 w-48 h-48 bg-[#E6EEF2] rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-slate-200/50 bg-[#FAF8F3]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-slate-200/50">
            <div className="text-center px-4">
              <p className="font-serif text-4xl font-semibold text-slate-900 mb-2">10k+</p>
              <p className="text-sm text-slate-500 uppercase tracking-wider">Students Onboarded</p>
            </div>
            <div className="text-center px-4">
              <p className="font-serif text-4xl font-semibold text-slate-900 mb-2">500+</p>
              <p className="text-sm text-slate-500 uppercase tracking-wider">Partner Companies</p>
            </div>
            <div className="text-center px-4">
              <p className="font-serif text-4xl font-semibold text-slate-900 mb-2">50+</p>
              <p className="text-sm text-slate-500 uppercase tracking-wider">Universities</p>
            </div>
            <div className="text-center px-4">
              <p className="font-serif text-4xl font-semibold text-slate-900 mb-2">99%</p>
              <p className="text-sm text-slate-500 uppercase tracking-wider">Completion Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section id="roles" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-serif text-4xl md:text-5xl font-semibold mb-6">Designed for Every Role</h2>
            <p className="text-lg text-slate-600 font-light">A unified platform that adapts to what you need, whether you're doing the work, guiding it, or overseeing the program.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-sm bg-white overflow-hidden group">
              <div className="w-1.5 h-full absolute left-0 bg-[#E8C2B3] top-0 bottom-0"></div>
              <CardContent className="p-8 relative pl-10">
                <div className="w-12 h-12 bg-[#F9F0ED] rounded-xl flex items-center justify-center mb-6 text-[#A67B68] group-hover:scale-110 transition-transform">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <h3 className="font-serif text-2xl font-semibold mb-3">For Students</h3>
                <p className="text-slate-600 font-light leading-relaxed mb-6">
                  Log your hours, track tasks, and communicate with your supervisor without switching between five different apps.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-sm text-slate-600"><CheckCircle2 className="h-4 w-4 text-[#A67B68]" /> Daily time tracking</li>
                  <li className="flex items-center gap-3 text-sm text-slate-600"><CheckCircle2 className="h-4 w-4 text-[#A67B68]" /> Easy file uploads</li>
                  <li className="flex items-center gap-3 text-sm text-slate-600"><CheckCircle2 className="h-4 w-4 text-[#A67B68]" /> Direct chat</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white overflow-hidden group">
              <div className="w-1.5 h-full absolute left-0 bg-[#AEC2D6] top-0 bottom-0"></div>
              <CardContent className="p-8 relative pl-10">
                <div className="w-12 h-12 bg-[#F0F4F8] rounded-xl flex items-center justify-center mb-6 text-[#6B8BAA] group-hover:scale-110 transition-transform">
                  <Building className="h-6 w-6" />
                </div>
                <h3 className="font-serif text-2xl font-semibold mb-3">For Supervisors</h3>
                <p className="text-slate-600 font-light leading-relaxed mb-6">
                  Review timesheets, assign tasks, and monitor progress without the administrative overhead.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-sm text-slate-600"><CheckCircle2 className="h-4 w-4 text-[#6B8BAA]" /> One-click approvals</li>
                  <li className="flex items-center gap-3 text-sm text-slate-600"><CheckCircle2 className="h-4 w-4 text-[#6B8BAA]" /> Kanban task boards</li>
                  <li className="flex items-center gap-3 text-sm text-slate-600"><CheckCircle2 className="h-4 w-4 text-[#6B8BAA]" /> Quick status updates</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white overflow-hidden group">
              <div className="w-1.5 h-full absolute left-0 bg-[#C3CFA2] top-0 bottom-0"></div>
              <CardContent className="p-8 relative pl-10">
                <div className="w-12 h-12 bg-[#F5F7EF] rounded-xl flex items-center justify-center mb-6 text-[#7A8A53] group-hover:scale-110 transition-transform">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="font-serif text-2xl font-semibold mb-3">For Coordinators</h3>
                <p className="text-slate-600 font-light leading-relaxed mb-6">
                  Get a bird's-eye view of every student across multiple companies. No more chasing down requirements.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-sm text-slate-600"><CheckCircle2 className="h-4 w-4 text-[#7A8A53]" /> Master dashboard</li>
                  <li className="flex items-center gap-3 text-sm text-slate-600"><CheckCircle2 className="h-4 w-4 text-[#7A8A53]" /> Document hub</li>
                  <li className="flex items-center gap-3 text-sm text-slate-600"><CheckCircle2 className="h-4 w-4 text-[#7A8A53]" /> Attendance reports</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 bg-[#FAF8F3]">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <h2 className="font-serif text-4xl md:text-5xl font-semibold mb-6">Everything You Need</h2>
            <p className="text-lg text-slate-600 font-light max-w-2xl">Six powerful modules, seamlessly integrated. We stripped away the bloat to focus entirely on what makes internships successful.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Clock, title: "Time Tracking", desc: "Log daily hours with precise clock-ins and transparent supervisor sign-offs.", color: "text-blue-600", bg: "bg-blue-50" },
              { icon: MessageSquare, title: "Daily Scrum", desc: "Quick asynchronous status check-ins to keep everyone aligned without meetings.", color: "text-orange-600", bg: "bg-orange-50" },
              { icon: Kanban, title: "Task Board", desc: "Visual Kanban-style management for assigning and tracking internship duties.", color: "text-emerald-600", bg: "bg-emerald-50" },
              { icon: Calendar, title: "Attendance", desc: "One-tap functionality to mark present or absent with geolocation support.", color: "text-purple-600", bg: "bg-purple-50" },
              { icon: FileText, title: "Document Hub", desc: "Securely upload and manage endorsement letters, MOAs, and final reports.", color: "text-rose-600", bg: "bg-rose-50" },
              { icon: Users, title: "Team Chat", desc: "Organized, channel-based communication keeping conversations professional.", color: "text-indigo-600", bg: "bg-indigo-50" },
            ].map((feature, i) => (
              <div key={i} className="group p-8 rounded-2xl bg-white border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${feature.bg} ${feature.color}`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h4 className="font-serif text-xl font-semibold mb-3">{feature.title}</h4>
                <p className="text-slate-600 font-light leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-serif text-4xl md:text-5xl font-semibold mb-6">A Clear Path Forward</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-[1px] bg-slate-200" />
            
            {[
              { step: "01", title: "Setup Workspace", desc: "School coordinator invites companies and creates the initial batch." },
              { step: "02", title: "Onboard Students", desc: "Students join their designated company and submit required documents." },
              { step: "03", title: "Track Progress", desc: "Daily logging of hours, tasks, and regular scrum updates." },
              { step: "04", title: "Final Review", desc: "Supervisors approve hours, evaluate performance, and sign off." }
            ].map((item, i) => (
              <div key={i} className="relative z-10">
                <div className="w-24 h-24 mx-auto bg-white border border-slate-200 rounded-full flex items-center justify-center mb-6 shadow-sm">
                  <span className="font-serif text-2xl font-semibold text-slate-400">{item.step}</span>
                </div>
                <h4 className="font-serif text-xl font-semibold text-center mb-3">{item.title}</h4>
                <p className="text-slate-600 text-center font-light text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-slate-900 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-4xl md:text-5xl font-semibold mb-8">Ready to bring clarity to your internship program?</h2>
          <p className="text-slate-400 text-lg mb-10 font-light max-w-xl mx-auto">
            Join the hundreds of schools and companies already using OJTask to manage their training programs effectively.
          </p>
          <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 rounded-full px-10 text-lg h-14">
            Start Your Free Trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-200">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-slate-900 flex items-center justify-center">
              <span className="text-[#FDFBF7] font-serif font-bold text-sm leading-none">O</span>
            </div>
            <span className="font-serif font-bold text-lg tracking-tight">OJTask</span>
          </div>
          <div className="flex gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Support</a>
          </div>
          <div className="text-sm text-slate-400">
            © {new Date().getFullYear()} OJTask. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
