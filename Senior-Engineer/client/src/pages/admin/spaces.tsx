import { useState } from "react";
import { useAdminSpaces, useAdminSpace } from "@/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Database, Search, ChevronUp, ChevronDown, Users, Eye,
  Hash, Calendar, ArrowUpDown, Building2, Lock
} from "lucide-react";

type SortKey = "name" | "owner" | "members" | "type" | "created";
type SortDir = "asc" | "desc";

function SortIcon({ col, active, dir }: { col: string; active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground/50" />;
  return dir === "asc"
    ? <ChevronUp className="w-3.5 h-3.5 text-primary" />
    : <ChevronDown className="w-3.5 h-3.5 text-primary" />;
}

function SpaceDetailModal({ spaceId, open, onClose }: { spaceId: number; open: boolean; onClose: () => void }) {
  const { data, isLoading } = useAdminSpace(spaceId);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Space Details
          </DialogTitle>
        </DialogHeader>
        {isLoading || !data ? (
          <div className="py-8 text-center text-muted-foreground text-sm">Loading...</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Space Name</p>
                <p className="font-semibold mt-0.5 text-sm">{data.space.name}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Type</p>
                <Badge variant={data.space.type === "official" ? "default" : "secondary"} className="mt-1 text-xs">
                  {data.space.type}
                </Badge>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Join Code</p>
                <p className="font-mono font-bold mt-0.5 text-sm tracking-wider">{data.space.joinCode}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Members</p>
                <p className="font-semibold mt-0.5 text-sm">{data.stats.totalMembers}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Total Tasks</p>
                <p className="font-semibold mt-0.5 text-sm">{data.stats.totalTasks}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Documents</p>
                <p className="font-semibold mt-0.5 text-sm">{data.stats.totalDocuments}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" /> Members
              </p>
              <ScrollArea className="h-48">
                <div className="space-y-1.5 pr-2">
                  {data.members.map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between p-2.5 bg-muted/40 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                          {m.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium">{m.username}</span>
                      </div>
                      <div className="flex gap-1.5">
                        <Badge variant="outline" className="text-xs capitalize">{m.role}</Badge>
                        <Badge variant="secondary" className="text-xs capitalize">{m.spaceRole}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function AdminSpaces() {
  const { data: spaces = [], isLoading } = useAdminSpaces();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedSpaceId, setSelectedSpaceId] = useState<number | null>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filtered = (spaces as any[])
    .filter((s: any) => {
      const matchesSearch =
        s.space.name.toLowerCase().includes(search.toLowerCase()) ||
        s.ownerName.toLowerCase().includes(search.toLowerCase()) ||
        s.space.joinCode?.toLowerCase().includes(search.toLowerCase());
      const matchesType = !typeFilter || s.space.type === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a: any, b: any) => {
      let va: any, vb: any;
      switch (sortKey) {
        case "name":    va = a.space.name.toLowerCase();  vb = b.space.name.toLowerCase(); break;
        case "owner":   va = a.ownerName.toLowerCase();   vb = b.ownerName.toLowerCase();  break;
        case "members": va = a.memberCount;               vb = b.memberCount;              break;
        case "type":    va = a.space.type;                vb = b.space.type;               break;
        case "created": va = a.space.createdAt ?? "";     vb = b.space.createdAt ?? "";    break;
        default: return 0;
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  const ColHeader = ({ label, col }: { label: string; col: SortKey }) => (
    <th
      className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors whitespace-nowrap"
      onClick={() => handleSort(col)}
    >
      <span className="flex items-center gap-1.5">
        {label}
        <SortIcon col={col} active={sortKey === col} dir={sortDir} />
      </span>
    </th>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold">Space Management</h1>
        <p className="text-muted-foreground mt-2">Monitor all training spaces across the system</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{(spaces as any[]).length}</p>
            <p className="text-xs text-muted-foreground">Total Spaces</p>
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{(spaces as any[]).filter((s: any) => s.space.type === "official").length}</p>
            <p className="text-xs text-muted-foreground">Official</p>
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <Lock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{(spaces as any[]).filter((s: any) => s.space.type === "private").length}</p>
            <p className="text-xs text-muted-foreground">Private</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              All Spaces
              <span className="text-sm font-normal text-muted-foreground">— {filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
            </CardTitle>
            <div className="flex gap-2 flex-wrap">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 rounded-md border border-input bg-background text-sm"
              >
                <option value="">All Types</option>
                <option value="official">Official</option>
                <option value="private">Private</option>
              </select>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search name, owner, join code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-3 py-2 rounded-md border border-input bg-background text-sm w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <ColHeader label="Space Name" col="name" />
                  <ColHeader label="Owner" col="owner" />
                  <ColHeader label="Type" col="type" />
                  <ColHeader label="Members" col="members" />
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                    <span className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" />Join Code</span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        Loading spaces...
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                      No spaces found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((s: any) => (
                    <tr
                      key={s.space.id}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                            {s.space.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-sm">{s.space.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{s.ownerName}</td>
                      <td className="px-4 py-3">
                        <Badge variant={s.space.type === "official" ? "default" : "secondary"} className="text-xs capitalize">
                          {s.space.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-sm">
                          <Users className="w-3.5 h-3.5 text-muted-foreground" />
                          {s.memberCount}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-xs font-mono bg-muted px-2 py-1 rounded tracking-wider">
                          {s.space.joinCode ?? "—"}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1.5"
                          onClick={() => setSelectedSpaceId(s.space.id)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div className="px-4 py-3 border-t border-border/50 text-xs text-muted-foreground">
              Showing {filtered.length} of {(spaces as any[]).length} spaces
            </div>
          )}
        </CardContent>
      </Card>

      {selectedSpaceId !== null && (
        <SpaceDetailModal
          spaceId={selectedSpaceId}
          open={selectedSpaceId !== null}
          onClose={() => setSelectedSpaceId(null)}
        />
      )}
    </div>
  );
}
