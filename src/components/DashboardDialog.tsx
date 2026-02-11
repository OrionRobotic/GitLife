import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useHabits } from "@/context/useHabits";
import type { Dashboard } from "@/types/dashboard";

const ORANGE_PALETTE = [
  "#FFF3E0",
  "#FFE0B2",
  "#FFCC80",
  "#FFB74D",
  "#FFA726",
  "#FF9800",
  "#FB8C00",
  "#F57C00",
  "#EF6C00",
  "#E65100",
  "#D84315",
  "#BF360C",
];

const DEFAULT_COLOR = "#FB8C00";

interface DefaultTabEdit {
  name: string;
  color: string;
  habitIds: string[];
}

interface DashboardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingDashboard: Dashboard | null;
  editingDefault: DefaultTabEdit | null;
  onSave: (name: string, habitIds: string[], color: string) => void;
  onSaveDefault: (name: string, color: string, habitIds: string[]) => void;
}

export function DashboardDialog({
  open,
  onOpenChange,
  editingDashboard,
  editingDefault,
  onSave,
  onSaveDefault,
}: DashboardDialogProps) {
  const { visibleHabits } = useHabits();
  const [name, setName] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [color, setColor] = useState(DEFAULT_COLOR);

  const isDefaultMode = editingDefault !== null;

  useEffect(() => {
    if (open) {
      if (editingDefault) {
        setName(editingDefault.name);
        setColor(editingDefault.color);
        setSelectedIds(
          editingDefault.habitIds.length > 0
            ? new Set(editingDefault.habitIds)
            : new Set(visibleHabits.map((h) => h.id))
        );
      } else if (editingDashboard) {
        setName(editingDashboard.name);
        setSelectedIds(new Set(editingDashboard.habitIds));
        setColor(editingDashboard.color || DEFAULT_COLOR);
      } else {
        setName("");
        setSelectedIds(new Set());
        setColor(DEFAULT_COLOR);
      }
    }
  }, [open, editingDashboard, editingDefault]);

  const toggleHabit = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const canSave = name.trim().length > 0 && selectedIds.size > 0;

  const handleSave = () => {
    if (!canSave) return;
    if (isDefaultMode) {
      const allSelected = selectedIds.size === visibleHabits.length &&
        visibleHabits.every((h) => selectedIds.has(h.id));
      onSaveDefault(name.trim(), color, allSelected ? [] : Array.from(selectedIds));
    } else {
      onSave(name.trim(), Array.from(selectedIds), color);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isDefaultMode
              ? "Edit Default Tab"
              : editingDashboard
                ? "Edit Dashboard"
                : "Create Dashboard"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Name</label>
            <Input
              placeholder="e.g. Health, Morning Routine..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Color</label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {ORANGE_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-all ${
                    color === c
                      ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110"
                      : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Habits
            </label>
            <div className="space-y-2 max-h-[240px] overflow-y-auto">
              {visibleHabits.map((habit) => (
                <label
                  key={habit.id}
                  className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-1.5 hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selectedIds.has(habit.id)}
                    onCheckedChange={() => toggleHabit(habit.id)}
                  />
                  <span className="text-sm">{habit.name}</span>
                </label>
              ))}
              {visibleHabits.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No habits found.
                </p>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {editingDashboard ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
