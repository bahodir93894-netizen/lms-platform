import { Request, Response, NextFunction } from "express";

/** Application error with HTTP status */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

/** Global error handler middleware */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error("[ERROR]", err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.name,
      message: err.message,
      details: err.details,
    });
    return;
  }

  // Convex errors often come as regular Error with a message
  if (err.message?.includes("Not authenticated")) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Authentication required",
    });
    return;
  }

  if (err.message?.includes("Not authorized")) {
    res.status(403).json({
      error: "Forbidden",
      message: "You do not have permission to perform this action",
    });
    return;
  }

  if (err.message?.includes("Not found")) {
    res.status(404).json({
      error: "Not Found",
      message: err.message,
    });
    return;
  }

  // Generic server error
  res.status(500).json({
    error: "Internal Server Error",
    message:
      process.env.NODE_ENV === "production"
        ? "An unexpected error occurred"
        : err.message,
  });
}

/** 404 handler for unknown routes */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    error: "Not Found",
    message: "The requested endpoint does not exist",
  });
}
