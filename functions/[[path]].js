import { URL_SETTINGS } from "../url-scheme.config.js";

const parseCreatePath = (value) => {
  if (!value) return {};

  let decoded = value;

  try {
    decoded = decodeURIComponent(String(value));
  } catch {}

  const parts = decoded.split("/").filter(Boolean);

  return {
    year: parts.find((p) => /^\d{4}$/.test(p)),
    lang: parts.find((p) => p === "ja" || p === "en"),
  };
};

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const host = request.headers.get("host") || url.hostname;

  if (host.endsWith(".")) {
    const redirectUrl = new URL(request.url);
    redirectUrl.hostname = host.slice(0, -1);

    return Response.redirect(redirectUrl.toString(), 301);
  }

  const response = await env.ASSETS.fetch(request);

  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("text/html")) {
    return response;
  }

  const pathParts = url.pathname.split("/").filter(Boolean);
  const yearIdx = pathParts.findIndex((p) => /^\d{4}$/.test(p));
  const isPathBased = yearIdx !== -1;

  const events = {
    summer: {
      2020: { ja: "東京", en: "Tokyo" },
      2024: { ja: "パリ", en: "Paris" },
      2028: { ja: "ロサンゼルス", en: "Los Angeles" },
      2032: { ja: "ブリスベン", en: "Brisbane" },
    },
    winter: {
      2022: { ja: "北京", en: "Beijing" },
      2026: { ja: "ミラノ・コルティナ", en: "Milan-Cortina" },
      2030: { ja: "フレンチアルプス", en: "French Alps" },
      2034: { ja: "ソルトレイクシティ", en: "Salt Lake City" },
    },
  };

  let year = url.searchParams.get("year");
  let lang = url.searchParams.get("lang");

  const qCP =
    url.searchParams.get("createPath") ||
    url.searchParams.get("createpath") ||
    url.searchParams.get("clearPath") ||
    url.searchParams.get("clearpath");

  if (!year && qCP) {
    const fromCreatePath = parseCreatePath(qCP);

    if (fromCreatePath.year) {
      year = fromCreatePath.year;
    }

    if (!lang && fromCreatePath.lang) {
      lang = fromCreatePath.lang;
    }
  }

  if (!year && isPathBased) {
    year = pathParts[yearIdx];

    const potentialLang = pathParts[yearIdx + 1];

    if (!lang && (potentialLang === "ja" || potentialLang === "en")) {
      lang = potentialLang;
    }
  }

  lang = lang === "ja" || lang === "en" ? lang : "ja";

  if (!year) {
    const currentYear = new Date().getFullYear();

    const allYears = [
      ...Object.keys(events.summer),
      ...Object.keys(events.winter),
    ].sort((a, b) => Number(a) - Number(b));

    year =
      allYears.find((y) => Number(y) >= currentYear) ||
      allYears[allYears.length - 1];
  }

  const isWinter = Boolean(events.winter[year]);
  const mode = isWinter ? "winter" : "summer";

  const city = isWinter
    ? events.winter[year]?.[lang]
    : events.summer[year]?.[lang];

  if (!city) {
    return response;
  }

  const canonicalRedirectUrl = new URL(url.origin);

  if ((URL_SETTINGS.urlScheme || "path") === "query") {
    canonicalRedirectUrl.pathname = "/";
    canonicalRedirectUrl.searchParams.set("year", year);
    canonicalRedirectUrl.searchParams.set("lang", lang);
  } else {
    canonicalRedirectUrl.pathname = `/${year}/${lang}`;
  }

  const isLegacyCreatePath = Boolean(qCP);

  const hasLegacyQueryYearLang = Boolean(
    url.searchParams.get("year") ||
      url.searchParams.get("lang"),
  );

  const shouldRedirectToCanonical =
    isLegacyCreatePath || hasLegacyQueryYearLang;

  if (
    shouldRedirectToCanonical &&
    `${url.pathname}${url.search}` !==
      `${canonicalRedirectUrl.pathname}${canonicalRedirectUrl.search}`
  ) {
    return Response.redirect(canonicalRedirectUrl.toString(), 301);
  }

  const season =
    lang === "ja"
      ? mode === "summer"
        ? "夏季"
        : "冬季"
      : mode === "summer"
        ? "Summer"
        : "Winter";

  const locale = lang === "ja" ? "ja_JP" : "en_US";

  const title =
    lang === "ja"
      ? `${year} ${city} ${season}オリンピック カウントダウン`
      : `${year} ${city} ${season} Olympics Countdown`;

  const description =
    lang === "ja"
      ? `${year} ${city} ${season}オリンピックまでのカウントダウンだよ！開催中・終了後の経過時間もリアルタイムで表示。`
      : `${year} ${city} ${season} Olympics countdown! Real-time timer for before, during, and after the Games.`;

  const ogUrlScheme = (
    env.OG_URL_SCHEME ||
    URL_SETTINGS.ogUrlScheme ||
    URL_SETTINGS.urlScheme ||
    "path"
  ).toLowerCase();

  const canonicalUrl = new URL(url.origin);

  if (ogUrlScheme === "query") {
    canonicalUrl.pathname =
      url.pathname
        .split("/")
        .filter(
          (p) =>
            !/^\d{4}$/.test(p) &&
            p !== "ja" &&
            p !== "en",
        )
        .join("/") || "/";

    canonicalUrl.searchParams.set("year", year);
    canonicalUrl.searchParams.set("lang", lang);
  } else {
    canonicalUrl.pathname = `/${year}/${lang}`;
  }

  return new HTMLRewriter()
    .on("title", {
      element(el) {
        el.setInnerContent(title);
      },
    })
    .on('meta[name="description"]', {
      element(el) {
        el.setAttribute("content", description);
      },
    })
    .on('meta[property="og:title"]', {
      element(el) {
        el.setAttribute("content", title);
      },
    })
    .on('meta[property="og:description"]', {
      element(el) {
        el.setAttribute("content", description);
      },
    })
    .on('meta[property="og:locale"]', {
      element(el) {
        el.setAttribute("content", locale);
      },
    })
    .on('meta[property="og:url"]', {
      element(el) {
        el.setAttribute("content", canonicalUrl.toString());
      },
    })
    .on('meta[name="twitter:title"]', {
      element(el) {
        el.setAttribute("content", title);
      },
    })
    .on('meta[name="twitter:description"]', {
      element(el) {
        el.setAttribute("content", description);
      },
    })
    .on('meta[name="twitter:url"]', {
      element(el) {
        el.setAttribute("content", canonicalUrl.toString());
      },
    })
    .transform(response);
}