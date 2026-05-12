import { useCallback, useEffect, useState } from "react";
import { FALLBACK_GAME_LIST } from "../constants/games";
import { getSupportedGames } from "../services/api";
import type { GameConfig } from "../types/api";

export function useGames() {
  const [games, setGames] = useState<GameConfig[]>(FALLBACK_GAME_LIST);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGames = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      setError(null);
      const data = await getSupportedGames();
      setGames(Object.values(data));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load supported games."
      );
      setGames(FALLBACK_GAME_LIST);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function primeGames() {
      try {
        const data = await getSupportedGames();

        if (!isCancelled) {
          setGames(Object.values(data));
          setError(null);
        }
      } catch (loadError) {
        if (!isCancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load supported games."
          );
          setGames(FALLBACK_GAME_LIST);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void primeGames();

    return () => {
      isCancelled = true;
    };
  }, []);

  return {
    games,
    isLoading,
    error,
    reload: () => void loadGames(),
  };
}
