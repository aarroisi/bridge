import { Editor } from "@tiptap/core";
import { api } from "../api";
import type { Asset, UploadRequest } from "../../types";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

interface UploadOptions {
  onProgress?: (percentage: number) => void;
  onError?: (error: string) => void;
  /** The type of item this file is attached to (doc, message, user) */
  attachableType: "doc" | "message" | "user";
  /** The ID of the item this file is attached to */
  attachableId: string;
}

/**
 * Handles file uploads for TipTap editor.
 * - Images are inserted as Image nodes (displayed inline)
 * - Other files are inserted as FileAttachment nodes (displayed as download links)
 */
export async function handleFileUpload(
  editor: Editor,
  file: File,
  options: UploadOptions,
): Promise<void> {
  const { onProgress, onError, attachableType, attachableId } = options;

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    const maxMB = MAX_FILE_SIZE / (1024 * 1024);
    onError?.(`File too large. Maximum size is ${maxMB} MB.`);
    return;
  }

  try {
    // Step 1: Request presigned upload URL
    const uploadRequest = await api.post<UploadRequest>(
      "/assets/request-upload",
      {
        filename: file.name,
        contentType: file.type,
        sizeBytes: file.size,
        assetType: "file",
        attachableType,
        attachableId,
      },
    );

    // Step 2: Upload directly to R2
    await uploadToR2(file, uploadRequest.uploadUrl, onProgress);

    // Step 3: Confirm upload
    const asset = await api.post<Asset>(`/assets/${uploadRequest.id}/confirm`);

    // Step 4: Insert into editor based on file type
    // Use insertContent to insert at current position, then create a new paragraph
    if (isImageFile(file.type)) {
      // Insert as image block (stores asset ID, fetches URL on render)
      editor
        .chain()
        .focus()
        .insertContent([
          {
            type: "imageBlock",
            attrs: {
              assetId: asset.id,
              filename: asset.filename,
            },
          },
          {
            type: "paragraph",
          },
        ])
        .run();
    } else {
      // Insert as file attachment (stores asset ID, fetches URL on render)
      editor
        .chain()
        .focus()
        .insertContent([
          {
            type: "fileAttachment",
            attrs: {
              assetId: asset.id,
              filename: asset.filename,
              contentType: asset.contentType,
              size: asset.sizeBytes,
            },
          },
          {
            type: "paragraph",
          },
        ])
        .run();
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Upload failed. Please try again.";
    onError?.(message);
  }
}

/**
 * Handles multiple file uploads for TipTap editor.
 * Images are grouped into a grid (max 3 columns), other files are inserted individually.
 */
export async function handleFilesUpload(
  editor: Editor,
  files: File[],
  options: UploadOptions,
): Promise<void> {
  const { onError, attachableType, attachableId } = options;

  // Separate images from other files
  const imageFiles = files.filter((f) => isImageFile(f.type));
  const otherFiles = files.filter((f) => !isImageFile(f.type));

  // Upload all images and collect their assets
  const imageAssets: Asset[] = [];
  for (const file of imageFiles) {
    if (file.size > MAX_FILE_SIZE) {
      const maxMB = MAX_FILE_SIZE / (1024 * 1024);
      onError?.(`File "${file.name}" too large. Maximum size is ${maxMB} MB.`);
      continue;
    }

    try {
      const uploadRequest = await api.post<UploadRequest>(
        "/assets/request-upload",
        {
          filename: file.name,
          contentType: file.type,
          sizeBytes: file.size,
          assetType: "file",
          attachableType,
          attachableId,
        },
      );

      await uploadToR2(file, uploadRequest.uploadUrl, options.onProgress);

      const asset = await api.post<Asset>(
        `/assets/${uploadRequest.id}/confirm`,
      );
      imageAssets.push(asset);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : `Upload failed for ${file.name}`;
      onError?.(message);
    }
  }

  // Insert images as a grid if multiple, or single block if one
  if (imageAssets.length > 0) {
    if (imageAssets.length === 1) {
      // Single image - insert normally
      editor
        .chain()
        .focus()
        .insertContent([
          {
            type: "imageBlock",
            attrs: {
              assetId: imageAssets[0].id,
              filename: imageAssets[0].filename,
            },
          },
          { type: "paragraph" },
        ])
        .run();
    } else {
      // Multiple images - insert as grid
      const gridContent = imageAssets.map((asset) => ({
        type: "imageBlock",
        attrs: {
          assetId: asset.id,
          filename: asset.filename,
        },
      }));

      editor
        .chain()
        .focus()
        .insertContent([
          {
            type: "imageGrid",
            content: gridContent,
          },
          { type: "paragraph" },
        ])
        .run();
    }
  }

  // Upload and insert other files individually
  for (const file of otherFiles) {
    await handleFileUpload(editor, file, options);
  }
}

/**
 * Check if the file is an image.
 */
function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

/**
 * Upload file directly to R2 using presigned URL.
 */
async function uploadToR2(
  file: File,
  uploadUrl: string,
  onProgress?: (percentage: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        const percentage = Math.round((event.loaded / event.total) * 100);
        onProgress(percentage);
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

    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.send(file);
  });
}
