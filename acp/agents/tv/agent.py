"""TV - what is on, when it aired, and how much catching up a show really is.

TVMaze publishes every show's schedule, season by season, keyless, and nobody asks it from an
editor. "what is the next episode of Severance?" gets the next episode that actually has an
air date, and if the show is between seasons it says so, because TVMaze does not invent a
date either. "when did season 2 air?" gets the whole season, in order, with air dates.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from acp_kit import STOP_END_TURN, STOP_REFUSAL, AcpAgent, SessionContext, prompt_text

from data import (DATASET, TvData, TvError, TvNotFound, season_from_text,  # noqa: E402
                  show_query_from_text)

HELP = (
    "I read TVMaze's schedule API (keyless) - shows, seasons, air dates and episode lists.\n"
    "Ask me:\n"
    "  - what is the next episode of Severance?\n"
    "  - when did season 2 of Severance air?\n"
    "  - list the episodes of The Bear\n"
    "  - tell me about Severance\n"
    "  - find shows like Severance\n"
    "Air times come from TVMaze's own air dates, in UTC where the feed gives UTC.\n"
    "TVMaze only holds an air date once a slot is booked, so a show between seasons has no\n"
    "next episode and I say that rather than guess one. Catch-up arithmetic - how many hours\n"
    "you are behind and when you would finish - is a separate skill."
)

PERMISSION_KEY = "tv-read-tvmaze-schedule"

SKILLS = ("tv-show", "tv-episodes", "tv-next", "tv-search", "tv-catchup", "help")

#: Looking for a show rather than asking about one.
_SEARCH_WORDS = re.compile(
    r"\b(find|search|shows? like|shows? similar|similar to|like|list of shows|what shows|"
    r"anything like|suggest)\b",
    re.IGNORECASE,
)
_NEXT_WORDS = re.compile(
    r"\b(next|upcoming|soon|when does? it air|when is|next episode|coming up|not aired yet|"
    r"still to come)\b",
    re.IGNORECASE,
)
_EPISODE_WORDS = re.compile(
    r"\b(episode|episodes|season|seasons|series|list|aired?|airing|ep)\b",
    re.IGNORECASE,
)
_OTHER_WORDS = re.compile(
    r"\b(weather|recipe|stock|score|bitcoin|github|package|npm|release|flight|quake|"
    r"water table|sensor|tide)\b",
    re.IGNORECASE,
)
#: The premium question, and the only one. The free skills list the episodes TVMaze has and
#: name the next one; this is the arithmetic on top - how far behind you are and when you
#: finish at a pace you name. Requires the words, so "when is the next episode" stays free.
_CATCHUP_WORDS = re.compile(
    r"\b(catch up|catch-up|catchup|caught up|caught-up|how far behind|behind on|"
    r"finish watching|through with|to catch)\b",
    re.IGNORECASE,
)
_PER_WEEK_RE = re.compile(r"\b(\d{1,2})\s+(?:a|per)\s+week\b", re.IGNORECASE)


def route(text: str) -> tuple[str, dict]:
    """Deterministic intent routing: (skill, params). Pure function, easy to test."""
    stripped = str(text or "").strip()
    if not stripped or re.search(r"\b(help|what can you do|commands?)\b", stripped, re.IGNORECASE):
        return "help", {}
    if _OTHER_WORDS.search(stripped):
        return "help", {}
    query = show_query_from_text(stripped)
    if not query:
        return "help", {}
    # Checked before the free routes, and narrow on purpose: a catch-up question with a
    # show in it. "when is the next episode of X" has no catch-up words and stays free.
    if _CATCHUP_WORDS.search(stripped):
        params: dict = {"show": query}
        per_week = _PER_WEEK_RE.search(stripped)
        if per_week:
            params["per_week"] = int(per_week.group(1))
        season = season_from_text(stripped)
        if season:
            params["season"] = season
        return "tv-catchup", params
    if _SEARCH_WORDS.search(stripped):
        return "tv-search", {"query": query}
    params = {"query": query}
    season = season_from_text(stripped)
    if season:
        params["season"] = season
    if _NEXT_WORDS.search(stripped):
        return "tv-next", params
    if _EPISODE_WORDS.search(stripped):
        return "tv-episodes", params
    return "tv-show", params


def _plain(text) -> str:
    """TVMaze writes its summaries in HTML. Tags out, entities decoded, no invented wording."""
    raw = str(text or "")
    raw = re.sub(r"<br\s*/?>", " ", raw, flags=re.IGNORECASE)
    raw = re.sub(r"<[^>]+>", "", raw)
    for entity, char in (("&amp;", "&"), ("&lt;", "<"), ("&gt;", ">"), ("&quot;", '"'),
                         ("&#39;", "'"), ("&apos;", "'"), ("&nbsp;", " ")):
        raw = raw.replace(entity, char)
    return re.sub(r"\s+", " ", raw).strip()


def _code(episode: dict) -> str:
    """S01E02, or whatever TVMaze actually has if one half is missing."""
    season = episode.get("season")
    number = episode.get("number")
    if season is None:
        return f"E{number:02d}" if number is not None else "episode"
    if number is None:
        return f"S{season:02d}"
    return f"S{season:02d}E{number:02d}"


def render_show(show: dict) -> str:
    """One show: who made it, when it started, and what it is about."""
    lines = [f"{show['name']} ({show['type'] or 'not reported'})"]
    bits = []
    if show["network"]:
        bits.append(show["network"])
    if show["status"]:
        bits.append(show["status"])
    if show["language"]:
        bits.append(show["language"])
    if bits:
        lines.append("  " + " / ".join(bits))
    if show["genres_text"]:
        lines.append(f"  genres: {show['genres_text']}")
    if show["premiered"]:
        lines.append(f"  premiered: {show['premiered']}")
    if show["ended"]:
        lines.append(f"  ended: {show['ended']}")
    if show["runtime"]:
        lines.append(f"  typical episode: {show['runtime']} min")
    if show["schedule"]:
        lines.append(f"  schedule: {show['schedule']}")
    if show["rating"] is not None:
        lines.append(f"  TVMaze rating: {show['rating']}/10")
    if show["summary"]:
        lines.append(f"  {show['summary']}")
    if show["official_site"]:
        lines.append(f"  site: {show['official_site']}")
    if show["url"]:
        lines.append(f"  {show['url']}")
    return "\n".join(lines)


def render_episodes(show: dict, episodes: list[dict], season: int | None) -> str:
    """A show's episodes, in order, with the air date each one had."""
    head = f"{show['name']}"
    if season:
        head += f" - season {season}"
    lines = [head, f"  {len(episodes)} episode(s) on TVMaze"]
    for episode in episodes[:60]:
        when = episode["airdate"] or "date not reported"
        extra = f", {episode['airtime']} local" if episode["airtime"] else ""
        rating = f", rated {episode['rating']}/10" if episode["rating"] is not None else ""
        minutes = f" ({episode['runtime']} min)" if episode["runtime"] else ""
        code = _code(episode)
        lines.append(f"    {code} {episode['name']} - {when}{extra}{minutes}{rating}")
    if len(episodes) > 60:
        lines.append(f"    ... and {len(episodes) - 60} more")
    return "\n".join(lines)


