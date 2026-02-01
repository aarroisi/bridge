import { useState, useMemo, useEffect, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  CollisionDetection,
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

const COLLAPSED_COLUMNS_KEY = "kanban-collapsed-columns";

export function KanbanBoard({
  tasks,
  statuses,
  onTaskClick,
  onAddTask,
  selectedTaskId,
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [overStatusId, setOverStatusId] = useState<string | null>(null);
  const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(
    new Set(),
  );
  const { reorderTask } = useListStore();

  // Find the done status ID to default it to collapsed
  const doneStatusId = useMemo(() => {
    return statuses.find((s) => s.isDone)?.id;
  }, [statuses]);

  // Load collapsed state from localStorage on mount, defaulting done column to collapsed
  useEffect(() => {
    if (!doneStatusId) return;

    try {
      const saved = localStorage.getItem(COLLAPSED_COLUMNS_KEY);
      if (saved) {
        const parsed = new Set(JSON.parse(saved) as string[]);
        // Always add done column to collapsed set (user can expand it manually)
        parsed.add(doneStatusId);
        setCollapsedColumns(parsed);
      } else {
        // Default done column to collapsed
        setCollapsedColumns(new Set([doneStatusId]));
      }
    } catch {
      // Ignore parse errors, default to done collapsed
      setCollapsedColumns(new Set([doneStatusId]));
    }
  }, [doneStatusId]);

  // Save collapsed state to localStorage
  const saveCollapsedState = useCallback((columns: Set<string>) => {
    try {
      localStorage.setItem(COLLAPSED_COLUMNS_KEY, JSON.stringify([...columns]));
    } catch {
      // Ignore storage errors
    }
  }, []);

  const toggleColumnCollapse = useCallback(
    (statusId: string) => {
      setCollapsedColumns((prev) => {
        const next = new Set(prev);
        if (next.has(statusId)) {
          next.delete(statusId);
        } else {
          next.add(statusId);
        }
        saveCollapsedState(next);
        return next;
      });
    },
    [saveCollapsedState],
  );

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

  // Sort statuses by position, with done status always last
  const sortedStatusesWithDoneLast = useMemo(() => {
    const sorted = [...statuses].sort((a, b) => a.position - b.position);
    const done = sorted.find((s) => s.isDone);
    const regular = sorted.filter((s) => !s.isDone);
    return done ? [...regular, done] : regular;
  }, [statuses]);

  // For collision detection, we still need all statuses
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

  // Custom collision detection that works better for kanban columns
  const collisionDetection: CollisionDetection = (args) => {
    // First, check for pointer collisions with droppable columns
    const pointerCollisions = pointerWithin(args);

    if (pointerCollisions.length > 0) {
      // Prioritize column collisions over task collisions
      const columnCollision = pointerCollisions.find((collision) =>
        sortedStatuses.some((s) => s.id === collision.id),
      );
      if (columnCollision) {
        return [columnCollision];
      }
      return pointerCollisions;
    }

    // Fallback to rect intersection
    return rectIntersection(args);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task || null);
    setOverStatusId(null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !active) {
      setOverStatusId(null);
      return;
    }

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) {
      setOverStatusId(null);
      return;
    }

    const overId = over.id as string;
    let targetStatusId: string | null = null;

    // Check if over a column directly
    const isColumnDrop = sortedStatuses.some((s) => s.id === overId);
    if (isColumnDrop) {
      targetStatusId = overId;
    } else {
      // Over a task - find which column it belongs to
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) {
        targetStatusId = overTask.statusId;
      } else {
        // Task not found - might be hovering over empty space or self
        // Try to get the droppable container from the over data
        const containerId = over.data?.current?.sortable?.containerId;
        if (containerId && sortedStatuses.some((s) => s.id === containerId)) {
          targetStatusId = containerId;
        }
      }
    }

    // Only highlight if moving to a different status
    if (targetStatusId && targetStatusId !== activeTask.statusId) {
      setOverStatusId(targetStatusId);
    } else {
      setOverStatusId(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    setOverStatusId(null);

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
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex h-full">
          <div className="flex-1 flex overflow-x-auto gap-2 p-2">
            {sortedStatusesWithDoneLast.map((status, index) => (
              <KanbanColumn
                key={status.id}
                id={status.id}
                title={status.name}
                color={status.color}
                tasks={groupedTasks[status.id] || []}
                onTaskClick={onTaskClick}
                onAddTask={onAddTask}
                selectedTaskId={selectedTaskId}
                isHighlighted={overStatusId === status.id}
                isFirstColumn={index === 0}
                isCollapsed={collapsedColumns.has(status.id)}
                onToggleCollapse={() => toggleColumnCollapse(status.id)}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeTask ? (
            <TaskCard task={activeTask} onClick={() => {}} isDragging />
          ) : null}
        </DragOverlay>
      </DndContext>
    </>
  );
}
