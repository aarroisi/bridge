import { useLocation } from "react-router-dom";
import { useProjectStore } from "@/stores/projectStore";
import { useListStore } from "@/stores/listStore";
import { useDocStore } from "@/stores/docStore";
import { useChatStore } from "@/stores/chatStore";
import { Category } from "@/types";
import { FolderKanban, ListTodo, FileText, Hash, MessageSquare } from "lucide-react";

export function CategoryView() {
  const location = useLocation();

  const projects = useProjectStore((state) => state.projects) || [];
  const lists = useListStore((state) => state.lists) || [];
  const docs = useDocStore((state) => state.docs) || [];
  const channels = useChatStore((state) => state.channels) || [];
  const directMessages = useChatStore((state) => state.directMessages) || [];

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
          emptyMessage: "No projects yet. Create one to get started!",
        };
      case "lists":
        return {
          title: "Lists",
          icon: ListTodo,
          items: lists,
          emptyMessage: "No lists yet. Create one to organize your tasks!",
        };
      case "docs":
        return {
          title: "Documents",
          icon: FileText,
          items: docs,
          emptyMessage: "No documents yet. Create one to start writing!",
        };
      case "channels":
        return {
          title: "Channels",
          icon: Hash,
          items: channels,
          emptyMessage: "No channels yet. Create one to start discussions!",
        };
      case "dms":
        return {
          title: "Direct Messages",
          icon: MessageSquare,
          items: directMessages,
          emptyMessage: "No direct messages yet.",
        };
      default:
        return {
          title: "Unknown",
          icon: FileText,
          items: [],
          emptyMessage: "No items found.",
        };
    }
  };

  const { title, icon: Icon, items, emptyMessage } = getCategoryInfo();

  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Icon size={32} className="text-blue-500" />
          <h1 className="text-3xl font-bold text-dark-text">{title}</h1>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <Icon size={64} className="text-dark-text-muted mx-auto mb-4 opacity-50" />
            <p className="text-dark-text-muted text-lg">{emptyMessage}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          </div>
        )}
      </div>
    </div>
  );
}
