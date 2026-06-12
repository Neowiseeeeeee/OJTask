import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { Task, TimeLog, Scrum, Attendance, Document, Message, User, Evaluation, LeaveRequest, Announcement } from "@shared/schema";
import { z } from "zod";

// --- SPACE MEMBERS ---
export function useSpaceMembers(spaceId: number | null) {
  return useQuery<Array<{ id: number; spaceId: number; userId: number; role: string; user: User }>>({
    queryKey: ['/api/spaces/members', spaceId],
    queryFn: async () => {
      const res = await fetch(`/api/spaces/${spaceId}/members`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch members");
      return res.json();
    },
    enabled: !!spaceId,
    refetchInterval: 10000,
  });
}

// --- TASKS ---
export function useTasks(spaceId: number | null) {
  return useQuery<Task[]>({
    queryKey: [api.tasks.list.path, spaceId],
    queryFn: async () => {
      const url = buildUrl(api.tasks.list.path, { spaceId: spaceId! });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
    enabled: !!spaceId,
    refetchInterval: 5000,
  });
}

export function useCreateTask(spaceId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.tasks.create.input>) => {
      const url = buildUrl(api.tasks.create.path, { spaceId: spaceId! });
      const res = await fetch(url, {
        method: api.tasks.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create task");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.tasks.list.path, spaceId] }),
  });
}

export function useUpdateTask(spaceId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<z.infer<typeof api.tasks.update.input>> }) => {
      const url = buildUrl(api.tasks.update.path, { spaceId: spaceId!, id });
      const res = await fetch(url, {
        method: api.tasks.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update task");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.tasks.list.path, spaceId] }),
  });
}

export function useDeleteTask(spaceId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.tasks.delete.path, { spaceId: spaceId!, id });
      const res = await fetch(url, {
        method: api.tasks.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete task");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.tasks.list.path, spaceId] }),
  });
}

// --- TIME LOGS ---
export function useTimeLogs(spaceId: number | null) {
  return useQuery<TimeLog[]>({
    queryKey: [api.timeLogs.list.path, spaceId],
    queryFn: async () => {
      const url = buildUrl(api.timeLogs.list.path, { spaceId: spaceId! });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch time logs");
      return res.json();
    },
    enabled: !!spaceId,
    refetchInterval: 10000,
  });
}

export function useCreateTimeLog(spaceId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.timeLogs.create.input>) => {
      const url = buildUrl(api.timeLogs.create.path, { spaceId: spaceId! });
      const res = await fetch(url, {
        method: api.timeLogs.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create time log");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.timeLogs.list.path, spaceId] }),
  });
}

// --- SCRUMS ---
export function useScrums(spaceId: number | null) {
  return useQuery<Scrum[]>({
    queryKey: [api.scrums.list.path, spaceId],
    queryFn: async () => {
      const url = buildUrl(api.scrums.list.path, { spaceId: spaceId! });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch scrums");
      return res.json();
    },
    enabled: !!spaceId,
    refetchInterval: 5000,
  });
}

export function useCreateScrum(spaceId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.scrums.create.input>) => {
      const url = buildUrl(api.scrums.create.path, { spaceId: spaceId! });
      const res = await fetch(url, {
        method: api.scrums.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create scrum");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.scrums.list.path, spaceId] }),
  });
}

// --- ATTENDANCE ---
export function useAttendance(spaceId: number | null) {
  return useQuery<Attendance[]>({
    queryKey: [api.attendance.list.path, spaceId],
    queryFn: async () => {
      const url = buildUrl(api.attendance.list.path, { spaceId: spaceId! });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch attendance");
      return res.json();
    },
    enabled: !!spaceId,
    refetchInterval: 10000,
  });
}

export function useCreateAttendance(spaceId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.attendance.create.input>) => {
      const url = buildUrl(api.attendance.create.path, { spaceId: spaceId! });
      const res = await fetch(url, {
        method: api.attendance.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to log attendance");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.attendance.list.path, spaceId] }),
  });
}

// --- DOCUMENTS ---
export function useDocuments(spaceId: number | null) {
  return useQuery<Document[]>({
    queryKey: [api.documents.list.path, spaceId],
    queryFn: async () => {
      const url = buildUrl(api.documents.list.path, { spaceId: spaceId! });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch documents");
      return res.json();
    },
    enabled: !!spaceId,
    refetchInterval: 10000,
  });
}

export function useCreateDocument(spaceId?: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const sid = spaceId ?? data.spaceId;
      const res = await fetch(`/api/spaces/${sid}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to upload document");
      return res.json();
    },
    onSuccess: (_, variables) => {
      const sid = spaceId ?? variables.spaceId;
      queryClient.invalidateQueries({ queryKey: [api.documents.list.path, sid] });
    },
  });
}

// --- MESSAGES ---
export function useMessages(spaceId: number | null, channelId: string = 'general') {
  return useQuery<Message[]>({
    queryKey: [api.messages.list.path, spaceId, channelId],
    queryFn: async () => {
      const url = buildUrl(api.messages.list.path, { spaceId: spaceId! });
      const res = await fetch(`${url}?channelId=${channelId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    enabled: !!spaceId,
    refetchInterval: 5000,
  });
}

