import { useState, useCallback, useEffect } from "react";

interface Favorite {
  label: string;
  path: string;
}

const STORAGE_KEY = "eagle-eye-favorites";
const CHANGE_EVENT = "eagle-eye-favorites-change";

function readFavorites(): Favorite[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function writeFavorites(favorites: Favorite[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>(readFavorites);

  // Listen for changes from other components
  useEffect(() => {
    const handler = () => setFavorites(readFavorites());
    window.addEventListener(CHANGE_EVENT, handler);
    return () => window.removeEventListener(CHANGE_EVENT, handler);
  }, []);

  const addFavorite = useCallback((label: string, browsePath: string) => {
    const current = readFavorites();
    if (!current.some((f) => f.path === browsePath)) {
      const updated = [...current, { label, path: browsePath }];
      writeFavorites(updated);
      setFavorites(updated);
    }
  }, []);

  const removeFavorite = useCallback((browsePath: string) => {
    const updated = readFavorites().filter((f) => f.path !== browsePath);
    writeFavorites(updated);
    setFavorites(updated);
  }, []);

  const isFavorite = useCallback(
    (browsePath: string) => favorites.some((f) => f.path === browsePath),
    [favorites]
  );

  return { favorites, addFavorite, removeFavorite, isFavorite };
}
