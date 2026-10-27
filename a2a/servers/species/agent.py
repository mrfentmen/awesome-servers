"""The species agent: five skills over iNaturalist's public observations.

  - species-count:        how many observations carry a name, and a sample
  - recent-sightings:     the newest observations recorded under a name
  - nearby-observations:  what has been recorded within a radius of a point
  - species-info:         one taxon's own record - rank, common name, count
  - range-survey:         a name's records read as a picture (not implemented here)

Premium: `range-survey` pages through a name's observations and reports the
shape of them - by year, by month, by grade, by country, and how many carried a
usable position - which is a lot of pages and is the work the gateway does
behind its licence check. Every free skill asks iNaturalist one bounded
question and stays keyless.

What this server refuses to blur. iNaturalist is **crowd-sourced**: one row is
one uploaded observation, not one animal, so nothing here is a population
estimate and the wording never implies one. A grade is not decoration either -
`research` grade is community-confirmed to species level and `needs_id` is a
sighting still waiting for identifiers - so every count says which grade it
counted, and a row keeps its own grade. And the position on a row can be
deliberately wrong: iNaturalist obscures protected taxa and hands back a point
somewhere inside a cell, so a row says whether its coordinates were obscured.
"""

from __future__ import annotations

import re

from a2a_kit import SkillAgent

from data import (
    DATASET,
    MAX_LIMIT,
    MAX_RADIUS_KM,
    QUALITY_GRADES,
    SpeciesClient,
    UpstreamError,
    place_from_text,
    point_from_place,
)

SKILL_COUNT = "species-count"
SKILL_RECENT = "recent-sightings"
SKILL_NEARBY = "nearby-observations"
SKILL_INFO = "species-info"
SKILL_SURVEY = "range-survey"

#: The gateway tool that does the premium work. Same name here and on the gateway.
GATEWAY_TOOL = "a2a_species_range_survey"

SOURCE = "iNaturalist, api.inaturalist.org/v1"
PRODUCT = "iNaturalist public observation records"

_POINT_RE = re.compile(r"\b(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\b")
_RADIUS_RE = re.compile(r"\bwithin\s+(\d{1,3})\s*(?:km|kilometres?|kilometers?|miles?)\b",
                        re.IGNORECASE)
_COUNT_RE = re.compile(r"\b(how many|count|number of|total)\b", re.IGNORECASE)
_NEAR_RE = re.compile(r"\b(near|nearby|around|close to|within|in)\b", re.IGNORECASE)
_INFO_RE = re.compile(
    r"\b(what is|what's|who is|tell me about|describe|look up|info|information|rank|"
    r"conservation|endangered|scientific name|taxonomy)\b",
    re.IGNORECASE,
)
_SURVEY_RE = re.compile(
    r"\b(survey|breakdown|overview|distribution|range map|spread|how many observations|"
    r"by month|by year|by country|season|seasonal|statistics|stats|whole dataset|"
    r"all of them|across the)\b",
    re.IGNORECASE,
)
_GRADE_RE = re.compile(r"\b(research grade|research|needs_id|needs id|confirmed|verified|casual)\b",
                       re.IGNORECASE)
_HOWMANY_RE = re.compile(
    r"\bhow many\s+([A-Za-z][A-Za-z'\- ]{2,40}?)"
    r"(?:\s+(?:are|is|were|was|have|has|live|lives|exist|there)\b|[?.!,]|$)",
    re.IGNORECASE,
)
_TAXON_AFTER_RE = re.compile(
    r"\b(?:of|about|for|sightings? of|observations? of|records? of)\s+([A-Za-z][A-Za-z'\- ]{2,40})",
    re.IGNORECASE,
)
#: A scientific name: a capitalised genus and a lowercase epithet.
_SCIENTIFIC_RE = re.compile(r"\b([A-Z][a-z]{2,}\s+[a-z][a-z\-]{2,})\b")

#: Words that mean a captured phrase is not part of a taxon name.
_STOP_TAIL_WORDS = frozenset({
    "are", "is", "were", "was", "have", "has", "live", "lives", "exist", "there", "in", "on",
    "at", "near", "around", "found", "seen", "today", "right", "now", "recently", "recorded",
    "observed", "reported", "the", "a", "an", "and", "or", "with", "from", "been", "sighted",
})
_WHATIS_RE = re.compile(
    r"\b(?:what is|what's|tell me about|describe|look up|info on|information about)\s+"
    r"(?:a|an|the)?\s*([A-Za-z][A-Za-z'\- ]{2,40})",
    re.IGNORECASE,
)
_PLACE_PHRASE_RE = re.compile(r"\b(?:in|at|near|around)\s+([A-Za-z][\w'-]*(?:\s+[A-Za-z][\w'-]*){0,2})")

