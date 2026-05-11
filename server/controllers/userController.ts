import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/session.js";
import * as userService from "../services/userService.js";
import { AppError } from "../middleware/errorHandler.js";

/**
 * POST /api/users
 * Create a guest user with a username. Returns user + session token.
 */
export async function createUser(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { username } = req.body;

  if (!username || typeof username !== "string" || username.trim().length < 2) {
    throw new AppError(
      "Username is required and must be at least 2 characters",
      400
    );
  }

  const cleanUsername = username.trim();

  if (cleanUsername.length > 20) {
    throw new AppError("Username must be 20 characters or less", 400);
  }

  // Only allow alphanumeric and underscores
  if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
    throw new AppError(
      "Username can only contain letters, numbers, and underscores",
      400
    );
  }

  const taken = await userService.isUsernameTaken(cleanUsername);
  if (taken) {
    throw new AppError("Username is already taken", 409);
  }

  const user = await userService.createGuestUser(cleanUsername);

  res.status(201).json({
    success: true,
    data: user,
  });
}

/**
 * GET /api/users/me
 * Get the current user's profile from their session token.
 * Requires session middleware.
 */
export async function getMe(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  // req.user is guaranteed by requireSession middleware
  res.json({
    success: true,
    data: req.user,
  });
}
