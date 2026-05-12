<script setup>
/**
 * Olympic Countdown Page
 * Optimized for SEO (OGP) and performance.
 */
import { ref, onMounted, onUnmounted, computed, watchEffect } from 'vue';

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

const CONFIG = {
  SUMMER_ENABLED: 1,
  WINTER_ENABLED: 1
};

// --- Initialization Logic (Crucial for SEO/SSG) ---
/**
 * 最も近い未来のイベント、または最新のイベントを特定するヘルパー
 */
const getAllYears = () => [...Object.keys(eventsData.summer), ...Object.keys(eventsData.winter)].sort((a, b) => Number(a) - Number(b));
const findNearestFutureEvent = (now = Date.now()) => 
  getAllYears().find(yr => new Date((eventsData.summer[yr] || eventsData.winter[yr]).end).getTime() > now) || getAllYears().at(-1);

const parseCreatePath = (value) => {
  if (!value) return {};
  const decoded = (() => {
    try { return decodeURIComponent(String(value)); } catch { return String(value); }
  })();
  const parts = decoded.split('/').filter(Boolean);
  return {
    year: parts.find((part) => /^\d{4}$/.test(part)),
    lang: parts.find((part) => part === 'ja' || part === 'en')
  };
};

/**
 * Helper to extract state from URL or fallback
 */
