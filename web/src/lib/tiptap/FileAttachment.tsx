import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  NodeViewProps,
} from "@tiptap/react";
import { useState, useEffect } from "react";
import { X, Download, FileIcon } from "lucide-react";
import { api } from "../api";

// Cache for asset URLs to avoid duplicate requests
const assetUrlCache = new Map<string, { url: string; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes (less than presigned URL expiry)

export interface FileAttachmentOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fileAttachment: {
      setFileAttachment: (options: {
        assetId: string;
        filename: string;
        contentType: string;
        size: number;
        caption?: string;
      }) => ReturnType;
    };
  }
}

function FileAttachmentComponent({
  node,
  deleteNode,
  selected,
  editor,
}: NodeViewProps) {
  const { assetId, filename, contentType, size } = node.attrs as {
    assetId: string;
    filename: string;
    contentType: string;
    size: number;
  };
  const [isHovered, setIsHovered] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Track editable state to force re-render when it changes
  const [isEditable, setIsEditable] = useState(editor.isEditable);

  const icon = getFileIcon(contentType);
  const sizeStr = formatFileSize(size);

  // Listen for editor editable state changes
  useEffect(() => {
    const updateEditable = () => {
      setIsEditable(editor.isEditable);
    };

    editor.on("update", updateEditable);
    // Also check on transaction to catch setEditable calls
    const checkEditable = () => {
      if (editor.isEditable !== isEditable) {
        setIsEditable(editor.isEditable);
      }
    };
    editor.on("transaction", checkEditable);

    return () => {
      editor.off("update", updateEditable);
      editor.off("transaction", checkEditable);
    };
  }, [editor, isEditable]);

  // Fetch presigned URL for the asset
  useEffect(() => {
    if (!assetId) {
      setError("No asset ID");
      setIsLoading(false);
      return;
    }

    // Check cache first
    const cached = assetUrlCache.get(assetId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setFileUrl(cached.url);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchUrl = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const asset = await api.get<{ url: string }>(`/assets/${assetId}`);
        if (!cancelled && asset.url) {
          // Cache the URL
          assetUrlCache.set(assetId, { url: asset.url, timestamp: Date.now() });
          setFileUrl(asset.url);
        }
      } catch (err) {
        if (!cancelled) {
          setError("Failed to load file");
          console.error("Failed to fetch asset URL:", err);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchUrl();

    return () => {
      cancelled = true;
    };
  }, [assetId]);

  return (
    <NodeViewWrapper
      className="file-attachment-wrapper"
      contentEditable={false}
    >
      <div
        className={`file-attachment-block relative inline-block ${isEditable && selected ? "ring-2 ring-blue-500 rounded-lg" : ""}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* File card */}
        <div className="relative">
          {isLoading ? (
            <div className="flex items-center gap-3 p-3 bg-slate-800 border border-slate-700 rounded-lg max-w-md">
              <span className="text-2xl flex-shrink-0">{icon}</span>
              <div className="flex flex-col overflow-hidden min-w-0 flex-1">
                <span className="font-medium text-slate-200 truncate">
                  {filename}
                </span>
                <span className="text-xs text-slate-400">Loading...</span>
              </div>
            </div>
          ) : error || !fileUrl ? (
            <div className="flex items-center gap-3 p-3 bg-slate-800 border border-slate-700 rounded-lg max-w-md opacity-60">
              <FileIcon size={24} className="text-slate-500 flex-shrink-0" />
              <div className="flex flex-col overflow-hidden min-w-0 flex-1">
                <span className="font-medium text-slate-400 truncate">
                  {filename}
                </span>
                <span className="text-xs text-red-400">
                  {error || "File unavailable"}
                </span>
              </div>
            </div>
          ) : isEditable ? (
            // In edit mode, render as div (no download on click)
            <div className="file-attachment-link flex items-center gap-3 p-3 bg-slate-800 border border-slate-700 rounded-lg max-w-md cursor-default">
              <span className="file-attachment-icon text-2xl flex-shrink-0">
                {icon}
              </span>
              <div className="file-attachment-info flex flex-col overflow-hidden min-w-0 flex-1">
                <span className="file-attachment-name font-medium text-slate-200 truncate">
                  {filename}
                </span>
                <span className="file-attachment-size text-xs text-slate-400">
                  {sizeStr}
                </span>
              </div>
              <Download size={16} className="text-slate-400 flex-shrink-0" />
            </div>
          ) : (
            // In view mode, render as link (download on click)
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={filename}
              className="file-attachment-link flex items-center gap-3 p-3 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 hover:border-slate-600 transition-colors max-w-md"
            >
              <span className="file-attachment-icon text-2xl flex-shrink-0">
                {icon}
              </span>
              <div className="file-attachment-info flex flex-col overflow-hidden min-w-0 flex-1">
                <span className="file-attachment-name font-medium text-slate-200 truncate">
                  {filename}
                </span>
                <span className="file-attachment-size text-xs text-slate-400">
                  {sizeStr}
                </span>
              </div>
              <Download size={16} className="text-slate-400 flex-shrink-0" />
            </a>
          )}

          {/* Delete button - only in edit mode on hover */}
          {isEditable && isHovered && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                deleteNode();
              }}
              className="absolute -top-2 -right-2 p-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg transition-colors z-10"
              title="Remove file"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );
}

function getFileIcon(contentType: string): string {
  if (contentType?.startsWith("application/pdf")) return "📄";
  if (contentType?.includes("word") || contentType?.includes("document"))
    return "📝";
  if (contentType?.includes("sheet") || contentType?.includes("excel"))
    return "📊";
  if (
    contentType?.includes("presentation") ||
    contentType?.includes("powerpoint")
  )
    return "📑";
  if (contentType?.startsWith("video/")) return "🎬";
  if (contentType?.startsWith("audio/")) return "🎵";
  if (
    contentType?.includes("zip") ||
    contentType?.includes("archive") ||
    contentType?.includes("compressed")
  )
    return "📦";
  if (contentType?.startsWith("text/")) return "📃";
  return "📎";
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export const FileAttachment = Node.create<FileAttachmentOptions>({
  name: "fileAttachment",

  group: "block",

  selectable: false,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      assetId: {
        default: null,
      },
      filename: {
        default: null,
      },
      contentType: {
        default: null,
      },
      size: {
        default: 0,
      },
      caption: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="file-attachment"]',
        getAttrs: (node) => {
          if (typeof node === "string") return {};
          const element = node as HTMLElement;
          return {
            assetId: element.getAttribute("data-asset-id"),
            filename: element.getAttribute("data-filename"),
            contentType: element.getAttribute("data-content-type"),
            size: parseInt(element.getAttribute("data-size") || "0", 10),
            caption: element.getAttribute("data-caption"),
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { assetId, filename, contentType, size, caption } = HTMLAttributes;
    const icon = getFileIcon(contentType as string);
    const sizeStr = formatFileSize(size as number);

    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, {
        "data-type": "file-attachment",
        "data-asset-id": assetId,
        "data-filename": filename,
        "data-content-type": contentType,
        "data-size": size,
        "data-caption": caption,
        class: "file-attachment-wrapper",
      }),
      [
        "div",
        { class: "file-attachment-static" },
        ["span", { class: "file-attachment-icon" }, icon],
        [
          "span",
          { class: "file-attachment-info" },
          ["span", { class: "file-attachment-name" }, filename as string],
          ["span", { class: "file-attachment-size" }, sizeStr],
        ],
      ],
      caption
        ? ["div", { class: "file-attachment-caption" }, caption as string]
        : "",
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FileAttachmentComponent);
  },

  addCommands() {
    return {
      setFileAttachment:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      // Allow Enter to create a new paragraph after the block
      Enter: ({ editor }) => {
        const { selection } = editor.state;
        const { $from } = selection;
        const node = $from.node();

        if (
          node?.type.name === this.name ||
          $from.parent?.type.name === this.name
        ) {
          return editor.commands.insertContentAt(selection.to, {
            type: "paragraph",
          });
        }
        return false;
      },
      // Allow arrow down to move to next block
      ArrowDown: ({ editor }) => {
        const { selection } = editor.state;
        const { $from } = selection;

        if ($from.parent?.type.name === this.name) {
          const pos = selection.to;
          const nextPos = editor.state.doc.resolve(pos);
          if (nextPos.nodeAfter) {
            return editor.commands.setTextSelection(pos + 1);
          } else {
            // Insert a paragraph if at the end
            return editor.commands.insertContentAt(pos, { type: "paragraph" });
          }
        }
        return false;
      },
    };
  },
});

export default FileAttachment;
