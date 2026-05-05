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

/**
 * 最も近い未来のイベント、または最新のイベントを特定するヘルパー
 */
const findNearestFutureEvent = () => {
  const now = Date.now();
  const allYears = [...Object.keys(eventsData.summer), ...Object.keys(eventsData.winter)]
    .filter(yr => eventsData.summer[yr] || eventsData.winter[yr])
    .sort((a, b) => Number(a) - Number(b));

  return allYears.find(yr => {
    const event = eventsData.summer[yr] || eventsData.winter[yr];
    return event && new Date(event.end).getTime() > now;
  }) || allYears[allYears.length - 1];
};

// --- Initialization Logic (Crucial for SEO/SSG) ---
/**
 * Helper to extract state from URL or fallback
 */
const getInitialState = () => {
  let qYear = route.query.year;
  let qLang = route.query.lang;
  const qCP = route.query.createPath;

  // createPathパラメータから情報を抽出（?createPath=/2028/en など）
  if (!qYear && qCP) {
    const parts = String(qCP).split('/').filter(Boolean);
    const yMatch = parts.find(p => /^\d{4}$/.test(p));
    if (yMatch) {
      qYear = yMatch;
      const lMatch = parts.find(p => p === 'ja' || p === 'en');
      if (lMatch && !qLang) qLang = lMatch;
    }
  }

  const cleanPath = route.path.replace(config.app.baseURL, '').replace(/^\//, '');
  const pathParts = cleanPath.split('/').filter(Boolean);
  
  if (!qYear && pathParts.length >= 1 && /^\d{4}$/.test(pathParts[0])) {
    qYear = pathParts[0]; // Example: /2024/en
    if (!qLang && pathParts.length >= 2) {
      qLang = pathParts[1];
    }
  }

  let finalLang = (qLang === 'en' || qLang === 'ja') ? qLang : 'ja';
  let finalYear = qYear;
  let finalMode = 'summer'; // Default mode, will be refined

  // Client-side: Prioritize localStorage if available and not overridden by URL
  // This ensures the initial render on the client reflects user's last choice,
  // reducing flicker if localStorage differs from URL/default.
  if (process.client) {
    const isReset = ["reset", "reboot", "restart"].some(k => 
      ["1", "on"].includes(String(route.query[k]).toLowerCase())
    );

    if (!isReset) {
      const storedLang = localStorage.getItem('olympicCountdownLang');
      if (storedLang && (storedLang === 'en' || storedLang === 'ja') && !qLang) {
        finalLang = storedLang; // localStorage overrides default lang if no URL lang
      }

      const storedMode = localStorage.getItem('olympicCountdownMode');
      const storedYear = localStorage.getItem('olympicCountdownYear');

      // If no year was found in URL (qYear is null), try localStorage year
      if (!qYear && storedYear && storedMode) {
        if (eventsData[storedMode] && eventsData[storedMode][storedYear]) {
          finalYear = storedYear;
          finalMode = storedMode; // Use stored mode if year is from localStorage
        }
      }
    }
  }

  // Determine mode based on finalYear, if it's already set (from URL or localStorage)
  if (finalYear) {
    if (eventsData.winter[finalYear]) {
      finalMode = 'winter';
    } else if (eventsData.summer[finalYear]) {
      finalMode = 'summer';
    } else {
      // If finalYear is invalid (e.g., from URL but not in eventsData), reset it
      finalYear = null;
    }
  }

  // If finalYear is still null (e.g., invalid URL year, no valid localStorage year, no URL year), find nearest future
  if (!finalYear) {
    finalYear = findNearestFutureEvent();
    // Determine mode for the auto-selected year
    if (eventsData.winter[finalYear]) {
      finalMode = 'winter';
    } else if (eventsData.summer[finalYear]) {
      finalMode = 'summer';
    }
  }

  return { lang: finalLang, mode: finalMode, year: finalYear };
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
watchEffect(() => {
  if (!currentYearKey.value || !eventsData[mode.value][currentYearKey.value]) return;
  
  const isJa = lang.value === "ja";
  const data = eventsData[mode.value][currentYearKey.value];
  const cityName = data.city[lang.value];
  const season = isJa ? (mode.value === "summer" ? "夏季" : "冬季") : (mode.value === "summer" ? "Summer" : "Winter");
  
  // Sync Title & Description
  const title = isJa
    ? `${currentYearKey.value} ${cityName} ${season}オリンピック カウントダウン`
    : `${currentYearKey.value} ${cityName} ${season} Olympics Countdown`;
  const description = isJa
    ? `${currentYearKey.value} ${cityName} ${season}オリンピックまでのカウントダウンだよ！開催中・終了後の経過時間もリアルタイムで表示。`
    : `${currentYearKey.value} ${cityName} ${season} Olympics countdown! Real-time timer for before, during, and after the Games.`;

  // URL Building
  const origin = typeof window !== 'undefined' 
    ? window.location.origin 
    : (process.env.GITHUB_REPOSITORY ? `https://${process.env.GITHUB_REPOSITORY.split('/')[0]}.github.io` : '');

  // Normalize canonical URL
  const baseWithSlash = config.app.baseURL.endsWith('/') ? config.app.baseURL : config.app.baseURL + '/';
  const fullBaseURL = (origin + baseWithSlash);
  const canonicalUrl = `${fullBaseURL}?year=${currentYearKey.value}&lang=${lang.value}`;
  
  /**
   * Sync Head with Reactive Meta
   */
  useHead({
    title: title,
    meta: [
      { key: 'description',         name: 'description',        content: description },
      { key: 'og:title',            property: 'og:title',       content: title },
      { key: 'og:description',      property: 'og:description', content: description },
      { key: 'og:url',              property: 'og:url',         content: canonicalUrl },
      { key: 'og:locale',           property: 'og:locale',      content: isJa ? 'ja_JP' : 'en_US' },
      { key: 'twitter:title',       name: 'twitter:title',      content: title },
      { key: 'twitter:description', name: 'twitter:description', content: description },
      { key: 'twitter:url',         name: 'twitter:url',        content: canonicalUrl }
    ]
  });
});

// --- Actions ---
function setMode(m) {
  if (m === 'summer' && !CONFIG.SUMMER_ENABLED) return;
  if (m === 'winter' && !CONFIG.WINTER_ENABLED) return;

  mode.value = m;
  autoSelectNearestInMode(m); // This will update currentYearKey.value

  if (import.meta.client) {
    localStorage.setItem('olympicCountdownMode', mode.value);
    localStorage.setItem('olympicCountdownYear', currentYearKey.value);
  }
  updateQueryParams();
}

function toggleLang() {
  lang.value = lang.value === "ja" ? "en" : "ja";
  if (import.meta.client) {
    localStorage.setItem('olympicCountdownLang', lang.value);
  }
  updateQueryParams();
}

function changeYear(event) {
  currentYearKey.value = event.target.value;
  if (import.meta.client) {
    localStorage.setItem('olympicCountdownYear', currentYearKey.value);
  }
  updateQueryParams();
}

function updateQueryParams() {
  const query = { ...route.query };
  if (currentYearKey.value) query.year = currentYearKey.value;
  query.lang = lang.value;
  router.replace({ query });
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
    label: `${y} ${eventsData[mode.value][y].city[lang.value]}`
  }));
});

