import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useToastStore } from "@/stores/toastStore";
import { AvatarUpload } from "@/components/ui/AvatarUpload";
import { getAssetUrl } from "@/lib/asset-cache";
import { Modal } from "@/components/ui/Modal";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, updateProfile } = useAuthStore();
  const { success, error: showError } = useToastStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarAssetId, setAvatarAssetId] = useState<string | null>(null);
  const [avatarDisplayUrl, setAvatarDisplayUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      setName(user.name);
      setEmail(user.email);
      setAvatarAssetId(user.avatar || null);
      setError(null);
    }
  }, [isOpen, user]);

  // Resolve avatar asset ID to presigned URL
  useEffect(() => {
    if (avatarAssetId) {
      getAssetUrl(avatarAssetId).then(setAvatarDisplayUrl).catch(() => setAvatarDisplayUrl(null));
    } else {
      setAvatarDisplayUrl(null);
    }
  }, [avatarAssetId]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const updates: { name?: string; email?: string; avatar?: string } = {};
      if (name !== user.name) updates.name = name;
      if (email !== user.email) updates.email = email;
      if (avatarAssetId !== user.avatar) updates.avatar = avatarAssetId || "";

      await updateProfile(updates);
      success("Profile updated successfully");
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update profile";
      setError(message);
      showError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = (asset: { id: string; url: string }) => {
    setAvatarAssetId(asset.id);
    // Set display URL immediately from the upload response
    if (asset.url) setAvatarDisplayUrl(asset.url);
  };

  const hasChanges =
    name !== user.name || email !== user.email || avatarAssetId !== user.avatar;

  return (
    <Modal title="Edit Profile" onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div className="flex justify-center">
          <AvatarUpload
            name={name || user.name}
            currentAvatarUrl={avatarDisplayUrl}
            onUploadComplete={handleAvatarUpload}
            onRemove={() => {
              setAvatarAssetId(null);
              setAvatarDisplayUrl(null);
            }}
            onError={(msg) => showError(msg)}
            size="lg"
            attachableType="user"
            attachableId={user.id}
          />
        </div>

        <div>
          <label
            htmlFor="profile-name"
            className="block text-sm font-medium text-dark-text mb-1"
          >
            Name
          </label>
          <input
            id="profile-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Your name"
            required
          />
        </div>

        <div>
          <label
            htmlFor="profile-email"
            className="block text-sm font-medium text-dark-text mb-1"
          >
            Email
          </label>
          <input
            id="profile-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="your@email.com"
            required
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-dark-bg hover:bg-dark-border text-dark-text transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!hasChanges || isLoading}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
