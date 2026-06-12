import { useState, useEffect } from "react";
import { Search, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { UserCard } from "./user-card";
import { UserProfileModal } from "./user-profile-modal";

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

interface UserSearchProps {
  onUserSelect?: (user: User) => void;
  onMessage?: (userId: number) => void;
  placeholder?: string;
  className?: string;
  spaceId?: number;
}

export function UserSearch({
  onUserSelect,
  onMessage,
  placeholder = "Search users...",
  className = "",
  spaceId,
}: UserSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const search = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const url = new URL(`${window.location.origin}/api/users/search`);
        url.searchParams.set('q', query);
        if (spaceId) {
          url.searchParams.set('spaceId', String(spaceId));
        }
        const res = await fetch(url.toString());
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [query, spaceId]);

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setShowModal(true);
    if (onUserSelect) {
      onUserSelect(user);
    }
    if (!onMessage) {
      setQuery("");
      setIsOpen(false);
    }
  };

  return (
    <>
      <div className={`relative w-full ${className}`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            className="pl-9 pr-9"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setResults([]);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        {/* Results Dropdown */}
        {isOpen && (query.length >= 2 || results.length > 0) && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
            {isLoading && (
              <div className="p-4 text-center">
                <Loader2 className="w-4 h-4 animate-spin inline" />
              </div>
            )}

            {!isLoading && results.length === 0 && query.length >= 2 && (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No users found
              </div>
            )}

            {results.length > 0 && (
              <div className="divide-y">
                {results.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className="w-full p-3 hover:bg-muted transition-colors text-left"
                  >
                    <UserCard user={user} size="sm" showEmail={false} />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Profile Modal */}
      {selectedUser && (
        <UserProfileModal
          user={selectedUser}
          open={showModal}
          onOpenChange={setShowModal}
          onMessage={onMessage}
        />
      )}
    </>
  );
}
