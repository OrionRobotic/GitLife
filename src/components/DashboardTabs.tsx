import { Plus, X } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type { Dashboard } from "@/types/dashboard";

interface DefaultTab {
  name: string;
  color: string;
}

interface DashboardTabsProps {
  dashboards: Dashboard[];
  activeDashboardId: string | null;
  defaultTab: DefaultTab;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
  onEdit: (dashboard: Dashboard) => void;
  onEditDefault: () => void;
  onCreate: () => void;
}

export function DashboardTabs({
  dashboards,
  activeDashboardId,
  defaultTab,
  onSelect,
  onDelete,
  onEdit,
  onEditDefault,
  onCreate,
}: DashboardTabsProps) {
  const activeClass =
    "bg-card border border-border rounded-t-md border-b-0 text-foreground";
  const inactiveClass =
    "bg-transparent text-muted-foreground hover:text-foreground";

  return (
    <div className="flex items-end gap-0.5 -mb-[1px] relative z-10">
      {/* Default tab */}
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <button
            onClick={() => onSelect(null)}
            className={`px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeDashboardId === null ? activeClass : inactiveClass
            }`}
          >
            <span
              className="w-2 h-2 rounded-full inline-block flex-shrink-0"
              style={{ backgroundColor: defaultTab.color }}
            />
            {defaultTab.name}
          </button>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={onEditDefault}>Edit</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Custom tabs */}
      {dashboards.map((dashboard) => {
        const isActive = activeDashboardId === dashboard.id;
        return (
          <ContextMenu key={dashboard.id}>
            <ContextMenuTrigger asChild>
              <button
                onClick={() => onSelect(dashboard.id)}
                className={`group px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive ? activeClass : inactiveClass
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full inline-block flex-shrink-0"
                  style={{ backgroundColor: dashboard.color }}
                />
                {dashboard.name}
                <span
                  role="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(dashboard.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </span>
              </button>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onClick={() => onEdit(dashboard)}>
                Edit
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => onDelete(dashboard.id)}
                className="text-destructive"
              >
                Delete
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        );
      })}

      {/* Add button */}
      <button
        onClick={onCreate}
        className="px-2 py-1.5 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Create dashboard"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
