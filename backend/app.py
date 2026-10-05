import json
import os
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from dotenv import load_dotenv

from flask import Flask, jsonify, request
from flask_cors import CORS

from database import get_db, init_db

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://localhost:5174"])

load_dotenv(Path(__file__).with_name(".env"))

TMDB_API_URL = "https://api.themoviedb.org/3"

init_db()

#Each key is the name Flask expects from the frontend. 
#Each value is the database column that stores it.

MOVIE_FIELDS = {
    "director": "director",
    "favoriteCharacter": "favorite_character",
    "leastFavoriteCharacter": "least_favorite_character",
    "sumUpInOneWord": "sum_up_in_one_word",
    "genre": "genre",
    "quote": "quote",
    "whereWatched": "where_watched",
    "bestMoment": "best_moment",
    "worstMoment": "worst_moment",
    "dateWatched": "date_watched",
    "tmdbId": "tmdb_id",
    "posterPath": "poster_path",
    "releaseYear": "release_year",
}

COMPLETION_DATE_FIELDS = {
    "completedYear": "completed_year",
    "completedMonth": "completed_month",
    "completedDay": "completed_day",
    "completedDatePrecision": "completed_date_precision",
}

NIGHTSTAND_STATUSES = ("queued", "in_progress", "done")

BOOK_FIELDS = {
    "author": "author",
    "publisher": "publisher",
    "genre": "genre",
    "googleBookId": "google_book_id",
    "coverUrl": "cover_url",
    "dateRead": "date_watched",
    "sumUpInOneWord": "sum_up_in_one_word",
    "quote": "quote",
    "bestMoment": "best_moment",
    "worstMoment": "worst_moment",
}

@app.route("/", methods=["GET"])
def home():
    return jsonify(
        {
            "message": "Thoughts and Titles API is running.",
            "endpoints": {
                "list_items": "/items",
                "get_item": "/items/<item_id>",
            },
        }
    )


@app.route("/items", methods=["GET"])
def get_items():
    conn = get_db()
    items = conn.execute("SELECT * FROM items ORDER BY created_at DESC").fetchall()
    conn.close()
    return jsonify([dict(item) for item in items])

@app.route("/movie-search", methods=["GET"])
def search_movies():
    query = request.args.get("query", "").strip()
    year = request.args.get("year", "").strip()
    media_type = request.args.get("media_type", "movie")

    if not query:
        return jsonify({"error": "A movie title is required."}), 400
    if media_type not in ("movie", "series"):
        return jsonify({"error": "Media type must be movie or series."}), 400

    access_token = os.getenv("TMDB_ACCESS_TOKEN")
    if not access_token:
        return jsonify({"error": "TMDB access token is not configured."}), 500

    params = {
        "query": query,
        "include_adult": "false",
        "language": "en-US",
    }

    if year:
        params["year"] = year

    tmdb_request = Request(
        f"{TMDB_API_URL}/search/{'tv' if media_type == 'series' else 'movie'}?{urlencode(params)}",
        headers={
            "Authorization": f"Bearer {access_token}",
            "accept": "application/json",
        },
    )

    try:
        with urlopen(tmdb_request, timeout=10) as response:
            data = json.load(response)
    except HTTPError:
        return jsonify({"error": "TMDB rejected the search request."}), 502
    except URLError:
        return jsonify({"error": "Could not connect to TMDB."}), 502

    results = [
        {
            "tmdbId": movie["id"],
            "title": movie.get("title") or movie.get("name"),
            "releaseYear": (
                int((movie.get("release_date") or movie.get("first_air_date"))[:4])
                if movie.get("release_date") or movie.get("first_air_date")
                else None
            ),
            "posterPath": movie.get("poster_path"),
        }
        for movie in data.get("results", [])
        if movie.get("poster_path")
    ]

    return jsonify(results)


@app.route("/book-search", methods=["GET"])
def search_books():
    query = request.args.get("query", "").strip()
    if not query:
        return jsonify({"error": "A book title is required."}), 400

    try:
        with urlopen(
            f"https://www.googleapis.com/books/v1/volumes?{urlencode({'q': query, 'maxResults': 12, 'printType': 'books', **({'key': os.getenv('GOOGLE_BOOKS_API_KEY')} if os.getenv('GOOGLE_BOOKS_API_KEY') else {})})}",
            timeout=10,
        ) as response:
            data = json.load(response)
    except HTTPError as error:
        if error.code == 429:
            return jsonify({"error": "Google Books rate limit reached. Configure GOOGLE_BOOKS_API_KEY to continue."}), 429
        return jsonify({"error": "Google Books rejected the search request."}), 502
    except URLError:
        return jsonify({"error": "Could not connect to Google Books."}), 502

    return jsonify([
        {
            "googleBookId": book["id"],
            "title": book.get("volumeInfo", {}).get("title"),
            "author": ", ".join(book.get("volumeInfo", {}).get("authors", [])),
            "releaseYear": int(book["volumeInfo"]["publishedDate"][:4]) if book.get("volumeInfo", {}).get("publishedDate", "")[:4].isdigit() else None,
            "coverUrl": book.get("volumeInfo", {}).get("imageLinks", {}).get("thumbnail", "").replace("http://", "https://", 1) or None,
            "publisher": book.get("volumeInfo", {}).get("publisher"),
        }
        for book in data.get("items", [])
        if book.get("volumeInfo", {}).get("title")
    ])


