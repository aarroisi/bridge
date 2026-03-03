import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useToastStore } from "@/stores/toastStore";
import { StorageUsage } from "@/components/features/StorageUsage";
import { useFileUpload, formatBytes } from "@/hooks/useFileUpload";
import { getAssetUrl } from "@/lib/asset-cache";
import { Camera, Loader2, X } from "lucide-react";

const MAX_LOGO_SIZE = 5 * 1024 * 1024; // 5 MB

export function GeneralSettingsPage() {
  const { workspace, updateWorkspace } = useAuthStore();
  const { success, error } = useToastStore();

  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { upload, isUploading, progress } = useFileUpload();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [resolvedLogoUrl, setResolvedLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (workspace) {
      setName(workspace.name);
    }
  }, [workspace]);

  useEffect(() => {
    if (workspace) {
      setHasChanges(name !== workspace.name);
    }
  }, [name, workspace]);

  // Resolve logo asset ID to presigned URL
  useEffect(() => {
    if (workspace?.logo) {
      getAssetUrl(workspace.logo).then(setResolvedLogoUrl).catch(() => setResolvedLogoUrl(null));
    } else {
      setResolvedLogoUrl(null);
    }
  }, [workspace?.logo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasChanges) return;

    setIsLoading(true);
    try {
      await updateWorkspace({ name });
      success("Workspace settings updated");
    } catch (err) {
      error("Failed to update settings: " + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";

    if (!file.type.startsWith("image/")) {
      error("Please select an image file (JPG, PNG, GIF, etc.)");
      return;
    }

    if (file.size > MAX_LOGO_SIZE) {
      error(`Image is too large. Maximum size is ${formatBytes(MAX_LOGO_SIZE)}.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setLogoPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const asset = await upload(file, {
        assetType: "avatar",
        attachableType: "workspace",
        attachableId: workspace!.id,
      });
      await updateWorkspace({ logo: asset.id });
      success("Logo updated");
    } catch (err) {
      setLogoPreview(null);
      error(err instanceof Error ? err.message : "Failed to upload logo");
    }
  };

  const handleRemoveLogo = async () => {
    try {
      await updateWorkspace({ logo: null });
      setLogoPreview(null);
      success("Logo removed");
    } catch (err) {
      error("Failed to remove logo: " + (err as Error).message);
    }
  };

  const displayLogo = logoPreview || resolvedLogoUrl;

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold text-dark-text mb-2">
        General Settings
      </h1>
      <p className="text-dark-text-muted mb-8">
        Manage your workspace's basic information.
      </p>

      {/* Workspace Logo */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-dark-text mb-3">
          Workspace Logo
        </label>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleLogoClick}
            disabled={isUploading}
            className="relative w-20 h-20 rounded-lg overflow-hidden bg-dark-surface border border-dark-border hover:border-blue-500 transition-colors cursor-pointer group flex items-center justify-center"
          >
            {displayLogo ? (
              <img
                src={displayLogo}
                alt="Workspace logo"
                className="w-full h-full object-contain"
              />
            ) : (
              <Camera className="text-dark-text-muted" size={24} />
            )}

            {!isUploading && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="text-white" size={24} />
              </div>
            )}

            {isUploading && progress && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                <Loader2 className="text-white animate-spin" size={24} />
                <span className="text-white text-xs mt-1">{progress.percentage}%</span>
              </div>
            )}
          </button>

          <div className="flex flex-col gap-1">
            <p className="text-sm text-dark-text-muted">
              Click to upload (max {formatBytes(MAX_LOGO_SIZE)})
            </p>
            {displayLogo && (
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="text-sm text-red-400 hover:text-red-300 text-left flex items-center gap-1"
              >
                <X size={14} />
                Remove logo
              </button>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleLogoChange}
          className="hidden"
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Workspace Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-dark-text mb-2"
          >
            Workspace Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="My Workspace"
            required
          />
          <p className="mt-1 text-sm text-dark-text-muted">
            This is the display name for your workspace.
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={!hasChanges || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>

      {/* Storage Usage Section */}
      <div className="mt-12">
        <h2 className="text-lg font-semibold text-dark-text mb-2">
          Storage Usage
        </h2>
        <p className="text-dark-text-muted mb-4">
          Track how much storage your workspace is using for uploaded files and
          images.
        </p>
        <StorageUsage />
      </div>
    </div>
  );
}
