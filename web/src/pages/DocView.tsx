import { useEffect, useState, useRef } from "react";
import {
  useParams,
  useSearchParams,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Edit3,
  Check,
  X,
  ArrowDown,
} from "lucide-react";
import { format } from "date-fns";
import { Avatar } from "@/components/ui/Avatar";
import { Message } from "@/components/features/Message";
import { DiscussionThread } from "@/components/features/DiscussionThread";
import { CommentEditor } from "@/components/features/CommentEditor";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useDocStore } from "@/stores/docStore";
import { useChatStore } from "@/stores/chatStore";
import { useUIStore } from "@/stores/uiStore";
import { useToastStore } from "@/stores/toastStore";
import { Message as MessageType, Doc } from "@/types";
import { clsx } from "clsx";

export function DocView() {
  const { id: docId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { docs, getDoc, updateDoc, createDoc } = useDocStore();
  const { messages, fetchMessages, sendMessage } = useChatStore();
  const { setNavigationGuard } = useUIStore();
  const { success, error } = useToastStore();
  const isNewDoc = docId === "new";

  // Get initial edit mode from URL
  const editParam = searchParams.get("edit");
  const [isEditing, setIsEditing] = useState(isNewDoc || editParam === "true");
  const [openThread, setOpenThread] = useState<MessageType | null>(null);
  const [newComment, setNewComment] = useState("");
  const [quotingMessage, setQuotingMessage] = useState<MessageType | null>(
    null,
  );
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null,
  );
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const doc = isNewDoc ? null : docs.find((d) => d.id === docId);
  const docComments = docId && !isNewDoc ? messages[`doc:${docId}`] || [] : [];
  const topLevelComments = docComments.filter((c) => !c.parentId);
  const threadMessages = docComments.filter((c) => c.parentId);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start writing...",
      }),
    ],
    content: doc?.content || "",
    editable: isEditing,
    onUpdate: ({ editor }) => {
      if (isEditing) {
        setEditedContent(editor.getHTML());
      }
    },
  });

  // Check if there are unsaved changes
  const hasUnsavedChanges = () => {
    if (!isEditing) return false;
    if (isNewDoc) {
      return editedTitle.trim() !== "" || editedContent.trim() !== "";
    }
    return (
      editedTitle.trim() !== (doc?.title?.trim() || "") ||
      editedContent !== (doc?.content || "")
    );
  };

  // Set up navigation guard
  useEffect(() => {
    const guard = async (): Promise<boolean> => {
      if (hasUnsavedChanges()) {
        return new Promise((resolve) => {
          setPendingNavigation(location.pathname);
          setShowUnsavedModal(true);
          // Store resolve function to be called by modal actions
          (window as any).__navResolve = resolve;
        });
      }
      return true;
    };

    setNavigationGuard(guard);
    return () => setNavigationGuard(null);
  }, [
    isEditing,
    editedTitle,
    editedContent,
    doc,
    isNewDoc,
    location.pathname,
    setNavigationGuard,
  ]);

  // Warn before leaving page with unsaved changes (browser navigation)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isEditing, editedTitle, editedContent, doc, isNewDoc]);

  const handleDiscardChanges = () => {
    setShowUnsavedModal(false);
    setPendingNavigation(null);
    if ((window as any).__navResolve) {
      (window as any).__navResolve(true);
      delete (window as any).__navResolve;
    }
  };

  const handleCancelNavigation = () => {
    setShowUnsavedModal(false);
    setPendingNavigation(null);
    if ((window as any).__navResolve) {
      (window as any).__navResolve(false);
      delete (window as any).__navResolve;
    }
  };

  const handleSaveAndNavigate = async () => {
    try {
      // Call the actual save logic directly without confirmation
      // (user already confirmed via the unsaved changes modal)
      await performSave();
      setShowUnsavedModal(false);
      setPendingNavigation(null);
      if ((window as any).__navResolve) {
        (window as any).__navResolve(true);
        delete (window as any).__navResolve;
      }
    } catch (err) {
      // Error is already handled in performSave
      if ((window as any).__navResolve) {
        (window as any).__navResolve(false);
        delete (window as any).__navResolve;
      }
    }
  };

  const performSave = async () => {
    if (!editedTitle.trim()) {
      error("Document title cannot be empty");
      throw new Error("Title is empty");
    }

    try {
      if (isNewDoc) {
        // Create new document
        const newDoc = await createDoc(editedTitle.trim(), editedContent || "");
        success("Document created successfully");
        navigate(`/docs/${newDoc.id}`);
      } else {
        // Update existing document
        if (!docId) return;

        const updates: Partial<Doc> = {};

        if (editedTitle.trim() !== doc?.title) {
          updates.title = editedTitle.trim();
        }

        if (editedContent !== doc?.content) {
          updates.content = editedContent;
        }

        if (Object.keys(updates).length > 0) {
          await updateDoc(docId, updates);
          success("Document saved successfully");
        }

        handleExitEditMode();
      }
    } catch (err) {
      console.error("Failed to save doc:", err);
      error("Error saving document: " + (err as Error).message);
      throw err;
    }
  };

  useEffect(() => {
    if (docId && !isNewDoc) {
      getDoc(docId);
      fetchMessages("doc", docId);
      // Clear state when navigating to a different doc
      setQuotingMessage(null);
      setNewComment("");

      // Exit edit mode unless URL says to edit
      const editParam = searchParams.get("edit");
      setIsEditing(editParam === "true");

      // Restore thread from URL if present
      const threadId = searchParams.get("thread");
      if (threadId) {
        // Thread will be set after messages are loaded
        setOpenThread(null);
      } else {
        setOpenThread(null);
      }
    } else if (isNewDoc) {
      // Clear state for new document
      setEditedTitle("");
      setEditedContent("");
      setQuotingMessage(null);
      setNewComment("");
      setOpenThread(null);
      setIsEditing(true); // Always in edit mode for new docs
      if (editor) {
        editor.commands.setContent("");
      }
    }
  }, [docId, isNewDoc, getDoc, fetchMessages, editor, searchParams]);

  useEffect(() => {
    if (editor && doc) {
      editor.commands.setContent(doc.content);
      setEditedTitle(doc.title);
      setEditedContent(doc.content);
    }
  }, [doc, editor]);

  // Focus title input for new docs
  useEffect(() => {
    if (isNewDoc && titleInputRef.current) {
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  }, [isNewDoc]);

  // Restore thread from URL when messages are loaded
  useEffect(() => {
    const threadId = searchParams.get("thread");
    if (threadId && docComments.length > 0) {
      const message = docComments.find((m) => m.id === threadId);
      if (message && (!openThread || openThread.id !== threadId)) {
        setOpenThread(message);
      }
    } else if (!threadId && openThread) {
      setOpenThread(null);
    }
  }, [searchParams, docComments]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing);
    }
  }, [isEditing, editor]);

  // Monitor scroll position to show/hide jump to bottom button
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      // Show button if user is more than 200px from bottom
      setShowJumpToBottom(distanceFromBottom > 200);
    };

    scrollContainer.addEventListener("scroll", handleScroll);
    handleScroll(); // Check initial state

    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, [docComments]); // Re-check when comments change

  const handleEnterEditMode = () => {
    setIsEditing(true);
    const params = new URLSearchParams(searchParams);
    params.set("edit", "true");
    setSearchParams(params);
  };

  const handleExitEditMode = () => {
    setIsEditing(false);
    const params = new URLSearchParams(searchParams);
    params.delete("edit");
    setSearchParams(params);
  };

  const handleSave = async () => {
    // Validate title is not empty
    if (!editedTitle.trim()) {
      error("Document title cannot be empty");
      return;
    }

    // Show confirmation modal before saving
    setShowSaveConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    setShowSaveConfirmModal(false);
    try {
      await performSave();
    } catch (err) {
      // Error already handled in performSave
    }
  };

  const handleCancelSave = () => {
    setShowSaveConfirmModal(false);
  };

  const handleJumpToBottom = () => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  const handleQuotedClick = (messageId: string) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: "smooth", block: "center" });

      // Add highlight effect
      messageElement.classList.add("ring-2", "ring-blue-500/50");
      setTimeout(() => {
        messageElement.classList.remove("ring-2", "ring-blue-500/50");
      }, 2000);
    }
  };

  const handleOpenThread = (message: MessageType) => {
    setOpenThread(message);
    setSearchParams({ thread: message.id });
  };

  const handleCloseThread = () => {
    setOpenThread(null);
    setSearchParams({});
  };

  const handleQuote = (message: MessageType) => {
    setQuotingMessage(message);
    // Focus the comment textarea
    setTimeout(() => {
      commentTextareaRef.current?.focus();
    }, 100);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !docId) return;
    try {
      await sendMessage(
        "doc",
        docId,
        newComment,
        undefined, // parentId - not used for top-level comments
        quotingMessage?.id, // quoteId
      );
      setNewComment("");
      setQuotingMessage(null);
      success("Comment added successfully");

      // Scroll to bottom after comment is added
      setTimeout(() => {
        const scrollContainer = document.querySelector(
          ".flex-1.overflow-y-auto",
        );
        if (scrollContainer) {
          scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: "smooth",
          });
        }
      }, 100);
    } catch (err) {
      console.error("Failed to add comment:", err);
      error("Error adding comment: " + (err as Error).message);
    }
  };

  if (!doc && !isNewDoc) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-dark-text-muted">Select a doc to view</p>
      </div>
    );
  }

  const getThreadReplies = (messageId: string) => {
    return threadMessages.filter((m) => m.parentId === messageId);
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="px-8 py-6 border-b border-dark-border max-w-7xl mx-auto w-full">
          <div
            className={clsx(
              "flex items-center justify-between",
              !isNewDoc && doc && "mb-3",
            )}
          >
            <input
              ref={titleInputRef}
              type="text"
              value={isEditing ? editedTitle : doc?.title || ""}
              onChange={(e) => setEditedTitle(e.target.value)}
              disabled={!isEditing}
              className={clsx(
                "text-3xl font-bold text-dark-text bg-transparent border-none outline-none flex-1 min-w-0",
                !isEditing && "cursor-default",
              )}
              placeholder="Add a title..."
            />
            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
              {isEditing && hasUnsavedChanges() && (
                <>
                  <span className="hidden lg:flex text-sm text-amber-500 items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    Unsaved changes
                  </span>
                  <span
                    className="lg:hidden w-2 h-2 min-w-[0.5rem] min-h-[0.5rem] rounded-full bg-amber-500 animate-pulse ml-2"
                    title="Unsaved changes"
                  ></span>
                </>
              )}
              {isNewDoc ? (
                <button
                  onClick={handleSave}
                  disabled={!editedTitle.trim()}
                  className="flex items-center gap-2 p-2 lg:px-4 lg:py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  title="Save"
                >
                  <Check size={16} className="flex-shrink-0" />
                  <span className="hidden lg:inline whitespace-nowrap">
                    Save
                  </span>
                </button>
              ) : (
                <button
                  onClick={isEditing ? handleSave : handleEnterEditMode}
                  disabled={isEditing && !editedTitle.trim()}
                  className="flex items-center gap-2 p-2 lg:px-4 lg:py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  title={isEditing ? "Save" : "Edit"}
                >
                  {isEditing ? (
                    <>
                      <Check size={16} className="flex-shrink-0" />
                      <span className="hidden lg:inline whitespace-nowrap">
                        Save
                      </span>
                    </>
                  ) : (
                    <>
                      <Edit3 size={16} className="flex-shrink-0" />
                      <span className="hidden lg:inline whitespace-nowrap">
                        Edit
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          {!isNewDoc && doc && (
            <div className="flex items-center gap-3 text-sm text-dark-text-muted">
              <div className="flex items-center gap-2">
                <Avatar name={doc.authorName} size="xs" />
                <span>{doc.authorName}</span>
              </div>
              <span>•</span>
              <span>
                Created {format(new Date(doc.insertedAt), "MMM d, yyyy")}
              </span>
              {doc.updatedAt !== doc.insertedAt && (
                <>
                  <span>•</span>
                  <span>
                    Updated {format(new Date(doc.updatedAt), "MMM d, yyyy")}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {isEditing && editor && (
          <div className="px-8 py-3 border-b border-dark-border flex items-center gap-2 max-w-7xl mx-auto w-full">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={clsx(
                "p-2 rounded transition-colors",
                editor.isActive("bold")
                  ? "bg-blue-600 text-white"
                  : "text-dark-text-muted hover:bg-dark-surface",
              )}
            >
              <Bold size={16} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={clsx(
                "p-2 rounded transition-colors",
                editor.isActive("italic")
                  ? "bg-blue-600 text-white"
                  : "text-dark-text-muted hover:bg-dark-surface",
              )}
            >
              <Italic size={16} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={clsx(
                "p-2 rounded transition-colors",
                editor.isActive("bulletList")
                  ? "bg-blue-600 text-white"
                  : "text-dark-text-muted hover:bg-dark-surface",
              )}
            >
              <List size={16} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={clsx(
                "p-2 rounded transition-colors",
                editor.isActive("orderedList")
                  ? "bg-blue-600 text-white"
                  : "text-dark-text-muted hover:bg-dark-surface",
              )}
            >
              <ListOrdered size={16} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={clsx(
                "p-2 rounded transition-colors",
                editor.isActive("blockquote")
                  ? "bg-blue-600 text-white"
                  : "text-dark-text-muted hover:bg-dark-surface",
              )}
            >
              <Quote size={16} />
            </button>
            <div className="w-px h-6 bg-dark-border mx-1" />
            <button
              onClick={() => editor.chain().focus().undo().run()}
              className="p-2 rounded text-dark-text-muted hover:bg-dark-surface transition-colors"
            >
              <Undo size={16} />
            </button>
            <button
              onClick={() => editor.chain().focus().redo().run()}
              className="p-2 rounded text-dark-text-muted hover:bg-dark-surface transition-colors"
            >
              <Redo size={16} />
            </button>
          </div>
        )}

        <div
          className="flex-1 overflow-y-auto relative"
          ref={scrollContainerRef}
        >
          <div className="px-8 py-6 max-w-7xl mx-auto w-full">
            {!doc?.content && !isEditing ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-full bg-dark-surface flex items-center justify-center mb-4">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-dark-text-muted"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                </div>
                <p className="text-dark-text-muted text-base mb-2">
                  This document is empty
                </p>
                <p className="text-dark-text-muted text-sm">
                  Click Edit to start writing
                </p>
              </div>
            ) : (
              <EditorContent
                editor={editor}
                className="prose prose-invert prose-slate max-w-none"
              />
            )}
          </div>

          {!isEditing && (
            <div className="px-8 py-6 border-t border-dark-border max-w-7xl mx-auto w-full">
              {topLevelComments.length > 0 ? (
                <>
                  <h3 className="text-sm font-medium text-dark-text mb-4">
                    Comments ({topLevelComments.length})
                  </h3>
                  <div className="space-y-1">
                    {topLevelComments.map((comment) => {
                      const replies = getThreadReplies(comment.id);
                      return (
                        <div key={comment.id} id={`message-${comment.id}`}>
                          <Message
                            message={comment}
                            onReply={() => handleOpenThread(comment)}
                            onQuote={() => handleQuote(comment)}
                            onQuotedClick={handleQuotedClick}
                          />
                          {replies.length > 0 && (
                            <button
                              onClick={() => handleOpenThread(comment)}
                              className="ml-14 text-xs text-blue-400 hover:underline"
                            >
                              {replies.length}{" "}
                              {replies.length === 1 ? "reply" : "replies"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-dark-surface flex items-center justify-center mb-4">
                    <Quote size={24} className="text-dark-text-muted" />
                  </div>
                  <p className="text-dark-text-muted text-sm">
                    No comments yet. Be the first to add one below.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Jump to bottom button */}
        {!isEditing && showJumpToBottom && (
          <button
            onClick={handleJumpToBottom}
            className="absolute right-8 p-3 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all z-10"
            style={{ bottom: quotingMessage ? "200px" : "140px" }}
            title="Jump to bottom"
          >
            <ArrowDown size={20} />
          </button>
        )}

        {!isEditing && (
          <div className="border-t border-dark-border bg-dark-bg p-4 max-w-7xl mx-auto w-full">
            <CommentEditor
              value={newComment}
              onChange={setNewComment}
              onSubmit={handleAddComment}
              placeholder="Add a comment..."
              quotingMessage={quotingMessage}
              onCancelQuote={() => setQuotingMessage(null)}
            />
          </div>
        )}
      </div>

      {openThread && (
        <DiscussionThread
          parentMessage={openThread}
          threadMessages={threadMessages}
          onClose={handleCloseThread}
          onSendReply={async (parentId, text, quoteId) => {
            if (!docId) return;
            await sendMessage("doc", docId, text, parentId, quoteId);
          }}
        />
      )}

      <ConfirmModal
        isOpen={showUnsavedModal}
        title="Unsaved Changes"
        message="You have unsaved changes. Do you want to save them before leaving?"
        confirmText="Save & Leave"
        cancelText="Stay"
        discardText="Discard Changes"
        confirmVariant="primary"
        onConfirm={handleSaveAndNavigate}
        onCancel={handleCancelNavigation}
        onDiscard={handleDiscardChanges}
      />

      <ConfirmModal
        isOpen={showSaveConfirmModal}
        title="Confirm Save"
        message={`Are you sure you want to save ${isNewDoc ? "this new document" : "changes to this document"}?`}
        confirmText="Save"
        cancelText="Cancel"
        confirmVariant="primary"
        onConfirm={handleConfirmSave}
        onCancel={handleCancelSave}
      />
    </div>
  );
}
