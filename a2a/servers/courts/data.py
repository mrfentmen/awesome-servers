"""Read-only client for the CourtListener v4 REST API.

Endpoints (keyless, verified live 2026-09-28):
  - /search/?type=o      opinions and their citations
  - /search/?type=r      RECAP dockets
  - /search/?type=p      judges and other people
  - /courts/             the court list (id, name, jurisdiction, parent court)

Three things about this API shape the client:

1. One search endpoint serves every kind of record, and `type` picks which. The
   same query is legal on all three, so a caller can search opinions, dockets or
   judges with the same wording.
2. `page_size` is ignored. The list pages by opaque cursor and a page holds 20
   records, so the client asks for one page and caps it locally rather than
   pretending it can choose a size.
3. The detail endpoints (`/opinions/{id}/`, `/dockets/`) are behind a login. The
   search payload is the only keyless source, and it already carries the reporter
   citations and the cite count, which is what the skills need.

CourtListener is a nonprofit run by Free Law Project; every answer names it.
"""

from __future__ import annotations

import os
import re

from a2a_kit import JsonApiClient, UpstreamError, utc_now_iso

BASE_URL = "https://www.courtlistener.com/api/rest/v4"
SEARCH_PATH = "/search/"
COURTS_PATH = "/courts/"

DATASET = "courtlistener.com/api/rest/v4/search"
COURTS_DATASET = "courtlistener.com/api/rest/v4/courts"
PRODUCT = "CourtListener opinions, dockets, judges and courts"

#: `type` values the search endpoint understands.
SEARCH_TYPES = {"opinion": "o", "docket": "r", "person": "p"}
#: The court codes a caller may name directly, plus the ones people usually type.
COURT_CODES = (
    "scotus", "supremecourt", "ca1", "ca2", "ca3", "ca4", "ca5", "ca6", "ca7", "ca8",
    "ca9", "ca10", "ca11", "cadc", "cand", "cafc", "cavc", "cb1", "cb2", "cb3",
    "cb4", "cb5", "cb6", "cb7", "cb8", "cb9", "cb10", "cidea", "cffd", "citc", "nmcca",
)

OPINION_FIELDS = (
    "cluster_id", "caseName", "dateFiled", "court_id", "court", "court_citation_string",
    "docketNumber", "citation", "neutralCite", "citeCount", "status", "absolute_url",
)
DOCKET_FIELDS = (
    "docket_id", "caseName", "docketNumber", "court_id", "court", "court_citation_string",
    "dateFiled", "dateArgued", "dateTerminated", "docket_absolute_url",
)
PERSON_FIELDS = (
    "id", "name", "gender", "dob", "positions", "school", "aba_rating", "political_affiliation",
    "absolute_url",
)
COURT_FIELDS = (
    "id", "short_name", "full_name", "citation_string", "jurisdiction", "position",
    "start_date", "end_date", "parent_court", "url", "in_use",
)

_COURT_RE = re.compile(r"^\s*([a-z0-9]{2,10})\s*$")
_DATE_RE = re.compile(r"^\s*(\d{4}-\d{2}-\d{2})\s*$")

__all__ = [
    "BASE_URL",
    "COURT_CODES",
    "COURTS_DATASET",
    "COURTS_PATH",
    "COURT_FIELDS",
    "CourtListenerClient",
    "DOCKET_FIELDS",
    "DATASET",
    "OPINION_FIELDS",
    "PERSON_FIELDS",
    "PRODUCT",
    "SEARCH_PATH",
    "SEARCH_TYPES",
    "UpstreamError",
]


