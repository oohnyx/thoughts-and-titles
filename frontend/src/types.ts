// Fields shared by every item on the shelf.
export type BaseItem = {
  id: number;
  title: string;
  type: "book" | "movie";
  status: "queued" | "in_progress" | "done";
  rating: number | null;
  description: string;
  review: string;
  completedYear?: number;
  completedMonth?: number;
  completedDay?: number;
  completedDatePrecision?: "exact" | "month" | "year" | "unknown";
};

export type MovieEntry = BaseItem & {
  type: "movie";
  director?: string;
  favoriteCharacter?: string;
  leastFavoriteCharacter?: string;
  sumUpInOneWord?: string;
  genre?: string;
  quote?: string;
  whereWatched?: string;
  bestMoment?: string;
  worstMoment?: string;
  dateWatched?: string;
  tmdbId?: number;
  posterPath?: string;
  releaseYear?: number;
  mediaType?: "movie" | "series";
};

export type MovieSearchResult = {
  tmdbId: number;
  title: string;
  releaseYear: number | null;
  posterPath: string;
};

export type BookEntry = BaseItem & {
  type: "book";
  author?: string;
  publisher?: string;
  genre?: string;
  googleBookId?: string;
  coverUrl?: string;
  releaseYear?: number;
  dateRead?: string;
  sumUpInOneWord?: string;
  quote?: string;
  bestMoment?: string;
  worstMoment?: string;
};

export type BookSearchResult = {
  googleBookId: string;
  title: string;
  author: string;
  releaseYear: number | null;
  coverUrl: string | null;
  publisher: string | null;
};

// Components can use Item for all shelf entries. Checking item.type === "movie"
// narrows it to MovieEntry and exposes the journal fields above.
export type Item = BookEntry | MovieEntry;
