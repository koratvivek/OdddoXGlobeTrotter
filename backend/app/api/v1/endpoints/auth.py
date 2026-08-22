from fastapi import APIRouter, HTTPException, status

from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    SignupRequest,
    TokenResponse,
)
from app.schemas.common import MessageResponse
from app.schemas.user import UserRead

router = APIRouter(prefix="/auth", tags=["auth"])


def _not_implemented() -> None:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Endpoint not implemented yet.",
    )


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(_payload: SignupRequest) -> TokenResponse:
    _not_implemented()


@router.post("/login", response_model=TokenResponse)
def login(_payload: LoginRequest) -> TokenResponse:
    _not_implemented()


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(_payload: ForgotPasswordRequest) -> MessageResponse:
    _not_implemented()


@router.get("/me", response_model=UserRead)
def get_me() -> UserRead:
    _not_implemented()
