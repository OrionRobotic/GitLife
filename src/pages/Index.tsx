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
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const currentYear = new Date().getFullYear();
  const { visibleHabits, allHabitLogs, isLoading } = useHabits();

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Calculate completed ratio for the selected date (or today)
  const displayDate = selectedDate || new Date();

  const { totalScore, totalHabits } = useMemo(() => {
    if (!allHabitLogs) {
      return { totalScore: 0, totalHabits: visibleHabits.length };
    }

    const selectedDateStr = format(displayDate, "yyyyMMdd");
    const completedHabitIds = new Set<string>();

    for (const log of allHabitLogs) {
      if (log.integerDate.toString() === selectedDateStr) {
        completedHabitIds.add(log.habitId);
      }
    }

    return {
      totalScore: completedHabitIds.size,
      totalHabits: visibleHabits.length || 0,
    };
  }, [displayDate, allHabitLogs, visibleHabits.length]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="mb-12 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-medium text-foreground tracking-tight flex items-center gap-2">
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

        {/* Main content */}
        <div className="space-y-8">
          {/* Date display above grid */}
          <div className="flex justify-start mt-4 -mb-6 pl-2">
            <div className="flex flex-col items-start">
              <div className="text-sm font-medium text-foreground">
                {format(displayDate, "EEEE")}
              </div>
              <div className="text-xs text-muted-foreground">
                {format(displayDate, "MMMM d, yyyy")}
              </div>
            </div>
          </div>

          {/* Contribution grid */}
          <div className="p-6 bg-card border border-border rounded-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-medium text-foreground">
                {currentYear} contributions
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
            />
          </div>

          {/* Add Contribution Button - Outside the grid */}
          <div className="flex justify-between items-center -mt-3 mb-8">
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
                  />
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
