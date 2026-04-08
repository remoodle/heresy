import { createRouter, createWebHistory } from "vue-router";
import { authClient } from "@/lib/auth-client";
import AuthCallbackView from "../views/AuthCallbackView.vue";
import LandingView from "../views/LandingView.vue";
import ScheduleView from "../views/ScheduleView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "landing",
      component: LandingView,
    },
    {
      path: "/schedule",
      name: "schedule",
      component: ScheduleView,
      meta: { requiresAuth: true },
    },
    {
      path: "/api/auth/callback/:provider",
      component: AuthCallbackView,
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: "/",
    },
  ],
});

router.beforeEach(async (to) => {
  const session = await authClient.getSession();

  if (to.meta.requiresAuth) {
    if (!session.data) return { path: "/" };
    return true;
  }

  if (to.name === "landing" && session.data) {
    return { path: "/schedule" };
  }

  return true;
});

export default router;
