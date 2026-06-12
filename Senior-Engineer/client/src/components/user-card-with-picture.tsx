import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserProfileModal } from "@/hooks/use-user-profile-modal";

interface User {
  id: number;
  name?: string;
  username?: string;
  firstName?: string | null;
  lastName?: string | null;
  profilePicture?: string | null;
  email?: string | null;
  organization?: string | null;
  role?: string;
}

interface UserCardWithPictureProps {
  user?: User | null;
  size?: "sm" | "md" | "lg";
  showEmail?: boolean;
  showRole?: boolean;
  onClick?: () => void;
}

export function UserCardWithPicture({
  user,
  size = "md",
  showEmail = false,
  showRole = false,
  onClick,
}: UserCardWithPictureProps) {
  // Add null check for user object
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Avatar className="w-8 h-8">
          <AvatarFallback className="font-semibold bg-gradient-to-br from-primary to-primary/70 text-white">
            ?
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium">Unknown User</span>
      </div>
    );
  }

  const displayName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : (user.name || user.username || 'Unknown');
  
  const initials = `${(user.firstName || user.name || user.username || '?').charAt(0)}${
    (user.lastName || user.name || user.username || '?').charAt(
      (user.lastName?.length || user.name?.length || user.username?.length || 1) - 1
    )
  }`.toUpperCase();

  const sizeMap = {
    sm: { avatar: "w-8 h-8", container: "gap-2", text: "text-sm" },
    md: { avatar: "w-10 h-10", container: "gap-3", text: "text-base" },
    lg: { avatar: "w-16 h-16", container: "gap-4", text: "text-lg" },
  };

  const sizeClass = sizeMap[size];

  const { openUserProfile } = useUserProfileModal();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (user) {
      openUserProfile(user);
    }
  };

  return (
    <div 
      className={`flex items-center ${sizeClass.container} cursor-pointer hover:scale-105 hover:shadow-md transition-all duration-200 hover:opacity-90`}
      onClick={handleClick}
    >
      <Avatar className={sizeClass.avatar}>
        {user.profilePicture ? (
          <AvatarImage src={user.profilePicture} alt={displayName} />
        ) : null}
        <AvatarFallback className="font-semibold bg-gradient-to-br from-primary to-primary/70 text-white">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col min-w-0">
        <span className={`font-semibold leading-tight truncate ${sizeClass.text}`}>
          {displayName}
        </span>
        {showEmail && user.email && (
          <span className="text-xs text-muted-foreground truncate">
            {user.email}
          </span>
        )}
        {showRole && user.role && (
          <span className="text-xs text-muted-foreground capitalize">
            {user.role}
          </span>
        )}
      </div>
    </div>
  );
}
