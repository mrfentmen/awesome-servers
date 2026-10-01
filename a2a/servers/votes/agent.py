"""The GovTrack agent: four free skills over congressional records, one premium scorecard.

  - roll-call-votes:   the votes in a congress and chamber, with the result and margin
  - bill-lookup:       bills by search term, type or status
  - member-lookup:     members by state, party, role or current/past
  - committee-lookup:  committees by name, abbreviation or code
  - chamber-scorecard: a chamber's votes rolled up (premium)

The scorecard is premium because it is the one question the free skills cannot answer:
`roll-call-votes` hands back rows, and turning a page of them into a chamber's
behaviour — the pass rate, the average margin, how often the parties voted as one
block, which kinds of vote decide or do not, and the longest run of one-way outcomes —
is the caller's arithmetic. It is computed on the licence gateway, so an unpaid caller
gets the gateway's own message and no scorecard at all.

GovTrack has no id for a vote, only the number it gave it and a human link, and it
refuses to filter votes by category, number or order, so nothing here claims to sort
or rank them beyond the order GovTrack returns. Its margin and party figures are
GovTrack's own and are labelled as such.
"""

from __future__ import annotations

import re

from a2a_kit import GatewayClient, SkillAgent, empty_premium_answer, premium_call

from data import (
    BILL_DATASET,
    COMMITTEE_DATASET,
    DATASET,
    PRODUCT,
    ROLE_DATASET,
    GovTrackClient,
    UpstreamError,
)

SKILL_ROLL_CALL_VOTES = "roll-call-votes"
SKILL_BILL_LOOKUP = "bill-lookup"
SKILL_MEMBER_LOOKUP = "member-lookup"
SKILL_COMMITTEE_LOOKUP = "committee-lookup"
SKILL_CHAMBER_SCORECARD = "chamber-scorecard"

SOURCE = "GovTrack, from public congressional records"
MAX_LISTED = 8
MAX_SCORECARD_ROWS = 6
GATEWAY_TOOL = "votes_chamber_scorecard"
#: GovTrack holds nothing before the 1st Congress, and the 119th is the current one.
DEFAULT_CONGRESS = 119

