import { useQuery } from "@tanstack/vue-query";
import type { ScheduleItem } from "@/lib/types";
import { client } from "./client";

export const getGroups = async (): Promise<string[]> => {
  const res = await client.api.groups.$get();

  if (!res.ok) {
    throw new Error("Failed to fetch groups");
  }

  return res.json() as Promise<string[]>;
};

export const useGroupsQuery = () =>
  useQuery({
    queryKey: ["groups"],
    queryFn: getGroups,
  });

export const getGroupSchedule = async (
  group: string,
): Promise<ScheduleItem[]> => {
  const res = await client.api.groups.$get({ query: { group } });

  if (!res.ok) {
    throw new Error("Failed to fetch group schedule");
  }

  return res.json() as Promise<ScheduleItem[]>;
};

export const useGroupScheduleQuery = (group: () => string) =>
  useQuery({
    queryKey: ["schedule", group],
    queryFn: () => getGroupSchedule(group()),
    enabled: () => !!group(),
  });
