"""Read-only client for the GovTrack API v2.

Endpoints (keyless, verified live 2026-09-29):
  - /vote?congress=&chamber=&session=   roll-call votes
  - /bill?congress=&q=|&bill_type=|&current_status=   bills
  - /role?current=&state=&party=&role_type=            members and their roles
  - /committee                            the committee list (355 of them, one request)

Four things about this API shape the client, each verified against the live service:

1. Most filters work and a few are traps. `congress`, `chamber` and `session` work on
   votes; `q`, `bill_type` and `current_status` work on bills; `current`, `state`,
   `party` and `role_type` work on roles. But `category`, `number` and `order_by` on
   votes, and `name` on committees, all answer "Cannot filter on field", so a vote
   cannot be fetched by its number and a committee cannot be fetched by its name.
2. A vote has no id of its own, only a human link like `/congress/votes/119-2025/s1`.
   The numbering is what a caller knows, so it is reported, not invented.
3. `bill_type` and `current_status` are closed vocabularies. An unknown value is an
   HTTP 400 listing every valid one, so the accepted values are held here and
   validated before the call rather than discovered from an error.
4. A committee row nests a copy of its parent committee under `committee`, and a
   subcommittee leaves most fields null. The flat name and code are read from
   whichever of the two carries them.

GovTrack is a private nonprofit that tracks the US Congress from public records.
A vote's `result` is the chamber's own wording, and GovTrack's own margin and party
figures are reported as its figures.
"""

from __future__ import annotations

import re

from a2a_kit import JsonApiClient, UpstreamError, utc_now_iso

BASE_URL = "https://www.govtrack.us/api/v2"
VOTE_PATH = "/vote"
BILL_PATH = "/bill"
ROLE_PATH = "/role"
COMMITTEE_PATH = "/committee"

DATASET = "govtrack.us/api/v2/vote"
BILL_DATASET = "govtrack.us/api/v2/bill"
ROLE_DATASET = "govtrack.us/api/v2/role"
COMMITTEE_DATASET = "govtrack.us/api/v2/committee"
PRODUCT = "GovTrack roll-call votes, bills, members and committees"

CHAMBERS = ("house", "senate")
#: GovTrack's closed vocabularies, copied from the 400s it answers with.
BILL_TYPES = {
    "house bill": "house_bill", "hres": "house_resolution", "hr": "house_resolution",
    "house resolution": "house_resolution", "senate bill": "senate_bill",
    "s bill": "senate_bill", "sres": "senate_resolution", "senate resolution": "senate_resolution",
    "house concurrent resolution": "house_concurrent_resolution",
    "hconres": "house_concurrent_resolution", "h.j.res.": "house_joint_resolution",
    "house joint resolution": "house_joint_resolution", "senate concurrent resolution":
    "senate_concurrent_resolution", "sconres": "senate_concurrent_resolution",
    "senate joint resolution": "senate_joint_resolution", "sjres": "senate_joint_resolution",
    "s.con.res": "senate_concurrent_resolution", "s.j.res": "senate_joint_resolution",
    "h.con.res": "house_concurrent_resolution", "h.j.res": "house_joint_resolution",
    "concurrent resolution": "house_concurrent_resolution", "joint resolution":
    "house_joint_resolution", "resolution": "house_resolution",
}
BILL_STATUSES = {
    "introduced": "introduced", "reported": "reported", "passed": "passed_bill",
    "passed bill": "passed_bill", "passed house": "pass_over_house",
    "passed senate": "pass_over_senate", "passed house floor": "pass_over_house",
    "passed senate floor": "pass_over_senate", "conference": "conference_passed_house",
    "conference passed": "conference_passed_house", "vetoed": "prov_kill_veto",
    "veto": "prov_kill_veto", "failed": "failed", "enacted": "passed_bill",
}
ROLE_TYPES = ("senator", "representative")
PARTIES = ("Democrat", "Republican", "Independent", "Libertarian", "Green", "Other")
#: GovTrack stores the party as a noun, and people write the adjective or the plural.
PARTY_ALIASES = {party.lower(): party for party in PARTIES}
PARTY_ALIASES.update({f"{party.lower()}s": party for party in PARTIES})
PARTY_ALIASES.update({"democratic": "Democrat", "republican party": "Republican",
                      "gop": "Republican", "dem": "Democrat", "independents": "Independent",
                      "libertarian party": "Libertarian", "greens": "Green"})
#: GovTrack's index starts at the 93rd Congress, which sat from January 1973.
FIRST_CONGRESS = 93

VOTE_FIELDS = ("number", "question", "question_details", "vote_type", "category", "result",
               "passed", "required", "margin", "total_plus", "total_minus", "total_other",
               "percent_plus", "party_uniformity", "chamber", "congress", "session",
               "date_created", "source_label", "link")
