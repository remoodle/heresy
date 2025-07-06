<template>
  <li
    class="divide divide-border bg-background flex w-full flex-wrap items-center justify-between gap-2 rounded-lg py-2"
  >
    <div class="flex items-center gap-2">
      <slot name="icon"></slot>
      <div class="flex flex-col">
        <p><slot name="title"></slot></p>
        <p class="text-muted-foreground text-xs">
          <slot name="description"></slot>
        </p>
      </div>
    </div>
    <slot></slot>
  </li>
</template>
