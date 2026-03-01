import { $nodeSchema, $remark } from "@milkdown/utils";
import type { RemarkPluginRaw } from "@milkdown/transformer";

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
 * Remark plugin to parse :::image-grid blocks containing ::image{...} directives.
 *
 * Markdown format:
 * :::image-grid
 * ::image{assetId="uuid1" filename="a.jpg"}
 * ::image{assetId="uuid2" filename="b.jpg"}
 * :::
 */
const remarkImageGridPlugin: RemarkPluginRaw<Record<string, unknown>> =
  function () {
    return (tree: any) => {
      if (!tree.children) return;

      for (let i = 0; i < tree.children.length; i++) {
        const child = tree.children[i];

        // Look for a paragraph that starts with :::image-grid
        if (child.type === "paragraph" && child.children?.length >= 1) {
          const firstText = child.children[0];
          if (
            firstText.type === "text" &&
            firstText.value.startsWith(":::image-grid")
          ) {
            // Parse the full text content of this paragraph
            const fullText = child.children
              .map((c: any) => getPlainText(c.children || [{ type: "text", value: c.value || "" }]))
              .join("");
            const gridNode = parseImageGrid(fullText);
            if (gridNode) {
              tree.children[i] = gridNode;
              continue;
            }
          }
        }

        // Also check for code blocks or other container-like structures
        // that might wrap the grid content
        if (child.type === "code" && child.value?.startsWith("::image-grid")) {
          const gridNode = parseImageGrid(":::" + child.value + "\n:::");
          if (gridNode) {
            tree.children[i] = gridNode;
            continue;
          }
        }

        visitForGrid(child);
      }
    };
  };

/**
 * Recursively visit nodes looking for image-grid patterns.
 */
function visitForGrid(node: any) {
  if (!node.children) return;

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];

    if (child.type === "paragraph" && child.children?.length >= 1) {
      const firstText = child.children[0];
      if (
        firstText.type === "text" &&
        firstText.value.startsWith(":::image-grid")
      ) {
        const fullText = child.children
          .map((c: any) => getPlainText(c.children || [{ type: "text", value: c.value || "" }]))
          .join("");
        const gridNode = parseImageGrid(fullText);
        if (gridNode) {
          node.children[i] = gridNode;
          continue;
        }
      }
    }

    visitForGrid(child);
  }
}

/**
 * Parse :::image-grid block text into an MDAST node.
 */
function parseImageGrid(text: string): any | null {
  // Match the full :::image-grid ... ::: block
  const lines = text.split("\n");
  const images: Record<string, string>[] = [];
  let inGrid = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === ":::image-grid") {
      inGrid = true;
      continue;
    }
    if (trimmed === ":::" && inGrid) {
      break;
    }
    if (inGrid) {
      const match = trimmed.match(/^::image\{([^}]+)\}$/);
      if (match) {
        images.push(parseAttrs(match[1]));
      }
    }
  }

  if (images.length === 0) return null;

  return {
    type: "imageGrid",
    data: { images },
    children: images.map((img) => ({
      type: "imageBlock",
      data: img,
    })),
  };
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

export const remarkImageGrid = $remark(
  "remarkImageGrid",
  () => remarkImageGridPlugin,
);

/**
 * Milkdown image-grid node schema.
 * Contains imageBlock nodes as children.
 */
export const imageGridSchema = $nodeSchema("imageGrid", () => ({
    group: "block",
    content: "imageBlock+",
    selectable: true,
    draggable: true,
    marks: "",
    parseDOM: [
      {
        tag: 'div[data-type="image-grid"]',
      },
    ],
    toDOM: () => [
      "div",
      {
        "data-type": "image-grid",
        class: "image-grid-wrapper",
      },
      0, // Content hole for child imageBlock nodes
    ],
    parseMarkdown: {
      match: (mdNode: any) => mdNode.type === "imageGrid",
      runner: (state: any, mdNode: any, proseType: any) => {
        // Open the grid node, add children, then close
        state.openNode(proseType);
        const images = mdNode.data?.images || [];
        if (mdNode.children) {
          state.next(mdNode.children);
        } else if (images.length > 0) {
          // Fallback: create imageBlock children from data
          for (const img of images) {
            const imageBlockType = state.schema.nodes.imageBlock;
            if (imageBlockType) {
              state.addNode(imageBlockType, {
                assetId: img.assetId || "",
                filename: img.filename || "",
                alt: img.alt || "",
                caption: img.caption || "",
              });
            }
          }
        }
        state.closeNode();
      },
    },
    toMarkdown: {
      match: (node: any) => node.type.name === "imageGrid",
      runner: (state: any, node: any) => {
        // Build :::image-grid block
        const lines = [":::image-grid"];
        node.content.forEach((child: any) => {
          if (child.type.name === "imageBlock") {
            const attrs: string[] = [];
            if (child.attrs.assetId) attrs.push(`assetId="${child.attrs.assetId}"`);
            if (child.attrs.filename) attrs.push(`filename="${child.attrs.filename}"`);
            if (child.attrs.alt) attrs.push(`alt="${child.attrs.alt}"`);
            if (child.attrs.caption) attrs.push(`caption="${child.attrs.caption}"`);
            lines.push(`::image{${attrs.join(" ")}}`);
          }
        });
        lines.push(":::");
        state.addNode("paragraph", undefined, undefined, {
          children: [{ type: "text", value: lines.join("\n") }],
        });
      },
    },
}));

export const imageGridPlugins = [...remarkImageGrid, imageGridSchema.node, imageGridSchema.ctx];
