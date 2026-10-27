"""Legal entities and their LEI numbers, from the GLEIF registry (keyless).

Verified live on 2026-09-28 on GLEIF API v1:

  /api/v1/lei-records?filter[entity.legalName]=Apple&page[size]=100
      -> count 370; the first page already contains 'Apple Inc.' (HWUPKR0MPOU8FGXBT394)
  /api/v1/lei-records?filter[entity.legalName]=Apple%20Inc&page[size]=5
      -> count 24, and 'Apple Inc.' comes first: the filter is a contains match, and the
         registry's own order puts the closest name at the top
  /api/v1/lei-records/HWUPKR0MPOU8FGXBT394
      -> legalName 'Apple Inc.', status ACTIVE, jurisdiction US-CA, registered as
         806592, incorporated 1977-01-03, LEI first held 2012-06-06, one previous
         legal name ('Apple Computer, Inc.'), headquarters One Apple Park Way, Cupertino

Two things this reader keeps. The legalName filter is a *contains* match, so a broad name
matches hundreds of entities and a broad answer would be worthless - so a name search is
ranked here (exact name, then starts with, then contains) and the count of the whole match
is reported beside it. And `filter[relationships.*]` is rejected with HTTP 400, so a
parent or a subsidiary is read from the record's own `relationships`, never by filtering
the list: `direct-parent` and `ultimate-parent` name the owner, `direct-children` and
`ultimate-children` name what the entity owns.
"""

from __future__ import annotations

import json
import os
import re
import time
from urllib import parse, request
from urllib.error import HTTPError

API = "https://api.gleif.org/api/v1/"

SITE = "https://lei.gleif.org"

DATASET = "GLEIF Legal Entity Identifier registry (api.gleif.org)"

DEFAULT_USER_AGENT = "awesome-acps-companies/1.0 (+https://github.com/mrfentmen/awesome-acps)"

#: An LEI is exactly 20 characters of digits and upper-case letters, and its first two are
#: a country code - "HW" for Honduras and "549300..." for a numeric one, so the prefix is
#: not required to be digits.
LEI_RE = re.compile(r"\b[0-9A-Z]{20}\b")

#: GLEIF's own page size. One page is one read; the premium tool is what pages on.
PAGE_SIZE = 20
MAX_PAGE_SIZE = 200

#: A legal name is a short phrase, not a paragraph.
MAX_NAME = 120

_NAME_LEAD = (r"(?:lei|legal entity identifier|legal entity id|legal entity|legal name|"
              r"company|corporation|entity|entities|companies|registrant|record|records|"
              r"business|firm|subsidiary|subsidiaries|owner|parent|registered name)")

#: Ordered ways a legal name is written into a question. The first that matches wins, so
#: the specific shapes come first and the loose one last.
_NAME_PATTERNS = (
    re.compile(r"(?i)\bdoes\s+(.+?)\s+own\b"),
    re.compile(r"(?i)\b(?:what|which|who)\s+(?:is\s+|are\s+)?(.+?)'s\s+(?:lei|identifier)\b"),
    re.compile(r"(?i)\b(?:named|called)\s+(.+?)\s*[?.!]*$"),
    re.compile(r"(?i)\bwith\s+(?:the\s+)?lei\s+(.+?)\s*[?.!]*$"),
    re.compile(r"(?i)\b" + _NAME_LEAD + r"\s+(?:for|of|on|to|about)\s+(.+?)\s*[?.!]*$"),
    re.compile(r"(?i)\b" + _NAME_LEAD + r"\s+(.+?)\s*[?.!]*$"),
)

#: Last resort: a run of capitalised words, which is how a company is usually written. The
#: connectors "of", "the", "de" and friends are allowed inside the run, because "Bank of
#: America" is one name and not three words.
_CAPS_RUN_RE = re.compile(
    r"[A-Z][A-Za-z.&'-]*(?:\s+(?:of|the|and|de|der|van|von|la|le|&)?\s*"
    r"[A-Z][A-Za-z.&'-]*)*")

#: Noise a person types around a name that is not part of it.
_NAME_NOISE = (
    (re.compile(r"(?i)^\s*(?:the|a|an|for|of|on|to|about|is|are|was|were|does|do|own|owns|"
                r"please|hey|me)\b\s*"), ""),
    (re.compile(r"(?i)[\"']s\b"), ""),
    (re.compile(r"(?i)\s+[\"']$"), ""),
    (re.compile(r"(?i)\s*\b(?:from|in|through)\s+the\s+(?:registry|gleif)\b.*$"), ""),
    (re.compile(r"(?i)\s*\b(?:please|thanks?|thank you)\b.*$"), ""),
)


class CompaniesError(RuntimeError):
    """GLEIF could not be read."""


class CompaniesNotFound(CompaniesError):
    """GLEIF answered fine but holds no such record - a real 'nothing here', not a failure."""


def lei_from_text(text: str) -> str | None:
    """An LEI in the registry's own 20-character form, or None."""
    for token in str(text or "").upper().split():
        cleaned = token.strip(".,;:()[]?\"'")
        if LEI_RE.fullmatch(cleaned):
            return cleaned
    return None