const eventTitle = computed(() => {
  if (!currentYearKey.value) return 'Loading...';
  return `${currentYearKey.value} ${eventsData[mode.value][currentYearKey.value].city[lang.value]}`;
});

const noticeText = computed(() => {
  return lang.value === "ja"
    ? "※カウントダウンは目安であり、実際の開催時刻と異なる場合があります。"
    : "Note: Countdown is for reference only and may differ from actual start times.";
});

const footerHTML = computed(() => {
  const baseYear = 2025;
  const currentYear = new Date().getFullYear();
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  
  let yearStr = baseYear.toString();
  if (currentYear > baseYear) {
    yearStr = `${baseYear}–${currentYear}`;
  } else if (currentYear < baseYear) {
    yearStr = `${currentYear}–${baseYear}`;
  }
  
  if(hostname === "hamuzon.github.io"){
    return `&copy; ${yearStr} <a href="https://hamuzon.github.io" target="_blank">@hamuzon</a>`;
  } else if (hostname.includes("hamuzon-jp.f5.si")) {
    return `&copy; ${yearStr} <a href="https://hamuzon-jp.f5.si" target="_blank">@hamuzon</a>`;
  } else if(hostname.includes("hamusata.f5.si")){
    return `&copy; ${yearStr} <a href="https://hamusata.f5.si" target="_blank">@hamusata</a>`;
  } else {
    return `&copy; ${yearStr} Olympic Countdown (${currentYearKey.value || currentYear})`;
  }
});

// --- Lifecycle ---
onMounted(() => {
  // Save current state to localStorage on client-side
  // The initial state is now determined by getInitialState, which includes localStorage on client.
  if (import.meta.client) {
    localStorage.setItem('olympicCountdownLang', lang.value);
    localStorage.setItem('olympicCountdownMode', mode.value);
    localStorage.setItem('olympicCountdownYear', currentYearKey.value);
  }
  updateQueryParams();
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
      <select :value="currentYearKey" @change="changeYear" aria-label="Year">
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

    <div class="footer" v-html="footerHTML"></div>
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
