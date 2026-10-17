"""The ESPN agent: four free skills and one premium one.

  - scores:      fixtures and live scores for one league on one date
  - team-lookup: a team by name, abbreviation or city, with its league and id
  - standings:   a league's table for a season
  - game-detail: one game by its ESPN event id
  - slate-brief: every game across up to five leagues on one date - premium

Slate-brief is the one question the free skills cannot answer. They each read one
league, because that is one request. "What is on tonight" is a question about several
leagues at once, and the answer has to count what is live, what is final and what has
not started across all of them, so that work runs on a hosted service that was removed and a
caller who has not paid gets a not-implemented stub message and no games at all.
"""

from __future__ import annotations

import os
import re
from datetime import datetime, timedelta, timezone

from a2a_kit import SkillAgent, UpstreamError

from data import (
    DATASET,
    DEFAULT_LEAGUES,
    LEAGUES,
    SOURCE,
    EspnClient,
    league_code,
    league_name,
)

SKILL_SCORES = "scores"
SKILL_TEAM_LOOKUP = "team-lookup"
SKILL_STANDINGS = "standings"
SKILL_GAME_DETAIL = "game-detail"
SKILL_SLATE_BRIEF = "slate-brief"

DEFAULT_LIMIT = 15
MAX_LISTED = 25
DEFAULT_SLATE_DATE_OFFSET = 1

