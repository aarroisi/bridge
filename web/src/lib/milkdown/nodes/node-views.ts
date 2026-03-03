import { $view } from "@milkdown/utils";
import type { NodeViewConstructor } from "@milkdown/prose/view";
import { imageBlockSchema } from "./image-block";
import { fileAttachmentSchema } from "./file-attachment";
import { imageGridSchema } from "./image-grid";
import { getAssetUrl, getFileEmoji, formatFileSize } from "../../asset-cache";

/**
 * Image block node view — renders image with presigned URL, loading state,
 * hover delete button, and caption.
 */
export const imageBlockView = $view(imageBlockSchema.node, () => {
  const nodeView: NodeViewConstructor = (node, view, getPos) => {
    const dom = document.createElement("div");
    dom.className = "image-block-wrapper text-center";
    dom.contentEditable = "false";

    const { assetId, filename, alt, caption } = node.attrs;

    // Inner container for hover effects
    const inner = document.createElement("div");
    inner.className = "image-block relative inline-block max-w-full";
    dom.appendChild(inner);

    // Image container
    const imgContainer = document.createElement("div");
    imgContainer.className = "relative inline-block";
    inner.appendChild(imgContainer);

    // Loading state
    const loading = document.createElement("div");
    loading.className =
      "flex items-center justify-center w-48 h-32 bg-slate-800 rounded-lg";
    loading.innerHTML =
      '<div class="animate-pulse text-slate-500">Loading...</div>';
    imgContainer.appendChild(loading);

    // Delete button (hidden until hover)
    const deleteBtn = document.createElement("button");
    deleteBtn.className =
      "absolute top-2 right-2 p-1.5 rounded-full text-white shadow-lg opacity-0 pointer-events-none transition-opacity";
    deleteBtn.style.backgroundColor = "#dc2626";
    deleteBtn.innerHTML =
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    deleteBtn.title = "Remove image";
    deleteBtn.addEventListener("mouseenter", () => { deleteBtn.style.backgroundColor = "#b91c1c"; });
    deleteBtn.addEventListener("mouseleave", () => { deleteBtn.style.backgroundColor = "#dc2626"; });
    deleteBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof getPos === "function") {
        const pos = getPos();
        if (pos !== undefined) {
          const tr = view.state.tr.delete(pos, pos + node.nodeSize);
          view.dispatch(tr);
        }
      }
    });
    imgContainer.appendChild(deleteBtn);

    // Filename tooltip (hidden until hover)
    const filenameTooltip = document.createElement("div");
    filenameTooltip.className =
      "absolute top-2 left-2 max-w-[calc(100%-4rem)] px-2 py-1 bg-black/80 text-white text-xs truncate rounded hidden";
    filenameTooltip.textContent = filename || "";
    imgContainer.appendChild(filenameTooltip);

    // Caption — render both input (edit) and span (view), CSS toggles visibility
    const captionEl = document.createElement("div");
    captionEl.className = "image-block-caption mt-1";

    const captionInput = document.createElement("input");
    captionInput.type = "text";
    captionInput.value = caption || "";
    captionInput.placeholder = "Add a caption...";
    captionInput.className =
      "caption-edit w-full bg-transparent text-sm text-slate-400 text-center italic border-none outline-none placeholder:text-slate-600 caret-slate-400";
    captionInput.style.caretColor = "#94a3b8";
    const saveCaption = () => {
      if (typeof getPos === "function") {
        const pos = getPos();
        if (pos !== undefined) {
          const tr = view.state.tr.setNodeMarkup(pos, undefined, {
            ...view.state.doc.nodeAt(pos)!.attrs,
            caption: captionInput.value,
          });
          view.dispatch(tr);
        }
      }
    };
    captionInput.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      requestAnimationFrame(() => captionInput.focus());
    });
    captionInput.addEventListener("blur", saveCaption);
    captionInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        captionInput.blur();
      }
    });
    captionEl.appendChild(captionInput);

    const captionSpan = document.createElement("span");
    captionSpan.className = "caption-view text-sm text-slate-400 text-center italic block";
    captionSpan.textContent = caption || filename || "";
    captionEl.appendChild(captionSpan);
    inner.appendChild(captionEl);

    // Hover handlers — filename tooltip always shows, delete only in edit mode
    inner.addEventListener("mouseenter", () => {
      if (filename) filenameTooltip.classList.remove("hidden");
      if (view.editable) {
        deleteBtn.classList.remove("opacity-0", "pointer-events-none");
      }
    });
    inner.addEventListener("mouseleave", () => {
      filenameTooltip.classList.add("hidden");
      deleteBtn.classList.add("opacity-0", "pointer-events-none");
    });

    // Load image
    if (assetId) {
      getAssetUrl(assetId)
        .then((url) => {
          const img = document.createElement("img");
          img.src = url;
          img.alt = alt || filename || "Image";
          img.className = "h-auto rounded-lg";
          img.draggable = false;
          imgContainer.replaceChild(img, loading);
        })
        .catch(() => {
          loading.innerHTML =
            '<div class="flex items-center justify-center gap-2 w-48 h-32 bg-slate-800 rounded-lg text-slate-500"><span class="text-sm">Failed to load image</span></div>';
        });
    }

    return {
      dom,
      update: (updatedNode) => {
        if (updatedNode.type.name !== "imageBlock") return false;
        if (document.activeElement !== captionInput) {
          captionInput.value = updatedNode.attrs.caption || "";
        }
        captionSpan.textContent = updatedNode.attrs.caption || updatedNode.attrs.filename || "";
        return true;
      },
      stopEvent: () => true,
      ignoreMutation: () => true,
    };
  };
  return nodeView;
});

