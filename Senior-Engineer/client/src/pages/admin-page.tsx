import { useAuth } from "@/hooks/use-auth";
import { useSpace } from "@/hooks/use-space";
import { useSpaceMembers, useTasks, useTimeLogs, useScrums, useDocuments, useAttendance } from "@/hooks/use-features";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, Clock, FileText, CheckCircle2, BarChart3, TrendingUp, CalendarDays, ClipboardList, ShieldCheck, Activity } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
function StatCard({ icon: Icon, label, value, sub, color, onClick }: { icon: any; label: string; value: string | number; sub?: string; color: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`block w-full text-left transition-all ${
        onClick
          ? "hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5"
          : ""
      }`}
    >
      <Card className="border-border/50 shadow-sm h-full">
        <CardContent className="p-5 flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-display font-bold">{value}</div>
            <div className="text-sm font-medium text-foreground">{label}</div>
            {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
          </div>
        </CardContent>
      </Card>
    </button>
  );
}

export default function AdminPage() {
  const { activeSpaceId } = useSpace();
  const { data: members = [] } = useSpaceMembers(activeSpaceId);
  const { data: tasks = [] } = useTasks(activeSpaceId);
  const { data: logs = [] } = useTimeLogs(activeSpaceId);
  const { data: scrums = [] } = useScrums(activeSpaceId);
  const { data: docs = [] } = useDocuments(activeSpaceId);
  const { data: attendance = [] } = useAttendance(activeSpaceId);
  const [selectedStat, setSelectedStat] = useState<string | null>(null);
  const students = members.filter(m => m.user?.role === "student");
  const supervisors = members.filter(m => m.user?.role === "supervisor");
  const schoolCoords = members.filter(m => m.user?.role === "school");

  const totalHours = logs.reduce((s, l) => s + l.hours, 0);
  const approvedHours = logs.filter(l => l.status === "approved").reduce((s, l) => s + l.hours, 0);
  const pendingDocs = docs.filter(d => d.status === "submitted").length;
  const approvedDocs = docs.filter(d => d.status === "approved").length;
  const approvedScrums = scrums.filter(s => s.isApproved).length;
  const presentDays = attendance.filter(a => a.status === "present").length;

  // Per-student stats
  const studentStats = students.map(m => {
    const myTasks = tasks.filter(t => t.assignedToId === m.userId);
    const doneTasks = myTasks.filter(t => t.status === "done").length;
    const myLogs = logs.filter(l => l.userId === m.userId);
    const hours = myLogs.reduce((s, l) => s + l.hours, 0);
    const myScrums = scrums.filter(s => s.userId === m.userId && s.isApproved).sort((a, b) => b.date.localeCompare(a.date));
    const pct = myScrums[0]?.completionPercentage ?? 0;
    const myAtt = attendance.filter(a => a.userId === m.userId);
    const present = myAtt.filter(a => a.status === "present").length;
    return { member: m, tasks: myTasks.length, done: doneTasks, hours, pct, present, scrumCount: scrums.filter(s => s.userId === m.userId).length };
  });

  const avgPct = studentStats.length > 0 ? Math.round(studentStats.reduce((s, st) => s + st.pct, 0) / studentStats.length) : 0;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <Activity className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-display font-bold">System Analytics</h1>
        </div>
        <p className="text-muted-foreground ml-13">Read-only overview of all internship data across the space</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Students" value={students.length} sub={`${supervisors.length} supervisor · ${schoolCoords.length} coordinator`} color="bg-primary/10 text-primary" onClick={() => setSelectedStat('Students')} />
        <StatCard icon={Clock} label="Total Hours" value={`${totalHours}h`} sub={`${approvedHours}h approved`} color="bg-blue-500/10 text-blue-600" onClick={() => setSelectedStat('Hours')} />
        <StatCard icon={FileText} label="Documents" value={docs.length} sub={`${approvedDocs} approved · ${pendingDocs} pending`} color="bg-amber-500/10 text-amber-600" onClick={() => setSelectedStat('Documents')} />
        <StatCard icon={ClipboardList} label="Scrum Reports" value={scrums.length} sub={`${approvedScrums} approved`} color="bg-emerald-500/10 text-emerald-600" onClick={() => setSelectedStat('Scrums')} />
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Team average completion */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" />Average Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 mb-3">
              <span className="text-5xl font-display font-black text-primary">{avgPct}%</span>
              <span className="text-muted-foreground text-sm mb-2">team average (from approved scrums)</span>
            </div>
            <Progress value={avgPct} className="h-3" />
          </CardContent>
        </Card>

        {/* Attendance overview */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><CalendarDays className="w-4 h-4 text-primary" />Attendance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Present Days", val: presentDays, cls: "text-emerald-600" },
                { label: "Absent Days", val: attendance.filter(a => a.status === "absent").length, cls: "text-red-500" },
                { label: "Holidays", val: attendance.filter(a => a.status === "holiday").length, cls: "text-blue-500" },
                { label: "Total Records", val: attendance.length, cls: "text-foreground" },
              ].map(item => (
                <div key={item.label} className="bg-muted/30 rounded-xl p-3 text-center border border-border/50">
                  <div className={`text-2xl font-bold ${item.cls}`}>{item.val}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{item.label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per-student breakdown */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" />Student Performance Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {studentStats.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No students in this space yet.</p>
          ) : (
            <div className="grid gap-5">
              {studentStats.map(({ member, tasks: t, done, hours, pct, present, scrumCount }) => (
                <div key={member.userId} className="p-4 bg-muted/20 rounded-xl border border-border/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                        {member.user?.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold">{member.user?.name}</div>
                        <div className="text-xs text-muted-foreground">@{member.user?.name?.toLowerCase().replace(" ", "")}</div>
                      </div>
                    </div>
                    <Badge className={`${pct >= 75 ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : pct >= 40 ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : "bg-red-500/10 text-red-600 border-red-500/20"}`}>
                      {pct}% complete
                    </Badge>
                  </div>
                  <Progress value={pct} className="h-2 mb-3" />
                  <div className="grid grid-cols-4 gap-3 text-center text-xs">
                    <div className="bg-background rounded-lg p-2 border border-border/50">
                      <div className="font-bold text-sm">{t}</div>
                      <div className="text-muted-foreground">Tasks</div>
                    </div>
                    <div className="bg-background rounded-lg p-2 border border-border/50">
                      <div className="font-bold text-sm text-emerald-600">{done}</div>
                      <div className="text-muted-foreground">Done</div>
                    </div>
                    <div className="bg-background rounded-lg p-2 border border-border/50">
                      <div className="font-bold text-sm text-blue-600">{hours}h</div>
                      <div className="text-muted-foreground">Hours</div>
                    </div>
                    <div className="bg-background rounded-lg p-2 border border-border/50">
                      <div className="font-bold text-sm">{scrumCount}</div>
                      <div className="text-muted-foreground">Scrums</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent scrums log */}
      {scrums.length > 0 && (
        <Card className="border-border/50 shadow-sm mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" />Recent Scrum Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {[...scrums].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8).map(s => {
                const name = members.find(m => m.userId === s.userId)?.user?.name ?? `User #${s.userId}`;
                return (
                  <div key={s.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                    <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">{name.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm">{name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{format(new Date(s.date + "T00:00:00"), "MMM d, yyyy")}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-primary">{s.completionPercentage}%</span>
                      {s.isApproved
                        ? <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20"><ShieldCheck className="w-3 h-3 mr-0.5" />Approved</Badge>
                        : <Badge variant="outline" className="text-[10px] text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-600/50">Pending</Badge>}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Modals */}
      <Dialog open={selectedStat === 'Students'} onOpenChange={(open) => !open && setSelectedStat(null)}>
        <DialogContent className="max-w-lg max-h-96">
          <DialogHeader><DialogTitle>All Students ({students.length})</DialogTitle></DialogHeader>
          <ScrollArea className="h-96 pr-4">
            <div className="space-y-2">
              {students.map(m => (
                <div key={m.userId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted">
                  <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                    {m.user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{m.user?.name}</div>
                    <div className="text-xs text-muted-foreground">{m.user?.email || 'No email'}</div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={selectedStat === 'Hours'} onOpenChange={(open) => !open && setSelectedStat(null)}>
        <DialogContent className="max-w-lg max-h-96">
          <DialogHeader><DialogTitle>Time Logs ({logs.length})</DialogTitle></DialogHeader>
          <ScrollArea className="h-96 pr-4">
            <div className="space-y-2">
              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No time logs yet</p>
              ) : (
                logs.slice(0, 20).map(log => {
                  const name = members.find(m => m.userId === log.userId)?.user?.name ?? `User #${log.userId}`;
                  return (
                    <div key={log.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted border border-border/50">
                      <div>
                        <div className="font-medium text-sm">{name}</div>
                        <div className="text-xs text-muted-foreground">{log.date}</div>
                      </div>
                      <div className="font-bold text-blue-600">{log.hours}h</div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={selectedStat === 'Documents'} onOpenChange={(open) => !open && setSelectedStat(null)}>
        <DialogContent className="max-w-lg max-h-96">
          <DialogHeader><DialogTitle>Documents ({docs.length})</DialogTitle></DialogHeader>
          <ScrollArea className="h-96 pr-4">
            <div className="space-y-2">
              {docs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No documents yet</p>
              ) : (
                docs.slice(0, 20).map(doc => {
                  const name = members.find(m => m.userId === doc.uploaderId)?.user?.name ?? `User #${doc.uploaderId}`;
                  return (
                    <div key={doc.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted border border-border/50">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{doc.name}</div>
                        <div className="text-xs text-muted-foreground">{name} · {doc.uploadDate}</div>
                      </div>
                      <Badge className={doc.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : doc.status === 'rejected' ? 'bg-red-500/10 text-red-600 border-red-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}>
                        {doc.status}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={selectedStat === 'Scrums'} onOpenChange={(open) => !open && setSelectedStat(null)}>
        <DialogContent className="max-w-lg max-h-96">
          <DialogHeader><DialogTitle>Scrum Reports ({scrums.length})</DialogTitle></DialogHeader>
          <ScrollArea className="h-96 pr-4">
            <div className="space-y-2">
              {scrums.length === 0 ? (
                <p className="text-sm text-muted-foreground">No scrum reports yet</p>
              ) : (
                scrums.slice(0, 20).map(scrum => {
                  const name = members.find(m => m.userId === scrum.userId)?.user?.name ?? `User #${scrum.userId}`;
                  return (
                    <div key={scrum.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted border border-border/50">
                      <div>
                        <div className="font-medium text-sm">{name}</div>
                        <div className="text-xs text-muted-foreground">{format(new Date(scrum.date + 'T00:00:00'), 'MMM d, yyyy')}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="text-[10px] bg-primary/10 text-primary">{scrum.completionPercentage}%</Badge>
                        {scrum.isApproved ? (
                          <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">✓ Approved</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">Pending</Badge>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
