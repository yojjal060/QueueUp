import type { Request, Response, NextFunction } from "express";

export interface AppErrorDetails {
  [key: string]: unknown;
}

interface AppErrorOptions {
  code?: string;
  details?: AppErrorDetails;
}

export interface ErrorResponseBody {
  error: string;
  message: string;
  details?: AppErrorDetails;
}

/**
 * Custom error class with HTTP status code.
 */
export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: AppErrorDetails;

  constructor(
    message: string,
    statusCode: number = 400,
    options: AppErrorOptions = {}
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = options.code ?? "AppError";
    this.details = options.details;
    this.name = "AppError";
  }
}

function buildErrorResponse(
  error: string,
  message: string,
  statusCode: number,
  details?: AppErrorDetails
): { statusCode: number; body: ErrorResponseBody } {
  return {
    statusCode,
    body: {
      error,
      message,
      ...(details ? { details } : {}),
    },
  };
}

export function normalizeError(
  err: unknown
): { statusCode: number; body: ErrorResponseBody } {
  if (err instanceof AppError) {
    return buildErrorResponse(err.code, err.message, err.statusCode, err.details);
  }

  if (
    typeof err === "object" &&
    err !== null &&
    "name" in err &&
    err.name === "PrismaClientKnownRequestError"
  ) {
    const prismaErr = err as Error & { code?: string };

    if (prismaErr.code === "P2002") {
      return buildErrorResponse(
        "Conflict",
        "A record with that value already exists.",
        409
      );
    }

    if (prismaErr.code === "P2025") {
      return buildErrorResponse(
        "NotFound",
        "The requested record was not found.",
        404
      );
    }
  }

  const message =
    process.env.NODE_ENV === "production"
      ? "An unexpected error occurred."
      : err instanceof Error
        ? err.message
        : "An unexpected error occurred.";

  return buildErrorResponse("InternalServerError", message, 500);
}

export function toSocketErrorPayload(err: unknown): {
  code: string;
  message: string;
  details?: AppErrorDetails;
} {
  const normalized = normalizeError(err);
  return {
    code: normalized.body.error,
    message: normalized.body.message,
    ...(normalized.body.details ? { details: normalized.body.details } : {}),
  };
}

/**
 * Global error handler middleware.
 * Catches all errors thrown in route handlers and returns a consistent JSON response.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const normalized = normalizeError(err);

  if (normalized.statusCode >= 500) {
    console.error(`[ERROR] ${err.name}: ${err.message}`);
  }

  res.status(normalized.statusCode).json(normalized.body);
}
