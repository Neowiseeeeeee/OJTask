import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { SpaceProvider } from "@/hooks/use-space";
import { AppLayout } from "@/components/layout/app-layout";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";

// Pages
import LandingPage from "@/pages/landing-page";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import TasksPage from "@/pages/tasks-page";
import TimeLogsPage from "@/pages/time-logs-page";
import ScrumsPage from "@/pages/scrums-page";
import AttendancePage from "@/pages/attendance-page";
import DocumentsPage from "@/pages/documents-page-enhanced";
import MessagesPage from "@/pages/messages-page-standardized";
import EvaluationsPage from "@/pages/evaluations-page";
import AdminPage from "@/pages/admin-page";
import AdminOverview from "@/pages/admin/overview";
import AdminUsers from "@/pages/admin/users";
import AdminSpaces from "@/pages/admin/spaces";
import AdminAnalytics from "@/pages/admin/analytics";
import AdminLogs from "@/pages/admin/logs";
import AdminSecurity from "@/pages/admin/security";
import AdminSettings from "@/pages/admin/settings";
import UserProfile from "@/pages/user-profile";
import UserSettings from "@/pages/user-settings";
import SpaceAdminPage from "@/pages/space-admin";
import MemberManagementPage from "@/pages/member-management";
import { UserProfileModalProvider } from "@/hooks/use-user-profile-modal";

function ProtectedRoute({ component: Component, adminOnly, systemAdminOnly }: { component: React.ComponentType; adminOnly?: boolean; systemAdminOnly?: boolean }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!user) return <Redirect to="/auth" />;
  
  // System admin can only access system admin pages
  if (user.role === "admin" && !systemAdminOnly) return <Redirect to="/system-admin" />;
  
  // System admins cannot access regular pages (except system admin pages)
  if (systemAdminOnly && user.role !== "admin") return <Redirect to="/dashboard" />;
  
  // Space admins (supervisors/school) can access admin page
  if (adminOnly && !["supervisor", "school"].includes(user.role)) return <Redirect to="/dashboard" />;

  return <Component />;
}

function PublicRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Redirect to="/dashboard" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={() => <PublicRoute component={LandingPage} />} />
      <Route path="/auth" component={() => <PublicRoute component={AuthPage} />} />

      {/* Protected routes */}
      <Route path="/dashboard">
        <AppLayout><ProtectedRoute component={Dashboard} /></AppLayout>
      </Route>
      <Route path="/tasks">
        <AppLayout><ProtectedRoute component={TasksPage} /></AppLayout>
      </Route>
      <Route path="/time-logs">
        <AppLayout><ProtectedRoute component={TimeLogsPage} /></AppLayout>
      </Route>
      <Route path="/scrums">
        <AppLayout><ProtectedRoute component={ScrumsPage} /></AppLayout>
      </Route>
      <Route path="/attendance">
        <AppLayout><ProtectedRoute component={AttendancePage} /></AppLayout>
      </Route>
      <Route path="/documents">
        <AppLayout><ProtectedRoute component={DocumentsPage} /></AppLayout>
      </Route>
<Route path="/messages/:channelId?">
        <AppLayout>
          <ProtectedRoute component={MessagesPage} />
        </AppLayout>
      </Route>
      <Route path="/evaluations">
        <AppLayout><ProtectedRoute component={EvaluationsPage} /></AppLayout>
      </Route>
      <Route path="/admin">
        <AppLayout><ProtectedRoute component={AdminPage} adminOnly /></AppLayout>
      </Route>
      <Route path="/space-admin">
        <AppLayout><ProtectedRoute component={SpaceAdminPage} adminOnly /></AppLayout>
      </Route>
      <Route path="/members">
        <AppLayout><ProtectedRoute component={MemberManagementPage} adminOnly /></AppLayout>
      </Route>
      <Route path="/system-admin">
        <AppLayout><ProtectedRoute component={AdminOverview} systemAdminOnly /></AppLayout>
      </Route>
      <Route path="/system-admin/users">
        <AppLayout><ProtectedRoute component={AdminUsers} systemAdminOnly /></AppLayout>
      </Route>
      <Route path="/system-admin/spaces">
        <AppLayout><ProtectedRoute component={AdminSpaces} systemAdminOnly /></AppLayout>
      </Route>
      <Route path="/system-admin/analytics">
        <AppLayout><ProtectedRoute component={AdminAnalytics} systemAdminOnly /></AppLayout>
      </Route>
      <Route path="/system-admin/logs">
        <AppLayout><ProtectedRoute component={AdminLogs} systemAdminOnly /></AppLayout>
      </Route>
      <Route path="/system-admin/security">
        <AppLayout><ProtectedRoute component={AdminSecurity} systemAdminOnly /></AppLayout>
      </Route>
      <Route path="/system-admin/settings">
        <AppLayout><ProtectedRoute component={AdminSettings} systemAdminOnly /></AppLayout>
      </Route>
      
      {/* User profile and settings (all roles) */}
      <Route path="/profile">
        <AppLayout><ProtectedRoute component={UserProfile} /></AppLayout>
      </Route>
      <Route path="/settings">
        <AppLayout><ProtectedRoute component={UserSettings} /></AppLayout>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
<SpaceProvider>
              <UserProfileModalProvider>
                <Toaster />
                <Router />
              </UserProfileModalProvider>
            </SpaceProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
