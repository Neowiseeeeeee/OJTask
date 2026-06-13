import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useSpace } from "@/hooks/use-space";
import { useSpaceSettings } from "@/hooks/use-space-settings";
import {
  useTasks, useTimeLogs, useScrums, useAttendance, useDocuments,
  useSpaceMembers, useAnnouncements, useCreateAnnouncement, useEvaluations
} from "@/hooks/use-features";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Clock, CheckCircle2, ListTodo, AlertCircle, Users, FileText,
  CalendarDays, ClipboardList, TrendingUp, ShieldCheck, Megaphone, Plus, Target,
  Copy, Link2, UserPlus
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { UserCardWithPicture } from "@/components/user-card-with-picture";
import { UserProfileModal } from "@/components/user-profile-modal";

function JoinCodeWidget({ code, isManager }: { code: string | null; isManager: boolean }) {
  const { toast } = useToast();
  if (!code) return null;
  const copy = () => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied!", description: `Join code "${code}" copied to clipboard.` });
  };
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border ${isManager ? "bg-primary/5 border-primary/20" : "bg-muted/40 border-border/50"}`}>
      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
        {isManager ? <UserPlus className="w-5 h-5" /> : <Link2 className="w-5 h-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground font-medium">{isManager ? "Share this code to invite interns" : "Space Join Code"}</p>
        <p className="font-display font-black text-xl tracking-widest text-primary">{code}</p>
      </div>
      <Button variant="outline" size="sm" onClick={copy} className="gap-1.5 shrink-0" data-testid="button-copy-join-code">
        <Copy className="w-3.5 h-3.5" /> Copy
      </Button>
    </div>
  );
}

function OJTProgressBar({ logged, target }: { logged: number; target: number }) {
  const pct = Math.min(Math.round((logged / target) * 100), 100);
  const remaining = Math.max(target - logged, 0);
  const color = pct >= 100 ? "text-emerald-600" : pct >= 60 ? "text-primary" : "text-amber-600";
  return (
    <Card className="border-border/50 shadow-sm bg-gradient-to-br from-primary/5 to-primary/0">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm">OJT Hour Progress</span>
          </div>
          <span className={`text-2xl font-display font-black ${color}`}>{pct}%</span>
        </div>
        <Progress value={pct} className="h-3 mb-3" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span><span className="font-bold text-foreground">{logged}h</span> completed</span>
          <span><span className="font-bold text-foreground">{remaining}h</span> remaining of {target}h target</span>
        </div>
        {pct >= 100 && (
          <div className="mt-3 text-center text-sm font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg py-1.5">
            <CheckCircle2 className="w-4 h-4 inline mr-1" /> Target hours completed!
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── ANNOUNCEMENTS WIDGET ─────────────────────────────────────────────────────
function AnnouncementsList({ spaceId }: { spaceId: number }) {
  const { data: announcements = [] } = useAnnouncements(spaceId);
  if (announcements.length === 0) return null;
  return (
    <div className="space-y-3">
      {announcements.slice(0, 3).map(ann => (
        <div key={ann.id} className="border-l-4 border-primary/40 pl-4 py-1" data-testid={`announcement-${ann.id}`}>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-semibold text-sm">{ann.title}</span>
            <span className="text-[10px] text-muted-foreground">{ann.date ? (() => { try { return format(new Date(ann.date + "T00:00:00"), "MMM d"); } catch { return ""; } })() : ""}</span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{ann.content}</p>
        </div>
      ))}
    </div>
  );
}

// ─── STUDENT DASHBOARD ────────────────────────────────────────────────────────
function StudentDashboard() {
  const { user } = useAuth();
  const { activeSpace, activeSpaceId, leaveSpace, leaveSpaceMutation } = useSpace();
  const { settings } = useSpaceSettings(activeSpaceId);
  const { data: tasks = [] } = useTasks(activeSpaceId);
  const { data: logs = [] } = useTimeLogs(activeSpaceId);
  const { data: attendance = [] } = useAttendance(activeSpaceId);
  const { data: scrums = [] } = useScrums(activeSpaceId);
  const { data: docs = [] } = useDocuments(activeSpaceId);
  const { data: announcements = [] } = useAnnouncements(activeSpaceId);
  const { data: evals = [] } = useEvaluations(activeSpaceId);

  const [selectedStat, setSelectedStat] = useState<string | null>(null);

  const myLogs = logs.filter(l => l.userId === user?.id);
  const myTasks = tasks.filter(t => t.assignedToId === user?.id || t.authorId === user?.id);
  const myAttendance = attendance.filter(a => a.userId === user?.id);
  const myScrums = scrums.filter(s => s.userId === user?.id);
  const myDocs = docs.filter(d => d.uploaderId === user?.id);
  const myEvals = evals.filter(e => e.evaluateeId === user?.id);

  const logHours = myLogs.reduce((s, l) => s + l.hours, 0);
  const approvedScrumHours = myScrums.filter(s => s.isApproved).reduce((s, sc) => s + (sc.timeSpent ?? 0), 0);
  const totalHours = logHours + approvedScrumHours;
  const targetHours = settings?.totalRequiredHours ?? activeSpace?.targetHours ?? 486;
  const completedTasks = myTasks.filter(t => t.status === "done").length;
  const pendingTasks = myTasks.filter(t => t.status !== "done").length;
  const presentDays = myAttendance.filter(a => a.status === "present").length;
  const pendingDocs = myDocs.filter(d => d.status === "submitted").length;
  const pendingScrums = myScrums.filter(s => !s.isApproved).length;

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });
  const chartData = last7.map(date => ({
    name: format(new Date(date + "T00:00:00"), "EEE"),
    hours: myLogs.filter(l => l.date === date).reduce((s, l) => s + l.hours, 0)
      + myScrums.filter(s => s.isApproved && s.date === date).reduce((s, sc) => s + (sc.timeSpent ?? 0), 0),
  }));

  const stats = [
    { label: "Hours Logged", value: `${totalHours}h`, icon: Clock, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/40" },
    { label: "Tasks Done", value: completedTasks, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
    { label: "Pending Tasks", value: pendingTasks, icon: ListTodo, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/40" },
    { label: "Days Present", value: presentDays, icon: CalendarDays, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/40" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-display font-bold">Welcome back, {user?.name.split(" ")[0]} 👋</h1>
        <p className="text-muted-foreground mt-1">Your personal dashboard for <span className="font-medium text-foreground">{activeSpace?.name}</span></p>
      </div>

      {/* Join Code */}
      {activeSpace?.joinCode && <JoinCodeWidget code={activeSpace.joinCode} isManager={false} />}

      {/* Leave Space - Only show if not owner */}
      {activeSpace && activeSpace.ownerId !== user?.id && (
        <div className="mt-4">
          <Button 
            onClick={() => leaveSpace()}
            variant="destructive" 
            className="gap-2"
            disabled={leaveSpaceMutation.isPending}
          >
            Leave Space
          </Button>
        </div>
      )}

      {/* OJT Hour Progress */}
      <OJTProgressBar logged={totalHours} target={targetHours} />

      {/* Pending Alerts */}
      {(pendingScrums > 0 || pendingDocs > 0) && (
        <div className="flex flex-wrap gap-3">
          {pendingScrums > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 px-4 py-2 rounded-xl text-sm font-medium">
              <ClipboardList className="w-4 h-4" />{pendingScrums} scrum{pendingScrums > 1 ? "s" : ""} awaiting approval
            </div>
          )}
          {pendingDocs > 0 && (
            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-400 px-4 py-2 rounded-xl text-sm font-medium">
              <FileText className="w-4 h-4" />{pendingDocs} document{pendingDocs > 1 ? "s" : ""} pending review
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <button
            key={s.label}
            onClick={() => setSelectedStat(s.label)}
            className="text-left transition-all hover:shadow-md hover:-translate-y-1"
          >
            <Card className="border-border/50 shadow-sm h-full cursor-pointer">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`w-11 h-11 ${s.bg} rounded-xl flex items-center justify-center`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <div className="text-2xl font-display font-bold">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      {/* Stats Detail Modal */}
      <Dialog open={!!selectedStat} onOpenChange={(open) => !open && setSelectedStat(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedStat === "Hours Logged" && "Time Logged"}
              {selectedStat === "Tasks Done" && "Completed Tasks"}
              {selectedStat === "Pending Tasks" && "Pending Tasks"}
              {selectedStat === "Days Present" && "Attendance"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedStat === "Hours Logged" && (
              <div>
                <p className="text-sm text-muted-foreground mb-3">Total hours logged: <span className="font-semibold text-foreground">{totalHours}h / {targetHours}h</span></p>
                <div className="space-y-2">
                  {myLogs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No time logs yet</p>
                  ) : (
                    myLogs.slice(0, 5).map(log => (
                      <div key={log.id} className="flex justify-between text-sm p-2 bg-muted rounded">
                        <span>{log.date}</span>
                        <span className="font-semibold">{log.hours}h</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            {selectedStat === "Tasks Done" && (
              <div>
                <p className="text-sm text-muted-foreground mb-3">Completed: <span className="font-semibold text-emerald-600">{completedTasks}</span> of <span className="font-semibold">{myTasks.length}</span> tasks</p>
                <div className="space-y-2">
                  {myTasks.filter(t => t.status === "done").length === 0 ? (
                    <p className="text-sm text-muted-foreground">No completed tasks yet</p>
                  ) : (
                    myTasks.filter(t => t.status === "done").slice(0, 5).map(task => (
                      <div key={task.id} className="text-sm p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded border border-emerald-200 dark:border-emerald-800/50">
                        <CheckCircle2 className="w-4 h-4 inline text-emerald-600 mr-2" />
                        {task.title}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            {selectedStat === "Pending Tasks" && (
              <div>
                <p className="text-sm text-muted-foreground mb-3">Pending: <span className="font-semibold text-amber-600">{pendingTasks}</span> of <span className="font-semibold">{myTasks.length}</span> tasks</p>
                <div className="space-y-2">
                  {myTasks.filter(t => t.status !== "done").length === 0 ? (
                    <p className="text-sm text-muted-foreground">All tasks completed!</p>
                  ) : (
                    myTasks.filter(t => t.status !== "done").slice(0, 5).map(task => (
                      <div key={task.id} className="text-sm p-2 bg-amber-50 dark:bg-amber-950/20 rounded border border-amber-200 dark:border-amber-800/50">
                        <ListTodo className="w-4 h-4 inline text-amber-600 mr-2" />
                        {task.title}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            {selectedStat === "Days Present" && (
              <div>
                <p className="text-sm text-muted-foreground mb-3">Present: <span className="font-semibold text-blue-600">{presentDays}</span> days</p>
                <div className="space-y-2">
                  {myAttendance.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No attendance records</p>
                  ) : (
                    myAttendance.filter(a => a.status === "present").slice(0, 5).map(att => (
                      <div key={att.id} className="text-sm p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800/50">
                        {att.date}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Chart + Details */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border/50 shadow-sm">
          <CardHeader><CardTitle className="text-base">Hours This Week</CardTitle></CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <Tooltip cursor={{ fill: "hsl(var(--muted))" }} contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                  <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {/* Evaluation summary if any */}
          {myEvals.length > 0 && (
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><span className="text-amber-500">★</span> My Latest Evaluation</CardTitle></CardHeader>
              <CardContent className="pt-0">
                {(() => {
                  const ev = myEvals[myEvals.length - 1];
                  const avg = ((ev.punctuality + ev.attitude + ev.technical + ev.communication + ev.overall) / 5).toFixed(1);
                  return (
                    <div>
                      <div className="text-3xl font-black text-amber-500 mb-1">{avg}<span className="text-base font-normal text-muted-foreground">/5.0</span></div>
                      <div className="capitalize text-xs text-muted-foreground">{ev.type} evaluation</div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-base">My Progress</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Scrums Submitted", value: myScrums.length, badge: `${myScrums.filter(s => s.isApproved).length} approved`, color: "text-violet-600" },
                { label: "Documents", value: myDocs.length, badge: `${myDocs.filter(d => d.status === "approved").length} approved`, color: "text-blue-600" },
                { label: "Attendance Rate", value: myAttendance.length ? `${Math.round((presentDays / myAttendance.length) * 100)}%` : "—", badge: `${presentDays} present`, color: "text-emerald-600" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                  <div>
                    <div className={`text-lg font-bold ${item.color}`}>{item.value}</div>
                    <div className="text-xs text-muted-foreground">{item.label}</div>
                  </div>
                  <Badge variant="secondary" className="text-xs">{item.badge}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center gap-2">
            <Megaphone className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">Announcements</CardTitle>
          </CardHeader>
          <CardContent>
            {activeSpaceId && <AnnouncementsList spaceId={activeSpaceId} />}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── MANAGER DASHBOARD ────────────────────────────────────────────────────────
function ManagerDashboard() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { activeSpace, activeSpaceId, leaveSpace } = useSpace();
  const { settings } = useSpaceSettings(activeSpaceId);
  const { data: members = [] } = useSpaceMembers(activeSpaceId);
  const { data: tasks = [] } = useTasks(activeSpaceId);
  const { data: logs = [] } = useTimeLogs(activeSpaceId);
  const { data: attendance = [] } = useAttendance(activeSpaceId);
  const { data: scrums = [] } = useScrums(activeSpaceId);
  const { data: docs = [] } = useDocuments(activeSpaceId);
  const { data: announcements = [] } = useAnnouncements(activeSpaceId);
  const createAnnouncement = useCreateAnnouncement(activeSpaceId);

  const [annOpen, setAnnOpen] = useState(false);
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");

  const students = members.filter(m => m.user?.role === "student");
  const today = new Date().toISOString().split("T")[0];

  const pendingLogs = logs.filter(l => l.status === "pending").length;
  const pendingScrums = scrums.filter(s => !s.isApproved).length;
  const pendingDocs = docs.filter(d => d.status === "submitted").length;
  const totalPending = pendingLogs + pendingScrums + pendingDocs;

  const todayAttendance = attendance.filter(a => a.date === today);
  const presentToday = todayAttendance.filter(a => a.status === "present").length;

  // Deduplicate tasks by id before counting/displaying
  const uniqueTasks = Array.from(new Map(tasks.map(t => [t.id, t])).values());
  const activeTasks = uniqueTasks.filter(t => t.status !== "done");

  const overviewStats = [
    { key: "interns", label: "Total Interns", value: students.length, icon: Users, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/40" },
    { key: "approvals", label: "Pending Approvals", value: totalPending, icon: AlertCircle, color: totalPending > 0 ? "text-amber-600" : "text-emerald-600", bg: totalPending > 0 ? "bg-amber-50 dark:bg-amber-950/40" : "bg-emerald-50 dark:bg-emerald-950/40" },
    { key: "present", label: "Present Today", value: `${presentToday}/${students.length}`, icon: CalendarDays, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
    { key: "tasks", label: "Tasks Active", value: activeTasks.length, icon: ListTodo, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/40" },
  ];

  const [selectedStat, setSelectedStat] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const studentSummaries = students.map(m => {
    const uid = m.userId;
    const studentLogs = logs.filter(l => l.userId === uid);
    const studentScrums = scrums.filter(s => s.userId === uid);
    const studentAtt = attendance.filter(a => a.userId === uid && a.status === "present").length;
    const studentDocs = docs.filter(d => d.uploaderId === uid);
    const totalHrs = studentLogs.reduce((s, l) => s + l.hours, 0)
      + studentScrums.filter(s => s.isApproved).reduce((s, sc) => s + (sc.timeSpent ?? 0), 0);
    const pendingApprovals = studentLogs.filter(l => l.status === "pending").length + studentScrums.filter(s => !s.isApproved).length;
    const targetHrs = settings?.totalRequiredHours ?? activeSpace?.targetHours ?? 486;
    const pct = Math.min(Math.round((totalHrs / targetHrs) * 100), 100);
    return { member: m, totalHrs, scrumCount: studentScrums.length, presentDays: studentAtt, docsCount: studentDocs.length, pendingApprovals, pct, targetHrs };
  });

  const handlePostAnnouncement = async () => {
    if (!annTitle.trim() || !annContent.trim() || !activeSpaceId) return;
    await createAnnouncement.mutateAsync({
      spaceId: activeSpaceId,
      authorId: user!.id,
      title: annTitle,
      content: annContent,
      date: new Date().toISOString().split("T")[0],
    });
    setAnnOpen(false);
    setAnnTitle("");
    setAnnContent("");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-display font-bold">Oversight Dashboard</h1>
            <Badge className="bg-primary/10 text-primary border-primary/20">{user?.role === "school" ? "School Coordinator" : "Supervisor"}</Badge>
          </div>
          <p className="text-muted-foreground">Managing <span className="font-medium text-foreground">{activeSpace?.name}</span></p>
        </div>
        <Button onClick={() => setAnnOpen(true)} variant="outline" className="gap-2" data-testid="button-post-announcement">
          <Megaphone className="w-4 h-4" /> Post Announcement
        </Button>
      </div>

      {/* Join Code / Invite */}
      {activeSpace?.joinCode && <JoinCodeWidget code={activeSpace.joinCode} isManager={true} />}

      {/* Pending Approvals */}
      {totalPending > 0 && (
        <div className="flex flex-wrap gap-3">
          {pendingLogs > 0 && <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 px-4 py-2 rounded-xl text-sm font-medium"><Clock className="w-4 h-4" />{pendingLogs} time log{pendingLogs > 1 ? "s" : ""} need approval</div>}
          {pendingScrums > 0 && <div className="flex items-center gap-2 bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800/50 text-violet-700 dark:text-violet-400 px-4 py-2 rounded-xl text-sm font-medium"><ClipboardList className="w-4 h-4" />{pendingScrums} scrum{pendingScrums > 1 ? "s" : ""} need review</div>}
          {pendingDocs > 0 && <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-400 px-4 py-2 rounded-xl text-sm font-medium"><FileText className="w-4 h-4" />{pendingDocs} document{pendingDocs > 1 ? "s" : ""} pending review</div>}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewStats.map((s) => (
          <button
            key={s.label}
            onClick={() => setSelectedStat(s.key)}
            className="text-left transition-all hover:shadow-md hover:-translate-y-1"
          >
            <Card className="border-border/50 shadow-sm h-full cursor-pointer">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`w-11 h-11 ${s.bg} rounded-xl flex items-center justify-center`}><s.icon className={`w-5 h-5 ${s.color}`} /></div>
                <div>
                  <div className="text-2xl font-display font-bold">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      {/* Stat Detail Modals */}
      <Dialog open={selectedStat === "interns"} onOpenChange={(open) => !open && setSelectedStat(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Users className="w-4 h-4" /> All Interns ({students.length})</DialogTitle></DialogHeader>
          <div className="space-y-2 py-2 max-h-80 overflow-y-auto">
            {students.length === 0 ? <p className="text-sm text-muted-foreground">No interns have joined yet.</p> : students.map(m => (
              <div key={m.userId} className="flex items-center gap-3 p-2 rounded-lg bg-muted/40">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{m.user?.name?.[0] ?? "?"}</div>
                <div><div className="text-sm font-medium">{m.user?.name}</div><div className="text-xs text-muted-foreground">{m.user?.email}</div></div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={selectedStat === "approvals"} onOpenChange={(open) => !open && setSelectedStat(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Pending Approvals ({totalPending})</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2 max-h-80 overflow-y-auto">
            {totalPending === 0 ? <p className="text-sm text-muted-foreground">All caught up — nothing pending!</p> : (
              <>
                {pendingLogs > 0 && <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40"><div className="font-medium text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2"><Clock className="w-4 h-4" />{pendingLogs} Time Log{pendingLogs > 1 ? "s" : ""}</div><div className="text-xs text-muted-foreground mt-0.5">Go to Time Logs tab to approve</div></div>}
                {pendingScrums > 0 && <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/40"><div className="font-medium text-sm text-violet-700 dark:text-violet-400 flex items-center gap-2"><ClipboardList className="w-4 h-4" />{pendingScrums} Daily Scrum{pendingScrums > 1 ? "s" : ""}</div><div className="text-xs text-muted-foreground mt-0.5">Go to Daily Scrum tab to review</div></div>}
                {pendingDocs > 0 && <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40"><div className="font-medium text-sm text-blue-700 dark:text-blue-400 flex items-center gap-2"><FileText className="w-4 h-4" />{pendingDocs} Document{pendingDocs > 1 ? "s" : ""}</div><div className="text-xs text-muted-foreground mt-0.5">Go to Documents tab to review</div></div>}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={selectedStat === "present"} onOpenChange={(open) => !open && setSelectedStat(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><CalendarDays className="w-4 h-4" /> Attendance Today — {today}</DialogTitle></DialogHeader>
          <div className="space-y-2 py-2 max-h-80 overflow-y-auto">
            {students.length === 0 ? <p className="text-sm text-muted-foreground">No interns yet.</p> : students.map(m => {
              const att = todayAttendance.find(a => a.userId === m.userId);
              const status = att?.status ?? "absent";
              return (
                <div key={m.userId} className={`flex items-center justify-between p-2 rounded-lg ${status === "present" ? "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40" : "bg-muted/40"}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{m.user?.name?.[0] ?? "?"}</div>
                    <span className="text-sm font-medium">{m.user?.name}</span>
                  </div>
                  <Badge variant={status === "present" ? "default" : "secondary"} className={status === "present" ? "bg-emerald-600" : ""}>{status}</Badge>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={selectedStat === "tasks"} onOpenChange={(open) => !open && setSelectedStat(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><ListTodo className="w-4 h-4" /> Active Tasks ({activeTasks.length})</DialogTitle></DialogHeader>
          <div className="space-y-2 py-2 max-h-80 overflow-y-auto">
            {activeTasks.length === 0 ? <p className="text-sm text-muted-foreground">No active tasks.</p> : activeTasks.map(t => {
              const assignee = members.find(m => m.userId === t.assignedToId)?.user;
              return (
                <div key={t.id} className="p-3 rounded-lg bg-muted/40 border border-border/40">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium">{t.title}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs shrink-0 h-7 px-2"
                      onClick={() => { setSelectedStat(null); navigate("/tasks"); }}
                    >Open</Button>
                  </div>
                  {assignee && <div className="text-xs text-muted-foreground mt-1">Assigned to: {assignee.name}</div>}
                  {t.description && <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</div>}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Intern Progress */}
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/40 pb-4">
          <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="w-4 h-4 text-primary" />Intern Progress Overview</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {studentSummaries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><Users className="w-10 h-10 mx-auto mb-3 opacity-30" />No students have joined this space yet.</div>
          ) : (
            <div className="divide-y divide-border/40">
              {studentSummaries.map(({ member, totalHrs, scrumCount, presentDays, docsCount, pendingApprovals, pct, targetHrs }) => (
                <div 
                  key={member.id} 
                  className="px-6 py-4 hover:bg-muted/20 transition-colors cursor-pointer" 
                  data-testid={`row-intern-${member.userId}`}
                  onClick={() => {
setSelectedUser(member.user || null);
                    setModalOpen(true);
                  }}
                >
                  <div className="flex items-center gap-4 flex-wrap">
<UserCardWithPicture user={member.user!} size="sm" />
                    <div className="flex-1 min-w-0 ml-1">
                      <div className="text-xs text-muted-foreground capitalize">{member.user?.role ?? "student"}</div>
                      <div className="text-xs text-muted-foreground capitalize">{member.user?.role ?? "student"}</div>
                    </div>
                    <div className="hidden md:grid grid-cols-4 gap-6 text-center">
                      {[{ v: `${totalHrs}h`, l: "Hours" }, { v: scrumCount, l: "Scrums" }, { v: `${presentDays}d`, l: "Present" }, { v: docsCount, l: "Docs" }].map(({ v, l }) => (
                        <div key={l}><div className="text-sm font-bold">{v}</div><div className="text-[10px] text-muted-foreground">{l}</div></div>
                      ))}
                    </div>
                    {pendingApprovals > 0
                      ? <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30 shrink-0">{pendingApprovals} pending</Badge>
                      : <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 shrink-0"><ShieldCheck className="w-3 h-3 mr-1" />Up to date</Badge>}
                  </div>
                  {/* OJT Progress mini bar */}
                  <div className="mt-3 flex items-center gap-3">
                    <Progress value={pct} className="flex-1 h-2" />
                    <span className="text-xs font-semibold text-muted-foreground w-24 shrink-0 text-right">{totalHrs}h / {targetHrs}h ({pct}%)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Announcements */}
      {announcements.length > 0 && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center gap-2">
            <Megaphone className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">Recent Announcements</CardTitle>
          </CardHeader>
          <CardContent>{activeSpaceId && <AnnouncementsList spaceId={activeSpaceId} />}</CardContent>
        </Card>
      )}

      {/* Post Announcement Dialog */}
      <Dialog open={annOpen} onOpenChange={setAnnOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Post Announcement</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label>Title</Label><Input value={annTitle} onChange={e => setAnnTitle(e.target.value)} placeholder="Announcement title..." data-testid="input-announcement-title" /></div>
            <div className="space-y-2"><Label>Content</Label><Textarea value={annContent} onChange={e => setAnnContent(e.target.value)} placeholder="Write your message to all interns..." className="min-h-28" data-testid="input-announcement-content" /></div>
            <Button onClick={handlePostAnnouncement} disabled={createAnnouncement.isPending || !annTitle.trim() || !annContent.trim()} data-testid="button-submit-announcement">
              {createAnnouncement.isPending ? "Posting..." : "Post Announcement"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Profile Modal */}
      <UserProfileModal 
        user={selectedUser} 
        open={modalOpen} 
        onOpenChange={setModalOpen}
        onMessage={(userId) => {
          const dmChannelId = (a: number, b: number) => `dm-${Math.min(a, b)}-${Math.max(a, b)}`;
          window.location.href = `/messages/${dmChannelId(user!.id, userId)}`;
        }}
      />
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { activeSpace } = useSpace();
  const isManager = user?.role === "supervisor" || user?.role === "school";

  if (!activeSpace) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6"><AlertCircle className="w-10 h-10" /></div>
        <h2 className="text-2xl font-display font-bold mb-2">No Space Selected</h2>
        <p className="text-muted-foreground">Select a space from the sidebar, or create / join one to get started.</p>
      </div>
    );
  }

  return isManager ? <ManagerDashboard /> : <StudentDashboard />;
}
