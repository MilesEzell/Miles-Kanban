import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "../api";
import type { User } from "../types";

type ThemeChoice = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: ThemeChoice;
  setTheme: (t: ThemeChoice) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveTheme(choice: ThemeChoice): "light" | "dark" {
  if (choice === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return choice;
}

export function ThemeProvider({
  user,
  children,
}: {
  user: User | null;
  children: ReactNode;
}) {
  const stored = (localStorage.getItem("theme") as ThemeChoice | null) ?? "system";
  const [theme, setThemeState] = useState<ThemeChoice>(
    (user?.theme as ThemeChoice) ?? stored
  );

  useEffect(() => {
    if (user?.theme) {
      setThemeState(user.theme as ThemeChoice);
    }
  }, [user?.theme]);

  useEffect(() => {
    const resolved = resolveTheme(theme);
    document.documentElement.setAttribute("data-theme", resolved);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Follow OS changes when in "system" mode
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (theme === "system") {
        document.documentElement.setAttribute(
          "data-theme",
          mq.matches ? "dark" : "light"
        );
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = async (t: ThemeChoice) => {
    setThemeState(t);
    if (user) {
      await api.updateMe({ theme: t });
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
