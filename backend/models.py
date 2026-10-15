from typing import Optional, Dict
from pydantic import BaseModel, Field, EmailStr

class EventOut(BaseModel):
    id: int
    title: str
    category: str
    description: Optional[str] = None
    event_date: str
    event_time: str
    venue: str
    capacity: int
    fee: int
    icon: Optional[str] = None
    available_seats: int

class EventDetail(BaseModel):
    id: int
    title: str
    category: str
    description: Optional[str] = None
    event_date: str
    event_time: str
    venue: str
    capacity: int
    fee: int
    icon: Optional[str] = None
    available_seats: int

class RegistrationIn(BaseModel):
    student_name: str = Field(..., description="Full name of student")
    roll_number: str = Field(..., description="Student roll number or ID")
    email: str = Field(..., description="Valid student email address")
    phone: Optional[str] = Field(None, description="Optional contact number")

class RegistrationOut(BaseModel):
    id: int
    event_id: int
    student_name: str
    registered_at: str

class RegistrationDetail(BaseModel):
    id: int
    event_id: int
    student_name: str
    roll_number: str
    email: str
    phone: Optional[str] = None
    registered_at: str
    event_title: str

class StatsOut(BaseModel):
    total_events: int
    total_registrations: int
    total_capacity: int
    overall_utilization_pct: float
    upcoming_events_count: int
    events_by_category: Dict[str, int]

# Stretch goal model for admin adding an event
class EventCreate(BaseModel):
    title: str
    category: str
    description: Optional[str] = ""
    event_date: str
    event_time: str
    venue: str
    capacity: int
    fee: int = 0
    icon: Optional[str] = "📅"
