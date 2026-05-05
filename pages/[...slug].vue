<script setup>
/**
 * Olympic Countdown Page (Catch-all Route)
 * Supports /, /:year, /:year/:lang
 */
import { ref, onMounted, onUnmounted, computed } from 'vue';

// --- Composables ---
const route = useRoute();
const router = useRouter();
const config = useRuntimeConfig();

// --- Static Data ---
const eventsData = {
  summer: {
    2020: { city: {ja:"東京", en:"Tokyo"}, start: "2021-07-23T20:00:00+09:00", end: "2021-08-08T22:00:00+09:00" },
    2024: { city: {ja:"パリ", en:"Paris"}, start: "2024-07-26T19:30:00+02:00", end: "2024-08-11T23:59:59+02:00" },
    2028: { city: {ja:"ロサンゼルス", en:"Los Angeles"}, start: "2028-07-14T00:00:00-07:00", end: "2028-07-30T23:59:59-07:00" },
    2032: { city: {ja:"ブリスベン", en:"Brisbane"}, start: "2032-07-23T00:00:00+10:00", end: "2032-08-08T23:59:59+10:00" }
  },
  winter: {
    2022: { city: {ja:"北京", en:"Beijing"}, start: "2022-02-04T20:00:00+08:00", end: "2022-02-20T22:00:00+08:00" },
    2026: { city: {ja:"ミラノ・コルティナ", en:"Milan-Cortina"}, start: "2026-02-06T20:00:00+01:00", end: "2026-02-22T23:59:59+01:00" },
    2030: { city: {ja:"フレンチアルプス", en:"French Alps"}, start: "2030-02-08T00:00:00+01:00", end: "2030-02-24T23:59:59+01:00" },
    2034: { city: {ja:"ソルトレイクシティ", en:"Salt Lake City"}, start: "2034-02-10T00:00:00-07:00", end: "2034-02-26T23:59:59-07:00" }
  }
};

const CONFIG = { SUMMER_ENABLED: 1, WINTER_ENABLED: 1 };

const getAllYears = () => [...Object.keys(eventsData.summer), ...Object.keys(eventsData.winter)].sort((a, b) => Number(a) - Number(b));
const findNearestFutureEvent = (now = Date.now()) => 
  getAllYears().find(yr => new Date((eventsData.summer[yr] || eventsData.winter[yr]).end).getTime() > now) || getAllYears().at(-1);

/**
 * パスパラメータから状態を抽出
 */
const getInitialState = () => {
  const slug = route.params.slug || []; // array of path segments
  const q = route.query;
  
  let resYear = slug[0] || q.year;
  let resLang = slug[1] || q.lang;
  let resMode = 'summer';

  if (process.client) {
    const reset = /^(1|on|true)$/i.test(String(q.reset || q.reboot || q.restart));
    if (!reset) {
      resLang = resLang || localStorage.getItem('olympicCountdownLang');
      if (!resYear) {
        const sYear = localStorage.getItem('olympicCountdownYear');
        const sMode = localStorage.getItem('olympicCountdownMode');
        if (sYear && sMode && eventsData[sMode]?.[sYear]) {
          resYear = sYear;
          resMode = sMode;
        }
      }
    }
  }

  resLang = (resLang === 'en' || resLang === 'ja') ? resLang : 'ja';
  if (resYear && eventsData.winter[resYear]) resMode = 'winter';
  else if (resYear && eventsData.summer[resYear]) resMode = 'summer';
  else {
    resYear = findNearestFutureEvent();
    resMode = eventsData.winter[resYear] ? 'winter' : 'summer';
  }

  return { lang: resLang, mode: resMode, year: resYear };
};

const initialState = getInitialState();
const mode = ref(initialState.mode);
const lang = ref(initialState.lang);
const currentYearKey = ref(initialState.year);

const statusText = ref('');
const dayText = ref('');
const timeText = ref('');
let timerId = null;

function getCalendarDiff(fromDate, toDate) {
  const from = new Date(fromDate);
  const to = new Date(toDate);
  if (to <= from) return { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };

  const cursor = new Date(from);
  let years = to.getFullYear() - cursor.getFullYear();
  if (new Date(cursor).setFullYear(cursor.getFullYear() + years) > to) years -= 1;
  cursor.setFullYear(cursor.getFullYear() + years);

  let months = (to.getFullYear() - cursor.getFullYear()) * 12 + (to.getMonth() - cursor.getMonth());
  if (new Date(cursor).setMonth(cursor.getMonth() + months) > to) months -= 1;
  cursor.setMonth(cursor.getMonth() + months);

  let remainMs = to - cursor;
  const days = Math.floor(remainMs / 86400000);
  remainMs -= days * 86400000;
  const hours = Math.floor(remainMs / 3600000);
  remainMs -= hours * 3600000;
  const minutes = Math.floor(remainMs / 60000);
  remainMs -= minutes * 60000;
  const seconds = Math.floor(remainMs / 1000);

  return { years, months, days, hours, minutes, seconds };
}

