import posthog, { type PostHog } from "posthog-js";
import { inject, type App, type InjectionKey } from "vue";
import { IS_PROD } from "@/shared/config";

export const posthogContextKey: InjectionKey<PostHog> =
  Symbol("PosthogContext");

export function createPosthog(app: App) {
  posthog.init("phc_cfpLe4cOVjX1vTJLFU2Xdf63XmT0kqEfRBpYxYmEVoi", {
    api_host: "https://us.i.posthog.com",
    autocapture: true,
    loaded: function (ph) {
      if (!IS_PROD) {
        ph.opt_out_capturing();
        ph.set_config({ disable_session_recording: true });
      }
    },
  });

  app.provide(posthogContextKey, posthog);
}

export function usePosthog() {
  const posthog = inject(posthogContextKey);

  if (!posthog) {
    throw new Error("No Posthog found.");
  }

  return posthog;
}
