from fastapi import APIRouter, HTTPException, status

from app.schemas.user import UserRead, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


def _not_implemented() -> None:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Endpoint not implemented yet.",
    )


@router.get("/me", response_model=UserRead)
def get_profile() -> UserRead:
    _not_implemented()


@router.patch("/me", response_model=UserRead)
def update_profile(_payload: UserUpdate) -> UserRead:
    _not_implemented()
