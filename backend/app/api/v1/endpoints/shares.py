from fastapi import APIRouter, HTTPException, status

from app.schemas.trip_share import TripShareCreate, TripShareRead

router = APIRouter(prefix="/shares", tags=["shares"])


def _not_implemented() -> None:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Endpoint not implemented yet.",
    )


@router.get("/public/{slug}", response_model=TripShareRead)
def get_share_by_slug(slug: str) -> TripShareRead:
    _not_implemented()


@router.post("", response_model=TripShareRead, status_code=status.HTTP_201_CREATED)
def create_share(_payload: TripShareCreate) -> TripShareRead:
    _not_implemented()


@router.delete("/{share_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_share(share_id: int) -> None:
    _not_implemented()
