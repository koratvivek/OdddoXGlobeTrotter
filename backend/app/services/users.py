"""User domain service."""

from fastapi import HTTPException, status
from sqlalchemy import inspect
from sqlalchemy.orm import Session

from app.models.city import City
from app.models.saved_destination import SavedDestination
from app.models.share_like import ShareLike
from app.models.stop import Stop
from app.models.trip import Trip
from app.models.trip_activity import TripActivity
from app.models.trip_share import TripShare
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
        user_id = user.id
        table_names = set(inspect(db.bind).get_table_names())

        if "share_likes" in table_names:
            db.query(ShareLike).filter(ShareLike.user_id == user_id).delete(synchronize_session=False)

        trip_ids = [row[0] for row in db.query(Trip.id).filter(Trip.user_id == user_id).all()]
        if trip_ids:
            stop_ids = [row[0] for row in db.query(Stop.id).filter(Stop.trip_id.in_(trip_ids)).all()]
            if stop_ids:
                db.query(TripActivity).filter(TripActivity.stop_id.in_(stop_ids)).delete(
                    synchronize_session=False
                )
            db.query(Stop).filter(Stop.trip_id.in_(trip_ids)).delete(synchronize_session=False)

            if "trip_shares" in table_names:
                share_ids = [
                    row[0] for row in db.query(TripShare.id).filter(TripShare.trip_id.in_(trip_ids)).all()
                ]
                if share_ids and "share_likes" in table_names:
                    db.query(ShareLike).filter(ShareLike.share_id.in_(share_ids)).delete(
                        synchronize_session=False
                    )
                db.query(TripShare).filter(TripShare.trip_id.in_(trip_ids)).delete(synchronize_session=False)

            db.query(Trip).filter(Trip.id.in_(trip_ids)).delete(synchronize_session=False)

        if "saved_destinations" in table_names:
            db.query(SavedDestination).filter(SavedDestination.user_id == user_id).delete(
                synchronize_session=False
            )

        deleted = db.query(User).filter(User.id == user_id).delete(synchronize_session=False)
        if not deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
        db.commit()
