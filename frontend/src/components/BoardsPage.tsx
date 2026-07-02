import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import type { Board } from "../types";
import { TopBar } from "./TopBar";
import { useToast } from "./Toast";

export function BoardsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [boards, setBoards] = useState<Board[]>([]);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api.listBoards().then(setBoards).catch(() => showToast("Failed to load boards", "error"));
  }, [showToast]);

  const createBoard = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const board = await api.createBoard(newName.trim());
      setBoards((prev) => [...prev, board]);
      setNewName("");
      navigate(`/boards/${board.id}`);
    } catch {
      showToast("Failed to create board", "error");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <TopBar />
      <div className="boards-page">
        <h2>My Boards</h2>
        <form className="new-board-form" onSubmit={createBoard}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New board name…"
          />
          <button className="btn btn-primary" type="submit" disabled={creating}>
            + Create
          </button>
        </form>
        <div className="boards-grid">
          {boards.map((b) => (
            <div key={b.id} className="board-card" onClick={() => navigate(`/boards/${b.id}`)}>
              <h3>{b.name}</h3>
              <div className="board-card-meta">
                {new Date(b.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
          {boards.length === 0 && (
            <div className="board-card-meta" style={{ padding: 0 }}>
              No boards yet. Create one above!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
