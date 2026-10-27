"""What the federal government spent, from USAspending's public API (keyless).

Verified live on 2026-09-28:

  GET  /api/v2/references/toptier_agencies/
      -> 200, every top-tier agency with outlay_amount, obligated_amount and
         budget_authority_amount for the active fiscal year (2026, Q4). That table is
         the only agency source here: /api/v2/references/agency/{code}/ answers 200 but
         is keyed by an internal id, not by the top-tier code (097 gives Department of
         Agriculture and 075 gives Executive Office of the President, where the top-tier
         table says Defense and HHS), so its fields are never merged into a row.
  POST /api/v2/search/spending_by_award/
      -> 200. The award search is POST-only: a GET answers HTTP 405. The filters that
         work are time_period, award_type_codes, recipient_search_text and keywords, and
         the body takes `sort`/`order`, so "biggest first" is the server's ordering and
         not something this reader sorts itself. page_metadata.hasNext says whether
         there is another page.

Two traps worth naming. `filters.agencies` rejects the field this reader tried
(`toptier_code`) with HTTP 400, so an award search here is filtered by recipient or
keyword, never by agency - an agency question goes to the reference endpoint, which
does report one agency's whole-book numbers. And the API's own `messages` field carries
a real limit: award searches only reach back to 2007-10-01.
"""

from __future__ import annotations

import datetime
import json
import os
import re
import time
from urllib import error as urlerror
from urllib import request

API = "https://api.usaspending.gov/api/v2/"

SITE = "https://www.usaspending.gov"

DATASET = "USAspending (api.usaspending.gov)"

DEFAULT_USER_AGENT = "awesome-acps-spending/1.0 (+https://github.com/mrfentmen/awesome-acps)"

#: The award-type codes the search accepts. A, B, C and D are the four award kinds
#: (contracts, grants, loans, direct payments); anything else and the API 422s.
AWARD_TYPE_CODES = ("A", "B", "C", "D")

#: The award fields this reader asks for. The API returns exactly these keys.
AWARD_FIELDS = ("Award ID", "Recipient Name", "Award Amount", "Awarding Agency",
                "Awarding Sub Agency", "Description", "Start Date", "End Date",
                "Award Type", "Place of Performance State Code",
                "Recipient Location State Code")

#: USAspending's own message says award searches only reach back this far.
EARLIEST_AWARD_DATE = "2007-10-01"

#: One page is 100 awards, the largest the search accepts.
PAGE_LIMIT = 100

#: A recipient name is a short phrase, not a paragraph.
MAX_RECIPIENT = 120
MAX_KEYWORD = 120
MAX_AGENCY = 120


class SpendingError(RuntimeError):
    """USAspending could not be read."""


class SpendingNotFound(SpendingError):
    """The API answered fine but matched nothing - a real 'nothing here', not a failure."""


def fiscal_year_dates(fiscal_year: int) -> tuple[str, str]:
    """A federal fiscal year as the API's date window: FY2024 is 2023-10-01..2024-09-30."""
    year = int(fiscal_year)
    return f"{year - 1}-10-01", f"{year}-09-30"


def current_fiscal_year(today: datetime.date | None = None) -> int:
    """The federal fiscal year in progress. The year rolls over on 1 October."""
    day = today or datetime.date.today()
    return day.year + 1 if day.month >= 10 else day.year


def last_full_fiscal_year(today: datetime.date | None = None) -> int:
    """The last fiscal year that has actually ended, which is the sane default window."""
    return current_fiscal_year(today) - 1


def fiscal_year_from_text(text: str) -> int | None:
    """A four-digit year, or an "fy2024" - as a federal fiscal year."""
    match = re.search(r"(?i)\b(?:fy\s*)?((?:19|20)\d{2})\b", str(text or ""))
    if not match:
        return None
    year = int(match.group(1))
    if year < 1936 or year > current_fiscal_year():
        return None
    return year


def money(value) -> float | None:
    """USAspending sends amounts as strings. Anything unusable is None, not zero."""
    if value is None or value == "":
        return None
    try:
        return float(str(value).replace(",", "").replace("$", ""))
    except (TypeError, ValueError):
        return None


