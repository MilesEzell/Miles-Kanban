import type { User, Board, BoardDetail, Column, Card } from "./types";

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  // Auth
  register: (username: string, password: string) =>
    request<User>("POST", "/api/auth/register", { username, password }),
  login: (username: string, password: string) =>
    request<User>("POST", "/api/auth/login", { username, password }),
  logout: () => request<void>("POST", "/api/auth/logout"),

  // Me
  getMe: () => request<User>("GET", "/api/me"),
  updateMe: (data: { theme?: string }) =>
    request<User>("PATCH", "/api/me", data),

  // Boards
  listBoards: () => request<Board[]>("GET", "/api/boards"),
  createBoard: (name: string) =>
    request<Board>("POST", "/api/boards", { name }),
  getBoard: (id: string) => request<BoardDetail>("GET", `/api/boards/${id}`),
  updateBoard: (id: string, name: string) =>
    request<Board>("PATCH", `/api/boards/${id}`, { name }),
  deleteBoard: (id: string) => request<void>("DELETE", `/api/boards/${id}`),

  // Columns
  createColumn: (boardId: string, name: string) =>
    request<Column>("POST", `/api/boards/${boardId}/columns`, { name }),
  updateColumn: (id: string, data: { name?: string; position?: number }) =>
    request<Column>("PATCH", `/api/columns/${id}`, data),
  deleteColumn: (id: string) => request<void>("DELETE", `/api/columns/${id}`),

  // Cards
  createCard: (
    columnId: string,
    data: {
      title: string;
      description?: string;
      label?: string;
      due_date?: string;
    }
  ) => request<Card>("POST", `/api/columns/${columnId}/cards`, data),
  updateCard: (
    id: string,
    data: {
      title?: string;
      description?: string | null;
      label?: string | null;
      due_date?: string | null;
      column_id?: string;
      position?: number;
    }
  ) => request<Card>("PATCH", `/api/cards/${id}`, data),
  deleteCard: (id: string) => request<void>("DELETE", `/api/cards/${id}`),
};
