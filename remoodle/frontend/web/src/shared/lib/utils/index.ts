export function getBuildInfo() {
  return window.__BUILD_INFO__;
}

export function isDefined<T>(value: T): value is NonNullable<T> {
  return value !== undefined && value !== null;
}
