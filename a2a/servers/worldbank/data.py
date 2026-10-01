"""Read-only client for the World Bank Indicators API (v2).

Endpoints (keyless, verified live 2026-09-28):
  - /country/{iso}/indicator/{code}   one indicator for one country
  - /country/{a;b;c}/indicator/{code} the same indicator for several countries
  - /country/{iso}                    country metadata (region, income level, capital)
  - /indicator                        the indicator catalogue, searchable

Four things about this API shape the client:

1. The answer is always a two-element list: `[metadata, rows]`. The metadata carries
   the page numbers and the total; a search that matched nothing still has a first
   element, so the rows are taken from index 1 only after checking for it.
2. A year with no data comes back as a row whose `value` is `null`, not as a missing
   row. Those are dropped here so "no data" and "not reported" never read as zero.
3. Several countries are one request joined by `;`, not N requests. That is why the
   comparison skill can afford a page of history per country.
4. `sourceid` is part of the metadata. WDI is source 2, and the catalogue mixes
   sources, so an indicator code is only unambiguous together with its source.
"""

from __future__ import annotations

import re

from a2a_kit import JsonApiClient, UpstreamError, utc_now_iso

BASE_URL = "https://api.worldbank.org/v2"
COUNTRY_PATH = "/country/{country}"
COUNTRY_INDICATOR_PATH = "/country/{country}/indicator/{indicator}"
COUNTRY_PATH_ALL = "/country"
INDICATOR_PATH = "/indicator"

DATASET = "api.worldbank.org/v2/country"
#: The country metadata endpoint is a different collection from the observations.
COUNTRY_DATASET = "api.worldbank.org/v2/country"
INDICATOR_DATASET = "api.worldbank.org/v2/indicator"
PRODUCT = "World Bank Indicators (WDI)"

#: The World Development Indicators, the collection every well-known NY.* code lives in.
WDI_SOURCE_ID = 2
SOURCE_NAME = "World Development Indicators"
#: What a year is allowed to look like. The API also takes a range "2010:2024".
YEAR_RE = re.compile(r"^\d{4}$")
YEAR_RANGE_RE = re.compile(r"^(\d{4}):(\d{4})$")
_ISO_RE = re.compile(r"^[A-Za-z]{2,3}$")
_CODE_RE = re.compile(r"^[A-Za-z0-9]+(\.[A-Za-z0-9_]+)*$")
#: Indicators are not in a fixed unit, so the shape is named rather than converted.
UNIT_KINDS = ("currency", "per-capita", "ratio", "percent", "index", "count", "text")

INDICATOR_FIELDS = ("id", "name", "unit", "source", "source_note", "source_organization", "topics")
COUNTRY_FIELDS = ("iso3", "iso2", "name", "region", "income_level", "lending_type",
                  "capital_city", "longitude", "latitude")

__all__ = [
    "BASE_URL",
    "COUNTRY_DATASET",
    "COUNTRY_FIELDS",
    "COUNTRY_INDICATOR_PATH",
    "COUNTRY_PATH",
    "COUNTRY_PATH_ALL",
    "DATASET",
    "INDICATOR_DATASET",
    "INDICATOR_FIELDS",
    "INDICATOR_PATH",
    "PRODUCT",
    "SOURCE_NAME",
    "UNIT_KINDS",
    "WDI_SOURCE_ID",
    "WorldBankClient",
    "UpstreamError",
    "YEAR_RANGE_RE",
    "YEAR_RE",
]


