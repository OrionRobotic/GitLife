import { Book } from "@/types/database";
import { Book3D } from "./Book3D";

interface BookShelfProps {
  books: Book[];
  onBookClick: (book: Book) => void;
}

export function BookShelf({ books, onBookClick }: BookShelfProps) {
  return (
    <div className="bookshelf-viewport">
      <div className="bookshelf-row">
        {books.map((book) => (
          <Book3D key={book.id} book={book} onClick={onBookClick} />
        ))}
      </div>
      {books.length === 0 && (
        <p className="text-muted-foreground text-sm italic py-8">
          No books yet. Add your first book!
        </p>
      )}
    </div>
  );
}
