import { ReactNode } from "react";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { Loader2 } from "lucide-react";

interface InfiniteScrollListProps {
  children: ReactNode;
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  emptyMessage?: string;
  loadingMessage?: string;
  className?: string;
}

/**
 * Wrapper component for lists with infinite scroll capability
 *
 * Usage:
 * <InfiniteScrollList
 *   hasMore={docStore.hasMore}
 *   isLoading={docStore.isLoading}
 *   onLoadMore={() => docStore.fetchDocs(true)}
 * >
 *   {docs.map(doc => <DocItem key={doc.id} doc={doc} />)}
 * </InfiniteScrollList>
 */
export function InfiniteScrollList({
  children,
  hasMore,
  isLoading,
  onLoadMore,
  emptyMessage: _emptyMessage = "No items found",
  loadingMessage = "Loading more...",
  className = "",
}: InfiniteScrollListProps) {
  const sentinelRef = useInfiniteScroll({
    hasMore,
    isLoading,
    onLoadMore,
  });

  return (
    <div className={className}>
      {children}

      {/* Loading indicator for initial load */}
      {isLoading && !hasMore && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-dark-text-secondary" />
        </div>
      )}

      {/* Sentinel element for intersection observer */}
      {hasMore && (
        <div ref={sentinelRef} className="py-4">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 text-dark-text-secondary">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">{loadingMessage}</span>
            </div>
          )}
        </div>
      )}

      {/* End of list indicator */}
      {!hasMore && !isLoading && (
        <div className="py-4 text-center text-sm text-dark-text-secondary">
          {/* You can optionally show "End of list" message or nothing */}
        </div>
      )}
    </div>
  );
}
