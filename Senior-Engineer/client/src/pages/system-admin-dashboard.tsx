import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useAdminOverview, useAdminUsers, useAdminSpaces, useAnalyticsUserGrowth, useSystemLogs } from "@/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserCard } from "@/components/user-card";
import { UserCardWithPicture } from "@/components/user-card-with-picture";
import { UserProfileModal } from "@/components/user-profile-modal";
import { Users, Database, BarChart3, Activity, Search, Shield, Users2, Globe, TrendingUp } from "lucide-react";

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

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data: overview, isLoading: overviewLoading } = useAdminOverview();
  const { data: users = [], isLoading: usersLoading } = useAdminUsers();
  const { data: spaces = [], isLoading: spacesLoading } = useAdminSpaces();
  const { data: analytics = [] } = useAnalyticsUserGrowth();
  const { data: logs = [] } = useSystemLogs(50);

  const [userSearch, setUserSearch] = useState("");
  const [spaceSearch, setSpaceSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [spaceTypeFilter, setSpaceTypeFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedStat, setSelectedStat] = useState<string | null>(null);

  // Filter users
  const filteredUsers = (users as any[]).filter((u: any) => {
    const matchesSearch = u.username.toLowerCase().includes(userSearch.toLowerCase()) || 
                         u.name.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = !userRoleFilter || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  // Filter spaces
  const filteredSpaces = (spaces as any[]).filter((s: any) => {
    const matchesSearch = s.space.name.toLowerCase().includes(spaceSearch.toLowerCase());
    const matchesType = !spaceTypeFilter || s.space.type === spaceTypeFilter;
    return matchesSearch && matchesType;
  });

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Admin Access Required</h1>
          <p className="text-muted-foreground mt-2">You do not have permission to access this dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">System oversight and management</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {!overviewLoading && overview ? (
          <>
            <StatCard 
              icon={Users} 
              label="Total Users" 
              value={overview.totalUsers} 
              color="bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
              onClick={() => setSelectedStat('users')}
            />
            <StatCard 
              icon={Users2} 
              label="Total Students" 
              value={overview.totalStudents} 
              color="bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400"
              onClick={() => setSelectedStat('students')}
            />
            <StatCard 
              icon={Globe} 
              label="Total Spaces" 
              value={overview.totalSpaces} 
              color="bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400"
              onClick={() => setSelectedStat('spaces')}
            />
            <StatCard 
              icon={Activity} 
              label="Active Users" 
              value={overview.activeUsers} 
              color="bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400"
              onClick={() => setSelectedStat('activity')}
            />
          </>
        ) : (
          <div className="col-span-4 text-center py-8 text-muted-foreground">Loading stats...</div>
        )}
      </div>

      {/* Users Modal */}
      <Dialog open={selectedStat === 'users'} onOpenChange={(open) => !open && setSelectedStat(null)}>
        <DialogContent className="max-w-2xl max-h-96">
          <DialogHeader><DialogTitle>All Users ({users.length})</DialogTitle></DialogHeader>
          <ScrollArea className="h-96 pr-4">
            <div className="space-y-2">
              {users.length === 0 ? (
                <p className="text-sm text-muted-foreground">No users found</p>
              ) : (
                (users as any[]).map((u: any) => (
                  <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer" onClick={() => { setSelectedUser(u); setShowUserModal(true); setSelectedStat(null); }}>
                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                      {u.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{u.name || u.username}</div>
                      <div className="text-xs text-muted-foreground">{u.email || u.username}</div>
                    </div>
                    <Badge variant="outline" className="text-xs">{u.role}</Badge>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Students Modal */}
      <Dialog open={selectedStat === 'students'} onOpenChange={(open) => !open && setSelectedStat(null)}>
        <DialogContent className="max-w-2xl max-h-96">
          <DialogHeader><DialogTitle>All Students ({(users as any[]).filter(u => u.role === 'student').length})</DialogTitle></DialogHeader>
          <ScrollArea className="h-96 pr-4">
            <div className="space-y-2">
              {(users as any[]).filter(u => u.role === 'student').length === 0 ? (
                <p className="text-sm text-muted-foreground">No students found</p>
              ) : (
                (users as any[]).filter(u => u.role === 'student').map(u => (
                  <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer" onClick={() => { setSelectedUser(u); setShowUserModal(true); setSelectedStat(null); }}>
                    <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-600 flex items-center justify-center text-xs font-bold shrink-0">
                      {u.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{u.name || u.username}</div>
                      <div className="text-xs text-muted-foreground">{u.organization || u.email || u.username}</div>
                    </div>
                    <Badge variant="outline" className="text-xs">Student</Badge>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Spaces Modal */}
      <Dialog open={selectedStat === 'spaces'} onOpenChange={(open) => !open && setSelectedStat(null)}>
        <DialogContent className="max-w-2xl max-h-96">
          <DialogHeader><DialogTitle>All Spaces ({spaces.length})</DialogTitle></DialogHeader>
          <ScrollArea className="h-96 pr-4">
            <div className="space-y-2">
              {spaces.length === 0 ? (
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

      {/* Activity Modal */}
      <Dialog open={selectedStat === 'activity'} onOpenChange={(open) => !open && setSelectedStat(null)}>
        <DialogContent className="max-w-2xl max-h-96">
          <DialogHeader><DialogTitle>System Activity ({logs.length})</DialogTitle></DialogHeader>
          <ScrollArea className="h-96 pr-4">
            <div className="space-y-2">
              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity found</p>
              ) : (
                (logs as any[]).slice(0, 20).map((log: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-lg hover:bg-muted border border-border/50 text-sm">
                    <div className="font-medium text-foreground">{log.action}</div>
                    <div className="text-xs text-muted-foreground mt-1">{new Date(log.timestamp).toLocaleString()}</div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>


      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="spaces" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Spaces
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Logs
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <CardTitle>User Management</CardTitle>
                <div className="flex gap-2 flex-wrap">
                  <select 
                    value={userRoleFilter} 
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="px-3 py-1 rounded-md border border-input text-sm"
                  >
                    <option value="">All Roles</option>
                    <option value="student">Students</option>
                    <option value="supervisor">Supervisors</option>
                    <option value="school">School Coords</option>
                    <option value="admin">Admins</option>
                  </select>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-2 text-muted-foreground" />
                    <input 
                      type="text"
                      placeholder="Search users..." 
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-9 pr-3 py-1 rounded-md border border-input text-sm"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-2 px-3 font-semibold">User</th>
                      <th className="text-left py-2 px-3 font-semibold">Role</th>
                      <th className="text-left py-2 px-3 font-semibold">Spaces</th>
                      <th className="text-left py-2 px-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersLoading ? (
                      <tr><td colSpan={4} className="text-center py-4 text-muted-foreground">Loading users...</td></tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-4 text-muted-foreground">No users found</td></tr>
                    ) : (
                      filteredUsers.map((user: any) => (
                        <tr key={user.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-3">
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowUserModal(true);
                              }}
                              className="hover:underline text-left"
                            >
                              <UserCard user={user} size="sm" />
                            </button>
                          </td>
                          <td className="py-3 px-3">
                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                              {user.role}
                            </Badge>
                          </td>
                          <td className="py-3 px-3">{user.spacesCount}</td>
                          <td className="py-3 px-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowUserModal(true);
                              }}
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Spaces Tab */}
        <TabsContent value="spaces" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <CardTitle>Space Management</CardTitle>
                <div className="flex gap-2 flex-wrap">
                  <select 
                    value={spaceTypeFilter} 
                    onChange={(e) => setSpaceTypeFilter(e.target.value)}
                    className="px-3 py-1 rounded-md border border-input text-sm"
                  >
                    <option value="">All Types</option>
                    <option value="official">Official</option>
                    <option value="private">Private</option>
                  </select>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-2 text-muted-foreground" />
                    <input 
                      type="text"
                      placeholder="Search spaces..." 
                      value={spaceSearch}
                      onChange={(e) => setSpaceSearch(e.target.value)}
                      className="pl-9 pr-3 py-1 rounded-md border border-input text-sm"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-2 px-3 font-semibold">Space Name</th>
                      <th className="text-left py-2 px-3 font-semibold">Type</th>
                      <th className="text-left py-2 px-3 font-semibold">Owner</th>
                      <th className="text-left py-2 px-3 font-semibold">Members</th>
                      <th className="text-left py-2 px-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {spacesLoading ? (
                      <tr><td colSpan={5} className="text-center py-4 text-muted-foreground">Loading spaces...</td></tr>
                    ) : filteredSpaces.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-4 text-muted-foreground">No spaces found</td></tr>
                    ) : (
                      filteredSpaces.map((s: any) => (
                        <tr key={s.space.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-3 font-medium">{s.space.name}</td>
                          <td className="py-3 px-3">
                            <Badge variant={s.space.type === 'official' ? 'default' : 'secondary'}>
                              {s.space.type}
                            </Badge>
                          </td>
                          <td className="py-3 px-3">{s.ownerName}</td>
                          <td className="py-3 px-3">{s.memberCount}</td>
                          <td className="py-3 px-3">
                            <Button variant="ghost" size="sm">View</Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                User Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-3xl font-bold">{analytics[0]?.roleBreakdown?.student || 0}</div>
                      <div className="text-sm text-muted-foreground">Student Registrations</div>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-3xl font-bold">{analytics[0]?.roleBreakdown?.supervisor || 0}</div>
                      <div className="text-sm text-muted-foreground">Supervisor Registrations</div>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-3xl font-bold">{analytics[0]?.roleBreakdown?.school || 0}</div>
                      <div className="text-sm text-muted-foreground">School Coordinator Regs</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No analytics data available</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Activity Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-2 px-3 font-semibold">Timestamp</th>
                      <th className="text-left py-2 px-3 font-semibold">Type</th>
                      <th className="text-left py-2 px-3 font-semibold">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length === 0 ? (
                      <tr><td colSpan={3} className="text-center py-4 text-muted-foreground">No logs available</td></tr>
                    ) : (
                      (logs as any[]).map((log: any, idx: number) => (
                        <tr key={idx} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-3 text-xs">{new Date(log.timestamp).toLocaleString()}</td>
                          <td className="py-3 px-3">
                            <Badge variant="outline">{log.type}</Badge>
                          </td>
                          <td className="py-3 px-3 text-xs text-muted-foreground">
                            {JSON.stringify(log.details).substring(0, 100)}...
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Profile Modal */}
      {selectedUser && (
        <UserProfileModal
          user={selectedUser}
          open={showUserModal}
          onOpenChange={setShowUserModal}
        />
      )}
    </div>
  );
}
