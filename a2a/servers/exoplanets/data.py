"""Read-only client for the NASA Exoplanet Archive TAP service.

Endpoint (keyless, verified live 2026-09-28):
  - /TAP/sync?query=<ad-hoc SQL>&format=json    the archive, queried directly

This is a TAP service, not a fixed REST API: the query is SQL and the columns
are the archive's own schema, so this client is mostly about building that SQL
safely. Four habits of the service shape it, and two of them are traps:

1. `format=json` works on /TAP/sync even though the service is usually used with
   csv, which saves parsing quoted CSV. Rows come back as a list of objects.

2. A query is an ad-hoc statement against a 6,372-row table, so the SELECT list
   is a fixed allowlist and every value is a parameter the archive is asked for
   with a typed column, never string interpolation. `where` on a text column
   becomes a `like` with the wildcards added here.

3. TRAP: there is no `LIMIT`. The service speaks ADQL, and `select ... limit 2`
   is answered with HTTP 400 and `ORA-00933: SQL command not properly ended`.
   `select top n` is accepted but is applied *before* `order by`, so
   `select top 10 pl_name, pl_rade ... order by pl_rade desc` returns ten
   arbitrary rows and not the ten largest - the real largest, V2376 Ori b at
   87 R_Earth, is not in it. Row limits therefore go in the `MAXREC` request
   parameter, which TAP defines as a cap applied after ordering, and which
   does return the true extremes.

4. The composite table `pscomppars` is one row per planet with the best published
   value for each parameter, and a column the archive has not published is empty
   rather than absent. So every reader here turns a missing value into None and
   says "not reported" rather than substituting a default.

5. TRAP: `sy_pnum` is not the planet's letter. In `pscomppars` it is the number
   of planets in the system - all seven TRAPPIST-1 planets carry `sy_pnum: 7`,
   and TRAPPIST-1 e is the fifth letter but the seventh planet. So it is
   reported as `planets_in_system`, and the letter is taken from the end of
   `pl_name`, which is the only place the archive actually records it.

A note on missingness: a blank here usually means the value is genuinely
unpublished, not that the planet lacks it. `pl_eqt` in particular is empty for
most direct-imaging discoveries.
"""

from __future__ import annotations

import os
import re
from urllib.parse import quote

from a2a_kit import JsonApiClient, UpstreamError, utc_now_iso

BASE_URL = "https://exoplanetarchive.ipac.caltech.edu"
TAP_PATH = "/TAP/sync"

DATASET = "exoplanetarchive.ipac.caltech.edu/TAP/sync"
PRODUCT = "NASA Exoplanet Archive Planetary Systems Composite Parameters (pscomppars)"
TABLE = "pscomppars"

#: The columns this server reports, in the order it reports them. This is also
#: the only allowlist the SELECT builder will emit, so a caller cannot reach a
#: column the answers do not describe.
PLANET_FIELDS = (
    "pl_name", "hostname", "sy_snum", "sy_pnum",
    "discoverymethod", "disc_year", "disc_facility", "disc_pubdate",
    "pl_orbper", "pl_rade", "pl_bmasse", "pl_eqt", "pl_orbsmax", "pl_orbeccen",
    "pl_insol", "st_spectype", "st_teff", "st_rad", "st_mass", "sy_dist",
)

#: Columns a caller may sort on, with the direction allowed. Sorting is a
#: different question from filtering, so it is a short fixed list.
SORT_COLUMNS = (
    "pl_orbper", "pl_rade", "pl_bmasse", "pl_eqt", "pl_orbsmax", "pl_insol",
    "st_teff", "st_rad", "st_mass", "sy_dist", "disc_year",
)

#: Discovery methods the archive uses, for validation and for grouping.
DISCOVERY_METHODS = (
    "Transit", "Radial Velocity", "Microlensing", "Imaging", "Transit Timing Variations",
    "Eclipse Timing Variations", "Pulsar Timing", "Orbital Brightness Modulation",
    "Astrometry", "Disk Kinematics", "Pulsation Timing Variations",
)

