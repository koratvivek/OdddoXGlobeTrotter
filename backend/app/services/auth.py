"""Authentication service."""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.auth import LoginRequest, SignupRequest
from app.schemas.user import UserRead, UserUpdate


class AuthService:
    @staticmethod
    def signup(db: Session, payload: SignupRequest) -> tuple[User, str]:
        existing = db.query(User).filter(User.email == payload.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered.",
            )

        full_name = f"{payload.first_name} {payload.last_name}".strip()
        user = User(
            first_name=payload.first_name,
            last_name=payload.last_name,
            name=full_name,
            email=payload.email,
            password_hash=hash_password(payload.password),
            phone=payload.phone,
            city=payload.city,
            country=payload.country,
            bio=payload.bio,
            photo=payload.photo,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        token = create_access_token(str(user.id))
        return user, token

    @staticmethod
    def login(db: Session, payload: LoginRequest) -> tuple[User, str]:
        user = db.query(User).filter(User.email == payload.email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )
        if not verify_password(payload.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )
        token = create_access_token(str(user.id))
        return user, token

    @staticmethod
    def forgot_password(_db: Session, _email: str) -> str:
        return (
            "Password reset by email is not available yet. "
            "Sign in and change it in Settings."
        )

    @staticmethod
    def change_password(db: Session, user: User, current_password: str, new_password: str) -> str:
        if not verify_password(current_password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Current password is incorrect.",
            )
        user.password_hash = hash_password(new_password)
        db.commit()
        return "Password updated."

    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> User:
        user = db.get(User, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found.",
            )
        return user

    @staticmethod
    def update_user(db: Session, user: User, payload: UserUpdate) -> User:
        data = payload.model_dump(exclude_unset=True)
        if "first_name" in data or "last_name" in data:
            first = data.get("first_name", user.first_name)
            last = data.get("last_name", user.last_name)
            data["name"] = f"{first} {last}".strip()
        for key, value in data.items():
            setattr(user, key, value)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def to_user_read(user: User) -> UserRead:
        return UserRead.model_validate(user)
