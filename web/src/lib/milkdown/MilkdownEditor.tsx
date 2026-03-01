import { useEffect, useRef } from "react";
import { Crepe, CrepeFeature } from "@milkdown/crepe";
import { replaceAll } from "@milkdown/utils";
import { editorViewCtx } from "@milkdown/core";
import type { MilkdownPlugin } from "@milkdown/ctx";
import { isHtml, htmlToMarkdown } from "./convert";
import {
  mentionPlugins,
  mentionMembersCtx,
  mentionActiveCtx,
} from "./mention-plugin";
import type { MentionMember } from "@/components/ui/MentionList";

import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/nord-dark.css";
import "./milkdown.css";

export interface MilkdownEditorHandle {
  getMarkdown: () => string;
  focus: () => void;
  getCrepe: () => Crepe | null;
}

interface MilkdownEditorProps {
  value: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
  /** Enable mention support with workspace members */
  mentions?: {
    members: MentionMember[];
    onActiveChange?: (active: boolean) => void;
  };
  /** Additional Milkdown plugins to load */
  plugins?: MilkdownPlugin[];
  /** Crepe features override */
  features?: Partial<Record<CrepeFeature, boolean>>;
  /** Called when the editor is ready with a handle for imperative actions */
  onReady?: (handle: MilkdownEditorHandle) => void;
}

/**
 * Normalize value: convert HTML to markdown if needed, normalize empty states.
 */
function normalizeValue(value: string): string {
  if (!value || !value.trim()) return "";
  return isHtml(value) ? htmlToMarkdown(value) : value;
}

export function MilkdownEditor({
  value,
  onChange,
  onBlur,
  onFocus,
  placeholder = "Start writing...",
  editable = true,
  className,
  mentions,
  plugins: extraPlugins,
  features: featureOverrides,
  onReady,
}: MilkdownEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const crepeRef = useRef<Crepe | null>(null);
  const onChangeRef = useRef(onChange);
  const onBlurRef = useRef(onBlur);
  const onFocusRef = useRef(onFocus);
  const onReadyRef = useRef(onReady);
  const isInternalUpdate = useRef(false);
  const isCreated = useRef(false);
  const lastEmittedMarkdown = useRef<string>("");

  const valueRef = useRef(value);

  // Keep callback refs current without causing re-renders
  onChangeRef.current = onChange;
  onBlurRef.current = onBlur;
  onFocusRef.current = onFocus;
  onReadyRef.current = onReady;
  valueRef.current = value;

  // Initialize Crepe editor on mount
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;

    const initialValue = normalizeValue(value);

    const crepe = new Crepe({
      root: el,
      defaultValue: initialValue,
      features: {
        [CrepeFeature.Placeholder]: true,
        [CrepeFeature.Toolbar]: false,
        [CrepeFeature.ListItem]: true,
        [CrepeFeature.LinkTooltip]: true,
        [CrepeFeature.BlockEdit]: false,
        [CrepeFeature.ImageBlock]: false,
        [CrepeFeature.CodeMirror]: false,
        [CrepeFeature.Table]: false,
        [CrepeFeature.Latex]: false,
        [CrepeFeature.Cursor]: false,
        ...featureOverrides,
      },
      featureConfigs: {
        [CrepeFeature.Placeholder]: {
          text: placeholder,
          mode: "doc",
        },
      },
    });

    // Add mention plugins if mentions are configured
    if (mentions) {
      for (const plugin of mentionPlugins) {
        crepe.editor.use(plugin);
      }
    }

    // Add extra plugins
    if (extraPlugins) {
      for (const plugin of extraPlugins) {
        crepe.editor.use(plugin);
      }
    }

    crepe.setReadonly(!editable);

    crepe.on((listener) => {
      listener.markdownUpdated((_ctx, markdown) => {
        if (!isInternalUpdate.current) {
          lastEmittedMarkdown.current = markdown;
          onChangeRef.current?.(markdown);
        }
      });
      listener.blur(() => {
        onBlurRef.current?.();
      });
      listener.focus(() => {
        onFocusRef.current?.();
      });
    });

    crepe.create().then(() => {
      crepeRef.current = crepe;
      isCreated.current = true;

      // Re-apply readonly after create (pre-create setReadonly may not take effect)
      crepe.setReadonly(!editable);

      // Set mention members after creation
      if (mentions) {
        crepe.editor.action((ctx) => {
          ctx.set(mentionMembersCtx.key, mentions.members);
          if (mentions.onActiveChange) {
            ctx.set(mentionActiveCtx.key, mentions.onActiveChange);
          }
        });
      }

      // Notify parent that editor is ready
      onReadyRef.current?.({
        getMarkdown: () => crepe.getMarkdown(),
        focus: () => {
          try {
            crepe.editor.action((ctx) => {
              const view = ctx.get(editorViewCtx);
              view.focus();
            });
          } catch {
            // Fallback: focus the editor DOM element
            el.querySelector<HTMLElement>(".editor")?.focus();
          }
        },
        getCrepe: () => crepe,
      });
    });

    return () => {
      isCreated.current = false;
      crepeRef.current = null;
      crepe.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync editable state. When switching to readonly, force-sync the editor
  // content with the value prop to handle the race condition where a node view's
  // blur handler (e.g. caption save) mutates ProseMirror state in the same event
  // cycle as cancel, causing React to batch away the value change.
  useEffect(() => {
    const crepe = crepeRef.current;
    if (!crepe || !isCreated.current) return;

    crepe.setReadonly(!editable);

    if (!editable) {
      const expected = normalizeValue(valueRef.current);
      if (expected !== crepe.getMarkdown()) {
        isInternalUpdate.current = true;
        try {
          crepe.editor.action(replaceAll(expected));
        } finally {
          setTimeout(() => {
            isInternalUpdate.current = false;
          }, 0);
        }
      }
    }
  }, [editable]);

  // Sync mention members when they change
  useEffect(() => {
    if (crepeRef.current && isCreated.current && mentions) {
      crepeRef.current.editor.action((ctx) => {
        ctx.set(mentionMembersCtx.key, mentions.members);
      });
    }
  }, [mentions?.members]);

  // Sync external value changes via replaceAll.
  // Skip when the value came from the editor's own editing (round-trip via parent state).
  useEffect(() => {
    const crepe = crepeRef.current;
    if (!crepe || !isCreated.current) return;

    // If the incoming value matches what the editor last emitted, skip —
    // this is a round-trip from the editor's own onChange, not an external change.
    if (value === lastEmittedMarkdown.current) return;

    const newValue = normalizeValue(value);

    if (newValue !== crepe.getMarkdown()) {
      isInternalUpdate.current = true;
      try {
        crepe.editor.action(replaceAll(newValue));
      } finally {
        setTimeout(() => {
          isInternalUpdate.current = false;
        }, 0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <div ref={editorRef} className={className} />;
}
