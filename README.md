# Gram Sahayak AI

Gram Sahayak AI is a full-stack prototype for helping rural citizens discover government schemes and report local issues from one simple interface. It is designed around a Jharkhand rollout, with Hindi support today and tribal-language, CSC, and SMS/IVR capabilities planned for the future.

## What It Does

- Shows backend connectivity and village information.
- Browses eight seeded government schemes with category filtering.
- Answers scheme questions using keyword-ranked retrieval over the local scheme database.
- Accepts grievances and stores them in SQLite with a `pending` status.
- Creates, filters, and updates village alerts.
- Switches visible interface labels between English and Hindi.

The assistant deliberately uses grounded retrieval instead of free-form generation. This keeps answers tied to known scheme records and avoids dependency on a third-party AI API during a demo. The current prototype still requires the client and server to be reachable on the same machine or local network; true offline caching and SMS/IVR fallback are roadmap items.

## Tech Stack

- React + Vite frontend
- Node.js + Express backend
- Node's built-in `node:sqlite` module
- SQLite database with idempotent sample data seeding

## Quick Start

### 1. Start the server

```bash
cd server
npm install
npm start
```

The server listens on `http://localhost:5000` by default. It creates `server/gramsahayak.db` and seeds villages and schemes when their tables are empty.

### 2. Start the client

In a separate terminal:

```bash
cd client
npm install
npm run dev
```

Open the Vite URL, usually `http://localhost:5173`. Set `VITE_API_URL` if the backend is hosted at another address.

### 3. Build the client

```bash
cd client
npm run build
```

## API Highlights

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Check backend connectivity |
| `GET` | `/api/villages` | List seeded villages |
| `GET` | `/api/schemes` | List schemes, optionally filtered by category |
| `GET` | `/api/assistant/query?q=farmer%20support` | Return a grounded answer and related schemes |
| `GET` | `/api/grievances` | List submitted grievances |
| `POST` | `/api/grievances` | Create a grievance with `name` and `issue` |
| `GET` | `/api/alerts` | List village alerts |
| `POST` | `/api/alerts` | Create an alert |
| `PATCH` | `/api/alerts/:id` | Update an alert status |

Example grievance request:

```bash
curl -X POST http://localhost:5000/api/grievances \
	-H "Content-Type: application/json" \
	-d '{"name":"Ravi Kumar","issue":"No water supply for 3 days in our area"}'
```

## Demo Flow

1. Explain the difficulty of finding schemes and reporting village issues.
2. Ask: `I am a small farmer, what support can I get?`
3. Show the grounded PM-Kisan and crop-insurance results.
4. Switch the interface to Hindi.
5. Submit a water-supply grievance and show its `pending` status.
6. Close with the Jharkhand roadmap: state schemes, Santhali and Mundari support, FRA guidance, CSC deployment, and SMS/IVR fallback.

## Roadmap

- Add Jharkhand-specific schemes and official source links.
- Add eligibility fields, freshness dates, and citations to scheme records.
- Add grievance deduplication and clustering by location and category.
- Add role-based access for citizens, panchayat workers, and block officials.
- Add client caching, synchronization, and assisted channels for low-connectivity areas.
- Optionally add an LLM layer for conversational phrasing while retaining grounded retrieval as the source of truth.
