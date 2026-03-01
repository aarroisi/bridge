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
  isActive: boolean;
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
  createdBy?: EmbeddedUser | null;
  insertedAt: string;
  updatedAt: string;
}

export interface ProjectItem {
  id: string;
  itemType: "board" | "doc" | "channel";
  itemId: string;
}

// Board Status type
export interface BoardStatus {
  id: string;
  name: string;
  color: string;
  position: number;
  isDone: boolean;
}

// Board types
export interface Board {
  id: string;
  name: string;
  prefix: string;
  starred: boolean;
  statuses?: BoardStatus[];
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
  boardId: string;
  title: string;
  key?: string;
  sequenceNumber?: number;
  statusId: string;
  status?: BoardStatus;
  position: number;
  parentId?: string | null;
  isCompleted?: boolean;
  assigneeId?: string | null;
  assignee?: EmbeddedUser | null;
  createdById: string;
  createdBy?: EmbeddedUser | null;
  dueOn?: string | null;
  completedAt?: string | null;
  notes?: string | null;
  childCount: number;
  childDoneCount: number;
  commentCount: number;
  parent?: {
    id: string;
    boardId: string;
    title: string;
    key?: string;
  };
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
  entityType: "task" | "doc" | "channel" | "dm";
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
  | "boards"
  | "docs"
  | "channels"
  | "dms";

// Active item type
export interface ActiveItem {
  type: Category;
  id?: string;
}

// Notification types
export interface Notification {
  id: string;
  type: "mention";
  entityType: "message" | "doc" | "task";
  entityId: string;
  context: Record<string, unknown>;
  read: boolean;
  userId: string;
  actorId: string;
  actorName?: string;
  actorAvatar?: string;
  insertedAt: string;
  updatedAt: string;
}

// Asset types
export type AssetType = "avatar" | "file";
export type AssetStatus = "pending" | "active";

export interface Asset {
  id: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  assetType: AssetType;
  status: AssetStatus;
  uploadedById: string;
  url?: string;
  insertedAt: string;
  updatedAt: string;
}

export interface UploadRequest {
  id: string;
  uploadUrl: string;
  storageKey: string;
}

export interface StorageUsage {
  usedBytes: number;
  quotaBytes: number;
  availableBytes: number;
}
