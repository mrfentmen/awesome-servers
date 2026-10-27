"""Read-only client for ESPN's public site API.

Endpoints (keyless, verified live 2026-09-28):
  - /apis/site/v2/sports/{path}/scoreboard[?dates=]     one league's fixtures or scores
  - /apis/site/v2/sports/{path}/teams[?limit=]          a league's teams
  - /apis/v2/sports/{path}/standings[?season=]         a league's table
  - /apis/site/v2/sports/{path}/summary?event=          one game

Four things about this API shape the client:

1. `site.api.espn.com` answers HTTP 403 to every caller; `site.web.api.espn.com`
   serves the same documents and is what this client uses. The base URL is an env
   override, so a mirror or a proxy can be pointed at instead.
2. There is one path per sport (`basketball/nba`, `football/nfl`, `soccer/eng.1`),
   so the league codes a caller uses are mapped to paths here rather than trusted.
3. The payload shape drifts between leagues. Soccer reports a score on the
   competition and a draw as a string; US sports report it on the competitor and a
   draw as `winner: false` on both. Records, venues and odds are missing on some
   leagues and present on others, so every one of them is read defensively and a
   missing piece is reported as missing.
4. The API is undocumented and can change. Anything unrecognised raises an
   UpstreamError naming the shape that was seen, rather than returning half an
   answer that looks complete.
5. `dates` on the scoreboard is a bare `YYYYMMDD`. The dashed form a person writes is
   accepted and stripped, because ESPN answers HTTP 400 to the dashed one rather than
   saying so in a useful way.
"""

from __future__ import annotations

import re

from a2a_kit import JsonApiClient, UpstreamError, utc_now_iso

#: `site.api.espn.com` answers 403; this host serves the same documents.
BASE_URL = "https://site.web.api.espn.com"

SCOREBOARD_PATH = "/apis/site/v2/sports/{path}/scoreboard"
TEAMS_PATH = "/apis/site/v2/sports/{path}/teams"
TEAM_PATH = "/apis/site/v2/sports/{path}/teams/{team}"
STANDINGS_PATH = "/apis/v2/sports/{path}/standings"
SUMMARY_PATH = "/apis/site/v2/sports/{path}/summary"

DATASET = "site.web.api.espn.com/apis"
PRODUCT = "ESPN public site API: scores, fixtures, teams, standings and game summaries"
SOURCE = "ESPN public site API"

#: Caller-facing league code -> the path the API uses for it.
LEAGUES = {
    "nba": {"name": "NBA", "path": "basketball/nba", "sport": "basketball"},
    "nfl": {"name": "NFL", "path": "football/nfl", "sport": "football"},
    "nhl": {"name": "NHL", "path": "hockey/nhl", "sport": "hockey"},
    "mlb": {"name": "MLB", "path": "baseball/mlb", "sport": "baseball"},
    "mls": {"name": "MLS", "path": "soccer/mls", "sport": "soccer"},
    "eng1": {"name": "Premier League", "path": "soccer/eng.1", "sport": "soccer"},
    "ncaaf": {"name": "NCAA Football", "path": "football/college-football", "sport": "football"},
    "ncaab": {"name": "NCAA Men's Basketball", "path": "basketball/mens-college-basketball",
              "sport": "basketball"},
}
#: Aliases people actually type, mapped onto the codes above.
LEAGUE_ALIASES = {
    "basketball": "nba", "basketball nba": "nba", "nba": "nba",
    "football": "nfl", "american football": "nfl", "nfl": "nfl",
    "hockey": "nhl", "ice hockey": "nhl", "nhl": "nhl",
    "baseball": "mlb", "mlb": "mlb",
    "soccer": "eng1", "football uk": "eng1", "epl": "eng1", "premier league": "eng1",
    "premierleague": "eng1", "eng1": "eng1", "mls": "mls",
    "college football": "ncaaf", "ncaa football": "ncaaf", "ncaaf": "ncaaf",
    "college basketball": "ncaab", "ncaa basketball": "ncaab", "ncaab": "ncaab",
}
#: The four leagues a bare "today" question means.
DEFAULT_LEAGUES = ("nba", "nfl", "nhl", "mlb")

TEAM_FIELDS = ("id", "abbreviation", "displayName", "shortDisplayName", "location", "name",
               "color", "alternateColor", "isActive")

_STATES = ("pre", "in", "post")

