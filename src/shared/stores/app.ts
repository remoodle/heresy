import { useStorage, useColorMode } from "@vueuse/core";
import type { RemovableRef } from "@vueuse/core";
import { defineStore } from "pinia";
import { getStorageKey } from "@/shared/utils";
import type { Providers, Provider } from "@/shared/types";
import { computed } from "vue";

export const useAppStore = defineStore("app", () => {
  const { store: theme } = useColorMode({
    modes: {
      light: "light",
      dark: "dark",
    },
    storageKey: getStorageKey("theme"),
  });

  const toggleTheme = () => {
    theme.value = theme.value === "light" ? "dark" : "light";
  };

  const defaultProviders: Providers = Object.freeze({
    "aitu-341eb7e7-556a-4702-8c93-3423eadf94a2": {
      name: "Astana IT University",
      api: "https://aitu0.remoodle.app",
    },
    "nu-dc035a6f-099a-449a-bb87-0bac84f57e61": {
      name: "Nazarbayev University",
      api: "https://nu0.remoodle.app",
    },
  });

  const availableProviders = useStorage<Providers>(
    getStorageKey("providers"),
    Object.assign({}, defaultProviders),
  );

  const provider: RemovableRef<string> = useStorage(
    getStorageKey("provider"),
    Object.keys(availableProviders.value)[0],
  );

  const selectedProvider = computed<Provider | undefined>(() => {
    return availableProviders.value[provider.value];
  });

  return {
    theme,
    toggleTheme,
    provider,
    availableProviders,
    selectedProvider,
  };
});
