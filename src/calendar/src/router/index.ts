import { createRouter, createWebHistory } from "vue-router";
import AuthCallbackView from "../views/AuthCallbackView.vue";
import HomeView from "../views/HomeView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
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

export default router;
