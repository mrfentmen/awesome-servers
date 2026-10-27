"""The stargazing agent: four skills over 7Timer's astronomical forecast.

  - sky-tonight:      the coming hours at one place, with a verdict
  - sky-forecast:     the whole 72-hour run, slot by slot
  - sky-compare:      two places side by side for the coming night
  - sky-best-window:  the ranked usable windows over three days (not implemented here)

Premium: `sky-best-window` scores every 3-hour slot and ranks the contiguous
runs worth going out for. That is the whole run walked and ordered, which is the
work the gateway does behind its licence check. The free skills print the
published indices slot by slot and pick the single clearest one, which is a
bounded read of the same feed.

What this server refuses to imply. **The three indices all run bigger-is-better**
- cloud cover is 1 (fully covered) to 9 (no cloud at all), so a low cloud number
is a bad night and not a clear one - so every value is printed with its word.
**A window is a run of good sky, not a run of darkness.** 7Timer's astronomical
product publishes no daylight flag, and **no moon data at all**, so nothing here
claims to know the phase: for faint targets the Moon matters more than any of
these indices, and saying so beats guessing.
"""

from __future__ import annotations

import re

from a2a_kit import SkillAgent

from data import (
    DATASET,
    HORIZON_HOURS,
    PLACES,
    PRODUCT,
    SLOT_HOURS,
    StargazingClient,
    UpstreamError,
    coordinates_from_text,
    place_from_text,
)

SKILL_TONIGHT = "sky-tonight"
SKILL_FORECAST = "sky-forecast"
SKILL_COMPARE = "sky-compare"
SKILL_BEST = "sky-best-window"

#: The gateway tool that does the premium work. Same name here and on the gateway.
GATEWAY_TOOL = "a2a_stargazing_best_window"

SOURCE = "7Timer astronomical forecast, www.7timer.info"

_HOURS_RE = re.compile(r"\b(\d{1,3})\s*(?:h|hours?|hrs?)\b", re.IGNORECASE)
_DAYS_RE = re.compile(r"\b(\d{1,2})\s*(?:d|days?|nights?)\b", re.IGNORECASE)
_THREE_DAY_RE = re.compile(r"\b(three|3)[- ]?(?:day|night)|72\s*hour|\bweekend\b", re.IGNORECASE)
_COMPARE_RE = re.compile(r"\b(compare|versus|vs\.?|both|or\b.*\bbetter|better.*\bor\b)\b",
                         re.IGNORECASE)
_BEST_RE = re.compile(
    r"\b(best|optimal|ideal|clearest|rank|ranking|ranked|which (?:hour|time|slot|night|day|"
    r"evening)|when (?:should|is|would|will)|what time|what night|best window|window)\b",
    re.IGNORECASE,
)
_FORECAST_RE = re.compile(r"\b(forecast|outlook|next few days|72|three days|3 days|week)\b",
                          re.IGNORECASE)
_SKY_RE = re.compile(
    r"\b(stargazing|stargaze|stargazer|stars?|astronom\w*|sky|skies|observe|observing|"
    r"observation|night|tonight|cloud\w*|seeing|transparency|haze|moonlight|constellation|"
    r"milky way|meteor\w*|aurora|telescope)\b",
    re.IGNORECASE,
)


def places_from_text(text: str) -> list[str]:
    """Every place named in the sentence, in the order they appear.

    Sorted longest-name-first at each position, so "mexico city" is not read as
    "mexico" and "san francisco" is not read as "francisco".
    """
    lowered = str(text or "").lower()
    found: list[tuple[int, str]] = []
    for name in PLACES:
        for match in re.finditer(rf"\b{re.escape(name)}\b", lowered):
            found.append((match.start(), name))
    found.sort()
    ordered: list[str] = []
    for _, name in found:
        if name not in ordered:
            ordered.append(name)
    return ordered


def hours_from_text(text: str, default: int = 12) -> int:
    """How far ahead the question looks, in hours."""
    match = _HOURS_RE.search(str(text or ""))
    if match:
        return max(3, min(int(match.group(1)), HORIZON_HOURS))
    if _THREE_DAY_RE.search(str(text or "")):
        return HORIZON_HOURS
    match = _DAYS_RE.search(str(text or ""))
    if match:
        return max(3, min(int(match.group(1)) * 24, HORIZON_HOURS))
    return default


