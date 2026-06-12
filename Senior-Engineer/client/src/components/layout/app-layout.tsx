/**
 * NOTIFICATION_SECTION_MAP — maps each nav route to its notification section name.
 * To add a badge to a new page: add one line here.
 * The badge count comes automatically from GET /api/spaces/:id/notification-counts.
 * See OJTask/Senior-Engineer/NOTIFICATION_SYSTEM.md for full docs.
 */
const NOTIFICATION_SECTION_MAP: Record<string, string> = {
  '/evaluations': 'evaluations',
  '/documents':   'documents',
  '/attendance':  'attendance',
  // Add new sections here as you add features, e.g.:
  // '/reports':  'reports',
  // '/tasks':    'tasks',
};

import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useSpace } from "@/hooks/use-space";
import { useUnreadMessages } from "@/hooks/use-unread-messages";
import { useNotificationCounts } from "@/hooks/use-notifications";
import { useTasks, useScrums } from "@/hooks/use-features";
import { NotificationBadge } from "@/components/notification-badge";

import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Clock,
  ListTodo,
  MessageSquare,
  FileText,
  CalendarDays,
  Users,
  LogOut,
  FolderOpen,
  Award,
  Activity,
  Database,
  BarChart3,
  ShieldCheck,
  Settings,
  User
} from "lucide-react";
import { SpaceSelector } from "./space-selector";

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { activeSpace } = useSpace();
  const activeSpaceId = activeSpace?.id ?? null;
  const unreadQuery = useUnreadMessages();
  const unreadCount = unreadQuery.data ?? 0;
  const { data: notifCounts } = useNotificationCounts();
  const { data: tasks = [] } = useTasks(activeSpaceId);
  const { data: scrums = [] } = useScrums(activeSpaceId);
  const [location] = useLocation();

  const taskBadge = user?.role === "student"
    ? tasks.filter((t: any) => t.status !== "done" && t.assignedToId === user.id).length
    : 0;
  const scrumBadge = (user?.role === "supervisor" || user?.role === "school")
    ? scrums.filter((s: any) => !s.isApproved).length
    : 0;

  if (!user) return <>{children}</>;

  const systemAdminNavItems = [
    { title: "Overview", href: "/system-admin", icon: Activity },
    { title: "Users", href: "/system-admin/users", icon: Users },
    { title: "Spaces", href: "/system-admin/spaces", icon: Database },
    { title: "Analytics", href: "/system-admin/analytics", icon: BarChart3 },
    { title: "Audit Logs", href: "/system-admin/logs", icon: Activity },
    { title: "Security", href: "/system-admin/security", icon: ShieldCheck },
    { title: "Settings", href: "/system-admin/settings", icon: Users },
  ];

  // Generic badge resolver — reads from NOTIFICATION_SECTION_MAP at the top of this file.
  // To give any nav item a notification badge, just add its route to that map.
  const sectionBadge = (href: string) =>
    (notifCounts as any)?.[NOTIFICATION_SECTION_MAP[href]] ?? 0;

  const regularNavItems = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, badge: 0 },
    { title: "Tasks", href: "/tasks", icon: ListTodo, badge: taskBadge },
    { title: "Time Logs", href: "/time-logs", icon: Clock, badge: 0 },
    { title: "Daily Scrum", href: "/scrums", icon: Users, badge: scrumBadge },
    { title: "Attendance", href: "/attendance", icon: CalendarDays, badge: sectionBadge('/attendance') },
    { title: "Documents", href: "/documents", icon: FileText, badge: sectionBadge('/documents') },
    { title: "Messages", href: "/messages", icon: MessageSquare, badge: unreadCount },
    { title: "Evaluations", href: "/evaluations", icon: Award, badge: sectionBadge('/evaluations') },
    { title: "Profile", href: "/profile", icon: User, badge: 0 },
    { title: "Settings", href: "/settings", icon: Settings, badge: 0 },
  ];

  const navItems = user?.role === "admin"
    ? systemAdminNavItems
    : ["supervisor", "school"].includes(user?.role || "")
      ? [
          ...regularNavItems,
          { title: "Members", href: "/members", icon: Users, badge: 0 },
          { title: "Space Admin", href: "/space-admin", icon: Settings, badge: 0 },
        ]
      : regularNavItems;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/20">
        <Sidebar className="border-r border-border/50">
          <SidebarHeader className="h-16 flex items-center justify-center px-4 border-b border-border/50">
            <div className="flex items-center">
              <img src="/ojtask-logo.png" className="h-12 w-auto object-contain" alt="OJTask logo" />
            </div>
          </SidebarHeader>
          <SidebarContent>
            {user?.role !== "admin" && (
              <div className="p-4 border-b border-border/50">
                <SpaceSelector />
              </div>
            )}

            <SidebarGroup>
              <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground mt-4 mb-2 px-4">
                Main Menu
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={location === item.href}
                        className={`transition-colors ${location === item.href ? 'bg-primary/10 text-primary hover:bg-primary/15' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                      >
                        <Link href={item.href} className="flex items-center gap-3 px-3 py-2 rounded-lg font-medium">
                          <item.icon className="w-5 h-5 shrink-0" />
                          <span className="flex-1">{item.title}</span>
                          {'badge' in item && (item.badge as number) > 0 && (
                            <NotificationBadge count={item.badge as number} />
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <div className="mt-auto p-4 border-t border-border/50 bg-gradient-to-t from-muted/30 to-transparent">
            <Link href="/profile" className="flex items-center gap-3 mb-3 px-3 py-2 rounded-lg bg-muted/50 border border-border/30 hover:bg-muted hover:border-primary/40 transition-all cursor-pointer">
              {user.profilePicture ? (
                <img src={user.profilePicture} alt={user.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0 shadow-md" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/70 text-white flex items-center justify-center font-bold text-sm shadow-md flex-shrink-0">
                  {((user.firstName || user.name).charAt(0) + (user.lastName || user.name).charAt(user.lastName?.length || user.name.length - 1)).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-semibold leading-tight truncate">{user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name}</span>
                <span className="text-xs text-muted-foreground capitalize truncate">{user.role}</span>
              </div>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 border-transparent hover:border-destructive/20 transition-all"
              onClick={() => logout()}
            >
              <LogOut className="w-4 h-4" />
              <span className="text-xs">Logout</span>
            </Button>
          </div>
        </Sidebar>

        <div className="flex flex-col flex-1 min-w-0">
          <main className="flex-1 p-6 lg:p-8 overflow-y-auto overflow-x-hidden">
            <div className="max-w-6xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
