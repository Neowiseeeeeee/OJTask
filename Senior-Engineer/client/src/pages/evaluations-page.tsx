import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSpace } from "@/hooks/use-space";
import { useMarkNotificationsRead } from "@/hooks/use-notifications";
import { useEvaluations, useCreateEvaluation, useSpaceMembers } from "@/hooks/use-features";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Award, FolderOpen, PlusCircle, Search, CheckCircle2, XCircle, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { useUserProfileModal } from "@/hooks/use-user-profile-modal";

type MemberRow = { id: number; userId: number; role: string; user: { id: number; name: string; role: string; profilePicture?: string | null } };

const CRITERIA = [
  { key: "punctuality",   label: "Punctuality & Attendance",  desc: "Arrives on time, consistent attendance" },
  { key: "attitude",      label: "Attitude & Professionalism", desc: "Work ethic, initiative, and conduct" },
  { key: "technical",     label: "Technical Skills",          desc: "Quality of work and technical competence" },
  { key: "communication", label: "Communication",             desc: "Verbal, written, and team interaction" },
  { key: "overall",       label: "Overall Performance",       desc: "General assessment and recommendation" },
] as const;

function getGradeLabel(score: number) {
  if (score >= 95) return { label: "Outstanding",         cls: "bg-violet-500/10 text-violet-600 border-violet-500/20" };
  if (score >= 85) return { label: "Very Satisfactory",   cls: "bg-blue-500/10 text-blue-600 border-blue-500/20" };
  if (score >= 75) return { label: "Satisfactory",        cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" };
  if (score >= 60) return { label: "Fair",                cls: "bg-amber-500/10 text-amber-600 border-amber-500/20" };
  return              { label: "Needs Improvement",        cls: "bg-red-500/10 text-red-600 border-red-500/20" };
}

function isPassing(score: number) { return score >= 75; }

function GradeInput({ value, onChange, label, desc }: { value: number; onChange: (v: number) => void; label: string; desc: string }) {
  const color = value === 0 ? "text-muted-foreground" : value >= 75 ? "text-emerald-600" : "text-red-500";
  return (
    <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-medium text-sm">{label}</div>
          <div className="text-xs text-muted-foreground">{desc}</div>
        </div>
        <span className={`text-2xl font-display font-black ${color}`}>{value > 0 ? value : "—"}</span>
      </div>
      <input
        type="range" min={0} max={100} step={1} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 accent-primary cursor-pointer"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
        <span>0</span><span>25</span><span>50</span><span>75 (pass)</span><span>100</span>
      </div>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 75 ? "text-emerald-600" : value >= 60 ? "text-amber-600" : "text-red-500";
  return (
    <div>
      <div className="flex justify-between items-center mb-1 text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-bold ${color}`}>{value}</span>
      </div>
      <Progress value={value} className="h-1.5" />
    </div>
  );
}

// ─── STUDENT VIEW ─────────────────────────────────────────────────────────────
function StudentEvaluations() {
  const { user } = useAuth();
  const { activeSpaceId } = useSpace();
  const { data: evals = [] } = useEvaluations(activeSpaceId);
  const { data: members = [] } = useSpaceMembers(activeSpaceId);
  const markRead = useMarkNotificationsRead('evaluations');
  useEffect(() => { markRead(); }, [markRead]);

  const myEvals = evals.filter(e => e.evaluateeId === user?.id);
  const getName = (id: number) => members.find(m => m.userId === id)?.user?.name ?? `User #${id}`;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500"><Award className="w-6 h-6" /></div>
        <div>
          <h1 className="text-3xl font-display font-bold">My Evaluations</h1>
          <p className="text-muted-foreground">Midterm and final performance ratings from your supervisor</p>
        </div>
      </div>

      {!activeSpaceId ? (
        <div className="flex flex-col items-center justify-center h-52 rounded-xl border-2 border-dashed border-border/50 bg-muted/20 text-center">
          <FolderOpen className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="font-medium text-muted-foreground">Select a space to view your evaluations</p>
        </div>
      ) : myEvals.length === 0 ? (
        <div className="text-center py-20 rounded-xl border-2 border-dashed border-border/50">
          <Award className="w-14 h-14 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">No evaluations yet</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">Your supervisor will submit midterm and final evaluations as part of your OJT program.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {myEvals.map(ev => {
            const avg = (ev.punctuality + ev.attitude + ev.technical + ev.communication + ev.overall) / 5;
            const grade = getGradeLabel(avg);
            const pass = isPassing(avg);
            return (
              <Card key={ev.id} className="border-border/50 shadow-sm overflow-hidden" data-testid={`card-eval-${ev.id}`}>
                <CardHeader className="bg-gradient-to-r from-amber-50 to-background dark:from-amber-950/20 dark:to-background border-b border-border/50">
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge className={`capitalize font-semibold ${ev.type === 'final' ? 'bg-violet-500/10 text-violet-600 border-violet-500/20' : 'bg-blue-500/10 text-blue-600 border-blue-500/20'}`}>
                          {ev.type} Evaluation
                        </Badge>
                        <Badge className={grade.cls}>{grade.label}</Badge>
                        <Badge className={pass ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" : "bg-red-500/10 text-red-700 border-red-500/20"}>
                          {pass ? <><CheckCircle2 className="w-3 h-3 mr-1" />PASSED</> : <><XCircle className="w-3 h-3 mr-1" />FAILED</>}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">By {getName(ev.evaluatorId)} · {ev.date ? format(new Date(ev.date + "T00:00:00"), "MMMM d, yyyy") : format(new Date(ev.createdAt), "MMMM d, yyyy")}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-5xl font-display font-black ${pass ? "text-emerald-600" : "text-red-500"}`}>{avg.toFixed(0)}</div>
                      <div className="text-xs text-muted-foreground">Overall Grade / 100</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid gap-3">
                    {CRITERIA.map(c => <ScoreBar key={c.key} label={c.label} value={ev[c.key]} />)}
                  </div>
                  {ev.comments && (
                    <div className="bg-muted/40 rounded-xl p-4 border-l-4 border-primary/40 mt-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Supervisor Comments</p>
                      <p className="text-sm italic leading-relaxed">"{ev.comments}"</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── MANAGER VIEW ─────────────────────────────────────────────────────────────
function ManagerEvaluations() {
  const { user } = useAuth();
  const { activeSpaceId } = useSpace();
  const { data: evals = [] } = useEvaluations(activeSpaceId);
  const { data: members = [] } = useSpaceMembers(activeSpaceId);
  const markRead = useMarkNotificationsRead('evaluations');
  useEffect(() => { markRead(); }, [markRead]);
  const { openUserProfile } = useUserProfileModal();
  const createEval = useCreateEvaluation(activeSpaceId);

  const [isOpen, setIsOpen] = useState(false);
  const [evaluateeId, setEvaluateeId] = useState("");
  const [type, setType] = useState<"midterm" | "final">("midterm");
  const [scores, setScores] = useState({ punctuality: 0, attitude: 0, technical: 0, communication: 0, overall: 0 });
  const [comments, setComments] = useState("");
  const [studentSearch, setStudentSearch] = useState(""); 

  const students = members.filter(m => m.user?.role === "student") as MemberRow[];
  const filteredStudents = studentSearch.trim()
    ? students.filter(m => m.user?.name?.toLowerCase().includes(studentSearch.toLowerCase()))
    : students;

  const getName = (id: number) => members.find(m => m.userId === id)?.user?.name ?? `User #${id}`;
  const getInitial = (id: number) => (members.find(m => m.userId === id)?.user?.name ?? "?").charAt(0).toUpperCase();

  const handleSubmit = async () => {
    if (!evaluateeId || Object.values(scores).some(v => v === 0)) return;
    await createEval.mutateAsync({
      spaceId: activeSpaceId!,
      evaluatorId: user!.id,
      evaluateeId: Number(evaluateeId),
      type,
      ...scores,
      comments,
      date: new Date().toISOString().split("T")[0],
    });
    setIsOpen(false);
    setScores({ punctuality: 0, attitude: 0, technical: 0, communication: 0, overall: 0 });
    setComments("");
    setEvaluateeId("");
    setStudentSearch("");
  };

  const resetForm = () => {
    setScores({ punctuality: 0, attitude: 0, technical: 0, communication: 0, overall: 0 });
    setComments("");
    setEvaluateeId("");
    setStudentSearch("");
    setType("midterm");
  };

  const avgScore = Object.values(scores).some(v => v > 0)
    ? (Object.values(scores).reduce((a, b) => a + b, 0) / 5)
    : 0;
  const formValid = evaluateeId && Object.values(scores).every(v => v > 0);

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500"><Award className="w-6 h-6" /></div>
          <div>
            <h1 className="text-3xl font-display font-bold">Evaluations</h1>
            <p className="text-muted-foreground">Rate intern performance — midterm and final (grade 1–100, pass ≥ 75)</p>
          </div>
        </div>
        <Button onClick={() => { resetForm(); setIsOpen(true); }} className="shadow-sm hover:-translate-y-0.5 transition-all" data-testid="button-new-evaluation">
          <PlusCircle className="w-4 h-4 mr-2" /> New Evaluation
        </Button>
      </div>

      {/* Student summary cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {students.map(m => {
          const studentEvals = evals.filter(e => e.evaluateeId === m.userId && e.punctuality != null);
          const hasMidterm = studentEvals.some(e => e.type === "midterm");
          const hasFinal = studentEvals.some(e => e.type === "final");
          const avgAll = studentEvals.length > 0
            ? studentEvals.reduce((s, e) => s + (e.punctuality + e.attitude + e.technical + e.communication + e.overall) / 5, 0) / studentEvals.length
            : null;
          const pass = avgAll !== null ? isPassing(avgAll) : null;
          return (
            <Card key={m.userId} className="border-border/50 shadow-sm overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                <div className="cursor-pointer hover:scale-105 transition-transform" onClick={() => openUserProfile(m.user)}>
                  <Avatar className="w-10 h-10">
        {m.user?.profilePicture ? (
          <AvatarImage src={m.user.profilePicture || ""} alt={m.user?.name ?? "User"} />
        ) : null}
        <AvatarFallback className="font-semibold bg-gradient-to-br from-primary to-primary/70 text-white">
          {getInitial(m.userId)}
        </AvatarFallback>
                  </Avatar>
                </div>
                  <div className="flex-1">
                    <div className="font-semibold">{m.user?.name}</div>
                    {avgAll !== null ? (
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-black font-display ${pass ? "text-emerald-600" : "text-red-500"}`}>{avgAll.toFixed(0)}/100</span>
                        <Badge className={pass ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-[10px]" : "bg-red-500/10 text-red-700 border-red-500/20 text-[10px]"}>
                          {pass ? "PASSED" : "FAILED"}
                        </Badge>
                      </div>
                    ) : <div className="text-xs text-muted-foreground">Not yet evaluated</div>}
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className={hasMidterm ? "text-emerald-600 border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30" : "text-muted-foreground"}>Midterm{hasMidterm ? " ✓" : ""}</Badge>
                    <Badge variant="outline" className={hasFinal ? "text-violet-600 border-violet-400 bg-violet-50 dark:bg-violet-950/30" : "text-muted-foreground"}>Final{hasFinal ? " ✓" : ""}</Badge>
                  </div>
                </div>
                {studentEvals.length > 0 && (() => {
                  const latest = studentEvals[studentEvals.length - 1];
                  return (
                    <div className="grid gap-2">
                      {CRITERIA.map(c => <ScoreBar key={c.key} label={c.label} value={latest[c.key]} />)}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* All evaluation history */}
      {evals.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" />Evaluation History</h2>
          {evals.filter(ev => ev.evaluateeId && ev.punctuality != null).map(ev => {
            const avg = ((ev.punctuality ?? 0) + (ev.attitude ?? 0) + (ev.technical ?? 0) + (ev.communication ?? 0) + (ev.overall ?? 0)) / 5;
            const pass = isPassing(avg);
            const dateStr = ev.date ? format(new Date(ev.date + "T00:00:00"), "MMM d, yyyy") : format(new Date(ev.createdAt), "MMM d, yyyy");
            return (
              <Card key={ev.id} className="border-border/50 shadow-sm" data-testid={`card-eval-${ev.id}`}>
                <CardContent className="p-5 flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-3 shrink-0">
                  <div className="cursor-pointer hover:scale-105 transition-transform" onClick={() => openUserProfile(members.find(m => m.userId === ev.evaluateeId)?.user || { id: ev.evaluateeId, name: getName(ev.evaluateeId) })}>
                    <Avatar className="w-9 h-9">
        {members.find(m => m.userId === ev.evaluateeId)?.user?.profilePicture ? (
          <AvatarImage src={members.find(m => m.userId === ev.evaluateeId)?.user?.profilePicture || ""} alt={getName(ev.evaluateeId)} />
        ) : null}
        <AvatarFallback className="font-semibold bg-gradient-to-br from-primary to-primary/70 text-white text-sm">
          {getInitial(ev.evaluateeId)}
        </AvatarFallback>
                    </Avatar>
                  </div>
                    <div>
                      <div className="font-semibold text-sm">{getName(ev.evaluateeId)}</div>
                      <div className="text-xs text-muted-foreground capitalize">{ev.type} · {dateStr}</div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 grid grid-cols-3 md:grid-cols-5 gap-2">
                    {CRITERIA.map(c => (
                      <div key={c.key}>
                        <div className="text-[10px] text-muted-foreground">{c.label.split(" ")[0]}</div>
                        <div className={`font-bold text-sm ${ev[c.key] >= 75 ? "text-emerald-600" : "text-red-500"}`}>{ev[c.key]}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-2xl font-display font-black ${pass ? "text-emerald-600" : "text-red-500"}`}>{avg.toFixed(0)}</span>
                    <Badge className={pass ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-[10px]" : "bg-red-500/10 text-red-700 border-red-500/20 text-[10px]"}>
                      {pass ? "PASSED" : "FAILED"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Evaluation Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Evaluation (Grade 1–100)</DialogTitle></DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Student</Label>
                {/* Searchable student selection */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={studentSearch}
                      onChange={e => setStudentSearch(e.target.value)}
                      placeholder="Search student..."
                      className="pl-9"
                      data-testid="input-student-search"
                    />
                  </div>
                  <div className="border border-border/50 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                    {filteredStudents.length === 0 ? (
                      <div className="p-3 text-sm text-muted-foreground text-center">No students found</div>
                    ) : filteredStudents.map(m => (
                      <button
                        key={m.userId}
                        type="button"
                        onClick={() => setEvaluateeId(String(m.userId))}
                        className={`flex items-center gap-3 w-full px-3 py-2.5 text-left transition-colors text-sm ${evaluateeId === String(m.userId) ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted"}`}
                        data-testid={`select-student-${m.userId}`}
                      >
                        <Avatar className="w-7 h-7">
        {m.user?.profilePicture ? (
          <AvatarImage src={m.user.profilePicture || ""} alt={m.user?.name} />
        ) : null}
        <AvatarFallback className="font-semibold bg-gradient-to-br from-primary to-primary/70 text-white text-xs">
          {m.user?.name?.charAt(0)?.toUpperCase()}
        </AvatarFallback>
      </Avatar>
                        <span>{m.user?.name}</span>
                        {evaluateeId === String(m.userId) && <CheckCircle2 className="w-4 h-4 ml-auto" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Evaluation Type</Label>
                <Select value={type} onValueChange={v => setType(v as "midterm" | "final")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="midterm">Midterm Evaluation</SelectItem>
                    <SelectItem value="final">Final Evaluation</SelectItem>
                  </SelectContent>
                </Select>

                {/* Live score preview */}
                {avgScore > 0 && (
                  <div className={`mt-4 p-4 rounded-xl text-center border ${isPassing(avgScore) ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30" : "bg-red-50 border-red-200 dark:bg-red-950/30"}`}>
                    <div className={`text-4xl font-display font-black ${isPassing(avgScore) ? "text-emerald-600" : "text-red-500"}`}>{avgScore.toFixed(0)}</div>
                    <div className="text-xs text-muted-foreground">Current Average</div>
                    <Badge className={`mt-1 ${isPassing(avgScore) ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" : "bg-red-500/10 text-red-700 border-red-500/20"}`}>
                      {isPassing(avgScore) ? "WILL PASS" : "WILL FAIL"}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {CRITERIA.map(c => (
                <GradeInput
                  key={c.key}
                  value={scores[c.key]}
                  onChange={v => setScores(prev => ({ ...prev, [c.key]: v }))}
                  label={c.label}
                  desc={c.desc}
                />
              ))}
            </div>

            <div className="space-y-2">
              <Label>Comments (optional)</Label>
              <Textarea value={comments} onChange={e => setComments(e.target.value)} placeholder="Write specific feedback and observations..." className="min-h-24" />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSubmit} disabled={createEval.isPending || !formValid} className="flex-1" data-testid="button-submit-evaluation">
                {createEval.isPending ? "Submitting..." : "Submit Evaluation"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function EvaluationsPage() {
  const { user } = useAuth();
  const isManager = user?.role === "supervisor" || user?.role === "school";
  return isManager ? <ManagerEvaluations /> : <StudentEvaluations />;
}
