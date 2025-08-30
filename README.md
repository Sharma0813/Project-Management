# Project Management Web App (Full Stack)

A lightweight full‑stack project management web app featuring Projects and a simple Kanban board (Backlog → In Progress → Done).

## Tech
- **Frontend:** React + Vite, plain CSS
- **Backend:** Node.js + Express, JSON file storage (no external DB)
- **API:** REST under `/api/*`

## Quick Start
> Requires Node.js 18+ and npm.

```bash
# 1) Install and run backend
cd server
npm install
npm run dev

# 2) In a new terminal, run frontend
cd ../client
npm install
npm run dev
```

- Backend starts at http://localhost:5000
- Frontend starts at http://localhost:5173

The frontend auto uses `http://localhost:5000` for the API. You can change this by setting `VITE_API_URL` in `client/.env`.

## Features
- Create, update, and delete **Projects**
- For each project, manage **Tasks** with status: *Backlog, In Progress, Done*
- Edit task metadata (title, description, assignee, due date, priority)
- Search and filter tasks by text and status
- Persistent storage in a local JSON file (`server/data.json`)

## Scripts
### Backend
- `npm run dev` – start Express server with auto-restart (nodemon)

### Frontend
- `npm run dev` – start Vite dev server

## Notes
- This is a learning‑friendly starter—no auth. You can extend with users and auth later.
- If the JSON file ever gets corrupted, stop the server, delete `server/data.json`, and start again.
