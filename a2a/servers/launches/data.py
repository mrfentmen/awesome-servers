"""Read-only client for the SpaceDevs Launch Library 2.2.

Endpoints (keyless, verified live 2026-09-28):
  - /launch/upcoming/               the published schedule, compact records
  - /launch/?net__gte=&net__lte=    every launch whose NET falls in a window
  - /launch/{id}/                   one launch in full, with its missions

Four things about this API shape the client:

1. `mode=list` returns a compact record and `mode=detailed` returns a much
   bigger one, so lists ask for `list` and only a single launch pays for
   `detailed`. The compact record is a different shape, not a subset with the
   same names: the agency is `lsp_name` there and `launch_service_provider`
   object here, and the pad is a string there and an object here.

2. `upcoming/` is not strictly future. A launch can sit in it with a NET in the
   past and a status of Launch Successful, because the schedule is republished
   as it changes rather than pruned. So the schedule is read through an explicit
   `net__gte` window and every answer re-checks the time it is reporting.

3. The API pages at 100 records and the schedule runs to hundreds of entries,
   so anything that counts across a window has to follow `next`. That is the
   premium skill's job; the free skills stay inside one page on purpose.

2.2.0 is the live version. 2.3.0 answers HTTP 404, so the base path is pinned
here rather than discovered at request time.
"""

from __future__ import annotations

import os
import re
from datetime import datetime, timedelta, timezone

from a2a_kit import JsonApiClient, UpstreamError, utc_now_iso

BASE_URL = "https://ll.thespacedevs.com"
API_PATH = "/2.2.0/launch"
UPCOMING_PATH = "/2.2.0/launch/upcoming/"

DATASET = "ll.thespacedevs.com/2.2.0/launch"
PRODUCT = "SpaceDevs Launch Library 2.2 launch schedule"

#: How many records one page holds, and how many pages a full window sweep reads.
PAGE_SIZE = 100
MAX_PAGES = 8

#: The compact record, in the order the answers report it.
LIST_FIELDS = (
    "id", "slug", "name", "net", "net_precision", "window_start", "window_end",
    "status", "lsp_name", "mission", "mission_type", "pad", "location",
    "probability", "webcast_live", "holdreason", "failreason",
)
#: The full record, which adds the parts a single launch can afford to carry.
DETAIL_FIELDS = LIST_FIELDS + (
    "image", "hashtag", "description", "rocket", "launch_service_provider",
    "pad_detail", "location_detail", "missions", "last_updated",
)

#: The list record's names for the things the detail record nests.
LIST_KEYS = {
    "id": "id", "slug": "slug", "name": "name", "net": "net",
    "net_precision": "net_precision", "window_start": "window_start",
    "window_end": "window_end", "status": "status", "lsp_name": "lsp_name",
    "mission": "mission", "mission_type": "mission_type", "pad": "pad",
    "location": "location", "probability": "probability",
    "webcast_live": "webcast_live", "holdreason": "holdreason",
    "failreason": "failreason",
}

#: Mission types the API uses, for validation and for grouping.
MISSION_TYPES = (
    "Communications", "Navigation", "Space Science", "Earth Science",
    "Human Spaceflight", "Military", "Technology Development", "Tourism",
    "Space Transportation", "Engineering",
)
#: NET precision, worst first. A "Day" precision is a guess, not a time.
PRECISIONS = ("Second", "Hour", "Day", "Week", "Month", "Quarter", "Year")

#: Statuses that mean the launch is still to fly. The library spells these as
#: human labels and has used both "Go for Launch" and "Go For Launch", so they
#: are compared on a lower-cased key: a status that misses the set is treated as
#: already flown, which is the wrong direction to be wrong in.
OPEN_STATUSES = ("scheduled", "go", "go for launch", "in hold", "hold", "tbd",
                 "not launched", "awaiting launch date", "unconfirmed")
CLOSED_STATUSES = ("launch successful", "launch failure", "partial failure",
                   "prelaunch failure", "scrubbed", "cancelled", "unlaunched")
HOLD_STATUSES = ("in hold", "hold")

_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
_ID_RE = re.compile(r"^[0-9a-fA-F-]{8,36}$")
_SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9\-]{2,120}$")
_TEXT_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9 .,'()+/&\-]{1,80}$")

