import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { computed } from "vue";
import type { ScheduleFilter } from "@/lib/types";
import { client } from "./client";

export type IcalTokenResponse = {
  token: string;
  group: string;
  url: string;
} | null;

export const icalTokenQueryKey = (group: string) => ["ical-token", group];

export const useIcalTokenQuery = (group: () => string) =>
  useQuery({
    queryKey: computed(() => icalTokenQueryKey(group())),
    queryFn: async (): Promise<IcalTokenResponse> => {
      const res = await client.api.user["ical-token"].$get({
        query: { group: group() },
      });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch iCal token");
      return res.json() as Promise<IcalTokenResponse>;
    },
    enabled: () => !!group(),
  });

export const useUpsertIcalToken = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { group: string; filters: ScheduleFilter }) => {
      const res = await client.api.user["ical-token"].$post({
        json: payload,
      });
      if (!res.ok) throw new Error("Failed to create iCal token");
      return res.json();
    },
    onSuccess: (_, payload) =>
      queryClient.invalidateQueries({
        queryKey: icalTokenQueryKey(payload.group),
      }),
  });
};

export const useUpdateIcalFilters = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { group: string; filters: ScheduleFilter }) => {
      const res = await client.api.user["ical-token"].$patch({
        json: payload,
      });
      if (!res.ok) throw new Error("Failed to update filters");
    },
    onSuccess: (_, payload) =>
      queryClient.invalidateQueries({
        queryKey: icalTokenQueryKey(payload.group),
      }),
  });
};
