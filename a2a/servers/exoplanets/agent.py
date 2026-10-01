"""The exoplanet-catalog agent: five skills over the NASA Exoplanet Archive.

  - planet-lookup:    one planet by name, with every published parameter
  - system-planets:   every known planet around one star
  - planet-search:    find planets by host, discovery method, or discovery years
  - planet-extremes:  the biggest, smallest, hottest, closest, by one parameter
  - catalogue-survey: the whole catalogue as a picture (premium)

Premium: `catalogue-survey` runs on the licence gateway. Reading the composite
table is about half a megabyte of JSON and the counting across all of it is the
work, so that happens there behind the licence check. Every other skill asks the
archive one bounded question and stays free.

A note on missing numbers: the archive publishes one row per planet with the best
value it has for each parameter, and an unpublished parameter is blank rather
than absent. So a blank here means "not reported", never "zero", and a planet
found by direct imaging usually has no equilibrium temperature at all.
"""

from __future__ import annotations

import re

from a2a_kit import GatewayClient, SkillAgent, empty_premium_answer, premium_call

from data import (
    DATASET,
    DISCOVERY_METHODS,
    FULL_TABLE_ROWS,
    HABITABLE_ZONE_INSOL,
    ExoplanetClient,
    UpstreamError,
)

SKILL_PLANET = "planet-lookup"
SKILL_SYSTEM = "system-planets"
SKILL_SEARCH = "planet-search"
SKILL_EXTREMES = "planet-extremes"
SKILL_SURVEY = "catalogue-survey"

#: The gateway tool that does the premium work. Same name here and on the gateway.
GATEWAY_TOOL = "a2a_exoplanets_survey"

SOURCE = "NASA Exoplanet Archive, Planetary Systems Composite Parameters (pscomppars)"
PRODUCT = "NASA Exoplanet Archive planetary systems"

#: Parameter names a caller may ask for the extremes of, with how to say them.
EXTREME_PARAMS = {
    "radius": "pl_rade", "size": "pl_rade", "big": "pl_rade", "biggest": "pl_rade",
    "large": "pl_rade", "largest": "pl_rade", "small": "pl_rade", "smallest": "pl_rade",
    "tiniest": "pl_rade",
    "mass": "pl_bmasse", "heavy": "pl_bmasse", "heaviest": "pl_bmasse",
    "light": "pl_bmasse", "lightest": "pl_bmasse", "massive": "pl_bmasse",
    "temperature": "pl_eqt", "hot": "pl_eqt", "hotter": "pl_eqt", "hottest": "pl_eqt",
    "cool": "pl_eqt", "coolest": "pl_eqt", "coldest": "pl_eqt",
    "period": "pl_orbper", "short": "pl_orbper", "shortest": "pl_orbper",
    "long": "pl_orbper", "longest": "pl_orbper", "year": "pl_orbper",
    "distance": "sy_dist", "close": "sy_dist", "closest": "sy_dist", "near": "sy_dist",
    "nearest": "sy_dist", "far": "sy_dist", "farthest": "sy_dist", "distant": "sy_dist",
    "insolation": "pl_insol", "orbit": "pl_orbsmax", "star": "st_teff",
}
#: Words that mean "biggest/hottest/most" rather than "smallest".
BIG_WORDS = re.compile(
    r"\b(biggest|largest|hottest|most massive|heaviest|longest|farthest|most distant|"
    r"largest|most)\b",
    re.IGNORECASE,
)
SMALL_WORDS = re.compile(
    r"\b(smallest|tiniest|coolest|coldest|lightest|shortest|nearest|closest|least|small)\b",
    re.IGNORECASE,
)
_SYSTEM_RE = re.compile(r"\b(?:system|around|planets? (?:around|orbiting)|host star|"
                        r"constellation)\b", re.IGNORECASE)
