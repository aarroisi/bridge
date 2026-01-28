import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
} from "lucide-react";
import { format } from "date-fns";
import { Avatar } from "@/components/ui/Avatar";
import { Message } from "@/components/features/Message";
import { ThreadPanel } from "@/components/features/ThreadPanel";
import { useDocStore } from "@/stores/docStore";
import { useChatStore } from "@/stores/chatStore";
import { useUIStore } from "@/stores/uiStore";
import { Message as MessageType } from "@/types";
import { clsx } from "clsx";

export function DocView() {
  const { id: docId } = useParams<{ id: string }>();
  const { docs, getDoc, updateDoc } = useDocStore();
  const { messages, fetchMessages, sendMessage } = useChatStore();
  const [isEditing, setIsEditing] = useState(false);
  const [openThread, setOpenThread] = useState<MessageType | null>(null);
  const [newComment, setNewComment] = useState("");
  const doc = docs.find((d) => d.id === docId);
  const docComments = docId ? messages[`doc:${docId}`] || [] : [];
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
      if (docId && isEditing) {
        updateDoc(docId, { content: editor.getHTML() });
      }
    },
  });

  useEffect(() => {
    if (docId) {
      getDoc(docId);
      fetchMessages("doc", docId);
    }
  }, [docId, getDoc, fetchMessages]);

  useEffect(() => {
    if (editor && doc) {
      editor.commands.setContent(doc.content);
    }
  }, [doc, editor]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !docId) return;
    await sendMessage("doc", docId, newComment);
    setNewComment("");
  };

  if (!doc) {
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
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-8 py-6 border-b border-dark-border">
          <div className="flex items-start justify-between mb-4">
            <input
              type="text"
              value={doc.title}
              onChange={(e) => updateDoc(doc.id, { title: e.target.value })}
              className="text-3xl font-bold text-dark-text bg-transparent border-none outline-none flex-1"
              placeholder="Untitled Document"
            />
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              {isEditing ? (
                <>
                  <Check size={16} />
                  <span>Done</span>
                </>
              ) : (
                <>
                  <Edit3 size={16} />
                  <span>Edit</span>
                </>
              )}
            </button>
          </div>
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
        </div>

        {isEditing && editor && (
          <div className="px-8 py-3 border-b border-dark-border flex items-center gap-2">
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

        <div className="flex-1 overflow-y-auto">
          <div
            className="px-8 py-6 max-w-4xl"
            onClick={() => !isEditing && setIsEditing(true)}
          >
            <EditorContent
              editor={editor}
              className="prose prose-invert prose-slate max-w-none"
            />
          </div>

          <div className="px-8 py-6 border-t border-dark-border">
            <h3 className="text-sm font-medium text-dark-text mb-4">
              Comments ({topLevelComments.length})
            </h3>
            <div className="space-y-1 mb-4">
              {topLevelComments.map((comment) => {
                const replies = getThreadReplies(comment.id);
                return (
                  <div key={comment.id}>
                    <Message
                      message={comment}
                      onReply={() => setOpenThread(comment)}
                      onQuote={() => setOpenThread(comment)}
                    />
                    {replies.length > 0 && (
                      <button
                        onClick={() => setOpenThread(comment)}
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
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                placeholder="Add a comment..."
                className="flex-1 px-3 py-2 bg-dark-surface border border-dark-border rounded text-sm text-dark-text placeholder:text-dark-text-muted focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                Comment
              </button>
            </div>
          </div>
        </div>
      </div>

      {openThread && (
        <ThreadPanel
          parentMessage={openThread}
          threadMessages={threadMessages}
          onClose={() => setOpenThread(null)}
        />
      )}
    </div>
  );
}
