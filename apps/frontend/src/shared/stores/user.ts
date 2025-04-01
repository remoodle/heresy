import { useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, watchEffect } from "vue";
import { defineStore } from "pinia";
import { useStorage, StorageSerializers } from "@vueuse/core";
import type { RemovableRef } from "@vueuse/core";
import type { IUser } from "@remoodle/types";
import { requestUnwrap, getAuthHeaders } from "@/shared/lib/hc";
import { usePosthog } from "@/shared/services/posthog";
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

  const posthog = usePosthog();

  const logout = () => {
    user.value = null;
    accessToken.value = "";
    refreshToken.value = "";

    showTelegramBanner.value = true;

    queryClient.removeQueries({ queryKey: ["private"] });

    posthog.reset();
  };

  const { data, error } = useQuery({
    queryKey: ["private", "check"],
    queryFn: async () =>
      await requestUnwrap((client) =>
        client.v2.user.check.$get(
          {},
          { headers: getAuthHeaders(accessToken.value) },
        ),
      ),
    enabled: authorized,
  });

  watchEffect(() => {
    if (data.value) {
      user.value = data.value;

      posthog.identify(user.value._id, {
        name: user.value.name,
        username: user.value.username,
        handle: user.value.handle,
        health: user.value.health,
      });
    }
  });

  watchEffect(() => {
    if (error.value?.status === 401) {
      logout();
    }
  });

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