def sum_money(values) -> float:
    """A total over the amounts that parsed. Missing amounts are skipped, not zeroed."""
    return round(sum(value for value in values if value is not None), 2)


class SpendingData:
    """Federal award search, and the agency reference tables."""

    def __init__(self, fetch=None, cache_ttl: float = 1800.0, timeout: float = 45.0,
                 user_agent: str | None = None) -> None:
        self.cache_ttl = float(os.environ.get("SPENDING_CACHE_TTL", cache_ttl))
        self.timeout = float(os.environ.get("SPENDING_HTTP_TIMEOUT", timeout))
        self.user_agent = (user_agent or os.environ.get("SPENDING_USER_AGENT")
                           or DEFAULT_USER_AGENT)
        self._fetch = fetch or self._http
        self._cache: dict[str, tuple[float, object]] = {}

    # -- transport ---------------------------------------------------------

    def _headers(self, post: bool) -> dict:
        headers = {"User-Agent": self.user_agent, "Accept": "application/json"}
        if post:
            headers["Content-Type"] = "application/json"
        return headers

    def _http(self, url: str, payload: dict | None = None) -> str:
        body = None
        method = "GET"
        if payload is not None:
            body = json.dumps(payload).encode("utf-8")
            method = "POST"
        req = request.Request(url, data=body, headers=self._headers(payload is not None),
                              method=method)
        try:
            with request.urlopen(req, timeout=self.timeout) as resp:
                return resp.read().decode("utf-8", "replace")
        except urlerror.HTTPError as exc:
            raise SpendingNotFound(f"USAspending answered HTTP {exc.code}") from exc
        except Exception as exc:  # urllib raises many other types too
            raise SpendingError(f"request failed: {exc}") from exc

    def _read(self, key: str, path: str, payload: dict | None = None,
              ttl: float | None = None) -> dict:
        now = time.time()
        hit = self._cache.get(key)
        if hit and hit[0] > now:
            return hit[1]
        raw = self._fetch(API + path, payload)
        if isinstance(raw, (str, bytes)):
            try:
                body = json.loads(raw)
            except ValueError as exc:
                raise SpendingError(
                    f"USAspending returned something that is not JSON: {exc}") from exc
        else:
            body = raw
        if not isinstance(body, dict):
            raise SpendingError("USAspending returned an unexpected payload")
        self._cache[key] = (now + (ttl if ttl is not None else self.cache_ttl), body)
        return body

    # -- agency reference tables -------------------------------------------

    def agencies(self) -> dict:
        """Every top-tier agency with its outlays, obligations and budget authority."""
        body = self._read("toptier", "references/toptier_agencies/", ttl=21600.0)
        rows = []
        for item in (body.get("results") or []):
            name = str(item.get("agency_name") or "").strip()
            if not name:
                continue
            rows.append({
                "name": name,
                "abbreviation": item.get("abbreviation"),
                "toptier_code": item.get("toptier_code"),
                "agency_id": item.get("agency_id"),
                "fiscal_year": str(item.get("active_fy") or "not reported"),
                "quarter": item.get("active_fq"),
                "outlay": money(item.get("outlay_amount")),
                "obligated": money(item.get("obligated_amount")),
                "budget_authority": money(item.get("budget_authority_amount")),
            })
        rows.sort(key=lambda row: (row["obligated"] is None, -(row["obligated"] or 0)))
        return {"agencies": rows, "count": len(rows), "source": DATASET}

    def agency(self, name: str) -> dict:
        """One agency by name or abbreviation, with its whole-book numbers.

        Only the top-tier table is read. `/references/agency/{code}/` exists and answers
        200, but it is keyed by an internal id and not by the top-tier code: it answers
        "Department of Agriculture" for 097 and "Executive Office of the President" for
        075, while the top-tier table says 097 is Defense and 075 is HHS. Merging its
        `mission` paragraph in would print another agency's mission under this one's
        name, so it is not merged.
        """
        wanted = re.sub(r"(?i)^the\s+", "", str(name or "").strip())
        if not wanted:
            raise ValueError("tell me which agency, for example Department of Defense")
        directory = self.agencies()
        needle = re.sub(r"\s+", " ", wanted).lower()
        matches = [row for row in directory["agencies"]
                   if needle in (row["name"] or "").lower()
                   or needle == (row["abbreviation"] or "").lower()]
        if not matches:
            matches = [row for row in directory["agencies"]
                       if needle in (row["abbreviation"] or "").lower()]
        if not matches:
            raise SpendingNotFound(
                f"USAspending has no top-tier agency called {wanted!r}. It lists "
                f"{directory['count']} top-tier agencies.")
        row = dict(min(matches, key=lambda item: len(item["name"])))
        row["url"] = f"{SITE}/agency/{row.get('toptier_code')}" if row.get("toptier_code") else SITE
        row["source"] = DATASET
        return row

    # -- award search -------------------------------------------------------

    def _award_body(self, fiscal_year: int, recipient: str | None, keyword: str | None,
                    page: int, limit: int, sort: str = "Award Amount",
                    order: str = "desc") -> dict:
        start, end = fiscal_year_dates(fiscal_year)
        filters: dict = {
            "time_period": [{"start_date": start, "end_date": end}],
            "award_type_codes": list(AWARD_TYPE_CODES),
        }
        if recipient:
            filters["recipient_search_text"] = [recipient]
        if keyword:
            filters["keywords"] = [keyword]
        return {
            "filters": filters,
            "fields": list(AWARD_FIELDS),
            "limit": int(limit),
            "page": int(page),
            "sort": sort,
            "order": order,
            "subawards": False,
        }

    def awards(self, fiscal_year: int, recipient: str | None = None, keyword: str | None = None,
               limit: int = 10) -> dict:
        """Awards matching a recipient and/or a keyword, biggest first."""
        year = int(fiscal_year)
        if not 1936 <= year <= current_fiscal_year():
            raise ValueError(f"fiscal year {year} is not a year USAspending has")
        wanted = max(1, min(int(limit), PAGE_LIMIT))
        if not recipient and not keyword:
            raise ValueError("tell me a recipient or a topic to search awards for")
        start, end = fiscal_year_dates(year)
        body = self._read(f"awards:{year}:{recipient}:{keyword}:1:{wanted}",
                          "search/spending_by_award/",
                          self._award_body(year, recipient, keyword, 1, wanted))
        rows = [_award(item) for item in (body.get("results") or [])]
        if not rows:
            raise SpendingNotFound(
                f"no award matched in fiscal year {year}"
                + (f" for recipient {recipient!r}" if recipient else "")
                + (f" with keyword {keyword!r}" if keyword else ""))
        metadata = body.get("page_metadata") or {}
        return {"fiscal_year": year, "window": {"start": start, "end": end},
                "recipient": recipient, "keyword": keyword, "rows": rows,
                "count": len(rows), "asked_for": wanted,
                "more_pages": bool(metadata.get("hasNext")),
                "messages": [str(m) for m in (body.get("messages") or [])],
                "source": DATASET}

    def recipient_awards(self, recipient: str, fiscal_year: int, limit: int = 10) -> dict:
        """One recipient's awards in a fiscal year, biggest first."""
        text = str(recipient or "").strip()
        if not text:
            raise ValueError("tell me which recipient, for example Lockheed Martin")
        found = self.awards(fiscal_year, recipient=text[:MAX_RECIPIENT], limit=limit)
        found["total_shown"] = sum_money(row["amount"] for row in found["rows"])
        return found

    def top_awards(self, fiscal_year: int, limit: int = 10,
                   state: str | None = None) -> dict:
        """The largest awards of a fiscal year, with no recipient or keyword filter.

        The state filter is applied to the rows that came back rather than sent to the
        API, because `spending_by_award` takes no place-of-performance filter. So a state
        question answers "of the N largest awards, these are the ones in TX", which is
        true of what was read and is never dressed up as a national total.
        """
        year = int(fiscal_year)
        if not 1936 <= year <= current_fiscal_year():
            raise ValueError(f"fiscal year {year} is not a year USAspending has")
        wanted = max(1, min(int(limit), PAGE_LIMIT))
        start, end = fiscal_year_dates(year)
        body = self._read(f"top:{year}:{state}:{wanted}", "search/spending_by_award/",
                          self._award_body(year, None, None, 1, wanted))
        rows = [_award(item) for item in (body.get("results") or [])]
        if not rows:
            raise SpendingNotFound(f"no award came back for fiscal year {year}")
        read = len(rows)
        code = (state or "").strip().upper() or None
        if code:
            kept = [row for row in rows if (row["place_state"] or "").upper() == code
                    or (row["recipient_state"] or "").upper() == code]
            if not kept:
                raise SpendingNotFound(
                    f"none of the {read} largest awards in fiscal year {year} was "
                    f"performed in or awarded to {code}. This reader filters the largest "
                    f"awards rather than searching all of them, so ask for a recipient or "
                    f"topic to search the whole year instead.")
            rows = kept
        metadata = body.get("page_metadata") or {}
        return {"fiscal_year": year, "window": {"start": start, "end": end}, "rows": rows,
                "count": len(rows), "state": code, "read": read,
                "more_pages": bool(metadata.get("hasNext")),
                "total_read": sum_money(row["amount"] for row in rows),
                "messages": [str(m) for m in (body.get("messages") or [])],
                "source": DATASET}

    def award_pages(self, recipient: str, fiscal_year: int, max_awards: int = 200) -> dict:
        """Up to `max_awards` of one recipient's awards, read page by page.

        This is the expensive read the free path never does: it follows hasNext as long
        as it is asked to, so the caller can aggregate a whole award book instead of
        looking at one page.
        """
        text = str(recipient or "").strip()
        if not text:
            raise ValueError("tell me which recipient, for example Lockheed Martin")
        year = int(fiscal_year)
        cap = max(1, min(int(max_awards), PAGE_LIMIT * 5))
        rows: list[dict] = []
        messages: list[str] = []
        pages_read = 0
        more_pages = False
        for page in range(1, 6):
            if len(rows) >= cap:
                break
            body = self._read(f"awards:{year}:{text}:{page}:{PAGE_LIMIT}",
                              "search/spending_by_award/",
                              self._award_body(year, text[:MAX_RECIPIENT], None, page, PAGE_LIMIT),
                              ttl=900.0)
            pages_read = page
            for item in (body.get("results") or []):
                rows.append(_award(item))
                if len(rows) >= cap:
                    break
            for message in (body.get("messages") or []):
                text_message = str(message)
                if text_message not in messages:
                    messages.append(text_message)
            more_pages = bool((body.get("page_metadata") or {}).get("hasNext"))
            if not more_pages:
                break
        if not rows:
            raise SpendingNotFound(f"no award came back for {text!r} in fiscal year {year}")
        return {"recipient": text, "fiscal_year": year, "rows": rows, "pages_read": pages_read,
                "asked_for": cap, "more_pages": more_pages, "messages": messages,
                "source": DATASET}


def _award(item: dict) -> dict:
    """One award row, flattened into the fields an answer prints."""
    description = str(item.get("Description") or "").strip()
    if len(description) > 200:
        description = description[:197].rstrip() + "..."
    return {
        "award_id": item.get("Award ID"),
        "recipient": item.get("Recipient Name"),
        "amount": money(item.get("Award Amount")),
        "agency": item.get("Awarding Agency"),
        "sub_agency": item.get("Awarding Sub Agency"),
        "description": description or None,
        "start": item.get("Start Date"),
        "end": item.get("End Date"),
        "award_type": item.get("Award Type"),
        "place_state": item.get("Place of Performance State Code"),
        "recipient_state": item.get("Recipient Location State Code"),
        "url": (f"{SITE}/award/{item['generated_internal_id']}/"
                if item.get("generated_internal_id") else SITE),
    }
