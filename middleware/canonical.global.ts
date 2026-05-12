import { URL_SETTINGS } from "~/url-scheme.config.js";

const normalizeParam = (value: unknown): string => {
  const raw = Array.isArray(value) ? value[0] : value;
  return typeof raw === "string" ? raw.trim() : "";
};

const parseCreatePath = (value: string) => {
  const parts = value.split("/").filter(Boolean);
  return {
    year: parts.find((p) => /^\d{4}$/.test(p)) || "",
    lang: parts.find((p) => p === "ja" || p === "en") || "",
  };
};

export default defineNuxtRouteMiddleware((to) => {
  if (URL_SETTINGS.urlScheme !== "path") return;

  const year = normalizeParam(to.query.year);
  const langRaw = normalizeParam(to.query.lang);
  const cp =
    normalizeParam(to.query.createPath) ||
    normalizeParam(to.query.createpath) ||
    normalizeParam(to.query.clearPath) ||
    normalizeParam(to.query.clearpath);

  const fromCp = cp ? parseCreatePath(decodeURIComponent(cp)) : { year: "", lang: "" };
  const targetYear = year || fromCp.year;
  const targetLang = langRaw === "en" || langRaw === "ja" ? langRaw : fromCp.lang || "ja";

  if (!targetYear) return;

  const cleanedQuery = { ...to.query } as Record<string, unknown>;
  delete cleanedQuery.year;
  delete cleanedQuery.lang;
  delete cleanedQuery.createPath;
  delete cleanedQuery.createpath;
  delete cleanedQuery.clearPath;
  delete cleanedQuery.clearpath;

  const targetPath = `/${targetYear}/${targetLang}`;
  const noLegacy =
    !to.query.year &&
    !to.query.lang &&
    !to.query.createPath &&
    !to.query.createpath &&
    !to.query.clearPath &&
    !to.query.clearpath;

  if (to.path === targetPath && noLegacy) return;

  return navigateTo({ path: targetPath, query: cleanedQuery, hash: to.hash }, { replace: true, redirectCode: 301 });
});
