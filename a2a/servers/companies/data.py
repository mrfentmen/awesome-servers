"""Read-only client for the GLEIF v1 API (the global Legal Entity Identifier index).

Endpoints (keyless, verified live 2026-09-28):
  - /lei-records?filter[entity.legalName]=…        search a legal entity by name
  - /lei-records?filter[lei]=…                     one record by its LEI
  - /lei-records?filter[ultimateParent.lei]=…      everything a parent owns
  - /lei-records/{lei}                             one record, no filter

Four things about this API shape the client:

1. Filters are bracket-named and only a few are allowed. `filter[entity.legalName]`,
   `filter[lei]`, `filter[entity.legalAddress.country]` and `filter[ultimateParent.lei]`
   all work; anything else answers HTTP 400 "Filter should contain only allowed values",
   so the filter name is chosen here and never passed through from a caller.
2. A record does not echo its parent. The parent link only exists as a query, so
   "who owns whom" is answered by filtering on the parent, not by reading a field.
3. `filter[entity.legalName]` is an exact match, not a search. A partial name finds
   nothing, so the name search widens to a `filter[entity.otherNames]` pass and then
   reports that it was a name guess rather than a name match.
4. Addresses nest: `entity.legalAddress.addressLines` is a list and `city`, `country`
   and `postalCode` are siblings of it, not members of it.

GLEIF is run by the Global Legal Entity Identifier Foundation. The index says an
entity holds an LEI; it does not say the entity is a real company, and a lapsed LEI
means the record stopped being renewed, not that the entity stopped existing.
"""

from __future__ import annotations

import re

from a2a_kit import JsonApiClient, UpstreamError, utc_now_iso

BASE_URL = "https://api.gleif.org/api/v1"
RECORDS_PATH = "/lei-records"

DATASET = "api.gleif.org/api/v1/lei-records"
PRODUCT = "GLEIF legal entity records (LEI)"

#: GLEIF's own status vocabulary, kept as the API writes it.
ENTITY_STATUSES = ("ACTIVE", "INACTIVE")
REGISTRATION_STATUSES = ("ISSUED", "LAPSED", "PENDING")

ENTITY_FIELDS = (
    "lei", "name", "status", "legal_form", "jurisdiction", "category", "sub_category",
    "registered_as", "other_names", "address", "country", "creation_date",
    "expiration_date", "expiration_reason",
)
#: What one subsidiary row carries in the group roll-up.
SUBSIDIARY_FIELDS = ("lei", "name", "status", "jurisdiction", "country", "registered_as")

_LEI_RE = re.compile(r"^[A-Z0-9]{18}[0-9]{2}$")
_NAME_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9 .,'’&/\-()]{0,90}$")
_COUNTRY_RE = re.compile(r"^[A-Z]{2}$")
#: GLEIF writes nulls as `null` and empty strings alike; both mean "not reported".
_MISSING = (None, "", "null")

__all__ = [
    "BASE_URL",
    "DATASET",
    "ENTITY_FIELDS",
    "ENTITY_STATUSES",
    "GleifClient",
    "PRODUCT",
    "RECORDS_PATH",
    "REGISTRATION_STATUSES",
    "SUBSIDIARY_FIELDS",
    "UpstreamError",
]


