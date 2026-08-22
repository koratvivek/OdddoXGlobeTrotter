"""Fetch a real representative image per city from Wikipedia and update cities_data.json.

Problem: data/cities_data.json has many entries pointing at a generic
"Placeholder_view.jpg" (not a real photo of the city), and 6 cities used by the
activities dataset aren't in the file at all.

This script queries the Wikipedia REST API summary endpoint
(https://en.wikipedia.org/api/rest_v1/page/summary/{title}) for each city that
needs a real image, pulls its lead image, and rewrites the URL to the same
1280px Wikimedia Commons thumbnail format the good entries already use:
    https://upload.wikimedia.org/wikipedia/commons/thumb/<hash>/<file>/1280px-<file>?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail

Lookup strategy per city, in order, first one with a usable thumbnail wins:
    1. "{City}"
    2. "{City}, {Country}"
    3. "{City} (city)"

Usage:
    # only fix placeholder/missing entries (default)
    python scripts/fetch_city_images.py

    # re-fetch every city, including ones that already look fine
    python scripts/fetch_city_images.py --all
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parents[1] / "data"
CITIES_FILE = DATA_DIR / "cities_data.json"
ACTIVITIES_FILE = DATA_DIR / "global_activities_110k.json"

USER_AGENT = "GlobeTrotterApp/1.0 (hackathon project; contact: n/a)"
PLACEHOLDER_MARKER = "Placeholder_view"
REQUEST_DELAY_SECONDS = 0.15

THUMB_FILENAME_RE = re.compile(r"^\d+px-(.+)$")


MAX_IMAGE_URL_LENGTH = 512  # matches cities.image_url VARCHAR(512)


def to_1280_thumbnail(source_url: str) -> str:
    """Rewrite a Wikimedia thumb URL of any width to the 1280px variant.

    No tracking query string is appended -- it's not needed for the image to load,
    and percent-encoded non-Latin filenames (e.g. Thai/Chinese titles) can already
    push the bare URL close to the DB column's length limit.
    """
    parsed = urllib.parse.urlsplit(source_url)
    parts = parsed.path.split("/")
    filename = parts[-1]
    match = THUMB_FILENAME_RE.match(filename)
    if match:
        parts[-1] = f"1280px-{match.group(1)}"
    new_path = "/".join(parts)
    url = urllib.parse.urlunsplit((parsed.scheme, parsed.netloc, new_path, "", ""))

    if len(url) > MAX_IMAGE_URL_LENGTH:
        # fall back to a smaller thumbnail width to bring the URL under the limit
        for width in (640, 320):
            parts[-1] = f"{width}px-{match.group(1)}" if match else filename
            candidate = urllib.parse.urlunsplit(
                (parsed.scheme, parsed.netloc, "/".join(parts), "", "")
            )
            if len(candidate) <= MAX_IMAGE_URL_LENGTH:
                return candidate
    return url


def fetch_summary(title: str, retries: int = 3) -> dict | None:
    url = "https://en.wikipedia.org/api/rest_v1/page/summary/" + urllib.parse.quote(title)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                return json.load(resp)
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            time.sleep(0.5 * (attempt + 1))
        except urllib.error.URLError:
            time.sleep(0.5 * (attempt + 1))
    return None


def find_image(city: str, country: str) -> str | None:
    candidates = [
        city,
        f"{city}, {country}",
        f"{city} (city)",
        f"{city} City",
        f"{city} Ancient Town",
    ]
    for title in candidates:
        data = fetch_summary(title)
        time.sleep(REQUEST_DELAY_SECONDS)
        if not data:
            continue
        if data.get("type") == "disambiguation":
            continue
        thumb = data.get("originalimage") or data.get("thumbnail")
        if thumb and thumb.get("source"):
            return to_1280_thumbnail(thumb["source"])
    return None


def load_json(path: Path):
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def save_json(path: Path, data) -> None:
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def all_target_cities() -> list[tuple[str, str]]:
    activities = load_json(ACTIVITIES_FILE)
    records = activities["activities"] if isinstance(activities, dict) else activities
    seen: list[tuple[str, str]] = []
    seen_set = set()
    for row in records:
        key = (row["city"], row["country"])
        if key not in seen_set:
            seen_set.add(key)
            seen.append(key)
    return seen


def needs_fetch(entry: dict | None, refetch_all: bool) -> bool:
    if entry is None:
        return True
    if refetch_all:
        return True
    return PLACEHOLDER_MARKER in entry.get("image_url", "")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--all",
        action="store_true",
        help="Re-fetch every city, not just placeholders/missing entries",
    )
    args = parser.parse_args()

    cities_data = load_json(CITIES_FILE) if CITIES_FILE.exists() else []
    by_key = {(c["name"], c["country"]): c for c in cities_data}

    targets = all_target_cities()
    to_process = [(city, country) for city, country in targets if needs_fetch(by_key.get((city, country)), args.all)]

    print(f"{len(targets)} total cities, {len(to_process)} need a fetched image.")

    updated = 0
    failed: list[tuple[str, str]] = []

    for city, country in to_process:
        image_url = find_image(city, country)
        if image_url is None:
            failed.append((city, country))
            print(f"  [FAIL] {city}, {country} -- no usable Wikipedia image found")
            continue

        entry = by_key.get((city, country))
        if entry is None:
            entry = {"name": city, "country": country, "image_url": image_url}
            cities_data.append(entry)
            by_key[(city, country)] = entry
        else:
            entry["image_url"] = image_url
        updated += 1
        print(f"  [OK]   {city}, {country}")

    save_json(CITIES_FILE, cities_data)
    print(f"\nUpdated {updated} cities. {len(failed)} failed lookups.")
    if failed:
        print("Failed (left as-is, review manually):")
        for city, country in failed:
            print(f"  - {city}, {country}")


if __name__ == "__main__":
    main()
