import { Link } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";

interface TopBarProps {
  boardName?: string;
}

export function TopBar({ boardName }: TopBarProps) {
  return (
    <header className="topbar">
      <Link to="/" className="topbar-logo">
        ▦ Kanban
      </Link>
      {boardName && (
        <>
          <span style={{ color: "var(--text-muted)" }}>/</span>
          <span style={{ fontWeight: 500, fontSize: "0.95rem" }}>{boardName}</span>
        </>
      )}
      <div className="topbar-spacer" />
      <ThemeToggle />
      <UserMenu />
    </header>
  );
}
