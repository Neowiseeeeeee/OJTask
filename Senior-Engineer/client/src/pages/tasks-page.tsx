import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSpace } from "@/hooks/use-space";
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useSpaceMembers, useScrums } from "@/hooks/use-features";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCardWithPicture } from "@/components/user-card-with-picture";
import {
  Plus, Trash2, CheckCircle2, Clock, Circle, FolderOpen, User,
  ShieldCheck, BarChart3, Filter, ChevronDown, ChevronRight, FileText
} from "lucide-react";

const columns = [
  { id: "todo",  title: "To Do",       icon: Circle,       color: "text-slate-400" },
  { id: "doing", title: "In Progress", icon: Clock,        color: "text-blue-500" },
  { id: "done",  title: "Done",        icon: CheckCircle2, color: "text-emerald-500" },
];

type MemberRow = { id: number; userId: number; role: string; user: { id: number; name: string; role: string } };

// Get the latest approved scrum completion % for a user
function getLatestApprovedPct(scrums: any[], userId: number): number | null {
  const approved = scrums.filter(s => s.userId === userId && s.isApproved).sort((a: any, b: any) => b.date.localeCompare(a.date));
  if (approved.length === 0) return null;
  return approved[0].completionPercentage ?? 0;
}

// ─── STUDENT ──────────────────────────────────────────────────────────────────
function StudentTasks() {
  const { user } = useAuth();
  const { activeSpaceId } = useSpace();
  const { data: allTasks = [] } = useTasks(activeSpaceId);
  const { data: allScrums = [] } = useScrums(activeSpaceId);
  const createTask = useCreateTask(activeSpaceId);
  const updateTask = useUpdateTask(activeSpaceId);
  const deleteTask = useDeleteTask(activeSpaceId);

  const tasks = allTasks.filter(t => t.assignedToId === user?.id || t.authorId === user?.id);
  const scrumPct = user ? getLatestApprovedPct(allScrums, user.id) : null;
  const pct = scrumPct ?? 0;
  const hasScrumPct = scrumPct !== null;

  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [expandedTask, setExpandedTask] = useState<number | null>(null);

  const handleCreate = async () => {
    if (!title.trim()) return;
    await createTask.mutateAsync({ spaceId: activeSpaceId as any, title, description, type: "personal", status: "todo", authorId: user!.id, assignedToId: user!.id });
    setIsOpen(false);
    setTitle("");
    setDescription("");
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">My Tasks</h1>
          <p className="text-muted-foreground">Personal tasks and assigned work</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5" data-testid="button-new-task">
              <Plus className="w-4 h-4 mr-2" /> New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Personal Task</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2"><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Task title..." data-testid="input-task-title" /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Details..." data-testid="input-task-description" /></div>
              <Button onClick={handleCreate} disabled={createTask.isPending} className="mt-2" data-testid="button-save-task">
                {createTask.isPending ? "Creating..." : "Save Task"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <>
          {/* Completion progress from scrum */}
          <Card className="mb-6 border-border/50 shadow-sm bg-gradient-to-br from-primary/5 to-primary/0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm font-semibold"><BarChart3 className="w-4 h-4 text-primary" />My Progress</div>
                <span className={`text-lg font-display font-black ${hasScrumPct ? "text-primary" : "text-muted-foreground"}`}>{pct}%</span>
              </div>
              <Progress value={pct} className="h-2 mb-2" />
              {hasScrumPct ? (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Based on your latest supervisor-approved scrum report
                </p>
              ) : (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Submit a daily scrum with your completion % — it will appear here once your supervisor approves it
                </p>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {columns.map(col => (
              <div key={col.id} className="bg-muted/30 rounded-xl p-4 border border-border/50 min-h-[420px]">
                <div className="flex items-center gap-2 mb-4 font-semibold border-b border-border/50 pb-2">
                  <col.icon className={`w-5 h-5 ${col.color}`} />
                  {col.title}
                  <Badge variant="secondary" className="ml-auto bg-background">{tasks.filter(t => t.status === col.id).length}</Badge>
                </div>
                <div className="space-y-3">
                  {tasks.filter(t => t.status === col.id).map(task => (
                    <Card key={task.id} className="border-border/50 group transition-all hover:shadow-md" data-testid={`card-task-${task.id}`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="outline" className={`text-[10px] ${task.type === "assigned" ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground"}`}>
                            {task.type}
                          </Badge>
                          <button onClick={() => deleteTask.mutate(task.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity" data-testid={`button-delete-task-${task.id}`}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <h4 className="font-semibold text-sm mb-1 leading-snug">{task.title}</h4>
                        {task.description && (
                          <div>
                            <p className={`text-xs text-muted-foreground ${expandedTask === task.id ? "" : "line-clamp-2"} mb-1`}>{task.description}</p>
                            {task.description.length > 80 && (
                              <button onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)} className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                                {expandedTask === task.id ? <><ChevronDown className="w-3 h-3" />Less</> : <><ChevronRight className="w-3 h-3" />More</>}
                              </button>
                            )}
                          </div>
                        )}
                        <Select value={task.status} onValueChange={val => updateTask.mutate({ id: task.id, updates: { status: val } })}>
                          <SelectTrigger className="h-7 text-xs border-dashed bg-transparent mt-2" data-testid={`select-task-status-${task.id}`}><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todo">To Do</SelectItem>
                            <SelectItem value="doing">In Progress</SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                          </SelectContent>
                        </Select>
                      </CardContent>
                    </Card>
                  ))}
                  {tasks.filter(t => t.status === col.id).length === 0 && (
                    <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed border-border/50 rounded-lg">No tasks here</div>
                  )}
                </div>
              </div>
            ))}
          </div>
      </>
    </div>
  );
}

// ─── MANAGER ──────────────────────────────────────────────────────────────────
function ManagerTasks() {
  const { user } = useAuth();
  const { activeSpaceId } = useSpace();
  const { data: tasks = [] } = useTasks(activeSpaceId);
  const { data: scrums = [] } = useScrums(activeSpaceId);
  const { data: members = [] } = useSpaceMembers(activeSpaceId);
  const createTask = useCreateTask(activeSpaceId);
  const updateTask = useUpdateTask(activeSpaceId);
  const deleteTask = useDeleteTask(activeSpaceId);

  const isSupervisor = user?.role === "supervisor";
  const students = members.filter(m => m.user?.role === "student") as MemberRow[];
  const getName = (userId: number | null) => userId ? (members.find(m => m.userId === userId)?.user?.name ?? `User #${userId}`) : "Unassigned";
  const getInitial = (userId: number | null) => userId ? (members.find(m => m.userId === userId)?.user?.name ?? "?").charAt(0).toUpperCase() : "?";

  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [filterStudent, setFilterStudent] = useState("all");
  const [expandedTask, setExpandedTask] = useState<number | null>(null);

  const handleCreate = async () => {
    if (!title.trim() || !activeSpaceId) return;
    const assignedToIds = assignedTo.length > 0 ? assignedTo.map(Number) : [];
    const primaryAssignee = assignedToIds.length > 0 ? assignedToIds[0] : user!.id;
    
    await createTask.mutateAsync({
      spaceId: activeSpaceId, title, description,
      type: assignedToIds.length > 0 ? "assigned" : "personal",
      status: "todo", authorId: user!.id, 
      assignedToId: primaryAssignee,
      assignedToIds: assignedToIds.length > 0 ? assignedToIds : undefined
    });
    setIsOpen(false);
    setTitle(""); setDescription(""); setAssignedTo([]);
  };

  const filteredTasks = filterStudent === "all" ? tasks : tasks.filter(t => t.assignedToId === Number(filterStudent) || t.authorId === Number(filterStudent));

  // Per-student completion stats from scrums
  const studentStats = students.map(m => {
    const myTasks = tasks.filter(t => t.assignedToId === m.userId);
    const done = myTasks.filter(t => t.status === "done").length;
    const pct = getLatestApprovedPct(scrums, m.userId);
    return { member: m, total: myTasks.length, done, pct };
  });

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Task Board</h1>
          <p className="text-muted-foreground">
            {isSupervisor ? "Assign, manage, and track all intern tasks" : "Monitor all intern tasks and completion progress"}
          </p>
        </div>
        {isSupervisor && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5" data-testid="button-new-task">
                <Plus className="w-4 h-4 mr-2" /> Assign Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create & Assign Task</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2"><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Task title..." data-testid="input-task-title" /></div>
                <div className="space-y-2"><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the task in detail..." rows={3} /></div>
                <div className="space-y-2">
                  <Label>Assign To (Multiple Selection)</Label>
                  <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                    {students.map(m => (
                      <label key={m.userId} className="flex items-center cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors">
                        <input
                          type="checkbox"
                          checked={assignedTo.includes(String(m.userId))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAssignedTo([...assignedTo, String(m.userId)]);
                            } else {
                              setAssignedTo(assignedTo.filter(id => id !== String(m.userId)));
                            }
                          }}
                          className="mr-3 w-4 h-4 rounded border-border cursor-pointer"
                        />
                        <span className="text-sm">{m.user?.name}</span>
                      </label>
                    ))}
                  </div>
                  {assignedTo.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {assignedTo.length} student{assignedTo.length !== 1 ? 's' : ''} selected
                    </div>
                  )}
                </div>
                <Button onClick={handleCreate} disabled={createTask.isPending || !activeSpaceId} className="mt-2" data-testid="button-save-task">
                  {createTask.isPending ? "Creating..." : "Create Task"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!activeSpaceId ? (
        <div className="flex flex-col items-center justify-center h-52 rounded-xl border-2 border-dashed border-border/50 bg-muted/20 text-center">
          <FolderOpen className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="font-medium text-muted-foreground">Select a space to view tasks</p>
        </div>
      ) : (
        <>
          {/* Team completion overview from approved scrums */}
          {students.length > 0 && (
            <Card className="mb-6 border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />Team Completion Progress
                  <span className="text-xs font-normal text-muted-foreground ml-1">(from approved scrum reports)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                {studentStats.map(({ member, total, done, pct }) => (
                  <div key={member.userId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserCardWithPicture user={member.user!} size="sm" />
                        <span className="sr-only">{member.user?.name}</span>
                      </div>
                      <div className="text-right">
                        {pct !== null ? (
                          <span className="text-sm font-bold text-primary">{pct}%</span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No approved scrum yet</span>
                        )}
                      </div>
                    </div>
                    <Progress value={pct ?? 0} className="h-2" />
                    <div className="flex gap-3 text-[10px] text-muted-foreground">
                      <span>{total} tasks assigned</span>
                      <span>{done} marked done</span>
                      {pct !== null && <span className="text-emerald-600 font-semibold">{pct}% self-reported (supervisor-approved)</span>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Filter */}
          <div className="flex items-center gap-3 mb-4">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={filterStudent} onValueChange={setFilterStudent}>
              <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                {students.map(m => <SelectItem key={m.userId} value={String(m.userId)}>{m.user?.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {filterStudent !== "all" && (
              <span className="text-sm text-muted-foreground">
                Showing tasks for <span className="font-semibold text-foreground">{getName(Number(filterStudent))}</span>
              </span>
            )}
          </div>

          {/* Kanban board */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {columns.map(col => (
              <div key={col.id} className="bg-muted/30 rounded-xl p-4 border border-border/50 min-h-[420px]">
                <div className="flex items-center gap-2 mb-4 font-semibold border-b border-border/50 pb-2">
                  <col.icon className={`w-5 h-5 ${col.color}`} />
                  {col.title}
                  <Badge variant="secondary" className="ml-auto bg-background">{filteredTasks.filter(t => t.status === col.id).length}</Badge>
                </div>
                <div className="space-y-3">
                  {filteredTasks.filter(t => t.status === col.id).map(task => (
                    <Card
                      key={task.id}
                      className="border-border/50 group transition-all hover:shadow-md"
                      data-testid={`card-task-${task.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="outline" className={`text-[10px] ${task.type === "assigned" ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground"}`}>
                            {task.type}
                          </Badge>
                          {isSupervisor && (
                            <button onClick={() => deleteTask.mutate(task.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity shrink-0">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <h4 className="font-semibold text-sm mb-1 leading-snug">{task.title}</h4>

                        {task.description && (
                          <div className="mb-2">
                            <p className={`text-xs text-muted-foreground leading-relaxed ${expandedTask === task.id ? "" : "line-clamp-2"}`}>{task.description}</p>
                            {task.description.length > 80 && (
                              <button onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)} className="text-[10px] text-primary hover:underline flex items-center gap-0.5 mt-0.5">
                                {expandedTask === task.id ? <><ChevronDown className="w-3 h-3" />Show less</> : <><ChevronRight className="w-3 h-3" />Show more</>}
                              </button>
                            )}
                          </div>
                        )}

                        {task.assignedToId && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2 bg-muted/40 rounded-lg px-2 py-1.5">
                            <div className="scale-[0.5]">
                              <UserCardWithPicture user={members.find(m => m.userId === task.assignedToId)?.user || { id: task.assignedToId!, name: getName(task.assignedToId) } as any} size="sm" />
                            </div>
                            <span className="sr-only">{getName(task.assignedToId)}</span>
                          </div>
                        )}

                        {/* Status selector — supervisor only can change */}
                        {isSupervisor ? (
                          <Select value={task.status} onValueChange={val => updateTask.mutate({ id: task.id, updates: { status: val } })}>
                            <SelectTrigger className="h-7 text-xs border-dashed bg-transparent mt-2"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todo">To Do</SelectItem>
                              <SelectItem value="doing">In Progress</SelectItem>
                              <SelectItem value="done">Done</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="mt-2 h-7 text-xs text-muted-foreground flex items-center gap-1.5 px-2 bg-muted/30 rounded border border-dashed border-border/50">
                            {task.status === "todo" && <Circle className="w-3 h-3 text-slate-400" />}
                            {task.status === "doing" && <Clock className="w-3 h-3 text-blue-500" />}
                            {task.status === "done" && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                            {task.status === "todo" ? "To Do" : task.status === "doing" ? "In Progress" : "Done"}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {filteredTasks.filter(t => t.status === col.id).length === 0 && (
                    <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed border-border/50 rounded-lg">No tasks here</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function TasksPage() {
  const { user } = useAuth();
  const isManager = user?.role === "supervisor" || user?.role === "school";
  return isManager ? <ManagerTasks /> : <StudentTasks />;
}
