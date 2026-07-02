import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import { KanbanCard } from "./KanbanCard";
import { api } from "../api";
import type { Card, Column } from "../types";

interface Props {
  column: Column;
  locked: boolean;
  onCardClick: (card: Card) => void;
  onCardAdd: (columnId: string, card: Card) => void;
  onColumnRename: (columnId: string, name: string) => void;
  onColumnDelete: (columnId: string) => void;
  onToggleLock: (columnId: string) => void;
}

export function KanbanColumn({ column, locked, onCardClick, onCardAdd, onColumnRename, onColumnDelete, onToggleLock }: Props) {
  const [addingCard, setAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [editingName, setEditingName] = useState(column.name);
  const [submitting, setSubmitting] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const { attributes, listeners, setNodeRef: setSortableRef, transform, transition, isDragging } =
    useSortable({ id: column.id, data: { type: "column" }, disabled: locked });

  const { setNodeRef: setDropRef } = useDroppable({ id: `col-${column.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const submitCard = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!newCardTitle.trim() || submitting) return;
    setSubmitting(true);
    try {
      const card = await api.createCard(column.id, { title: newCardTitle.trim() });
      onCardAdd(column.id, card);
      setNewCardTitle("");
      setAddingCard(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCardKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitCard();
    }
    if (e.key === "Escape") {
      setAddingCard(false);
      setNewCardTitle("");
    }
  };

  const handleNameBlur = async () => {
    const trimmed = editingName.trim();
    if (!trimmed) { setEditingName(column.name); return; }
    if (trimmed === column.name) return;
    try {
      await api.updateColumn(column.id, { name: trimmed });
      onColumnRename(column.id, trimmed);
    } catch {
      setEditingName(column.name);
    }
  };

  const handleNameKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") nameInputRef.current?.blur();
    if (e.key === "Escape") { setEditingName(column.name); nameInputRef.current?.blur(); }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete column "${column.name}" and all its cards?`)) return;
    await api.deleteColumn(column.id);
    onColumnDelete(column.id);
  };

  return (
    <div ref={setSortableRef} style={style} className={`column ${locked ? "locked" : ""}`}>
      <div className="column-header" {...attributes} {...(!locked ? listeners : {})}>
        <input
          ref={nameInputRef}
          className="column-title-input"
          value={editingName}
          onChange={(e) => setEditingName(e.target.value)}
          onBlur={handleNameBlur}
          onKeyDown={handleNameKeyDown}
          onClick={(e) => e.stopPropagation()}
        />
        <span className="column-count">{column.cards.length}</span>
        <button
          className="btn btn-ghost btn-icon btn-sm lock-btn"
          onClick={(e) => { e.stopPropagation(); onToggleLock(column.id); }}
          title={locked ? "Unlock column" : "Lock column"}
        >
          {locked ? "🔒" : "🔓"}
        </button>
        <button
          className="btn btn-ghost btn-icon btn-sm"
          onClick={(e) => { e.stopPropagation(); handleDelete(); }}
          title="Delete column"
          style={{ fontSize: "0.75rem", padding: "2px 5px" }}
        >
          ✕
        </button>
      </div>

      <div ref={setDropRef} className="column-cards">
        <SortableContext
          items={column.cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.cards.map((card) => (
            <KanbanCard key={card.id} card={card} onClick={() => onCardClick(card)} />
          ))}
        </SortableContext>
      </div>

      <div className="column-add-card">
        {addingCard ? (
          <form className="add-card-form" onSubmit={submitCard}>
            <textarea
              autoFocus
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={handleCardKeyDown}
              placeholder="Card title…"
              rows={2}
            />
            <div className="add-card-actions">
              <button className="btn btn-primary btn-sm" type="submit" disabled={submitting}>
                Add
              </button>
              <button
                className="btn btn-sm"
                type="button"
                onClick={() => { setAddingCard(false); setNewCardTitle(""); }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button className="add-card-btn" onClick={() => setAddingCard(true)}>
            + Add card
          </button>
        )}
      </div>
    </div>
  );
}
