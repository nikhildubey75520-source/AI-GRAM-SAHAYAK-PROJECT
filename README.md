# Gram Sahayak AI

Gram Sahayak AI is a full-stack prototype for helping rural citizens discover government schemes and report local issues from one simple interface. It is designed around a Jharkhand rollout, with Hindi support today and tribal-language, CSC, and SMS/IVR capabilities planned for the future.

## What It Does

- Shows backend connectivity and village information.
- Browses eight seeded government schemes with category filtering.
- Answers scheme questions using keyword-ranked retrieval over the local scheme database.
- Accepts grievances with optional photo or video evidence and stores them in SQLite with a `pending` status.
- Displays submitted grievances and their attached evidence.
- Creates, filters, and updates village alerts, with a village risk map based on alert severity.
- Shows official scheme helplines and role-based local contacts without inventing village-specific officer details.
- Switches visible interface labels between English, Hindi, draft Santhali, and draft Magahi.

The assistant deliberately uses grounded retrieval instead of free-form generation. This keeps answers tied to known scheme records and avoids dependency on a third-party AI API during a demo. The current prototype still requires the client and server to be reachable on the same machine or local network; true offline caching and SMS/IVR fallback are roadmap items.

## Getting Started

Prerequisite: Node.js 24 or newer. Node 24 provides the built-in `node:sqlite` module used by the server, so no native SQLite build dependency is required.

## Tech Stack

- React + Vite frontend
- Node.js + Express backend
- Multer media upload handling
- Node's built-in `node:sqlite` module
- SQLite database with idempotent sample data seeding

### 1. Start the backend

Open the first terminal at the project root:

```bash
cd server
npm install
npm start
```

The server listens on `http://localhost:5000` by default. It creates `server/gramsahayak.db` and seeds villages and schemes when their tables are empty. Node may print an experimental warning for `node:sqlite`; this is expected for Node 24 and does not indicate a startup failure.

Leave this terminal running, then open a second terminal for the client.

### 2. Start the frontend

```bash
cd client
npm install
npm run dev
```

Open the Vite URL, usually `http://localhost:5173`. Set `VITE_API_URL` if the backend is hosted at another address. The app should show a connected backend, five villages, eight schemes, the assistant, grievance form with optional media evidence, village risk map, alerts, and the English/Hindi/Santhali/Magahi language toggle.

### 3. Build the client

```bash
cd client
npm run build
```

## Troubleshooting

- **Port 5000 is already in use:** Stop the older server terminal or run the server with another `PORT` value, then point `VITE_API_URL` at that port.
- **The client says disconnected:** Confirm the backend terminal is still running and check `http://localhost:5000/api/health`.
- **The scheme list is empty:** Restart the backend. Its idempotent seed block populates schemes when the table is empty.
- **Install errors:** Confirm Node.js 24 or newer is selected, then run `npm install` again from the affected `server` or `client` directory. Avoid deleting lockfiles unless dependency resolution is genuinely broken.

## Hackathon Checklist

Before presenting, start both terminals and open the Vite page so judges see the ready application rather than setup commands. A reliable two-minute flow is:

1. Ask the assistant: `I am a small farmer, what support can I get?`
2. Show the grounded PM-Kisan and crop-insurance results.
3. Expand `How to apply` on PM-Kisan to show eligibility, documents, the application path, and the official website.
4. Switch the interface to Hindi, then show the Santhali and Magahi draft options as part of the regional-language roadmap.
5. Submit a water-supply grievance with a photo of a broken handpump and show the evidence preview and `pending` response.
6. Open the risk map to show how village alert severity is surfaced spatially.
7. Explain the Jharkhand roadmap: state schemes, tribal languages, FRA guidance, CSC deployment, and SMS/IVR fallback.

## API Highlights

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Check backend connectivity |
| `GET` | `/api/villages` | List seeded villages |
| `GET` | `/api/schemes` | List schemes, optionally filtered by category |
| `GET` | `/api/assistant/query?q=farmer%20support` | Return a grounded answer and related schemes |
| `GET` | `/api/grievances` | List submitted grievances |
| `POST` | `/api/grievances` | Create a multipart grievance with `name`, `issue`, `category`, and optional `media` |
| `GET` | `/uploads/:filename` | Serve uploaded grievance evidence |
| `GET` | `/api/alerts` | List village alerts |
| `POST` | `/api/alerts` | Create an alert |
| `PATCH` | `/api/alerts/:id` | Update an alert status |

Example grievance request without media:

```bash
curl -X POST http://localhost:5000/api/grievances \
	-F "name=Ravi Kumar" \
	-F "issue=No water supply for 3 days in our area" \
	-F "category=water"
```

Add `-F "media=@path/to/evidence.jpg"` to attach a JPEG, PNG, WebP, MP4, MOV, or AVI file. Uploads are limited to 15 MB and stored locally under `server/uploads/`, which is excluded from git.

## Demo Flow

1. Explain the difficulty of finding schemes and reporting village issues.
2. Ask: `I am a small farmer, what support can I get?`
3. Show the grounded PM-Kisan and crop-insurance results.
4. Expand `How to apply` on PM-Kisan to show eligibility, required documents, the application path, and the official link.
5. Switch the interface to Hindi, then show the Santhali and Magahi draft options.
6. Submit a water-supply grievance with a photo and show its evidence preview and `pending` status.
7. Open the risk map and point out the severity markers and village watchlist.
8. Close with the Jharkhand roadmap: state schemes, Santhali and Mundari support, FRA guidance, CSC deployment, and SMS/IVR fallback.

Santhali and Magahi support are best-effort draft translations for demonstration only. Production deployment requires review with native speakers of each language. Santhali may use the Ol Chiki script, while the current Magahi strings use Devanagari; neither set of strings should be treated as verified translations.

Scheme contact numbers are presented as public helpline references and should be rechecked against the relevant official portal before production deployment. Local assistance is intentionally described by role, such as a Panchayat Secretary or Block Development Officer, because village-level assignments vary and must come from an official directory such as JharSewa.

## Roadmap

- Add Jharkhand-specific schemes and official source links.
- Add eligibility fields, freshness dates, and citations to scheme records.
- Add grievance deduplication and clustering by location and category.
- Add role-based access for citizens, panchayat workers, and block officials.
- Add client caching, synchronization, and assisted channels for low-connectivity areas.
- Optionally add an LLM layer for conversational phrasing while retaining grounded retrieval as the source of truth.
