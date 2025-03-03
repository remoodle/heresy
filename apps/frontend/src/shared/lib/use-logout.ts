import { useUserStore } from "@/shared/stores/user";

export const useLogout = () => {
  const userStore = useUserStore();

  const logout = () => {
    userStore.logout();
  };

  return { logout };
};
