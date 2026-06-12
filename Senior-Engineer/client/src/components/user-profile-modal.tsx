import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageSquare, Building2, Calendar } from "lucide-react";
import { UserCard } from "./user-card";

interface User {
  id: number;
  username: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  organization?: string | null;
  profilePicture?: string | null;
  role?: string;
  createdAt?: string;
}

interface UserProfileModalProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMessage?: (userId: number) => void;
}

export function UserProfileModal({
  user,
  open,
  onOpenChange,
  onMessage,
}: UserProfileModalProps) {
  const [isLoadingUser, setIsLoadingUser] = useState(false);

  if (!user) return null;

  const displayName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name;
  const initials = `${(user.firstName || user.name).charAt(0)}${(user.lastName || user.name).charAt(user.lastName?.length || user.name.length - 1)}`.toUpperCase();

  const roleColors: Record<string, string> = {
    student: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    supervisor: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    school: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  const getRoleColor = (role?: string) => {
    return roleColors[role?.toLowerCase() || "student"] || roleColors.student;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Avatar and Basic Info */}
          <div className="flex flex-col items-center text-center space-y-4">
            <Avatar className="w-24 h-24">
              <AvatarImage src={user.profilePicture || undefined} alt={displayName} />
              <AvatarFallback className="text-xl font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{displayName}</h2>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
              {user.role && (
                <Badge className={`mt-2 ${getRoleColor(user.role)}`}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </Badge>
              )}
            </div>
          </div>

          {/* Info Grid */}
          <div className="space-y-3">
            {user.email && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Mail className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium truncate">{user.email}</p>
                </div>
              </div>
            )}

            {user.organization && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Building2 className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Organization</p>
                  <p className="text-sm font-medium truncate">{user.organization}</p>
                </div>
              </div>
            )}

            {user.createdAt && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Calendar className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Member Since</p>
                  <p className="text-sm font-medium">{formatDate(user.createdAt)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            {onMessage && (
<Button
                onClick={() => {
                  if (onMessage) onMessage(user.id);
                  onOpenChange(false);
                }}
                className="flex-1"
                variant="default"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Message
              </Button>
            )}
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="flex-1"
            >
              Close
            </Button>
          </div>

          {/* Info Notice */}
          <p className="text-xs text-muted-foreground border-t pt-4">
            This is public profile information. Exclusive details are only visible to authorized supervisors.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
