from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.saved_destination import SavedDestinationCreate, SavedDestinationRead
from app.schemas.user import UserRead, UserUpdate
from app.services.auth import AuthService
from app.services.users import UserService

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead)
def get_profile(current_user: User = Depends(get_current_user)) -> UserRead:
    return AuthService.to_user_read(current_user)


@router.patch("/me", response_model=UserRead)
def update_profile(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserRead:
    user = AuthService.update_user(db, current_user, payload)
    return AuthService.to_user_read(user)


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    UserService.delete_account(db, current_user)


@router.get("/me/saved-destinations", response_model=list[SavedDestinationRead])
def get_saved_destinations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[SavedDestinationRead]:
    return UserService.get_saved_destinations(db, current_user)


@router.post("/me/saved-destinations", response_model=SavedDestinationRead)
def save_destination(
    payload: SavedDestinationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SavedDestinationRead:
    return UserService.save_destination(db, current_user, payload.city_id)


@router.delete("/me/saved-destinations/{city_id}", status_code=status.HTTP_204_NO_CONTENT)
def unsave_destination(
    city_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    UserService.unsave_destination(db, current_user, city_id)
