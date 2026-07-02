import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import type { Card } from "../types";

const LABELS = [
  { color: "#ef4444", name: "red" },
  { color: "#f97316", name: "orange" },
  { color: "#eab308", name: "yellow" },
  { color: "#22c55e", name: "green" },
  { color: "#3b82f6", name: "blue" },
  { color: "#a855f7", name: "purple" },
];

interface Props {
  card: Card;
  onClose: () => void;
  onUpdate: (card: Card) => void;
  onDelete: (cardId: string) => void;
}

export function CardModal({ card, onClose, onUpdate, onDelete }: Props) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? "");
  const [label, setLabel] = useState<string | null>(card.label);
  const [dueDate, setDueDate] = useState(card.due_date ?? "");
  const [saving, setSaving] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") save();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const save = async () => {
    if (saving) return;
    const changed =
      title !== card.title ||
      description !== (card.description ?? "") ||
      label !== card.label ||
      (dueDate || null) !== card.due_date;
    if (!changed) { onClose(); return; }
    if (!title.trim()) return;
    setSaving(true);
    try {
      const updated = await api.updateCard(card.id, {
        title: title.trim(),
        description: description || null,
        label: label,
        due_date: dueDate || null,
      });
      onUpdate(updated);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this card?")) return;
    await api.deleteCard(card.id);
    onDelete(card.id);
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) save(); }}
    >
      <div className="modal">
        <div className="modal-header">
          <textarea
            className="modal-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            rows={2}
            autoFocus
          />
        </div>

        <div className="modal-section">
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description…"
            rows={4}
          />
        </div>

        <div className="modal-section">
          <label>Label</label>
          <div className="label-picker">
            <div
              className={`label-swatch-none ${label === null ? "selected" : ""}`}
              onClick={() => setLabel(null)}
              title="No label"
            >
              ✕
            </div>
            {LABELS.map((l) => (
              <div
                key={l.name}
                className={`label-swatch ${label === l.color ? "selected" : ""}`}
                style={{ background: l.color }}
                title={l.name}
                onClick={() => setLabel(l.color)}
              />
            ))}
          </div>
        </div>

        <div className="modal-section">
          <label>Due date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div className="modal-footer">
          <button className="btn btn-danger btn-sm" onClick={handleDelete}>
            Delete
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-sm" onClick={() => { onClose(); }}>
              Cancel
            </button>
            <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
