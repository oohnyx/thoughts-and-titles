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

    if not query:
        return jsonify({"error": "A movie title is required."}), 400

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
        f"{TMDB_API_URL}/search/movie?{urlencode(params)}",
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
            "title": movie["title"],
            "releaseYear": (
                int(movie["release_date"][:4])
                if movie.get("release_date")
                else None
            ),
            "posterPath": movie.get("poster_path"),
        }
        for movie in data.get("results", [])
        if movie.get("poster_path")
    ]

    return jsonify(results)


@app.route("/movie-details/<int:tmdb_id>", methods=["GET"])
def get_movie_details(tmdb_id):
    access_token = os.getenv("TMDB_ACCESS_TOKEN")
    if not access_token:
        return jsonify({"error": "TMDB access token is not configured."}), 500

    params = {
        "language": "en-US",
        "append_to_response": "credits",
    }
    tmdb_request = Request(
        f"{TMDB_API_URL}/movie/{tmdb_id}?{urlencode(params)}",
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
            if crew_member.get("job") == "Director"
        ),
        None,
    )
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

    for json_name, column_name in {
        "rating": "rating",
        "review": "review",
    }.items():
        if json_name in data:
            columns.append(column_name)
            values.append(data[json_name])

    # Only movies receive movie-journal fields.
    if data["type"] == "movie":
        for json_name, column_name in MOVIE_FIELDS.items():
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
        **MOVIE_FIELDS,
    }

    changes = []
    values = []

    for json_name, column_name in update_fields.items():
        if json_name in data:
            changes.append(f"{column_name} = ?")
            values.append(data[json_name])

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
