"""Country indicators, from the World Bank's public API (keyless).

Verified live on 2026-09-28 on v2:

  /country/NGA/indicator/NY.GDP.MKTP.CD?format=json
      -> 200; Nigeria's GDP (current US$) for 2025 is 290794361542.112
  /country/NGA/indicator/NY.GDP.PCAP.CD?format=json&mrnev=1
      -> 200, one row: 2025, 1224.25410237743
  /country/NGA/indicator/NY.GDP.PCAP.CD?format=json&date=2015:2025&per_page=50
      -> 200, 11 rows, meta.lastupdated 2026-07-13
  /indicator?format=json&per_page=10&searchTerm=GDP%20per%20capita
      -> 200, but searchTerm is IGNORED: it answers with the first rows of the whole
         29544-indicator catalogue, poverty series from the LAC Equity Lab collection,
         whatever the term was. So a name search pages the WDI collection instead.
  /indicator?format=json&source=2&per_page=5000
      -> 200, all 1498 World Development Indicators in one 1.4 MB read
  /indicator/SP.DYN.LE00.IN?format=json
      -> 200, exactly one indicator: 'Life expectancy at birth, total (years)', WDI
  /country?format=json&per_page=5
      -> 200; every row has id, iso2Code, name and region, and the aggregates carry
         region.value == 'Aggregates'

Three things this reader keeps. `mrnev=1` is the newest *non-empty* value, which is the
one to quote: a plain request returns the newest year even when the value is null, and
"the 2025 figure" that does not exist is worse than "the 2024 figure". The country list
carries aggregates as well as countries, so a name is only resolved against the rows whose
region is not "Aggregates". And `searchTerm` on the indicator catalogue does not rank by
relevance - searching "GDP per capita" puts poverty-headcount series first - so the
catalogue is ranked here and the indicator id is always printed, because that id is the
only unambiguous way to ask again.
"""

from __future__ import annotations

import json
import os
import re
import time
from urllib import parse, request
from urllib.error import HTTPError

API = "https://api.worldbank.org/v2/"

DATASET = "World Bank Open Data (api.worldbank.org)"

DEFAULT_USER_AGENT = "awesome-acps-worldbank/1.0 (+https://github.com/mrfentmen/awesome-acps)"

#: An indicator id: two letters and at least two more parts, like NY.GDP.PCAP.CD or
#: SP.POP.TOTL. Three-part ids exist, so the last part cannot be assumed to be two letters.
INDICATOR_RE = re.compile(r"\b[A-Z]{2}\.[A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)+\b")
ISO3_RE = re.compile(r"\b[A-Z]{3}\b")

#: A country or an indicator phrase is a short question, not a paragraph.
MAX_TERM = 120

#: Indicators from the main World Development Indicators collection, source id 2.
WDI_SOURCE = "2"


class WorldBankError(RuntimeError):
    """The World Bank could not be read."""


class WorldBankNotFound(WorldBankError):
    """The API answered fine but has no such country, indicator or year."""


def indicator_from_text(text: str) -> str | None:
    """An indicator id in the API's own dotted form, e.g. NY.GDP.PCAP.CD."""
    match = INDICATOR_RE.search(str(text or "").upper())
    return match.group(0) if match else None


#: The two indicator ids a GDP question needs, spelled out because a question says "GDP"
#: and the catalogue has three different GDP measures. A GDP question with no qualifier
#: means the total, and "per capita" is the one that means per person.
GDP_TOTAL = "NY.GDP.MKTP.CD"
GDP_PER_CAPITA = "NY.GDP.PCAP.CD"


def indicator_default_for(text: str) -> str | None:
    """The indicator id a question names in plain words, or None to look one up.

    Only the GDP family is spelled out here, because those two ids are what a person
    means by "GDP" and "GDP per capita". Anything else is resolved against the real
    indicator catalogue rather than guessed at from a table in this file.
    """
    lowered = f" {str(text or '').lower()} "
    if re.search(r"\bgdp\b", lowered) or "gross domestic product" in lowered:
        return GDP_PER_CAPITA if re.search(r"\bper capita\b|\bper person\b", lowered) else GDP_TOTAL
    return None


#: Words a question is made of that are not its subject. Deliberately does not include
#: "at" or "and": "life expectancy at birth" is the subject, and cutting at them would
#: break exactly the phrase the catalogue holds.
_SUBJECT_STOPWORDS = frozenset("""
show give tell find look up list get what whats what's which how much many fast is are was
were does do can could would me us please the a an of in for during since between and or
per capita gdp gross domestic product has have had it its there that this my our their by
on at over last past years year than versus vs against with about compare comparison rank
ranking growth rate growing trend trending value values figure figures number numbers data
statistic statistics indicator indicators series please
""".split())


