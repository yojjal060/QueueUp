import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { createGuestUser, getCurrentUser } from "../services/api";
import type { UserSession } from "../types/api";
import { SessionContext } from "./session-context";

const STORAGE_KEY = "queueup.session";

function readStoredSession() {
  const rawSession = window.localStorage.getItem(STORAGE_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession) as UserSession;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [storedSession] = useState<UserSession | null>(() => readStoredSession());
  const [session, setSession] = useState<UserSession | null>(storedSession);
  const [isHydrating, setIsHydrating] = useState(() => storedSession !== null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!storedSession) {
      return;
    }

    void getCurrentUser(storedSession.sessionToken)
      .then((freshSession) => {
        setSession(freshSession);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(freshSession));
      })
      .catch(() => {
        window.localStorage.removeItem(STORAGE_KEY);
        setSession(null);
      })
      .finally(() => {
        setIsHydrating(false);
      });
  }, [storedSession]);

  const createSession = useCallback(async (username: string) => {
    setIsCreating(true);
    setError(null);

    try {
      const createdSession = await createGuestUser(username);
      setSession(createdSession);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(createdSession));
      return createdSession;
    } catch (createError) {
      const message =
        createError instanceof Error
          ? createError.message
          : "Could not create guest session.";
      setError(message);
      throw createError;
    } finally {
      setIsCreating(false);
    }
  }, []);

  const clearSession = useCallback(() => {
    setSession(null);
    setError(null);
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({
      session,
      isHydrating,
      isCreating,
      error,
      createSession,
      clearSession,
    }),
    [clearSession, createSession, error, isCreating, isHydrating, session]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
