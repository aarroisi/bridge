// User types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  online: boolean;
  insertedAt: string;
  updatedAt: string;
}

// Project types
export interface Project {
  id: string;
  name: string;
  starred: boolean;
  items: ProjectItem[];
  insertedAt: string;
  updatedAt: string;
}

export interface ProjectItem {
  type: "list" | "doc" | "channel";
  id: string;
  name: string;
}

// List types
export interface List {
  id: string;
  name: string;
  projectId?: string;
  starred: boolean;
  insertedAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  listId: string;
  title: string;
  status: "todo" | "doing" | "done";
  assigneeId?: string;
  assigneeName?: string;
  createdById: string;
  createdByName: string;
  dueOn?: string;
  notes?: string;
  insertedAt: string;
  updatedAt: string;
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  status: "todo" | "doing" | "done";
  assigneeId?: string;
  assigneeName?: string;
  createdById: string;
  createdByName: string;
  notes?: string;
  insertedAt: string;
  updatedAt: string;
}

// Doc types
export interface Doc {
  id: string;
  title: string;
  content: string;
  projectId?: string;
  authorId: string;
  authorName: string;
  starred: boolean;
  insertedAt: string;
  updatedAt: string;
}

// Chat types
export interface Channel {
  id: string;
  name: string;
  projectId?: string;
  starred: boolean;
  insertedAt: string;
  updatedAt: string;
}

export interface DirectMessage {
  id: string;
  name: string;
  userId: string;
  avatar: string;
  online: boolean;
  starred: boolean;
  insertedAt: string;
  updatedAt: string;
}

// Message/Comment types (universal)
export interface Message {
  id: string;
  userId: string;
  userName: string;
  avatar: string;
  text: string;
  parentId?: string; // For threading
  quoteId?: string; // For quotes
  quote?: Message; // The actual quoted message
  entityType: "task" | "subtask" | "doc" | "channel" | "dm";
  entityId: string;
  insertedAt: string;
  updatedAt: string;
}

// Pagination types
export interface PaginationMetadata {
  after: string | null;
  before: string | null;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  metadata: PaginationMetadata;
}

// View modes
export type ViewMode = "board" | "list";

// Category types
export type Category =
  | "home"
  | "projects"
  | "lists"
  | "docs"
  | "channels"
  | "dms";

// Active item type
export interface ActiveItem {
  type: Category;
  id?: string;
}