#: A species named directly before a record word: "the red fox observations",
#: "monarch butterfly records". Nothing else in the sentence needs to be about it.
_RECORDS_OF_RE = re.compile(
    r"\b([A-Za-z][A-Za-z'\- ]{2,40}?)\s+(?:observations?|sightings?|records?|reports?)\b",
    re.IGNORECASE,
)

#: What a captured run is trimmed of at both ends: question words, articles, and
#: the words that describe the records rather than the species.
_TRIM_WORDS = _STOP_TAIL_WORDS | frozenset({
    "what", "which", "who", "how", "many", "records", "record", "reports", "report",
    "overview", "survey", "breakdown", "distribution", "statistics", "stats", "numbers",
    "data", "observations", "observation", "sightings", "sighting", "lookup", "chart",
    "give", "show", "list", "find", "me", "please", "the", "a", "an",
    "do", "does", "did", "break", "breaks", "down", "across", "these", "those", "they",
    "trend", "trends", "season", "seasonal", "pattern", "patterns", "shape", "spread",
    "any", "some", "all", "latest", "recent", "newest", "current", "last",
})

STOPWORDS = frozenset({
    "what", "which", "who", "how", "when", "where", "is", "are", "was", "were", "the", "a", "an",
    "of", "in", "on", "at", "for", "to", "and", "or", "me", "tell", "about", "look", "up", "give",
    "show", "list", "find", "many", "much", "there", "do", "does", "it", "its", "has", "have",
    "been", "seen", "found", "records", "record", "observations", "observation", "sightings",
    "sighting", "count", "number", "total", "info", "information", "describe", "rank",
    "conservation", "endangered", "scientific", "name", "taxonomy", "recent", "latest", "newest",
    "please",
})


def _trim_phrase(phrase: str) -> str | None:
    """Drop question, article and record words from both ends of a captured run.

    "the monarch butterfly records" is a sentence wrapped around a species, so
    the wrapper goes and the name stays. Trimming both ends is what keeps
    "overview of the red fox records" from being searched for verbatim.
    """
    words = str(phrase).strip(" .,?!").split()
    while words and words[0].lower() in _TRIM_WORDS:
        words.pop(0)
    while words and words[-1].lower() in _TRIM_WORDS and len(words) > 1:
        words.pop()
    cleaned = " ".join(words)
    if len(cleaned) >= 3 and re.search(r"[A-Za-z]", cleaned):
        return cleaned.lower()
    return None


def taxon_from_text(text: str) -> str | None:
    """The species name in a question, or None.

    A scientific name is read as written, because its shape is unmistakable. A
    common name is read only where the sentence marks it out - after "how many",
    after "what is"/"tell me about", or after "of"/"about"/"for" - so ordinary
    question words are not mistaken for a species. Conservative on purpose:
    asking is better than searching for the wrong thing.
    """
    scientific = _SCIENTIFIC_RE.search(text)
    if scientific:
        return scientific.group(1)
    for pattern in (_HOWMANY_RE, _WHATIS_RE, _TAXON_AFTER_RE, _RECORDS_OF_RE):
        match = pattern.search(text)
        if not match:
            continue
        # "how many observations of X" is a record word before the name itself.
        phrase = re.sub(r"^(?:observations?|sightings?|records?|reports?)\s+(?:of|for)\s+", "",
                        match.group(1), flags=re.IGNORECASE)
        cleaned = _trim_phrase(phrase)
        if cleaned:
            return cleaned
    return None


def radius_from_text(text: str) -> int | None:
    """A radius in the sentence, in km. A mile figure is converted, not ignored."""
    match = _RADIUS_RE.search(text)
    if not match:
        return None
    try:
        value = int(match.group(1))
    except (TypeError, ValueError):
        return None
    if re.search(r"\bmiles?\b", match.group(0), re.IGNORECASE):
        value = int(round(value * 1.60934))
    try:
        return SpeciesClient.check_radius(value)
    except ValueError:
        return None


def grade_from_text(text: str) -> str | None:
    """The grade asked for, or None for every grade."""
    match = _GRADE_RE.search(text)
    if not match:
        return None
    word = match.group(1).lower().replace(" ", "_")
    if word in ("confirmed", "verified", "research_grade"):
        word = "research"
    return word if word in QUALITY_GRADES else None


