import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  NodeViewProps,
} from "@tiptap/react";
import { useState, useEffect, useCallback, useRef } from "react";
import { X, ImageIcon } from "lucide-react";
import { api } from "../api";

// Cache for asset URLs to avoid duplicate requests
const assetUrlCache = new Map<string, { url: string; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export interface ImageGridOptions {
  HTMLAttributes: Record<string, unknown>;
}

interface GridImage {
  assetId: string;
  filename?: string;
  alt?: string;
  caption?: string;
}

interface GridImageItemProps {
  image: GridImage;
  index: number;
  isEditable: boolean;
  onRemove: (index: number) => void;
  onUpdateCaption: (index: number, caption: string) => void;
}

function GridImageItem({
  image,
  index,
  isEditable,
  onRemove,
  onUpdateCaption,
}: GridImageItemProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [captionValue, setCaptionValue] = useState(image.caption || "");

  useEffect(() => {
    if (!image.assetId) {
      setError("No asset ID");
      setIsLoading(false);
      return;
    }

    // Check cache first
    const cached = assetUrlCache.get(image.assetId);
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
        const asset = await api.get<{ url: string }>(
          `/assets/${image.assetId}`,
        );
        if (!cancelled && asset.url) {
          assetUrlCache.set(image.assetId, {
            url: asset.url,
            timestamp: Date.now(),
          });
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
  }, [image.assetId]);

  // Sync caption value when caption prop changes
  useEffect(() => {
    setCaptionValue(image.caption || "");
  }, [image.caption]);

  const handleCaptionBlur = useCallback(() => {
    setIsEditingCaption(false);
    onUpdateCaption(index, captionValue);
  }, [captionValue, onUpdateCaption, index]);

  const handleCaptionKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleCaptionBlur();
      }
      if (e.key === "Escape") {
        setCaptionValue(image.caption || "");
        setIsEditingCaption(false);
      }
    },
    [image.caption, handleCaptionBlur],
  );

  // In view mode, show caption if exists, otherwise show filename
  const displayCaption = image.caption || (!isEditable ? image.filename : null);

  return (
    <div
      className="grid-image-item relative flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      <div className="relative">
        {isLoading ? (
          <div className="flex items-center justify-center w-full aspect-square bg-slate-800 rounded-lg">
            <div className="animate-pulse text-slate-500 text-sm">
              Loading...
            </div>
          </div>
        ) : error || !imageUrl ? (
          <div className="flex flex-col items-center justify-center gap-1 w-full aspect-square bg-slate-800 rounded-lg text-slate-500">
            <ImageIcon size={20} />
            <span className="text-xs">{error || "Unavailable"}</span>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={image.alt || image.filename || "Image"}
            className="w-full aspect-square object-cover rounded-lg"
            draggable={false}
          />
        )}

        {/* Remove button - only in edit mode on hover */}
        {isEditable && isHovered && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove(index);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="absolute top-1 right-1 p-1 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg transition-colors z-10"
            title="Remove image"
          >
            <X size={12} />
          </button>
        )}

        {/* Filename tooltip on hover in edit mode */}
        {isEditable && isHovered && image.filename && (
          <div className="absolute top-1 left-1 max-w-[calc(100%-3rem)] px-2 py-1 bg-black/80 text-white text-xs truncate rounded">
            {image.filename}
          </div>
        )}
      </div>

      {/* Caption */}
      <div className="mt-1 text-center">
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
              {image.caption || "Add a caption..."}
            </button>
          )
        ) : displayCaption ? (
          <span className="text-sm text-slate-400 text-center italic block">
            {displayCaption}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function ImageGridComponent({
  node,
  editor,
  selected,
  deleteNode,
  getPos,
}: NodeViewProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditable, setIsEditable] = useState(editor.isEditable);

  // Extract images from node content
  const images: GridImage[] = [];
  node.content.forEach((child) => {
    if (child.type.name === "imageBlock") {
      images.push({
        assetId: child.attrs.assetId,
        filename: child.attrs.filename,
        alt: child.attrs.alt,
        caption: child.attrs.caption,
      });
    }
  });

  // Listen for editor editable state changes
  useEffect(() => {
    const updateEditable = () => {
      setIsEditable(editor.isEditable);
    };

    editor.on("update", updateEditable);
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

  const handleRemoveImage = useCallback(
    (index: number) => {
      if (typeof getPos !== "function") return;

      const pos = getPos();
      if (pos === undefined) return;

      // Get the current node from the fresh document state
      const currentNode = editor.state.doc.nodeAt(pos);
      if (!currentNode) return;

      // Count current images
      let imageCount = 0;
      currentNode.content.forEach((child) => {
        if (child.type.name === "imageBlock") {
          imageCount++;
        }
      });

      // If only one image left, delete the whole grid
      if (imageCount <= 1) {
        deleteNode();
        return;
      }

      // Find the position of the child to delete
      let childPos = pos + 1; // Start after the opening of the grid node
      let currentIndex = 0;
      let foundPos: number | null = null;
      let foundSize: number | null = null;

      // First, find the position without modifying
      currentNode.content.forEach((child) => {
        if (foundPos !== null) return; // Already found, skip
        if (child.type.name === "imageBlock") {
          if (currentIndex === index) {
            foundPos = childPos;
            foundSize = child.nodeSize;
            return;
          }
          currentIndex++;
        }
        childPos += child.nodeSize;
      });

      // Now delete if found
      if (foundPos !== null && foundSize !== null) {
        const tr = editor.state.tr.delete(foundPos, foundPos + foundSize);
        editor.view.dispatch(tr);
      }
    },
    [editor, getPos, deleteNode],
  );

  const handleUpdateCaption = useCallback(
    (index: number, caption: string) => {
      if (typeof getPos !== "function") return;

      const pos = getPos();
      if (pos === undefined) return;

      // Find the position of the child to update
      let childPos = pos + 1; // Start after the opening of the grid node
      let currentIndex = 0;

      node.content.forEach((child) => {
        if (child.type.name === "imageBlock") {
          if (currentIndex === index) {
            // Update the caption attribute
            const tr = editor.state.tr.setNodeMarkup(childPos, undefined, {
              ...child.attrs,
              caption: caption || null,
            });
            editor.view.dispatch(tr);
            return;
          }
          currentIndex++;
        }
        childPos += child.nodeSize;
      });
    },
    [editor, node, getPos],
  );

  // Calculate grid columns based on image count
  const getGridColumns = () => {
    const count = images.length;
    if (count === 1) return 1;
    if (count === 2) return 2;
    return 3; // Max 3 columns
  };

  return (
    <NodeViewWrapper className="image-grid-wrapper" contentEditable={false}>
      <div
        className={`image-grid relative ${isEditable && selected ? "ring-2 ring-blue-500 rounded-lg p-1" : ""}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(${getGridColumns()}, 1fr)`,
          }}
        >
          {images.map((image, index) => (
            <GridImageItem
              key={`${image.assetId}-${index}`}
              image={image}
              index={index}
              isEditable={isEditable}
              onRemove={handleRemoveImage}
              onUpdateCaption={handleUpdateCaption}
            />
          ))}
        </div>
      </div>
    </NodeViewWrapper>
  );
}

export const ImageGrid = Node.create<ImageGridOptions>({
  name: "imageGrid",

  group: "block",

  selectable: false,

  content: "imageBlock+",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="image-grid"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": "image-grid",
        class: "image-grid-wrapper",
      }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageGridComponent);
  },

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        const { selection } = editor.state;
        const { $from } = selection;

        if ($from.parent?.type.name === this.name) {
          return editor.commands.insertContentAt(selection.to, {
            type: "paragraph",
          });
        }
        return false;
      },
      ArrowDown: ({ editor }) => {
        const { selection } = editor.state;
        const { $from } = selection;

        if ($from.parent?.type.name === this.name) {
          const pos = selection.to;
          const nextPos = editor.state.doc.resolve(pos);
          if (nextPos.nodeAfter) {
            return editor.commands.setTextSelection(pos + 1);
          } else {
            return editor.commands.insertContentAt(pos, { type: "paragraph" });
          }
        }
        return false;
      },
    };
  },
});

export default ImageGrid;
