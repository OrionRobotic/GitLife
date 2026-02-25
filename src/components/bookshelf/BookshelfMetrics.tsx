import { useMemo } from "react";
import { subMonths } from "date-fns";
import { Book } from "@/types/database";

interface BookshelfMetricsProps {
  books: Book[];
  onBookClick?: (book: Book) => void;
}

export function BookshelfMetrics({ books, onBookClick }: BookshelfMetricsProps) {
  const { booksLast2Months, top3, mostReadAuthor } = useMemo(() => {
    const twoMonthsAgo = subMonths(new Date(), 2);
    const last2Months = books.filter(
      (b) => new Date(b.createdAt) >= twoMonthsAgo
    );

    const rated = books.filter((b) => b.rating != null);
    const sorted = [...rated].sort((a, b) => {
      const byRating = (b.rating ?? 0) - (a.rating ?? 0);
      if (byRating !== 0) return byRating;
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
    const top3Books = sorted.slice(0, 3);

    const byAuthor = new Map<
      string,
      { count: number; latestAt: string }
    >();
    for (const b of books) {
      const existing = byAuthor.get(b.author);
      if (!existing) {
        byAuthor.set(b.author, { count: 1, latestAt: b.createdAt });
      } else {
        existing.count += 1;
        if (b.createdAt > existing.latestAt) existing.latestAt = b.createdAt;
      }
    }
    const authorEntries = [...byAuthor.entries()];
    const topAuthor = authorEntries.sort((a, b) => {
      const byCount = b[1].count - a[1].count;
      if (byCount !== 0) return byCount;
      return b[1].latestAt.localeCompare(a[1].latestAt);
    })[0];

    return {
      booksLast2Months: last2Months.length,
      top3: top3Books,
      mostReadAuthor: topAuthor ? { name: topAuthor[0], count: topAuthor[1].count } : null,
    };
  }, [books]);

  return (
    <aside className="w-56 shrink-0 flex flex-col gap-6">
      <div className="rounded-lg bg-card/50 p-4">
        <dl className="space-y-4">
          <div>
            <dt className="text-xs text-muted-foreground">
              Books added (last 2 months)
            </dt>
            <dd className="text-2xl font-medium text-foreground mt-0.5">
              {booksLast2Months}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground mb-1.5">
              Top 3 books
            </dt>
            <dd className="space-y-1.5">
              {top3.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  Rate books to see top picks
                </p>
              ) : (
                <ol className="list-decimal list-inside space-y-1 text-sm text-foreground">
                  {top3.map((book, i) => (
                    <li key={book.id}>
                      {onBookClick ? (
                        <button
                          type="button"
                          onClick={() => onBookClick(book)}
                          className="text-left hover:underline focus:outline-none focus:underline"
                        >
                          {book.title}
                        </button>
                      ) : (
                        <span>{book.title}</span>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">
              Most read author
            </dt>
            <dd className="text-lg font-medium text-foreground mt-0.5">
              {mostReadAuthor ? (
                <>
                  {mostReadAuthor.name}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    ({mostReadAuthor.count} {mostReadAuthor.count === 1 ? "book" : "books"})
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground italic">—</span>
              )}
            </dd>
          </div>
        </dl>
      </div>
    </aside>
  );
}
