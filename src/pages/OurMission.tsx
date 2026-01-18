import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
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

        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">
            Our Mission
          </h1>
          <p className="text-sm text-muted-foreground">In what we believe</p>
        </div>
      </div>
    </div>
  );
}
