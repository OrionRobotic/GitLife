import { Book } from "@/types/database";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Book3DProps {
  book: Book;
  onClick: (book: Book) => void;
}

export function Book3D({ book, onClick }: Book3DProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="book-item"
          style={{ backgroundColor: "#FAF9F6", borderColor: book.color, borderWidth: book.borderWidth, width: book.width, height: book.height }}
          onClick={() => onClick(book)}
        >
          <span className="book-item-title">{book.title}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="!bg-card/95 !border-border text-card-foreground backdrop-blur-sm shadow-lg"
      >
        <p className="font-medium text-sm">{book.title}</p>
        {book.author && (
          <p className="text-xs text-muted-foreground">{book.author}</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