#: Archive names come in two shapes and this reads both:
#:   a planet  "TRAPPIST-1 e", "Kepler-22 b", "HD 209458 b"  - a host then one letter
#:   a host    "TRAPPIST-1", "Kepler-22", "HD 209458", "55 Cnc"
#: Both need a digit. That is what keeps ordinary question words out: a token run
#: without one is prose, not a catalogue name.
_PLANET_NAME_RE = re.compile(
    r"\b((?:[A-Za-z0-9][A-Za-z0-9.+'\-]*[ \t]+){0,3}[A-Za-z0-9][A-Za-z0-9.+'\-]*[ \t]+([A-Za-z]))\b"
)
_HOST_NAME_RE = re.compile(
    r"\b([A-Za-z0-9][A-Za-z0-9.+'\-]*(?:[ \t]+[A-Za-z0-9][A-Za-z0-9.+'\-]*){0,2})\b"
)


_SURVEY_RE = re.compile(
    r"\b(survey|breakdown|overview|whole catalogue|full catalogue|all of them|distribution|"
    r"how many (?:planets|stars|systems)|by method|by decade|summary|statistics|stats|"
    r"catalogue as a whole|generally|overall)\b",
    re.IGNORECASE,
)
_SEARCH_RE = re.compile(
    r"\b(discovered (?:in|by|between)|discovery (?:method|year)|found (?:in|by|between)|"
    r"which planets?|list planets?|search|how many planets?|transit|radial velocity|"
    r"microlensing)\b",
    re.IGNORECASE,
)
_EXTREMES_RE = re.compile(
    r"\b(biggest|largest|smallest|tiniest|hottest|coolest|coldest|most massive|lightest|"
    r"longest|shortest|nearest|closest|farthest|extremes?|record)\b",
    re.IGNORECASE,
)
_TYPE_RE = re.compile(rf"\b({'|'.join(m.lower() for m in DISCOVERY_METHODS)})\b", re.IGNORECASE)
_YEARS_RE = re.compile(r"\b(\d{4})\s*[-\u2013]\s*(\d{4})\b")


def planet_name_from_text(text: str) -> str | None:
    """A planet name out of the question: a host followed by a single letter.

    Only the planet shape is read here. A bare host is the system skill's job,
    and a host that happens to end in a letter - "55 Cnc e" - is the only thing
    that makes the trailing token part of a name rather than a question word.
    """
    for match in _PLANET_NAME_RE.finditer(text):
        candidate = match.group(1).strip(" .,'\u2019\"")
        letter = match.group(2)
        # "look up TRAPPIST-1 e" is a sentence with a name in it, so the run of
        # question words in front of the name is dropped rather than kept.
        words = candidate.split()
        while words and words[0].lower() in _STOPWORDS:
            words.pop(0)
        while words and words[-1].lower() in _STOPWORDS and len(words) > 1:
            words.pop()
        candidate = " ".join(words)
        if not candidate:
            continue
        host_part = candidate[: candidate.rfind(letter)].strip()
        if len(candidate) > 40 or len(host_part.split()) > 4 or not host_part:
            continue
        # A host must carry a digit; without one this is just a word ending in
        # a letter, which is most of English.
        if not re.search(r"\d", host_part):
            continue
        if letter.lower() in _STOPWORDS:
            continue
        return candidate
    return None


def host_name_from_text(text: str) -> str | None:
    """A bare host name out of the question, such as TRAPPIST-1 or HD 209458.

    The planet spans are blanked first, so "TRAPPIST-1 e" leaves TRAPPIST-1 for
    this and the letter does not get mistaken for part of the host.
    """
    residue = _PLANET_NAME_RE.sub(" ", text)
    for match in _HOST_NAME_RE.finditer(residue):
        words = match.group(1).strip(" .,'\u2019\"").split()
        # Same trimming as the planet name: "the TRAPPIST-1 system" is a
        # sentence, and TRAPPIST-1 is the host inside it.
        while words and words[0].lower() in _STOPWORDS:
            words.pop(0)
        while words and words[-1].lower() in _STOPWORDS and len(words) > 1:
            words.pop()
        candidate = " ".join(words)
        if not 2 <= len(candidate) <= 40 or len(candidate.split()) > 3:
            continue
        if not re.search(r"\d", candidate):
            continue
        # A year range is digits and a dash, not a host: "discovered in 2015-2016"
        # must not become a hostname filter that matches nothing.
        if not re.search(r"[A-Za-z]", candidate):
            continue
        return candidate
    return None