def render_next(show: dict, episode: dict | None, last_aired: dict | None) -> str:
    """The next episode with a real air date, plus the one before it for context."""
    lines = [f"{show['name']} - next episode"]
    if episode is None:
        lines.append("  TVMaze has no air date past the last episode, so there is no next one "
                     "to name yet.")
        if last_aired:
            lines.append(f"  last episode on TVMaze: {_code(last_aired)} "
                         f"{last_aired['name']} - "
                         f"{last_aired['airdate'] or 'date not reported'}")
        lines.append("  a show between seasons looks exactly like this")
        return "\n".join(lines)
    lines.append(f"  S{episode['season']:02d}E{episode['number']:02d} {episode['name']}")
    lines.append(f"  airs: {episode['airdate'] or 'date not reported'}"
                 + (f" at {episode['airtime']} local" if episode["airtime"] else ""))
    if episode["runtime"]:
        lines.append(f"  runtime: {episode['runtime']} min")
    if episode["summary"]:
        lines.append(f"  {_plain(episode['summary'])}")
    if last_aired:
        lines.append(f"  before that: {_code(last_aired)} {last_aired['name']} - "
                     f"{last_aired['airdate'] or 'date not reported'}")
    if episode["url"]:
        lines.append(f"  {episode['url']}")
    return "\n".join(lines)


def render_search(rows: list[dict]) -> str:
    """Shows that matched, best match first."""
    lines = [f"{len(rows)} show(s) on TVMaze:"]
    for row in rows:
        bits = []
        if row["network"]:
            bits.append(row["network"])
        if row["status"]:
            bits.append(row["status"])
        if row["premiered"]:
            bits.append(f"from {row['premiered']}")
        if row["runtime"]:
            bits.append(f"{row['runtime']} min")
        lines.append(f"  {row['name']}"
                     + (f" - {', '.join(bits)}" if bits else ""))
        if row["summary"]:
            lines.append(f"    {_plain(row['summary'])[:220]}")
    return "\n".join(lines)


def _num(value) -> str:
    """A number for a line of text, or the honest 'not reported'."""
    if value is None or value == "":
        return "not reported"
    try:
        return f"{float(value):g}"
    except (TypeError, ValueError):
        return str(value)


