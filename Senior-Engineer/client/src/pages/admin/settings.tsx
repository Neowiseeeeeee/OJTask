import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Save, Bell, Mail, Database, Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

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
              <input type="text" placeholder="smtp.example.com" className="w-full mt-1 px-3 py-2 border rounded-md text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium">SMTP Port</label>
              <input type="number" placeholder="587" className="w-full mt-1 px-3 py-2 border rounded-md text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium">From Email</label>
              <input type="email" placeholder="noreply@example.com" className="w-full mt-1 px-3 py-2 border rounded-md text-sm" />
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
              <input type="text" defaultValue="OJTask Management System" className="w-full mt-1 px-3 py-2 border rounded-md text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium">Organization Name</label>
              <input type="text" placeholder="Your Organization" className="w-full mt-1 px-3 py-2 border rounded-md text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium">Support Email</label>
              <input type="email" placeholder="support@example.com" className="w-full mt-1 px-3 py-2 border rounded-md text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium">Support Phone</label>
              <input type="tel" placeholder="+1 (555) 123-4567" className="w-full mt-1 px-3 py-2 border rounded-md text-sm" />
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
