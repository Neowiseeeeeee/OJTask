import React, { createContext, useContext, ReactNode, useState } from 'react';
import { UserProfileModal } from '@/components/user-profile-modal';

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

interface UserProfileModalContextType {
  selectedUser: User | null;
  setSelectedUser: (user: User | null) => void;
  openUserProfile: (user: any) => void;
}

const UserProfileModalContext = createContext<UserProfileModalContextType | undefined>(undefined);

export function UserProfileModalProvider({ children }: { children: ReactNode }) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedUser(null);
    }
    setIsOpen(open);
  };

  const openUserProfile = (user: any) => {
    // Create a compatible user object that meets the UserProfileModal requirements
    const compatibleUser: User = {
      id: user.id,
      username: user.username || user.name || `user_${user.id}`,
      name: user.name || user.username || `User ${user.id}`,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      email: user.email || null,
      organization: user.organization || null,
      profilePicture: user.profilePicture || null,
      role: user.role || null,
      createdAt: user.createdAt || null
    };
    setSelectedUser(compatibleUser);
    setIsOpen(true);
  };

  const providerValue = {
    selectedUser,
    setSelectedUser,
    openUserProfile
  };

  return React.createElement(
    UserProfileModalContext.Provider,
    { value: providerValue },
    children,
    React.createElement(UserProfileModal, {
      user: selectedUser,
      open: isOpen,
      onOpenChange: handleOpenChange
    })
  );
}

export function useUserProfileModal() {
  const context = useContext(UserProfileModalContext);
  if (context === undefined) {
    throw new Error('useUserProfileModal must be used within a UserProfileModalProvider');
  }
  return context;
}
