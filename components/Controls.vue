<script setup>
defineProps({
  mode: String,
  lang: String,
  config: Object
});
defineEmits(['setMode', 'toggleLang']);
</script>

<template>
  <div class="controls">
    <button v-if="config.SUMMER_ENABLED" :class="{ active: mode === 'summer' }" @click="$emit('setMode', 'summer')">
      {{ lang === 'ja' ? '夏季' : 'Summer' }}
    </button>
    <button v-if="config.WINTER_ENABLED" :class="{ active: mode === 'winter' }" @click="$emit('setMode', 'winter')">
      {{ lang === 'ja' ? '冬季' : 'Winter' }}
    </button>
    <button @click="$emit('toggleLang')">
      {{ lang === 'ja' ? 'EN' : '日本語' }}
    </button>
  </div>
</template>

<style scoped>
.controls {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-bottom: 1rem;
}

button {
  background: rgba(0, 229, 255, 0.15);
  border: none;
  border-radius: 20px;
  color: #00e5ff;
  font-weight: 600;
  padding: 8px 16px;
  cursor: pointer;
  font-family: 'Roboto', sans-serif;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

button:hover {
  background: rgba(0, 229, 255, 0.3);
  transform: translateY(-1px);
}

button.active {
  background: #00e5ff;
  color: #000;
  box-shadow: 0 0 15px rgba(0, 229, 255, 0.4);
}
</style>