#: A rough habitable-zone band on insolation, in Earth units. The archive
#: publishes no habitable flag, so this is our own stated band and says so.
HABITABLE_ZONE_INSOL = (0.25, 1.8)

#: The full table is 6,372 rows and about half a megabyte of JSON, so a read of
#: all of it is expensive and is the premium skill's job, not a free one's.
FULL_TABLE_ROWS = 6372

_NAME_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9 ._+\-()]{0,70}$")

__all__ = [
    "BASE_URL",
    "DATASET",
    "DISCOVERY_METHODS",
    "FULL_TABLE_ROWS",
    "ExoplanetClient",
    "HABITABLE_ZONE_INSOL",
    "PLANET_FIELDS",
    "_planet_letter",
    "PRODUCT",
    "SORT_COLUMNS",
    "TAP_PATH",
    "TABLE",
    "UpstreamError",
    "build_query",
    "in_habitable_band",
]


def build_query(where: str = "", order: str = "") -> str:
    """A SELECT over the composite table, from parts this module built.

    `where` and `order` are only ever produced by the methods below, which
    interpolate typed values and allowlisted column names. Nothing a caller
    sends is concatenated in here.

    There is deliberately no row limit in the SQL: this service has no `LIMIT`,
    and its `select top n` is applied before `order by`, so a limit belongs in
    the `MAXREC` request parameter instead. See the module docstring.
    """
    columns = ", ".join(PLANET_FIELDS)
    query = f"select {columns} from {TABLE}"
    if where:
        query += f" where {where}"
    if order:
        query += f" order by {order}"
    return query


def _quote(value: str) -> str:
    """A single-quoted SQL string, with the quote doubled."""
    return "'" + str(value).replace("'", "''") + "'"


