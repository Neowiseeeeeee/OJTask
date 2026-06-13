import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@shared/routes';
import { queryClient } from '@/lib/queryClient';

export function useAdminOverview() {
  return useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: async () => {
      const res = await fetch(api.admin.overview.path);
      if (!res.ok) throw new Error('Failed to fetch admin overview');
      return res.json();
    }
  });
}

export function useAdminUsers(role?: string, search?: string) {
  return useQuery({
    queryKey: ['admin', 'users', role, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (role) params.append('role', role);
      if (search) params.append('search', search);
      
      const url = `${api.admin.users.list.path}${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    }
  });
}

export function useAdminUser(userId: number) {
  return useQuery({
    queryKey: ['admin', 'user', userId],
    queryFn: async () => {
      const url = api.admin.users.get.path.replace(':id', String(userId));
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch user');
      return res.json();
    },
    enabled: !!userId
  });
}

export function useUpdateUserRole() {
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      const url = api.admin.users.updateRole.path.replace(':id', String(userId));
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      if (!res.ok) throw new Error('Failed to update user role');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    }
  });
}

export function useAdminSpaces(type?: string, search?: string) {
  return useQuery({
    queryKey: ['admin', 'spaces', type, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (search) params.append('search', search);
      
      const url = `${api.admin.spaces.list.path}${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch spaces');
      return res.json();
    }
  });
}

export function useAdminSpace(spaceId: number) {
  return useQuery({
    queryKey: ['admin', 'space', spaceId],
    queryFn: async () => {
      const url = api.admin.spaces.get.path.replace(':id', String(spaceId));
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch space');
      return res.json();
    },
    enabled: !!spaceId
  });
}

export function useAnalyticsUserGrowth(period?: string) {
  return useQuery({
    queryKey: ['admin', 'analytics', 'user-growth', period],
    queryFn: async () => {
      const params = period ? `?period=${period}` : '';
      const res = await fetch(`${api.admin.analytics.userGrowth.path}${params}`);
      if (!res.ok) throw new Error('Failed to fetch analytics');
      return res.json();
    }
  });
}

export function useSystemLogs(limit?: number) {
  return useQuery({
    queryKey: ['admin', 'analytics', 'logs', limit],
    queryFn: async () => {
      const params = limit ? `?limit=${limit}` : '';
      const res = await fetch(`${api.admin.analytics.logs.path}${params}`);
      if (!res.ok) throw new Error('Failed to fetch logs');
      return res.json();
    }
  });
}

export function useMaintenanceMode() {
  return useQuery({
    queryKey: ['maintenance'],
    queryFn: async () => {
      const res = await fetch('/api/system/maintenance');
      if (!res.ok) throw new Error('Failed to fetch maintenance status');
      return res.json() as Promise<{ enabled: boolean; message: string; endsAt: string | null }>;
    },
    staleTime: 30_000,
  });
}

export function useSetMaintenanceMode() {
  return useMutation({
    mutationFn: async (payload: { enabled: boolean; message: string; endsAt: string | null }) => {
      const res = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update maintenance mode');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
    }
  });
}
