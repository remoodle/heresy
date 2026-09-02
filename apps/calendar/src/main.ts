import "temporal-polyfill/global";
import "./assets/main.css";
import { VueQueryPlugin, type VueQueryPluginOptions } from "@tanstack/vue-query";
import { createPinia } from "pinia";
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { queryClient } from "./lib/query-client";

const app = createApp(App);

app.use(createPinia());
app.use(router);

const vueQueryPluginOptions: VueQueryPluginOptions = {
  queryClient,
};

app.use(VueQueryPlugin, vueQueryPluginOptions);

app.mount("#app");
