import { useEffect, useMemo, useRef } from "react";
import DOMPurify from "dompurify";
import { isHtml, markdownToHtml } from "./convert";
import { getAssetUrl, getFileEmoji, formatFileSize } from "../asset-cache";

interface ContentRendererProps {
  content: string;
  className?: string;
  onMentionClick?: (memberId: string) => void;
}

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "u",
  "s",
  "del",
  "ul",
  "ol",
  "li",
  "blockquote",
  "pre",
  "code",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "span",
  "div",
  "img",
  "a",
  "hr",
];

const ALLOWED_ATTR = [
  "class",
  "data-id",
  "data-type",
  "data-label",
  "data-asset-id",
  "data-filename",
  "data-content-type",
  "data-size",
  "data-alt",
  "data-caption",
  "href",
  "src",
  "alt",
  "title",
];

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Enhance a single image-block div: load presigned URL, add filename tooltip & caption.
 */
function enhanceImageBlock(el: HTMLElement) {
  const assetId = el.getAttribute("data-asset-id");
  const filename = el.getAttribute("data-filename") || "";
  const alt = el.getAttribute("data-alt") || "";
  const caption = el.getAttribute("data-caption") || "";

  if (!assetId) return;

  // Replace inner content with our rich structure
  el.innerHTML = "";
  el.style.textAlign = "center";

  const inner = document.createElement("div");
  inner.className = "relative inline-block max-w-full";
  el.appendChild(inner);

  const imgContainer = document.createElement("div");
  imgContainer.className = "relative inline-block";
  inner.appendChild(imgContainer);

  // Loading placeholder
  const loading = document.createElement("div");
  loading.className =
    "flex items-center justify-center w-48 h-32 bg-slate-800 rounded-lg";
  loading.innerHTML =
    '<div class="animate-pulse text-slate-500">Loading...</div>';
  imgContainer.appendChild(loading);

  // Filename tooltip (hidden until hover)
  if (filename) {
    const tooltip = document.createElement("div");
    tooltip.className =
      "absolute top-2 left-2 max-w-[calc(100%-1rem)] px-2 py-1 bg-black/80 text-white text-xs truncate rounded hidden";
    tooltip.textContent = filename;
    imgContainer.appendChild(tooltip);

    inner.addEventListener("mouseenter", () => tooltip.classList.remove("hidden"));
    inner.addEventListener("mouseleave", () => tooltip.classList.add("hidden"));
  }

  // Caption
  if (caption) {
    const captionEl = document.createElement("div");
    captionEl.className = "mt-1";
    captionEl.innerHTML = `<span class="text-sm text-slate-400 text-center italic block">${escapeHtml(caption)}</span>`;
    inner.appendChild(captionEl);
  } else if (filename) {
    const captionEl = document.createElement("div");
    captionEl.className = "mt-1";
    captionEl.innerHTML = `<span class="text-sm text-slate-400 text-center italic block">${escapeHtml(filename)}</span>`;
    inner.appendChild(captionEl);
  }

  // Load presigned URL
  getAssetUrl(assetId)
    .then((url) => {
      const img = document.createElement("img");
      img.src = url;
      img.alt = alt || filename || "Image";
      img.className = "max-w-full h-auto rounded-lg";
      img.draggable = false;
      imgContainer.replaceChild(img, loading);
    })
    .catch(() => {
      loading.innerHTML =
        '<div class="flex items-center justify-center gap-2 w-48 h-32 bg-slate-800 rounded-lg text-slate-500"><span class="text-sm">Failed to load image</span></div>';
    });
}

/**
 * Enhance a file-attachment div: render file card with icon, name, size, download.
 */
function enhanceFileAttachment(el: HTMLElement) {
  const assetId = el.getAttribute("data-asset-id");
  const filename = el.getAttribute("data-filename") || "File";
  const contentType = el.getAttribute("data-content-type") || "";
  const size = parseInt(el.getAttribute("data-size") || "0") || 0;

  if (!assetId) return;

  const icon = getFileEmoji(contentType);
  const sizeStr = formatFileSize(size);

  el.innerHTML = "";

  const card = document.createElement("div");
  card.className =
    "flex items-center gap-3 p-3 bg-slate-800 border border-slate-700 rounded-lg max-w-md cursor-pointer hover:bg-slate-700 hover:border-slate-600 transition-colors";
  el.appendChild(card);

  const iconEl = document.createElement("span");
  iconEl.className = "text-2xl flex-shrink-0";
  iconEl.textContent = icon;
  card.appendChild(iconEl);

  const info = document.createElement("div");
  info.className = "flex flex-col overflow-hidden min-w-0 flex-1";
  card.appendChild(info);

  const nameEl = document.createElement("span");
  nameEl.className = "font-medium text-slate-200 truncate";
  nameEl.textContent = filename;
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

  getAssetUrl(assetId).then((url) => {
    card.addEventListener("click", () => {
      window.open(url, "_blank");
    });
  });
}

