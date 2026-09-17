<template>
  <div class="error-page">
    <div class="container">
      <h1>{{ error?.statusCode || 404 }}</h1>
      <p class="message">
        ページが見つかりません<br>
        <span>Sorry, Not Found.</span>
      </p>

      <button id="backLink" class="back-btn" type="button" @click="handleError">
        トップページへ戻る
      </button>

      <div class="footer" v-html="footerHTML"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const props = defineProps({
  error: {
    type: Object,
    default: () => ({})
  }
});

useHead({
  title: '404 - Not Found',
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/icon.svg' },
    { rel: 'icon', sizes: 'any', href: '/favicon.ico' },
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap' }
  ]
});

const footerHTML = ref('');

const handleError = () => {
  const config = useRuntimeConfig();
  const baseURL = config.app?.baseURL || '/';
  clearError({ redirect: baseURL });
};

onMounted(() => {
  const baseYear = 2025;
  const currentYear = new Date().getFullYear();
  const hostname = window.location.hostname;
  
  let yearStr = baseYear.toString();
  if (currentYear > baseYear) {
    yearStr = `${baseYear}–${currentYear}`;
  } else if (currentYear < baseYear) {
    yearStr = `${currentYear}–${baseYear}`;
  }
  
  if (hostname === "hamuzon.github.io") {
    footerHTML.value = `&copy; ${yearStr} <a href="https://hamuzon.github.io" target="_blank">@hamuzon</a>`;
  } else if (hostname.includes("hamuzon-jp.f5.si")) {
    footerHTML.value = `&copy; ${yearStr} <a href="https://hamuzon-jp.f5.si" target="_blank">@hamuzon</a>`;
  } else if (hostname.includes("hamusata.f5.si")) {
    footerHTML.value = `&copy; ${yearStr} <a href="https://hamusata.f5.si" target="_blank">@hamusata</a>`;
  } else {
    footerHTML.value = `&copy; ${yearStr} Olympic Countdown`;
  }
});
</script>

<style scoped>
.error-page {
  background: #0a1a2b;
  font-family: 'Roboto', sans-serif;
  color: #fff;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background-image: radial-gradient(circle at 50% 0%, #1e3a5f 0%, #0a1a2b 70%);
  box-sizing: border-box;
}

.error-page ::selection {
  background: rgba(0, 229, 255, 0.4);
  color: #ffffff;
}

.container {
  background: rgba(255, 255, 255, 0.07);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 3rem 2rem;
  max-width: 480px;
  width: 100%;
  box-shadow: 0 0 40px rgba(0, 229, 255, 0.3);
  text-align: center;
  position: relative;
  box-sizing: border-box;
}

h1 {
  font-family: Arial, sans-serif;
  font-size: 4rem;
  font-weight: 700;
  background: linear-gradient(90deg, #33b5e5, #ffbb33, #ffffff, #99cc00, #ff4444);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 0 8px rgba(255, 255, 255, 0.3), 0 0 20px rgba(255, 255, 255, 0.2);
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
}

p.message {
  font-size: 1.2rem;
  color: #a0e0ff;
  margin: 0 0 2rem 0;
  font-weight: 500;
}

p.message span {
  font-size: 0.9em;
  opacity: 0.8;
}

.back-btn {
  display: inline-block;
  background: rgba(0, 229, 255, 0.15);
  border: none;
  border-radius: 20px;
  color: #00e5ff;
  font-weight: 600;
  padding: 10px 24px;
  cursor: pointer;
  font-family: 'Roboto', sans-serif;
  transition: all 0.3s ease;
  font-size: 1rem;
  text-decoration: none;
}

.back-btn:hover {
  background: rgba(0, 229, 255, 0.3);
  transform: translateY(-1px);
  color: #fff;
  box-shadow: 0 0 15px rgba(0, 229, 255, 0.4);
}

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

@media (max-width: 480px) {
  .container {
    padding: 2rem 1.5rem;
  }
  h1 {
    font-size: 3rem;
  }
}
</style>