CARD_SKILLS = [
    {
        "id": SKILL_ROLL_CALL_VOTES,
        "name": "Roll-call votes",
        "description": (
            "The roll-call votes of a congress and chamber in the order GovTrack numbers them: the "
            "question, the result in the chamber's own wording, the vote type and category, the "
            "margin, and the yea/nay/other counts. Optionally narrowed to one session."
        ),
        "tags": ["votes", "govtrack", "congress", "roll-call", "free"],
        "examples": [
            "what roll-call votes did the Senate hold in the 119th Congress?",
            "House votes in congress 119, session 2025",
            '{"skill": "roll-call-votes", "congress": 119, "chamber": "senate", "limit": 10}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_BILL_LOOKUP,
        "name": "Bill lookup",
        "description": (
            "Bills by search term, or by type and status: the bill number, its title, who introduced "
            "it, the date, where it is now and GovTrack's own status label. Status and type are "
            "checked against GovTrack's own vocabularies before the call."
        ),
        "tags": ["bills", "govtrack", "congress", "legislation", "free"],
        "examples": [
            "bills about infrastructure in the 119th Congress",
            "house bills that passed in congress 119",
            '{"skill": "bill-lookup", "congress": 119, "term": "infrastructure", "limit": 10}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_MEMBER_LOOKUP,
        "name": "Member lookup",
        "description": (
            "Members of Congress by state, party, chamber or current/past, with their district, "
            "leadership title and the dates they held the seat. GovTrack has no name filter on its "
            "member endpoint, so the search is by those attributes and the names come back with them."
        ),
        "tags": ["members", "govtrack", "congress", "representatives", "free"],
        "examples": [
            "who are the current Democratic senators from California?",
            "current representatives from Texas",
            '{"skill": "member-lookup", "state": "CA", "party": "Democrat", "limit": 10}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_COMMITTEE_LOOKUP,
        "name": "Committee lookup",
        "description": (
            "Congress's committees and subcommittees by name, abbreviation or GovTrack code, with the "
            "chamber, whether the committee is obsolete, and the jurisdiction the committee itself "
            "publishes. GovTrack refuses to filter this endpoint by name, so the full 355-committee "
            "list is read once and searched here."
        ),
        "tags": ["committees", "govtrack", "congress", "reference", "free"],
        "examples": [
            "which committee handles appropriations?",
            "look up the committee with code SSGA",
            '{"skill": "committee-lookup", "name": "appropriations", "limit": 5}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_CHAMBER_SCORECARD,
        "name": "Chamber scorecard",
        "description": (
            "A chamber's votes rolled up: how many it held and how many passed, the average margin, "
            "how often the parties voted as a single block, the outcome and average margin per vote "
            "category, the most and least contested votes, and the longest run of one-way outcomes. "
            "Premium: the roll-up runs behind a licence check on the gateway."
        ),
        "tags": ["votes", "govtrack", "congress", "scorecard", "analysis", "premium"],
        "examples": [
            "score the Senate's votes in the 119th Congress",
            "how often did the House vote as one party last congress?",
            '{"skill": "chamber-scorecard", "congress": 119, "chamber": "senate", "limit": 200}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
]

_CONGRESS_RE = re.compile(r"\b(\d{2,3})(?:st|nd|rd|th)?\s+congress\b", re.IGNORECASE)
#: "in congress 119" puts the number after the word, and is what people write.
_CONGRESS_BARE_RE = re.compile(r"\bcongress\s+(?:number\s+)?(\d{2,3})\b", re.IGNORECASE)
_SESSION_RE = re.compile(r"\bsession\s+(\d{4})\b", re.IGNORECASE)
_YEAR_RE = re.compile(r"\b(19[0-9]{2}|20[0-9]{2})\b")
_QUOTED_RE = re.compile(r"[\"“]([^\"”]{2,90})[\"”]")
_STATUS_RE = re.compile(
    r"\b(introduced|reported|passed|vetoed|failed|conference|enacted|law)\b", re.IGNORECASE
)
_TYPE_RE = re.compile(
    r"\b(house|senate)\s+(bill|resolution|concurrent resolution|joint resolution)s?\b",
    re.IGNORECASE,
)
#: Words describing the question rather than the thing being asked about.
_QUERY_STOP = frozenset("""
    a about all an and any are as at be been being but by can could do does did for from
    get give has have how i in into is it its just know like list make many me much my need
    of on one only or please see show so some tell that the their them there these this
    those to up us was were what when where which who whom whose why will with would
    vote votes voting roll call rollcall congress congressional senate house chamber member
    members bill bills committee committees current past last session
    look looks looking handles handle handling code codes about
""".split())

_SCORECARD_WORDS = re.compile(
    r"\b(score ?card|score|scored|scores|roll ?up|rollup|how often|average margin|party[- ]line|"
    r"as one (?:party|block)|"
    r"as a single block|tally|summary of .{0,24}votes|overall|aggregate|pass rate|"
    r"contested|most decisive|pattern)\b",
    re.IGNORECASE,
)
_BILL_WORDS = re.compile(
    r"\b(bills?|legislation|acts?|resolutions?|house ?bill|senate ?bill|hr|s\.\d|h\.r\.|s\.)\b",
    re.IGNORECASE,
)
_MEMBER_WORDS = re.compile(
    r"\b(members?|representatives?|senators?|congressmen|congresswomen|who (?:is|are) .{0,20}"
    r"(?:senator|representative)|caucus)\b",
    re.IGNORECASE,
)
_COMMITTEE_WORDS = re.compile(
    r"\b(committees?|subcommittees?|which committee|committee (?:code|abbrev|list|reference))\b",
    re.IGNORECASE,
)
_CHAMBER_WORDS = re.compile(r"\b(senate|house)\b", re.IGNORECASE)
#: People write states as names; GovTrack filters on the two-letter code.
_STATE_NAMES = {
    "alabama": "AL", "alaska": "AK", "arizona": "AZ", "arkansas": "AR", "california": "CA",
    "colorado": "CO", "connecticut": "CT", "delaware": "DE", "florida": "FL", "georgia": "GA",
    "hawaii": "HI", "idaho": "ID", "illinois": "IL", "indiana": "IN", "iowa": "IA",
    "kansas": "KS", "kentucky": "KY", "louisiana": "LA", "maine": "ME", "maryland": "MD",
    "massachusetts": "MA", "michigan": "MI", "minnesota": "MN", "mississippi": "MS",
    "missouri": "MO", "montana": "MT", "nebraska": "NE", "nevada": "NV",
    "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
    "north carolina": "NC", "north dakota": "ND", "ohio": "OH", "oklahoma": "OK", "oregon": "OR",
    "pennsylvania": "PA", "rhode island": "RI", "south carolina": "SC", "south dakota": "SD",
    "tennessee": "TN", "texas": "TX", "utah": "UT", "vermont": "VT", "virginia": "VA",
    "washington": "WA", "west virginia": "WV", "wisconsin": "WI", "wyoming": "WY",
    "district of columbia": "DC", "puerto rico": "PR", "guam": "GU", "american samoa": "AS",
    "virgin islands": "VI", "northern mariana islands": "MP",
}
_STATE_NAME_RE = re.compile(
    r"\b(" + "|".join(sorted((re.escape(name) for name in _STATE_NAMES), key=len, reverse=True)) + r")\b",
    re.IGNORECASE,
)
_PARTY_WORDS = re.compile(
    r"\b(democrat\w*|republican\w*|independent\w*|libertarian\w*|green\w*)\b",
    re.IGNORECASE,
)

HELP = (
    "I read GovTrack's congressional records. Ask me:\n"
    "  • what roll-call votes did the Senate hold in the 119th Congress?\n"
    "  • bills about infrastructure in the 119th Congress\n"
    "  • who are the current Democratic senators from California?\n"
    "  • which committee handles appropriations?\n"
    "  • score the Senate's votes in the 119th Congress  (premium)\n"
    "Votes come back in GovTrack's own order — it will not sort them, and it has no\n"
    "id for a vote, only the number it gave it. Margins and party figures are\n"
    "GovTrack's own, not the chamber's."
)


def message_text(message: dict) -> str:
    parts = message.get("parts") or []
    return " ".join(part.get("text", "") for part in parts if part.get("kind") == "text").strip()


def message_data(message: dict) -> dict:
    merged: dict = {}
    for part in message.get("parts") or []:
        if part.get("kind") == "data" and isinstance(part.get("data"), dict):
            merged.update(part["data"])
    return merged


def _first(params: dict, *names, default=None):
    for name in names:
        if name in params and params[name] not in (None, ""):
            return params[name]
    return default


def term_from_text(text: str) -> str | None:
    """A bill search term: a quoted phrase, or the words that are left."""
    match = _QUOTED_RE.search(text)
    if match:
        return match.group(1).strip()
    words = [word for word in re.findall(r"[A-Za-z0-9][A-Za-z0-9'’\-]*", text)
             if word.lower() not in _QUERY_STOP and not _YEAR_RE.fullmatch(word)]
    return " ".join(words[:6]) or None


def parse(message: dict) -> dict:
    """Incoming message -> {skill, params, explicit}. Never raises."""
    text = message_text(message)
    data = message_data(message)
    requested = _first(data, "skill", "skill_id")

    congress = _first(data, "congress")
    if congress is None:
        match = _CONGRESS_RE.search(text) or _CONGRESS_BARE_RE.search(text)
        congress = match.group(1) if match else None
    if congress is None:
        # A bare "the 119th Congress" is what people actually write.
        match = re.search(r"\b(\d{2,3})(?:st|nd|rd|th)\b", text)
        congress = match.group(1) if match else None
    chamber = _first(data, "chamber")
    if chamber is None:
        match = _CHAMBER_WORDS.search(text)
        chamber = match.group(1).lower() if match else None
    session = _first(data, "session")
    if session is None:
        match = _SESSION_RE.search(text)
        session = match.group(1) if match else None
    # The term is what is left once the filters are taken out, so the congress
    # ordinal, the status words and the type words are masked first.
    scannable = _CONGRESS_BARE_RE.sub(" ", _CONGRESS_RE.sub(" ", text))
    scannable = re.sub(r"\b\d{2,3}(?:st|nd|rd|th)\b", " ", scannable)
    for pattern in (_STATUS_RE, _TYPE_RE):
        scannable = pattern.sub(" ", scannable)
    term = _first(data, "term", "q", "query")
    if term is None:
        term = term_from_text(scannable)
    state = _first(data, "state")
    if state is None:
        match = re.search(r"\bfrom\s+([A-Z]{2})\b", text)
        if match:
            state = match.group(1)
        else:
            named = _STATE_NAME_RE.search(text)
            state = _STATE_NAMES[named.group(1).lower()] if named else None
    party = _first(data, "party")
    if party is None:
        match = _PARTY_WORDS.search(text)
        party = match.group(1).rstrip("s") if match else None
    term_kind = _first(data, "term_type", "current")
    status = _first(data, "status", "current_status")
    if status is None:
        match = _STATUS_RE.search(text)
        status = match.group(1) if match else None
    bill_type = _first(data, "bill_type")
    if bill_type is None:
        match = _TYPE_RE.search(text)
        if match:
            bill_type = f"{match.group(1)} {match.group(2)}"
    name = _first(data, "name", "committee", "committee_name")
    limit = _first(data, "limit", default=20)

    all_skills = (SKILL_ROLL_CALL_VOTES, SKILL_BILL_LOOKUP, SKILL_MEMBER_LOOKUP,
                  SKILL_COMMITTEE_LOOKUP, SKILL_CHAMBER_SCORECARD)
    asked_for_scorecard = bool(_SCORECARD_WORDS.search(text))
    if requested in all_skills:
        skill = requested
    elif asked_for_scorecard:
        skill = SKILL_CHAMBER_SCORECARD
    elif _COMMITTEE_WORDS.search(text):
        skill = SKILL_COMMITTEE_LOOKUP
    elif _MEMBER_WORDS.search(text):
        skill = SKILL_MEMBER_LOOKUP
    elif _BILL_WORDS.search(text):
        skill = SKILL_BILL_LOOKUP
    else:
        skill = SKILL_ROLL_CALL_VOTES

    # Each skill carries only what it reads, so a stray word cannot become a filter.
    if skill != SKILL_MEMBER_LOOKUP:
        state = party = term_kind = None
    if skill not in (SKILL_BILL_LOOKUP,):
        status = bill_type = None
    if skill != SKILL_BILL_LOOKUP:
        term = None
    if skill == SKILL_COMMITTEE_LOOKUP and name is None:
        name = term_from_text(text)
    if skill in (SKILL_ROLL_CALL_VOTES, SKILL_CHAMBER_SCORECARD):
        status = bill_type = name = None
    if skill == SKILL_BILL_LOOKUP:
        # GovTrack's bill endpoint has no chamber filter, so the chamber is not carried.
        chamber = None
    if skill == SKILL_MEMBER_LOOKUP:
        name = None
    params: dict = {"limit": limit}
    for key, value in (("congress", congress), ("chamber", chamber), ("session", session),
                       ("term", term), ("state", state), ("party", party),
                       ("term_type", term_kind), ("status", status), ("bill_type", bill_type),
                       ("name", name)):
        if value is not None:
            params[key] = value
    if skill == SKILL_CHAMBER_SCORECARD:
        params["congress"] = congress or DEFAULT_CONGRESS
        params["limit"] = _first(data, "limit", default=200)
    if not requested and (not text.strip()
                         or re.search(r"\b(help|what can you do|commands?)\b", text, re.IGNORECASE)):
        skill, params = "help", {}
    explicit = bool(requested or asked_for_scorecard or _COMMITTEE_WORDS.search(text)
                    or _MEMBER_WORDS.search(text) or _BILL_WORDS.search(text))
    return {"skill": skill, "params": params, "explicit": explicit}


# -- shared shape ---------------------------------------------------------


def _artifact(params: dict, client: GovTrackClient, dataset: str = DATASET, **extra) -> dict:
    artifact = {
        "dataset": dataset,
        "product": PRODUCT,
        "source": SOURCE,
        "freshness": client.freshness(),
    }
    artifact.update(extra)
    return artifact


# -- skills ---------------------------------------------------------------


def run_roll_call_votes(params: dict, client: GovTrackClient) -> dict:
    try:
        result = client.votes(congress=params.get("congress"), chamber=params.get("chamber"),
                              session=params.get("session"), limit=params.get("limit", 20))
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    votes = result["votes"]
    artifact = _artifact(params, client, **result)
    if not votes:
        return {
            "final_state": "completed",
            "message": (
                f"GovTrack holds no roll-call vote for {_vote_scope(result)}. Try a congress from "
                "93 (the 93rd, 1973) to the one now, and both chambers are written as Senate or House."
            ),
            "artifact": artifact,
            "watch": None,
    }
    listing = "\n".join(
        f"  • #{vote.get('number') or 'number not reported'} {client.vote_result(vote)}"
        + (f"\n    {vote['question']}" if vote.get("question") else "")
        + f" — {vote.get('vote_type') or 'type not reported'}, "
          f"{vote.get('category') or 'category not reported'}, "
          f"{vote.get('total_plus', 0)} yea / {vote.get('total_minus', 0)} nay"
        for vote in votes[:MAX_LISTED]
    )
    return {
        "final_state": "completed",
        "message": (
            f"{result['total']:,} roll-call vote(s) in GovTrack{_vote_scope(result)} "
            f"(showing {len(votes)}, in GovTrack's own order):\n{listing}\n"
            f"Source: {DATASET} (read live). Margins and party figures are GovTrack's own, and the "
            "result text is the chamber's."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_bill_lookup(params: dict, client: GovTrackClient) -> dict:
    try:
        result = client.bills(congress=params.get("congress"), term=params.get("term"),
                              bill_type=params.get("bill_type"), status=params.get("status"),
                              limit=params.get("limit", 20))
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    bills = result["bills"]
    artifact = _artifact(params, client, dataset=BILL_DATASET, **result)
    if not bills:
        return {
            "final_state": "completed",
            "message": (
                f"GovTrack holds no bill{_bill_scope(result)}. Bill status and type are GovTrack's "
                "own vocabularies — ask for one that passed, or introduced, rather than a phrase."
            ),
            "artifact": artifact,
            "watch": None,
        }
    listing = "\n".join(
        f"  • {bill.get('display_number') or 'number not reported'} — "
        f"{bill.get('title_without_number') or 'title not reported'}\n"
        f"    {bill.get('current_status_label') or 'status not reported'}"
        + (f" as of {bill['current_status_date']}" if bill.get("current_status_date") else "")
        + (f", sponsor {bill['sponsor']}" if bill.get("sponsor") else "")
        + (f", introduced {bill['introduced_date']}" if bill.get("introduced_date") else "")
        for bill in bills[:MAX_LISTED]
    )
    return {
        "final_state": "completed",
        "message": (
            f"{result['total']:,} bill(s) in GovTrack{_bill_scope(result)} (showing {len(bills)}):\n"
            f"{listing}\nSource: {BILL_DATASET} (read live)."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_member_lookup(params: dict, client: GovTrackClient) -> dict:
    try:
        result = client.roles(
            current=params.get("term_type", "true"), state=params.get("state"),
            party=params.get("party"), limit=params.get("limit", 20),
        )
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    members = result["members"]
    artifact = _artifact(params, client, dataset=ROLE_DATASET, **result)
    if not members:
        return {
            "final_state": "completed",
            "message": (
                "No member in GovTrack matches that. Filters are state (two letters), party "
                "(Democrat, Republican, Independent…) and current or past — GovTrack has no name "
                "filter on this endpoint."
            ),
            "artifact": artifact,
            "watch": None,
        }
    listing = "\n".join(
        f"  • {member.get('person_name') or 'name not reported'} — {member.get('role_type') or 'role not reported'}"
        + (f" for {member['place']}" if member.get("place") else "")
        + (f", {member['party']}" if member.get("party") else "")
        + (f", {member['leadership_title']}" if member.get("leadership_title") else "")
        for member in members[:MAX_LISTED]
    )
    return {
        "final_state": "completed",
        "message": (
            f"{result['total']:,} member role(s) in GovTrack{_role_scope(result)} "
            f"(showing {len(members)}):\n{listing}\n"
            f"Source: {ROLE_DATASET} (read live). GovTrack has no name filter here, so the search is "
            "by state, party and current or past."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_committee_lookup(params: dict, client: GovTrackClient) -> dict:
    try:
        matches = client.find_committees(params.get("name"), limit=params.get("limit", 10))
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    artifact = _artifact(params, client, dataset=COMMITTEE_DATASET, name=params.get("name"),
                         committee_matches=matches, count=len(matches))
    if not matches:
        return {
            "final_state": "completed",
            "message": (
                f"No committee in GovTrack matches “{params.get('name')}”. Search by name "
                "(“Appropriations”), by abbreviation (H.Approps) or by code (SSGA). The list holds "
                "355 committees and subcommittees."
            ),
            "artifact": artifact,
            "watch": None,
        }
    listing = "\n".join(
        f"  • {committee.get('name') or 'name not reported'}"
        + (f" ({committee['abbrev']})" if committee.get("abbrev") else "")
        + (f" [{committee['committee_type']}]" if committee.get("committee_type") else "")
        + (f" code {committee['code']}" if committee.get("code") else "")
        + (" — obsolete" if committee.get("obsolete") else "")
        for committee in matches[:MAX_LISTED]
    )
    first = matches[0]
    jurisdiction = first.get("jurisdiction")
    detail = ""
    if jurisdiction:
        detail = (f"\n  • {first['name']} jurisdiction: {str(jurisdiction)[:300]}"
                  + ("…" if len(str(jurisdiction)) > 300 else ""))
    return {
        "final_state": "completed",
        "message": (
            f"{len(matches)} GovTrack committee match(es) for “{params.get('name')}”:\n{listing}"
            f"{detail}\nSource: {COMMITTEE_DATASET} (read live). GovTrack refuses to filter this "
            "endpoint by name, so the full 355-committee list is read and searched here."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_chamber_scorecard(params: dict, client: GovTrackClient, gateway: GatewayClient) -> dict:
    """The premium scorecard. Nothing here reads GovTrack.

    The gateway pages the chamber's votes and does the arithmetic behind its licence
    check, so a caller who has not paid gets the gateway's own message and no scorecard
    at all.
    """
    try:
        congress = client.check_congress(params.get("congress") or DEFAULT_CONGRESS)
        chamber = client.check_chamber(params.get("chamber") or "senate")
        limit = client.check_limit(params.get("limit") or 200, ceiling=300)
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    read, refused = premium_call(
        gateway, GATEWAY_TOOL,
        {"congress": congress, "chamber": chamber, "limit": limit},
        {"dataset": DATASET, "congress": congress, "chamber": chamber},
    )
    if refused:
        return refused
    if not isinstance(read, dict) or read.get("votesRead") is None:
        return empty_premium_answer(
            "The licence gateway answered without a scorecard, so there is nothing to report.",
            {"dataset": DATASET, "congress": congress, "chamber": chamber},
        )

    lines = [
        f"{read.get('chamber') or chamber} vote scorecard for the "
        f"{_ordinal(read.get('congress') or congress)} Congress: GovTrack holds "
        f"{read.get('totalVotes')} vote(s), and this run read {read.get('votesRead')} of them."
    ]
    if not read.get("votesRead"):
        lines.append("  • No vote to score. Try a congress GovTrack covers, 93 onwards.")
    else:
        lines.append(
            f"  • {read.get('passed', 0)} passed and {read.get('failed', 0)} failed of the "
            f"{read.get('decided', 0)} with a recorded outcome "
            f"({_percent(read.get('passRate'))} passed); {read.get('noResult')} published no result."
        )
        margin = read.get("averageMargin")
        lines.append(
            f"  • Average margin {margin:.2f} percentage points across the "
            f"{read.get('withMargin')} vote(s) that published one."
            if isinstance(margin, (int, float))
            else "  • Average margin: not published for these votes."
        )
        lines.append(
            f"  • The parties voted as one block on {read.get('partyLine', 0)} of "
            f"{read.get('withPartyUniformity')} vote(s) that published a party figure "
            f"({_percent(read.get('partyLineRate'))})."
        )
        by_category = read.get("byCategory") or []
        if by_category:
            lines.append("  • By category:")
            for row in by_category[:MAX_SCORECARD_ROWS]:
                lines.append(
                    f"      {row.get('category') or 'not reported'}: {row.get('count')} vote(s), "
                    f"{row.get('passed')} passed, average margin "
                    + (f"{row['averageMargin']:.2f}"
                       if isinstance(row.get("averageMargin"), (int, float)) else "not published")
                )
        contested = read.get("mostContested") or {}
        closest = read.get("closestVote") or {}
        if contested:
            lines.append(
                f"  • Widest margin: {contested.get('question') or 'question not reported'} "
                f"({contested.get('margin')} points, #{contested.get('number')})."
            )
        if closest:
            lines.append(
                f"  • Closest vote: {closest.get('question') or 'question not reported'} "
                f"({closest.get('margin')} points, #{closest.get('number')})."
            )
        streak = read.get("longestRun")
        if streak:
            lines.append(
                f"  • Longest run of one-way outcomes: {streak.get('count')} "
                f"{streak.get('outcome') or 'of one result'}, ending on vote "
                f"#{streak.get('endNumber') or 'not reported'}."
            )
    lines.append(
        "\nRolled up on the MCP gateway behind its licence check, from GovTrack's own votes "
        f"({DATASET}). Margins, party-line figures and outcomes are GovTrack's calculations on the "
        "chambers' published counts, and a vote with no published result is counted as undecided "
        "rather than as a failure."
    )
    artifact = {
        "dataset": DATASET,
        "source": SOURCE,
        "premium": True,
        "congress": read.get("congress"),
        "chamber": read.get("chamber"),
        "total_votes": read.get("totalVotes"),
        "votes_read": read.get("votesRead"),
        "passed": read.get("passed"),
        "failed": read.get("failed"),
        "no_result": read.get("noResult"),
        "decided": read.get("decided"),
        "pass_rate": read.get("passRate"),
        "average_margin": read.get("averageMargin"),
        "with_margin": read.get("withMargin"),
        "party_line": read.get("partyLine"),
        "with_party_uniformity": read.get("withPartyUniformity"),
        "party_line_rate": read.get("partyLineRate"),
        "by_category": read.get("byCategory"),
        "most_contested": read.get("mostContested"),
        "closest_vote": read.get("closestVote"),
        "longest_run": read.get("longestRun"),
    }
    return {"final_state": "completed", "message": "\n".join(lines), "artifact": artifact, "watch": None}


class VotesAgent(SkillAgent):
    name = "govtrack-votes"
    card_name = "GovTrack Votes Agent"
    card_description = (
        "Read-only agent over GovTrack's congressional records: the roll-call votes of a congress "
        "and chamber with the chamber's own result wording, bill lookup by term, type or status, "
        "members by state and party, and the committee list with each committee's published "
        "jurisdiction — plus a chamber scorecard computed on a licence-gated gateway. Every answer "
        "is read live from GovTrack, and GovTrack's own margin and party-line figures are labelled "
        "as its calculations."
    )
    env_prefix = "VOTES"
    datasets = (DATASET, BILL_DATASET, ROLE_DATASET, COMMITTEE_DATASET)
    card_skills = CARD_SKILLS

    def __init__(self, client: GovTrackClient | None = None,
                 gateway: GatewayClient | None = None) -> None:
        self.client = client or GovTrackClient()
        self.gateway = gateway or GatewayClient()

    def parse(self, message: dict) -> dict:
        return parse(message)

    def missing(self, skill: str, params: dict) -> list[str]:
        if skill == "help":
            return []
        if skill == SKILL_COMMITTEE_LOOKUP:
            return [] if params.get("name") else ["name"]
        return []

    def input_prompt(self, skill: str, missing: list[str]) -> str:
        return (
            "Which committee? Give me a name (“Appropriations”), an abbreviation (H.Approps) or a "
            "GovTrack code (SSGA) — the list holds 355 committees and subcommittees."
        )

    def run(self, request: dict) -> dict:
        skill = request["skill"]
        params = request["params"]
        if request["missing"]:
            return {
                "final_state": "input-required",
                "message": self.input_prompt(skill, request["missing"]),
                "artifact": None,
                "watch": None,
            }
        if skill == SKILL_ROLL_CALL_VOTES:
            return run_roll_call_votes(params, self.client)
        if skill == SKILL_BILL_LOOKUP:
            return run_bill_lookup(params, self.client)
        if skill == SKILL_MEMBER_LOOKUP:
            return run_member_lookup(params, self.client)
        if skill == SKILL_COMMITTEE_LOOKUP:
            return run_committee_lookup(params, self.client)
        if skill == SKILL_CHAMBER_SCORECARD:
            return run_chamber_scorecard(params, self.client, self.gateway)
        if skill == "help":
            return {"final_state": "completed", "message": HELP, "artifact": None, "watch": None}
        return {
            "final_state": "input-required",
            "message": "I did not catch which skill that is. Try “bills about infrastructure in the 119th Congress”.",
            "artifact": None,
            "watch": None,
        }


def _percent(value) -> str:
    return f"{value:.1f}%" if isinstance(value, (int, float)) else "not reported"


def _ordinal(congress) -> str:
    number = int(congress)
    if 10 <= number % 100 <= 20:
        suffix = "th"
    else:
        suffix = {1: "st", 2: "nd", 3: "rd"}.get(number % 10, "th")
    return f"{number}{suffix}"


def _vote_scope(result: dict) -> str:
    filters = result.get("filters") or {}
    scope = ""
    if filters.get("congress"):
        scope += f" in the {_ordinal(filters['congress'])} Congress"
    if filters.get("chamber"):
        scope += f" in the {filters['chamber']}"
    if filters.get("session"):
        scope += f" for session {filters['session']}"
    return scope or " at all"


def _bill_scope(result: dict) -> str:
    filters = result.get("filters") or {}
    scope = ""
    if filters.get("congress"):
        scope += f" in the {_ordinal(filters['congress'])} Congress"
    if filters.get("bill_type"):
        scope += f" of type {filters['bill_type'].replace('_', ' ')}"
    if filters.get("current_status"):
        scope += f" with status {filters['current_status'].replace('_', ' ')}"
    if result.get("query"):
        scope += f" matching “{result['query']}”"
    return scope or ""


def _role_scope(result: dict) -> str:
    filters = result.get("filters") or {}
    scope = ""
    if filters.get("current") == "true":
        scope += " currently serving"
    elif filters.get("current") == "false":
        scope += " no longer serving"
    if filters.get("state"):
        scope += f" from {filters['state']}"
    if filters.get("party"):
        scope += f" as {filters['party']}"
    return scope or ""


__all__ = [
    "CARD_SKILLS",
    "DEFAULT_CONGRESS",
    "GATEWAY_TOOL",
    "HELP",
    "MAX_LISTED",
    "SKILL_BILL_LOOKUP",
    "SKILL_CHAMBER_SCORECARD",
    "SKILL_COMMITTEE_LOOKUP",
    "SKILL_MEMBER_LOOKUP",
    "SKILL_ROLL_CALL_VOTES",
    "UpstreamError",
    "VotesAgent",
    "message_data",
    "message_text",
    "parse",
    "run_bill_lookup",
    "run_chamber_scorecard",
    "run_committee_lookup",
    "run_member_lookup",
    "run_roll_call_votes",
    "term_from_text",
]
