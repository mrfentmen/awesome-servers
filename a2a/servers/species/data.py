"""Read-only client for iNaturalist's public observation endpoint.

Endpoints (keyless, all verified live on 2026-09-29):

  - /observations?taxon_name=Danaus plexippus&per_page=1
        HTTP 200, `total_results` 551,871, one row returned.
  - /observations?...&quality_grade=research
        HTTP 200, `total_results` 527,019 - the confirmed grade really is a
        smaller set, so the grade is kept on every row rather than flattened.
  - /observations?lat=40.7128&lng=-74.0060&radius=5
        HTTP 200, `total_results` 256,646 - a point and radius do work.
  - /taxa?q=monarch butterfly
        HTTP 200, 2 taxa: Danaus plexippus (species, 551,385 observations) and
        Danaus plexippus plexippus (subspecies, 17,873).
  - /observations?taxon_name=zzzznotathing
        HTTP 200 with `total_results` 0 and no `errors` key. A name nobody has
        recorded is an empty result, not a failure, and is reported as such.

Two things this reader refuses to hide. **A grade is not a label of the same
thing.** `research` is community-confirmed to species level; `needs_id` is a
sighting waiting for identifiers, and treating the two as one count would
overstate every number on this server. So every row carries its grade and the
counts can be asked for either. And **the coordinates are not always where the
thing was.** iNaturalist obscures the position of a protected taxon and hands
back a point somewhere inside a cell, so a row's location is reported with
whether it was obscured, and no distance is computed from one.
"""

from __future__ import annotations

import re

from a2a_kit import JsonApiClient, UpstreamError, utc_now_iso

BASE_URL = "https://api.inaturalist.org/v1"

DATASET = "api.inaturalist.org/v1/observations"
PRODUCT = "iNaturalist observation records (public, community-graded)"

#: The observation endpoint carries the same taxon key as /taxa, so a lookup
#: and a count agree about what was asked for.
OBSERVATIONS_PATH = "/observations"
TAXA_PATH = "/taxa"

#: iNaturalist accepts a point and a radius in km. A wider radius is not a
#: different answer, it is a bigger page, so the cap is small and stated.
MAX_RADIUS_KM = 25
MAX_LIMIT = 50

#: The two grades this server will ask for by name. Anything else is refused
#: rather than passed through, because iNaturalist accepts unknown values and
#: silently ignores them.
QUALITY_GRADES = ("research", "needs_id", "casual")

#: Metro centres, so a place name works without coordinates. These are editorial
#: conveniences: the answer always says which point it used.
CITY_POINTS = {
    "amsterdam": (52.37, 4.90), "atlanta": (33.75, -84.39), "austin": (30.27, -97.74),
    "bangalore": (12.97, 77.59), "bangkok": (13.76, 100.50), "berlin": (52.52, 13.40),
    "boston": (42.36, -71.06), "brisbane": (-27.47, 153.03), "buenos aires": (-34.60, -58.38),
    "cairo": (30.04, 31.24), "cape town": (-33.92, 18.42), "chicago": (41.88, -87.63),
    "delhi": (28.61, 77.21), "denver": (39.74, -104.99), "dubai": (25.20, 55.27),
    "dublin": (53.35, -6.26), "hong kong": (22.32, 114.17), "honolulu": (21.31, -157.86),
    "istanbul": (41.01, 28.98), "johannesburg": (-26.20, 28.05), "lima": (-12.05, -77.04),
    "lisbon": (38.72, -9.14), "london": (51.51, -0.13), "los angeles": (34.05, -118.24),
    "madrid": (40.42, -3.70), "melbourne": (-37.81, 144.96), "mexico city": (19.43, -99.13),
    "miami": (25.76, -80.19), "montreal": (45.50, -73.57), "mumbai": (19.08, 72.88),
    "nairobi": (-1.29, 36.82), "new york": (40.71, -74.01), "paris": (48.86, 2.35),
    "portland": (45.52, -122.68), "reykjavik": (64.15, -21.94), "san francisco": (37.77, -122.42),
    "santiago": (-33.45, -70.67), "sao paulo": (-23.55, -46.63), "seattle": (47.61, -122.33),
    "seoul": (37.57, 126.98), "singapore": (1.35, 103.82), "stockholm": (59.33, 18.07),
    "sydney": (-33.87, 151.21), "tokyo": (35.68, 139.69), "toronto": (43.65, -79.38),
    "vancouver": (49.28, -123.12), "zurich": (47.38, 8.54),
}

_POINT_RE = re.compile(r"\b(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\b")
_TAXON_RE = re.compile(r"^[A-Za-z][A-Za-z0-9 .'\-×]{1,80}$")

__all__ = [
    "BASE_URL",
    "CITY_POINTS",
    "DATASET",
    "MAX_LIMIT",
    "MAX_RADIUS_KM",
    "OBSERVATIONS_PATH",
    "PRODUCT",
    "QUALITY_GRADES",
    "SpeciesClient",
    "TAXA_PATH",
    "UpstreamError",
    "place_from_text",
    "point_from_place",
]


