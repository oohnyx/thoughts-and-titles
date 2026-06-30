# Thoughts and Titles

A full-stack shelf app for tracking books and movies you want to explore, finish, and review.

## Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS
- Backend: Flask, SQLite

## Features

- View a shelf of books and movies
- Add a new item with a title, type, and description
- Mark an item as done
- Delete an item
- Filter by all, books, movies, done, and up next
- Open a detail page for each item

## Project Structure

```text
thoughts-and-titles/
├── backend/
│   ├── app.py
│   ├── database.py
│   └── tnt-shelf.db
├── frontend/
│   ├── public/
│   ├── src/
│   └── package.json
├── package.json
└── .gitignore
```

## Requirements

- Node.js and npm
- Python 3

## Install

### Frontend

```bash
cd frontend
npm install
```

### Backend

Create a virtual environment if you do not already have one:

```bash
cd backend
python3 -m venv venv
./venv/bin/pip install flask flask-cors
```

## Run The App

Use two terminals.

### Terminal 1: backend

```bash
cd backend
./venv/bin/python app.py
```

The Flask API runs locally on:

```text
http://127.0.0.1:5000
```

### Terminal 2: frontend

From the repo root:

```bash
npm run start
```

Or from the frontend folder:

```bash
cd frontend
npm run dev
```

Open the Vite URL shown in the terminal, usually:

```text
http://localhost:5173
```

## API Notes

The frontend is currently configured to call:

```text
http://127.0.0.1:5000
```

If your local backend runs on a different host or port, update:

- `frontend/src/api.ts`

## Available Scripts

From the repo root:

```bash
npm run start
npm run build
npm run lint
npm run preview
npm run backend
```

## Database

The SQLite database file lives at:

```text
backend/tnt-shelf.db
```

If the schema gets out of sync during local development, you can recreate it by deleting the file and restarting Flask:

```bash
cd backend
rm tnt-shelf.db
./venv/bin/python app.py
```

## Current Notes

- The shelf page reads and writes through the Flask API.
- The detail page is present in the UI, but parts of it still use temporary local data.

## Checks Before Push

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

Backend:

```bash
cd backend
./venv/bin/python -m py_compile app.py database.py
```
