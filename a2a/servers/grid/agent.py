"""The grid agent: four free skills over the GB carbon intensity API, one behind the gate.

  - grid-now:      the current half-hour's national carbon intensity
  - grid-forecast: the national forecast 48 hours forward, half-hour by half-hour
  - grid-regional: every GB distribution region for the current half-hour, or one
  - grid-mix:      the national generation mix for the current half-hour
  - clean-windows: the low-carbon windows in that forecast, worked out (premium)

Two things this agent is careful about. The band ("very low" to "very high") is NESO's
own on every record and is never derived here: on a forecast record NESO widens the
band for the forecast's uncertainty, so the same number can carry two different bands.
And `/regional` only ever holds the current half-hour, so there is no regional history
to offer and the card says so.

The premium skill sends the request to the licence gateway, which reads the same
forecast behind the gate and works out the windows, so an unlicensed caller gets the
gateway's wording and no windows.
"""

from __future__ import annotations

import re

from a2a_kit import GatewayClient, SkillAgent, empty_premium_answer, premium_call

from data import (
    DATASET,
    INTENSITY_BANDS,
    MAX_LISTED_SLOTS,
    PRODUCT,
    REGION_COUNT,
    SOURCE,
    GridClient,
    UpstreamError,
)

SKILL_GRID_NOW = "grid-now"
SKILL_GRID_FORECAST = "grid-forecast"
SKILL_GRID_REGIONAL = "grid-regional"
SKILL_GRID_MIX = "grid-mix"
SKILL_CLEAN_WINDOWS = "clean-windows"

MAX_LISTED = 12
DEFAULT_FORECAST_HOURS = 24

