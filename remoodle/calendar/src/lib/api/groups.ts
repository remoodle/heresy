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

export const getGroupSchedule = async (group: string): Promise<ScheduleItem[]> => {
  const res = await client.api.groups[":group"].$get({ param: { group } });

  if (!res.ok) {
    throw new Error("Failed to fetch group schedule");
  }

  return res.json() as Promise<ScheduleItem[]>;
};

export const useGroupScheduleQuery = (group: () => string) =>
  useQuery({
    queryKey: ["schedule", "group", group],
    queryFn: () => getGroupSchedule(group()),
    enabled: () => !!group(),
  });

export const getLocations = async (): Promise<string[]> => {
  const res = await client.api.locations.$get();

  if (!res.ok) {
    throw new Error("Failed to fetch locations");
  }

  return res.json() as Promise<string[]>;
};

export const useLocationsQuery = () =>
  useQuery({
    queryKey: ["locations"],
    queryFn: getLocations,
  });

export const getLocationSchedule = async (
  location: string
): Promise<ScheduleItem[]> => {
  const res = await client.api.locations[":location"].$get({
    param: { location },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch location schedule");
  }

  return res.json() as Promise<ScheduleItem[]>;
};

export const useLocationScheduleQuery = (location: () => string) =>
  useQuery({
    queryKey: ["schedule", "location", location],
    queryFn: () => getLocationSchedule(location()),
    enabled: () => !!location(),
  });

export const getTeachers = async (): Promise<string[]> => {
  const res = await client.api.teachers.$get();

  if (!res.ok) {
    throw new Error("Failed to fetch teachers");
  }

  return res.json() as Promise<string[]>;
};

export const useTeachersQuery = () =>
  useQuery({
    queryKey: ["teachers"],
    queryFn: getTeachers,
  });

export const getTeacherSchedule = async (
  teacher: string
): Promise<ScheduleItem[]> => {
  const res = await client.api.teachers[":teacher"].$get({
    param: { teacher },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch teacher schedule");
  }

  return res.json() as Promise<ScheduleItem[]>;
};

export const useTeacherScheduleQuery = (teacher: () => string) =>
  useQuery({
    queryKey: ["schedule", "teacher", teacher],
    queryFn: () => getTeacherSchedule(teacher()),
    enabled: () => !!teacher(),
  });