@app.route("/book-details/<google_book_id>", methods=["GET"])
def get_book_details(google_book_id):
    params = {}
    if os.getenv("GOOGLE_BOOKS_API_KEY"):
        params["key"] = os.getenv("GOOGLE_BOOKS_API_KEY")
    try:
        with urlopen(
            f"https://www.googleapis.com/books/v1/volumes/{google_book_id}?{urlencode(params)}",
            timeout=10,
        ) as response:
            book = json.load(response)
    except HTTPError as error:
        if error.code == 429:
            return jsonify({"error": "Google Books rate limit reached. Configure GOOGLE_BOOKS_API_KEY to continue."}), 429
        return jsonify({"error": "Google Books could not find this book."}), 404
    except URLError:
        return jsonify({"error": "Could not connect to Google Books."}), 502

    info = book.get("volumeInfo", {})
    return jsonify({
        "description": info.get("description", ""),
        "genre": ", ".join(info.get("categories", [])[:3]),
    })


@app.route("/movie-details/<int:tmdb_id>", methods=["GET"])
def get_movie_details(tmdb_id):
    media_type = request.args.get("media_type", "movie")
    if media_type not in ("movie", "series"):
        return jsonify({"error": "Media type must be movie or series."}), 400
    access_token = os.getenv("TMDB_ACCESS_TOKEN")
    if not access_token:
        return jsonify({"error": "TMDB access token is not configured."}), 500

    params = {
        "language": "en-US",
        "append_to_response": "credits",
    }
    tmdb_request = Request(
        f"{TMDB_API_URL}/{'tv' if media_type == 'series' else 'movie'}/{tmdb_id}?{urlencode(params)}",
        headers={
            "Authorization": f"Bearer {access_token}",
            "accept": "application/json",
        },
    )

    try:
        with urlopen(tmdb_request, timeout=10) as response:
            movie = json.load(response)
    except HTTPError:
        return jsonify({"error": "TMDB rejected the movie details request."}), 502
    except URLError:
        return jsonify({"error": "Could not connect to TMDB."}), 502

    director = next(
        (
            crew_member["name"]
            for crew_member in movie.get("credits", {}).get("crew", [])
            if crew_member.get("job") == ("Director" if media_type == "movie" else "Executive Producer")
        ),
        None,
    )
    if media_type == "series" and not director:
        director = ", ".join(creator["name"] for creator in movie.get("created_by", [])) or None
    genre = ", ".join(
        genre["name"] for genre in movie.get("genres", [])
    ) or None

    return jsonify(
        {
            "director": director,
            "genre": genre,
            "overview": movie.get("overview") or None,
        }
    )


@app.route("/items", methods=["POST"])
def add_items():
    data = request.get_json() or {}

    if not data.get("title") or not data.get("type"):
        return jsonify({"error": "Title and type are required."}), 400

    columns = ["title", "type", "description"]
    values = [
        data["title"],
        data["type"],
        data.get("description", "")
    ]

    if data.get("status") in NIGHTSTAND_STATUSES:
        columns.append("status")
        values.append(data["status"])

    for json_name, column_name in {
        "rating": "rating",
        "review": "review",
    }.items():
        if json_name in data:
            columns.append(column_name)
            values.append(data[json_name])

    for json_name, column_name in COMPLETION_DATE_FIELDS.items():
        if json_name in data:
            columns.append(column_name)
            values.append(data[json_name])

    # Only movies receive movie-journal fields.
    if data["type"] == "movie":
        for json_name, column_name in MOVIE_FIELDS.items():
            if json_name in data:
                columns.append(column_name)
                values.append(data[json_name])
        if data.get("mediaType") in ("movie", "series"):
            columns.append("media_type")
            values.append(data["mediaType"])
    elif data["type"] == "book":
        for json_name, column_name in BOOK_FIELDS.items():
            if json_name in data:
                columns.append(column_name)
                values.append(data[json_name])

    placeholders = ", ".join("?" for _ in columns)

    conn = get_db()

    cursor = conn.execute(
        f"INSERT INTO items ({', '.join(columns)}) VALUES ({placeholders})",
        values,
    )

    new_id = cursor.lastrowid
    conn.commit()

    item = conn.execute(
        "SELECT * FROM items WHERE id = ?",
        (new_id,),
    ).fetchone()
    conn.close()

    return jsonify(dict(item)), 201

@app.route("/items/<int:item_id>", methods=["PUT"])
def update_item(item_id):
    data = request.get_json() or {}

    update_fields = {
        "title": "title",
        "status": "status",
        "rating": "rating",
        "description": "description",
        "review": "review",
        **COMPLETION_DATE_FIELDS,
        **MOVIE_FIELDS,
    }

    changes = []
    values = []

    for json_name, column_name in update_fields.items():
        if json_name in data:
            changes.append(f"{column_name} = ?")
            values.append(data[json_name])

    if "status" in data and data["status"] not in NIGHTSTAND_STATUSES:
        return jsonify({"error": "Invalid status"}), 400

    if not changes:
        return jsonify({"error": "No valid fields were provided"}), 400

    values.append(item_id)

    conn = get_db()
    conn.execute(
        f"UPDATE items SET {', '.join(changes)} WHERE id = ?",
        values,
    )
    conn.commit()

    item = conn.execute("SELECT * FROM items WHERE id = ?", (item_id,)).fetchone()
    conn.close()

    if item is None:
        return jsonify({"error": "Item not found"}), 404

    return jsonify(dict(item))


@app.route("/items/<int:item_id>", methods=["DELETE"])
def delete_item(item_id):
    conn = get_db()
    conn.execute("DELETE FROM items WHERE id = ?", (item_id,))
    conn.commit()
    conn.close()

    return jsonify({"message": "Item deleted!"})


@app.route("/items/<int:item_id>", methods=["GET"])
def get_item(item_id):
    conn = get_db()
    item = conn.execute("SELECT * FROM items WHERE id = ?", (item_id,)).fetchone()
    conn.close()

    if item is None:
        return jsonify({"error": "Item not found"}), 404

    return jsonify(dict(item))


if __name__ == "__main__":
    app.run(debug=True)