def unknown_place_from_text(text: str) -> str | None:
    """A place name this server does not know, so the answer can name it back."""
    match = _PLACE_PHRASE_RE.search(text)
    if not match:
        return None
    words = match.group(1).strip(" .,?!").split()
    while words and words[-1].lower() in _STOP_TAIL_WORDS:
        words.pop()
    if not words:
        return None
    return " ".join(words).lower()


def parse(message: dict) -> dict:
    """Incoming message -> {skill, params, explicit}. Never raises."""
    text = message_text(message)
    data = message_data(message)
    requested = _first(data, "skill", "skill_id")

    taxon = _first(data, "taxon", "taxon_name", "species", "name")
    if taxon is None:
        taxon = taxon_from_text(text)
    point = _first(data, "point", "location")
    if point is None:
        match = _POINT_RE.search(text)
        if match:
            point = f"{match.group(1)},{match.group(2)}"
    place = None
    if point is None:
        place = place_from_text(text)
        if place:
            point = point_from_place(place)
        elif _NEAR_RE.search(text):
            place = unknown_place_from_text(text)
    radius = _first(data, "radius_km", "radius")
    if radius is None:
        radius = radius_from_text(text)
    grade = _first(data, "grade", "quality", "quality_grade")
    if grade is None:
        grade = grade_from_text(text)
    limit = _first(data, "limit", default=5)

    if requested in (SKILL_COUNT, SKILL_RECENT, SKILL_NEARBY, SKILL_INFO, SKILL_SURVEY):
        skill = requested
    elif _SURVEY_RE.search(text):
        skill = SKILL_SURVEY
    elif _NEAR_RE.search(text) and point is not None:
        skill = SKILL_NEARBY
    elif _COUNT_RE.search(text):
        skill = SKILL_COUNT
    elif _INFO_RE.search(text):
        skill = SKILL_INFO
    else:
        skill = SKILL_RECENT

    params: dict = {"limit": limit}
    for key, value in (("taxon", taxon), ("point", point), ("place", place),
                       ("radius_km", radius), ("grade", grade)):
        if value is not None:
            params[key] = value
    if skill == SKILL_NEARBY:
        params.setdefault("radius_km", 10)
    if skill == SKILL_SURVEY:
        params["limit"] = 1

    if not requested and (not text.strip()
                          or re.search(r"\b(help|what can you do|commands?)\b", text, re.IGNORECASE)):
        skill, params = "help", {}
    explicit = bool(requested or _SURVEY_RE.search(text) or _COUNT_RE.search(text)
                    or _NEAR_RE.search(text) or _INFO_RE.search(text) or taxon)
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
    "I read iNaturalist's public observation records (keyless). Ask me:\n"
    "  • how many monarch butterflies are there?\n"
    "  • recent sightings of Danaus plexippus\n"
    "  • what has been seen near 40.71,-74.01 within 10 km?\n"
    "  • what is a red fox?\n"
    "  • give me an overview of the monarch butterfly records\n"
    "Every count says which grade it counted: `research` is community-confirmed to species "
    "level, `needs_id` is still waiting for identifiers. These are uploaded observations, not "
    "a population census - most wildlife is never recorded at all."
)

