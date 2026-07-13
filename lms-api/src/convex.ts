import { ConvexHttpClient } from "convex/browser";
import { config } from "./config.js";
let client = null;
export function getConvexClient() {
  if (!client) {
    if (!config.convexUrl) throw new Error("CONVEX_URL is required");
    client = new ConvexHttpClient(config.convexUrl);
  }
  return client;
}
export async function convexQuery(fn, args = {}, authToken) {
  const c = getConvexClient();
  if (authToken) c.setAuth(authToken);
  try { return await c.query(fn, args); } finally { if (authToken) c.clearAuth(); }
}
export async function convexMutation(fn, args = {}, authToken) {
  const c = getConvexClient();
  if (authToken) c.setAuth(authToken);
  try { return await c.mutation(fn, args); } finally { if (authToken) c.clearAuth(); }
}