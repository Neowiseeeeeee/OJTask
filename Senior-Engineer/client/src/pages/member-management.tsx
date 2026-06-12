import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSpace } from "@/hooks/use-space";
import { useSpaceMembers } from "@/hooks/use-features";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Users,
  Search,
  UserMinus,
  ShieldCheck,
  GraduationCap,
  School,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  supervisor: { label: "Supervisor", color: "bg-purple-100 text-purple-700 border-purple-200", icon: ShieldCheck },
  school: { label: "School", color: "bg-blue-100 text-blue-700 border-blue-200", icon: School },
  student: { label: "Intern", color: "bg-green-100 text-green-700 border-green-200", icon: GraduationCap },
};

function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_CONFIG[role] ?? { label: role, color: "bg-muted text-muted-foreground border-border", icon: Users };
  const Icon = cfg.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border", cfg.color)}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

export default function MemberManagementPage() {
  const { user } = useAuth();
  const { activeSpace, activeSpaceId } = useSpace();
  const { data: members = [], isLoading } = useSpaceMembers(activeSpaceId);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [removeTarget, setRemoveTarget] = useState<any>(null);
  const [roleTarget, setRoleTarget] = useState<any>(null);
  const [newRole, setNewRole] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

  const canManage =
    user && (user.role === "supervisor" || user.role === "school" || user.role === "admin");

  const removeMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await fetch(`/api/spaces/${activeSpaceId}/members/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message ?? "Failed to remove member");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spaces/members", activeSpaceId] });
      toast({ title: "Member removed", description: "The member has been removed from this space." });
      setRemoveTarget(null);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setRemoveTarget(null);
    },
  });

  const roleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      const res = await fetch(`/api/spaces/${activeSpaceId}/members/${userId}/role`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message ?? "Failed to change role");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spaces/members", activeSpaceId] });
      toast({ title: "Role updated", description: "The member's role has been updated." });
      setRoleTarget(null);
      setNewRole("");
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleCopyCode = () => {
    if (activeSpace?.joinCode) {
      navigator.clipboard.writeText(activeSpace.joinCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const filtered = members.filter((m: any) => {
    const u = m.user;
    const name =
      u?.firstName && u?.lastName
        ? `${u.firstName} ${u.lastName}`
        : u?.name || u?.username || "";
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const counts = {
    all: members.length,
    supervisor: members.filter((m: any) => m.role === "supervisor").length,
    school: members.filter((m: any) => m.role === "school").length,
    student: members.filter((m: any) => m.role === "student").length,
  };

  if (!canManage) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Only supervisors can manage members.</p>
        </div>
      </div>
    );
  }

  if (!activeSpaceId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Space Selected</h2>
          <p className="text-muted-foreground">Select a space to manage its members.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold">Member Management</h1>
            <p className="text-muted-foreground">
              Manage members of{" "}
              <span className="font-medium text-foreground">{activeSpace?.name}</span>
            </p>
          </div>
        </div>

        {/* Join Code */}
        {activeSpace?.joinCode && (
          <Card className="border-border/50 shadow-sm">
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  Space Join Code
                </p>
                <p className="text-xl font-bold font-mono tracking-widest text-primary">
                  {activeSpace.joinCode}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyCode}
                className="gap-1.5"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCode ? "Copied" : "Copy"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Members", value: counts.all, color: "text-foreground" },
          { label: "Supervisors", value: counts.supervisor, color: "text-purple-600" },
          { label: "School", value: counts.school, color: "text-blue-600" },
          { label: "Interns", value: counts.student, color: "text-green-600" },
        ].map((s) => (
          <Card key={s.label} className="border-border/50 shadow-sm">
            <CardContent className="py-4 px-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{s.label}</p>
              <p className={cn("text-3xl font-bold mt-1", s.color)}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5">
          {(["all", "supervisor", "school", "student"] as const).map((r) => (
            <Button
              key={r}
              size="sm"
              variant={roleFilter === r ? "default" : "outline"}
              onClick={() => setRoleFilter(r)}
              className="capitalize"
            >
              {r === "all" ? "All" : r === "student" ? "Interns" : r.charAt(0).toUpperCase() + r.slice(1)}
              <span className="ml-1.5 text-xs opacity-70">{counts[r as keyof typeof counts]}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Member List */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            {filtered.length} {filtered.length === 1 ? "member" : "members"} found
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-3" />
              Loading members...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <Users className="w-10 h-10 opacity-30" />
              <p className="font-medium">No members found</p>
              <p className="text-sm opacity-70">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {filtered.map((m: any) => {
                const u = m.user;
                const displayName =
                  u?.firstName && u?.lastName
                    ? `${u.firstName} ${u.lastName}`
                    : u?.name || u?.username || `User #${m.userId}`;
                const initial = displayName.charAt(0).toUpperCase();
                const isOwner = activeSpace?.ownerId === m.userId;
                const isMe = user?.id === m.userId;

                return (
                  <div
                    key={m.userId}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors"
                  >
                    <Avatar className="w-10 h-10 shrink-0">
                      {u?.profilePicture ? (
                        <AvatarImage src={u.profilePicture} alt={displayName} />
                      ) : null}
                      <AvatarFallback className="font-bold bg-gradient-to-br from-primary to-primary/70 text-white">
                        {initial}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm truncate">{displayName}</span>
                        {isOwner && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200 font-medium">
                            Owner
                          </span>
                        )}
                        {isMe && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border font-medium">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        @{u?.username || `user_${m.userId}`}
                      </p>
                    </div>

                    <RoleBadge role={m.role} />

                    {!isMe && !isOwner && (
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setRoleTarget(m);
                            setNewRole(m.role);
                          }}
                          className="text-xs gap-1.5 h-8"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Change Role
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setRemoveTarget(m)}
                          className="text-xs gap-1.5 h-8 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 hover:border-destructive/50"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-semibold text-foreground">
                {removeTarget?.user?.firstName && removeTarget?.user?.lastName
                  ? `${removeTarget.user.firstName} ${removeTarget.user.lastName}`
                  : removeTarget?.user?.name || `User #${removeTarget?.userId}`}
              </span>{" "}
              from this space? They will lose access to all space content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeMutation.mutate(removeTarget.userId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeMutation.isPending ? "Removing..." : "Remove Member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Role Dialog */}
      <Dialog open={!!roleTarget} onOpenChange={(o) => !o && setRoleTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Member Role</DialogTitle>
            <DialogDescription>
              Update the role for{" "}
              <span className="font-semibold text-foreground">
                {roleTarget?.user?.firstName && roleTarget?.user?.lastName
                  ? `${roleTarget.user.firstName} ${roleTarget.user.lastName}`
                  : roleTarget?.user?.name || `User #${roleTarget?.userId}`}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Intern (Student)</SelectItem>
                <SelectItem value="school">School Coordinator</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRoleTarget(null)}>
                Cancel
              </Button>
              <Button
                onClick={() =>
                  roleMutation.mutate({ userId: roleTarget.userId, role: newRole })
                }
                disabled={!newRole || newRole === roleTarget?.role || roleMutation.isPending}
              >
                {roleMutation.isPending ? "Saving..." : "Save Role"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
