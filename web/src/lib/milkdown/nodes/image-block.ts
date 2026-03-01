import { $nodeSchema, $remark } from "@milkdown/utils";
import type { RemarkPluginRaw } from "@milkdown/transformer";

/**
 * Remark plugin to parse ::image{assetId="..." filename="..." alt="..." caption="..."}
 * directives into image-block MDAST nodes.
 */
const remarkImageBlockPlugin: RemarkPluginRaw<Record<string, unknown>> =
  function () {
    return (tree: any) => {
      visitTextNodes(tree, (node: any, index: number, parent: any) => {
        if (typeof node.value !== "string") return;
        // Match ::image{...} but not inside :::image-grid blocks
        const regex = /^::image\{([^}]+)\}$/;
        const match = node.value.match(regex);
        if (match) {
          const attrs = parseAttrs(match[1]);
          parent.children[index] = {
            type: "imageBlock",
            data: attrs,
          };
        }
      });
    };
  };

/**
 * Recursively extract plain text from remark AST nodes,
 * handling autolinked emails (e.g. @ in filenames).
 */
function getPlainText(children: any[]): string {
  return children
    .map((c: any) => {
      if (c.type === "text") return c.value;
      if (c.children) return getPlainText(c.children);
      return "";
    })
    .join("");
}

/**
 * Visit text nodes in a remark AST, also handling paragraph children.
 */
function visitTextNodes(
  tree: any,
  visitor: (node: any, index: number, parent: any) => void,
) {
  if (!tree.children) return;

  for (let i = 0; i < tree.children.length; i++) {
    const child = tree.children[i];

    // Handle paragraphs whose combined text matches our directive
    // (children may be split by autolinks when filenames contain @)
    if (child.type === "paragraph" && child.children?.length >= 1) {
      const fullText = getPlainText(child.children);
      const regex = /^::image\{([^}]+)\}$/;
      const match = fullText.match(regex);
      if (match) {
        const attrs = parseAttrs(match[1]);
        tree.children[i] = {
          type: "imageBlock",
          data: attrs,
        };
        continue;
      }
    }

    visitor(child, i, tree);
    visitTextNodes(child, visitor);
  }
}

function parseAttrs(attrString: string): Record<string, string> {
  const result: Record<string, string> = {};
  const regex = /(\w+)="([^"]*)"/g;
  let match;
  while ((match = regex.exec(attrString)) !== null) {
    result[match[1]] = match[2];
  }
  return result;
}

export const remarkImageBlock = $remark(
  "remarkImageBlock",
  () => remarkImageBlockPlugin,
);

/**
 * Milkdown image-block node schema.
 */
export const imageBlockSchema = $nodeSchema("imageBlock", () => ({
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  marks: "",
  attrs: {
    assetId: { default: "" },
    filename: { default: "" },
    alt: { default: "" },
    caption: { default: "" },
  },
  parseDOM: [
    {
      tag: 'div[data-type="image-block"]',
      getAttrs: (dom: Node) => {
        if (!(dom instanceof HTMLElement)) return false;
        return {
          assetId: dom.getAttribute("data-asset-id") || "",
          filename: dom.getAttribute("data-filename") || "",
          alt: dom.getAttribute("data-alt") || "",
          caption: dom.getAttribute("data-caption") || "",
        };
      },
    },
  ],
  toDOM: (node: any) => [
    "div",
    {
      "data-type": "image-block",
      "data-asset-id": node.attrs.assetId,
      "data-filename": node.attrs.filename,
      "data-alt": node.attrs.alt,
      "data-caption": node.attrs.caption,
      class: "image-block-wrapper",
    },
    ["img", { alt: node.attrs.alt || node.attrs.filename }],
  ],
  parseMarkdown: {
    match: (mdNode: any) => mdNode.type === "imageBlock",
    runner: (state: any, mdNode: any, proseType: any) => {
      state.addNode(proseType, {
        assetId: mdNode.data?.assetId || "",
        filename: mdNode.data?.filename || "",
        alt: mdNode.data?.alt || "",
        caption: mdNode.data?.caption || "",
      });
    },
  },
  toMarkdown: {
    match: (node: any) => node.type.name === "imageBlock",
    runner: (state: any, node: any) => {
      const attrs: string[] = [];
      if (node.attrs.assetId) attrs.push(`assetId="${node.attrs.assetId}"`);
      if (node.attrs.filename) attrs.push(`filename="${node.attrs.filename}"`);
      if (node.attrs.alt) attrs.push(`alt="${node.attrs.alt}"`);
      if (node.attrs.caption) attrs.push(`caption="${node.attrs.caption}"`);
      state.addNode("paragraph", undefined, undefined, {
        children: [{ type: "text", value: `::image{${attrs.join(" ")}}` }],
      });
    },
  },
}));

export const imageBlockPlugins = [...remarkImageBlock, imageBlockSchema.node, imageBlockSchema.ctx];
