import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSpace } from "@/hooks/use-space";
import { useTimeLogs, useCreateTimeLog, useApproveTimeLog, useSpaceMembers, useScrums } from "@/hooks/use-features";
import { useSpaceSettings } from "@/hooks/use-space-settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCardWithPicture } from "@/components/user-card-with-picture";
import {
  Plus, Clock, FolderOpen, CheckCircle, Filter, Download, Target,
  Play, Pause, Square, Timer, Zap
} from "lucide-react";
import { format } from "date-fns";

function exportDTR(userName: string, logs: Array<{ date: string; hours: number; status: string }>, targetHours: number) {
  const totalHours = logs.reduce((s, l) => s + l.hours, 0);
  const rows = logs.sort((a, b) => a.date.localeCompare(b.date)).map(l => `
    <tr>
      <td>${format(new Date(l.date + "T00:00:00"), "MMMM d, yyyy")}</td>
      <td style="text-align:center">${format(new Date(l.date + "T00:00:00"), "EEEE")}</td>
      <td style="text-align:center">${l.hours}h</td>
      <td style="text-align:center">${l.status === "approved" ? "✓" : "—"}</td>
    </tr>`).join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Daily Time Record – ${userName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 40px; color: #111; }
    h1 { font-size: 20px; text-align: center; margin-bottom: 4px; }
    .subtitle { text-align: center; color: #555; margin-bottom: 24px; font-size: 13px; }
    .info { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #1e1b4b; color: white; padding: 10px 12px; text-align: left; }
    td { padding: 9px 12px; border-bottom: 1px solid #e5e7eb; }
    tr:nth-child(even) td { background: #f9fafb; }
    .summary { margin-top: 24px; padding: 16px; background: #f3f4f6; border-radius: 8px; font-size: 13px; }
    .summary-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .footer { margin-top: 48px; display: flex; justify-content: space-between; font-size: 12px; color: #555; }
    .sig-line { border-top: 1px solid #111; padding-top: 6px; width: 180px; text-align: center; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>Daily Time Record (DTR)</h1>
  <div class="subtitle">OJTask Internship Management System</div>
  <div class="info">
    <div>Intern Name: <strong>${userName}</strong></div>
    <div>Target Hours: <strong>${targetHours}h</strong></div>
    <div>Generated: <strong>${format(new Date(), "MMMM d, yyyy")}</strong></div>
  </div>
  <table>
    <thead>
      <tr><th>Date</th><th style="text-align:center">Day</th><th style="text-align:center">Hours</th><th style="text-align:center">Approved</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="summary">
    <div class="summary-row"><span>Total Hours Logged:</span><strong>${totalHours}h</strong></div>
    <div class="summary-row"><span>Target Hours:</span><strong>${targetHours}h</strong></div>
    <div class="summary-row"><span>Progress:</span><strong>${Math.min(Math.round((totalHours / targetHours) * 100), 100)}%</strong></div>
    <div class="summary-row"><span>Remaining:</span><strong>${Math.max(targetHours - totalHours, 0)}h</strong></div>
  </div>
  <div class="footer">
    <div class="sig-line">${userName}<br>Intern</div>
    <div class="sig-line">Supervisor<br>Direct Supervisor</div>
  </div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (win) { win.document.write(html); win.document.close(); }
}

function formatElapsed(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function msToHours(ms: number): number {
  return Math.max(1, Math.round(ms / 1000 / 3600));
}

// ─── STUDENT ──────────────────────────────────────────────────────────────────
function StudentTimeLogs() {
  const { user } = useAuth();
  const { activeSpaceId, activeSpace } = useSpace();
  const { settings } = useSpaceSettings(activeSpaceId);
  const { data: allLogs = [] } = useTimeLogs(activeSpaceId);
  const { data: allScrums = [] } = useScrums(activeSpaceId);
  const createLog = useCreateTimeLog(activeSpaceId);

  const myLogs = allLogs.filter(l => l.userId === user?.id).sort((a, b) => b.date.localeCompare(a.date));
  const myScrums = allScrums.filter(s => s.userId === user?.id);

  const logHours = myLogs.reduce((s, l) => s + l.hours, 0);
  const approvedLogHours = myLogs.filter(l => l.status === "approved").reduce((s, l) => s + l.hours, 0);
  const approvedScrumHours = myScrums.filter(s => s.isApproved).reduce((s, sc) => s + (sc.timeSpent ?? 0), 0);
  const totalHours = logHours + approvedScrumHours;
  const approvedHours = approvedLogHours + approvedScrumHours;
  const targetHours = settings?.totalRequiredHours ?? activeSpace?.targetHours ?? 486;
  const pct = Math.min(Math.round((totalHours / targetHours) * 100), 100);
  const remaining = Math.max(targetHours - totalHours, 0);

  // ── Manual log dialog ──
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [hours, setHours] = useState("8");
  const [manualDesc, setManualDesc] = useState("");

  const handleCreate = async () => {
    const h = parseInt(hours, 10);
    if (!date || isNaN(h)) return;
    await createLog.mutateAsync({ spaceId: activeSpaceId, userId: user!.id, date, hours: h, description: manualDesc || undefined } as any);
    setIsOpen(false);
    setManualDesc("");
    setHours("8");
    setDate(new Date().toISOString().split("T")[0]);
  };

  // ── Stopwatch state (wall-clock anchored — no drift) ──
  type TimerState = "idle" | "running" | "paused";
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [displayMs, setDisplayMs] = useState(0);        // what we show
  const accumulatedRef = useRef(0);                      // ms before last resume
  const sessionStartRef = useRef<number | null>(null);  // wall clock when last resumed
  const rafRef = useRef<number | null>(null);

  const [stopDialogOpen, setStopDialogOpen] = useState(false);
  const [timerDesc, setTimerDesc] = useState("");
  const [timerDate, setTimerDate] = useState(new Date().toISOString().split("T")[0]);
  const [timerHours, setTimerHours] = useState(1);

  useEffect(() => {
    if (timerState === "running") {
      const tick = () => {
        const elapsed = accumulatedRef.current + (Date.now() - (sessionStartRef.current ?? Date.now()));
        setDisplayMs(elapsed);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [timerState]);

  const handleStartTimer = () => {
    accumulatedRef.current = 0;
    sessionStartRef.current = Date.now();
    setDisplayMs(0);
    setTimerDate(new Date().toISOString().split("T")[0]);
    setTimerState("running");
  };

  const handlePauseTimer = () => {
    accumulatedRef.current += Date.now() - (sessionStartRef.current ?? Date.now());
    setTimerState("paused");
  };

  const handleResumeTimer = () => {
    sessionStartRef.current = Date.now();
    setTimerState("running");
  };

  const handleStopTimer = () => {
    if (timerState === "running") {
      accumulatedRef.current += Date.now() - (sessionStartRef.current ?? Date.now());
    }
    setTimerState("paused");
    const computed = msToHours(accumulatedRef.current);
    setTimerHours(computed);
    setTimerDate(new Date().toISOString().split("T")[0]);
    setStopDialogOpen(true);
  };

  const handleCancelTimer = () => {
    setTimerState("idle");
    setDisplayMs(0);
  };

  const handleSubmitTimer = async () => {
    await createLog.mutateAsync({
      spaceId: activeSpaceId,
      userId: user!.id,
      date: timerDate,
      hours: timerHours,
      description: timerDesc || undefined,
    } as any);
    setStopDialogOpen(false);
    setTimerState("idle");
    setDisplayMs(0);
    setTimerDesc("");
  };

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-display font-bold">Time Logs</h1>
          <p className="text-muted-foreground">Track your internship hours daily</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {myLogs.length > 0 && (
            <Button variant="outline" onClick={() => exportDTR(user?.name ?? "Intern", myLogs, targetHours)} className="gap-2" data-testid="button-export-dtr">
              <Download className="w-4 h-4" /> Export DTR
            </Button>
          )}

          {/* ── Track Time button ── */}
          {timerState === "idle" ? (
            <Button variant="outline" onClick={handleStartTimer} className="gap-2 border-primary/40 text-primary hover:bg-primary/5" data-testid="button-track-time">
              <Timer className="w-4 h-4" /> Track Time
            </Button>
          ) : (
            <div className="flex items-center gap-2 bg-primary/5 border border-primary/30 rounded-lg px-3 py-1.5">
              <Zap className="w-4 h-4 text-primary animate-pulse" />
              <span className="font-mono font-bold text-primary text-sm min-w-[72px]">{formatElapsed(displayMs)}</span>
              {timerState === "running" ? (
                <Button size="sm" variant="ghost" onClick={handlePauseTimer} className="h-7 w-7 p-0 text-amber-600 hover:bg-amber-50" title="Pause">
                  <Pause className="w-3.5 h-3.5" />
                </Button>
              ) : (
                <Button size="sm" variant="ghost" onClick={handleResumeTimer} className="h-7 w-7 p-0 text-primary hover:bg-primary/10" title="Resume">
                  <Play className="w-3.5 h-3.5" />
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={handleStopTimer} className="h-7 w-7 p-0 text-red-500 hover:bg-red-50" title="Stop & Log">
                <Square className="w-3.5 h-3.5" />
              </Button>
              <button onClick={handleCancelTimer} className="text-[10px] text-muted-foreground hover:text-destructive ml-1">discard</button>
            </div>
          )}

          {/* ── Manual Log Time ── */}
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 gap-2" data-testid="button-log-time">
                <Plus className="w-4 h-4" /> Log Time
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Log Daily Hours</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={date} onChange={e => setDate(e.target.value)} data-testid="input-log-date" />
                </div>
                <div className="space-y-2">
                  <Label>Hours Worked</Label>
                  <Input type="number" min="1" max="24" value={hours} onChange={e => setHours(e.target.value)} data-testid="input-log-hours" />
                </div>
                <div className="space-y-2">
                  <Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Textarea
                    placeholder="What did you work on today?"
                    value={manualDesc}
                    onChange={e => setManualDesc(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>
                <Button onClick={handleCreate} disabled={createLog.isPending} className="mt-2" data-testid="button-submit-log">
                  {createLog.isPending ? "Saving..." : "Submit Log"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stop Timer Dialog */}
      <Dialog open={stopDialogOpen} onOpenChange={open => { if (!open) { setStopDialogOpen(false); setTimerState("idle"); setDisplayMs(0); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-primary" /> Log Tracked Time
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-center">
              <div className="text-xs text-muted-foreground mb-1">Time tracked</div>
              <div className="font-mono text-2xl font-bold text-primary">{formatElapsed(displayMs)}</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={timerDate} onChange={e => setTimerDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Hours <span className="text-muted-foreground text-xs">(rounded)</span></Label>
                <Input type="number" min="1" max="24" value={timerHours} onChange={e => setTimerHours(Number(e.target.value))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>What did you work on? <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea
                placeholder="Describe the work you completed during this session…"
                value={timerDesc}
                onChange={e => setTimerDesc(e.target.value)}
                rows={3}
                className="resize-none"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmitTimer} disabled={createLog.isPending} className="flex-1">
                {createLog.isPending ? "Saving..." : "Submit Log"}
              </Button>
              <Button variant="outline" onClick={() => { setStopDialogOpen(false); setTimerState("paused"); }}>
                Resume
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <>
        {/* OJT Progress — only show when in a space (has a target) */}
        {activeSpaceId && (
          <Card className="mb-6 border-border/50 shadow-sm bg-gradient-to-br from-primary/5 to-primary/0">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-sm">OJT Hour Progress</span>
                </div>
                <span className={`text-2xl font-display font-black ${pct >= 100 ? "text-emerald-600" : pct >= 60 ? "text-primary" : "text-amber-600"}`}>{pct}%</span>
              </div>
              <Progress value={pct} className="h-3 mb-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span><span className="font-bold text-foreground">{totalHours}h</span> completed</span>
                <span><span className="font-bold text-foreground">{remaining}h</span> remaining of {targetHours}h target</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalHours}h</div>
                <div className="text-xs text-muted-foreground">Total Hours Logged</div>
                {approvedScrumHours > 0 && (
                  <div className="text-[10px] text-muted-foreground/70 mt-0.5">includes {approvedScrumHours}h from scrums</div>
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-11 h-11 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-600">{approvedHours}h</div>
                <div className="text-xs text-muted-foreground">{activeSpaceId ? "Approved Hours" : "Total Hours"}</div>
                {approvedScrumHours > 0 && (
                  <div className="text-[10px] text-muted-foreground/70 mt-0.5">logs + scrums combined</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Logs Table */}
        <Card className="border-border/50 shadow-sm">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                    No time logs yet. Click <strong>"Log Time"</strong> or <strong>"Track Time"</strong> to add your first entry.
                  </TableCell>
                </TableRow>
              ) : myLogs.map(log => (
                <TableRow key={log.id} data-testid={`row-log-${log.id}`}>
                  <TableCell className="font-medium">{format(new Date(log.date + "T00:00:00"), "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      {log.hours}h
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    {(log as any).description ? (
                      <span className="text-sm text-muted-foreground line-clamp-2">{(log as any).description}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={log.status === "approved" ? "default" : "secondary"}
                      className={log.status === "approved"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : activeSpaceId
                          ? "text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-600/50"
                          : "bg-blue-500/10 text-blue-600 border-blue-500/20"}
                    >
                      {log.status === "approved" ? "Approved" : activeSpaceId ? "Pending" : "Personal"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </Card>
      </>
    </div>
  );
}

// ─── MANAGER ──────────────────────────────────────────────────────────────────
function ManagerTimeLogs() {
  const { user } = useAuth();
  const { activeSpaceId, activeSpace } = useSpace();
  const { settings } = useSpaceSettings(activeSpaceId);
  const { data: logs = [] } = useTimeLogs(activeSpaceId);
  const { data: allScrums = [] } = useScrums(activeSpaceId);
  const { data: members = [] } = useSpaceMembers(activeSpaceId);
  const approveLog = useApproveTimeLog(activeSpaceId);
  const isSupervisor = user?.role === "supervisor";

  const targetHours = settings?.totalRequiredHours ?? activeSpace?.targetHours ?? 486;
  const [filterStudent, setFilterStudent] = useState("all");
  const students = members.filter(m => m.user?.role === "student");
  const getName = (userId: number) => members.find(m => m.userId === userId)?.user?.name ?? `User #${userId}`;

  const filtered = (filterStudent === "all" ? logs : logs.filter(l => l.userId === Number(filterStudent)))
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalHours = filtered.reduce((s, l) => s + l.hours, 0);
  const pendingCount = logs.filter(l => l.status === "pending").length;

  const handleExport = () => {
    if (filterStudent === "all") return;
    const name = getName(Number(filterStudent));
    const studentLogs = logs.filter(l => l.userId === Number(filterStudent));
    exportDTR(name, studentLogs, targetHours);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Time Logs</h1>
          <p className="text-muted-foreground">
            {isSupervisor ? "Review and approve intern time submissions" : "Monitor intern time submissions"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isSupervisor && (
            <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50 dark:bg-blue-950/30 px-3 py-1.5 text-sm">
              Monitor only — approval is for supervisors
            </Badge>
          )}
          {pendingCount > 0 && isSupervisor && (
            <Badge variant="outline" className="text-amber-600 border-amber-400 bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 text-sm">
              <Clock className="w-3.5 h-3.5 mr-1.5" />{pendingCount} pending approval
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={filterStudent} onValueChange={setFilterStudent}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Students</SelectItem>
            {students.map(m => <SelectItem key={m.userId} value={String(m.userId)}>{m.user?.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {filterStudent !== "all" && (
          <>
            <div className="ml-2 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-lg">
              <span className="font-semibold text-foreground">{totalHours}h</span> total · target <span className="font-semibold text-foreground">{targetHours}h</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-2" data-testid="button-export-dtr">
              <Download className="w-4 h-4" /> Export DTR
            </Button>
          </>
        )}
      </div>

      {/* Per-student progress including scrum hours */}
      {filterStudent === "all" && students.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {students.map(m => {
            const sLogs = logs.filter(l => l.userId === m.userId);
            const sScrums = allScrums.filter(s => s.userId === m.userId && s.isApproved);
            const logHrs = sLogs.reduce((s, l) => s + l.hours, 0);
            const scrumHrs = sScrums.reduce((s, sc) => s + (sc.timeSpent ?? 0), 0);
            const sHours = logHrs + scrumHrs;
            const pct = Math.min(Math.round((sHours / targetHours) * 100), 100);
            return (
              <Card key={m.userId} className="border-border/50 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <UserCardWithPicture user={m.user!} size="sm" />
                    <span className="text-sm font-bold">{sHours}h / {targetHours}h</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{pct}% complete</span>
                    {scrumHrs > 0 && <span className="text-primary/70">{scrumHrs}h from scrums</span>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!activeSpaceId ? (
        <div className="flex flex-col items-center justify-center h-52 rounded-xl border-2 border-dashed border-border/50 bg-muted/20 text-center">
          <FolderOpen className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="font-medium text-muted-foreground">Select a space to view time logs</p>
        </div>
      ) : (
        <Card className="border-border/50 shadow-sm">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No time logs found.</TableCell></TableRow>
              ) : filtered.map(log => (
                <TableRow key={log.id} data-testid={`row-log-${log.id}`}>
                  <TableCell>
                    <UserCardWithPicture
                      user={members.find(m => m.userId === log.userId)?.user || { id: log.userId, name: getName(log.userId) } as any}
                      size="sm"
                    />
                  </TableCell>
                  <TableCell className="text-sm">{format(new Date(log.date + "T00:00:00"), "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />{log.hours}h
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    {(log as any).description ? (
                      <span className="text-sm text-muted-foreground line-clamp-2">{(log as any).description}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={log.status === "approved" ? "default" : "secondary"}
                      className={log.status === "approved"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-600/50"}
                    >
                      {log.status === "approved" ? "Approved" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {log.status === "pending" && isSupervisor && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => approveLog.mutate(log.id)}
                        disabled={approveLog.isPending}
                        className="h-7 text-xs text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                        data-testid={`button-approve-log-${log.id}`}
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </Card>
      )}
    </div>
  );
}

export default function TimeLogsPage() {
  const { user } = useAuth();
  const isManager = user?.role === "supervisor" || user?.role === "school";
  return isManager ? <ManagerTimeLogs /> : <StudentTimeLogs />;
}
