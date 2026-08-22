"""Image upload service."""

import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

ALLOWED_CONTENT_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}
MAX_UPLOAD_BYTES = 5 * 1024 * 1024


def save_image(upload: UploadFile, upload_dir: Path) -> str:
    if upload.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported image type. Use JPEG, PNG, WebP, or GIF.",
        )

    data = upload.file.read()
    if not data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file.")
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image must be 5MB or smaller.",
        )

    upload_dir.mkdir(parents=True, exist_ok=True)
    suffix = ALLOWED_CONTENT_TYPES[upload.content_type]
    filename = f"{uuid.uuid4().hex}{suffix}"
    path = upload_dir / filename
    path.write_bytes(data)
    return f"/uploads/{filename}"
