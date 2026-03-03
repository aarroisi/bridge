import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { TaskCard } from "./TaskCard";
import { Task } from "@/types";
import { useIsMobile } from "@/hooks/useIsMobile";

interface SortableTaskCardProps {
  task: Task;
  onClick: () => void;
  isSelected?: boolean;
}

export function SortableTaskCard({
  task,
  onClick,
  isSelected,
}: SortableTaskCardProps) {
  const isMobile = useIsMobile();
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const mobileDragHandle = isMobile ? (
    <div
      ref={setActivatorNodeRef}
      {...listeners}
      className="flex items-center text-dark-text-muted touch-none flex-shrink-0 -mr-1"
    >
      <GripVertical size={18} />
    </div>
  ) : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(isMobile ? {} : listeners)}
    >
      <TaskCard
        task={task}
        onClick={onClick}
        isSelected={isSelected}
        isDragging={isDragging}
        dragHandle={mobileDragHandle}
      />
    </div>
  );
}
