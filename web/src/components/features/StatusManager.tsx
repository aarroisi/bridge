import { useState, useRef, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  Undo2,
} from "lucide-react";
import { ListStatus, Task } from "@/types";
import { useListStore } from "@/stores/listStore";
import { clsx } from "clsx";

interface StatusManagerProps {
  listId: string;
  statuses: ListStatus[];
  tasks: Task[];
  onClose: () => void;
}

const STATUS_COLORS = [
  { name: "Gray", value: "#6b7280" },
  { name: "Red", value: "#ef4444" },
  { name: "Orange", value: "#f97316" },
  { name: "Yellow", value: "#eab308" },
  { name: "Green", value: "#22c55e" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Pink", value: "#ec4899" },
];

interface LocalStatus {
  id: string;
  name: string;
  color: string;
  position: number;
  isNew?: boolean;
  isDeleted?: boolean;
  isModified?: boolean;
}

export function StatusManager({
  listId,
  statuses,
  tasks,
  onClose,
}: StatusManagerProps) {
  const { createStatus, updateStatus, deleteStatus, reorderStatuses } =
    useListStore();

  // Local state for batched changes
  const [localStatuses, setLocalStatuses] = useState<LocalStatus[]>(() =>
    [...statuses]
      .sort((a, b) => a.position - b.position)
      .map((s) => ({
        ...s,
        isNew: false,
        isDeleted: false,
        isModified: false,
      })),
  );
  const [newStatusName, setNewStatusName] = useState("");
  const [newStatusColor, setNewStatusColor] = useState(STATUS_COLORS[0].value);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingColor, setEditingColor] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [showEditColorPicker, setShowEditColorPicker] = useState(false);
  const [showNewColorPicker, setShowNewColorPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const editColorRef = useRef<HTMLDivElement>(null);
  const newColorRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        editColorRef.current &&
        !editColorRef.current.contains(e.target as Node)
      ) {
        setShowEditColorPicker(false);
      }
      if (
        newColorRef.current &&
        !newColorRef.current.contains(e.target as Node)
      ) {
        setShowNewColorPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sortedLocalStatuses = [...localStatuses].sort(
    (a, b) => a.position - b.position,
  );

  const getTaskCountForStatus = (statusId: string) => {
    return tasks.filter((t) => t.statusId === statusId).length;
  };

  const hasChanges = () => {
    return localStatuses.some((s) => s.isNew || s.isDeleted || s.isModified);
  };

  const handleAddStatus = () => {
    if (!newStatusName.trim()) return;
    const newStatus: LocalStatus = {
      id: `new-${Date.now()}`,
      name: newStatusName.trim().toUpperCase(),
      color: newStatusColor,
      position: localStatuses.length,
      isNew: true,
      isDeleted: false,
      isModified: false,
    };
    setLocalStatuses([...localStatuses, newStatus]);
    setNewStatusName("");
    setNewStatusColor(STATUS_COLORS[0].value);
  };

  const handleStartEdit = (status: LocalStatus) => {
    setEditingId(status.id);
    setEditingName(status.name);
    setEditingColor(status.color);
    setShowEditColorPicker(false);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editingName.trim()) return;
    setLocalStatuses(
      localStatuses.map((s) =>
        s.id === editingId
          ? {
              ...s,
              name: editingName.trim().toUpperCase(),
              color: editingColor,
              isModified: !s.isNew,
            }
          : s,
      ),
    );
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
    setEditingColor("");
  };

  const handleDeleteClick = (id: string) => {
    const nonDeletedCount = localStatuses.filter((s) => !s.isDeleted).length;
    if (nonDeletedCount <= 1) {
      setErrorModal("Cannot delete the last status.");
      return;
    }

    const status = localStatuses.find((s) => s.id === id);
    if (!status) return;

    // For new statuses, just remove them
    if (status.isNew) {
      setLocalStatuses(localStatuses.filter((s) => s.id !== id));
      return;
    }

    // For existing statuses, check if they have tasks
    const taskCount = getTaskCountForStatus(id);
    if (taskCount > 0) {
      setErrorModal(
        `Cannot delete this status because it has ${taskCount} task${taskCount > 1 ? "s" : ""}. Move or delete the tasks first.`,
      );
      return;
    }

    // Mark for deletion
    setLocalStatuses(
      localStatuses.map((s) => (s.id === id ? { ...s, isDeleted: true } : s)),
    );
  };

  const handleUndoDelete = (id: string) => {
    setLocalStatuses(
      localStatuses.map((s) => (s.id === id ? { ...s, isDeleted: false } : s)),
    );
  };

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const activeStatuses = sortedLocalStatuses.filter((s) => !s.isDeleted);
    const activeIds = activeStatuses.map((s) => s.id);
    const draggedIndex = activeIds.indexOf(draggedId);
    const targetIndex = activeIds.indexOf(targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Reorder locally
    const newStatuses = [...localStatuses];
    const draggedStatus = newStatuses.find((s) => s.id === draggedId);
    const targetStatus = newStatuses.find((s) => s.id === targetId);

    if (draggedStatus && targetStatus) {
      const tempPosition = draggedStatus.position;
      draggedStatus.position = targetStatus.position;
      targetStatus.position = tempPosition;
      draggedStatus.isModified = !draggedStatus.isNew;
      targetStatus.isModified = !targetStatus.isNew;
    }

    setLocalStatuses(newStatuses);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      // Process deletions first
      for (const status of localStatuses.filter(
        (s) => s.isDeleted && !s.isNew,
      )) {
        await deleteStatus(status.id, listId);
      }

      // Process new statuses
      for (const status of localStatuses.filter(
        (s) => s.isNew && !s.isDeleted,
      )) {
        await createStatus(listId, {
          name: status.name,
          color: status.color,
        });
      }

      // Process updates
      for (const status of localStatuses.filter(
        (s) => s.isModified && !s.isNew && !s.isDeleted,
      )) {
        await updateStatus(status.id, {
          name: status.name,
          color: status.color,
        });
      }

      // Reorder if positions changed
      const finalStatuses = localStatuses
        .filter((s) => !s.isDeleted)
        .sort((a, b) => a.position - b.position);

      const originalOrder = [...statuses]
        .sort((a, b) => a.position - b.position)
        .map((s) => s.id);
      const newOrder = finalStatuses.filter((s) => !s.isNew).map((s) => s.id);

      if (JSON.stringify(originalOrder) !== JSON.stringify(newOrder)) {
        await reorderStatuses(listId, newOrder);
      }

      onClose();
    } catch {
      setErrorModal("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-surface border border-dark-border rounded-lg w-[480px] max-h-[80vh] flex flex-col">
        <div className="px-6 py-4 border-b border-dark-border flex items-center justify-between">
          <h3 className="font-semibold text-dark-text">Manage Statuses</h3>
          <button
            onClick={onClose}
            className="text-dark-text-muted hover:text-dark-text transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Existing Statuses */}
          <div className="space-y-2 mb-6">
            {sortedLocalStatuses.map((status) => (
              <div
                key={status.id}
                draggable={editingId !== status.id && !status.isDeleted}
                onDragStart={() => handleDragStart(status.id)}
                onDragOver={(e) => handleDragOver(e, status.id)}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                className={clsx(
                  "flex items-center gap-3 p-3 border rounded-lg transition-all",
                  status.isDeleted
                    ? "bg-red-500/10 border-red-500/30"
                    : "bg-dark-bg border-dark-border",
                  draggedId === status.id && "opacity-50",
                  status.isNew && !status.isDeleted && "border-green-500/50",
                  status.isModified &&
                    !status.isNew &&
                    !status.isDeleted &&
                    "border-yellow-500/50",
                )}
              >
                {status.isDeleted ? (
                  // Deleted status view
                  <>
                    <div className="text-dark-text-muted opacity-30">
                      <GripVertical size={16} />
                    </div>
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0 opacity-50"
                      style={{ backgroundColor: status.color }}
                    />
                    <span className="flex-1 text-dark-text-muted line-through">
                      {status.name}
                    </span>
                    <span className="text-xs text-red-400">
                      Will be deleted
                    </span>
                    <button
                      onClick={() => handleUndoDelete(status.id)}
                      className="p-1 text-blue-400 hover:text-blue-300 hover:bg-dark-surface rounded transition-colors"
                      title="Undo delete"
                    >
                      <Undo2 size={16} />
                    </button>
                  </>
                ) : editingId === status.id ? (
                  // Editing view
                  <>
                    <div className="text-dark-text-muted">
                      <GripVertical size={16} />
                    </div>
                    {/* Color dropdown */}
                    <div className="relative" ref={editColorRef}>
                      <button
                        onClick={() =>
                          setShowEditColorPicker(!showEditColorPicker)
                        }
                        className="flex items-center gap-1 p-1 hover:bg-dark-surface rounded transition-colors"
                      >
                        <div
                          className="w-5 h-5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: editingColor }}
                        />
                        <ChevronDown
                          size={14}
                          className="text-dark-text-muted"
                        />
                      </button>
                      {showEditColorPicker && (
                        <div className="absolute top-full left-0 mt-1 p-2 bg-dark-bg border border-dark-border rounded-lg shadow-lg z-10 w-[120px]">
                          <div className="grid grid-cols-4 gap-2">
                            {STATUS_COLORS.map((color) => (
                              <button
                                key={color.value}
                                onClick={() => {
                                  setEditingColor(color.value);
                                  setShowEditColorPicker(false);
                                }}
                                className={clsx(
                                  "w-6 h-6 rounded-full border-2 flex-shrink-0",
                                  editingColor === color.value
                                    ? "border-white"
                                    : "border-transparent hover:border-dark-text-muted",
                                )}
                                style={{ backgroundColor: color.value }}
                                title={color.name}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit();
                        if (e.key === "Escape") handleCancelEdit();
                      }}
                      className="flex-1 px-2 py-1 bg-dark-surface border border-dark-border rounded text-sm text-dark-text focus:outline-none focus:border-blue-500"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveEdit}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      OK
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 text-dark-text-muted text-sm hover:text-dark-text"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  // Normal view
                  <>
                    <div className="cursor-grab text-dark-text-muted hover:text-dark-text">
                      <GripVertical size={16} />
                    </div>
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: status.color }}
                    />
                    <span className="flex-1 text-dark-text">{status.name}</span>
                    <button
                      onClick={() => handleStartEdit(status)}
                      className="px-3 py-1 text-sm text-dark-text-muted hover:text-dark-text hover:bg-dark-surface rounded transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(status.id)}
                      className="p-1 text-dark-text-muted hover:text-red-500 transition-colors"
                      title="Delete status"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Add New Status */}
          <div className="border-t border-dark-border pt-6">
            <h4 className="text-sm font-medium text-dark-text mb-3">
              Add New Status
            </h4>
            <div className="flex items-center gap-3">
              {/* Color dropdown */}
              <div className="relative" ref={newColorRef}>
                <button
                  onClick={() => setShowNewColorPicker(!showNewColorPicker)}
                  className="flex items-center gap-1 p-2 bg-dark-bg border border-dark-border rounded hover:border-dark-text-muted transition-colors"
                >
                  <div
                    className="w-5 h-5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: newStatusColor }}
                  />
                  <ChevronDown size={14} className="text-dark-text-muted" />
                </button>
                {showNewColorPicker && (
                  <div className="absolute bottom-full left-0 mb-1 p-2 bg-dark-bg border border-dark-border rounded-lg shadow-lg z-10 w-[120px]">
                    <div className="grid grid-cols-4 gap-2">
                      {STATUS_COLORS.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => {
                            setNewStatusColor(color.value);
                            setShowNewColorPicker(false);
                          }}
                          className={clsx(
                            "w-6 h-6 rounded-full border-2 flex-shrink-0",
                            newStatusColor === color.value
                              ? "border-white"
                              : "border-transparent hover:border-dark-text-muted",
                          )}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <input
                type="text"
                value={newStatusName}
                onChange={(e) => setNewStatusName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddStatus()}
                placeholder="Status name"
                className="flex-1 px-3 py-2 bg-dark-bg border border-dark-border rounded text-sm text-dark-text placeholder:text-dark-text-muted focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleAddStatus}
                disabled={!newStatusName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer with Save button */}
        <div className="px-6 py-4 border-t border-dark-border flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-dark-text-muted hover:text-dark-text transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveAll}
            disabled={!hasChanges() || isSaving}
            className={clsx(
              "px-4 py-2 rounded font-medium transition-colors",
              hasChanges()
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-dark-bg text-dark-text-muted cursor-not-allowed",
            )}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Error Modal */}
      {errorModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]"
          onClick={() => setErrorModal(null)}
        >
          <div
            className="bg-dark-surface border border-dark-border rounded-lg p-6 w-full max-w-sm shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-dark-text mb-2">
              Cannot Delete
            </h3>
            <p className="text-sm text-dark-text-muted mb-4">{errorModal}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setErrorModal(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
