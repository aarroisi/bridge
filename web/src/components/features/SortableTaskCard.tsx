import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskCard } from "./TaskCard";
import { Task } from "@/types";

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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard
        task={task}
        onClick={onClick}
        isSelected={isSelected}
        isDragging={isDragging}
      />
    </div>
  );
}
