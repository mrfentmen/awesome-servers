"""The TVMaze agent: four free skills and one premium one.

  - show-search:   find shows by name, with TVMaze's own match score
  - show-episodes: the episode list for one show, by season
  - next-airing:   when a show airs next, from its own episode airstamps
  - schedule-day:  everything airing on one day, optionally for one country
  - binge-plan:    what it costs to finish a season - premium, runs on the gateway

Binge-plan is the one question the free skills cannot answer. They each answer one
read: a list, a date, a day. "How long do I need to clear season 2" needs all of
them at once plus arithmetic, so that work runs behind the licence gateway and a
caller who has not paid gets the gateway's own message and no episode list at all.
"""

from __future__ import annotations

import os
import re
from datetime import datetime, timedelta, timezone

from a2a_kit import GatewayClient, SkillAgent, UpstreamError, empty_premium_answer, premium_call

from data import (
    DAY_NAMES,
    DATASET,
    SOURCE,
    TvmazeClient,
    day_for_name,
)

SKILL_SHOW_SEARCH = "show-search"
SKILL_SHOW_EPISODES = "show-episodes"
SKILL_NEXT_AIRING = "next-airing"
SKILL_SCHEDULE_DAY = "schedule-day"
SKILL_BINGE_PLAN = "binge-plan"

DEFAULT_LIMIT = 8
MAX_LISTED_EPISODES = 12

