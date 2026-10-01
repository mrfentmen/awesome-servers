"""The NYC street-flooding agent: four skills over the live FloodNet datasets.

  - flood-recent:   street-flooding events recorded in the last N hours
  - flood-sensors:  the FloodNet sensors near a ZIP or borough
  - flood-watch:    watch sensors and push a notification on the next flood event
  - flood-hotspots: which streets flood, how often and how badly (premium)

Watch-capable: flood-watch stores {"kind": "flood-events", sensor_ids: [...]} and
the server POSTs to your webhook when the newest event start time changes.
"""

from __future__ import annotations

import re
from datetime import datetime, timezone

from a2a_kit import GatewayClient, SkillAgent, empty_premium_answer, premium_call

from data import (
    BOROUGHS,
    DATASET_FLOOD_EVENTS,
    DATASET_FLOOD_EVENTS_TITLE,
    DATASET_FLOOD_SENSORS,
    DATASET_FLOOD_SENSORS_TITLE,
    FloodClient,
    UpstreamError,
)

SKILL_FLOOD_RECENT = "flood-recent"
SKILL_FLOOD_SENSORS = "flood-sensors"
SKILL_FLOOD_WATCH = "flood-watch"
SKILL_FLOOD_HOTSPOTS = "flood-hotspots"

MAX_WATCH_SENSORS = 200
DEFAULT_HOTSPOT_DAYS = 90
MAX_LISTED_HOTSPOT_SENSORS = 6
MAX_LISTED_BOROUGHS = 6