__all__ = [
    "API_PATH",
    "BASE_URL",
    "CLOSED_STATUSES",
    "DATASET",
    "DETAIL_FIELDS",
    "HOLD_STATUSES",
    "LaunchLibraryClient",
    "LIST_FIELDS",
    "LIST_KEYS",
    "MAX_PAGES",
    "MISSION_TYPES",
    "OPEN_STATUSES",
    "PAGE_SIZE",
    "PRECISIONS",
    "find",
    "search",
    "PRODUCT",
    "UPCOMING_PATH",
    "UpstreamError",
    "parse_iso",
]


def _stamp(days_from_now: int) -> str:
    """An ISO instant `days_from_now` out, for a bounded window read."""
    moment = datetime.now(timezone.utc) + timedelta(days=days_from_now)
    return moment.strftime("%Y-%m-%dT%H:%M:%SZ")


def parse_iso(value):
    """An API timestamp as a UTC datetime, or None when it is not one."""
    if not isinstance(value, str) or not value:
        return None
    text = value.replace("Z", "+00:00")
    if "." in text:
        head, fraction = text.split(".", 1)
        text = f"{head}.{fraction[:6]:<06s}".replace(" ", "0")
    try:
        moment = datetime.fromisoformat(text)
    except ValueError:
        return None
    return moment if moment.tzinfo else moment.replace(tzinfo=timezone.utc)


def _to_int(value):
    if value in (None, ""):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


