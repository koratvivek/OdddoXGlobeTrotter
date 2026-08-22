from fastapi import APIRouter, HTTPException, status

from app.schemas.trip_activity import (
    TripActivityCreate,
    TripActivityRead,
    TripActivityUpdate,
)

router = APIRouter(prefix="/trip-activities", tags=["trip-activities"])


def _not_implemented() -> None:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Endpoint not implemented yet.",
    )


@router.get("", response_model=list[TripActivityRead])
def list_trip_activities(stop_id: int | None = None) -> list[TripActivityRead]:
    _not_implemented()


@router.post("", response_model=TripActivityRead, status_code=status.HTTP_201_CREATED)
def create_trip_activity(_payload: TripActivityCreate) -> TripActivityRead:
    _not_implemented()


@router.get("/{trip_activity_id}", response_model=TripActivityRead)
def get_trip_activity(trip_activity_id: int) -> TripActivityRead:
    _not_implemented()


@router.patch("/{trip_activity_id}", response_model=TripActivityRead)
def update_trip_activity(
    trip_activity_id: int, _payload: TripActivityUpdate
) -> TripActivityRead:
    _not_implemented()


@router.delete("/{trip_activity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip_activity(trip_activity_id: int) -> None:
    _not_implemented()
