import { extname } from "node:path";
import type { Plugin, IndexHtmlTransformResult } from "vite";

interface CDNPrefixPluginOptions {
  cdnPrefixUrl: string | null;
}

export const extractPrefixConfig = (env: Record<string, string>) => {
  if (!env.CDN_PREFIX || !env.CDN_HOST) {
    return {
      cdnPrefixUrl: null,
    };
  }

  return {
    cdnPrefixUrl: `https://${env.CDN_PREFIX}.${env.CDN_HOST}`,
  };
};

export const createRenderBuiltUrl = (
  cdnPrefixUrl: string | null,
  filename: string,
  { hostId }: { hostId: string },
) => {
  if (cdnPrefixUrl === null) {
    return { relative: true };
  }

  if (extname(hostId) === ".js") {
    return {
      runtime: `window.__toCdnUrl(${JSON.stringify(filename)})`,
    };
  }

  return `${cdnPrefixUrl}/` + filename;
};

const createCDNPrefixPlugin = (options: CDNPrefixPluginOptions): Plugin => {
  const { cdnPrefixUrl } = options;

  return {
    name: "cdn-prefix",
    apply: "build",
    enforce: "pre",
    transformIndexHtml() {
      if (!cdnPrefixUrl) {
        console.warn(
          "CDN prefix is not configured, skipping CDN prefix plugin",
        );
        return;
      }

      const els: IndexHtmlTransformResult = [];

      els.push({
        tag: "link",
        injectTo: "head-prepend",
        attrs: {
          rel: "preconnect",
          href: cdnPrefixUrl,
        },
      });

      els.push({
        tag: "link",
        injectTo: "head-prepend",
        attrs: {
          rel: "preconnect",
          href: cdnPrefixUrl,
          crossorigin: true,
        },
      });

      els.push({
        tag: "link",
        injectTo: "head-prepend",
        attrs: {
          rel: "dns-prefetch",
          href: cdnPrefixUrl,
        },
      });

      els.push({
        tag: "script",
        injectTo: "head-prepend",
        children: `window.__toCdnUrl = (filename) => "${cdnPrefixUrl}/" + filename;`,
      });

      return els;
    },
  };
};

export default createCDNPrefixPlugin;
