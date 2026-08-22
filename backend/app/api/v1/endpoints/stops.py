from fastapi import APIRouter, HTTPException, status

from app.schemas.stop import StopCreate, StopRead, StopUpdate

router = APIRouter(prefix="/stops", tags=["stops"])


def _not_implemented() -> None:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Endpoint not implemented yet.",
    )


@router.get("", response_model=list[StopRead])
def list_stops(trip_id: int | None = None) -> list[StopRead]:
    _not_implemented()


@router.post("", response_model=StopRead, status_code=status.HTTP_201_CREATED)
def create_stop(_payload: StopCreate) -> StopRead:
    _not_implemented()


@router.get("/{stop_id}", response_model=StopRead)
def get_stop(stop_id: int) -> StopRead:
    _not_implemented()


@router.patch("/{stop_id}", response_model=StopRead)
def update_stop(stop_id: int, _payload: StopUpdate) -> StopRead:
    _not_implemented()


@router.delete("/{stop_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_stop(stop_id: int) -> None:
    _not_implemented()
