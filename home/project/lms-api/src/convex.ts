import { ConvexHttpClient } from "convex/browser";
import { config } from "./config.js";

let client: ConvexHttpClient | null = null;

/** Get or create a singleton Convex HTTP client */
export function getConvexClient(): ConvexHttpClient {
  if (!client) {
    if (!config.convexUrl) {
      throw new Error(
        "CONVEX_URL environment variable is required. " +
        "Get it from your Convex dashboard or convex.json"
      );
    }
    client = new ConvexHttpClient(config.convexUrl);
  }
  return client;
}

/** Helper: call a Convex query with optional auth */
export async function convexQuery<T>(
  functionPath: string,
  args: Record<string, unknown> = {},
  authToken?: string
): Promise<T> {
  const client = getConvexClient();
  if (authToken) {
    client.setAuth(authToken);
  }
  try {
    const result = await client.query(functionPath as any, args);
    return result as T;
  } finally {
    if (authToken) {
      client.clearAuth();
    }
  }
}

/** Helper: call a Convex mutation with optional auth */
export async function convexMutation<T>(
  functionPath: string,
  args: Record<string, unknown> = {},
  authToken?: string
): Promise<T> {
  const client = getConvexClient();
  if (authToken) {
    client.setAuth(authToken);
  }
  try {
    const result = await client.mutation(functionPath as any, args);
    return result as T;
  } finally {
    if (authToken) {
      client.clearAuth();
    }
  }
}
