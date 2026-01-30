import { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { KanbanColumn } from "./KanbanColumn";
import { TaskCard } from "./TaskCard";
import { ListStatus, Task } from "@/types";
import { useListStore } from "@/stores/listStore";

interface KanbanBoardProps {
  tasks: Task[];
  statuses: ListStatus[];
  onTaskClick: (taskId: string) => void;
  onAddTask: (statusId: string) => void;
  selectedTaskId: string | null;
}

export function KanbanBoard({
  tasks,
  statuses,
  onTaskClick,
  onAddTask,
  selectedTaskId,
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const { reorderTask } = useListStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Sort statuses by position
  const sortedStatuses = useMemo(
    () => [...statuses].sort((a, b) => a.position - b.position),
    [statuses],
  );

  // Group tasks by statusId and sort by position
  const groupedTasks = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    for (const status of sortedStatuses) {
      groups[status.id] = tasks
        .filter((t) => t.statusId === status.id)
        .sort((a, b) => a.position - b.position);
    }
    return groups;
  }, [tasks, sortedStatuses]);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Determine target status and index
    let targetStatusId: string;
    let targetIndex: number;

    // Check if dropped on a column (status id)
    const isColumnDrop = sortedStatuses.some((s) => s.id === over.id);

    if (isColumnDrop) {
      // Dropped on column header/empty area
      targetStatusId = over.id as string;
      targetIndex = groupedTasks[targetStatusId]?.length || 0;
    } else {
      // Dropped on another task
      const overTask = tasks.find((t) => t.id === over.id);
      if (!overTask) return;

      targetStatusId = overTask.statusId;
      const columnTasks = groupedTasks[targetStatusId] || [];
      targetIndex = columnTasks.findIndex((t) => t.id === over.id);

      // If dragging down in same column, adjust index
      if (task.statusId === targetStatusId) {
        const currentIndex = columnTasks.findIndex((t) => t.id === taskId);
        if (currentIndex < targetIndex) {
          targetIndex++;
        }
      }
    }

    // Only reorder if something changed
    const currentColumnTasks = groupedTasks[task.statusId] || [];
    const currentIndex = currentColumnTasks.findIndex((t) => t.id === taskId);

    if (task.statusId !== targetStatusId || currentIndex !== targetIndex) {
      reorderTask(taskId, targetStatusId, targetIndex);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 p-6 h-full overflow-x-auto">
        {sortedStatuses.map((status) => (
          <KanbanColumn
            key={status.id}
            id={status.id}
            title={status.name}
            color={status.color}
            tasks={groupedTasks[status.id] || []}
            onTaskClick={onTaskClick}
            onAddTask={onAddTask}
            selectedTaskId={selectedTaskId}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <TaskCard task={activeTask} onClick={() => {}} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
