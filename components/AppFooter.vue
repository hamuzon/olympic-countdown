<script setup>
import { computed, unref } from 'vue';
import { useRequestURL } from '#app';

const props = defineProps({
  currentYear: {
    type: [String, Number],
    default: null
  }
});

const requestUrl = useRequestURL();

const footerHTML = computed(() => {
  const baseYear = 2025;
  const dynamicCurrentYear = unref(props.currentYear) || new Date().getFullYear();
  const host = requestUrl.host || '';
  
  let yearStr = baseYear.toString();
  if (dynamicCurrentYear > baseYear) {
    yearStr = `${baseYear}–${dynamicCurrentYear}`;
  } else if (dynamicCurrentYear < baseYear) {
    yearStr = `${dynamicCurrentYear}–${baseYear}`;
  }
  
  if(host.includes("hamuzon.github.io")){
    return `&copy; ${yearStr} <a href="https://hamuzon.github.io" target="_blank">@hamuzon</a>`;
  } else if (host.includes("hamuzon-jp.f5.si")) {
    return `&copy; ${yearStr} <a href="https://hamuzon-jp.f5.si" target="_blank">@hamuzon</a>`;
  } else if(host.includes("hamusata.f5.si")){
    return `&copy; ${yearStr} <a href="https://hamusata.f5.si" target="_blank">@hamusata</a>`;
  } else {
    return `&copy; ${yearStr} Olympic Countdown`;
  }
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