class GleifClient(JsonApiClient):
    env_prefix = "COMPANIES"
    base_url = BASE_URL
    #: GLEIF pages at 15 by default; ask for more so one call covers a real group.
    page_size = 100

    def __init__(self, fetch=None, base_url=None, cache_ttl=None, timeout=None, headers=None) -> None:
        super().__init__(fetch=fetch, base_url=base_url, cache_ttl=cache_ttl, timeout=timeout, headers=headers)
        #: The Golden Copy is republished daily, so a long TTL is honest.
        self.record_ttl = float(self.cache_ttl)

    # -- validation --------------------------------------------------------

    @staticmethod
    def check_lei(value) -> str:
        lei = str(value or "").strip().upper().replace(" ", "")
        if not _LEI_RE.match(lei):
            raise ValueError(
                "an LEI is 20 characters, 18 of them letters and digits then 2 check digits, "
                "for example 8I5DZWZKVSZI1NUHU748 (JPMorgan Chase & Co.)"
            )
        return lei

    @staticmethod
    def check_name(value) -> str:
        name = " ".join(str(value or "").split())
        if not name:
            raise ValueError("a company name is required, for example “JPMorgan Chase”")
        if not _NAME_RE.match(name):
            raise ValueError("that does not look like a company name")
        return name

    @staticmethod
    def check_country(value) -> str | None:
        if value in _MISSING:
            return None
        code = str(value).strip().upper()
        if not _COUNTRY_RE.match(code):
            raise ValueError("a country must be an ISO 3166-1 alpha-2 code, for example US or DE")
        return code

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

    def _query(self, filters: dict, limit: int) -> dict:
        params = {"page[size]": limit, **filters}
        payload = self.get_json(RECORDS_PATH, params, ttl=self.record_ttl)
        if not isinstance(payload, dict) or not isinstance(payload.get("data"), list):
            raise UpstreamError("GLEIF returned an unexpected record list payload")
        return payload

    # -- reads -------------------------------------------------------------

    def records(self, filters: dict, limit: int = 10) -> dict:
        """The raw query result, with the filter set and the total GLEIF holds."""
        limit = self.check_limit(limit)
        payload = self._query(filters, limit)
        pagination = (payload.get("meta") or {}).get("pagination") or {}
        return {
            "filters": filters,
            "total": _to_int(pagination.get("total")),
            "page_size": len(payload["data"]),
            "records": [self._summarise(row) for row in payload["data"][:limit]],
        }

    def by_name(self, name: str, limit: int = 10) -> dict:
        """Legal entities matching a registered name.

        `filter[entity.legalName]` is close to exact: GLEIF's own filter is tolerant
        of case and of a trailing period, so the name that comes back in the record
        is the one that is reported, not the spelling that was filtered on. A
        trailing period is still retried, because a name that is genuinely filed
        without one is a different string and a future filter may be stricter.
        """
        name = self.check_name(name)
        for candidate in self._name_variants(name):
            found = self.records({"filter[entity.legalName]": candidate}, limit)
            if found["records"]:
                found["query"] = name
                found["matched_name"] = found["records"][0].get("name")
                return found
        empty = self.records({"filter[entity.legalName]": name}, limit)
        empty["query"] = name
        empty["matched_name"] = None
        return empty

    @staticmethod
    def _name_variants(name: str) -> list[str]:
        """The name as given, then the same name with and without a trailing period."""
        variants = [name]
        if name.endswith("."):
            variants.append(name[:-1].strip())
        else:
            variants.append(f"{name}.")
        return [variant for variant in dict.fromkeys(variants) if variant]

    def by_lei(self, lei: str) -> dict | None:
        """One record by LEI, or None when GLEIF does not hold it.

        The `filter[lei]` form is used rather than `/lei-records/{lei}` because the
        direct path answers HTTP 404 for an LEI it does not know, which reads as an
        upstream failure; the filter answers 200 with an empty list, which is the
        same fact said honestly.
        """
        lei = self.check_lei(lei)
        found = self.records({"filter[lei]": lei}, limit=1)
        return found["records"][0] if found["records"] else None

    def children_of(self, lei: str, limit: int = 100) -> dict:
        """Every legal entity whose ultimate parent is this LEI."""
        lei = self.check_lei(lei)
        found = self.records({"filter[ultimateParent.lei]": lei}, limit)
        found["ultimate_parent"] = lei
        return found

    # -- shaping -----------------------------------------------------------

    def _summarise(self, row: dict) -> dict:
        """A record reduced to the fields the skills report, with nothing invented."""
        attributes = row.get("attributes") or {}
        summary = self.pick(self._flat(attributes.get("entity") or {}), ENTITY_FIELDS, DATASET)
        # The LEI sits beside `entity` in GLEIF's record, not inside it.
        summary["lei"] = attributes.get("lei")
        summary["registration"] = _registration(attributes, DATASET)
        return summary

    def _flat(self, entity: dict) -> dict:
        address = entity.get("legalAddress") or {}
        lines = [str(line) for line in (address.get("addressLines") or []) if line]
        legal_form = entity.get("legalForm") or {}
        other_names = [
            other.get("name") for other in (entity.get("otherNames") or [])
            if isinstance(other, dict) and other.get("name")
        ]
        expiration = entity.get("expiration") or {}
        return {
            "name": (entity.get("legalName") or {}).get("name") or None,
            "status": entity.get("status"),
            "legal_form": legal_form.get("id") if isinstance(legal_form, dict) else None,
            "jurisdiction": entity.get("jurisdiction"),
            "category": entity.get("category"),
            "sub_category": entity.get("subCategory"),
            "registered_as": entity.get("registeredAs"),
            "other_names": other_names,
            "address": ", ".join(lines + [str(part) for part in (
                address.get("city"), address.get("region"), address.get("postalCode"),
                address.get("country")) if part not in _MISSING]) or None,
            "country": address.get("country"),
            "creation_date": entity.get("creationDate"),
            "expiration_date": (expiration.get("date")
                                if isinstance(expiration, dict) else None),
            "expiration_reason": (expiration.get("reason")
                                  if isinstance(expiration, dict) else None),
        }

    def subsidiary_rows(self, records: list[dict]) -> list[dict]:
        """The subset of fields the group roll-up reports per subsidiary."""
        return [self.pick(row, SUBSIDIARY_FIELDS, DATASET) for row in records]

    def address_line(self, record: dict) -> str:
        return record.get("address") or "address not reported"

    @staticmethod
    def freshness() -> str:
        """GLEIF's Golden Copy is republished daily, so freshness is when we read it."""
        return utc_now_iso()


def _registration(attributes: dict, dataset: str | None = None) -> dict:
    """The registration block, which GLEIF keeps beside `entity` rather than inside it."""
    registration = attributes.get("registration") or {}
    return {
        "registration_status": registration.get("status"),
        "initial_registration_date": registration.get("initialRegistrationDate"),
        "last_update_date": registration.get("lastUpdateDate"),
        "next_renewal_date": registration.get("nextRenewalDate"),
        # GLEIF publishes the Local Operating Unit's LEI here, not its name.
        "managing_lou": registration.get("managingLou"),
        "corroboration_level": registration.get("corroborationLevel"),
        "dataset": dataset,
    }


def _to_int(value) -> int | None:
    if value in _MISSING:
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None
