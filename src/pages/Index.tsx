import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ContributionGrid } from "@/components/ContributionGrid";
import { DayEditor } from "@/components/DayEditor";
import { Legend } from "@/components/Legend";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/context/AuthContext";
import { Loader2, LogOut, User, Plus } from "lucide-react";

const Index = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const currentYear = new Date().getFullYear();
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

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
              <img 
                src="/favicon.svg" 
                alt="GitLife" 
                className="w-6 h-6" 
              />
              GitLife
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Commit to a better version of yourself.
            </p>
          </div>
          <div className="flex items-center gap-4">
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
          <div className="flex justify-end -mt-3 mb-8">
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
