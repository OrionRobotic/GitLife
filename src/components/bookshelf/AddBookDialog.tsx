import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookCreateInput } from "@/types/database";

const CREAM_SHADES = [
  { value: "#F5EDE0", label: "Lightest" },
  { value: "#E8DFD0", label: "Light" },
  { value: "#D8CCBA", label: "Medium" },
  { value: "#C5B8A0", label: "Warm" },
  { value: "#B0A088", label: "Dark" },
];

interface AddBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: BookCreateInput) => void;
}

export function AddBookDialog({ open, onOpenChange, onSubmit }: AddBookDialogProps) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [status, setStatus] = useState<"reading" | "read">("reading");
  const [color, setColor] = useState(CREAM_SHADES[2].value);
  const [height, setHeight] = useState(220);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;
    onSubmit({ title: title.trim(), author: author.trim(), status, color, height });
    setTitle("");
    setAuthor("");
    setStatus("reading");
    setColor(CREAM_SHADES[2].value);
    setHeight(220);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add a Book</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Book title"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="author">Author</Label>
            <Input
              id="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Author name"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as "reading" | "read")}>
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
                  onClick={() => setColor(shade.value)}
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
              onChange={(e) => setHeight(Number(e.target.value))}
              className="w-full accent-[#B0A088]"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Short</span>
              <span>Tall</span>
            </div>
          </div>
          <Button type="submit" className="mt-2">
            Add Book
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
