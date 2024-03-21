import { camelize, getCurrentInstance, toHandlerKey } from "vue";
import { ref, type Ref } from "vue";
import { type RouteParams, type RouteLocationRaw } from "vue-router";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { APIError } from "../types";
import { RouteName } from "../types";
import { GITHUB_ORG_URL } from "../config";

export { camelize, getCurrentInstance, toHandlerKey };

export function getBuildInfo() {
  return window.__BUILD_INFO__;
}

export function isDefined<T>(value: T): value is NonNullable<T> {
  return value !== undefined && value !== null;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getStorageKey(key: string, storageVersion?: number) {
  return `remoodle-${key}` + (storageVersion ? `-${storageVersion}` : "");
}

export function getRepoURL(repo: string) {
  return `${GITHUB_ORG_URL}/${repo}`;
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("");
}

export function isEmptyString(value: string) {
  return value.trim() === "";
}

interface UseAsync<T extends (...args: unknown[]) => unknown, E = APIError> {
  loading: Ref<boolean>;
  error: Ref<E | null>;
  run: (...args: Parameters<T>) => Promise<ReturnType<T>>;
}

export function createAsyncProcess<T extends (...args: any) => unknown>(
  fn: T,
): UseAsync<T> {
  const loading: UseAsync<T>["loading"] = ref(false);
  const error: UseAsync<T>["error"] = ref(null);

  const run: UseAsync<T>["run"] = async (...args) => {
    try {
      loading.value = true;
      error.value = null;
      const result = await fn(...(args as any));
      return result as ReturnType<T>;
    } catch (err) {
      // @ts-ignore
      error.value = err;
      return error as ReturnType<T>;
    } finally {
      loading.value = false;
    }
  };

  return { loading, run, error };
}

export function routeTo(
  name: RouteName,
  params?: RouteParams,
): RouteLocationRaw {
  return {
    name,
    params,
  };
}

export const vFocus = {
  mounted: (el: HTMLInputElement) => el.focus(),
};
