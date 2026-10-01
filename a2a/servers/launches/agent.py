"""The launch-schedule agent: five skills over the SpaceDevs Launch Library.

  - upcoming-launches: the published schedule, the next launches
  - launch-in-window: every launch in a date range, in time order
  - launch-lookup:     find a launch by words in its name, and get its id
  - launch-details:    one launch in full - rocket, pad, agency, missions
  - launch-board:      a whole window as a picture: totals, busiest day, by agency

Premium: `launch-board` runs on the licence gateway. A busy week is more than one
page of the API, so the sweep and the aggregation happen there, behind the
licence check, and a caller who has not paid gets the gateway's message and no
counts at all. Every other skill reads the Launch Library directly and stays free.

The API throttles to roughly thirty requests an hour per address, so the schedule
is cached for minutes and a 429 is reported in plain words rather than as a raw
HTTP status.
"""

from __future__ import annotations

import re

from a2a_kit import GatewayClient, SkillAgent, empty_premium_answer, premium_call

from data import (
    CLOSED_STATUSES,
    DATASET,
    MISSION_TYPES,
    LaunchLibraryClient,
    UpstreamError,
)

SKILL_UPCOMING = "upcoming-launches"
SKILL_WINDOW = "launch-in-window"
SKILL_LOOKUP = "launch-lookup"
SKILL_DETAILS = "launch-details"
SKILL_BOARD = "launch-board"

#: The gateway tool that does the premium work. Same name here and on the gateway.
GATEWAY_TOOL = "a2a_launches_board"

SOURCE = "SpaceDevs Launch Library 2.2"
DEFAULT_DAYS = 14
MAX_LISTED = 12

