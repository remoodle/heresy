<script setup lang="ts">
const width = 28;
const height = 22;

const bayer = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
] as const;

type DitherPixel = {
  id: string;
  x: number;
  y: number;
  opacity: number;
  alternateOpacity: number;
  delay: number;
};

function calendarTone(x: number, y: number) {
  let tone = 0;

  // A faint offset shadow keeps the illustration legible without a container.
  if (x >= 7 && x <= 25 && y >= 6 && y <= 20) tone = 0.13;

  // Calendar paper and outline.
  if (x >= 4 && x <= 23 && y >= 4 && y <= 19) tone = Math.max(tone, 0.09);
  if ((x === 4 || x === 23) && y >= 4 && y <= 19) tone = 1;
  if ((y === 4 || y === 19) && x >= 4 && x <= 23) tone = 1;

  // Header, binding rings, and the line below the month.
  if (x >= 5 && x <= 22 && y >= 5 && y <= 7) tone = Math.max(tone, 0.42);
  if (y === 8 && x >= 4 && x <= 23) tone = 0.9;
  if ((x === 8 || x === 9 || x === 18 || x === 19) && y >= 2 && y <= 5)
    tone = 1;

  // Quiet calendar grid.
  if ((x === 10 || x === 16) && y >= 10 && y <= 17) tone = Math.max(tone, 0.24);
  if (y === 13 && x >= 5 && x <= 22) tone = Math.max(tone, 0.24);

  // Three blocks suggest events rather than placeholder text.
  if (x >= 6 && x <= 9 && y >= 10 && y <= 11) tone = 0.95;
  if (x >= 12 && x <= 15 && y >= 15 && y <= 16) tone = 0.72;
  if (x >= 18 && x <= 21 && y >= 10 && y <= 12) tone = 0.52;

  return tone;
}

const pixels: DitherPixel[] = [];

for (let y = 0; y < height; y += 1) {
  for (let x = 0; x < width; x += 1) {
    const tone = calendarTone(x, y);
    if (!tone) continue;

    const threshold = (bayer[y % 4]![x % 4]! + 0.5) / 16;
    const alternateThreshold = (bayer[(y + 1) % 4]![(x + 1) % 4]! + 0.5) / 16;
    const opacity =
      tone >= 0.85
        ? 1
        : tone >= threshold
          ? 0.82
          : tone + 0.16 >= threshold
            ? 0.2
            : 0;
    const alternateOpacity =
      tone >= 0.85
        ? 1
        : tone >= alternateThreshold
          ? 0.82
          : tone + 0.12 >= alternateThreshold
            ? 0.16
            : 0;

    if (opacity === 0 && alternateOpacity === 0) continue;

    pixels.push({
      id: `${x}-${y}`,
      x,
      y,
      opacity,
      alternateOpacity,
      delay: -((x + y) % 12) * 0.11,
    });
  }
}
</script>

<template>
  <div
    class="dither-calendar"
    role="img"
    aria-label="A dithered calendar with three scheduled events"
  >
    <span
      v-for="pixel in pixels"
      :key="pixel.id"
      aria-hidden="true"
      class="dither-calendar__pixel"
      :style="{
        '--x': pixel.x,
        '--y': pixel.y,
        '--pixel-opacity': pixel.opacity,
        '--pixel-opacity-alt': pixel.alternateOpacity,
        '--delay': `${pixel.delay}s`,
      }"
    />
  </div>
</template>

<style scoped>
.dither-calendar {
  position: relative;
  width: 222px;
  height: 174px;
  color: var(--foreground);
}

.dither-calendar__pixel {
  position: absolute;
  top: calc(var(--y) * 8px);
  left: calc(var(--x) * 8px);
  width: 6px;
  height: 6px;
  background: currentColor;
  opacity: var(--pixel-opacity);
  animation: ordered-dither 3.8s steps(1, end) infinite;
  animation-delay: var(--delay);
}

@keyframes ordered-dither {
  0%,
  54%,
  100% {
    opacity: var(--pixel-opacity);
  }

  55%,
  76% {
    opacity: var(--pixel-opacity-alt);
  }
}

@media (prefers-reduced-motion: reduce) {
  .dither-calendar__pixel {
    animation: none;
  }
}
</style>
