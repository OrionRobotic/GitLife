import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ContributionGrid } from "@/components/ContributionGrid";
import { DayEditor } from "@/components/DayEditor";
import { Legend } from "@/components/Legend";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Loader2, LogOut, User } from "lucide-react";

const Index = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const currentYear = new Date().getFullYear();
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const today = new Date();
    setSelectedDate(today);
  }, []);

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
            <h1 className="text-2xl font-medium text-foreground tracking-tight">
              GitLife
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track your daily habits
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
              onSelectDate={setSelectedDate}
              selectedDate={selectedDate}
            />
          </div>

          {/* Day editor */}
          {selectedDate && <DayEditor date={selectedDate} onClose={() => {}} />}

          {/* Instructions */}
          {!selectedDate && (
            <p className="text-sm text-muted-foreground text-center">
              Today's habits are shown below
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