CARD_SKILLS = [
    {
        "id": SKILL_FLOOD_RECENT,
        "name": "Recent street flooding",
        "description": (
            "Street-flooding events recorded by FloodNet sensors in the last N hours, citywide or "
            "filtered by ZIP, borough, or sensor. Reports depth, duration, and drain time. The "
            "dataset records completed events, so each answer states the window it looked at."
        ),
        "tags": ["nyc", "flood", "floodnet", "climate", "sensors"],
        "examples": [
            "Which streets flooded in the last 24 hours?",
            '{"skill": "flood-recent", "zip_code": "11211", "hours": 168}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_FLOOD_SENSORS,
        "name": "FloodNet sensors near a place",
        "description": (
            "The FloodNet street-flooding sensors deployed in a ZIP code or borough: sensor name, "
            "street, coordinates, and how deep the street has to get before that sensor reports."
        ),
        "tags": ["nyc", "flood", "floodnet", "sensors", "coverage"],
        "examples": [
            "Which flood sensors cover 11211?",
            '{"skill": "flood-sensors", "borough": "Queens"}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_FLOOD_WATCH,
        "name": "Watch a street for flooding",
        "description": (
            "Watch FloodNet sensors (by sensor id, ZIP, or borough) and have the server call your "
            "webhook when a new street-flooding event is recorded on them."
        ),
        "tags": ["nyc", "flood", "floodnet", "watch", "webhook"],
        "examples": [
            "Tell me when any sensor in 11211 floods again.",
            '{"skill": "flood-watch", "sensor_id": "BK-richardson-st-n-11th-st-1x59w1"}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_FLOOD_HOTSPOTS,
        "name": "Which streets flood and how badly (premium)",
        "description": (
            "A window of FloodNet events read as a hotspot ranking: how many sensors recorded "
            "flooding, the sensors with the most events and the deepest water, the boroughs behind "
            "them, the worst single events, the busiest days, and the spread of flood depths, "
            "drain times and onset times. Premium: it runs behind a licence check."
        ),
        "tags": ["nyc", "flood", "floodnet", "hotspot", "ranking", "premium"],
        "examples": [
            "Which streets flooded the most in the last 90 days?",
            '{"skill": "flood-hotspots", "days": 90}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
]

_ZIP_RE = re.compile(r"\b(1[01]\d{3})\b")
_WINDOW_RE = re.compile(r"\blast\s+(\d{1,3})\s*(hour|hours|day|days|week|weeks)\b", re.IGNORECASE)
_WINDOW_HOURS = {"hour": 1, "hours": 1, "day": 24, "days": 24, "week": 168, "weeks": 168}
_SENSOR_ID_RE = re.compile(r"\b([A-Za-z]{2}-[A-Za-z0-9-]{4,80})\b")
_WATCH_WORDS = re.compile(r"\b(watch|notify|alert|ping|tell me when|let me know|subscribe)\b", re.IGNORECASE)
_SENSOR_WORDS = re.compile(r"\b(sensors?|coverage|monitors?|stations?)\b", re.IGNORECASE)
#: Which streets flood and how badly, over a window. Deliberately narrow: "which streets flooded
#: in the last 30 days" is flood-recent and "which sensors cover 11211" is flood-sensors, so this
#: needs a ranking cue and not merely the words "street" and "flood" near each other.
_HOTSPOT_WORDS = re.compile(
    r"\b(?:hot ?spots?|flood[- ]?hot ?spots?|rank(?:ing|ed)?|"
    r"flood(?:ed|s)? (?:the )?most|"
    r"deepest water|"
    r"busiest days?|"
    r"how often (?:does|do|did)\b|"
    r"drain times?)",
    re.IGNORECASE,
)
_BOROUGH_WORDS = {
    "brooklyn": "Brooklyn",
    "queens": "Queens",
    "bronx": "Bronx",
    "manhattan": "Manhattan",
    "staten island": "Staten Island",
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
    """Incoming message -> {skill, params, explicit}. Never raises."""
    text = message_text(message)
    data = message_data(message)
    requested = _first(data, "skill", "skill_id")

    zip_code = _first(data, "zip_code", "zip", "zipcode")
    borough = _first(data, "borough")
    sensor_id = _first(data, "sensor_id", "sensor")
    hours = _first(data, "hours", "window_hours", default=72)
    limit = _first(data, "limit", default=20)
    days = _first(data, "days", "window_days")
    if days is None:
        match = re.search(r"\b(?:last|past|previous|over the last)\s+(\d{1,3})\s*days?\b", text,
                          re.IGNORECASE)
        if match:
            days = match.group(1)

    if not zip_code:
        match = _ZIP_RE.search(text)
        if match:
            zip_code = match.group(1)
    if not borough:
        lowered = text.lower()
        for word, canonical in _BOROUGH_WORDS.items():
            if re.search(rf"\b{word}\b", lowered):
                borough = canonical
                break
    if not sensor_id:
        match = _SENSOR_ID_RE.search(text)
        if match:
            sensor_id = match.group(1)
    if "hours" not in data and "window_hours" not in data:
        match = _WINDOW_RE.search(text)
        if match:
            hours = int(match.group(1)) * _WINDOW_HOURS[match.group(2).lower()]

    asked_for_watch = bool(_WATCH_WORDS.search(text) or sensor_id)
    asked_for_sensors = bool(_SENSOR_WORDS.search(text))
    asked_for_hotspots = bool(_HOTSPOT_WORDS.search(text))
    has_place = bool(zip_code or borough or sensor_id)
    if requested in (SKILL_FLOOD_RECENT, SKILL_FLOOD_SENSORS, SKILL_FLOOD_WATCH,
                     SKILL_FLOOD_HOTSPOTS):
        skill = requested
    elif asked_for_watch:
        skill = SKILL_FLOOD_WATCH
    elif asked_for_hotspots and not has_place:
        skill = SKILL_FLOOD_HOTSPOTS
    elif asked_for_sensors:
        skill = SKILL_FLOOD_SENSORS
    else:
        skill = SKILL_FLOOD_RECENT

    params: dict = {}
    if zip_code:
        params["zip_code"] = str(zip_code)
    if borough:
        params["borough"] = str(borough)
    if sensor_id:
        params["sensor_id"] = str(sensor_id)
    if skill == SKILL_FLOOD_RECENT:
        params["hours"] = hours
        params["limit"] = limit
    if skill == SKILL_FLOOD_HOTSPOTS:
        params = {"days": days if days is not None else DEFAULT_HOTSPOT_DAYS}
    explicit = bool(requested or asked_for_watch or asked_for_sensors or asked_for_hotspots)
    return {"skill": skill, "params": params, "explicit": explicit}


def _age(stamp: str | None) -> str:
    if not stamp:
        return "unknown time"
    try:
        when = datetime.fromisoformat(stamp.replace("Z", "+00:00"))
    except ValueError:
        return stamp
    if when.tzinfo is None:
        when = when.replace(tzinfo=timezone.utc)
    minutes = (datetime.now(timezone.utc) - when).total_seconds() / 60
    if minutes < 90:
        return f"{int(minutes)} min ago"
    if minutes < 60 * 36:
        return f"{int(minutes / 60)} h ago"
    return f"{int(minutes / 1440)} days ago"


def _depth(event: dict) -> float:
    try:
        return float(event.get("max_depth_inches") or 0)
    except (TypeError, ValueError):
        return 0.0


def run_flood_recent(params: dict, client: FloodClient) -> dict:
    sensor_ids = None
    if params.get("sensor_id"):
        sensor_ids = [client.check_sensor_id(params["sensor_id"])]
    elif params.get("zip_code") or params.get("borough"):
        sensor_ids = client.sensor_ids(params.get("zip_code"), params.get("borough"))
    hours = int(params.get("hours", 72))
    events = client.recent_events(sensor_ids, hours=hours, limit=int(params.get("limit", 20)))
    freshness = client.freshness(DATASET_FLOOD_EVENTS)
    place = params.get("zip_code") or params.get("borough") or ("sensor " + params["sensor_id"] if params.get("sensor_id") else "New York City")

    if sensor_ids is not None and not sensor_ids:
        return {
            "final_state": "completed",
            "message": f"No FloodNet sensors are deployed in {place}, so there is nothing to report for it.",
            "artifact": {
                "dataset": DATASET_FLOOD_EVENTS,
                "dataset_title": DATASET_FLOOD_EVENTS_TITLE,
                "freshness": freshness,
                "window_hours": hours,
                "place": place,
                "sensor_count": 0,
                "count": 0,
                "events": [],
            },
            "watch": None,
        }

    artifact = {
        "dataset": DATASET_FLOOD_EVENTS,
        "dataset_title": DATASET_FLOOD_EVENTS_TITLE,
        "freshness": freshness,
        "window_hours": hours,
        "place": place,
        "sensor_count": len(sensor_ids) if sensor_ids else None,
        "count": len(events),
        "events": events,
    }
    if not events:
        return {
            "final_state": "completed",
            "message": (
                f"No street-flooding events recorded on FloodNet sensors for {place} in the last "
                f"{hours} hours. This dataset only records completed flood events, so a dry result "
                "means no event was recorded in that window."
            ),
            "artifact": artifact,
            "watch": None,
        }

    deepest = max(events, key=_depth)
    return {
        "final_state": "completed",
        "message": (
            f"{len(events)} street-flooding event(s) recorded for {place} in the last {hours} hours. "
            f"Deepest: {deepest.get('sensor_name')} at {deepest.get('max_depth_inches')} in, "
            f"{_age(deepest.get('flood_start_time'))}."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_flood_sensors(params: dict, client: FloodClient) -> dict:
    sensors = client.sensors(params.get("zip_code"), params.get("borough"), limit=int(params.get("limit", 25)))
    freshness = client.freshness(DATASET_FLOOD_SENSORS)
    place = params.get("zip_code") or params.get("borough")
    if not sensors:
        return {
            "final_state": "completed",
            "message": f"No FloodNet sensors are deployed in {place}.",
            "artifact": {
                "dataset": DATASET_FLOOD_SENSORS,
                "dataset_title": DATASET_FLOOD_SENSORS_TITLE,
                "freshness": freshness,
                "place": place,
                "count": 0,
                "sensors": [],
            },
            "watch": None,
        }
    names = "; ".join(f"{row.get('sensor_name')} ({row.get('street_name')})" for row in sensors[:5])
    return {
        "final_state": "completed",
        "message": f"{len(sensors)} FloodNet sensor(s) in {place}: {names}",
        "artifact": {
            "dataset": DATASET_FLOOD_SENSORS,
            "dataset_title": DATASET_FLOOD_SENSORS_TITLE,
            "freshness": freshness,
            "place": place,
            "count": len(sensors),
            "sensors": sensors,
        },
        "watch": None,
    }


def run_flood_watch(params: dict, client: FloodClient) -> dict:
    if params.get("sensor_id"):
        sensor = client.sensor(params["sensor_id"])
        if sensor is None:
            return {
                "final_state": "completed",
                "message": (
                    f"No FloodNet sensor has the id {params['sensor_id']}. Ask for the sensors in a "
                    "ZIP code to see the ids that exist."
                ),
                "artifact": {
                    "dataset": DATASET_FLOOD_SENSORS,
                    "dataset_title": DATASET_FLOOD_SENSORS_TITLE,
                    "freshness": client.freshness(DATASET_FLOOD_SENSORS),
                    "found": False,
                    "sensor": None,
                },
                "watch": None,
            }
        sensors = [sensor]
    else:
        sensors = client.sensors(params.get("zip_code"), params.get("borough"), limit=MAX_WATCH_SENSORS)
    if not sensors:
        return {
            "final_state": "completed",
            "message": f"No FloodNet sensors are deployed in {params.get('zip_code') or params.get('borough')}, so there is nothing to watch there.",
            "artifact": None,
            "watch": None,
        }

    sensor_ids = [row["sensor_id"] for row in sensors if row.get("sensor_id")]
    latest = client.latest_event(sensor_ids)
    place = params.get("zip_code") or params.get("borough") or sensors[0].get("sensor_name")
    observed = _observation(latest)
    if latest:
        message = (
            f"Watching {len(sensor_ids)} FloodNet sensor(s) for {place}. Latest recorded event: "
            f"{latest.get('sensor_name')} at {latest.get('max_depth_inches')} in, "
            f"{_age(latest.get('flood_start_time'))}. Point a pushNotificationConfig at this task and "
            "I will POST when a new event is recorded."
        )
    else:
        message = (
            f"Watching {len(sensor_ids)} FloodNet sensor(s) for {place}. No flood event has ever been "
            "recorded on them. Point a pushNotificationConfig at this task and I will POST when one is."
        )
    return {
        "final_state": "completed",
        "message": message,
        "artifact": {
            "dataset": DATASET_FLOOD_EVENTS,
            "dataset_title": DATASET_FLOOD_EVENTS_TITLE,
            "freshness": client.freshness(DATASET_FLOOD_EVENTS),
            "watching": sensor_ids,
            "place": place,
            "latest_event": latest,
        },
        "watch": {
            "kind": SKILL_FLOOD_WATCH,
            "sensor_ids": sensor_ids,
            "place": place,
            "dataset": DATASET_FLOOD_EVENTS,
            "observed": observed,
        },
    }


def _observation(event: dict | None) -> dict:
    """Watch observation: always a dict so 'no event yet' differs from 'unreadable'."""
    if not event:
        return {"last_start": "", "sensor_name": None, "max_depth_inches": None}
    return {
        "last_start": event.get("flood_start_time") or "",
        "sensor_name": event.get("sensor_name"),
        "max_depth_inches": event.get("max_depth_inches"),
    }


def run_flood_hotspots(params: dict, client: FloodClient, gateway: GatewayClient) -> dict:
    """The premium hotspot ranking. The figures are worked out on the gateway.

    The gateway reads both FloodNet datasets behind its licence check and hands back
    the ranking, so a caller who has not paid gets the gateway's own message and no
    figures at all.
    """
    # A bad argument is the caller's to fix, so it comes back as a question rather than
    # as an internal error.
    try:
        days = client.check_hotspot_days(params.get("days") or DEFAULT_HOTSPOT_DAYS)
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    read, refused = premium_call(
        gateway, "flood_hotspot_ranking", {"days": days},
        {"dataset": DATASET_FLOOD_EVENTS, "days": days},
    )
    if refused:
        return refused
    if not isinstance(read, dict) or read.get("events") is None:
        return empty_premium_answer(
            "The licence gateway answered without any flood events, so there is nothing to report.",
            {"dataset": DATASET_FLOOD_EVENTS, "days": days},
        )

    by_borough = read.get("byBorough") or []
    top = read.get("topSensors") or []
    deepest = read.get("deepestEvents") or []
    busiest = read.get("busiestDays") or []
    depth = read.get("depthInches") or {}
    duration = read.get("durationMinutes") or {}
    drain = read.get("drainMinutes") or {}
    onset = read.get("onsetMinutes") or {}
    lines = [
        f"{read.get('events')} street-flooding event(s) across {read.get('sensorsAffected')} "
        f"sensor(s) in the {read.get('windowDays')} days before the newest event in the dataset "
        f"({read.get('newestEvent')}, {read.get('daysSinceNewestEvent')} day(s) ago):",
        f"  • Depth (inches): min {depth.get('min')}, mean {depth.get('mean')}, median "
        f"{depth.get('median')}, 90th percentile {depth.get('p90')}, max {depth.get('max')}.",
        f"  • How long the water stood: median {duration.get('median')} min, max "
        f"{duration.get('max')} min; time to onset median {onset.get('median')} min; drain time "
        f"median {drain.get('median')} min.",
        f"  • {read.get('tidallyInfluencedShare')}% of these events were recorded at a tidally "
        f"influenced sensor.",
    ]
    if by_borough:
        lines.append("  • By borough:")
        for row in by_borough[:MAX_LISTED_BOROUGHS]:
            lines.append(
                f"      {row.get('borough')} — {row.get('events')} event(s), deepest "
                f"{row.get('deepestInches')} in"
            )
        if len(by_borough) > MAX_LISTED_BOROUGHS:
            lines.append(f"      ... {len(by_borough) - MAX_LISTED_BOROUGHS} more are in the artifact.")
    if top:
        lines.append("  • Sensors with the most events:")
        for row in top[:MAX_LISTED_HOTSPOT_SENSORS]:
            lines.append(
                f"      {row.get('sensorName')} ({row.get('borough')}) — {row.get('events')} "
                f"event(s), deepest {row.get('deepestInches')} in, median "
                f"{row.get('medianDurationMinutes')} min"
            )
        if len(top) > MAX_LISTED_HOTSPOT_SENSORS:
            lines.append(f"      ... {len(top) - MAX_LISTED_HOTSPOT_SENSORS} more are in the artifact.")
    if deepest:
        lines.append("  • Deepest single events:")
        for row in deepest[:3]:
            lines.append(
                f"      {row.get('sensorName')} ({row.get('borough')}) — "
                f"{row.get('depthInches')} in for {row.get('durationMinutes')} min, "
                f"starting {row.get('startedAt')}"
            )
    if busiest:
        lines.append(
            "  • Busiest days: "
            + ", ".join(f"{row.get('date')} ({row.get('events')})" for row in busiest)
            + "."
        )
    if read.get("sensorEventsCapped"):
        lines.append(
            "  • The window held more events than one page returns, so these figures cover the "
            "newest records rather than every flood in the window."
        )
    if read.get("note"):
        lines.append(f"  • {read.get('note')}.")
    lines.append(
        "\nRanked on the MCP gateway behind its licence check, from the live FloodNet datasets "
        f"({DATASET_FLOOD_EVENTS} and {DATASET_FLOOD_SENSORS}). FloodNet records completed events, "
        "and its sensors are not evenly spread across the city, so a quiet borough here can mean "
        "a quiet borough or simply fewer sensors in it."
    )
    artifact = {
        "dataset": DATASET_FLOOD_EVENTS,
        "dataset_title": DATASET_FLOOD_EVENTS_TITLE,
        "sensors_dataset": DATASET_FLOOD_SENSORS,
        "premium": True,
        "window_days": read.get("windowDays"),
        "window_start": read.get("windowStart"),
        "newest_event": read.get("newestEvent"),
        "days_since_newest_event": read.get("daysSinceNewestEvent"),
        "events": read.get("events"),
        "sensors_affected": read.get("sensorsAffected"),
        "sensor_events_capped": read.get("sensorEventsCapped"),
        "by_borough": by_borough,
        "tidally_influenced_share": read.get("tidallyInfluencedShare"),
        "busiest_days": busiest,
        "top_sensors": top,
        "deepest_events": deepest,
        "depth_inches": depth,
        "duration_minutes": duration,
        "onset_minutes": onset,
        "drain_minutes": drain,
        "note": read.get("note"),
    }
    return {"final_state": "completed", "message": "\n".join(lines), "artifact": artifact, "watch": None}


class FloodAgent(SkillAgent):
    name = "nycflood"
    card_name = "NYC Street Flooding Agent"
    card_description = (
        "Read-only agent over the FloodNet street-flooding datasets: recent flooding events recorded "
        "by the 491 city sensors, which sensors cover a ZIP or borough, and a watch skill that POSTs "
        "to your webhook when a new flood event is recorded. Every answer cites its dataset "
        "(aq7i-eu5q / kb2e-tjy3) and freshness. FloodNet records completed events, so answers state "
        "the time window instead of claiming a live water level."
    )
    env_prefix = "NYC_FLOOD"
    datasets = (DATASET_FLOOD_EVENTS, DATASET_FLOOD_SENSORS)
    card_skills = CARD_SKILLS
    watch_kinds = (SKILL_FLOOD_WATCH,)

    def __init__(self, client: FloodClient | None = None,
                 gateway: GatewayClient | None = None) -> None:
        self.client = client or FloodClient()
        self.gateway = gateway or GatewayClient()

    def parse(self, message: dict) -> dict:
        return parse(message)

    def missing(self, skill: str, params: dict) -> list[str]:
        has_place = bool(params.get("zip_code") or params.get("borough") or params.get("sensor_id"))
        if skill == SKILL_FLOOD_RECENT:
            return []
        return [] if has_place else ["location"]

    def input_prompt(self, skill: str, missing: list[str]) -> str:
        if skill == SKILL_FLOOD_SENSORS:
            return "Which area? Give me a ZIP code or a borough name."
        return (
            "What should I watch? Give me a FloodNet sensor id (for example "
            "BK-richardson-st-n-11th-st-1x59w1), a ZIP code, or a borough."
        )

    def run(self, request: dict) -> dict:
        if request["missing"]:
            return {
                "final_state": "input-required",
                "message": self.input_prompt(request["skill"], request["missing"]),
                "artifact": None,
                "watch": None,
            }
        if request["skill"] == SKILL_FLOOD_HOTSPOTS:
            return run_flood_hotspots(request["params"], self.client, self.gateway)
        if request["skill"] == SKILL_FLOOD_SENSORS:
            return run_flood_sensors(request["params"], self.client)
        if request["skill"] == SKILL_FLOOD_WATCH:
            return run_flood_watch(request["params"], self.client)
        return run_flood_recent(request["params"], self.client)

    def probe_watch(self, watch: dict):
        sensor_ids = watch.get("sensor_ids") or []
        if not sensor_ids:
            return None
        return _observation(self.client.latest_event(sensor_ids))

    def describe_watch_change(self, watch: dict, previous, observed) -> str:
        name = (observed or {}).get("sensor_name") or "a watched sensor"
        depth = (observed or {}).get("max_depth_inches") or "unknown"
        start = (observed or {}).get("last_start") or "an unknown time"
        return f"New street-flooding event recorded at {name}: {depth} in starting {start}."


__all__ = [
    "CARD_SKILLS",
    "DEFAULT_HOTSPOT_DAYS",
    "FloodAgent",
    "MAX_LISTED_BOROUGHS",
    "MAX_LISTED_HOTSPOT_SENSORS",
    "SKILL_FLOOD_HOTSPOTS",
    "SKILL_FLOOD_RECENT",
    "SKILL_FLOOD_SENSORS",
    "SKILL_FLOOD_WATCH",
    "UpstreamError",
    "message_data",
    "message_text",
    "parse",
    "run_flood_hotspots",
    "run_flood_recent",
    "run_flood_sensors",
    "run_flood_watch",
]
