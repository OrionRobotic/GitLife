import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const [notes, setNotes] = useState(book?.notes ?? "");
  const [status, setStatus] = useState(book?.status ?? "reading");
  const [color, setColor] = useState(book?.color ?? BORDER_SHADES[2].value);
  const [height, setHeight] = useState(book?.height ?? 172);
  const [width, setWidth] = useState(book?.width ?? 64);
  const [borderWidth, setBorderWidth] = useState(book?.borderWidth ?? 1);

  useEffect(() => {
    if (book) {
      setNotes(book.notes ?? "");
      setStatus(book.status);
      setColor(book.color);
      setHeight(book.height);
      setWidth(book.width);
      setBorderWidth(book.borderWidth);
      setView("main");
    }
  }, [book?.id]);

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
          handleNotesBlur();
          handleHeightCommit();
          handleWidthCommit();
          handleBorderWidthCommit();
        }
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        {view === "main" ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">{book.title}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">{book.author}</p>
                <Badge variant={status === "read" ? "default" : "secondary"}>
                  {status === "read" ? "Read" : "Reading"}
                </Badge>
              </div>
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
