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
from app.models.stop import Stop
from app.models.trip import Trip
from app.models.trip_share import TripShare
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
    ("Paris", "Eiffel Tower Summit Visit", "Sightseeing", 32, 150, "Skip-the-line lift to the summit for panoramic city views."),
    ("Paris", "Louvre Museum Tour", "Culture", 45, 180, "Guided highlights tour through the world's largest art museum."),
    ("Paris", "Seine Sunset Cruise", "Relax", 22, 60, "One-hour river cruise past Notre-Dame and the Musée d'Orsay."),
    ("Paris", "Montmartre Walking Tour", "Sightseeing", 18, 120, "Artist squares, Sacré-Cœur and hidden vineyard lanes."),
    ("Tokyo", "Tsukiji Food Tour", "Food", 65, 180, "Ten tastings across the outer market with a local guide."),
    ("Tokyo", "TeamLab Digital Art", "Culture", 28, 120, "Immersive light installations in Toyosu."),
    ("Tokyo", "Mount Takao Day Hike", "Adventure", 15, 360, "Forest trail with Fuji views an hour from Shinjuku."),
    ("Tokyo", "Golden Gai Bar Crawl", "Nightlife", 50, 180, "Tiny bars and izakaya in Shinjuku's alleyways."),
    ("Rome", "Colosseum & Forum Tour", "Culture", 58, 180, "Arena floor access with an archaeologist guide."),
    ("Rome", "Trastevere Pasta Class", "Food", 75, 210, "Hands-on cooking class making fresh pasta and tiramisu."),
    ("Rome", "Vatican Museums Early Access", "Culture", 68, 180, "Sistine Chapel before the crowds arrive."),
    ("Bali", "Ubud Rice Terrace Walk", "Sightseeing", 20, 180, "Morning walk through Tegallalang with a local farmer."),
    ("Bali", "Balinese Cooking Class", "Food", 35, 240, "Market visit plus a six-dish traditional lunch."),
    ("Bali", "Uluwatu Beach Day", "Relax", 25, 300, "Cliff-side beaches, surf lesson optional."),
    ("New York City", "Brooklyn Bridge Sunrise Walk", "Sightseeing", 0, 90, "Cross into Dumbo before the city wakes up."),
    ("New York City", "MoMA Visit", "Culture", 30, 150, "Modern masterpieces in Midtown."),
    ("New York City", "Harlem Jazz Night", "Nightlife", 55, 180, "Live sets at a historic Harlem club."),
    ("Barcelona", "Sagrada Família Tour", "Culture", 40, 120, "Gaudí's basilica with tower access."),
    ("Barcelona", "Tapas & Vermouth Crawl", "Food", 60, 180, "Five stops through El Born and Gothic Quarter."),
    ("Barcelona", "Montjuïc Sunset Cable Car", "Relax", 16, 120, "Harbour views from the hillside gardens."),
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

    for city_name, name, category, cost, duration, description in ACTIVITIES:
        city = city_map[city_name]
        existing = (
            db.query(Activity)
            .filter(Activity.city_id == city.id, Activity.name == name)
            .first()
        )
        if not existing:
            db.add(
                Activity(
                    city_id=city.id,
                    name=name,
                    category=category,
                    cost=cost,
                    duration=duration,
                    description=description,
                )
            )
        else:
            existing.category = category
            existing.cost = cost
            existing.duration = duration
            existing.description = description

    trip = db.query(Trip).filter(Trip.user_id == user.id, Trip.name == "European Summer").first()
    if not trip:
        start = date.today() + timedelta(days=30)
        end = start + timedelta(days=14)
        paris = city_map.get("Paris")
        rome = city_map.get("Rome")
        trip = Trip(
            user_id=user.id,
            name="European Summer",
            start_date=start,
            end_date=end,
            description="Paris and Rome highlights.",
            cover_photo=paris.image_url if paris else None,
            is_public=False,
            budget_cap=3500,
        )
        db.add(trip)
        db.flush()

        if paris:
            db.add(
                Stop(
                    trip_id=trip.id,
                    city_id=paris.id,
                    start_date=start,
                    end_date=start + timedelta(days=6),
                    order_index=0,
                )
            )
        if rome:
            db.add(
                Stop(
                    trip_id=trip.id,
                    city_id=rome.id,
                    start_date=start + timedelta(days=7),
                    end_date=end,
                    order_index=1,
                )
            )

    share = (
        db.query(TripShare)
        .filter(TripShare.trip_id == trip.id)
        .first()
    )
    if not share:
        trip.is_public = True
        db.add(TripShare(trip_id=trip.id, public_slug="eurosum24"))

    db.commit()
    print("Seed complete.")


if __name__ == "__main__":
    session = SessionLocal()
    try:
        seed(session)
    finally:
        session.close()
