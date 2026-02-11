import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ContributionGrid } from "@/components/ContributionGrid";
import { DayEditor } from "@/components/DayEditor";
import { Legend } from "@/components/Legend";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useHabits } from "@/context/useHabits";
import { MenuButton } from "@/components/MenuButton";
import { ActivityOverview } from "@/components/ActivityOverview";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboards } from "@/hooks/useDashboards";
import { DashboardTabs } from "@/components/DashboardTabs";
import { DashboardDialog } from "@/components/DashboardDialog";
import type { Dashboard } from "@/types/dashboard";

const Index = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const currentYear = new Date().getFullYear();
  const { visibleHabits, allHabitLogs, isLoading } = useHabits();

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Dashboard state
  const {
    dashboards,
    activeDashboardId,
    activeDashboard,
    setActiveDashboardId,
    createDashboard,
    updateDashboard,
    deleteDashboard,
    defaultTab,
    updateDefaultTab,
  } = useDashboards();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDashboard, setEditingDashboard] = useState<Dashboard | null>(
    null
  );
  const [editingDefault, setEditingDefault] = useState<{
    name: string;
    color: string;
    habitIds: string[];
  } | null>(null);

  const filteredHabitIds = activeDashboard
    ? activeDashboard.habitIds
    : defaultTab.habitIds.length > 0
      ? defaultTab.habitIds
      : null;

  // Calculate completed ratio for the selected date (or today)
  const displayDate = selectedDate || new Date();

  const { totalScore, totalHabits } = useMemo(() => {
    if (!allHabitLogs) {
      return { totalScore: 0, totalHabits: visibleHabits.length };
    }

    const filterSet = filteredHabitIds
      ? new Set(filteredHabitIds)
      : null;

    const relevantHabits = filterSet
      ? visibleHabits.filter((h) => filterSet.has(h.id))
      : visibleHabits;

    const selectedDateStr = format(displayDate, "yyyyMMdd");
    const completedHabitIds = new Set<string>();

    for (const log of allHabitLogs) {
      if (log.integerDate && log.integerDate.toString() === selectedDateStr) {
        if (!filterSet || filterSet.has(log.habitId)) {
          completedHabitIds.add(log.habitId);
        }
      }
    }

    return {
      totalScore: completedHabitIds.size,
      totalHabits: relevantHabits.length || 0,
    };
  }, [displayDate, allHabitLogs, visibleHabits, filteredHabitIds]);

  const handleDialogSave = (name: string, habitIds: string[], color: string) => {
    if (editingDashboard) {
      updateDashboard(editingDashboard.id, name, habitIds, color);
    } else {
      createDashboard(name, habitIds, color);
    }
  };

  const handleSaveDefault = (name: string, color: string, habitIds: string[]) => {
    updateDefaultTab(name, color, habitIds);
  };

  const gridHeading = activeDashboard
    ? `${activeDashboard.name} — ${currentYear} contributions`
    : `${currentYear} contributions`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header - full width */}
      <header className="w-full px-6 py-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-normal text-foreground tracking-tight flex items-center gap-2">
            <img src="/favicon.svg" alt="GitLife" className="w-6 h-6" />
            GitLife
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Commit to a better version of yourself.
          </p>
        </div>
        <div className="flex items-center">
          <MenuButton />
        </div>
      </header>

      {/* Main content - centered */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="flex flex-col gap-4 font-dm">
          {/* Date display */}
          <div className="flex justify-end pr-2">
            <div className="flex flex-col items-end">
              <div className="text-sm font-medium text-foreground">
                {format(displayDate, "EEEE")}
              </div>
              <div className="text-xs text-muted-foreground">
                {format(displayDate, "MMMM d, yyyy")}
              </div>
            </div>
          </div>

          {/* Dashboard tabs + Contribution grid */}
          <div>
            <DashboardTabs
              dashboards={dashboards}
              activeDashboardId={activeDashboardId}
              defaultTab={defaultTab}
              onSelect={setActiveDashboardId}
              onDelete={deleteDashboard}
              onEdit={(dashboard) => {
                setEditingDefault(null);
                setEditingDashboard(dashboard);
                setDialogOpen(true);
              }}
              onEditDefault={() => {
                setEditingDashboard(null);
                setEditingDefault(defaultTab);
                setDialogOpen(true);
              }}
              onCreate={() => {
                setEditingDefault(null);
                setEditingDashboard(null);
                setDialogOpen(true);
              }}
            />
            <div className="p-6 bg-card border border-border rounded-lg rounded-tl-none">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-medium text-foreground">
                  {gridHeading}
                </h2>
                <Legend />
              </div>
              <ContributionGrid
                year={currentYear}
                onSelectDate={(date) => {
                  setSelectedDate(date);
                  setIsPopoverOpen(true);
                }}
                selectedDate={selectedDate}
                filteredHabitIds={filteredHabitIds}
              />
            </div>
          </div>

          {/* Today's Completed + Add Contribution */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 pl-2">
              <span className="text-sm text-muted-foreground">
                Today's Completed
              </span>
              {isLoading ? (
                <Skeleton className="h-4 w-6" />
              ) : (
                <span className="text-sm font-medium text-foreground">
                  {totalScore}/{totalHabits}
                </span>
              )}
            </div>
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-1.5 bg-foreground/10 hover:bg-foreground/15 text-foreground h-7 px-2.5 text-xs"
                  onClick={() => {
                    if (!selectedDate) {
                      setSelectedDate(new Date());
                    }
                  }}
                >
                  <Plus className="w-3 h-3" />
                  Add Contribution
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                side="bottom"
                sideOffset={8}
                avoidCollisions={false}
                className="w-auto p-0 border-0 shadow-lg z-50 max-w-3xl"
              >
                {(selectedDate || new Date()) && (
                  <DayEditor
                    date={selectedDate || new Date()}
                    onClose={() => setIsPopoverOpen(false)}
                    filteredHabitIds={filteredHabitIds}
                  />
                )}
              </PopoverContent>
            </Popover>
          </div>

          {/* Activity Overview */}
          <div className="mt-4">
            <ActivityOverview filteredHabitIds={filteredHabitIds} />
          </div>

          <p className="mt-16 text-sm text-muted-foreground text-center">
            GitLife
          </p>
        </div>
      </div>

      {/* Dashboard create/edit dialog */}
      <DashboardDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingDashboard={editingDashboard}
        editingDefault={editingDefault}
        onSave={handleDialogSave}
        onSaveDefault={handleSaveDefault}
      />
    </div>
  );
};

export default Index;
