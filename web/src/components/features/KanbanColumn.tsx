import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { SortableTaskCard } from "./SortableTaskCard";
import { Task } from "@/types";
import { clsx } from "clsx";

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
  onAddTask: (statusId: string) => void;
  selectedTaskId: string | null;
  isHighlighted?: boolean;
}

export function KanbanColumn({
  id,
  title,
  color,
  tasks,
  onTaskClick,
  onAddTask,
  selectedTaskId,
  isHighlighted = false,
}: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "flex-shrink-0 w-80 flex flex-col border-r border-dark-border px-5 py-5 first:pl-6 transition-colors",
        isHighlighted && "bg-blue-500/10",
      )}
      data-testid={`column-${title}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <h3 className="font-semibold text-dark-text">
            {title}{" "}
            <span className="text-dark-text-muted font-normal">
              ({tasks.length})
            </span>
          </h3>
        </div>
        <button
          onClick={() => onAddTask(id)}
          className="text-dark-text-muted hover:text-dark-text p-1 rounded hover:bg-dark-surface transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 p-1">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task.id)}
              isSelected={selectedTaskId === task.id}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
