import { GITHUB_ORG_URL } from "@/shared/config";

export function getRepoURL(repo: string) {
  return `${GITHUB_ORG_URL}/${repo}`;
}

export function getBuildInfo() {
  return window.__BUILD_INFO__;
}
