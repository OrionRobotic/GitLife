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
import { Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Book } from "@/types/database";

const CREAM_SHADES = [
  { value: "#F5EDE0", label: "Lightest" },
  { value: "#E8DFD0", label: "Light" },
  { value: "#D8CCBA", label: "Medium" },
  { value: "#C5B8A0", label: "Warm" },
  { value: "#B0A088", label: "Dark" },
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
  const [notes, setNotes] = useState(book?.notes ?? "");
  const [status, setStatus] = useState(book?.status ?? "reading");
  const [color, setColor] = useState(book?.color ?? CREAM_SHADES[2].value);
  const [height, setHeight] = useState(book?.height ?? 220);

  useEffect(() => {
    if (book) {
      setNotes(book.notes ?? "");
      setStatus(book.status);
      setColor(book.color);
      setHeight(book.height);
    }
  }, [book?.id, book?.notes, book?.status, book?.color, book?.height]);

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

  const handleHeightChange = (newHeight: number) => {
    setHeight(newHeight);
  };

  const handleHeightCommit = () => {
    if (book && height !== book.height) {
      onUpdate(book.id, { height });
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
        }
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
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
            <Label>Color</Label>
            <div className="flex gap-2">
              {CREAM_SHADES.map((shade) => (
                <button
                  key={shade.value}
                  type="button"
                  className="w-10 h-10 rounded-md border-2 transition-all"
                  style={{
                    backgroundColor: shade.value,
                    borderColor: color === shade.value ? "rgba(60,45,30,0.6)" : "rgba(0,0,0,0.1)",
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
              max={200}
              step={10}
              value={height}
              onChange={(e) => handleHeightChange(Number(e.target.value))}
              onMouseUp={handleHeightCommit}
              onTouchEnd={handleHeightCommit}
              className="w-full accent-[#B0A088]"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Short</span>
              <span>Tall</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Add your thoughts about this book..."
              rows={4}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-fit mt-2 text-muted-foreground border-muted-foreground/30 hover:bg-muted"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Book
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
