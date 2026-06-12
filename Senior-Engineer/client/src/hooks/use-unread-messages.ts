import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useSpace } from "@/hooks/use-space";

export function useUnreadMessages() {
  const { user } = useAuth();
  const { activeSpaceId } = useSpace();

  return useQuery({
    queryKey: ["unreadMessages", activeSpaceId, user?.id],
    queryFn: async () => {
      if (!activeSpaceId || !user?.id) return 0;
      const res = await fetch(
        `/api/spaces/${activeSpaceId}/unread-messages?userId=${user.id}`,
        { credentials: "include" },
      );
      if (!res.ok) return 0;
      return Number(await res.text());
    },
    enabled: !!activeSpaceId && !!user?.id,
    refetchInterval: 5000,
    staleTime: 0,
  });
}

export function useUnreadPerChannel(spaceId: number | null) {
  const { user } = useAuth();

  return useQuery<Record<string, number>>({
    queryKey: ["unreadPerChannel", spaceId, user?.id],
    queryFn: async () => {
      if (!spaceId || !user?.id) return {};
      const res = await fetch(
        `/api/spaces/${spaceId}/unread-per-channel`,
        { credentials: "include" },
      );
      if (!res.ok) return {};
      return res.json();
    },
    enabled: !!spaceId && !!user?.id,
    refetchInterval: 5000,
    staleTime: 0,
  });
}
