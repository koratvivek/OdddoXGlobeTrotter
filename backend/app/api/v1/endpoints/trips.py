from fastapi import APIRouter, HTTPException, status

from app.schemas.trip import TripCreate, TripRead, TripUpdate

router = APIRouter(prefix="/trips", tags=["trips"])


def _not_implemented() -> None:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Endpoint not implemented yet.",
    )


@router.get("", response_model=list[TripRead])
def list_trips() -> list[TripRead]:
    _not_implemented()


@router.post("", response_model=TripRead, status_code=status.HTTP_201_CREATED)
def create_trip(_payload: TripCreate) -> TripRead:
    _not_implemented()


@router.get("/{trip_id}", response_model=TripRead)
def get_trip(trip_id: int) -> TripRead:
    _not_implemented()


@router.patch("/{trip_id}", response_model=TripRead)
def update_trip(trip_id: int, _payload: TripUpdate) -> TripRead:
    _not_implemented()


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip(trip_id: int) -> None:
    _not_implemented()
