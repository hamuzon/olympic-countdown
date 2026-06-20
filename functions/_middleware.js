export async function onRequest(context) {
  const url = new URL(context.request.url);
  const host = context.request.headers.get("host") || url.hostname;
  const hostname = host.replace(/:\d+$/, "");

  if (hostname.endsWith(".")) {
    url.hostname = hostname.slice(0, -1);
    return Response.redirect(url.toString(), 301);
  }

  return context.next();
}