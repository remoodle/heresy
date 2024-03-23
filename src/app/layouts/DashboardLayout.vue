<script setup lang="ts">
import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
</script>

<template>
  <Header />
  <div class="bg-secondary">
    <div class="mb-10 mt-28 flex-wrap justify-between sm:flex">
      <main class="flex w-full flex-col">
        <RouterView v-slot="{ Component }">
          <KeepAlive :include="['DashboardPage']">
            <Component :is="Component" />
          </KeepAlive>
        </RouterView>
      </main>
    </div>
  </div>
  <Footer />
</template>
