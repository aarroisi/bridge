import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, ChevronDown } from "lucide-react";
import { clsx } from "clsx";
import { api } from "@/lib/api";
import { User, Role } from "@/types";
import { useAuthStore } from "@/stores/authStore";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { Avatar } from "@/components/ui/Avatar";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { toast } from "@/components/ui/Toast";

interface WorkspaceMember extends User {
  role: Role;
}

export function WorkspaceMembersPage() {
  const navigate = useNavigate();
  const { user: currentUser, isOwner } = useAuthStore();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<WorkspaceMember | null>(
    null,
  );
  const [roleDropdownOpen, setRoleDropdownOpen] = useState<string | null>(null);

  // Redirect non-owners
  useEffect(() => {
    if (!isOwner()) {
      navigate("/");
    }
  }, [isOwner, navigate]);

  // Fetch members
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await api.get<WorkspaceMember[]>("/workspace/members");
        setMembers(response);
      } catch (error) {
        console.error("Failed to fetch members:", error);
        toast.error("Failed to load workspace members");
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  const handleRoleChange = async (memberId: string, newRole: Role) => {
    try {
      await api.put(`/workspace/members/${memberId}`, {
        user: { role: newRole },
      });
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)),
      );
      setRoleDropdownOpen(null);
      toast.success("Role updated successfully");
    } catch (error) {
      console.error("Failed to update role:", error);
      toast.error("Failed to update role");
    }
  };

  const handleDeleteMember = async () => {
    if (!memberToDelete) return;

    try {
      await api.delete(`/workspace/members/${memberToDelete.id}`);
      setMembers((prev) => prev.filter((m) => m.id !== memberToDelete.id));
      setMemberToDelete(null);
      toast.success("Member removed successfully");
    } catch (error) {
      console.error("Failed to remove member:", error);
      toast.error("Failed to remove member");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-dark-text-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-dark-bg overflow-auto">
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-dark-text">
              Workspace Members
            </h1>
            <p className="text-dark-text-muted mt-1">
              Manage who has access to your workspace
            </p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            Invite Member
          </button>
        </div>

        <div className="bg-dark-surface rounded-lg border border-dark-border">
          <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-dark-border text-sm font-medium text-dark-text-muted">
            <div className="col-span-5">Member</div>
            <div className="col-span-3">Role</div>
            <div className="col-span-3">Joined</div>
            <div className="col-span-1"></div>
          </div>

          {members.map((member) => (
            <div
              key={member.id}
              className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-dark-border last:border-b-0 items-center"
            >
              <div className="col-span-5 flex items-center gap-3">
                <Avatar name={member.name} size="md" />
                <div>
                  <div className="text-dark-text font-medium flex items-center gap-2">
                    {member.name}
                    {member.id === currentUser?.id && (
                      <span className="text-xs text-dark-text-muted">
                        (you)
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-dark-text-muted">
                    {member.email}
                  </div>
                </div>
              </div>

              <div className="col-span-3 relative">
                {member.id === currentUser?.id ? (
                  <RoleBadge role={member.role} />
                ) : (
                  <div className="relative">
                    <button
                      onClick={() =>
                        setRoleDropdownOpen(
                          roleDropdownOpen === member.id ? null : member.id,
                        )
                      }
                      className="flex items-center gap-1 hover:bg-dark-hover rounded px-2 py-1 transition-colors"
                    >
                      <RoleBadge role={member.role} />
                      <ChevronDown size={14} className="text-dark-text-muted" />
                    </button>

                    {roleDropdownOpen === member.id && (
                      <div className="absolute top-full left-0 mt-1 bg-dark-surface border border-dark-border rounded-lg shadow-lg z-10 py-1 min-w-[120px]">
                        {(["owner", "member", "guest"] as Role[]).map(
                          (role) => (
                            <button
                              key={role}
                              onClick={() => handleRoleChange(member.id, role)}
                              className={clsx(
                                "w-full px-3 py-2 text-left text-sm hover:bg-dark-hover transition-colors",
                                member.role === role
                                  ? "text-blue-400"
                                  : "text-dark-text",
                              )}
                            >
                              {role.charAt(0).toUpperCase() + role.slice(1)}
                            </button>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="col-span-3 text-sm text-dark-text-muted">
                {new Date(member.insertedAt).toLocaleDateString()}
              </div>

              <div className="col-span-1 flex justify-end">
                {member.id !== currentUser?.id && (
                  <button
                    onClick={() => setMemberToDelete(member)}
                    className="p-2 text-dark-text-muted hover:text-red-400 hover:bg-dark-hover rounded transition-colors"
                    title="Remove member"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}

          {members.length === 0 && (
            <div className="px-4 py-8 text-center text-dark-text-muted">
              No members found
            </div>
          )}
        </div>
      </div>

      {showInviteModal && (
        <InviteMemberModal
          onClose={() => setShowInviteModal(false)}
          onInvite={(newMember) => {
            setMembers((prev) => [...prev, newMember]);
            setShowInviteModal(false);
          }}
        />
      )}

      <ConfirmModal
        isOpen={!!memberToDelete}
        onCancel={() => setMemberToDelete(null)}
        onConfirm={handleDeleteMember}
        title="Remove Member"
        message={`Are you sure you want to remove ${memberToDelete?.name} from this workspace? They will lose access to all workspace content.`}
        confirmText="Remove"
        confirmVariant="danger"
      />
    </div>
  );
}

interface InviteMemberModalProps {
  onClose: () => void;
  onInvite: (member: WorkspaceMember) => void;
}

function InviteMemberModal({ onClose, onInvite }: InviteMemberModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("member");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post<WorkspaceMember>("/workspace/members", {
        user: { name, email, password, role },
      });
      onInvite(response);
      toast.success("Member invited successfully");
    } catch (err: any) {
      const errorMessage =
        err?.errors?.email?.[0] || err?.message || "Failed to invite member";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-surface border border-dark-border rounded-lg w-full max-w-md p-6">
        <h2 className="text-xl font-semibold text-dark-text mb-4">
          Invite New Member
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="invite-name"
              className="block text-sm font-medium text-dark-text mb-1"
            >
              Name
            </label>
            <input
              id="invite-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label
              htmlFor="invite-email"
              className="block text-sm font-medium text-dark-text mb-1"
            >
              Email
            </label>
            <input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label
              htmlFor="invite-password"
              className="block text-sm font-medium text-dark-text mb-1"
            >
              Password
            </label>
            <input
              id="invite-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength={6}
            />
          </div>

          <div>
            <label
              htmlFor="invite-role"
              className="block text-sm font-medium text-dark-text mb-1"
            >
              Role
            </label>
            <select
              id="invite-role"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="owner">Owner - Full access</option>
              <option value="member">Member - Assigned projects only</option>
              <option value="guest">Guest - One project only</option>
            </select>
          </div>

          {error && <div className="text-red-400 text-sm">{error}</div>}

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
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Inviting..." : "Invite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
