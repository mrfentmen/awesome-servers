"""Nonprofit filings, from ProPublica's Nonprofit Explorer API (keyless).

Verified live on 2026-09-28 on v2:

  /nonprofits/api/v2/search.json?q=red%20cross
      -> 200: total_results 190, 25 organisations per page, 8 pages, each with ein,
         strein, name, city, state, ntee_code, subseccd, have_filings, score
  /nonprofits/api/v2/organizations/581771391.json
      -> 200: the organisation's own record with revenue_amount 11554, income_amount
         15900, asset_amount 109299, tax_period 2025-09-01, ruling_date 2014-07-01
  /nonprofits/api/v2/search.json?q=red%20cross&page=99
      -> 404 with an empty organisation list: a page past the end is a real "no more"
  /nonprofits/api/v2/search.json?state=NY    -> HTTP 500
  /nonprofits/api/v2/search.json?ntee=P21    -> HTTP 500

Three things this reader keeps. The state and ntee filters are answered with HTTP 500, so
they are never sent - a filter the API errors on is a filter that cannot narrow anything.
The amounts are the IRS Business Master File figures for each organisation's *own* tax
period, and two organisations side by side are usually not reporting for the same year, so
every answer prints the tax period next to the number. And `filings_with_data` comes back
empty for every organisation tried, so this reader reports the Business Master File
amounts and says which file they come from rather than implying it read a Form 990.
"""

from __future__ import annotations

import json
import os
import re
import time
from urllib import error as urlerror
from urllib import parse, request

API = "https://projects.propublica.org/nonprofits/api/v2/"

SITE = "https://projects.propublica.org/nonprofits/organizations"

DATASET = "ProPublica Nonprofit Explorer (IRS Business Master File)"

DEFAULT_USER_AGENT = "awesome-acps-nonprofit/1.0 (+https://github.com/mrfentmen/awesome-acps)"

#: The search page size, which the API sets.
PAGE_SIZE = 25

#: Reading one organisation's own record is one request, so a peer read is capped.
MAX_PEERS = 25

#: An EIN is nine digits.
EIN_RE = re.compile(r"\b(\d{9})\b")

#: A name or a search phrase is a short question, not a paragraph.
MAX_TERM = 120


class NonprofitError(RuntimeError):
    """ProPublica could not be read."""


class NonprofitNotFound(NonprofitError):
    """The API answered fine but holds no such organisation - a real 'nothing here'."""


def ein_from_text(text: str) -> str | None:
    """An EIN, with or without its dash form."""
    work = str(text or "")
    dashed = re.search(r"\b(\d{2})-(\d{7})\b", work)
    if dashed:
        return dashed.group(1) + dashed.group(2)
    match = EIN_RE.search(work)
    return match.group(1) if match else None


def name_from_text(text: str) -> str | None:
    """A charity's name out of a question, with the question words dropped.

    A quoted phrase wins, and a dash-separated EIN counts as a name so that a comparison
    can be asked in EINs.
    """
    work = str(text or "").strip()
    if not work:
        return None
    for name in re.findall(r'"([^"]{2,120})"', work):
        return name.strip()
    match = re.search(r"(?i)\b(?:nonprofit|non-profit|charity|charitable|organisation|"
                      r"organization|org|foundation|corp|corporation|society|relief|"
                      r"fund|trust|church|red cross|for|by|about|does|did|is|are|report|"
                      r"revenue|raise|raises|raised|filing|filings)\s+"
                      r"(?:for\s+|of\s+|on\s+|about\s+|does\s+|did\s+)?"
                      r"(?:the\s+)?(.+?)\s*[?.!]*$", work)
    if not match:
        return None
    candidate = match.group(1).strip(" ,\"'")
    for noise in (r"(?i)\s+report\b.*$", r"(?i)\s+as revenue\b.*$", r"(?i)\s+filing\b.*$",
                  r"(?i)\s+please\b.*$", r"(?i)\s+and\s+.*$"):
        candidate = re.sub(noise, "", candidate).strip()
    return candidate[:MAX_TERM] or None