CARD_SKILLS = [
    {
        "id": SKILL_SHOW_SEARCH,
        "name": "Search TV shows",
        "description": (
            "Find TV shows by name. Returns TVMaze's match score alongside each show's status, type, "
            "genres, network or streaming channel, average runtime, premiere date and rating."
        ),
        "tags": ["tv", "shows", "search", "tvmaze"],
        "examples": [
            "search for severance",
            "what shows are there called Severance?",
            '{"skill": "show-search", "query": "Severance", "limit": 5}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_SHOW_EPISODES,
        "name": "Episode list for a show",
        "description": (
            "The episode list for one show: season and episode number, title, airdate, airtime, runtime "
            "and audience rating, for a whole show or for one season. Give a show name or a TVMaze show id."
        ),
        "tags": ["tv", "episodes", "season", "tvmaze"],
        "examples": [
            "list the episodes of Severance",
            "season 2 of Severance",
            '{"skill": "show-episodes", "show": "Severance", "season": 2}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_NEXT_AIRING,
        "name": "Next air date",
        "description": (
            "When a show airs next: the next episode's number, title, airdate, airtime and UTC airstamp, "
            "or an honest note that the show has no future episode scheduled yet."
        ),
        "tags": ["tv", "schedule", "next", "airing", "tvmaze"],
        "examples": [
            "when does Severance air next?",
            "next episode of Severance",
            '{"skill": "next-airing", "show": "Severance"}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_SCHEDULE_DAY,
        "name": "What is on today",
        "description": (
            "Everything scheduled to air on one day, newest rows as TVMaze publishes them: show, episode "
            "number, title, airtime, station, genre and runtime. Defaults to today and can be narrowed to "
            "one country."
        ),
        "tags": ["tv", "schedule", "today", "tonight", "country", "tvmaze"],
        "examples": [
            "what is on tv tonight?",
            "what's on tv in the US tomorrow?",
            '{"skill": "schedule-day", "date": "2026-09-28", "country": "US"}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_BINGE_PLAN,
        "name": "Finish-the-season plan",
        "description": (
            "What it costs to finish a season: how many episodes are left after the one you are on, their "
            "total runtime in hours, the airdate of each one and when the season's last episode airs, plus "
            "the date you would finish at the number of episodes a day you name. Premium: it runs behind a "
            "licence check."
        ),
        "tags": ["tv", "binge", "season", "plan", "catch-up", "premium"],
        "examples": [
            "how long do I need to finish season 2 of Severance?",
            "I am on episode 3 of Severance season 2, two episodes a night",
            '{"skill": "binge-plan", "show": "Severance", "season": 2, "from_episode": 3, "episodes_per_day": 2}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
]

_SHOW_ID_RE = re.compile(r"\bshow (?:id )?(\d{1,8})\b", re.IGNORECASE)
_SEASON_RE = re.compile(r"\bseason\s*(\d{1,3})\b", re.IGNORECASE)
_EPISODE_RE = re.compile(r"\bepisode\s*(\d{1,4})\b", re.IGNORECASE)
_DATE_RE = re.compile(r"\b(\d{4}-\d{2}-\d{2})\b")
_COUNTRY_RE = re.compile(r"\bin (?:the )?([A-Za-z]{2})\b")
_TOMORROW_RE = re.compile(r"\btomorrow\b", re.IGNORECASE)
_LIMIT_RE = re.compile(r"\b(?:top|first|limit)\s+(\d{1,2})\b", re.IGNORECASE)
#: "how many a day" / "two a night" — the watch rate a binge plan is costed at.
_PER_DAY_RE = re.compile(
    r"\b(\d{1,2}(?:\.\d)?)\s*(?:episodes?|eps?)\s*(?:a|per)\s*(?:day|night|weekday)\b", re.IGNORECASE
)
_WORDS = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "a": 1, "an": 1}
_NUMBER_WORDS_RE = re.compile(
    r"\b(one|two|three|four|five|six|a|an)\s+(?:episodes?\s+)?(?:a|per)\s*(?:day|night)\b",
    re.IGNORECASE,
)

#: The premium skill asks for a job of work, not for a list. Deliberately narrow: a
#: plain "list the episodes" stays with show-episodes and a plain "when does it air"
#: stays with next-airing.
_BINGE_WORDS = re.compile(
    r"\b(binge(?:ing)?|marathon|catch[- ]?up|catch up on|"
    r"finish (?:the |this |off )?(?:season|series|show|episode)|"
    r"clear (?:the |this )?(?:season|series)|"
    r"(?:work out|figure out|plan) (?:my |your |the )?(?:night|weekend|evening|binge|finish)|"
    r"how (?:long|many) (?:do|does|would|will|to) .{0,40}\b(?:finish|left|clear|binge|season|series))\b",
    re.IGNORECASE,
)
_SCHEDULE_WORDS = re.compile(
    r"\b(?:what(?:'s| is| are)?\s+on|what(?:'s| is)?\s+(?:playing|airing)|"
    r"on tv|on the tv|tv tonight|tv today|tv schedule|schedule for|"
    r"airing (?:today|tonight|tomorrow|on)|what is (?:on|playing)|"
    r"episodes? airing|what plays)\b",
    re.IGNORECASE,
)
_NEXT_AIR_WORDS = re.compile(
    r"\b(?:when (?:does|do|is|will|shall) .{0,45}\b(?:air|air next|broadcast)|"
    r"next (?:air|aired|airing|airdate|broadcast)|next episode|"
    r"air(?:ing|s|ed)? (?:next|date|again|time)|"
    r"when.{0,25}\bnext\b.{0,25}\b(?:air|episode|broadcast))\b",
    re.IGNORECASE,
)
#: "list the episodes" is a free question; it must never be read as a binge plan.
_EPISODE_LIST_WORDS = re.compile(
    r"\b(?:list|show|give|what(?:'s| is)|which)\s+(?:me\s+)?(?:the\s+|all\s+|every\s+)?"
    r"(?:episodes?|episode\s+list|episode\s+guide)\b",
    re.IGNORECASE,
)
_EPISODE_WORDS = re.compile(
    r"\b(?:episodes?|episode list|episode guide|"
    r"list (?:the |all )?(?:episodes|seasons)|"
    r"season \d+ episode|s\d+e\d+|episode \d+)\b",
    re.IGNORECASE,
)
_SEARCH_WORDS = re.compile(
    r"\b(?:find|search|look up|lookup|show me|list)\s+(?:a |the |me )?(?:tv |television )?"
    r"(?:show|series|sitcom|drama)\b|"
    r"what (?:tv )?(?:shows|series) (?:are |do |does |is |was )?(?:there |called |named |about|like|on|star)|"
    r"(?:shows|series) (?:like|about|called|named|matching|similar to)\b",
    re.IGNORECASE,
)
#: A show title is either quoted, or introduced by a connector, or simply capitalised.
_QUOTED_RE = re.compile(r"[\"“”'‘’]([^\"“”]{2,60})[\"“”'‘’]")
_CONNECTOR_RE = re.compile(
    r"\b(?:find|search|look up|lookup|called|named|like|about|episode|episodes|season|show|series)\s+"
    rf"(?:an?\s+|the\s+)*([A-Za-z0-9][A-Za-z0-9'’.\-&]{{1,30}}"
    rf"(?:\s+(?:[A-Za-z0-9][A-Za-z0-9'’.\-&]{{1,30}}|of|the|a|an|and|&)){{0,5}})",
    re.IGNORECASE,
)
#: A capitalised word, then more capitalised words joined only by a real connector
#: ("The Bear", "Hail to the Thief"). A lowercase word with nothing capitalised after
#: it ends the run, so "Severance air next" yields "Severance" and never "Severance a".
_TITLE_WORD = r"[A-Z][A-Za-z0-9'’.\-&]{1,24}"
_CAPITALISED_RE = re.compile(
    rf"\b({_TITLE_WORD}(?:(?:\s+(?:of|the|and|&)\s+|\s+){_TITLE_WORD}){{0,5}})"
)
#: Leading words that belong to the question, not to a title.
#: A title is only ever trimmed at the front, and never off an article: "The Wire"
#: and "A Series of Unfortunate Events" are titles, "the" and "a" included.
_TITLE_STOPWORDS = {
    "about", "air", "aired", "airs", "all", "am", "any", "are", "as", "at", "be", "been", "being",
    "call", "called", "details", "did", "do", "does", "episodes", "find", "for", "from", "guide",
    "has", "have", "i", "in", "info", "into", "is", "it", "its", "last", "like", "list", "look",
    "lookup", "me", "much", "my", "named", "next", "of", "on", "one", "season", "search", "series",
    "show", "shows", "still", "table", "there", "to", "today", "tonight", "tomorrow", "tv", "want",
    "was", "watched", "watching", "what", "when", "where", "which", "who", "why", "with",
}
#: A candidate carrying one of these is a phrase of the question, never a title.
_TITLE_REJECT_RE = re.compile(
    r"\b(?:tonight|today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|"
    r"season|episodes?|air|next|listing|schedule|channel|station)\b",
    re.IGNORECASE,
)
_ALL_SKILLS = (SKILL_SHOW_SEARCH, SKILL_SHOW_EPISODES, SKILL_NEXT_AIRING,
               SKILL_SCHEDULE_DAY, SKILL_BINGE_PLAN)

HELP = (
    "I read TVMaze, the open television schedule database. Ask me:\n"
    "  • search for severance\n"
    "  • list the episodes of Severance\n"
    "  • when does Severance air next?\n"
    "  • what is on tv tonight?\n"
    "  • how long do I need to finish season 2 of Severance?\n"
    "Everything comes from TVMaze live, and airtimes are the ones TVMaze publishes - "
    "I do not guess a schedule and I do not know about shows TVMaze has not catalogued."
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


def _clean_title(candidate: str) -> str | None:
    """Trim the question's own leading words off a captured run and judge what is left.

    Only the front is trimmed: a leading article is dropped but a trailing one is
    not, because titles like "The Wire" are common and losing the article sends the
    lookup to the wrong show. A run that still names a season or an episode is not a
    title at all, so it is refused and the next pass gets a turn.
    """
    words = [word for word in candidate.strip(" .,'’\"").split() if word]
    while words and words[0].lower().strip(",.") in _TITLE_STOPWORDS:
        words.pop(0)
    # "Severance" and "Fargo" are one word; a bare number is not a title. Six words is
    # the longest title TVMaze is likely to hold ("A Series of Unfortunate Events").
    if not 1 <= len(words) <= 6 or not re.match(r"[A-Za-z0-9]", words[0]):
        return None
    if len(words) == 1 and len(words[0]) < 3:
        return None
    title = " ".join(words)
    if _TITLE_REJECT_RE.search(title):
        return None
    return title


def show_from_text(text: str, show: str | None) -> str | None:
    """A show title only when the text offers one - never the whole question.

    Three passes, most reliable first: a quoted title, a title introduced by a
    connector, then a run of capitalised words. Each candidate is trimmed of the
    question's own words and rejected if it still reads as a phrase.
    """
    if show:
        return None
    quoted = _QUOTED_RE.search(text)
    if quoted:
        title = _clean_title(quoted.group(1))
        if title:
            return title
    match = _CONNECTOR_RE.search(text)
    if match:
        title = _clean_title(match.group(1))
        if title:
            return title
    capitals = _CAPITALISED_RE.search(text)
    if capitals:
        return _clean_title(capitals.group(1))
    return None


def parse(message: dict) -> dict:
    """Incoming message -> {skill, params, explicit}. Never raises."""
    text = message_text(message)
    data = message_data(message)
    requested = _first(data, "skill", "skill_id")

    show = _first(data, "show", "show_name", "title")
    show_id = _first(data, "show_id")
    if show_id is None:
        match = _SHOW_ID_RE.search(text)
        if match:
            show_id = match.group(1)
    season = _first(data, "season")
    if season is None:
        match = _SEASON_RE.search(text)
        if match:
            season = match.group(1)
    from_episode = _first(data, "from_episode", "episode")
    if from_episode is None:
        match = _EPISODE_RE.search(text)
        if match:
            from_episode = match.group(1)
    day = _first(data, "date", "day")
    if day is None:
        match = _DATE_RE.search(text)
        if match:
            day = match.group(1)
        elif _TOMORROW_RE.search(text):
            day = None  # resolved to tomorrow by the runner, not guessed here
    country = _first(data, "country", "country_code")
    if country is None:
        found = _COUNTRY_RE.search(text)
        if found:
            country = found.group(1)
    if day is None:
        # "on monday" is a date question, so it is resolved to the next such date.
        for name in DAY_NAMES:
            if re.search(rf"\b{name}\b", text, re.IGNORECASE):
                day = day_for_name(name)
                break
    limit = _first(data, "limit", default=DEFAULT_LIMIT)
    if limit == DEFAULT_LIMIT:
        found = _LIMIT_RE.search(text)
        if found:
            limit = found.group(1)
    episodes_per_day = _first(data, "episodes_per_day", "per_day")
    if episodes_per_day is None:
        found = _PER_DAY_RE.search(text)
        if found:
            episodes_per_day = found.group(1)
        else:
            spelled = _NUMBER_WORDS_RE.search(text)
            if spelled:
                episodes_per_day = _WORDS[spelled.group(1).lower()]

    wants_tomorrow = bool(_TOMORROW_RE.search(text))
    asks_schedule = bool(_SCHEDULE_WORDS.search(text))
    asks_binge = bool(_BINGE_WORDS.search(text))

    # "two episodes a night" is a watch rate, which only the binge plan costs, so it
    # routes there even when the sentence also mentions episodes.
    asks_binge = asks_binge or (episodes_per_day is not None and not _EPISODE_LIST_WORDS.search(text))

    if requested in _ALL_SKILLS:
        skill = requested
    elif asks_binge:
        skill = SKILL_BINGE_PLAN
    elif asks_schedule:
        skill = SKILL_SCHEDULE_DAY
    elif _NEXT_AIR_WORDS.search(text):
        skill = SKILL_NEXT_AIRING
    elif _EPISODE_WORDS.search(text):
        skill = SKILL_SHOW_EPISODES
    elif _SEARCH_WORDS.search(text):
        skill = SKILL_SHOW_SEARCH
    else:
        skill = SKILL_SHOW_SEARCH

    if show is None and show_id is None and skill != SKILL_SCHEDULE_DAY:
        # A day schedule is a place question, not a title question.
        show = show_from_text(text, None)
    if show is None and skill == SKILL_SHOW_SEARCH:
        # A bare word is the search term itself: there is nothing else it could mean.
        stripped = text.strip(" \t\n.?!,")
        if 2 <= len(stripped) <= 80 and " " not in stripped and _clean_title(stripped):
            show = stripped

    params: dict = {"limit": limit}
    for key, value in (("show", show), ("show_id", show_id), ("season", season),
                       ("from_episode", from_episode), ("date", day), ("country", country)):
        if value is not None:
            params[key] = value
    if skill == SKILL_SCHEDULE_DAY and day is None and wants_tomorrow:
        params["tomorrow"] = True
    if skill == SKILL_BINGE_PLAN:
        if from_episode is not None:
            params["from_episode"] = from_episode
        if episodes_per_day is not None:
            params["episodes_per_day"] = episodes_per_day

    if not requested and (not text.strip() or re.search(r"\b(help|what can you do|commands?)\b", text, re.IGNORECASE)):
        skill, params = "help", {}
    explicit = bool(requested or asks_schedule or asks_binge
                    or _NEXT_AIR_WORDS.search(text) or _EPISODE_WORDS.search(text)
                    or _SEARCH_WORDS.search(text))
    return {"skill": skill, "params": params, "explicit": explicit}


# -- shared shape ---------------------------------------------------------


def _artifact(params: dict, client: TvmazeClient, **extra) -> dict:
    artifact = {
        "dataset": DATASET,
        "product": "TVMaze show, episode and daily schedule data",
        "source": SOURCE,
        "freshness": client.freshness(),
    }
    artifact.update(extra)
    return artifact


def _missing_show() -> dict:
    return {
        "final_state": "input-required",
        "message": (
            "Which show? Give me a title such as “Severance”, or a TVMaze show id such as "
            "“show 44933”."
        ),
        "artifact": None,
        "watch": None,
    }


def _resolve_show(params: dict, client: TvmazeClient):
    """(show, problem) - problem is a finished response body, or None."""
    identifier = params.get("show") or params.get("show_id")
    if not identifier:
        return None, None
    try:
        show = client.show(identifier)
    except ValueError as exc:
        return None, {"final_state": "input-required", "message": str(exc),
                      "artifact": None, "watch": None}
    except UpstreamError:
        # singlesearch answers HTTP 404 for a name it does not know.
        return None, {
            "final_state": "completed",
            "message": (
                f"TVMaze has no show matching “{identifier}”. Give the exact title, or the "
                "TVMaze show id."
            ),
            "artifact": _artifact(params, client, show=None, query=identifier),
            "watch": None,
        }
    if show is None:
        return None, {
            "final_state": "completed",
            "message": (
                f"TVMaze has no show matching “{identifier}”. Give the exact title, or the "
                "TVMaze show id."
            ),
            "artifact": _artifact(params, client, show=None, query=identifier),
            "watch": None,
        }
    return show, None


# -- skills ---------------------------------------------------------------


def run_show_search(params: dict, client: TvmazeClient) -> dict:
    query = params.get("show")
    if not query:
        return {
            "final_state": "input-required",
            "message": "What show am I looking for? Give me a word or a title.",
            "artifact": None,
            "watch": None,
        }
    found = client.search_shows(query, limit=params.get("limit", DEFAULT_LIMIT))
    artifact = _artifact(params, client, query=query, shows=found, count=len(found))
    if not found:
        return {
            "final_state": "completed",
            "message": (
                f"TVMaze matches no show against “{query}”. TVMaze catalogues around "
                "10,000 shows and covers US, UK and Australian television mostly."
            ),
            "artifact": artifact,
            "watch": None,
        }
    lines = []
    for show in found[:10]:
        score = show.get("match_score")
        genres = ", ".join(show.get("genres") or []) or "no genres listed"
        bits = [f"{show.get('name')} (show {show.get('id')})"]
        if show.get("station"):
            bits.append(show["station"])
        bits.append(show.get("status") or "status not reported")
        bits.append(genres)
        if show.get("average_runtime"):
            bits.append(f"{show['average_runtime']} min")
        if show.get("rating") is not None:
            bits.append(f"rated {show['rating']}")
        line = "  • " + " - ".join(str(bit) for bit in bits)
        if score is not None:
            line += f" (match {score:.2f})"
        lines.append(line)
    return {
        "final_state": "completed",
        "message": (
            f"{len(found)} TVMaze show(s) for “{query}”:\n" + "\n".join(lines) +
            f"\nSource: {DATASET} (read live)."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_show_episodes(params: dict, client: TvmazeClient) -> dict:
    show, problem = _resolve_show(params, client)
    if problem:
        return problem
    if show is None:
        return _missing_show()
    episodes = client.episodes(show["id"])
    season = params.get("season")
    if season is not None:
        season = client.check_season(season)
        episodes = [ep for ep in episodes if ep.get("season") == season]
    artifact = _artifact(params, client, show=show, season=season, episodes=episodes,
                         count=len(episodes))
    if not episodes:
        where = f"season {season}" if season else "the show"
        return {
            "final_state": "completed",
            "message": (
                f"TVMaze lists no episodes for {where} of {client.place_label(show)}. "
                f"(Read live from {DATASET}.)"
            ),
            "artifact": artifact,
            "watch": None,
        }
    lines = []
    for episode in episodes[:MAX_LISTED_EPISODES]:
        parts = [f"  • {episode.get('label')}"]
        if episode.get("name"):
            parts.append(str(episode["name"]))
        air = episode.get("airtime") or ""
        when = f"{episode.get('airdate')}" + (f" {air}" if air else "")
        parts.append(when or "no airdate")
        if episode.get("runtime"):
            parts.append(f"{episode['runtime']} min")
        if episode.get("rating") is not None:
            parts.append(f"rated {episode['rating']}")
        lines.append(" - ".join(parts))
    more = len(episodes) - len(lines)
    tail = f"\n  • ... {more} more episode(s) are in the artifact." if more > 0 else ""
    return {
        "final_state": "completed",
        "message": (
            f"{len(episodes)} episode(s) of {client.place_label(show)}"
            + (f", season {season}" if season else "")
            + ":\n" + "\n".join(lines) + tail +
            f"\nSource: {DATASET} (read live)."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_next_airing(params: dict, client: TvmazeClient) -> dict:
    show, problem = _resolve_show(params, client)
    if problem:
        return problem
    if show is None:
        return _missing_show()
    upcoming = client.next_episode(show["id"])
    artifact = _artifact(params, client, show=show, next_episode=upcoming)
    if upcoming is None:
        status = show.get("status") or "status not reported"
        return {
            "final_state": "completed",
            "message": (
                f"TVMaze has no future episode scheduled for {client.place_label(show)} - its status "
                f"is “{status}”. A show with no future airstamp is not the same as a show that "
                f"has ended, so check with the broadcaster. (Read live from {DATASET}.)"
            ),
            "artifact": artifact,
            "watch": None,
        }
    when = f"{upcoming.get('airdate')}" + (f" {upcoming.get('airtime')}" if upcoming.get("airtime") else "")
    when = when or "no airdate published"
    detail = ""
    if upcoming.get("runtime"):
        detail = f", {upcoming['runtime']} min"
    return {
        "final_state": "completed",
        "message": (
            f"{client.place_label(show)} airs next: {upcoming.get('label')}"
            + (f" “{upcoming['name']}”" if upcoming.get("name") else "")
            + f" on {when}{detail} (UTC airstamp {upcoming.get('airstamp')}).\n"
            f"Source: {DATASET} (read live). TVMaze publishes the schedule; the broadcaster can move it."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_schedule_day(params: dict, client: TvmazeClient) -> dict:
    day = params.get("date")
    if day is None and params.get("tomorrow"):
        day = (datetime.now(timezone.utc).date() + timedelta(days=1)).isoformat()
    country = params.get("country")
    rows = client.schedule(day, country, limit=params.get("limit", DEFAULT_LIMIT))
    artifact = _artifact(params, client, date=day or "today (UTC)", country=country,
                         country_scope=country or "every country TVMaze lists",
                         entries=rows, count=len(rows))
    where = f"on {day}" if day else "today (UTC)"
    scope = f" in {client.check_country(country)}" if country else " across every country TVMaze lists"
    if not rows:
        return {
            "final_state": "completed",
            "message": (
                f"TVMaze schedules no episodes {where}{scope}. (Read live from {DATASET}.)"
            ),
            "artifact": artifact,
            "watch": None,
        }
    lines = []
    for entry in rows[:12]:
        bits = [f"  • {entry.get('label')}"]
        bits.append(str(entry.get("show_name") or "show not reported"))
        if entry.get("name"):
            bits.append(str(entry["name"]))
        bits.append((entry.get("airtime") or "time not reported").strip())
        if entry.get("station"):
            bits.append(str(entry["station"]))
        lines.append(" - ".join(bits))
    more = len(rows) - len(lines)
    tail = f"\n  • ... {more} more listing(s) are in the artifact." if more > 0 else ""
    return {
        "final_state": "completed",
        "message": (
            f"{len(rows)} TVMaze listing(s) {where}{scope}:\n" + "\n".join(lines) + tail +
            f"\nSource: {DATASET} (read live). Airtimes are the stations' own local times as TVMaze stores them."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_binge_plan(params: dict, client: TvmazeClient, gateway: GatewayClient) -> dict:
    """The premium finish-the-season plan. The work runs on the gateway.

    Nothing here reads TVMaze's episode list: the gateway resolves the show, reads
    the season and does the arithmetic behind its licence check, so a caller who has
    not paid gets the gateway's own message and no episodes at all.
    """
    identifier = params.get("show") or params.get("show_id")
    if not identifier:
        return _missing_show()
    try:
        arguments = {"show": str(identifier)}
        if params.get("season") is not None:
            arguments["season"] = client.check_season(params["season"])
        if params.get("from_episode") is not None:
            arguments["from_episode"] = client.check_episode(params["from_episode"])
        if params.get("episodes_per_day") is not None:
            per_day = float(params["episodes_per_day"])
            if not 0.5 <= per_day <= 20:
                raise ValueError("episodes a day must be between 0.5 and 20")
            arguments["episodes_per_day"] = per_day
    except (TypeError, ValueError) as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}

    read, refused = premium_call(gateway, "tv_binge_plan", arguments, {
        "dataset": DATASET, "show": str(identifier),
    })
    if refused:
        return refused
    if not isinstance(read, dict) or not read.get("show"):
        return empty_premium_answer(
            "The licence gateway answered without naming the show, so there is nothing to report.",
            {"dataset": DATASET, "show": str(identifier)},
        )

    show_name = read.get("show")
    left = read.get("episodesLeft")
    total_hours = read.get("totalHours")
    if not isinstance(left, int) or left == 0:
        verdict = read.get("verdict") or f"Season {read.get('season')} of {show_name} is already finished."
        return {
            "final_state": "completed",
            "message": f"{verdict}\nComputed on the MCP gateway behind its licence check, from {DATASET}.",
            "artifact": {
                "dataset": DATASET,
                "source": SOURCE,
                "premium": True,
                "show": show_name,
                "season": read.get("season"),
                "episodes_left": 0,
            },
            "watch": None,
        }

    lines = [
        f"{show_name}, season {read.get('season')}: {left} episode(s) left"
        + (f" after episode {read.get('fromEpisode')}" if read.get("fromEpisode") is not None else "")
        + (f", {total_hours} h of screen time." if total_hours is not None else "."),
    ]
    episodes = read.get("episodes") or []
    for episode in episodes[:MAX_LISTED_EPISODES]:
        when = str(episode.get("airdate") or "no airdate")
        if episode.get("airtime"):
            when += f" {episode['airtime']}"
        runtime = f", {episode['runtime']} min" if episode.get("runtime") else ""
        lines.append(
            f"  • {episode.get('label') or 'episode not numbered'}"
            + (f" “{episode.get('name')}”" if episode.get("name") else "")
            + f" on {when}{runtime}"
        )
    if len(episodes) > MAX_LISTED_EPISODES:
        lines.append(f"  • ... {len(episodes) - MAX_LISTED_EPISODES} more episode(s) are in the artifact.")
    if read.get("lastAirdate"):
        lines.append(f"  • Season finale airs {read['lastAirdate']}."
                    if read.get("seasonFinaleAirstamp")
                    else f"  • Last listed airdate {read['lastAirdate']}.")
    if read.get("finishDate"):
        lines.append(
            f"  • At {read.get('episodesPerDay')} episode(s) a day you finish around {read['finishDate']}."
        )
    if read.get("scheduleDay"):
        slot = f"{read['scheduleDay']}"
        if read.get("scheduleTime"):
            slot += f" at {read['scheduleTime']}"
        lines.append(f"  • TVMaze schedules this show {slot}.")
    if read.get("note"):
        lines.append(f"  • {read['note']}")
    lines.append(
        "\nComputed on the MCP gateway behind its licence check, from TVMaze's published schedule "
        f"({DATASET}). A broadcaster can move an episode, so read the dates as a plan."
    )
    artifact = {
        "dataset": DATASET,
        "source": SOURCE,
        "premium": True,
        "show": show_name,
        "show_id": read.get("showId"),
        "season": read.get("season"),
        "status": read.get("status"),
        "station": read.get("network"),
        "episodes_left": left,
        "episode_count": read.get("episodeCount"),
        "total_minutes": read.get("totalMinutes"),
        "total_hours": total_hours,
        "episodes_per_day": read.get("episodesPerDay"),
        "days_needed": read.get("daysNeeded"),
        "finish_date": read.get("finishDate"),
        "last_airdate": read.get("lastAirdate"),
        "schedule_day": read.get("scheduleDay"),
        "schedule_time": read.get("scheduleTime"),
        "episodes": episodes,
    }
    return {"final_state": "completed", "message": "\n".join(lines), "artifact": artifact, "watch": None}


class TvMazeAgent(SkillAgent):
    name = "tvmaze"
    card_name = "TVMaze Agent"
    card_description = (
        "Read-only agent over TVMaze, the open television schedule database: show search with match "
        "scores, a show's episode list by season, the next air date from its own episode airstamps, and "
        "everything scheduled to air on a given day for a country or worldwide. Every answer is read "
        "live from TVMaze."
    )
    env_prefix = "TVMAZE"
    datasets = (DATASET,)
    card_skills = CARD_SKILLS

    def __init__(self, client: TvmazeClient | None = None,
                 gateway: GatewayClient | None = None) -> None:
        self.client = client or TvmazeClient()
        # The documented <PREFIX>_GATEWAY_URL override is passed in explicitly:
        # the shared client otherwise only looks at A2A_GATEWAY_URL.
        self.gateway = gateway or GatewayClient(url=os.environ.get(f"{self.env_prefix}_GATEWAY_URL"))

    def parse(self, message: dict) -> dict:
        return parse(message)

    def missing(self, skill: str, params: dict) -> list[str]:
        if skill in (SKILL_SHOW_SEARCH, SKILL_SHOW_EPISODES, SKILL_NEXT_AIRING, SKILL_BINGE_PLAN):
            return [] if (params.get("show") or params.get("show_id")) else ["show"]
        return []

    def input_prompt(self, skill: str, missing: list[str]) -> str:
        if skill == SKILL_SHOW_SEARCH:
            return "What show am I looking for? Give me a word or a title."
        return _missing_show()["message"]

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
        if skill == SKILL_BINGE_PLAN:
            return run_binge_plan(params, self.client, self.gateway)
        if skill == SKILL_SHOW_EPISODES:
            return run_show_episodes(params, self.client)
        if skill == SKILL_NEXT_AIRING:
            return run_next_airing(params, self.client)
        if skill == SKILL_SCHEDULE_DAY:
            return run_schedule_day(params, self.client)
        if skill == SKILL_SHOW_SEARCH:
            return run_show_search(params, self.client)
        return {"final_state": "completed", "message": HELP, "artifact": None, "watch": None}


__all__ = [
    "CARD_SKILLS",
    "DAY_NAMES",
    "DEFAULT_LIMIT",
    "HELP",
    "MAX_LISTED_EPISODES",
    "SKILL_BINGE_PLAN",
    "SKILL_NEXT_AIRING",
    "SKILL_SCHEDULE_DAY",
    "SKILL_SHOW_EPISODES",
    "SKILL_SHOW_SEARCH",
    "TvMazeAgent",
    "UpstreamError",
    "message_data",
    "message_text",
    "parse",
    "run_binge_plan",
    "run_next_airing",
    "run_schedule_day",
    "run_show_episodes",
    "run_show_search",
    "show_from_text",
]