/**
 * Enhance an image-grid div: render responsive grid with presigned URLs and captions.
 */
function enhanceImageGrid(el: HTMLElement) {
  const imageEls = el.querySelectorAll<HTMLElement>(
    '[data-type="image-block"]',
  );
  if (imageEls.length === 0) return;

  const images = Array.from(imageEls).map((imgEl) => ({
    assetId: imgEl.getAttribute("data-asset-id") || "",
    filename: imgEl.getAttribute("data-filename") || "",
    alt: imgEl.getAttribute("data-alt") || "",
    caption: imgEl.getAttribute("data-caption") || "",
  }));

  el.innerHTML = "";

  const gridEl = document.createElement("div");
  gridEl.className = "grid gap-4";
  const cols = images.length === 1 ? 1 : images.length === 2 ? 2 : 3;
  gridEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  el.appendChild(gridEl);

  images.forEach((image) => {
    const item = document.createElement("div");
    item.className = "relative flex flex-col";
    gridEl.appendChild(item);

    const imgWrapper = document.createElement("div");
    imgWrapper.className = "relative";
    item.appendChild(imgWrapper);

    const loading = document.createElement("div");
    loading.className =
      "flex items-center justify-center w-full aspect-square bg-slate-800 rounded-lg";
    loading.innerHTML =
      '<div class="animate-pulse text-slate-500 text-sm">Loading...</div>';
    imgWrapper.appendChild(loading);

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

    if (image.caption) {
      const captionEl = document.createElement("div");
      captionEl.className = "mt-1 text-center";
      captionEl.innerHTML = `<span class="text-sm text-slate-400 text-center italic block">${escapeHtml(image.caption)}</span>`;
      item.appendChild(captionEl);
    }
  });
}

/**
 * Post-process a container element to enhance all image blocks, file attachments,
 * and image grids with presigned URLs and rich UI.
 */
function enhanceContent(container: HTMLElement) {
  // Enhance image grids first (they contain image-block children)
  container
    .querySelectorAll<HTMLElement>('[data-type="image-grid"]')
    .forEach(enhanceImageGrid);

  // Enhance standalone image blocks (skip those inside grids, already handled)
  container
    .querySelectorAll<HTMLElement>('[data-type="image-block"]')
    .forEach((el) => {
      if (!el.closest('[data-type="image-grid"]')) {
        enhanceImageBlock(el);
      }
    });

  // Enhance file attachments
  container
    .querySelectorAll<HTMLElement>('[data-type="file-attachment"]')
    .forEach(enhanceFileAttachment);
}

/**
 * Renders content that may be either HTML or Markdown.
 * Detects the format, converts if needed, sanitizes, and renders safely.
 * Handles mention click events. Enhances images and files with presigned URLs.
 */
export function ContentRenderer({
  content,
  className,
  onMentionClick,
}: ContentRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const sanitizedHtml = useMemo(() => {
    if (!content || !content.trim()) return "";

    let html: string;
    if (isHtml(content)) {
      html = content;
    } else {
      html = markdownToHtml(content);
    }

    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
    });
  }, [content]);

  // Post-process DOM to enhance images and files
  useEffect(() => {
    if (containerRef.current && sanitizedHtml) {
      enhanceContent(containerRef.current);
    }
  }, [sanitizedHtml]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains("mention")) {
      const memberId = target.getAttribute("data-id");
      if (memberId && onMentionClick) {
        e.preventDefault();
        e.stopPropagation();
        onMentionClick(memberId);
      }
    }
  };

  if (!sanitizedHtml) return null;

  return (
    <div
      ref={containerRef}
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      onClick={handleClick}
    />
  );
}
