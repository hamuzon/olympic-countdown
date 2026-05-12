/**
 * Cloudflare Pages Function
 * Handles dynamic OGP injection based on URL path and query parameters.
 */

const parseCreatePath = (value) => {
  if (!value) return {};
  let decoded = value;
  try { decoded = decodeURIComponent(String(value)); } catch {}
  const parts = decoded.split('/').filter(Boolean);
  return {
    year: parts.find(p => /^\d{4}$/.test(p)),
    lang: parts.find(p => p === 'ja' || p === 'en')
  };
};

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const response = await env.ASSETS.fetch(request);

  // HTML以外、またはサブディレクトリ内のファイルなどはそのまま返す
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return response;
  
  // パスセグメントとクエリの解析
  const pathParts = url.pathname.split("/").filter(Boolean);
  const yearIdx = pathParts.findIndex(p => /^\d{4}$/.test(p));
  const isPathBased = yearIdx !== -1;

  // --- Data Definition (Synced with index.vue) ---
  const events = {
    summer: {
      2020: { ja: "東京", en: "Tokyo" },
      2024: { ja: "パリ", en: "Paris" },
      2028: { ja: "ロサンゼルス", en: "Los Angeles" },
      2032: { ja: "ブリスベン", en: "Brisbane" }
    },
    winter: {
      2022: { ja: "北京", en: "Beijing" },
      2026: { ja: "ミラノ・コルティナ", en: "Milan-Cortina" },
      2030: { ja: "フレンチアルプス", en: "French Alps" },
      2034: { ja: "ソルトレイクシティ", en: "Salt Lake City" }
    }
  };

  // --- Parsing Year and Language ---
  let year = url.searchParams.get("year");
  let lang = url.searchParams.get("lang");
  const qCP = url.searchParams.get("createPath") || url.searchParams.get("createpath") || url.searchParams.get("clearPath") || url.searchParams.get("clearpath");

  if (!year && qCP) {
    const fromCreatePath = parseCreatePath(qCP);
    if (fromCreatePath.year) year = fromCreatePath.year;
    if (!lang && fromCreatePath.lang) lang = fromCreatePath.lang;
  }

  // パス（/2024/en など）からの抽出
  if (!year && isPathBased) {
    year = pathParts[yearIdx];
    const potentialLang = pathParts[yearIdx + 1];
    if (!lang && (potentialLang === "ja" || potentialLang === "en")) lang = potentialLang;
  }

  // Defaults
  lang = (lang === "en" || lang === "ja") ? lang : "ja";
  if (!year) {
    const currentYear = new Date().getFullYear();
    const allYears = [...Object.keys(events.summer), ...Object.keys(events.winter)].sort((a, b) => a - b);
    year = allYears.find(y => parseInt(y) >= currentYear) || allYears[allYears.length - 1];
  }

  // Determine Mode and City
  const isWinter = !!events.winter[year];
  const mode = isWinter ? "winter" : "summer";
  const city = isWinter ? events.winter[year]?.[lang] : events.summer[year]?.[lang];

  if (!city) return response;

  // --- Meta Content Generation ---
  const season = lang === "ja" ? (mode === "summer" ? "夏季" : "冬季") : (mode === "summer" ? "Summer" : "Winter");
  const locale = lang === "ja" ? "ja_JP" : "en_US";

  const title = (lang === "ja")
    ? `${year} ${city} ${season}オリンピック カウントダウン`
    : `${year} ${city} ${season} Olympics Countdown`;

  const description = (lang === "ja")
    ? `${year} ${city} ${season}オリンピックまでのカウントダウンだよ！開催中・終了後の経過時間もリアルタイムで表示。`
    : `${year} ${city} ${season} Olympics countdown! Real-time timer for before, during, and after the Games.`;

  // OGP URL形式は env.OG_URL_SCHEME で切替可能 ('path' | 'query')
  const ogUrlScheme = (env.OG_URL_SCHEME || 'path').toLowerCase();
  const canonicalUrl = new URL(url.origin);
  if (ogUrlScheme === 'query') {
    canonicalUrl.pathname = url.pathname.split('/').filter(p => !/^\d{4}$/.test(p) && p !== 'ja' && p !== 'en').join('/') || '/';
    canonicalUrl.searchParams.set('year', year);
    canonicalUrl.searchParams.set('lang', lang);
  } else {
    canonicalUrl.pathname = `/${year}/${lang}`;
  }
  // --- HTML Rewriting ---
  return new HTMLRewriter()
    .on("title", { element(el) { el.setInnerContent(title); } })
    .on('meta[name="description"]', { element(el) { el.setAttribute("content", description); } })
    .on('meta[property="og:title"]', { element(el) { el.setAttribute("content", title); } })
    .on('meta[property="og:description"]', { element(el) { el.setAttribute("content", description); } })
    .on('meta[property="og:locale"]', { element(el) { el.setAttribute("content", locale); } })
    .on('meta[property="og:url"]', { element(el) { el.setAttribute("content", canonicalUrl); } })
    .on('meta[name="twitter:title"]', { element(el) { el.setAttribute("content", title); } })
    .on('meta[name="twitter:description"]', { element(el) { el.setAttribute("content", description); } })
    .on('meta[name="twitter:url"]', { element(el) { el.setAttribute("content", canonicalUrl); } })
    .transform(response);

}
