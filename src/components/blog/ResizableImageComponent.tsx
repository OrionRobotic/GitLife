import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { useCallback, useRef } from "react";

export default function ResizableImageComponent({
  node,
  updateAttributes,
  deleteNode,
  selected,
}: NodeViewProps) {
  const startX = useRef(0);
  const startWidth = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      startX.current = e.clientX;
      startWidth.current = node.attrs.width ?? 500;

      const handleMouseMove = (e: MouseEvent) => {
        const newWidth = Math.max(80, startWidth.current + (e.clientX - startX.current));
        updateAttributes({ width: newWidth });
      };

      const handleMouseUp = () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [node.attrs.width, updateAttributes]
  );

  const align: "left" | "center" | "right" = node.attrs.align ?? "center";

  const justifyMap = { left: "flex-start", center: "center", right: "flex-end" };

  return (
    <NodeViewWrapper>
      <div
        style={{
          display: "flex",
          justifyContent: justifyMap[align],
          margin: "1.25rem 0",
          userSelect: "none",
        }}
      >
        <div style={{ position: "relative", display: "inline-block" }}>
          <img
            src={node.attrs.src}
            alt={node.attrs.alt ?? ""}
            draggable={false}
            style={{
              width: node.attrs.width ? `${node.attrs.width}px` : "auto",
              maxWidth: "100%",
              display: "block",
              borderRadius: "6px",
              outline: selected ? "2px solid #D97757" : "2px solid transparent",
              transition: "outline 0.15s",
            }}
          />

          {/* Resize handle — bottom-right corner */}
          <div
            onMouseDown={handleMouseDown}
            style={{
              position: "absolute",
              right: -5,
              bottom: -5,
              width: 14,
              height: 14,
              background: "#D97757",
              borderRadius: 3,
              cursor: "se-resize",
              opacity: selected ? 1 : 0,
              transition: "opacity 0.15s",
            }}
          />

          {/* Floating toolbar when selected */}
          {selected && (
            <div
              style={{
                position: "absolute",
                top: -38,
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(30,25,20,0.85)",
                backdropFilter: "blur(4px)",
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                gap: 2,
                padding: "4px 10px",
                whiteSpace: "nowrap",
                zIndex: 50,
              }}
            >
              {(["left", "center", "right"] as const).map((a) => (
                <button
                  key={a}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    updateAttributes({ align: a });
                  }}
                  style={{
                    color: align === a ? "#D97757" : "rgba(255,255,255,0.7)",
                    fontSize: 11,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "2px 4px",
                    textTransform: "capitalize",
                    fontFamily: "inherit",
                  }}
                >
                  {a}
                </button>
              ))}
              <span style={{ color: "rgba(255,255,255,0.25)", padding: "0 2px" }}>|</span>
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  deleteNode();
                }}
                style={{
                  color: "#ef4444",
                  fontSize: 11,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "2px 4px",
                  fontFamily: "inherit",
                }}
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );
}
