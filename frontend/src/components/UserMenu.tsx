import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
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

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="user-menu-wrap" ref={ref}>
      <button className="btn btn-ghost btn-sm" onClick={() => setOpen((p) => !p)}>
        👤 {user?.username}
      </button>
      {open && (
        <div className="user-dropdown">
          <div className="username-label">{user?.username}</div>
          <div className="user-dropdown-divider" />
          <div
            className="user-dropdown-item danger"
            onClick={handleLogout}
          >
            Sign out
          </div>
        </div>
      )}
    </div>
  );
}
