import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, LogOut, User, Target, BookOpen } from "lucide-react";

export const MenuButton = () => {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
    navigate("/login");
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[400px] flex flex-col">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <div className="mt-8 flex flex-col gap-2 flex-1">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-12"
            onClick={() => handleNavigate("/account")}
          >
            <User className="h-5 w-5" />
            <span>Account</span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-12"
            onClick={() => handleNavigate("/our-mission")}
          >
            <Target className="h-5 w-5" />
            <span>Our Mission</span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-12"
            onClick={() => handleNavigate("/how-to-use")}
          >
            <BookOpen className="h-5 w-5" />
            <span>How to use it</span>
          </Button>
        </div>
        <div className="mt-auto pt-8 border-t">
          {user && (
            <div className="mb-4 px-2">
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-12 text-foreground hover:bg-muted"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
            <span>Sign out</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
