import sqlite3


def get_db():
    conn = sqlite3.connect("tnt-shelf.db")
    conn.row_factory = sqlite3.Row
    return conn

def migrate_db(conn):
    movie_columns = {
        "director": "TEXT",
        "favorite_character": "TEXT",
        "least_favorite_character": "TEXT",
        "sum_up_in_one_word": "TEXT",
        "genre": "TEXT",
        "quote": "TEXT",
        "where_watched": "TEXT",
        "best_moment": "TEXT",
        "worst_moment": "TEXT",
        "date_watched": "TEXT",
        "tmdb_id": "INTEGER",
        "poster_path": "TEXT",
        "release_year": "INTEGER",
        "media_type": "TEXT",
        "rewatch_count": "INTEGER NOT NULL DEFAULT 1",
        "author": "TEXT",
        "publisher": "TEXT",
        "open_library_id": "TEXT",
        "cover_id": "INTEGER",
        "google_book_id": "TEXT",
        "cover_url": "TEXT",
        "completed_year": "INTEGER",
        "completed_month": "INTEGER",
        "completed_day": "INTEGER",
        "completed_date_precision": "TEXT",
    }

    existing_columns = {
        row["name"] for row in conn.execute("PRAGMA table_info(items)")
    }

    for column_name, column_type in movie_columns.items():
        if column_name not in existing_columns:
            conn.execute(
                f"ALTER TABLE items ADD COLUMN {column_name} {column_type}"
            )

    # These are no longer part of a movie entry. Removing these column
    # also removes any old values saved in the local database.
    obsolete_columns = (
        "cast",
        "tmdbId",
        "posterPath",
        "releaseYear",
    )

    for column_name in obsolete_columns:
        if column_name in existing_columns:
            conn.execute(f"ALTER TABLE items DROP COLUMN {column_name}")

    # Preserve exact dates collected before date precision was introduced.
    conn.execute(
        """UPDATE items
           SET completed_year = CAST(substr(date_watched, 1, 4) AS INTEGER),
               completed_month = CAST(substr(date_watched, 6, 2) AS INTEGER),
               completed_day = CAST(substr(date_watched, 9, 2) AS INTEGER),
               completed_date_precision = 'exact'
           WHERE date_watched IS NOT NULL AND length(date_watched) = 10
             AND completed_date_precision IS NULL"""
    )

    # Older entries used `to_watch` for everything not yet shelved.  Preserve
    # those entries as items waiting in the Nightstand queue.
    conn.execute("UPDATE items SET status = 'queued' WHERE status = 'to_watch'")

def init_db():
    conn = get_db()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS items (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            title       TEXT NOT NULL,
            type        TEXT NOT NULL,
            status      TEXT NOT NULL DEFAULT 'queued',
            rating      INTEGER,
            description TEXT,
            review      TEXT,
            created_at  TEXT DEFAULT (datetime('now'))
        )
        """
    )
    migrate_db(conn)
    conn.execute(
        """CREATE TABLE IF NOT EXISTS viewings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_id INTEGER NOT NULL,
            watched_on TEXT NOT NULL,
            rating INTEGER NOT NULL,
            tag TEXT,
            note TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY(item_id) REFERENCES items(id) ON DELETE CASCADE
        )"""
    )
    conn.commit()
    conn.close()
