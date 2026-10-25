import { config } from "../config";

export function botStartUrl(payload: string) {
  return `${config.telegram.url}?start=${payload}`;
}
