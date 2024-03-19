import { ref, computed, watch } from "vue";
import { defineStore } from "pinia";
import {
  useStorage,
  StorageSerializers,
  type RemovableRef,
} from "@vueuse/core";
import { getStorageKey } from "@/shared/utils";
import type { User } from "@/shared/types";
import { api } from "@/shared/api";

export const useUserStore = defineStore("user", () => {
  const token: RemovableRef<string> = useStorage(getStorageKey("token"), "");

  const user: RemovableRef<User | undefined> = useStorage(
    getStorageKey("user"),
    null,
    undefined,
    { serializer: StorageSerializers.object },
  );

  const authorized = computed(() => {
    return !!user.value && !!token.value;
  });

  //   const {
  //     run: fetchProfile,
  //     loading,
  //     error: profileLoadingError,
  //   } = createAsyncProcess(async () => {
  //     const response = await api.getProfile();

  //     const [data, error] = response;

  //     if (
  //       authorized.value &&
  //       (error?.message === "Access denied - authentication is required" || !data)
  //     ) {
  //       logout();
  //     } else {
  //       user.value = data;
  //     }

  //     return Promise.resolve(response);
  //   });

  const setToken = (newToken: string) => {
    token.value = newToken;
  };

  const login = (authToken: string, moodleUser: User) => {
    setToken(authToken);
    user.value = moodleUser;
  };

  const logout = () => {
    token.value = "";
    user.value = null;
  };

  // const login = () => {
  //   token.value = "test";
  //   user.value = {
  //     moodle_id: 1,
  //     barcode: "220473",
  //     name: "test",
  //     email: "",
  //   };
  // };

  return {
    user,
    token,
    setToken,
    authorized,
    login,
    logout,
  };
});
