"""The NYC drinking water agent: four skills over the live DEP monitoring dataset.

  - water-quality: sample chemistry + coliform/E. coli detections for a site or citywide
  - water-sites:   the monitoring site codes and how recently each was sampled
  - water-watch:   watch one site and get POSTed when a new sample is logged
  - water-trend:   the spread of the measured values in a window (premium)

Watch-capable: water-watch stores {"kind": "water-watch", "site": "..."} and the
server POSTs to your webhook when a newer sample number appears for that site.
"""

from __future__ import annotations

import re

from a2a_kit import GatewayClient, SkillAgent, empty_premium_answer, premium_call

from data import (
    DATASET_WATER,
    DATASET_WATER_TITLE,
    UpstreamError,
    WaterClient,
)

SKILL_WATER_QUALITY = "water-quality"
SKILL_WATER_SITES = "water-sites"
SKILL_WATER_WATCH = "water-watch"
SKILL_WATER_TREND = "water-trend"

DEFAULT_TREND_DAYS = 90
MAX_LISTED_TREND_SITES = 6

CAVEAT = (
    "This is the raw distribution-monitoring record published by DEP, not a health ruling. "
    "For a concern about water in a building, call 311."
)

CARD_SKILLS = [
    {
        "id": SKILL_WATER_QUALITY,
        "name": "Drinking water sample results",
        "description": (
            "Free chlorine, turbidity, coliform, and E. coli results from New York City's "
            "distribution monitoring data, for one monitoring site code or citywide, over a "
            "chosen window. Reports how many samples were looked at and how many showed a "
            "coliform or E. coli detection."
        ),
        "tags": ["nyc", "water", "drinking-water", "dep", "quality"],
        "examples": [
            "How is the water testing at site 55450?",
            '{"skill": "water-quality", "site": "55450", "days": 180}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_WATER_SITES,
        "name": "Water monitoring sites",
        "description": (
            "The monitoring site codes in the drinking water dataset, with sample counts and the "
            "date of each site's most recent sample. Sites are published as codes only; the "
            "dataset carries no coordinates, so this cannot resolve an address."
        ),
        "tags": ["nyc", "water", "dep", "sites", "coverage"],
        "examples": [
            "Which water monitoring sites report the most?",
            '{"skill": "water-sites", "limit": 10}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_WATER_WATCH,
        "name": "Watch a water monitoring site",
        "description": (
            "Watch one monitoring site and have the server call your webhook when a new sample is "
            "logged for it, including the new sample's chemistry."
        ),
        "tags": ["nyc", "water", "dep", "watch", "webhook"],
        "examples": [
            "Tell me when site 55450 gets a new sample.",
            '{"skill": "water-watch", "site": "55450"}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_WATER_TREND,
        "name": "How the measurements were distributed (premium)",
        "description": (
            "A window of the drinking-water monitoring record read as a spread: per analyte the "
            "number of readings, the minimum, mean, median, 90th percentile and maximum, how the "
            "values moved from the first half of the window to the second, which sites were "
            "sampled most, and the sample-class mix. Anchored to the newest sample in the dataset "
            "rather than to today. Premium: it runs behind a licence check."
        ),
        "tags": ["nyc", "water", "drinking-water", "trend", "distribution", "premium"],
        "examples": [
            "How did free chlorine levels move over the last 90 days?",
            '{"skill": "water-trend", "site": "55450", "days": 90}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
]

_SITE_RE = re.compile(r"\b([0-9]{5}|[0-9]?[A-Za-z]{2,4}[0-9]{0,4}[A-Za-z]?[0-9]?)\b")
_WATCH_WORDS = re.compile(r"\b(watch|notify|alert|ping|tell me when|let me know|subscribe|new sample)\b", re.IGNORECASE)
# "sites" plural only: "at site 55450" is a quality question, not a site listing.
_SITE_WORDS = re.compile(r"\b(sites|stations|locations|coverage)\b", re.IGNORECASE)
#: The spread of the measured values over a window rather than a single sample's chemistry.
#: Deliberately narrow, so "water quality at site 55450" stays with water-quality.
_TREND_WORDS = re.compile(
    r"\b(?:water[- ]trends?|trends?|trending|"
    r"distribution of|"
    r"(?:90th|95th|ninetieth) percentile|"
    r"median\b|"
    r"first half|second half|"
    r"how (?:has|have|did|does)\b[^.\n]{0,30}\b(?:change|changed|move|moved|compare|compared)|"
    r"rising|falling|"
    r"sampled most|most sampled)",
    re.IGNORECASE,
)
_STOPWORDS = {"water", "quality", "sample", "samples", "site", "sites", "watch", "notify", "the", "and", "for", "when"}


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


def _site_from_text(text: str) -> str | None:
    """Pick a site code out of free text: 5-digit codes or compact codes like 1S03A."""
    for token in re.findall(r"[A-Za-z0-9]{3,10}", text):
        lowered = token.lower()
        if lowered in _STOPWORDS:
            continue
        if re.fullmatch(r"\d{5}", token) or re.fullmatch(r"\d?[A-Za-z]{2,4}\d{0,4}[A-Za-z]?\d?", token) and any(
            ch.isdigit() for ch in token
        ):
            return token
    return None


def parse(message: dict) -> dict:
    """Incoming message -> {skill, params, explicit}. Never raises."""
    text = message_text(message)
    data = message_data(message)
    requested = _first(data, "skill", "skill_id")
    site = _first(data, "site", "sample_site", "site_code")
    days = _first(data, "days", default=90)
    limit = _first(data, "limit", default=20)

    if not site:
        site = _site_from_text(text)

    asked_for_watch = bool(_WATCH_WORDS.search(text))
    asked_for_sites = bool(_SITE_WORDS.search(text))
    asked_for_trend = bool(_TREND_WORDS.search(text))
    if requested in (SKILL_WATER_QUALITY, SKILL_WATER_SITES, SKILL_WATER_WATCH, SKILL_WATER_TREND):
        skill = requested
    elif asked_for_watch:
        skill = SKILL_WATER_WATCH
    elif asked_for_trend:
        skill = SKILL_WATER_TREND
    elif asked_for_sites:
        skill = SKILL_WATER_SITES
    else:
        skill = SKILL_WATER_QUALITY

    params: dict = {"days": days, "limit": limit}
    if site:
        params["site"] = str(site)
    explicit = bool(requested or asked_for_watch or asked_for_sites or asked_for_trend)
    return {"skill": skill, "params": params, "explicit": explicit}


def _summary_line(summary: dict, where: str) -> str:
    chlorine = summary["chlorine_mg_l"]
    parts = [
        f"{summary['samples']} sample(s) for {where}",
        f"{summary['first_sample_date']} to {summary['last_sample_date']}"
        if summary["first_sample_date"]
        else "no dated samples",
        f"free chlorine {chlorine['min']}-{chlorine['max']} mg/L"
        if chlorine["min"] is not None
        else "free chlorine not reported",
        f"max turbidity {summary['turbidity_ntu']['max']} NTU"
        if summary["turbidity_ntu"]["max"] is not None
        else "turbidity not reported",
        f"coliform detections {summary['coliform_detections']}/{summary['coliform_samples']}",
        f"E. coli detections {summary['e_coli_detections']}/{summary['e_coli_samples']}",
    ]
    return "; ".join(parts) + "."


def run_water_quality(params: dict, client: WaterClient) -> dict:
    site = params.get("site")
    days = int(params.get("days", 90))
    rows = client.site_window(site, days=days) if site else client.latest_samples(limit=int(params.get("limit", 50)))
    where = f"site {site}, last {days} days" if site else "all reported sites, most recent samples"
    summary = client.summarize(rows)
    artifact = {
        "dataset": DATASET_WATER,
        "dataset_title": DATASET_WATER_TITLE,
        "freshness": client.freshness(),
        "site": site,
        "window_days": days if site else None,
        "summary": summary,
        "samples": rows[:50],
        "caveat": CAVEAT,
    }
    if not rows:
        return {
            "final_state": "completed",
            "message": (
                f"No drinking water samples are published for {where}. Check the site code — "
                "water-sites lists the codes that exist."
            ),
            "artifact": artifact,
            "watch": None,
        }
    return {
        "final_state": "completed",
        "message": _summary_line(summary, where) + " " + CAVEAT,
        "artifact": artifact,
        "watch": None,
    }


def run_water_sites(params: dict, client: WaterClient) -> dict:
    sites = client.busiest_sites(limit=int(params.get("limit", 20)))
    listing = ", ".join(f"{row.get('sample_site')} ({row.get('samples')} samples, latest {row.get('latest', '')[:10]})" for row in sites[:5])
    return {
        "final_state": "completed",
        "message": (
            f"{len(sites)} monitoring site(s) by sample volume: {listing}. Site codes are monitoring "
            "stations published without coordinates, so I cannot map one to a street address."
        ),
        "artifact": {
            "dataset": DATASET_WATER,
            "dataset_title": DATASET_WATER_TITLE,
            "freshness": client.freshness(),
            "count": len(sites),
            "sites": sites,
        },
        "watch": None,
    }


def run_water_watch(params: dict, client: WaterClient) -> dict:
    site = client.check_site(params["site"])
    rows = client.latest_samples(site=site, limit=1)
    if not rows:
        return {
            "final_state": "completed",
            "message": (
                f"No published samples for site {site}, so there is nothing to watch. Ask for the "
                "site list to see which codes exist."
            ),
            "artifact": {
                "dataset": DATASET_WATER,
                "dataset_title": DATASET_WATER_TITLE,
                "freshness": client.freshness(),
                "found": False,
                "site": site,
            },
            "watch": None,
        }
    latest = rows[0]
    observed = _observation(latest)
    return {
        "final_state": "completed",
        "message": (
            f"Watching site {site}. Latest sample {latest.get('sample_number')} on "
            f"{latest.get('sample_date', '')[:10]} {latest.get('sample_time', '')} — free chlorine "
            f"{latest.get('residual_free_chlorine_mg_l')} mg/L, turbidity {latest.get('turbidity_ntu')} NTU, "
            "coliform " + str(latest.get("coliform_quanti_tray_mpn_100ml")) + ". Point a "
            "pushNotificationConfig at this task and I will POST when a newer sample appears."
        ),
        "artifact": {
            "dataset": DATASET_WATER,
            "dataset_title": DATASET_WATER_TITLE,
            "freshness": client.freshness(),
            "site": site,
            "latest_sample": latest,
            "caveat": CAVEAT,
        },
        "watch": {
            "kind": SKILL_WATER_WATCH,
            "site": site,
            "dataset": DATASET_WATER,
            "observed": observed,
        },
    }


def _observation(sample: dict | None) -> dict:
    if not sample:
        return {"sample_number": "", "sample_date": "", "sample_time": ""}
    return {
        "sample_number": sample.get("sample_number") or "",
        "sample_date": sample.get("sample_date") or "",
        "sample_time": sample.get("sample_time") or "",
    }


def run_water_trend(params: dict, client: WaterClient, gateway: GatewayClient) -> dict:
    """The premium distribution view. The figures are worked out on the gateway.

    The gateway reads the DEP dataset behind its licence check and hands back the
    distribution, so a caller who has not paid gets the gateway's own message and no
    numbers at all.
    """
    site = params.get("site")
    # A bad argument is the caller's to fix, so it comes back as a question rather than
    # as an internal error.
    try:
        days = client.check_trend_days(params.get("days") or DEFAULT_TREND_DAYS)
        site = client.check_site(site) if site else None
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    arguments: dict = {"days": days}
    if site:
        arguments["site"] = site
    read, refused = premium_call(gateway, "water_analyte_trend", arguments, {
        "dataset": DATASET_WATER, "dataset_title": DATASET_WATER_TITLE, "site": site, "days": days,
    })
    if refused:
        return refused
    if not isinstance(read, dict) or read.get("samples") is None:
        return empty_premium_answer(
            "The licence gateway answered without any samples, so there is nothing to report.",
            {"dataset": DATASET_WATER, "site": site, "days": days},
        )

    where = f"site {read.get('site')}" if site else "every reported site"
    analytes = read.get("analytes") or {}
    chlorine = analytes.get("freeChlorine") or {}
    turbidity = analytes.get("turbidity") or {}
    coliform = read.get("coliform") or {}
    split = read.get("halfWindowSplit") or {}
    free_move = split.get("meanFreeChlorine") or {}
    murk_move = split.get("meanTurbidity") or {}
    lines = [
        f"{read.get('samples')} drinking-water sample(s) for {where} in the {read.get('windowDays')} "
        f"days before the newest sample in the dataset ({read.get('latestSampleDate')}, "
        f"{read.get('daysSinceLatestSample')} day(s) ago):",
        f"  • Free chlorine ({chlorine.get('unit')}): {chlorine.get('readings')} reading(s), "
        f"min {chlorine.get('min')}, mean {chlorine.get('mean')}, median {chlorine.get('median')}, "
        f"90th percentile {chlorine.get('p90')}, max {chlorine.get('max')}; "
        f"{chlorine.get('belowReportingLimit')} below the reporting limit.",
        f"  • Turbidity ({turbidity.get('unit')}): {turbidity.get('readings')} reading(s), "
        f"min {turbidity.get('min')}, mean {turbidity.get('mean')}, median {turbidity.get('median')}, "
        f"90th percentile {turbidity.get('p90')}, max {turbidity.get('max')}; "
        f"{turbidity.get('belowReportingLimit')} below the reporting limit.",
        f"  • Coliform: {coliform.get('atLeastOnePer100ml')} sample(s) at 1 MPN/100 mL or more, "
        f"{coliform.get('belowReportingLimit')} below the reporting limit.",
        f"  • First half to second half of the window (split at {split.get('at')}): free chlorine "
        f"{free_move.get('first')} to {free_move.get('second')} ({free_move.get('direction')}), "
        f"turbidity {murk_move.get('first')} to {murk_move.get('second')} "
        f"({murk_move.get('direction')}).",
    ]
    top = read.get("topSites") or []
    if top:
        lines.append(f"  • Most sampled site(s) of the {read.get('sitesSampled')} in the window:")
        for row in top[:MAX_LISTED_TREND_SITES]:
            lines.append(
                f"      {row.get('site')} — {row.get('samples')} sample(s), mean turbidity "
                f"{row.get('meanTurbidity')} NTU"
            )
        if len(top) > MAX_LISTED_TREND_SITES:
            lines.append(f"      ... {len(top) - MAX_LISTED_TREND_SITES} more are in the artifact.")
    classes = read.get("sampleClasses") or {}
    if classes:
        lines.append("  • Sample classes: " + ", ".join(f"{name} {count}" for name, count in classes.items()) + ".")
    if read.get("sampleCoversWindow") is False:
        lines.append(
            "  • The window held more records than one page returns, so these figures cover the "
            "records the dataset handed back rather than every sample in the window."
        )
    lines.append(
        "\nComputed on the MCP gateway behind its licence check, from DEP's published "
        f"distribution-monitoring record ({DATASET_WATER}, \"{DATASET_WATER_TITLE}\"). "
        "The window is anchored to the newest sample in the dataset, not to today, so a quiet "
        "publishing spell does not read as clean water. " + CAVEAT
    )
    artifact = {
        "dataset": DATASET_WATER,
        "dataset_title": DATASET_WATER_TITLE,
        "premium": True,
        "site": read.get("site"),
        "window_days": read.get("windowDays"),
        "window_start": read.get("windowStart"),
        "latest_sample_date": read.get("latestSampleDate"),
        "days_since_latest_sample": read.get("daysSinceLatestSample"),
        "samples": read.get("samples"),
        "sample_covers_window": read.get("sampleCoversWindow"),
        "sites_sampled": read.get("sitesSampled"),
        "sample_classes": classes,
        "analytes": analytes,
        "coliform": coliform,
        "top_sites": top,
        "half_window_split": split,
        "caveat": CAVEAT,
    }
    return {"final_state": "completed", "message": "\n".join(lines), "artifact": artifact, "watch": None}


class WaterAgent(SkillAgent):
    name = "nycwater"
    card_name = "NYC Drinking Water Agent"
    card_description = (
        "Read-only agent over New York City's drinking water distribution monitoring data "
        "(bkwf-xfky): free chlorine, turbidity, coliform and E. coli results per monitoring site, the "
        "list of site codes, and a watch skill that POSTs to your webhook when a site logs a new "
        "sample. Sites are published as codes without coordinates, so answers are per site, not per "
        "address. Raw monitoring records, not a health verdict."
    )
    env_prefix = "NYC_WATER"
    datasets = (DATASET_WATER,)
    card_skills = CARD_SKILLS
    watch_kinds = (SKILL_WATER_WATCH,)

    def __init__(self, client: WaterClient | None = None,
                 gateway: GatewayClient | None = None) -> None:
        self.client = client or WaterClient()
        self.gateway = gateway or GatewayClient()

    def parse(self, message: dict) -> dict:
        return parse(message)

    def missing(self, skill: str, params: dict) -> list[str]:
        if skill == SKILL_WATER_WATCH:
            return [] if params.get("site") else ["site"]
        return []

    def input_prompt(self, skill: str, missing: list[str]) -> str:
        return (
            "Which water monitoring site? Site codes look like 55450 or 1S03A — ask for the site "
            "list if you need to see them."
        )

    def run(self, request: dict) -> dict:
        if request["missing"]:
            return {
                "final_state": "input-required",
                "message": self.input_prompt(request["skill"], request["missing"]),
                "artifact": None,
                "watch": None,
            }
        if request["skill"] == SKILL_WATER_TREND:
            return run_water_trend(request["params"], self.client, self.gateway)
        if request["skill"] == SKILL_WATER_SITES:
            return run_water_sites(request["params"], self.client)
        if request["skill"] == SKILL_WATER_WATCH:
            return run_water_watch(request["params"], self.client)
        return run_water_quality(request["params"], self.client)

    def probe_watch(self, watch: dict):
        site = watch.get("site")
        if not site:
            return None
        rows = self.client.latest_samples(site=site, limit=1)
        if not rows:
            return None
        return _observation(rows[0])

    def describe_watch_change(self, watch: dict, previous, observed) -> str:
        site = watch.get("site")
        sample = observed or {}
        return (
            f"New drinking water sample at site {site}: number {sample.get('sample_number')} on "
            f"{str(sample.get('sample_date'))[:10]} {sample.get('sample_time')}."
        )


__all__ = [
    "CARD_SKILLS",
    "DEFAULT_TREND_DAYS",
    "MAX_LISTED_TREND_SITES",
    "SKILL_WATER_QUALITY",
    "SKILL_WATER_SITES",
    "SKILL_WATER_TREND",
    "SKILL_WATER_WATCH",
    "UpstreamError",
    "WaterAgent",
    "message_data",
    "message_text",
    "parse",
    "run_water_quality",
    "run_water_sites",
    "run_water_trend",
    "run_water_watch",
]