BILL_FIELDS = ("display_number", "title_without_number", "title", "bill_type_label",
               "congress", "introduced_date", "current_status", "current_status_label",
               "current_status_date", "current_chamber", "sponsor", "is_alive", "is_current",
               "link")
ROLE_FIELDS = ("person_name", "party", "role_type", "state", "district", "chamber", "place",
               "leadership_title", "startdate", "enddate", "current", "link")
COMMITTEE_FIELDS = ("name", "abbrev", "code", "committee_type", "jurisdiction", "obsolete",
                    "member_count", "url")

_CONGRESS_RE = re.compile(r"^\d{2,3}$")
_NUMBER_RE = re.compile(r"^\d{1,4}$")
_SESSION_RE = re.compile(r"^\d{4}$")
_CODE_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9 .,'’&/\-()]{0,80}$")
_MISSING = (None, "")

__all__ = [
    "BASE_URL",
    "BILL_DATASET",
    "BILL_PATH",
    "BILL_STATUSES",
    "BILL_TYPES",
    "BILL_FIELDS",
    "CHAMBERS",
    "COMMITTEE_DATASET",
    "COMMITTEE_FIELDS",
    "COMMITTEE_PATH",
    "DATASET",
    "GovTrackClient",
    "PARTIES",
    "PARTY_ALIASES",
    "FIRST_CONGRESS",
    "PRODUCT",
    "ROLE_DATASET",
    "ROLE_FIELDS",
    "ROLE_PATH",
    "ROLE_TYPES",
    "UpstreamError",
    "VOTE_FIELDS",
    "VOTE_PATH",
]


