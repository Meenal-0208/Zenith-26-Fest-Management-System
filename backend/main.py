from datetime import datetime
from pathlib import Path
from typing import List, Optional, Dict

from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.database import get_db_connection, init_db
from backend.models import (
    EventOut,
    EventDetail,
    RegistrationIn,
    RegistrationOut,
    RegistrationDetail,
    StatsOut,
    EventCreate,
)
from backend.seed_data import seed_events

PROJECT_ROOT = Path(__file__).resolve().parent.parent
FRONTEND_DIR = PROJECT_ROOT / "frontend"

app = FastAPI(
    title="Zenith '26 College Fest Management System",
    description="REST API for Zenith '26 Fest Events and Registrations",
    version="1.0.0",
)

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    """Simple health check endpoint."""
    return {"status": "ok", "app": "Zenith '26 Fest Management System"}

@app.get("/favicon.ico")
def get_favicon():
    """Returns empty or default favicon response to prevent 404s."""
    return FileResponse(FRONTEND_DIR / "index.html", media_type="image/x-icon")


@app.on_event("startup")
def startup_event():
    """Ensure database schema is created and seeded with 14 events."""
    init_db()
    try:
        seed_events()
    except Exception as e:
        print(f"Startup seed notice: {e}")

# -------------------------------------------------------------
# API Endpoints
# -------------------------------------------------------------

@app.get("/api/events", response_model=List[EventOut])
def get_events(
    category: Optional[str] = Query(None, description="Filter by event category"),
    search: Optional[str] = Query(None, description="Case-insensitive title search"),
):
    """
    Returns a list of events, each with live available_seats
    computed as capacity minus count of registrations.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
        SELECT e.id, e.title, e.category, e.description, e.event_date, e.event_time,
               e.venue, e.capacity, e.fee, e.icon,
               (e.capacity - COALESCE(reg.reg_count, 0)) AS available_seats
        FROM events e
        LEFT JOIN (
            SELECT event_id, COUNT(*) AS reg_count
            FROM registrations
            GROUP BY event_id
        ) reg ON e.id = reg.event_id
        WHERE 1=1
    """
    params = []

    if category and category.strip() and category.strip().lower() != "all":
        query += " AND LOWER(e.category) = LOWER(?)"
        params.append(category.strip())

    if search and search.strip():
        query += " AND LOWER(e.title) LIKE LOWER(?)"
        params.append(f"%{search.strip()}%")

    query += " ORDER BY e.id ASC"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    events = []
    for r in rows:
        events.append(
            EventOut(
                id=r["id"],
                title=r["title"],
                category=r["category"],
                description=r["description"],
                event_date=r["event_date"],
                event_time=r["event_time"],
                venue=r["venue"],
                capacity=r["capacity"],
                fee=r["fee"],
                icon=r["icon"],
                available_seats=max(0, r["available_seats"]),
            )
        )
    return events


@app.get("/api/events/{event_id}", response_model=EventDetail)
def get_event(event_id: int):
    """
    Returns one EventDetail, or 404 if event_id does not exist.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT e.id, e.title, e.category, e.description, e.event_date, e.event_time,
               e.venue, e.capacity, e.fee, e.icon,
               (e.capacity - COALESCE(reg.reg_count, 0)) AS available_seats
        FROM events e
        LEFT JOIN (
            SELECT event_id, COUNT(*) AS reg_count
            FROM registrations
            GROUP BY event_id
        ) reg ON e.id = reg.event_id
        WHERE e.id = ?;
    """, (event_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with id {event_id} not found",
        )

    return EventDetail(
        id=row["id"],
        title=row["title"],
        category=row["category"],
        description=row["description"],
        event_date=row["event_date"],
        event_time=row["event_time"],
        venue=row["venue"],
        capacity=row["capacity"],
        fee=row["fee"],
        icon=row["icon"],
        available_seats=max(0, row["available_seats"]),
    )


