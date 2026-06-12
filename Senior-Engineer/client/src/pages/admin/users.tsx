import { useState } from "react";
import { useAdminUsers, useUpdateUserRole } from "@/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Users, Search, CheckSquare, Square, Lock, Edit2 } from "lucide-react";

export default function AdminUsers() {
  const { data: users = [], isLoading } = useAdminUsers();
  const { mutate: updateUserRole } = useUpdateUserRole();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [editingUser, setEditingUser] = useState<any>(null);
  const [suspendingUser, setSuspendingUser] = useState<any>(null);
  const [newRole, setNewRole] = useState("");

  const filteredUsers = (users as any[]).filter((u: any) => {
    const matchesSearch = u.username.toLowerCase().includes(search.toLowerCase()) || 
                         u.name.toLowerCase().includes(search.toLowerCase()) ||
                         u.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = !roleFilter || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const toggleSelectUser = (userId: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) newSet.delete(userId);
      else newSet.add(userId);
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map((u: any) => u.id.toString())));
    }
  };

  const handleBulkRoleChange = (role: string) => {
    selectedUsers.forEach(userId => {
      const user = users.find((u: any) => u.id.toString() === userId);
      if (user) {
        updateUserRole({ userId: user.id, role });
      }
    });
    setSelectedUsers(new Set());
  };

  const handleSuspendBulk = () => {
    selectedUsers.forEach(userId => {
      console.log("Suspend user:", userId);
    });
    setSelectedUsers(new Set());
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setNewRole(user.role);
  };

  const handleSaveEdit = () => {
    if (editingUser && newRole !== editingUser.role) {
      updateUserRole({ userId: editingUser.id, role: newRole });
    }
    setEditingUser(null);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold">User Management</h1>
        <p className="text-muted-foreground mt-2">Manage all system users, their roles and permissions</p>
      </div>

      {selectedUsers.size > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/40 border-blue-200 dark:border-blue-800/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="text-sm font-semibold">
                <span className="text-blue-600 dark:text-blue-400 text-lg font-bold">{selectedUsers.size}</span> users selected
              </div>
              <div className="flex gap-2 flex-wrap">
                <select 
                  value=""
                  onChange={(e) => e.target.value && handleBulkRoleChange(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-input text-sm cursor-pointer hover:bg-white dark:hover:bg-slate-800"
                >
                  <option value="">Change Role To...</option>
                  <option value="student">Student</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="school">School Coordinator</option>
                  <option value="admin">Admin</option>
                </select>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleSuspendBulk}
                  className="text-xs"
                >
                  <Lock className="w-3 h-3 mr-1" />
                  Suspend Selected
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedUsers(new Set())}
                  className="text-xs"
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                All Users
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Total: {filteredUsers.length} users</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <select 
                value={roleFilter} 
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-input text-sm"
              >
                <option value="">All Roles</option>
                <option value="student">Students</option>
                <option value="supervisor">Supervisors</option>
                <option value="school">School Coordinators</option>
                <option value="admin">Admins</option>
              </select>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                <input 
                  type="text"
                  placeholder="Search users..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-3 py-2 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
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
                  <th className="text-left py-3 px-4 font-semibold w-8">
                    <button 
                      onClick={toggleSelectAll}
                      className="p-1 hover:bg-muted rounded transition-colors"
                      title={selectedUsers.size === filteredUsers.length ? "Deselect all" : "Select all"}
                    >
                      {selectedUsers.size === filteredUsers.length && filteredUsers.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-primary" />
                      ) : (
                        <Square className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 font-semibold">Username</th>
                  <th className="text-left py-3 px-4 font-semibold">Name</th>
                  <th className="text-left py-3 px-4 font-semibold">Role</th>
                  <th className="text-left py-3 px-4 font-semibold">Spaces</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Loading users...</td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No users found</td></tr>
                ) : (
                  filteredUsers.map((user: any) => (
                    <tr 
                      key={user.id} 
                      className={`border-b transition-colors hover:bg-muted/50 ${selectedUsers.has(user.id.toString()) ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`}
                      onClick={() => toggleSelectUser(user.id.toString())}
                    >
                      <td className="py-3 px-4">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectUser(user.id.toString());
                          }}
                          className="p-1 hover:bg-muted rounded transition-colors"
                        >
                          {selectedUsers.has(user.id.toString()) ? (
                            <CheckSquare className="w-4 h-4 text-primary" />
                          ) : (
                            <Square className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{user.username}</td>
                      <td className="py-3 px-4 font-semibold">{user.name}</td>
                      <td className="py-3 px-4">
                        <Badge 
                          variant={user.role === 'admin' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {user.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-center font-semibold">{user.spacesCount || 0}</td>
                      <td className="py-3 px-4">
                        <Badge 
                          variant="outline"
                          className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800"
                        >
                          Active
                        </Badge>
                      </td>
                      <td 
                        className="py-3 px-4 flex gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-xs"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-xs text-destructive hover:bg-destructive/10"
                          onClick={() => setSuspendingUser(user)}
                        >
                          <Lock className="w-3 h-3 mr-1" />
                          Suspend
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

      {/* Edit User Modal */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User: {editingUser?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold block mb-2">Username</label>
              <div className="px-4 py-2 rounded-lg border border-border/50 bg-muted text-sm">
                {editingUser?.username}
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold block mb-2">Full Name</label>
              <div className="px-4 py-2 rounded-lg border border-border/50 bg-muted text-sm">
                {editingUser?.name}
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold block mb-2">Role</label>
              <select 
                value={newRole} 
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-input text-sm"
              >
                <option value="student">Student</option>
                <option value="supervisor">Supervisor</option>
                <option value="school">School Coordinator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">⚠️ Role Change</p>
              <p>Changing a user's role will affect their access permissions immediately.</p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditingUser(null)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveEdit}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend User Modal */}
      <Dialog open={!!suspendingUser} onOpenChange={() => setSuspendingUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Suspend User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm"><span className="font-semibold text-foreground">Are you sure?</span></p>
              <p className="text-sm text-muted-foreground mt-1">
                Suspending <span className="font-semibold">{suspendingUser?.name}</span> will:
              </p>
              <ul className="text-xs text-muted-foreground mt-2 space-y-1 ml-4 list-disc">
                <li>Immediately log them out of all sessions</li>
                <li>Revoke access to all spaces and resources</li>
                <li>Block API token access</li>
                <li>Allow restoration if needed</li>
              </ul>
            </div>
            <div>
              <label className="text-sm font-semibold block mb-2">Reason (optional)</label>
              <textarea 
                placeholder="Document why this user is being suspended..."
                className="w-full px-3 py-2 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none h-24"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setSuspendingUser(null)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                console.log("Suspend user:", suspendingUser.id);
                setSuspendingUser(null);
              }}
            >
              <Lock className="w-4 h-4 mr-2" />
              Suspend User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
