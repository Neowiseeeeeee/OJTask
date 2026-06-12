import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSpace } from "@/hooks/use-space";

export type NotificationCounts = {
  evaluations: number;
  documents: number;
  attendance: number;
};

export function useNotificationCounts() {
  const { user } = useAuth();
  const { activeSpaceId } = useSpace();

  return useQuery<NotificationCounts>({
    queryKey: ["notificationCounts", activeSpaceId, user?.id],
    queryFn: async () => {
      if (!activeSpaceId || !user?.id) return { evaluations: 0, documents: 0, attendance: 0 };
      const res = await fetch(`/api/spaces/${activeSpaceId}/notification-counts`, {
        credentials: "include",
      });
      if (!res.ok) return { evaluations: 0, documents: 0, attendance: 0 };
      return res.json();
    },
    enabled: !!activeSpaceId && !!user?.id,
    refetchInterval: 10000,
    staleTime: 0,
  });
}

export function useMarkNotificationsRead(section: string) {
  const { activeSpaceId } = useSpace();
  const qc = useQueryClient();

  return useCallback(async () => {
    if (!activeSpaceId) return;
    try {
      await fetch(`/api/spaces/${activeSpaceId}/notifications/mark-read`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section }),
      });
      qc.invalidateQueries({ queryKey: ["notificationCounts"] });
    } catch {}
  }, [activeSpaceId, section, qc]);
}
