import {
  Star,
  Plus,
  ChevronDown,
  ChevronRight,
  ListTodo,
  FileText,
  Hash,
} from "lucide-react";
import { clsx } from "clsx";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useProjectStore } from "@/stores/projectStore";
import { useListStore } from "@/stores/listStore";
import { useDocStore } from "@/stores/docStore";
import { useChatStore } from "@/stores/chatStore";
import { useToastStore } from "@/stores/toastStore";
import { Avatar } from "@/components/ui/Avatar";
import { Category } from "@/types";

export function InnerSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    sidebarOpen,
    activeItem,
    setActiveItem,
    collapsedSections,
    toggleSection,
  } = useUIStore();
  const { success, error } = useToastStore();

  // Determine active category from URL
  const getCurrentCategory = (): Category => {
    const path = location.pathname;
    if (path === "/") return "home";
    if (path.startsWith("/projects")) return "projects";
    if (path.startsWith("/lists")) return "lists";
    if (path.startsWith("/docs")) return "docs";
    if (path.startsWith("/channels")) return "channels";
    if (path.startsWith("/dms")) return "dms";
    return "home";
  };

  const activeCategory = getCurrentCategory();

  // Sync activeItem with current URL
  useEffect(() => {
    const path = location.pathname;

    // Extract ID from path like /docs/123 or /lists/456
    const pathParts = path.split("/").filter(Boolean);

    if (pathParts.length >= 2) {
      const category = pathParts[0]; // e.g., "docs", "lists", "projects"
      const id = pathParts[1]; // e.g., "123"

      // Set activeItem when viewing a specific item
      if (id && id !== "new") {
        setActiveItem({
          type: category as Category,
          id: id,
        });
      } else if (id === "new") {
        // Clear activeItem when creating new item
        setActiveItem(null);
      }
    } else {
      // Clear activeItem when on index pages
      setActiveItem(null);
    }
  }, [location.pathname, setActiveItem]);

  // Helper to navigate to an item with guard check
  const navigateToItem = async (type: string, id: string) => {
    const { navigationGuard } = useUIStore.getState();
    if (navigationGuard) {
      const canNavigate = await navigationGuard();
      if (!canNavigate) return;
    }
    setActiveItem({ type: type as any, id });
    navigate(`/${type}/${id}`);
  };
  const projects = useProjectStore((state) => state.projects) || [];
  const createProject = useProjectStore((state) => state.createProject);
  const lists = useListStore((state) => state.lists) || [];
  const createList = useListStore((state) => state.createList);
  const docs = useDocStore((state) => state.docs) || [];
  const channels = useChatStore((state) => state.channels) || [];
  const directMessages = useChatStore((state) => state.directMessages) || [];
  const createChannel = useChatStore((state) => state.createChannel);

  // Ensure all are arrays
  const safeProjects = Array.isArray(projects) ? projects : [];
  const safeLists = Array.isArray(lists) ? lists : [];
  const safeDocs = Array.isArray(docs) ? docs : [];
  const safeChannels = Array.isArray(channels) ? channels : [];
  const safeDirectMessages = Array.isArray(directMessages)
    ? directMessages
    : [];

  if (!sidebarOpen) return null;

  const handleCreateItem = async () => {
    console.log("Creating item for category:", activeCategory);

    // Check navigation guard before creating
    const { navigationGuard } = useUIStore.getState();
    if (navigationGuard) {
      const canNavigate = await navigationGuard();
      if (!canNavigate) return;
    }

    try {
      switch (activeCategory) {
        case "projects":
          const project = await createProject("New Project");
          success("Project created successfully");
          await navigateToItem("projects", project.id);
          break;
        case "lists":
          const list = await createList("New List");
          success("List created successfully");
          await navigateToItem("lists", list.id);
          break;
        case "docs":
          navigate("/docs/new");
          setActiveItem({ type: "docs", id: "new" });
          break;
        case "channels":
          const channel = await createChannel("new-channel");
          success("Channel created successfully");
          await navigateToItem("channels", channel.id);
          break;
      }
    } catch (err) {
      console.error("Failed to create item:", err);
      error("Error: " + (err as Error).message);
    }
  };

  const getItemName = (item: any, type: string) => {
    if (type === "docs") return item.title;
    return item.name;
  };

  const renderStarred = (items: any[], type: string) => {
    if (!items || !Array.isArray(items)) return null;
    const starred = items.filter((item) => item.starred);
    if (starred.length === 0) return null;

    return (
      <div className="mb-4">
        <button
          onClick={() => toggleSection("starred")}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-dark-text-muted uppercase tracking-wider w-full hover:text-dark-text"
        >
          {collapsedSections["starred"] ? (
            <ChevronRight size={14} />
          ) : (
            <ChevronDown size={14} />
          )}
          <Star size={14} />
          Starred
        </button>
        {!collapsedSections["starred"] && (
          <div className="mt-1">
            {starred.map((item) => (
              <button
                key={item.id}
                onClick={() => navigateToItem(type, item.id)}
                className={clsx(
                  "w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-dark-surface transition-colors",
                  activeItem?.id === item.id && "bg-dark-surface text-blue-400",
                )}
              >
                {getItemIcon(type)}
                <span className="truncate">{getItemName(item, type)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case "lists":
        return <ListTodo size={16} />;
      case "docs":
        return <FileText size={16} />;
      case "channels":
        return <Hash size={16} />;
      default:
        return null;
    }
  };

  const renderContent = () => {
    switch (activeCategory) {
      case "home":
        return (
          <div className="p-4">
            <h3 className="text-sm font-semibold text-dark-text-muted mb-2">
              Recent
            </h3>
            <p className="text-sm text-dark-text-muted">No recent items</p>
          </div>
        );

      case "projects":
        return (
          <div>
            {renderStarred(safeProjects, "projects")}
            <div className="px-3 py-1.5 text-xs font-semibold text-dark-text-muted uppercase tracking-wider flex items-center justify-between">
              All Projects
              <button
                onClick={handleCreateItem}
                className="hover:text-dark-text"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="mt-1">
              {safeProjects.map((project) => (
                <div key={project.id}>
                  <button
                    onClick={() => toggleSection(`project-${project.id}`)}
                    className={clsx(
                      "w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-dark-surface transition-colors",
                      activeItem?.id === project.id &&
                        "bg-dark-surface text-blue-400",
                    )}
                  >
                    {collapsedSections[`project-${project.id}`] ? (
                      <ChevronRight size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                    <span className="truncate flex-1">{project.name}</span>
                  </button>
                  {!collapsedSections[`project-${project.id}`] &&
                    project.items && (
                      <div className="ml-4">
                        {project.items.map((item) => (
                          <button
                            key={item.id}
                            onClick={() =>
                              setActiveItem({
                                type: item.type as any,
                                id: item.id,
                              })
                            }
                            className="w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 hover:bg-dark-surface transition-colors text-dark-text-muted"
                          >
                            {getItemIcon(item.type)}
                            <span className="truncate">{item.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                </div>
              ))}
            </div>
          </div>
        );

      case "lists":
        return (
          <div>
            {renderStarred(safeLists, "lists")}
            <div className="px-3 py-1.5 text-xs font-semibold text-dark-text-muted uppercase tracking-wider flex items-center justify-between">
              All Lists
              <button
                onClick={handleCreateItem}
                className="hover:text-dark-text"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="mt-1">
              {safeLists.map((list) => (
                <button
                  key={list.id}
                  onClick={() => navigateToItem("lists", list.id)}
                  className={clsx(
                    "w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-dark-surface transition-colors",
                    activeItem?.id === list.id &&
                      "bg-dark-surface text-blue-400",
                  )}
                >
                  <ListTodo size={16} />
                  <span className="truncate">{list.name}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case "docs":
        return (
          <div>
            {renderStarred(safeDocs, "docs")}
            <div className="px-3 py-1.5 text-xs font-semibold text-dark-text-muted uppercase tracking-wider flex items-center justify-between">
              All Docs
              <button
                onClick={handleCreateItem}
                className="hover:text-dark-text"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="mt-1">
              {safeDocs.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => navigateToItem("docs", doc.id)}
                  className={clsx(
                    "w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-dark-surface transition-colors",
                    activeItem?.id === doc.id &&
                      "bg-dark-surface text-blue-400",
                  )}
                >
                  <FileText size={16} />
                  <span className="truncate">{doc.title}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case "channels":
        return (
          <div>
            {renderStarred(safeChannels, "channels")}
            <div className="px-3 py-1.5 text-xs font-semibold text-dark-text-muted uppercase tracking-wider flex items-center justify-between">
              All Channels
              <button
                onClick={handleCreateItem}
                className="hover:text-dark-text"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="mt-1">
              {safeChannels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => navigateToItem("channels", channel.id)}
                  className={clsx(
                    "w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-dark-surface transition-colors",
                    activeItem?.id === channel.id &&
                      "bg-dark-surface text-blue-400",
                  )}
                >
                  <Hash size={16} />
                  <span className="truncate">{channel.name}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case "dms":
        return (
          <div>
            {renderStarred(safeDirectMessages, "dms")}
            <div className="px-3 py-1.5 text-xs font-semibold text-dark-text-muted uppercase tracking-wider flex items-center justify-between">
              Direct Messages
              <button
                onClick={handleCreateItem}
                className="hover:text-dark-text"
                disabled
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="mt-1">
              {safeDirectMessages.map((dm) => (
                <button
                  key={dm.id}
                  onClick={() => navigateToItem("dms", dm.id)}
                  className={clsx(
                    "w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-dark-surface transition-colors",
                    activeItem?.id === dm.id && "bg-dark-surface text-blue-400",
                  )}
                >
                  <Avatar name={dm.name} size="xs" online={dm.online} />
                  <span className="truncate">{dm.name}</span>
                </button>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-52 bg-dark-surface border-r border-dark-border overflow-y-auto flex-shrink-0 pt-4">
      {renderContent()}
    </div>
  );
}
