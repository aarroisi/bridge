import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, List, ListOrdered, Quote } from "lucide-react";
import { clsx } from "clsx";

interface RichTextNotesEditorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
}

export function RichTextNotesEditor({
  value,
  onChange,
  onBlur,
  placeholder = "Add notes...",
  editable = true,
  className,
}: RichTextNotesEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onBlur: () => {
      onBlur?.();
    },
  });

  // Update content when value changes externally
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  // Update editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editable, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div
      className={clsx(
        "border border-dark-border rounded-lg overflow-hidden",
        className,
      )}
    >
      {editable && (
        <div className="flex items-center gap-1 px-2 py-1.5 border-b border-dark-border bg-dark-surface">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={clsx(
              "p-1.5 rounded hover:bg-dark-hover transition-colors",
              editor.isActive("bold")
                ? "bg-dark-hover text-blue-400"
                : "text-dark-text-muted",
            )}
            title="Bold"
          >
            <Bold size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={clsx(
              "p-1.5 rounded hover:bg-dark-hover transition-colors",
              editor.isActive("italic")
                ? "bg-dark-hover text-blue-400"
                : "text-dark-text-muted",
            )}
            title="Italic"
          >
            <Italic size={16} />
          </button>
          <div className="w-px h-4 bg-dark-border mx-1" />
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={clsx(
              "p-1.5 rounded hover:bg-dark-hover transition-colors",
              editor.isActive("bulletList")
                ? "bg-dark-hover text-blue-400"
                : "text-dark-text-muted",
            )}
            title="Bullet List"
          >
            <List size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={clsx(
              "p-1.5 rounded hover:bg-dark-hover transition-colors",
              editor.isActive("orderedList")
                ? "bg-dark-hover text-blue-400"
                : "text-dark-text-muted",
            )}
            title="Numbered List"
          >
            <ListOrdered size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={clsx(
              "p-1.5 rounded hover:bg-dark-hover transition-colors",
              editor.isActive("blockquote")
                ? "bg-dark-hover text-blue-400"
                : "text-dark-text-muted",
            )}
            title="Quote"
          >
            <Quote size={16} />
          </button>
        </div>
      )}
      <EditorContent
        editor={editor}
        className={clsx(
          "prose prose-invert prose-sm max-w-none p-3",
          "prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0",
          "prose-blockquote:my-2 prose-blockquote:border-l-2 prose-blockquote:border-dark-border prose-blockquote:pl-3 prose-blockquote:italic",
          "[&_.ProseMirror]:min-h-[80px] [&_.ProseMirror]:outline-none",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-dark-text-muted",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none",
          !editable && "bg-dark-surface",
        )}
      />
    </div>
  );
}
