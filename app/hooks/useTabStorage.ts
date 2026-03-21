import { useState, useEffect } from "react";

export function useTabStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    const sessionSaved = sessionStorage.getItem(key);
    if (sessionSaved !== null) {
      try {
        setValue(JSON.parse(sessionSaved));
        return;
      } catch {
        setValue(sessionSaved as unknown as T);
        return;
      }
    }

    const localSaved = localStorage.getItem(key);
    if (localSaved !== null) {
      try {
        setValue(JSON.parse(localSaved));
        sessionStorage.setItem(key, localSaved);
      } catch {
        setValue(localSaved as unknown as T);
        sessionStorage.setItem(key, localSaved);
      }
    }
  }, [key]);

  const set = (newValue: T) => {
    setValue(newValue);
    const stringified = JSON.stringify(newValue);
    sessionStorage.setItem(key, stringified);
    localStorage.setItem(key, stringified);
  };

  return [value, set] as const;
}
