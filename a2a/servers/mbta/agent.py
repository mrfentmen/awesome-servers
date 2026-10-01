"""The MBTA agent: five free skills over the agency's v3 API, one behind the gate.

  - next-departures: the next trains and buses at a stop, with headsign and minutes away
  - stop-times:      today's timetable at a stop, the scheduled service rather than the live one
  - nearby-stops:    the stops closest to a point, optionally on one route
  - route-alerts:    service alerts affecting one line
  - service-alerts:  the alerts running across the whole network right now
  - headway-check:   whether the arrivals at a stop run to a reliable headway (premium)

Headway-capable: nothing here is watch-capable on its own. The premium skill sends the
request to the licence gateway, which reads the MBTA's live prediction feed and works
out the gap pattern, so an unlicensed caller gets the gateway's wording and no headway.
"""

from __future__ import annotations

import re

from a2a_kit import GatewayClient, SkillAgent, empty_premium_answer, premium_call

from data import (
    ALERT_SEVERITY,
    CATALOGUE_TTL,
    DATASET,
    LIVE_TTL,
    MAX_ALERTS,
    MAX_ARRIVALS,
    MAX_STOPS,
    PRODUCT,
    ROUTE_TTL,
    SOURCE,
    MbtaClient,
    UpstreamError,
)

SKILL_NEXT_DEPARTURES = "next-departures"
SKILL_STOP_TIMES = "stop-times"
SKILL_NEARBY_STOPS = "nearby-stops"
SKILL_ROUTE_ALERTS = "route-alerts"
SKILL_SERVICE_ALERTS = "service-alerts"
SKILL_HEADWAY_CHECK = "headway-check"

MAX_LISTED = 10
DEFAULT_ARRIVALS = 8
#: Below this a headway judgement would be guesswork, so the free skills say so too.
MIN_ARRIVALS_FOR_HEADWAY = 4

