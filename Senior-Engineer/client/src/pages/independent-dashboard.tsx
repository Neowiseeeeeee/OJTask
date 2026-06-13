import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useTimeLogs, useTasks, useScrums, useDocuments } from "@/hooks/use-features";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Clock, CheckCircle2, ListTodo, FileText, ClipboardList,
  Plus, TrendingUp, Zap, Target, Upload, ArrowRight, Circle,
  CalendarDays, Users
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

export function IndependentDashboard() {
  const { user } = useAuth();

  const { data: logs = [] } = useTimeLogs(null);
  const { data: tasks = [] } = useTasks(null);
  const { data: scrums = [] } = useScrums(null);
  const { data: docs = [] } = useDocuments(null);

  const totalHours = logs.reduce((s, l) => s + l.hours, 0);
  const approvedScrumHours = scrums.filter(s => s.isApproved).reduce((s, sc) => s + (sc.timeSpent ?? 0), 0);
  const combinedHours = totalHours + approvedScrumHours;

  const doneTasks = tasks.filter(t => t.status === "done").length;
  const pendingTasks = tasks.filter(t => t.status !== "done").length;
  const todoTasks = tasks.filter(t => t.status === "todo").length;
  const doingTasks = tasks.filter(t => t.status === "doing").length;
  const taskPct = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });
  const chartData = last7.map(date => ({
    name: format(new Date(date + "T00:00:00"), "EEE"),
    hours: logs.filter(l => l.date === date).reduce((s, l) => s + l.hours, 0),
  }));

  const recentLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  const recentScrums = [...scrums].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);

  const stats = [
    { label: "Hours Tracked", value: `${combinedHours}h`, icon: Clock, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/40", href: "/time-logs" },
    { label: "Tasks Done", value: doneTasks, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40", href: "/tasks" },
    { label: "Scrums Filed", value: scrums.length, icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/40", href: "/scrums" },
    { label: "Documents Saved", value: docs.length, icon: FileText, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/40", href: "/documents" },
  ];

  const quickActions = [
    { label: "Log Time", href: "/time-logs", icon: Clock, desc: "Record your working hours" },
    { label: "New Task", href: "/tasks", icon: ListTodo, desc: "Add a personal task" },
    { label: "Daily Scrum", href: "/scrums", icon: ClipboardList, desc: "Submit today's report" },
    { label: "Upload Document", href: "/documents", icon: Upload, desc: "Store personal files" },
  ];

  const firstName = user?.firstName || user?.name?.split(" ")[0] || "there";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-display font-bold">Welcome back, {firstName} 👋</h1>
            <Badge className="bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800/50 font-semibold px-3">
              <Zap className="w-3 h-3 mr-1" /> Independent Mode
            </Badge>
          </div>
          <p className="text-muted-foreground">Your personal workspace — track work, manage tasks, and store documents independently.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="border-border/50 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer">
              <CardContent className="p-4">
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <p className="text-2xl font-display font-black">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hours chart */}
        <Card className="border-border/50 shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">Hours This Week</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {combinedHours === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-center text-muted-foreground">
                <Clock className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">No hours logged yet this week</p>
                <Link href="/time-logs">
                  <Button variant="outline" size="sm" className="mt-3 gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Log your first hours
                  </Button>
                </Link>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`${v}h`, "Hours"]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Task Progress */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">Task Progress</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-center text-muted-foreground">
                <ListTodo className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">No tasks yet</p>
                <Link href="/tasks">
                  <Button variant="outline" size="sm" className="mt-3 gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Add a task
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{doneTasks} of {tasks.length} done</span>
                  <span className="text-2xl font-display font-black text-primary">{taskPct}%</span>
                </div>
                <Progress value={taskPct} className="h-2.5" />
                <div className="space-y-2 pt-1">
                  {[
                    { label: "To Do", count: todoTasks, icon: Circle, color: "text-slate-400" },
                    { label: "In Progress", count: doingTasks, icon: Clock, color: "text-blue-500" },
                    { label: "Done", count: doneTasks, icon: CheckCircle2, color: "text-emerald-500" },
                  ].map(({ label, count, icon: Icon, color }) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-3.5 h-3.5 ${color}`} />
                        <span className="text-muted-foreground">{label}</span>
                      </div>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Time Logs */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">Recent Time Logs</CardTitle>
            </div>
            <Link href="/time-logs">
              <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground hover:text-foreground">
                View all <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentLogs.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                <p>No time logs yet.</p>
                <Link href="/time-logs">
                  <Button variant="outline" size="sm" className="mt-2 gap-1.5"><Plus className="w-3.5 h-3.5" />Log time</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-violet-400 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{log.date ? (() => { try { return format(new Date(log.date + "T00:00:00"), "MMM d, yyyy"); } catch { return log.date; } })() : "—"}</p>
                        {log.description && <p className="text-xs text-muted-foreground truncate max-w-[180px]">{log.description}</p>}
                      </div>
                    </div>
                    <Badge variant="outline" className="font-mono text-xs shrink-0">{log.hours}h</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Scrums */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">Recent Scrums</CardTitle>
            </div>
            <Link href="/scrums">
              <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground hover:text-foreground">
                View all <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentScrums.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                <p>No scrums filed yet.</p>
                <Link href="/scrums">
                  <Button variant="outline" size="sm" className="mt-2 gap-1.5"><Plus className="w-3.5 h-3.5" />Submit scrum</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentScrums.map((scrum) => (
                  <div key={scrum.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${scrum.isApproved ? "bg-emerald-400" : "bg-amber-400"}`} />
                      <div>
                        <p className="text-sm font-medium">{scrum.date ? (() => { try { return format(new Date(scrum.date + "T00:00:00"), "MMM d, yyyy"); } catch { return scrum.date; } })() : "—"}</p>
                        <p className="text-xs text-muted-foreground">{scrum.timeSpent}h logged • {scrum.completionPercentage}% complete</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-xs shrink-0 ${scrum.isApproved ? "text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30" : "text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30"}`}>
                      {scrum.isApproved ? "Approved" : "Pending"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <Link key={action.label} href={action.href}>
                <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/50 bg-muted/20 hover:bg-primary/5 hover:border-primary/30 transition-all cursor-pointer text-center group">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                    <action.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{action.label}</p>
                    <p className="text-[11px] text-muted-foreground leading-tight">{action.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Join Space CTA */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/0 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">Ready to join a team?</p>
              <p className="text-sm text-muted-foreground">Join a space with a join code to collaborate with your supervisor and get evaluations.</p>
            </div>
            <Link href="/profile">
              <Button className="gap-2 shrink-0">
                Join a Space <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