CARD_SKILLS = [
    {
        "id": SKILL_SCORES,
        "name": "Scores and fixtures",
        "description": (
            "Fixtures and live scores for one league on one date: both teams, the score or the tip-off "
            "time, whether the game is scheduled, in progress or final, plus venue, broadcast and the "
            "over/under and spread where ESPN publishes them. Defaults to today."
        ),
        "tags": ["sports", "scores", "fixtures", "live", "espn"],
        "examples": [
            "what are the nba scores today?",
            "mlb scores for 2026-09-28",
            '{"skill": "scores", "league": "nhl", "date": "2026-09-28"}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_TEAM_LOOKUP,
        "name": "Look up a team",
        "description": (
            "Find a team by full name, short name, nickname or city within a league: its ESPN id, "
            "abbreviation, division and clubhouse link. Useful when you have the city and need the id."
        ),
        "tags": ["sports", "teams", "lookup", "espn"],
        "examples": [
            "look up the Toronto Raptors",
            "which team is MIA in the nba?",
            '{"skill": "team-lookup", "league": "nba", "team": "Raptors"}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_STANDINGS,
        "name": "League standings",
        "description": (
            "A league's table for a season: every division or conference, and each team's wins, "
            "losses, ties, win percentage, games back, rank and playoff seed. The season ESPN is "
            "currently publishing is named in the answer."
        ),
        "tags": ["sports", "standings", "table", "division", "espn"],
        "examples": [
            "nba standings",
            "who is top of the mlb table",
            '{"skill": "standings", "league": "nfl", "season": 2026}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_GAME_DETAIL,
        "name": "One game's detail",
        "description": (
            "One game by ESPN event id: both teams and their records, the score or the start time, the "
            "period and clock, the venue, the attendance and officials, the broadcast, and the "
            "over/under and spread."
        ),
        "tags": ["sports", "game", "detail", "summary", "espn"],
        "examples": [
            "game detail for event 401902644",
            '{"skill": "game-detail", "league": "nba", "event_id": "401902644"}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_SLATE_BRIEF,
        "name": "Tonight across the leagues",
        "description": (
            "Every game on one date across up to five leagues at once: one line per game with the "
            "league, the teams, the score or start time and whether it is live, final or still to come, "
            "plus how many games each league contributed and the totals. Premium: it runs behind a "
            "licence check."
        ),
        "tags": ["sports", "slate", "tonight", "schedule", "multi-league",],
        "examples": [
            "what is on tonight across the leagues?",
            "brief me on every nba, nfl and nhl game tomorrow",
            '{"skill": "slate-brief", "date": "2026-09-28", "leagues": "nba,nfl,nhl", "limit": 40}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
]

_EVENT_ID_RE = re.compile(r"\b(?:event|game|id) (?:id )?(\d{4,12})\b", re.IGNORECASE)
#: A follow-up is often just the number, so a bare ESPN id is read too - but not an
#: eight-digit date, which is the one thing a bare number of that length can also be.
_BARE_ID_RE = re.compile(r"\b(\d{8,12})\b")


def _looks_like_a_date(digits: str) -> bool:
    from datetime import date

    try:
        date(int(digits[:4]), int(digits[4:6]), int(digits[6:8]))
    except ValueError:
        return False
    return len(digits) == 8
_DATE_RE = re.compile(r"\b(\d{4}-\d{2}-\d{2})\b")
_YEAR_RE = re.compile(r"\b(19\d{2}|20\d{2}|21\d{2})\b")
_LIMIT_RE = re.compile(r"\b(?:top|first|limit|last)\s+(\d{1,3})\b", re.IGNORECASE)
_TOMORROW_RE = re.compile(r"\btomorrow\b", re.IGNORECASE)
_TODAY_RE = re.compile(r"\btoday\b|\btonight\b|\bright now\b|\bthis (?:evening|afternoon)\b", re.IGNORECASE)
_LEAGUE_WORD_RE = re.compile(
    r"\b(nba|nfl|nhl|mlb|mls|epl|premier league|eng1|ncaaf|ncaab|"
    r"college football|college basketball|american football|ice hockey|"
    r"basketball|football|hockey|baseball|soccer)\b",
    re.IGNORECASE,
)
_STANDINGS_WORDS = re.compile(
    r"\b(standings?|table|ladder|who(?:'s| is) (?:top|first)|top of the|"
    r"division|conference|playoff (?:seed|spot)|how many wins)\b",
    re.IGNORECASE,
)
_TEAM_LOOKUP_WORDS = re.compile(
    r"\b(look up|lookup|find|which team|what team|who are|who is|"
    r"team (?:called|named|id)|abbr(?:eviation)?)\b",
    re.IGNORECASE,
)
_DETAIL_WORDS = re.compile(
    r"\b(details?|summary|box ?score|recap|more about (?:the|that) game|"
    r"what happened in)\b",
    re.IGNORECASE,
)
#: A game detail asked for without an id still belongs to game-detail, so it comes back
#: as a question for the id rather than as a scoreboard nobody asked for.
_GAME_DETAIL_WORDS = re.compile(
    r"\b(?:game|event|fixture|match) (?:detail|summary|recap|info(?:rmation)?)\b|"
    r"\b(?:detail|summary|recap)(?:s)? (?:for|of|on) (?:the |that |this )?game\b|"
    r"\b(?:that|the|this) game\b",
    re.IGNORECASE,
)
_SCORE_WORDS = re.compile(
    r"\b(scores?|fixtures?|schedule|who (?:plays?|is playing)|"
    r"what(?:'s| is) (?:on|playing|the score)|games? (?:today|tonight|tomorrow)|"
    r"results?|line|box ?score)\b",
    re.IGNORECASE,
)
#: The premium skill asks about several leagues at once. Deliberately narrow: one league
#: stays with scores, because one request is all a single league needs.
_SLATE_WORDS = re.compile(
    r"\b(slate|brief me|what(?:'s| is) on tonight|what(?:'s| is) on tomorrow|"
    r"everything (?:on|playing) (?:today|tonight|tomorrow)|"
    r"across (?:the |all )?leagues?|every (?:league|game|sport)|"
    r"all (?:the )?(?:games?|leagues?|sports?)|"
    r"tonight(?:'s)? (?:slate|line|board)|"
    r"full (?:slate|board|schedule)|"
    r"(?:what|which) (?:games?|matches?) (?:are|is) (?:on|playing)|"
    r"give me (?:a|the) (?:full |whole )?(?:board|slate))\b",
    re.IGNORECASE,
)
_QUOTED_RE = re.compile(r"[\"“”'‘’]([^\"“”]{2,60})[\"“”'‘’]")
_TEAM_WORD = r"[A-Z][A-Za-z0-9'’.\-&]{0,28}"
_CAPITALISED_RE = re.compile(
    rf"\b({_TEAM_WORD}(?:(?:\s+(?:of|the|and|&)\s+|\s+){_TEAM_WORD}){{0,4}})"
)
_ALL_SKILLS = (SKILL_SCORES, SKILL_TEAM_LOOKUP, SKILL_STANDINGS, SKILL_GAME_DETAIL,
               SKILL_SLATE_BRIEF)

HELP = (
    "I read ESPN's public site API. Ask me:\n"
    "  • what are the nba scores today?\n"
    "  • mlb scores for 2026-09-28\n"
    "  • look up the Toronto Raptors\n"
    "  • nba standings\n"
    "  • game detail for event 401902644\n"
    "  • what is on tonight across the leagues?\n"
    "Leagues available: " + ", ".join(sorted(LEAGUES)) + ".\n"
    "Scores, times and tables are ESPN's own, read live. ESPN publishes no odds on some "
    "leagues and no records on others, and I say so rather than filling the gap in."
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


def leagues_from_text(text: str) -> list[str]:
    """Every league named in the text, as canonical ESPN codes."""
    found: list[str] = []
    for word in _LEAGUE_WORD_RE.findall(text):
        try:
            code = league_code(word)
        except ValueError:
            continue
        if code not in found:
            found.append(code)
    return found


def league_from_text(text: str) -> str | None:
    """The one league named, or None when none or several are."""
    found = leagues_from_text(text)
    return found[0] if len(found) == 1 else None


def team_from_text(text: str, team: str | None) -> str | None:
    """A team name only when the text offers one - never the whole question."""
    if team:
        return None
    quoted = _QUOTED_RE.search(text)
    if quoted:
        return quoted.group(1).strip(" .,'’")
    for pattern in (r"\bteam\s+(?:called|named)\s+([A-Za-z0-9'’.&\- ]{2,40})",
                    r"\b([A-Z][A-Za-z0-9'’.\-&]{1,28}(?:\s+[A-Z][A-Za-z0-9'’.\-&]{1,28}){0,3})\s+"
                    r"(?:are playing|play|vs\.?|versus)\b",
                    r"\b(?:look up|find|which team is|what team is)\s+"
                    r"(?:an?\s+|the\s+)?([A-Za-z0-9'’.&\- ]{2,40})"):
        match = re.search(pattern, text, re.IGNORECASE if "team" in pattern else 0)
        if not match:
            continue
        candidate = match.group(1).strip(" .,'’")
        candidate = re.split(r"\s+(?:in|of|for|from)\s+(?:the\s+)?[A-Za-z.]{2,12}\s*$",
                             candidate, maxsplit=1)[0].strip(" .,'’")
        # A question word is not a team name.
        if candidate.lower() in ("the", "a", "an", "this", "that", "nba", "nfl", "nhl", "mlb"):
            continue
        if candidate and not re.match(r"^(?:who|what|which|when|where|is|are)$", candidate, re.IGNORECASE):
            return candidate
    capitals = _CAPITALISED_RE.search(text)
    if capitals:
        candidate = capitals.group(1).strip(" .,'’")
        if candidate.lower() not in ("nba", "nfl", "nhl", "mlb", "tonight", "today", "tomorrow"):
            return candidate
    return None


def parse(message: dict) -> dict:
    """Incoming message -> {skill, params, explicit}. Never raises."""
    text = message_text(message)
    data = message_data(message)
    requested = _first(data, "skill", "skill_id")

    league = _first(data, "league", "league_code", "sport")
    leagues = _first(data, "leagues")
    team = _first(data, "team", "team_name")
    event_id = _first(data, "event_id", "game_id")
    if event_id is None:
        match = _EVENT_ID_RE.search(text)
        if match:
            event_id = match.group(1)
    if event_id is None:
        for match in _BARE_ID_RE.finditer(text):
            if not _looks_like_a_date(match.group(1)):
                event_id = match.group(1)
                break
    day = _first(data, "date", "day")
    if day is None:
        match = _DATE_RE.search(text)
        if match:
            day = match.group(1)
    season = _first(data, "season")
    if season is None and re.search(r"\bseason\b|\b(19\d{2}|20\d{2})\s*(?:season|table|standings)\b",
                                    text, re.IGNORECASE):
        # Only a year read as a season counts: the year inside 2026-09-28 is a date.
        match = _YEAR_RE.search(text)
        if match:
            season = match.group(1)
    limit = _first(data, "limit", default=DEFAULT_LIMIT)
    if limit == DEFAULT_LIMIT:
        match = _LIMIT_RE.search(text)
        if match:
            limit = match.group(1)

    named_leagues = leagues_from_text(text)
    if league is None and named_leagues:
        league = named_leagues[0]
    if team is None:
        team = team_from_text(text, None)

    asks_tomorrow = bool(_TOMORROW_RE.search(text))
    asks_today = bool(_TODAY_RE.search(text))
    asks_slates = bool(_SLATE_WORDS.search(text))

    if requested in _ALL_SKILLS:
        skill = requested
    elif asks_slates:
        skill = SKILL_SLATE_BRIEF
    elif event_id is not None or _GAME_DETAIL_WORDS.search(text):
        skill = SKILL_GAME_DETAIL
    elif _STANDINGS_WORDS.search(text):
        skill = SKILL_STANDINGS
    elif (_TEAM_LOOKUP_WORDS.search(text) and team and not _SCORE_WORDS.search(text)) \
            or (_DETAIL_WORDS.search(text) and team):
        skill = SKILL_TEAM_LOOKUP
    elif _SCORE_WORDS.search(text) or _TODAY_RE.search(text):
        skill = SKILL_SCORES
    elif team:
        skill = SKILL_TEAM_LOOKUP
    else:
        skill = SKILL_SCORES

    params: dict = {"limit": limit}
    for key, value in (("league", league), ("leagues", leagues), ("team", team),
                       ("event_id", event_id), ("date", day), ("season", season)):
        if value is not None:
            params[key] = value
    if skill in (SKILL_SCORES, SKILL_SLATE_BRIEF) and day is None and asks_tomorrow:
        params["tomorrow"] = True
    if skill == SKILL_SLATE_BRIEF:
        # The brief reads several boards at once. An explicit list wins; with nothing
        # named it covers the four leagues a bare "what is on tonight" means.
        if leagues:
            params["leagues"] = str(leagues)
        else:
            params["leagues"] = ",".join(named_leagues) if named_leagues else ",".join(DEFAULT_LEAGUES)
    else:
        params.pop("leagues", None)  # only the brief reads several leagues at once
    if skill in (SKILL_SCORES, SKILL_SLATE_BRIEF) and day is None and not asks_today \
            and not asks_tomorrow:
        # Neither "today" nor "tomorrow" was said, so no date is forced on ESPN: it
        # answers with the board it is currently serving.
        params["next_day"] = True

    if not requested and (not text.strip() or re.search(r"\b(help|what can you do|commands?)\b", text, re.IGNORECASE)):
        skill, params = "help", {}
    explicit = bool(requested or asks_slates or asks_today
                    or event_id or _STANDINGS_WORDS.search(text) or _SCORE_WORDS.search(text)
                    or _TEAM_LOOKUP_WORDS.search(text) or _DETAIL_WORDS.search(text))
    return {"skill": skill, "params": params, "explicit": explicit}


# -- shared shape ---------------------------------------------------------


def _artifact(params: dict, client: EspnClient, **extra) -> dict:
    artifact = {
        "dataset": DATASET,
        "product": "ESPN public site API: scores, fixtures, teams, standings and game summaries",
        "source": SOURCE,
        "freshness": client.freshness(),
    }
    artifact.update(extra)
    return artifact


def _missing_league() -> dict:
    return {
        "final_state": "input-required",
        "message": (
            "Which league? " + ", ".join(sorted(LEAGUES)) +
            ". Or ask me what is on tonight across the leagues."
        ),
        "artifact": None,
        "watch": None,
    }


def _default_league() -> str:
    """With no league named, NBA is the one most questions mean."""
    return DEFAULT_LEAGUES[0]


def _resolve_day(params: dict, client: EspnClient) -> str | None:
    """The date a read means, or None to ask ESPN for the board it currently considers current.

    A named date is used as given and "tomorrow" means tomorrow. A question that named
    no day at all - "what are the mlb scores" - sends no `dates` parameter, so ESPN
    answers with the board it is currently serving rather than with a day the caller
    never asked for, and the answer says which of the two it did.
    """
    if params.get("date"):
        return client.check_date(params["date"])
    if params.get("tomorrow"):
        return (datetime.now(timezone.utc).date() + timedelta(days=1)).isoformat()
    if params.get("next_day"):
        return None
    return datetime.now(timezone.utc).date().isoformat()


def _score_line(game: dict) -> str:
    away = game.get("away") or {}
    home = game.get("home") or {}
    bits = [f"  • {away.get('team') or 'away not reported'} at {home.get('team') or 'home not reported'}"]
    if game.get("state") == "post":
        bits.append(f"final {away.get('score') or '?'} - {home.get('score') or '?'}")
    elif game.get("state") == "in":
        clock = f" {game.get('clock')}" if game.get("clock") else ""
        period = game.get("period")
        bits.append(f"LIVE{clock}" + (f", period {period}" if period else ""))
        bits.append(f"{away.get('score') or '?'} - {home.get('score') or '?'}")
    else:
        bits.append(str(game.get("detail") or "time not reported"))
    if game.get("venue"):
        bits.append(str(game["venue"]))
    if game.get("odds") and game["odds"].get("over_under") is not None:
        bits.append(f"O/U {game['odds']['over_under']}")
    return " - ".join(str(bit) for bit in bits)


# -- skills ---------------------------------------------------------------


def run_scores(params: dict, client: EspnClient) -> dict:
    league = params.get("league") or _default_league()
    try:
        league = client.check_league(league)
        day = _resolve_day(params, client)
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    games = client.scoreboard(league, day=day, limit=params.get("limit", DEFAULT_LIMIT))
    name = league_name(league)
    when = day or "ESPN's current board"
    artifact = _artifact(params, client, league=league, league_name=name,
                         date=day or "current board", date_named=bool(day),
                         games=games, count=len(games))
    if not games:
        return {
            "final_state": "completed",
            "message": (
                f"ESPN lists no {name} games on {when}. That is normal in the off season and normal on "
                f"a rest day. (Read live from {DATASET}.)"
            ),
            "artifact": artifact,
            "watch": None,
        }
    live = [game for game in games if game.get("state") == "in"]
    finals = [game for game in games if game.get("state") == "post"]
    lines = [_score_line(game) for game in games[:MAX_LISTED]]
    if len(games) > MAX_LISTED:
        lines.append(f"  • ... {len(games) - MAX_LISTED} more game(s) are in the artifact.")
    tally = f"{len(games)} game(s) on {when}: {len(live)} live, {len(finals)} final."
    return {
        "final_state": "completed",
        "message": (
            f"{name}, {tally}\n" + "\n".join(lines) +
            f"\nSource: {DATASET} (read live). Start times are the venue's own local time as ESPN "
            "publishes it; ESPN publishes odds on some leagues and not others."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_team_lookup(params: dict, client: EspnClient) -> dict:
    league = params.get("league") or _default_league()
    team = params.get("team")
    if not team:
        return {
            "final_state": "input-required",
            "message": "Which team? A full name, a nickname, a city or an abbreviation.",
            "artifact": None,
            "watch": None,
        }
    try:
        league = client.check_league(league)
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    teams = client.teams(league, limit=100)
    needle = str(team).strip().lower()
    matches = [row for row in teams if _team_matches(row, needle)]
    exact = [row for row in teams if str(row.get("displayName") or "").lower() == needle]
    artifact = _artifact(params, client, league=league, league_name=league_name(league),
                         query=team, teams=(exact or matches)[:10], count=len(exact or matches))
    if not matches:
        return {
            "final_state": "completed",
            "message": (
                f"No {league_name(league)} team matches “{team}”. ESPN lists "
                f"{len(teams)} team(s) in this league; try a city, a nickname or an abbreviation."
            ),
            "artifact": artifact,
            "watch": None,
        }
    chosen = (exact or matches)[:5]
    lines = []
    for row in chosen:
        bits = [f"  • {row.get('displayName') or 'name not reported'}"]
        if row.get("abbreviation"):
            bits.append(str(row["abbreviation"]))
        if row.get("location") and row.get("name"):
            bits.append(f"{row['location']} {row['name']}")
        bits.append(f"ESPN team id {row.get('id')}")
        if row.get("isActive") is False:
            bits.append("inactive")
        lines.append(" - ".join(str(bit) for bit in bits))
    more = len(exact or matches) - len(lines)
    tail = f"\n  • ... {more} more match(es) are in the artifact." if more > 0 else ""
    return {
        "final_state": "completed",
        "message": (
            f"{len(exact or matches)} {league_name(league)} team match(es) for “{team}”:"
            "\n" + "\n".join(lines) + tail +
            f"\nSource: {DATASET} (read live)."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_standings(params: dict, client: EspnClient) -> dict:
    league = params.get("league") or _default_league()
    try:
        league = client.check_league(league)
        season = client.check_season(params["season"]) if params.get("season") is not None else None
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    table = client.standings(league, season=season)
    groups = table.get("groups") or []
    artifact = _artifact(params, client, league=league, league_name=table.get("league_name"),
                         season=table.get("season"), groups=groups, group_count=len(groups),
                         season_scope="ESPN's currently published season")
    if not groups:
        return {
            "final_state": "completed",
            "message": (
                f"ESPN publishes no {table.get('league_name') or league} table right now - some "
                f"leagues have no season in progress. (Read live from {DATASET}.)"
            ),
            "artifact": artifact,
            "watch": None,
        }
    season_note = f", {table['season']} season" if table.get("season") else ""
    lines = []
    for group in groups[:6]:
        lines.append(f"  • {group['name']}:")
        for row in group["entries"][:MAX_LISTED]:
            stats = row.get("stats") or {}
            record = _record_text(stats)
            bits = [f"    - {row.get('displayName') or 'team not reported'}"]
            if stats.get("rank") is not None:
                bits.append(f"#{stats['rank']}")
            if record:
                bits.append(record)
            if stats.get("games_behind") not in (None, ""):
                bits.append(f"{stats['games_behind']} GB")
            if stats.get("win_percent") is not None:
                bits.append(f"{stats['win_percent']} win%")
            lines.append(" - ".join(str(bit) for bit in bits))
        if len(group["entries"]) > MAX_LISTED:
            lines.append(f"    - ... {len(group['entries']) - MAX_LISTED} more team(s) in the artifact.")
    return {
        "final_state": "completed",
        "message": (
            f"{table.get('league_name') or league} standings{season_note}, {len(groups)} group(s):\n"
            + "\n".join(lines)
            + f"\nSource: {DATASET} (read live). ESPN's currently published season unless a season "
            "was named."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_game_detail(params: dict, client: EspnClient) -> dict:
    event_id = params.get("event_id")
    if not event_id:
        return {
            "final_state": "input-required",
            "message": "Which game? Give me its ESPN event id, for example “game 401902644”.",
            "artifact": None,
            "watch": None,
        }
    try:
        event_id = client.check_event_id(event_id)
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    league = params.get("league")
    try:
        league = client.check_league(league) if league else None
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    if league is None:
        # Nobody said which league, so the id is looked for in the four that matter and
        # the league it belongs to is reported back. A follow-up that is only a number is
        # exactly the case this exists for.
        found = None
        for candidate in DEFAULT_LEAGUES:
            # A miss raises rather than returning None, because ESPN answers HTTP 404 for
            # an id that belongs to another league. Here that is the expected answer.
            try:
                if client.summary(candidate, event_id) is not None:
                    found = candidate
                    break
            except UpstreamError:
                continue
        league = found or _default_league()
    game = client.summary(league, event_id)
    if game is None:
        return {
            "final_state": "completed",
            "message": (
                f"ESPN has no {league_name(league)} game with event id {event_id}. "
                f"Check the league, or take an id from a scoreboard. (Read live from {DATASET}.)"
            ),
            "artifact": _artifact(params, client, league=league, event_id=event_id, game=None),
            "watch": None,
        }
    away = game.get("away") or {}
    home = game.get("home") or {}
    lines = [
        f"  • {away.get('team') or 'away not reported'} at {home.get('team') or 'home not reported'}",
        f"  • State: {game.get('state')}"
        + (f" - {game.get('detail')}" if game.get("detail") else ""),
        f"  • Score: away {away.get('score') or 'not reported'}, home {home.get('score') or 'not reported'}",
    ]
    records = {side: (game.get(side) or {}).get("records") for side in ("away", "home")}
    if records["away"] or records["home"]:
        lines.append(
            "  • Records: away "
            + (", ".join(records["away"]) or "not reported")
            + " - home " + (", ".join(records["home"]) or "not reported")
        )
    if game.get("venue"):
        lines.append(f"  • Venue: {game['venue']}")
    if game.get("attendance") is not None:
        lines.append(f"  • Attendance: {game['attendance']}")
    if game.get("officials"):
        lines.append(f"  • Officials: {', '.join(game['officials'][:5])}")
    if game.get("broadcast"):
        lines.append(f"  • Broadcast: {game['broadcast']}")
    odds = game.get("odds")
    if odds and odds.get("over_under") is not None:
        lines.append(f"  • Odds: {odds.get('details') or 'not reported'}"
                     f", over/under {odds['over_under']}"
                     + (f", spread {odds['spread']}" if odds.get("spread") is not None else ""))
    else:
        lines.append("  • Odds: ESPN publishes none for this game")
    for note in game.get("notes") or []:
        lines.append(f"  • Note: {note}")
    return {
        "final_state": "completed",
        "message": (
            f"{league_name(league)} game {event_id}:\n" + "\n".join(lines) +
            f"\nSource: {DATASET} (read live)."
        ),
        "artifact": _artifact(params, client, league=league, league_name=league_name(league),
                              league_named=bool(params.get("league")),
                              event_id=event_id, game=game),
        "watch": None,
    }


def run_slate_brief(params: dict, client: EspnClient, gateway: object) -> dict:
    """Stub: the hosted implementation of this skill was removed in the paywall cleanup."""
    return {
        "final_state": "completed",
        "message": 'Not yet implemented: slate-brief — its hosted implementation was removed.',
        "artifact": {"removed": True},
        "watch": None,
    }


def _team_matches(team: dict, needle: str) -> bool:
    for field in ("displayName", "shortDisplayName", "abbreviation", "location", "name"):
        value = team.get(field)
        if value and needle in str(value).lower():
            return True
    return False


def _record_text(stats: dict) -> str:
    wins, losses, ties = stats.get("wins"), stats.get("losses"), stats.get("ties")
    if wins in (None, "") and losses in (None, ""):
        return ""
    parts = [f"{wins if wins not in (None, '') else '?'}W"]
    parts.append(f"{losses if losses not in (None, '') else '?'}L")
    if ties not in (None, ""):
        parts.append(f"{ties}T")
    return "-".join(parts)


class EspnAgent(SkillAgent):
    name = "espn"
    card_name = "ESPN Sports Agent"
    card_description = (
        "Read-only agent over ESPN's public site API: scores and fixtures for any of eight leagues on "
        "any date, team lookup by name or abbreviation with the ESPN id, a league's standings with its "
        "divisions and playoff seeds, and one game's detail by event id. Every answer is read live "
        "from ESPN and says where ESPN publishes nothing rather than filling the gap."
    )
    env_prefix = "ESPN"
    datasets = (DATASET,)
    card_skills = CARD_SKILLS

    def __init__(self, client: EspnClient | None = None,
                 gateway: object | None = None) -> None:
        self.client = client or EspnClient()
        self.gateway = gateway

    def parse(self, message: dict) -> dict:
        return parse(message)

    def missing(self, skill: str, params: dict) -> list[str]:
        if skill == SKILL_GAME_DETAIL:
            return [] if params.get("event_id") else ["event_id"]
        if skill == SKILL_TEAM_LOOKUP:
            return [] if params.get("team") else ["team"]
        return []

    def input_prompt(self, skill: str, missing: list[str]) -> str:
        if skill == SKILL_GAME_DETAIL:
            return "Which game? Give me its ESPN event id, for example “game 401902644”."
        if skill == SKILL_TEAM_LOOKUP:
            return "Which team? A full name, a nickname, a city or an abbreviation."
        return _missing_league()["message"]

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
        if skill == SKILL_SLATE_BRIEF:
            return run_slate_brief(params, self.client, self.gateway)
        if skill == SKILL_STANDINGS:
            return run_standings(params, self.client)
        if skill == SKILL_TEAM_LOOKUP:
            return run_team_lookup(params, self.client)
        if skill == SKILL_GAME_DETAIL:
            return run_game_detail(params, self.client)
        if skill == SKILL_SCORES:
            return run_scores(params, self.client)
        return {"final_state": "completed", "message": HELP, "artifact": None, "watch": None}


__all__ = [
    "CARD_SKILLS",
    "DEFAULT_LEAGUES",
    "DEFAULT_LIMIT",
    "HELP",
    "LEAGUES",
    "MAX_LISTED",
    "SKILL_GAME_DETAIL",
    "SKILL_SCORES",
    "SKILL_SLATE_BRIEF",
    "SKILL_STANDINGS",
    "SKILL_TEAM_LOOKUP",
    "EspnAgent",
    "UpstreamError",
    "league_from_text",
    "leagues_from_text",
    "message_data",
    "message_text",
    "parse",
    "run_game_detail",
    "run_scores",
    "run_slate_brief",
    "run_standings",
    "run_team_lookup",
    "team_from_text",
]
