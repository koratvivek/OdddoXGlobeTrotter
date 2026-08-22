"""Bulk-import cities and activities from a global_activities JSON dump.

Source JSON shape (e.g. global_activities_110k.json):
    {
      "total": 110000,
      "activities": [
        {
          "activity_id": "act-1-11iv95",
          "title": "Premium Mountain Hiking Guide in Jakarta",
          "description": "...",
          "price_from": 184,
          "currency": "IDR",
          "city": "Jakarta",
          "country": "Indonesia",
          "rating": 4.2,
          "image_url": "https://...",
          "booking_url": "https://..."
        },
        ...
      ]
    }

Maps onto the app schema:
    cities(id, name, country, cost_index, popularity_score, image_url)
    activities(id, city_id, name, category, cost, duration, description, image_url)

Note: the source data repeats the same activity per city under different prices
(e.g. "Premium Mountain Hiking Guide in Jakarta" appears 5x). Only the first
occurrence of each (city, title) pair is imported; later duplicates are skipped.

Caveats (source data does not carry these fields, so they are derived/defaulted):
  - `category` is parsed out of the title (the phrase between the leading adjective
    and " in <City>"), falling back to "General" if the pattern doesn't match.
  - `duration` (minutes) is guessed from keywords in the derived category, falling
    back to 120 minutes.
  - `cost` is stored as the raw `price_from` value in whatever `currency` the source
    row used -- no currency conversion is performed (the schema has no currency column).
  - City `cost_index` is derived as avg(price_from) / 20 for that city, clamped to
    [1, 10]. `popularity_score` is derived as avg(rating) * 20 (0-100 scale).

Usage:
    python scripts/import_activities.py --file data/global_activities_110k.json
    python scripts/import_activities.py --file data/global_activities_110k.json --truncate
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from sqlalchemy import delete, insert, select
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.activity import Activity
from app.models.city import City

DURATION_KEYWORDS: list[tuple[str, int]] = [
    ("bus", 480),
    ("safari", 360),
    ("cruise", 240),
    ("guide", 240),
    ("tour", 180),
    ("experience", 150),
    ("class", 120),
    ("show", 120),
    ("walk", 120),
    ("ticket", 60),
]
DEFAULT_DURATION = 120
DEFAULT_CATEGORY = "General"

TITLE_RE_CACHE: dict[str, re.Pattern[str]] = {}


def extract_category(title: str, city: str) -> str:
    pattern = TITLE_RE_CACHE.get(city)
    if pattern is None:
        pattern = re.compile(rf"^\s*\S+\s+(.+?)\s+in\s+{re.escape(city)}\s*$", re.IGNORECASE)
        TITLE_RE_CACHE[city] = pattern
    match = pattern.match(title)
    if match:
        return match.group(1).strip()
    return DEFAULT_CATEGORY


def guess_duration(category: str) -> int:
    lowered = category.lower()
    for keyword, minutes in DURATION_KEYWORDS:
        if keyword in lowered:
            return minutes
    return DEFAULT_DURATION


def load_records(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    records = data["activities"] if isinstance(data, dict) else data
    print(f"Loaded {len(records)} activity records from {path}")
    return records


def build_city_aggregates(records: list[dict]) -> dict[tuple[str, str], dict]:
    aggregates: dict[tuple[str, str], dict] = {}
    for row in records:
        key = (row["city"], row["country"])
        agg = aggregates.setdefault(
            key, {"price_sum": 0.0, "rating_sum": 0.0, "count": 0}
        )
        agg["price_sum"] += float(row.get("price_from") or 0)
        agg["rating_sum"] += float(row.get("rating") or 0)
        agg["count"] += 1
    return aggregates


def upsert_cities(
    db: Session, aggregates: dict[tuple[str, str], dict]
) -> dict[tuple[str, str], int]:
    existing = {
        (name, country): city_id
        for city_id, name, country in db.execute(
            select(City.id, City.name, City.country)
        ).all()
    }

    to_insert = []
    for (name, country), agg in aggregates.items():
        if (name, country) in existing:
            continue
        avg_price = agg["price_sum"] / agg["count"]
        avg_rating = agg["rating_sum"] / agg["count"]
        cost_index = round(min(max(avg_price / 20, 1), 10), 2)
        popularity_score = round(min(max(avg_rating * 20, 0), 100))
        to_insert.append(
            {
                "name": name,
                "country": country,
                "cost_index": cost_index,
                "popularity_score": popularity_score,
            }
        )

    if to_insert:
        db.execute(insert(City), to_insert)
        db.commit()
        print(f"Inserted {len(to_insert)} new cities.")
    else:
        print("No new cities to insert.")

    return {
        (name, country): city_id
        for city_id, name, country in db.execute(
            select(City.id, City.name, City.country)
        ).all()
    }


def import_activities(
    db: Session, records: list[dict], city_ids: dict[tuple[str, str], int], batch_size: int
) -> None:
    batch: list[dict] = []
    total_inserted = 0
    total_skipped = 0
    seen: set[tuple[str, str]] = set()

    for row in records:
        city_key = (row["city"], row["country"])
        city_id = city_ids.get(city_key)
        if city_id is None:
            continue  # shouldn't happen, city aggregates cover every row

        dedupe_key = (row["city"], row["title"])
        if dedupe_key in seen:
            total_skipped += 1
            continue
        seen.add(dedupe_key)

        category = extract_category(row["title"], row["city"])
        batch.append(
            {
                "city_id": city_id,
                "name": row["title"],
                "category": category,
                "cost": row.get("price_from") or 0,
                "duration": guess_duration(category),
                "description": row.get("description"),
                "image_url": row.get("image_url"),
            }
        )

        if len(batch) >= batch_size:
            db.execute(insert(Activity), batch)
            db.commit()
            total_inserted += len(batch)
            print(f"  ...{total_inserted} activities inserted")
            batch.clear()

    if batch:
        db.execute(insert(Activity), batch)
        db.commit()
        total_inserted += len(batch)

    print(f"Inserted {total_inserted} activities total ({total_skipped} duplicates skipped).")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--file", required=True, help="Path to the activities JSON file")
    parser.add_argument("--batch-size", type=int, default=2000)
    parser.add_argument(
        "--truncate",
        action="store_true",
        help="Delete all existing activities and cities before importing",
    )
    args = parser.parse_args()

    path = Path(args.file)
    if not path.exists():
        raise SystemExit(f"File not found: {path}")

    records = load_records(path)

    db = SessionLocal()
    try:
        if args.truncate:
            confirm = input(
                "This will DELETE all existing activities and cities. Type 'yes' to continue: "
            )
            if confirm.strip().lower() != "yes":
                raise SystemExit("Aborted.")
            db.execute(delete(Activity))
            db.execute(delete(City))
            db.commit()
            print("Truncated activities and cities.")

        aggregates = build_city_aggregates(records)
        city_ids = upsert_cities(db, aggregates)
        import_activities(db, records, city_ids, args.batch_size)
    finally:
        db.close()


if __name__ == "__main__":
    main()
