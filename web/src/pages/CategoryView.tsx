import { useLocation } from "react-router-dom";
import { useProjectStore } from "@/stores/projectStore";
import { useListStore } from "@/stores/listStore";
import { useDocStore } from "@/stores/docStore";
import { useChatStore } from "@/stores/chatStore";
import { Category } from "@/types";
import {
  FolderKanban,
  ListTodo,
  FileText,
  Hash,
  MessageSquare,
} from "lucide-react";
import { InfiniteScrollList } from "@/components/common/InfiniteScrollList";

export function CategoryView() {
  const location = useLocation();

  const projects = useProjectStore((state) => state.projects) || [];
  const projectsHasMore = useProjectStore((state) => state.hasMore);
  const projectsLoading = useProjectStore((state) => state.isLoading);
  const fetchProjects = useProjectStore((state) => state.fetchProjects);

  const lists = useListStore((state) => state.lists) || [];
  const listsHasMore = useListStore((state) => state.hasMore);
  const listsLoading = useListStore((state) => state.isLoading);
  const fetchLists = useListStore((state) => state.fetchLists);

  const docs = useDocStore((state) => state.docs) || [];
  const docsHasMore = useDocStore((state) => state.hasMore);
  const docsLoading = useDocStore((state) => state.isLoading);
  const fetchDocs = useDocStore((state) => state.fetchDocs);

  const channels = useChatStore((state) => state.channels) || [];
  const channelsHasMore = useChatStore((state) => state.hasMoreChannels);
  const channelsLoading = useChatStore((state) => state.isLoading);
  const fetchChannels = useChatStore((state) => state.fetchChannels);

  const directMessages = useChatStore((state) => state.directMessages) || [];
  const dmsHasMore = useChatStore((state) => state.hasMoreDMs);
  const dmsLoading = useChatStore((state) => state.isLoading);
  const fetchDirectMessages = useChatStore(
    (state) => state.fetchDirectMessages,
  );

  // Determine category from URL
  const getCurrentCategory = (): Category => {
    const path = location.pathname;
    if (path.startsWith("/projects")) return "projects";
    if (path.startsWith("/lists")) return "lists";
    if (path.startsWith("/docs")) return "docs";
    if (path.startsWith("/channels")) return "channels";
    if (path.startsWith("/dms")) return "dms";
    return "home";
  };

  const category = getCurrentCategory();

  const getCategoryInfo = () => {
    switch (category) {
      case "projects":
        return {
          title: "Projects",
          icon: FolderKanban,
          items: projects,
          hasMore: projectsHasMore,
          isLoading: projectsLoading,
          onLoadMore: () => fetchProjects(true),
          emptyMessage: "No projects yet. Create one to get started!",
        };
      case "lists":
        return {
          title: "Lists",
          icon: ListTodo,
          items: lists,
          hasMore: listsHasMore,
          isLoading: listsLoading,
          onLoadMore: () => fetchLists(true),
          emptyMessage: "No lists yet. Create one to organize your tasks!",
        };
      case "docs":
        return {
          title: "Documents",
          icon: FileText,
          items: docs,
          hasMore: docsHasMore,
          isLoading: docsLoading,
          onLoadMore: () => fetchDocs(true),
          emptyMessage: "No documents yet. Create one to start writing!",
        };
      case "channels":
        return {
          title: "Channels",
          icon: Hash,
          items: channels,
          hasMore: channelsHasMore,
          isLoading: channelsLoading,
          onLoadMore: () => fetchChannels(true),
          emptyMessage: "No channels yet. Create one to start discussions!",
        };
      case "dms":
        return {
          title: "Direct Messages",
          icon: MessageSquare,
          items: directMessages,
          hasMore: dmsHasMore,
          isLoading: dmsLoading,
          onLoadMore: () => fetchDirectMessages(true),
          emptyMessage: "No direct messages yet.",
        };
      default:
        return {
          title: "Unknown",
          icon: FileText,
          items: [],
          hasMore: false,
          isLoading: false,
          onLoadMore: () => {},
          emptyMessage: "No items found.",
        };
    }
  };

  const {
    title,
    icon: Icon,
    items,
    hasMore,
    isLoading,
    onLoadMore,
    emptyMessage,
  } = getCategoryInfo();

  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Icon size={32} className="text-blue-500" />
          <h1 className="text-3xl font-bold text-dark-text">{title}</h1>
        </div>

        {items.length === 0 && !isLoading ? (
          <div className="text-center py-16">
            <Icon
              size={64}
              className="text-dark-text-muted mx-auto mb-4 opacity-50"
            />
            <p className="text-dark-text-muted text-lg">{emptyMessage}</p>
          </div>
        ) : (
          <InfiniteScrollList
            hasMore={hasMore}
            isLoading={isLoading}
            onLoadMore={onLoadMore}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {items.map((item) => (
              <div
                key={item.id}
                className="p-6 bg-dark-surface border border-dark-border rounded-lg hover:border-blue-500 transition-colors cursor-pointer"
              >
                <h3 className="text-lg font-semibold text-dark-text mb-2">
                  {(item as any).name || (item as any).title}
                </h3>
                {(item as any).description && (
                  <p className="text-dark-text-muted text-sm line-clamp-2">
                    {(item as any).description}
                  </p>
                )}
              </div>
            ))}
          </InfiniteScrollList>
        )}
      </div>
    </div>
  );
}
