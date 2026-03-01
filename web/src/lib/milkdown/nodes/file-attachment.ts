import { $nodeSchema, $remark } from "@milkdown/utils";
import type { RemarkPluginRaw } from "@milkdown/transformer";

/**
 * Remark plugin to parse ::file{assetId="..." filename="..." contentType="..." size="..."}
 * directives into fileAttachment MDAST nodes.
 */
const remarkFileAttachmentPlugin: RemarkPluginRaw<Record<string, unknown>> =
  function () {
    return (tree: any) => {
      visitTextNodes(tree, (node: any, index: number, parent: any) => {
        if (typeof node.value !== "string") return;
        const regex = /^::file\{([^}]+)\}$/;
        const match = node.value.match(regex);
        if (match) {
          const attrs = parseAttrs(match[1]);
          parent.children[index] = {
            type: "fileAttachment",
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
      const regex = /^::file\{([^}]+)\}$/;
      const match = fullText.match(regex);
      if (match) {
        const attrs = parseAttrs(match[1]);
        tree.children[i] = {
          type: "fileAttachment",
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

export const remarkFileAttachment = $remark(
  "remarkFileAttachment",
  () => remarkFileAttachmentPlugin,
);

/**
 * Milkdown file-attachment node schema.
 */
export const fileAttachmentSchema = $nodeSchema("fileAttachment", () => ({
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  marks: "",
  attrs: {
    assetId: { default: "" },
    filename: { default: "" },
    contentType: { default: "" },
    size: { default: "0" },
  },
  parseDOM: [
    {
      tag: 'div[data-type="file-attachment"]',
      getAttrs: (dom: Node) => {
        if (!(dom instanceof HTMLElement)) return false;
        return {
          assetId: dom.getAttribute("data-asset-id") || "",
          filename: dom.getAttribute("data-filename") || "",
          contentType: dom.getAttribute("data-content-type") || "",
          size: dom.getAttribute("data-size") || "0",
        };
      },
    },
  ],
  toDOM: (node: any) => [
    "div",
    {
      "data-type": "file-attachment",
      "data-asset-id": node.attrs.assetId,
      "data-filename": node.attrs.filename,
      "data-content-type": node.attrs.contentType,
      "data-size": node.attrs.size,
      class: "file-attachment-wrapper",
    },
    ["span", { class: "file-attachment-name" }, node.attrs.filename],
  ],
  parseMarkdown: {
    match: (mdNode: any) => mdNode.type === "fileAttachment",
    runner: (state: any, mdNode: any, proseType: any) => {
      state.addNode(proseType, {
        assetId: mdNode.data?.assetId || "",
        filename: mdNode.data?.filename || "",
        contentType: mdNode.data?.contentType || "",
        size: mdNode.data?.size || "0",
      });
    },
  },
  toMarkdown: {
    match: (node: any) => node.type.name === "fileAttachment",
    runner: (state: any, node: any) => {
      const attrs: string[] = [];
      if (node.attrs.assetId) attrs.push(`assetId="${node.attrs.assetId}"`);
      if (node.attrs.filename) attrs.push(`filename="${node.attrs.filename}"`);
      if (node.attrs.contentType) attrs.push(`contentType="${node.attrs.contentType}"`);
      if (node.attrs.size) attrs.push(`size="${node.attrs.size}"`);
      state.addNode("paragraph", undefined, undefined, {
        children: [{ type: "text", value: `::file{${attrs.join(" ")}}` }],
      });
    },
  },
}));

export const fileAttachmentPlugins = [...remarkFileAttachment, fileAttachmentSchema.node, fileAttachmentSchema.ctx];