class GovTrackClient(JsonApiClient):
    env_prefix = "VOTES"
    base_url = BASE_URL
    #: A page of 20 is the default; 100 keeps a page of votes small on the wire.
    page_size = 100
    #: The committee list is 355 rows in one request. Asking for only a page of it
    #: would make a local name search quietly miss most committees.
    committee_size = 500

    def __init__(self, fetch=None, base_url=None, cache_ttl=None, timeout=None, headers=None) -> None:
        super().__init__(fetch=fetch, base_url=base_url, cache_ttl=cache_ttl, timeout=timeout, headers=headers)
        #: Votes and bills are recorded as they happen; committees and roles change slowly.
        self.reference_ttl = float(self.cache_ttl)

    # -- validation --------------------------------------------------------

    @staticmethod
    def check_congress(value) -> int | None:
        if value in _MISSING:
            return None
        congress = str(value).strip()
        if not _CONGRESS_RE.match(congress):
            raise ValueError("a congress is a two or three digit number, for example 119")
        number = int(congress)
        if number < FIRST_CONGRESS:
            raise ValueError(
                f"GovTrack's index starts at the {FIRST_CONGRESS}rd Congress, which sat from January "
                f"1973, so congress {number} is before its first record"
            )
        if number > 250:
            raise ValueError("a congress above 250 does not exist yet")
        return number

    @staticmethod
    def check_chamber(value) -> str | None:
        if value in _MISSING:
            return None
        chamber = str(value).strip().lower()
        if chamber not in CHAMBERS:
            raise ValueError(f"chamber must be one of: {', '.join(CHAMBERS)}")
        return chamber

    @staticmethod
    def check_session(value) -> int | None:
        """A session is the four digit year its congress sat in, not a short year."""
        if value in _MISSING:
            return None
        session = str(value).strip()
        if not _SESSION_RE.match(session):
            raise ValueError("a session is the four digit year, for example 2025")
        year = int(session)
        if not 1789 <= year <= 2100:
            raise ValueError("a session year has to fall between 1789 and 2100")
        return year

    @staticmethod
    def check_bill_type(value) -> str | None:
        if value in _MISSING:
            return None
        kind = str(value).strip().lower()
        code = BILL_TYPES.get(kind, kind)
        if code not in set(BILL_TYPES.values()):
            raise ValueError(
                "bill type must be one of: house_bill, senate_bill, house_resolution, "
                "senate_resolution, house_concurrent_resolution, senate_concurrent_resolution, "
                "house_joint_resolution, senate_joint_resolution"
            )
        return code

    @staticmethod
    def check_bill_status(value) -> str | None:
        if value in _MISSING:
            return None
        status = BILL_TYPES.get(str(value).strip().lower(), str(value).strip().lower())
        status = BILL_STATUSES.get(str(value).strip().lower(), status)
        if status not in set(BILL_STATUSES.values()):
            raise ValueError("status must be one of: " + ", ".join(sorted(set(BILL_STATUSES.values()))))
        return status

    @staticmethod
    def check_state(value) -> str | None:
        if value in _MISSING:
            return None
        state = str(value).strip().upper()
        if not re.match(r"^[A-Z]{2}$", state):
            raise ValueError("a state is a two-letter code, for example CA or TX")
        return state

    @staticmethod
    def check_party(value) -> str | None:
        if value in _MISSING:
            return None
        wanted = " ".join(str(value or "").split()).lower()
        party = PARTY_ALIASES.get(wanted)
        if party is None:
            raise ValueError(f"party must be one of: {', '.join(PARTIES)}")
        return party

    @staticmethod
    def check_role_type(value) -> str | None:
        if value in _MISSING:
            return None
        role_type = str(value).strip().lower()
        if role_type not in ROLE_TYPES:
            raise ValueError(f"role must be one of: {', '.join(ROLE_TYPES)}")
        return role_type

    @staticmethod
    def check_term(value) -> str | None:
        if value in _MISSING:
            return None
        term = str(value).strip().lower()
        if term in ("current", "true", "yes"):
            return "true"
        if term in ("past", "false", "no"):
            return "false"
        raise ValueError("current must be current or past")

    @staticmethod
    def check_needle(value, what: str) -> str:
        needle = " ".join(str(value or "").split())
        if not needle:
            raise ValueError(f"which {what}? Give me a name or a code")
        if not _CODE_RE.match(needle):
            raise ValueError(f"that does not look like a {what}")
        return needle

    @staticmethod
    def check_limit(value, ceiling: int = 100) -> int:
        try:
            limit = int(value)
        except (TypeError, ValueError):
            raise ValueError("limit must be a whole number") from None
        if not 1 <= limit <= ceiling:
            raise ValueError(f"limit must be between 1 and {ceiling}")
        return limit

    # -- transport ---------------------------------------------------------

    def _page(self, path: str, filters: dict, limit: int, ttl: float) -> dict:
        params = {"limit": limit, **filters}
        payload = self.get_json(path, params, ttl=ttl)
        if not isinstance(payload, dict) or not isinstance(payload.get("objects"), list):
            raise UpstreamError("GovTrack returned an unexpected list payload")
        return payload

    # -- reads -------------------------------------------------------------

    def votes(self, congress: int | None = None, chamber: str | None = None,
              session: int | None = None, limit: int = 20) -> dict:
        """Roll-call votes, oldest first, which is the order GovTrack numbers them in.

        GovTrack answers "Cannot filter on field" for `category`, `number` and
        `order_by` on this endpoint, so none of them are sent: what a vote is about
        has to be read from the row.
        """
        limit = self.check_limit(limit)
        filters = {}
        if congress is not None:
            filters["congress"] = self.check_congress(congress)
        if chamber:
            filters["chamber"] = self.check_chamber(chamber)
        if session is not None:
            filters["session"] = self.check_session(session)
        payload = self._page(VOTE_PATH, filters, limit, self.cache_ttl)
        return {"filters": {key: value for key, value in filters.items() if value is not None},
                "total": _to_int((payload.get("meta") or {}).get("total_count")),
                "page_size": len(payload["objects"]),
                "offset": _to_int((payload.get("meta") or {}).get("offset")) or 0,
                "votes": [self.pick(self._vote(row), VOTE_FIELDS, DATASET)
                          for row in payload["objects"][:limit]]}

    def bills(self, congress: int | None = None, term: str | None = None,
              bill_type: str | None = None, status: str | None = None, limit: int = 20) -> dict:
        """Bills, by search term, type or status."""
        limit = self.check_limit(limit)
        filters = {}
        if congress is not None:
            filters["congress"] = self.check_congress(congress)
        if term:
            filters["q"] = str(term)[:120]
        if bill_type:
            filters["bill_type"] = self.check_bill_type(bill_type)
        if status:
            filters["current_status"] = self.check_bill_status(status)
        payload = self._page(BILL_PATH, filters, limit, self.cache_ttl)
        return {"filters": {key: value for key, value in filters.items() if value is not None},
                "query": term,
                "total": _to_int((payload.get("meta") or {}).get("total_count")),
                "page_size": len(payload["objects"]),
                "bills": [self.pick(self._bill(row), BILL_FIELDS, BILL_DATASET)
                          for row in payload["objects"][:limit]]}

    def roles(self, current: str | None = "true", state: str | None = None,
              party: str | None = None, role_type: str | None = None, limit: int = 20) -> dict:
        """Members and the roles they hold. GovTrack has no name filter on this endpoint."""
        limit = self.check_limit(limit)
        filters = {}
        if current is not None:
            filters["current"] = self.check_term(current)
        if state:
            filters["state"] = self.check_state(state)
        if party:
            filters["party"] = self.check_party(party)
        if role_type:
            filters["role_type"] = self.check_role_type(role_type)
        payload = self._page(ROLE_PATH, filters, limit, self.reference_ttl)
        return {"filters": {key: value for key, value in filters.items() if value is not None},
                "total": _to_int((payload.get("meta") or {}).get("total_count")),
                "page_size": len(payload["objects"]),
                "members": [self.pick(self._role(row), ROLE_FIELDS, ROLE_DATASET)
                            for row in payload["objects"][:limit]]}

    def committees(self, limit: int = 100) -> dict:
        """Every committee in one request, then filtered here.

        GovTrack's committee endpoint answers "Cannot filter on field" for `name`, so
        the 355-row list is read once (about 320 KB) and searched locally.
        """
        payload = self._page(COMMITTEE_PATH, {}, self.committee_size, self.reference_ttl)
        return {"total": _to_int((payload.get("meta") or {}).get("total_count")),
                "page_size": len(payload["objects"]),
                "committees": [self.pick(self._committee(row), COMMITTEE_FIELDS, COMMITTEE_DATASET)
                               for row in payload["objects"]]}

    def find_committees(self, needle: str, limit: int = 10) -> list[dict]:
        """Committees whose name, abbreviation or code contains `needle`."""
        limit = self.check_limit(limit, ceiling=50)
        term = self.check_needle(needle, "committee").lower()
        found = self.committees()
        matches = [
            committee for committee in found["committees"]
            if term in " ".join(str(committee.get(field) or "")
                                for field in ("name", "abbrev", "code")).lower()
        ]
        matches.sort(key=lambda committee: (committee.get("obsolete") is True,
                                            str(committee.get("name") or "")))
        return matches[:limit]

    # -- shaping -----------------------------------------------------------

    @staticmethod
    def _vote(row: dict) -> dict:
        return dict(row)

    @staticmethod
    def _bill(row: dict) -> dict:
        # GovTrack documents the sponsor as an object but has published it as a bare
        # name too, so both are read rather than assuming one.
        sponsor = row.get("sponsor")
        sponsor_name = (sponsor.get("name") if isinstance(sponsor, dict) else sponsor) or None
        return {
            "display_number": row.get("display_number"),
            "title_without_number": row.get("title_without_number"),
            "title": row.get("title"),
            "bill_type_label": row.get("bill_type_label"),
            "congress": _to_int(row.get("congress")),
            "introduced_date": row.get("introduced_date"),
            "current_status": row.get("current_status"),
            "current_status_label": row.get("current_status_label"),
            "current_status_date": row.get("current_status_date"),
            "current_chamber": row.get("current_chamber"),
            "sponsor": sponsor_name,
            "is_alive": row.get("is_alive"),
            "is_current": row.get("is_current"),
            "link": row.get("link"),
        }

    @staticmethod
    def _role(row: dict) -> dict:
        person = row.get("person") or {}
        district = row.get("district")
        state = row.get("state")
        place = "-".join(str(part) for part in (state, district) if part) or state
        return {
            "person_name": person.get("name"),
            "party": row.get("party"),
            "role_type": row.get("role_type"),
            "state": state,
            "district": district,
            "chamber": "senate" if row.get("role_type") == "senator" else "house",
            "place": place,
            "leadership_title": row.get("leadership_title"),
            "startdate": row.get("startdate"),
            "enddate": row.get("enddate"),
            "current": row.get("current"),
            "link": person.get("link"),
        }

    @staticmethod
    def _committee(row: dict) -> dict:
        # A subcommittee nests a copy of its parent, and leaves most fields null, so
        # the name and code are read from whichever of the two carries them.
        parent = row.get("committee") or {}
        members = row.get("members") or []
        return {
            "name": row.get("name") or parent.get("name"),
            "abbrev": row.get("abbrev") or parent.get("abbrev"),
            "code": row.get("code") or parent.get("code"),
            "committee_type": row.get("committee_type") or parent.get("committee_type"),
            "jurisdiction": row.get("jurisdiction") or parent.get("jurisdiction"),
            "obsolete": row.get("obsolete") if row.get("obsolete") is not None else parent.get("obsolete"),
            "member_count": len(members) if members else None,
            "url": row.get("url") or parent.get("url"),
        }

    @staticmethod
    def vote_result(vote: dict) -> str:
        """How a vote went, in GovTrack's and the chamber's own words."""
        if vote.get("result"):
            return str(vote["result"])
        passed = vote.get("passed")
        if passed is True:
            return "Passed (no result text published)"
        if passed is False:
            return "Failed (no result text published)"
        return "Result not published"

    @staticmethod
    def freshness() -> str:
        """Votes and bills are recorded as they happen, so freshness is when we read."""
        return utc_now_iso()


def _to_int(value) -> int | None:
    if value in _MISSING:
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None
