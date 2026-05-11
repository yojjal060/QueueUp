import type { Request, Response, NextFunction } from "express";
import { prisma } from "../libs/prisma.js";

/**
 * Extends Express Request to include the authenticated user.
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    sessionToken: string;
    avatar: string | null;
  };
}

/**
 * Session middleware — extracts user from `x-session-token` header.
 * Attaches `req.user` if valid, otherwise passes through (some routes are public).
 */
export async function sessionMiddleware(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const token = req.headers["x-session-token"] as string | undefined;

  if (token) {
    try {
      const user = await prisma.user.findUnique({
        where: { sessionToken: token },
        select: {
          id: true,
          username: true,
          sessionToken: true,
          avatar: true,
        },
      });

      if (user) {
        req.user = user;
      }
    } catch {
      // Token invalid or DB error — treat as unauthenticated
    }
  }

  next();
}

/**
 * Guard middleware — requires a valid session. Use after sessionMiddleware.
 * Returns 401 if no user is attached to the request.
 */
export function requireSession(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Please create a guest session first (POST /api/users)",
    });
    return;
  }
  next();
}