def subject_from_text(text: str, countries: list[str] | None = None) -> str | None:
    """What a question is about, once the place, the time and the wording are taken out.

    "show me New Zealand population over the past 20 years" is about *population*:
    New Zealand is where, the year window is when, and what is left is the subject. The
    caller passes the country names it already found so they are not mistaken for subject.
    """
    work = str(text or "").strip()
    if not work:
        return None
    quoted = re.findall(r'"([^"]{2,80})"', work)
    if quoted:
        return quoted[0].strip()
    subject = INDICATOR_RE.sub(" ", work)
    for name in (countries or []):
        subject = re.sub(re.escape(str(name)), " ", subject, flags=re.IGNORECASE)
    words = []
    for word in re.findall(r"[A-Za-z][A-Za-z%'&.,-]*", subject):
        #: "Nigeria's" leaves an "s" behind once the country name is cut out.
        cleaned = word.strip(".,'").lower()
        if len(cleaned) < 2 or cleaned in _SUBJECT_STOPWORDS:
            continue
        words.append(cleaned)
    return " ".join(words)[:MAX_TERM] or None


def country_from_text(text: str) -> str | None:
    """A country name, an ISO3 code or a bare adjective, out of a question.

    The World Bank country list is the authority for this, so a name this cannot match is
    a name the registry does not carry; but the obvious codes and the words a person
    actually types ("Nigeria", "the States") are worth catching before the lookup.
    """
    work = str(text or "").strip()
    if not work:
        return None
    quoted = re.findall(r'"([^"]{2,60})"', work)
    if quoted:
        return quoted[0].strip()
    for match in re.finditer(r"\b(us|usa|united states|uk|uae)\b", work, re.IGNORECASE):
        return {"us": "United States", "usa": "United States",
                "united states": "United States", "uk": "United Kingdom",
                "uae": "United Arab Emirates"}[match.group(1).lower()]
    return None


