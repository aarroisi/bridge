import { useState, useCallback } from "react";
import { api } from "../lib/api";
import type { Asset, AssetType, UploadRequest } from "../types";

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadOptions {
  assetType: AssetType;
  onProgress?: (progress: UploadProgress) => void;
}

export interface UseFileUploadReturn {
  upload: (file: File, options: UploadOptions) => Promise<Asset>;
  isUploading: boolean;
  progress: UploadProgress | null;
  error: string | null;
  reset: () => void;
}

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export function useFileUpload(): UseFileUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(null);
    setError(null);
  }, []);

  const upload = useCallback(
    async (file: File, options: UploadOptions): Promise<Asset> => {
      const { assetType, onProgress } = options;

      // Validate file size
      const maxSize = assetType === "avatar" ? MAX_AVATAR_SIZE : MAX_FILE_SIZE;
      if (file.size > maxSize) {
        const maxMB = maxSize / (1024 * 1024);
        throw new Error(`File too large. Maximum size is ${maxMB} MB.`);
      }

      setIsUploading(true);
      setProgress(null);
      setError(null);

      try {
        // Step 1: Request presigned upload URL from backend
        const uploadRequest = await api.post<UploadRequest>(
          "/assets/request-upload",
          {
            filename: file.name,
            contentType: file.type,
            sizeBytes: file.size,
            assetType,
          }
        );

        // Step 2: Upload directly to R2 using presigned URL
        await uploadToR2(file, uploadRequest.uploadUrl, (prog) => {
          setProgress(prog);
          onProgress?.(prog);
        });

        // Step 3: Confirm upload completion
        const asset = await api.post<Asset>(
          `/assets/${uploadRequest.id}/confirm`
        );

        setIsUploading(false);
        setProgress({ loaded: file.size, total: file.size, percentage: 100 });

        return asset;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Upload failed. Please try again.";
        setError(message);
        setIsUploading(false);
        throw err;
      }
    },
    []
  );

  return { upload, isUploading, progress, error, reset };
}

/**
 * Uploads a file directly to R2 using the presigned URL.
 * Uses XMLHttpRequest for progress tracking.
 */
async function uploadToR2(
  file: File,
  uploadUrl: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress({
          loaded: event.loaded,
          total: event.total,
          percentage: Math.round((event.loaded / event.total) * 100),
        });
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Network error during upload"));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Upload was cancelled"));
    });

    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.send(file);
  });
}

/**
 * Helper to get a presigned download URL for an asset.
 */
export async function getAssetUrl(assetId: string): Promise<string> {
  const asset = await api.get<Asset>(`/assets/${assetId}`);
  return asset.url || "";
}

/**
 * Helper to delete an asset.
 */
export async function deleteAsset(assetId: string): Promise<void> {
  await api.delete(`/assets/${assetId}`);
}

/**
 * Helper to get storage usage for the workspace.
 */
export async function getStorageUsage() {
  return api.get<{
    usedBytes: number;
    quotaBytes: number;
    availableBytes: number;
  }>("/workspace/storage");
}

/**
 * Format bytes to human readable string.
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