class NonprofitData:
    """The search, one organisation's record, and a page of peers."""

    def __init__(self, fetch=None, cache_ttl: float = 86400.0, timeout: float = 40.0,
                 user_agent: str | None = None) -> None:
        self.cache_ttl = float(os.environ.get("NONPROFIT_CACHE_TTL", cache_ttl))
        self.timeout = float(os.environ.get("NONPROFIT_HTTP_TIMEOUT", timeout))
        self.user_agent = (user_agent or os.environ.get("NONPROFIT_USER_AGENT")
                           or DEFAULT_USER_AGENT)
        self._fetch = fetch or self._http
        self._cache: dict[str, tuple[float, object]] = {}

    # -- transport ---------------------------------------------------------

    def _http(self, url: str, payload: dict | None = None) -> str:
        body = None
        method = "GET"
        if payload:
            #: This API is read-only over GET, so the parameters go in the query string.
            #: Sent as a body they are ignored, and `search.json` without `q` answers 422.
            url = f"{url}?{parse.urlencode(payload, doseq=True)}"
        req = request.Request(url, data=body,
                              headers={"User-Agent": self.user_agent, "Accept": "application/json"},
                              method=method)
        try:
            with request.urlopen(req, timeout=self.timeout) as resp:
                return resp.read().decode("utf-8", "replace")
        except urlerror.HTTPError as exc:
            #: 404 here is "past the end of the pages", not a failure to read.
            if exc.code == 404:
                raise NonprofitNotFound("ProPublica answered HTTP 404") from exc
            raise NonprofitNotFound(f"ProPublica answered HTTP {exc.code}") from exc
        except Exception as exc:  # urllib raises many other types too
            raise NonprofitError(f"request failed: {exc}") from exc

    def _read(self, key: str, path: str, params: dict | None = None,
              ttl: float | None = None) -> dict:
        now = time.time()
        hit = self._cache.get(key)
        if hit and hit[0] > now:
            return hit[1]
        raw = self._fetch(API + path, params)
        if isinstance(raw, (str, bytes)):
            try:
                body = json.loads(raw)
            except ValueError as exc:
                raise NonprofitError(
                    f"ProPublica returned something that is not JSON: {exc}") from exc
        else:
            body = raw
        if not isinstance(body, dict):
            raise NonprofitError("ProPublica returned an unexpected payload")
        self._cache[key] = (now + (ttl if ttl is not None else self.cache_ttl), body)
        return body

    # -- reads -------------------------------------------------------------

    def search(self, name: str, page: int = 0) -> dict:
        """One page of the organisations whose name matches a phrase.

        The pages are **zero-based**: `cur_page` comes back as 0 for the first page, and
        `page=1` is the second one. Sending `page=1` for a query whose whole answer fits on
        the first page returns nothing at all, so the first page is asked for by leaving the
        parameter out.
        """
        text = str(name or "").strip()
        if not text:
            raise ValueError("tell me which charity, for example the Red Cross")
        wanted = max(0, int(page))
        params: dict = {"q": text[:MAX_TERM]}
        if wanted:
            params["page"] = str(wanted)
        body = self._read(f"search:{text}:{wanted}", "search.json", params)
        rows = [_row(item) for item in (body.get("organizations") or [])]
        return {"query": text, "rows": rows, "count": len(rows),
                "total": body.get("total_results"), "page": body.get("cur_page"),
                "num_pages": body.get("num_pages"), "source": DATASET}

    def organization(self, ein: str) -> dict:
        """One organisation's own record: the amounts and the period they belong to."""
        number = ein_from_text(ein) or str(ein or "").strip()
        if not number:
            raise ValueError("tell me which charity, by EIN like 53-0196605 or by name")
        body = self._read(f"org:{number}", f"organizations/{number}.json", ttl=43200.0)
        record = body.get("organization")
        if not isinstance(record, dict) or not record.get("ein"):
            raise NonprofitNotFound(f"ProPublica holds no organisation with EIN {number}")
        return _record(record)

    def find(self, name: str) -> dict:
        """The best match for a name, by the API's own ranking of the search."""
        text = str(name or "").strip()
        if not text:
            raise ValueError("tell me which charity, for example the Red Cross")
        found = self.search(text)
        if not found["rows"]:
            raise NonprofitNotFound(
                f"ProPublica's nonprofit explorer holds no organisation matching {text!r}")
        return found["rows"][0]

    def compare(self, names: list[str]) -> dict:
        """Two or more named organisations, read one by one and put side by side."""
        wanted = [str(name).strip() for name in (names or []) if str(name).strip()]
        if len(wanted) < 2:
            raise ValueError("name at least two charities to compare")
        if len(wanted) > 4:
            raise ValueError("compare at most four charities at a time")
        rows = []
        for name in wanted:
            row = self.find(name)
            try:
                rows.append(self.organization(row["ein"]))
            except NonprofitNotFound:
                row["unavailable"] = "ProPublica has no detail record for this EIN"
                rows.append(row)
        return {"rows": rows, "asked_for": wanted, "source": DATASET}

    def peers(self, name: str, max_organizations: int = 12,
              focus_ein: str | None = None) -> dict:
        """Read a page of organisations and one record each: the size distribution.

        This is the expensive read the free path never does. The search only carries
        names, so a real comparison needs one detail request per organisation, and that is
        why the read is capped and every answer says how many of the search's results it
        covered.
        """
        text = str(name or "").strip()
        if not text:
            raise ValueError("tell me which charities to line up, for example the Red Cross")
        cap = max(2, min(int(max_organizations), MAX_PEERS))
        found = self.search(text)
        rows = found["rows"][:cap]
        if not rows:
            raise NonprofitNotFound(
                f"ProPublica's nonprofit explorer holds no organisation matching {text!r}")
        details = []
        for row in rows:
            try:
                details.append(self.organization(row["ein"]))
            except NonprofitNotFound:
                #: An organisation in the search with no detail record is still a peer, but
                #: it carries no amount, so it is listed without one.
                row["unavailable"] = "no detail record"
                details.append(row)
        return {"query": text, "rows": details, "read": len(details),
                "search_total": found["total"], "asked_for": cap,
                "focus_ein": ein_from_text(focus_ein) if focus_ein else None,
                "source": DATASET}