/**
 * File attachment node view — renders file card with icon, name, size,
 * download link, and hover delete button.
 */
export const fileAttachmentView = $view(
  fileAttachmentSchema.node,
  () => {
    const nodeView: NodeViewConstructor = (node, view, getPos) => {
      const dom = document.createElement("div");
      dom.className = "file-attachment-wrapper";
      dom.contentEditable = "false";

      const { assetId, filename, contentType, size } = node.attrs;
      const icon = getFileEmoji(contentType || "");
      const sizeStr = formatFileSize(parseInt(size) || 0);

      const inner = document.createElement("div");
      inner.className = "file-attachment-block relative inline-block";
      dom.appendChild(inner);

      // File card
      const card = document.createElement("div");
      card.className =
        "flex items-center gap-3 p-3 bg-slate-800 border border-slate-700 rounded-lg max-w-md";
      inner.appendChild(card);

      const iconEl = document.createElement("span");
      iconEl.className = "text-2xl flex-shrink-0";
      iconEl.textContent = icon;
      card.appendChild(iconEl);

      const info = document.createElement("div");
      info.className = "flex flex-col overflow-hidden min-w-0 flex-1";
      card.appendChild(info);

      const nameEl = document.createElement("span");
      nameEl.className = "font-medium text-slate-200 truncate";
      nameEl.textContent = filename || "File";
      info.appendChild(nameEl);

      const sizeEl = document.createElement("span");
      sizeEl.className = "text-xs text-slate-400";
      sizeEl.textContent = sizeStr;
      info.appendChild(sizeEl);

      const downloadIcon = document.createElement("span");
      downloadIcon.className = "text-slate-400 flex-shrink-0";
      downloadIcon.innerHTML =
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
      card.appendChild(downloadIcon);

      // Delete button (hidden until hover, only in edit mode)
      const deleteBtn = document.createElement("button");
      deleteBtn.className =
        "absolute -top-2 -right-2 p-1.5 rounded-full text-white shadow-lg z-10 opacity-0 pointer-events-none transition-opacity";
      deleteBtn.style.backgroundColor = "#dc2626";
      deleteBtn.innerHTML =
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
      deleteBtn.title = "Remove file";
      deleteBtn.addEventListener("mouseenter", () => { deleteBtn.style.backgroundColor = "#b91c1c"; });
      deleteBtn.addEventListener("mouseleave", () => { deleteBtn.style.backgroundColor = "#dc2626"; });
      deleteBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof getPos === "function") {
          const pos = getPos();
          if (pos !== undefined) {
            const tr = view.state.tr.delete(pos, pos + node.nodeSize);
            view.dispatch(tr);
          }
        }
      });
      inner.appendChild(deleteBtn);

      // Hover handlers
      inner.addEventListener("mouseenter", () => {
        if (view.editable) {
          deleteBtn.classList.remove("opacity-0", "pointer-events-none");
        }
      });
      inner.addEventListener("mouseleave", () => {
        deleteBtn.classList.add("opacity-0", "pointer-events-none");
      });

      // Make card clickable for download
      card.style.cursor = "pointer";
      card.classList.add(
        "hover:bg-slate-700",
        "hover:border-slate-600",
        "transition-colors",
      );
      if (assetId) {
        getAssetUrl(assetId).then((url) => {
          card.addEventListener("click", () => {
            window.open(url, "_blank");
          });
        });
      }

      return {
        dom,
        update: (updatedNode) => {
          if (updatedNode.type.name !== "fileAttachment") return false;
          return true;
        },
        stopEvent: () => true,
        ignoreMutation: () => true,
      };
    };
    return nodeView;
  },
);