_STOPWORDS = {
    "what", "which", "who", "how", "when", "where", "look", "up", "tell", "me", "about",
    "the", "is", "are", "a", "an", "of", "in", "on", "for", "to", "and", "or", "give",
    "show", "list", "find", "planets", "planet", "exoplanets", "exoplanet", "any", "do",
    "does", "i", "it", "has", "have", "many", "much", "known", "biggest", "largest",
    "smallest", "hottest", "closest", "nearest", "farthest", "hottest", "coolest",
    "shortest", "longest", "most", "least", "survey", "overview", "catalogue", "stars",
    "system", "systems", "around", "orbit", "orbits", "orbiting",
    "discovered", "discover", "found", "find", "search", "list", "show", "tell",
    "were", "was", "been", "between", "and", "with", "any", "there", "them",
    "nearest", "closest", "farthest", "largest", "smallest", "biggest", "hottest",
    "shortest", "longest", "most", "least", "by", "during", "since", "before",
}


def extreme_column(text: str, order: str | None = None) -> tuple[str, str] | None:
    """(archive column, 'asc' or 'desc') for an extremes question, or None."""
    lowered = text.lower()
    for word, column in EXTREME_PARAMS.items():
        if re.search(rf"\b{re.escape(word)}\b", lowered):
            if order in ("asc", "desc"):
                direction = order
            elif SMALL_WORDS.search(lowered):
                direction = "asc"
            else:
                direction = "desc"
            return column, direction
    if _EXTREMES_RE.search(text) and order in ("asc", "desc"):
        return "pl_rade", order
    return None


def parse(message: dict) -> dict:
    """Incoming message -> {skill, params, explicit}. Never raises."""
    text = message_text(message)
    data = message_data(message)
    requested = _first(data, "skill", "skill_id")

    planet = _first(data, "planet", "planet_name", "name")
    if planet is None:
        planet = planet_name_from_text(text)
    host = _first(data, "host", "hostname", "system", "star")
    if host is None:
        host = host_name_from_text(text)
    method = _first(data, "method", "discovery_method", "discovery")
    if method is None:
        match = _TYPE_RE.search(text)
        if match:
            method = match.group(1)
    years = _first(data, "years", "year_range", "discovered")
    if years is None:
        match = _YEARS_RE.search(text)
        if match:
            years = f"{match.group(1)}-{match.group(2)}"
    order = _first(data, "order", "direction")
    if order in ("smallest", "ascending", "low"):
        order = "asc"
    elif order in ("largest", "descending", "high", "biggest", "hottest"):
        order = "desc"
    if order not in ("asc", "desc"):
        order = None
    limit = _first(data, "limit", default=10)

    # An extremes question is one that names a parameter to rank by. "Orbit" on
    # its own is not that - "what planets orbit TRAPPIST-1" is a system question -
    # so a parameter has to arrive with an extremes word, or be named outright.
    column, direction = None, order
    named = _first(data, "parameter", "extreme")
    if named is not None and str(named).lower() in EXTREME_PARAMS:
        column = EXTREME_PARAMS[str(named).lower()]
        direction = direction or "desc"
    elif _EXTREMES_RE.search(text):
        found = extreme_column(text, order)
        if found:
            column, direction = found

    if requested in (SKILL_PLANET, SKILL_SYSTEM, SKILL_SEARCH, SKILL_EXTREMES, SKILL_SURVEY):
        skill = requested
    elif column is not None:
        skill = SKILL_EXTREMES
    elif method or years:
        skill = SKILL_SEARCH
    elif planet:
        skill = SKILL_PLANET
    elif host or _SYSTEM_RE.search(text):
        skill = SKILL_SYSTEM
    else:
        # Nothing more specific was asked for, so the catalogue-wide question is
        # the only one left that has an answer.
        skill = SKILL_SURVEY

    params: dict = {"limit": limit}
    for key, value in (("planet", planet), ("host", host), ("method", method),
                       ("years", years), ("column", column), ("direction", direction)):
        if value is not None:
            params[key] = value
    if skill == SKILL_EXTREMES:
        params.setdefault("column", "pl_rade")
        params.setdefault("direction", "desc")
    if skill == SKILL_SURVEY:
        params["limit"] = 1

    if not requested and (not text.strip()
                          or re.search(r"\b(help|what can you do|commands?)\b", text, re.IGNORECASE)):
        skill, params = "help", {}
    explicit = bool(requested or _SURVEY_RE.search(text) or _EXTREMES_RE.search(text)
                    or _SEARCH_RE.search(text) or _SYSTEM_RE.search(text) or planet or host)
    return {"skill": skill, "params": params, "explicit": explicit}