def point_from_place(place) -> str | None:
    """A named metro as `lat,lon`, or None when the name is not one of ours."""
    lowered = str(place or "").strip().lower()
    if not lowered:
        return None
    for name in sorted(CITY_POINTS, key=len, reverse=True):
        if lowered == name or lowered.endswith(f" {name}") or lowered.startswith(f"{name} "):
            latitude, longitude = CITY_POINTS[name]
            return f"{latitude},{longitude}"
    return None


def place_from_text(text: str) -> str | None:
    """The metro named in a sentence, honouring word boundaries.

    Longest name first, so "mexico city" is not read as "mexico" and "san
    francisco" is not read as "francisco".
    """
    lowered = re.sub(r"[^a-z ]+", " ", str(text or "").lower())
    lowered = re.sub(r"\s+", " ", lowered).strip()
    if not lowered:
        return None
    for name in sorted(CITY_POINTS, key=len, reverse=True):
        if re.search(rf"\b{re.escape(name)}\b", lowered):
            return name
    return None


class SpeciesClient(JsonApiClient):
    """iNaturalist observations, read with the grade kept on every row."""

    env_prefix = "SPECIES"
    base_url = BASE_URL

    # -- validation --------------------------------------------------------

    @staticmethod
    def check_taxon(value) -> str:
        taxon = " ".join(str(value or "").strip().split())
        if not _TAXON_RE.match(taxon):
            raise ValueError("a taxon is a name like 'monarch butterfly' or 'Danaus plexippus'")
        return taxon

    @staticmethod
    def check_quality(value) -> str | None:
        """One of the published grades, or None for every grade."""
        if value in (None, "", "any", "all"):
            return None
        wanted = str(value).strip().lower()
        if wanted not in QUALITY_GRADES:
            raise ValueError(f"grade must be one of: {', '.join(QUALITY_GRADES)}, or any")
        return wanted

    @staticmethod
    def check_radius(value) -> int:
        try:
            radius = int(value)
        except (TypeError, ValueError):
            raise ValueError("radius must be a whole number of kilometres") from None
        if not 1 <= radius <= MAX_RADIUS_KM:
            raise ValueError(f"radius must be between 1 and {MAX_RADIUS_KM} km")
        return radius

    @staticmethod
    def check_limit(value) -> int:
        try:
            limit = int(value)
        except (TypeError, ValueError):
            raise ValueError("limit must be a whole number") from None
        if not 1 <= limit <= MAX_LIMIT:
            raise ValueError(f"limit must be between 1 and {MAX_LIMIT}")
        return limit

    @staticmethod
    def check_point(value) -> str:
        match = _POINT_RE.search(str(value or ""))
        if not match:
            raise ValueError(
                "a point is 'lat,lon' (40.71,-74.01) or a metro name this server knows"
            )
        latitude, longitude = float(match.group(1)), float(match.group(2))
        if not -90 <= latitude <= 90 or not -180 <= longitude <= 180:
            raise ValueError("latitude must be -90..90 and longitude -180..180")
        return f"{round(latitude, 4)},{round(longitude, 4)}"

    # -- shaping -----------------------------------------------------------

    @staticmethod
    def _row(result: dict) -> dict:
        taxon = result.get("taxon") or {}
        user = result.get("user") or {}
        # iNaturalist obscures the position of a protected taxon and returns a
        # point somewhere inside a cell instead. A row says which it is, so no
        # answer can quietly treat an obscured point as the real place.
        geoprivacy = result.get("geoprivacy") or result.get("taxon_geoprivacy")
        obscured = bool(result.get("obscured")) or geoprivacy == "obscured"
        return {
            "id": result.get("id"),
            "taxon": taxon.get("name"),
            "common_name": taxon.get("preferred_common_name"),
            "observed_on": result.get("observed_on") or result.get("created_at"),
            "place": result.get("place_guess"),
            "observer": user.get("login"),
            "quality_grade": result.get("quality_grade"),
            "identified": bool(result.get("identifications_count")),
            "coordinates_obscured": obscured,
            "uri": result.get("uri"),
            "dataset": DATASET,
        }

    @staticmethod
    def _split(payload) -> tuple[int, list[dict]]:
        if not isinstance(payload, dict):
            raise UpstreamError("iNaturalist returned an unexpected payload")
        if isinstance(payload.get("errors"), list) and payload["errors"]:
            detail = payload["errors"][0]
            if isinstance(detail, dict):
                detail = detail.get("message") or detail.get("error") or detail
            raise UpstreamError(f"iNaturalist refused the request: {detail}")
        results = payload.get("results")
        if not isinstance(results, list):
            raise UpstreamError("iNaturalist returned an unexpected payload (no results list)")
        total = payload.get("total_results")
        if not isinstance(total, int):
            raise UpstreamError("iNaturalist returned an unexpected payload (no total_results)")
        return total, results

    def _observations(self, params: dict, ttl: float | None = None) -> tuple[int, list[dict]]:
        return self._split(self.get_json(OBSERVATIONS_PATH, params, ttl=ttl))

    # -- reads -------------------------------------------------------------

    def count(self, taxon: str, quality: str | None = None) -> dict:
        """How many observations carry this name, and one row as a sample."""
        name = self.check_taxon(taxon)
        grade = self.check_quality(quality)
        params = {"taxon_name": name, "per_page": 1, "order": "desc", "order_by": "observed_on"}
        if grade:
            params["quality_grade"] = grade
        total, results = self._observations(params)
        return {
            "dataset": DATASET,
            "taxon": name,
            "grade": grade or "any",
            "total": total,
            "sample": self._row(results[0]) if results else None,
        }

    def recent(self, taxon: str, limit: int = 5, quality: str | None = None) -> dict:
        """The newest observations recorded under this name."""
        name = self.check_taxon(taxon)
        rows = self.check_limit(limit)
        grade = self.check_quality(quality)
        params = {"taxon_name": name, "per_page": rows, "order": "desc",
                  "order_by": "observed_on"}
        if grade:
            params["quality_grade"] = grade
        total, results = self._observations(params)
        return {
            "dataset": DATASET,
            "taxon": name,
            "grade": grade or "any",
            "total": total,
            "rows": [self._row(result) for result in results[:rows]],
        }

    def nearby(self, point: str, radius_km: int = 5, limit: int = 5,
               taxon: str | None = None, quality: str | None = None) -> dict:
        """What has been recorded within a radius of one point."""
        location = self.check_point(point)
        radius = self.check_radius(radius_km)
        rows = self.check_limit(limit)
        grade = self.check_quality(quality)
        latitude, longitude = location.split(",")
        params = {"lat": latitude, "lng": longitude, "radius": radius, "per_page": rows,
                  "order": "desc", "order_by": "observed_on"}
        if taxon:
            params["taxon_name"] = self.check_taxon(taxon)
        if grade:
            params["quality_grade"] = grade
        total, results = self._observations(params)
        return {
            "dataset": DATASET,
            "point": location,
            "radius_km": radius,
            "taxon": taxon,
            "grade": grade or "any",
            "total": total,
            "rows": [self._row(result) for result in results[:rows]],
        }

    def taxon(self, name: str) -> dict | None:
        """One taxon's own record: rank, common name, and its recorded count.

        iNaturalist's `/taxa?q=` is a text search, so it can answer with more
        than one taxon for one name ("monarch butterfly" returns the species
        and a subspecies). The best match is the one whose own name or common
        name matches the query, and the caller is told how many others there
        were rather than being shown an arbitrary first row.
        """
        wanted = self.check_taxon(name)
        payload = self.get_json(TAXA_PATH, {"q": wanted, "per_page": 5})
        if not isinstance(payload, dict):
            raise UpstreamError("iNaturalist returned an unexpected payload")
        results = payload.get("results")
        if not isinstance(results, list):
            raise UpstreamError("iNaturalist returned an unexpected payload (no taxa list)")
        total = payload.get("total_results")
        if not results:
            return None
        lowered = wanted.lower()

        def score(row: dict) -> tuple:
            own = str(row.get("name") or "").lower()
            common = str(row.get("preferred_common_name") or "").lower()
            scientific = str(row.get("matched_term") or "").lower()
            # An exact hit on the scientific, common or matched name wins;
            # otherwise a substring hit; otherwise the API's own order.
            exact = int(own == lowered or common == lowered or scientific == lowered)
            partial = int(lowered in own or lowered in common)
            species_rank = int(str(row.get("rank") or "") == "species")
            return (exact, partial, species_rank, row.get("observations_count") or 0)

        best = max(results, key=score)
        matched = str(best.get("name") or "").lower() == lowered \
            or str(best.get("preferred_common_name") or "").lower() == lowered
        return {
            "dataset": "api.inaturalist.org/v1/taxa",
            "query": wanted,
            "id": best.get("id"),
            "name": best.get("name"),
            "common_name": best.get("preferred_common_name"),
            "rank": best.get("rank"),
            "observations_count": best.get("observations_count"),
            "wikipedia_summary": (best.get("wikipedia_summary") or None),
            "wikipedia_url": best.get("wikipedia_url"),
            "conservation_status": ((best.get("conservation_status") or {})
                                    .get("status_name")),
            "exact_match": matched,
            "other_matches": max(0, len(results) - 1),
            "matched_total": total if isinstance(total, int) else None,
        }

    @staticmethod
    def freshness() -> str:
        """Observations arrive continuously, so freshness is now."""
        return utc_now_iso()
