import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/theme-provider";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Moon, Sun, Loader2, Check, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function UserSettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password change state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [taskReminders, setTaskReminders] = useState(true);
  const [scrumsNotifications, setScrumsNotifications] = useState(true);
  const [documentAlerts, setDocumentAlerts] = useState(false);

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Redirect if not authenticated
  if (!user) {
    setLocation("/auth");
    return null;
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ type: "error", text: "All password fields are required" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({ type: "error", text: "New password must be at least 8 characters" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/password/change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to change password");
      }

      // Reset form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowChangePassword(false);
      setMessage({ type: "success", text: "Password changed successfully" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ 
        type: "error", 
        text: error instanceof Error ? error.message : "Error changing password. Please try again." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNotificationPreferences = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/settings/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          emailNotifications,
          taskReminders,
          scrumsNotifications,
          documentAlerts,
        }),
      });

      if (!response.ok) throw new Error("Failed to save preferences");

      setMessage({ type: "success", text: "Notification preferences saved" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: "error", text: "Error saving preferences. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your account preferences and security</p>
        </div>

        {/* Messages */}
        {message && (
          <div
            className={`p-4 rounded-lg border flex items-start gap-3 ${
              message.type === "success"
                ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-950/30 dark:border-green-800 dark:text-green-200"
                : "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-800 dark:text-red-200"
            }`}
          >
            {message.type === "success" ? (
              <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}

        {/* Appearance Settings */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize how OJTask looks for you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm font-medium">Theme</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setTheme("light")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                    theme === "light"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50 text-muted-foreground"
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  Light
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                    theme === "dark"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50 text-muted-foreground"
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  Dark
                </button>
                <button
                  onClick={() => setTheme("system")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                    theme === "system"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50 text-muted-foreground"
                  }`}
                >
                  <div className="w-4 h-4 flex items-center justify-center text-xs">⚙️</div>
                  System
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                {theme === "system"
                  ? "Using your device theme preferences"
                  : `Currently using ${theme} mode`}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Manage your account security and privacy</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Change Password */}
            <div className="space-y-3 pb-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Change Password</p>
                  <p className="text-xs text-muted-foreground mt-1">Update your password regularly for security</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowChangePassword(!showChangePassword)}
                >
                  {showChangePassword ? "Cancel" : "Change"}
                </Button>
              </div>

              {showChangePassword && (
                <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="bg-background pr-10"
                        placeholder="Enter your current password"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="bg-background pr-10"
                        placeholder="Enter your new password"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="bg-background pr-10"
                        placeholder="Confirm your new password"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    onClick={handleChangePassword}
                    disabled={isLoading}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Two-Factor Authentication */}
            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="font-medium text-sm">Two-Factor Authentication</p>
                <p className="text-xs text-muted-foreground mt-1">Add an extra layer of security to your account</p>
              </div>
              <Switch 
                checked={twoFactorEnabled} 
                onCheckedChange={setTwoFactorEnabled}
                disabled
              />
            </div>
            <p className="text-xs text-muted-foreground">2FA setup coming soon</p>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Manage how and when you receive notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Email Notifications</p>
                  <p className="text-xs text-muted-foreground">Receive email updates about your account</p>
                </div>
                <Switch 
                  checked={emailNotifications} 
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              <div className="flex items-center justify-between border-t border-border pt-4">
                <div>
                  <p className="font-medium text-sm">Task Reminders</p>
                  <p className="text-xs text-muted-foreground">Get reminded about upcoming tasks</p>
                </div>
                <Switch 
                  checked={taskReminders} 
                  onCheckedChange={setTaskReminders}
                  disabled={!emailNotifications}
                />
              </div>

              <div className="flex items-center justify-between border-t border-border pt-4">
                <div>
                  <p className="font-medium text-sm">Scrum Notifications</p>
                  <p className="text-xs text-muted-foreground">Get notified about scrum meetings and updates</p>
                </div>
                <Switch 
                  checked={scrumsNotifications} 
                  onCheckedChange={setScrumsNotifications}
                  disabled={!emailNotifications}
                />
              </div>

              <div className="flex items-center justify-between border-t border-border pt-4">
                <div>
                  <p className="font-medium text-sm">Document Alerts</p>
                  <p className="text-xs text-muted-foreground">Get notified about document changes and reviews</p>
                </div>
                <Switch 
                  checked={documentAlerts} 
                  onCheckedChange={setDocumentAlerts}
                  disabled={!emailNotifications}
                />
              </div>
            </div>

            <Button
              onClick={handleSaveNotificationPreferences}
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 mt-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Preferences"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Username</p>
              <p className="font-medium text-sm mt-1">{user.username}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email Address</p>
              <p className="font-medium text-sm mt-1">{user.email || <span className="text-muted-foreground italic">Not set — update in Profile</span>}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Role</p>
              <p className="font-medium text-sm mt-1">{user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Member Since</p>
              <p className="font-medium text-sm mt-1">{new Date(user.createdAt || Date.now()).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
