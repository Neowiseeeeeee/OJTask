import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSpace } from "@/hooks/use-space";
import { useScrums, useCreateScrum, useApproveScrum, useSpaceMembers, useDeleteScrum } from "@/hooks/use-features";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { useUserProfileModal } from "@/hooks/use-user-profile-modal";
import { FileText, FolderOpen, CheckCircle, Clock, Users, Filter, BarChart3, Lock, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Member = { id: number; userId: number; role: string; user: { id: number; name: string; role: string } };

// ─── STUDENT VIEW ─────────────────────────────────────────────────────────────
function StudentScrums() {
  const { user } = useAuth();
  const { activeSpaceId } = useSpace();
  const { data: allScrums = [] } = useScrums(activeSpaceId);
  const createScrum = useCreateScrum(activeSpaceId);
  const deleteScrum = useDeleteScrum(activeSpaceId);
  const { toast } = useToast();

  const scrums = allScrums.filter(s => s.userId === user?.id);
  const latestApproved = scrums.filter(s => s.isApproved).sort((a, b) => b.date.localeCompare(a.date))[0];

  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    taskYesterdayPlanned: "", taskYesterdayCompleted: "",
    taskTodayPlanned: "", taskTodayCompleted: "",
    whatNext: "", timeSpent: "8", reflection: "",
    completionPercentage: "0",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const pctValue = Math.min(100, Math.max(0, parseInt(formData.completionPercentage, 10) || 0));

  const handleSubmit = async () => {
    if (!activeSpaceId) return;
    await createScrum.mutateAsync({
      spaceId: activeSpaceId,
      userId: user!.id,
      ...formData,
      timeSpent: parseInt(formData.timeSpent, 10),
      completionPercentage: pctValue,
    });
    setIsOpen(false);
    setFormData({
      date: new Date().toISOString().split("T")[0],
      taskYesterdayPlanned: "", taskYesterdayCompleted: "",
      taskTodayPlanned: "", taskTodayCompleted: "",
      whatNext: "", timeSpent: "8", reflection: "",
      completionPercentage: "0",
    });
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Daily Scrum</h1>
          <p className="text-muted-foreground">Submit your daily progress report</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5" data-testid="button-write-scrum">
              <FileText className="w-4 h-4 mr-2" /> Write Scrum
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Daily Scrum Report</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Date</Label><Input type="date" name="date" value={formData.date} onChange={handleChange} /></div>
                <div className="space-y-2"><Label>Hours Spent</Label><Input type="number" name="timeSpent" value={formData.timeSpent} onChange={handleChange} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Yesterday – Planned</Label><Textarea name="taskYesterdayPlanned" value={formData.taskYesterdayPlanned} onChange={handleChange} placeholder="What did you plan?" /></div>
                <div className="space-y-2"><Label>Yesterday – Completed</Label><Textarea name="taskYesterdayCompleted" value={formData.taskYesterdayCompleted} onChange={handleChange} placeholder="What did you finish?" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Today – Planned</Label><Textarea name="taskTodayPlanned" value={formData.taskTodayPlanned} onChange={handleChange} placeholder="What will you do today?" /></div>
                <div className="space-y-2"><Label>Today – Done so far</Label><Textarea name="taskTodayCompleted" value={formData.taskTodayCompleted} onChange={handleChange} placeholder="What's done already?" /></div>
              </div>
              <div className="space-y-2"><Label>What's Next?</Label><Textarea name="whatNext" value={formData.whatNext} onChange={handleChange} placeholder="Tomorrow's plan?" /></div>
              <div className="space-y-2"><Label>Blockers / Reflection</Label><Textarea name="reflection" value={formData.reflection} onChange={handleChange} placeholder="Any blockers or thoughts?" /></div>

              {/* Completion Percentage */}
              <div className="space-y-3 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold text-sm">Overall Task Completion</Label>
                  <span className="text-2xl font-display font-black text-primary">{pctValue}%</span>
                </div>
                <p className="text-xs text-muted-foreground">Enter your estimated overall completion of all assigned tasks. This will only show on your task board after your supervisor approves this scrum.</p>
                <input
                  type="range"
                  name="completionPercentage"
                  min="0"
                  max="100"
                  step="1"
                  value={formData.completionPercentage}
                  onChange={handleChange}
                  className="w-full accent-primary cursor-pointer"
                  data-testid="slider-completion-percentage"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>0% – Not started</span>
                  <span>50% – Halfway</span>
                  <span>100% – Complete</span>
                </div>
                <Progress value={pctValue} className="h-2" />
              </div>

              <Button onClick={handleSubmit} disabled={createScrum.isPending || !activeSpaceId} className="mt-2 w-full" data-testid="button-submit-scrum">
                {createScrum.isPending ? "Submitting..." : "Submit Scrum Report"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Approved completion indicator */}
      {latestApproved && (
        <Card className="mb-6 border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                <BarChart3 className="w-4 h-4" /> Current Approved Completion
              </div>
              <span className="text-2xl font-display font-black text-emerald-600">{latestApproved.completionPercentage}%</span>
            </div>
            <Progress value={latestApproved.completionPercentage} className="h-2 mb-1" />
            <p className="text-xs text-muted-foreground">From scrum on {format(new Date(latestApproved.date + "T00:00:00"), "MMMM d, yyyy")} · approved by supervisor</p>
          </CardContent>
        </Card>
      )}

      {!activeSpaceId ? (
        <div className="flex flex-col items-center justify-center h-52 rounded-xl border-2 border-dashed border-border/50 bg-muted/20 text-center">
          <FolderOpen className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="font-medium text-muted-foreground">Select a space to view your scrum reports</p>
        </div>
      ) : scrums.length === 0 ? (
        <div className="text-center py-16 rounded-xl border-2 border-dashed border-border/50">
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-medium text-muted-foreground">No scrums yet. Submit your first daily report!</p>
        </div>
      ) : (
        <div className="grid gap-5">
          {scrums.map(scrum => (
            <Card key={scrum.id} className="border-border/50 shadow-sm" data-testid={`card-scrum-${scrum.id}`}>
              <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <CardTitle className="text-base">{format(new Date(scrum.date + "T00:00:00"), "MMMM d, yyyy")}</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium px-2.5 py-1 bg-background rounded-md border border-border/50">{scrum.timeSpent}h</span>
                    {/* Completion badge */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-md border border-primary/20 text-sm font-bold">
                      <BarChart3 className="w-3.5 h-3.5" />
                      {scrum.completionPercentage}%
                      {!scrum.isApproved && <Lock className="w-3 h-3 text-muted-foreground ml-0.5" />}
                    </div>
                    {scrum.isApproved
                      ? <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>
                      : <Badge variant="outline" className="text-amber-600 border-amber-400/40"><Clock className="w-3 h-3 mr-1" />Pending</Badge>}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={scrum.isApproved || deleteScrum.isPending}
                      title={scrum.isApproved ? "Cannot delete an approved scrum" : "Delete this scrum"}
                      className={`h-7 w-7 p-0 ${scrum.isApproved ? "opacity-40 cursor-not-allowed" : "text-red-500 border-red-300 hover:bg-red-50"}`}
                      onClick={async () => {
                        try {
                          await deleteScrum.mutateAsync(scrum.id);
                          toast({ title: "Scrum deleted", description: "Your scrum report has been removed." });
                        } catch (e: any) {
                          toast({ title: "Delete failed", description: e.message, variant: "destructive" });
                        }
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                {!scrum.isApproved && (
                  <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Completion % will reflect on your task board once your supervisor approves this scrum.
                  </p>
                )}
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Yesterday</h4>
                  <p className="text-sm bg-muted/20 p-3 rounded-lg mb-2"><span className="font-medium text-muted-foreground">Planned: </span>{scrum.taskYesterdayPlanned}</p>
                  <p className="text-sm bg-muted/20 p-3 rounded-lg"><span className="font-medium text-muted-foreground">Done: </span>{scrum.taskYesterdayCompleted}</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Today</h4>
                  <p className="text-sm bg-muted/20 p-3 rounded-lg mb-2"><span className="font-medium text-muted-foreground">Planned: </span>{scrum.taskTodayPlanned}</p>
                  <p className="text-sm bg-muted/20 p-3 rounded-lg"><span className="font-medium text-muted-foreground">Done so far: </span>{scrum.taskTodayCompleted}</p>
                </div>
                <div className="md:col-span-2 grid md:grid-cols-2 gap-5 pt-4 border-t border-border/50">
                  <div><h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">What's Next</h4><p className="text-sm">{scrum.whatNext}</p></div>
                  <div><h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Reflection</h4><p className="text-sm italic border-l-2 border-primary/40 pl-3">{scrum.reflection}</p></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MANAGER VIEW ─────────────────────────────────────────────────────────────
function ManagerScrums() {
  const { user } = useAuth();
  const { activeSpaceId } = useSpace();
  const { data: scrums = [] } = useScrums(activeSpaceId);
  const { data: members = [] } = useSpaceMembers(activeSpaceId);
  const { openUserProfile } = useUserProfileModal();
  const approveScrum = useApproveScrum(activeSpaceId);

  const isSupervisor = user?.role === "supervisor";
  const [filterStudent, setFilterStudent] = useState("all");
  const students = members.filter(m => m.user?.role === "student") as Member[];

  const getName = (userId: number) => members.find(m => m.userId === userId)?.user?.name ?? `User #${userId}`;
  const getInitial = (userId: number) => (members.find(m => m.userId === userId)?.user?.name ?? "?").charAt(0).toUpperCase();

  const filtered = filterStudent === "all" ? scrums : scrums.filter(s => s.userId === Number(filterStudent));
  const pending = scrums.filter(s => !s.isApproved).length;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Scrum Reports</h1>
          <p className="text-muted-foreground">
            {isSupervisor ? "Review and approve student daily reports" : "Monitor student daily progress reports"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isSupervisor && (
            <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50 dark:bg-blue-950/30 px-3 py-1.5 text-sm">
              Monitor only — approval is for supervisors
            </Badge>
          )}
          {pending > 0 && isSupervisor && (
            <Badge variant="outline" className="text-amber-600 border-amber-400 bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 text-sm">
              <Clock className="w-3.5 h-3.5 mr-1.5" />{pending} awaiting approval
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={filterStudent} onValueChange={setFilterStudent}>
          <SelectTrigger className="w-52" data-testid="select-filter-student"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Students</SelectItem>
            {students.map(m => <SelectItem key={m.userId} value={String(m.userId)}>{m.user?.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {!activeSpaceId ? (
        <div className="flex flex-col items-center justify-center h-52 rounded-xl border-2 border-dashed border-border/50 bg-muted/20 text-center">
          <FolderOpen className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="font-medium text-muted-foreground">Select a space to view scrum reports</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-xl border-2 border-dashed border-border/50">
          <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-medium text-muted-foreground">No scrum reports found.</p>
        </div>
      ) : (
        <div className="grid gap-5">
          {filtered.map(scrum => (
            <Card key={scrum.id} className={`border-border/50 shadow-sm ${!scrum.isApproved ? 'border-l-4 border-l-amber-400' : 'border-l-4 border-l-emerald-400'}`} data-testid={`card-scrum-${scrum.id}`}>
              <CardHeader className="bg-muted/20 border-b border-border/40 pb-4">
                <div className="flex justify-between items-center flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="cursor-pointer hover:scale-105 transition-transform" onClick={() => openUserProfile(members.find(m => m.userId === scrum.userId)?.user || { id: scrum.userId, name: getName(scrum.userId) })}>
                      <Avatar className="w-9 h-9">
        {members.find(m => m.userId === scrum.userId)?.user?.profilePicture ? (
          <AvatarImage src={members.find(m => m.userId === scrum.userId)?.user?.profilePicture || ""} alt={getName(scrum.userId)} />
        ) : null}
        <AvatarFallback className="font-semibold bg-gradient-to-br from-primary to-primary/70 text-white text-sm">
          {getInitial(scrum.userId)}
        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div>
                      <div className="font-semibold">{getName(scrum.userId)}</div>
                      <div className="text-xs text-muted-foreground">{format(new Date(scrum.date + "T00:00:00"), "MMMM d, yyyy")} · {scrum.timeSpent}h</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Completion percentage chip */}
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-sm font-bold ${scrum.isApproved ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 border-emerald-200 dark:border-emerald-800/50" : "bg-amber-50 dark:bg-amber-950/20 text-amber-700 border-amber-200 dark:border-amber-800/50"}`}>
                      <BarChart3 className="w-3.5 h-3.5" />
                      {scrum.completionPercentage}%
                      {!scrum.isApproved && <span className="text-[10px] font-normal ml-0.5">pending</span>}
                    </div>
                    {scrum.isApproved
                      ? <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>
                      : isSupervisor ? (
                        <Button size="sm" onClick={() => approveScrum.mutate(scrum.id)} disabled={approveScrum.isPending} className="h-8 text-xs" data-testid={`button-approve-scrum-${scrum.id}`}>
                          <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                        </Button>
                      ) : (
                        <Badge variant="outline" className="text-amber-600 border-amber-400/40"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
                      )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Yesterday</h4>
                  <p className="text-sm text-muted-foreground mb-1"><span className="text-foreground font-medium">Planned:</span> {scrum.taskYesterdayPlanned}</p>
                  <p className="text-sm text-muted-foreground"><span className="text-foreground font-medium">Done:</span> {scrum.taskYesterdayCompleted}</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Today</h4>
                  <p className="text-sm text-muted-foreground mb-1"><span className="text-foreground font-medium">Planned:</span> {scrum.taskTodayPlanned}</p>
                  <p className="text-sm text-muted-foreground"><span className="text-foreground font-medium">Done:</span> {scrum.taskTodayCompleted}</p>
                </div>
                <div className="md:col-span-2 border-t border-border/40 pt-3 grid md:grid-cols-2 gap-4">
                  <p className="text-sm"><span className="font-medium text-muted-foreground">What's next: </span>{scrum.whatNext}</p>
                  <p className="text-sm italic border-l-2 border-primary/30 pl-3 text-muted-foreground">{scrum.reflection}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ScrumsPage() {
  const { user } = useAuth();
  const isManager = user?.role === "supervisor" || user?.role === "school";
  return isManager ? <ManagerScrums /> : <StudentScrums />;
}
