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
    }

    existing_columns = {
        row["name"] for row in conn.execute("PRAGMA table_info(items)")
    }

    for column_name, column_type in movie_columns.items():
        if column_name not in existing_columns:
            conn.execute(
                f"ALTER TABLE items ADD COLUMN {column_name} {column_type}"
            )

    # The cast prompt is no longer part of a movie entry. Removing this column
    # also removes any old cast values saved in the local database.
    if "cast" in existing_columns:
        conn.execute("ALTER TABLE items DROP COLUMN cast")

def init_db():
    conn = get_db()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS items (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            title       TEXT NOT NULL,
            type        TEXT NOT NULL,
            status      TEXT NOT NULL DEFAULT 'to_watch',
            rating      INTEGER,
            description TEXT,
            review      TEXT,
            created_at  TEXT DEFAULT (datetime('now'))
        )
        """
    )
    migrate_db(conn)
    conn.commit()
    conn.close()
