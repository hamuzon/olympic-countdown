const stripTrailingDotFromHost = (host) => {
  if (!host) return host;

  const portMatch = host.match(/:\d+$/);
  const port = portMatch ? portMatch[0] : "";
  const hostname = port ? host.slice(0, -port.length) : host;

  if (!hostname.endsWith(".")) return host;

  return `${hostname.slice(0, -1)}${port}`;
};

export async function onRequest(context) {
  const requestUrl = new URL(context.request.url);
  const host = context.request.headers.get("Host") || requestUrl.host;
  const canonicalHost = stripTrailingDotFromHost(host);

  if (canonicalHost !== host) {
    const canonicalUrl = new URL(context.request.url);
    canonicalUrl.host = canonicalHost;
    return Response.redirect(canonicalUrl.toString(), 301);
  }

  return context.next();
}
