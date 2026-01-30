import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { api } from "@/lib/api";
import { User } from "@/types";
import { useAuthStore } from "@/stores/authStore";
import { Avatar } from "@/components/ui/Avatar";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description?: string;
    memberIds: string[];
  }) => void;
}

export function CreateProjectModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateProjectModalProps) {
  const { isOwner } = useAuthStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [workspaceMembers, setWorkspaceMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch workspace members for selection (only for owners)
  useEffect(() => {
    if (isOpen && isOwner()) {
      const fetchMembers = async () => {
        try {
          const members = await api.get<User[]>("/workspace/members");
          // Filter out owners - they have access to all projects anyway
          const nonOwners = members.filter((m) => m.role !== "owner");
          setWorkspaceMembers(nonOwners);
        } catch (error) {
          console.error("Failed to fetch members:", error);
        }
      };
      fetchMembers();
    }
  }, [isOpen, isOwner]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setName("");
      setDescription("");
      setSelectedMemberIds([]);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      memberIds: selectedMemberIds,
    });
    setLoading(false);
  };

  const toggleMember = (memberId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId],
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-surface border border-dark-border rounded-lg w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-dark-text">
            Create Project
          </h2>
          <button
            onClick={onClose}
            className="text-dark-text-muted hover:text-dark-text transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="project-name"
              className="block text-sm font-medium text-dark-text mb-1"
            >
              Name <span className="text-red-400">*</span>
            </label>
            <input
              id="project-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              autoFocus
            />
          </div>

          <div>
            <label
              htmlFor="project-description"
              className="block text-sm font-medium text-dark-text mb-1"
            >
              Description
            </label>
            <textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter project description (optional)"
              rows={3}
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {isOwner() && workspaceMembers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-dark-text mb-2">
                Add Members
              </label>
              <p className="text-xs text-dark-text-muted mb-2">
                Select members who should have access to this project. Owners
                automatically have access to all projects.
              </p>
              <div className="max-h-48 overflow-y-auto border border-dark-border rounded-lg bg-dark-bg">
                {workspaceMembers.map((member) => (
                  <label
                    key={member.id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-dark-hover cursor-pointer border-b border-dark-border last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMemberIds.includes(member.id)}
                      onChange={() => toggleMember(member.id)}
                      className="w-4 h-4 rounded border-dark-border bg-dark-bg text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                    />
                    <Avatar name={member.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-dark-text truncate">
                        {member.name}
                      </div>
                      <div className="text-xs text-dark-text-muted truncate">
                        {member.email}
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        member.role === "member"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {member.role === "member" ? "Member" : "Guest"}
                    </span>
                  </label>
                ))}
              </div>
              {selectedMemberIds.length > 0 && (
                <p className="text-xs text-dark-text-muted mt-2">
                  {selectedMemberIds.length} member
                  {selectedMemberIds.length !== 1 ? "s" : ""} selected
                </p>
              )}
            </div>
          )}

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
              {loading ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
