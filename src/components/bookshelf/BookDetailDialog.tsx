import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Palette, ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { Book } from "@/types/database";

const BORDER_SHADES = [
  { value: "#D5E3DF", label: "Lightest" },
  { value: "#C3D4D0", label: "Light" },
  { value: "#ABBFB8", label: "Medium" },
  { value: "#8EA8A1", label: "Dark" },
  { value: "#708F88", label: "Darkest" },
];

interface BookDetailDialogProps {
  book: Book | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<Book>) => void;
  onDelete: (id: string) => void;
}

export function BookDetailDialog({
  book,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
}: BookDetailDialogProps) {
  const [view, setView] = useState<"main" | "appearance">("main");
  const [title, setTitle] = useState(book?.title ?? "");
  const [author, setAuthor] = useState(book?.author ?? "");
  const [notes, setNotes] = useState(book?.notes ?? "");
  const [status, setStatus] = useState(book?.status ?? "reading");
  const [rating, setRating] = useState<number | null>(book?.rating ?? null);
  const [color, setColor] = useState(book?.color ?? BORDER_SHADES[2].value);
  const [height, setHeight] = useState(book?.height ?? 172);
  const [width, setWidth] = useState(book?.width ?? 64);
  const [borderWidth, setBorderWidth] = useState(book?.borderWidth ?? 1);
  const [isEditingMeta, setIsEditingMeta] = useState(false);

  useEffect(() => {
    if (book) {
      setTitle(book.title);
      setAuthor(book.author);
      setNotes(book.notes ?? "");
      setStatus(book.status);
      setRating(book.rating ?? null);
      setColor(book.color);
      setHeight(book.height);
      setWidth(book.width);
      setBorderWidth(book.borderWidth);
      setView("main");
      setIsEditingMeta(false);
    }
  }, [book?.id]);

  const handleTitleBlur = () => {
    const trimmed = title.trim();
    if (book && trimmed && trimmed !== book.title) {
      onUpdate(book.id, { title: trimmed });
    } else if (book && !trimmed) {
      setTitle(book.title);
    }
  };

  const handleAuthorBlur = () => {
    const trimmed = author.trim();
    if (book && trimmed !== book.author) {
      onUpdate(book.id, { author: trimmed });
    } else if (book && !trimmed) {
      setAuthor(book.author);
    }
  };

  const handleNotesBlur = () => {
    if (book && notes !== (book.notes ?? "")) {
      onUpdate(book.id, { notes: notes || null });
    }
  };

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus as "reading" | "read");
    if (book) {
      onUpdate(book.id, { status: newStatus as "reading" | "read" });
    }
  };

  const handleRatingChange = (value: number | null) => {
    setRating(value);
    if (book) {
      onUpdate(book.id, { rating: value });
    }
  };

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    if (book) {
      onUpdate(book.id, { color: newColor });
    }
  };

  const handleHeightCommit = () => {
    if (book && height !== book.height) {
      onUpdate(book.id, { height });
    }
  };

  const handleWidthCommit = () => {
    if (book && width !== book.width) {
      onUpdate(book.id, { width });
    }
  };

  const handleBorderWidthCommit = () => {
    if (book && borderWidth !== book.borderWidth) {
      onUpdate(book.id, { borderWidth });
    }
  };

  const startEditingMeta = () => {
    if (book) {
      setTitle(book.title);
      setAuthor(book.author);
    }
    setIsEditingMeta(true);
  };

  const handleMetaCancel = () => {
    if (book) {
      setTitle(book.title);
      setAuthor(book.author);
    }
    setIsEditingMeta(false);
  };

  const handleMetaSave = () => {
    handleTitleBlur();
    handleAuthorBlur();
    setIsEditingMeta(false);
  };

  const handleDelete = () => {
    if (book) {
      onDelete(book.id);
      onOpenChange(false);
    }
  };

  if (!book) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleTitleBlur();
          handleAuthorBlur();
          handleNotesBlur();
          handleHeightCommit();
          handleWidthCommit();
          handleBorderWidthCommit();
          setIsEditingMeta(false);
        }
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        {view === "main" ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">{title}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 mt-2">
              {isEditingMeta ? (
                <>
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm font-medium">Title</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      onBlur={handleTitleBlur}
                      placeholder="Book title"
                      className="text-base font-medium"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm font-medium">Author</Label>
                    <Input
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      onBlur={handleAuthorBlur}
                      placeholder="Author"
                      className="text-muted-foreground"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs"
                        onClick={handleMetaCancel}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 px-3 text-xs"
                        onClick={handleMetaSave}
                      >
                        Save
                      </Button>
                    </div>
                    <Badge variant={status === "read" ? "default" : "secondary"}>
                      {status === "read" ? "Read" : "Reading"}
                    </Badge>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground">{author}</p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                      onClick={startEditingMeta}
                    >
                      Edit
                    </Button>
                    <Badge variant={status === "read" ? "default" : "secondary"}>
                      {status === "read" ? "Read" : "Reading"}
                    </Badge>
                  </div>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Added {format(new Date(book.createdAt), "MMMM d, yyyy")}
              </p>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={status} onValueChange={handleStatusChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reading">Reading</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Rating</label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        handleRatingChange(rating === value ? null : value)
                      }
                      className="rounded-full transition-colors hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 p-0.5"
                      title={`${value} of 5`}
                      aria-label={`Rate ${value} of 5`}
                    >
                      <span
                        className="block w-2 h-2 rounded-full transition-colors"
                        style={{
                          backgroundColor:
                            rating !== null && value <= rating
                              ? "hsl(var(--chart-1))"
                              : "hsl(var(--muted-foreground) / 0.35)",
                        }}
                      />
                    </button>
                  ))}
                  {rating !== null && (
                    <button
                      type="button"
                      onClick={() => handleRatingChange(null)}
                      className="text-xs text-muted-foreground hover:text-foreground ml-2 underline underline-offset-2"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={handleNotesBlur}
                  placeholder="Add your thoughts about this book..."
                  rows={8}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-muted-foreground border-muted-foreground/30 hover:bg-muted gap-2"
                  onClick={() => setView("appearance")}
                >
                  <Palette className="h-4 w-4" />
                  Appearance
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-muted-foreground border-muted-foreground/30 hover:bg-muted"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Book
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setView("main")}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <DialogTitle className="text-xl">Appearance</DialogTitle>
              </div>
            </DialogHeader>
            <div className="flex flex-col gap-6 mt-2">
              <div className="flex flex-col gap-2">
                <Label>Border Color</Label>
                <div className="flex gap-2">
                  {BORDER_SHADES.map((shade) => (
                    <button
                      key={shade.value}
                      type="button"
                      className="w-10 h-10 rounded-md transition-all"
                      style={{
                        backgroundColor: "#FAF9F6",
                        border: `3px solid ${shade.value}`,
                        outline: color === shade.value ? `2px solid ${shade.value}` : "2px solid transparent",
                        outlineOffset: "2px",
                        transform: color === shade.value ? "scale(1.1)" : "scale(1)",
                      }}
                      onClick={() => handleColorChange(shade.value)}
                      title={shade.label}
                    />
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Height — {height}px</Label>
                <input
                  type="range"
                  min={140}
                  max={250}
                  step={4}
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  onMouseUp={handleHeightCommit}
                  onTouchEnd={handleHeightCommit}
                  className="w-full accent-[#ABBFB8]"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Short</span>
                  <span>Tall</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Width — {width}px</Label>
                <input
                  type="range"
                  min={48}
                  max={95}
                  step={1}
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  onMouseUp={handleWidthCommit}
                  onTouchEnd={handleWidthCommit}
                  className="w-full accent-[#ABBFB8]"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Narrow</span>
                  <span>Wide</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Border — {borderWidth}px</Label>
                <input
                  type="range"
                  min={1}
                  max={4}
                  step={1}
                  value={borderWidth}
                  onChange={(e) => setBorderWidth(Number(e.target.value))}
                  onMouseUp={handleBorderWidthCommit}
                  onTouchEnd={handleBorderWidthCommit}
                  className="w-full accent-[#ABBFB8]"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Thin</span>
                  <span>Thick</span>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
