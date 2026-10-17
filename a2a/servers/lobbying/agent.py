"""The Senate LDA agent: four free skills over lobbying disclosure, one premium tally.

  - client-filings:  the filings one registrant (lobbying firm) made in a year
  - filing-detail:   one filing — its issues, its lobbyists, their covered positions
  - lobbyist-filings: the filings a named lobbyist appears on
  - client-issues:   the issue areas a registrant's filings cover, read from them
  - client-spend:    a registrant's disclosed money across a year (not implemented here)

The tally is premium because it is the one question the free skills do not answer:
`client-filings` lists the filings and each row carries its own expenses, and reading
four of those rows is the caller's arithmetic. Adding them up properly means paging
the whole year, separating the quarterly expense reports from the registrations and
amendments that report no amount, saying which quarters are actually in, and
reporting a null as "not reported" rather than as zero. That is done on the licence
gateway, so an unpaid caller gets a not-implemented stub message and no total.

LDA has no issue filter: `issue`, `issue_specific`, `search` and `general_issue_code`
are all accepted and all silently ignored, returning the unfiltered count. So the
issue areas here are read out of each filing's own `lobbying_activities` rather than
pretending the service can search them.
"""

from __future__ import annotations

import re

from a2a_kit import SkillAgent

from data import (
    CLIENTS_DATASET,
    DATASET,
    FILING_TYPE_LABELS,
    LdaClient,
    PRODUCT,
    UpstreamError,
)

SKILL_CLIENT_FILINGS = "client-filings"
SKILL_FILING_DETAIL = "filing-detail"
SKILL_LOBBYIST_FILINGS = "lobbyist-filings"
SKILL_CLIENT_ISSUES = "client-issues"
SKILL_CLIENT_SPEND = "client-spend"

SOURCE = "US Senate, Lobbying Disclosure Act (LDA)"
MAX_LISTED = 8
MAX_ACTIVITY_LISTED = 6
MAX_LOBBYISTS_LISTED = 8
GATEWAY_TOOL = "lobbying_client_spend"
DEFAULT_YEAR = 2024

