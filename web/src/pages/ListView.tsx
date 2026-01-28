import { useEffect } from "react";
import { LayoutGrid, List, Plus } from "lucide-react";
import { TaskCard } from "@/components/features/TaskCard";
import { TaskDetailPanel } from "@/components/features/TaskDetailPanel";
import { useListStore } from "@/stores/listStore";
import { useChatStore } from "@/stores/chatStore";
import { useUIStore } from "@/stores/uiStore";
import { clsx } from "clsx";

export function ListView() {
  const { activeItem, viewMode, setViewMode, selectedTaskId, setSelectedTask } =
    useUIStore();
  const { lists, tasks, subtasks, fetchTasks, fetchSubtasks } = useListStore();
  const { messages, fetchMessages } = useChatStore();

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

  if (!list) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-dark-text-muted">Select a list to view tasks</p>
      </div>
    );
  }

  const groupedTasks = {
    todo: listTasks.filter((t) => t.status === "todo"),
    doing: listTasks.filter((t) => t.status === "doing"),
    done: listTasks.filter((t) => t.status === "done"),
  };

  const renderBoardView = () => (
    <div className="flex-1 overflow-x-auto">
      <div className="flex gap-4 p-6 h-full">
        {(["todo", "doing", "done"] as const).map((status) => (
          <div key={status} className="flex-shrink-0 w-80 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-dark-text">
                {status === "todo"
                  ? "To Do"
                  : status === "doing"
                    ? "Doing"
                    : "Done"}{" "}
                <span className="text-dark-text-muted">
                  ({groupedTasks[status].length})
                </span>
              </h3>
              <button className="text-dark-text-muted hover:text-dark-text">
                <Plus size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {groupedTasks[status].map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => setSelectedTask(task.id)}
                  isSelected={selectedTaskId === task.id}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderListView = () => (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="space-y-2">
        {listTasks.map((task) => (
          <div
            key={task.id}
            onClick={() => setSelectedTask(task.id)}
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
                  <span className="capitalize">{task.status}</span>
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
    <div className="flex-1 flex overflow-hidden">
      <div className="flex-1 flex flex-col">
        <div className="px-6 py-4 border-b border-dark-border flex items-center justify-between">
          <h1 className="text-2xl font-bold text-dark-text">{list.name}</h1>
          <div className="flex items-center gap-2">
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
      </div>

      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          subtasks={subtasks[selectedTaskId!] || []}
          comments={messages[`task:${selectedTaskId}`] || []}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}
