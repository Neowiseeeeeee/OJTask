import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Info
} from "lucide-react";

interface EnvVar {
  key: string;
  present: boolean;
  required: boolean;
  description: string;
  impact: string;
}

function useEnvHealth() {
  return useQuery<EnvVar[]>({
    queryKey: ["admin", "env-health"],
    queryFn: async () => {
      const res = await fetch("/api/admin/env-health");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    staleTime: 30_000,
  });
}

function StatusIcon({ present, required }: { present: boolean; required: boolean }) {
  if (present) return <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />;
  if (required) return <XCircle className="w-5 h-5 text-destructive shrink-0" />;
  return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
}

export default function AdminEnvironment() {
  const { data: vars = [], isLoading, refetch, isFetching } = useEnvHealth();

  const required = vars.filter(v => v.required);
  const optional = vars.filter(v => !v.required);
  const allRequired = required.every(v => v.present);
  const missingRequired = required.filter(v => !v.present).length;
  const missingOptional = optional.filter(v => !v.present).length;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Environment Health</h1>
          <p className="text-muted-foreground mt-2">
            Verify all required secrets and configuration values are set — values are never exposed.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-2 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`rounded-lg border p-4 ${allRequired ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800" : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"}`}>
          <div className="flex items-center gap-3">
            {allRequired
              ? <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
              : <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />}
            <div>
              <p className={`font-semibold text-sm ${allRequired ? "text-green-900 dark:text-green-200" : "text-red-900 dark:text-red-200"}`}>
                {allRequired ? "All Critical Variables Set" : `${missingRequired} Critical Missing`}
              </p>
              <p className={`text-xs mt-0.5 ${allRequired ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
                {allRequired ? "App is fully operational" : "App may not work correctly"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
          <div>
            <p className="text-2xl font-bold">{vars.filter(v => v.present).length}<span className="text-base text-muted-foreground font-normal">/{vars.length}</span></p>
            <p className="text-xs text-muted-foreground">Variables Set</p>
          </div>
        </div>

        <div className={`bg-card border rounded-lg p-4 flex items-center gap-3 ${missingOptional > 0 ? "border-amber-200 dark:border-amber-800" : ""}`}>
          <AlertTriangle className={`w-6 h-6 shrink-0 ${missingOptional > 0 ? "text-amber-500" : "text-muted-foreground"}`} />
          <div>
            <p className="text-2xl font-bold">{missingOptional}</p>
            <p className="text-xs text-muted-foreground">Optional Missing</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Checking environment variables...
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <XCircle className="w-5 h-5 text-destructive" />
                Required Variables
                <Badge variant={missingRequired > 0 ? "destructive" : "default"} className="text-xs ml-1">
                  {missingRequired > 0 ? `${missingRequired} missing` : "All set"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {required.map(v => (
                  <div key={v.key} className={`flex items-start gap-4 px-6 py-4 ${!v.present ? "bg-red-50/50 dark:bg-red-950/10" : ""}`}>
                    <StatusIcon present={v.present} required={v.required} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="text-sm font-mono font-semibold bg-muted px-1.5 py-0.5 rounded">{v.key}</code>
                        <Badge variant={v.present ? "outline" : "destructive"} className="text-xs">
                          {v.present ? "✓ Set" : "✗ Missing"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{v.description}</p>
                      {!v.present && (
                        <p className="text-xs text-destructive mt-1 font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {v.impact}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="w-5 h-5 text-muted-foreground" />
                Optional Variables
                <Badge variant="secondary" className="text-xs ml-1">
                  {missingOptional > 0 ? `${missingOptional} missing` : "All set"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {optional.map(v => (
                  <div key={v.key} className={`flex items-start gap-4 px-6 py-4 ${!v.present ? "bg-amber-50/50 dark:bg-amber-950/10" : ""}`}>
                    <StatusIcon present={v.present} required={v.required} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="text-sm font-mono font-semibold bg-muted px-1.5 py-0.5 rounded">{v.key}</code>
                        <Badge variant={v.present ? "outline" : "secondary"} className="text-xs">
                          {v.present ? "✓ Set" : "Not set"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{v.description}</p>
                      {!v.present && (
                        <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {v.impact}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-900 dark:text-blue-200 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Values are never exposed</p>
              <p className="mt-0.5 text-blue-700 dark:text-blue-300 text-xs">
                This page only shows whether each variable is <em>set</em> — the actual values are not readable here. Set them in your Replit Secrets panel or Vercel Environment Variables dashboard.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