CARD_SKILLS = [
    {
        "id": SKILL_CLIENT_FILINGS,
        "name": "Filings by a lobbying firm",
        "description": (
            "The filings one registrant (the lobbying firm) made in a year: each filing's type and "
            "period, when it was posted, the client it was for, the expenses or income it reported, "
            "how many lobbyists it names, and the issue areas it covers. Optional filters for the "
            "filing type and the client."
        ),
        "tags": ["lobbying", "senate", "lda", "registrant", "filings", "free"],
        "examples": [
            "which lobbying filings did Lockheed Martin make in 2024?",
            "Lockheed Martin filings 2023, first quarter only",
            '{"skill": "client-filings", "registrant": "lockheed martin", "year": 2024, "limit": 10}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_FILING_DETAIL,
        "name": "One filing in full",
        "description": (
            "One filing by its uuid: the registrant and client, the reported money and the expense "
            "method used, and every issue area with the bill references the registrant gave and the "
            "lobbyists on it with the government positions they covered."
        ),
        "tags": ["lobbying", "senate", "lda", "filing", "detail", "free"],
        "examples": [
            "show me filing 9ad88323-8325-40eb-9036-eb5ea7c6827f",
            "who lobbied on the issues in that filing?",
            '{"skill": "filing-detail", "uuid": "9ad88323-8325-40eb-9036-eb5ea7c6827f"}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_LOBBYIST_FILINGS,
        "name": "Filings a lobbyist appears on",
        "description": (
            "The filings a named lobbyist appears on in a year, with the registrant, the client, the "
            "period and the money. LDA has no lobbyist directory worth reading — its own "
            "lobbyist endpoint ignores every filter — so lobbyists are read here as the ones named "
            "inside filings, which is what the service will actually answer."
        ),
        "tags": ["lobbying", "senate", "lda", "lobbyist", "filings", "free"],
        "examples": [
            "which filings is the lobbyist Smith on in 2024?",
            "filings naming the lobbyist SMITH GARSON",
            '{"skill": "lobbyist-filings", "lobbyist": "smith garson", "year": 2024}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_CLIENT_ISSUES,
        "name": "Issue areas a registrant lobbied on",
        "description": (
            "The issue areas one registrant's filings cover in a year, with how many filings covered "
            "each one and the issues' own LDA codes. Read out of the filings' lobbying activities, "
            "because LDA's own issue filters are accepted and then ignored."
        ),
        "tags": ["lobbying", "senate", "lda", "issues", "subjects", "free"],
        "examples": [
            "what issues did Lockheed Martin lobby on in 2024?",
            "issue areas covered by the Boeing filings in 2023",
            '{"skill": "client-issues", "registrant": "lockheed martin", "year": 2024}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_CLIENT_SPEND,
        "name": "A registrant's disclosed spending",
        "description": (
            "A registrant's disclosed money across a year: the total expenses reported, the largest "
            "single filing and its period, the expenses per quarter with the quarters that reported "
            "no amount named as missing rather than counted as zero, and how many filings and "
            "lobbyists the year covers. Premium: the total is computed on a removed hosted service."
        ),
        "tags": ["lobbying", "senate", "lda", "spending", "totals", "analysis",],
        "examples": [
            "how much did Lockheed Martin disclose for lobbying in 2024?",
            "total the expenses on Google's lobbying filings in 2023",
            '{"skill": "client-spend", "registrant": "lockheed martin", "year": 2024}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
]

_UUID_RE = re.compile(r"\b([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b", re.IGNORECASE)
_YEAR_RE = re.compile(r"\b(19[9]\d|20[0-9]{2})\b")
_QUOTED_RE = re.compile(r"[\"“]([^\"”]{2,90})[\"”]")
_TYPE_WORDS = re.compile(
    r"\b(first|1st|second|2nd|third|3rd|fourth|4th)\s+quarter\b"
    r"|\b(registration|amendment|termination)\b",
    re.IGNORECASE,
)
#: Words describing the question rather than the registrant being asked about.
_QUERY_STOP = frozenset("""
    a about all an and any are as at be been being but by can could do does did for from
    get give has have how i in into is it its just know like list make many me much my need
    of on one only or please see show so some tell that the their them there these this
    those to up us was were what when where which who whom whose why will with would
    lobbying lobby lobbied lobbyist lobbyists registrant registrants filing filings senate disclosure
    disclose disclosed discloses lda spent spends spending money expenses expense amount
    amounts total totals issue issues topic topics subject subjects matter matters
    quarter quarters first second third fourth registration registrations amendment
    amendments termination terminations watched covers covered named names called name
    anything something recent naming named
""".split())

_ISSUE_WORDS = re.compile(
    r"\b(issues?|issue areas?|on what|topics?|subjects?|what did .{0,30}lobby (?:on|about)|"
    r"covered? what)\b",
    re.IGNORECASE,
)
_LOBBYIST_WORDS = re.compile(
    r"\b(lobbyists?|lobbied by|which filings .{0,30}lobbyist|who is the lobbyist|"
    r"named lobbyist)\b",
    re.IGNORECASE,
)
_SPEND_WORDS = re.compile(
    r"\b(spend|spent|spending|how much|total(?:l?ed)?|tally|roll[- ]?up|rollup|"
    r"add(?:ed)? up|sum|across the (?:whole )?year|per quarter|biggest filing|"
    r"largest filing|disclosed for lobbying)\b",
    re.IGNORECASE,
)

HELP = (
    "I read the US Senate's lobbying disclosure filings. Ask me:\n"
    "  • which lobbying filings did Lockheed Martin make in 2024?\n"
    "  • show me filing 9ad88323-8325-40eb-9036-eb5ea7c6827f\n"
    "  • which filings is the lobbyist Smith on in 2024?\n"
    "  • what issues did Lockheed Martin lobby on in 2024?\n"
    "  • how much did Lockheed Martin disclose for lobbying in 2024?  (not implemented here)\n"
    "A registrant is the lobbying firm and a client is who pays it; they are different\n"
    "and I report both. A filing that reports no amount says so — I never count it as zero.\n"
    "LDA has no issue search, so issues come from inside each filing."
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


def name_from_text(text: str, name: str | None) -> str | None:
    """A registrant or lobbyist name only when the text offers one."""
    if name:
        return None
    match = _QUOTED_RE.search(text)
    if match:
        return match.group(1).strip()
    words = [word for word in re.findall(r"[A-Za-z0-9][A-Za-z0-9.'’&/\-()]*", text)
             if word.lower() not in _QUERY_STOP and not _YEAR_RE.fullmatch(word)
             and not _UUID_RE.fullmatch(word)]
    if not words:
        return None
    # One capitalised word is a name on its own ("Google"); one lowercase word is not.
    if len(words) == 1 and not words[0][:1].isupper():
        return None
    return " ".join(words[:6]).strip(" .,'’-")


def parse(message: dict) -> dict:
    """Incoming message -> {skill, params, explicit}. Never raises."""
    text = message_text(message)
    data = message_data(message)
    requested = _first(data, "skill", "skill_id")

    uuid = _first(data, "uuid", "filing_uuid", "filing_id")
    if uuid is None:
        match = _UUID_RE.search(text)
        uuid = match.group(1) if match else None
    year = _first(data, "year", "filing_year")
    if year is None:
        match = _YEAR_RE.search(text)
        year = match.group(1) if match else None
    registrant = _first(data, "registrant", "registrant_name", "company", "firm")
    lobbyist = _first(data, "lobbyist", "lobbyist_name")
    client = _first(data, "client", "client_name")
    filing_type = _first(data, "filing_type", "type", "quarter")
    scannable = text
    if filing_type is None:
        match = _TYPE_WORDS.search(text)
        if match:
            filing_type = match.group(0)
            # "first quarter" is a filter, not part of the registrant's name.
            scannable = f"{text[:match.start()]} {text[match.end():]}"
    name = name_from_text(scannable, registrant or lobbyist or client)
    limit = _first(data, "limit", default=20)

    all_skills = (SKILL_CLIENT_FILINGS, SKILL_FILING_DETAIL, SKILL_LOBBYIST_FILINGS,
                  SKILL_CLIENT_ISSUES, SKILL_CLIENT_SPEND)
    asked_for_spend = bool(_SPEND_WORDS.search(text))
    if requested in all_skills:
        skill = requested
    elif uuid:
        skill = SKILL_FILING_DETAIL
    elif _LOBBYIST_WORDS.search(text):
        skill = SKILL_LOBBYIST_FILINGS
    elif asked_for_spend:
        skill = SKILL_CLIENT_SPEND
    elif _ISSUE_WORDS.search(text):
        skill = SKILL_CLIENT_ISSUES
    else:
        skill = SKILL_CLIENT_FILINGS

    # Only the skills that search by name carry one, and only the lobbyist skill a lobbyist.
    if skill == SKILL_FILING_DETAIL:
        name = registrant = lobbyist = client = None
    if skill == SKILL_LOBBYIST_FILINGS and not lobbyist:
        # The lobbyist skill's only search term is the lobbyist.
        lobbyist = name
        name = None
    if skill != SKILL_LOBBYIST_FILINGS:
        lobbyist = None
    if skill not in (SKILL_CLIENT_FILINGS, SKILL_CLIENT_ISSUES, SKILL_CLIENT_SPEND):
        filing_type = client = None
    if skill in (SKILL_CLIENT_FILINGS, SKILL_CLIENT_ISSUES, SKILL_CLIENT_SPEND) and not registrant:
        registrant = name
        name = None

    params: dict = {"limit": limit}
    for key, value in (("uuid", uuid), ("year", year), ("registrant", registrant),
                       ("lobbyist", lobbyist), ("client", client), ("filing_type", filing_type)):
        if value is not None:
            params[key] = value
    if skill == SKILL_CLIENT_SPEND:
        params.setdefault("year", year or DEFAULT_YEAR)
        params["limit"] = _first(data, "limit", default=100)
    if not requested and (not text.strip()
                         or re.search(r"\b(help|what can you do|commands?)\b", text, re.IGNORECASE)):
        skill, params = "help", {}
    explicit = bool(requested or asked_for_spend or _LOBBYIST_WORDS.search(text)
                    or _ISSUE_WORDS.search(text) or uuid)
    return {"skill": skill, "params": params, "explicit": explicit}


# -- shared shape ---------------------------------------------------------


def _artifact(params: dict, client: LdaClient, **extra) -> dict:
    artifact = {
        "dataset": DATASET,
        "product": PRODUCT,
        "source": SOURCE,
        "freshness": client.freshness(),
    }
    artifact.update(extra)
    return artifact


def _filing_line(filing: dict, client: LdaClient) -> str:
    period = filing.get("filing_period_display") or FILING_TYPE_LABELS.get(
        filing.get("filing_type") or "", filing.get("filing_type") or "period not reported")
    return (
        f"{period}, posted {str(filing.get('dt_posted') or 'date not reported')[:10]} — "
        f"{filing.get('client_name') or 'client not reported'}, "
        f"{client.money_label(filing)}, {filing.get('lobbyist_count', 0)} lobbyist(s)"
    )


# -- skills ---------------------------------------------------------------


def run_client_filings(params: dict, client: LdaClient) -> dict:
    try:
        result = client.filings(
            year=params.get("year"), registrant=params.get("registrant"),
            client=params.get("client"), filing_type=params.get("filing_type"),
            limit=params.get("limit", 20),
        )
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    filings = result["filings"]
    artifact = _artifact(params, client, **result)
    if not filings:
        return {
            "final_state": "completed",
            "message": (
                f"LDA holds no filing for {_scope(result)} in that year. The registrant name has to "
                "be part of the name LDA files, and the year has to be one it covers — 1993 onwards."
            ),
            "artifact": artifact,
            "watch": None,
        }
    listing = "\n".join(f"  • {_filing_line(filing, client)}" for filing in filings[:MAX_LISTED])
    suffix = ""
    if len(filings) > MAX_LISTED:
        suffix = f"\n  • ... {len(filings) - MAX_LISTED} more in the artifact."
    return {
        "final_state": "completed",
        "message": (
            f"{result['total']:,} filing(s) in LDA{_scope(result)} (showing {len(filings)}):\n"
            f"{listing}{suffix}\n"
            f"Source: {DATASET} (read live). A registrant is the lobbying firm and the client is who "
            "pays it; a filing that reports no amount says so rather than reporting zero."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_filing_detail(params: dict, client: LdaClient) -> dict:
    try:
        filing = client.filing_detail(params.get("uuid"))
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    artifact = _artifact(params, client, filing=filing)
    if filing is None:
        return {
            "final_state": "completed",
            "message": (
                f"LDA holds no filing under uuid {params['uuid']}. A filing id is the uuid in its "
                "document link; ask me for a registrant's filings and I will list them."
            ),
            "artifact": artifact,
            "watch": None,
        }
    period = filing.get("filing_period_display") or "period not reported"
    lines = [
        f"Filing {filing.get('filing_uuid')}: {period} {filing.get('filing_year') or ''}".strip(),
        f"  • registrant   {filing.get('registrant_name') or 'not reported'}"
        + (f" ({filing.get('registrant_city')}, {filing.get('registrant_state')})"
           if filing.get("registrant_city") else ""),
        f"  • client       {filing.get('client_name') or 'not reported'}",
        f"  • money        {client.money_label(filing)}",
        f"  • posted       {str(filing.get('dt_posted') or 'not reported')[:10]}",
    ]
    if filing.get("expenses_method"):
        lines.append(f"  • method       expenses method {filing['expenses_method']}")
    activities = filing.get("activities") or []
    if activities:
        lines.append(f"  • {len(activities)} issue area(s):")
        for activity in activities[:MAX_ACTIVITY_LISTED]:
            people = ", ".join(
                f"{entry['name'] or 'name not reported'}"
                + (f" ({entry['covered_position']})" if entry.get("covered_position") else "")
                for entry in (activity.get("lobbyists") or [])[:MAX_LOBBYISTS_LISTED]
            )
            lines.append(
                f"      [{activity.get('issue_code') or 'code not reported'}] "
                f"{activity.get('issue') or 'issue not reported'}"
                + (f" — {activity['description']}" if activity.get("description") else "")
            )
            lines.append(f"        lobbyists: {people}" if people else "        lobbyists: none listed")
        if len(activities) > MAX_ACTIVITY_LISTED:
            lines.append(f"      ... {len(activities) - MAX_ACTIVITY_LISTED} more in the artifact.")
    else:
        lines.append("  • LDA lists no issue area for this filing.")
    if filing.get("affiliated_organizations"):
        lines.append("  • affiliated   " + ", ".join(
            str(name) for name in filing["affiliated_organizations"] if name))
    if filing.get("conviction_disclosures"):
        lines.append(f"  • conviction disclosures on file: {len(filing['conviction_disclosures'])}")
    lines.append(
        f"\nSource: {DATASET} (read live). Issue areas are read from this filing's own lobbying "
        "activities, because LDA's issue filters are accepted and then ignored."
    )
    return {"final_state": "completed", "message": "\n".join(lines), "artifact": artifact, "watch": None}


def run_lobbyist_filings(params: dict, client: LdaClient) -> dict:
    try:
        result = client.filings(year=params.get("year"), lobbyist=params.get("lobbyist"),
                                limit=params.get("limit", 20))
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    filings = result["filings"]
    artifact = _artifact(params, client, **result)
    if not filings:
        return {
            "final_state": "completed",
            "message": (
                f"No filing in LDA names a lobbyist called “{result['filters'].get('lobbyist_name')}”"
                + (f" in {result['filters']['filing_year']}" if result["filters"].get("filing_year") else "")
                + ". Give the name as LDA files it, or ask which filings a registrant made instead."
            ),
            "artifact": artifact,
            "watch": None,
        }
    listing = "\n".join(f"  • {_filing_line(filing, client)}" for filing in filings[:MAX_LISTED])
    registrants = sorted({filing["registrant_name"] for filing in filings
                          if filing.get("registrant_name")})
    return {
        "final_state": "completed",
        "message": (
            f"{result['total']:,} filing(s) in LDA name a lobbyist called "
            f"“{result['filters'].get('lobbyist_name')}”{_scope(result)} (showing {len(filings)}):\n"
            f"{listing}\n"
            f"  • {len(registrants)} registrant(s) on this page: {', '.join(registrants[:MAX_LISTED])}\n"
            f"Source: {DATASET} (read live). LDA's own lobbyist endpoint ignores every filter, so "
            "lobbyists are read here as the ones named inside filings."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_client_issues(params: dict, client: LdaClient) -> dict:
    try:
        result = client.filings(year=params.get("year"), registrant=params.get("registrant"),
                                limit=params.get("limit", 100))
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    filings = result["filings"]
    artifact = _artifact(params, client, **result)
    if not filings:
        return {
            "final_state": "completed",
            "message": (
                f"LDA holds no filing for {_scope(result)}, so there are no issue areas to read."
            ),
            "artifact": artifact,
            "watch": None,
        }
    counts: dict[str, int] = {}
    for filing in filings:
        for issue in filing.get("issue_codes") or []:
            counts[issue] = counts.get(issue, 0) + 1
    ranked = sorted(counts.items(), key=lambda pair: (-pair[1], pair[0]))
    listing = "\n".join(f"  • {issue} — {count} of {len(filings)} filing(s) on this page"
                        for issue, count in ranked[:MAX_LISTED])
    if not ranked:
        listing = "  • LDA lists no issue area for these filings."
    return {
        "final_state": "completed",
        "message": (
            f"{len(filings)} filing(s) in LDA{_scope(result)} cover {len(ranked)} issue area(s):\n"
            f"{listing}\n"
            f"Source: {DATASET} (read live). Read out of each filing's own lobbying activities: LDA "
            "accepts an issue filter and then ignores it, so there is no way to ask the service "
            "this question directly."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_client_spend(params: dict, client: LdaClient, gateway: object) -> dict:
    """Stub: the hosted implementation of this skill was removed in the paywall cleanup."""
    return {
        "final_state": "completed",
        "message": 'Not yet implemented: client-spend — its hosted implementation was removed.',
        "artifact": {"removed": True},
        "watch": None,
    }


class LobbyingAgent(SkillAgent):
    name = "senate-lobbying"
    card_name = "Senate Lobbying Agent"
    card_description = (
        "Read-only agent over the US Senate's Lobbying Disclosure Act filings: a lobbying firm's "
        "filings for a year with their reported money, one filing in full with its issue areas and "
        "the lobbyists on them, the filings a named lobbyist appears on, and the issue areas a "
        "registrant covered — plus a spending tally computed on a removed hosted service that "
        "separates what was disclosed from what was never reported. Every answer is read live from "
        "LDA."
    )
    env_prefix = "LOBBYING"
    datasets = (DATASET, CLIENTS_DATASET)
    card_skills = CARD_SKILLS

    def __init__(self, client: LdaClient | None = None,
                 gateway: object | None = None) -> None:
        self.client = client or LdaClient()
        self.gateway = gateway

    def parse(self, message: dict) -> dict:
        return parse(message)

    def missing(self, skill: str, params: dict) -> list[str]:
        if skill == "help":
            return []
        if skill == SKILL_FILING_DETAIL:
            return [] if params.get("uuid") else ["uuid"]
        if skill == SKILL_LOBBYIST_FILINGS:
            return [] if params.get("lobbyist") else ["lobbyist"]
        return [] if params.get("registrant") else ["registrant"]

    def input_prompt(self, skill: str, missing: list[str]) -> str:
        if skill == SKILL_FILING_DETAIL:
            return (
                "Which filing? Give me its uuid, the 36-character id in the filing's document link, "
                "for example 9ad88323-8325-40eb-9036-eb5ea7c6827f — or ask me for a registrant's "
                "filings and I will list them with their ids."
            )
        if skill == SKILL_LOBBYIST_FILINGS:
            return (
                "Which lobbyist? Give me the name as LDA files it, for example “SMITH GARSON”, and "
                "the year if you have one."
            )
        return (
            "Which registrant? Give me the lobbying firm's name, for example “Lockheed Martin” — LDA "
            "matches on part of the name it files, so a distinctive word works."
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
        if skill == SKILL_CLIENT_FILINGS:
            return run_client_filings(params, self.client)
        if skill == SKILL_FILING_DETAIL:
            return run_filing_detail(params, self.client)
        if skill == SKILL_LOBBYIST_FILINGS:
            return run_lobbyist_filings(params, self.client)
        if skill == SKILL_CLIENT_ISSUES:
            return run_client_issues(params, self.client)
        if skill == SKILL_CLIENT_SPEND:
            return run_client_spend(params, self.client, self.gateway)
        if skill == "help":
            return {"final_state": "completed", "message": HELP, "artifact": None, "watch": None}
        return {
            "final_state": "input-required",
            "message": "I did not catch which skill that is. Try “which filings did Lockheed Martin make in 2024?”.",
            "artifact": None,
            "watch": None,
        }


def _money(value) -> str:
    """An amount as LDA's filers write it. A null says not reported; it is never $0."""
    if not isinstance(value, (int, float)):
        return "not reported"
    return f"${value:,.0f}"


def _scope(result: dict) -> str:
    filters = result.get("filters") or {}
    scope = ""
    if filters.get("filing_year"):
        scope += f" for {filters['filing_year']}"
    if filters.get("registrant_name"):
        scope += f" from registrant {filters['registrant_name']!r}"
    if filters.get("client_name"):
        scope += f" for client {filters['client_name']!r}"
    if filters.get("lobbyist_name"):
        scope += f" naming lobbyist {filters['lobbyist_name']!r}"
    if filters.get("filing_type"):
        scope += f" of type {filters['filing_type']}"
    return scope


__all__ = [
    "CARD_SKILLS",
    "DEFAULT_YEAR",
    "GATEWAY_TOOL",
    "HELP",
    "LobbyingAgent",
    "MAX_LISTED",
    "SKILL_CLIENT_FILINGS",
    "SKILL_CLIENT_ISSUES",
    "SKILL_CLIENT_SPEND",
    "SKILL_FILING_DETAIL",
    "SKILL_LOBBYIST_FILINGS",
    "UpstreamError",
    "message_data",
    "message_text",
    "name_from_text",
    "parse",
    "run_client_filings",
    "run_client_issues",
    "run_client_spend",
    "run_filing_detail",
    "run_lobbyist_filings",
]
