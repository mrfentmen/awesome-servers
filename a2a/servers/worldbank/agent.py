"""The World Bank agent: four free skills over the Indicators API, one premium trend.

  - indicator-value:   one World Bank indicator for one country
  - country-compare:   the same indicator for several countries
  - indicator-search:  find the indicator code for a subject ("poverty")
  - country-info:      a country's region, income level, capital and codes
  - indicator-trend:   the trend behind a series (not implemented here)

The trend is premium because it is the one question the free skills cannot answer
without you doing the arithmetic yourself: indicator-value shows a row of values and
country-compare lines countries up side by side, and neither tells you how the series
moved — the change over the window, the direction each year, the per-year rate, the
best and worst year, and the gap between the countries at each end. That is computed
on a hosted service that was removed, so an unpaid caller gets a not-implemented stub message and no
trend at all.

Every number here is the Bank's own, read live from the WDI collection, and a year
the Bank has published no value for is reported as absent rather than as zero.
"""

from __future__ import annotations

import re
from datetime import datetime, timezone

from a2a_kit import SkillAgent

from data import (
    COUNTRY_DATASET,
    DATASET,
    INDICATOR_DATASET,
    PRODUCT,
    SOURCE_NAME,
    WorldBankClient,
    UpstreamError,
)

SKILL_INDICATOR_VALUE = "indicator-value"
SKILL_COUNTRY_COMPARE = "country-compare"
SKILL_INDICATOR_SEARCH = "indicator-search"
SKILL_COUNTRY_INFO = "country-info"
SKILL_INDICATOR_TREND = "indicator-trend"

SOURCE = "World Bank, World Development Indicators"
MAX_LISTED = 8
MAX_COMPARE = 8
GATEWAY_TOOL = "worldbank_indicator_trend"
DEFAULT_YEARS = "2015:2024"

