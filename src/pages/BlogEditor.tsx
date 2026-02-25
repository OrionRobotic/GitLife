import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Tag, X } from "lucide-react";
import { format } from "date-fns";
import { MenuButton } from "@/components/MenuButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/context/AuthContext";
import { getBlog, createBlog, updateBlog, getLabels, saveLabel } from "@/services/blogs";
import type { BlogLabel } from "@/services/blogs/getLabels";
import { BlogRichEditor } from "@/components/blog/BlogRichEditor";

const LABEL_COLORS = [
  // Orange shades
  { label: "Amber",       color: "#F5C842" },
  { label: "Orange",      color: "#F5AA45" },
  { label: "Deep Orange", color: "#F07020" },
  { label: "Burnt",       color: "#E8530A" },
  // Bookshelf teal shades
  { label: "Mist",        color: "#C3D4D0" },
  { label: "Sage",        color: "#ABBFB8" },
  { label: "Teal",        color: "#8EA8A1" },
  { label: "Forest",      color: "#708F88" },
];

export default function BlogEditor() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [labelName, setLabelName] = useState<string | null>(null);
  const [labelColor, setLabelColor] = useState<string | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(isNew);

  // Label popover state
  const [labelOpen, setLabelOpen] = useState(false);
  const [labelInput, setLabelInput] = useState("");
  const [selectedColor, setSelectedColor] = useState(LABEL_COLORS[1].color);
  const [savedLabels, setSavedLabels] = useState<BlogLabel[]>([]);

  useEffect(() => {
    if (!user) return;
    getLabels(user.id).then(setSavedLabels);
  }, [user]);

  useEffect(() => {
    if (isNew || !id) return;
    (async () => {
      const blog = await getBlog(id);
      if (blog) {
        setTitle(blog.title);
        setContent(blog.content);
        setCreatedAt(blog.createdAt);
        setLabelName(blog.labelName);
        setLabelColor(blog.labelColor);
        if (blog.labelColor) setSelectedColor(blog.labelColor);
        if (blog.labelName) setLabelInput(blog.labelName);
      }
      setLoading(false);
    })();
  }, [id, isNew]);

  const applyLabel = async () => {
    const name = labelInput.trim();
    if (!name || !user) return;
    setLabelName(name);
    setLabelColor(selectedColor);
    setLabelOpen(false);
    // Save to DB if not already there
    const exists = savedLabels.some((l) => l.name === name && l.color === selectedColor);
    if (!exists) {
      await saveLabel(name, selectedColor, user.id);
      setSavedLabels((prev) => [{ id: Date.now().toString(), name, color: selectedColor }, ...prev]);
    }
  };

  const pickSavedLabel = (label: BlogLabel) => {
    setLabelName(label.name);
    setLabelColor(label.color);
    setLabelInput(label.name);
    setSelectedColor(label.color);
    setLabelOpen(false);
  };

  const removeLabel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLabelName(null);
    setLabelColor(null);
    setLabelInput("");
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    if (isNew) {
      const blog = await createBlog({ title, content, labelName, labelColor }, user.id);
      if (blog) navigate("/blogs", { replace: true });
    } else if (id) {
      const updated = await updateBlog({ id, title, content, labelName, labelColor });
      if (updated) setIsEditing(false);
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full px-6 py-6 flex items-center justify-between">
        <Link to="/blogs">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Blogs
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          {!isNew && !isEditing && (
            <Button
              variant="outline"
              size="sm"
              className="border-[#D97757] hover:border-[#D97757] hover:bg-background"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
          )}
          <MenuButton />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 pb-32">
        {/* Title */}
        {isEditing ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full bg-transparent text-3xl font-normal text-foreground outline-none border-none placeholder:text-muted-foreground/40 mb-2"
            autoFocus={isNew}
          />
        ) : (
          <h1 className="text-3xl font-normal text-foreground mb-2">
            {title || "Untitled"}
          </h1>
        )}

        {createdAt && (
          <p className="text-sm text-muted-foreground mb-3">
            {format(new Date(createdAt), "MMMM d, yyyy")}
          </p>
        )}

        {/* Label */}
        <div className="mb-6 min-h-[24px]">
          {isEditing ? (
            <Popover open={labelOpen} onOpenChange={(o) => {
              setLabelOpen(o);
              if (o && labelName) setLabelInput(labelName);
            }}>
              <PopoverTrigger asChild>
                {labelName && labelColor ? (
                  <button
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium transition-opacity hover:opacity-80"
                    style={{
                      background: labelColor + "28",
                      color: labelColor,
                      border: `1px solid ${labelColor}55`,
                    }}
                  >
                    {labelName}
                    <X className="h-3 w-3" onClick={removeLabel} />
                  </button>
                ) : (
                  <button className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <Tag className="h-3 w-3" />
                    Add label
                  </button>
                )}
              </PopoverTrigger>
              <PopoverContent className="w-60 p-3" align="start">
                {/* Saved labels */}
                {savedLabels.length > 0 && (
                  <>
                    <p className="text-xs text-muted-foreground mb-2">Saved labels</p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {savedLabels.map((l) => (
                        <button
                          key={l.id}
                          onClick={() => pickSavedLabel(l)}
                          className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-medium transition-opacity hover:opacity-70"
                          style={{
                            background: l.color + "28",
                            color: l.color,
                            border: `1px solid ${l.color}55`,
                          }}
                        >
                          {l.name}
                        </button>
                      ))}
                    </div>
                    <div className="h-px bg-border mb-3" />
                  </>
                )}
                <p className="text-xs text-muted-foreground mb-2">New label</p>
                <Input
                  value={labelInput}
                  onChange={(e) => setLabelInput(e.target.value)}
                  placeholder="e.g. Travel, Ideas…"
                  className="h-7 text-xs mb-3"
                  onKeyDown={(e) => e.key === "Enter" && applyLabel()}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground mb-2">Color</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {LABEL_COLORS.map(({ color, label }) => (
                    <button
                      key={color}
                      title={label}
                      onClick={() => setSelectedColor(color)}
                      className="h-5 w-5 rounded-full transition-transform hover:scale-110"
                      style={{
                        background: color,
                        outline: selectedColor === color ? `2px solid ${color}` : "none",
                        outlineOffset: 2,
                      }}
                    />
                  ))}
                </div>
                <Button
                  size="sm"
                  className="w-full h-7 text-xs"
                  onClick={applyLabel}
                  disabled={!labelInput.trim()}
                >
                  Apply
                </Button>
              </PopoverContent>
            </Popover>
          ) : (
            labelName && labelColor && (
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                style={{
                  background: labelColor + "28",
                  color: labelColor,
                  border: `1px solid ${labelColor}55`,
                }}
              >
                {labelName}
              </span>
            )
          )}
        </div>

        {/* Divider */}
        <div className="w-12 h-px bg-border mb-8" />

        {/* Content */}
        {isEditing ? (
          <BlogRichEditor content={content} onChange={setContent} />
        ) : (
          <div
            className="blog-content min-h-[60vh]"
            dangerouslySetInnerHTML={{ __html: content || "<p class='empty-hint'>Empty</p>" }}
          />
        )}
      </div>

      {/* Save button */}
      {isEditing && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t border-border px-6 py-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="border-[#D97757] hover:border-[#D97757] hover:bg-background"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      )}
    </div>
  );
}