CARD_SKILLS = [
    {
        "id": SKILL_COUNT,
        "name": "Count a species",
        "description": (
            "How many iNaturalist observations carry a common or scientific name, with one "
            "newest record as a sample. The count is reported for the grade asked for, and says "
            "which grade that was, because a community-confirmed record and a sighting still "
            "awaiting identification are not the same thing."
        ),
        "tags": ["inaturalist", "biodiversity", "count", "observations", "species"],
        "examples": [
            "how many monarch butterflies are there?",
            "count the observations of red fox",
            '{"skill": "species-count", "taxon": "Danaus plexippus", "grade": "research"}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_RECENT,
        "name": "Recent sightings",
        "description": (
            "The newest observations recorded under a name, each with its date, place, observer "
            "and grade. A grade is carried on every row rather than averaged away."
        ),
        "tags": ["inaturalist", "biodiversity", "sightings", "recent"],
        "examples": [
            "recent sightings of Danaus plexippus",
            "the latest red fox records",
            '{"skill": "recent-sightings", "taxon": "Vulpes vulpes", "limit": 5}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_NEARBY,
        "name": "What is around a point",
        "description": (
            "What has been recorded within a radius of a latitude/longitude point or a metro "
            "name, newest first, optionally filtered to one species. Positions iNaturalist has "
            "obscured are flagged on the row rather than passed off as the real place."
        ),
        "tags": ["inaturalist", "biodiversity", "nearby", "point", "geography"],
        "examples": [
            "what has been seen near 40.71,-74.01 within 10 km?",
            "any observations around London?",
            '{"skill": "nearby-observations", "point": "40.7128,-74.0060", "radius_km": 5}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_INFO,
        "name": "Look up a taxon",
        "description": (
            "One taxon's own record from iNaturalist's taxonomy: its scientific and common "
            "name, rank, how many observations are on file, its conservation status and its "
            "Wikipedia link. Says plainly when the name matched a taxon exactly and how many "
            "other taxa came back for the same query."
        ),
        "tags": ["inaturalist", "taxonomy", "lookup", "species", "conservation"],
        "examples": [
            "what is a red fox?",
            "tell me about Danaus plexippus",
            '{"skill": "species-info", "taxon": "Vulpes vulpes"}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_SURVEY,
        "name": "Range survey",
        "description": (
            "One name's records read as a picture rather than a list: how many observations, "
            "how they divide by year and by calendar month, how many carry each grade, the "
            "places and countries they name, and how many rows carried a usable position. "
            "Premium: it pages through the observations on a hosted service that was removed, "
            "which is where the reading and counting happen."
        ),
        "tags": ["inaturalist", "biodiversity", "survey", "seasonality",],
        "examples": [
            "give me an overview of the monarch butterfly records",
            "how do the red fox observations break down by month?",
            '{"skill": "range-survey", "taxon": "Danaus plexippus"}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
]

_GRADE_NOTE = (
    "`research` grade is community-confirmed to species level; `needs_id` is a sighting still "
    "waiting for identifiers. They are counted separately here, never added together."
)


def _artifact(client: SpeciesClient, **extra) -> dict:
    artifact = {
        "dataset": DATASET,
        "product": PRODUCT,
        "source": SOURCE,
        "freshness": client.freshness(),
    }
    artifact.update(extra)
    return artifact


def _name(row: dict) -> str:
    common, scientific = row.get("common_name"), row.get("taxon")
    if common and scientific:
        return f"{common} ({scientific})"
    return common or scientific or "unidentified observation"


def _row_line(row: dict) -> str:
    obscured = " (position obscured)" if row.get("coordinates_obscured") else ""
    return (f"  • {row.get('observed_on')} - {_name(row)} at "
            f"{row.get('place') or 'no place given'}{obscured} "
            f"({row.get('quality_grade') or 'ungraded'}, by {row.get('observer') or 'anonymous'})")


def _needs_taxon(params: dict) -> dict | None:
    if params.get("taxon"):
        return None
    return {
        "final_state": "input-required",
        "message": (
            "Which species? Give me a common name (monarch butterfly, red fox) or a scientific "
            "one (Danaus plexippus, Vulpes vulpes)."
        ),
        "artifact": None,
        "watch": None,
    }


def run_count(params: dict, client: SpeciesClient) -> dict:
    missing = _needs_taxon(params)
    if missing:
        return missing
    try:
        result = client.count(params["taxon"], params.get("grade"))
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc),
                "artifact": None, "watch": None}
    artifact = _artifact(client, taxon=result["taxon"], grade=result["grade"],
                         total=result["total"], sample=result["sample"])
    if not result["total"]:
        return {
            "final_state": "completed",
            "message": (
                f"iNaturalist holds no observation of “{result['taxon']}” at that grade. That is "
                "an empty result and not an error - the name may be misspelled, or it may be a "
                f"species nobody has uploaded yet.\nSource: {DATASET} (read live)."
            ),
            "artifact": artifact,
            "watch": None,
        }
    grade_word = "at any grade" if result["grade"] == "any" else f"graded {result['grade']}"
    lines = [f"iNaturalist holds {result['total']:,} observations of {result['taxon']} "
             f"({grade_word})."]
    sample = result.get("sample")
    if sample:
        lines.append(f"The newest on file: {sample.get('observed_on')} at "
                     f"{sample.get('place') or 'no place given'} "
                     f"({sample.get('quality_grade') or 'ungraded'}).")
    lines.append(
        f"\nSource: {DATASET} (read live). {_GRADE_NOTE} These are uploaded observations, not a "
        "population estimate - most wildlife is never recorded at all."
    )
    return {"final_state": "completed", "message": "\n".join(lines),
            "artifact": artifact, "watch": None}


def run_recent(params: dict, client: SpeciesClient) -> dict:
    missing = _needs_taxon(params)
    if missing:
        return missing
    try:
        result = client.recent(params["taxon"], params.get("limit", 5), params.get("grade"))
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc),
                "artifact": None, "watch": None}
    artifact = _artifact(client, taxon=result["taxon"], grade=result["grade"],
                         total=result["total"], rows=result["rows"], count=len(result["rows"]))
    if not result["rows"]:
        return {
            "final_state": "completed",
            "message": (
                f"No observation of “{result['taxon']}” came back at that grade.\n"
                f"Source: {DATASET} (read live)."
            ),
            "artifact": artifact,
            "watch": None,
        }
    grade_word = "at any grade" if result["grade"] == "any" else f"graded {result['grade']}"
    listing = "\n".join(_row_line(row) for row in result["rows"])
    return {
        "final_state": "completed",
        "message": (
            f"Latest iNaturalist observations of {result['taxon']} "
            f"({result['total']:,} on file, {grade_word}):\n{listing}\n"
            f"Source: {DATASET} (read live). {_GRADE_NOTE}"
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_nearby(params: dict, client: SpeciesClient) -> dict:
    if not params.get("point"):
        if params.get("place"):
            return {
                "final_state": "input-required",
                "message": (
                    f"I do not know the place “{params['place']}”, so I will not guess coordinates "
                    "for it. Give me a latitude/longitude point like 40.71,-74.01, or a metro "
                    "from my list (New York, London, Nairobi, Sydney, Tokyo and others)."
                ),
                "artifact": None,
                "watch": None,
            }
        return {
            "final_state": "input-required",
            "message": (
                "Which point should I look around? Give me a latitude/longitude pair like "
                "40.71,-74.01, or a metro name from my list."
            ),
            "artifact": None,
            "watch": None,
        }
    try:
        result = client.nearby(params["point"], params.get("radius_km", 10),
                               params.get("limit", 5), params.get("taxon"),
                               params.get("grade"))
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc),
                "artifact": None, "watch": None}
    artifact = _artifact(client, point=result["point"], radius_km=result["radius_km"],
                         taxon=result["taxon"], grade=result["grade"], total=result["total"],
                         rows=result["rows"], count=len(result["rows"]))
    label = f" within {result['radius_km']} km of {result['point']}"
    if result.get("taxon"):
        label += f" for {result['taxon']}"
    if not result["rows"]:
        return {
            "final_state": "completed",
            "message": (
                f"iNaturalist has no observation{label}.\nSource: {DATASET} (read live). A "
                "quiet window is an empty result, not a failure."
            ),
            "artifact": artifact,
            "watch": None,
        }
    listing = "\n".join(_row_line(row) for row in result["rows"])
    return {
        "final_state": "completed",
        "message": (
            f"iNaturalist observations{label} ({result['total']:,} on file, newest first):\n"
            f"{listing}\n"
            f"Source: {DATASET} (read live). The window is capped at {MAX_RADIUS_KM} km because "
            "this is a public API, and a wider circle is a bigger page rather than a different "
            "answer."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_info(params: dict, client: SpeciesClient) -> dict:
    missing = _needs_taxon(params)
    if missing:
        return missing
    try:
        record = client.taxon(params["taxon"])
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc),
                "artifact": None, "watch": None}
    if record is None:
        return {
            "final_state": "completed",
            "message": (
                f"iNaturalist's taxonomy has no taxon for “{params['taxon']}”.\n"
                f"Source: api.inaturalist.org/v1/taxa (read live)."
            ),
            "artifact": _artifact(client, taxon=params["taxon"], found=False),
            "watch": None,
        }
    artifact = _artifact(client, taxon=record["name"], common_name=record["common_name"],
                         rank=record["rank"], observations_count=record["observations_count"],
                         conservation_status=record["conservation_status"],
                         exact_match=record["exact_match"], other_matches=record["other_matches"])
    label = record["common_name"] or record["name"]
    lines = [
        f"{label} — {record['name']} (rank: {record['rank'] or 'not reported'})",
        f"  • {record['observations_count']:,} observation(s) on file"
        if isinstance(record["observations_count"], int)
        else "  • observation count not reported",
        f"  • conservation status: "
        f"{record['conservation_status'] or 'iNaturalist publishes none for this taxon'}",
    ]
    if record.get("wikipedia_url"):
        lines.append(f"  • {record['wikipedia_url']}")
    note = ""
    if not record["exact_match"]:
        note = (f"\nThe name you gave did not match this taxon exactly, so this is the closest "
                f"result iNaturalist returned for “{record['query']}”.")
    if record.get("other_matches"):
        note += (f"\n{record['other_matches']} other taxon(s) came back for that query - a name "
                 "can belong to a species and to a subspecies of it.")
    if record.get("wikipedia_summary"):
        summary = record["wikipedia_summary"].strip().split("\n")[0]
        if len(summary) > 400:
            summary = summary[:400].rsplit(" ", 1)[0] + "..."
        note += f"\n\n{summary}"
    return {
        "final_state": "completed",
        "message": "\n".join(lines) + note
        + "\n\nSource: api.inaturalist.org/v1/taxa (read live). A rank is the taxon's place in "
          "the tree, and an observation count is how many have been uploaded, not how many exist.",
        "artifact": artifact,
        "watch": None,
    }


def run_survey(params: dict, client: SpeciesClient, gateway: object) -> dict:
    """Stub: the hosted implementation of this skill was removed in the paywall cleanup."""
    return {
        "final_state": "completed",
        "message": 'Not yet implemented: survey — its hosted implementation was removed.',
        "artifact": {"removed": True},
        "watch": None,
    }


class SpeciesAgent(SkillAgent):
    name = "inaturalist-species"
    card_name = "iNaturalist Species Agent"
    card_description = (
        "Read-only agent over iNaturalist's public observation records: how many observations "
        "carry a species name, the newest sightings, what has been recorded within a radius of a "
        "point, and a taxon's own taxonomy record - plus a premium skill that reads a name's "
        "records as a picture, by year, month, grade and place. Counts are per grade, because a "
        "community-confirmed record and a sighting awaiting identification are not the same "
        "thing, and a row says when iNaturalist obscured its position."
    )
    env_prefix = "SPECIES"
    datasets = (DATASET,)
    card_skills = CARD_SKILLS

    def __init__(self, client: SpeciesClient | None = None,
                 gateway: object | None = None) -> None:
        self.client = client or SpeciesClient()
        self.gateway = gateway

    def parse(self, message: dict) -> dict:
        return parse(message)

    def missing(self, skill: str, params: dict) -> list[str]:
        if skill == SKILL_NEARBY and not params.get("point"):
            return ["point"]
        if skill in (SKILL_COUNT, SKILL_RECENT, SKILL_INFO, SKILL_SURVEY) and not params.get("taxon"):
            return ["taxon"]
        return []

    def input_prompt(self, skill: str, missing: list[str]) -> str:
        if "point" in missing:
            return ("Which point should I look around? Give me a latitude/longitude pair like "
                    "40.71,-74.01, or a metro name from my list (New York, London, Nairobi, Sydney, "
                    "Tokyo and others).")
        return ("Which species? Give me a common name (monarch butterfly, red fox) or a scientific "
                "one (Danaus plexippus, Vulpes vulpes).")

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
            if skill == SKILL_SURVEY:
                return run_survey(params, self.client, self.gateway)
            if skill == SKILL_COUNT:
                return run_count(params, self.client)
            if skill == SKILL_RECENT:
                return run_recent(params, self.client)
            if skill == SKILL_NEARBY:
                return run_nearby(params, self.client)
            if skill == SKILL_INFO:
                return run_info(params, self.client)
        except UpstreamError as exc:
            return {
                "final_state": "failed",
                "message": f"iNaturalist could not be read: {exc}",
                "artifact": {"dataset": DATASET},
                "watch": None,
            }
        return {"final_state": "completed", "message": HELP, "artifact": None, "watch": None}


__all__ = [
    "CARD_SKILLS",
    "GATEWAY_TOOL",
    "HELP",
    "MAX_LIMIT",
    "SKILL_COUNT",
    "SKILL_INFO",
    "SKILL_NEARBY",
    "SKILL_RECENT",
    "SKILL_SURVEY",
    "SpeciesAgent",
    "UpstreamError",
    "grade_from_text",
    "message_data",
    "message_text",
    "parse",
    "radius_from_text",
    "run_count",
    "run_info",
    "run_nearby",
    "run_recent",
    "run_survey",
    "taxon_from_text",
]
