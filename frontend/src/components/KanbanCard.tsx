import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Card } from "../types";

interface Props {
  card: Card;
  onClick: () => void;
}

function isOverdue(dateStr: string): boolean {
  return new Date(dateStr) < new Date(new Date().toDateString());
}

export function KanbanCard({ card, onClick }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id, data: { type: "card", card } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`kanban-card ${isDragging ? "dragging" : ""}`}
      onClick={onClick}
    >
      {card.label && (
        <div className="card-label" style={{ background: card.label }} />
      )}
      <div className="card-title">{card.title}</div>
      {card.due_date && (
        <div className="card-meta">
          <span className={`card-due ${isOverdue(card.due_date) ? "overdue" : ""}`}>
            📅 {card.due_date}
          </span>
        </div>
      )}
    </div>
  );
}
