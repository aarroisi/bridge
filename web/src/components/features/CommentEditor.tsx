import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Bold, Italic, List, ListOrdered, Quote, X } from "lucide-react";
import { Message as MessageType } from "@/types";

interface CommentEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  quotingMessage?: MessageType | null;
  onCancelQuote?: () => void;
  autoFocus?: boolean;
  variant?: "default" | "thread";
}

export const CommentEditor = forwardRef<
  HTMLTextAreaElement,
  CommentEditorProps
>(
  (
    {
      value,
      onChange,
      onSubmit,
      placeholder = "Add a comment...",
      quotingMessage,
      onCancelQuote,
      autoFocus = false,
      variant = "default",
    },
    ref,
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Expose the textarea ref to parent
    useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement);

    useEffect(() => {
      if (autoFocus && textareaRef.current) {
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 100);
      }
    }, [autoFocus]);

    // Focus when quoting message changes
    useEffect(() => {
      if (quotingMessage && textareaRef.current) {
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 100);
      }
    }, [quotingMessage]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSubmit();
      }
    };

    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
      const target = e.target as HTMLTextAreaElement;
      target.style.height = "24px";
      target.style.height = target.scrollHeight + "px";
    };

    const isThread = variant === "thread";
    const containerBg = isThread ? "bg-dark-bg" : "bg-dark-surface";
    const toolbarBg = isThread ? "" : "";
    const buttonHoverBg = isThread
      ? "hover:bg-dark-surface"
      : "hover:bg-dark-bg";
    const quoteBg = isThread ? "bg-dark-surface" : "bg-dark-bg";

    return (
      <div
        className={`border border-dark-border rounded-lg ${containerBg} transition-colors hover:border-gray-600 focus-within:!border-blue-500`}
      >
        <div className="flex items-center gap-1 px-3 py-2 border-b border-dark-border">
          <button
            className={`p-1.5 rounded ${buttonHoverBg} transition-colors text-dark-text-muted hover:text-dark-text`}
            title="Bold"
          >
            <Bold size={18} />
          </button>
          <button
            className={`p-1.5 rounded ${buttonHoverBg} transition-colors text-dark-text-muted hover:text-dark-text`}
            title="Italic"
          >
            <Italic size={18} />
          </button>
          <div className="w-px h-5 bg-dark-border mx-1" />
          <button
            className={`p-1.5 rounded ${buttonHoverBg} transition-colors text-dark-text-muted hover:text-dark-text`}
            title="Bullet List"
          >
            <List size={18} />
          </button>
          <button
            className={`p-1.5 rounded ${buttonHoverBg} transition-colors text-dark-text-muted hover:text-dark-text`}
            title="Numbered List"
          >
            <ListOrdered size={18} />
          </button>
          <button
            className={`p-1.5 rounded ${buttonHoverBg} transition-colors text-dark-text-muted hover:text-dark-text`}
            title="Quote"
          >
            <Quote size={18} />
          </button>
        </div>
        {quotingMessage && onCancelQuote && (
          <div className={`px-3 py-2 border-b border-dark-border ${quoteBg}`}>
            <div className="flex items-start gap-2">
              <div className="flex-1 text-sm">
                <div className="flex items-center gap-2 text-dark-text-muted mb-1">
                  <Quote size={14} />
                  <span>Quoting {quotingMessage.userName}</span>
                </div>
                <p className="text-dark-text-muted truncate">
                  {quotingMessage.text}
                </p>
              </div>
              <button
                onClick={onCancelQuote}
                className={`p-1 rounded ${buttonHoverBg} transition-colors text-dark-text-muted hover:text-dark-text`}
                title="Cancel quote"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 px-3 py-3">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            autoFocus={autoFocus}
            className="flex-1 bg-transparent text-dark-text placeholder:text-dark-text-muted focus:outline-none resize-none leading-6 text-base"
            style={{ minHeight: "24px", maxHeight: "200px" }}
            onInput={handleInput}
          />
          <button
            onClick={onSubmit}
            disabled={!value.trim()}
            className="p-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            title="Send"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="transform rotate-45"
            >
              <path
                d="M2 14L14 2M14 2H6M14 2V10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    );
  },
);

CommentEditor.displayName = "CommentEditor";
