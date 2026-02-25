import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import { ResizableImage } from "./ResizableImageExtension";
import { Bold, Italic, Heading2, Heading3, Image as ImageIcon, Highlighter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";
import { uploadBlogImage } from "@/services/blogs/uploadBlogImage";
import { useAuth } from "@/context/AuthContext";

const HIGHLIGHT_COLORS = [
  { label: "Yellow",  color: "#FEF08A" },
  { label: "Orange",  color: "#FED7AA" },
  { label: "Green",   color: "#BBF7D0" },
  { label: "Blue",    color: "#BAE6FD" },
  { label: "Pink",    color: "#FBCFE8" },
];

interface BlogRichEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export function BlogRichEditor({ content, onChange }: BlogRichEditorProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showColors, setShowColors] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Write your blog here..." }),
      Highlight.configure({ multicolor: true }),
      ResizableImage,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !editor) return;

    const url = await uploadBlogImage(file, user.id);
    if (url) {
      editor
        .chain()
        .focus()
        .insertContent({ type: "resizableImage", attrs: { src: url, alt: file.name } })
        .run();
    }
    e.target.value = "";
  };

  if (!editor) return null;

  const btn = (active: boolean) =>
    `h-7 px-2.5 text-xs ${active ? "bg-muted text-foreground" : "text-muted-foreground"}`;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 mb-4 pb-3 border-b border-border flex-wrap">
        <Button
          variant="ghost" size="sm" className={btn(editor.isActive("bold"))}
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}
        >
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost" size="sm" className={btn(editor.isActive("italic"))}
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }}
        >
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost" size="sm" className={btn(editor.isActive("heading", { level: 2 }))}
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run(); }}
        >
          <Heading2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost" size="sm" className={btn(editor.isActive("heading", { level: 3 }))}
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 3 }).run(); }}
        >
          <Heading3 className="h-3.5 w-3.5" />
        </Button>

        <div className="w-px h-4 bg-border mx-1" />

        {/* Highlight button + color picker */}
        <div className="relative">
          <Button
            variant="ghost" size="sm"
            className={btn(editor.isActive("highlight"))}
            onMouseDown={(e) => {
              e.preventDefault();
              setShowColors((v) => !v);
            }}
          >
            <Highlighter className="h-3.5 w-3.5" />
          </Button>

          {showColors && (
            <div className="absolute top-9 left-0 z-50 flex gap-1.5 p-2 bg-background border border-border rounded-md shadow-md">
              {/* Remove highlight */}
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  editor.chain().focus().unsetHighlight().run();
                  setShowColors(false);
                }}
                className="w-5 h-5 rounded border border-border flex items-center justify-center text-muted-foreground hover:bg-muted text-[10px]"
                title="Remove highlight"
              >
                ✕
              </button>
              {HIGHLIGHT_COLORS.map(({ label, color }) => (
                <button
                  key={color}
                  title={label}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    editor.chain().focus().setHighlight({ color }).run();
                    setShowColors(false);
                  }}
                  className="w-5 h-5 rounded border border-border hover:scale-110 transition-transform"
                  style={{ background: color }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-4 bg-border mx-1" />

        <Button
          variant="ghost" size="sm" className="h-7 px-2.5 text-muted-foreground"
          onMouseDown={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}
        >
          <ImageIcon className="h-3.5 w-3.5" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>

      <EditorContent editor={editor} className="blog-editor" onClick={() => setShowColors(false)} />
    </div>
  );
}
