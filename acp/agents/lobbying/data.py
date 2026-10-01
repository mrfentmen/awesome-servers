"""Who lobbied Congress, from the Senate LDA's public filings API (keyless).

Verified live on 2026-09-28:

  https://lda.senate.gov/api/v1/filings/?registrant_name=Microsoft
      -> 301 to https://lda.gov/api/v1/filings/..., which answers 200. The old host
         redirects, so this reader uses lda.gov and never the redirecting name.
  .../filings/?filing_year=2024&filing_type=Q1
      -> count 18898, and the Q1 filings carry `income` (e.g. 30000.00)
  .../filings/?filing_year=2024&page_size=3
      -> count 96945; results come back oldest first, so the newest filing is on the last
         page, and `page_size` is capped at 25 by the API whatever you ask for
  .../filings/?filing_year=2024&q=trade       -> count 96945
  .../filings/?filing_year=2024&q=zzzznotathing -> count 96945
  .../filings/?filing_year=2024&issue=TRA      -> count 96945

Three things this reader keeps, and the first one is the important one. **`q` and `issue`
are silently ignored**: every combination above returns the same 96,945, which is the
whole year. The only filters that actually work are `filing_year`, `filing_type` and
`registrant_name`, so this reader never sends a topic filter - an answer that looks
filtered by topic and is not would be worse than saying the API cannot do it. Filing type
decides whether there is a number at all: a registration report (RR) carries no income or
expenses and the quarterly ones do, so an amount is only ever reported where the filing
carries one. `filing_type` takes exactly one value - a comma list is rejected with HTTP
400 - so a type is a parameter, not a list. And issue codes come from each filing's own
`lobbying_activities` (`general_issue_code` with `general_issue_code_display`), because
there is no issue catalogue to look a code up in: `/api/v1/issues/` answers HTTP 404.
"""

from __future__ import annotations

import json
import os
import re
import time
from urllib import parse, request
from urllib.error import HTTPError

#: lda.senate.gov 301-redirects here. Use the final name so no request pays for a redirect.
API = "https://lda.gov/api/v1/"

SITE = "https://lda.gov"

DATASET = "Senate Lobbying Disclosure Act filings (lda.gov)"

DEFAULT_USER_AGENT = "awesome-acps-lobbying/1.0 (+https://github.com/mrfentmen/awesome-acps)"

#: The API's own cap, whatever page_size you send.
PAGE_SIZE = 25

#: The filing types that report money, and the one that does not.
MONEY_TYPES = ("Q1", "Q2", "Q3", "YA", "MM", "MA", "2A", "1A")
FILING_TYPES = ("Q1", "Q2", "Q3", "Q4", "YY", "YA", "MM", "MA", "RR", "1A", "2A", "2B",
                "2C", "PP", "SA")

#: Paging a registrant stops here, so a question cannot turn into hundreds of requests.
MAX_PAGES = 20
MAX_FILINGS = PAGE_SIZE * MAX_PAGES

#: A name or a search phrase is a short question, not a paragraph.
MAX_TERM = 120


class LobbyingError(RuntimeError):
    """The LDA API could not be read."""


class LobbyingNotFound(LobbyingError):
    """The API answered fine but matched no filing - a real 'nothing here', not a failure."""


def money(value) -> float | None:
    """An amount as a float. Anything the filing did not report is None, not zero."""
    if value is None or value == "":
        return None
    try:
        return float(str(value).replace(",", "").replace("$", ""))
    except (TypeError, ValueError):
        return None


def sum_money(values) -> float:
    """A total over the amounts that parsed. Amounts the filing did not report are skipped."""
    return round(sum(value for value in values if value is not None), 2)


def years_from_text(text: str) -> list[int]:
    """The filing years a question asks about, newest first, capped at four."""
    found: list[int] = []
    for match in re.finditer(r"\b((?:19|20)\d{2})\b", str(text or "")):
        year = int(match.group(1))
        if 1999 <= year <= 2100 and year not in found:
            found.append(year)
    return found[:4]


