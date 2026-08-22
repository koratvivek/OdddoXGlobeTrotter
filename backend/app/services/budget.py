from decimal import Decimal
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.stop import Stop
from app.models.trip import Trip
from app.models.trip_activity import TripActivity
from app.models.user import User
from app.schemas.trip import TripBudgetCategoryDetails, TripBudgetResponse

class BudgetService:
    @staticmethod
    def _calculate_from_trip(trip: Trip) -> TripBudgetResponse:
        # Activities
        activities_total = Decimal("0.00")
        for stop in trip.stops:
            for ta in stop.trip_activities:
                if ta.cost_override is not None:
                    activities_total += ta.cost_override
                elif ta.activity and ta.activity.cost:
                    activities_total += ta.activity.cost

        # Accommodation (cost_index * nights)
        accommodation_total = Decimal("0.00")
        for stop in trip.stops:
            if stop.city and stop.city.cost_index:
                nights = (stop.end_date - stop.start_date).days
                nights = max(0, nights)
                accommodation_total += stop.city.cost_index * nights

        # Transport ($100 per stop)
        transport_total = Decimal("100.00") * len(trip.stops)

        # Meals ($50 per day)
        trip_duration = (trip.end_date - trip.start_date).days
        trip_duration_days = max(1, trip_duration)  # Same-day trip counts as 1 day
        meals_total = Decimal("50.00") * trip_duration_days

        # Other
        other_total = Decimal("0.00")

        total_cost = (
            activities_total
            + accommodation_total
            + transport_total
            + meals_total
            + other_total
        )

        remaining_budget = None
        is_over_budget = False
        if trip.budget_cap is not None:
            remaining_budget = trip.budget_cap - total_cost
            if remaining_budget < 0:
                is_over_budget = True

        average_cost_per_day = total_cost / trip_duration_days

        return TripBudgetResponse(
            trip_id=trip.id,
            budget_cap=trip.budget_cap,
            categories=TripBudgetCategoryDetails(
                transport=transport_total,
                accommodation=accommodation_total,
                activities=activities_total,
                meals=meals_total,
                other=other_total,
            ),
            total_cost=total_cost,
            remaining_budget=remaining_budget,
            is_over_budget=is_over_budget,
            average_cost_per_day=average_cost_per_day,
        )

    @staticmethod
    def calculate_trip_cost(db: Session, trip_id: int, user: User) -> TripBudgetResponse:
        trip = (
            db.query(Trip)
            .options(
                joinedload(Trip.stops).joinedload(Stop.city),
                joinedload(Trip.stops).joinedload(Stop.trip_activities).joinedload(TripActivity.activity)
            )
            .filter(Trip.id == trip_id, Trip.user_id == user.id)
            .first()
        )

        if not trip:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found.")

        return BudgetService._calculate_from_trip(trip)

    @staticmethod
    def calculate_trip_cost_public(db: Session, trip_id: int) -> TripBudgetResponse:
        trip = (
            db.query(Trip)
            .options(
                joinedload(Trip.stops).joinedload(Stop.city),
                joinedload(Trip.stops).joinedload(Stop.trip_activities).joinedload(TripActivity.activity)
            )
            .filter(Trip.id == trip_id, Trip.is_public.is_(True))
            .first()
        )

        if not trip:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found.")

        return BudgetService._calculate_from_trip(trip)
