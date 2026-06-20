import { redirectTrailingDotHost } from "./host.js";

export async function onRequest(context) {
  const redirect = redirectTrailingDotHost(context.request);
  if (redirect) return redirect;

  return context.next();
}
