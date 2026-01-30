import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LayoutGrid, List, X, Settings, Plus } from "lucide-react";
import { KanbanBoard } from "@/components/features/KanbanBoard";
import { TaskDetailModal } from "@/components/features/TaskDetailModal";
import { SubtaskDetailModal } from "@/components/features/SubtaskDetailModal";
import { StatusManager } from "@/components/features/StatusManager";
import { useListStore } from "@/stores/listStore";
import { useChatStore } from "@/stores/chatStore";
import { useUIStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";
import { User } from "@/types";
import { clsx } from "clsx";

export function ListView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeItem } = useUIStore();
  const { lists, tasks, subtasks, fetchTasks, fetchSubtasks, createTask } =
    useListStore();
  const { messages, fetchMessages } = useChatStore();
  const { isOwner } = useAuthStore();
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskStatusId, setNewTaskStatusId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isStatusManagerOpen, setIsStatusManagerOpen] = useState(false);
  const [workspaceMembers, setWorkspaceMembers] = useState<User[]>([]);

  // Get view mode, task and subtask IDs from URL
  const viewMode = (searchParams.get("view") as "board" | "list") || "board";
  const selectedTaskId = searchParams.get("task");
  const selectedSubtaskId = searchParams.get("subtask");

  const setViewMode = (mode: "board" | "list") => {
    const newParams = new URLSearchParams(searchParams);
    if (mode === "board") {
      newParams.delete("view"); // Default, no need to store
    } else {
      newParams.set("view", mode);
    }
    setSearchParams(newParams);
  };

  const listId = activeItem?.id;
  const list = Array.isArray(lists)
    ? lists.find((l) => l.id === listId)
    : undefined;
  const rawListTasks = listId ? tasks[listId] : undefined;
  const listTasks = Array.isArray(rawListTasks) ? rawListTasks : [];
  const selectedTask = listTasks.find((t) => t.id === selectedTaskId);
  const taskSubtasks = selectedTaskId ? subtasks[selectedTaskId] || [] : [];
  const selectedSubtask = taskSubtasks.find((s) => s.id === selectedSubtaskId);

  useEffect(() => {
    if (listId) {
      fetchTasks(listId);
    }
  }, [listId, fetchTasks]);

  useEffect(() => {
    if (selectedTaskId) {
      fetchSubtasks(selectedTaskId);
      fetchMessages("task", selectedTaskId);
    }
  }, [selectedTaskId, fetchSubtasks, fetchMessages]);

  // Fetch subtask comments when a subtask is selected
  useEffect(() => {
    if (selectedSubtaskId) {
      fetchMessages("subtask", selectedSubtaskId);
    }
  }, [selectedSubtaskId, fetchMessages]);

  // Fetch workspace members for assignee dropdown
  useEffect(() => {
    const fetchMembers = async () => {
      if (isOwner()) {
        try {
          const members = await api.get<User[]>("/workspace/members");
          setWorkspaceMembers(members);
        } catch (error) {
          console.error("Failed to fetch workspace members:", error);
        }
      }
    };
    fetchMembers();
  }, [isOwner]);

  const handleTaskClick = (taskId: string) => {
    setSearchParams({ task: taskId });
  };

  const handleCloseTask = () => {
    setSearchParams({});
  };

  const handleSubtaskClick = (subtaskId: string) => {
    if (selectedTaskId) {
      setSearchParams({ task: selectedTaskId, subtask: subtaskId });
    }
  };

  const handleCloseSubtask = () => {
    if (selectedTaskId) {
      setSearchParams({ task: selectedTaskId });
    }
  };

  const handleAddTask = (statusId: string) => {
    setNewTaskStatusId(statusId);
    setIsAddingTask(true);
    setNewTaskTitle("");
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || !listId || !newTaskStatusId) return;

    await createTask(listId, {
      title: newTaskTitle.trim(),
      statusId: newTaskStatusId,
    });
    setIsAddingTask(false);
    setNewTaskStatusId(null);
    setNewTaskTitle("");
  };

  if (!list) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-dark-text-muted">Select a list to view tasks</p>
      </div>
    );
  }

  const renderBoardView = () => (
    <div className="flex-1 overflow-hidden">
      <KanbanBoard
        tasks={listTasks}
        statuses={list?.statuses || []}
        onTaskClick={handleTaskClick}
        onAddTask={handleAddTask}
        selectedTaskId={selectedTaskId}
      />
    </div>
  );

  const renderListView = () => {
    // Group tasks by status
    const statuses = list?.statuses || [];
    const tasksByStatus = statuses.map((status) => ({
      status,
      tasks: listTasks.filter((task) => task.statusId === status.id),
    }));

    // Also include tasks with no status (shouldn't happen but just in case)
    const tasksWithoutStatus = listTasks.filter(
      (task) => !statuses.some((s) => s.id === task.statusId),
    );

    const renderTaskRow = (task: (typeof listTasks)[0]) => (
      <div
        key={task.id}
        onClick={() => handleTaskClick(task.id)}
        className={clsx(
          "flex items-center px-4 py-3 border-b border-dark-border cursor-pointer hover:bg-dark-surface/50 transition-colors",
          selectedTaskId === task.id && "bg-blue-500/10",
        )}
      >
        <div className="flex-1 min-w-0">
          <span className="text-dark-text truncate">{task.title}</span>
        </div>
        <div className="w-32 text-sm text-dark-text-muted text-right">
          {task.assignee?.name || "-"}
        </div>
        <div className="w-32 text-sm text-dark-text-muted text-right">
          {task.dueOn ? new Date(task.dueOn).toLocaleDateString() : "-"}
        </div>
      </div>
    );

    const renderStatusSeparator = (
      statusId: string,
      name: string,
      color: string,
      count: number,
    ) => (
      <div
        className="flex items-center px-4 py-2 bg-dark-bg border-b border-dark-border"
        style={{ borderLeftColor: color, borderLeftWidth: "3px" }}
      >
        <div className="flex-1 flex items-center gap-2">
          <span className="text-sm font-medium text-dark-text-muted">
            {name}
          </span>
          <span className="text-xs text-dark-text-muted">({count})</span>
          <button
            onClick={() => {
              setNewTaskStatusId(statusId);
              setNewTaskTitle("");
            }}
            className="ml-1 p-0.5 rounded hover:bg-dark-surface text-dark-text-muted hover:text-dark-text transition-colors"
            title="Add task"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    );

    return (
      <div className="flex-1 overflow-y-auto">
        <div className="border border-dark-border rounded-lg m-6 overflow-hidden">
          {/* Table header */}
          <div className="flex items-center px-4 py-2 bg-dark-surface border-b border-dark-border">
            <div className="flex-1">
              <span className="text-xs font-medium text-dark-text-muted uppercase tracking-wide">
                Task
              </span>
            </div>
            <div className="w-32 text-right">
              <span className="text-xs font-medium text-dark-text-muted uppercase tracking-wide">
                Assignee
              </span>
            </div>
            <div className="w-32 text-right">
              <span className="text-xs font-medium text-dark-text-muted uppercase tracking-wide">
                Due Date
              </span>
            </div>
          </div>

          {tasksByStatus.map(({ status, tasks: statusTasks }) => (
            <div key={status.id}>
              {renderStatusSeparator(
                status.id,
                status.name,
                status.color,
                statusTasks.length,
              )}
              {statusTasks.map(renderTaskRow)}
              {/* Inline add task input */}
              {newTaskStatusId === status.id && (
                <div className="flex items-center px-4 py-2 border-b border-dark-border bg-dark-surface/30">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateTask();
                      if (e.key === "Escape") {
                        setNewTaskStatusId(null);
                        setNewTaskTitle("");
                      }
                    }}
                    onBlur={() => {
                      if (!newTaskTitle.trim()) {
                        setNewTaskStatusId(null);
                        setNewTaskTitle("");
                      }
                    }}
                    placeholder="Task title..."
                    className="flex-1 bg-transparent text-dark-text placeholder-dark-text-muted focus:outline-none"
                    autoFocus
                  />
                  <div className="w-32" />
                  <div className="w-32" />
                </div>
              )}
            </div>
          ))}

          {/* Tasks without status (fallback) */}
          {tasksWithoutStatus.length > 0 && (
            <div>
              {renderStatusSeparator(
                "no-status",
                "No Status",
                "#6b7280",
                tasksWithoutStatus.length,
              )}
              {tasksWithoutStatus.map(renderTaskRow)}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      <div className="px-6 py-4 border-b border-dark-border flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark-text">{list.name}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsStatusManagerOpen(true)}
            className="p-2 rounded transition-colors text-dark-text-muted hover:bg-dark-surface"
            title="Manage statuses"
          >
            <Settings size={18} />
          </button>
          <button
            onClick={() => setViewMode("board")}
            className={clsx(
              "p-2 rounded transition-colors",
              viewMode === "board"
                ? "bg-blue-600 text-white"
                : "text-dark-text-muted hover:bg-dark-surface",
            )}
            title="Board view"
          >
            <LayoutGrid size={18} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={clsx(
              "p-2 rounded transition-colors",
              viewMode === "list"
                ? "bg-blue-600 text-white"
                : "text-dark-text-muted hover:bg-dark-surface",
            )}
            title="List view"
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {viewMode === "board" ? renderBoardView() : renderListView()}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          subtasks={taskSubtasks}
          comments={messages[`task:${selectedTaskId}`] || []}
          statuses={list?.statuses || []}
          workspaceMembers={workspaceMembers}
          onClose={handleCloseTask}
          onSubtaskClick={handleSubtaskClick}
        />
      )}

      {/* Subtask Detail Modal */}
      {selectedSubtask && (
        <SubtaskDetailModal
          subtask={selectedSubtask}
          comments={messages[`subtask:${selectedSubtaskId}`] || []}
          workspaceMembers={workspaceMembers}
          onClose={handleCloseSubtask}
        />
      )}

      {/* Add Task Modal */}
      {isAddingTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-surface border border-dark-border rounded-lg p-6 w-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-dark-text">Add Task</h3>
              <button
                onClick={() => setIsAddingTask(false)}
                className="text-dark-text-muted hover:text-dark-text"
              >
                <X size={20} />
              </button>
            </div>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateTask();
                if (e.key === "Escape") setIsAddingTask(false);
              }}
              placeholder="Task title"
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsAddingTask(false)}
                className="px-4 py-2 text-dark-text-muted hover:text-dark-text transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTask}
                disabled={!newTaskTitle.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Manager Modal */}
      {isStatusManagerOpen && list && (
        <StatusManager
          listId={list.id}
          statuses={list.statuses || []}
          tasks={listTasks}
          onClose={() => setIsStatusManagerOpen(false)}
        />
      )}
    </div>
  );
}
