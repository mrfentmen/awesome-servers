"""Music - what a song is, what an artist put out, and what is actually charting.

Deezer publishes a searchable catalogue with a popularity rank and a 30-second preview for every
track, keyless, and nobody asks it from an editor. "find songs by Radiohead" gets the songs
with their runtimes and the preview link, and a 45-minute listening set with the live, remix
and remastered cuts pulled out - that arithmetic is the premium skill.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from acp_kit import (STOP_END_TURN, STOP_REFUSAL, AcpAgent, GatewayClient,  # noqa: E402
                     GatewayError, SessionContext, empty_premium_answer, premium_call,
                     prompt_text)

from data import (DATASET, MusicData, MusicError, MusicNotFound,  # noqa: E402
                  is_alternate_version, query_from_text)

HELP = (
    "I read Deezer's catalogue (keyless) - search, artists, albums, the chart and 30-second\n"
    "previews. Ask me:\n"
    "  - find songs by Radiohead\n"
    "  - tell me about Radiohead\n"
    "  - what is on Kid A?\n"
    "  - what is charting on Deezer?\n"
    "  - build me a 45 minute Radiohead set\n"
    "Deezer's `rank` is a popularity score that runs to about a million, so it only means\n"
    "something next to another track's - never read aloud as a chart position. Building a\n"
    "listening set that fits a time budget is the premium skill."
)

PERMISSION_KEY = "music-read-deezer-catalog"

SKILLS = ("music-search", "music-artist", "music-album", "music-chart", "music-set", "help")

_CHART_WORDS = re.compile(
    r"\b(chart|charting|trending|trending now|top songs right now|number one|biggest hits)\b",
    re.IGNORECASE,
)
_ALBUM_WORDS = re.compile(
    r"\b(album|albums|tracklist|track list|on the record|what'?s on|what is on)\b",
    re.IGNORECASE)
_SEARCH_WORDS = re.compile(
    r"\b(find|search|look for|songs? (?:by|like|from)|tracks? (?:by|like|from)|"
    r"anything like|similar to|anything from)\b",
    re.IGNORECASE,
)
_OTHER_WORDS = re.compile(
    r"\b(weather|recipe|episode|season|water table|quake|flight|stock|score|package)\b",
    re.IGNORECASE,
)
#: The premium question, and the only one. The free skills list what Deezer has; this builds
#: something you can sit through: a set that fits a time budget, with the alternate versions
#: and the explicit cuts taken out. Requires the words, so "find songs by X" stays free.
_SET_WORDS = re.compile(
    r"\b(listening set|listen(?:ing)? (?:list|queue|plan)|mix|playlist|set me up|"
    r"queue up|soundtrack for|soundtrack to|for my (?:commute|drive|run|walk)|"
    r"work out to|study to)\b",
    re.IGNORECASE,
)
#: A bare "set" only counts when something is being built, so "set" inside a question about
#: a song is not a premium request.
_BARE_SET = re.compile(r"\bset\b", re.IGNORECASE)
_SET_BUILD = re.compile(
    r"\b(build|make|made|put together|throw together|queue|give me|throw me)\b", re.IGNORECASE)
_MINUTES_RE = re.compile(r"\b(\d{1,3})\s*(?:-|\s)?\s*minutes?\b", re.IGNORECASE)
_HOURS_RE = re.compile(r"\b(\d{1,2})\s*(?:-|\s)?\s*hours?\b", re.IGNORECASE)
_CLEAN_RE = re.compile(r"\b(clean|instrumental|no explicit|without explicit)\b", re.IGNORECASE)


def _budget_from_text(text: str) -> int | None:
    """How many minutes the reader asked for, if they said."""
    hours = _HOURS_RE.search(str(text or ""))
    if hours:
        return int(hours.group(1)) * 60
    minutes = _MINUTES_RE.search(str(text or ""))
    if minutes:
        return int(minutes.group(1))
    return None


def route(text: str) -> tuple[str, dict]:
    """Deterministic intent routing: (skill, params). Pure function, easy to test."""
    stripped = str(text or "").strip()
    if not stripped or re.search(r"\b(help|what can you do|commands?)\b", stripped, re.IGNORECASE):
        return "help", {}
    if _OTHER_WORDS.search(stripped):
        return "help", {}
    # Checked before the free routes, and narrow on purpose: a set request with an artist in
    # it. "find songs by X" and "top songs by X" carry no set words and stay free.
    if _SET_WORDS.search(stripped) or (_BARE_SET.search(stripped)
                                       and _SET_BUILD.search(stripped)):
        params: dict = {}
        artist = query_from_text(stripped)
        if artist:
            params["artist"] = artist
        budget = _budget_from_text(stripped)
        if budget:
            params["max_minutes"] = max(5, min(budget, 240))
        if _CLEAN_RE.search(stripped):
            params["allow_explicit"] = False
        return "music-set", params
    if _CHART_WORDS.search(stripped):
        return "music-chart", {}
    query = query_from_text(stripped)
    if not query:
        return "help", {}
    params = {"query": query}
    if _ALBUM_WORDS.search(stripped):
        return "music-album", params
    if _SEARCH_WORDS.search(stripped):
        return "music-search", params
    return "music-artist", params


def render_tracks(tracks: list[dict], head: str) -> str:
    """A list of tracks: position, title, artist, runtime, rank and the preview link."""
    lines = [head]
    for index, track in enumerate(tracks, start=1):
        parts = [f"  {index:>2}. {track['title']}"]
        if track["artist"]:
            parts.append(f" - {track['artist']}")
        if track["album"]:
            parts.append(f" [{track['album']}]")
        line = "".join(parts)
        detail = []
        detail.append(track["length"])
        if track["rank"] is not None:
            detail.append(f"popularity {track['rank']}")
        if track["explicit"]:
            detail.append("explicit")
        line += f"  ({', '.join(detail)})"
        lines.append(line)
        if track["preview"]:
            lines.append(f"      30s preview: {track['preview']}")
    return "\n".join(lines)


def render_artist(artist: dict, top: list[dict], albums: list[dict]) -> str:
    """One artist: the numbers Deezer holds, then the songs people play."""
    lines = [f"{artist['name']} on Deezer"]
    bits = []
    if artist["albums"] is not None:
        bits.append(f"{artist['albums']} album(s)")
    if artist["fans"] is not None:
        bits.append(f"{artist['fans']} follower(s)")
    if bits:
        lines.append("  " + ", ".join(bits))
    if artist["link"]:
        lines.append(f"  {artist['link']}")
    lines.append("")
    lines.append(render_tracks(top, f"Most played ({len(top)} of Deezer's top tracks):"))
    if albums:
        listed = ", ".join(f"{album['title']} ({album['released'] or 'date not reported'})"
                           for album in albums[:10])
        lines.append("")
        lines.append(f"  albums, newest first: {listed}")
    return "\n".join(lines)


def render_album(album: dict) -> str:
    """One album: when it came out, and what is on it, in order."""
    lines = [f"{album['title']} - {album['artist'] or 'artist not reported'}"]
    bits = []
    if album["released"]:
        bits.append(f"released {album['released']}")
    if album["track_count"] is not None:
        bits.append(f"{album['track_count']} track(s)")
    if album["fans"] is not None:
        bits.append(f"{album['fans']} fan(s)")
    if album["explicit"]:
        bits.append("explicit")
    if bits:
        lines.append("  " + ", ".join(bits))
    for index, track in enumerate(album["tracks"], start=1):
        line = f"  {index:>2}. {track['title']}  ({track['length']}"
        if track["rank"] is not None:
            line += f", popularity {track['rank']}"
        lines.append(line + ")")
    if album["link"]:
        lines.append(f"  {album['link']}")
    return "\n".join(lines)


def _num(value) -> str:
    """A number for a line of text, or the honest 'not reported'."""
    if value is None or value == "":
        return "not reported"
    try:
        return f"{float(value):g}"
    except (TypeError, ValueError):
        return str(value)


def render_set(data: dict) -> str:
    """A listening set: what is in it, how long it runs, and what was left out."""
    lines = [f"{data.get('artist', 'not reported')} - listening set"]
    if data.get("fanBase") is not None:
        lines.append(f"  {data['fanBase']} follower(s) on Deezer")
    lines.append(f"  {_num(data.get('setSize'))} track(s), "
                 f"{_num(data.get('setMinutes'))} min"
                 + (f" of a {_num(data.get('requestedMinutes'))} min budget"
                    if data.get("requestedMinutes") else ""))
    lines.append("")
    for index, track in enumerate(data.get("tracks") or [], start=1):
        when = ""
        if track.get("album"):
            when = f" [{track['album']}]"
        lines.append(f"  {index:>2}. {track.get('title', 'not reported')}{when}"
                     f"  ({_num(track.get('minutes'))} min)")
    skipped = data.get("skipped") or []
    if skipped:
        lines.append("")
        lines.append(f"  left out ({len(skipped)}):")
        for track in skipped[:12]:
            lines.append(f"    {track.get('title', 'not reported')} - {track.get('reason', 'not reported')}")
        if len(skipped) > 12:
            lines.append(f"    ... and {len(skipped) - 12} more")
    lines.append(f"  source: {data.get('source', 'not reported')}")
    return "\n".join(lines)


class MusicAgent(AcpAgent):
    name = "music"
    title = "Music - find the song, read the artist, and fit a set to the time you have"
    version = "1.0.0"

    def __init__(self, connection=None, data: MusicData | None = None, gateway=None) -> None:
        super().__init__(connection)
        self.data = data or MusicData()
        # The licence check lives on the gateway, not here, so deleting a line
        # from this repository buys nobody the answer.
        self.gateway = gateway or GatewayClient()

    # -- ACP ---------------------------------------------------------------

    def new_session(self, session) -> dict:
        session.remember("agent", "Music session opened. " + HELP.splitlines()[0])
        return {}

    def prompt(self, ctx: SessionContext, prompt: list[dict]) -> str:
        text = prompt_text(prompt)
        skill, params = route(text)
        ctx.plan([
            (f"Route the request ({skill})", "high"),
            ("Read Deezer's catalogue", "medium"),
            ("Report the tracks, the runtimes and the previews", "medium"),
        ])

        if skill == "help":
            ctx.stream_text(HELP)
            ctx.message("Deezer's rank runs to about a million, so it is a popularity score, "
                        "not a chart position.")
            return STOP_END_TURN

        tool = f"call_{skill.replace('-', '_')}"
        ctx.tool_call(tool, "Read Deezer's catalogue", kind="fetch", name=skill,
                      raw_input=dict(params))
        if not ctx.ask_permission(tool, "Allow Music to read Deezer's public catalogue?",
                                  remember_key=PERMISSION_KEY):
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content("permission denied"))
            ctx.message("I need permission to read Deezer's catalogue first.")
            return STOP_REFUSAL
        ctx.tool_call_update(tool, status="in_progress")

        try:
            if skill == "music-set":
                return self._run_skill(ctx, params, tool)
            if skill == "music-chart":
                tracks = self.data.chart(limit=15)
                body = render_tracks(tracks, f"Deezer's chart, top {len(tracks)} right now:")
                summary = f"chart: {tracks[0]['title']} by {tracks[0]['artist']}"
            elif skill == "music-search":
                tracks = self.data.search(params["query"], limit=12)
                body = render_tracks(tracks, f"{len(tracks)} track(s) on Deezer for "
                                             f"{params['query']!r}:")
                summary = f"{len(tracks)} track(s) for {params['query']!r}"
            elif skill == "music-album":
                album = self.data.album(params["query"])
                body = render_album(album)
                summary = f"{album['title']}: {len(album['tracks'])} track(s)"
            else:
                artist = self.data.artist(params["query"])
                top = self.data.top_tracks(artist["id"], limit=10)
                albums = self.data.albums(artist["id"], limit=25)
                body = render_artist(artist, top, albums)
                summary = f"{artist['name']}: {len(top)} top track(s), {len(albums)} album(s)"
        except (MusicError, GatewayError, ValueError) as exc:
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content(str(exc)))
            ctx.message(f"I could not read Deezer's catalogue: {exc}")
            return STOP_END_TURN

        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(summary))
        ctx.stream_text(body + "\n")
        ctx.message(f"\nSource: {DATASET}, read live. Every track has a 30-second preview file "
                    "Deezer hosts; the rank is a popularity score running to about a million, "
                    "so it only means something beside another track's.")
        return STOP_END_TURN

    def _run_skill(self, ctx: SessionContext, params: dict, tool: str) -> str:
        """The premium skill. The licence is checked on the gateway, not here."""
        if not params.get("artist"):
            #: No artist to build from. Asking is the honest answer - naming one here would
            #: be inventing the question the reader did not ask.
            ctx.tool_call_update(tool, status="completed",
                                 content=ctx.text_content("no artist named"))
            ctx.stream_text("Tell me which artist to build the set from, for example "
                            "build me a 45 minute Radiohead set.\n")
            ctx.message("A listening set is built from one artist's most-played tracks, so I "
                        "need the artist's name first.")
            return STOP_END_TURN
        arguments: dict = {"artist": params["artist"]}
        if params.get("max_minutes"):
            arguments["max_minutes"] = int(params["max_minutes"])
        if params.get("allow_explicit") is not None:
            arguments["allow_explicit"] = bool(params["allow_explicit"])

        data, refused = premium_call(self.gateway, "music_listening_set", arguments,
                                     {"agent": "music"})
        if refused:
            # Already an (answer, artifact) pair, worded by the gateway.
            answer, artifact = refused
            ctx.tool_call_update(tool, status="completed",
                                 content=ctx.text_content(artifact["summary"]))
            ctx.stream_text(answer + "\n")
            ctx.message("That is a premium skill, so the answer comes from the licence gateway. "
                        "The wording above is the gateway's own.")
            return STOP_END_TURN

        if not isinstance(data, dict) or not data.get("artist") or not data.get("tracks"):
            answer, artifact = empty_premium_answer(
                "The licence gateway did not send back a listening set for that artist.",
                {"agent": "music"})
            ctx.tool_call_update(tool, status="completed",
                                 content=ctx.text_content(artifact["summary"]))
            ctx.stream_text(answer + "\n")
            ctx.message("I could not read a set out of what the gateway sent.")
            return STOP_END_TURN

        body = render_set(data)
        summary = (f"{data['artist']}: {data.get('setSize', 'not reported')} track(s), "
                   f"{_num(data.get('setMinutes'))} min")
        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(summary))
        ctx.stream_text(body + "\n")
        ctx.message(f"\nSource: {data.get('source', DATASET)}, built on the licence gateway. The "
                    "set is Deezer's most-played order with the alternate versions and the "
                    "explicit cuts taken out, so the runtimes add up to what the budget says. "
                    "A track dropped for running past the budget is not a judgement about it.")
        return STOP_END_TURN

    def on_cancel(self, session) -> None:
        return None  # one read, one answer


def main(argv=None) -> int:
    import logging

    logging.basicConfig(level=logging.INFO, stream=sys.stderr,
                        format="%(asctime)s %(levelname)s %(name)s %(message)s")
    try:
        MusicAgent().run()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
