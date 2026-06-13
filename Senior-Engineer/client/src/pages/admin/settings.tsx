import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Save, Bell, Mail, Database, Sun, Moon, Construction, Clock, AlertTriangle } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useMaintenanceMode, useSetMaintenanceMode } from "@/hooks/use-admin";

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
                <p className="text-xs text-muted-foreground mt-0.5">
                  Non-admin users will see a maintenance banner on every page
                </p>
              </div>
              <button
                onClick={() => setEnabled(e => e !== null ? !e : !effectiveEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  effectiveEnabled ? "bg-amber-500" : "bg-muted-foreground/30"
                }`}
                role="switch"
                aria-checked={effectiveEnabled}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform ${
                    effectiveEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
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
              <p className="text-xs text-muted-foreground">This message is shown to all non-admin users in a banner at the top of every page.</p>
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
              <p className="text-xs text-muted-foreground">If set, the banner will show the expected end time to users.</p>
            </div>

            {effectiveEnabled && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200">
                <span className="font-semibold">⚠ Maintenance mode is ON.</span> All non-admin users will see a warning banner. Admins are not affected.
              </div>
            )}

            <Button onClick={handleSave} disabled={isPending} className="w-full gap-2">
              {isPending ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</>
              ) : saved ? (
                <><Save className="w-4 h-4" />Saved!</>
              ) : (
                <><Save className="w-4 h-4" />Save Maintenance Settings</>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

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
                <>
                  <Sun className="w-4 h-4" />
                  <span className="text-sm font-medium">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4" />
                  <span className="text-sm font-medium">Dark</span>
                </>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Database Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button variant="outline">Backup Database</Button>
            <Button variant="outline">Restore Database</Button>
            <Button variant="outline">Optimize Database</Button>
            <Button variant="outline" className="text-destructive hover:bg-destructive/10">Delete Old Logs</Button>
          </div>
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800 text-xs text-yellow-800 dark:text-yellow-200">
            Last backup: 2 hours ago
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
