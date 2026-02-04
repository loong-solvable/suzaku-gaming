<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface Props {
  text?: string;
  fontSize?: number;
  color?: string;
  rotate?: number;
  gap?: number;
}

const props = withDefaults(defineProps<Props>(), {
  text: '3kadmin',
  fontSize: 14,
  color: 'rgba(0, 0, 0, 0.06)',
  rotate: -20,
  gap: 100
});

const canvasRef = ref<HTMLCanvasElement | null>(null);
const bgImage = ref('');

onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { text, fontSize, color, rotate, gap } = props;
  const textWidth = text.length * fontSize;
  const size = textWidth + gap;

  canvas.width = size;
  canvas.height = size;

  ctx.font = `${fontSize}px Arial`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.translate(size / 2, size / 2);
  ctx.rotate((rotate * Math.PI) / 180);
  ctx.fillText(text, 0, 0);

  bgImage.value = canvas.toDataURL('image/png');
});
</script>

<template>
  <div class="watermark" :style="{ backgroundImage: `url(${bgImage})` }">
    <canvas ref="canvasRef" style="display: none" />
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.watermark {
  position: relative;
  width: 100%;
  height: 100%;
  background-repeat: repeat;
}
</style>
