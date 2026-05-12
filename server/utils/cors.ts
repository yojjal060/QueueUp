import type { CorsOptions } from "cors";

const DEFAULT_CLIENT_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
];

export function getAllowedClientOrigins() {
  const configuredOrigins =
    process.env.CLIENT_URL?.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean) ?? [];

  return Array.from(new Set([...configuredOrigins, ...DEFAULT_CLIENT_ORIGINS]));
}

export function isAllowedClientOrigin(origin?: string) {
  if (!origin) {
    return true;
  }

  return getAllowedClientOrigins().includes(origin);
}

export const corsOrigin: CorsOptions["origin"] = (origin, callback) => {
  if (isAllowedClientOrigin(origin)) {
    callback(null, true);
    return;
  }

  callback(new Error(`Origin ${origin} is not allowed by CORS`));
};