def parse(message: dict) -> dict:
    """Incoming message -> {skill, params, explicit}. Never raises."""
    text = message_text(message)
    data = message_data(message)
    requested = _first(data, "skill", "skill_id")

    places = places_from_text(text)
    named = _first(data, "place", "location", "places")
    if named:
        places = [str(named).lower()] if isinstance(named, str) else [str(p).lower() for p in named]
    place = places[0] if places else None

    latitude = _first(data, "lat", "latitude")
    longitude = _first(data, "lon", "longitude")
    if latitude is None or longitude is None:
        coords = coordinates_from_text(text)
        if coords:
            latitude, longitude = coords
    if latitude is None and place:
        latitude, longitude = PLACES[place][0], PLACES[place][1]

    if requested in (SKILL_TONIGHT, SKILL_FORECAST, SKILL_COMPARE, SKILL_BEST):
        skill = requested
    elif _BEST_RE.search(text):
        skill = SKILL_BEST
    elif _COMPARE_RE.search(text) and len(places) >= 2:
        skill = SKILL_COMPARE
    elif _FORECAST_RE.search(text):
        skill = SKILL_FORECAST
    else:
        skill = SKILL_TONIGHT

    # The default horizon depends on the skill, so it is resolved after the
    # skill is: the ranked-window skill always reads the whole published run, so
    # an unstated horizon there is the full 72 hours and not tonight's 12.
    hours = _first(data, "hours")
    if hours is None:
        hours = hours_from_text(text, HORIZON_HOURS if skill == SKILL_BEST else 12)

    params: dict = {"hours": hours, "label": PLACES[place][2] if place else None,
                    "places": places}
    if latitude is not None:
        params["latitude"] = latitude
        params["longitude"] = longitude
    if skill == SKILL_COMPARE and len(places) >= 2:
        params["places"] = places[:2]
        params["latitude"] = PLACES[places[0]][0]
        params["longitude"] = PLACES[places[0]][1]
        params["latitude_b"] = PLACES[places[1]][0]
        params["longitude_b"] = PLACES[places[1]][1]
        params["label_b"] = PLACES[places[1]][2]
    if not requested and (not text.strip()
                          or re.search(r"\b(help|what can you do|commands?)\b", text, re.IGNORECASE)):
        skill, params = "help", {}
    explicit = bool(requested or _BEST_RE.search(text) or _FORECAST_RE.search(text)
                    or _COMPARE_RE.search(text) or _SKY_RE.search(text) or place)
    return {"skill": skill, "params": params, "explicit": explicit}


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


HELP = (
    "I read 7Timer's astronomical forecast (keyless, 72 hours of 3-hour slots). Ask me:\n"
    "  • is tonight good for stargazing in New York?\n"
    "  • stargazing at 51.5N, 0.1W\n"
    "  • what is the cloud cover in Chicago tonight?\n"
    "  • compare stargazing in New York and Los Angeles tonight\n"
    "  • when is the best time to stargaze in New York?\n"
    "All three indices run the same way: bigger is better. Cloud cover is 1 (fully "
    "covered) to 9 (no cloud at all), so a 1 is the worst night and not the best. "
    "This product carries no daylight flag and no moon phase, and for faint targets the "
    "moon matters more than any of these, so I do not guess at either. The ranked windows "
    "over three days are a premium skill."
)

