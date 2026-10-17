"""The CelesTrak satellites agent: five skills over GP elements and the space catalogue.

  - orbit-elements:  the published TLE and derived elements for one satellite, or a group listing
  - overhead:        what is above a point right now, with elevation, azimuth and range
  - passes:          upcoming passes of one satellite over a point, or of a whole group
  - catalog-lookup:  the SATCAT record: owner, launch date, orbit regime, decay date
  - pass-windows:    the next days at a place read as usable observation windows

Premium: `pass-windows` runs on a hosted service that was removed. That work is not in this
repository at all - the gateway propagates the element sets and merges the
overlapping passes, so a caller who has not paid gets a not-implemented stub message
and no times at all. Every other skill reads CelesTrak directly and stays free.

The times are modelled, not SGP4: two-body Kepler with secular J2 drift, no
short-period terms and no drag. Every answer that carries a time also carries
the age of the element set, because that is what says how much to trust it.
"""

from __future__ import annotations

import re

from a2a_kit import SkillAgent

from data import (
    DATASET,
    GROUPS,
    MAX_GROUP_SATELLITES,
    SATCAT_DATASET,
    CelesTrakClient,
    UpstreamError,
)

SKILL_ORBIT_ELEMENTS = "orbit-elements"
SKILL_OVERHEAD = "overhead"
SKILL_PASSES = "passes"
SKILL_CATALOG = "catalog-lookup"
SKILL_PASS_WINDOWS = "pass-windows"

#: The gateway tool that does the premium work. Same name here and on the gateway.
GATEWAY_TOOL = "a2a_satellites_pass_windows"

SOURCE = "CelesTrak GP element sets and SATCAT space catalogue"
DEFAULT_MIN_ELEVATION = 10.0
DEFAULT_PASS_DAYS = 2
MAX_LISTED = 8