/**
 * Image grid node view — renders a responsive grid of images.
 */
export const imageGridView = $view(imageGridSchema.node, () => {
  const nodeView: NodeViewConstructor = (node, view, getPos) => {
    const dom = document.createElement("div");
    dom.className = "image-grid-wrapper";
    dom.contentEditable = "false";

    const inner = document.createElement("div");
    inner.className = "image-grid relative";
    dom.appendChild(inner);

    const gridEl = document.createElement("div");
    gridEl.className = "grid gap-4";
    inner.appendChild(gridEl);

    // Render child images
    const renderGrid = (currentNode: any) => {
      gridEl.innerHTML = "";
      const images: { assetId: string; filename: string; alt: string; caption: string }[] = [];

      currentNode.content.forEach((child: any) => {
        if (child.type.name === "imageBlock") {
          images.push({
            assetId: child.attrs.assetId,
            filename: child.attrs.filename || "",
            alt: child.attrs.alt || "",
            caption: child.attrs.caption || "",
          });
        }
      });

      // Set grid columns
      const cols = images.length === 1 ? 1 : images.length === 2 ? 2 : 3;
      gridEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

      images.forEach((image, index) => {
        const item = document.createElement("div");
        item.className = "grid-image-item relative flex flex-col";
        gridEl.appendChild(item);

        const imgWrapper = document.createElement("div");
        imgWrapper.className = "relative";
        item.appendChild(imgWrapper);

        // Loading placeholder
        const loading = document.createElement("div");
        loading.className =
          "flex items-center justify-center w-full aspect-square bg-slate-800 rounded-lg";
        loading.innerHTML =
          '<div class="animate-pulse text-slate-500 text-sm">Loading...</div>';
        imgWrapper.appendChild(loading);

        // Delete button per image
        const deleteBtn = document.createElement("button");
        deleteBtn.className =
          "absolute top-1 right-1 p-1 rounded-full text-white shadow-lg z-10 opacity-0 pointer-events-none transition-opacity";
        deleteBtn.style.backgroundColor = "#dc2626";
        deleteBtn.innerHTML =
          '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        deleteBtn.title = "Remove image";
        deleteBtn.addEventListener("mouseenter", () => { deleteBtn.style.backgroundColor = "#b91c1c"; });
        deleteBtn.addEventListener("mouseleave", () => { deleteBtn.style.backgroundColor = "#dc2626"; });
        deleteBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          removeGridImage(view, getPos, currentNode, index);
        });
        imgWrapper.appendChild(deleteBtn);

        // Hover
        item.addEventListener("mouseenter", () => {
          if (view.editable) deleteBtn.classList.remove("opacity-0", "pointer-events-none");
        });
        item.addEventListener("mouseleave", () => {
          deleteBtn.classList.add("opacity-0", "pointer-events-none");
        });

        // Load image
        if (image.assetId) {
          getAssetUrl(image.assetId)
            .then((url) => {
              const img = document.createElement("img");
              img.src = url;
              img.alt = image.alt || image.filename || "Image";
              img.className = "w-full aspect-square object-cover rounded-lg";
              img.draggable = false;
              imgWrapper.replaceChild(img, loading);
            })
            .catch(() => {
              loading.innerHTML =
                '<div class="flex flex-col items-center justify-center gap-1 w-full aspect-square bg-slate-800 rounded-lg text-slate-500"><span class="text-xs">Failed</span></div>';
            });
        }

        // Caption
        const captionEl = document.createElement("div");
        captionEl.className = "mt-1 text-center";

        const gridCaptionInput = document.createElement("input");
        gridCaptionInput.type = "text";
        gridCaptionInput.value = image.caption || "";
        gridCaptionInput.placeholder = "Add a caption...";
        gridCaptionInput.className =
          "caption-edit w-full bg-transparent text-xs text-slate-400 text-center italic border-none outline-none placeholder:text-slate-600";
        const saveGridCaption = () => {
          if (typeof getPos === "function") {
            const pos = getPos();
            if (pos !== undefined) {
              let childPos = pos + 1;
              let ci = 0;
              currentNode.content.forEach((child: any) => {
                if (child.type.name === "imageBlock") {
                  if (ci === index) {
                    const tr = view.state.tr.setNodeMarkup(childPos, undefined, {
                      ...child.attrs,
                      caption: gridCaptionInput.value,
                    });
                    view.dispatch(tr);
                  }
                  ci++;
                }
                childPos += child.nodeSize;
              });
            }
          }
        };
        gridCaptionInput.addEventListener("mousedown", (e) => {
          e.stopPropagation();
          requestAnimationFrame(() => gridCaptionInput.focus());
        });
        gridCaptionInput.addEventListener("blur", saveGridCaption);
        gridCaptionInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            gridCaptionInput.blur();
          }
        });
        captionEl.appendChild(gridCaptionInput);

        const gridCaptionSpan = document.createElement("span");
        gridCaptionSpan.className = "caption-view text-sm text-slate-400 text-center italic block";
        gridCaptionSpan.textContent = image.caption || image.filename || "";
        captionEl.appendChild(gridCaptionSpan);

        item.appendChild(captionEl);
      });
    };

    renderGrid(node);

    return {
      dom,
      update: (updatedNode) => {
        if (updatedNode.type.name !== "imageGrid") return false;
        renderGrid(updatedNode);
        return true;
      },
      stopEvent: () => true,
      ignoreMutation: () => true,
    };
  };
  return nodeView;
});

function removeGridImage(
  view: any,
  getPos: any,
  node: any,
  index: number,
) {
  if (typeof getPos !== "function") return;
  const pos = getPos();
  if (pos === undefined) return;

  // Count images
  let imageCount = 0;
  node.content.forEach((child: any) => {
    if (child.type.name === "imageBlock") imageCount++;
  });

  // If only one image, delete the whole grid
  if (imageCount <= 1) {
    const tr = view.state.tr.delete(pos, pos + node.nodeSize);
    view.dispatch(tr);
    return;
  }

  // Find and delete the specific child
  let childPos = pos + 1;
  let currentIndex = 0;

  node.content.forEach((child: any) => {
    if (child.type.name === "imageBlock") {
      if (currentIndex === index) {
        const tr = view.state.tr.delete(childPos, childPos + child.nodeSize);
        view.dispatch(tr);
        return;
      }
      currentIndex++;
    }
    childPos += child.nodeSize;
  });
}

export const nodeViewPlugins = [imageBlockView, fileAttachmentView, imageGridView];
