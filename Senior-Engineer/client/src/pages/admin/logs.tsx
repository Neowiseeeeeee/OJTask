import { useSystemLogs } from "@/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Search } from "lucide-react";
import { useState } from "react";

export default function AdminLogs() {
  const { data: logs = [] } = useSystemLogs(100);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const filteredLogs = (logs as any[]).filter((log: any) => {
    const matchesSearch = JSON.stringify(log).toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || log.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const logTypes = Array.from(new Set((logs as any[]).map((l: any) => l.type)));

  const getLogColor = (type: string) => {
    switch(type) {
      case 'login': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'logout': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'userupdate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'spacecreate': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold">Audit Logs</h1>
        <p className="text-muted-foreground mt-2">Monitor all system activities and events</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                System Activity Log
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Total events: {filteredLogs.length}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <select 
                value={typeFilter} 
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 rounded-md border border-input text-sm"
              >
                <option value="">All Types</option>
                {logTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                <input 
                  type="text"
                  placeholder="Search logs..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-3 py-2 rounded-md border border-input text-sm"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No logs found</div>
            ) : (
              (filteredLogs as any[]).map((log: any, idx: number) => (
                <div key={idx} className="p-3 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap gap-y-1">
                        <Badge className={`${getLogColor(log.type)} border-0`}>
                          {log.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 break-words">
                        {JSON.stringify(log.details)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
