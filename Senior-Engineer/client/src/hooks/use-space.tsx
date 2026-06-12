import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Space } from "@shared/schema";
import { z } from "zod";

interface SpaceContextType {
  activeSpaceId: number | null;
  setActiveSpaceId: (id: number | null) => void;
  activeSpace: Space | null;
  spaces: Space[];
  isLoading: boolean;
  createSpace: ReturnType<typeof useCreateSpaceMutation>["mutateAsync"];
  joinSpace: ReturnType<typeof useJoinSpaceMutation>["mutateAsync"];
  leaveSpace: () => Promise<void>;
  leaveSpaceMutation: ReturnType<typeof useLeaveSpaceMutation>;
}

const SpaceContext = createContext<SpaceContextType | null>(null);

function useSpacesQuery() {
  return useQuery<Space[]>({
    queryKey: [api.spaces.list.path],
    queryFn: async () => {
      const res = await fetch(api.spaces.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch spaces");
      return res.json();
    },
  });
}

function useCreateSpaceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.spaces.create.input>) => {
      const res = await fetch(api.spaces.create.path, {
        method: api.spaces.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create space");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.spaces.list.path] });
    },
  });
}

function useJoinSpaceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { joinCode: string }) => {
      const res = await fetch(api.spaces.join.path, {
        method: api.spaces.join.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to join space");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.spaces.list.path] });
    },
  });
}

function useLeaveSpaceMutation(activeSpaceId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!activeSpaceId) throw new Error("No active space selected");
      
      const res = await fetch(`/api/spaces/${activeSpaceId}/leave`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to leave space");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.spaces.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.spaces.list.path] });
    },
  });
}

export function SpaceProvider({ children }: { children: ReactNode }) {
  const [activeSpaceId, setActiveSpaceIdState] = useState<number | null>(null);
  const { data: spaces = [], isLoading } = useSpacesQuery();
  const createSpaceMutation = useCreateSpaceMutation();
  const joinSpaceMutation = useJoinSpaceMutation();
  const leaveSpaceMutation = useLeaveSpaceMutation(activeSpaceId);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("ojt_active_space");
    if (saved) {
      setActiveSpaceIdState(parseInt(saved, 10));
    }
  }, []);

  const setActiveSpaceId = (id: number | null) => {
    setActiveSpaceIdState(id);
    if (id) {
      localStorage.setItem("ojt_active_space", id.toString());
    } else {
      localStorage.removeItem("ojt_active_space");
    }
  };

  const handleLeaveSpace = async () => {
    if (activeSpaceId) {
      await leaveSpaceMutation.mutateAsync();
      setActiveSpaceId(null);
    }
  };

  // Auto-select first space if none selected and spaces exist
  useEffect(() => {
    console.log('Space selection debug:', { activeSpaceId, spacesCount: spaces.length, spaces: spaces.map(s => ({ id: s.id, name: s.name })) });
    
    if (!activeSpaceId && spaces.length > 0) {
      // Auto-select first space for better UX
      console.log('Auto-selecting space:', spaces[0].id, spaces[0].name);
      setActiveSpaceId(spaces[0].id);
    } else if (activeSpaceId && spaces.length > 0 && !spaces.find(s => s.id === activeSpaceId)) {
      // If active space is no longer in list (e.g. switched user)
      console.log('Active space not found, selecting first:', spaces[0].id);
      setActiveSpaceId(spaces[0].id);
    }
  }, [spaces, activeSpaceId]);

  const activeSpace = spaces.find((s) => s.id === activeSpaceId) || null;

  return (
    <SpaceContext.Provider
      value={{
        activeSpaceId,
        setActiveSpaceId,
        activeSpace,
        spaces,
        isLoading,
        createSpace: createSpaceMutation.mutateAsync,
        joinSpace: joinSpaceMutation.mutateAsync,
        leaveSpace: handleLeaveSpace,
        leaveSpaceMutation,
      }}
    >
      {children}
    </SpaceContext.Provider>
  );
}

export function useSpace() {
  const context = useContext(SpaceContext);
  if (!context) {
    throw new Error("useSpace must be used within a SpaceProvider");
  }
  return context;
}
