import { useQueryClient } from "@tanstack/vue-query";
import { computed } from "vue";
import { defineStore } from "pinia";
import { useStorage, StorageSerializers } from "@vueuse/core";
import type { RemovableRef } from "@vueuse/core";
import type { IUser } from "@remoodle/types";
import { getStorageKey } from "@/shared/lib/helpers";

export const useUserStore = defineStore("user", () => {
  const accessToken = useStorage(getStorageKey("accessToken"), "");
  const refreshToken = useStorage(getStorageKey("refreshToken"), "");

  const user: RemovableRef<IUser | undefined> = useStorage(
    getStorageKey("user"),
    null,
    undefined,
    { serializer: StorageSerializers.object },
  );

  const authorized = computed(() => {
    return !!user.value && !!accessToken.value && !!refreshToken.value;
  });

  const login = (
    accessTokenData: string,
    refreshTokenData: string,
    userData: IUser,
  ) => {
    accessToken.value = accessTokenData;
    refreshToken.value = refreshTokenData;
    user.value = userData;
  };

  const showTelegramBanner = useStorage(
    getStorageKey("telegram-notifications-banner"),
    true,
  );

  const closeTelegramBanner = () => {
    showTelegramBanner.value = false;
  };

  const queryClient = useQueryClient();

  const logout = () => {
    user.value = null;
    accessToken.value = "";
    refreshToken.value = "";

    showTelegramBanner.value = true;

    queryClient.removeQueries({ queryKey: ["private"] });
  };

  return {
    user,
    accessToken,
    refreshToken,
    authorized,
    login,
    logout,
    showTelegramBanner,
    closeTelegramBanner,
  };
});
