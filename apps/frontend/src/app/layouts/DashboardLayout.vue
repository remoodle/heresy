<script setup lang="ts">
import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import { NotificationsBanner } from "@/widgets/notifications-banner";
</script>

<template>
  <NotificationsBanner />
  <Header />
  <div class="bg-secondary">
    <div class="mt-12 mb-10 flex-wrap justify-between sm:flex">
      <main class="flex w-full flex-col">
        <RouterView v-slot="{ Component }">
          <Component :is="Component" />
        </RouterView>
      </main>
    </div>
  </div>
  <Footer />
</template>
