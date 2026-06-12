import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SpaceSettings } from "@shared/schema";

interface SpaceSettingsData {
  totalRequiredHours: number;
  requiredDocuments: string[];
  documentDeadlines: string[];
  dailyHoursMin: number;
  dailyHoursMax: number;
  weeklyHoursMin: number;
  weeklyHoursMax: number;
  requiredAttendanceDays: number;
  allowedAbsences: number;
  scrumFrequency: string;
  scrumTimeRequirement: string;
  evaluationFrequency: string;
  evaluationCriteria: string[];
  companyPolicies: string;
  workingHours: string;
  breakDuration: number;
  communicationChannels: string[];
  reportingStructure: string;
}

const DEFAULT_SETTINGS: SpaceSettingsData = {
  totalRequiredHours: 486,
  requiredDocuments: [],
  documentDeadlines: [],
  dailyHoursMin: 1,
  dailyHoursMax: 8,
  weeklyHoursMin: 20,
  weeklyHoursMax: 40,
  requiredAttendanceDays: 5,
  allowedAbsences: 2,
  scrumFrequency: "daily",
  scrumTimeRequirement: "end_of_day",
  evaluationFrequency: "monthly",
  evaluationCriteria: [],
  companyPolicies: "",
  workingHours: "9:00 AM - 6:00 PM",
  breakDuration: 60,
  communicationChannels: [],
  reportingStructure: ""
};

export function useSpaceSettings(spaceId: number | null) {
  const queryClient = useQueryClient();

  const {
    data: settings = DEFAULT_SETTINGS,
    isLoading,
    error,
  } = useQuery<SpaceSettingsData>({
    queryKey: [`/api/spaces/${spaceId}/settings`],
    queryFn: async () => {
      if (!spaceId) return DEFAULT_SETTINGS;
      
      const res = await fetch(`/api/spaces/${spaceId}/settings`, {
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 403 || res.status === 404) {
          return DEFAULT_SETTINGS;
        }
        throw new Error("Failed to fetch space settings");
      }
      
      const data = await res.json();
      return data;
    },
    enabled: !!spaceId,
    retry: false,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: SpaceSettingsData) => {
      if (!spaceId) throw new Error("No space ID provided");
      
      const res = await fetch(`/api/spaces/${spaceId}/settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSettings),
        credentials: "include",
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update settings");
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData([`/api/spaces/${spaceId}/settings`], data);
      queryClient.invalidateQueries({ queryKey: [`/api/spaces/${spaceId}/settings`] });
    },
  });

  return {
    settings,
    isLoading,
    error,
    updateSettings: updateSettingsMutation.mutateAsync,
    isUpdating: updateSettingsMutation.isPending,
  };
}

export type { SpaceSettingsData };
