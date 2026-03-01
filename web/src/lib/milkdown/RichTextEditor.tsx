import { type ReactNode, useMemo, useRef, useState } from "react";
import { Paperclip } from "lucide-react";
import type { Crepe } from "@milkdown/crepe";
import type { MilkdownPlugin } from "@milkdown/ctx";
import { MilkdownEditor, type MilkdownEditorHandle } from "./MilkdownEditor";
import { EditorToolbar, useToolbarPlugin } from "./EditorToolbar";
import {
  imageBlockPlugins,
  fileAttachmentPlugins,
  imageGridPlugins,
  nodeViewPlugins,
} from "./nodes";
import { handleFilesUpload, createPasteUploadPlugin } from "./file-upload";
import type { MentionMember } from "@/components/ui/MentionList";

export interface RichTextEditorHandle {
  getMarkdown: () => string;
  focus: () => void;
  getCrepe: () => Crepe | null;
}

interface RichTextEditorProps {
  value: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;

  /** Enable mention support */
  mentions?: {
    members: MentionMember[];
    onActiveChange?: (active: boolean) => void;
  };

  /** Show file upload button in toolbar. Requires attachable context for uploads. */
  fileUpload?: {
    attachableType: string;
    attachableId: string;
    onError: (msg: string) => void;
  };

  /** Additional plugins beyond the built-in ones (e.g. submit-on-enter) */
  plugins?: MilkdownPlugin[];

  /** Show toolbar (default: true when editable, false when not editable) */
  showToolbar?: boolean;

  /** Extra content rendered at the far-right of the toolbar row (e.g. a send button) */
  toolbarExtra?: ReactNode;

  /** Called when the editor is ready */
  onReady?: (handle: RichTextEditorHandle) => void;
}

export function RichTextEditor({
  value,
  onChange,
  onBlur,
  onFocus,
  placeholder = "Start writing...",
  editable = true,
  className,
  mentions,
  fileUpload,
  plugins: extraPlugins,
  showToolbar,
  toolbarExtra,
  onReady,
}: RichTextEditorProps) {
  const [crepe, setCrepe] = useState<Crepe | null>(null);
  const crepeRef = useRef<Crepe | null>(null);
  const fileUploadConfigRef = useRef<{
    attachableType: string;
    attachableId: string;
    onError: (msg: string) => void;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { active, plugin: toolbarPlugin } = useToolbarPlugin();

  // Keep file upload config ref current
  fileUploadConfigRef.current = fileUpload
    ? {
        attachableType: fileUpload.attachableType,
        attachableId: fileUpload.attachableId,
        onError: fileUpload.onError,
      }
    : null;

  const toolbarVisible = showToolbar ?? editable;

  // Paste/drop upload plugin (stable across renders, uses refs)
  const pasteUploadPlugin = useMemo(
    () => createPasteUploadPlugin(crepeRef, fileUploadConfigRef),
    [],
  );

  const editorPlugins = useMemo(
    () => [
      ...imageBlockPlugins,
      ...fileAttachmentPlugins,
      ...imageGridPlugins,
      ...nodeViewPlugins,
      toolbarPlugin,
      pasteUploadPlugin,
      ...(extraPlugins ?? []),
    ],
    [toolbarPlugin, pasteUploadPlugin, extraPlugins],
  );

  const handleReady = (handle: MilkdownEditorHandle) => {
    const c = handle.getCrepe();
    setCrepe(c);
    crepeRef.current = c;
    onReady?.(handle);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !crepe || !fileUpload) return;

    handleFilesUpload(crepe, Array.from(files), {
      onError: fileUpload.onError,
      attachableType: fileUpload.attachableType,
      attachableId: fileUpload.attachableId,
    });
    e.target.value = "";
  };

  return (
    <>
      {toolbarVisible && (
        <div className="px-2 py-1.5 border-b border-dark-border flex items-center gap-0.5 sticky top-0 z-10 bg-inherit">
          <EditorToolbar active={active} crepe={crepe} />
          {fileUpload && (
            <>
              <div className="w-px h-5 bg-dark-border mx-0.5" />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded text-dark-text-muted hover:bg-dark-surface hover:text-dark-text transition-colors"
                title="Upload file"
                onMouseDown={(e) => e.preventDefault()}
              >
                <Paperclip size={16} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileInputChange}
              />
            </>
          )}
          {toolbarExtra && (
            <div className="ml-auto flex items-center gap-1">{toolbarExtra}</div>
          )}
        </div>
      )}
      <MilkdownEditor
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        placeholder={placeholder}
        editable={editable}
        mentions={mentions}
        plugins={editorPlugins}
        features={{
          toolbar: false,
          "block-edit": false,
          "image-block": false,
          "code-mirror": false,
          table: false,
          latex: false,
        } as any}
        onReady={handleReady}
        className={`[&_.milkdown_.editor]:p-3 ${className ?? ""}`}
      />
    </>
  );
}
