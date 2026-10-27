"""Read-only NYC Open Data readers for the nyc pack: one city, several agencies.

Deliberately self-contained (no dependency on the a2a repo's verified catalog, though its
2026-09-21 live checks are what chose these ids): one open Socrata transport, a light cache
and the three queries the pack needs. Datasets verified live in a2a/docs/verified-datasets.md:

  43nn-pn8j   DOHMH Restaurant Inspection Results (295,295 rows)
  tg4x-b46p   Film Permits on city streets
  tqtj-sjs8   Street Construction Permits (2022-present)

None of these is consumed by any other agent in this repo (the civic agent owns 311 status
and water; this pack is the everyday surface: where to eat, what is filming, why the street
is dug up).
"""

from __future__ import annotations

import datetime
import json
import os
import re
import time
from urllib import parse, request

BASE_URL = "https://data.cityofnewyork.us/resource"

DATASETS = {
    "restaurants": ("43nn-pn8j", "DOHMH Restaurant Inspection Results"),
    "film": ("tg4x-b46p", "Film Permits"),
    "streets": ("tqtj-sjs8", "Street Construction Permits (2022-present)"),
}

DEFAULT_USER_AGENT = "awesome-nyc-pack/1.0 (+https://github.com/mrfentmen/awesome-servers)"

#: what a grade cell means, as the inspectors say it
GRADES = {"A": "A - no or few violations", "B": "B - some violations", "C": "C - many violations",
          "Z": "Z - closed by the department", "P": "P - closed pending re-inspection",
          "N": "N - not yet graded"}


class NycError(RuntimeError):
    """A dataset could not be read."""


class NycData:
    """The three NYC reads, each request cached."""

    def __init__(self, fetch=None, cache_ttl: float = 600.0, timeout: float = 25.0,
                 user_agent: str | None = None) -> None:
        self.cache_ttl = float(os.environ.get("NYC_CACHE_TTL", cache_ttl))
        self.timeout = float(os.environ.get("NYC_HTTP_TIMEOUT", timeout))
        self.user_agent = user_agent or os.environ.get("NYC_USER_AGENT") or DEFAULT_USER_AGENT
        self._fetch = fetch or self._http_text
        self._cache: dict[str, tuple[float, object]] = {}

    # -- transport ---------------------------------------------------------

    def _http_text(self, url: str, params: dict) -> str:
        query = f"{url}?{parse.urlencode(params)}" if params else url
        req = request.Request(query, headers={"User-Agent": self.user_agent, "Accept": "*/*"})
        try:
            with request.urlopen(req, timeout=self.timeout) as resp:
                return resp.read().decode("utf-8", "replace")
        except Exception as exc:
            raise NycError(f"request failed: {exc}") from exc

    def _soda(self, dataset: str, soql: dict, ttl: float | None = None) -> list:
        """One Socrata query; the transport is dataset-agnostic."""
        url = f"{BASE_URL}/{dataset}.json"
        key = f"{url}?{parse.urlencode(soql)}"
        now = time.time()
        hit = self._cache.get(key)
        if hit and hit[0] > now:
            return hit[1]
        raw = self._fetch(url, soql)
        if isinstance(raw, (str, bytes)):
            try:
                raw = json.loads(raw)
            except ValueError as exc:
                raise NycError(f"the dataset returned something that is not JSON: {exc}") from exc
        if not isinstance(raw, list):
            raise NycError("the dataset returned an unexpected payload")
        self._cache[key] = (now + (ttl if ttl is not None else self.cache_ttl), raw)
        return raw

    # -- reads -------------------------------------------------------------

    def restaurants(self, zipcode: str, days: int = 90) -> dict:
        """Grades and critical findings for one ZIP, most-recent inspection first."""
        query = str(zipcode or "").strip()
        if not re.fullmatch(r"\d{5}", query):
            raise ValueError("tell me a five-digit NYC ZIP, for example 10001")
        lookback = (datetime.date.today() - datetime.timedelta(days=int(days))).isoformat()
        soql = {"$select": "dba,inspection_date,grade,score,critical_flag,violation_description,street,building",
                "$where": f"zipcode='{query}' AND inspection_date >= '{lookback}' AND grade IS NOT NULL",
                "$order": "inspection_date DESC, dba", "$limit": 400}
        rows = self._soda(DATASETS["restaurants"][0], soql)
        rows = [row for row in rows if row.get("grade")]
        tally: dict[str, int] = {}
        for row in rows:
            grade = row.get("grade", "")
            tally[grade] = tally.get(grade, 0) + 1
        worst = [row for row in rows if str(row.get("critical_flag", "")).upper() == "Y"]
        return {"zipcode": query, "tally": tally, "read": len(rows), "since": lookback,
                "examples": rows[:5], "critical": worst[:5]}

    def film(self, days: int = 7) -> dict:
        """Film permits whose window overlaps a look-ahead from now."""
        now = datetime.datetime.now(datetime.timezone.utc)
        start = now.isoformat(timespec="seconds")
        stop = (now + datetime.timedelta(days=int(days))).isoformat(timespec="seconds")
        soql = {"$select": "eventid,eventtype,category,subcategoryname,borough,"
                           "startdatetime,enddatetime,eventagency,parkingheld",
                "$where": f"enddatetime >= '{start}'",
                "$order": "startdatetime", "$limit": 500}
        rows = self._soda(DATASETS["film"][0], soql)
        stop_dt = datetime.datetime.fromisoformat(stop)
        picked = []
        for row in rows:
            begins_raw = str(row.get("startdatetime", ""))
            try:
                begins = datetime.datetime.fromisoformat(begins_raw.replace("Z", "+00:00"))
            except ValueError:
                continue
            if begins <= stop_dt:
                picked.append(row)
        return {"window_days": int(days), "read": len(rows), "in_window": len(picked),
                "permits": picked[:15]}

    def streetworks(self, borough: str | None = None, days: int = 7) -> dict:
        """Street/utility permits active in the window, optionally for one borough."""
        now = datetime.datetime.now(datetime.timezone.utc)
        start = now.isoformat(timespec="seconds")
        stop = (now + datetime.timedelta(days=int(days))).isoformat(timespec="seconds")
        where = (f"issuedworkstartdate <= '{stop}' AND "
                 f"COALESCE(issuedworkenddate, enddate, issuedworkstartdate) >= '{start}'")
        soql = {"$select": "permitnumber,permittypedesc,permitissuedate,boroughname,"
                           "onstreetname,fromstreetname,issuedworkstartdate",
                "$where": where, "$order": "issuedworkstartdate", "$limit": 300}
        if borough:
            soql["$where"] += f" AND UPPER(boroughname) = '{str(borough).upper()}'"
        rows = self._soda(DATASETS["streets"][0], soql)
        return {"borough": (borough or "all five boroughs").title(), "window_days": int(days),
                "permit_types": sorted({row.get("permittypedesc", "") for row in rows}),
                "read": len(rows), "permits": rows[:15]}
