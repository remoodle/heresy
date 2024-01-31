import { ref, computed } from "vue";
import { useStorage, useColorMode } from "@vueuse/core";
import { defineStore } from "pinia";
import { getStorageKey } from "@/shared/utils";

export const useAppStore = defineStore("app", () => {
  const { system: systemTheme, store: theme } = useColorMode({
    modes: {
      light: "light",
      dark: "dark",
    },
    storageKey: getStorageKey("theme"),
  });

  const toggleTheme = () => {
    theme.value = theme.value === "light" ? "dark" : "light";
  };

  return {
    theme,
    toggleTheme,
  };
});
