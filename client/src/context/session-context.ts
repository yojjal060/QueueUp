import { createContext } from "react";
import type { UserSession } from "../types/api";

export interface SessionContextValue {
  session: UserSession | null;
  isHydrating: boolean;
  isCreating: boolean;
  error: string | null;
  createSession: (username: string) => Promise<UserSession>;
  clearSession: () => void;
}

export const SessionContext = createContext<SessionContextValue | null>(null);
