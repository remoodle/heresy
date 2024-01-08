import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { camelize, getCurrentInstance, toHandlerKey } from "vue";

export function getBuildInfo() {
  return window.__BUILD_INFO__;
}

export function isDefined<T>(value: T): value is NonNullable<T> {
  return value !== undefined && value !== null;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