export function useDMConversations(spaceId: number | null) {
  return useQuery<any[]>({
    queryKey: ['/api/dm-conversations', spaceId],
    queryFn: async () => {
      const res = await fetch(`/api/spaces/${spaceId}/dm-conversations`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch conversations");
      return res.json();
    },
    enabled: !!spaceId,
    refetchInterval: 5000,
  });
}

export function useMarkAsRead(spaceId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ channelId }: { channelId: string }) => {
      const url = `/api/spaces/${spaceId}/messages/${channelId}/mark-read`;
      const res = await fetch(url, { method: 'POST', credentials: "include" });
      if (!res.ok) throw new Error("Failed to mark read");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unreadMessages'] });
      queryClient.invalidateQueries({ queryKey: ['unreadPerChannel'] });
      queryClient.invalidateQueries({ queryKey: [api.messages.list.path] });
    },
  });
}

export function useCreateMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const url = `/api/spaces/${data.spaceId}/messages`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to send message");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.messages.list.path, variables.spaceId, variables.channelId] });
      queryClient.invalidateQueries({ queryKey: ["unreadMessages"] });
    },
  });
}

// --- APPROVE / REJECT MUTATIONS ---
export function useApproveScrum(spaceId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.scrums.approve.path, { spaceId: spaceId!, id });
      const res = await fetch(url, { method: 'PATCH', credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.scrums.list.path, spaceId] }),
  });
}

export function useApproveTimeLog(spaceId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.timeLogs.approve.path, { spaceId: spaceId!, id });
      const res = await fetch(url, { method: 'PATCH', credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.timeLogs.list.path, spaceId] }),
  });
}

export function useApproveDocument(spaceId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/spaces/${spaceId}/documents/${id}/approve`, { method: 'PATCH', credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.documents.list.path, spaceId] }),
  });
}

export function useRejectDocument(spaceId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/spaces/${spaceId}/documents/${id}/reject`, { method: 'PATCH', credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.documents.list.path, spaceId] }),
  });
}

// --- EVALUATIONS ---
export function useEvaluations(spaceId: number | null) {
  return useQuery<Evaluation[]>({
    queryKey: [api.evaluations.list.path, spaceId],
    queryFn: async () => {
      const url = buildUrl(api.evaluations.list.path, { spaceId: spaceId! });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch evaluations");
      return res.json();
    },
    enabled: !!spaceId,
    refetchInterval: 10000,
  });
}

export function useCreateEvaluation(spaceId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.evaluations.create.input>) => {
      const url = buildUrl(api.evaluations.create.path, { spaceId: spaceId! });
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: "include" });
      if (!res.ok) throw new Error("Failed to create evaluation");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.evaluations.list.path, spaceId] }),
  });
}

// --- LEAVE REQUESTS ---
export function useLeaveRequests(spaceId: number | null) {
  return useQuery<LeaveRequest[]>({
    queryKey: [api.leaveRequests.list.path, spaceId],
    queryFn: async () => {
      const url = buildUrl(api.leaveRequests.list.path, { spaceId: spaceId! });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch leave requests");
      return res.json();
    },
    enabled: !!spaceId,
  });
}

export function useCreateLeaveRequest(spaceId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.leaveRequests.create.input>) => {
      const url = buildUrl(api.leaveRequests.create.path, { spaceId: spaceId! });
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: "include" });
      if (!res.ok) throw new Error("Failed to file leave request");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.leaveRequests.list.path, spaceId] }),
  });
}

export function useApproveLeaveRequest(spaceId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/spaces/${spaceId}/leave-requests/${id}/approve`, { method: 'PATCH', credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.leaveRequests.list.path, spaceId] }),
  });
}

export function useRejectLeaveRequest(spaceId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/spaces/${spaceId}/leave-requests/${id}/reject`, { method: 'PATCH', credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.leaveRequests.list.path, spaceId] }),
  });
}

// --- ANNOUNCEMENTS ---
export function useAnnouncements(spaceId: number | null) {
  return useQuery<Announcement[]>({
    queryKey: [api.announcements.list.path, spaceId],
    queryFn: async () => {
      const url = buildUrl(api.announcements.list.path, { spaceId: spaceId! });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch announcements");
      return res.json();
    },
    enabled: !!spaceId,
    refetchInterval: 10000,
  });
}

export function useCreateAnnouncement(spaceId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.announcements.create.input>) => {
      const url = buildUrl(api.announcements.create.path, { spaceId: spaceId! });
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: "include" });
      if (!res.ok) throw new Error("Failed to post announcement");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.announcements.list.path, spaceId] }),
  });
}

// --- SPACE SETTINGS ---
export function useUpdateSpaceTargetHours(spaceId: number | null) {
  return useMutation({
    mutationFn: async (targetHours: number) => {
      const res = await fetch(`/api/spaces/${spaceId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetHours }), credentials: "include" });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
  });
}
