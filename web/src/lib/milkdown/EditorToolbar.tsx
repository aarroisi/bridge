import { useCallback, useMemo, useRef, useState } from "react";
import type { Crepe } from "@milkdown/crepe";
import { commandsCtx, editorViewCtx } from "@milkdown/core";
import {
  headingSchema,
  paragraphSchema,
  blockquoteSchema,
  bulletListSchema,
  orderedListSchema,
  toggleStrongCommand,
  toggleEmphasisCommand,
  toggleInlineCodeCommand,
  setBlockTypeCommand,
  wrapInBlockTypeCommand,
} from "@milkdown/kit/preset/commonmark";
import {
  toggleStrikethroughCommand,
} from "@milkdown/kit/preset/gfm";
import { findNodeInSelection } from "@milkdown/prose";
import { lift } from "@milkdown/kit/prose/commands";
import type { MarkType, NodeType } from "@milkdown/kit/prose/model";
import type { EditorView } from "@milkdown/kit/prose/view";
import { Plugin, PluginKey } from "@milkdown/kit/prose/state";
import { $prose } from "@milkdown/utils";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
} from "lucide-react";

interface ActiveState {
  bold: boolean;
  italic: boolean;
  strikethrough: boolean;
  code: boolean;
  h1: boolean;
  h2: boolean;
  h3: boolean;
  blockquote: boolean;
  bulletList: boolean;
  orderedList: boolean;
}

const defaultState: ActiveState = {
  bold: false,
  italic: false,
  strikethrough: false,
  code: false,
  h1: false,
  h2: false,
  h3: false,
  blockquote: false,
  bulletList: false,
  orderedList: false,
};

const toolbarPluginKey = new PluginKey("editorToolbarState");

/**
 * Read active formatting state directly from ProseMirror's EditorView.
 * Uses native ProseMirror schema types (no Milkdown ctx needed).
 */
function readActiveFromView(view: EditorView): ActiveState {
  const { state } = view;
  const { from, $from, to, empty } = state.selection;
  const { marks, nodes } = state.schema;

  const isMarkActive = (markType: MarkType | undefined) => {
    if (!markType) return false;
    if (empty) return !!markType.isInSet(state.storedMarks || $from.marks());
    return state.doc.rangeHasMark(from, to, markType);
  };

  const bold = isMarkActive(marks.strong);
  const italic = isMarkActive(marks.emphasis);
  const strikethrough = isMarkActive(marks.strikethrough);
  const code = isMarkActive(marks.inlineCode);

  let h1 = false,
    h2 = false,
    h3 = false;
  const headingType = nodes.heading;
  if (headingType) {
    for (let d = $from.depth; d >= 0; d--) {
      const node = $from.node(d);
      if (node.type === headingType) {
        h1 = node.attrs.level === 1;
        h2 = node.attrs.level === 2;
        h3 = node.attrs.level === 3;
        break;
      }
    }
  }

  const isInsideNode = (nodeType: NodeType | undefined) => {
    if (!nodeType) return false;
    for (let d = $from.depth; d >= 0; d--) {
      if ($from.node(d).type === nodeType) return true;
    }
    return false;
  };

  const blockquote = isInsideNode(nodes.blockquote);
  const bulletList = isInsideNode(nodes.bullet_list);
  const orderedList = isInsideNode(nodes.ordered_list);

  return {
    bold,
    italic,
    strikethrough,
    code,
    h1,
    h2,
    h3,
    blockquote,
    bulletList,
    orderedList,
  };
}

// Module-level registry: maps plugin key to callback
const callbackRegistry = new Map<
  string,
  (state: ActiveState) => void
>();

let pluginIdCounter = 0;

/**
 * Hook that creates a ProseMirror plugin for tracking toolbar active state.
 * The returned plugin MUST be passed to MilkdownEditor's `plugins` prop
 * so it is registered before editor creation.
 */
export function useToolbarPlugin() {
  const [active, setActive] = useState<ActiveState>(defaultState);
  const idRef = useRef<string>("");

  if (!idRef.current) {
    idRef.current = `toolbar-${++pluginIdCounter}`;
  }

  // Keep callback in registry
  callbackRegistry.set(idRef.current, setActive);

  const plugin = useMemo(() => {
    const id = idRef.current;
    return $prose(() => {
      return new Plugin({
        key: toolbarPluginKey,
        view() {
          return {
            update(view) {
              const cb = callbackRegistry.get(id);
              if (cb) {
                try {
                  cb(readActiveFromView(view));
                } catch {
                  // Editor not fully ready
                }
              }
            },
          };
        },
      });
    });
  }, []);

  return { active, plugin };
}

interface EditorToolbarProps {
  active: ActiveState;
  crepe: Crepe | null;
  className?: string;
}

