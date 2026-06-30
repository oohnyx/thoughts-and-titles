from flask import Flask, jsonify, request
from flask_cors import CORS

from database import get_db, init_db

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://localhost:5174"])

init_db()


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


@app.route("/items", methods=["POST"])
def add_items():
    data = request.get_json()

    conn = get_db()

    cursor = conn.execute(
        "INSERT INTO items (title, type, description) VALUES (?, ?, ?)",
        (data["title"], data["type"], data.get("description", "")),
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
    data = request.get_json()

    conn = get_db()
    conn.execute(
        """UPDATE items
           SET status = ?, rating = ?, review = ?, description = ?
           WHERE id = ?""",
        (
            data.get("status"),
            data.get("rating"),
            data.get("review"),
            data.get("description"),
            item_id,
        ),
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
