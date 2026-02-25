-- Add rating column to books table (1-5, null if not rated)
ALTER TABLE books
ADD COLUMN IF NOT EXISTS rating integer CHECK (rating >= 1 AND rating <= 5);

COMMENT ON COLUMN books.rating IS 'User rating from 1 to 5 stars; null if not rated';
