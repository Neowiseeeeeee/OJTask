import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserCardProps {
  user: {
    id: number;
    name: string;
    firstName?: string | null;
    lastName?: string | null;
    profilePicture?: string | null;
    email?: string | null;
    organization?: string | null;
    role?: string;
  };
  size?: "sm" | "md" | "lg";
  showEmail?: boolean;
  showOrganization?: boolean;
}

export function UserCard({
  user,
  size = "md",
  showEmail = false,
  showOrganization = false,
}: UserCardProps) {
  const displayName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name;
  const initials = `${(user.firstName || user.name).charAt(0)}${(user.lastName || user.name).charAt(user.lastName?.length || user.name.length - 1)}`.toUpperCase();

  const sizeMap = {
    sm: { avatar: "w-8 h-8", text: "text-sm" },
    md: { avatar: "w-10 h-10", text: "text-base" },
    lg: { avatar: "w-16 h-16", text: "text-lg" },
  };

  const sizeClass = sizeMap[size];

  return (
    <div className="flex items-center gap-3">
      <Avatar className={sizeClass.avatar}>
        <AvatarImage src={user.profilePicture || undefined} alt={displayName} />
        <AvatarFallback className="font-semibold">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className={`${sizeClass.text} font-semibold text-foreground truncate`}>
          {displayName}
        </p>
        {showEmail && user.email && (
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        )}
        {showOrganization && user.organization && (
          <p className="text-xs text-muted-foreground truncate">{user.organization}</p>
        )}
      </div>
    </div>
  );
}