__all__ = [
    "BASE_URL",
    "DATASET",
    "DEFAULT_LEAGUES",
    "LEAGUES",
    "LEAGUE_ALIASES",
    "PRODUCT",
    "SOURCE",
    "SCOREBOARD_PATH",
    "STATES",
    "STANDINGS_PATH",
    "SUMMARY_PATH",
    "TEAMS_PATH",
    "TEAM_FIELDS",
    "TEAM_PATH",
    "EspnClient",
    "UpstreamError",
    "league_path",
    "league_name",
]


def _to_float(value) -> float | None:
    if value in (None, ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _to_int(value) -> int | None:
    number = _to_float(value)
    return None if number is None else int(number)


def league_path(league) -> str:
    """A caller's league name or code -> the API's own path for it."""
    code = str(league or "").strip().lower()
    if code in LEAGUES:
        return LEAGUES[code]["path"]
    alias = LEAGUE_ALIASES.get(code)
    if alias is None:
        raise ValueError(f"league must be one of: {', '.join(sorted(LEAGUES))}")
    return LEAGUES[alias]["path"]


def league_name(league) -> str:
    """A caller's league name or code -> the league's own name, for an answer."""
    code = str(league or "").strip().lower()
    if code in LEAGUES:
        return LEAGUES[code]["name"]
    alias = LEAGUE_ALIASES.get(code)
    if alias is None:
        raise ValueError(f"league must be one of: {', '.join(sorted(LEAGUES))}")
    return LEAGUES[alias]["name"]


def league_code(league) -> str:
    """The canonical short code, whatever alias the caller used.

    An unknown league is refused rather than passed through: a bad code would otherwise
    become a 404 from ESPN that reads like an empty league rather than a typo.
    """
    code = str(league or "").strip().lower()
    if code in LEAGUES:
        return code
    alias = LEAGUE_ALIASES.get(code)
    if alias is None:
        raise ValueError(f"league must be one of: {', '.join(sorted(LEAGUES))}")
    return alias


class EspnClient(JsonApiClient):
    env_prefix = "ESPN"
    base_url = BASE_URL
    #: A scoreboard goes stale in minutes; a season's table does not.
    default_ttl = 60.0

    def __init__(self, fetch=None, base_url=None, cache_ttl=None, timeout=None, headers=None) -> None:
        super().__init__(fetch=fetch, base_url=base_url, cache_ttl=cache_ttl, timeout=timeout, headers=headers)
        self.standings_ttl = float(self.cache_ttl * 30)

    # -- validation --------------------------------------------------------

    @staticmethod
    def check_league(value) -> str:
        """Canonical league code, from the code or from any alias."""
        return league_code(value)

    @staticmethod
    def check_date(value) -> str:
        day = str(value).strip()
        if not re.match(r"^\d{4}-\d{2}-\d{2}$", day):
            raise ValueError("a date is YYYY-MM-DD, for example 2026-09-28")
        try:
            from datetime import date

            date.fromisoformat(day)
        except ValueError:
            raise ValueError("that date does not exist, use YYYY-MM-DD") from None
        return day

    @staticmethod
    def check_event_id(value) -> str:
        event_id = str(value).strip()
        if not re.match(r"^\d{1,12}$", event_id):
            raise ValueError("an ESPN event id is a number, for example 401902644")
        return event_id

    @staticmethod
    def check_season(value) -> int:
        season = _to_int(value)
        if season is None or not 1990 <= season <= 2100:
            raise ValueError("a season is a four-digit year between 1990 and 2100")
        return season

    @staticmethod
    def check_limit(value, default: int = 10) -> int:
        limit = _to_int(value)
        if limit is None:
            limit = default
        if not 1 <= limit <= 100:
            raise ValueError("limit must be between 1 and 100")
        return limit

    # -- reads -------------------------------------------------------------

    def scoreboard(self, league, day: str | None = None, limit: int = 50) -> list[dict]:
        """One league's fixtures or live scores for a day."""
        path = league_path(league)
        code = league_code(league)
        params = {"limit": self.check_limit(limit, default=50)}
        if day:
            # ESPN's `dates` parameter is a bare YYYYMMDD: send the dashed form and it
            # answers HTTP 400 with "Failed to get events endpoint". A person writes
            # 2026-09-28, so the dashes are accepted here and stripped here.
            params["dates"] = self.check_date(day).replace("-", "")
        payload = self.get_json(SCOREBOARD_PATH.format(path=path), params, ttl=self.cache_ttl)
        events = payload.get("events") if isinstance(payload, dict) else None
        if events is None:
            raise UpstreamError(f"ESPN returned an unexpected {code} scoreboard payload")
        games = []
        for event in events:
            game = self._game(event)
            if game is not None:
                games.append(game)
        return games

    def teams(self, league, limit: int = 100) -> list[dict]:
        """One league's teams."""
        path = league_path(league)
        code = league_code(league)
        payload = self.get_json(TEAMS_PATH.format(path=path), {"limit": self.check_limit(limit)},
                                ttl=self.standings_ttl)
        sports = payload.get("sports") if isinstance(payload, dict) else None
        if not sports:
            raise UpstreamError(f"ESPN returned an unexpected {code} team list payload")
        leagues = sports[0].get("leagues") if isinstance(sports[0], dict) else None
        teams = leagues[0].get("teams") if leagues else None
        if teams is None:
            raise UpstreamError(f"ESPN returned an unexpected {code} team list payload")
        found = []
        for row in teams:
            team = row.get("team") if isinstance(row, dict) else None
            if isinstance(team, dict):
                found.append(self._team(team))
        return found

    def standings(self, league, season: int | None = None) -> dict:
        """A league's table: its groups, each team's row, and the season it is for."""
        path = league_path(league)
        code = league_code(league)
        params = {}
        if season is not None:
            params["season"] = self.check_season(season)
        payload = self.get_json(STANDINGS_PATH.format(path=path), params, ttl=self.standings_ttl)
        if not isinstance(payload, dict) or "children" not in payload:
            raise UpstreamError(f"ESPN returned an unexpected {code} standings payload")
        groups = []
        for child in payload.get("children") or []:
            if not isinstance(child, dict):
                continue
            table = child.get("standings") if isinstance(child.get("standings"), dict) else {}
            entries = []
            for row in table.get("entries") or []:
                entry = self._standing_row(row)
                if entry is not None:
                    entries.append(entry)
            if not entries:
                continue
            groups.append({
                "name": child.get("name") or "group not reported",
                "abbreviation": child.get("abbreviation"),
                "entries": entries,
            })
        seasons = payload.get("seasons")
        season_year = None
        if isinstance(seasons, list) and seasons and isinstance(seasons[0], dict):
            season_year = _to_int(seasons[0].get("year"))
        return {
            "league": code,
            "league_name": payload.get("name") or league_name(code),
            "season": season_year,
            "season_type": (seasons[0].get("type") if isinstance(seasons, list) and seasons
                            and isinstance(seasons[0], dict) else None),
            "groups": groups,
            "group_count": len(groups),
        }

    def summary(self, league, event_id: str) -> dict | None:
        """One game: its header, its venue, and its broadcast."""
        path = league_path(league)
        code = league_code(league)
        event_id = self.check_event_id(event_id)
        payload = self.get_json(SUMMARY_PATH.format(path=path), {"event": event_id}, ttl=self.cache_ttl)
        header = payload.get("header") if isinstance(payload, dict) else None
        if not isinstance(header, dict):
            return None
        game = self._game({"id": event_id, "date": header.get("competitions", [{}])[0].get("date")
                           if isinstance(header.get("competitions"), list) and header.get("competitions")
                           else None,
                           "name": header.get("competitions", [{}])[0].get("name")
                           if isinstance(header.get("competitions"), list) and header.get("competitions")
                           else None,
                           "competitions": header.get("competitions")})
        info = payload.get("gameInfo")
        if game is None:
            return None
        if isinstance(info, dict):
            venue = info.get("venue")
            if isinstance(venue, dict):
                game["venue"] = venue.get("fullName")
            attendance = _to_int(info.get("attendance"))
            game["attendance"] = attendance
            game["officials"] = [
                official.get("displayName")
                for official in info.get("officials") or []
                if isinstance(official, dict) and official.get("displayName")
            ]
        game["league"] = code
        return game

    @staticmethod
    def freshness() -> str:
        """Every read here is live, so freshness is the moment we read it."""
        return utc_now_iso()

    # -- shaping -----------------------------------------------------------

    def _team(self, team: dict) -> dict:
        row = self.pick(team, TEAM_FIELDS, DATASET)
        links = team.get("links")
        if isinstance(links, list):
            clubhouse = next((link.get("href") for link in links
                              if isinstance(link, dict) and "clubhouse" in (link.get("rel") or [])), None)
            row["clubhouse"] = clubhouse
        return row

    def _game(self, event: dict) -> dict | None:
        """One event, read defensively.

        A score can sit on the competitor (US sports) or on the competition (soccer),
        and a draw can be `winner: false` on both sides or a string like "2-2". Both
        are read; a game with neither competitor is refused rather than half-reported.
        """
        if not isinstance(event, dict):
            return None
        competitions = event.get("competitions")
        competition = competitions[0] if isinstance(competitions, list) and competitions else {}
        if not isinstance(competition, dict):
            competition = {}
        competitors = competition.get("competitors")
        competitors = competitors if isinstance(competitors, list) else []
        sides = {"home": None, "away": None}
        for competitor in competitors:
            if not isinstance(competitor, dict):
                continue
            team = competitor.get("team") if isinstance(competitor.get("team"), dict) else {}
            side = "home" if competitor.get("homeAway") == "home" else "away"
            sides[side] = {
                "team": team.get("displayName") or team.get("shortDisplayName") or "not reported",
                "abbreviation": team.get("abbreviation"),
                "team_id": team.get("id"),
                # Competitor first, then the competition: soccer keeps it there.
                "score": (competitor.get("score") if competitor.get("score") not in (None, "")
                          else competition.get("status", {}).get("type", {}).get("score")),
                "records": [record.get("summary")
                            for record in competitor.get("records") or []
                            if isinstance(record, dict) and record.get("summary")],
                "winner": competitor.get("winner"),
                "home_away": competitor.get("homeAway"),
            }
        status = event.get("status") if isinstance(event.get("status"), dict) else {}
        status_type = status.get("type") if isinstance(status.get("type"), dict) else {}
        if not status_type and isinstance(competition.get("status"), dict):
            status_type = competition["status"].get("type") or {}
        state = status_type.get("state") if isinstance(status_type, dict) else None
        if state not in _STATES:
            state = None
        # `odds` is an array on the scoreboard and a bare object on some summary
        # headers, so both are read rather than one being silently dropped.
        raw_odds = competition.get("odds")
        odds = raw_odds[0] if isinstance(raw_odds, list) and raw_odds else raw_odds
        if not isinstance(odds, dict):
            odds = None
        venue = competition.get("venue") if isinstance(competition.get("venue"), dict) else {}
        broadcasts = []
        # ESPN puts `broadcasts` on the event for some leagues and on the competition
        # for others, so both are read.
        for entry in list(event.get("broadcasts") or []) + list(competition.get("broadcasts") or []):
            if not isinstance(entry, dict):
                continue
            for name in entry.get("names") or []:
                if isinstance(name, dict) and (name.get("shortDisplayName") or name.get("displayName")):
                    broadcasts.append(name.get("shortDisplayName") or name.get("displayName"))
        notes = [note.get("headline") for note in competition.get("notes") or []
                 if isinstance(note, dict) and note.get("headline")]
        return {
            "event_id": event.get("id"),
            "date": event.get("date"),
            "name": event.get("name") or (f"{sides['away']['team']} at {sides['home']['team']}"
                                          if sides.get("away") and sides.get("home") else None),
            "short_name": event.get("shortName"),
            "state": state or "not reported",
            "completed": status_type.get("completed") if isinstance(status_type, dict) else None,
            "detail": status_type.get("detail") if isinstance(status_type, dict) else None,
            "short_detail": status_type.get("shortDetail") if isinstance(status_type, dict) else None,
            "period": _to_int(status_type.get("period")) if isinstance(status_type, dict) else None,
            "clock": status_type.get("displayClock") if isinstance(status_type, dict) else None,
            "away": sides["away"],
            "home": sides["home"],
            "venue": venue.get("fullName"),
            "broadcast": broadcasts[0] if broadcasts else None,
            "notes": notes,
            "odds": {
                "details": odds.get("details"),
                "over_under": _to_float(odds.get("overUnder")),
                "spread": _to_float(odds.get("spread")),
            } if odds else None,
        }

    def _standing_row(self, row: dict) -> dict | None:
        """One table row. The stat names differ per league, so they are read by name."""
        if not isinstance(row, dict):
            return None
        team = row.get("team") if isinstance(row.get("team"), dict) else None
        stats = {}
        for stat in row.get("stats") or []:
            if isinstance(stat, dict) and stat.get("name"):
                stats[stat["name"]] = stat.get("value")
        entry = self._team(team) if team else {"displayName": "team not reported", "id": None}
        entry["stats"] = {
            "wins": stats.get("wins"),
            "losses": stats.get("losses"),
            "ties": stats.get("ties"),
            "win_percent": _to_float(stats.get("winPercent")),
            "games_behind": stats.get("gamesBehind"),
            "rank": _to_int(stats.get("rank")),
            "playoff_seed": stats.get("playoffSeed"),
            "points_for": stats.get("pointsFor"),
            "points_against": stats.get("pointsAgainst"),
            "division": stats.get("division"),
        }
        entry["raw_stats"] = {key: value for key, value in stats.items()
                              if value is not None} or None
        return entry