@app.post(
    "/api/events/{event_id}/register",
    response_model=RegistrationOut,
    status_code=status.HTTP_201_CREATED,
)
def register_student(event_id: int, payload: RegistrationIn):
    """
    Server-side validated student registration:
      - event_id must exist (404)
      - student_name, roll_number, email must not be empty (400)
      - email must contain '@' (400)
      - event must not be at capacity already (409 'Event is full')
      - same email cannot register twice for same event (409 'Already registered')
      - returns 201 with RegistrationOut
    """
    # 1. Validation: required fields non-empty
    student_name = payload.student_name.strip() if payload.student_name else ""
    roll_number = payload.roll_number.strip() if payload.roll_number else ""
    email = payload.email.strip() if payload.email else ""
    phone = payload.phone.strip() if payload.phone else None

    if not student_name or not roll_number or not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student name, roll number, and email are required fields",
        )

    # 2. Validation: email must contain '@'
    if "@" not in email or email.startswith("@") or email.endswith("@"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email address: must contain '@'",
        )

    conn = get_db_connection()
    cursor = conn.cursor()

    # 3. Check event existence & capacity
    cursor.execute("""
        SELECT e.id, e.title, e.capacity, COALESCE(reg.reg_count, 0) AS reg_count
        FROM events e
        LEFT JOIN (
            SELECT event_id, COUNT(*) AS reg_count
            FROM registrations
            GROUP BY event_id
        ) reg ON e.id = reg.event_id
        WHERE e.id = ?;
    """, (event_id,))
    event_row = cursor.fetchone()

    if not event_row:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with id {event_id} not found",
        )

    if event_row["reg_count"] >= event_row["capacity"]:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Event is full",
        )

    # 4. Check duplicate registration (same email + same event_id)
    cursor.execute("""
        SELECT id FROM registrations WHERE event_id = ? AND LOWER(email) = LOWER(?);
    """, (event_id, email))
    existing = cursor.fetchone()
    if existing:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Already registered",
        )

    # 5. Insert registration
    registered_at = datetime.now().isoformat()
    try:
        cursor.execute("""
            INSERT INTO registrations (event_id, student_name, roll_number, email, phone, registered_at)
            VALUES (?, ?, ?, ?, ?, ?);
        """, (event_id, student_name, roll_number, email, phone, registered_at))
        reg_id = cursor.lastrowid
        conn.commit()
    except Exception as e:
        conn.close()
        if "UNIQUE" in str(e).upper():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Already registered",
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration error: {e}",
        )

    conn.close()

    return RegistrationOut(
        id=reg_id,
        event_id=event_id,
        student_name=student_name,
        registered_at=registered_at,
    )


@app.get("/api/registrations", response_model=List[RegistrationDetail])
def get_registrations(event_id: Optional[int] = Query(None, description="Filter by event_id")):
    """
    Returns registrations, each including event title for admin dashboard display.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
        SELECT r.id, r.event_id, r.student_name, r.roll_number, r.email, r.phone,
               r.registered_at, e.title AS event_title
        FROM registrations r
        JOIN events e ON r.event_id = e.id
        WHERE 1=1
    """
    params = []
    if event_id is not None:
        query += " AND r.event_id = ?"
        params.append(event_id)

    query += " ORDER BY r.id DESC;"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    results = []
    for r in rows:
        results.append(
            RegistrationDetail(
                id=r["id"],
                event_id=r["event_id"],
                student_name=r["student_name"],
                roll_number=r["roll_number"],
                email=r["email"],
                phone=r["phone"],
                registered_at=r["registered_at"],
                event_title=r["event_title"],
            )
        )
    return results


