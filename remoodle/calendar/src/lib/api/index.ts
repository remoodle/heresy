import type { ScheduleItem } from "@/lib/types";

const API_URL = "/api";

export const getGroups = async (): Promise<string[]> => {
  const response = await fetch(`${API_URL}/groups`);

  if (!response.ok) {
    throw new Error("Failed to fetch groups");
  }

  return response.json();
};

export const getGroupSchedule = async (group: string): Promise<ScheduleItem[]> => {
  const response = await fetch(`${API_URL}/groups?group=${group}`);

  if (!response.ok) {
    throw new Error("Failed to fetch group schedule");
  }

  return response.json();
};
