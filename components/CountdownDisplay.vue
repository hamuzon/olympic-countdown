<script setup>
defineProps({
  statusText: String,
  dayText: String,
  timeText: String
});
</script>

<template>
  <div class="countdown-box">
    <div id="statusDisplay">{{ statusText }}</div>
    <div id="dayDisplay">{{ dayText }}</div>
    <div id="timeDisplay">{{ timeText }}</div>
  </div>
</template>

<style scoped>
.countdown-box {
  margin-bottom: 2rem;
}

#statusDisplay {
  font-size: 1.2rem;
  color: #a0e0ff;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

#dayDisplay {
  font-size: 3rem;
  font-weight: 700;
  background: linear-gradient(90deg, #ffd54f, #ffca28, #ffecb3);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
  line-height: 1.1;
  margin: 0.5rem 0;
}

#timeDisplay {
  font-family: Arial, sans-serif;
  font-size: 1.4rem;
  background: linear-gradient(90deg, #80d8ff, #40c4ff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  letter-spacing: 0.05em;
  margin-top: 0.5rem;
}

@media (max-width: 480px) {
  #dayDisplay { font-size: 1.8rem; }
  #timeDisplay { font-size: 1rem; }
}
</style>
