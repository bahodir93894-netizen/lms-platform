/** Application configuration from environment variables */
export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  nodeEnv: process.env.NODE_ENV || "development",

  /** Convex deployment URL (from convex.json or dashboard) */
  convexUrl: process.env.CONVEX_URL || "",

  /** JWT secret for Convex auth verification */
  jwtSecret: process.env.JWT_SECRET || "",

  /** CORS allowed origins */
  corsOrigins: process.env.CORS_ORIGINS?.split(",") || ["http://localhost:5173"],

  /** API prefix */
  apiPrefix: process.env.API_PREFIX || "/api",
} as const;
