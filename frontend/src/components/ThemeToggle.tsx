import { useEffect, useRef, useState } from "react";
import { useTheme } from "../context/ThemeContext";

const OPTIONS = [
  { value: "light" as const, label: "Light", icon: "☀️" },
  { value: "dark" as const, label: "Dark", icon: "🌙" },
  { value: "system" as const, label: "System", icon: "💻" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = OPTIONS.find((o) => o.value === theme);

  return (
    <div className="theme-btn" ref={ref}>
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => setOpen((p) => !p)}
        title="Toggle theme"
      >
        {current?.icon} {current?.label}
      </button>
      {open && (
        <div className="theme-dropdown">
          {OPTIONS.map((opt) => (
            <div
              key={opt.value}
              className={`theme-option ${theme === opt.value ? "active" : ""}`}
              onClick={() => {
                setTheme(opt.value);
                setOpen(false);
              }}
            >
              <span>{opt.icon}</span> {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
