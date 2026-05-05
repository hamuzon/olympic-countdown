<script setup>
// AppFooter will automatically use the current year if no prop is passed.
</script>

<template>
  <div class="container">
    <h1>404</h1>
    <p class="message">ページが見つかりません<br><span>Sorry, Not Found.</span></p>

    <router-link class="back-btn" to="/">トップページへ戻る</router-link>

    <AppFooter />
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');

:root {
  --selection-bg: rgba(0, 229, 255, 0.4);
  --selection-text: #ffffff;
}

* { margin:0; padding:0; box-sizing:border-box; }

::selection {
  background: var(--selection-bg);
  color: var(--selection-text);
}

body {
  background: #0a1a2b;
  font-family: 'Roboto', sans-serif;
  color: #fff;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background-image: radial-gradient(circle at 50% 0%, #1e3a5f 0%, #0a1a2b 70%);
}

.container {
  background: rgba(255, 255, 255, 0.07);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 3rem 2rem;
  max-width: 480px; /* This was already present */
  width: 100%;
  box-shadow: 0 0 40px rgba(0, 229, 255, 0.3);
  text-align: center;
  position: relative;
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
  margin-bottom: 0.5rem;
  line-height: 1.2;
}

p.message {
  font-size: 1.2rem;
  color: #a0e0ff;
  margin-bottom: 2rem;
  font-weight: 500;
}

p.message span {
  font-size: 0.9em;
  opacity: 0.8;
}

a.back-btn {
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

a.back-btn:hover {
  background: rgba(0, 229, 255, 0.3);
  transform: translateY(-1px);
  color: #fff;
  box-shadow: 0 0 15px rgba(0, 229, 255, 0.4);
}

@media (max-width: 480px) {
  .container { padding: 2rem 1.5rem; }
  h1 { font-size: 3rem; }
}
</style>
