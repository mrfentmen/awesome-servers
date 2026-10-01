"""The NYC 311 agent: three skills over the live 311 dataset.

  - complaint-status:  look up one complaint by its unique key (watch-capable)
  - complaints-near:   recent complaints around a ZIP / street / borough
  - complaints-board:  how the city's complaints were filed and handled (premium)

Parsing accepts plain text ("did complaint 12345678 get fixed?") or a DataPart:
{"skill": "complaint-status", "unique_key": "12345678"}.
"""

from __future__ import annotations

import re

from a2a_kit import GatewayClient, SkillAgent, empty_premium_answer, premium_call

from data import DATASET_311, DATASET_311_TITLE, UpstreamError, NYC311Client

SKILL_COMPLAINT_STATUS = "complaint-status"
SKILL_COMPLAINTS_NEAR = "complaints-near"
SKILL_COMPLAINTS_BOARD = "complaints-board"

DEFAULT_BOARD_DAYS = 7
MAX_LISTED_TYPES = 6
MAX_LISTED_AGENCIES = 6

CARD_SKILLS = [
    {
        "id": SKILL_COMPLAINT_STATUS,
        "name": "311 complaint status",
        "description": (
            "Look up one NYC 311 complaint by its unique key and report status, dates, type, "
            "and resolution. Supports webhook watching: the server notifies your endpoint when "
            "the complaint's status changes."
        ),
        "tags": ["nyc", "311", "civic", "status"],
        "examples": [
            "Did complaint 12345678 get fixed?",
            '{"skill": "complaint-status", "unique_key": "12345678"}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_COMPLAINTS_NEAR,
        "name": "311 complaints near a place",
        "description": (
            "List the most recent NYC 311 complaints in a ZIP code, on a street, or in a borough, "
            "with complaint types and statuses."
        ),
        "tags": ["nyc", "311", "civic", "neighborhood"],
        "examples": [
            "What 311 complaints were reported in 11235 in the last 30 days?",
            '{"skill": "complaints-near", "zip_code": "11235", "days": 14}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_COMPLAINTS_BOARD,
        "name": "How the city's complaints were handled (premium)",
        "description": (
            "A window of New York City 311 complaints read as a board: the exact number filed, "
            "the busiest complaint types with their share, the busiest hour of day, and per "
            "agency how many are still open, the share closed, and the median and mean hours to "
            "close, slowest first. Premium: it runs behind a licence check."
        ),
        "tags": ["nyc", "311", "civic", "board", "response-time", "premium"],
        "examples": [
            "How many 311 complaints were filed in the last week, and how long do they take to close?",
            '{"skill": "complaints-board", "days": 7}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
]

_ID_RE = re.compile(r"\b(\d{6,9})\b")
_ZIP_RE = re.compile(r"\b(1[01]\d{3})\b")
_NEAR_WORDS = re.compile(r"\b(near|around|neighborhood|block|zip|nearby|area)\b", re.IGNORECASE)
#: How the city's complaints were filed and handled, read as a whole window. Deliberately narrow,
#: so a place question stays with complaints-near — the board is worked out per window, not per
#: ZIP, and answering a place question with the city-wide picture would be misleading.
_BOARD_WORDS = re.compile(
    r"\b(?:complaint[- ]boards?|boards?|"
    r"how many (?:complaints?|311)\b|"
    r"response times?|"
    r"how long (?:does|do|did|are|is)\b[^.\n]{0,30}\b(?:take|takes|taking|close|closes|resolve|resolves)|"
    r"busiest (?:hour|time|day|type|complaint)|"
    r"(?:by|per) agency|"
    r"still open|backlog|"
    r"handled|"
    r"volume of complaints)",
    re.IGNORECASE,
)

_TYPE_KEYWORDS = {
    "rat": "Rodent",
    "rats": "Rodent",
    "rodent": "Rodent",
    "noise": "Noise",
    "pothole": "Street Condition",
    "potholes": "Street Condition",
    "heat": "HEAT/HOT WATER",
    "trash": "Dirty Condition",
    "garbage": "Dirty Condition",
    "parking": "Illegal Parking",
    "tree": "Damaged Tree",
}


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


def parse(message: dict) -> dict:
    """Turn an incoming message into {skill, params, explicit}. Never raises."""
    text = message_text(message)
    data = message_data(message)
    requested_skill = _first(data, "skill", "skill_id")

    unique_key = _first(data, "unique_key", "complaint_id")
    zip_code = _first(data, "zip_code", "zip", "zipcode")
    street = _first(data, "street", "street_name")
    borough = _first(data, "borough")
    type_contains = _first(data, "complaint_type", "type")
    days = _first(data, "days", default=30)
    limit = _first(data, "limit", default=10)

    if not unique_key:
        match = _ID_RE.search(text)
        if match:
            unique_key = match.group(1)
    if not zip_code:
        match = _ZIP_RE.search(text)
        if match:
            zip_code = match.group(1)
    if not type_contains:
        lowered = text.lower()
        for keyword, canonical in _TYPE_KEYWORDS.items():
            if re.search(rf"\b{keyword}\b", lowered):
                type_contains = canonical
                break

    asked_for_board = bool(_BOARD_WORDS.search(text))
    has_place = bool(zip_code or street or borough)
    if requested_skill in (SKILL_COMPLAINT_STATUS, SKILL_COMPLAINTS_NEAR, SKILL_COMPLAINTS_BOARD):
        skill = requested_skill
    elif unique_key:
        skill = SKILL_COMPLAINT_STATUS
    elif asked_for_board and not has_place:
        skill = SKILL_COMPLAINTS_BOARD
    elif has_place or _NEAR_WORDS.search(text):
        skill = SKILL_COMPLAINTS_NEAR
    else:
        skill = SKILL_COMPLAINT_STATUS

    params: dict = {}
    if skill == SKILL_COMPLAINTS_BOARD:
        params["days"] = days
    elif skill == SKILL_COMPLAINT_STATUS:
        if unique_key:
            params["unique_key"] = str(unique_key)
    else:
        if zip_code:
            params["zip_code"] = str(zip_code)
        if street:
            params["street"] = str(street)
        if borough:
            params["borough"] = str(borough)
        if type_contains:
            params["complaint_type"] = str(type_contains)
        params["days"] = days
        params["limit"] = limit
    explicit = bool(requested_skill or unique_key or zip_code or street or borough
                    or asked_for_board)
    return {"skill": skill, "params": params, "explicit": explicit}


def _human_complaint(row: dict) -> str:
    parts = [f"{row.get('complaint_type', 'Complaint')}"]
    if row.get("descriptor"):
        parts.append(f"({row['descriptor']})")
    line = f"Complaint {row.get('unique_key')}: " + " ".join(parts)
    line += f" — status {row.get('status', 'unknown')}."
    if row.get("created_date"):
        line += f" Filed {row['created_date'][:10]}."
    if row.get("closed_date"):
        line += f" Closed {row['closed_date'][:10]}."
    if row.get("resolution_description"):
        line += f" Resolution: {row['resolution_description']}"
    return line


def run_complaint_status(params: dict, client: NYC311Client) -> dict:
    key = str(params["unique_key"])
    row = client.get_complaint(key)
    freshness = client.freshness()
    if row is None:
        return {
            "final_state": "completed",
            "message": (
                f"I found no 311 complaint with key {key} in the dataset ({DATASET_311}). "
                "Double-check the number on the 311 site."
            ),
            "artifact": {
                "dataset": DATASET_311,
                "dataset_title": DATASET_311_TITLE,
                "freshness": freshness,
                "found": False,
                "complaint": None,
            },
            "watch": None,
        }
    return {
        "final_state": "completed",
        "message": _human_complaint(row),
        "artifact": {
            "dataset": DATASET_311,
            "dataset_title": DATASET_311_TITLE,
            "freshness": freshness,
            "found": True,
            "complaint": row,
        },
        "watch": {
            "kind": SKILL_COMPLAINT_STATUS,
            "unique_key": key,
            "dataset": DATASET_311,
            "observed": row.get("status"),
        },
    }


def run_complaints_near(params: dict, client: NYC311Client) -> dict:
    rows = client.recent_complaints(
        zip_code=params.get("zip_code"),
        street=params.get("street"),
        borough=params.get("borough"),
        complaint_type_contains=params.get("complaint_type"),
        days=int(params.get("days", 30)),
        limit=int(params.get("limit", 10)),
    )
    freshness = client.freshness()
    query = {key: value for key, value in params.items() if key != "limit"}
    if not rows:
        return {
            "final_state": "completed",
            "message": "No 311 requests matched that place and time window.",
            "artifact": {
                "dataset": DATASET_311,
                "dataset_title": DATASET_311_TITLE,
                "freshness": freshness,
                "query": query,
                "count": 0,
                "complaints": [],
            },
            "watch": None,
        }
    by_type: dict[str, int] = {}
    for row in rows:
        name = row.get("complaint_type", "Unknown")
        by_type[name] = by_type.get(name, 0) + 1
    top = ", ".join(f"{name} ({count})" for name, count in sorted(by_type.items(), key=lambda kv: -kv[1])[:3])
    window = f"the last {int(params.get('days', 30))} days"
    return {
        "final_state": "completed",
        "message": f"Most recent 311 requests for that place ({window}): {len(rows)} shown. Top types: {top}.",
        "artifact": {
            "dataset": DATASET_311,
            "dataset_title": DATASET_311_TITLE,
            "freshness": freshness,
            "query": query,
            "count": len(rows),
            "complaints": rows,
        },
        "watch": None,
    }


def run_complaints_board(params: dict, client: NYC311Client, gateway: GatewayClient) -> dict:
    """The premium handling board. The figures are worked out on the gateway.

    The gateway reads the 311 dataset behind its licence check and hands back the board,
    so a caller who has not paid gets the gateway's own message and no figures at all.
    """
    # A bad argument is the caller's to fix, so it comes back as a question rather than
    # as an internal error.
    try:
        days = client.check_board_days(params.get("days") or DEFAULT_BOARD_DAYS)
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    read, refused = premium_call(
        gateway, "complaint_response_board", {"days": days},
        {"dataset": DATASET_311, "dataset_title": DATASET_311_TITLE, "days": days},
    )
    if refused:
        return refused
    if not isinstance(read, dict) or read.get("totalComplaints") is None:
        return empty_premium_answer(
            "The licence gateway answered without a complaint count, so there is nothing to report.",
            {"dataset": DATASET_311, "days": days},
        )

    total = int(read.get("totalComplaints") or 0)
    artifact = {
        "dataset": DATASET_311,
        "dataset_title": DATASET_311_TITLE,
        "premium": True,
        "window_days": read.get("windowDays"),
        "window_start": read.get("windowStart"),
        "total_complaints": total,
        "top_types": read.get("topTypes"),
        "sample_size": read.get("sampleSize"),
        "sample_covers_window": read.get("sampleCoversWindow"),
        "sample_hours_used": read.get("sampleHoursUsed"),
        "by_agency": read.get("byAgency"),
        "slowest_to_close": read.get("slowestToClose"),
        "busiest_hour_of_day": read.get("busiestHourOfDay"),
        "note": read.get("note"),
    }
    if not total:
        return {
            "final_state": "completed",
            "message": (
                f"Nothing to report: {read.get('note') or 'no complaints were created in that window'} "
                f"(the {read.get('windowDays')} days from {read.get('windowStart')})."
            ),
            "artifact": artifact,
            "watch": None,
        }

    lines = [
        f"NYC 311 complaints filed in the {read.get('windowDays')} days from "
        f"{read.get('windowStart')}: {total:,}.",
    ]
    types = read.get("topTypes") or []
    if types:
        lines.append("  • Busiest complaint types:")
        for row in types[:MAX_LISTED_TYPES]:
            lines.append(
                f"      {row.get('type')} — {row.get('complaints')} ({row.get('share')}%)"
            )
    hour = read.get("busiestHourOfDay") or {}
    if hour:
        lines.append(
            f"  • Busiest hour: {hour.get('hourOfDay')}:00 with {hour.get('complaints')} closed "
            f"complaints, {hour.get('asRecordedBy')}."
        )
    agencies = read.get("byAgency") or []
    if agencies:
        lines.append("  • By agency (from the records in the sample):")
        for row in agencies[:MAX_LISTED_AGENCIES]:
            median = row.get("medianHoursToClose")
            lines.append(
                f"      {row.get('agency')} — {row.get('complaints')} complaints, "
                f"{row.get('stillOpen')} still open ({row.get('closedShare')}% closed), "
                f"median {median} h to close"
                if median is not None else
                f"      {row.get('agency')} — {row.get('complaints')} complaints, "
                f"{row.get('stillOpen')} still open ({row.get('closedShare')}% closed), "
                "no closing time yet"
            )
        if len(agencies) > MAX_LISTED_AGENCIES:
            lines.append(f"      ... {len(agencies) - MAX_LISTED_AGENCIES} more are in the artifact.")
    slowest = read.get("slowestToClose") or None
    if slowest:
        lines.append(
            f"  • Slowest to close: {slowest.get('agency')} at a median of "
            f"{slowest.get('medianHoursToClose')} h over {slowest.get('closed')} closed complaints."
        )
    if read.get("note"):
        lines.append(f"  • {read.get('note')}.")
    lines.append(
        "\nCounted on the MCP gateway behind its licence check, from the live NYC 311 dataset "
        f"({DATASET_311}, \"{DATASET_311_TITLE}\"). The counts are exact; the closing times come "
        "from the records the dataset returned in one page, so they describe the agencies in that "
        "sample rather than the city's whole history. An agency with no time here is simply one "
        "whose records in the sample have not closed yet."
    )
    return {"final_state": "completed", "message": "\n".join(lines), "artifact": artifact, "watch": None}


class NYC311Agent(SkillAgent):
    name = "nyc311"
    card_name = "NYC Open Data Agent"
    card_description = (
        "Read-only agent for NYC Open Data. Looks up a 311 complaint by its unique key, lists "
        "recent 311 complaints near a ZIP, street, or borough, and (premium) reads a window of the "
        "city's complaints as a board of volumes, busiest types and per-agency closing times. "
        "Every answer cites the dataset (erm2-nwe9) and its freshness. Supports streaming and "
        "webhook push notifications when a watched complaint's status changes."
    )
    env_prefix = "NYC311"
    datasets = (DATASET_311,)
    card_skills = CARD_SKILLS
    watch_kinds = (SKILL_COMPLAINT_STATUS,)

    def __init__(self, client: NYC311Client | None = None,
                 gateway: GatewayClient | None = None) -> None:
        self.client = client or NYC311Client()
        self.gateway = gateway or GatewayClient()

    def parse(self, message: dict) -> dict:
        return parse(message)

    def missing(self, skill: str, params: dict) -> list[str]:
        if skill == SKILL_COMPLAINTS_BOARD:
            return []
        if skill == SKILL_COMPLAINT_STATUS:
            return [] if params.get("unique_key") else ["unique_key"]
        has_place = any(params.get(key) for key in ("zip_code", "street", "borough"))
        return [] if has_place else ["location"]

    def input_prompt(self, skill: str, missing: list[str]) -> str:
        if skill == SKILL_COMPLAINT_STATUS:
            return (
                "Which complaint? Give me the 311 unique key (6-9 digits, shown on your 311 "
                "report) and I will look it up."
            )
        return "Which place? Give me a ZIP code, a street name, or a borough."

    def run(self, request: dict) -> dict:
        if request["missing"]:
            return {
                "final_state": "input-required",
                "message": self.input_prompt(request["skill"], request["missing"]),
                "artifact": None,
                "watch": None,
            }
        if request["skill"] == SKILL_COMPLAINTS_BOARD:
            return run_complaints_board(request["params"], self.client, self.gateway)
        if request["skill"] == SKILL_COMPLAINT_STATUS:
            return run_complaint_status(request["params"], self.client)
        return run_complaints_near(request["params"], self.client)

    def probe_watch(self, watch: dict):
        """Current status of the watched complaint."""
        key = watch.get("unique_key")
        if not key:
            return None
        row = self.client.get_complaint(key)
        return None if not row else row.get("status")

    def describe_watch_change(self, watch: dict, previous, observed) -> str:
        return (
            f"Complaint {watch.get('unique_key')} status changed from {previous or 'unknown'} "
            f"to {observed or 'unknown'}."
        )


__all__ = [
    "CARD_SKILLS",
    "DEFAULT_BOARD_DAYS",
    "MAX_LISTED_AGENCIES",
    "MAX_LISTED_TYPES",
    "NYC311Agent",
    "SKILL_COMPLAINTS_BOARD",
    "SKILL_COMPLAINTS_NEAR",
    "SKILL_COMPLAINT_STATUS",
    "UpstreamError",
    "message_data",
    "message_text",
    "parse",
    "run_complaint_status",
    "run_complaints_board",
    "run_complaints_near",
]
