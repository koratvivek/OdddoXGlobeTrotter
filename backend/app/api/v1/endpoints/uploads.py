from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.upload import ImageUploadResponse
from app.services.uploads import save_image

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.post("/image", response_model=ImageUploadResponse)
def upload_image(
    file: UploadFile = File(...),
    _db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> ImageUploadResponse:
    settings = get_settings()
    url = save_image(file, settings.upload_dir_path)
    return ImageUploadResponse(url=url)
