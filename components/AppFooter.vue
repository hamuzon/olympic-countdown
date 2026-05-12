<script setup>
import { computed } from 'vue';

const props = defineProps({
  currentYear: {
    type: [String, Number],
    default: null
  }
});

const footerHTML = computed(() => {
  const year = Number(props.currentYear);
  if (Number.isFinite(year)) {
    return `&copy; ${year} Olympic Countdown`;
  }
  return '&copy; Olympic Countdown';
});
</script>

<template>
  <div class="footer" v-html="footerHTML"></div>
</template>

<style scoped>
.footer {
  font-size: 0.8rem;
  color: #4dd0e1;
  margin-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 1rem;
  opacity: 0.8;
}

:deep(.footer a) {
  color: #4ac8e0;
  text-decoration: none;
  transition: color 0.2s;
}

:deep(.footer a:hover) {
  color: #fff;
  text-decoration: underline;
}
</style>