class CourtListenerClient(JsonApiClient):
    env_prefix = "COURTS"
    base_url = BASE_URL

    def __init__(self, fetch=None, base_url=None, cache_ttl=None, timeout=None, headers=None) -> None:
        super().__init__(fetch=fetch, base_url=base_url, cache_ttl=cache_ttl, timeout=timeout, headers=headers)
        self.court_ttl = float(os.environ.get(f"{self.env_prefix}_COURT_TTL", "86400"))
        #: CourtListener pages by cursor at 20 records; that is one honest page.
        self.page_size = 20

    # -- validation --------------------------------------------------------

    @staticmethod
    def check_query(value) -> str:
        """A search term. CourtListener matches on the whole phrase, so it is trimmed."""
        query = " ".join(str(value or "").split())
        if not query:
            raise ValueError("a search term is required, for example “fourth amendment”")
        if len(query) > 200:
            raise ValueError("a search term must be at most 200 characters")
        return query

    @staticmethod
    def check_court(value) -> str | None:
        """A court code, lowercased. `None` means every court."""
        if value in (None, ""):
            return None
        code = str(value).strip().lower()
        if not _COURT_RE.match(code) or code not in COURT_CODES:
            raise ValueError(f"court must be one of: {', '.join(COURT_CODES)}")
        return code

    @staticmethod
    def check_date(value, label: str) -> str | None:
        if value in (None, ""):
            return None
        date = str(value).strip()
        if not _DATE_RE.match(date):
            raise ValueError(f"{label} must look like YYYY-MM-DD")
        return date

    @staticmethod
    def check_limit(value) -> int:
        try:
            limit = int(value)
        except (TypeError, ValueError):
            raise ValueError("limit must be a whole number") from None
        if not 1 <= limit <= 20:
            raise ValueError("limit must be between 1 and 20 (CourtListener pages at 20)")
        return limit

    # -- transport ---------------------------------------------------------

    def _search(self, query: str, kind: str, params: dict, ttl: float) -> dict:
        payload = self.get_json(
            SEARCH_PATH,
            {"q": query, "type": SEARCH_TYPES[kind], "order_by": "score desc", **params},
            ttl=ttl,
        )
        if not isinstance(payload, dict) or not isinstance(payload.get("results"), list):
            raise UpstreamError("CourtListener returned an unexpected search payload")
        return payload

    # -- reads -------------------------------------------------------------

    def opinions(self, query: str, court: str | None = None, filed_after: str | None = None,
                 filed_before: str | None = None, limit: int = 10) -> dict:
        """Opinions matching a query, most relevant first.

        Relevance order is the only order offered here on purpose: ranking a
        result set by how often it has been cited is the citation-census skill,
        which runs on the licence gateway, and it must not be reproducible for free.
        """
        query = self.check_query(query)
        limit = self.check_limit(limit)
        court = self.check_court(court)
        filed_after = self.check_date(filed_after, "filed_after")
        filed_before = self.check_date(filed_before, "filed_before")
        params = _optional({"court": court, "filed_after": filed_after, "filed_before": filed_before})
        payload = self._search(query, "opinion", params, ttl=self.cache_ttl)
        rows = [self.pick(row, OPINION_FIELDS, DATASET) for row in payload["results"]]
        return {"query": query, "kind": "opinion", "court": court, "filed_after": filed_after,
                "filed_before": filed_before, "order_by": "score desc",
                "total_hits": _to_int(payload.get("count")), "page_size": len(payload["results"]),
                "opinions": rows[:limit]}

    def dockets(self, query: str, court: str | None = None, filed_after: str | None = None,
                filed_before: str | None = None, limit: int = 10) -> dict:
        """RECAP dockets matching a query — a case name or a docket number."""
        query = self.check_query(query)
        limit = self.check_limit(limit)
        court = self.check_court(court)
        filed_after = self.check_date(filed_after, "filed_after")
        filed_before = self.check_date(filed_before, "filed_before")
        params = _optional({"court": court, "filed_after": filed_after, "filed_before": filed_before,
                            "order_by": "dateFiled desc"})
        payload = self._search(query, "docket", params, ttl=self.cache_ttl)
        rows = [self.pick(row, DOCKET_FIELDS, DATASET) for row in payload["results"]]
        return {"query": query, "kind": "docket", "court": court, "filed_after": filed_after,
                "filed_before": filed_before, "total_hits": _to_int(payload.get("count")),
                "page_size": len(payload["results"]), "dockets": rows[:limit]}

    def people(self, query: str, limit: int = 10) -> dict:
        """Judges and other CourtListener people whose name matches a query."""
        query = self.check_query(query)
        limit = self.check_limit(limit)
        payload = self._search(query, "person", {"order_by": "score desc"}, ttl=self.cache_ttl)
        rows = [self.pick(row, PERSON_FIELDS, DATASET) for row in payload["results"]]
        return {"query": query, "kind": "person", "total_hits": _to_int(payload.get("count")),
                "page_size": len(payload["results"]), "people": rows[:limit]}

    def court_list(self) -> list[dict]:
        """Every court CourtListener tracks. Small, changes rarely: cached for a day."""
        payload = self.get_json(COURTS_PATH, {}, ttl=self.court_ttl)
        rows = payload.get("results") if isinstance(payload, dict) else None
        if rows is None:
            raise UpstreamError("CourtListener returned an unexpected court list payload")
        return [self.pick(row, COURT_FIELDS, COURTS_DATASET) for row in rows]

    def find_courts(self, needle: str | None = None, jurisdiction: str | None = None,
                    limit: int = 10) -> list[dict]:
        """Courts whose code, short name or full name contains `needle`."""
        limit = self.check_limit(limit)
        term = str(needle or "").strip().lower()
        want = str(jurisdiction or "").strip().upper() or None
        matches = []
        for court in self.court_list():
            if term and term not in " ".join(
                str(court.get(field) or "") for field in ("id", "short_name", "full_name", "citation_string")
            ).lower():
                continue
            if want and str(court.get("jurisdiction") or "").upper() != want:
                continue
            matches.append(court)
        matches.sort(key=lambda court: (court.get("position") is None, court.get("position") or 0,
                                        str(court.get("short_name") or "")))
        return matches[:limit]

    @staticmethod
    def court_label(court: dict | None) -> str:
        if not court:
            return "not reported"
        return court.get("full_name") or court.get("short_name") or str(court.get("id") or "not reported")

    @staticmethod
    def freshness() -> str:
        """CourtListener is read live, so freshness is the moment we read it."""
        return utc_now_iso()


def _optional(params: dict) -> dict:
    return {key: value for key, value in params.items() if value not in (None, "")}


def _to_int(value) -> int | None:
    if value in (None, ""):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None