class WorldBankData:
    """One indicator value, a series, a comparison, and the two lookups behind them."""

    def __init__(self, fetch=None, cache_ttl: float = 86400.0, timeout: float = 40.0,
                 user_agent: str | None = None) -> None:
        self.cache_ttl = float(os.environ.get("WORLDBANK_CACHE_TTL", cache_ttl))
        self.timeout = float(os.environ.get("WORLDBANK_HTTP_TIMEOUT", timeout))
        self.user_agent = (user_agent or os.environ.get("WORLDBANK_USER_AGENT")
                           or DEFAULT_USER_AGENT)
        self._fetch = fetch or self._http_text
        self._cache: dict[str, tuple[float, object]] = {}

    # -- transport ---------------------------------------------------------

    def _http_text(self, url: str, params: dict | None = None) -> str:
        query = f"{url}?{parse.urlencode(params, doseq=True)}" if params else url
        req = request.Request(query, headers={"User-Agent": self.user_agent, "Accept": "*/*"})
        try:
            with request.urlopen(req, timeout=self.timeout) as resp:
                return resp.read().decode("utf-8", "replace")
        except HTTPError as exc:
            raise WorldBankNotFound(f"the World Bank answered HTTP {exc.code}") from exc
        except Exception as exc:  # urllib raises many other types too
            raise WorldBankError(f"request failed: {exc}") from exc

    def _rows(self, path: str, params: dict, ttl: float | None = None) -> tuple[dict, list]:
        """One v2 call: the metadata object and the data rows."""
        key = path + "?" + parse.urlencode(params, doseq=True)
        now = time.time()
        hit = self._cache.get(key)
        if hit and hit[0] > now:
            return hit[1]
        payload = self._fetch(API + path, params)
        if isinstance(payload, (str, bytes)):
            try:
                payload = json.loads(payload)
            except ValueError as exc:
                raise WorldBankError(
                    f"the World Bank returned something that is not JSON: {exc}") from exc
        if not isinstance(payload, list) or len(payload) < 2 or payload[0] is None:
            raise WorldBankNotFound("the World Bank returned no data for that")
        meta, rows = payload[0], payload[1] or []
        self._cache[key] = (now + (ttl if ttl is not None else self.cache_ttl), (meta, rows))
        return meta, rows

    # -- lookups -----------------------------------------------------------

    def countries(self) -> list[dict]:
        """Every country the API carries, aggregates excluded."""
        _, rows = self._rows("country", {"format": "json", "per_page": 500},
                             ttl=604800.0)
        out = []
        for row in rows:
            region = ((row.get("region") or {}).get("value") or "")
            if region == "Aggregates":
                #: "Africa Eastern and Southern" is not a country and must never answer
                #: a question about one.
                continue
            out.append({"iso3": row.get("id"), "iso2": row.get("iso2Code"),
                        "name": row.get("name"), "region": region.strip() or None,
                        "income": (row.get("incomeLevel") or {}).get("value"),
                        "capital": (row.get("capitalCity") or "") or None,
                        "longitude": row.get("longitude"), "latitude": row.get("latitude")})
        out.sort(key=lambda item: str(item["name"] or ""))
        return out

    def country(self, name_or_code: str) -> dict:
        """One country by name, ISO3 code or ISO2 code."""
        wanted = str(name_or_code or "").strip()
        if not wanted:
            raise ValueError("tell me which country, for example Nigeria")
        catalog = self.countries()
        needle = re.sub(r"[^a-z0-9]", "", wanted.lower())
        for row in catalog:
            if str(row["iso3"] or "").upper() == wanted.upper():
                return row
            if str(row["iso2"] or "").upper() == wanted.upper():
                return row
        matches = [row for row in catalog
                   if re.sub(r"[^a-z0-9]", "", str(row["name"] or "").lower()) == needle]
        if not matches:
            matches = [row for row in catalog
                       if needle and needle in re.sub(r"[^a-z0-9]", "",
                                                      str(row["name"] or "").lower())]
        if not matches:
            raise WorldBankNotFound(
                f"the World Bank has no country called {wanted!r}. It carries "
                f"{len(catalog)} countries.")
        return min(matches, key=lambda item: len(str(item["name"] or "")))

    def indicator(self, code: str) -> dict:
        """One indicator's own record: name, unit, source and note.

        Read from the single-indicator path. The list endpoint's `id` filter is ignored in
        the same way `searchTerm` is, so asking the list for one id returns the catalogue's
        first rows instead.
        """
        text = indicator_from_text(code) or str(code or "").strip().upper()
        if not text:
            raise ValueError("tell me which indicator, for example NY.GDP.PCAP.CD")
        _, rows = self._rows(f"indicator/{text}", {"format": "json"}, ttl=604800.0)
        for row in rows:
            if str(row.get("id") or "").upper() == text:
                return _indicator(row)
        raise WorldBankNotFound(f"the World Bank has no indicator with id {text!r}")

    def search_indicators(self, term: str, limit: int = 8) -> dict:
        """Indicators whose name matches a phrase, ranked here because the API cannot.

        The whole World Development Indicators collection is 1498 rows and comes in one
        1.4 MB read, which is cached for a day, so the ranking is done over all of them
        rather than over whatever `searchTerm` happened to return.
        """
        wanted = str(term or "").strip()
        if not wanted:
            raise ValueError("tell me what to look for, for example life expectancy")
        meta, rows = self._rows("indicator", {"format": "json", "source": WDI_SOURCE,
                                              "per_page": 5000}, ttl=86400.0)
        words = [word.lower() for word in re.findall(r"[A-Za-z0-9%]+", wanted) if len(word) > 1]
        if not words:
            raise ValueError("tell me what to look for, for example life expectancy")
        hits = [row for row in rows if _indicator_rank(row, words)[0] == 0]
        ranked = sorted(hits, key=lambda row: _indicator_rank(row, words))
        return {"term": wanted, "indicators": [_indicator(row) for row in ranked[:limit]],
                "read": len(rows), "total": (meta.get("total") or len(rows)),
                "matched": len(hits), "source": DATASET}

    # -- values ------------------------------------------------------------

    def value(self, country: str, indicator: str) -> dict:
        """The newest non-empty value of one indicator for one country."""
        place = self.country(country)
        code = indicator_from_text(indicator) or str(indicator or "").strip().upper()
        if not code:
            raise ValueError("tell me which indicator, for example NY.GDP.PCAP.CD")
        meta, rows = self._rows(f"country/{place['iso3']}/indicator/{code}",
                                {"format": "json", "mrnev": 1})
        for row in rows:
            if row.get("value") is not None:
                return {"country": place, "indicator": _indicator_of(row),
                        "year": str(row.get("date")), "value": row.get("value"),
                        "unit": (row.get("indicator") or {}).get("value"),
                        "source_updated": meta.get("lastupdated"), "source": DATASET}
        raise WorldBankNotFound(
            f"the World Bank has no value for {code} in {place['name']}")

    def series(self, country: str, indicator: str, years: int = 10) -> dict:
        """One country's values over a window, oldest first."""
        place = self.country(country)
        code = indicator_from_text(indicator) or str(indicator or "").strip().upper()
        if not code:
            raise ValueError("tell me which indicator, for example NY.GDP.PCAP.CD")
        span = max(2, min(int(years), 60))
        end = self._default_year()
        start = end - span + 1
        meta, rows = self._rows(f"country/{place['iso3']}/indicator/{code}",
                                {"format": "json", "date": f"{start}:{end}",
                                 "per_page": 500})
        values = [{"year": str(row.get("date")), "value": row.get("value")}
                  for row in rows if row.get("value") is not None]
        if not values:
            raise WorldBankNotFound(
                f"the World Bank has no {code} for {place['name']} between {start} and {end}")
        values.sort(key=lambda row: row["year"])
        return {"country": place, "indicator": _indicator_of(rows[0]), "values": values,
                "asked_years": span, "from": start, "to": end,
                "missing_years": len(values) < span,
                "source_updated": meta.get("lastupdated"), "source": DATASET}

    def compare(self, countries: list[str], indicator: str) -> dict:
        """The newest non-empty value of one indicator for several countries."""
        wanted = [str(name).strip() for name in (countries or []) if str(name).strip()]
        if not wanted:
            raise ValueError("tell me which countries to compare")
        if len(wanted) > 12:
            raise ValueError("compare at most twelve countries at a time")
        code = indicator_from_text(indicator) or str(indicator or "").strip().upper()
        if not code:
            raise ValueError("tell me which indicator, for example NY.GDP.PCAP.CD")
        rows = []
        problems = []
        for name in wanted:
            try:
                rows.append(self.value(name, code))
            except WorldBankError as exc:
                problems.append(f"{name}: {exc}")
        if not rows:
            raise WorldBankNotFound("; ".join(problems)
                                    or f"no country in that list has {code}")
        rows.sort(key=lambda row: (row["value"] is None, -(row["value"] or 0)))
        return {"indicator_id": code, "indicator_name": rows[0]["indicator"]["name"],
                "rows": rows, "not_reported": problems, "source": DATASET}

    @staticmethod
    def _default_year() -> int:
        import datetime

        return datetime.date.today().year