const getInitialState = () => {
  const q = route.query;
  const createPathValue = q.createPath || q.createpath || q.clearPath || q.clearpath;
  const fromCreatePath = parseCreatePath(createPathValue);
  let resYear = q.year || fromCreatePath.year;
  let resLang = q.lang || fromCreatePath.lang;
  let resMode = 'summer';

  // 1. Nuxt Route Params (using pages/[[year]]/[[lang]].vue structure)
  resYear = resYear || route.params.year;
  resLang = resLang || route.params.lang;

  // 2. Client-side Fallback (Server-side skips to keep SEO static)
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

  // 3. Validation & Initialization
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

// --- Reactive State ---
const mode = ref(initialState.mode);
const lang = ref(initialState.lang);
const currentYearKey = ref(initialState.year);

// --- Display Data ---
const statusText = ref('');
const dayText = ref('');
const timeText = ref('');
let timerId = null;

// --- Helpers ---
/**
 * Calculates the calendar difference between two dates.
 */
function getCalendarDiff(fromDate, toDate) {
  const from = new Date(fromDate);
  const to = new Date(toDate);
  if (to <= from) {
    return { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const cursor = new Date(from);
  let years = to.getFullYear() - cursor.getFullYear();
  const anniversary = new Date(cursor);
  anniversary.setFullYear(cursor.getFullYear() + years);
  if (anniversary > to) years -= 1;
  cursor.setFullYear(cursor.getFullYear() + years);

  let months = (to.getFullYear() - cursor.getFullYear()) * 12 + (to.getMonth() - cursor.getMonth());
  const monthMark = new Date(cursor);
  monthMark.setMonth(cursor.getMonth() + months);
  if (monthMark > to) months -= 1;
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

/**
 * Formats the countdown difference into human-readable strings.
 */
function formatDiff(fromDate, toDate) {
  const diff = getCalendarDiff(fromDate, toDate);
  const pad = (n) => String(n).padStart(2, '0');
  const isJa = lang.value === 'ja';

  let ymdStr = "";
  if (diff.years > 0) {
    ymdStr += `${diff.years}${lang.value === 'ja' ? '年' : 'y'} `;
  }
  if (diff.months > 0) {
    ymdStr += `${diff.months}${lang.value === 'ja' ? 'ヶ月' : 'mo'} `;
  }
  ymdStr += `${diff.days}${isJa ? '日' : 'd'}`;

  const hmsStr = isJa
    ? `${diff.hours}時間 ${diff.minutes}分 ${diff.seconds}秒`
    : `${pad(diff.hours)}h ${pad(diff.minutes)}m ${pad(diff.seconds)}s`;

  return { ymd: ymdStr, hms: hmsStr };
}

/**
 * Automatically selects the nearest future event in the given mode.
 */
function autoSelectNearestInMode(m) { // This function is still used by setMode, so keep it.
  const now = Date.now();
  const years = Object.keys(eventsData[m]).sort();
  const futureYear = years.find(y => new Date(eventsData[m][y].end).getTime() > now);
  currentYearKey.value = futureYear || years[years.length - 1];
}

// --- Meta & SEO ---
const requestUrl = useRequestURL();
const seoData = computed(() => {
  if (!currentYearKey.value || !eventsData[mode.value]?.[currentYearKey.value]) return null;
  
  const isJa = lang.value === "ja";
  const data = eventsData[mode.value]?.[currentYearKey.value];
  if (!data) return null;
  const cityName = data.city?.[lang.value] || '';
  const season = isJa
    ? (mode.value === 'summer' ? '夏季' : '冬季')
    : (mode.value === 'summer' ? 'Summer' : 'Winter');
  const title = isJa
    ? `${currentYearKey.value} ${cityName} ${season}オリンピック カウントダウン`
    : `${currentYearKey.value} ${cityName} ${season} Olympics Countdown`;
  const description = isJa
    ? `${currentYearKey.value} ${cityName} ${season}オリンピックまでのカウントダウンだよ！開催中・終了後の経過時間もリアルタイムで表示。`
    : `${currentYearKey.value} ${cityName} ${season} Olympics countdown! Real-time timer for before, during, and after the Games.`;

  // OGP URLの正規化 (Cloudflare/Actions環境でのSSR対応)
  const host = requestUrl.host || 'hamuzon.github.io';
  const protocol = requestUrl.protocol || 'https:';
  const baseUrl = `${protocol}//${host}${config.app.baseURL}`.replace(/\/$/, '');
  const prettyUrl = `${baseUrl}/${currentYearKey.value}/${lang.value}`;

  return { 
    title, description, 
    url: prettyUrl, 
    locale: isJa ? 'ja_JP' : 'en_US' 
  };
});

useSeoMeta({
  title: () => seoData.value?.title,
  ogTitle: () => seoData.value?.title,
  description: () => seoData.value?.description,
  ogDescription: () => seoData.value?.description,
  ogUrl: () => seoData.value?.url,
  ogLocale: () => seoData.value?.locale,
  twitterTitle: () => seoData.value?.title,
  twitterDescription: () => seoData.value?.description,
  twitterCard: 'summary_large_image',
});

useHead({
  link: [{ rel: 'canonical', href: () => seoData.value?.url }]
});

// --- Actions ---
function setMode(m) {
  if (m === 'summer' && !CONFIG.SUMMER_ENABLED) return;
  if (m === 'winter' && !CONFIG.WINTER_ENABLED) return;

  mode.value = m;
  autoSelectNearestInMode(m); // This will update currentYearKey.value

  if (process.client) {
    localStorage.setItem('olympicCountdownMode', mode.value);
    localStorage.setItem('olympicCountdownYear', currentYearKey.value);
  }
  updateQueryParams();
}

function toggleLang() {
  lang.value = lang.value === "ja" ? "en" : "ja";
  if (process.client) {
    syncStateFromQuery();
    localStorage.setItem('olympicCountdownLang', lang.value);
  }
  updateQueryParams();
}

function changeYear(event) {
  currentYearKey.value = event.target.value;
  if (process.client) {
    localStorage.setItem('olympicCountdownYear', currentYearKey.value);
  }
  updateQueryParams();
}


function syncStateFromQuery() {
  const q = route.query;
  const createPathValue = q.createPath || q.createpath || q.clearPath || q.clearpath;
  const fromCreatePath = parseCreatePath(createPathValue);
  const requestedYear = String(q.year || fromCreatePath.year || '').trim();
  const requestedLang = q.lang || fromCreatePath.lang;

  if (requestedLang === 'ja' || requestedLang === 'en') {
    lang.value = requestedLang;
  }

  if (eventsData.winter[requestedYear]) {
    mode.value = 'winter';
    currentYearKey.value = requestedYear;
  } else if (eventsData.summer[requestedYear]) {
    mode.value = 'summer';
    currentYearKey.value = requestedYear;
  }
}

function updateQueryParams() {
  if (!process.client) return;
  const q = { ...route.query };
  const targetYear = String(currentYearKey.value);
  const targetLang = lang.value;

  // すでにURLが期待通りであれば処理をスキップ（高速化と不要な履歴生成防止）
  if (q.year === targetYear && q.lang === targetLang && !q.createPath && !q.createpath && !q.clearPath && !q.clearpath) return;

  const newQuery = { ...q, year: targetYear, lang: targetLang };
  delete newQuery.createPath;
  delete newQuery.createpath;
  delete newQuery.clearPath;
  delete newQuery.clearpath; // createPath系クエリを削除してクリーンアップ
  
  router.replace({ query: newQuery, hash: route.hash });
}

/**
 * Main timer loop function
 */
function updateCountdown() {
  if (!currentYearKey.value) return;

  const now = new Date();
  const targetEvent = eventsData[mode.value][currentYearKey.value];
  if (!targetEvent) return;

  const start = new Date(targetEvent.start);
  const end = new Date(targetEvent.end);

  if (now >= start && now <= end) {
    // During the event
    const diffStart = now - start;
    const dayNum = Math.floor(diffStart / (1000 * 60 * 60 * 24)) + 1;
    const remaining = formatDiff(now, end);
    
    statusText.value = (lang.value === "ja" 
      ? `大会 ${dayNum} 日目 / 残り` 
      : `Day ${dayNum} / Remaining`);
    dayText.value = remaining.ymd;
    timeText.value = remaining.hms;
  } else {
    // Before or after the event
    let prefix;
    let formatted;

    if (now < start) {
      prefix = lang.value === "ja" ? "開催まで" : "Starts in";
      formatted = formatDiff(now, start);
    } else {
      prefix = lang.value === "ja" ? "終了から" : "Since closing";
      formatted = formatDiff(end, now);
    }
    
    statusText.value = prefix;
    dayText.value = formatted.ymd;
    timeText.value = formatted.hms;
  }
}

// --- Computed Values ---
/**
 * Generates the list of years for the dropdown based on 
 * the current season (summer/winter).
 */
const availableYears = computed(() => {
  return Object.keys(eventsData[mode.value]).map(y => ({
    value: y,
    label: `${y} ${eventsData[mode.value]?.[y]?.city[lang.value] || ''}`
  }));
});

const eventTitle = computed(() => {
  const data = eventsData[mode.value]?.[currentYearKey.value];
  if (!data) return 'Loading...';
  return `${currentYearKey.value} ${data.city[lang.value]}`;
});

const noticeText = computed(() => {
  return lang.value === "ja"
    ? "※カウントダウンは目安であり、実際の開催時刻と異なる場合があります。"
    : "Note: Countdown is for reference only and may differ from actual start times.";
});

// --- Lifecycle ---
onMounted(() => {
  if (process.client) {
    syncStateFromQuery();
    localStorage.setItem('olympicCountdownLang', lang.value);
    localStorage.setItem('olympicCountdownMode', mode.value);
    localStorage.setItem('olympicCountdownYear', currentYearKey.value);
    // URLの正規化を実行（createPathのクリーンアップ含む）
    updateQueryParams();
  }
  updateCountdown();
  timerId = setInterval(updateCountdown, 1000);
});

onUnmounted(() => {
  if (timerId) clearInterval(timerId);
});
</script>


<template>
  <div class="container">
    <h1>{{ lang === 'ja' ? 'オリンピック カウントダウン' : 'Olympic Countdown' }}</h1>
    <h2 id="eventTitle">{{ eventTitle }}</h2>

    <Controls 
      :mode="mode" 
      :lang="lang" 
      :config="CONFIG" 
      @setMode="setMode" 
      @toggleLang="toggleLang" 
    />

    <div class="year-selector">
      <select 
        id="year-select" 
        name="year" 
        :value="currentYearKey" 
        @change="changeYear" 
        aria-label="Year"
      >
        <option v-for="y in availableYears" :key="y.value" :value="y.value">
          {{ y.label }}
        </option>
      </select>
    </div>

    <CountdownDisplay
      :statusText="statusText" 
      :dayText="dayText" 
      :timeText="timeText" 
    />

    <div class="notice" aria-live="polite">{{ noticeText }}</div>

    <AppFooter :current-year="currentYearKey" />
  </div>
</template>

<style scoped>
.container {
  background: rgba(255, 255, 255, 0.08);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 2.5rem 2rem;
  max-width: 480px;
  width: 100%;
  box-shadow: 0 0 40px rgba(0, 229, 255, 0.3);
  text-align: center;
  position: relative;
}

h1 {
  font-family: Arial, sans-serif;
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(90deg, #33b5e5, #ffbb33, #ffffff, #99cc00, #ff4444);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 0 8px rgba(255, 255, 255, 0.3), 0 0 20px rgba(255, 255, 255, 0.2);
  margin-bottom: 0.5rem;
  line-height: 1.2;
}

h2 {
  font-family: Arial, sans-serif;
  font-size: 1.1rem;
  background: linear-gradient(90deg, #4fc3f7, #80deea);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  letter-spacing: 0.1em;
  margin-bottom: 2rem;
  font-weight: 400;
}

.year-selector {
  margin-bottom: 1.5rem;
}

select {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 229, 255, 0.3);
  border-radius: 12px;
  color: #fff;
  padding: 6px 12px;
  font-family: 'Roboto', sans-serif;
  font-size: 1rem;
  cursor: pointer;
  outline: none;
}

.notice {
  margin-top: 1rem;
  font-size: 0.85rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.78);
  text-align: left;
}

@media (max-width: 480px) {
  .container { padding: 2rem 1.5rem; }
  h1 { font-size: 2rem; }
}
</style>