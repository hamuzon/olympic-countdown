const OLYMPIC_YEARS = new Set([
  "2020",
  "2022",
  "2024",
  "2026",
  "2028",
  "2030",
  "2032",
  "2034",
]);

const normalizeParam = (value) => {
  const raw = Array.isArray(value) ? value[0] : value;
  return typeof raw === "string" ? raw.trim() : "";
};

const parseCreatePath = (value) => {
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {}

  const parts = decoded.split("/").filter(Boolean);
  return {
    year: parts.find((part) => OLYMPIC_YEARS.has(part)) || "",
    lang: parts.find((part) => part === "ja" || part === "en") || "",
  };
};

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const host = context.request.headers.get("host") || url.hostname;
  const hostname = host.replace(/:\d+$/, "");

  if (hostname.endsWith(".")) {
    url.hostname = hostname.slice(0, -1);
    return Response.redirect(url.toString(), 301);
  }

  const createPath =
    url.searchParams.get("createPath") ||
    url.searchParams.get("createpath") ||
    url.searchParams.get("clearPath") ||
    url.searchParams.get("clearpath");
  const fromCreatePath = createPath ? parseCreatePath(createPath) : {};
  const year = fromCreatePath.year || normalizeParam(url.searchParams.get("year"));
  const langValue = fromCreatePath.lang || normalizeParam(url.searchParams.get("lang"));
  const lang = langValue === "en" || langValue === "ja" ? langValue : "ja";

  if (OLYMPIC_YEARS.has(year)) {
    const pathParts = url.pathname.split("/").filter(Boolean);
    const hasCanonicalPath = pathParts.includes(year) && pathParts.includes(lang);
    if (!hasCanonicalPath) {
      const redirectUrl = new URL(url);
      redirectUrl.pathname = `/${year}/${lang}`;
      redirectUrl.searchParams.delete("year");
      redirectUrl.searchParams.delete("lang");
      redirectUrl.searchParams.delete("createPath");
      redirectUrl.searchParams.delete("createpath");
      redirectUrl.searchParams.delete("clearPath");
      redirectUrl.searchParams.delete("clearpath");
      return Response.redirect(redirectUrl.toString(), 301);
    }
  }

  return context.next();
}