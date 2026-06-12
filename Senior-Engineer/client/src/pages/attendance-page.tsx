import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSpace } from "@/hooks/use-space";
import { useMarkNotificationsRead } from "@/hooks/use-notifications";
import { useAttendance, useCreateAttendance, useSpaceMembers, useLeaveRequests, useCreateLeaveRequest, useApproveLeaveRequest, useRejectLeaveRequest, useDeleteLeaveRequest } from "@/hooks/use-features";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, FolderOpen, Users, CheckCircle, XCircle, Clock, PlusCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { UserCardWithPicture } from "@/components/user-card-with-picture";

const statusConfig: Record<string, { cls: string; label: string }> = {
  present: { cls: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400", label: "Present" },
  absent:  { cls: "bg-red-500/10 text-red-700 border-red-500/20 dark:text-red-400",                label: "Absent" },
  holiday: { cls: "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400",            label: "Holiday" },
  weekend: { cls: "bg-slate-500/10 text-slate-600 border-slate-400/20",                            label: "Weekend" },
};

const leaveStatusBadge = (status: string) => {
  if (status === "approved") return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
  if (status === "rejected") return <Badge className="bg-red-500/10 text-red-600 border-red-500/20 text-[10px]"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
  return <Badge variant="outline" className="text-amber-600 border-amber-300 text-[10px]"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
};

// ─── STUDENT ──────────────────────────────────────────────────────────────────
function StudentAttendance() {
  const { user } = useAuth();
  const { activeSpaceId } = useSpace();
  const { data: allAttendance = [] } = useAttendance(activeSpaceId);
  const { data: allLeaves = [] } = useLeaveRequests(activeSpaceId);
  const createAtt = useCreateAttendance(activeSpaceId);
  const createLeave = useCreateLeaveRequest(activeSpaceId);
  const deleteLeave = useDeleteLeaveRequest(activeSpaceId);
  const { toast } = useToast();
  const markRead = useMarkNotificationsRead('attendance');
  useEffect(() => { markRead(); }, [markRead]);

  const attendance = allAttendance.filter(a => a.userId === user?.id).sort((a, b) => b.date.localeCompare(a.date));
  const myLeaves = allLeaves.filter(l => l.userId === user?.id).sort((a, b) => b.date.localeCompare(a.date));

  const [attDate, setAttDate] = useState(new Date().toISOString().split("T")[0]);
  const [attStatus, setAttStatus] = useState("present");
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaveDate, setLeaveDate] = useState(new Date().toISOString().split("T")[0]);
  const [leaveReason, setLeaveReason] = useState("");

  const handleLog = async () => {
    if (!activeSpaceId) return;
    await createAtt.mutateAsync({ spaceId: activeSpaceId, userId: user!.id, date: attDate, status: attStatus });
  };

  const handleLeave = async () => {
    if (!activeSpaceId || !leaveReason.trim()) return;
    await createLeave.mutateAsync({ spaceId: activeSpaceId, userId: user!.id, date: leaveDate, reason: leaveReason });
    setLeaveOpen(false);
    setLeaveReason("");
  };

  const presentCount = attendance.filter(a => a.status === "present").length;
  const absentCount = attendance.filter(a => a.status === "absent").length;
  const holidayCount = attendance.filter(a => a.status === "holiday").length;

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><CalendarDays className="w-6 h-6" /></div>
          <div>
            <h1 className="text-3xl font-display font-bold">Attendance</h1>
            <p className="text-muted-foreground">Log your daily attendance and file leaves</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => setLeaveOpen(true)} className="gap-2" data-testid="button-file-leave">
          <PlusCircle className="w-4 h-4" /> File Leave
        </Button>
      </div>

      <Tabs defaultValue="attendance">
        <TabsList className="mb-6">
          <TabsTrigger value="attendance" data-testid="tab-attendance">Attendance Records</TabsTrigger>
          <TabsTrigger value="leaves" data-testid="tab-leaves">
            Leave Requests
            {myLeaves.filter(l => l.status === "pending").length > 0 && (
              <Badge variant="secondary" className="ml-2 text-amber-600 bg-amber-50">{myLeaves.filter(l => l.status === "pending").length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attendance">
          <Card className="mb-8 border-border/50 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-base">Mark Today's Attendance</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="space-y-2 flex-1 w-full"><Label>Date</Label><Input type="date" value={attDate} onChange={e => setAttDate(e.target.value)} data-testid="input-attendance-date" /></div>
                <div className="space-y-2 flex-1 w-full">
                  <Label>Status</Label>
                  <Select value={attStatus} onValueChange={setAttStatus}>
                    <SelectTrigger data-testid="select-attendance-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                      <SelectItem value="holiday">Holiday</SelectItem>
                      <SelectItem value="weekend">Weekend</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleLog} disabled={createAtt.isPending || !activeSpaceId} className="w-full md:w-auto md:px-8" data-testid="button-mark-attendance">
                  {createAtt.isPending ? "Saving..." : "Mark Status"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {!activeSpaceId ? (
            <div className="flex flex-col items-center justify-center h-40 rounded-xl border-2 border-dashed border-border/50 bg-muted/20 text-center">
              <FolderOpen className="w-8 h-8 text-muted-foreground/40 mb-2" /><p className="text-sm font-medium text-muted-foreground">Select a space to view attendance</p>
            </div>
          ) : (
            <>
              {attendance.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[{ v: presentCount, l: "Present", c: "text-emerald-600", b: "bg-emerald-50 border-emerald-100 dark:bg-emerald-950/30" },
                    { v: absentCount, l: "Absent", c: "text-red-600", b: "bg-red-50 border-red-100 dark:bg-red-950/30" },
                    { v: holidayCount, l: "Holidays", c: "text-blue-600", b: "bg-blue-50 border-blue-100 dark:bg-blue-950/30" }]
                    .map(item => (
                    <div key={item.l} className={`${item.b} border rounded-xl p-4 text-center`}>
                      <div className={`text-2xl font-bold ${item.c}`}>{item.v}</div>
                      <div className={`text-xs font-medium ${item.c} opacity-70 mt-1`}>{item.l}</div>
                    </div>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-3">
                {attendance.map(record => {
                  const conf = statusConfig[record.status] ?? statusConfig.present;
                  return (
                    <div key={record.id} className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all hover:scale-105 ${conf.cls}`} data-testid={`card-attendance-${record.id}`}>
                      <span className="text-xl font-display font-extrabold">{format(new Date(record.date + "T00:00:00"), "dd")}</span>
                      <span className="text-[10px] font-medium uppercase tracking-wider opacity-70">{format(new Date(record.date + "T00:00:00"), "MMM")}</span>
                      <span className="mt-1.5 text-[9px] font-semibold capitalize bg-white/60 dark:bg-black/20 px-1.5 py-0.5 rounded-full w-full">{conf.label}</span>
                    </div>
                  );
                })}
                {attendance.length === 0 && <div className="col-span-full py-12 text-center text-muted-foreground">No records yet. Mark your first day above!</div>}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="leaves">
          {myLeaves.length === 0 ? (
            <div className="text-center py-16 rounded-xl border-2 border-dashed border-border/50">
              <CalendarDays className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-medium text-muted-foreground">No leave requests filed yet.</p>
              <Button variant="outline" onClick={() => setLeaveOpen(true)} className="mt-4 gap-2"><PlusCircle className="w-4 h-4" />File a Leave</Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {myLeaves.map(lr => (
                <Card key={lr.id} className="border-border/50 shadow-sm" data-testid={`card-leave-${lr.id}`}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{lr.date ? format(new Date(lr.date + "T00:00:00"), "MMMM d, yyyy") : "—"}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{lr.reason}</div>
                    </div>
                    {leaveStatusBadge(lr.status)}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={lr.status === "approved" || deleteLeave.isPending}
                      title={lr.status === "approved" ? "Cannot delete an approved leave request" : "Delete this leave request"}
                      className={`h-7 w-7 p-0 shrink-0 ${lr.status === "approved" ? "opacity-40 cursor-not-allowed" : "text-red-500 border-red-300 hover:bg-red-50"}`}
                      onClick={async () => {
                        try {
                          await deleteLeave.mutateAsync(lr.id);
                          toast({ title: "Leave request deleted", description: "Your leave request has been removed." });
                        } catch (e: any) {
                          toast({ title: "Delete failed", description: e.message, variant: "destructive" });
                        }
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* File Leave Dialog */}
      <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>File Leave Request</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label>Leave Date</Label><Input type="date" value={leaveDate} onChange={e => setLeaveDate(e.target.value)} data-testid="input-leave-date" /></div>
            <div className="space-y-2"><Label>Reason for Leave</Label><Textarea value={leaveReason} onChange={e => setLeaveReason(e.target.value)} placeholder="Briefly explain your reason for absence..." data-testid="input-leave-reason" /></div>
            <Button onClick={handleLeave} disabled={createLeave.isPending || !leaveReason.trim() || !activeSpaceId} data-testid="button-submit-leave">
              {createLeave.isPending ? "Filing..." : "Submit Leave Request"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── MANAGER ──────────────────────────────────────────────────────────────────
function ManagerAttendance() {
  const { user } = useAuth();
  const { activeSpaceId } = useSpace();
  const { data: allAttendance = [] } = useAttendance(activeSpaceId);
  const { data: allLeaves = [] } = useLeaveRequests(activeSpaceId);
  const { data: members = [] } = useSpaceMembers(activeSpaceId);
  const createAtt = useCreateAttendance(activeSpaceId);
  const approveLeave = useApproveLeaveRequest(activeSpaceId);
  const rejectLeave = useRejectLeaveRequest(activeSpaceId);
  const markRead = useMarkNotificationsRead('attendance');
  useEffect(() => { markRead(); }, [markRead]);
  const isSupervisor = user?.role === "supervisor";

  const [selectedStudent, setSelectedStudent] = useState("all");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState("present");
  const [markFor, setMarkFor] = useState("");

  const students = members.filter(m => m.user?.role === "student");
  const filtered = (selectedStudent === "all" ? allAttendance : allAttendance.filter(a => a.userId === Number(selectedStudent))).sort((a, b) => b.date.localeCompare(a.date));
  const getName = (userId: number) => members.find(m => m.userId === userId)?.user?.name ?? `User #${userId}`;

  const pendingLeaves = allLeaves.filter(l => l.status === "pending").length;
  const today = new Date().toISOString().split("T")[0];
  const presentToday = allAttendance.filter(a => a.date === today && a.status === "present").length;

  const handleMark = async () => {
    if (!activeSpaceId || !markFor) return;
    await createAtt.mutateAsync({ spaceId: activeSpaceId, userId: Number(markFor), date, status });
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><CalendarDays className="w-6 h-6" /></div>
          <div>
            <h1 className="text-3xl font-display font-bold">Attendance Overview</h1>
            <p className="text-muted-foreground">
              {isSupervisor ? "Monitor and manage intern attendance and leave requests" : "Monitor intern attendance and leave requests"}
            </p>
          </div>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-xl text-sm font-medium">
          <span className="font-bold">{presentToday}</span> / {students.length} present today
        </div>
      </div>

      <Tabs defaultValue="attendance">
        <TabsList className="mb-6">
          <TabsTrigger value="attendance">Attendance Records</TabsTrigger>
          <TabsTrigger value="leaves">
            Leave Requests
            {pendingLeaves > 0 && isSupervisor && <Badge variant="secondary" className="ml-2 text-amber-600 bg-amber-50">{pendingLeaves}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attendance">
          {/* Mark attendance */}
          <Card className="mb-8 border-border/50 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-base">Mark Attendance for a Student</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 items-end">
                <div className="space-y-2 flex-1 min-w-32">
                  <Label>Student</Label>
                  <Select value={markFor} onValueChange={setMarkFor}>
                    <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                    <SelectContent>{students.map(m => <SelectItem key={m.userId} value={String(m.userId)}>{m.user?.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 flex-1 min-w-32"><Label>Date</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
                <div className="space-y-2 flex-1 min-w-32">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                      <SelectItem value="holiday">Holiday</SelectItem>
                      <SelectItem value="weekend">Weekend</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleMark} disabled={createAtt.isPending || !markFor || !activeSpaceId} className="px-8">
                  {createAtt.isPending ? "Saving..." : "Mark"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-3 mb-6">
            <Users className="w-4 h-4 text-muted-foreground" />
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                {students.map(m => <SelectItem key={m.userId} value={String(m.userId)}>{m.user?.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {selectedStudent === "all" ? (
            <div className="grid md:grid-cols-2 gap-6">
              {students.map(m => {
                const studentAtt = allAttendance.filter(a => a.userId === m.userId);
                const present = studentAtt.filter(a => a.status === "present").length;
                const absent = studentAtt.filter(a => a.status === "absent").length;
                return (
                  <Card key={m.userId} className="border-border/50 shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <UserCardWithPicture user={m.user!} size="sm" />
                        <div>
                          <p className="text-xs text-muted-foreground">{studentAtt.length} records · {present} present · {absent} absent</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {studentAtt.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10).map(record => {
                          const conf = statusConfig[record.status] ?? statusConfig.present;
                          return (
                            <div key={record.id} className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold ${conf.cls}`}>
                              {format(new Date(record.date + "T00:00:00"), "MMM d")} · {conf.label}
                            </div>
                          );
                        })}
                        {studentAtt.length === 0 && <p className="text-xs text-muted-foreground">No records yet</p>}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {students.length === 0 && <div className="col-span-2 text-center py-12 rounded-xl border-2 border-dashed border-border/50 text-muted-foreground">No students in this space.</div>}
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-3">
              {filtered.map(record => {
                const conf = statusConfig[record.status] ?? statusConfig.present;
                return (
                  <div key={record.id} className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all hover:scale-105 ${conf.cls}`}>
                    <span className="text-xl font-display font-extrabold">{format(new Date(record.date + "T00:00:00"), "dd")}</span>
                    <span className="text-[10px] font-medium uppercase tracking-wider opacity-70">{format(new Date(record.date + "T00:00:00"), "MMM")}</span>
                    <span className="mt-1.5 text-[9px] font-semibold capitalize bg-white/60 dark:bg-black/20 px-1.5 py-0.5 rounded-full w-full">{conf.label}</span>
                  </div>
                );
              })}
              {filtered.length === 0 && <div className="col-span-full py-12 text-center text-muted-foreground">No records for this student.</div>}
            </div>
          )}
        </TabsContent>

        <TabsContent value="leaves">
          {allLeaves.length === 0 ? (
            <div className="text-center py-16 rounded-xl border-2 border-dashed border-border/50">
              <CalendarDays className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-medium text-muted-foreground">No leave requests filed yet.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {allLeaves.sort((a, b) => ((b as any).date ?? '').localeCompare((a as any).date ?? '')).map(lr => (
                <Card key={lr.id} className="border-border/50 shadow-sm" data-testid={`card-leave-${lr.id}`}>
                  <CardContent className="p-4 flex items-center gap-4 flex-wrap">
                    <UserCardWithPicture 
                      user={members.find(m => m.userId === lr.userId)?.user || { id: lr.userId, name: getName(lr.userId) } as any} 
                      size="sm" 
                    />
                    <div className="flex-1 min-w-0 ml-1">
                      <div className="text-xs text-muted-foreground">{(lr as any).date ? format(new Date((lr as any).date + "T00:00:00"), "MMMM d, yyyy") : "—"} · {lr.reason}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {leaveStatusBadge(lr.status)}
                      {lr.status === "pending" && isSupervisor && (
                        <>
                          <Button size="sm" onClick={() => approveLeave.mutate(lr.id)} disabled={approveLeave.isPending} className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" data-testid={`button-approve-leave-${lr.id}`}>
                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => rejectLeave.mutate(lr.id)} disabled={rejectLeave.isPending} className="h-7 text-xs text-red-600 border-red-300 hover:bg-red-50" data-testid={`button-reject-leave-${lr.id}`}>
                            <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AttendancePage() {
  const { user } = useAuth();
  const isManager = user?.role === "supervisor" || user?.role === "school";
  return isManager ? <ManagerAttendance /> : <StudentAttendance />;
}
