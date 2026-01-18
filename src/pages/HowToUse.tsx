import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function HowToUse() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              How to use it
            </CardTitle>
            <CardDescription>
              A guide to getting started with GitLife
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      1
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Track Your Habits</h3>
                  <p className="text-sm text-muted-foreground">
                    Click on today's date in the contribution grid or use the
                    "Add Contribution" button to log your daily habits.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      2
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Mark Habits Complete</h3>
                  <p className="text-sm text-muted-foreground">
                    For each habit (Workout, Eating, Reading, Sleep), click
                    "Yes" if you completed it today, or "No" if you didn't.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      3
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Watch Your Progress</h3>
                  <p className="text-sm text-muted-foreground">
                    The contribution grid will update with colors based on how
                    many habits you completed each day. Darker colors mean more
                    habits completed!
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      4
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Build Consistency</h3>
                  <p className="text-sm text-muted-foreground">
                    Try to maintain a streak! The visual representation of your
                    progress helps you stay motivated and build lasting habits.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-muted rounded-lg">
              <div className="flex gap-2 items-start">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium mb-1">Tip</p>
                  <p className="text-sm text-muted-foreground">
                    You can only edit today's habits. Past days are view-only to
                    maintain the integrity of your habit tracking.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