def _indicator_of(row: dict) -> dict:
    entry = row.get("indicator") or {}
    return {"id": entry.get("id"), "name": entry.get("value")}


def _indicator(row: dict) -> dict:
    """One catalogue entry, with its source and note kept for the answer."""
    source = row.get("source") or {}
    note = str(row.get("sourceNote") or "").strip()
    if len(note) > 300:
        note = note[:297].rstrip() + "..."
    return {"id": row.get("id"), "name": row.get("name"),
            "unit": row.get("unit") or None,
            "source": source.get("value") or None,
            "source_id": source.get("id"),
            "source_organization": row.get("sourceOrganization") or None,
            "topics": [str(topic) for topic in (row.get("topics") or []) if topic],
            "note": note or None}


def _indicator_rank(row: dict, words: list[str]) -> tuple:
    """How well a catalogue entry matches the words asked for.

    The API's `searchTerm` is not a relevance search - it returns poverty series for
    "GDP per capita" - so the ranking is done here: every word present first, then how
    many, then the main WDI collection, then the shortest name.
    """
    name = str(row.get("name") or "").lower()
    hits = sum(1 for word in words if word in name)
    source = (row.get("source") or {}).get("id")
    #: A question says "population", not "population, male". A total beats a sub-breakdown
    #: of the same measure, and a US-dollar measure beats a local-currency one when both
    #: match, because that is the one a person can compare.
    subtotal = 1 if any(word in name for word in ("male", "female")) else 0
    #: "population" is "Population, total", not "Rural population" or "Coverage of
    #: unemployment benefits": in this collection the total is the name that starts with
    #: the words asked for and carries ", total".
    total = 0 if (name.startswith(" ".join(words)) and ", total" in name) or name == " ".join(words) else 1
    #: A local-currency figure cannot be compared between countries, so the US-dollar one
    #: wins when both match.
    dollars = 0 if ("us$" in name or "usd" in name) else 1
    return (0 if hits == len(words) else 1, -hits, 0 if str(source) == WDI_SOURCE else 1,
            subtotal, total, dollars, len(name), name)
