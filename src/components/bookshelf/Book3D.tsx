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
          style={{ backgroundColor: book.color, height: book.height }}
          onClick={() => onClick(book)}
        >
          <span className="book-item-title">{book.title}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="!bg-[rgba(245,240,230,0.9)] !border-[rgba(200,190,175,0.4)] text-foreground backdrop-blur-sm shadow-lg"
      >
        <p className="font-medium text-sm">{book.title}</p>
        {book.author && (
          <p className="text-xs text-muted-foreground">{book.author}</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
