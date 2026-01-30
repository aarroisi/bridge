import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ListTodo,
  FileText,
  Hash,
  Plus,
  MoreHorizontal,
  Star,
  Trash2,
  Pencil,
  Calendar,
  X,
} from "lucide-react";
import { useProjectStore } from "@/stores/projectStore";
import { useListStore } from "@/stores/listStore";
import { useDocStore } from "@/stores/docStore";
import { useChatStore } from "@/stores/chatStore";
import { useToastStore } from "@/stores/toastStore";
import { List, Doc, Channel } from "@/types";

type ItemType = "list" | "doc" | "channel";

interface AddItemMenuProps {
  onAdd: (type: ItemType) => void;
  onClose: () => void;
}

function AddItemMenu({ onAdd, onClose }: AddItemMenuProps) {
  return (
    <div className="absolute top-full left-0 mt-1 bg-dark-surface border border-dark-border rounded-lg shadow-lg py-1 z-10 min-w-[160px]">
      <button
        onClick={() => {
          onAdd("list");
          onClose();
        }}
        className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-dark-hover text-dark-text"
      >
        <ListTodo size={16} />
        New List
      </button>
      <button
        onClick={() => {
          onAdd("doc");
          onClose();
        }}
        className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-dark-hover text-dark-text"
      >
        <FileText size={16} />
        New Doc
      </button>
      <button
        onClick={() => {
          onAdd("channel");
          onClose();
        }}
        className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-dark-hover text-dark-text"
      >
        <Hash size={16} />
        New Channel
      </button>
    </div>
  );
}

interface EditProjectModalProps {
  project: {
    id: string;
    name: string;
    description?: string;
    startDate?: string;
    endDate?: string;
  };
  onSave: (data: {
    name: string;
    description: string;
    startDate: string | null;
    endDate: string | null;
  }) => Promise<void>;
  onClose: () => void;
}

