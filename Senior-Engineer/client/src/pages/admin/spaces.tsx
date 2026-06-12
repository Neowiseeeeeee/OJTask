import { useState } from "react";
import { useAdminSpaces } from "@/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Database, Search } from "lucide-react";

export default function AdminSpaces() {
  const { data: spaces = [], isLoading } = useAdminSpaces();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const filteredSpaces = (spaces as any[]).filter((s: any) => {
    const matchesSearch = s.space.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || s.space.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold">Space Management</h1>
        <p className="text-muted-foreground mt-2">Monitor and manage all training spaces</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                All Spaces
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Total: {filteredSpaces.length} spaces</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <select 
                value={typeFilter} 
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 rounded-md border border-input text-sm"
              >
                <option value="">All Types</option>
                <option value="official">Official</option>
                <option value="private">Private</option>
              </select>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                <input 
                  type="text"
                  placeholder="Search spaces..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-3 py-2 rounded-md border border-input text-sm"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">Loading spaces...</div>
            ) : filteredSpaces.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">No spaces found</div>
            ) : (
              filteredSpaces.map((s: any) => (
                <Card key={s.space.id} className="border">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-base">{s.space.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">Owner: {s.ownerName}</p>
                      </div>
                      
                      <div className="flex items-center justify-between py-2 border-y">
                        <span className="text-sm text-muted-foreground">Members</span>
                        <span className="font-bold">{s.memberCount}</span>
                      </div>

                      <Badge variant={s.space.type === 'official' ? 'default' : 'secondary'}>
                        {s.space.type}
                      </Badge>

                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1">View</Button>
                        <Button variant="outline" size="sm" className="flex-1 text-destructive">Manage</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
