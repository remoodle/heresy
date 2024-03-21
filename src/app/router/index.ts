import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import { useUserStore } from "@/shared/stores/user";
import { RouteName } from "@/shared/types";
import AuthPage from "@/pages/auth/Page.vue";
import HomePage from "@/pages/home/Page.vue";
import NotFoundPage from "@/pages/404/Page.vue";
import AccountPage from "@/pages/account/Page.vue";
import CoursePage from "@/pages/course/Page.vue";
import DashboardLayout from "../layouts/DashboardLayout.vue";

declare module "vue-router" {
  interface RouteMeta {
    auth: "required" | "forbidden" | "none";
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: RouteName.Home,
    meta: {
      auth: "required",
    },
    component: DashboardLayout,
    redirect: { name: RouteName.Dashboard },
    children: [
      { path: "", name: RouteName.Dashboard, component: HomePage },
      { path: "account", name: RouteName.Account, component: AccountPage },
      { path: "course/:id", name: RouteName.Course, component: CoursePage },
    ],
  },
  {
    path: "/auth/login",
    name: RouteName.Login,
    meta: {
      auth: "forbidden",
    },
    component: AuthPage,
  },
  {
    path: "/auth/signup",
    name: RouteName.SignUp,
    meta: {
      auth: "forbidden",
    },
    component: AuthPage,
  },
  {
    path: "/auth/one-tap",
    name: RouteName.Token,
    meta: {
      auth: "forbidden",
    },
    component: AuthPage,
  },
  {
    // TODO
    path: "/terms",
    name: RouteName.Terms,
    component: NotFoundPage,
  },
  {
    // TODO
    path: "/privacy",
    name: RouteName.Privacy,
    component: NotFoundPage,
  },
  {
    path: "/:pathMatch(.*)*",
    name: RouteName.NotFound,
    component: NotFoundPage,
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
    return { name: RouteName.Login, query: { next: to.fullPath } };
  }

  if (to.meta.auth === "forbidden" && authorized) {
    return { name: RouteName.Home };
  }
});

export default router;
