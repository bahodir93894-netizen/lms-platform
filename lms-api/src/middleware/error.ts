export class AppError extends Error {
  constructor(statusCode, message, details) { super(message); this.statusCode = statusCode; this.details = details; }
}
export function errorHandler(err, _req, res, _next) {
  console.error("[ERROR]", err);
  if (err instanceof AppError) return res.status(err.statusCode).json({ error: err.name, message: err.message });
  if (err.message?.includes("Not authenticated")) return res.status(401).json({ error: "Unauthorized" });
  if (err.message?.includes("Not authorized")) return res.status(403).json({ error: "Forbidden" });
  res.status(500).json({ error: "Internal Error", message: process.env.NODE_ENV === "production" ? "Server error" : err.message });
}
export function notFoundHandler(_req, res) { res.status(404).json({ error: "Not Found" }); }