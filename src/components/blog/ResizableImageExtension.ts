import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import ResizableImageComponent from "./ResizableImageComponent";

export const ResizableImage = Node.create({
  name: "resizableImage",
  group: "block",
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: "" },
      width: { default: null },
      align: { default: "center" },
    };
  },

  parseHTML() {
    return [
      {
        tag: "img[src]",
        getAttrs: (element) => {
          const el = element as HTMLElement;
          const style = el.getAttribute("style") ?? "";

          const widthMatch = style.match(/width:\s*(\d+)px/);
          const width = widthMatch ? parseInt(widthMatch[1]) : null;

          const marginMatch = style.match(/margin:\s*([^;]+)/);
          let align = "center";
          if (marginMatch) {
            const m = marginMatch[1].trim();
            if (m === "0 auto 0 0") align = "left";
            else if (m === "0 0 0 auto") align = "right";
          }

          return {
            src: el.getAttribute("src"),
            alt: el.getAttribute("alt") ?? "",
            width,
            align,
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { width, align, ...rest } = HTMLAttributes;
    const marginMap: Record<string, string> = {
      left: "0 auto 0 0",
      right: "0 0 0 auto",
      center: "0 auto",
    };
    return [
      "img",
      mergeAttributes(rest, {
        style: [
          width ? `width: ${width}px` : "",
          "max-width: 100%",
          "display: block",
          "border-radius: 6px",
          `margin: ${marginMap[align ?? "center"] ?? "0 auto"}`,
        ]
          .filter(Boolean)
          .join("; "),
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },
});
