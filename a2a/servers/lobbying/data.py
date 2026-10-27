"""Read-only client for the Senate Lobbying Disclosure Act API (LDA, v1).

Endpoints (keyless, verified live 2026-09-28):
  - /filings/    the filing index, filtered by year, registrant, client, lobbyist or type
  - /filings/{uuid}/   one filing, with the issues it covers and who lobbied on them
  - /clients/    the client directory

Four things about this API shape the client, each verified against the live service:

1. The filters that work are `filing_year`, `registrant_name`, `client_name`,
   `lobbyist_name` and `filing_type`. `issue`, `issue_specific`, `search`,
   `general_issue_code` and `name` are all accepted and all silently ignored: they
   return the unfiltered count. So there is no issue search here, and the issue areas
   a filing covers are read out of that filing's own `lobbying_activities`.
2. `/lobbyists/` ignores every filter, including `filing_year`, and always answers
   with the whole 88,781-row directory. It is therefore not read at all. Lobbyists
   are read the way the service will answer: as the ones named inside filings.
3. A registrant is the lobbying firm and a client is who pays it. They are different
   filters, and a filing carries both, so both are reported rather than one standing
   in for the other.
4. A quarterly filing reports `expenses` (and sometimes `income`); a registration or
   amendment reports neither. A null amount is the filing's own answer and is reported
   as not reported, never as zero.

LDA is the US Senate's disclosure system. A registrant must file quarterly, but a
filing exists only from the quarter it was posted, and expense figures arrive on
whichever of the income or expense method the registrant used.
"""

from __future__ import annotations

import re

from a2a_kit import JsonApiClient, UpstreamError, utc_now_iso

BASE_URL = "https://lda.gov/api/v1"
FILINGS_PATH = "/filings/"
FILING_PATH = "/filings/{uuid}"
CLIENTS_PATH = "/clients/"

DATASET = "lda.gov/api/v1/filings"
CLIENTS_DATASET = "lda.gov/api/v1/clients"
PRODUCT = "US Senate lobbying disclosure filings"

#: LDA's own filing-type codes, with the ones people usually name.
FILING_TYPES = {
    "q1": "Q1", "q2": "Q2", "q3": "Q3", "q4": "Q4",
    "first quarter": "Q1", "second quarter": "Q2", "third quarter": "Q3", "fourth quarter": "Q4",
    "1st quarter": "Q1", "2nd quarter": "Q2", "3rd quarter": "Q3", "4th quarter": "Q4",
    "rr": "RR", "registration": "RR",
    "amendment": "AM", "am": "AM",
    "termination": "TERM", "terminated": "TERM", "term": "TERM",
    "other": "OTHER",
}
FILING_TYPE_LABELS = {
    "Q1": "1st Quarter", "Q2": "2nd Quarter", "Q3": "3rd Quarter", "Q4": "4th Quarter",
    "RR": "Registration", "AM": "Amendment", "TERM": "Termination", "OTHER": "Other",
}
#: The expense methods a registrant may use, in the API's own words.
EXPENSE_METHODS = ("C", "AC", "C/P", "C/T", "U", "UK")

FILING_FIELDS = ("filing_uuid", "filing_type", "filing_type_display", "filing_year",
                 "filing_period", "filing_period_display", "dt_posted", "expenses", "income",
                 "expenses_method", "registrant_name", "registrant_id", "client_name", "client_id",
                 "registrant_state", "registrant_city", "lobbyist_count", "issue_codes",
                 "filing_document_url")
CLIENT_FIELDS = ("id", "client_id", "name", "general_issue_codes", "state", "city", "country",
                 "description")

_UUID_RE = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")
_YEAR_RE = re.compile(r"^\d{4}$")
_NAME_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9 .,'’&/\-()]{0,90}$")
#: GLEIF writes nothing like this; LDA is the only one with a uuid per filing.
_MISSING = (None, "")

__all__ = [
    "BASE_URL",
    "CLIENTS_DATASET",
    "CLIENTS_PATH",
    "CLIENT_FIELDS",
    "DATASET",
    "EXPENSE_METHODS",
    "FILINGS_PATH",
    "FILING_FIELDS",
    "FILING_PATH",
    "FILING_TYPES",
    "FILING_TYPE_LABELS",
    "LdaClient",
    "PRODUCT",
    "UpstreamError",
]