CARD_SKILLS = [
    {
        "id": SKILL_TONIGHT,
        "name": "Is tonight any good",
        "description": (
            "The coming hours at a place, slot by slot, with cloudy/seeing/transparency printed "
            "against the published scale word for each value and the clearest slot of the window "
            "named. All three indices run bigger-is-better, and the answer says so, because a low "
            "cloud number is a bad night and not a clear one."
        ),
        "tags": ["stargazing", "astronomy", "weather", "tonight", "cloud"],
        "examples": [
            "is tonight good for stargazing in New York?",
            "what is the cloud cover in Chicago tonight?",
            '{"skill": "sky-tonight", "latitude": 40.7128, "longitude": -74.006, "hours": 12}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_FORECAST,
        "name": "Three-day sky forecast",
        "description": (
            "The whole published run for a place: 24 slots of 3 hours, so 72 hours, oldest first, "
            "with each slot's cloud cover, seeing, transparency, wind and precipitation. The "
            "product's name suggests 48 hours and the run is 72, which the answer states."
        ),
        "tags": ["stargazing", "astronomy", "forecast", "72 hours", "slots"],
        "examples": [
            "three day stargazing forecast for London",
            "the next 72 hours of sky over Denver",
            '{"skill": "sky-forecast", "latitude": 51.5074, "longitude": -0.1278}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_COMPARE,
        "name": "Compare two places",
        "description": (
            "Two named places side by side for the coming hours, with each one's best slot and a "
            "plain statement of which is clearer, decided on cloud cover first because that is "
            "the index that blocks everything else."
        ),
        "tags": ["stargazing", "astronomy", "compare", "two places"],
        "examples": [
            "compare stargazing in New York and Los Angeles tonight",
            "is London or Edinburgh better for stargazing tonight?",
            '{"skill": "sky-compare", "places": ["new york", "los angeles"], "hours": 12}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_BEST,
        "name": "Best observing window",
        "description": (
            "The whole 72-hour run scored slot by slot and grouped into contiguous runs, so the "
            "answer is a ranked list of the windows with the steadiest sky rather than one lucky "
            "hour. Wet slots are dropped and a slot with an unpublished index scores nothing "
            "rather than zero. Premium: the scoring and ranking run on a hosted service that was removed on the "
            "gateway. A window is a run of good sky, not of darkness, and the moon is in none of "
            "these indices."
        ),
        "tags": ["stargazing", "astronomy", "windows", "ranking",],
        "examples": [
            "when is the best time to stargaze in New York?",
            "what is the optimal night for stargazing in Berlin?",
            '{"skill": "sky-best-window", "latitude": 40.7128, "longitude": -74.006}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
]

_MOON_NOTE = (
    "7Timer's astronomical product publishes no moon data, and for faint targets the moon "
    "matters more than any of these indices, so nothing here claims to know the phase."
)
_DAYLIGHT_NOTE = (
    "No slot says whether the Sun is up: this product publishes no daylight flag, so read the "
    "sky conditions and take the part that falls after dark."
)


def _artifact(client: StargazingClient, **extra) -> dict:
    artifact = {
        "dataset": DATASET,
        "product": PRODUCT,
        "source": SOURCE,
        "freshness": client.freshness(),
    }
    artifact.update(extra)
    return artifact


def _slot_line(slot: dict) -> str:
    """One slot, with every index printed against its own published word."""
    moment = slot.get("utc") or f"+{slot.get('timepoint')}h"
    return (
        f"  • {moment} — cloud {slot.get('cloudcover')} ({slot.get('cloud_word')}), "
        f"seeing {slot.get('seeing')} ({slot.get('seeing_word')}), "
        f"transparency {slot.get('transparency')} ({slot.get('transparency_word')}), "
        f"wind {slot.get('wind_speed')} from {slot.get('wind_direction') or 'no direction'}, "
        f"{slot.get('precipitation')}"
    )


def _clearest(slots: list[dict]) -> dict | None:
    """The slot with the clearest sky, cloud cover first.

    Cloud dominates because it is the index that blocks everything else; seeing
    breaks a tie, then transparency. A slot with an unpublished cloud cover is
    never chosen, because "not reported" is not "clear".
    """
    usable = [slot for slot in slots if isinstance(slot.get("cloudcover"), int)]
    if not usable:
        return None
    return max(usable, key=lambda slot: (
        slot.get("cloudcover") or 0,
        slot.get("seeing") or 0,
        slot.get("transparency") or 0,
    ))


def _need_place(params: dict) -> dict | None:
    if params.get("latitude") is not None and params.get("longitude") is not None:
        return None
    return {
        "final_state": "input-required",
        "message": (
            "Which place? Give me a city from my list (New York, London, Berlin, Tokyo, Sydney "
            "and others) or a latitude/longitude pair like 40.71,-74.01."
        ),
        "artifact": None,
        "watch": None,
    }


def run_tonight(params: dict, client: StargazingClient) -> dict:
    missing = _need_place(params)
    if missing:
        return missing
    try:
        run = client.upcoming(params["latitude"], params["longitude"], params.get("hours", 12))
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc),
                "artifact": None, "watch": None}
    label = params.get("label") or f"{run['latitude']}, {run['longitude']}"
    best = _clearest(run["slots"])
    artifact = _artifact(client, label=label, latitude=run["latitude"],
                         longitude=run["longitude"], hours=run["window_hours"],
                         init=run["init"], slots=run["slots"], count=run["count"],
                         best_slot=best, covers_moon=False, covers_daylight=False)
    lines = [f"7Timer's astronomical forecast for {label}, the next {run['window_hours']} hour(s):"]
    for slot in run["slots"]:
        lines.append(_slot_line(slot))
    if best:
        lines.append(
            f"\nThe clearest slot in that window is {best['utc']} — cloud {best['cloudcover']} "
            f"({best['cloud_word']}), seeing {best['seeing']}, transparency {best['transparency']}."
        )
    else:
        lines.append("\nNo slot in the window published a cloud cover, so I have nothing to rank.")
    lines.append(
        "\nBigger is better on all three indices: a cloud cover of 1 is weather to stay in and "
        f"9 is no cloud at all. Source: {DATASET} (read live). {_MOON_NOTE} {_DAYLIGHT_NOTE}"
    )
    return {"final_state": "completed", "message": "\n".join(lines),
            "artifact": artifact, "watch": None}


def run_forecast(params: dict, client: StargazingClient) -> dict:
    missing = _need_place(params)
    if missing:
        return missing
    try:
        run = client.forecast(params["latitude"], params["longitude"])
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc),
                "artifact": None, "watch": None}
    label = params.get("label") or f"{run['latitude']}, {run['longitude']}"
    artifact = _artifact(client, label=label, latitude=run["latitude"],
                         longitude=run["longitude"], init=run["init"],
                         slot_hours=run["slot_hours"], horizon_hours=run["horizon_hours"],
                         slots=run["slots"], count=run["count"],
                         covers_moon=False, covers_daylight=False)
    lines = [
        f"7Timer's astronomical forecast for {label}: {run['count']} slots of "
        f"{run['slot_hours']} hours, so {run['horizon_hours']} hours (the product's name suggests "
        "48; the run really is 72).",
    ]
    for slot in run["slots"]:
        lines.append(_slot_line(slot))
    lines.append(
        f"\nBigger is better on all three indices. Source: {DATASET} (read live). "
        f"{_MOON_NOTE} {_DAYLIGHT_NOTE}"
    )
    return {"final_state": "completed", "message": "\n".join(lines),
            "artifact": artifact, "watch": None}


def run_compare(params: dict, client: StargazingClient) -> dict:
    places = params.get("places") or []
    if len(places) < 2 or params.get("latitude_b") is None:
        return {
            "final_state": "input-required",
            "message": (
                "Name two places to compare, and I will put their coming hours side by side - "
                "for example \"compare New York and Los Angeles\"."
            ),
            "artifact": None,
            "watch": None,
        }
    hours = params.get("hours", 12)
    try:
        left = client.upcoming(params["latitude"], params["longitude"], hours)
        right = client.upcoming(params["latitude_b"], params["longitude_b"], hours)
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc),
                "artifact": None, "watch": None}
    label_a = params.get("label") or places[0]
    label_b = params.get("label_b") or places[1]
    best_a, best_b = _clearest(left["slots"]), _clearest(right["slots"])
    artifact = _artifact(client, hours=hours, compared=[
        {"label": label_a, "latitude": left["latitude"], "longitude": left["longitude"],
         "best_slot": best_a, "slots": left["slots"]},
        {"label": label_b, "latitude": right["latitude"], "longitude": right["longitude"],
         "best_slot": best_b, "slots": right["slots"]},
    ], covers_moon=False, covers_daylight=False)

    lines = [f"The next {hours} hour(s), side by side:"]
    for label, run, best in ((label_a, left, best_a), (label_b, right, best_b)):
        lines.append(f"\n{label}:")
        for slot in run["slots"]:
            lines.append(_slot_line(slot))
        if best:
            lines.append(f"  clearest: {best['utc']}, cloud {best['cloudcover']} "
                         f"({best['cloud_word']})")
    if best_a and best_b:
        if best_a["cloudcover"] > best_b["cloudcover"]:
            verdict = f"{label_a} is clearer at its best slot."
        elif best_b["cloudcover"] > best_a["cloudcover"]:
            verdict = f"{label_b} is clearer at its best slot."
        else:
            verdict = ("They tie on cloud cover at their best slot, so the tie is decided on "
                       "seeing and transparency.")
        lines.append(f"\n{verdict} Cloud cover is compared first because it is the index that "
                     "blocks everything else, and a lower number is cloudier.")
    lines.append(
        f"\nSource: {DATASET} (read live). {_MOON_NOTE} {_DAYLIGHT_NOTE}"
    )
    return {"final_state": "completed", "message": "\n".join(lines),
            "artifact": artifact, "watch": None}