class LaunchLibraryClient(JsonApiClient):
    env_prefix = "LAUNCHES"
    base_url = BASE_URL

    def __init__(self, fetch=None, base_url=None, cache_ttl=None, timeout=None, headers=None) -> None:
        super().__init__(fetch=fetch, base_url=base_url, cache_ttl=cache_ttl, timeout=timeout,
                         headers=headers)
        # A schedule changes a few times a day and is paged at 100, so a short
        # TTL keeps a burst of questions from re-reading it.
        self.schedule_ttl = float(os.environ.get(f"{self.env_prefix}_SCHEDULE_TTL", "600"))
        # A single launch in full is a much bigger record and changes rarely.
        self.detail_ttl = float(os.environ.get(f"{self.env_prefix}_DETAIL_TTL", "3600"))

    # -- validation --------------------------------------------------------

    @staticmethod
    def check_days(value) -> int:
        try:
            days = int(value)
        except (TypeError, ValueError):
            raise ValueError("days must be a whole number") from None
        if not 1 <= days <= 90:
            raise ValueError("days must be between 1 and 90")
        return days

    @staticmethod
    def check_date(value) -> str:
        """A YYYY-MM-DD date, returned as an ISO instant at the start of that day."""
        text = str(value).strip()
        if not _DATE_RE.match(text):
            raise ValueError("a date is YYYY-MM-DD, for example 2026-10-01")
        try:
            datetime.strptime(text, "%Y-%m-%d")
        except ValueError:
            raise ValueError("that is not a real date") from None
        return f"{text}T00:00:00Z"

    @staticmethod
    def check_limit(value) -> int:
        try:
            limit = int(value)
        except (TypeError, ValueError):
            raise ValueError("limit must be a whole number") from None
        if not 1 <= limit <= 50:
            raise ValueError("limit must be between 1 and 50")
        return limit

    @staticmethod
    def check_mission_type(value) -> str:
        wanted = str(value).strip().lower()
        for name in MISSION_TYPES:
            if name.lower() == wanted:
                return name
        raise ValueError(f"mission type must be one of: {', '.join(MISSION_TYPES)}")

    @staticmethod
    def check_id(value) -> str:
        text = str(value).strip()
        if not _ID_RE.match(text):
            raise ValueError("a launch id is the UUID from the launch record")
        return text

    @staticmethod
    def check_slug(value) -> str:
        slug = str(value).strip().lower()
        if not _SLUG_RE.match(slug):
            raise ValueError("a launch slug is lowercase words and dashes")
        return slug

    @staticmethod
    def check_text(value) -> str:
        text = str(value).strip()
        if not _TEXT_RE.match(text):
            raise ValueError("that does not look like something to search for")
        return text

    # -- transport ---------------------------------------------------------

    def _page(self, path: str, query: dict, ttl: float) -> dict:
        try:
            payload = self.get_json(path, query, ttl=ttl)
        except UpstreamError as exc:
            # The Launch Library allows about 30 requests an hour per address and
            # answers 429 with a "try again in N seconds" note. Surfacing that as
            # itself is the difference between a caller waiting and a caller
            # giving up, so it is rewritten rather than passed through.
            if "429" in str(exc):
                raise UpstreamError(
                    "the Launch Library is throttling this address (about 30 requests an hour); "
                    "wait for the window to reopen and try again"
                ) from exc
            raise
        if not isinstance(payload, dict):
            raise UpstreamError("the Launch Library returned an unexpected payload")
        if isinstance(payload.get("detail"), str):
            raise UpstreamError(f"the Launch Library: {payload['detail']}")
        if not isinstance(payload.get("results"), list):
            raise UpstreamError("the Launch Library returned no results list")
        return payload

    # -- reads -------------------------------------------------------------

    def upcoming(self, limit: int = 10) -> list[dict]:
        """The published schedule, one page of it, in the API's own order."""
        limit = self.check_limit(limit)
        payload = self._page(UPCOMING_PATH, {"limit": min(PAGE_SIZE, limit), "mode": "list"},
                             self.schedule_ttl)
        return [self.list_summary(row) for row in payload["results"][:limit]
                if isinstance(row, dict)]

    def in_window(self, start: str, end: str, limit: int = 25) -> dict:
        """Launches whose NET falls between two instants.

        `start` and `end` are ISO instants. The API filters server-side, so this
        is one page unless the caller asks for more than the page holds.
        """
        limit = self.check_limit(limit)
        query = {
            "net__gte": start,
            "net__lte": end,
            "limit": min(PAGE_SIZE, limit),
            "mode": "list",
        }
        payload = self._page(API_PATH + "/", query, self.schedule_ttl)
        return {
            "launches": [self.list_summary(row) for row in payload["results"][:limit]
                         if isinstance(row, dict)],
            "count_in_window": payload.get("count"),
            "has_more": bool(payload.get("next")),
        }

    def window_sweep(self, start: str, end: str) -> dict:
        """Every launch in a window, following pagination.

        This is the expensive read: a busy week is more than one page, and only
        the premium skill pays for it.
        """
        launches: list[dict] = []
        pages = 0
        url = None
        query: dict | None = {"net__gte": start, "net__lte": end, "limit": PAGE_SIZE, "mode": "list"}
        while query is not None and pages < MAX_PAGES:
            if url is None:
                payload = self._page(API_PATH + "/", query, self.schedule_ttl)
            else:
                # A `next` link is absolute and already carries the query, so it
                # is fetched as given rather than rebuilt.
                payload = self.get_json_absolute(url, self.schedule_ttl)
            pages += 1
            launches.extend(self.list_summary(row) for row in payload["results"]
                            if isinstance(row, dict))
            url = payload.get("next")
            query = None
        launches.sort(key=lambda row: row.get("net") or "")
        return {
            "launches": launches,
            "pages": pages,
            "truncated": bool(url),
            "count_in_window": len(launches),
        }

    def get_json_absolute(self, url: str, ttl: float):
        """GET a full URL, for following a `next` link the API handed back."""
        return self.get_json(url, None, ttl=ttl)

    def details(self, launch_id: str) -> dict | None:
        """One launch in full, with its missions."""
        path = API_PATH + f"/{self.check_id(launch_id)}/"
        payload = self.get_json(path, {"mode": "detailed"}, ttl=self.detail_ttl)
        if not isinstance(payload, dict) or not payload.get("id"):
            return None
        return self.detail_summary(payload)

    def search(self, agency: str | None = None, mission_type: str | None = None,
               rocket: str | None = None, name: str | None = None, limit: int = 10) -> dict:
        """Find launches by agency, mission type, rocket or name text.

        The filtering is done here rather than server-side. The API's own filter
        names for these fields were not verifiable from the live feed, and a
        filter that silently returns the unfiltered first page is worse than no
        filter, so the window is read once and matched locally. The result says
        so, because a local filter can only see the page it read.
        """
        limit = self.check_limit(limit)
        wanted_agency = self.check_text(agency).lower() if agency else None
        wanted_type = self.check_mission_type(mission_type).lower() if mission_type else None
        wanted_rocket = self.check_text(rocket).lower() if rocket else None
        wanted_name = self.check_text(name).lower() if name else None
        if not any((wanted_agency, wanted_type, wanted_rocket, wanted_name)):
            raise ValueError("a search needs an agency, a mission type, a rocket or some text")

        payload = self._page(API_PATH + "/", {"limit": PAGE_SIZE, "mode": "list",
                                              "net__lte": _stamp(365 * 3)}, self.schedule_ttl)
        matched = []
        for row in payload["results"]:
            if not isinstance(row, dict):
                continue
            launch = self.list_summary(row)
            haystack = " ".join(str(launch.get(key) or "").lower() for key in
                                ("name", "lsp_name", "mission", "mission_type", "rocket_name"))
            if wanted_agency and wanted_agency not in (launch.get("lsp_name") or "").lower():
                continue
            if wanted_type and wanted_type != (launch.get("mission_type") or "").lower():
                continue
            if wanted_rocket and wanted_rocket not in haystack:
                continue
            if wanted_name and wanted_name not in haystack:
                continue
            matched.append(launch)
            if len(matched) >= limit:
                break
        return {
            "launches": matched,
            "matched": len(matched),
            "page_read": len(payload["results"]),
            "page_total": payload.get("count"),
            "filtered_client_side": True,
        }

    def find(self, text: str, limit: int = 10) -> dict:
        """Find a launch in the published schedule by words in its name.

        The schedule is one proven request, so the matching happens here and the
        result says how much of the schedule it looked at. A phrase like
        "crew-13" or "starship flight 14" finds its launch; an ambiguous phrase
        returns the candidates rather than picking one.
        """
        limit = self.check_limit(limit)
        needle = self.check_text(text).lower()
        terms = [term for term in re.split(r"[^a-z0-9]+", needle) if term]
        if not terms:
            raise ValueError("that does not look like something to look for")
        payload = self._page(UPCOMING_PATH, {"limit": PAGE_SIZE, "mode": "list"}, self.schedule_ttl)
        rows = [self.list_summary(row) for row in payload["results"] if isinstance(row, dict)]
        exact = [row for row in rows
                 if needle in " ".join(str(row.get(key) or "").lower()
                                       for key in ("name", "mission", "slug")).replace("|", " ")]
        chosen = exact or [row for row in rows
                           if all(term in " ".join(str(row.get(key) or "").lower()
                                                   for key in ("name", "mission", "slug"))
                                  for term in terms)]
        return {
            "launches": chosen[:limit],
            "matched": len(chosen),
            "schedule_read": len(rows),
            "matched_exactly": bool(exact),
        }

    # -- shaping -----------------------------------------------------------

    def list_summary(self, row: dict) -> dict:
        """The compact record, with the list API's names kept as they are."""
        summary = {name: row[upstream] for upstream, name in LIST_KEYS.items() if upstream in row}
        status = summary.get("status")
        if isinstance(status, dict):
            summary["status"] = status.get("name")
            summary["status_abbrev"] = status.get("abbrev")
        precision = summary.get("net_precision")
        if isinstance(precision, dict):
            summary["net_precision"] = precision.get("name")
        summary["dataset"] = DATASET
        summary["net_is_future"] = _is_future(summary.get("net"))
        status_key = str(summary.get("status") or "").lower()
        summary["is_open"] = status_key in OPEN_STATUSES
        summary["is_held"] = status_key in HOLD_STATUSES
        return summary

    def detail_summary(self, row: dict) -> dict:
        """The full record, with its nested objects flattened to what is useful."""
        summary = self.list_summary(row)
        provider = row.get("launch_service_provider")
        if isinstance(provider, dict):
            summary["lsp_name"] = provider.get("name")
            summary["lsp_abbrev"] = provider.get("abbrev")
            summary["lsp_country"] = provider.get("country_code")
            summary["lsp_founded"] = provider.get("founded_date")
            summary["lsp_type"] = provider.get("type")
        rocket = row.get("rocket")
        if isinstance(rocket, dict):
            configuration = rocket.get("configuration") or {}
            summary["rocket_name"] = rocket.get("name")
            summary["rocket_variant"] = configuration.get("variant")
            summary["rocket_full"] = configuration.get("full_name") or rocket.get("configuration_name")
            summary["rocket_height_m"] = _to_int(rocket.get("height"))
        pad = row.get("pad")
        if isinstance(pad, dict):
            summary["pad"] = pad.get("name")
            pad_location = pad.get("location") or {}
            summary["location"] = pad_location.get("name")
            summary["pad_latitude"] = pad.get("latitude")
            summary["pad_longitude"] = pad.get("longitude")
        missions = []
        for mission in row.get("missions") or []:
            if not isinstance(mission, dict):
                continue
            missions.append({
                "name": mission.get("name"),
                "type": mission.get("type"),
                "description": (mission.get("description") or "")[:400] or None,
            })
        summary["missions"] = missions
        summary["mission_count"] = len(missions)
        summary["description"] = (row.get("description") or "")[:600] or None
        summary["image"] = row.get("image")
        return summary

    @staticmethod
    def freshness() -> str:
        """The schedule is republished live, so freshness is the moment we read it."""
        return utc_now_iso()


def _is_future(net) -> bool:
    moment = parse_iso(net)
    if moment is None:
        return False
    return moment > datetime.now(timezone.utc)