# -- shared shape ---------------------------------------------------------

_UNITS = {
    "orbital_period_days": "day", "radius_earth": "Earth radii", "mass_earth": "Earth masses",
    "temperature_k": "K", "semi_major_axis_au": "AU", "eccentricity": "",
    "insolation_earth": "Earth insolation", "distance_pc": "parsecs",
    "star_temperature_k": "K", "star_radius_solar": "solar radii", "star_mass_solar": "solar masses",
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


HELP = (
    "I read the NASA Exoplanet Archive's composite table, one row per planet with the best "
    "published value for each parameter. Ask me:\n"
    "  • look up TRAPPIST-1 e\n"
    "  • what planets orbit TRAPPIST-1?\n"
    "  • which planets were discovered in 2015-2016?\n"
    "  • what is the largest exoplanet?\n"
    "  • give me an overview of the exoplanet catalogue\n"
    "An unpublished parameter is reported as not published, never as zero - a planet found by "
    "imaging usually has no equilibrium temperature, and the archive does not invent one."
)

CARD_SKILLS = [
    {
        "id": SKILL_PLANET,
        "name": "Look up a planet",
        "description": (
            "One exoplanet by its archive name, with every parameter the archive publishes: "
            "orbital period, radius and mass in Earth units, equilibrium temperature, distance from "
            "its star, eccentricity, insolation, its star's spectral type and mass, how and when it "
            "was found. An unpublished value is reported as not published, never as zero."
        ),
        "tags": ["exoplanets", "nasa", "planet", "lookup", "catalogue"],
        "examples": [
            "look up TRAPPIST-1 e",
            "what is Kepler-22 b?",
            '{"skill": "planet-lookup", "planet": "TRAPPIST-1 e"}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_SYSTEM,
        "name": "Planets around one star",
        "description": (
            "Every planet the archive knows around one host star, in planet-letter order, with each "
            "planet's period, radius, mass, temperature and insolation, and the star's own spectral "
            "type and temperature."
        ),
        "tags": ["exoplanets", "nasa", "system", "host", "star"],
        "examples": [
            "what planets orbit TRAPPIST-1?",
            "the Kepler-22 system",
            '{"skill": "system-planets", "host": "TRAPPIST-1"}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_SEARCH,
        "name": "Search the catalogue",
        "description": (
            "Find planets by host star, by discovery method such as transit or radial velocity, or by "
            "a range of discovery years, newest first. Answers with a bounded page and says when "
            "there were more matches than it returned."
        ),
        "tags": ["exoplanets", "nasa", "search", "discovery", "catalogue"],
        "examples": [
            "which planets were discovered in 2015-2016?",
            "planets found by radial velocity",
            '{"skill": "planet-search", "method": "Transit", "limit": 10}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_EXTREMES,
        "name": "Extreme planets",
        "description": (
            "The extremes of one published parameter: the largest or smallest planets by radius, the "
            "hottest or coolest by equilibrium temperature, the nearest or farthest by distance, the "
            "shortest or longest orbital period, the most or least massive. Only planets with a "
            "published value for that parameter are considered."
        ),
        "tags": ["exoplanets", "nasa", "extremes", "records", "ranking"],
        "examples": [
            "what is the largest exoplanet?",
            "the hottest known planets",
            '{"skill": "planet-extremes", "parameter": "period", "order": "smallest", "limit": 5}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_SURVEY,
        "name": "Catalogue survey",
        "description": (
            "The whole catalogue read as a picture rather than a list: how many planets and how many "
            "systems, how they divide by discovery method and by decade, how many sit in a rough "
            "habitable band, and the extremes that hold the records. Premium: it runs behind a "
            "licence check on the gateway, which does the full-table read and the counting."
        ),
        "tags": ["exoplanets", "nasa", "survey", "statistics", "catalogue", "premium"],
        "examples": [
            "give me an overview of the exoplanet catalogue",
            "how many exoplanets are there and how were they found?",
            '{"skill": "catalogue-survey"}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
]

#: Archive column to the unit a reader should print it in.
_UNITS = {
    "orbital_period_days": "day", "radius_earth": "Earth radii", "mass_earth": "Earth masses",
    "temperature_k": "K", "semi_major_axis_au": "AU", "eccentricity": "",
    "insolation_earth": "Earth insolation", "distance_pc": "parsecs",
    "star_temperature_k": "K", "star_radius_solar": "solar radii", "star_mass_solar": "solar masses",
}

def _artifact(params: dict, client: ExoplanetClient, **extra) -> dict:
    artifact = {
        "dataset": DATASET,
        "product": PRODUCT,
        "source": SOURCE,
        "freshness": client.freshness(),
    }
    artifact.update(extra)
    return artifact


def _value(value, key: str) -> str:
    """A published value with its unit, or `not published`."""
    if value is None:
        return "not published"
    unit = _UNITS.get(key)
    return f"{value} {unit}".strip()


def _planet_line(planet: dict) -> str:
    return (
        f"  • {planet.get('planet')} — period {_value(planet.get('orbital_period_days'), 'orbital_period_days')}, "
        f"radius {_value(planet.get('radius_earth'), 'radius_earth')}, "
        f"mass {_value(planet.get('mass_earth'), 'mass_earth')}, "
        f"temperature {_value(planet.get('temperature_k'), 'temperature_k')}, "
        f"insolation {_value(planet.get('insolation_earth'), 'insolation_earth')}, "
        f"distance {_value(planet.get('distance_pc'), 'distance_pc')}"
    )


# -- skills ---------------------------------------------------------------

def run_planet(params: dict, client: ExoplanetClient) -> dict:
    name = params.get("planet")
    if not name:
        return {
            "final_state": "input-required",
            "message": (
                "Which planet? Give me its archive name, for example TRAPPIST-1 e or Kepler-22 b, "
                "or a host star name to see everything around it."
            ),
            "artifact": None,
            "watch": None,
        }
    try:
        name = client.check_name(name)
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    planet = client.planet(name)
    artifact = _artifact(params, client, planet=planet, query=name)
    if planet is None:
        return {
            "final_state": "completed",
            "message": (
                f"The Exoplanet Archive has no planet called “{name}”. Names carry a host and a "
                "letter, like TRAPPIST-1 e or Kepler-22 b, and the host alone is not a planet. "
                f"(Read live from {DATASET}.)"
            ),
            "artifact": artifact,
            "watch": None,
        }
    lines = [
        f"  • host {planet.get('host')}, planet letter {planet.get('planet_letter') or 'not published'}"
        f", {planet.get('planets_in_system')} planet(s) in that system",
        f"  • orbital period {_value(planet.get('orbital_period_days'), 'orbital_period_days')}, "
        f"semi-major axis {_value(planet.get('semi_major_axis_au'), 'semi_major_axis_au')}, "
        f"eccentricity {_value(planet.get('eccentricity'), 'eccentricity')}",
        f"  • radius {_value(planet.get('radius_earth'), 'radius_earth')}, "
        f"mass {_value(planet.get('mass_earth'), 'mass_earth')}, "
        f"temperature {_value(planet.get('temperature_k'), 'temperature_k')}, "
        f"insolation {_value(planet.get('insolation_earth'), 'insolation_earth')}",
        f"  • distance {_value(planet.get('distance_pc'), 'distance_pc')}",
        f"  • star {planet.get('star_spectral_type') or 'spectral type not published'}, "
        f"{_value(planet.get('star_temperature_k'), 'star_temperature_k')}, "
        f"{_value(planet.get('star_mass_solar'), 'star_mass_solar')}, "
        f"{_value(planet.get('star_radius_solar'), 'star_radius_solar')}",
        f"  • found by {planet.get('discovery_method') or 'method not reported'} in "
        f"{planet.get('discovery_year') or 'year not reported'}"
        + (f" at {planet['discovery_facility']}" if planet.get("discovery_facility") else "")
        + (f", published {planet['discovery_published']}" if planet.get("discovery_published") else ""),
    ]
    blank = planet.get("reported_fields", 4) < 4
    note = ""
    if blank:
        note = ("\nSome parameters are not published for this planet, which is normal: a blank in "
                "the archive means nobody has published a value, not zero.")
    return {
        "final_state": "completed",
        "message": (f"{planet.get('planet')}:\n" + "\n".join(lines) + note
                    + f"\nSource: {DATASET} (read live)."),
        "artifact": artifact,
        "watch": None,
    }


def run_system(params: dict, client: ExoplanetClient) -> dict:
    host = params.get("host")
    if not host:
        return {
            "final_state": "input-required",
            "message": (
                "Which star? Give me a host name, for example TRAPPIST-1 or Kepler-22, or a planet "
                "name and I will show the system around it."
            ),
            "artifact": None,
            "watch": None,
        }
    try:
        host = client.check_name(host)
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    planets = client.system(host, limit=params.get("limit", 100))
    artifact = _artifact(params, client, host=host, planets=planets, count=len(planets))
    if not planets:
        return {
            "final_state": "completed",
            "message": (
                f"The Exoplanet Archive has no planet around “{host}”. Host names look like "
                "TRAPPIST-1, Kepler-22 or HD 209458. (Read live from " + DATASET + ".)"
            ),
            "artifact": artifact,
            "watch": None,
        }
    first = planets[0]
    listing = "\n".join(_planet_line(planet) for planet in planets)
    kinds = [planet.get("discovery_method") for planet in planets
             if planet.get("discovery_method")]
    return {
        "final_state": "completed",
        "message": (
            f"{len(planets)} planet(s) around {host} ({first.get('star_spectral_type') or 'spectral type not published'}, "
            f"{_value(first.get('distance_pc'), 'distance_pc')} away):\n{listing}\n"
            f"Found by {', '.join(sorted(set(kinds)))}.\nSource: {DATASET} (read live)."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_search(params: dict, client: ExoplanetClient) -> dict:
    try:
        result = client.search(host=params.get("host"), method=params.get("method"),
                               years=params.get("years"), limit=params.get("limit", 20))
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    planets = result["planets"]
    artifact = _artifact(params, client, planets=planets, matched=result["matched"],
                         limit=result["limit"], truncated=result["truncated"])
    if not planets:
        return {
            "final_state": "completed",
            "message": (
                "No planet in the archive matches that. Discovery methods are "
                f"{', '.join(DISCOVERY_METHODS[:6])} and others, and year ranges run 1988 onwards. "
                f"(Read live from {DATASET}.)"
            ),
            "artifact": artifact,
            "watch": None,
        }
    listing = "\n".join(_planet_line(planet) for planet in planets)
    tail = ""
    if result["truncated"]:
        tail = f"\n  • ... there were more than {result['limit']} matches; raise limit to see them."
    return {
        "final_state": "completed",
        "message": (f"{result['matched']} matching planet(s), newest discovery first:\n{listing}{tail}\n"
                    f"Source: {DATASET} (read live)."),
        "artifact": artifact,
        "watch": None,
    }


def run_extremes(params: dict, client: ExoplanetClient) -> dict:
    column = params.get("column", "pl_rade")
    direction = params.get("direction") or "desc"
    try:
        client.check_sort(f"{column}:{direction}")
        limit = client.check_limit(params.get("limit", 10))
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    try:
        planets = client.by_parameter(column, direction, limit)
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    label = _EXTREME_LABELS.get(column, column)
    artifact = _artifact(params, client, parameter=column, direction=direction,
                         label=label, planets=planets, count=len(planets))
    if not planets:
        return {
            "final_state": "completed",
            "message": (
                f"The archive publishes no value for {label} on any planet, so there is no extreme "
                f"to report. (Read live from {DATASET}.)"
            ),
            "artifact": artifact,
            "watch": None,
        }
    listing = "\n".join(
        f"  • {planet.get('planet')} — "
        f"{_value(planet.get(_COLUMN_TO_FIELD.get(column, '')), _COLUMN_TO_FIELD.get(column, ''))}"
        f"  (host {planet.get('host')}, found by {planet.get('discovery_method') or 'method not reported'})"
        for planet in planets
    )
    return {
        "final_state": "completed",
        "message": (
            f"{limit_label(direction)} planets by {label}, of the "
            f"{FULL_TABLE_ROWS} in the archive:\n{listing}\n"
            f"Only planets with a published {label} are considered. Source: {DATASET} (read live)."
        ),
        "artifact": artifact,
        "watch": None,
    }


_EXTREME_LABELS = {
    "pl_rade": "radius", "pl_bmasse": "mass", "pl_eqt": "equilibrium temperature",
    "pl_orbper": "orbital period", "sy_dist": "distance", "pl_insol": "insolation",
    "pl_orbsmax": "orbital distance", "st_teff": "host star temperature",
}
_COLUMN_TO_FIELD = {
    "pl_rade": "radius_earth", "pl_bmasse": "mass_earth", "pl_eqt": "temperature_k",
    "pl_orbper": "orbital_period_days", "sy_dist": "distance_pc",
    "pl_insol": "insolation_earth", "pl_orbsmax": "semi_major_axis_au",
    "st_teff": "star_temperature_k",
}


def limit_label(direction: str) -> str:
    return "Smallest" if direction == "asc" else "Largest"


def run_survey(params: dict, client: ExoplanetClient, gateway: GatewayClient) -> dict:
    """The premium catalogue survey. Nothing here counts: the gateway does.

    The free skills each ask the archive one bounded question. This asks for the
    whole composite table - about half a megabyte - and counts across it, which
    happens on the gateway behind its licence check.
    """
    read, refused = premium_call(gateway, GATEWAY_TOOL, {}, {
        "dataset": DATASET, "table_rows": FULL_TABLE_ROWS,
    })
    if refused:
        return refused
    if not isinstance(read, dict) or not isinstance(read.get("byDiscoveryMethod"), list):
        return empty_premium_answer(
            "The licence gateway answered without a catalogue survey, so there is nothing to report.",
            {"dataset": DATASET},
        )

    lines = [
        f"NASA's Exoplanet Archive composite table holds {read.get('totalPlanets')} planets around "
        f"{read.get('totalSystems')} stars.",
    ]
    methods = read.get("byDiscoveryMethod") or []
    if methods:
        lines.append("  • By discovery method: " + ", ".join(
            f"{row.get('name')} {row.get('count')} ({row.get('pct')}%)" for row in methods[:8]))
    decades = read.get("byDecade") or []
    if decades:
        lines.append("  • By decade: " + ", ".join(
            f"{row.get('name')} {row.get('count')}" for row in decades))
    types = read.get("bySpectralType") or []
    if types:
        lines.append("  • By host spectral type: " + ", ".join(
            f"{row.get('name')} {row.get('count')}" for row in types[:8]))
    band = read.get("habitableBand")
    if band:
        lines.append(
            f"  • {band.get('count')} planet(s) fall in a rough insolation band of "
            f"{band.get('low')}-{band.get('high')} Earth insolation. The archive publishes no "
            "habitable flag, so that is our own stated band and not a verdict.")
    records = read.get("records") or {}
    for key, label in (("largest", "largest radius"), ("smallestPeriod", "shortest period"),
                       ("hottest", "highest temperature"), ("nearest", "nearest"),
                       ("mostMassive", "most massive")):
        row = records.get(key)
        if row:
            lines.append(f"  • Record {label}: {row.get('planet')} "
                         f"({row.get('value')} {row.get('unit')})")
    lines.append(
        f"\nCounted on the MCP gateway behind its licence check, from {DATASET} - the composite "
        "table the archive publishes from the literature, not a claim about how many planets exist. "
        "Parameters a planet has no published value for are excluded from that parameter's ranking."
    )
    artifact = {
        "dataset": DATASET,
        "source": SOURCE,
        "premium": True,
        "total_planets": read.get("totalPlanets"),
        "total_systems": read.get("totalSystems"),
        "total_rows_read": read.get("rowsRead"),
        "by_discovery_method": methods,
        "by_decade": decades,
        "by_spectral_type": types,
        "habitable_band": band,
        "records": records,
        "years_covered": read.get("yearsCovered"),
        "method": read.get("method"),
    }
    return {"final_state": "completed", "message": "\n".join(lines), "artifact": artifact, "watch": None}


class ExoplanetAgent(SkillAgent):
    name = "nasa-exoplanets"
    card_name = "NASA Exoplanet Archive Agent"
    card_description = (
        "Read-only agent over the NASA Exoplanet Archive's composite planetary-systems table: one "
        "planet in full, every planet around a host star, a search by host or discovery method or "
        "year, the extremes of a published parameter, and a premium skill that reads the whole "
        "catalogue as a picture - totals, discovery methods, decades, spectral types, records. An "
        "unpublished parameter is reported as not published, never as zero."
    )
    env_prefix = "EXOPLANETS"
    datasets = (DATASET,)
    card_skills = CARD_SKILLS

    def __init__(self, client: ExoplanetClient | None = None,
                 gateway: GatewayClient | None = None) -> None:
        self.client = client or ExoplanetClient()
        self.gateway = gateway or GatewayClient()

    def parse(self, message: dict) -> dict:
        return parse(message)

    def missing(self, skill: str, params: dict) -> list[str]:
        if skill == SKILL_PLANET and not params.get("planet"):
            return ["planet"]
        if skill == SKILL_SYSTEM and not params.get("host"):
            return ["host"]
        if skill == SKILL_SEARCH and not any(params.get(key) for key in ("host", "method", "years")):
            return ["query"]
        return []

    def input_prompt(self, skill: str, missing: list[str]) -> str:
        if "planet" in missing:
            return ("Which planet? Give me its archive name, for example TRAPPIST-1 e or "
                    "Kepler-22 b, or a host star name to see everything around it.")
        if "host" in missing:
            return "Which star? Give me a host name, for example TRAPPIST-1 or Kepler-22."
        return (
            "What should I search for? A host star, a discovery method such as transit or radial "
            f"velocity, or a range of discovery years like 2015-2016. Methods include "
            f"{', '.join(DISCOVERY_METHODS[:5])}."
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
            if skill == SKILL_SURVEY:
                return run_survey(params, self.client, self.gateway)
            if skill == SKILL_PLANET:
                return run_planet(params, self.client)
            if skill == SKILL_SYSTEM:
                return run_system(params, self.client)
            if skill == SKILL_SEARCH:
                return run_search(params, self.client)
            if skill == SKILL_EXTREMES:
                return run_extremes(params, self.client)
        except UpstreamError as exc:
            return {
                "final_state": "failed",
                "message": f"The Exoplanet Archive could not be read: {exc}",
                "artifact": {"dataset": DATASET},
                "watch": None,
            }
        return {"final_state": "completed", "message": HELP, "artifact": None, "watch": None}


__all__ = [
    "CARD_SKILLS",
    "ExoplanetAgent",
    "EXTREME_PARAMS",
    "FULL_TABLE_ROWS",
    "GATEWAY_TOOL",
    "HABITABLE_ZONE_INSOL",
    "HELP",
    "SKILL_EXTREMES",
    "SKILL_PLANET",
    "SKILL_SEARCH",
    "SKILL_SURVEY",
    "SKILL_SYSTEM",
    "UpstreamError",
    "extreme_column",
    "message_data",
    "message_text",
    "parse",
    "planet_name_from_text",
    "run_extremes",
    "run_planet",
    "run_search",
    "run_survey",
    "run_system",
]