class WorldBankClient(JsonApiClient):
    env_prefix = "WORLDBANK"
    base_url = BASE_URL
    #: The API pages at 50; a year per country is what the trend skill needs.
    page_size = 100

    def __init__(self, fetch=None, base_url=None, cache_ttl=None, timeout=None, headers=None) -> None:
        super().__init__(fetch=fetch, base_url=base_url, cache_ttl=cache_ttl, timeout=timeout, headers=headers)
        #: Country and indicator lists change slowly: cache them for a day.
        self.catalogue_ttl = float(self.cache_ttl)
        #: WDI is 1,498 indicators, so one page holds the whole collection.
        self.catalogue_size = 20000
        #: The country list is about 300 rows including aggregates, so one page holds
        #: all of it; a truncated list would hide most countries from a name lookup.
        self.country_size = 500

    # -- validation --------------------------------------------------------

    @staticmethod
    def check_country(value) -> str:
        """One or more ISO country codes, uppercased and joined with `;`.

        Several countries are one request joined by `;`, so a list and an already
        joined string are both accepted and both come back joined.
        """
        if isinstance(value, str) and ";" in value:
            value = [part for part in value.split(";")]
        if isinstance(value, (list, tuple)):
            codes = [WorldBankClient.check_country(one) for one in value if one not in (None, "")]
            if not codes:
                raise ValueError("which country? Give me an ISO code, for example US, GB or DE")
            if len(codes) > 8:
                raise ValueError("compare at most 8 countries at a time")
            return ";".join(dict.fromkeys(codes))
        code = str(value or "").strip().upper()
        if not _ISO_RE.match(code):
            raise ValueError(
                "a country is an ISO code — 2 letters (US) or 3 (USA), or a World Bank "
                "aggregate like WLD or EUU"
            )
        return code

    @staticmethod
    def check_indicator(value) -> str:
        code = str(value or "").strip()
        if not code:
            raise ValueError("which indicator? Give me a World Bank code, for example NY.GDP.MKTP.CD")
        if not _CODE_RE.match(code) or len(code) > 64:
            raise ValueError(
                "an indicator code looks like NY.GDP.MKTP.CD — dot-separated parts, letters and digits"
            )
        return code

    @staticmethod
    def check_years(value, default: str = "2015:2024") -> str:
        """A year, or a `from:to` range, which is what the API's `date` filter takes."""
        if value in (None, ""):
            return default
        text = str(value).strip()
        # A bare year only. An unanchored year pattern also matches the first half of
        # "2015:2024", and that is a range, not a year.
        if len(text) == 4 and text.isdigit():
            return text
        # A caller may write the range with spaces around the colon.
        match = YEAR_RANGE_RE.match(re.sub(r"\s+", "", text))
        if not match:
            raise ValueError("years must be a year like 2020 or a range like 2015:2024")
        start, end = int(match.group(1)), int(match.group(2))
        if start > end:
            raise ValueError(f"the range must run forwards, not {start}:{end}")
        if end - start > 60:
            raise ValueError("a range may span at most 60 years")
        return f"{start}:{end}"

    @staticmethod
    def check_limit(value) -> int:
        try:
            limit = int(value)
        except (TypeError, ValueError):
            raise ValueError("limit must be a whole number") from None
        if not 1 <= limit <= 20:
            raise ValueError("limit must be between 1 and 20 (the API pages at 50 rows)")
        return limit

    @staticmethod
    def check_unit_kind(value) -> str | None:
        if value in (None, ""):
            return None
        kind = str(value).strip().lower()
        if kind not in UNIT_KINDS:
            raise ValueError(f"unit kind must be one of: {', '.join(UNIT_KINDS)}")
        return kind

    # -- transport ---------------------------------------------------------

    def _unpack(self, payload, what: str):
        """`[metadata, rows]` -> `(metadata, rows)`, or raise if the shape is wrong."""
        if not isinstance(payload, list) or len(payload) < 2:
            raise UpstreamError(f"the World Bank returned an unexpected {what} payload")
        metadata, rows = payload[0], payload[1]
        if isinstance(rows, dict):
            # A single-object request answers with a dict; make it a list of one.
            rows = [rows]
        if not isinstance(metadata, dict) or not isinstance(rows, list):
            raise UpstreamError(f"the World Bank returned an unexpected {what} payload")
        return metadata, rows

    # -- reads -------------------------------------------------------------

    def indicator_values(self, countries: str, indicator: str, years: str = "2015:2024",
                         limit: int = 20, source: int = WDI_SOURCE_ID) -> dict:
        """One indicator for one or more countries, most recent year first.

        `countries` is a `;`-joined list, which the API takes in a single request.
        """
        countries = self.check_country(countries)
        indicator = self.check_indicator(indicator)
        years = self.check_years(years)
        limit = self.check_limit(limit)
        payload = self.get_json(
            COUNTRY_INDICATOR_PATH.format(country=countries, indicator=indicator),
            {"format": "json", "date": years, "per_page": self.page_size, "source": source},
            ttl=self.cache_ttl,
        )
        metadata, rows = self._unpack(payload, "indicator")
        observations = [self._observation(row, indicator) for row in rows]
        observations = [row for row in observations if row is not None]
        return {
            "indicator_code": indicator,
            "indicator_name": _indicator_name(rows, indicator),
            "indicator_unit": observations[0]["unit"] if observations else None,
            "countries": [code for code in countries.split(";")],
            "years": years,
            "source_id": _to_int(metadata.get("sourceid")) or source,
            "last_updated": metadata.get("lastupdated"),
            "total_hits": _to_int(metadata.get("total")),
            "observations": observations[:limit],
        }

    def country_info(self, code: str) -> dict | None:
        """A country's name, region, income level, lending type and capital."""
        code = self.check_country(code)
        payload = self.get_json(
            COUNTRY_PATH.format(country=code), {"format": "json"}, ttl=self.catalogue_ttl
        )
        if not isinstance(payload, list) or len(payload) < 2 or not isinstance(payload[1], list):
            raise UpstreamError("the World Bank returned an unexpected country payload")
        rows = payload[1]
        if not rows:
            return None
        row = rows[0]
        return self.pick({
            "iso3": row.get("id"),
            "iso2": row.get("iso2Code"),
            "name": row.get("name"),
            "region": (row.get("region") or {}).get("value"),
            "income_level": (row.get("incomeLevel") or {}).get("value"),
            "lending_type": (row.get("lendingType") or {}).get("value"),
            "capital_city": row.get("capitalCity"),
            "longitude": _to_float(row.get("longitude")),
            "latitude": _to_float(row.get("latitude")),
        }, COUNTRY_FIELDS, COUNTRY_DATASET)

    def country_list(self) -> list[dict]:
        """Every country and aggregate the Bank reports on. Cached for a day."""
        payload = self.get_json(COUNTRY_PATH_ALL, {"format": "json", "per_page": self.country_size},
                                ttl=self.catalogue_ttl)
        if not isinstance(payload, list) or len(payload) < 2 or not isinstance(payload[1], list):
            raise UpstreamError("the World Bank returned an unexpected country list payload")
        return [self.pick({
            "iso3": row.get("id"),
            "iso2": row.get("iso2Code"),
            "name": row.get("name"),
            "region": (row.get("region") or {}).get("value"),
            "income_level": (row.get("incomeLevel") or {}).get("value"),
        }, ("iso3", "iso2", "name", "region", "income_level"), COUNTRY_DATASET)
                for row in payload[1]]

    def find_countries(self, needle: str | None = None, region: str | None = None,
                       limit: int = 10) -> list[dict]:
        """Countries whose code or name contains `needle`, optionally in one region."""
        limit = self.check_limit(limit)
        term = str(needle or "").strip().lower()
        want = str(region or "").strip().lower() or None
        matches = []
        for country in self.country_list():
            if term and term not in f"{country.get('iso3', '')} {country.get('name', '')}".lower():
                continue
            if want and str(country.get("region") or "").lower() != want:
                continue
            matches.append(country)
        return matches[:limit]

    def indicator_catalogue(self) -> list[dict]:
        """Every indicator in the WDI collection, in one request, cached for a day.

        The Bank's v2 indicator endpoint has no keyword filter at all — `search` is
        silently ignored and the page comes back in code order — so the collection is
        read once and searched here. WDI alone is about 1,500 indicators (1.4 MB);
        the whole catalogue across every collection is 29,544 and is not fetched.
        """
        payload = self.get_json(
            INDICATOR_PATH,
            {"format": "json", "per_page": self.catalogue_size, "source": WDI_SOURCE_ID},
            ttl=self.catalogue_ttl,
        )
        if not isinstance(payload, list) or len(payload) < 2 or not isinstance(payload[1], list):
            raise UpstreamError("the World Bank returned an unexpected indicator catalogue payload")
        return [self._catalogue_entry(row) for row in payload[1]]

    def search_indicators(self, term: str, limit: int = 10) -> dict:
        """Indicators in the WDI collection whose name, code, topic or note mentions `term`.

        Results are ranked by where the term appears, so the indicators actually named
        after what you asked for come first rather than whatever the page order was.
        """
        term = str(term or "").strip()
        if not term:
            raise ValueError("what are you looking for? Give me a word, for example “poverty”")
        if len(term) > 80:
            raise ValueError("that search term is too long — 80 characters at most")
        limit = self.check_limit(limit)
        lowered = term.lower()
        catalogue = self.indicator_catalogue()
        hits = []
        for entry in catalogue:
            rank = _match_rank(entry, lowered)
            if rank is None:
                continue
            hits.append({**entry, "match_rank": rank})
        hits.sort(key=lambda row: (row["match_rank"], row["id"] or ""))
        return {"term": term, "source_id": WDI_SOURCE_ID, "source_name": SOURCE_NAME,
                "catalogue_size": len(catalogue), "name_hits": sum(
                    1 for row in hits if row["match_rank"] == 0),
                "indicators": hits[:limit]}

    @staticmethod
    def freshness() -> str:
        """The Bank republishes WDI on a schedule, so freshness is when we read it."""
        return utc_now_iso()

    # -- shaping -----------------------------------------------------------

    def _catalogue_entry(self, row: dict) -> dict:
        """One catalogue row, flattened. Every field is the Bank's own text."""
        return {
            "id": row.get("id"),
            "name": row.get("name"),
            "unit": row.get("unit") or None,
            "source_id": (row.get("source") or {}).get("id"),
            "source_name": (row.get("source") or {}).get("value"),
            "topics": [str(topic.get("value")).strip()
                       for topic in (row.get("topics") or []) if topic.get("value")],
            "note": (row.get("sourceNote") or None),
            "organisation": (row.get("sourceOrganization") or None),
            "dataset": INDICATOR_DATASET,
        }

    def _observation(self, row: dict, indicator: str) -> dict | None:
        """One year of one country. A year the Bank has no value for is not a row."""
        value = _to_float(row.get("value"))
        if value is None:
            return None
        return {
            "country": (row.get("country") or {}).get("value"),
            "country_iso3": row.get("countryiso3code") or None,
            "indicator": (row.get("indicator") or {}).get("value") or indicator,
            "indicator_id": (row.get("indicator") or {}).get("id") or indicator,
            "year": row.get("date"),
            "value": value,
            "unit": row.get("unit") or None,
            "obs_status": row.get("obs_status") or None,
            "decimal": _to_int(row.get("decimal")),
            "dataset": COUNTRY_DATASET,
        }


def _match_rank(entry: dict, lowered: str) -> int | None:
    """Where the search term appears, best first. None means it does not appear."""
    if lowered in (entry.get("name") or "").lower():
        return 0
    if lowered in (entry.get("id") or "").lower():
        return 1
    if any(lowered in topic.lower() for topic in entry.get("topics") or []):
        return 2
    if lowered in (entry.get("note") or "").lower():
        return 3
    return None


def _indicator_name(rows: list, fallback: str) -> str:
    for row in rows:
        name = (row.get("indicator") or {}).get("value")
        if name:
            return name
    return fallback


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
