import { useLocation, useNavigate } from "react-router-dom";
import {
  FolderKanban,
  ListTodo,
  FileText,
  Hash,
  MessageSquare,
  Plus,
} from "lucide-react";
import { Category } from "@/types";
import { useProjectStore } from "@/stores/projectStore";
import { useListStore } from "@/stores/listStore";
import { useDocStore } from "@/stores/docStore";
import { useChatStore } from "@/stores/chatStore";
import { useToastStore } from "@/stores/toastStore";

export function EmptyState() {
  const location = useLocation();
  const navigate = useNavigate();
  const { success, error } = useToastStore();

  const createProject = useProjectStore((state) => state.createProject);
  const createList = useListStore((state) => state.createList);
  const createDoc = useDocStore((state) => state.createDoc);
  const createChannel = useChatStore((state) => state.createChannel);

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
          description: "Organize your work into projects",
          actionText: "Create Project",
          action: async () => {
            const project = await createProject("New Project");
            success("Project created successfully");
            navigate(`/projects/${project.id}`);
          },
        };
      case "lists":
        return {
          title: "Lists",
          icon: ListTodo,
          description: "Create lists to organize your tasks",
          actionText: "Create List",
          action: async () => {
            const list = await createList("New List");
            success("List created successfully");
            navigate(`/lists/${list.id}`);
          },
        };
      case "docs":
        return {
          title: "Documents",
          icon: FileText,
          description: "Write and collaborate on documents",
          actionText: "Create Document",
          action: async () => {
            const doc = await createDoc("Untitled Document", "");
            success("Document created successfully");
            navigate(`/docs/${doc.id}`);
          },
        };
      case "channels":
        return {
          title: "Channels",
          icon: Hash,
          description: "Start team conversations in channels",
          actionText: "Create Channel",
          action: async () => {
            const channel = await createChannel("new-channel");
            success("Channel created successfully");
            navigate(`/channels/${channel.id}`);
          },
        };
      case "dms":
        return {
          title: "Direct Messages",
          icon: MessageSquare,
          description: "Send direct messages to team members",
          actionText: null,
          action: null,
        };
      default:
        return {
          title: "Welcome",
          icon: FileText,
          description: "Select a category to get started",
          actionText: null,
          action: null,
        };
    }
  };

  const {
    title,
    icon: Icon,
    description,
    actionText,
    action,
  } = getCategoryInfo();

  const handleCreate = async () => {
    if (action) {
      try {
        await action();
      } catch (err) {
        console.error("Failed to create item:", err);
        error("Error: " + (err as Error).message);
      }
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-dark-surface border-2 border-dark-border mb-6">
          <Icon size={48} className="text-dark-text-muted" />
        </div>

        <h2 className="text-2xl font-bold text-dark-text mb-3">{title}</h2>
        <p className="text-dark-text-muted mb-8">{description}</p>

        {actionText && action && (
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus size={20} />
            {actionText}
          </button>
        )}
      </div>
    </div>
  );
}
