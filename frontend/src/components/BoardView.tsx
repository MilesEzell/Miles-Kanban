import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { createPortal } from "react-dom";
import { api } from "../api";
import type { BoardDetail, Card, Column } from "../types";
import { TopBar } from "./TopBar";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import { CardModal } from "./CardModal";
import { useToast } from "./Toast";

const POSITION_GAP = 1000;

function positionBetween(before: number | undefined, after: number | undefined): number {
  if (before === undefined && after === undefined) return POSITION_GAP;
  if (before === undefined) return (after! - POSITION_GAP > 0 ? after! - POSITION_GAP : after! / 2);
  if (after === undefined) return before + POSITION_GAP;
  return Math.round((before + after) / 2);
}

export function BoardView() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [board, setBoard] = useState<BoardDetail | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [editingBoardName, setEditingBoardName] = useState("");
  const boardNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!boardId) return;
    api
      .getBoard(boardId)
      .then((b) => {
        setBoard(b);
        setEditingBoardName(b.name);
        setColumns(b.columns.map((c) => ({ ...c, cards: [...c.cards].sort((a, b) => a.position - b.position) })));
      })
      .catch(() => { showToast("Board not found", "error"); navigate("/"); });
  }, [boardId, navigate, showToast]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const findColumnByCardId = useCallback(
    (cardId: string) => columns.find((col) => col.cards.some((c) => c.id === cardId)),
    [columns]
  );

  const onDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === "card") {
      setActiveCard(active.data.current.card as Card);
    } else if (active.data.current?.type === "column") {
      setActiveColumn(columns.find((c) => c.id === active.id) ?? null);
    }
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (active.data.current?.type !== "card") return;

    const activeColId = findColumnByCardId(active.id as string)?.id;
    let overColId: string | undefined;

    if (over.data.current?.type === "card") {
      overColId = findColumnByCardId(over.id as string)?.id;
    } else if (over.id.toString().startsWith("col-")) {
      overColId = over.id.toString().replace("col-", "");
    } else if (over.data.current?.type === "column") {
      overColId = over.id as string;
    }

    if (!overColId || activeColId === overColId) return;

    setColumns((cols) =>
      cols.map((col) => {
        if (col.id === activeColId) {
          return { ...col, cards: col.cards.filter((c) => c.id !== active.id) };
        }
        if (col.id === overColId) {
          const card = (active.data.current?.card as Card) ?? activeCard;
          if (!card) return col;
          const overCard = col.cards.find((c) => c.id === over.id);
          const idx = overCard ? col.cards.indexOf(overCard) : col.cards.length;
          const newCards = [...col.cards];
          newCards.splice(idx, 0, { ...card, column_id: overColId! });
          return { ...col, cards: newCards };
        }
        return col;
      })
    );
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);
    setActiveColumn(null);
    if (!over) return;

    // Column reorder
    if (active.data.current?.type === "column") {
      const oldIdx = columns.findIndex((c) => c.id === active.id);
      const newIdx = columns.findIndex((c) => c.id === over.id);
      if (oldIdx === newIdx) return;
      const reordered = arrayMove(columns, oldIdx, newIdx);
      setColumns(reordered);
      // Persist positions
      try {
        await Promise.all(
          reordered.map((col, i) =>
            api.updateColumn(col.id, { position: (i + 1) * POSITION_GAP })
          )
        );
      } catch {
        showToast("Failed to save column order", "error");
      }
      return;
    }

    // Card move/reorder
    if (active.data.current?.type === "card") {
      const card = active.data.current.card as Card;

      const targetCol = columns.find((col) =>
        col.cards.some((c) => c.id === active.id)
      );
      if (!targetCol) return;

      const cardIdx = targetCol.cards.findIndex((c) => c.id === card.id);
      const before = targetCol.cards[cardIdx - 1]?.position;
      const after = targetCol.cards[cardIdx + 1]?.position;
      const newPosition = positionBetween(before, after);

      setColumns((cols) =>
        cols.map((col) =>
          col.id === targetCol.id
            ? {
                ...col,
                cards: col.cards.map((c) =>
                  c.id === card.id ? { ...c, position: newPosition, column_id: targetCol.id } : c
                ),
              }
            : col
        )
      );

      try {
        await api.updateCard(card.id, {
          column_id: targetCol.id,
          position: newPosition,
        });
      } catch {
        showToast("Failed to save card position", "error");
        // Reload board on failure
        api.getBoard(boardId!).then((b) => setColumns(b.columns));
      }
    }
  };

  const handleCardUpdate = (updated: Card) => {
    setColumns((cols) =>
      cols.map((col) => ({
        ...col,
        cards: col.cards.map((c) => (c.id === updated.id ? updated : c)),
      }))
    );
    setSelectedCard(updated);
  };

  const handleCardDelete = (cardId: string) => {
    setColumns((cols) =>
      cols.map((col) => ({ ...col, cards: col.cards.filter((c) => c.id !== cardId) }))
    );
  };

  const handleCardAdd = (columnId: string, card: Card) => {
    setColumns((cols) =>
      cols.map((col) =>
        col.id === columnId ? { ...col, cards: [...col.cards, card] } : col
      )
    );
  };

  const handleColumnRename = (columnId: string, name: string) => {
    setColumns((cols) =>
      cols.map((col) => (col.id === columnId ? { ...col, name } : col))
    );
  };

  const handleColumnDelete = (columnId: string) => {
    setColumns((cols) => cols.filter((c) => c.id !== columnId));
  };

  const addColumn = async (e: FormEvent) => {
    e.preventDefault();
    if (!newColName.trim() || !boardId) return;
    try {
      const col = await api.createColumn(boardId, newColName.trim());
      setColumns((prev) => [...prev, { ...col, cards: [] }]);
      setNewColName("");
      setAddingColumn(false);
    } catch {
      showToast("Failed to create column", "error");
    }
  };

  const addColKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") { setAddingColumn(false); setNewColName(""); }
  };

  const handleBoardNameBlur = async () => {
    const trimmed = editingBoardName.trim();
    if (!trimmed || !board || trimmed === board.name) { setEditingBoardName(board?.name ?? ""); return; }
    try {
      await api.updateBoard(board.id, trimmed);
      setBoard((b) => b ? { ...b, name: trimmed } : b);
    } catch {
      setEditingBoardName(board.name);
    }
  };

  const handleDeleteBoard = async () => {
    if (!board || !confirm(`Delete board "${board.name}"? This cannot be undone.`)) return;
    try {
      await api.deleteBoard(board.id);
      navigate("/");
    } catch {
      showToast("Failed to delete board", "error");
    }
  };

  if (!board) {
    return (
      <>
        <TopBar />
        <div className="loading-screen">Loading…</div>
      </>
    );
  }

  return (
    <div className="board-view">
      <TopBar boardName={board.name} />
      <div className="board-header">
        <input
          ref={boardNameRef}
          value={editingBoardName}
          onChange={(e) => setEditingBoardName(e.target.value)}
          onBlur={handleBoardNameBlur}
          onKeyDown={(e) => { if (e.key === "Enter") boardNameRef.current?.blur(); if (e.key === "Escape") { setEditingBoardName(board.name); boardNameRef.current?.blur(); } }}
          style={{ background: "transparent", border: "1px solid transparent", borderRadius: 4, padding: "3px 6px", fontWeight: 600, fontSize: "1rem", color: "var(--text)", minWidth: 0, maxWidth: 320 }}
        />
        <button className="btn btn-sm btn-danger" onClick={handleDeleteBoard}>
          Delete board
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="board-columns-container">
          <SortableContext
            items={columns.map((c) => c.id)}
            strategy={horizontalListSortingStrategy}
          >
            {columns.map((col) => (
              <KanbanColumn
                key={col.id}
                column={col}
                onCardClick={setSelectedCard}
                onCardAdd={handleCardAdd}
                onColumnRename={handleColumnRename}
                onColumnDelete={handleColumnDelete}
              />
            ))}
          </SortableContext>

          {addingColumn ? (
            <form className="add-column-form" onSubmit={addColumn}>
              <input
                autoFocus
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                onKeyDown={addColKeyDown}
                placeholder="Column name…"
              />
              <div className="add-column-actions">
                <button className="btn btn-primary btn-sm" type="submit">Add</button>
                <button className="btn btn-sm" type="button" onClick={() => { setAddingColumn(false); setNewColName(""); }}>Cancel</button>
              </div>
            </form>
          ) : (
            <button className="add-column-btn" onClick={() => setAddingColumn(true)}>
              + Add column
            </button>
          )}
        </div>

        {createPortal(
          <DragOverlay>
            {activeCard && (
              <div className="drag-overlay">
                <KanbanCard card={activeCard} onClick={() => {}} />
              </div>
            )}
            {activeColumn && (
              <div className="drag-overlay column" style={{ opacity: 0.9 }}>
                <div className="column-header">
                  <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{activeColumn.name}</span>
                </div>
              </div>
            )}
          </DragOverlay>,
          document.body
        )}
      </DndContext>

      {selectedCard && (
        <CardModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onUpdate={handleCardUpdate}
          onDelete={handleCardDelete}
        />
      )}
    </div>
  );
}
