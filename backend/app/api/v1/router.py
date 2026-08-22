from fastapi import APIRouter

from app.api.v1.endpoints import (
    activities,
    auth,
    cities,
    shares,
    stops,
    trip_activities,
    trips,
    users,
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(trips.router)
api_router.include_router(cities.router)
api_router.include_router(activities.router)
api_router.include_router(stops.router)
api_router.include_router(trip_activities.router)
api_router.include_router(shares.router)
