import type { BaseItem, Item, MovieEntry, MovieSearchResult } from "./types"

// this is the base URL of our Flask backend
// every API call will start with this

const BASE_URL = "http://127.0.0.1:5000"

type ApiItem = Omit<BaseItem, "description" | "review"> & {
    description: string | null
    review: string | null
    director: string | null
    favorite_character: string | null
    least_favorite_character: string | null
    sum_up_in_one_word: string | null
    genre: string | null
    quote: string | null
    where_watched: string | null
    best_moment: string | null
    worst_moment: string | null
    date_watched: string | null
    tmdb_id: number | null
    poster_path: string | null
    release_year: number | null
    media_type: "movie" | "series" | null
}

function normalizeItem(item: ApiItem): Item {
    const sharedItem: BaseItem = {
        id: item.id,
        title: item.title,
        type: item.type,
        status: item.status,
        rating: item.rating,
        description: item.description ?? "",
        review: item.review ?? "",
    }

    if (item.type === "movie") {
        return {
            ...sharedItem,
            type: "movie",
            director: item.director ?? undefined,
            favoriteCharacter: item.favorite_character ?? undefined,
            leastFavoriteCharacter: item.least_favorite_character ?? undefined,
            sumUpInOneWord: item.sum_up_in_one_word ?? undefined,
            genre: item.genre ?? undefined,
            quote: item.quote ?? undefined,
            whereWatched: item.where_watched ?? undefined,
            bestMoment: item.best_moment ?? undefined,
            worstMoment: item.worst_moment ?? undefined,
            dateWatched: item.date_watched ?? undefined,
            tmdbId: item.tmdb_id ?? undefined,
            posterPath: item.poster_path ?? undefined,
            releaseYear: item.release_year ?? undefined,
            mediaType: item.media_type ?? "movie",
        }
    }

    return { ...sharedItem, type: "book" }
}

type MovieFields = Omit<MovieEntry, keyof BaseItem | "type">

type CreateItemData = {
  title: string
  type: Item["type"]
  status?: Item["status"]
  description?: string
    rating?: number | null
    review?: string
} & MovieFields

type UpdateItemData = {
    title?: string
    status?: Item["status"]
    rating?: number | null
    description?: string
    review?: string
} & MovieFields

// GET ALL ITEMS

export async function fetchItems() {
    const response = await fetch(`${BASE_URL}/items`)
    // fetch() sends an HTTP request and returns a "promise"
    // "await" pauses here until the response comes back — like waiting for a reply text

    if (!response.ok) throw new Error("Failed to fetch items")
    // response.ok is true if the status code is 200-299 (success)
    // if something went wrong, throw an error to stop execution

    const data: ApiItem[] = await response.json()
    return data.map(normalizeItem)
    // .json() reads the response body and converts it from JSON text into a JS object
}

// SEARCH MOVIE POSTER

export async function searchMovies(
    query: string,
    year?: string,
    mediaType: "movie" | "series" = "movie",
): Promise<MovieSearchResult[]> {
    const params = new URLSearchParams({ query });

    if (year?.trim()) {
        params.set("year", year.trim());
    }
    params.set("media_type", mediaType);

    const response = await fetch(
        `${BASE_URL}/movie-search?${params.toString()}`,
    );

    if (!response.ok) {
        throw new Error("Failed to search for movies.");
    }

    return response.json();
}

type MovieDetails = {
    director: string | null
    genre: string | null
    overview: string | null
}

export async function fetchMovieDetails(tmdbId: number, mediaType: "movie" | "series" = "movie"): Promise<MovieDetails> {
    const response = await fetch(`${BASE_URL}/movie-details/${tmdbId}?media_type=${mediaType}`)

    if (!response.ok) {
        throw new Error("Failed to fetch movie details.")
    }

    return response.json()
}

// GET ONE ITEM BY ID

export async function fetchItem(id: number) {
    const response = await fetch(`${BASE_URL}/items/${id}`)
    if (!response.ok) throw new Error("Item not found!")
    const data: ApiItem = await response.json()
    return normalizeItem(data)
}

// POST A NEW ITEM

export async function createItem(data: CreateItemData) {
    const response = await fetch (`${BASE_URL}/items`, {
        method: "POST",                             // tell Flask this is a POST request
        headers: {
            "Content-Type": "application/json"      // tell Flask you are sending JSON
        },
        body: JSON.stringify(data),
    })

    if (!response.ok) throw new Error("Failed to create new item.")
    const created: ApiItem = await response.json()
    return normalizeItem(created)
}

// PUT (update) AN ITEM

export async function updateItem(id: number, data: UpdateItemData) {
    const response = await fetch (`${BASE_URL}/items/${id}`, {
        method: "PUT",
        headers: { 
            "Content-Type": "application/json" 
        },
        body: JSON.stringify(data),
    })

    if (!response.ok) throw new Error("Failed to update item")
    const updated: ApiItem = await response.json()
    return normalizeItem(updated)
}

// DELETE AN ITEM

export async function deleteItem(id: number) {
    const response = await fetch (`${BASE_URL}/items/${id}`, {
        method: "DELETE",
    })

    if (!response.ok) throw new Error("Failed to delete item")
    return response.json()
}
