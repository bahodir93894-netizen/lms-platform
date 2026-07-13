export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  convexUrl: process.env.CONVEX_URL || "",
  jwtSecret: process.env.JWT_SECRET || "",
  corsOrigins: process.env.CORS_ORIGINS?.split(",") || ["http://localhost:5173"],
  apiPrefix: process.env.API_PREFIX || "/api",
} as const;