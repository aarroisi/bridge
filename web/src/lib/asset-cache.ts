import { api } from "./api";

const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

interface CachedUrl {
  url: string;
  timestamp: number;
}

const assetUrlCache = new Map<string, CachedUrl>();

/**
 * Get a presigned URL for an asset, using cache to avoid duplicate requests.
 * Cache entries expire after 30 minutes.
 */
export async function getAssetUrl(assetId: string): Promise<string> {
  // Check cache
  const cached = assetUrlCache.get(assetId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
    return cached.url;
  }

  // Fetch new URL
  const asset = await api.get<{ url: string }>(`/assets/${assetId}`);
  const url = asset.url;

  // Cache it
  assetUrlCache.set(assetId, { url, timestamp: Date.now() });

  return url;
}

/**
 * Get file type emoji based on content type.
 */
export function getFileEmoji(contentType: string): string {
  if (contentType.includes("pdf")) return "\ud83d\udcc4";
  if (
    contentType.includes("word") ||
    contentType.includes("document") ||
    contentType.includes("msword")
  )
    return "\ud83d\udcdd";
  if (
    contentType.includes("sheet") ||
    contentType.includes("excel") ||
    contentType.includes("csv")
  )
    return "\ud83d\udcca";
  if (contentType.includes("presentation") || contentType.includes("powerpoint"))
    return "\ud83d\udcca";
  if (contentType.includes("video")) return "\ud83c\udfac";
  if (contentType.includes("audio")) return "\ud83c\udfa7";
  if (
    contentType.includes("zip") ||
    contentType.includes("rar") ||
    contentType.includes("tar") ||
    contentType.includes("gzip")
  )
    return "\ud83d\udce6";
  if (contentType.includes("text")) return "\ud83d\udcc3";
  return "\ud83d\udcc1";
}

/**
 * Format file size in human-readable format.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