function formatDiff(fromDate, toDate) {
  const diff = getCalendarDiff(fromDate, toDate);
  const pad = (n) => String(n).padStart(2, '0');
  const isJa = lang.value === 'ja';
  let ymdStr = (diff.years > 0 ? `${diff.years}${isJa ? '年' : 'y'} ` : "") + (diff.months > 0 ? `${diff.months}${isJa ? 'ヶ月' : 'mo'} ` : "") + `${diff.days}${isJa ? '日' : 'd'}`;
  const hmsStr = isJa ? `${diff.hours}時間 ${diff.minutes}分 ${diff.seconds}秒` : `${pad(diff.hours)}h ${pad(diff.minutes)}m ${pad(diff.seconds)}s`;
  return { ymd: ymdStr, hms: hmsStr };
}

function updateCountdown() {
  const now = new Date();
  const targetEvent = eventsData[mode.value][currentYearKey.value];
  if (!targetEvent) return;
  const start = new Date(targetEvent.start), end = new Date(targetEvent.end);
  if (now >= start && now <= end) {
    const dayNum = Math.floor((now - start) / 86400000) + 1;
    const remaining = formatDiff(now, end);
    statusText.value = lang.value === "ja" ? `大会 ${dayNum} 日目 / 残り` : `Day ${dayNum} / Remaining`;
    dayText.value = remaining.ymd; timeText.value = remaining.hms;
  } else {
    const isBefore = now < start;
    const formatted = isBefore ? formatDiff(now, start) : formatDiff(end, now);
    statusText.value = lang.value === "ja" ? (isBefore ? "開催まで" : "終了から") : (isBefore ? "Starts in" : "Since closing");
    dayText.value = formatted.ymd; timeText.value = formatted.hms;
  }
}

const seoData = computed(() => {
  const data = eventsData[mode.value]?.[currentYearKey.value];
  if (!data) return null;
  const isJa = lang.value === "ja";
  const cityName = data.city[lang.value];
  const season = isJa ? (mode.value === "summer" ? "夏季" : "冬季") : mode.value.charAt(0).toUpperCase() + mode.value.slice(1);
  return {
    title: isJa ? `${currentYearKey.value} ${cityName} ${season}五輪 カウントダウン` : `${currentYearKey.value} ${cityName} ${season} Olympics`,
    description: isJa ? `${cityName}五輪までの時間をリアルタイム表示。` : `Countdown to ${cityName} Olympics.`,
    url: `https://hamuzon.github.io${config.app.baseURL}${currentYearKey.value}/${lang.value}`.replace(/\/+/g, '/').replace(':/', '://'),
    locale: isJa ? 'ja_JP' : 'en_US'
  };
});

useSeoMeta({
  title: () => seoData.value?.title,
  ogTitle: () => seoData.value?.title,
  description: () => seoData.value?.description,
  ogUrl: () => seoData.value?.url,
  ogLocale: () => seoData.value?.locale,
  twitterCard: 'summary_large_image',
});

function updateQueryParams() {
  if (!process.client) return;
  // URLを /year/lang 形式に統一
  router.replace(`/${currentYearKey.value}/${lang.value}`);
}

function setMode(m) {
  mode.value = m;
  const years = Object.keys(eventsData[m]).sort();
  currentYearKey.value = years.find(y => new Date(eventsData[m][y].end).getTime() > Date.now()) || years.at(-1);
  updateQueryParams();
}

function toggleLang() {
  lang.value = lang.value === "ja" ? "en" : "ja";
  updateQueryParams();
}

const eventTitleDisplay = computed(() => {
  const data = eventsData[mode.value]?.[currentYearKey.value];
  return data ? `${currentYearKey.value} ${data.city[lang.value]}` : 'Loading...';
});

onMounted(() => {
  updateCountdown();
  timerId = setInterval(updateCountdown, 1000);
  if (process.client) updateQueryParams();
});

onUnmounted(() => clearInterval(timerId));
</script>

<template>
  <div class="container">
    <h1>{{ lang === 'ja' ? 'オリンピック カウントダウン' : 'Olympic Countdown' }}</h1>
    <h2>{{ eventTitleDisplay }}</h2>

    <Controls :mode="mode" :lang="lang" :config="CONFIG" @setMode="setMode" @toggleLang="toggleLang" />

    <div class="year-selector">
      <select :value="currentYearKey" @change="e => { currentYearKey = e.target.value; updateQueryParams(); }">
        <option v-for="y in Object.keys(eventsData[mode])" :key="y" :value="y">
          {{ y }} {{ eventsData[mode][y].city[lang] }}
        </option>
      </select>
    </div>

    <CountdownDisplay :statusText="statusText" :dayText="dayText" :timeText="timeText" />
    <div class="notice">{{ lang === 'ja' ? '※時間は目安です。' : 'Note: Times are approximate.' }}</div>
    <AppFooter :current-year="currentYearKey" />
  </div>
</template>

<style scoped>
.container {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 2.5rem 2rem;
  max-width: 480px;
  width: 100%;
  box-shadow: 0 0 40px rgba(0, 229, 255, 0.3);
  text-align: center;
  margin: 2rem auto;
}

h1 {
  font-size: 2.2rem;
  background: linear-gradient(90deg, #33b5e5, #ffbb33, #ffffff, #99cc00, #ff4444);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin-bottom: 0.5rem;
}

h2 {
  font-size: 1.2rem;
  color: #4fc3f7;
  margin-bottom: 2rem;
  font-weight: 400;
}

.year-selector { margin-bottom: 1.5rem; }

select {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 229, 255, 0.3);
  border-radius: 8px;
  color: #fff;
  padding: 8px;
  font-size: 1rem;
}

.notice {
  margin-top: 1rem;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
}
</style>