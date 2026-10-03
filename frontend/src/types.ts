// Fields shared by every item on the shelf.
export type BaseItem = {
  id: number;
  title: string;
  type: "book" | "movie";
  status: "to_watch" | "done";
  rating: number | null;
  description: string;
  review: string;
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
};

export type MovieSearchResult = {
  tmdbId: number;
  title: string;
  releaseYear: number | null;
  posterPath: string;
};

export type BookEntry = BaseItem & {
  type: "book";
};

// Components can use Item for all shelf entries. Checking item.type === "movie"
// narrows it to MovieEntry and exposes the journal fields above.
export type Item = BookEntry | MovieEntry;
