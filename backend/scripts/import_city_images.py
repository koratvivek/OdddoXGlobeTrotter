"""Update `cities.image_url` from a cities_data.json file.

Source JSON shape (e.g. cities_data.json):
    [
      {"name": "Abu Dhabi", "country": "United Arab Emirates", "image_url": "https://..."},
      ...
    ]

Matches each entry to an existing `cities` row by (name, country) and updates its
`image_url`. Rows with no matching city in the DB are reported and skipped -- this
script only updates existing cities, it does not insert new ones.

Usage:
    python scripts/import_city_images.py --file data/cities_data.json
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.city import City


def load_records(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8") as f:
        records = json.load(f)
    print(f"Loaded {len(records)} city image records from {path}")
    return records


def apply_images(db: Session, records: list[dict]) -> None:
    existing = {
        (name, country): city_id
        for city_id, name, country in db.execute(
            select(City.id, City.name, City.country)
        ).all()
    }

    updated = 0
    not_found: list[tuple[str, str]] = []
    too_long: list[tuple[str, str, int]] = []

    for row in records:
        key = (row["name"], row["country"])
        city_id = existing.get(key)
        if city_id is None:
            not_found.append(key)
            continue
        if len(row["image_url"]) > 512:
            too_long.append((row["name"], row["country"], len(row["image_url"])))
            continue
        db.execute(
            update(City).where(City.id == city_id).values(image_url=row["image_url"])
        )
        updated += 1

    db.commit()
    print(f"Updated image_url for {updated} cities.")
    if too_long:
        print(f"{len(too_long)} cities skipped, image_url exceeds 512 chars:")
        for name, country, length in too_long:
            print(f"  - {name}, {country} ({length} chars)")
    if not_found:
        print(f"{len(not_found)} cities in the JSON had no match in the DB:")
        for name, country in not_found:
            print(f"  - {name}, {country}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--file", required=True, help="Path to the cities_data.json file")
    args = parser.parse_args()

    path = Path(args.file)
    if not path.exists():
        raise SystemExit(f"File not found: {path}")

    records = load_records(path)

    db = SessionLocal()
    try:
        apply_images(db, records)
    finally:
        db.close()


if __name__ == "__main__":
    main()
