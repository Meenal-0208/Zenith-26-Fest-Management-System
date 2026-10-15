# Zenith '26 College Fest Management System

A full-stack, responsive College Fest Management System built for the PM2-01 & PM2-02 Vibe-Coding Capstone. Features a student-facing event discovery and registration portal, real-time live availability calculation, server-side validation rules, an admin coordinator dashboard with real-time analytics, and automated seed imports from Excel.

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | HTML5, Tailwind CSS (Play CDN), Vanilla JavaScript (ES6+) | Responsive grid, interactive search & category filtering, modal registration flow, live admin dashboard metrics, utilization charts. |
| **Backend** | Python 3.11+, FastAPI, Uvicorn, Pydantic v2 | High-performance asynchronous REST API, request schema validation, server-side business rules, static file serving. |
| **Data Layer** | SQLite (`fest.db`), `openpyxl` | Lightweight local relational database with zero server configuration, seeding 14 events from Excel. |
| **API Testing** | Postman | Automated collection (`zenith26-api.postman_collection.json`) testing status codes, validations, and payloads. |

---

## 📁 Project Structure

```
zenith26-fest-system/
├── backend/
│   ├── database.py       # SQLite connection helper & schema creation
│   ├── main.py           # FastAPI app, REST endpoints, static mount
│   ├── models.py         # Pydantic contract models
│   └── seed_data.py      # Excel reader (openpyxl) to SQLite seeder
├── frontend/
│   ├── index.html        # Student event discovery & registration portal
│   ├── admin.html        # Fest coordinator admin analytics dashboard
│   └── js/
│       ├── app.js        # Student UI logic (live search, filter, register)
│       └── admin.js      # Admin UI logic (metrics, sorting, roster, cancel)
├── data/
│   └── events_seed.xlsx  # 14 seed events spreadsheet
├── requirements.txt      # Python dependencies
├── zenith26-api.postman_collection.json # Exported Postman collection
├── fest.db               # SQLite database file (created on launch)
└── README.md             # Documentation & running instructions
```

---

## 🚀 How to Run the Application

### 1. Navigate to the project directory
```bash
cd "zenith26-fest-system"
```

### 2. Activate the virtual environment
- **On Windows (PowerShell):**
  ```powershell
  .\venv\Scripts\Activate.ps1
  ```
- **On Windows (Command Prompt):**
  ```cmd
  venv\Scripts\activate.bat
  ```
- **On macOS / Linux:**
  ```bash
  source venv/bin/activate
  ```

*(If you ever need to reinstall dependencies: `pip install -r requirements.txt`)*

### 3. Start the FastAPI server
```bash
uvicorn backend.main:app --reload
```

The application will start on **`http://localhost:8000`**.

---

## 🌐 Application URLs

- **Student Event Portal:** [http://localhost:8000/](http://localhost:8000/)
- **Admin Coordinator Dashboard:** [http://localhost:8000/admin.html](http://localhost:8000/admin.html)
- **Interactive Swagger API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Alternative ReDoc Docs:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 📡 REST API Contract

### Core Endpoints

| Method | Endpoint | Description | Status Codes |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/events` | List all events with dynamic `available_seats`. Supports `?category=` and `?search=`. | `200 OK` |
| **GET** | `/api/events/{event_id}` | Retrieve details for a single event. | `200 OK`, `404 Not Found` |
| **POST** | `/api/events/{event_id}/register` | Register a student with strict server-side validation. | `201 Created`, `400 Bad Request`, `409 Conflict`, `404 Not Found` |
| **GET** | `/api/registrations` | List registered students with event titles. Supports `?event_id=`. | `200 OK` |
| **GET** | `/api/stats` | Real-time computed fest statistics (events, sign-ups, utilization %, categories). | `200 OK` |

### Stretch Admin Endpoints

| Method | Endpoint | Description | Status Codes |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/events` | Admin can create a new fest event with server validation. | `201 Created`, `400 Bad Request` |
| **DELETE** | `/api/registrations/{id}` | Admin can cancel a registration and immediately restore 1 seat. | `200 OK`, `404 Not Found` |

---

## 🧪 Postman API Testing

1. Open **Postman Desktop**.
2. Click **Import** and select `zenith26-api.postman_collection.json`.
3. The collection is pre-configured with the `{{baseUrl}}` variable set to `http://localhost:8000`.
4. Run requests to test:
   - Successful registrations (`201 Created`).
   - Server-side validation errors (`400 Bad Request` for empty fields or invalid emails).
   - Duplicate prevention (`409 Conflict - Already registered`).
   - Live updated statistics and seat availability counts.