CARD_SKILLS = [
    {
        "id": SKILL_ORBIT_ELEMENTS,
        "name": "Orbit elements",
        "description": (
            "The published element set for a satellite: NORAD catalogue number, international "
            "designator, epoch, mean motion, eccentricity, inclination, and the period, semi-major "
            "axis, perigee and apogee derived from them. Give a catalogue number, a name, or a group "
            "such as stations, visual or weather."
        ),
        "tags": ["satellites", "celestrak", "orbit", "tle", "elements"],
        "examples": [
            "what are the orbit elements for 25544?",
            "orbital elements for the ISS",
            '{"skill": "orbit-elements", "catnr": "25544"}',
            "list the visual group",
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_OVERHEAD,
        "name": "What is overhead right now",
        "description": (
            "Which satellites in a group are above a latitude/longitude right now and at what "
            "elevation, azimuth and slant range. Sorted by elevation, so the highest thing in the "
            "sky is first."
        ),
        "tags": ["satellites", "celestrak", "overhead", "sky", "now"],
        "examples": [
            "what is overhead at 40.7006,-74.0142?",
            "anything visible from 51.5074,-0.1278 right now?",
            '{"skill": "overhead", "point": "40.7,-74.0", "min_elevation": 20}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_PASSES,
        "name": "Satellite passes over a point",
        "description": (
            "Upcoming passes of one satellite over a place: rise, set, how long the pass lasts, the "
            "highest elevation it reaches, the slant range and the azimuth at the peak. Give a "
            "catalogue number or a name, or ask for a whole group to see what is coming over."
        ),
        "tags": ["satellites", "celestrak", "passes", "sighting", "sky"],
        "examples": [
            "when does the ISS pass over 40.7006,-74.0142?",
            "passes for 25544 over New York tomorrow",
            '{"skill": "passes", "catnr": "25544", "point": "40.7,-74.0", "min_elevation": 30}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_CATALOG,
        "name": "Space catalogue record",
        "description": (
            "The catalogue record for an object: who owns it, what it is, when and from where it "
            "launched, its object type and orbital regime, apogee and perigee, and whether it has "
            "decayed."
        ),
        "tags": ["satellites", "celestrak", "satcat", "catalogue", "owner", "launch"],
        "examples": [
            "who owns satellite 25544?",
            "when was the ISS launched and from where?",
            '{"skill": "catalog-lookup", "catnr": "25544"}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_PASS_WINDOWS,
        "name": "Observation windows over a place",
        "description": (
            "The next few days at a place read as windows you could actually use: each stretch of "
            "time something is above an elevation worth getting out for, when it starts and ends, "
            "how long it lasts, which satellite gives the best pass inside it, the total hours on "
            "offer and the dead gaps between them. Premium: it runs on a hosted service that was removed on the "
            "gateway, which does the propagation and the merging."
        ),
        "tags": ["satellites", "celestrak", "passes", "windows", "planning",],
        "examples": [
            "when are the good satellite windows from London over the next 3 days?",
            "how many hours of usable passes do I have from 51.5074,-0.1278 this week?",
            '{"skill": "pass-windows", "point": "51.5074,-0.1278", "days": 3, "min_elevation": 20}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
]

_CATNR_RE = re.compile(r"\b(\d{1,6})\b")
_POINT_RE = re.compile(r"\b(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\b")
#: A short run of capitalised words, the only place a satellite name is taken from.
_NAME_RE = re.compile(
    r"\b(?:satellite|the|a|an|iss|for|of|about|tle|orbit(?:al)? elements? (?:for|of))\s+"
    r"((?:[A-Z0-9][A-Za-z0-9'’.\-]*(?:\s+(?:[A-Z0-9][A-Za-z0-9'’.\-]*|of|the)){0,3}))"
)
_DAYS_RE = re.compile(r"\b(?:next|for|following|over|in)?\s*(\d{1,2})\s*days?\b", re.IGNORECASE)
_ELEVATION_RE = re.compile(
    r"\b(\d{1,3}(?:\.\d+)?)\s*(?:deg(?:rees?)?|°)\b|"
    r"\b(?:above|over|higher than|at least|at or above)\s*(\d{1,3}(?:\.\d+)?)\s*deg(?:rees?)?\b",
    re.IGNORECASE,
)
#: Observation windows. Narrow on purpose: "when does the ISS pass" is a pass, not
#: a window, so this asks for a stretch of time, a total, or the best stretch.
_WINDOW_WORDS = re.compile(
    r"\b(?:windows?|best (?:window|time|stretch)|how (?:many|long)|total hours?|"
    r"opportunit\w+|free (?:time|evening|afternoon)|gaps?|dead (?:time|air)|"
    r"when (?:can|could|will) i (?:get|go|be out|watch|spot|see|shoot)|"
    r"free to (?:observe|watch|spot|photograph|photograph|shoot)|"
    r"how (?:many hours|often))\b",
    re.IGNORECASE,
)
#: Catalog questions: ownership, launch, decay, what kind of object it is.
_CATALOG_WORDS = re.compile(
    r"\b(?:who owns|owner|operat(?:or|ed) by|launched|launch (?:date|site)|"
    r"catalogue|catalog record|satcat|decay|decayed|re-?entry|reentered|"
    r"what (?:kind|type) of (?:satellite|object)|who (?:runs|operates))\b",
    re.IGNORECASE,
)
_OVERHEAD_WORDS = re.compile(
    r"\b(?:overhead|above (?:me|us|here|head)|right now|at this (?:moment|instant)|"
    r"visible (?:right )?now|up (?:right )?now|currently (?:up|above|visible))\b",
    re.IGNORECASE,
)
_PASS_WORDS = re.compile(
    r"\b(?:pass(?:es|ing)?|sighting|visible (?:from|over)|when (?:will|can|does) (?:i|the|it)|"
    r"overfly|overflight|transit)\b",
    re.IGNORECASE,
)
_ELEMENT_WORDS = re.compile(
    r"\b(?:elements?|tle|inclination|mean motion|eccentricity|perigee|apogee|"
    r"semi[- ]major|orbital period|orbit|radar|reflect)\b",
    re.IGNORECASE,
)
_GROUP_HINT = re.compile(rf"\b({'|'.join(GROUPS)})\b", re.IGNORECASE)

#: A short run of capitalised words used to spot a satellite name in free text.
_NAME_STOPWORDS = re.compile(
    r"^(?:THE|A|AN|IS|ME|US|HERE|NOW|AT|IN|ON|OVER|NEXT|PASS|PASSES|ELEMENTS?|ORBIT|ORBITAL|"
    r"SATELLITE|SATELLITES|TLE|IT|ANY|GROUP|STATIONS|VISUAL|ACTIVE|WEATHER)$",
    re.IGNORECASE,
)

HELP = (
    "I read CelesTrak's element sets and space catalogue, and propagate the elements to work out "
    "where things are. Ask me:\n"
    "  • what are the orbit elements for 25544?\n"
    "  • what is overhead at 40.7006,-74.0142?\n"
    "  • when does the ISS pass over 40.7006,-74.0142?\n"
    "  • who owns satellite 25544?\n"
    "  • when are the good satellite windows from London over the next 3 days?\n"
    "Times are propagated from the published elements with a two-body model plus secular J2 drift, "
    "not SGP4, so they are good to a few minutes near the element-set epoch and drift as it ages - "
    "I always report how old the element set was."
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


def satellite_name_from_text(text: str, catnr: str | None) -> str | None:
    """A satellite name only when the text really offers one, never the whole question."""
    if catnr:
        return None
    match = _NAME_RE.search(text)
    if not match:
        return None
    candidate = match.group(1).strip(" .,'’\"")
    if len(candidate) < 3 or len(candidate.split()) > 4:
        return None
    if _NAME_STOPWORDS.fullmatch(candidate):
        return None
    return candidate


def parse(message: dict) -> dict:
    """Incoming message -> {skill, params, explicit}. Never raises."""
    text = message_text(message)
    data = message_data(message)
    requested = _first(data, "skill", "skill_id")

    # The point is found first and blanked out of the text, because a latitude
    # and longitude are two bare numbers and would otherwise be read as a
    # catalogue number. "over 40.7006,-74.0142" is a place, not satellite 40.
    point = _first(data, "point", "lat_lon", "location")
    remainder = text
    if point is None:
        match = _POINT_RE.search(text)
        if match:
            point = f"{match.group(1)},{match.group(2)}"
            remainder = text[: match.start()] + " " + text[match.end():]
    catnr = _first(data, "catnr", "norad_id", "norad_cat_id")
    if catnr is None:
        # A number followed by "days" is a window length, not an object either.
        match = _CATNR_RE.search(re.sub(r"\b\d{1,2}\s*days?\b", " ", remainder, flags=re.IGNORECASE))
        if match:
            catnr = match.group(1)
    name = _first(data, "name", "satellite", "satellite_name")
    if name is None:
        name = satellite_name_from_text(text, catnr)
    group = _first(data, "group")
    if group is None:
        match = _GROUP_HINT.search(text)
        if match:
            group = match.group(1).lower()
    days = _first(data, "days")
    if days is None:
        match = _DAYS_RE.search(text)
        if match:
            days = match.group(1)
    min_elevation = _first(data, "min_elevation", "elevation", "min_altitude")
    if min_elevation is None:
        match = _ELEVATION_RE.search(text)
        if match:
            min_elevation = match.group(1) or match.group(2)
    limit = _first(data, "limit", default=10)

    if requested in (SKILL_ORBIT_ELEMENTS, SKILL_OVERHEAD, SKILL_PASSES,
                     SKILL_CATALOG, SKILL_PASS_WINDOWS):
        skill = requested
    elif _WINDOW_WORDS.search(text):
        skill = SKILL_PASS_WINDOWS
    elif _CATALOG_WORDS.search(text):
        skill = SKILL_CATALOG
    elif _OVERHEAD_WORDS.search(text):
        skill = SKILL_OVERHEAD
    elif _PASS_WORDS.search(text):
        skill = SKILL_PASSES
    else:
        skill = SKILL_ORBIT_ELEMENTS

    params: dict = {"limit": limit}
    for key, value in (("catnr", catnr), ("point", point), ("name", name), ("group", group),
                       ("days", days), ("min_elevation", min_elevation)):
        if value is not None:
            params[key] = value
    if skill == SKILL_PASS_WINDOWS:
        params.setdefault("days", DEFAULT_PASS_DAYS)
    if skill in (SKILL_OVERHEAD, SKILL_PASSES, SKILL_PASS_WINDOWS):
        params.setdefault("group", "stations")

    if not requested and (not text.strip()
                          or re.search(r"\b(help|what can you do|commands?)\b", text, re.IGNORECASE)):
        skill, params = "help", {}
    explicit = bool(requested or _WINDOW_WORDS.search(text) or _CATALOG_WORDS.search(text)
                    or _OVERHEAD_WORDS.search(text) or _PASS_WORDS.search(text)
                    or _ELEMENT_WORDS.search(text))
    return {"skill": skill, "params": params, "explicit": explicit}


# -- shared shape ---------------------------------------------------------


def _artifact(params: dict, client: CelesTrakClient, **extra) -> dict:
    artifact = {
        "dataset": DATASET,
        "product": "CelesTrak GP element sets",
        "source": SOURCE,
        "freshness": client.freshness(),
    }
    artifact.update(extra)
    return artifact


def _missing_point() -> dict:
    return {
        "final_state": "input-required",
        "message": (
            "Which place? Give me a latitude/longitude point, for example "
            "40.7006,-74.0142 for the Battery in New York, or 51.5074,-0.1278 for London."
        ),
        "artifact": None,
        "watch": None,
    }


def _unknown_satellite(catnr: str | None, name: str | None) -> dict:
    wanted = f"catalogue number {catnr}" if catnr else f"name “{name}”"
    return {
        "final_state": "completed",
        "message": (
            f"CelesTrak has no satellite matching {wanted}. Check the catalogue number, or give a "
            "name such as ISS (ZARYA) - names match loosely, so an exact catalogue number is "
            f"safer. (Read live from {DATASET}.)"
        ),
        "artifact": None,
        "watch": None,
    }


def _ambiguous(name: str, candidates: list[dict]) -> dict:
    listing = "\n".join(
        f"  • {row.get('norad_cat_id')} — {row.get('object_name')}" for row in candidates[:6]
    )
    return {
        "final_state": "input-required",
        "message": (
            f"“{name}” matches {len(candidates)} objects. Which one?\n{listing}\n"
            "Give me a catalogue number."
        ),
        "artifact": {"candidates": candidates[:6]},
        "watch": None,
    }


def _resolve(client: CelesTrakClient, params: dict):
    """(element row, candidates) or a finished response body to hand straight back."""
    try:
        row, candidates = client.resolve(catnr=params.get("catnr"), name=params.get("name"))
    except ValueError as exc:
        return None, None, {"final_state": "input-required", "message": str(exc),
                            "artifact": None, "watch": None}
    if row is not None:
        return row, [], None
    if candidates:
        return None, candidates, _ambiguous(params.get("name") or params.get("catnr") or "", candidates)
    return None, [], _unknown_satellite(params.get("catnr"), params.get("name"))


def _accuracy_note(age_hours) -> str:
    """The provenance every propagated answer owes the caller."""
    if age_hours is None:
        return (
            "I could not read the age of that element set, so treat the position and times as "
            "approximate."
        )
    return (
        f"Propagated from an element set {age_hours} h old with a two-body model plus secular J2 "
        "drift (not SGP4), so positions and times are good to a few minutes near the epoch and "
        "drift as the element set ages."
    )


# -- skills ---------------------------------------------------------------


def run_orbit_elements(params: dict, client: CelesTrakClient) -> dict:
    limit = params.get("limit", 10)
    if params.get("catnr") or params.get("name"):
        row, _candidates, problem = _resolve(client, params)
        if problem:
            return problem
        summary = client.element_summary(row)
        artifact = _artifact(params, client, satellite=summary, count=1)
        lines = [
            f"  • period {summary.get('period_minutes')} min, semi-major axis "
            f"{summary.get('semi_major_km')} km",
            f"  • perigee {summary.get('perigee_km')} km, apogee {summary.get('apogee_km')} km, "
            f"inclination {summary.get('inclination_deg')}°",
            f"  • eccentricity {summary.get('eccentricity')}, mean motion "
            f"{summary.get('mean_motion_rev_per_day')} rev/day",
            f"  • epoch {summary.get('epoch')}, element set {summary.get('element_set_age_hours')} h old",
        ]
        heading = f"{summary.get('object_name')} ({summary.get('norad_cat_id')})"
        if summary.get("international_designator"):
            heading += f", {summary['international_designator']}"
        return {
            "final_state": "completed",
            "message": f"{heading}, from CelesTrak:\n" + "\n".join(lines)
            + f"\nSource: {DATASET} (read live).",
            "artifact": artifact,
            "watch": None,
        }

    group = params.get("group")
    if not group:
        return {
            "final_state": "input-required",
            "message": (
                "Which satellite? Give me a catalogue number (25544 for the ISS), a name such as "
                f"ISS (ZARYA), or a group to list: {', '.join(GROUPS[:8])} and others."
            ),
            "artifact": None,
            "watch": None,
        }
    try:
        rows = client.group_elements(group, limit=limit)
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    artifact = _artifact(params, client, group=group, satellites=rows, count=len(rows))
    if not rows:
        return {
            "final_state": "completed",
            "message": (f"CelesTrak's “{group}” group is empty right now. (Read live from {DATASET}.)"),
            "artifact": artifact,
            "watch": None,
        }
    listing = "\n".join(
        f"  • {row.get('object_name')} ({row.get('norad_cat_id')}) — period "
        f"{row.get('period_minutes')} min, {row.get('perigee_km')}–{row.get('apogee_km')} km, "
        f"inclination {row.get('inclination_deg')}°"
        for row in rows
    )
    return {
        "final_state": "completed",
        "message": (f"{len(rows)} object(s) in the CelesTrak “{group}” group:\n{listing}\n"
                    f"Source: {DATASET} (read live)."),
        "artifact": artifact,
        "watch": None,
    }


def run_overhead(params: dict, client: CelesTrakClient) -> dict:
    point = params.get("point")
    if not point:
        return _missing_point()
    try:
        min_elevation = client.check_elevation(params.get("min_elevation", DEFAULT_MIN_ELEVATION))
        visible = client.overhead(point, min_elevation, params.get("group", "stations"),
                                  params.get("limit", 10))
        group = client.check_group(params.get("group", "stations"))
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    artifact = _artifact(params, client, point=point, group=group,
                         min_elevation_deg=min_elevation, visible=visible, count=len(visible))
    if not visible:
        return {
            "final_state": "completed",
            "message": (
                f"Nothing in the CelesTrak “{group}” group is above {min_elevation:g}° from {point} "
                f"right now. The group is a fixed set of objects, so try another group such as "
                f"visual, or a lower elevation. (Read live from {DATASET}.)"
            ),
            "artifact": artifact,
            "watch": None,
        }
    listing = "\n".join(
        f"  • {row['object_name']} — {row['elevation_deg']}° up, azimuth {row['azimuth_deg']}°, "
        f"range {row['range_km']} km, altitude {row['altitude_km']} km, over "
        f"{row['subpoint']['latitude']}, {row['subpoint']['longitude']}"
        for row in visible
    )
    oldest = max((row["element_set_age_hours"] or 0.0) for row in visible)
    return {
        "final_state": "completed",
        "message": (
            f"{len(visible)} object(s) above {min_elevation:g}° from {point} right now, highest "
            f"first:\n{listing}\n{_accuracy_note(oldest)}\nSource: {DATASET} (read live)."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_passes(params: dict, client: CelesTrakClient) -> dict:
    point = params.get("point")
    if not point:
        return _missing_point()
    try:
        min_elevation = client.check_elevation(params.get("min_elevation", DEFAULT_MIN_ELEVATION))
        days = client.check_days(params.get("days", DEFAULT_PASS_DAYS))
        limit = client.check_limit(params.get("limit", 10))
        group = client.check_group(params.get("group", "stations"))
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}

    if params.get("catnr") or params.get("name"):
        row, _candidates, problem = _resolve(client, params)
        if problem:
            return problem
        found = client.passes(row, point, min_elevation, days, limit=limit)
        summary = client.element_summary(row)
        artifact = _artifact(params, client, point=point, satellite=summary,
                             min_elevation_deg=min_elevation, days=days,
                             passes=found, count=len(found))
        if not found:
            return {
                "final_state": "completed",
                "message": (
                    f"{summary.get('object_name')} does not rise above {min_elevation:g}° from "
                    f"{point} in the next {days} day(s). Ask for a lower elevation, or use the "
                    f"pass-windows skill to ask what is worth going outside for. "
                    f"(Propagated from {DATASET}.)"
                ),
                "artifact": artifact,
                "watch": None,
            }
        listing = "\n".join(
            f"  • {entry['start']} to {entry['end']} ({entry['minutes']} min) — peaks at "
            f"{entry['max_elevation_deg']}° at {entry['max_at']}, range {entry['range_km']} km, "
            f"azimuth {entry['azimuth_deg']}°"
            for entry in found
        )
        return {
            "final_state": "completed",
            "message": (
                f"{summary.get('object_name')} over {point} in the next {days} day(s), above "
                f"{min_elevation:g}°:\n{listing}\n{_accuracy_note(summary.get('element_set_age_hours'))}\n"
                f"Source: {DATASET} (read live)."
            ),
            "artifact": artifact,
            "watch": None,
        }

    sweep = client.group_passes(point, min_elevation, group, days, limit=limit)
    artifact = _artifact(params, client, point=point, group=group,
                         min_elevation_deg=min_elevation, days=days,
                         passes=sweep["passes"], count=len(sweep["passes"]),
                         satellites_swept=sweep["satellites_swept"])
    found = sweep["passes"]
    if not found:
        return {
            "final_state": "completed",
            "message": (
                f"Nothing in the CelesTrak “{group}” group rises above {min_elevation:g}° from "
                f"{point} in the next {days} day(s), out of {sweep['satellites_swept']} object(s) "
                f"swept. Lower the elevation, widen the days, or use the pass-windows skill to ask "
                f"what is worth going outside for. (Propagated from {DATASET}.)"
            ),
            "artifact": artifact,
            "watch": None,
        }
    listing = "\n".join(
        f"  • {entry['start']} to {entry['end']} ({entry['minutes']} min) — {entry['object_name']} "
        f"peaks at {entry['max_elevation_deg']}°, range {entry['range_km']} km"
        for entry in found
    )
    oldest = max((entry["element_set_age_hours"] or 0.0) for entry in found)
    return {
        "final_state": "completed",
        "message": (
            f"{len(found)} pass(es) from the CelesTrak “{group}” group over {point} in the next "
            f"{days} day(s), out of {sweep['satellites_swept']} object(s) swept:\n{listing}\n"
            f"{_accuracy_note(oldest)}\nSource: {DATASET} (read live)."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_catalog(params: dict, client: CelesTrakClient) -> dict:
    if not any(params.get(key) for key in ("catnr", "name", "group")):
        return {
            "final_state": "input-required",
            "message": (
                "Which object? Give me a catalogue number (25544 for the ISS), a name such as "
                "ISS (ZARYA), or a group to list."
            ),
            "artifact": None,
            "watch": None,
        }
    try:
        records = client.catalog(catnr=params.get("catnr"), name=params.get("name"),
                                 group=params.get("group"), limit=params.get("limit", 10))
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    artifact = _artifact(params, client, records=records, count=len(records))
    artifact["dataset"] = SATCAT_DATASET
    if not records:
        return {
            "final_state": "completed",
            "message": (
                f"The CelesTrak space catalogue has nothing matching that. Check the catalogue "
                f"number, or ask for a group. (Read live from {SATCAT_DATASET}.)"
            ),
            "artifact": artifact,
            "watch": None,
        }
    listing = "\n".join(
        f"  • {row.get('object_name')} ({row.get('norad_cat_id')})"
        f" — owner {row.get('owner') or 'not reported'}, type {row.get('object_type') or 'not reported'},"
        f" launched {row.get('launch_date') or 'not reported'}"
        + (f" from {row['launch_site']}" if row.get("launch_site") else "")
        + f", {row.get('perigee_km') or '?'}–{row.get('apogee_km') or '?'} km at "
        f"{row.get('inclination_deg')}°"
        + (f", decayed {row['decay_date']}" if row.get("decay_date") else "")
        for row in records
    )
    return {
        "final_state": "completed",
        "message": f"{len(records)} catalogue record(s):\n{listing}\nSource: {SATCAT_DATASET} (read live).",
        "artifact": artifact,
        "watch": None,
    }


def run_pass_windows(params: dict, client: CelesTrakClient, gateway: object) -> dict:
    """Stub: the hosted implementation of this skill was removed in the paywall cleanup."""
    return {
        "final_state": "completed",
        "message": 'Not yet implemented: pass-windows — its hosted implementation was removed.',
        "artifact": {"removed": True},
        "watch": None,
    }


class CelesTrakAgent(SkillAgent):
    name = "celestrak-satellites"
    card_name = "CelesTrak Satellites Agent"
    card_description = (
        "Read-only agent over CelesTrak's element sets and space catalogue: the published TLE and "
        "derived orbital elements for a satellite or a group, what is above a point right now with "
        "elevation and azimuth, upcoming passes of one satellite or a whole group, the catalogue "
        "record for an object, and a premium skill that turns a multi-day range into observation "
        "windows you could actually use. Every time it reports is propagated from the element set "
        "and carries that element set's age."
    )
    env_prefix = "SATELLITES"
    datasets = (DATASET, SATCAT_DATASET)
    card_skills = CARD_SKILLS

    def __init__(self, client: CelesTrakClient | None = None,
                 gateway: object | None = None) -> None:
        self.client = client or CelesTrakClient()
        self.gateway = gateway

    def parse(self, message: dict) -> dict:
        return parse(message)

    def missing(self, skill: str, params: dict) -> list[str]:
        if skill in (SKILL_OVERHEAD, SKILL_PASSES, SKILL_PASS_WINDOWS):
            return [] if params.get("point") else ["point"]
        if skill in (SKILL_ORBIT_ELEMENTS, SKILL_CATALOG, SKILL_PASSES):
            return [] if any(params.get(key) for key in ("catnr", "name", "group")) else ["satellite"]
        return []

    def input_prompt(self, skill: str, missing: list[str]) -> str:
        if "point" in missing:
            return _missing_point()["message"]
        return (
            "Which satellite? Give me a catalogue number (25544 for the ISS), a name such as "
            f"ISS (ZARYA), or a group to list: {', '.join(GROUPS[:8])} and others."
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
            if skill == SKILL_PASS_WINDOWS:
                return run_pass_windows(params, self.client, self.gateway)
            if skill == SKILL_ORBIT_ELEMENTS:
                return run_orbit_elements(params, self.client)
            if skill == SKILL_OVERHEAD:
                return run_overhead(params, self.client)
            if skill == SKILL_PASSES:
                return run_passes(params, self.client)
            if skill == SKILL_CATALOG:
                return run_catalog(params, self.client)
        except UpstreamError as exc:
            return {
                "final_state": "failed",
                "message": f"CelesTrak could not be read: {exc}",
                "artifact": {"dataset": DATASET},
                "watch": None,
            }
        return {"final_state": "completed", "message": HELP, "artifact": None, "watch": None}


__all__ = [
    "CARD_SKILLS",
    "CelesTrakAgent",
    "DEFAULT_MIN_ELEVATION",
    "DEFAULT_PASS_DAYS",
    "GATEWAY_TOOL",
    "HELP",
    "MAX_GROUP_SATELLITES",
    "MAX_LISTED",
    "SKILL_CATALOG",
    "SKILL_ORBIT_ELEMENTS",
    "SKILL_OVERHEAD",
    "SKILL_PASSES",
    "SKILL_PASS_WINDOWS",
    "UpstreamError",
    "message_data",
    "message_text",
    "parse",
    "run_catalog",
    "run_orbit_elements",
    "run_overhead",
    "run_pass_windows",
    "run_passes",
    "satellite_name_from_text",
]
