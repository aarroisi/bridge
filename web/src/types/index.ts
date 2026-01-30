// Role type
export type Role = "owner" | "member" | "guest";

// User types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  online: boolean;
  role: Role;
  insertedAt: string;
  updatedAt: string;
}

// Project member type
export interface ProjectMember {
  id: string;
  userId: string;
  projectId: string;
  user: User;
  insertedAt: string;
  updatedAt: string;
}

// Project types
export interface Project {
  id: string;
  name: string;
  description?: string;
  starred: boolean;
  startDate?: string;
  endDate?: string;
  items?: ProjectItem[];
  insertedAt: string;
  updatedAt: string;
}

export interface ProjectItem {
  id: string;
  itemType: "list" | "doc" | "channel";
  itemId: string;
}

// List Status type
export interface ListStatus {
  id: string;
  name: string;
  color: string;
  position: number;
}

// List types
export interface List {
  id: string;
  name: string;
  starred: boolean;
  statuses?: ListStatus[];
  createdById: string;
  createdBy?: EmbeddedUser | null;
  insertedAt: string;
  updatedAt: string;
}

// Embedded user info (for assignee, created_by, etc.)
export interface EmbeddedUser {
  id: string;
  name: string;
  email: string;
}

export interface Task {
  id: string;
  listId: string;
  title: string;
  statusId: string;
  status?: ListStatus;
  position: number;
  assigneeId?: string | null;
  assignee?: EmbeddedUser | null;
  createdById: string;
  createdBy?: EmbeddedUser | null;
  dueOn?: string | null;
  notes?: string | null;
  insertedAt: string;
  updatedAt: string;
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  status: "todo" | "doing" | "done";
  assigneeId?: string | null;
  assignee?: EmbeddedUser | null;
  createdById: string;
  createdBy?: EmbeddedUser | null;
  notes?: string | null;
  dueOn?: string | null;
  insertedAt: string;
  updatedAt: string;
}

// Doc types
export interface Doc {
  id: string;
  title: string;
  content: string;
  createdBy?: EmbeddedUser | null;
  starred: boolean;
  insertedAt: string;
  updatedAt: string;
}

// Chat types
export interface Channel {
  id: string;
  name: string;
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
