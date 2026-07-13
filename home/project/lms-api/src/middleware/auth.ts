import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";

/** JWT payload from Convex */
export interface AuthPayload {
  sub?: string;
  iss?: string;
  aud?: string;
  exp?: number;
  iat?: number;
  /** User's Convex token identifier */
  sid?: string;
}

/** Extend Express Request with auth info */
declare global {
  namespace Express {
    interface Request {
      /** The authenticated user's token */
      authToken?: string;
      /** Decoded JWT payload */
      authPayload?: AuthPayload;
      /** User ID from Convex */
      userId?: string;
    }
  }
}

/**
 * Optional auth middleware.
 * Extracts the Convex auth token if present but doesn't require it.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    next();
    return;
  }

  const token = authHeader.slice(7);
  req.authToken = token;

  // Try to decode JWT (Convex tokens are JWTs)
  try {
    const decoded = jwt.decode(token) as AuthPayload | null;
    if (decoded) {
      req.authPayload = decoded;
      req.userId = decoded.sub;
    }
  } catch {
    // Token not decodable as JWT, still pass it to Convex
  }

  next();
}

/**
 * Required auth middleware.
 * Requires a valid Convex auth token in the Authorization header.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Authorization header with Bearer token is required",
    });
    return;
  }

  const token = authHeader.slice(7);
  req.authToken = token;

  try {
    const decoded = jwt.decode(token) as AuthPayload | null;
    if (decoded) {
      req.authPayload = decoded;
      req.userId = decoded.sub;
    }
  } catch {
    // Continue anyway - Convex will validate the token server-side
  }

  next();
}