CARD_SKILLS = [
    {
        "id": SKILL_GRID_NOW,
        "name": "Carbon intensity right now",
        "description": (
            "Great Britain's carbon intensity for the half-hour in progress, in gCO2/kWh: the forecast "
            "for it, what has actually been measured, how far into the half-hour we are, and NESO's own "
            "band for it."
        ),
        "tags": ["grid", "carbon", "intensity", "uk", "energy", "neso"],
        "examples": [
            "how dirty is the grid right now?",
            "what is the carbon intensity at the moment?",
            '{"skill": "grid-now"}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_GRID_FORECAST,
        "name": "Intensity forecast",
        "description": (
            "The national forecast half-hour by half-hour, 1 to 48 hours ahead, with each slot's "
            "gCO2/kWh, NESO's own band, and the cleanest and dirtiest points in the window you asked for."
        ),
        "tags": ["grid", "carbon", "forecast", "uk", "energy", "neso"],
        "examples": [
            "what's the carbon intensity forecast for the next 12 hours?",
            "grid forecast for 24 hours",
            '{"skill": "grid-forecast", "hours": 12, "series": "forecast"}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_GRID_REGIONAL,
        "name": "Regional carbon intensity",
        "description": (
            "Carbon intensity for every Great Britain distribution region — the 18 NESO publishes, from "
            "the Scottish Highlands to South Wales — for the current half-hour, each with its own "
            "generation mix. Or one region, or the region a British postcode falls in. This API only "
            "publishes the current half-hour, so there is no regional history to read."
        ),
        "tags": ["grid", "carbon", "regional", "uk", "neso", "postcode"],
        "examples": [
            "where is the grid dirtiest?",
            "carbon intensity in the North West",
            "which region is SW1A in?",
            '{"skill": "grid-regional", "postcode": "SW1A 1AA"}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_GRID_MIX,
        "name": "Generation mix",
        "description": (
            "What Great Britain is generating right now, as a share by fuel: wind, gas, nuclear, solar, "
            "biomass, imports and the rest, biggest share first, for the current half-hour."
        ),
        "tags": ["grid", "generation", "mix", "uk", "energy", "renewables"],
        "examples": [
            "what is the UK generating right now?",
            "generation mix",
            '{"skill": "grid-mix"}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_CLEAN_WINDOWS,
        "name": "Low-carbon windows",
        "description": (
            "The 48-hour forecast read as low-carbon windows rather than as a list: the contiguous runs "
            "at or below a gCO2/kWh threshold, when each starts and ends, how long each lasts, the "
            "cleanest stretch, the dirtiest, and what share of the window is clean enough. Premium: it "
            "runs behind a licence check."
        ),
        "tags": ["grid", "carbon", "windows", "scheduling", "uk", "premium"],
        "examples": [
            "when is the grid cleanest over the next two days?",
            "give me the low-carbon windows above 100 gCO2/kWh",
            '{"skill": "clean-windows", "threshold": 100, "hours": 24}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
]

_HOURS_RE = re.compile(r"\b(?:next|past|last|previous)?\s*(\d{1,2})\s*(?:h|hr|hrs|hour|hours)\b", re.IGNORECASE)
_THRESHOLD_RE = re.compile(r"\b(\d{2,4}(?:\.\d+)?)\s*(?:gco2|grams?|g)\b", re.IGNORECASE)
_AT_OR_BELOW_RE = re.compile(r"\b(?:at or below|below|under|cleaner than|cleaner than|cleaner than)\b", re.IGNORECASE)
_LIMIT_RE = re.compile(
    r"\b(?:top\s+|first\s+|how many\s+)(\d{1,2})\b(?=\s+(?:regions?|slots?|hours?|half[- ]hours?))",
    re.IGNORECASE)
_DAYS_RE = re.compile(r"\b(\d{1,2})\s*days?\b", re.IGNORECASE)
#: "over the past 6 hours" is a question about what was measured, not what is forecast.
_PAST_WORDS = re.compile(
    r"\b(?:past|last|previous|earlier|yesterday|was|were|actually|measured|actuals?|history|historical)\b",
    re.IGNORECASE)
#: A British postcode is an outward code plus an inward code, and the inward code is
#: always a digit and two letters, so it is matched on that shape rather than any two.
_POSTCODE_RE = re.compile(r"\b([A-Z]{1,2}\d[A-Z\d]?)(?:\s*(\d[A-Z]{2}))?\b")
_REGION_AFTER = re.compile(
    r"\b(?:in|for|around|near)\s+(?:the\s+)?([A-Z][A-Za-z ]{2,30}?)(?=\s*(?:,|\?|$))")
_POSTCODE_QUESTION = re.compile(r"\b(?:which|what)\s+region\b|\bregion is\b|\bregion does\b|\bwhich grid region\b", re.IGNORECASE)
_REGION_QUESTION = re.compile(
    r"\b(?:which|what)\s+regions?\b|\bregions?\b.*\b(?:dirtiest|cleanest|highest|lowest|worst|best)\b|"
    r"\bregions?\s+(?:is|are)\b|\bwhere is the grid\b|\bper region\b",
    re.IGNORECASE,
)
_CLEANEST_WORDS = re.compile(r"\b(?:cleanest|lowest|greenest|best)\b", re.IGNORECASE)
_DIRTIEST_WORDS = re.compile(r"\b(?:dirtiest|highest|worst|coal-heaviest|most carbon)\b", re.IGNORECASE)
_MIX_WORDS = re.compile(
    r"\b(?:generation mix|generating|generation|what.*generat\w+|made up of|powered by|"
    r"renewables?\b.*\bnow\b|mix of fuels)\b",
    re.IGNORECASE,
)
_NOW_WORDS = re.compile(
    r"\b(?:right now|at the moment|at the moment|just now|currently|now|today|"
    r"how dirty|how clean|how much carbon)\b",
    re.IGNORECASE,
)
_FORECAST_WORDS = re.compile(
    r"\b(?:forecast|outlook|next|coming|over the|ahead|expect\w*|going to be|"
    r"the next \d+ hours?)\b",
    re.IGNORECASE,
)
#: A load or job that wants to be scheduled. This is what separates the premium skill
#: from the raw forecast: the forecast says when it will be, the windows say when to run.
_WINDOW_WORDS = re.compile(
    r"\b(?:windows?|when (?:can|should|could) i|when to (?:run|start|switch)|"
    r"when is the grid cleanest|when is it cleanest|when is the grid dirtiest|"
    r"best time|good time|run (?:my|this|these|the) (?:job|task|work|load|batch)|schedule\w*|"
    r"shift (?:my|this|it|the)|avoid (?:the )?(?:high|dirtiest)|plan (?:my|this) run|"
    r"clean (?:enough|window|period|stretch|hours?)|low[- ]carbon (?:window|period|hours?|slot))\b",
    re.IGNORECASE,
)

HELP = (
    "I read National Grid ESO's carbon intensity API for Great Britain: the current half-hour, the "
    "48-hour forecast, all 18 distribution regions, and the national generation mix. Ask me:\n"
    "  • how dirty is the grid right now?\n"
    "  • what's the carbon intensity forecast for the next 12 hours?\n"
    "  • where is the grid dirtiest?\n"
    "  • which region is SW1A in?\n"
    "  • what is the UK generating right now?\n"
    "  • when is the grid cleanest over the next two days? (premium)\n"
    "Intensity is gCO2 per kWh and the band is NESO's own on every record. This API only publishes "
    "the current half-hour for regions, so I cannot give you a regional history."
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


def postcode_from_text(text: str) -> str | None:
    """A British postcode or outward code in running text, or None."""
    upper = text.upper()
    for match in _POSTCODE_RE.finditer(upper):
        outward, inward = match.group(1), match.group(2)
        if outward in ("THE", "A", "I", "IS", "IN", "OF", "AND", "GB", "UK"):
            continue
        if not re.match(r"^[A-Z]{1,2}\d[A-Z\d]?$", outward):
            continue
        if inward and re.match(r"^\d[A-Z]{2}$", inward):
            return f"{outward} {inward}"
        # A bare outward code needs a postcode word beside it, or it is an initialism.
        around = upper[max(0, match.start() - 24):match.end() + 24]
        if re.search(r"\bpostcode|\bpostal|\bzip|grid region|which region", around, re.IGNORECASE):
            return outward
    return None


def parse(message: dict) -> dict:
    """Incoming message -> {skill, params, explicit}. Never raises."""
    text = message_text(message)
    data = message_data(message)
    requested = _first(data, "skill", "skill_id")

    hours = _first(data, "hours")
    if hours is None:
        match = _HOURS_RE.search(text)
        if match:
            hours = match.group(1)
    if hours is None:
        # "over the next two days" is this API's 48-hour horizon, or its 24-hour one.
        match = _DAYS_RE.search(text)
        if match:
            hours = {"1": 24, "2": 48}.get(match.group(1))
        else:
            spelled = {"one": 24, "two": 48, "three": 48}.get(
                (re.search(r"\b(one|two|three)\s+days?\b", text, re.IGNORECASE) or [None, None])[1]
                and (re.search(r"\b(one|two|three)\s+days?\b", text, re.IGNORECASE).group(1).lower()))
            hours = spelled
    threshold = _first(data, "threshold", "gco2")
    if threshold is None:
        match = _THRESHOLD_RE.search(text)
        if match:
            threshold = match.group(1)
    series = _first(data, "series")
    limit = _first(data, "limit")
    if limit is None:
        match = _LIMIT_RE.search(text)
        if match:
            limit = match.group(1)
    postcode = _first(data, "postcode", "outward_code", "outward")
    if postcode is None:
        postcode = postcode_from_text(text)
    region_name = _first(data, "region", "region_name")
    if region_name is None:
        match = _REGION_AFTER.search(text)
        if match:
            candidate = match.group(1).strip(" ,")
            # A region name is a capitalised phrase; "in the next 12 hours" is not.
            if candidate and re.match(r"^[A-Z][A-Za-z'\-]*(?:\s+[A-Za-z'\-]+){0,3}$", candidate):
                region_name = candidate

    asked_for_region = (bool(_REGION_QUESTION.search(text)) or bool(_POSTCODE_QUESTION.search(text))
                        or bool(postcode) or bool(region_name))
    # The window wording is specific enough on its own, and a window question is the
    # only one that turns a "when can I run this" into an answer at all.
    asked_for_windows = bool(_WINDOW_WORDS.search(text)) and not asked_for_region
    asked_for_mix = bool(_MIX_WORDS.search(text))
    asked_for_now = bool(_NOW_WORDS.search(text))
    asked_for_forecast = bool(_FORECAST_WORDS.search(text))

    if requested in (SKILL_GRID_NOW, SKILL_GRID_FORECAST, SKILL_GRID_REGIONAL,
                     SKILL_GRID_MIX, SKILL_CLEAN_WINDOWS):
        skill = requested
    elif asked_for_windows:
        skill = SKILL_CLEAN_WINDOWS
    elif asked_for_mix:
        # A question that names generation is asking about the mix even when it also
        # says "right now": that is when the mix is published, not a limit on the skill.
        skill = SKILL_GRID_MIX
    elif asked_for_region:
        skill = SKILL_GRID_REGIONAL
    elif asked_for_now and not asked_for_forecast:
        skill = SKILL_GRID_NOW
    elif asked_for_forecast:
        skill = SKILL_GRID_FORECAST
    else:
        skill = SKILL_GRID_NOW

    params: dict = {}
    for key, value in (("hours", hours), ("threshold", threshold), ("series", series),
                       ("limit", limit), ("postcode", postcode), ("region", region_name)):
        if value is not None:
            params[key] = value
    if skill == SKILL_GRID_FORECAST:
        params.setdefault("hours", DEFAULT_FORECAST_HOURS)
        # The feed publishes actuals behind the present and a forecast ahead of it, so a
        # question about the past asks for the measured series rather than the forecast.
        params.setdefault("series", "actual" if _PAST_WORDS.search(text) else "forecast")
    if skill == SKILL_CLEAN_WINDOWS:
        params.setdefault("hours", 48)
        params.setdefault("series", "forecast")
    if skill == SKILL_GRID_REGIONAL:
        params.setdefault("limit", MAX_LISTED)
    if not requested and (not text.strip() or re.search(r"\b(help|what can you do|commands?)\b", text, re.IGNORECASE)):
        skill, params = "help", {}
    explicit = bool(requested or asked_for_windows or asked_for_mix or asked_for_region
                    or asked_for_now or asked_for_forecast)
    return {"skill": skill, "params": params, "explicit": explicit}


# -- shared shape ---------------------------------------------------------


def _artifact(params: dict, client: GridClient, **extra) -> dict:
    artifact = {
        "dataset": DATASET,
        "product": PRODUCT,
        "source": SOURCE,
        "freshness": client.freshness(),
    }
    artifact.update(extra)
    return artifact


def _missing(skill: str) -> dict:
    if skill == SKILL_GRID_REGIONAL:
        message = (
            "Which region? Name one — the North West, South Wales, London — or give a British postcode "
            "such as SW1A 1AA, and I will read that region's intensity and generation mix."
        )
    else:
        message = (
            "Tell me how far ahead to look: “the next 12 hours”, or “the next 48 hours”. NESO publishes "
            "a 48-hour forecast and nothing longer."
        )
    return {"final_state": "input-required", "message": message, "artifact": None, "watch": None}


def _slot_line(slot: dict) -> str:
    return (f"  • {slot.get('from')}  {slot.get('value')} gCO2/kWh  {slot.get('band')}"
            + (f" (measured {slot['actual']})" if slot.get("actual") is not None else ""))


def _mix_lines(mix: list[dict], limit: int = 6) -> str:
    return ", ".join(f"{entry['fuel']} {entry['percent']:g}%" for entry in mix[:limit])


# -- skills ---------------------------------------------------------------


def run_grid_now(params: dict, client: GridClient) -> dict:
    slot = client.now()
    artifact = _artifact(params, client, slot=slot)
    if slot is None:
        return {
            "final_state": "completed",
            "message": (
                f"The Carbon Intensity API published no half-hour for right now. It is published every "
                f"half-hour; try again in a few minutes. (Read live from {DATASET}.)"
            ),
            "artifact": artifact,
            "watch": None,
        }
    measured = (f" What has actually been measured for this half-hour is {slot['actual']} gCO2/kWh."
                if slot.get("actual") is not None else
                " This half-hour is still in progress, so no actual has been measured yet.")
    into = (f" {slot['minutes_in']} minutes into it." if slot.get("minutes_in") is not None else "")
    return {
        "final_state": "completed",
        "message": (
            f"Great Britain, {slot['from']} to {slot['to']}: {slot['forecast']} gCO2/kWh forecast, "
            f"band {slot['band']}.{into}{measured}\n"
            f"Bands run very low, low, moderate, high, very high, and this is NESO's own label for "
            f"this half-hour. Source: {DATASET} (read live)."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_grid_forecast(params: dict, client: GridClient) -> dict:
    try:
        hours = client.check_hours(params.get("hours", DEFAULT_FORECAST_HOURS))
        series = client.check_series(params.get("series", "forecast"))
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    direction = "pt24h" if series == "actual" else "fw48h"
    slots = client.series(direction, hours=min(hours, 24) if series == "actual" else hours)
    limit = client.check_limit(params.get("limit", MAX_LISTED))
    values = [slot["value"] for slot in slots if slot.get("value") is not None]
    if series == "actual":
        values = [slot["actual"] for slot in slots if slot.get("actual") is not None]
    artifact = _artifact(params, client, hours=hours, series=series, slots=slots,
                         count=len(slots), bands=INTENSITY_BANDS)
    if not slots:
        return {
            "final_state": "completed",
            "message": (
                f"The Carbon Intensity API published no {series} half-hours for the window you asked "
                f"for. NESO publishes a forecast ahead of the current half-hour and actuals behind it. "
                f"(Read live from {DATASET}.)"
            ),
            "artifact": artifact,
            "watch": None,
        }
    listing = "\n".join(_slot_line(slot) for slot in slots[:limit])
    if values:
        cleanest = slots[values.index(min(values))]
        dirtiest = slots[values.index(max(values))]
        spread = f"  • cleanest {min(values)} gCO2/kWh at {cleanest['from']}, dirtiest {max(values)} at {dirtiest['from']}."
    else:
        spread = ""
    omitted = f"\n  • ... {len(slots) - limit} more half-hour(s) are in the artifact." if len(slots) > limit else ""
    return {
        "final_state": "completed",
        "message": (
            f"Great Britain, {series} carbon intensity, {len(slots)} half-hour(s) from {slots[0]['from']} "
            f"to {slots[-1]['to']}:\n{listing}{omitted}\n{spread}\n"
            f"The band on each line is NESO's own. Source: {DATASET} (read live)."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_grid_regional(params: dict, client: GridClient) -> dict:
    limit = client.check_limit(params.get("limit", MAX_LISTED), REGION_COUNT)
    postcode = params.get("postcode")
    if postcode:
        region = client.region_for_postcode(postcode)
        artifact = _artifact(params, client, postcode=postcode, region=region)
        if region is None:
            return {
                "final_state": "completed",
                "message": (
                    f"NESO has no regional record for “{postcode}”. It keys that lookup on the outward "
                    f"code of a British postcode — SW1A, M1, EH12 — and answers 400 for a code it does "
                    f"not hold. (Read live from {DATASET}.)"
                ),
                "artifact": artifact,
                "watch": None,
            }
        mix = _mix_lines(region["mix"])
        return {
            "final_state": "completed",
            "message": (
                f"{postcode} is in the {region['short_name']} region ({region['dno']}), "
                f"{region['forecast']} gCO2/kWh, band {region['band']}, for {region['from']}.\n"
                f"  • generation mix: {mix or 'not reported'}.\n"
                f"This API only publishes the current half-hour for regions, so there is no regional "
                f"history here. Source: {DATASET} (read live)."
            ),
            "artifact": artifact,
            "watch": None,
        }

    wanted = params.get("region")
    if wanted:
        needle = str(wanted).strip().lower()
        rows = [row for row in client.regions()
                if needle in (row["short_name"] or "").lower() or needle in (row["dno"] or "").lower()]
        if not rows:
            names = sorted({row["short_name"] for row in client.regions()})
            return {
                "final_state": "completed",
                "message": (
                    f"No GB region matches “{wanted}”. NESO publishes 18: {', '.join(names)}."
                ),
                "artifact": _artifact(params, client, region=wanted, regions=[]),
                "watch": None,
            }
        return _region_answer(params, client, rows, limit)

    rows = client.regions()
    return _region_answer(params, client, rows, limit)


def _region_answer(params: dict, client: GridClient, rows: list[dict], limit: int) -> dict:
    ranked = sorted(rows, key=lambda row: (row["forecast"] is None, -(row["forecast"] or 0)))
    dirtiest = ranked[0]
    cleanest = ranked[-1]
    listing = "\n".join(
        f"  • {row['short_name']} — {row['forecast']} gCO2/kWh, band {row['band']}"
        + (f"  ({_mix_lines(row['mix'], 3)})" if row["mix"] else "")
        for row in ranked[:limit]
    )
    omitted = f"\n  • ... {len(ranked) - limit} more region(s) are in the artifact." if len(ranked) > limit else ""
    return {
        "final_state": "completed",
        "message": (
            f"{len(ranked)} GB region(s) for {ranked[0]['from']}, dirtiest first:\n{listing}{omitted}\n"
            f"  • Dirtiest: {dirtiest['short_name']} at {dirtiest['forecast']} gCO2/kWh. Cleanest: "
            f"{cleanest['short_name']} at {cleanest['forecast']} gCO2/kWh.\n"
            f"This API only publishes the current half-hour for regions, so there is no regional "
            f"history here. Source: {DATASET} (read live)."
        ),
        "artifact": _artifact(params, client, regions=ranked, count=len(ranked),
                              dirtiest=dirtiest, cleanest=cleanest, bands=INTENSITY_BANDS),
        "watch": None,
    }


def run_grid_mix(params: dict, client: GridClient) -> dict:
    mix = client.generation_mix()
    artifact = _artifact(params, client, generation_mix=mix)
    if mix is None:
        return {
            "final_state": "completed",
            "message": (
                f"The Carbon Intensity API published no generation mix for the current half-hour. "
                f"(Read live from {DATASET}.)"
            ),
            "artifact": artifact,
            "watch": None,
        }
    entries = mix["mix"]
    total = sum(entry["percent"] for entry in entries)
    low_carbon = sum(entry["percent"] for entry in entries
                     if entry["fuel"] in ("wind", "solar", "hydro", "nuclear", "biomass"))
    listing = "\n".join(f"  • {entry['fuel']} {entry['percent']:g}%" for entry in entries)
    return {
        "final_state": "completed",
        "message": (
            f"What Great Britain is generating, {mix['from']} to {mix['to']} (shares as published, "
            f"totalling {total:g}%):\n{listing}\n"
            f"  • {low_carbon:g}% of the mix is wind, solar, hydro, nuclear or biomass.\n"
            f"Source: {DATASET} (read live)."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_clean_windows(params: dict, client: GridClient, gateway: GatewayClient) -> dict:
    """The premium low-carbon windows. The work happens on the gateway.

    Nothing here reads the forecast: the gateway does the work behind its licence check
    and hands back the windows, so a caller who has not paid gets the gateway's own
    message and no windows at all.
    """
    try:
        hours = client.check_hours(params.get("hours", 48))
        series = client.check_series(params.get("series", "forecast"))
        arguments = {"hours": hours, "source": series}
        if params.get("threshold") is not None:
            arguments["threshold"] = client.check_threshold(params["threshold"])
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}

    read, refused = premium_call(gateway, "a2a_grid_clean_windows", arguments, {
        "dataset": DATASET, "hours": hours, "series": series,
    })
    if refused:
        return refused
    if not isinstance(read, dict) or not read.get("half_hours_read"):
        return empty_premium_answer(
            "The licence gateway answered without any carbon intensity, so there are no windows to report.",
            {"dataset": DATASET, "hours": hours, "series": series},
        )

    window = read.get("window") or {}
    intensity = read.get("intensity") or {}
    longest = read.get("longest_window") or {}
    cleanest = read.get("cleanest") or {}
    dirtiest = read.get("dirtiest") or {}
    lines = [
        f"Low-carbon windows over Great Britain's {read.get('half_hours_read')} half-hour(s) from "
        f"{window.get('from')} to {window.get('to')}, on the {read.get('series')} series.",
        f"  • Clean enough means at or below {read.get('threshold')} gCO2/kWh "
        f"(threshold from {read.get('threshold_source')}).",
    ]
    windows = read.get("windows") or []
    if windows:
        for entry in windows[:MAX_LISTED]:
            lines.append(
                f"  • {entry.get('start')} to {entry.get('end')} — {entry.get('half_hours')} half-hour(s) "
                f"({entry.get('hours')} h), lowest {entry.get('lowest')} gCO2/kWh at {entry.get('lowest_at')}"
            )
        if read.get("windows_omitted"):
            lines.append(f"  • ... {read['windows_omitted']} more window(s) are in the artifact.")
    else:
        lines.append("  • No half-hour in this window is at or below that threshold.")
    if longest:
        lines.append(
            f"  • Longest window: {longest.get('start')} to {longest.get('end')}, {longest.get('hours')} h, "
            f"bottoming at {longest.get('lowest')} gCO2/kWh."
        )
    lines.append(
        f"  • {read.get('clean_half_hours')} of {read.get('half_hours_read')} half-hour(s) are clean "
        f"enough ({read.get('clean_share')}%)."
    )
    lines.append(
        f"  • Cleanest half-hour {cleanest.get('value')} gCO2/kWh at {cleanest.get('at')} "
        f"({cleanest.get('band')}); dirtiest {dirtiest.get('value')} at {dirtiest.get('at')} "
        f"({dirtiest.get('band')})."
    )
    lines.append(
        f"  • Across the window: lowest {intensity.get('min')}, highest {intensity.get('max')}, "
        f"mean {intensity.get('mean')} gCO2/kWh. (A mean is ours, so it carries no band.)"
    )
    lines.append(
        f"\nWorked out on the MCP gateway behind its licence check, from NESO's published forecast "
        f"({DATASET}). Bands are NESO's own; the clean-share figure is a count of half-hours, not an "
        f"area or a volume. A forecast moves as generation is dispatched, so re-read it before you commit."
    )
    artifact = {
        "dataset": DATASET,
        "source": SOURCE,
        "premium": True,
        "series": read.get("series"),
        "window": window,
        "half_hours_read": read.get("half_hours_read"),
        "threshold": read.get("threshold"),
        "threshold_source": read.get("threshold_source"),
        "clean_half_hours": read.get("clean_half_hours"),
        "clean_share": read.get("clean_share"),
        "window_count": read.get("window_count"),
        "longest_window": longest,
        "windows": windows,
        "intensity": intensity,
        "cleanest": cleanest,
        "dirtiest": dirtiest,
        "generated_at": read.get("generated_at"),
    }
    return {"final_state": "completed", "message": "\n".join(lines), "artifact": artifact, "watch": None}


class GridAgent(SkillAgent):
    name = "grid"
    card_name = "GB Grid Carbon Agent"
    card_description = (
        "Read-only agent over National Grid ESO's carbon intensity API for Great Britain: the current "
        "half-hour's intensity, the 48-hour forecast half-hour by half-hour, all 18 distribution regions "
        "with their own generation mix, and what the country is generating right now. Every band is "
        "NESO's own rather than derived. One premium skill turns the forecast into low-carbon windows, "
        "and it runs behind a licence check on the gateway."
    )
    env_prefix = "GRID"
    datasets = (DATASET,)
    card_skills = CARD_SKILLS

    def __init__(self, client: GridClient | None = None, gateway: GatewayClient | None = None) -> None:
        self.client = client or GridClient()
        self.gateway = gateway or GatewayClient()

    def parse(self, message: dict) -> dict:
        return parse(message)

    def missing(self, skill: str, params: dict) -> list[str]:
        if skill == SKILL_GRID_REGIONAL:
            # Nothing is required: every region is always answerable, and a region or
            # postcode the caller named is resolved inside the skill.
            return []
        if skill == SKILL_CLEAN_WINDOWS:
            # Nothing is required: "when is the grid cleanest" is a national question
            # and the national answer needs no argument.
            return []
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
            if skill == SKILL_CLEAN_WINDOWS:
                return run_clean_windows(params, self.client, self.gateway)
            if skill == SKILL_GRID_NOW:
                return run_grid_now(params, self.client)
            if skill == SKILL_GRID_FORECAST:
                return run_grid_forecast(params, self.client)
            if skill == SKILL_GRID_REGIONAL:
                return run_grid_regional(params, self.client)
            if skill == SKILL_GRID_MIX:
                return run_grid_mix(params, self.client)
        except UpstreamError as exc:
            return {"final_state": "failed", "message": str(exc), "artifact": None, "watch": None}
        except ValueError as exc:
            return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
        return {"final_state": "completed", "message": HELP, "artifact": None, "watch": None}


__all__ = [
    "CARD_SKILLS",
    "HELP",
    "MAX_LISTED",
    "GridAgent",
    "GridClient",
    "SKILL_CLEAN_WINDOWS",
    "SKILL_GRID_FORECAST",
    "SKILL_GRID_MIX",
    "SKILL_GRID_NOW",
    "SKILL_GRID_REGIONAL",
    "UpstreamError",
    "message_data",
    "message_text",
    "parse",
    "postcode_from_text",
    "run_clean_windows",
    "run_grid_forecast",
    "run_grid_mix",
    "run_grid_now",
    "run_grid_regional",
]
