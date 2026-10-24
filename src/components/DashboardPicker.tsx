import { ChevronDown, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Dashboard } from "@/types/dashboard";

interface Option {
  id: string;
  name: string;
  color: string;
}

interface DashboardPickerProps {
  main: { name: string; color: string };
  categories: Option[]; // ids are "cat:<habitId>"
  dashboards: Dashboard[];
  activeId: string | null; // null = main
  onSelect: (id: string | null) => void;
  onCreate: () => void;
  onEdit: () => void; // edits the active dashboard (or main)
  onDelete: (id: string) => void;
}

const MAIN = "main";

const Dot = ({ color }: { color: string }) => (
  <span
    className="w-2 h-2 rounded-full inline-block shrink-0"
    style={{ backgroundColor: color }}
  />
);

export function DashboardPicker({
  main,
  categories,
  dashboards,
  activeId,
  onSelect,
  onCreate,
  onEdit,
  onDelete,
}: DashboardPickerProps) {
  const all: Option[] = [{ id: MAIN, ...main }, ...categories, ...dashboards];
  const active = all.find((o) => o.id === (activeId ?? MAIN)) ?? all[0];
  const activeCustom = dashboards.find((d) => d.id === activeId);

  return (
    <div className="flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:opacity-70 transition-opacity outline-none">
          <Dot color={active.color} />
          {active.name}
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-48">
          <DropdownMenuRadioGroup
            value={active.id}
            onValueChange={(id) => onSelect(id === MAIN ? null : id)}
          >
            <DropdownMenuRadioItem value={MAIN} className="gap-2">
              <Dot color={main.color} />
              {main.name}
            </DropdownMenuRadioItem>
            {categories.length > 0 && (
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                Categories
              </DropdownMenuLabel>
            )}
            {categories.map((c) => (
              <DropdownMenuRadioItem key={c.id} value={c.id} className="gap-2">
                <Dot color={c.color} />
                {c.name}
              </DropdownMenuRadioItem>
            ))}
            {dashboards.length > 0 && (
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                Dashboards
              </DropdownMenuLabel>
            )}
            {dashboards.map((d) => (
              <DropdownMenuRadioItem key={d.id} value={d.id} className="gap-2">
                <Dot color={d.color} />
                {d.name}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
          {(active.id === MAIN || activeCustom) && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onEdit}>
                Edit {active.name}
              </DropdownMenuItem>
              {activeCustom && (
                <DropdownMenuItem
                  onClick={() => onDelete(activeCustom.id)}
                  className="text-destructive"
                >
                  Delete {activeCustom.name}
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <button
        onClick={onCreate}
        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Create dashboard"
        title="Create dashboard"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
