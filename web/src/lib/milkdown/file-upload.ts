import type { Crepe } from "@milkdown/crepe";
import { editorViewCtx } from "@milkdown/core";
import { $prose } from "@milkdown/utils";
import { Plugin, PluginKey } from "@milkdown/prose/state";
import { api } from "../api";
import type { Asset, UploadRequest } from "../../types";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

interface UploadOptions {
  onProgress?: (percentage: number) => void;
  onError?: (error: string) => void;
  attachableType: string;
  attachableId: string;
}

/**
 * Handle a single file upload and insert into Milkdown editor.
 */
export async function handleFileUpload(
  crepe: Crepe,
  file: File,
  options: UploadOptions,
): Promise<Asset | null> {
  const { onProgress, onError, attachableType, attachableId } = options;

  if (file.size > MAX_FILE_SIZE) {
    const maxMB = MAX_FILE_SIZE / (1024 * 1024);
    onError?.(`File too large. Maximum size is ${maxMB} MB.`);
    return null;
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

    await uploadToR2(file, uploadRequest.uploadUrl, onProgress);
    const asset = await api.post<Asset>(`/assets/${uploadRequest.id}/confirm`);

    if (isImageFile(file.type)) {
      insertNode(crepe, "imageBlock", {
        assetId: asset.id,
        filename: asset.filename,
      });
    } else {
      insertNode(crepe, "fileAttachment", {
        assetId: asset.id,
        filename: asset.filename,
        contentType: asset.contentType,
        size: String(asset.sizeBytes),
      });
    }

    return asset;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Upload failed. Please try again.";
    onError?.(message);
    return null;
  }
}

/**
 * Handle multiple file uploads. Images are grouped into a grid if >1.
 */
export async function handleFilesUpload(
  crepe: Crepe,
  files: File[],
  options: UploadOptions,
): Promise<void> {
  const { onError, attachableType, attachableId } = options;

  const imageFiles = files.filter((f) => isImageFile(f.type));
  const otherFiles = files.filter((f) => !isImageFile(f.type));

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
      const asset = await api.post<Asset>(`/assets/${uploadRequest.id}/confirm`);
      imageAssets.push(asset);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : `Upload failed for ${file.name}`;
      onError?.(message);
    }
  }

  if (imageAssets.length === 1) {
    insertNode(crepe, "imageBlock", {
      assetId: imageAssets[0].id,
      filename: imageAssets[0].filename,
    });
  } else if (imageAssets.length > 1) {
    insertImageGrid(crepe, imageAssets);
  }

  for (const file of otherFiles) {
    await handleFileUpload(crepe, file, {
      ...options,
      attachableType,
      attachableId,
    });
  }
}

/**
 * Insert a node at the current cursor position.
 */
function insertNode(
  crepe: Crepe,
  nodeType: string,
  attrs: Record<string, string>,
) {
  crepe.editor.action((ctx) => {
    const view = ctx.get(editorViewCtx);
    const { state } = view;
    const type = state.schema.nodes[nodeType];
    if (!type) return;

    const node = type.create(attrs);
    const paragraph = state.schema.nodes.paragraph.create();

    const { $to } = state.selection;
    const insertPos = $to.after($to.depth);
    const tr = state.tr.insert(insertPos, [node, paragraph]);
    view.dispatch(tr);
  });
}

/**
 * Insert an image grid at the current cursor position.
 */
function insertImageGrid(crepe: Crepe, assets: Asset[]) {
  crepe.editor.action((ctx) => {
    const view = ctx.get(editorViewCtx);
    const { state } = view;
    const gridType = state.schema.nodes.imageGrid;
    const imageBlockType = state.schema.nodes.imageBlock;
    if (!gridType || !imageBlockType) return;

    const imageNodes = assets.map((asset) =>
      imageBlockType.create({
        assetId: asset.id,
        filename: asset.filename,
      }),
    );

    const gridNode = gridType.create(null, imageNodes);
    const paragraph = state.schema.nodes.paragraph.create();

    const { $to } = state.selection;
    const insertPos = $to.after($to.depth);
    const tr = state.tr.insert(insertPos, [gridNode, paragraph]);
    view.dispatch(tr);
  });
}

const pasteUploadPluginKey = new PluginKey("paste-upload");

/**
 * Creates a ProseMirror plugin that intercepts paste/drop events containing files
 * and uploads them via the asset pipeline instead of embedding as base64.
 */
export function createPasteUploadPlugin(
  crepeRef: { current: Crepe | null },
  configRef: {
    current: {
      attachableType: string;
      attachableId: string;
      onError: (msg: string) => void;
    } | null;
  },
) {
  return $prose(() => {
    return new Plugin({
      key: pasteUploadPluginKey,
      props: {
        handlePaste(_view, event) {
          const files = Array.from(event.clipboardData?.files || []);
          const crepe = crepeRef.current;
          const config = configRef.current;
          if (files.length === 0 || !crepe || !config) return false;

          const hasFiles = files.some(
            (f) => f.type.startsWith("image/") || f.size > 0,
          );
          if (!hasFiles) return false;

          handleFilesUpload(crepe, files, config);
          return true;
        },
        handleDrop(_view, event) {
          const files = Array.from(event.dataTransfer?.files || []);
          const crepe = crepeRef.current;
          const config = configRef.current;
          if (files.length === 0 || !crepe || !config) return false;

          event.preventDefault();
          handleFilesUpload(crepe, files, config);
          return true;
        },
      },
    });
  });
}

function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

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
