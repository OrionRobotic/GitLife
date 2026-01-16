import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function OurMission() {
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
              <Target className="h-5 w-5" />
              Our Mission
            </CardTitle>
            <CardDescription>
              What we're building and why
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose prose-sm max-w-none">
              <p className="text-muted-foreground">
                GitLife is designed to help you build better habits by visualizing your daily
                progress in a familiar, GitHub-style contribution graph. Our mission is to make
                habit tracking simple, visual, and motivating.
              </p>
              <h3 className="text-lg font-semibold mt-6 mb-3">Why GitLife?</h3>
              <p className="text-muted-foreground">
                We believe that consistency is the key to personal growth. By tracking your habits
                daily and seeing your progress over time, you can build a better version of yourself,
                one day at a time.
              </p>
              <h3 className="text-lg font-semibold mt-6 mb-3">Our Values</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Simplicity - Easy to use, no complexity</li>
                <li>Visualization - See your progress at a glance</li>
                <li>Consistency - Build habits that last</li>
                <li>Privacy - Your data is yours</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
