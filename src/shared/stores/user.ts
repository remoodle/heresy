import { ref, computed } from "vue";
import { defineStore } from "pinia";
import {
  useStorage,
  StorageSerializers,
  type RemovableRef,
} from "@vueuse/core";
import { getStorageKey, isDefined } from "@/shared/utils";
import type { MoodleUser } from "@/shared/types";

export const useUserStore = defineStore("user", () => {
  const token: RemovableRef<string> = useStorage(getStorageKey("token"), "");

  type User = {
    moodle_id: number;
    barcode: string;
    name: string;
    name_alias?: string;
    email?: string;
  };

  const user: RemovableRef<User | undefined> = useStorage(
    getStorageKey("user"),
    null,
    undefined,
    { serializer: StorageSerializers.object },
  );

  const authorized = computed(() => {
    return !!user.value && !!token.value;
  });

  const setToken = (newToken: string) => {
    token.value = newToken;
  };

  const login = (tokenData: string, userData: MoodleUser) => {
    setToken(tokenData);
    user.value = {
      moodle_id: userData.moodle_id,
      name: userData.name,
      barcode: userData.barcode,
      ...(isDefined(userData.name_alias) && {
        name_alias: userData.name_alias,
      }),
      ...(isDefined(userData.email) && { name_alias: userData.email }),
    };
  };

  const defaultPreferences = Object.freeze({
    toggledCourseCategories: [] as string[],
  });

  const getDefaultPreferences = () => {
    return Object.assign({}, defaultPreferences);
  };

  const preferences = useStorage(
    getStorageKey("user-preferences"),
    getDefaultPreferences(),
  );

  const logout = () => {
    token.value = "";
    user.value = null;

    preferences.value = getDefaultPreferences();
  };

  return {
    user,
    preferences,
    token,
    setToken,
    authorized,
    login,
    logout,
  };
});
