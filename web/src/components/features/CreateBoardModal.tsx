import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
}

export function CreateBoardModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateBoardModalProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setName("");
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    onSubmit(name.trim());
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <Modal title="Create Board" onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label
            htmlFor="board-name"
            className="block text-sm font-medium text-dark-text mb-1"
          >
            Name <span className="text-red-400">*</span>
          </label>
          <input
            id="board-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter board name"
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            autoFocus
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-dark-text hover:bg-dark-hover rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim() || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create Board"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
