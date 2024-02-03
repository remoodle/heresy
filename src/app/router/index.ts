import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import { useUserStore } from "@/shared/stores/user";
import LoginPage from "@/pages/login/Page.vue";
import HomePage from "@/pages/home/Page.vue";
import DashboardPage from "@/pages/dashboard/Page.vue";

declare module "vue-router" {
  interface RouteMeta {
    auth: "required" | "forbidden" | "none";
    hideAuthNavigation?: boolean;
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: HomePage,
    meta: {
      auth: "none",
    },
  },
  {
    path: "/login",
    name: "login",
    component: LoginPage,
    meta: {
      auth: "forbidden",
      hideAuthNavigation: true,
    },
  },
  {
    name: "dashboard",
    path: "/dashboard",
    component: DashboardPage,
    meta: {
      auth: "required",
    },
  },
  {
    path: "/:pathMatch(.*)*",
    name: "404",
    component: () => import("@/pages/404/Page.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (to.hash) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ el: to.hash, top: 100 });
        }, 150);
      });
    }

    if (savedPosition) {
      return savedPosition;
    }

    if (
      to.name === from.name &&
      JSON.stringify(to.query) !== JSON.stringify(from.query)
    ) {
      return;
    }

    return { top: 0 };
  },
});

router.beforeEach((to, from) => {
  const userStore = useUserStore();

  const authorized = userStore.authorized;

  if (to.meta.auth === "required" && !authorized) {
    return { name: "login", query: { next: to.fullPath } };
  }

  if (to.meta.auth === "forbidden" && authorized) {
    return { name: "dashboard" };
  }
});

export default router;