def name_from_text(text: str) -> str | None:
    """A legal name out of a question, with the question words dropped.

    A quoted phrase wins, because a person who quotes a company name means that name.
    After that each pattern in `_NAME_PATTERNS` is tried in turn, so "what is Apple's
    LEI?" and "what subsidiaries does Apple Inc. own?" both give "Apple".
    """
    work = str(text or "").strip()
    if not work:
        return None
    quoted = re.findall(r'"([^"]{2,120})"', work)
    if quoted:
        #: A quoted name is a legal name, so its full stop is part of it: "Apple Inc."
        #: and "Apple Inc" are the same entity to the registry, not two names.
        return quoted[0].strip()[:MAX_NAME] or None
    for pattern in _NAME_PATTERNS:
        match = pattern.search(work)
        if match:
            cleaned = _clean_name(match.group(1))
            if cleaned:
                return cleaned
    runs = _CAPS_RUN_RE.findall(work)
    if runs:
        #: The last run, because the question words come first: "which Apple is it" has
        #: "Apple" after the wh-word.
        return _clean_name(runs[-1])
    return None


def _clean_name(raw: str) -> str | None:
    """Strip the question words off a captured name, or give up if nothing is left."""
    name = str(raw or "").strip()
    for pattern, replacement in _NAME_NOISE:
        name = pattern.sub(replacement, name)
    name = re.sub(r"\s{2,}", " ", name).strip(" ,.;:-\"'")
    return name[:MAX_NAME] or None


def rank_key(item: dict, needle: str) -> tuple:
    """How close a record's legal name is to what was asked for.

    GLEIF's contains match makes a broad name match hundreds of entities. Exact name
    first, then a name that starts with the query, then one that only contains it, and
    inside each of those the *shortest* name (so "Apple Inc." beats "APPLE HOLDING COMPANY
    INTERNATIONAL") and an active record before a lapsed one. That is a ranking of what
    came back, not a claim about which company the person meant.
    """
    entity = (item.get("attributes") or {}).get("entity") or {}
    legal = str((entity.get("legalName") or {}).get("name") or "")
    lowered, wanted = _bare(legal), _bare(needle)
    if lowered == wanted:
        closeness = 0
    elif lowered.startswith(wanted):
        closeness = 1
    elif wanted in lowered:
        closeness = 2
    else:
        closeness = 3
    status = entity.get("status")
    return (closeness, len(legal), 0 if status == "ACTIVE" else 1, legal)


def _bare(name: str) -> str:
    """A name for comparing: case, spacing and the trailing full stop off.

    The registry writes "Apple Inc." and people type "Apple Inc", so those are the same
    name and must not be ranked as a near miss.
    """
    return re.sub(r"\s+", " ", str(name or "").strip().strip(".,").lower())