def span_from_text(text: str) -> tuple[int, int]:
    """The window a question asks about as (from_year, to_year), newest year last."""
    years = years_from_text(text)
    if len(years) >= 2:
        return min(years), max(years)
    if len(years) == 1:
        return years[0], years[0]
    #: The previous calendar year, which is the last one whose filings are all in. The
    #: current year is only part-reported, and a count that changes as the year runs is
    #: worse than one that has finished.
    last = LobbyingData._default_year() - 1
    return last, last


class LobbyingData:
    """Filings by registrant, by topic, and the money on them."""

    def __init__(self, fetch=None, cache_ttl: float = 3600.0, timeout: float = 45.0,
                 user_agent: str | None = None) -> None:
        self.cache_ttl = float(os.environ.get("LOBBYING_CACHE_TTL", cache_ttl))
        self.timeout = float(os.environ.get("LOBBYING_HTTP_TIMEOUT", timeout))
        self.user_agent = (user_agent or os.environ.get("LOBBYING_USER_AGENT")
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
            raise LobbyingNotFound(f"the LDA API answered HTTP {exc.code}") from exc
        except Exception as exc:  # urllib raises many other types too
            raise LobbyingError(f"request failed: {exc}") from exc

    def _page(self, params: dict, ttl: float | None = None) -> dict:
        key = parse.urlencode(sorted(params.items()))
        now = time.time()
        hit = self._cache.get(key)
        if hit and hit[0] > now:
            return hit[1]
        payload = self._fetch(API + "filings/", params)
        if isinstance(payload, (str, bytes)):
            try:
                payload = json.loads(payload)
            except ValueError as exc:
                raise LobbyingError(
                    f"the LDA API returned something that is not JSON: {exc}") from exc
        if not isinstance(payload, dict):
            raise LobbyingError("the LDA API returned an unexpected payload")
        self._cache[key] = (now + (ttl if ttl is not None else self.cache_ttl), payload)
        return payload

    # -- reads -------------------------------------------------------------

    def filings(self, year: int, registrant: str | None = None,
                filing_type: str | None = None, page: int = 1) -> dict:
        """One page of filings, plus the corpus count for the same query.

        Only `filing_year`, `filing_type` and `registrant_name` are ever sent: `q` and
        `issue` are accepted by the API and ignored by it, so a filter that looks real and
        narrows nothing would make every count a lie.
        """
        params: dict = {"filing_year": int(year), "page": max(1, int(page)),
                        "page_size": PAGE_SIZE}
        if registrant:
            params["registrant_name"] = str(registrant)[:MAX_TERM]
        if filing_type:
            params["filing_type"] = filing_type
        payload = self._page(params, ttl=1800.0)
        rows = [_filing(item) for item in (payload.get("results") or [])]
        count = payload.get("count")
        return {"year": int(year), "registrant": registrant,
                "filing_type": filing_type, "rows": rows, "count": count,
                "read": len(rows), "page": params["page"],
                "more_pages": isinstance(count, int)
                and params["page"] * PAGE_SIZE < count,
                "source": DATASET}

    def registrant(self, name: str, year: int, limit: int = 10) -> dict:
        """One lobbyist's filings in a year, oldest first, with the money on them."""
        text = str(name or "").strip()
        if not text:
            raise ValueError("tell me which lobbyist or firm, for example Microsoft")
        found = self.filings(year, registrant=text, page=1)
        found["rows"] = found["rows"][:max(1, min(int(limit), PAGE_SIZE))]
        found["query_name"] = text
        if not found["rows"]:
            raise LobbyingNotFound(
                f"the Senate LDA holds no filing by {text!r} for {year}. The search matches "
                "part of the registered name, so try a shorter form.")
        found["issues"] = _issue_counts(found["rows"])
        found["lobbyists"] = _lobbyists(found["rows"])
        found["types"] = _type_counts(found["rows"])
        return found

    def by_type(self, filing_type: str, year: int, limit: int = 10) -> dict:
        """One kind of filing from a year, with the issues and names on that page."""
        code = str(filing_type or "").strip().upper()
        if code not in FILING_TYPES:
            raise ValueError(
                f"{code!r} is not a Senate filing type. Use one of "
                f"{', '.join(FILING_TYPES)}.")
        found = self.filings(year, filing_type=code, page=1)
        found["rows"] = found["rows"][:max(1, min(int(limit), PAGE_SIZE))]
        if not found["rows"]:
            raise LobbyingNotFound(
                f"the Senate LDA holds no {code} filing for {year}")
        found["issues"] = _issue_counts(found["rows"])
        found["lobbyists"] = _lobbyists(found["rows"])
        found["registrants"] = _registrant_names(found["rows"])
        return found

    def count(self, year: int, registrant: str | None = None,
              filing_type: str | None = None) -> dict:
        """How many filings match, without reading any of them."""
        found = self.filings(year, registrant=registrant, filing_type=filing_type, page=1)
        return {"year": int(year), "registrant": registrant, "filing_type": filing_type,
                "count": found["count"], "source": DATASET}

    def totals(self, registrant: str, from_year: int, to_year: int,
               max_filings: int = MAX_FILINGS) -> dict:
        """Every filing one registrant made over a window, added up.

        This is the expensive read the free path never does: it follows the API's own
        count through as many pages as it was asked for, so the totals cover the whole
        filing history in the window rather than the first page of it.
        """
        text = str(registrant or "").strip()
        if not text:
            raise ValueError("tell me which lobbyist or firm, for example Microsoft")
        first, last = int(from_year), int(to_year)
        if last < first:
            first, last = last, first
        cap = max(PAGE_SIZE, min(int(max_filings), MAX_FILINGS))
        rows: list[dict] = []
        issues: dict[str, int] = {}
        issue_names: dict[str, str] = {}
        lobbyists: dict[str, int] = {}
        income: list[float] = []
        expenses: list[float] = []
        by_type: dict[str, dict] = {}
        total_count = 0
        years_read: list[int] = []
        for year in range(first, last + 1):
            page = 1
            year_rows = 0
            while len(rows) < cap:
                payload = self.filings(year, registrant=text, page=page)
                if isinstance(payload["count"], int):
                    total_count = max(total_count, payload["count"]) if not years_read else \
                        total_count + payload["count"]
                batch = payload["rows"]
                if not batch:
                    break
                for row in batch:
                    if len(rows) >= cap:
                        break
                    rows.append(row)
                    year_rows += 1
                    if row.get("income") is not None:
                        income.append(row["income"])
                    if row.get("expenses") is not None:
                        expenses.append(row["expenses"])
                    entry = by_type.setdefault(
                        row.get("filing_type") or "not reported",
                        {"filings": 0, "income": 0.0, "expenses": 0.0,
                         "income_reported": 0, "expenses_reported": 0})
                    entry["filings"] += 1
                    if row.get("income") is not None:
                        entry["income"] += row["income"]
                        entry["income_reported"] += 1
                    if row.get("expenses") is not None:
                        entry["expenses"] += row["expenses"]
                        entry["expenses_reported"] += 1
                    for code, count in (row.get("issues") or {}).items():
                        issues[code] = issues.get(code, 0) + count
                        label = (row.get("issue_names") or {}).get(code)
                        if label and code not in issue_names:
                            issue_names[code] = label
                    for who, count in (row.get("lobbyists") or {}).items():
                        lobbyists[who] = lobbyists.get(who, 0) + count
                page += 1
                if not payload["more_pages"]:
                    break
            if year_rows:
                years_read.append(year)
            if len(rows) >= cap:
                break
        if not rows:
            raise LobbyingNotFound(
                f"the Senate LDA holds no filing by {text!r} between {first} and {last}")
        total_income = sum_money(income)
        total_expenses = sum_money(expenses)
        return {"registrant": text, "from_year": first, "to_year": last, "rows": rows,
                "filings_read": len(rows), "years_read": years_read,
                "filings_available": total_count, "asked_for": cap,
                "truncated": total_count > len(rows),
                "total_income": total_income, "total_expenses": total_expenses,
                "net": round(total_income - total_expenses, 2) if (income or expenses) else None,
                "filings_reporting_income": len(income),
                "filings_reporting_expenses": len(expenses),
                "by_type": [{"filing_type": key, **value}
                            for key, value in sorted(by_type.items(),
                                                     key=lambda item: -item[1]["filings"])],
                "issues": [{"code": code, "issue": issue_names.get(code, "name not reported"),
                            "count": count}
                           for code, count in sorted(issues.items(), key=lambda item: -item[1])],
                "lobbyists": [{"name": name, "count": count}
                              for name, count in sorted(lobbyists.items(),
                                                        key=lambda item: -item[1])],
                "source": DATASET}

    @staticmethod
    def _default_year() -> int:
        import datetime

        return datetime.date.today().year


def _filing(item: dict) -> dict:
    """One filing, flattened into the fields an answer prints."""
    registrant = item.get("registrant") or {}
    client = item.get("client") or {}
    activities = item.get("lobbying_activities") or []
    issues: dict[str, int] = {}
    issue_names: dict[str, str] = {}
    lobbyists: dict[str, int] = {}
    for activity in activities:
        if not isinstance(activity, dict):
            continue
        code = activity.get("general_issue_code")
        if code:
            issues[str(code)] = issues.get(str(code), 0) + 1
            label = activity.get("general_issue_code_display")
            if label and str(code) not in issue_names:
                issue_names[str(code)] = str(label)
        for entry in (activity.get("lobbyists") or []):
            person = (entry or {}).get("lobbyist") or {}
            name = " ".join(str(person.get(part) or "").strip()
                            for part in ("first_name", "last_name")).strip()
            if name:
                lobbyists[name] = lobbyists.get(name, 0) + 1
    return {
        "uuid": item.get("filing_uuid"),
        "registrant": registrant.get("name"),
        "registrant_city": registrant.get("city"),
        "registrant_state": registrant.get("state"),
        "client": client.get("name") or None,
        "client_government_entity": client.get("client_government_entity"),
        "filing_type": item.get("filing_type"),
        "filing_type_name": item.get("filing_type_display"),
        "period": item.get("filing_period_display"),
        "income": money(item.get("income")),
        "expenses": money(item.get("expenses")),
        "posted": str(item.get("dt_posted") or "")[:10] or None,
        "issues": issues,
        "issue_names": issue_names,
        "lobbyists": lobbyists,
        "document": item.get("filing_document_url"),
        "url": item.get("url") or (f"{API}filings/{item.get('filing_uuid')}/"
                                   if item.get("filing_uuid") else SITE),
    }


def _issue_counts(rows: list[dict]) -> list[dict]:
    """The issue codes on a set of filings, most-seen first, with the names the filings give.

    Read from the filings themselves: the API has no issue catalogue to look a code up in,
    and the name for a code only appears on a filing that used it.
    """
    counts: dict[str, int] = {}
    names: dict[str, str] = {}
    for row in rows:
        for code, count in (row.get("issues") or {}).items():
            counts[code] = counts.get(code, 0) + count
            label = (row.get("issue_names") or {}).get(code)
            if label and code not in names:
                names[code] = label
    return [{"code": code, "issue": names.get(code, "name not reported"), "count": count}
            for code, count in sorted(counts.items(), key=lambda item: (-item[1], item[0]))]


def _type_counts(rows: list[dict]) -> list[dict]:
    """Which kinds of filing a registrant made, and how many reported money."""
    counts: dict[str, dict] = {}
    for row in rows:
        code = row.get("filing_type") or "not reported"
        entry = counts.setdefault(code, {"filing_type": code, "filings": 0,
                                         "reported_expenses": 0, "reported_income": 0})
        entry["filings"] += 1
        if row.get("expenses") is not None:
            entry["reported_expenses"] += 1
        if row.get("income") is not None:
            entry["reported_income"] += 1
    return sorted(counts.values(), key=lambda item: -item["filings"])


def _lobbyists(rows: list[dict]) -> list[dict]:
    counts: dict[str, int] = {}
    for row in rows:
        for name, count in (row.get("lobbyists") or {}).items():
            counts[name] = counts.get(name, 0) + count
    return [{"name": name, "count": count} for name, count in
            sorted(counts.items(), key=lambda item: (-item[1], item[0]))]


def _registrant_names(rows: list[dict]) -> list[str]:
    names: list[str] = []
    for row in rows:
        name = row.get("registrant")
        if name and name not in names:
            names.append(name)
    return names
