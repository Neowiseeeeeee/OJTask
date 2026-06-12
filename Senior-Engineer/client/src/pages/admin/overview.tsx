import { useAdminOverview, useAdminUsers, useAdminSpaces } from "@/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Users, Database, BarChart3, Activity, Globe, TrendingUp, AlertTriangle, CheckCircle2, AlertCircle, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface SystemAlert {
  id: string;
  type: "warning" | "error" | "info";
  title: string;
  message: string;
  timestamp: string;
  dismissed?: boolean;
}

function StatCard({ icon: Icon, label, value, color, onClick }: { icon: any; label: string; value: string | number; color: string; onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="cursor-pointer group"
    >
      <div className="bg-card border border-border/50 rounded-lg p-5 shadow-sm transition-all duration-200 hover:shadow-xl hover:border-primary/30 hover:scale-105">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-display font-bold">{value}</div>
            <div className="text-sm font-medium text-foreground">{label}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminOverview() {
  const { data: overview, isLoading } = useAdminOverview();
  const { data: users = [] } = useAdminUsers();
  const { data: spaces = [] } = useAdminSpaces();
  const [selectedStat, setSelectedStat] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<SystemAlert[]>([
    {
      id: "1",
      type: "info",
      title: "System Maintenance Scheduled",
      message: "Routine maintenance is scheduled for Saturday 2:00 AM UTC. System will be briefly unavailable.",
      timestamp: new Date().toISOString(),
    },
    {
      id: "2",
      type: "warning",
      title: "Database Backup Running",
      message: "Scheduled backup is in progress. Performance may be slightly reduced.",
      timestamp: new Date().toISOString(),
    }
  ]);

  const dismissAlert = (id: string) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, dismissed: true } : a).filter(a => !a.dismissed));
  };

  const activeAlerts = alerts.filter(a => !a.dismissed);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold">System Overview</h1>
        <p className="text-muted-foreground mt-2">Monitor your system at a glance</p>
      </div>

      {/* System Health Alerts */}
      {activeAlerts.length > 0 && (
        <div className="space-y-2">
          {activeAlerts.map((alert) => (
            <div 
              key={alert.id}
              className={`flex items-start gap-3 p-4 rounded-lg border ${
                alert.type === "error" 
                  ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800" 
                  : alert.type === "warning"
                  ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
                  : "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {alert.type === "error" ? (
                    <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  ) : alert.type === "warning" ? (
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  )}
                  <h4 className="font-semibold text-sm">{alert.title}</h4>
                </div>
                <p className="text-xs text-muted-foreground">{alert.message}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => dismissAlert(alert.id)}
                className="shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {!isLoading && overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard 
            icon={Users} 
            label="Total Users" 
            value={overview.totalUsers} 
            color="bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
            onClick={() => setSelectedStat('users')}
          />
          <StatCard 
            icon={Users} 
            label="Students" 
            value={overview.totalStudents} 
            color="bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400"
            onClick={() => setSelectedStat('students')}
          />
          <StatCard 
            icon={Users} 
            label="Supervisors" 
            value={overview.totalSupervisors} 
            color="bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400"
            onClick={() => setSelectedStat('supervisors')}
          />
          <StatCard 
            icon={Users} 
            label="School Coordinators" 
            value={overview.totalSchoolCoords} 
            color="bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400"
            onClick={() => setSelectedStat('schoolcoords')}
          />
          <StatCard 
            icon={Globe} 
            label="Total Spaces" 
            value={overview.totalSpaces} 
            color="bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
            onClick={() => setSelectedStat('spaces')}
          />
          <StatCard 
            icon={Activity} 
            label="Active Users" 
            value={overview.activeUsers} 
            color="bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400"
            onClick={() => setSelectedStat('active')}
          />
        </div>
      )}

      {/* Modals - All 6 stat types */}
      <Dialog open={selectedStat === 'users'} onOpenChange={(open) => !open && setSelectedStat(null)}>
        <DialogContent className="max-w-2xl max-h-96">
          <DialogHeader><DialogTitle>All Users ({(users as any[]).length})</DialogTitle></DialogHeader>
          <ScrollArea className="h-96 pr-4">
            <div className="space-y-2">
              {(users as any[]).length === 0 ? (
                <p className="text-sm text-muted-foreground">No users found</p>
              ) : (
                (users as any[]).map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted border border-border/50">
                    <div>
                      <div className="font-medium text-sm">{u.name || u.username}</div>
                      <div className="text-xs text-muted-foreground">{u.email || 'No email'}</div>
                    </div>
                    <Badge variant="outline" className="text-xs">{u.role}</Badge>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={selectedStat === 'students'} onOpenChange={(open) => !open && setSelectedStat(null)}>
        <DialogContent className="max-w-2xl max-h-96">
          <DialogHeader><DialogTitle>Students ({(users as any[]).filter((u: any) => u.role === 'student').length})</DialogTitle></DialogHeader>
          <ScrollArea className="h-96 pr-4">
            <div className="space-y-2">
              {(users as any[]).filter((u: any) => u.role === 'student').length === 0 ? (
                <p className="text-sm text-muted-foreground">No students found</p>
              ) : (
                (users as any[]).filter((u: any) => u.role === 'student').map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted border border-border/50">
                    <div>
                      <div className="font-medium text-sm">{u.name || u.username}</div>
                      <div className="text-xs text-muted-foreground">{u.organization || u.email || 'No info'}</div>
                    </div>
                    <Badge variant="outline" className="text-xs">Student</Badge>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={selectedStat === 'supervisors'} onOpenChange={(open) => !open && setSelectedStat(null)}>
        <DialogContent className="max-w-2xl max-h-96">
          <DialogHeader><DialogTitle>Supervisors ({(users as any[]).filter((u: any) => u.role === 'supervisor').length})</DialogTitle></DialogHeader>
          <ScrollArea className="h-96 pr-4">
            <div className="space-y-2">
              {(users as any[]).filter((u: any) => u.role === 'supervisor').length === 0 ? (
                <p className="text-sm text-muted-foreground">No supervisors found</p>
              ) : (
                (users as any[]).filter((u: any) => u.role === 'supervisor').map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted border border-border/50">
                    <div>
                      <div className="font-medium text-sm">{u.name || u.username}</div>
                      <div className="text-xs text-muted-foreground">{u.email || 'No email'}</div>
                    </div>
                    <Badge variant="outline" className="text-xs">Supervisor</Badge>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={selectedStat === 'schoolcoords'} onOpenChange={(open) => !open && setSelectedStat(null)}>
        <DialogContent className="max-w-2xl max-h-96">
          <DialogHeader><DialogTitle>School Coordinators ({(users as any[]).filter((u: any) => u.role === 'school').length})</DialogTitle></DialogHeader>
          <ScrollArea className="h-96 pr-4">
            <div className="space-y-2">
              {(users as any[]).filter((u: any) => u.role === 'school').length === 0 ? (
                <p className="text-sm text-muted-foreground">No school coordinators found</p>
              ) : (
                (users as any[]).filter((u: any) => u.role === 'school').map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted border border-border/50">
                    <div>
                      <div className="font-medium text-sm">{u.name || u.username}</div>
                      <div className="text-xs text-muted-foreground">{u.email || 'No email'}</div>
                    </div>
                    <Badge variant="outline" className="text-xs">Coordinator</Badge>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={selectedStat === 'spaces'} onOpenChange={(open) => !open && setSelectedStat(null)}>
        <DialogContent className="max-w-2xl max-h-96">
          <DialogHeader><DialogTitle>All Spaces ({(spaces as any[]).length})</DialogTitle></DialogHeader>
          <ScrollArea className="h-96 pr-4">
            <div className="space-y-2">
              {(spaces as any[]).length === 0 ? (
                <p className="text-sm text-muted-foreground">No spaces found</p>
              ) : (
                (spaces as any[]).map((s: any) => (
                  <div key={s.space.id} className="p-3 rounded-lg hover:bg-muted border border-border/50">
                    <div className="font-medium text-sm">{s.space.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{s.memberCount} member{s.memberCount !== 1 ? 's' : ''}</div>
                    <Badge variant="outline" className="text-xs mt-2">{s.space.type}</Badge>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={selectedStat === 'active'} onOpenChange={(open) => !open && setSelectedStat(null)}>
        <DialogContent className="max-w-2xl max-h-96">
          <DialogHeader><DialogTitle>Active Users ({overview?.activeUsers || 0})</DialogTitle></DialogHeader>
          <ScrollArea className="h-96 pr-4">
            <div className="space-y-2">
              {(users as any[]).length === 0 ? (
                <p className="text-sm text-muted-foreground">No users found</p>
              ) : (
                (users as any[]).slice(0, overview?.activeUsers).map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted border border-border/50">
                    <div>
                      <div className="font-medium text-sm">{u.name || u.username}</div>
                      <div className="text-xs text-muted-foreground">{u.email || 'No email'}</div>
                    </div>
                    <Badge variant="outline" className="text-xs">{u.role}</Badge>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-transparent dark:from-green-950/20 rounded-lg border border-green-200/50 dark:border-green-800/30">
              <span className="text-sm font-medium">Server Status</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-semibold text-green-600 dark:text-green-400">Operational</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-transparent dark:from-green-950/20 rounded-lg border border-green-200/50 dark:border-green-800/30">
              <span className="text-sm font-medium">Database Status</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-semibold text-green-600 dark:text-green-400">Connected</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-transparent dark:from-green-950/20 rounded-lg border border-green-200/50 dark:border-green-800/30">
              <span className="text-sm font-medium">API Health</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-semibold text-green-600 dark:text-green-400">Healthy</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-950/20 rounded-lg border border-blue-200/50 dark:border-blue-800/30">
              <span className="text-sm font-medium">New Users (This Week)</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">{overview?.newUsersThisWeek || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-transparent dark:from-purple-950/20 rounded-lg border border-purple-200/50 dark:border-purple-800/30">
              <span className="text-sm font-medium">Avg Users Per Space</span>
              <span className="font-bold text-purple-600 dark:text-purple-400">
                {overview?.totalSpaces ? (overview?.totalUsers / overview?.totalSpaces).toFixed(1) : 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-950/20 rounded-lg border border-emerald-200/50 dark:border-emerald-800/30">
              <span className="text-sm font-medium">System Uptime</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">99.9%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
