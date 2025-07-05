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

  const identify = (data: { _id: string; name: string }) => {
    posthog.identify(data._id, {
      name: data.name,
    });
  };

  const login = (
    accessTokenData: string,
    refreshTokenData: string,
    userData: IUser,
  ) => {
    accessToken.value = accessTokenData;
    refreshToken.value = refreshTokenData;
    user.value = userData;
    identify(user.value);
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

  const getUser = async (): Promise<IUser> => {
    return await requestUnwrap((client) =>
      client.v2.user.check.$get(
        {},
        { headers: getAuthHeaders(accessToken.value) },
      ),
    );
  };

  const { data, error, isPending, suspense } = useQuery({
    queryKey: ["private", "user"],
    queryFn: async () => await getUser(),
    enabled: authorized,
  });

  watchEffect(() => {
    if (data.value) {
      user.value = data.value;
    }
  });

  watchEffect(() => {
    if (error.value?.status === 401) {
      logout();
    }
  });

  return {
    user,
    isPending,
    suspense,
    accessToken,
    refreshToken,
    authorized,
    login,
    logout,
    identify,
    showTelegramBanner,
    closeTelegramBanner,
  };
});
