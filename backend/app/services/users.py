"""User domain service."""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.city import City
from app.models.saved_destination import SavedDestination
from app.models.user import User
from app.schemas.saved_destination import SavedDestinationRead


class UserService:
    @staticmethod
    def get_saved_destinations(db: Session, user: User) -> list[SavedDestinationRead]:
        saved_items = (
            db.query(SavedDestination)
            .filter(SavedDestination.user_id == user.id)
            .order_by(SavedDestination.saved_at.desc())
            .all()
        )
        
        result = []
        for item in saved_items:
            result.append(
                SavedDestinationRead(
                    city_id=item.city_id,
                    city_name=item.city.name,
                    country=item.city.country,
                    image_url=item.city.image_url,
                    saved_at=item.saved_at,
                )
            )
        return result

    @staticmethod
    def save_destination(db: Session, user: User, city_id: int) -> SavedDestinationRead:
        city = db.get(City, city_id)
        if not city:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="City not found.")

        existing = (
            db.query(SavedDestination)
            .filter(SavedDestination.user_id == user.id, SavedDestination.city_id == city_id)
            .first()
        )
        
        if existing:
            return SavedDestinationRead(
                city_id=existing.city_id,
                city_name=city.name,
                country=city.country,
                image_url=city.image_url,
                saved_at=existing.saved_at,
            )

        new_saved = SavedDestination(user_id=user.id, city_id=city_id)
        db.add(new_saved)
        db.commit()
        db.refresh(new_saved)
        
        return SavedDestinationRead(
            city_id=new_saved.city_id,
            city_name=city.name,
            country=city.country,
            image_url=city.image_url,
            saved_at=new_saved.saved_at,
        )

    @staticmethod
    def unsave_destination(db: Session, user: User, city_id: int) -> None:
        db.query(SavedDestination).filter(
            SavedDestination.user_id == user.id, SavedDestination.city_id == city_id
        ).delete()
        db.commit()

    @staticmethod
    def delete_account(db: Session, user: User) -> None:
        db.delete(user)
        db.commit()
