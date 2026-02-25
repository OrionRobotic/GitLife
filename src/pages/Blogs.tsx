import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Search, X } from "lucide-react";
import { format } from "date-fns";
import { MenuButton } from "@/components/MenuButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { Blog } from "@/types/database";
import { getBlogs, deleteBlog } from "@/services/blogs";

export default function Blogs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);

  const fetchBlogs = useCallback(async () => {
    if (!user) return;
    const data = await getBlogs(user.id);
    if (data) setBlogs(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const success = await deleteBlog(id);
    if (success) setBlogs((prev) => prev.filter((b) => b.id !== id));
  };

  // Unique labels from all blogs
  const availableLabels = useMemo(() => {
    const seen = new Map<string, string>();
    for (const b of blogs) {
      if (b.labelName && b.labelColor && !seen.has(b.labelName)) {
        seen.set(b.labelName, b.labelColor);
      }
    }
    return Array.from(seen.entries()).map(([name, color]) => ({ name, color }));
  }, [blogs]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return blogs.filter((b) => {
      const matchesSearch = !q || (b.title || "untitled").toLowerCase().includes(q);
      const matchesLabel = !selectedLabel || b.labelName === selectedLabel;
      return matchesSearch && matchesLabel;
    });
  }, [blogs, searchQuery, selectedLabel]);

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full px-6 py-6 flex items-center justify-between">
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <MenuButton />
      </div>

      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-10">
          <h1 className="text-3xl font-normal text-foreground mb-2">Blogs</h1>
          <p className="text-sm text-muted-foreground">Your written thoughts</p>
        </div>

        {/* Search + label filters */}
        {!loading && blogs.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-3">
            {/* Search */}
            {searchOpen ? (
              <div className="relative flex items-center">
                <Input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title…"
                  className="h-7 text-sm w-52 pr-7"
                />
                <button
                  onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                  className="absolute right-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 border-border"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="h-3.5 w-3.5" />
              </Button>
            )}

            {/* Label filter chips */}
            {availableLabels.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {availableLabels.map(({ name, color }) => {
                  const active = selectedLabel === name;
                  return (
                    <button
                      key={name}
                      onClick={() => setSelectedLabel(active ? null : name)}
                      className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-medium transition-opacity hover:opacity-80"
                      style={{
                        background: active ? color + "45" : color + "20",
                        color: color,
                        border: `1px solid ${active ? color + "99" : color + "45"}`,
                      }}
                    >
                      {name}
                    </button>
                  );
                })}
                {selectedLabel && (
                  <button
                    onClick={() => setSelectedLabel(null)}
                    className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {loading ? (
          <p className="text-muted-foreground text-center py-12">Loading...</p>
        ) : blogs.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-muted-foreground text-sm">No blogs yet.</p>
            <p className="text-muted-foreground/60 text-xs mt-1">Write your first one.</p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-12">No results.</p>
        ) : (
          <div>
            {filtered.map((blog, i) => (
              <div key={blog.id}>
                <div
                  onClick={() => navigate(`/blogs/${blog.id}`)}
                  className="group flex items-center justify-between px-2 py-4 cursor-pointer hover:bg-muted/30 transition-colors rounded-md"
                >
                  {/* Square + text */}
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-[2px] bg-[hsl(22,95%,50%)]/80 group-hover:bg-[hsl(22,95%,50%)] transition-colors" />
                    <div className="min-w-0">
                      <p className="text-base text-foreground truncate">
                        {blog.title || "Untitled"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(blog.createdAt), "MMMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  {/* Right side: label + delete */}
                  <div className="flex items-center gap-2 shrink-0">
                    {blog.labelName && blog.labelColor && (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-medium"
                        style={{
                          background: blog.labelColor + "28",
                          color: blog.labelColor,
                          border: `1px solid ${blog.labelColor}55`,
                        }}
                      >
                        {blog.labelName}
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      onClick={(e) => handleDelete(e, blog.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {i < filtered.length - 1 && (
                  <div className="h-px bg-border/60" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-6 right-6">
        <Button
          variant="outline"
          size="sm"
          className="border-[#D97757] hover:border-[#D97757] hover:bg-background gap-2"
          onClick={() => navigate("/blogs/new")}
        >
          <Plus className="h-4 w-4" />
          New Blog
        </Button>
      </div>

      <p className="fixed bottom-4 left-0 right-0 text-sm text-muted-foreground text-center pointer-events-none">
        GitLife
      </p>
    </div>
  );
}
