import { useState } from "react";
import { X, Plus, Trash2, GripVertical } from "lucide-react";
import { ListStatus } from "@/types";
import { useListStore } from "@/stores/listStore";
import { clsx } from "clsx";

interface StatusManagerProps {
  listId: string;
  statuses: ListStatus[];
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

export function StatusManager({
  listId,
  statuses,
  onClose,
}: StatusManagerProps) {
  const { createStatus, updateStatus, deleteStatus, reorderStatuses } =
    useListStore();
  const [newStatusName, setNewStatusName] = useState("");
  const [newStatusColor, setNewStatusColor] = useState(STATUS_COLORS[0].value);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingColor, setEditingColor] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const sortedStatuses = [...statuses].sort((a, b) => a.position - b.position);

  const handleAddStatus = async () => {
    if (!newStatusName.trim()) return;
    await createStatus(listId, {
      name: newStatusName.trim(),
      color: newStatusColor,
    });
    setNewStatusName("");
    setNewStatusColor(STATUS_COLORS[0].value);
  };

  const handleStartEdit = (status: ListStatus) => {
    setEditingId(status.id);
    setEditingName(status.name);
    setEditingColor(status.color);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editingName.trim()) return;
    await updateStatus(editingId, {
      name: editingName.trim(),
      color: editingColor,
    });
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
    setEditingColor("");
  };

  const handleDelete = async (id: string) => {
    if (sortedStatuses.length <= 1) {
      alert("Cannot delete the last status");
      return;
    }
    if (confirm("Delete this status? Tasks will be moved to the first status.")) {
      await deleteStatus(id, listId);
    }
  };

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const currentOrder = sortedStatuses.map((s) => s.id);
    const draggedIndex = currentOrder.indexOf(draggedId);
    const targetIndex = currentOrder.indexOf(targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Reorder locally for visual feedback
    const newOrder = [...currentOrder];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedId);

    // We'll commit on drop
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    const currentOrder = sortedStatuses.map((s) => s.id);
    const draggedIndex = currentOrder.indexOf(draggedId);
    const targetIndex = currentOrder.indexOf(targetId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedId(null);
      return;
    }

    const newOrder = [...currentOrder];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedId);

    await reorderStatuses(listId, newOrder);
    setDraggedId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
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
            {sortedStatuses.map((status) => (
              <div
                key={status.id}
                draggable={editingId !== status.id}
                onDragStart={() => handleDragStart(status.id)}
                onDragOver={(e) => handleDragOver(e, status.id)}
                onDrop={(e) => handleDrop(e, status.id)}
                onDragEnd={handleDragEnd}
                className={clsx(
                  "flex items-center gap-3 p-3 bg-dark-bg border border-dark-border rounded-lg",
                  draggedId === status.id && "opacity-50",
                )}
              >
                <div className="cursor-grab text-dark-text-muted hover:text-dark-text">
                  <GripVertical size={16} />
                </div>

                {editingId === status.id ? (
                  <>
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1 px-2 py-1 bg-dark-surface border border-dark-border rounded text-sm text-dark-text focus:outline-none focus:border-blue-500"
                      autoFocus
                    />
                    <div className="flex gap-1">
                      {STATUS_COLORS.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => setEditingColor(color.value)}
                          className={clsx(
                            "w-6 h-6 rounded-full border-2",
                            editingColor === color.value
                              ? "border-white"
                              : "border-transparent",
                          )}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                    <button
                      onClick={handleSaveEdit}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 text-dark-text-muted text-sm hover:text-dark-text"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
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
                      onClick={() => handleDelete(status.id)}
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
              <input
                type="text"
                value={newStatusName}
                onChange={(e) => setNewStatusName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddStatus()}
                placeholder="Status name"
                className="flex-1 px-3 py-2 bg-dark-bg border border-dark-border rounded text-sm text-dark-text placeholder:text-dark-text-muted focus:outline-none focus:border-blue-500"
              />
              <div className="flex gap-1">
                {STATUS_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setNewStatusColor(color.value)}
                    className={clsx(
                      "w-6 h-6 rounded-full border-2",
                      newStatusColor === color.value
                        ? "border-white"
                        : "border-transparent",
                    )}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
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
      </div>
    </div>
  );
}
