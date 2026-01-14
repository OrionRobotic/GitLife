import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ContributionGrid } from "@/components/ContributionGrid";
import { DayEditor } from "@/components/DayEditor";
import { Legend } from "@/components/Legend";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/context/AuthContext";
import { useHabits } from "@/context/HabitsContext";
import { Loader2, LogOut, User, Plus } from "lucide-react";

const Index = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const currentYear = new Date().getFullYear();
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { getEntry } = useHabits();

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Calculate completed ratio for the selected date (or today)
  const displayDate = selectedDate || new Date();
  const entry = getEntry(displayDate);
  const totalScore =
    (entry?.workout ? 1 : 0) +
    (entry?.eating ? 1 : 0) +
    (entry?.reading ? 1 : 0) +
    (entry?.sleep ? 1 : 0);
  const totalHabits = 4;

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

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
          <div className="flex flex-col items-end gap-2">
            {authLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {user.email}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/login">
                    <User className="h-4 w-4 mr-2" />
                    Sign in
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/signup">Sign up</Link>
                </Button>
              </div>
            )}
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
              <span className="text-sm text-muted-foreground">Today's Completed</span>
              <span className="text-sm font-medium text-foreground">
                {totalScore}/{totalHabits}
              </span>
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
                className="w-auto p-0 border-0 shadow-lg z-50"
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