CARD_SKILLS = [
    {
        "id": SKILL_NEXT_DEPARTURES,
        "name": "Next departures",
        "description": (
            "The next real-time arrivals at an MBTA stop or station: each train or bus with its line, "
            "the direction it is going, and how many minutes away it is. Give a stop id such as "
            "place-pktrm or 70068, optionally a route (Red, 66, 1) and a direction."
        ),
        "tags": ["mbta", "transit", "departures", "predictions", "boston"],
        "examples": [
            "when is the next train from place-pktrm?",
            "next bus on route 66 from place-harsq",
            '{"skill": "next-departures", "stop": "place-pktrm", "route": "Red", "limit": 5}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_STOP_TIMES,
        "name": "Stop timetable",
        "description": (
            "Today's scheduled departures from an MBTA stop, from now forward — the timetable rather "
            "than the live board, which is what you want when a service is disrupted and the live "
            "board is running short."
        ),
        "tags": ["mbta", "transit", "timetable", "schedule", "boston"],
        "examples": [
            "what is the timetable at place-pktrm today?",
            "scheduled departures from 70068",
            '{"skill": "stop-times", "stop": "70068", "limit": 6}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_NEARBY_STOPS,
        "name": "Stops near a point",
        "description": (
            "The MBTA stops closest to a latitude/longitude point, each with its name, municipality "
            "and real distance, optionally held to one route."
        ),
        "tags": ["mbta", "transit", "stops", "nearby", "search"],
        "examples": [
            "which mbta stops are near 42.3519,-71.0601?",
            "bus stops near 42.3601,-71.0589 on route 1",
            '{"skill": "nearby-stops", "point": "42.3519,-71.0601", "limit": 5}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_ROUTE_ALERTS,
        "name": "Alerts on a line",
        "description": (
            "Service alerts affecting one MBTA line, with the agency's own header text, severity, "
            "effect and timeframe. A line name works as well as a route id: “the Red Line”."
        ),
        "tags": ["mbta", "transit", "alerts", "disruptions", "service"],
        "examples": [
            "any alerts on the Red Line?",
            "is the green line running normally?",
            '{"skill": "route-alerts", "route": "Green"}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_SERVICE_ALERTS,
        "name": "Network service alerts",
        "description": (
            "The alerts running across the MBTA network right now, worst first, with each one's "
            "severity, effect and lifetime. Use this when a disruption is system-wide rather than "
            "on one line."
        ),
        "tags": ["mbta", "transit", "alerts", "service", "network"],
        "examples": [
            "how is the T running?",
            "any disruptions across the whole network?",
            '{"skill": "service-alerts", "limit": 5}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_HEADWAY_CHECK,
        "name": "Is the headway holding?",
        "description": (
            "The live arrivals at a stop read as a service-reliability answer rather than a list: the "
            "gap between each pair, the median headway, the longest single wait, and whether the "
            "headway is holding. Premium: it runs behind a licence check."
        ),
        "tags": ["mbta", "transit", "headway", "reliability", "waiting", "premium"],
        "examples": [
            "can I count on a train every 8 minutes from place-pktrm?",
            "is the headway holding on the Red Line at place-pktrm?",
            '{"skill": "headway-check", "stop": "place-pktrm", "route": "Red"}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
]

_STOP_RE = re.compile(r"\b(place-[a-z0-9]+|[A-Z]{2}-\d{3}|[0-9]{5})\b", re.IGNORECASE)
_POINT_RE = re.compile(r"\b(-?\d{1,2}(?:\.\d+)?,\s?-?\d{1,3}(?:\.\d+)?)\b")
_LIMIT_RE = re.compile(r"\b(?:top\s+|next\s+|first\s+)?(\d{1,2})\b(?=\s+(?:trains?|buses?|arrivals?|departures?))", re.IGNORECASE)
#: A reliability question: is the service holding, how long is the wait, how bad is the gap.
_HEADWAY_WORDS = re.compile(
    r"\b(?:headways?|reliab\w+|regular\??|running to (?:time|schedule)|holding|"
    r"how (?:long|often) (?:do|does|should|will) .*\bwait|worst (?:wait|gap)|"
    r"longest (?:wait|gap)|can I count on|can i rely on|"
    r"(?:is|are) (?:the |this )?(?:trains?|buses?|service) .*\bevery\b)\b",
    re.IGNORECASE,
)
_DAY_WORDS = re.compile(r"\b(today|tomorrow|tonight)\b", re.IGNORECASE)
_TIMETABLE_WORDS = re.compile(
    r"\b(?:timetable|time ?table|scheduled? (?:times?|departures?|service)|schedule[ds]? for|"
    r"what(?:'s| is) (?:the |today'?s )?(?:timetable|schedule)|when is (?:the |my )?(?:next )?scheduled)\b",
    re.IGNORECASE,
)
_NEARBY_WORDS = re.compile(
    r"\b(?:near(?:by|est)?|closest|nearest|around|close to|walking distance from|"
    r"stops? (?:near|close|around|by))\b",
    re.IGNORECASE,
)
_ARRIVAL_WORDS = re.compile(
    r"\b(?:next|when (?:is|are)|how long until|how soon|due|arriv\w+|depart\w+|leaving)\b",
    re.IGNORECASE,
)
_ALERT_WORDS = re.compile(
    r"\b(?:alerts?|disruptions?|problem\w*|delay\w*|closure\w*|is (?:it|the .*?) running|"
    r"running normally|service change|skipping|shuttl\w+|suspend\w+|diversion\w*)\b",
    re.IGNORECASE,
)
#: A route mentioned in the question, most specific first: a numbered id next to
#: "route"/"bus"/"line", then a capitalised "Red Line", then a lowercase "green line",
#: then a bare id next to "route". Anything looser starts eating the question itself.
_NUMBERED_ROUTE_RE = re.compile(r"\b(?:route|bus|line|branch)\s+(\d{1,3}[A-Za-z]?)\b", re.IGNORECASE)
_CAPS_LINE_RE = re.compile(r"\b([A-Z][A-Za-z0-9]*(?:\s+[A-Z][A-Za-z0-9]*){0,2}\s+Line)\b")
_LOWER_LINE_RE = re.compile(r"\b([a-z][a-z0-9]{1,20}\s+line)\b")
_BARE_ROUTE_RE = re.compile(r"\broute\s+([A-Za-z][A-Za-z0-9-]{1,9})\b", re.IGNORECASE)
_ROUTE_STOPWORDS = ("the", "next", "a", "any", "this", "that", "mbta", "t", "same", "other")
_NETWORK_WORDS = re.compile(
    r"\b(?:whole|entire|full|network|system|everywhere|across (?:the )?(?:network|system|mbta)|"
    r"all (?:the )?(?:lines?|alerts?)|how is the t\b|is the t running)\b",
    re.IGNORECASE,
)

HELP = (
    "I read the MBTA's live v3 feed: real-time arrivals, today's timetable, the stop catalogue, "
    "and service alerts. Ask me:\n"
    "  • when is the next train from place-pktrm?\n"
    "  • what's the timetable at 70068 today?\n"
    "  • which mbta stops are near 42.3519,-71.0601?\n"
    "  • any alerts on the Red Line?\n"
    "  • how is the T running across the network?\n"
    "  • can I count on a train every 8 minutes from place-pktrm? (premium)\n"
    "Times are the agency's own, with its UTC offset. Stop ids look like place-pktrm or 70068; "
    "I can take a line name such as “the Red Line” anywhere a route is asked for."
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


def route_from_text(text: str) -> str | None:
    """A route mentioned in the question, as a name or an id. Never the whole question."""
    for pattern in (_NUMBERED_ROUTE_RE, _CAPS_LINE_RE, _LOWER_LINE_RE, _BARE_ROUTE_RE):
        match = pattern.search(text)
        if not match:
            continue
        candidate = match.group(1).strip(" .,'’\"")
        if len(candidate) > 24 or len(candidate) < 2:
            continue
        if candidate.split()[0].lower() in _ROUTE_STOPWORDS:
            continue
        return candidate
    return None


def parse(message: dict) -> dict:
    """Incoming message -> {skill, params, explicit}. Never raises."""
    text = message_text(message)
    data = message_data(message)
    requested = _first(data, "skill", "skill_id")

    stop = _first(data, "stop", "stop_id", "place", "station")
    if stop is None:
        match = _STOP_RE.search(text)
        if match:
            stop = match.group(1)
    point = _first(data, "point", "lat_lon")
    if point is None:
        match = _POINT_RE.search(text)
        if match:
            point = re.sub(r"\s+", "", match.group(1))
    route = _first(data, "route", "route_id", "line")
    if route is None:
        route = route_from_text(text)
    limit = _first(data, "limit")
    if limit is None:
        match = _LIMIT_RE.search(text)
        if match:
            limit = match.group(1)
    direction_id = _first(data, "direction_id", "direction")
    service_day = _first(data, "date", "service_day")

    asked_for_headway = bool(_HEADWAY_WORDS.search(text))
    asked_for_timetable = bool(_TIMETABLE_WORDS.search(text))
    asked_for_nearby = bool(_NEARBY_WORDS.search(text))
    asked_for_alerts = bool(_ALERT_WORDS.search(text))
    asked_for_network = bool(_NETWORK_WORDS.search(text))
    if service_day is None and _DAY_WORDS.search(text) and _TIMETABLE_WORDS.search(text):
        service_day = _DAY_WORDS.search(text).group(1).lower()

    if requested in (SKILL_NEXT_DEPARTURES, SKILL_STOP_TIMES, SKILL_NEARBY_STOPS,
                     SKILL_ROUTE_ALERTS, SKILL_SERVICE_ALERTS, SKILL_HEADWAY_CHECK):
        skill = requested
    elif asked_for_headway:
        skill = SKILL_HEADWAY_CHECK
    elif asked_for_timetable:
        skill = SKILL_STOP_TIMES
    elif asked_for_nearby and point:
        skill = SKILL_NEARBY_STOPS
    elif asked_for_alerts and route:
        skill = SKILL_ROUTE_ALERTS
    elif asked_for_alerts or asked_for_network:
        skill = SKILL_SERVICE_ALERTS
    elif point:
        skill = SKILL_NEARBY_STOPS
    else:
        skill = SKILL_NEXT_DEPARTURES

    # "how is the T running" is a network question even when a line is named, so a
    # line mention never turns it into a route-only alert.
    if asked_for_network and not requested:
        skill = SKILL_SERVICE_ALERTS
    # "stops near place-pktrm" names a stop, not a point, so it stays with the board.
    if skill == SKILL_NEARBY_STOPS and stop and point is None and not requested:
        skill = SKILL_NEXT_DEPARTURES

    params: dict = {}
    for key, value in (("stop", stop), ("point", point), ("route", route),
                       ("limit", limit), ("direction_id", direction_id), ("date", service_day)):
        if value is not None:
            params[key] = value
    if skill == SKILL_NEXT_DEPARTURES:
        params.setdefault("limit", DEFAULT_ARRIVALS)
    if skill == SKILL_HEADWAY_CHECK:
        params.setdefault("limit", MAX_ARRIVALS)
        if route is not None:
            params["route"] = route
    if not requested and (not text.strip() or re.search(r"\b(help|what can you do|commands?)\b", text, re.IGNORECASE)):
        skill, params = "help", {}
    explicit = bool(requested or asked_for_headway or asked_for_timetable or asked_for_nearby
                    or asked_for_alerts or asked_for_network)
    return {"skill": skill, "params": params, "explicit": explicit}


# -- shared shape ---------------------------------------------------------


def _artifact(params: dict, client: MbtaClient, **extra) -> dict:
    artifact = {
        "dataset": DATASET,
        "product": PRODUCT,
        "source": SOURCE,
        "freshness": client.freshness(),
    }
    artifact.update(extra)
    return artifact


def _missing(skill: str) -> dict:
    if skill == SKILL_NEARBY_STOPS:
        message = (
            "Which point? Give me a latitude/longitude, for example 42.3519,-71.0601, and I will "
            "list the MBTA stops closest to it."
        )
    elif skill == SKILL_ROUTE_ALERTS:
        message = (
            "Which line? Give me a route id such as Red, 66 or 1, or a name such as “the Red Line”, "
            "and I will read that line's alerts."
        )
    else:
        message = (
            "Which stop? Give me an MBTA stop id — place-pktrm for a whole station, 70068 for one "
            "platform — or a point like 42.3519,-71.0601 and I will take the nearest stop."
        )
    return {"final_state": "input-required", "message": message, "artifact": None, "watch": None}


def _stop_label(info: dict | None, stop: str) -> str:
    if info and info.get("name"):
        place = info["name"]
        if info.get("municipality"):
            place += f", {info['municipality']}"
        return f"{place} ({stop})"
    return stop


def _resolve_stop(params: dict, client: MbtaClient) -> tuple[str | None, dict | None]:
    """(stop_id, problem_response) — the problem is a finished response body."""
    stop = params.get("stop")
    if stop:
        return client.check_stop(stop), None
    if params.get("point"):
        nearby = client.nearby_stops(params["point"], limit=1)
        if not nearby:
            lat, lon = client.check_point(params["point"])
            return None, {
                "final_state": "completed",
                "message": (
                    f"The MBTA publishes no stop within reach of {lat},{lon}. That is usually open "
                    f"country rather than a served area — try a city, or ask about a stop id."
                ),
                "artifact": _artifact(params, client, point=f"{lat},{lon}", stop=None),
                "watch": None,
            }
        return nearby[0]["stop"], None
    return None, None


def _arrival_line(arrival: dict) -> str:
    minutes = arrival.get("minutes")
    when = "in %d min" % minutes if minutes is not None else "arrival time not reported"
    uncertainty = arrival.get("uncertainty_minutes")
    tail = f" (±{uncertainty} min)" if uncertainty else ""
    return f"  • {arrival.get('at')}  {when}{tail}  {arrival.get('route_name')} → {arrival.get('direction')}"


# -- skills ---------------------------------------------------------------


def run_next_departures(params: dict, client: MbtaClient) -> dict:
    stop, problem = _resolve_stop(params, client)
    if problem:
        return problem
    route = params.get("route")
    resolved = client.find_route(route) if route else None
    if route and resolved is None:
        return {
            "final_state": "completed",
            "message": (
                f"No MBTA line is called “{route}”. Route ids look like Red, 66 or 1; ask for the "
                f"alerts across the whole network instead to see what is running."
            ),
            "artifact": _artifact(params, client, stop=stop, route=route, resolved_route=None, arrivals=[]),
            "watch": None,
        }
    arrivals = client.predictions(stop, route=resolved, direction_id=params.get("direction_id"),
                                  limit=params.get("limit", DEFAULT_ARRIVALS))
    info = client.stop_info(stop)
    label = _stop_label(info, stop)
    artifact = _artifact(params, client, stop=stop, place=info.get("name") if info else None,
                         route=resolved, arrivals=arrivals, count=len(arrivals))
    if not arrivals:
        return {
            "final_state": "completed",
            "message": (
                f"The MBTA has no live arrival in the next few minutes for {label}. Ask for the "
                f"timetable to see the scheduled service, or the alerts to see whether something is "
                f"disrupted. (Read live from {DATASET}.)"
            ),
            "artifact": artifact,
            "watch": None,
        }
    listing = "\n".join(_arrival_line(arrival) for arrival in arrivals[:MAX_LISTED])
    return {
        "final_state": "completed",
        "message": (
            f"Next departures from {label}, agency local time:\n{listing}\n"
            f"Live predictions from {DATASET}. Uncertainty is the agency's own estimate in minutes."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_stop_times(params: dict, client: MbtaClient) -> dict:
    stop, problem = _resolve_stop(params, client)
    if problem:
        return problem
    info = client.stop_info(stop)
    label = _stop_label(info, stop)
    requested = params.get("date")
    if requested in (None, ""):
        requested = None
    elif requested in ("today", "tomorrow"):
        requested = client.agency_day(0 if requested == "today" else 1)
    else:
        requested = client.check_date(requested)

    rows = client.schedules(stop, limit=params.get("limit", DEFAULT_ARRIVALS), date=requested)
    day = requested or client.agency_today()
    rolled_over = False
    if not rows and requested is None:
        # Past the last train of the service day, so the honest answer is tomorrow.
        day = client.agency_tomorrow()
        rows = client.schedules(stop, limit=params.get("limit", DEFAULT_ARRIVALS), date=day)
        rolled_over = True
    artifact = _artifact(params, client, stop=stop, place=info.get("name") if info else None,
                         service_day=day, schedule=rows, count=len(rows))
    if not rows:
        return {
            "final_state": "completed",
            "message": (
                f"The MBTA publishes no scheduled departure for {label} on {day}. That is either "
                f"outside service hours or a stop with no timetable; ask for the live board or the "
                f"alerts instead. (Read live from {DATASET}.)"
            ),
            "artifact": artifact,
            "watch": None,
        }
    listing = "\n".join(
        f"  • {row.get('at')}  {row.get('route_name')} → {row.get('direction')}" for row in rows[:MAX_LISTED]
    )
    lead = (f"Service for {label} on {day}"
            + (", the first departures of the next day — nothing is left today" if rolled_over else ", for the rest of the day"))
    return {
        "final_state": "completed",
        "message": (
            f"{lead}, agency local time:\n{listing}\n"
            f"Scheduled times, not the live board — read live from {DATASET}."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_nearby_stops(params: dict, client: MbtaClient) -> dict:
    lat, lon = client.check_point(params["point"])
    route = params.get("route")
    resolved = client.find_route(route) if route else None
    if route and resolved is None:
        return {
            "final_state": "completed",
            "message": f"No MBTA line is called “{route}”. Route ids look like Red, 66 or 1.",
            "artifact": _artifact(params, client, point=f"{lat},{lon}", route=route, stops=[]),
            "watch": None,
        }
    stops = client.nearby_stops(f"{lat},{lon}", limit=params.get("limit", 5), route=resolved)
    artifact = _artifact(params, client, point=f"{lat},{lon}", route=resolved, stops=stops, count=len(stops))
    if not stops:
        return {
            "final_state": "completed",
            "message": (
                f"The MBTA publishes no stop within reach of {lat},{lon}"
                f"{f' on route {resolved}' if resolved else ''}. (Read live from {DATASET}.)"
            ),
            "artifact": artifact,
            "watch": None,
        }
    listing = "\n".join(
        f"  • {stop.get('stop')} — {stop.get('name') or 'name not reported'}"
        + (f", {stop['municipality']}" if stop.get("municipality") else "")
        + (f" — {stop['distance_km']} km away" if "distance_km" in stop else "")
        for stop in stops[:MAX_LISTED]
    )
    return {
        "final_state": "completed",
        "message": (
            f"{len(stops)} MBTA stop(s) nearest {lat},{lon}"
            f"{f' on route {resolved}' if resolved else ''}:\n{listing}\nSource: {DATASET} (read live)."
        ),
        "artifact": artifact,
        "watch": None,
    }


def _alert_line(alert: dict) -> str:
    header = (alert.get("header") or alert.get("description") or "no header published").strip()
    if len(header) > 220:
        header = header[:217].rstrip() + "…"
    effect = alert.get("service_effect") or alert.get("effect") or "effect not reported"
    return f"  • [{alert.get('severity_label')}] {effect} — {header}"


def run_route_alerts(params: dict, client: MbtaClient) -> dict:
    route = params.get("route")
    resolved = client.find_route(route)
    if resolved is None:
        return {
            "final_state": "completed",
            "message": (
                f"No MBTA line is called “{route}”. Route ids look like Red, 66 or 1; a line name such "
                f"as “the Red Line” also works. Ask how the T is running network-wide for everything."
            ),
            "artifact": _artifact(params, client, route=route, resolved_route=None, alerts=[]),
            "watch": None,
        }
    alerts = client.alerts(route=resolved, limit=params.get("limit", MAX_ALERTS))
    name = client.route_list().get(resolved, {}).get("long_name") or resolved
    artifact = _artifact(params, client, route=resolved, route_name=name, alerts=alerts, count=len(alerts))
    if not alerts:
        return {
            "final_state": "completed",
            "message": (
                f"The MBTA has no alert running for {name} ({resolved}) right now, which means no "
                f"published disruption on that line. (Read live from {DATASET}.)"
            ),
            "artifact": artifact,
            "watch": None,
        }
    listing = "\n".join(_alert_line(alert) for alert in alerts[:MAX_LISTED])
    return {
        "final_state": "completed",
        "message": (
            f"{len(alerts)} MBTA alert(s) on {name} ({resolved}):\n{listing}\n"
            f"The wording is the agency's own. Source: {DATASET} (read live)."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_service_alerts(params: dict, client: MbtaClient) -> dict:
    alerts = client.alerts(limit=params.get("limit", MAX_ALERTS))
    order = {"severe": 0, "warning": 1, "info": 2, "not reported": 3}
    alerts.sort(key=lambda alert: (order.get(alert.get("severity_label"), 3), alert.get("created_at") or ""))
    artifact = _artifact(params, client, alerts=alerts, count=len(alerts))
    if not alerts:
        return {
            "final_state": "completed",
            "message": (
                f"The MBTA has no service alert running anywhere on the network right now. "
                f"(Read live from {DATASET}.)"
            ),
            "artifact": artifact,
            "watch": None,
        }
    severe = sum(1 for alert in alerts if alert.get("severity_label") == "severe")
    listing = "\n".join(_alert_line(alert) for alert in alerts[:MAX_LISTED])
    return {
        "final_state": "completed",
        "message": (
            f"{len(alerts)} MBTA alert(s) across the network"
            f"{f', {severe} severe' if severe else ''}:\n{listing}\n"
            f"The wording is the agency's own. Source: {DATASET} (read live)."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_headway_check(params: dict, client: MbtaClient, gateway: GatewayClient) -> dict:
    """The premium headway judgement. The work happens on the gateway.

    Nothing here reads the prediction feed: the gateway does the work behind its
    licence check and hands back the gaps, so a caller who has not paid gets the
    gateway's own message and no headway at all.
    """
    stop, problem = _resolve_stop(params, client)
    if problem:
        return problem
    route = params.get("route")
    resolved = client.find_route(route) if route else None
    if route and resolved is None:
        return {
            "final_state": "completed",
            "message": (
                f"No MBTA line is called “{route}”. Route ids look like Red, 66 or 1, or give me a "
                f"name such as “the Red Line”."
            ),
            "artifact": _artifact(params, client, stop=stop, route=route, resolved_route=None, watching=None),
            "watch": None,
        }
    try:
        limit = client.check_limit(params.get("limit") or MAX_ARRIVALS, MAX_ARRIVALS)
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}

    info = client.stop_info(stop)
    label = _stop_label(info, stop)
    arguments: dict = {"stop": stop, "limit": limit}
    if resolved:
        arguments["route"] = resolved
    direction_id = params.get("direction_id")
    if direction_id not in (None, ""):
        try:
            arguments["direction_id"] = client.check_direction(direction_id)
        except ValueError as exc:
            return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}

    read, refused = premium_call(gateway, "a2a_mbta_headway", arguments, {
        "dataset": DATASET, "stop": stop, "place": label, "route": resolved,
    })
    if refused:
        return refused
    if not isinstance(read, dict) or not read.get("arrivals_read"):
        return empty_premium_answer(
            "The licence gateway answered without any MBTA arrivals, so there is nothing to measure.",
            {"dataset": DATASET, "stop": stop, "place": label},
        )

    headway = read.get("headway_minutes") or {}
    regularity = read.get("regularity") or {}
    longest = read.get("longest_wait") or {}
    lines = [
        f"Headway at {label} ({stop})"
        + (f", route {read.get('route') or resolved}" if (read.get("route") or resolved) else "")
        + f": {read.get('arrivals_read')} live arrivals read.",
        f"  • median gap {headway.get('median')} min, shortest {headway.get('shortest')} min, "
        f"longest {headway.get('longest')} min, over {headway.get('gaps')} gap(s).",
        f"  • longest single wait: {longest.get('minutes')} min from {longest.get('at')} "
        f"(next arrival {longest.get('next_at')}).",
        f"  • verdict: {regularity.get('verdict')} — {regularity.get('rule')}; the worst gap sits "
        f"{regularity.get('max_deviation_minutes')} min off the median.",
    ]
    if read.get("arrivals_read", 0) < MIN_ARRIVALS_FOR_HEADWAY:
        lines.append(
            f"  • Only {read.get('arrivals_read')} arrival(s) are live, so this is a snapshot rather "
            f"than a pattern. Ask again in a few minutes."
        )
    lines.append(
        f"\nWorked out on the MCP gateway behind its licence check, from the MBTA's live prediction "
        f"feed ({DATASET}). Headways move with congestion and incidents, so read this as the board "
        f"right now, not a promise."
    )
    artifact = {
        "dataset": DATASET,
        "source": SOURCE,
        "premium": True,
        "stop": stop,
        "place": label,
        "route": read.get("route") or resolved,
        "arrivals_read": read.get("arrivals_read"),
        "arrivals": read.get("arrivals"),
        "headway_minutes": headway,
        "longest_wait": longest,
        "regularity": regularity,
        "generated_at": read.get("generated_at"),
    }
    return {"final_state": "completed", "message": "\n".join(lines), "artifact": artifact, "watch": None}


class MbtaAgent(SkillAgent):
    name = "mbta"
    card_name = "MBTA Transit Agent"
    card_description = (
        "Read-only agent over the MBTA's v3 API: real-time arrivals at any stop, today's timetable "
        "there, the stops nearest a point, and service alerts for one line or the whole network — "
        "with the agency's own alert wording. One premium skill turns the live arrival stream into a "
        "headway-reliability answer, and it runs behind a licence check on the gateway."
    )
    env_prefix = "MBTA"
    datasets = (DATASET,)
    card_skills = CARD_SKILLS

    def __init__(self, client: MbtaClient | None = None, gateway: GatewayClient | None = None) -> None:
        self.client = client or MbtaClient()
        self.gateway = gateway or GatewayClient()

    def parse(self, message: dict) -> dict:
        return parse(message)

    def missing(self, skill: str, params: dict) -> list[str]:
        if skill == SKILL_NEARBY_STOPS:
            return [] if params.get("point") else ["point"]
        if skill == SKILL_ROUTE_ALERTS:
            return [] if params.get("route") else ["route"]
        if skill in (SKILL_NEXT_DEPARTURES, SKILL_STOP_TIMES, SKILL_HEADWAY_CHECK):
            has_place = any(params.get(key) for key in ("stop", "point"))
            return [] if has_place else ["stop"]
        return []

    def input_prompt(self, skill: str, missing: list[str]) -> str:
        return _missing(skill)["message"]

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
            if skill == SKILL_HEADWAY_CHECK:
                return run_headway_check(params, self.client, self.gateway)
            if skill == SKILL_NEXT_DEPARTURES:
                return run_next_departures(params, self.client)
            if skill == SKILL_STOP_TIMES:
                return run_stop_times(params, self.client)
            if skill == SKILL_NEARBY_STOPS:
                return run_nearby_stops(params, self.client)
            if skill == SKILL_ROUTE_ALERTS:
                return run_route_alerts(params, self.client)
            if skill == SKILL_SERVICE_ALERTS:
                return run_service_alerts(params, self.client)
        except UpstreamError as exc:
            return {"final_state": "failed", "message": str(exc), "artifact": None, "watch": None}
        except ValueError as exc:
            return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
        return {"final_state": "completed", "message": HELP, "artifact": None, "watch": None}


__all__ = [
    "CARD_SKILLS",
    "DATASET",
    "HELP",
    "MAX_LISTED",
    "MbtaAgent",
    "MbtaClient",
    "SKILL_HEADWAY_CHECK",
    "SKILL_NEARBY_STOPS",
    "SKILL_NEXT_DEPARTURES",
    "SKILL_ROUTE_ALERTS",
    "SKILL_SERVICE_ALERTS",
    "SKILL_STOP_TIMES",
    "UpstreamError",
    "message_data",
    "message_text",
    "parse",
    "route_from_text",
    "run_headway_check",
    "run_nearby_stops",
    "run_next_departures",
    "run_route_alerts",
    "run_service_alerts",
    "run_stop_times",
]