class CompaniesData:
    """The LEI registry: name search, one record, owners and subsidiaries."""

    def __init__(self, fetch=None, cache_ttl: float = 86400.0, timeout: float = 40.0,
                 user_agent: str | None = None) -> None:
        self.cache_ttl = float(os.environ.get("COMPANIES_CACHE_TTL", cache_ttl))
        self.timeout = float(os.environ.get("COMPANIES_HTTP_TIMEOUT", timeout))
        self.user_agent = (user_agent or os.environ.get("COMPANIES_USER_AGENT")
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
            raise CompaniesNotFound(f"GLEIF answered HTTP {exc.code}") from exc
        except Exception as exc:  # urllib raises many other types too
            raise CompaniesError(f"request failed: {exc}") from exc

    def _get(self, path: str, params: dict | None = None,
             ttl: float | None = None) -> dict:
        key = path + ("?" + parse.urlencode(params, doseq=True) if params else "")
        now = time.time()
        hit = self._cache.get(key)
        if hit and hit[0] > now:
            return hit[1]
        payload = self._fetch(API + path, params)
        if isinstance(payload, (str, bytes)):
            try:
                payload = json.loads(payload)
            except ValueError as exc:
                raise CompaniesError(
                    f"GLEIF returned something that is not JSON: {exc}") from exc
        if not isinstance(payload, dict):
            raise CompaniesError("GLEIF returned an unexpected payload")
        self._cache[key] = (now + (ttl if ttl is not None else self.cache_ttl), payload)
        return payload

    # -- reads -------------------------------------------------------------

    def search_name(self, name: str, limit: int = 10) -> dict:
        """Records whose legal name contains `name`, best match first."""
        text = str(name or "").strip()
        if not text:
            raise ValueError("tell me which company, for example Apple")
        wanted = max(1, min(int(limit), MAX_PAGE_SIZE))
        payload = self._get("lei-records", {"filter[entity.legalName]": text[:MAX_NAME],
                                            "page[size]": PAGE_SIZE})
        rows = [item for item in (payload.get("data") or []) if isinstance(item, dict)]
        ranked = sorted(rows, key=lambda item: rank_key(item, text))
        pagination = (payload.get("meta") or {}).get("pagination") or {}
        return {"query": text, "records": [_row(item) for item in ranked[:wanted]],
                "read": len(ranked), "asked_for": PAGE_SIZE,
                "total": pagination.get("total"),
                "more_pages": int(pagination.get("lastPage") or 1) > 1,
                "exact_match": any(_bare(str((item.get("attributes") or {}).get("entity", {})
                                           .get("legalName", {}).get("name") or ""))
                                   == _bare(text) for item in rows),
                "source": DATASET}

    def record(self, lei: str) -> dict:
        """One LEI's own record, everything the registry holds about it."""
        text = lei_from_text(lei) or str(lei or "").strip()
        if not text:
            raise ValueError("tell me which LEI, for example HWUPKR0MPOU8FGXBT394")
        payload = self._get(f"lei-records/{text}", ttl=43200.0)
        data = payload.get("data")
        if not isinstance(data, dict) or not data.get("id"):
            raise CompaniesNotFound(f"GLEIF holds no record for LEI {text!r}")
        row = _row(data)
        return row

    def resolve(self, lei: str) -> dict:
        """A record plus the owners it names and the subsidiaries it lists."""
        row = self.record(lei)
        chain = []
        for key in ("direct_parent", "ultimate_parent"):
            related = row.get(key)
            if not related or not related.get("id"):
                continue
            try:
                parent = _row(self._get(f"lei-records/{related['id']}", ttl=43200.0)["data"])
            except CompaniesError:
                chain.append({"id": related["id"], "name": related.get("name") or "not reported",
                              "status": None, "jurisdiction": None, "lookup": "failed"})
                continue
            parent["lookup"] = "read"
            chain.append(parent)
        return {"lei": row, "parents": chain,
                "direct_children": row.get("direct_children") or [],
                "ultimate_children": row.get("ultimate_children") or [],
                "source": DATASET}

    def subsidiaries(self, lei: str, limit: int = 25) -> dict:
        """What one entity owns, as the record itself lists it."""
        resolved = self.resolve(lei)
        wanted = max(1, min(int(limit), 200))
        direct = resolved["direct_children"]
        ultimate = resolved["ultimate_children"]
        return {"lei": resolved["lei"], "direct_children": direct[:wanted],
                "ultimate_children": ultimate[:wanted], "direct_count": len(direct),
                "ultimate_count": len(ultimate), "asked_for": wanted,
                "source": DATASET}


def _row(item: dict) -> dict:
    """The fields an answer prints, flattened out of GLEIF's JSON:API shape."""
    attributes = item.get("attributes") or {}
    entity = attributes.get("entity") or {}
    legal_name = entity.get("legalName") or {}
    address = entity.get("legalAddress") or {}
    registration = attributes.get("registration") or {}
    legal_form = entity.get("legalForm") or {}
    relationships = item.get("relationships") or {}

    def related(key: str) -> dict | None:
        data = (relationships.get(key) or {}).get("data")
        return data if isinstance(data, dict) else None

    return {
        "id": item.get("id"),
        "name": legal_name.get("name") or "(unnamed entity)",
        "status": entity.get("status"),
        "jurisdiction": entity.get("jurisdiction"),
        "category": entity.get("category"),
        "sub_category": entity.get("subCategory"),
        "legal_form": legal_form.get("id"),
        "registered_as": entity.get("registeredAs"),
        "registered_at": (entity.get("registeredAt") or {}).get("id"),
        "created": str(entity.get("creationDate") or "")[:10] or None,
        "city": address.get("city"),
        "country": address.get("country"),
        "region": address.get("region"),
        "address_lines": [str(line) for line in (address.get("addressLines") or [])],
        "postal_code": address.get("postalCode"),
        "first_known": str(registration.get("initialRegistrationDate") or "")[:10] or None,
        "last_updated": str(registration.get("lastUpdateDate") or "")[:10] or None,
        "next_renewal": str(registration.get("nextRenewalDate") or "")[:10] or None,
        "corroboration": registration.get("corroborationLevel"),
        "managing_lou": registration.get("managingLou"),
        "other_names": [str(entry.get("name")) for entry in (entity.get("otherNames") or [])
                        if isinstance(entry, dict) and entry.get("name")],
        "direct_parent": related("direct-parent"),
        "ultimate_parent": related("ultimate-parent"),
        "direct_children": [_relation(item) for item in
                            _relation_list(relationships, "direct-children")],
        "ultimate_children": [_relation(item) for item in
                              _relation_list(relationships, "ultimate-children")],
        "url": f"{SITE}/lei-record/{item.get('id')}",
        "source": DATASET,
    }


def _relation_list(relationships: dict, key: str) -> list:
    data = (relationships.get(key) or {}).get("data")
    return [entry for entry in (data or []) if isinstance(entry, dict)]


def _relation(item: dict) -> dict:
    return {"id": item.get("id"),
            "name": ((item.get("attributes") or {}).get("legalName") or {}).get("name")}