def _to_float(value) -> float | None:
    if value in (None, ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _to_int(value):
    if value in (None, ""):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


#: Host names can end in a digit or a space, so the letter is the last
#: whitespace-separated token when it is a single character, and None otherwise.
_LETTER_RE = re.compile(r"^(?:[a-z]|[A-Z]|\d+[a-z])$")


def _planet_letter(name) -> str | None:
    """The planet's letter from its archive name, e.g. `b` from `TRAPPIST-1 b`."""
    if not isinstance(name, str):
        return None
    tail = name.strip().split()[-1] if name.strip() else ""
    return tail if _LETTER_RE.match(tail) else None


def _round(value, digits=4):
    number = _to_float(value)
    return None if number is None else round(number, digits)


class ExoplanetClient(JsonApiClient):
    env_prefix = "EXOPLANETS"
    base_url = BASE_URL

    def __init__(self, fetch=None, base_url=None, cache_ttl=None, timeout=None, headers=None) -> None:
        super().__init__(fetch=fetch, base_url=base_url, cache_ttl=cache_ttl, timeout=timeout,
                         headers=headers)
        # The archive is republished as papers are accepted, so a day is plenty
        # for a single planet and for the extremes.
        self.catalog_ttl = float(os.environ.get(f"{self.env_prefix}_CATALOG_TTL", "3600"))
        # A full-table read is half a megabyte; cache it much harder.
        self.table_ttl = float(os.environ.get(f"{self.env_prefix}_TABLE_TTL", "21600"))

    # -- validation --------------------------------------------------------

    @staticmethod
    def check_name(value) -> str:
        name = str(value).strip()
        if not _NAME_RE.match(name):
            raise ValueError("that does not look like a planet or host name")
        return name

    @staticmethod
    def check_discovery_method(value) -> str:
        wanted = str(value).strip().lower()
        for name in DISCOVERY_METHODS:
            if name.lower() == wanted:
                return name
        raise ValueError(f"discovery method must be one of: {', '.join(DISCOVERY_METHODS)}")

    @staticmethod
    def check_sort(value) -> tuple[str, str]:
        """(column, direction) from something like `-pl_rade` or `hot:pl_eqt`."""
        text = str(value).strip()
        direction = "asc"
        if text.startswith(("-", "+")):
            direction = "desc" if text[0] == "-" else "asc"
            text = text[1:].strip()
        elif ":" in text:
            text, _, word = text.partition(":")
            if word.strip().lower() in ("desc", "descending", "high", "big", "hot", "largest", "far"):
                direction = "desc"
            text = text.strip()
        if text not in SORT_COLUMNS:
            raise ValueError(f"sort must be one of: {', '.join(SORT_COLUMNS)} (optionally with - prefix)")
        return text, direction

    @staticmethod
    def check_limit(value) -> int:
        try:
            limit = int(value)
        except (TypeError, ValueError):
            raise ValueError("limit must be a whole number") from None
        if not 1 <= limit <= 100:
            raise ValueError("limit must be between 1 and 100")
        return limit

    @staticmethod
    def check_years(value) -> tuple[int, int]:
        text = str(value).strip()
        match = re.match(r"^(\d{4})\s*[-–]\s*(\d{4})$", text)
        if not match:
            raise ValueError("a year range is two years joined by a dash, for example 2015-2020")
        low, high = int(match.group(1)), int(match.group(2))
        if low > high:
            low, high = high, low
        if not 1988 <= low <= 2100 or not 1988 <= high <= 2100:
            raise ValueError("discovery years must be between 1988 and 2100")
        return low, high

    @staticmethod
    def check_number_range(value) -> tuple[float, float]:
        text = str(value).strip()
        match = re.match(r"^(-?\d+(?:\.\d+)?)\s*(?:-|–|\.\.\.?|:)\s*(-?\d+(?:\.\d+)?)$", text)
        if not match:
            raise ValueError("a range is two numbers joined by a dash, for example 1-10")
        low, high = float(match.group(1)), float(match.group(2))
        if low > high:
            low, high = high, low
        return low, high

    # -- transport ---------------------------------------------------------

    def _tap(self, query: str, ttl: float, maxrec: int | None = None) -> list[dict]:
        """One ad-hoc SELECT, with the row cap in `MAXREC` where it belongs.

        The query is percent-encoded with `%20` and put in the URL here rather
        than passed as a parameter, so the SQL is never re-encoded on the way
        out. `MAXREC` is TAP's own cap and is applied after `order by`, which is
        the only reason this works for the extremes.
        """
        url = f"{TAP_PATH}?query={quote(query, safe='')}"
        if maxrec is not None:
            url += f"&MAXREC={int(maxrec)}"
        payload = self.get_json(f"{url}&format=json", None, ttl=ttl)
        if isinstance(payload, dict):
            # A failed query can come back as a VOTable document rather than JSON,
            # in which case jsonapi hands over a string or raises; a dict here is
            # the archive explaining itself.
            info = payload.get("INFO") or {}
            if isinstance(info, dict) and info.get("value") == "ERROR":
                raise UpstreamError(f"the Exoplanet Archive rejected the query: {info.get('name')}")
            raise UpstreamError("the Exoplanet Archive returned an unexpected payload")
        if not isinstance(payload, list):
            raise UpstreamError("the Exoplanet Archive returned an unexpected payload")
        return [row for row in payload if isinstance(row, dict)]

    # -- reads -------------------------------------------------------------

    def planet(self, name: str) -> dict | None:
        """One planet, by its archive name such as `TRAPPIST-1 b`."""
        name = self.check_name(name)
        rows = self._tap(build_query(where=f"pl_name={_quote(name)}"), self.catalog_ttl, maxrec=2)
        if not rows:
            # A bare host name is a fair thing to ask for: the archive then
            # answers with every planet it has around that star.
            rows = self._tap(build_query(where=f"hostname={_quote(name)}"), self.catalog_ttl,
                              maxrec=100)
        if not rows:
            return None
        return self.shape(rows[0])

    def system(self, host: str, limit: int = 100) -> list[dict]:
        """Every known planet around one star, in planet-letter order."""
        host = self.check_name(host)
        order = "sy_snum asc, pl_name asc"
        rows = self._tap(build_query(where=f"hostname={_quote(host)}", order=order),
                         self.catalog_ttl, maxrec=self.check_limit(limit))
        return [self.shape(row) for row in rows]

    def search(self, host: str | None = None, method: str | None = None,
               years: str | None = None, limit: int = 20) -> dict:
        """Find planets by host star, discovery method or discovery year range."""
        limit = self.check_limit(limit)
        clauses = []
        if host:
            clauses.append(f"hostname like {_quote('%' + self.check_name(host) + '%')}")
        if method:
            clauses.append(f"discoverymethod={_quote(self.check_discovery_method(method))}")
        if years:
            low, high = self.check_years(years)
            clauses.append(f"disc_year>={low} and disc_year<={high}")
        if not clauses:
            raise ValueError("a search needs a host, a discovery method or a year range")
        order = "disc_year desc, pl_name asc"
        rows = self._tap(build_query(where=" and ".join(clauses), order=order),
                         self.catalog_ttl, maxrec=limit)
        return {
            "planets": [self.shape(row) for row in rows],
            "matched": len(rows),
            "limit": limit,
            "truncated": len(rows) >= limit,
        }

    def by_parameter(self, column: str, direction: str = "desc", limit: int = 10) -> list[dict]:
        """The extremes of one published parameter, largest or smallest first.

        Rows with no published value for the column are dropped by the
        `is not null` clause rather than sorted to one end as blanks, because a
        blank is an unpublished measurement and not the smallest one.
        """
        column, wanted = self.check_sort(f"{column}:{direction}")
        order = f"{column} {wanted}"
        where = f"{column} is not null"
        rows = self._tap(build_query(where=where, order=order), self.catalog_ttl,
                         maxrec=self.check_limit(limit))
        return [self.shape(row) for row in rows]

    def full_table(self) -> list[dict]:
        """Every row of the composite table. Expensive, so cached hard."""
        rows = self._tap(build_query(), self.table_ttl)
        return [self.shape(row) for row in rows]

    # -- shaping -----------------------------------------------------------

    def shape(self, row: dict) -> dict:
        """One planet, with the archive's own columns renamed and rounded."""
        out = {
            "planet": row.get("pl_name"),
            "host": row.get("hostname"),
            "star_number": _to_int(row.get("sy_snum")),
            # sy_pnum is how many planets the system has, not this planet's letter.
            "planets_in_system": _to_int(row.get("sy_pnum")),
            "planet_letter": _planet_letter(row.get("pl_name")),
            "discovery_method": row.get("discoverymethod"),
            "discovery_year": _to_int(row.get("disc_year")),
            "discovery_facility": row.get("disc_facility"),
            "discovery_published": row.get("disc_pubdate"),
            "orbital_period_days": _round(row.get("pl_orbper"), 6),
            "radius_earth": _round(row.get("pl_rade"), 4),
            "mass_earth": _round(row.get("pl_bmasse"), 4),
            "temperature_k": _round(row.get("pl_eqt"), 1),
            "semi_major_axis_au": _round(row.get("pl_orbsmax"), 6),
            "eccentricity": _round(row.get("pl_orbeccen"), 6),
            "insolation_earth": _round(row.get("pl_insol"), 4),
            "star_spectral_type": row.get("st_spectype"),
            "star_temperature_k": _round(row.get("st_teff"), 1),
            "star_radius_solar": _round(row.get("st_rad"), 4),
            "star_mass_solar": _round(row.get("st_mass"), 4),
            "distance_pc": _round(row.get("sy_dist"), 3),
            "dataset": DATASET,
        }
        out["reported_fields"] = sum(
            1 for key in ("orbital_period_days", "radius_earth", "mass_earth", "temperature_k")
            if out[key] is not None
        )
        return out

    @staticmethod
    def freshness() -> str:
        """The archive is republished as papers are accepted, so freshness is now."""
        return utc_now_iso()


def in_habitable_band(planet: dict) -> bool:
    """Whether a planet's insolation sits in the stated rough band.

    The archive publishes no habitable-zone flag, so this is our own band on
    `pl_insol` and it is reported as a band, never as a verdict.
    """
    value = planet.get("insolation_earth")
    if value is None:
        return False
    return HABITABLE_ZONE_INSOL[0] <= value <= HABITABLE_ZONE_INSOL[1]
