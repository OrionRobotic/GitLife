import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Search, X } from "lucide-react";
import { MenuButton } from "@/components/MenuButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { Book, BookCreateInput } from "@/types/database";
import { getBooks, createBook, updateBook, deleteBook } from "@/services/books";
import { BookShelf } from "@/components/bookshelf/BookShelf";
import { AddBookDialog } from "@/components/bookshelf/AddBookDialog";
import { BookDetailDialog } from "@/components/bookshelf/BookDetailDialog";

export default function Bookshelf() {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchBooks = useCallback(async () => {
    if (!user) return;
    const data = await getBooks(user.id);
    if (data) setBooks(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleAddBook = async (input: BookCreateInput) => {
    if (!user) return;
    const newBook = await createBook(input, user.id);
    if (newBook) {
      setBooks((prev) => [newBook, ...prev]);
    }
  };

  const handleUpdateBook = async (id: string, updates: Partial<Book>) => {
    const updated = await updateBook({ id, ...updates });
    if (updated) {
      setBooks((prev) => prev.map((b) => (b.id === id ? updated : b)));
      if (selectedBook?.id === id) setSelectedBook(updated);
    }
  };

  const handleDeleteBook = async (id: string) => {
    const success = await deleteBook(id);
    if (success) {
      setBooks((prev) => prev.filter((b) => b.id !== id));
    }
  };

  const handleBookClick = (book: Book) => {
    setSelectedBook(book);
    setDetailOpen(true);
  };

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return books.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q)
    );
  }, [books, searchQuery]);

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

      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-24">
          <h1 className="text-3xl font-normal text-foreground mb-2">
            Bookshelf
          </h1>
          <p className="text-sm text-muted-foreground">Your reading collection</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pb-4">
        {loading ? (
          <p className="text-muted-foreground text-center py-12">Loading...</p>
        ) : (
          <BookShelf books={books} onBookClick={handleBookClick} />
        )}
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <p className="text-sm italic text-muted-foreground/70 text-right">
          "A reader lives a thousand lives before he dies. The man who never reads lives only one."
        </p>
        <p className="text-xs text-muted-foreground/50 text-right mt-1">— George R.R. Martin</p>
      </div>

      <div className="max-w-4xl mx-auto px-6 flex justify-end gap-2 items-start">
        <div className="relative">
          {searchOpen ? (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title or author..."
                  className="w-60 h-9 text-sm pr-8"
                />
                <button
                  onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              {searchQuery.trim() && (
                <div className="absolute top-10 left-0 w-60 bg-[rgba(245,240,230,0.95)] border border-[rgba(200,190,175,0.4)] backdrop-blur-sm rounded-md shadow-lg z-30 max-h-48 overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-3">No results</p>
                  ) : (
                    searchResults.map((b) => (
                      <button
                        key={b.id}
                        className="w-full text-left px-3 py-2 hover:bg-black/5 transition-colors"
                        onClick={() => {
                          handleBookClick(b);
                          setSearchOpen(false);
                          setSearchQuery("");
                        }}
                      >
                        <p className="text-sm font-medium text-foreground">{b.title}</p>
                        <p className="text-xs text-muted-foreground">{b.author}</p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : (
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 border-[#D97757] hover:border-[#D97757] hover:bg-background"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-[#D97757] hover:border-[#D97757] hover:bg-background"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Book
        </Button>
      </div>

      <AddBookDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={handleAddBook}
      />

      <BookDetailDialog
        book={selectedBook}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdate={handleUpdateBook}
        onDelete={handleDeleteBook}
      />

      <p className="fixed bottom-4 left-0 right-0 text-sm text-muted-foreground text-center">
        GitLife
      </p>
    </div>
  );
}
