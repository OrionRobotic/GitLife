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
import { Menu, LogOut, User, BookOpen, Library, PenLine } from "lucide-react";

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
      <SheetContent
        side="right"
        className="w-[300px] sm:w-[400px] flex flex-col"
      >
        <SheetHeader>
          <SheetTitle
            className="text-2xl font-normal tracking-tight cursor-pointer hover:opacity-70 transition-opacity flex items-center gap-2"
            onClick={() => handleNavigate("/")}
          >
            <img src="/favicon.svg" alt="GitLife" className="w-6 h-6 shrink-0" />
            GitLife
          </SheetTitle>
        </SheetHeader>
        <div className="mt-8 flex flex-col gap-2 flex-1">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-12 text-base"
            onClick={() => handleNavigate("/our-mission")}
          >
            <div className="h-3.5 w-3.5 rounded-sm bg-[hsl(22,95%,50%)]" />
            <span>Our Mission</span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-12 text-base"
            onClick={() => handleNavigate("/bookshelf")}
          >
            <Library className="h-5 w-5" />
            <span>Bookshelf</span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-12 text-base"
            onClick={() => handleNavigate("/blogs")}
          >
            <PenLine className="h-5 w-5" />
            <span>Blogs</span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-12 text-base"
            onClick={() => handleNavigate("/how-to-use")}
          >
            <BookOpen className="h-5 w-5" />
            <span>How to use it</span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-12 text-base"
            onClick={() => handleNavigate("/account")}
          >
            <User className="h-5 w-5" />
            <span>Account</span>
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
            className="w-full justify-start gap-3 h-12 text-base text-foreground hover:bg-muted"
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
