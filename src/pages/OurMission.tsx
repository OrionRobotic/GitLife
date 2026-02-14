import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import ContributionPattern from "@/components/ContributionPattern";
import { MenuButton } from "@/components/MenuButton";

export default function OurMission() {
  return (
    <div className="min-h-screen bg-background">
      <div className="w-full px-6 py-6 flex items-center justify-between">
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <MenuButton />
      </div>

      <div className="max-w-4xl mx-auto px-6 pb-12">
        <div className="mb-2">
          <h1 className="text-3xl font-normal text-foreground mb-2">
            Our Mission
          </h1>
          <p className="text-sm text-muted-foreground">In what we believe</p>
        </div>

        <div className="-mt-10">
          <ContributionPattern />
        </div>

        <div className="-mt-6 max-w-2xl mx-auto space-y-6 text-center">
          <p className="text-lg text-foreground/80 leading-relaxed">
            Every square is a day. Every day is a chance to show up.
          </p>
          <p className="text-lg text-foreground/80 leading-relaxed">
            GitLife is built on a simple belief: small, consistent actions
            compound into meaningful change. We don't track perfection, we
            celebrate presence.
          </p>
        </div>

        <p className="mt-16 text-sm text-muted-foreground text-center">
          GitLife
        </p>
      </div>
    </div>
  );
}