def render_catchup(data: dict) -> str:
    """The catch-up arithmetic: how much is behind, and when it would be watched."""
    latest = data.get("latestEpisode") or {}
    lines = [f"{data.get('show', 'not reported')} - catch-up plan"
             f" (season {data.get('season', 'not reported')})"]
    lines.append(f"  episodes aired: {data.get('episodesAired', 'not reported')}"
                 + (f" of {data['episodesTotal']} in the season"
                    if data.get("episodesTotal") else ""))
    lines.append(f"  that is {_num(data.get('totalMinutes'))} min"
                 f" ({_num(data.get('totalHours'))} h)"
                 f", typical episode {_num(data.get('averageRuntimeMinutes'))} min")
    lines.append(f"  newest aired: S{_num(latest.get('season'))}E{_num(latest.get('number'))} "
                 f"{latest.get('name', 'not reported')} on {latest.get('airedOn', 'not reported')}")
    lines.append(f"  TVMaze's own gap between airings: "
                 f"{_num(data.get('typicalDaysBetweenEpisodes'))} day(s)")
    lines.append(f"  a new episode arrives every "
                 f"{_num(data.get('typicalDaysBetweenEpisodes'))} day(s) on average, so the "
                 "backlog only shrinks if you watch more than one a week")
    lines.append(f"  source: {data.get('source', 'not reported')}")
    lines.append("  this is a projection, not a schedule: it assumes you keep the pace and "
                 "that the show keeps airing")
    return "\n".join(lines)


class TvAgent(AcpAgent):
    name = "tv"
    title = "TV - what is on, when it aired, and how far behind a show you are"
    version = "1.0.0"

    def __init__(self, connection=None, data: TvData | None = None, gateway=None) -> None:
        super().__init__(connection)
        self.data = data or TvData()
        self.gateway = gateway

    # -- ACP ---------------------------------------------------------------

    def new_session(self, session) -> dict:
        session.remember("agent", "TV session opened. " + HELP.splitlines()[0])
        return {}

    def prompt(self, ctx: SessionContext, prompt: list[dict]) -> str:
        text = prompt_text(prompt)
        skill, params = route(text)
        ctx.plan([
            (f"Route the request ({skill})", "high"),
            ("Read TVMaze's schedule", "medium"),
            ("Report the air dates and the episode list", "medium"),
        ])

        if skill == "help":
            ctx.stream_text(HELP)
            ctx.message("TVMaze only books an air date once a slot is set, so an unscheduled "
                        "episode really has no date.")
            return STOP_END_TURN

        tool = f"call_{skill.replace('-', '_')}"
        ctx.tool_call(tool, "Read TVMaze's schedule", kind="fetch", name=skill,
                      raw_input=dict(params))
        if not ctx.ask_permission(tool, "Allow TV to read TVMaze's public schedule?",
                                  remember_key=PERMISSION_KEY):
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content("permission denied"))
            ctx.message("I need permission to read TVMaze's schedule first.")
            return STOP_REFUSAL
        ctx.tool_call_update(tool, status="in_progress")

        try:
            if skill == "tv-catchup":
                return self._run_skill(ctx, params, tool)
            if skill == "tv-search":
                rows = self.data.search(params["query"])
                body = render_search(rows)
                summary = f"{len(rows)} show(s) matching {params['query']!r}, top: {rows[0]['name']}"
            elif skill == "tv-episodes":
                show = self.data.show(params["query"])
                episodes = self.data.episodes(show, season=params.get("season"))
                body = render_episodes(show, episodes, params.get("season"))
                summary = f"{show['name']}: {len(episodes)} episode(s)"
            elif skill == "tv-next":
                show = self.data.show(params["query"])
                episodes = self.data.episodes(show)
                upcoming = self.data.next_episode(show)
                already = self.data.aired(episodes)
                last_aired = already[-1] if already else None
                body = render_next(show, upcoming, last_aired)
                summary = (f"{show['name']}: next is {_code(upcoming)}"
                           if upcoming else f"{show['name']}: no scheduled next episode")
            else:
                show = self.data.show(params["query"])
                body = render_show(show)
                summary = f"{show['name']}: {show['status'] or 'status not reported'}"
        except (TvError, ValueError) as exc:
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content(str(exc)))
            ctx.message(f"I could not read TVMaze's schedule: {exc}")
            return STOP_END_TURN

        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(summary))
        ctx.stream_text(body + "\n")
        ctx.message(f"\nSource: {DATASET}, read live. Air dates are the broadcaster's own, and "
                    "TVMaze holds an episode's date only once a slot is booked, so a show with no "
                    "future episode is a real gap in the schedule rather than missing data.")
        return STOP_END_TURN

    def _run_skill(self, ctx: SessionContext, params: dict, tool: str) -> str:
        """Stub: the hosted implementation of this skill was removed in the paywall cleanup."""
        message = 'Not yet implemented: run-skill — its hosted implementation was removed.'
        return message, {"summary": "not implemented", "removed": True}

    def on_cancel(self, session) -> None:
        return None  # one read, one answer


def main(argv=None) -> int:
    import logging

    logging.basicConfig(level=logging.INFO, stream=sys.stderr,
                        format="%(asctime)s %(levelname)s %(name)s %(message)s")
    try:
        TvAgent().run()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
