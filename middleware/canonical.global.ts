import { URL_SETTINGS } from "~/url-scheme.config.js";

const normalizeParam = (value: unknown): string => {
  const raw = Array.isArray(value) ? value[0] : value;
  return typeof raw === "string" ? raw.trim() : "";
};

const parseCreatePath = (value: string) => {
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    decoded = value;
  }
  const parts = decoded.split("/").filter(Boolean);
  return {
    year: parts.find((p) => /^\d{4}$/.test(p)) || "",
    lang: parts.find((p) => p === "ja" || p === "en") || "",
  };
};

const buildCanonicalPath = (baseURL: string, year: string, lang: string) => {
  const normalizedBase = baseURL.endsWith("/") ? baseURL.slice(0, -1) : baseURL;
  const basePrefix = normalizedBase && normalizedBase !== "/" ? normalizedBase : "";
  return `${basePrefix}/${year}/${lang}`;
};

export default defineNuxtRouteMiddleware((to) => {
  if (URL_SETTINGS.urlScheme !== "path") return;

  const runtimeConfig = useRuntimeConfig();
  const baseURL = String(runtimeConfig.app?.baseURL || "/");

  const cp =
    normalizeParam(to.query.createPath) ||
    normalizeParam(to.query.createpath) ||
    normalizeParam(to.query.clearPath) ||
    normalizeParam(to.query.clearpath);
  const fromCp = cp ? parseCreatePath(cp) : { year: "", lang: "" };

  const yearFromQuery = normalizeParam(to.query.year);
  const langFromQuery = normalizeParam(to.query.lang);

  // createPath を優先し、無い場合のみ year/lang クエリを使う
  const targetYear = fromCp.year || yearFromQuery;
  const rawTargetLang = fromCp.lang || langFromQuery;
  const targetLang = rawTargetLang === "en" || rawTargetLang === "ja" ? rawTargetLang : "ja";

  if (!targetYear) return;

  const cleanedQuery = { ...to.query } as Record<string, unknown>;
  delete cleanedQuery.year;
  delete cleanedQuery.lang;
  delete cleanedQuery.createPath;
  delete cleanedQuery.createpath;
  delete cleanedQuery.clearPath;
  delete cleanedQuery.clearpath;

  const targetPath = buildCanonicalPath(baseURL, targetYear, targetLang);

  const hasLegacyHints = Boolean(
    to.query.year ||
      to.query.lang ||
      to.query.createPath ||
      to.query.createpath ||
      to.query.clearPath ||
      to.query.clearpath,
  );

  if (to.path === targetPath && !hasLegacyHints) return;

  return navigateTo(
    { path: targetPath, query: cleanedQuery, hash: to.hash },
    { replace: true, redirectCode: 301 },
  );
});
