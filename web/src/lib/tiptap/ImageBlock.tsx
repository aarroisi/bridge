import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  NodeViewProps,
} from "@tiptap/react";
import { useState, useCallback, useEffect, useRef } from "react";
import { X, ImageIcon } from "lucide-react";
import { api } from "../api";

// Cache for asset URLs to avoid duplicate requests
const assetUrlCache = new Map<string, { url: string; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes (less than presigned URL expiry)

export interface ImageBlockOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    imageBlock: {
      setImageBlock: (options: {
        assetId: string;
        filename?: string;
        alt?: string;
        caption?: string;
      }) => ReturnType;
    };
  }
}

function ImageBlockComponent({
  node,
  updateAttributes,
  deleteNode,
  selected,
  editor,
}: NodeViewProps) {
  const { assetId, filename, alt, caption } = node.attrs as {
    assetId: string;
    filename?: string;
    alt?: string;
    caption?: string;
  };
  const [isHovered, setIsHovered] = useState(false);
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [captionValue, setCaptionValue] = useState(caption || "");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Track editable state to force re-render when it changes
  const [isEditable, setIsEditable] = useState(editor.isEditable);

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
      setImageUrl(cached.url);
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
          setImageUrl(asset.url);
        }
      } catch (err) {
        if (!cancelled) {
          setError("Failed to load image");
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

  // Sync caption value when caption prop changes
  useEffect(() => {
    setCaptionValue(caption || "");
  }, [caption]);

  const handleCaptionBlur = useCallback(() => {
    setIsEditingCaption(false);
    updateAttributes({ caption: captionValue });
  }, [captionValue, updateAttributes]);

  const handleCaptionKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleCaptionBlur();
      }
      if (e.key === "Escape") {
        setCaptionValue(caption || "");
        setIsEditingCaption(false);
      }
    },
    [caption, handleCaptionBlur],
  );

  // In view mode, show caption if exists, otherwise show filename
  const displayCaption = caption || (!isEditable ? filename : null);

  return (
    <NodeViewWrapper className="image-block-wrapper" contentEditable={false}>
      <div
        className={`image-block relative inline-block max-w-full ${isEditable && selected ? "ring-2 ring-blue-500 rounded-lg" : ""}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image container */}
        <div className="relative inline-block">
          {isLoading ? (
            <div className="flex items-center justify-center w-48 h-32 bg-slate-800 rounded-lg">
              <div className="animate-pulse text-slate-500">Loading...</div>
            </div>
          ) : error || !imageUrl ? (
            <div className="flex items-center justify-center gap-2 w-48 h-32 bg-slate-800 rounded-lg text-slate-500">
              <ImageIcon size={20} />
              <span className="text-sm">{error || "Image unavailable"}</span>
            </div>
          ) : (
            <img
              src={imageUrl}
              alt={alt || filename || "Image"}
              className="max-w-full h-auto rounded-lg"
              draggable={false}
            />
          )}

          {/* Delete button - only in edit mode on hover */}
          {isEditable && isHovered && (
            <button
              onClick={deleteNode}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg transition-colors"
              title="Remove image"
            >
              <X size={14} />
            </button>
          )}

          {/* Filename tooltip on hover in edit mode */}
          {isEditable && isHovered && filename && (
            <div className="absolute top-2 left-2 max-w-[calc(100%-4rem)] px-2 py-1 bg-black/80 text-white text-xs truncate rounded">
              {filename}
            </div>
          )}
        </div>

        {/* Caption */}
        <div className="image-block-caption mt-1">
          {isEditable ? (
            isEditingCaption ? (
              <input
                type="text"
                value={captionValue}
                onChange={(e) => setCaptionValue(e.target.value)}
                onBlur={handleCaptionBlur}
                onKeyDown={handleCaptionKeyDown}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
                placeholder="Add a caption..."
                className="w-full text-sm text-slate-400 bg-transparent border-none outline-none text-center italic"
                style={{ caretColor: "white" }}
                ref={(input) => {
                  if (input) {
                    setTimeout(() => input.focus(), 0);
                  }
                }}
              />
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingCaption(true);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className="w-full text-sm text-slate-500 hover:text-slate-400 text-center italic cursor-text"
              >
                {caption || "Add a caption..."}
              </button>
            )
          ) : displayCaption ? (
            <span className="text-sm text-slate-400 text-center italic block">
              {displayCaption}
            </span>
          ) : null}
        </div>
      </div>
    </NodeViewWrapper>
  );
}

export const ImageBlock = Node.create<ImageBlockOptions>({
  name: "imageBlock",

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
      alt: {
        default: null,
      },
      caption: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="image-block"]',
        getAttrs: (node) => {
          if (typeof node === "string") return {};
          const element = node as HTMLElement;
          return {
            assetId: element.getAttribute("data-asset-id"),
            filename: element.getAttribute("data-filename"),
            alt: element.getAttribute("data-alt"),
            caption: element.getAttribute("data-caption"),
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { assetId, filename, alt, caption } = HTMLAttributes;
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, {
        "data-type": "image-block",
        "data-asset-id": assetId,
        "data-filename": filename,
        "data-alt": alt,
        "data-caption": caption,
        class: "image-block-wrapper",
      }),
      filename
        ? ["div", { class: "image-block-filename" }, filename as string]
        : "",
      [
        "div",
        { class: "image-block-placeholder" },
        `[Image: ${filename || "image"}]`,
      ],
      caption
        ? ["div", { class: "image-block-caption" }, caption as string]
        : "",
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageBlockComponent);
  },

  addCommands() {
    return {
      setImageBlock:
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

export default ImageBlock;