@app.get("/api/stats", response_model=StatsOut)
def get_stats():
    """
    Returns StatsOut: computed live from the database every time.
      - upcoming_events_count = events with event_date today or later
      - overall_utilization_pct = total_registrations / total_capacity * 100, rounded to 1 decimal
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Total events & total capacity
    cursor.execute("SELECT COUNT(*) AS total_events, COALESCE(SUM(capacity), 0) AS total_cap FROM events;")
    event_stats = cursor.fetchone()
    total_events = event_stats["total_events"]
    total_capacity = event_stats["total_cap"]

    # Total registrations
    cursor.execute("SELECT COUNT(*) AS total_reg FROM registrations;")
    total_registrations = cursor.fetchone()["total_reg"]

    # Overall utilization %
    if total_capacity > 0:
        overall_utilization_pct = round((total_registrations / total_capacity) * 100, 1)
    else:
        overall_utilization_pct = 0.0

    # Upcoming events count (event_date today or later)
    today_str = datetime.now().strftime("%Y-%m-%d")
    cursor.execute("SELECT COUNT(*) AS upcoming FROM events WHERE event_date >= ?;", (today_str,))
    upcoming_events_count = cursor.fetchone()["upcoming"]

    # Events by category
    cursor.execute("SELECT category, COUNT(*) AS count FROM events GROUP BY category ORDER BY count DESC;")
    category_rows = cursor.fetchall()
    events_by_category = {r["category"]: r["count"] for r in category_rows}

    conn.close()

    return StatsOut(
        total_events=total_events,
        total_registrations=total_registrations,
        total_capacity=total_capacity,
        overall_utilization_pct=overall_utilization_pct,
        upcoming_events_count=upcoming_events_count,
        events_by_category=events_by_category,
    )


# -------------------------------------------------------------
# Stretch Goal Endpoints (Admin Capabilities)
# -------------------------------------------------------------

@app.post("/api/events", response_model=EventOut, status_code=status.HTTP_201_CREATED)
def create_event(payload: EventCreate):
    """
    Stretch goal: Admin creates a new event with validation.
    """
    title = payload.title.strip() if payload.title else ""
    category = payload.category.strip() if payload.category else ""
    venue = payload.venue.strip() if payload.venue else ""
    event_date = payload.event_date.strip() if payload.event_date else ""
    event_time = payload.event_time.strip() if payload.event_time else ""

    if not title or not category or not venue or not event_date or not event_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Title, category, venue, date, and time are required",
        )

    if payload.capacity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Capacity must be greater than 0",
        )

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO events (title, category, description, event_date, event_time, venue, capacity, fee, icon)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        title,
        category,
        payload.description or "",
        event_date,
        event_time,
        venue,
        payload.capacity,
        max(0, payload.fee),
        payload.icon or "📅"
    ))
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return EventOut(
        id=new_id,
        title=title,
        category=category,
        description=payload.description or "",
        event_date=event_date,
        event_time=event_time,
        venue=venue,
        capacity=payload.capacity,
        fee=payload.fee,
        icon=payload.icon or "📅",
        available_seats=payload.capacity,
    )


@app.delete("/api/registrations/{registration_id}")
def cancel_registration(registration_id: int):
    """
    Stretch goal: Admin cancels a registration by id.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, event_id FROM registrations WHERE id = ?;", (registration_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Registration {registration_id} not found",
        )

    cursor.execute("DELETE FROM registrations WHERE id = ?;", (registration_id,))
    conn.commit()
    conn.close()
    return {"message": "Registration cancelled successfully", "registration_id": registration_id}


# -------------------------------------------------------------
# Static Files & Frontend Pages (Step 4)
# -------------------------------------------------------------

@app.get("/")
def serve_home():
    """Serves frontend/index.html"""
    return FileResponse(FRONTEND_DIR / "index.html")

@app.get("/admin.html")
def serve_admin():
    """Serves frontend/admin.html"""
    return FileResponse(FRONTEND_DIR / "admin.html")

# Mount js folder and entire frontend directory
app.mount("/js", StaticFiles(directory=FRONTEND_DIR / "js"), name="js")
app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
