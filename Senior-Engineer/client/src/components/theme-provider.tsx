import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
  setTheme: () => {},
});

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  let actual: "light" | "dark" = "dark";
  if (theme === "system") {
    actual = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } else {
    actual = theme;
  }
  if (actual === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  return actual;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";
    const stored = localStorage.getItem("ojtask-theme") as Theme | null;
    const resolved: Theme = (stored && ["light", "dark", "system"].includes(stored)) ? stored : "dark";
    applyTheme(resolved);
    return resolved;
  });

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem("ojtask-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (theme !== "system" || typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handle = () => setThemeState(t => t);
    mq.addEventListener("change", handle);
    return () => mq.removeEventListener("change", handle);
  }, [theme]);

  const toggleTheme = () => setThemeState(t => t === "light" ? "dark" : "light");
  const setTheme = (newTheme: Theme) => setThemeState(newTheme);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