function EditProjectModal({ project, onSave, onClose }: EditProjectModalProps) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || "");
  const [startDate, setStartDate] = useState(project.startDate || "");
  const [endDate, setEndDate] = useState(project.endDate || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    if (startDate && endDate && startDate > endDate) {
      setError("End date must be after start date");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        startDate: startDate || null,
        endDate: endDate || null,
      });
      onClose();
    } catch (err) {
      setError("Failed to save project");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-surface border border-dark-border rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border">
          <h3 className="font-semibold text-dark-text">Edit Project</h3>
          <button
            onClick={onClose}
            className="text-dark-text-muted hover:text-dark-text"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {error && (
            <div className="text-sm text-red-400 bg-red-400/10 px-3 py-2 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-dark-text-muted mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Project name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-text-muted mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Project description (optional)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-text-muted mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-text-muted mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-4 py-3 border-t border-dark-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-dark-text-muted hover:text-dark-text transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useToastStore();

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const projects = useProjectStore((state) => state.projects);
  const updateProject = useProjectStore((state) => state.updateProject);
  const deleteProject = useProjectStore((state) => state.deleteProject);
  const addItem = useProjectStore((state) => state.addItem);

  const lists = useListStore((state) => state.lists);
  const createList = useListStore((state) => state.createList);

  const docs = useDocStore((state) => state.docs);

  const channels = useChatStore((state) => state.channels);
  const createChannel = useChatStore((state) => state.createChannel);

  const project = projects.find((p) => p.id === id);

  // Get items from project_items and resolve to actual entities
  const projectItems = project?.items || [];

  const projectLists = useMemo(() => {
    const listIds = projectItems
      .filter((i) => i.itemType === "list")
      .map((i) => i.itemId);
    return lists.filter((l) => listIds.includes(l.id));
  }, [projectItems, lists]);

  const projectDocs = useMemo(() => {
    const docIds = projectItems
      .filter((i) => i.itemType === "doc")
      .map((i) => i.itemId);
    return docs.filter((d) => docIds.includes(d.id));
  }, [projectItems, docs]);

  const projectChannels = useMemo(() => {
    const channelIds = projectItems
      .filter((i) => i.itemType === "channel")
      .map((i) => i.itemId);
    return channels.filter((c) => channelIds.includes(c.id));
  }, [projectItems, channels]);

  const hasItems =
    projectLists.length > 0 ||
    projectDocs.length > 0 ||
    projectChannels.length > 0;

  const handleAddItem = async (type: ItemType) => {
    if (!id) return;

    try {
      switch (type) {
        case "list": {
          const list = await createList("New List");
          await addItem(id, "list", list.id);
          success("List created");
          navigate(`/projects/${id}/lists/${list.id}`);
          break;
        }
        case "doc": {
          // Navigate to new doc page within project context
          navigate(`/projects/${id}/docs/new`);
          break;
        }
        case "channel": {
          const channel = await createChannel("new-channel");
          await addItem(id, "channel", channel.id);
          success("Channel created");
          navigate(`/projects/${id}/channels/${channel.id}`);
          break;
        }
      }
    } catch (err) {
      console.error("Failed to create item:", err);
      error("Failed to create item");
    }
  };

  const handleToggleStar = async () => {
    if (!project) return;
    try {
      await updateProject(project.id, { starred: !project.starred });
    } catch (err) {
      console.error("Failed to update project:", err);
      error("Failed to update project");
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    if (!confirm(`Delete "${project.name}"? This cannot be undone.`)) return;

    try {
      await deleteProject(project.id);
      success("Project deleted");
      navigate("/projects");
    } catch (err) {
      console.error("Failed to delete project:", err);
      error("Failed to delete project");
    }
  };

  const handleSaveProject = async (data: {
    name: string;
    description: string;
    startDate: string | null;
    endDate: string | null;
  }) => {
    if (!project) return;
    await updateProject(project.id, {
      name: data.name,
      description: data.description || undefined,
      startDate: data.startDate || undefined,
      endDate: data.endDate || undefined,
    });
    success("Project updated");
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-dark-text-muted">Project not found</p>
      </div>
    );
  }

  const renderItem = (
    item: List | Doc | Channel,
    type: "list" | "doc" | "channel",
  ) => {
    const name = type === "doc" ? (item as Doc).title : (item as List).name;
    const icon =
      type === "list" ? (
        <ListTodo size={18} />
      ) : type === "doc" ? (
        <FileText size={18} />
      ) : (
        <Hash size={18} />
      );
    // Use nested project URL
    const path = `/projects/${id}/${type}s/${item.id}`;

    return (
      <button
        key={item.id}
        onClick={() => navigate(path)}
        className="flex items-center gap-3 p-3 rounded-lg bg-dark-surface border border-dark-border hover:border-dark-hover transition-colors text-left w-full"
      >
        <div className="text-dark-text-muted">{icon}</div>
        <div className="text-sm font-medium text-dark-text truncate">
          {name}
        </div>
      </button>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-dark-border flex items-center justify-between">
        <h1 className="text-xl font-semibold text-dark-text">{project.name}</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus size={16} />
              Add Item
            </button>
            {showAddMenu && (
              <AddItemMenu
                onAdd={handleAddItem}
                onClose={() => setShowAddMenu(false)}
              />
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setShowProjectMenu(!showProjectMenu)}
              className="p-2 hover:bg-dark-surface rounded-lg text-dark-text-muted hover:text-dark-text transition-colors"
            >
              <MoreHorizontal size={20} />
            </button>
            {showProjectMenu && (
              <div className="absolute top-full right-0 mt-1 bg-dark-surface border border-dark-border rounded-lg shadow-lg py-1 z-10 min-w-[160px]">
                <button
                  onClick={() => {
                    setShowEditModal(true);
                    setShowProjectMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-dark-hover text-dark-text"
                >
                  <Pencil size={16} />
                  Edit Project
                </button>
                <button
                  onClick={() => {
                    handleToggleStar();
                    setShowProjectMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-dark-hover text-dark-text"
                >
                  <Star
                    size={16}
                    className={project.starred ? "fill-yellow-400" : ""}
                  />
                  {project.starred ? "Unstar" : "Star"}
                </button>
                <button
                  onClick={() => {
                    handleDeleteProject();
                    setShowProjectMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-dark-hover text-red-400"
                >
                  <Trash2 size={16} />
                  Delete Project
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Project Info */}
      {(project.description || project.startDate || project.endDate) && (
        <div className="px-6 py-3">
          {project.description && (
            <p className="text-sm text-dark-text-muted">
              {project.description}
            </p>
          )}
          {(project.startDate || project.endDate) && (
            <div className="flex items-center gap-1 mt-1 text-xs text-dark-text-muted">
              <Calendar size={12} />
              {project.startDate && project.endDate ? (
                <span>
                  {formatDate(project.startDate)} -{" "}
                  {formatDate(project.endDate)}
                </span>
              ) : project.startDate ? (
                <span>Starts {formatDate(project.startDate)}</span>
              ) : (
                <span>Ends {formatDate(project.endDate!)}</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {!hasItems ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-dark-surface border-2 border-dark-border mb-4">
              <Plus size={32} className="text-dark-text-muted" />
            </div>
            <h2 className="text-lg font-semibold text-dark-text mb-2">
              No items yet
            </h2>
            <p className="text-dark-text-muted mb-6 max-w-sm">
              Add lists, docs, or channels to organize your project.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleAddItem("list")}
                className="flex items-center gap-2 px-4 py-2 bg-dark-surface border border-dark-border hover:border-dark-hover rounded-lg text-sm text-dark-text transition-colors"
              >
                <ListTodo size={16} />
                Add List
              </button>
              <button
                onClick={() => handleAddItem("doc")}
                className="flex items-center gap-2 px-4 py-2 bg-dark-surface border border-dark-border hover:border-dark-hover rounded-lg text-sm text-dark-text transition-colors"
              >
                <FileText size={16} />
                Add Doc
              </button>
              <button
                onClick={() => handleAddItem("channel")}
                className="flex items-center gap-2 px-4 py-2 bg-dark-surface border border-dark-border hover:border-dark-hover rounded-lg text-sm text-dark-text transition-colors"
              >
                <Hash size={16} />
                Add Channel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {projectLists.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-dark-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                  <ListTodo size={14} />
                  Lists
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {projectLists.map((list) => renderItem(list, "list"))}
                </div>
              </div>
            )}

            {projectDocs.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-dark-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FileText size={14} />
                  Docs
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {projectDocs.map((doc) => renderItem(doc, "doc"))}
                </div>
              </div>
            )}

            {projectChannels.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-dark-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Hash size={14} />
                  Channels
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {projectChannels.map((channel) =>
                    renderItem(channel, "channel"),
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Project Modal */}
      {showEditModal && (
        <EditProjectModal
          project={project}
          onSave={handleSaveProject}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}
