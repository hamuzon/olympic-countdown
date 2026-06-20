const TRAILING_DOTS_BEFORE_OPTIONAL_PORT = /\.+(?=(:\d+)?$)/;

export const stripTrailingDotsFromHost = (host) => {
  if (!host) return host;

  return host.replace(TRAILING_DOTS_BEFORE_OPTIONAL_PORT, "");
};

export const redirectTrailingDotHost = (request) => {
  const requestUrl = new URL(request.url);
  const host = request.headers.get("Host") || requestUrl.host;
  const canonicalHost = stripTrailingDotsFromHost(host);

  if (canonicalHost === host) return null;

  const canonicalUrl = new URL(request.url);
  canonicalUrl.host = canonicalHost;
  return Response.redirect(canonicalUrl.toString(), 301);
};
