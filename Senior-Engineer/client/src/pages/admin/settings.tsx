import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Settings, Save, Bell, Mail, Database, Sun, Moon,
  Construction, Clock, AlertTriangle, Download, Upload,
  BarChart2, Trash2, CheckCircle2, XCircle, Loader2, X
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useMaintenanceMode, useSetMaintenanceMode } from "@/hooks/use-admin";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

// ── Maintenance Section ────────────────────────────────────────────────────

function MaintenanceSection() {
  const { data: current, isLoading } = useMaintenanceMode();
  const { mutate: setMaintenance, isPending } = useSetMaintenanceMode();

  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [endsAt, setEndsAt] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const effectiveEnabled = enabled !== null ? enabled : (current?.enabled ?? false);
  const effectiveMessage = message !== null ? message : (current?.message ?? "System maintenance in progress. We'll be back shortly.");
  const effectiveEndsAt = endsAt !== null ? endsAt : (current?.endsAt ? current.endsAt.slice(0, 16) : "");

  const handleSave = () => {
    setMaintenance(
      {
        enabled: effectiveEnabled,
        message: effectiveMessage,
        endsAt: effectiveEndsAt ? new Date(effectiveEndsAt).toISOString() : null,
      },
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2500);
          setEnabled(null);
          setMessage(null);
          setEndsAt(null);
        }
      }
    );
  };

  return (
    <Card className={effectiveEnabled ? "border-amber-300 dark:border-amber-700" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Construction className="w-5 h-5" />
          Maintenance Mode
          {effectiveEnabled && (
            <span className="ml-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 border border-amber-300 dark:border-amber-700 animate-pulse">
              ACTIVE
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {isLoading ? (
          <div className="py-4 text-center text-muted-foreground text-sm">Loading...</div>
        ) : (
          <>
            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div>
                <p className="text-sm font-medium">Enable Maintenance Mode</p>
                <p className="text-xs text-muted-foreground mt-0.5">Non-admin users will see a maintenance banner on every page</p>
              </div>
              <button
                onClick={() => setEnabled(e => e !== null ? !e : !effectiveEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${effectiveEnabled ? "bg-amber-500" : "bg-muted-foreground/30"}`}
                role="switch"
                aria-checked={effectiveEnabled}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform ${effectiveEnabled ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Banner Message
              </label>
              <textarea
                value={effectiveMessage}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border rounded-md text-sm bg-background resize-none"
                placeholder="System maintenance in progress. We'll be back shortly."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Estimated End Time <span className="text-muted-foreground font-normal text-xs">(optional)</span>
              </label>
              <input
                type="datetime-local"
                value={effectiveEndsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm bg-background"
              />
            </div>
            {effectiveEnabled && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200">
                <span className="font-semibold">⚠ Maintenance mode is ON.</span> All non-admin users see a warning banner.
              </div>
            )}
            <Button onClick={handleSave} disabled={isPending} className="w-full gap-2">
              {isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : saved ? <><CheckCircle2 className="w-4 h-4" />Saved!</> : <><Save className="w-4 h-4" />Save Maintenance Settings</>}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Database Management Section ────────────────────────────────────────────

type DbFeedback = { type: "success" | "error"; message: string } | null;

interface CollectionStat { name: string; count: number; indexes: number; }

function DatabaseSection() {
  const [loading, setLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<DbFeedback>(null);
  const [confirmAction, setConfirmAction] = useState<null | "restore" | "delete-logs">(null);
  const [statsOpen, setStatsOpen] = useState(false);
  const [stats, setStats] = useState<CollectionStat[]>([]);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // ── Backup ──────────────────────────────────────────────────────────────
  const handleBackup = async () => {
    setLoading("backup");
    try {
      const res = await fetch("/api/admin/db/backup");
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ojtask-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showFeedback("success", "Backup downloaded successfully.");
    } catch (err: any) {
      showFeedback("error", err.message || "Backup failed.");
    } finally {
      setLoading(null);
    }
  };

  // ── Restore: pick file then confirm ────────────────────────────────────
  const handleRestoreFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setRestoreFile(file);
    if (file) setConfirmAction("restore");
    e.target.value = "";
  };

  const handleRestoreConfirmed = async () => {
    if (!restoreFile) return;
    setConfirmAction(null);
    setLoading("restore");
    try {
      const text = await restoreFile.text();
      const json = JSON.parse(text);
      if (!json.collections) throw new Error("Invalid backup file — missing collections key.");
      const res = await fetch("/api/admin/db/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      const result = await res.json();
      showFeedback("success", `Restore complete. ${result.restored} collections restored.`);
    } catch (err: any) {
      showFeedback("error", err.message || "Restore failed.");
    } finally {
      setLoading(null);
      setRestoreFile(null);
    }
  };

  // ── Optimize / Stats ────────────────────────────────────────────────────
  const handleOptimize = async () => {
    setLoading("optimize");
    try {
      const res = await fetch("/api/admin/db/stats");
      if (!res.ok) throw new Error("Failed to fetch stats.");
      const data = await res.json();
      setStats(data.collections);
      setStatsOpen(true);
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to get stats.");
    } finally {
      setLoading(null);
    }
  };

  // ── Delete Logs ─────────────────────────────────────────────────────────
  const handleDeleteLogsConfirmed = async () => {
    setConfirmAction(null);
    setLoading("delete");
    try {
      const res = await fetch("/api/admin/db/logs", { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      const result = await res.json();
      showFeedback("success", `Cleared ${result.deleted.expiredOtps} expired OTPs and ${result.deleted.expiredSessions} expired sessions.`);
    } catch (err: any) {
      showFeedback("error", err.message || "Delete failed.");
    } finally {
      setLoading(null);
    }
  };

  const totalDocs = stats.reduce((s, c) => s + c.count, 0);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Database Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {feedback && (
            <div className={`flex items-center gap-3 p-3 rounded-lg border text-sm ${feedback.type === "success" ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200" : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"}`}>
              {feedback.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
              <span className="flex-1">{feedback.message}</span>
              <button onClick={() => setFeedback(null)}><X className="w-4 h-4 opacity-50 hover:opacity-100" /></button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="gap-2 justify-start"
              onClick={handleBackup}
              disabled={!!loading}
            >
              {loading === "backup" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {loading === "backup" ? "Exporting..." : "Backup Database"}
            </Button>

            <Button
              variant="outline"
              className="gap-2 justify-start"
              onClick={() => fileInputRef.current?.click()}
              disabled={!!loading}
            >
              {loading === "restore" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {loading === "restore" ? "Restoring..." : "Restore Database"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleRestoreFileChange}
            />

            <Button
              variant="outline"
              className="gap-2 justify-start"
              onClick={handleOptimize}
              disabled={!!loading}
            >
              {loading === "optimize" ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart2 className="w-4 h-4" />}
              {loading === "optimize" ? "Loading stats..." : "Collection Stats"}
            </Button>

            <Button
              variant="outline"
              className="gap-2 justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setConfirmAction("delete-logs")}
              disabled={!!loading}
            >
              {loading === "delete" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {loading === "delete" ? "Deleting..." : "Delete Old Logs"}
            </Button>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
            <span className="font-medium">Backup</span> downloads a JSON file of all collections (passwords excluded). <span className="font-medium">Restore</span> re-imports a backup file — existing records are overwritten by matching ID. <span className="font-medium">Delete Old Logs</span> removes expired OTPs and expired sessions only.
          </div>
        </CardContent>
      </Card>

      {/* Confirm: Restore */}
      <Dialog open={confirmAction === "restore"} onOpenChange={(v) => { if (!v) { setConfirmAction(null); setRestoreFile(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-amber-500" />
              Confirm Restore
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-200">
              <p className="font-semibold">⚠ This will overwrite existing data.</p>
              <p className="mt-1 text-xs">Any record in the backup file that shares an ID with an existing record will be overwritten. Records not in the backup are left untouched.</p>
            </div>
            {restoreFile && (
              <p className="text-sm text-muted-foreground">File: <span className="font-mono font-medium">{restoreFile.name}</span></p>
            )}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setConfirmAction(null); setRestoreFile(null); }}>Cancel</Button>
              <Button className="flex-1 bg-amber-500 hover:bg-amber-600 text-white" onClick={handleRestoreConfirmed}>Yes, Restore</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm: Delete Logs */}
      <Dialog open={confirmAction === "delete-logs"} onOpenChange={(v) => !v && setConfirmAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Confirm Delete Old Logs
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-800 dark:text-red-200">
              <p className="font-semibold">This will permanently delete:</p>
              <ul className="mt-1 text-xs list-disc pl-4 space-y-1">
                <li>All expired password-reset OTP tokens</li>
                <li>All expired session records</li>
              </ul>
              <p className="mt-2 text-xs">Active user sessions are not affected — only already-expired records are removed.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmAction(null)}>Cancel</Button>
              <Button variant="destructive" className="flex-1" onClick={handleDeleteLogsConfirmed}>Yes, Delete</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Collection Stats modal */}
      <Dialog open={statsOpen} onOpenChange={setStatsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5" />
              Collection Stats
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <p className="text-2xl font-bold">{stats.length}</p>
                <p className="text-xs text-muted-foreground">Collections</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <p className="text-2xl font-bold">{totalDocs.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Documents</p>
              </div>
            </div>
            <ScrollArea className="h-72">
              <div className="space-y-1.5 pr-2">
                {stats.map((col) => (
                  <div key={col.name} className="flex items-center justify-between p-2.5 bg-muted/40 rounded-lg">
                    <span className="font-mono text-sm font-medium">{col.name}</span>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{col.count.toLocaleString()} docs</span>
                      <span>{col.indexes} idx</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function AdminSettings() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold">System Settings</h1>
        <p className="text-muted-foreground mt-2">Configure system-wide settings and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="w-5 h-5" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Theme</p>
              <p className="text-xs text-muted-foreground mt-1">Switch between light and dark mode</p>
            </div>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-input hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <><Sun className="w-4 h-4" /><span className="text-sm font-medium">Light</span></>
              ) : (
                <><Moon className="w-4 h-4" /><span className="text-sm font-medium">Dark</span></>
              )}
            </button>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200">
            Current theme: <span className="font-semibold capitalize">{theme}</span>
          </div>
        </CardContent>
      </Card>

      <MaintenanceSection />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">SMTP Server</label>
              <input type="text" placeholder="smtp.example.com" className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background" />
            </div>
            <div>
              <label className="text-sm font-medium">SMTP Port</label>
              <input type="number" placeholder="587" className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background" />
            </div>
            <div>
              <label className="text-sm font-medium">From Email</label>
              <input type="email" placeholder="noreply@example.com" className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background" />
            </div>
            <Button className="w-full"><Save className="w-4 h-4 mr-2" />Save Email Settings</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm">Email Notifications</span>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm">System Alerts</span>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm">User Activity Logs</span>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </div>
            <Button className="w-full"><Save className="w-4 h-4 mr-2" />Save Notification Settings</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            General Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">System Name</label>
              <input type="text" defaultValue="OJTask Management System" className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background" />
            </div>
            <div>
              <label className="text-sm font-medium">Organization Name</label>
              <input type="text" placeholder="Your Organization" className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background" />
            </div>
            <div>
              <label className="text-sm font-medium">Support Email</label>
              <input type="email" placeholder="support@example.com" className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background" />
            </div>
            <div>
              <label className="text-sm font-medium">Support Phone</label>
              <input type="tel" placeholder="+1 (555) 123-4567" className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background" />
            </div>
          </div>
          <Button className="w-full"><Save className="w-4 h-4 mr-2" />Save General Settings</Button>
        </CardContent>
      </Card>

      <DatabaseSection />
    </div>
  );
}
