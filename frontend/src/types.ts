export interface User {
  id: string;
  username: string;
  theme: "light" | "dark" | "system";
  is_admin: boolean;
  created_at: string;
}

export interface Board {
  id: string;
  owner_id: string;
  name: string;
  created_at: string;
}

export interface Card {
  id: string;
  column_id: string;
  title: string;
  description: string | null;
  position: number;
  label: string | null;
  due_date: string | null;
  created_at: string;
}

export interface Column {
  id: string;
  board_id: string;
  name: string;
  position: number;
  cards: Card[];
}

export interface BoardDetail extends Board {
  columns: Column[];
}