def median(values: list[float]) -> float | None:
    """The middle value, without importing statistics for one line."""
    if not values:
        return None
    ordered = sorted(values)
    middle = len(ordered) // 2
    if len(ordered) % 2:
        return ordered[middle]
    return round((ordered[middle - 1] + ordered[middle]) / 2, 2)


def _row(item: dict) -> dict:
    """One search hit, flattened into the fields an answer prints."""
    return {
        "ein": str(item.get("ein") or ""),
        "strein": item.get("strein"),
        "name": item.get("name") or "(unnamed organisation)",
        "sub_name": item.get("sub_name"),
        "city": item.get("city"),
        "state": item.get("state"),
        "ntee_code": item.get("ntee_code"),
        "raw_ntee_code": item.get("raw_ntee_code"),
        "subsection": item.get("subseccd"),
        "have_filings": item.get("have_filings"),
        "have_extracts": item.get("have_extracts"),
        "have_pdfs": item.get("have_pdfs"),
        "score": item.get("score"),
        "url": f"{SITE}/{item.get('ein')}",
    }


def _record(record: dict) -> dict:
    """One organisation's own record, with the period each amount belongs to."""
    row = _row({"ein": record.get("ein"), "name": record.get("name"),
                "city": record.get("city"), "state": record.get("state"),
                "ntee_code": record.get("ntee_code")})
    return {
        **row,
        "careof": record.get("careofname"),
        "address": record.get("address"),
        "zipcode": record.get("zipcode"),
        "exemption_number": record.get("exemption_number"),
        "subsection_code": record.get("subsection_code"),
        "classification_codes": record.get("classification_codes"),
        "ruling_date": str(record.get("ruling_date") or "")[:10] or None,
        "deductibility_code": record.get("deductibility_code"),
        "foundation_code": record.get("foundation_code"),
        "organization_code": record.get("organization_code"),
        "exempt_status_code": record.get("exempt_organization_status_code"),
        "asset_code": record.get("asset_code"),
        "income_code": record.get("income_code"),
        "tax_period": str(record.get("tax_period") or "")[:10] or None,
        "accounting_period": record.get("accounting_period"),
        "revenue": _amount(record.get("revenue_amount")),
        "income": _amount(record.get("income_amount")),
        "assets": _amount(record.get("asset_amount")),
        "data_source": record.get("data_source"),
    }


def _amount(value) -> float | None:
    """A BMF amount as a float. Absent is None, which is not zero."""
    if value is None or value == "":
        return None
    try:
        return float(str(value).replace(",", "").replace("$", ""))
    except (TypeError, ValueError):
        return None