class LdaClient(JsonApiClient):
    env_prefix = "LOBBYING"
    base_url = BASE_URL
    #: LDA pages at 20 by default; 100 keeps a quarter's worth in one request.
    page_size = 100

    def __init__(self, fetch=None, base_url=None, cache_ttl=None, timeout=None, headers=None) -> None:
        super().__init__(fetch=fetch, base_url=base_url, cache_ttl=cache_ttl, timeout=timeout, headers=headers)
        #: Filings are posted daily and never change once posted.
        self.posted_ttl = float(self.cache_ttl)

    # -- validation --------------------------------------------------------

    @staticmethod
    def check_year(value) -> int:
        year = str(value or "").strip()
        if not _YEAR_RE.match(year):
            raise ValueError("a filing year must be four digits, for example 2024")
        number = int(year)
        if not 1993 <= number <= 2100:
            raise ValueError(
                "LDA only holds filings from 1993 onwards, so the year must be 1993 or later"
            )
        return number

    @staticmethod
    def check_name(value, what: str = "registrant") -> str:
        name = " ".join(str(value or "").split())
        if not name:
            raise ValueError(f"which {what}? Give me a name, for example “Lockheed Martin”")
        if not _NAME_RE.match(name):
            raise ValueError(f"that does not look like a {what} name")
        return name

    @staticmethod
    def check_filing_type(value) -> str | None:
        if value in _MISSING:
            return None
        kind = str(value).strip().lower()
        code = FILING_TYPES.get(kind, kind.upper())
        if code not in FILING_TYPE_LABELS:
            raise ValueError(f"filing type must be one of: {', '.join(sorted(FILING_TYPE_LABELS))}")
        return code

    @staticmethod
    def check_uuid(value) -> str:
        uuid = str(value or "").strip().lower()
        if not _UUID_RE.match(uuid):
            raise ValueError(
                "a filing id is its uuid, for example "
                "9ad88323-8325-40eb-9036-eb5ea7c6827f"
            )
        return uuid

    @staticmethod
    def check_limit(value) -> int:
        try:
            limit = int(value)
        except (TypeError, ValueError):
            raise ValueError("limit must be a whole number") from None
        if not 1 <= limit <= 100:
            raise ValueError("limit must be between 1 and 100")
        return limit

    # -- transport ---------------------------------------------------------

    def _page(self, path: str, filters: dict, limit: int, ttl: float) -> dict:
        params = {"page_size": limit, **filters}
        payload = self.get_json(path, params, ttl=ttl)
        if not isinstance(payload, dict) or not isinstance(payload.get("results"), list):
            raise UpstreamError("LDA returned an unexpected list payload")
        return payload

    # -- reads -------------------------------------------------------------

    def filings(self, year: int | None = None, registrant: str | None = None,
                client: str | None = None, lobbyist: str | None = None,
                filing_type: str | None = None, limit: int = 20) -> dict:
        """The filing index, with only the filters LDA actually honours.

        Each filter is a name the service will match on, so the response really is
        the filings asked for. The filter set is echoed back so a caller can see
        exactly what was searched.
        """
        limit = self.check_limit(limit)
        filters: dict = {}
        if year is not None:
            filters["filing_year"] = self.check_year(year)
        if registrant:
            filters["registrant_name"] = self.check_name(registrant, "registrant")
        if client:
            filters["client_name"] = self.check_name(client, "client")
        if lobbyist:
            filters["lobbyist_name"] = self.check_name(lobbyist, "lobbyist")
        if filing_type:
            filters["filing_type"] = self.check_filing_type(filing_type)
        payload = self._page(FILINGS_PATH, filters, limit, self.posted_ttl)
        rows = [self.summarise(row) for row in payload["results"]]
        return {"filters": filters, "total": _to_int(payload.get("count")),
                "page_size": len(payload["results"]), "filings": rows[:limit]}

    def filing_detail(self, uuid: str) -> dict | None:
        """One filing, with the issues it covers and the lobbyists on each of them."""
        uuid = self.check_uuid(uuid)
        payload = self.get_json(FILING_PATH.format(uuid=uuid), {}, ttl=self.posted_ttl)
        if not isinstance(payload, dict) or not payload.get("filing_uuid"):
            return None
        record = self.summarise(payload)
        record["activities"] = [self._activity(activity)
                                for activity in (payload.get("lobbying_activities") or [])]
        record["affiliated_organizations"] = [
            (org.get("name") if isinstance(org, dict) else org)
            for org in (payload.get("affiliated_organizations") or [])
        ]
        record["foreign_entities"] = [
            (entity.get("name") if isinstance(entity, dict) else entity)
            for entity in (payload.get("foreign_entities") or [])
        ]
        record["conviction_disclosures"] = payload.get("conviction_disclosures") or []
        return record

    def client_directory(self, name: str, limit: int = 20) -> dict:
        """LDA's client directory: who is a registered client, and on what."""
        name = self.check_name(name, "client")
        limit = self.check_limit(limit)
        payload = self._page(CLIENTS_PATH, {"client_name": name}, limit, self.posted_ttl)
        rows = [self.pick(row, CLIENT_FIELDS, CLIENTS_DATASET) for row in payload["results"]]
        return {"query": name, "total": _to_int(payload.get("count")),
                "page_size": len(payload["results"]), "clients": rows[:limit]}

    # -- shaping -----------------------------------------------------------

    def summarise(self, row: dict) -> dict:
        """One filing reduced to the fields the skills report, with nothing invented."""
        registrant = row.get("registrant") or {}
        client = row.get("client") or {}
        activities = row.get("lobbying_activities") or []
        return self.pick({
            "filing_uuid": row.get("filing_uuid"),
            "filing_type": row.get("filing_type"),
            "filing_type_display": row.get("filing_type_display"),
            "filing_year": _to_int(row.get("filing_year")),
            "filing_period": row.get("filing_period"),
            "filing_period_display": row.get("filing_period_display"),
            "dt_posted": row.get("dt_posted"),
            "expenses": _to_float(row.get("expenses")),
            "income": _to_float(row.get("income")),
            "expenses_method": row.get("expenses_method"),
            "registrant_name": registrant.get("name"),
            "registrant_id": registrant.get("id"),
            "client_name": client.get("name"),
            "client_id": client.get("id"),
            "registrant_state": row.get("registrant_state"),
            "registrant_city": row.get("registrant_city"),
            "lobbyist_count": _lobbyist_count(activities),
            "issue_codes": sorted({activity.get("general_issue_code_display")
                                   for activity in activities if activity.get("general_issue_code_display")}),
            "filing_document_url": row.get("filing_document_url"),
            "dataset": DATASET,
        }, FILING_FIELDS)

    def _activity(self, activity: dict) -> dict:
        """One issue area of a filing, with the lobbyists who worked it."""
        lobbyists = []
        for entry in (activity.get("lobbyists") or []):
            person = entry.get("lobbyist") or {}
            name = " ".join(str(part) for part in (person.get("first_name"),
                                                   person.get("last_name")) if part)
            lobbyists.append({"name": name or None, "id": person.get("id"),
                              "covered_position": entry.get("covered_position")})
        return {
            "issue_code": activity.get("general_issue_code"),
            "issue": activity.get("general_issue_code_display"),
            "description": activity.get("description"),
            "lobbyists": lobbyists,
            "government_entities": [
                (entity.get("name") if isinstance(entity, dict) else entity)
                for entity in (activity.get("government_entities") or [])
            ],
        }

    def money_label(self, filing: dict) -> str:
        """A filing's money, in the filing's own words about what it reported."""
        expenses = filing.get("expenses")
        income = filing.get("income")
        if expenses is None and income is None:
            return "no amount reported"
        method = FILING_TYPE_LABELS.get(filing.get("filing_type") or "", filing.get("filing_type") or "")
        parts = []
        if expenses is not None:
            parts.append(f"expenses ${expenses:,.0f}")
        if income is not None:
            parts.append(f"income ${income:,.0f}")
        suffix = f" ({method})" if method else ""
        return " and ".join(parts) + suffix

    @staticmethod
    def freshness() -> str:
        """Filings are posted daily and never revised, so freshness is when we read."""
        return utc_now_iso()


def _lobbyist_count(activities: list) -> int:
    """How many distinct lobbyists a filing names across all of its issue areas."""
    names = set()
    for activity in activities:
        for entry in (activity.get("lobbyists") or []):
            person = entry.get("lobbyist") or {}
            name = " ".join(str(part) for part in (person.get("first_name"),
                                                   person.get("last_name")) if part)
            if name:
                names.add(name)
    return len(names)


def _to_float(value) -> float | None:
    if value in (None, "", "null"):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _to_int(value) -> int | None:
    if value in (None, "", "null"):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None
