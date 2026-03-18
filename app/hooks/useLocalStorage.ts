import { useState, useEffect } from "react";

export function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    const saved = localStorage.getItem(key);
    if (saved !== null) {
      try {
        setValue(JSON.parse(saved));
      } catch {
        setValue(saved as unknown as T);
      }
    }
  }, [key]);

  const set = (newValue: T) => {
    setValue(newValue);
    localStorage.setItem(key, JSON.stringify(newValue));
  };

  return [value, set] as const;
}
