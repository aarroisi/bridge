import { useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { clsx } from "clsx";
import { Avatar } from "./Avatar";
import { useFileUpload, formatBytes } from "../../hooks/useFileUpload";

interface AvatarUploadProps {
  name: string;
  currentAvatarUrl?: string | null;
  onUploadComplete: (asset: { id: string; url: string }) => void;
  onError?: (error: string) => void;
  size?: "md" | "lg" | "xl";
}

const sizeClasses = {
  md: "w-16 h-16",
  lg: "w-24 h-24",
  xl: "w-32 h-32",
};

const avatarSizeMap = {
  md: "lg" as const,
  lg: "lg" as const,
  xl: "lg" as const,
};

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 MB

export function AvatarUpload({
  name,
  currentAvatarUrl,
  onUploadComplete,
  onError,
  size = "lg",
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { upload, isUploading, progress } = useFileUpload();

  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be selected again
    e.target.value = "";

    // Validate file type
    if (!file.type.startsWith("image/")) {
      onError?.("Please select an image file (JPG, PNG, GIF, etc.)");
      return;
    }

    // Validate file size
    if (file.size > MAX_AVATAR_SIZE) {
      const maxSize = formatBytes(MAX_AVATAR_SIZE);
      onError?.(`Image is too large. Maximum size is ${maxSize}.`);
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const asset = await upload(file, { assetType: "avatar" });
      onUploadComplete({ id: asset.id, url: asset.url || "" });
    } catch (err) {
      // Clear preview on error
      setPreviewUrl(null);
      const message =
        err instanceof Error ? err.message : "Failed to upload avatar";
      onError?.(message);
    }
  };

  const handleClearPreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
  };

  const displayUrl = previewUrl || currentAvatarUrl;

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={handleClick}
        disabled={isUploading}
        className={clsx(
          "relative rounded-full overflow-hidden group cursor-pointer transition-opacity",
          sizeClasses[size],
          isUploading && "opacity-75 cursor-not-allowed"
        )}
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Avatar name={name} size={avatarSizeMap[size]} className="w-full h-full" />
        )}

        {/* Overlay on hover */}
        {!isUploading && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="text-white" size={size === "xl" ? 32 : 24} />
          </div>
        )}

        {/* Upload progress overlay */}
        {isUploading && progress && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
            <Loader2
              className="text-white animate-spin"
              size={size === "xl" ? 32 : 24}
            />
            <span className="text-white text-xs mt-1">{progress.percentage}%</span>
          </div>
        )}
      </button>

      {/* Clear preview button */}
      {previewUrl && !isUploading && (
        <button
          type="button"
          onClick={handleClearPreview}
          className="absolute -top-1 -right-1 p-1 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
          title="Clear preview"
        >
          <X size={12} />
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <p className="text-xs text-dark-text-muted mt-2 text-center">
        Click to upload (max {formatBytes(MAX_AVATAR_SIZE)})
      </p>
    </div>
  );
}
