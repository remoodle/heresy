import { formatLesson, type GroupScheduleItem } from "./model.js";

const BASE_URL = "https://du.astanait.edu.kz:8765";

export class DuScheduleClient {
  constructor(
    private readonly token: string,
    private readonly fetchImplementation: typeof fetch = fetch,
  ) {}

  async scheduleForGroup(group: string): Promise<GroupScheduleItem[]> {
    const path = `/astanait-schedule-module/api/v1/schedule/groupName/${encodeURIComponent(group)}`;
    const response = await this.fetchWithRetry(new URL(path, BASE_URL));
    const value: unknown = await response.json();

    if (!isRecord(value) || !Array.isArray(value.body)) {
      throw new Error(`DU returned an invalid schedule for ${group}`);
    }

    return value.body.flatMap((lesson) => {
      const formatted = formatLesson(lesson);
      return formatted ? [formatted] : [];
    });
  }

  private async fetchWithRetry(url: URL): Promise<Response> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const response = await this.fetchImplementation(url, {
          headers: { Authorization: `Bearer ${this.token}` },
        });

        if (response.ok) return response;
        lastError = new Error(
          `DU request failed with ${response.status} ${response.statusText}`,
        );
      } catch (error) {
        lastError = error;
      }

      if (attempt < 3)
        await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    }

    throw lastError instanceof Error
      ? lastError
      : new Error("DU request failed");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