CARD_SKILLS = [
    {
        "id": SKILL_UPCOMING,
        "name": "Upcoming launches",
        "description": (
            "The published launch schedule: what is on the manifest, when its NET is, how precise "
            "that time is, its status, the launch provider, the rocket, and the pad and location. "
            "Read straight from the Launch Library's own schedule."
        ),
        "tags": ["launches", "space", "schedule", "spacedevs", "rocket"],
        "examples": [
            "what launches are coming up?",
            "next 5 launches",
            '{"skill": "upcoming-launches", "limit": 5}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_WINDOW,
        "name": "Launches in a date range",
        "description": (
            "Every launch whose NET falls between two dates, in time order, with the same detail "
            "per launch. Give a from and a to, or a number of days from today."
        ),
        "tags": ["launches", "space", "schedule", "date", "range"],
        "examples": [
            "what launches are between 2026-10-01 and 2026-10-07?",
            "launches in the next 30 days",
            '{"skill": "launch-in-window", "start": "2026-10-01", "end": "2026-10-07"}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_LOOKUP,
        "name": "Find a launch",
        "description": (
            "Find a launch in the published schedule by words in its name, and get its id so the "
            "details skill can read it. An ambiguous phrase comes back as candidates rather than "
            "a guess."
        ),
        "tags": ["launches", "space", "search", "lookup", "find"],
        "examples": [
            "find the Crew-13 launch",
            "look up starship flight 14",
            '{"skill": "launch-lookup", "text": "crew-13"}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_DETAILS,
        "name": "One launch in full",
        "description": (
            "A single launch in full: the rocket and its variant, the provider and the country it "
            "is built in, the pad with its coordinates, the missions it carries, the launch "
            "probability, the NET window, and whether it is on webcast."
        ),
        "tags": ["launches", "space", "details", "rocket", "pad", "mission"],
        "examples": [
            "tell me about launch 7d1afb26-6f9c-429b-9ccf-29012fd1e519",
            '{"skill": "launch-details", "launch_id": "7d1afb26-6f9c-429b-9ccf-29012fd1e519"}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_BOARD,
        "name": "Launch board for a window",
        "description": (
            "A whole date range read as a picture rather than a list: how many launches are in it, "
            "which day is busiest, which agency flies the most, how the missions divide, and how "
            "tightly the launches are stacked together. Premium: it runs behind a licence check on "
            "the gateway, which does the paginated sweep and the counting."
        ),
        "tags": ["launches", "space", "board", "cadence", "summary", "premium"],
        "examples": [
            "how busy is the launch calendar this month?",
            "how many launches are there between 2026-10-01 and 2026-10-31?",
            '{"skill": "launch-board", "start": "2026-10-01", "end": "2026-10-31"}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
]

_ID_RE = re.compile(r"\b([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b", re.IGNORECASE)
_DATE_RE = re.compile(r"\b(\d{4}-\d{2}-\d{2})\b")
_DAYS_RE = re.compile(r"\b(?:next|in|over|for|coming)?\s*(\d{1,3})\s*days?\b", re.IGNORECASE)
#: "between X and Y", "from X to Y", "in October" with an explicit year.
_RANGE_RE = re.compile(
    r"\b(?:between|from)\s+(\d{4}-\d{2}-\d{2})\s+(?:and|to|until|through)\s+(\d{4}-\d{2}-\d{2})",
    re.IGNORECASE,
)
_UPCOMING_WORDS = re.compile(
    r"\b(?:upcoming|coming up|next \d+ launches?|what launches|on the manifest|manifest|"
    r"launch schedule|what is launching|anything launching)\b",
    re.IGNORECASE,
)
_BOARD_WORDS = re.compile(
    r"\b(?:board|calendar|how busy|how many launches|busiest|cadence|how often|"
    r"how crowded|launches are there|launches this (?:month|week|year)|stacked|"
    r"tightest|breakdown|by agency|per agency|by mission type)\b",
    re.IGNORECASE,
)
_FIND_WORDS = re.compile(
    r"\b(?:find|look ?up|search|which launch|when is .{0,40}(?:launching|launch)|details? (?:of|for|on))\b",
    re.IGNORECASE,
)
#: A short run of words that could be part of a launch name.
_QUOTED_RE = re.compile(r"[\"“]([^\"”]{2,60})[\"”]|launch called (.{2,60}?)(?:[.?]|$)", re.IGNORECASE)
_TYPE_RE = re.compile(rf"\b({'|'.join(t.lower() for t in MISSION_TYPES)})\b", re.IGNORECASE)
#: "next 5 launches", "top 10" - a count of rows, not a date window.
_COUNT_RE = re.compile(r"\b(?:next|top|first|last)\s+(\d{1,2})\s*(?:launch(?:es)?|results?|entries)?\b",
                       re.IGNORECASE)

HELP = (
    "I read the SpaceDevs Launch Library 2.2. Ask me:\n"
    "  • what launches are coming up?\n"
    "  • what launches are between 2026-10-01 and 2026-10-07?\n"
    "  • find the Crew-13 launch\n"
    "  • tell me about launch 7d1afb26-6f9c-429b-9ccf-29012fd1e519\n"
    "  • how busy is the launch calendar this month?\n"
    "Times are the library's NET, not a promise: it carries its own precision for each launch, and "
    "the library throttles to about thirty requests an hour, so I read a cached schedule rather "
    "than hammering it."
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


def launch_text_from_text(text: str) -> str | None:
    """Words that could be part of a launch name, taken only from quotes or an explicit call."""
    match = _QUOTED_RE.search(text)
    if not match:
        return None
    candidate = (match.group(1) or match.group(2) or "").strip(" .,'\"“”")
    return candidate if 2 <= len(candidate) <= 60 else None


def parse(message: dict) -> dict:
    """Incoming message -> {skill, params, explicit}. Never raises."""
    text = message_text(message)
    data = message_data(message)
    requested = _first(data, "skill", "skill_id")

    launch_id = _first(data, "launch_id", "id")
    if launch_id is None:
        match = _ID_RE.search(text)
        if match:
            launch_id = match.group(1)

    start = _first(data, "start", "from", "date")
    end = _first(data, "end", "to", "until")
    if start is None or end is None:
        match = _RANGE_RE.search(text)
        if match:
            start, end = match.group(1), match.group(2)
    days = _first(data, "days")
    if days is None and start is None:
        match = _DAYS_RE.search(text)
        if match:
            days = match.group(1)

    name = _first(data, "text", "name", "query", "mission")
    if name is None:
        name = launch_text_from_text(text)
    mission_type = _first(data, "mission_type", "type")
    if mission_type is None:
        match = _TYPE_RE.search(text)
        if match:
            mission_type = match.group(1)
    # A count is a row limit only when it is not the day count: "next 5 launches"
    # is five rows, but "the next 30 days" is a window, not thirty rows.
    limit = _first(data, "limit")
    if limit is None and days is None:
        match = _COUNT_RE.search(text)
        if match:
            limit = match.group(1)
    if limit is None:
        limit = 10

    if requested in (SKILL_UPCOMING, SKILL_WINDOW, SKILL_LOOKUP, SKILL_DETAILS, SKILL_BOARD):
        skill = requested
    elif _BOARD_WORDS.search(text):
        skill = SKILL_BOARD
    elif launch_id or _FIND_WORDS.search(text):
        skill = SKILL_DETAILS if launch_id else SKILL_LOOKUP
    elif start is not None and end is not None:
        skill = SKILL_WINDOW
    elif _UPCOMING_WORDS.search(text) or days is not None:
        skill = SKILL_WINDOW if days is not None and start is None and not _UPCOMING_WORDS.search(text) \
            else SKILL_UPCOMING
    else:
        skill = SKILL_UPCOMING

    params: dict = {"limit": limit}
    for key, value in (("launch_id", launch_id), ("start", start), ("end", end),
                       ("days", days), ("name", name), ("mission_type", mission_type)):
        if value is not None:
            params[key] = value
    if skill == SKILL_BOARD:
        params["limit"] = 1

    if not requested and (not text.strip()
                          or re.search(r"\b(help|what can you do|commands?)\b", text, re.IGNORECASE)):
        skill, params = "help", {}
    explicit = bool(requested or _BOARD_WORDS.search(text) or _FIND_WORDS.search(text)
                    or _UPCOMING_WORDS.search(text) or _RANGE_RE.search(text) or launch_id)
    return {"skill": skill, "params": params, "explicit": explicit}


# -- shared shape ---------------------------------------------------------


def _artifact(params: dict, client: LaunchLibraryClient, **extra) -> dict:
    artifact = {
        "dataset": DATASET,
        "product": "SpaceDevs Launch Library 2.2 launch schedule",
        "source": SOURCE,
        "freshness": client.freshness(),
    }
    artifact.update(extra)
    return artifact


def _line(launch: dict) -> str:
    parts = [f"  • {launch.get('net') or 'no time published'}", str(launch.get("name") or "unnamed")]
    if launch.get("status"):
        parts.append(str(launch["status"]))
    if launch.get("lsp_name"):
        parts.append(str(launch["lsp_name"]))
    if launch.get("rocket_full") or launch.get("rocket_name"):
        parts.append(str(launch.get("rocket_full") or launch["rocket_name"]))
    if launch.get("pad"):
        parts.append(str(launch["pad"]))
    if launch.get("net_precision"):
        parts.append(f"time precise to the {str(launch['net_precision']).lower()}")
    return " ".join(parts[:6])


def _resolve_window(client: LaunchLibraryClient, params: dict):
    """(start_iso, end_iso, problem_response_body) for a date range or a day count."""
    from datetime import datetime, timedelta, timezone

    try:
        if params.get("start") and params.get("end"):
            start = client.check_date(params["start"])
            end = client.check_date(params["end"])
        elif params.get("start") or params.get("end"):
            raise ValueError("give both ends of the range, as 2026-10-01 and 2026-10-07")
        else:
            days = client.check_days(params.get("days") or DEFAULT_DAYS)
            today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
            start = today.strftime("%Y-%m-%dT00:00:00Z")
            end = (today + timedelta(days=days)).strftime("%Y-%m-%dT00:00:00Z")
    except ValueError as exc:
        return None, None, {"final_state": "input-required", "message": str(exc),
                            "artifact": None, "watch": None}
    return start, end, None


# -- skills ---------------------------------------------------------------


def run_upcoming(params: dict, client: LaunchLibraryClient) -> dict:
    try:
        limit = client.check_limit(params.get("limit", 10))
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    launches = client.upcoming(limit)
    artifact = _artifact(params, client, launches=launches, count=len(launches))
    if not launches:
        return {
            "final_state": "completed",
            "message": (f"The Launch Library published no upcoming launches. (Read live from {DATASET}.)"),
            "artifact": artifact,
            "watch": None,
        }
    future = [row for row in launches if row.get("net_is_future")]
    listing = "\n".join(_line(row) for row in launches)
    return {
        "final_state": "completed",
        "message": (
            f"{len(launches)} launch(es) on the published schedule, {len(future)} of them still in "
            f"the future:\n{listing}\nSource: {DATASET} (read live)."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_window(params: dict, client: LaunchLibraryClient) -> dict:
    start, end, problem = _resolve_window(client, params)
    if problem:
        return problem
    try:
        limit = client.check_limit(params.get("limit", 25))
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    result = client.in_window(start, end, limit)
    launches = result["launches"]
    artifact = _artifact(params, client, start=start, end=end, launches=launches,
                         count=len(launches), count_in_window=result.get("count_in_window"),
                         page_holds_more=result.get("has_more"))
    if not launches:
        return {
            "final_state": "completed",
            "message": (
                f"The Launch Library has no launch scheduled between {start[:10]} and "
                f"{end[:10]}. (Read live from {DATASET}.)"
            ),
            "artifact": artifact,
            "watch": None,
        }
    lines = [f"{len(launches)} launch(es) between {start[:10]} and {end[:10]}:", ]
    lines.extend(_line(row) for row in launches)
    if result.get("count_in_window") and result["count_in_window"] > len(launches):
        lines.append(
            f"  • ... the API reports {result['count_in_window']} in this window and this page holds "
            f"{len(launches)}; raise limit to see more."
        )
    lines.append(f"Source: {DATASET} (read live).")
    return {"final_state": "completed", "message": "\n".join(lines),
            "artifact": artifact, "watch": None}


def run_lookup(params: dict, client: LaunchLibraryClient) -> dict:
    text = params.get("name")
    if not text:
        return {
            "final_state": "input-required",
            "message": (
                "Which launch? Give me words from its name in quotes, for example "
                '“crew-13”, or a launch id for the details skill.'
            ),
            "artifact": None,
            "watch": None,
        }
    try:
        result = client.find(text, limit=params.get("limit", 10))
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    launches = result["launches"]
    artifact = _artifact(params, client, query=text, launches=launches,
                         matched=result["matched"], schedule_read=result["schedule_read"],
                         matched_exactly=result["matched_exactly"])
    if not launches:
        return {
            "final_state": "completed",
            "message": (
                f"Nothing in the published schedule matches “{text}” out of "
                f"{result['schedule_read']} entries. Try fewer words, or ask what launches are "
                f"coming up. (Read live from {DATASET}.)"
            ),
            "artifact": artifact,
            "watch": None,
        }
    listing = "\n".join(_line(row) for row in launches)
    if result["matched"] > 1:
        return {
            "final_state": "input-required",
            "message": (
                f"“{text}” matches {result['matched']} launches:\n{listing}\n"
                "Which one? Then ask for its details with the launch id."
            ),
            "artifact": artifact,
            "watch": None,
        }
    return {
        "final_state": "completed",
        "message": (f"“{text}” matches one launch out of {result['schedule_read']} scheduled:\n"
                    f"{listing}\nLaunch id {launches[0].get('id')}. "
                    f"Source: {DATASET} (read live)."),
        "artifact": artifact,
        "watch": None,
    }


def run_details(params: dict, client: LaunchLibraryClient) -> dict:
    launch_id = params.get("launch_id")
    if not launch_id:
        return {
            "final_state": "input-required",
            "message": (
                "Which launch? Give me its id, the UUID from the launch record, for example "
                "7d1afb26-6f9c-429b-9ccf-29012fd1e519. Or use the lookup skill to find it by name."
            ),
            "artifact": None,
            "watch": None,
        }
    try:
        launch_id = client.check_id(launch_id)
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    launch = client.details(launch_id)
    artifact = _artifact(params, client, launch=launch, launch_id=launch_id)
    if launch is None:
        return {
            "final_state": "completed",
            "message": (
                f"The Launch Library has no launch with id {launch_id}. Check the id, or use the "
                f"lookup skill to find the launch by name. (Read live from {DATASET}.)"
            ),
            "artifact": artifact,
            "watch": None,
        }
    lines = [
        f"  • NET {launch.get('net') or 'not published'}"
        + (f", window to {launch.get('window_end')}" if launch.get("window_end") else "")
        + (f", precise to the {str(launch['net_precision']).lower()}"
           if launch.get("net_precision") else ""),
        f"  • status {launch.get('status') or 'not reported'}"
        + (f" (hold reason: {launch['holdreason']})" if launch.get("holdreason") else "")
        + (f" (fail reason: {launch['failreason']})" if launch.get("failreason") else ""),
        f"  • provider {launch.get('lsp_name') or 'not reported'}"
        + (f" ({launch['lsp_country']})" if launch.get("lsp_country") else ""),
        f"  • rocket {launch.get('rocket_full') or launch.get('rocket_name') or 'not reported'}"
        + (f", {launch['rocket_height_m']} m tall" if launch.get("rocket_height_m") else ""),
        f"  • pad {launch.get('pad') or 'not reported'}"
        + (f", {launch.get('location')}" if launch.get("location") else "")
        + (f" at {launch.get('pad_latitude')}, {launch.get('pad_longitude')}"
           if launch.get("pad_latitude") is not None else ""),
    ]
    if launch.get("probability") is not None:
        lines.append(f"  • go probability {launch.get('probability')}")
    if launch.get("webcast_live") is not None:
        lines.append(f"  • webcast_live {launch.get('webcast_live')}")
    for mission in launch.get("missions") or []:
        lines.append(f"  • mission {mission.get('name') or 'unnamed'}"
                     f" ({mission.get('type') or 'type not reported'})")
    if launch.get("description"):
        lines.append(f"\n{launch['description']}")
    return {
        "final_state": "completed",
        "message": (f"{launch.get('name') or 'Unnamed launch'} ({launch_id}):\n" + "\n".join(lines)
                    + f"\nSource: {DATASET} (read live)."),
        "artifact": artifact,
        "watch": None,
    }


def run_board(params: dict, client: LaunchLibraryClient, gateway: GatewayClient) -> dict:
    """The premium launch board. Nothing here counts: the gateway does.

    The free skills read one page and list it. This answers the question that
    needs the whole window counted, and that sweep is many more requests than a
    listing, so it happens on the gateway behind its licence check.
    """
    start, end, problem = _resolve_window(client, params)
    if problem:
        return problem
    arguments = {"start": start, "end": end}
    read, refused = premium_call(gateway, GATEWAY_TOOL, arguments, {
        "dataset": DATASET, "start": start, "end": end,
    })
    if refused:
        return refused
    if not isinstance(read, dict) or not isinstance(read.get("byDay"), list):
        return empty_premium_answer(
            "The licence gateway answered without a launch board, so there is nothing to report.",
            {"dataset": DATASET, "start": start, "end": end},
        )

    lines = [
        f"Launch board for {start[:10]} to {end[:10]}: {read.get('totalLaunches')} launch(es) over "
        f"{read.get('days')} day(s), read in {read.get('pages')} page(s)"
        + (", count truncated" if read.get("truncated") else "") + ".",
    ]
    for day in read.get("byDay") or []:
        names = ", ".join(str(row.get("name")) for row in (day.get("launches") or [])[:3])
        # The gateway caps how many launches it names per day and reports what it
        # left out, so the count is taken from there rather than guessed.
        more = day.get("launchesTruncated") or max(0, len(day.get("launches") or []) - 3)
        lines.append(f"  • {day.get('date')}: {day.get('count')} launch(es)"
                     + (f" — {names}" if names else "")
                     + (f" (+{more} more)" if more > 0 else ""))
    agencies = read.get("byAgency") or []
    if agencies:
        lines.append("  • By agency: " + ", ".join(
            f"{row.get('name')} {row.get('count')}" for row in agencies[:8]))
    types = read.get("byMissionType") or []
    if types:
        lines.append("  • By mission type: " + ", ".join(
            f"{row.get('name')} {row.get('count')}" for row in types[:8]))
    busiest = read.get("busiestDay")
    if busiest:
        lines.append(f"  • Busiest day {busiest.get('date')} with {busiest.get('count')} launch(es).")
    tightest = read.get("tightestTurnaround")
    if tightest:
        lines.append(
            f"  • Tightest turnaround {tightest.get('hours')} h: {tightest.get('first')} then "
            f"{tightest.get('second')}.")
        lines.append(
            f"  • {read.get('openCount')} still to fly, {read.get('heldCount')} in hold, "
            f"{read.get('closedCount')} already flown or scrubbed.")
    lines.append(
        "\nCounted on the MCP gateway behind its licence check, from the SpaceDevs Launch Library "
        f"({DATASET}). A NET is the library's own estimate and it publishes a precision for each "
        "launch, so read the busiest day as a rough shape rather than a timetable."
    )
    artifact = {
        "dataset": DATASET,
        "source": SOURCE,
        "premium": True,
        "start": start,
        "end": end,
        "days": read.get("days"),
        "total_launches": read.get("totalLaunches"),
        "pages": read.get("pages"),
        "truncated": read.get("truncated"),
        "by_day": read.get("byDay"),
        "by_agency": agencies,
        "by_mission_type": types,
        "busiest_day": busiest,
        "tightest_turnaround": tightest,
        "open_count": read.get("openCount"),
        "held_count": read.get("heldCount"),
        "closed_count": read.get("closedCount"),
        "mean_per_active_day": read.get("meanPerActiveDay"),
    }
    return {"final_state": "completed", "message": "\n".join(lines), "artifact": artifact, "watch": None}


class LaunchLibraryAgent(SkillAgent):
    name = "launch-library"
    card_name = "SpaceDevs Launch Library Agent"
    card_description = (
        "Read-only agent over the SpaceDevs Launch Library 2.2: the published launch schedule, every "
        "launch in a date range, a launch found by name, one launch in full with its rocket, pad, "
        "provider and missions, and a premium skill that reads a whole window as a picture - totals, "
        "busiest day, by agency, tightest turnaround. Every time is the library's own NET and "
        "carries the library's own precision for it."
    )
    env_prefix = "LAUNCHES"
    datasets = (DATASET,)
    card_skills = CARD_SKILLS

    def __init__(self, client: LaunchLibraryClient | None = None,
                 gateway: GatewayClient | None = None) -> None:
        self.client = client or LaunchLibraryClient()
        self.gateway = gateway or GatewayClient()

    def parse(self, message: dict) -> dict:
        return parse(message)

    def missing(self, skill: str, params: dict) -> list[str]:
        if skill == SKILL_LOOKUP and not params.get("name"):
            return ["name"]
        if skill == SKILL_DETAILS and not params.get("launch_id"):
            return ["launch_id"]
        if skill == SKILL_WINDOW and not (params.get("start") or params.get("days")):
            return ["window"]
        return []

    def input_prompt(self, skill: str, missing: list[str]) -> str:
        if "name" in missing:
            return (
                "Which launch? Give me words from its name in quotes, for example “crew-13”, or a "
                "launch id."
            )
        if "launch_id" in missing:
            return (
                "Which launch? Give me its id, the UUID from the launch record, for example "
                "7d1afb26-6f9c-429b-9ccf-29012fd1e519."
            )
        return (
            "Which dates? Give me a range such as 2026-10-01 to 2026-10-07, or a number of days "
            "from today."
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
        try:
            if skill == SKILL_BOARD:
                return run_board(params, self.client, self.gateway)
            if skill == SKILL_UPCOMING:
                return run_upcoming(params, self.client)
            if skill == SKILL_WINDOW:
                return run_window(params, self.client)
            if skill == SKILL_LOOKUP:
                return run_lookup(params, self.client)
            if skill == SKILL_DETAILS:
                return run_details(params, self.client)
        except UpstreamError as exc:
            return {
                "final_state": "failed",
                "message": f"The Launch Library could not be read: {exc}",
                "artifact": {"dataset": DATASET},
                "watch": None,
            }
        return {"final_state": "completed", "message": HELP, "artifact": None, "watch": None}


__all__ = [
    "CARD_SKILLS",
    "CLOSED_STATUSES",
    "DEFAULT_DAYS",
    "GATEWAY_TOOL",
    "HELP",
    "LaunchLibraryAgent",
    "MAX_LISTED",
    "SKILL_BOARD",
    "SKILL_DETAILS",
    "SKILL_LOOKUP",
    "SKILL_UPCOMING",
    "SKILL_WINDOW",
    "UpstreamError",
    "launch_text_from_text",
    "message_data",
    "message_text",
    "parse",
    "run_board",
    "run_details",
    "run_lookup",
    "run_upcoming",
    "run_window",
]
