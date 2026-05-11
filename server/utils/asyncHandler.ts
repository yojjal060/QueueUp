import type { Request, Response, NextFunction } from "express";

/**
 * Wraps an async Express handler to catch errors and pass them to the error handler.
 * Express 5 supports async handlers natively, but this provides an extra safety net.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void> | void
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
