import { useState, useEffect } from "react";
import { HardDrive } from "lucide-react";
import { getStorageUsage, formatBytes } from "@/hooks/useFileUpload";
import type { StorageUsage as StorageUsageType } from "@/types";

export function StorageUsage() {
  const [usage, setUsage] = useState<StorageUsageType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const data = await getStorageUsage();
        setUsage(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load storage usage"
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchUsage();
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 bg-dark-surface border border-dark-border rounded-lg">
        <div className="flex items-center gap-3">
          <HardDrive size={20} className="text-dark-text-muted" />
          <span className="text-dark-text-muted">Loading storage usage...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-dark-surface border border-dark-border rounded-lg">
        <div className="flex items-center gap-3">
          <HardDrive size={20} className="text-red-400" />
          <span className="text-red-400">{error}</span>
        </div>
      </div>
    );
  }

  if (!usage) return null;

  const usagePercentage = Math.round(
    (usage.usedBytes / usage.quotaBytes) * 100
  );
  const isNearLimit = usagePercentage >= 80;
  const isAtLimit = usagePercentage >= 95;

  return (
    <div className="p-4 bg-dark-surface border border-dark-border rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <HardDrive size={20} className="text-dark-text-muted" />
          <span className="font-medium text-dark-text">Storage</span>
        </div>
        <span className="text-sm text-dark-text-muted">
          {formatBytes(usage.usedBytes)} / {formatBytes(usage.quotaBytes)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-dark-bg rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isAtLimit
              ? "bg-red-500"
              : isNearLimit
                ? "bg-yellow-500"
                : "bg-blue-500"
          }`}
          style={{ width: `${Math.min(usagePercentage, 100)}%` }}
        />
      </div>

      <div className="flex justify-between mt-2">
        <span className="text-xs text-dark-text-muted">
          {usagePercentage}% used
        </span>
        <span className="text-xs text-dark-text-muted">
          {formatBytes(usage.availableBytes)} available
        </span>
      </div>

      {isNearLimit && (
        <p
          className={`mt-3 text-sm ${isAtLimit ? "text-red-400" : "text-yellow-400"}`}
        >
          {isAtLimit
            ? "Storage is almost full. Delete some files to free up space."
            : "You're approaching your storage limit."}
        </p>
      )}
    </div>
  );
}
