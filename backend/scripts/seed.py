"""Database seed script for Phase 1."""

import sys
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.activity import Activity
from app.models.city import City
from app.models.trip import Trip
from app.models.user import User

CITIES = [
    {
        "name": "Paris",
        "country": "France",
        "cost_index": 4.0,
        "popularity_score": 96,
        "image_url": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80",
    },
    {
        "name": "Tokyo",
        "country": "Japan",
        "cost_index": 4.0,
        "popularity_score": 94,
        "image_url": "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80",
    },
    {
        "name": "Rome",
        "country": "Italy",
        "cost_index": 3.0,
        "popularity_score": 91,
        "image_url": "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80",
    },
    {
        "name": "Bali",
        "country": "Indonesia",
        "cost_index": 2.0,
        "popularity_score": 89,
        "image_url": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80",
    },
    {
        "name": "New York City",
        "country": "USA",
        "cost_index": 5.0,
        "popularity_score": 93,
        "image_url": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
    },
    {
        "name": "Barcelona",
        "country": "Spain",
        "cost_index": 3.0,
        "popularity_score": 90,
        "image_url": "https://images.unsplash.com/photo-1583422409516-2895a77aecf9?w=800&q=80",
    },
]

ACTIVITIES = [
    ("Paris", "Eiffel Tower Summit Visit", "Sightseeing", 32, 150),
    ("Paris", "Louvre Museum Tour", "Culture", 45, 180),
    ("Tokyo", "Tsukiji Food Tour", "Food", 65, 180),
    ("Tokyo", "TeamLab Digital Art", "Culture", 28, 120),
    ("Rome", "Colosseum & Forum Tour", "Culture", 58, 180),
    ("Bali", "Ubud Rice Terrace Walk", "Sightseeing", 20, 180),
]


def seed(db: Session) -> None:
    user = db.query(User).filter(User.email == "alex@globetrotter.app").first()
    if not user:
        user = User(
            first_name="Alex",
            last_name="Rivera",
            name="Alex Rivera",
            email="alex@globetrotter.app",
            password_hash=hash_password("globetrotter"),
            phone="+1 415 555 0132",
            city="San Francisco",
            country="USA",
            bio="Weekend hiker, full-time trip planner. 24 countries and counting.",
            is_admin=True,
        )
        db.add(user)
        db.flush()

    city_map: dict[str, City] = {}
    for data in CITIES:
        city = db.query(City).filter(City.name == data["name"]).first()
        if not city:
            city = City(**data)
            db.add(city)
            db.flush()
        else:
            for key, value in data.items():
                setattr(city, key, value)
        city_map[city.name] = city

    for city_name, name, category, cost, duration in ACTIVITIES:
        city = city_map[city_name]
        exists = (
            db.query(Activity)
            .filter(Activity.city_id == city.id, Activity.name == name)
            .first()
        )
        if not exists:
            db.add(
                Activity(
                    city_id=city.id,
                    name=name,
                    category=category,
                    cost=cost,
                    duration=duration,
                )
            )

    trip = db.query(Trip).filter(Trip.user_id == user.id, Trip.name == "European Summer").first()
    if not trip:
        start = date.today() + timedelta(days=30)
        end = start + timedelta(days=14)
        paris = city_map.get("Paris")
        db.add(
            Trip(
                user_id=user.id,
                name="European Summer",
                start_date=start,
                end_date=end,
                description="Paris and Rome highlights.",
                cover_photo=paris.image_url if paris else None,
                is_public=False,
                budget_cap=3500,
            )
        )

    db.commit()
    print("Seed complete.")


if __name__ == "__main__":
    session = SessionLocal()
    try:
        seed(session)
    finally:
        session.close()
