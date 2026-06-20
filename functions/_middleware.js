export async function onRequest(context) {
  const requestUrl = new URL(context.request.url);
  const host = context.request.headers.get("Host") || requestUrl.host;

  if (host.endsWith(".")) {
    const canonicalUrl = new URL(context.request.url);
    canonicalUrl.host = host.slice(0, -1);
    return Response.redirect(canonicalUrl.toString(), 301);
  }

  return context.next();
}
