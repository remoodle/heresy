<script setup lang="ts">
withDefaults(
  defineProps<{
    bordered?: boolean;
    exactActive?: boolean;
  }>(),
  {
    bordered: true,
    exactActive: true,
  },
);
</script>

<template>
  <nav
    class="flex flex-row flex-nowrap gap-2 overflow-x-auto overflow-y-hidden"
    style="-webkit-overflow-scrolling: touch"
  >
    <ul
      v-bind="$attrs"
      class="flex h-14 w-full flex-row gap-x-6 [&>*]:relative [&>*]:flex [&>*]:h-full [&>*]:flex-shrink-0 [&>*]:items-center [&>*]:gap-1 [&>*]:px-2 [&>*]:no-underline [&>*]:before:absolute [&>*]:before:left-0 [&>*]:before:top-[95%] [&>*]:before:z-[0] [&>*]:before:hidden [&>*]:before:h-1 [&>*]:before:w-full [&>*]:before:rounded-t-full [&>*]:before:bg-primary [&>*]:before:content-['']"
      :class="[
        bordered && 'border-base-300 border-b',
        exactActive
          ? '[&>.router-link-exact-active]:before:block'
          : '[&>.router-link-active]:before:block',
      ]"
    >
      <slot></slot>
    </ul>
  </nav>
</template>
