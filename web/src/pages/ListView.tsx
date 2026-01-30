import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LayoutGrid, List, X, Settings } from "lucide-react";
import { KanbanBoard } from "@/components/features/KanbanBoard";
import { TaskDetailModal } from "@/components/features/TaskDetailModal";
import { StatusManager } from "@/components/features/StatusManager";
import { useListStore } from "@/stores/listStore";
import { useChatStore } from "@/stores/chatStore";
import { useUIStore } from "@/stores/uiStore";
import { clsx } from "clsx";

export function ListView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeItem, viewMode, setViewMode } = useUIStore();
  const { lists, tasks, subtasks, fetchTasks, fetchSubtasks, createTask } =
    useListStore();
  const { messages, fetchMessages } = useChatStore();
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskStatusId, setNewTaskStatusId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isStatusManagerOpen, setIsStatusManagerOpen] = useState(false);

  // Get task ID from URL
  const selectedTaskId = searchParams.get("task");

  const listId = activeItem?.id;
  const list = Array.isArray(lists)
    ? lists.find((l) => l.id === listId)
    : undefined;
  const rawListTasks = listId ? tasks[listId] : undefined;
  const listTasks = Array.isArray(rawListTasks) ? rawListTasks : [];
  const selectedTask = listTasks.find((t) => t.id === selectedTaskId);

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

  const handleTaskClick = (taskId: string) => {
    setSearchParams({ task: taskId });
  };

  const handleCloseTask = () => {
    setSearchParams({});
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

  const renderListView = () => (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="space-y-2">
        {listTasks.map((task) => (
          <div
            key={task.id}
            onClick={() => handleTaskClick(task.id)}
            className={clsx(
              "p-4 bg-dark-surface border border-dark-border rounded-lg cursor-pointer hover:border-blue-500 transition-colors",
              selectedTaskId === task.id &&
                "border-blue-500 ring-1 ring-blue-500",
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-dark-text mb-1">
                  {task.title}
                </h4>
                <div className="flex items-center gap-3 text-xs text-dark-text-muted">
                  {task.status && (
                    <span
                      className="px-2 py-0.5 rounded text-white text-xs"
                      style={{ backgroundColor: task.status.color }}
                    >
                      {task.status.name}
                    </span>
                  )}
                  {task.assigneeName && (
                    <span>Assigned to {task.assigneeName}</span>
                  )}
                  {task.dueOn && (
                    <span>Due {new Date(task.dueOn).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

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
          subtasks={subtasks[selectedTaskId!] || []}
          comments={messages[`task:${selectedTaskId}`] || []}
          statuses={list?.statuses || []}
          onClose={handleCloseTask}
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
          onClose={() => setIsStatusManagerOpen(false)}
        />
      )}
    </div>
  );
}
