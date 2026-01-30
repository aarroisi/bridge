import { useState, useRef, useEffect } from "react";
import {
  X,
  Calendar,
  Quote,
  ChevronDown,
  CheckSquare,
  Square,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { Avatar } from "@/components/ui/Avatar";
import { Message } from "./Message";
import { DiscussionThread } from "./DiscussionThread";
import { CommentEditor } from "./CommentEditor";
import { Task, Subtask, ListStatus, Message as MessageType } from "@/types";
import { useListStore } from "@/stores/listStore";
import { useChatStore } from "@/stores/chatStore";
import { clsx } from "clsx";

interface TaskDetailModalProps {
  task: Task;
  subtasks: Subtask[];
  comments: MessageType[];
  statuses: ListStatus[];
  onClose: () => void;
}

export function TaskDetailModal({
  task,
  subtasks,
  comments,
  statuses,
  onClose,
}: TaskDetailModalProps) {
  const [openThread, setOpenThread] = useState<MessageType | null>(null);
  const [newComment, setNewComment] = useState("");
  const [quotingMessage, setQuotingMessage] = useState<MessageType | null>(
    null,
  );
  const [newSubtask, setNewSubtask] = useState("");
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [subtaskToDelete, setSubtaskToDelete] = useState<Subtask | null>(null);
  const [isDeleteTaskModalOpen, setIsDeleteTaskModalOpen] = useState(false);
  const commentEditorRef = useRef<HTMLTextAreaElement>(null);
  const subtaskInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const {
    updateTask,
    updateSubtask,
    createSubtask,
    deleteSubtask,
    deleteTask,
  } = useListStore();
  const { sendMessage, fetchMessages, hasMoreMessages } = useChatStore();

  const sortedStatuses = [...statuses].sort((a, b) => a.position - b.position);
  const currentStatus = sortedStatuses.find((s) => s.id === task.statusId);

  // Calculate checklist progress
  const completedCount = subtasks.filter((s) => s.status === "done").length;
  const totalCount = subtasks.length;
  const progressPercent =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !openThread) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, openThread]);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleStatusChange = async (statusId: string) => {
    await updateTask(task.id, { statusId });
    setIsStatusDropdownOpen(false);
  };

  const handleSubtaskToggle = async (subtask: Subtask) => {
    const newStatus = subtask.status === "done" ? "todo" : "done";
    await updateSubtask(subtask.id, { status: newStatus });
  };

  const handleAddSubtask = async () => {
    if (!newSubtask.trim()) return;
    await createSubtask(task.id, { title: newSubtask, status: "todo" });
    setNewSubtask("");
    subtaskInputRef.current?.focus();
  };

  const handleDeleteSubtask = async () => {
    if (!subtaskToDelete) return;
    await deleteSubtask(subtaskToDelete.id);
    setSubtaskToDelete(null);
  };

  const handleDeleteTask = async () => {
    await deleteTask(task.id);
    setIsDeleteTaskModalOpen(false);
    onClose();
  };

  const handleStartAddingSubtask = () => {
    setIsAddingSubtask(true);
    setTimeout(() => {
      subtaskInputRef.current?.focus();
    }, 50);
  };

  const handleCancelAddingSubtask = () => {
    setIsAddingSubtask(false);
    setNewSubtask("");
  };

  const handleAddComment = async () => {
    // Check for empty content - strip HTML tags to check actual text
    const textContent = newComment.replace(/<[^>]*>/g, "").trim();
    if (!textContent) return;
    await sendMessage(
      "task",
      task.id,
      newComment,
      undefined,
      quotingMessage?.id,
    );
    setNewComment("");
    setQuotingMessage(null);
  };

  const handleQuote = (message: MessageType) => {
    setQuotingMessage(message);
    setTimeout(() => {
      commentEditorRef.current?.focus();
    }, 100);
  };

  const handleQuotedClick = (messageId: string) => {
    const messageElement = document.getElementById(`task-message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
      messageElement.classList.add("ring-2", "ring-blue-500/50");
      setTimeout(() => {
        messageElement.classList.remove("ring-2", "ring-blue-500/50");
      }, 2000);
    }
  };

  const sortedComments = [...comments].reverse();
  const topLevelComments = sortedComments.filter((c) => !c.parentId);
  const threadMessages = sortedComments.filter((c) => c.parentId);

  const getThreadReplies = (messageId: string) => {
    return threadMessages.filter((m) => m.parentId === messageId);
  };

  const handleLoadMore = async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      await fetchMessages("task", task.id, true);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-dark-bg border border-dark-border rounded-xl w-[calc(100vw-4rem)] h-[calc(100vh-4rem)] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-dark-border flex items-start justify-between flex-shrink-0">
          <div className="flex-1 pr-4">
            <h2 className="text-xl font-semibold text-dark-text mb-2">
              {task.title}
            </h2>
            <div className="flex items-center gap-4 flex-wrap">
              {currentStatus && (
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: currentStatus.color }}
                  />
                  <span className="text-sm text-dark-text-muted">
                    {currentStatus.name}
                  </span>
                </div>
              )}
              {task.assigneeName && (
                <div className="flex items-center gap-2 text-sm text-dark-text-muted">
                  <Avatar name={task.assigneeName} size="xs" />
                  <span>{task.assigneeName}</span>
                </div>
              )}
              {task.dueOn && (
                <div className="flex items-center gap-1 text-sm text-dark-text-muted">
                  <Calendar size={14} />
                  <span>{format(new Date(task.dueOn), "MMM d, yyyy")}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsDeleteTaskModalOpen(true)}
              className="text-dark-text-muted hover:text-red-400 transition-colors p-1 hover:bg-dark-surface rounded"
              title="Delete task"
            >
              <Trash2 size={18} />
            </button>
            <button
              onClick={onClose}
              className="text-dark-text-muted hover:text-dark-text transition-colors p-1 hover:bg-dark-surface rounded"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content - Two Column Layout */}
        <div className="flex-1 overflow-hidden flex">
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Status Section */}
            <div className="px-6 py-4 border-b border-dark-border">
              <label className="block text-sm font-medium text-dark-text mb-2">
                Status
              </label>
              <div className="relative">
                <button
                  onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                  className="w-full max-w-xs flex items-center justify-between px-3 py-2 bg-dark-surface border border-dark-border rounded-lg text-sm hover:border-dark-text-muted transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {currentStatus && (
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: currentStatus.color }}
                      />
                    )}
                    <span className="text-dark-text">
                      {currentStatus?.name || "Select status"}
                    </span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={clsx(
                      "text-dark-text-muted transition-transform",
                      isStatusDropdownOpen && "rotate-180",
                    )}
                  />
                </button>
                {isStatusDropdownOpen && (
                  <div className="absolute z-10 w-full max-w-xs mt-1 bg-dark-surface border border-dark-border rounded-lg shadow-lg overflow-hidden">
                    {sortedStatuses.map((status) => (
                      <button
                        key={status.id}
                        onClick={() => handleStatusChange(status.id)}
                        className={clsx(
                          "w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-dark-border transition-colors",
                          task.statusId === status.id && "bg-dark-border",
                        )}
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: status.color }}
                        />
                        <span className="text-dark-text">{status.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Notes Section */}
            {task.notes && (
              <div className="px-6 py-4 border-b border-dark-border">
                <h3 className="text-sm font-medium text-dark-text mb-2">
                  Notes
                </h3>
                <p className="text-sm text-dark-text-muted whitespace-pre-wrap">
                  {task.notes}
                </p>
              </div>
            )}

            {/* Checklist Section */}
            <div className="px-6 py-4 border-b border-dark-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CheckSquare size={16} className="text-dark-text-muted" />
                  <h3 className="text-sm font-medium text-dark-text">
                    Checklist
                  </h3>
                </div>
                {totalCount > 0 && (
                  <span className="text-xs text-dark-text-muted">
                    {completedCount}/{totalCount}
                  </span>
                )}
              </div>

              {totalCount > 0 && (
                <div className="mb-3">
                  <div className="h-2 bg-dark-surface rounded-full overflow-hidden">
                    <div
                      className={clsx(
                        "h-full transition-all duration-300 rounded-full",
                        progressPercent === 100
                          ? "bg-green-500"
                          : "bg-blue-500",
                      )}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                {subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="group flex items-start gap-2 py-1.5 px-1 -mx-1 rounded hover:bg-dark-surface transition-colors"
                  >
                    <button
                      onClick={() => handleSubtaskToggle(subtask)}
                      className="flex-shrink-0 mt-0.5 text-dark-text-muted hover:text-dark-text transition-colors"
                    >
                      {subtask.status === "done" ? (
                        <CheckSquare size={18} className="text-green-500" />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                    <span
                      className={clsx(
                        "flex-1 text-sm leading-relaxed",
                        subtask.status === "done"
                          ? "text-dark-text-muted line-through"
                          : "text-dark-text",
                      )}
                    >
                      {subtask.title}
                    </span>
                    <button
                      onClick={() => setSubtaskToDelete(subtask)}
                      className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 text-dark-text-muted hover:text-red-400 transition-all"
                      title="Delete item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {isAddingSubtask ? (
                <div className="mt-2">
                  <input
                    ref={subtaskInputRef}
                    type="text"
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newSubtask.trim()) {
                        handleAddSubtask();
                      } else if (e.key === "Escape") {
                        handleCancelAddingSubtask();
                      }
                    }}
                    placeholder="Add an item..."
                    className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded-lg text-sm text-dark-text placeholder:text-dark-text-muted focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={handleAddSubtask}
                      disabled={!newSubtask.trim()}
                      className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Add
                    </button>
                    <button
                      onClick={handleCancelAddingSubtask}
                      className="px-3 py-1.5 text-dark-text-muted text-sm hover:text-dark-text transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleStartAddingSubtask}
                  className="mt-2 text-sm text-dark-text-muted hover:text-dark-text transition-colors"
                >
                  + Add an item
                </button>
              )}
            </div>

            {/* Comments Section */}
            <div className="px-6 py-4">
              {topLevelComments.length > 0 ? (
                <>
                  <h3 className="text-sm font-medium text-dark-text mb-3">
                    Comments ({topLevelComments.length})
                  </h3>
                  {hasMoreMessages("task", task.id) && (
                    <div className="mb-4 flex justify-center">
                      <button
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                        className="px-4 py-2 text-sm text-blue-400 hover:text-blue-300 hover:bg-dark-surface rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoadingMore ? "Loading..." : "Load older comments"}
                      </button>
                    </div>
                  )}
                  <div className="space-y-1 mb-4">
                    {topLevelComments.map((comment) => {
                      const replies = getThreadReplies(comment.id);
                      return (
                        <div key={comment.id} id={`task-message-${comment.id}`}>
                          <Message
                            message={comment}
                            onReply={() => setOpenThread(comment)}
                            onQuote={() => handleQuote(comment)}
                            onQuotedClick={handleQuotedClick}
                          />
                          {replies.length > 0 && (
                            <button
                              onClick={() => setOpenThread(comment)}
                              className="ml-14 text-xs text-blue-400 hover:underline"
                            >
                              {replies.length}{" "}
                              {replies.length === 1 ? "reply" : "replies"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-dark-surface flex items-center justify-center mb-3">
                    <Quote size={20} className="text-dark-text-muted" />
                  </div>
                  <p className="text-dark-text-muted text-sm">
                    No comments yet. Be the first to add one below.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Comment Editor - Fixed at bottom */}
        <div className="border-t border-dark-border p-4 flex-shrink-0">
          <CommentEditor
            ref={commentEditorRef}
            value={newComment}
            onChange={setNewComment}
            onSubmit={handleAddComment}
            placeholder="Add a comment..."
            quotingMessage={quotingMessage}
            onCancelQuote={() => setQuotingMessage(null)}
          />
        </div>
      </div>

      {/* Thread Panel - Outside modal, fixed on right */}
      {openThread && (
        <div className="fixed top-0 right-0 bottom-0 w-96 bg-dark-surface border-l border-dark-border z-[60] flex flex-col shadow-2xl">
          <DiscussionThread
            parentMessage={openThread}
            threadMessages={threadMessages}
            onClose={() => setOpenThread(null)}
            onSendReply={async (parentId, text, quoteId) => {
              await sendMessage("task", task.id, text, parentId, quoteId);
            }}
          />
        </div>
      )}

      {/* Delete Subtask Confirmation Modal */}
      {subtaskToDelete && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]"
          onClick={() => setSubtaskToDelete(null)}
        >
          <div
            className="bg-dark-surface border border-dark-border rounded-lg p-6 w-full max-w-sm shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-dark-text mb-2">
              Delete item?
            </h3>
            <p className="text-sm text-dark-text-muted mb-4">
              Are you sure you want to delete "{subtaskToDelete.title}"? This
              action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSubtaskToDelete(null)}
                className="px-4 py-2 text-dark-text-muted hover:text-dark-text transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSubtask}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Task Confirmation Modal */}
      {isDeleteTaskModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]"
          onClick={() => setIsDeleteTaskModalOpen(false)}
        >
          <div
            className="bg-dark-surface border border-dark-border rounded-lg p-6 w-full max-w-sm shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-dark-text mb-2">
              Delete task?
            </h3>
            <p className="text-sm text-dark-text-muted mb-4">
              Are you sure you want to delete "{task.title}"? This will also
              delete all subtasks and comments. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsDeleteTaskModalOpen(false)}
                className="px-4 py-2 text-dark-text-muted hover:text-dark-text transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTask}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
