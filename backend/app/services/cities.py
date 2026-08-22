"""City service."""

from sqlalchemy.orm import Session

from app.models.city import City
from app.schemas.city import CityRead
from app.schemas.common import PaginatedResponse, paginate


class CityService:
    @staticmethod
    def list_cities(
        db: Session,
        page: int,
        page_size: int,
        q: str | None = None,
    ) -> PaginatedResponse[CityRead]:
        query = db.query(City)

        if q:
            like = f"%{q}%"
            query = query.filter(
                (City.name.ilike(like)) | (City.country.ilike(like))
            )

        query = query.order_by(City.popularity_score.desc(), City.name.asc())
        items, total, total_pages = paginate(query, page, page_size)
        return PaginatedResponse(
            items=[CityRead.model_validate(c) for c in items],
            page=page,
            page_size=page_size,
            total=total,
            total_pages=total_pages,
        )

    @staticmethod
    def get_city(db: Session, city_id: int) -> CityRead | None:
        city = db.get(City, city_id)
        if not city:
            return None
        return CityRead.model_validate(city)