def run_best_window(params: dict, client: StargazingClient, gateway: object) -> dict:
    """Stub: the hosted implementation of this skill was removed in the paywall cleanup."""
    return {
        "final_state": "completed",
        "message": 'Not yet implemented: best-window — its hosted implementation was removed.',
        "artifact": {"removed": True},
        "watch": None,
    }


class StargazingAgent(SkillAgent):
    name = "seven-timer-stargazing"
    card_name = "7Timer Stargazing Agent"
    card_description = (
        "Read-only agent over 7Timer's astronomical forecast: whether the coming hours over a "
        "place are worth going out for, the whole 72-hour run slot by slot, two places compared, "
        "and a premium skill that scores every slot and ranks the contiguous windows with the "
        "steadiest sky. All three indices run bigger-is-better and each value is printed with its "
        "published scale word; the product carries no daylight flag and no moon phase, and the "
        "answers say so rather than guessing at either."
    )
    env_prefix = "STARGAZING"
    datasets = (DATASET,)
    card_skills = CARD_SKILLS

    def __init__(self, client: StargazingClient | None = None,
                 gateway: object | None = None) -> None:
        self.client = client or StargazingClient()
        self.gateway = gateway

    def parse(self, message: dict) -> dict:
        return parse(message)

    def missing(self, skill: str, params: dict) -> list[str]:
        if skill == SKILL_COMPARE and not params.get("latitude_b"):
            return ["places"]
        # A point is only usable with both halves, so ask for the place rather
        # than letting a half-specified one reach `_need_place`.
        if skill in (SKILL_TONIGHT, SKILL_FORECAST, SKILL_BEST) \
                and (params.get("latitude") is None or params.get("longitude") is None):
            return ["place"]
        return []

    def input_prompt(self, skill: str, missing: list[str]) -> str:
        if "places" in missing:
            return ("Name two places to compare, and I will put their coming hours side by side - "
                    "for example \"compare New York and Los Angeles\".")
        return ("Which place? Give me a city from my list (New York, London, Berlin, Tokyo, Sydney "
                "and others) or a latitude/longitude pair like 40.71,-74.01.")

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
            if skill == SKILL_BEST:
                return run_best_window(params, self.client, self.gateway)
            if skill == SKILL_TONIGHT:
                return run_tonight(params, self.client)
            if skill == SKILL_FORECAST:
                return run_forecast(params, self.client)
            if skill == SKILL_COMPARE:
                return run_compare(params, self.client)
        except UpstreamError as exc:
            return {
                "final_state": "failed",
                "message": f"7Timer could not be read: {exc}",
                "artifact": {"dataset": DATASET},
                "watch": None,
            }
        return {"final_state": "completed", "message": HELP, "artifact": None, "watch": None}


__all__ = [
    "CARD_SKILLS",
    "GATEWAY_TOOL",
    "HELP",
    "SKILL_BEST",
    "SKILL_COMPARE",
    "SKILL_FORECAST",
    "SKILL_TONIGHT",
    "StargazingAgent",
    "UpstreamError",
    "hours_from_text",
    "message_data",
    "message_text",
    "parse",
    "places_from_text",
    "run_best_window",
    "run_compare",
    "run_forecast",
    "run_tonight",
]