CARD_SKILLS = [
    {
        "id": SKILL_INDICATOR_VALUE,
        "name": "Indicator value for a country",
        "description": (
            "One World Bank indicator for one country over a year or a year range, as the Bank "
            "publishes it: the value, the year, the indicator's own name, and the date the "
            "collection was last updated. Years the Bank has published no value for are left out "
            "rather than shown as zero."
        ),
        "tags": ["worldbank", "wdi", "indicator", "country", "free"],
        "examples": [
            "what is GDP per capita in Norway for 2023?",
            "GDP (current US$) for Germany 2019 to 2024",
            '{"skill": "indicator-value", "country": "US", "indicator": "NY.GDP.MKTP.CD", "years": "2020:2024"}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_COUNTRY_COMPARE,
        "name": "Compare countries on one indicator",
        "description": (
            "The same indicator for up to eight countries or World Bank aggregates side by side, "
            "for a year or a year range, with the countries ordered by the latest year so the "
            "ranking is visible."
        ),
        "tags": ["worldbank", "wdi", "compare", "countries", "free"],
        "examples": [
            "compare GDP per capita for US, GB and DE in 2023",
            "compare life expectancy across WLD, JPN and NGA",
            '{"skill": "country-compare", "countries": ["US", "GB"], "indicator": "SP.DYN.LE00.IN"}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_INDICATOR_SEARCH,
        "name": "Find an indicator code",
        "description": (
            "Search the World Development Indicators catalogue (about 1,500 indicators) by subject, "
            "returning the indicator code, its full name, its topics and the source note, ranked so "
            "the indicators actually named after your subject come first."
        ),
        "tags": ["worldbank", "wdi", "indicators", "search", "catalogue", "free"],
        "examples": [
            "which indicator measures life expectancy?",
            "find an indicator about poverty",
            '{"skill": "indicator-search", "term": "fertility", "limit": 5}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_COUNTRY_INFO,
        "name": "Country reference",
        "description": (
            "A country's own record: its ISO codes, name, region, income level, lending type, "
            "capital city and coordinates — and a search for countries by name, code or region."
        ),
        "tags": ["worldbank", "wdi", "country", "reference", "region", "free"],
        "examples": [
            "what region is Kenya in?",
            "find the country code for Germany",
            '{"skill": "country-info", "country": "BR", "limit": 5}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_INDICATOR_TREND,
        "name": "Indicator trend",
        "description": (
            "How an indicator moved over a window, for one country or several: the change and the "
            "per-year rate from the first year to the last, which way it went each year, the best "
            "and worst year, and the gap between countries at each end of the window. Premium: the "
            "arithmetic runs on a hosted service that was removed."
        ),
        "tags": ["worldbank", "wdi", "trend", "growth", "series", "analysis",],
        "examples": [
            "what is the trend in GDP per capita in Ireland since 2015?",
            "how has life expectancy trended in WLD and JPN over the last decade?",
            '{"skill": "indicator-trend", "country": "IE", "indicator": "NY.GDP.PCAP.CD", "years": "2015:2024"}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
]

_INDICATOR_CODE_RE = re.compile(r"\b([A-Z]{2}(?:\.[A-Z0-9_]+)+)\b")
_YEAR_RE = re.compile(r"\b(19|20)\d{2}\b")
_YEARS_RE = re.compile(r"\b((?:19|20)\d{2})\s*(?:-|–|to|:)\s*((?:19|20)\d{2})\b", re.IGNORECASE)
_QUOTED_RE = re.compile(r"[\"“]([^\"”]{2,80})[\"”]")
#: Words describing the question rather than the series being asked about.
_QUERY_STOP = frozenset("""
    a about all an and any are as at be been being but by can could do does did for from
    get give has have how i in into is it its just know like list make many me much my need
    of on one only or please see show so some tell that the their them there these this
    those to up us was were what when where which who whom whose why will with would
    indicator indicators measure measures measured bank world data value values figure
    figures number numbers stat stats
""".split())

_TREND_WORDS = re.compile(
    r"\b(trend|trends|trended|trending|over time|growth|grew|grow|since|trajectory|"
    r"changed?|change between|per year|each year|yr on yr|year on year|yoy|"
    r"rose|fallen?|climbed?|direction|series|history|historical)\b",
    re.IGNORECASE,
)
#: "since 2015" and "over the last decade" both name the start of a window; a bare
#: "in 2015" does not. Only the wording can tell them apart, so the window is built here.
_SINCE_WORDS = re.compile(
    r"\b(since|from|over the last|over the past|in the (?:last|past)\s+\w+)\b", re.IGNORECASE
)
_COMPARE_WORDS = re.compile(
    r"\b(compar\w+|versus|vs\.?|against|side by side|ranked|ranking|"
    r"who has (?:the )?(?:most|least|highest|lowest)|biggest|smallest|"
    r"compared (?:to|with))\b",
    re.IGNORECASE,
)
_INDICATOR_SEARCH_WORDS = re.compile(
    r"\b(which indicator|what indicator|find (?:an |a )?indicator|search (?:for )?(?:an |a )?indicator|"
    r"indicator (?:code )?(?:for|that measures|about)|indicators? (?:about|for|measuring)|"
    r"what (?:does|do) .{0,24}measur\w+|is there an indicator)\b",
    re.IGNORECASE,
)
_COUNTRY_WORDS = re.compile(
    r"\b(which countries|countries (?:in|of|list|by)|list (?:the )?countries|find (?:a |the )?countr\w+|"
    r"country (?:code|info|reference|record|details|metadata)|what region|"
    r"(?:region|income level|capital|lending type) (?:is|of|for)|about (?:the )?countr\w+)\b",
    re.IGNORECASE,
)

HELP = (
    "I read the World Bank's World Development Indicators. Ask me:\n"
    "  • what is GDP per capita in Norway for 2023?\n"
    "  • compare GDP per capita for US, GB and DE in 2023\n"
    "  • which indicator measures life expectancy?\n"
    "  • what region is Kenya in?\n"
    "  • what is the trend in GDP per capita in Ireland since 2015?  (not implemented here)\n"
    "Indicators are identified by their World Bank code (NY.GDP.PCAP.CD, SP.DYN.LE00.IN). "
    "I quote the Bank's own numbers and its last-updated date, and I never fill a missing "
    "year with zero."
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


def countries_from_text(text: str) -> list[str] | None:
    """Country codes or names in the text, read in the order they appear.

    World Bank aggregates (WLD, EUU) are codes too, so anything that looks like a
    code is taken; a bare name is taken only when the question is about countries,
    because otherwise "Ireland" would be picked up out of any sentence.
    """
    wanted_country_question = bool(_COUNTRY_WORDS.search(text) or _COMPARE_WORDS.search(text))
    found: list[str] = []
    seen: set[str] = set()
    # Two things in a question are not countries even though they look like codes:
    # an indicator code ("NY.GDP.PCAP.CD" -> "NY" and "CD") and a currency ("US$").
    # Both are masked before the caps scan.
    scannable = re.sub(r"\b([A-Z]{2,3})\s*\$", " ", text)
    scannable = _INDICATOR_CODE_RE.sub(" ", scannable)
    for match in re.finditer(r"\b([A-Za-z]{2,3})\b", scannable):
        token = match.group(1)
        upper = token.upper()
        if upper in seen:
            continue
        if token.isupper():
            # An all-caps token is a code unless it is an English word in caps.
            if upper in _CAPS_NOT_CODES:
                continue
            seen.add(upper)
            found.append(upper)
        elif wanted_country_question and len(token) > 3:
            seen.add(upper)
            found.append(token)
    return found or None


#: All-caps tokens that are English words, not World Bank codes. US, UK, EU and the
#: aggregates ARE codes, so they are deliberately absent from this list.
_CAPS_NOT_CODES = frozenset("""
    GDP GDPPCAP PPP CPI YOY
    Q Q1 Q2 Q3 Q4
    AND THE FOR WAS WERE WITH FROM NOT WHAT WHICH
""".split())


def country_name_from_text(text: str) -> str | None:
    """A country written as a name ("Norway"), for the runner to resolve to a code.

    The Indicators API takes ISO codes only, and `parse` may not touch the network, so
    the name is carried through and looked up against the Bank's own country list
    when the skill runs. The first capitalised word is skipped because in a question
    it is nearly always the first word of the sentence.
    """
    for match in re.finditer(r"\b([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,}){0,2})\b", text):
        if match.start() == 0:
            continue
        candidate = match.group(1).strip()
        if candidate.lower() in _COUNTRY_NAME_STOP:
            continue
        return candidate
    return None


#: Capitalised words that start a question and are not a country.
_COUNTRY_NAME_STOP = frozenset("""
    What Which Where When Who Whom Whose Why How Is Are Was Were Does Do Did Can Could
    The This That These Those And But For From With Without Show Find List Give Tell Get
    Compare Between Since Over Under Latest Current Please GDP PPP
""".split())


def term_from_text(text: str) -> str | None:
    """The subject to search the indicator catalogue for."""
    match = _QUOTED_RE.search(text)
    if match:
        return match.group(1).strip()
    words = [word for word in re.findall(r"[A-Za-z][A-Za-z0-9\-]*", text)
             if word.lower() not in _QUERY_STOP and not _INDICATOR_CODE_RE.fullmatch(word)]
    if not words:
        return None
    return " ".join(words[:6])


def parse(message: dict) -> dict:
    """Incoming message -> {skill, params, explicit}. Never raises."""
    text = message_text(message)
    data = message_data(message)
    requested = _first(data, "skill", "skill_id")

    indicator = _first(data, "indicator", "indicator_code", "code")
    if indicator is None:
        match = _INDICATOR_CODE_RE.search(text)
        indicator = match.group(1) if match else None
    countries = _first(data, "countries", "country", "country_code", "iso")
    if countries is None:
        countries = countries_from_text(text)
    years = _first(data, "years", "date", "year_range")
    if years is None:
        span = _YEARS_RE.search(text)
        if span:
            years = f"{span.group(1)}:{span.group(2)}"
        else:
            single = _YEAR_RE.search(text)
            years = single.group(0) if single else None
    country_name = _first(data, "country_name")
    if country_name is None:
        country_name = country_name_from_text(text)
    term = _first(data, "term", "subject", "topic")
    if term is None:
        term = term_from_text(text) if _INDICATOR_SEARCH_WORDS.search(text) else None
    limit = _first(data, "limit", default=10)

    all_skills = (SKILL_INDICATOR_VALUE, SKILL_COUNTRY_COMPARE, SKILL_INDICATOR_SEARCH,
                  SKILL_COUNTRY_INFO, SKILL_INDICATOR_TREND)
    asked_for_trend = bool(_TREND_WORDS.search(text))
    if requested in all_skills:
        skill = requested
    elif _INDICATOR_SEARCH_WORDS.search(text):
        skill = SKILL_INDICATOR_SEARCH
    elif _COUNTRY_WORDS.search(text) and not indicator:
        skill = SKILL_COUNTRY_INFO
    elif asked_for_trend:
        skill = SKILL_INDICATOR_TREND
    elif _COMPARE_WORDS.search(text):
        skill = SKILL_COUNTRY_COMPARE
    else:
        skill = SKILL_INDICATOR_VALUE

    # Only the skills that read a subject search the catalogue, and only the ones that
    # read a series take an indicator code: a country question is not about a series.
    if skill != SKILL_INDICATOR_SEARCH:
        term = None
    if skill in (SKILL_COUNTRY_INFO, SKILL_INDICATOR_SEARCH):
        indicator = None
    if skill in (SKILL_COUNTRY_INFO, SKILL_INDICATOR_SEARCH) and isinstance(countries, str):
        countries = [countries]
    if skill == SKILL_INDICATOR_SEARCH:
        country_name = None

    params: dict = {"limit": limit}
    for key, value in (("indicator", indicator), ("countries", countries),
                       ("years", years), ("term", term), ("country_name", country_name)):
        if value is not None:
            params[key] = value
    if skill == SKILL_COUNTRY_COMPARE and isinstance(countries, list) and len(countries) < 2:
        params.setdefault("limit", MAX_COMPARE)
    if skill == SKILL_INDICATOR_TREND:
        if years and len(str(years)) == 4 and str(years).isdigit() and _SINCE_WORDS.search(text):
            # "since 2015" runs from 2015 to now, not for ten years ending in 2015.
            params["years"] = f"{years}:{datetime.now(timezone.utc).year}"
        else:
            params["years"] = years or DEFAULT_YEARS
    if not requested and (not text.strip()
                         or re.search(r"\b(help|what can you do|commands?)\b", text, re.IGNORECASE)):
        skill, params = "help", {}
    explicit = bool(requested or asked_for_trend or _COMPARE_WORDS.search(text)
                    or _INDICATOR_SEARCH_WORDS.search(text) or _COUNTRY_WORDS.search(text))
    return {"skill": skill, "params": params, "explicit": explicit}


# -- shared shape ---------------------------------------------------------


def _artifact(params: dict, client: WorldBankClient, dataset: str = DATASET, **extra) -> dict:
    artifact = {
        "dataset": dataset,
        "product": PRODUCT,
        "source": SOURCE,
        "freshness": client.freshness(),
    }
    artifact.update(extra)
    return artifact


def _value_label(value, indicator: str) -> str:
    """A number as the Bank writes it. A missing value says so; it never reads as zero."""
    if not isinstance(value, (int, float)):
        return "not reported"
    if abs(value) >= 1000:
        return f"{value:,.0f}"
    if abs(value) >= 1:
        return f"{value:,.2f}"
    return f"{value:.4g}"


def resolve_country(name, code, client: WorldBankClient):
    """(code, problem_response) — a problem is a finished response body.

    The Indicators API takes ISO codes only, so a country written as a name is looked
    up against the Bank's own country list here, at run time, where a lookup is
    allowed. An ambiguous name asks which one; an unknown one asks for the code.
    """
    if code:
        return code, None
    if not name:
        return None, None
    try:
        matches = client.find_countries(needle=str(name), limit=6)
    except ValueError as exc:
        return None, {"final_state": "input-required", "message": str(exc),
                      "artifact": None, "watch": None}
    if len(matches) == 1:
        return matches[0].get("iso3") or matches[0].get("iso2"), None
    if not matches:
        return None, {
            "final_state": "input-required",
            "message": (
                f"The World Bank's country list has no country called “{name}”. Give me the ISO "
                "code instead, for example US, GB, DE — or a World Bank aggregate like WLD."
            ),
            "artifact": None,
            "watch": None,
        }
    listing = "\n".join(
        f"  • {row.get('name')} — {row.get('iso3') or 'no iso3'}"
        + (f", {row['region']}" if row.get("region") else "")
        for row in matches
    )
    return None, {
        "final_state": "input-required",
        "message": f"“{name}” matches more than one country. Which one?\n{listing}",
        "artifact": None,
        "watch": None,
    }


def _trend_window(years, client: WorldBankClient) -> str:
    """A trend needs a window. “since 2015” becomes 2015 through this year.

    The single-year test is a length-and-digits test, not a regex search: an
    unanchored year pattern also matches the first half of "2015:2024", and a trend
    window is not a year.
    """
    text = str(years or DEFAULT_YEARS).strip()
    if len(text) == 4 and text.isdigit():
        return client.check_years(f"{int(text) - 9}:{datetime.now(timezone.utc).year}")
    return client.check_years(text)


# -- skills ---------------------------------------------------------------


def run_indicator_value(params: dict, client: WorldBankClient) -> dict:
    listed = params.get("countries")
    code = params.get("country") or (listed[0] if listed else None)
    code, problem = resolve_country(params.get("country_name"), code, client)
    if problem:
        return problem
    try:
        result = client.indicator_values(
            code, params.get("indicator"), years=params.get("years") or DEFAULT_YEARS,
            limit=params.get("limit", 10),
        )
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    observations = result["observations"]
    artifact = _artifact(params, client, **result)
    if not observations:
        return {
            "final_state": "completed",
            "message": (
                f"The World Bank publishes no value for {result['indicator_name']} "
                f"({result['indicator_code']}) in {result['countries'][0]} for {result['years']}. "
                "Try a wider year range, or search the indicator catalogue for a series that exists."
            ),
            "artifact": artifact,
            "watch": None,
        }
    listing = "\n".join(
        f"  • {row['year']}  {_value_label(row['value'], result['indicator_code'])}"
        + (f"  ({row['obs_status']})" if row.get("obs_status") else "")
        for row in observations[:MAX_LISTED]
    )
    return {
        "final_state": "completed",
        "message": (
            f"{result['indicator_name']} for {observations[0]['country']} "
            f"({result['indicator_code']}), {result['years']}, from {SOURCE_NAME}:\n{listing}\n"
            f"Source: {DATASET} (read live). Collection last updated "
            f"{result.get('last_updated') or 'not reported'}; years with no published value are left out."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_country_compare(params: dict, client: WorldBankClient) -> dict:
    countries = params.get("countries")
    if not countries:
        return {
            "final_state": "input-required",
            "message": ("Which countries? Give me two or more ISO codes, for example US, GB, DE — "
                        "or World Bank aggregates like WLD or EUU."),
            "artifact": None,
            "watch": None,
        }
    if isinstance(countries, str):
        countries = [countries]
    if len(countries) < 2:
        return {
            "final_state": "input-required",
            "message": ("A comparison needs two or more countries. Give me a second ISO code — "
                        "or ask me for one country’s value instead, which is indicator-value."),
            "artifact": None,
            "watch": None,
        }
    resolved = []
    for one in countries:
        code, problem = resolve_country(None, one, client)
        if problem:
            return problem
        resolved.append(code)
    countries = resolved
    try:
        result = client.indicator_values(
            countries, params.get("indicator"), years=params.get("years") or DEFAULT_YEARS,
            limit=params.get("limit", 20),
        )
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    observations = result["observations"]
    artifact = _artifact(params, client, **result)
    if not observations:
        return {
            "final_state": "completed",
            "message": (
                f"The World Bank publishes no value for {result['indicator_code']} in "
                f"{', '.join(result['countries'])} for {result['years']}."
            ),
            "artifact": artifact,
            "watch": None,
        }
    latest = max((row["year"] for row in observations), default="")
    by_country: dict[str, dict] = {}
    for row in observations:
        if row["year"] == latest:
            by_country.setdefault(row["country"] or row["country_iso3"], row)
    ranked = sorted(by_country.values(), key=lambda row: row["value"], reverse=True)
    lines = [f"{result['indicator_name']} ({result['indicator_code']}) for "
             f"{', '.join(result['countries'])}, {result['years']}, latest year {latest}:"]
    for position, row in enumerate(ranked, start=1):
        lines.append(
            f"  {position}. {row['country']} — {_value_label(row['value'], result['indicator_code'])}"
        )
    years = sorted({row["year"] for row in observations}, reverse=True)
    lines.append(f"  • {len(years)} year(s) published for at least one of these countries: "
                 + ", ".join(years[:MAX_LISTED]))
    lines.append(
        f"\nSource: {DATASET} (read live). Collection last updated "
        f"{result.get('last_updated') or 'not reported'}. Ranking is on the latest published year, "
        "which is not the same year for every country when a year is missing."
    )
    return {"final_state": "completed", "message": "\n".join(lines), "artifact": artifact, "watch": None}


def run_indicator_search(params: dict, client: WorldBankClient) -> dict:
    try:
        result = client.search_indicators(params.get("term"), limit=params.get("limit", 10))
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    indicators = result["indicators"]
    artifact = _artifact(params, client, dataset=INDICATOR_DATASET, **result)
    if not indicators:
        return {
            "final_state": "completed",
            "message": (
                f"No indicator in the {SOURCE_NAME} catalogue mentions “{result['term']}”. "
                f"The collection holds {result['catalogue_size']:,} indicators; try a shorter word."
            ),
            "artifact": artifact,
            "watch": None,
        }
    listing = "\n".join(
        f"  • {row['id']} — {row['name']}"
        + (f"\n    topic: {row['topics'][0]}" if row.get("topics") else "")
        for row in indicators[:MAX_LISTED]
    )
    return {
        "final_state": "completed",
        "message": (
            f"{result['name_hits']} indicator(s) in the {SOURCE_NAME} catalogue "
            f"({result['catalogue_size']:,} total) are named after “{result['term']}”; "
            f"showing {len(indicators)}, best match first:\n{listing}\n"
            f"Source: {INDICATOR_DATASET} (read live). Ask me for the values of any of these codes."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_country_info(params: dict, client: WorldBankClient) -> dict:
    """A country reference: a code gives the full record, a name gives the matches.

    The Indicators API takes ISO codes, and there is no code lookup by name, so a
    name is searched against the Bank's own country list here rather than guessed at.
    """
    raw = params.get("country") or params.get("countries")
    codes = [raw] if isinstance(raw, str) else list(raw or [])
    name = params.get("country_name")
    needle = codes[0] if codes else name
    try:
        limit = client.check_limit(params.get("limit", 10))
        if len(codes) == 1 and not name:
            record = client.country_info(codes[0])
            if record is not None:
                return {
                    "final_state": "completed",
                    "message": "\n".join([
                        f"{record.get('name') or 'unnamed country'} ({record.get('iso3') or 'no iso3'}, "
                        f"{record.get('iso2') or 'no iso2'}):",
                        f"  • region        {record.get('region') or 'not reported'}",
                        f"  • income level  {record.get('income_level') or 'not reported'}",
                        f"  • lending type  {record.get('lending_type') or 'not reported'}",
                        f"  • capital       {record.get('capital_city') or 'not reported'}",
                        "  • coordinates   "
                        + (f"{record.get('latitude')}, {record.get('longitude')}"
                           if record.get("latitude") is not None else "not reported"),
                        f"\nSource: {COUNTRY_DATASET} (read live).",
                    ]),
                    "artifact": _artifact(params, client, dataset=COUNTRY_DATASET, country=record),
                    "watch": None,
                }
        matches = client.find_countries(needle=needle, limit=limit)
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    artifact = _artifact(params, client, dataset=COUNTRY_DATASET, country_matches=matches,
                         count=len(matches), needle=needle)
    if not matches:
        return {
            "final_state": "completed",
            "message": (
                f"No World Bank country matches “{needle}”. Use a name (“Kenya”) or a code "
                "(KE, KEN), or a World Bank aggregate like WLD. If you have a country's name and "
                "want its indicators, ask for one instead — that resolves the name to a code first."
            ),
            "artifact": artifact,
            "watch": None,
        }
    listing = "\n".join(
        f"  • {row.get('name') or 'unnamed'} — {row.get('iso3') or 'no iso3'}"
        + (f" / {row['iso2']}" if row.get("iso2") else "")
        + (f", {row['region'].strip()}" if row.get("region") else "")
        + (f", {row['income_level']}" if row.get("income_level") else "")
        for row in matches[:MAX_LISTED]
    )
    return {
        "final_state": "completed",
        "message": (
            f"{len(matches)} World Bank country/countries match “{needle}”:\n{listing}\n"
            f"Source: {COUNTRY_DATASET} (read live). Ask me for a country's indicators by its code."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_indicator_trend(params: dict, client: WorldBankClient, gateway: object) -> dict:
    """Stub: the hosted implementation of this skill was removed in the paywall cleanup."""
    return {
        "final_state": "completed",
        "message": 'Not yet implemented: indicator-trend — its hosted implementation was removed.',
        "artifact": {"removed": True},
        "watch": None,
    }


class WorldBankAgent(SkillAgent):
    name = "worldbank-indicators"
    card_name = "World Bank Indicators Agent"
    card_description = (
        "Read-only agent over the World Bank's World Development Indicators: any indicator for a "
        "country, the same indicator side by side for up to eight countries, a search across the "
        "1,500-indicator catalogue to find the code for a subject, and a country reference — plus a "
        "trend skill that turns a series into a change, a per-year rate and a best and worst year "
        "on a removed hosted service. Every number is the Bank's own and every year it has not "
        "published is left out rather than filled in."
    )
    env_prefix = "WORLDBANK"
    datasets = (DATASET, COUNTRY_DATASET, INDICATOR_DATASET)
    card_skills = CARD_SKILLS

    def __init__(self, client: WorldBankClient | None = None,
                 gateway: object | None = None) -> None:
        self.client = client or WorldBankClient()
        self.gateway = gateway

    def parse(self, message: dict) -> dict:
        return parse(message)

    def missing(self, skill: str, params: dict) -> list[str]:
        if skill == "help":
            return []
        if skill == SKILL_INDICATOR_SEARCH:
            return [] if params.get("term") else ["term"]
        # A country written as a name counts: the skill resolves it against the Bank's
        # own country list, and only then decides whether it was usable.
        has_country = bool(params.get("country") or params.get("countries")
                           or params.get("country_name"))
        if skill == SKILL_COUNTRY_INFO:
            return [] if has_country else ["country"]
        missing = []
        if not has_country:
            missing.append("country")
        if not params.get("indicator"):
            missing.append("indicator")
        return missing

    def input_prompt(self, skill: str, missing: list[str]) -> str:
        if skill == SKILL_INDICATOR_SEARCH:
            return (
                "What should I look for? Give me a subject, for example “life expectancy” or "
                "“poverty”, and I will find the indicator code."
            )
        if skill == SKILL_COUNTRY_INFO:
            return (
                "Which country? Give me a name (“Kenya”) or a code (KE, KEN), or ask which "
                "countries are in a region."
            )
        if missing == ["indicator"]:
            return (
                "Which indicator? Give me the World Bank code, for example NY.GDP.PCAP.CD (GDP per "
                "capita) or SP.DYN.LE00.IN (life expectancy). Ask me “which indicator measures …” "
                "and I will look the code up in the catalogue."
            )
        return (
            "Which country? Give me an ISO code, for example US, GB, DE — or a World Bank "
            "aggregate like WLD or EUU."
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
        if skill == SKILL_INDICATOR_VALUE:
            return run_indicator_value(params, self.client)
        if skill == SKILL_COUNTRY_COMPARE:
            return run_country_compare(params, self.client)
        if skill == SKILL_INDICATOR_SEARCH:
            return run_indicator_search(params, self.client)
        if skill == SKILL_COUNTRY_INFO:
            return run_country_info(params, self.client)
        if skill == SKILL_INDICATOR_TREND:
            return run_indicator_trend(params, self.client, self.gateway)
        if skill == "help":
            return {"final_state": "completed", "message": HELP, "artifact": None, "watch": None}
        return {
            "final_state": "input-required",
            "message": "I did not catch which skill that is. Try “compare GDP per capita for US and GB in 2023”.",
            "artifact": None,
            "watch": None,
        }


__all__ = [
    "CARD_SKILLS",
    "DEFAULT_YEARS",
    "GATEWAY_TOOL",
    "HELP",
    "MAX_COMPARE",
    "MAX_LISTED",
    "SKILL_COUNTRY_COMPARE",
    "SKILL_COUNTRY_INFO",
    "SKILL_INDICATOR_SEARCH",
    "SKILL_INDICATOR_TREND",
    "SKILL_INDICATOR_VALUE",
    "UpstreamError",
    "WorldBankAgent",
    "countries_from_text",
    "message_data",
    "message_text",
    "parse",
    "run_country_compare",
    "run_country_info",
    "run_indicator_search",
    "run_indicator_trend",
    "run_indicator_value",
    "term_from_text",
]