export function EditorToolbar({
  active,
  crepe,
  className,
}: EditorToolbarProps) {
  const runCommand = useCallback(
    (action: (ctx: any) => void) => {
      if (!crepe) return;
      crepe.editor.action((ctx) => {
        action(ctx);
        const view = ctx.get(editorViewCtx);
        view.focus();
      });
    },
    [crepe],
  );

  const toggleBold = useCallback(
    () =>
      runCommand((ctx) =>
        ctx.get(commandsCtx).call(toggleStrongCommand.key),
      ),
    [runCommand],
  );
  const toggleItalic = useCallback(
    () =>
      runCommand((ctx) =>
        ctx.get(commandsCtx).call(toggleEmphasisCommand.key),
      ),
    [runCommand],
  );
  const toggleStrike = useCallback(
    () =>
      runCommand((ctx) =>
        ctx.get(commandsCtx).call(toggleStrikethroughCommand.key),
      ),
    [runCommand],
  );
  const toggleCode = useCallback(
    () =>
      runCommand((ctx) =>
        ctx.get(commandsCtx).call(toggleInlineCodeCommand.key),
      ),
    [runCommand],
  );

  const toggleHeading = useCallback(
    (level: number) =>
      runCommand((ctx) => {
        const state = ctx.get(editorViewCtx).state;
        const result = findNodeInSelection(state, headingSchema.type(ctx));
        const commands = ctx.get(commandsCtx);
        if (result?.target?.attrs?.level === level) {
          commands.call(setBlockTypeCommand.key, {
            nodeType: paragraphSchema.type(ctx),
          });
        } else {
          commands.call(setBlockTypeCommand.key, {
            nodeType: headingSchema.type(ctx),
            attrs: { level },
          });
        }
      }),
    [runCommand],
  );

  const toggleWrap = useCallback(
    (
      schemaType:
        | typeof blockquoteSchema
        | typeof bulletListSchema
        | typeof orderedListSchema,
    ) =>
      runCommand((ctx) => {
        const view = ctx.get(editorViewCtx);
        if (findNodeInSelection(view.state, schemaType.type(ctx)).hasNode) {
          lift(view.state, view.dispatch);
        } else {
          const commands = ctx.get(commandsCtx);
          commands.call(wrapInBlockTypeCommand.key, {
            nodeType: schemaType.type(ctx),
          });
        }
      }),
    [runCommand],
  );

  const btnClass = (isActive: boolean) =>
    `p-1.5 rounded transition-colors flex items-center justify-center ${
      isActive
        ? "bg-blue-600/30 text-blue-400"
        : "text-dark-text-muted hover:bg-dark-surface hover:text-dark-text"
    }`;

  const iconSize = 16;

  const separator = <div className="w-px h-5 bg-dark-border mx-0.5" />;

  return (
    <div
      className={`flex items-center gap-0.5 ${className ?? ""}`}
      onMouseDown={(e) => e.preventDefault()}
    >
      {/* Inline marks */}
      <button
        className={btnClass(active.bold)}
        onClick={toggleBold}
        title="Bold (Ctrl+B)"
      >
        <Bold size={iconSize} />
      </button>
      <button
        className={btnClass(active.italic)}
        onClick={toggleItalic}
        title="Italic (Ctrl+I)"
      >
        <Italic size={iconSize} />
      </button>
      <button
        className={btnClass(active.strikethrough)}
        onClick={toggleStrike}
        title="Strikethrough"
      >
        <Strikethrough size={iconSize} />
      </button>
      <button
        className={btnClass(active.code)}
        onClick={toggleCode}
        title="Inline Code"
      >
        <Code size={iconSize} />
      </button>

      {separator}

      {/* Headings */}
      <button
        className={btnClass(active.h1)}
        onClick={() => toggleHeading(1)}
        title="Heading 1"
      >
        <Heading1 size={iconSize} />
      </button>
      <button
        className={btnClass(active.h2)}
        onClick={() => toggleHeading(2)}
        title="Heading 2"
      >
        <Heading2 size={iconSize} />
      </button>
      <button
        className={btnClass(active.h3)}
        onClick={() => toggleHeading(3)}
        title="Heading 3"
      >
        <Heading3 size={iconSize} />
      </button>

      {separator}

      {/* Block types */}
      <button
        className={btnClass(active.blockquote)}
        onClick={() => toggleWrap(blockquoteSchema)}
        title="Blockquote"
      >
        <Quote size={iconSize} />
      </button>
      <button
        className={btnClass(active.bulletList)}
        onClick={() => toggleWrap(bulletListSchema)}
        title="Bullet List"
      >
        <List size={iconSize} />
      </button>
      <button
        className={btnClass(active.orderedList)}
        onClick={() => toggleWrap(orderedListSchema)}
        title="Ordered List"
      >
        <ListOrdered size={iconSize} />
      </button>
    </div>
  );
}
