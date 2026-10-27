"""The Deezer agent: four free skills and one premium one.

  - music-search:    search tracks, artists and albums in one read
  - artist-albums:   one artist's releases as Deezer pages them
  - track-preview:   the 30-second preview URL for a track
  - chart:           the global chart
  - artist-timeline: when an artist actually put things out - premium, on the gateway

Artist-timeline is the one question the free skills cannot answer. `artist-albums`
hands back Deezer's own page of an artist's releases, which is unordered by date and
says nothing about the gaps. The timeline needs every album sorted by release date,
grouped by year, with the gaps measured, so that work runs on a hosted service that was removed
and a caller who has not paid gets a not-implemented stub message and no dates at all.
"""

from __future__ import annotations

import os
import re

from a2a_kit import SkillAgent, UpstreamError

from data import (
    DATASET,
    SOURCE,
    DeezerClient,
)

SKILL_MUSIC_SEARCH = "music-search"
SKILL_ARTIST_ALBUMS = "artist-albums"
SKILL_TRACK_PREVIEW = "track-preview"
SKILL_CHART = "chart"
SKILL_ARTIST_TIMELINE = "artist-timeline"

DEFAULT_LIMIT = 10
MAX_LISTED = 15

CARD_SKILLS = [
    {
        "id": SKILL_MUSIC_SEARCH,
        "name": "Search Deezer",
        "description": (
            "Search the Deezer catalogue for tracks, artists or albums by name in one read, with each "
            "result's title, artist, album, length, release year and listener rank. Narrow it to one kind "
            "of result when you only want tracks, only artists or only albums."
        ),
        "tags": ["music", "search", "tracks", "artists", "albums", "deezer"],
        "examples": [
            "search deezer for creep",
            "who is this song: creeps radiohead",
            '{"skill": "music-search", "query": "Radiohead", "type": "album", "limit": 5}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_ARTIST_ALBUMS,
        "name": "An artist's releases",
        "description": (
            "One artist's releases as Deezer pages them: title, release date, record type (album, single, "
            "EP, compilation), track count and runtime. Give the artist's name or a Deezer artist id."
        ),
        "tags": ["music", "artist", "albums", "discography", "deezer"],
        "examples": [
            "what albums does Radiohead have?",
            "discography of Radiohead",
            '{"skill": "artist-albums", "artist": "Radiohead", "limit": 10}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_TRACK_PREVIEW,
        "name": "Track preview link",
        "description": (
            "The 30-second preview URL for one track, plus its title, artist, album, length, ISRC and "
            "explicit flag. Give a Deezer track id, or a title and artist and Deezer's own best match is "
            "used and named."
        ),
        "tags": ["music", "preview", "track", "listen", "sample", "deezer"],
        "examples": [
            "30 second preview of Creep by Radiohead",
            "preview for track 138547415",
            '{"skill": "track-preview", "track_id": "138547415"}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_CHART,
        "name": "Music chart",
        "description": (
            "The top of the global Deezer chart right now: position, title, artist, album, length and "
            "listener rank."
        ),
        "tags": ["music", "chart", "trending", "top", "deezer"],
        "examples": [
            "what is on the music chart?",
            "top 5 tracks right now",
            '{"skill": "chart", "limit": 5}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_ARTIST_TIMELINE,
        "name": "Artist release timeline",
        "description": (
            "When an artist actually put things out: every release in date order with its record type, "
            "grouped by year, how many releases each year brought, the longest gap between two releases "
            "in months, and the total hours of music. Premium: it runs on a hosted service that was removed."
        ),
        "tags": ["music", "artist", "timeline", "releases", "discography",],
        "examples": [
            "when did Radiohead actually release things?",
            "build me a release timeline for Radiohead",
            '{"skill": "artist-timeline", "artist": "Radiohead", "limit": 20}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
]

_TRACK_ID_RE = re.compile(r"\b(?:track|song) (?:id )?(\d{1,12})\b", re.IGNORECASE)
_ARTIST_ID_RE = re.compile(r"\b(?:artist|by) (?:id )?(\d{1,12})\b", re.IGNORECASE)
_LIMIT_RE = re.compile(r"\b(?:top|first|limit|last)\s+(\d{1,2})\b", re.IGNORECASE)
#: "30 second preview", "30s sample" - Deezer always serves 30 seconds.
_PREVIEW_WORDS = re.compile(
    r"\b(preview|sample|excerpt|listen to|play me|30 seconds?|30s|hear (?:a|some|the))\b", re.IGNORECASE
)
_CHART_WORDS = re.compile(
    r"\b(chart|charts|trending|trends|most (?:played|streamed|listened)|"
    r"top \d{1,2} (?:tracks?|songs?)|"
    r"number one|what(?:'s| is) (?:hot|popular|biggest)|hot right now)\b",
    re.IGNORECASE,
)
_ALBUM_WORDS = re.compile(
    r"\b(albums?|discography|releases?|what has .* (?:put out|released|recorded)|"
    r"studio (?:albums?|recordings?))\b",
    re.IGNORECASE,
)
#: "find me an album called X" is a lookup of one thing, not a discography read.
_SEARCH_STRONG_WORDS = re.compile(
    r"\b(?:find|search|look for|look up|lookup)\b[^.?!]{0,40}\b(?:called|named)\b",
    re.IGNORECASE,
)
_SEARCH_WORDS = re.compile(
    r"\b(find|search|look up|lookup|look for|search deezer for)\b|"
    r"\bwho (?:is|are|plays|played|sings|sang)\b|"
    r"\bwhat (?:song|track|album|artist)s? (?:is|are|sounds?|matches)\b|"
    r"\b(?:song|track|album|artist)s? (?:like|called|named|matching|similar to)\b",
    re.IGNORECASE,
)
#: The premium skill asks when things came out, not what is there. Deliberately narrow:
#: "what albums does X have" stays with artist-albums.
_TIMELINE_WORDS = re.compile(
    r"\b(when did .{0,40}\b(?:release|come out|put out|publish)|"
    r"release (?:history|timeline|dates|order)|"
    r"(?:come|put) (?:out|out over) over (?:the |their )?years?|"
    r"timeline for|chronological|chronology|"
    r"how often (?:do|does) .{0,30}\brelease|"
    r"how long (?:between|since) .{0,30}\b(?:releases?|albums?)|"
    r"career timeline|catalog(?:ue)? timeline)\b",
    re.IGNORECASE,
)
_QUOTED_RE = re.compile(r"[\"“”'‘’]([^\"“”]{2,80})[\"“”'‘’]")
#: An artist named after "of", "by", "for", "from", "is" - or simply capitalised.
_ARTIST_CONNECTOR_RE = re.compile(
    r"\b(?:albums?|discography|releases?|of|by|for|from|plays|played|sings|sang|artist|timeline for)\s+"
    r"(?:an?\s+|the\s+)*([A-Za-z0-9][A-Za-z0-9'’.\-&]{1,30}"
    r"(?:\s+(?:[A-Za-z0-9][A-Za-z0-9'’.\-&]{1,30}|of|the|a|an|and|&)){0,5})",
    re.IGNORECASE,
)
#: A capitalised word, two characters or more, plus a bare article so that "The
#: Beatles" and "A Tribe Called Quest" keep the article that is part of the name.
_TITLE_WORD = r"[A-Z][A-Za-z0-9'’.\-&]{0,30}"
_CAPITALISED_RE = re.compile(
    rf"\b({_TITLE_WORD}(?:(?:\s+(?:of|the|and|&)\s+|\s+){_TITLE_WORD}){{0,5}})"
)
#: An article is part of the name, so "a", "an" and "the" are never trimmed: "The
#: Beatles" and "A Tribe Called Quest" are names, article included.
_ARTIST_STOPWORDS = {
    "album", "albums", "and", "any", "are", "as", "artist", "at", "be", "by", "called",
    "catalog", "chart", "chronological", "chronology", "did", "do", "does", "discography", "each",
    "every", "find", "first", "for", "from", "has", "have", "i", "in", "into", "is", "it", "its",
    "last", "like", "listen", "list", "look", "lookup", "me", "most", "my", "name", "named",
    "now", "of", "on", "one", "only", "or", "play", "played", "plays", "put", "release",
    "released", "releases", "right", "sample", "search", "sang", "sings", "song", "songs", "studio",
    "such", "that", "their", "them", "there", "these", "this", "those", "timeline", "top",
    "track", "tracks", "what", "when", "where", "which", "who", "whose", "why", "with", "you",
}
_ARTIST_REJECT_RE = re.compile(
    r"\b(?:albums?|discography|releases?|songs?|tracks?|chart|timeline|seconds?|preview|"
    r"sample|minutes?|top|first|last|right now|played|sings?|released?|"
    r"things?|stuff|music|anything|everything)\b",
    re.IGNORECASE,
)
#: Trailing words that belong to the sentence rather than to the name, trimmed from
#: the end only - an article is part of the name and stays.
_ARTIST_TAIL_STOPWORDS = {
    "all", "always", "any", "are", "been", "ever", "got", "had", "has", "have", "now", "out",
    "played", "puts", "put", "recent", "recently", "released", "recorded", "sang", "sings", "some",
    "stuff", "things", "today", "up", "was", "were", "yet",
}
_TYPE_RE = re.compile(r"\b(tracks?|artists?|albums?)\s+(?:only|just)\b", re.IGNORECASE)
_ALL_SKILLS = (SKILL_MUSIC_SEARCH, SKILL_ARTIST_ALBUMS, SKILL_TRACK_PREVIEW,
               SKILL_CHART, SKILL_ARTIST_TIMELINE)

HELP = (
    "I read the Deezer public music catalogue. Ask me:\n"
    "  • search deezer for creep\n"
    "  • what albums does Radiohead have?\n"
    "  • 30 second preview of Creep by Radiohead\n"
    "  • what is on the music chart?\n"
    "  • when did Radiohead actually release things?\n"
    "Titles, artists, albums, runtimes and preview links are Deezer's own, read live. "
    "Preview links are 30 seconds and carry Deezer's own expiry, so use them soon."
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


def _clean_artist(candidate: str) -> str | None:
    """Trim the question's own leading words off a captured run and judge what is left.

    Only the front is trimmed, because an article belongs to the name: "The Beatles"
    and "A Tribe Called Quest" are names, article included.
    """
    words = [word for word in candidate.strip(" .,'’\"").split() if word]
    while words and words[0].lower().strip(",.") in _ARTIST_STOPWORDS:
        words.pop(0)
    while words and words[-1].lower().strip("?!,.?") in _ARTIST_TAIL_STOPWORDS:
        words.pop()
    if not 1 <= len(words) <= 6 or not re.match(r"[A-Za-z0-9]", words[0]):
        return None
    if len(words) == 1 and len(words[0]) < 3:
        return None
    name = " ".join(words)
    if _ARTIST_REJECT_RE.search(name):
        return None
    return name


def artist_from_text(text: str, artist: str | None) -> str | None:
    """An artist name only when the text offers one - never the whole question."""
    if artist:
        return None
    quoted = _QUOTED_RE.search(text)
    if quoted:
        name = _clean_artist(quoted.group(1))
        if name:
            return name
    # A name in a sentence is capitalised, so that pass runs before the looser
    # connector pass: in "when did Radiohead release things" the connector finds
    # "things" and the capitalised run finds the artist.
    capitals = _CAPITALISED_RE.search(text)
    if capitals:
        name = _clean_artist(capitals.group(1))
        if name:
            return name
    match = _ARTIST_CONNECTOR_RE.search(text)
    if match:
        return _clean_artist(match.group(1))
    return None


def query_from_text(text: str, query: str | None) -> str | None:
    """What to search Deezer for when the caller named no explicit query."""
    if query:
        return None
    stripped = re.sub(r"^\s*(?:find|search|look up|lookup|look for)\s+(?:for\s+)?", "", text,
                      flags=re.IGNORECASE)
    stripped = re.sub(r"^\s*(?:30[-\s]?second\s+)?(?:preview|sample|excerpt)\s+(?:of|for)\s+", "",
                      stripped, flags=re.IGNORECASE)
    stripped = re.sub(r"^\s*(?:listen to|play me|hear (?:a|the|some))\s+", "", stripped,
                      flags=re.IGNORECASE)
    stripped = re.sub(
        r"^\s*(?:me|us)\s+(?:an?|the)\s+(?:album|song|track|artist)?\s*(?:called|named)?\s*",
        "", stripped, flags=re.IGNORECASE)
    stripped = re.sub(r"^\s*deezer\s+for\s+", "", stripped, flags=re.IGNORECASE)
    stripped = re.sub(r"^(?:what|who)\s+(?:is|are|sings?|plays?)?\s*(?:the\s+)?(?:song|track)?\s*",
                     "", stripped, flags=re.IGNORECASE)
    stripped = stripped.strip(" .?!,")
    if 2 <= len(stripped) <= 100:
        return stripped
    return None


def parse(message: dict) -> dict:
    """Incoming message -> {skill, params, explicit}. Never raises."""
    text = message_text(message)
    data = message_data(message)
    requested = _first(data, "skill", "skill_id")

    artist = _first(data, "artist", "artist_name")
    artist_id = _first(data, "artist_id")
    if artist_id is None:
        found = _ARTIST_ID_RE.search(text)
        if found:
            artist_id = found.group(1)
    track_id = _first(data, "track_id", "track")
    if track_id is None:
        found = _TRACK_ID_RE.search(text)
        if found:
            track_id = found.group(1)
    query = _first(data, "query", "q", "term")
    item_type = _first(data, "type", "item_type")
    if item_type is None:
        found = _TYPE_RE.search(text)
        if found:
            item_type = found.group(1)
    limit = _first(data, "limit", default=DEFAULT_LIMIT)
    if limit == DEFAULT_LIMIT:
        found = _LIMIT_RE.search(text)
        if found:
            limit = found.group(1)

    asks_chart = bool(_CHART_WORDS.search(text))
    asks_preview = bool(_PREVIEW_WORDS.search(text))
    asks_timeline = bool(_TIMELINE_WORDS.search(text))
    asks_albums = bool(_ALBUM_WORDS.search(text))

    if requested in _ALL_SKILLS:
        skill = requested
    elif asks_timeline:
        skill = SKILL_ARTIST_TIMELINE
    elif asks_chart and not asks_albums:
        skill = SKILL_CHART
    elif asks_preview:
        skill = SKILL_TRACK_PREVIEW
    elif asks_albums and not _SEARCH_STRONG_WORDS.search(text):
        skill = SKILL_ARTIST_ALBUMS
    elif _SEARCH_WORDS.search(text):
        skill = SKILL_MUSIC_SEARCH
    else:
        skill = SKILL_MUSIC_SEARCH

    # An artist name is read for every skill: a follow-up that is just "Radiohead"
    # has to reach whichever skill the pending task is holding, and only an artist
    # name can complete all of them.
    if artist is None:
        artist = artist_from_text(text, None)
    if artist is None:
        # A bare word or a bare capitalised name is the name itself.
        bare = text.strip(" \t\n.?!,")
        if 2 <= len(bare) <= 60 and "?" not in bare and artist_from_text(bare, None) == bare:
            artist = bare
    if query is None and skill in (SKILL_MUSIC_SEARCH, SKILL_TRACK_PREVIEW):
        query = query_from_text(text, None)

    params: dict = {"limit": limit}
    for key, value in (("artist", artist), ("artist_id", artist_id), ("track_id", track_id),
                       ("query", query)):
        if value is not None:
            params[key] = value
    if item_type is not None:
        params["type"] = item_type

    if not requested and (not text.strip() or re.search(r"\b(help|what can you do|commands?)\b", text, re.IGNORECASE)):
        skill, params = "help", {}
    explicit = bool(requested or asks_chart or asks_preview or asks_timeline or asks_albums
                    or _SEARCH_WORDS.search(text))
    return {"skill": skill, "params": params, "explicit": explicit}


# -- shared shape ---------------------------------------------------------


def _artifact(params: dict, client: DeezerClient, **extra) -> dict:
    artifact = {
        "dataset": DATASET,
        "product": "Deezer music catalogue: tracks, artists, albums, previews and charts",
        "source": SOURCE,
        "freshness": client.freshness(),
    }
    artifact.update(extra)
    return artifact


def _missing_artist() -> dict:
    return {
        "final_state": "input-required",
        "message": (
            "Which artist? Give me a name such as “Radiohead”, or a Deezer artist id such as "
            "“artist 399”."
        ),
        "artifact": None,
        "watch": None,
    }


def _resolve_artist(params: dict, client: DeezerClient):
    """(artist, problem) - problem is a finished response body, or None."""
    identifier = params.get("artist") or params.get("artist_id")
    if not identifier:
        return None, None
    try:
        artist = client.artist(identifier)
    except ValueError as exc:
        return None, {"final_state": "input-required", "message": str(exc),
                      "artifact": None, "watch": None}
    except UpstreamError:
        return None, {
            "final_state": "completed",
            "message": (
                f"Deezer has no artist matching “{identifier}”. Give the name as Deezer spells it, "
                "or the Deezer artist id."
            ),
            "artifact": _artifact(params, client, artist=None, query=identifier),
            "watch": None,
        }
    if artist is None:
        return None, {
            "final_state": "completed",
            "message": (
                f"Deezer has no artist matching “{identifier}”. Give the name as Deezer spells it, "
                "or the Deezer artist id."
            ),
            "artifact": _artifact(params, client, artist=None, query=identifier),
            "watch": None,
        }
    return artist, None


# -- skills ---------------------------------------------------------------


def run_music_search(params: dict, client: DeezerClient) -> dict:
    query = params.get("query")
    if not query:
        return {
            "final_state": "input-required",
            "message": "What am I searching Deezer for? A title, an artist or an album.",
            "artifact": None,
            "watch": None,
        }
    item_type = params.get("type")
    kind = client.check_item_type(item_type) if item_type else None
    found = client.search(query, limit=params.get("limit", DEFAULT_LIMIT), item_type=kind)
    total = client.search_total(query)
    artifact = _artifact(params, client, query=query, type=kind or "any",
                         results=found, count=len(found), total_matches=total)
    if not found:
        return {
            "final_state": "completed",
            "message": (
                f"Deezer matches nothing for “{query}”"
                + (f" of type {kind}" if kind else "")
                + f". (Read live from {DATASET}.)"
            ),
            "artifact": artifact,
            "watch": None,
        }
    lines = []
    for entry in found[:MAX_LISTED]:
        bits = [f"  • {entry.get('type')}"]
        bits.append(str(entry.get("title") or entry.get("name") or "untitled"))
        if entry.get("artist_name") and entry.get("artist_name") != entry.get("title"):
            bits.append(f"by {entry['artist_name']}")
        if kind != "album" and entry.get("album_title"):
            bits.append(f"on {entry['album_title']}")
        if entry.get("duration_label"):
            bits.append(str(entry["duration_label"]))
        if entry.get("release_year"):
            bits.append(str(entry["release_year"]))
        if entry.get("rank"):
            bits.append(f"rank {entry['rank']}")
        line = " - ".join(str(bit) for bit in bits)
        if entry.get("id"):
            line += f" (id {entry['id']})"
        lines.append(line)
    total_note = f" Deezer reports {total} match(es) in all." if total else ""
    return {
        "final_state": "completed",
        "message": (
            f"{len(found)} Deezer result(s) for “{query}”"
            + (f" of type {kind}" if kind else "")
            + f":\n" + "\n".join(lines) + "\n" + total_note.rstrip()
            + f"\nSource: {DATASET} (read live)."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_artist_albums(params: dict, client: DeezerClient) -> dict:
    artist, problem = _resolve_artist(params, client)
    if problem:
        return problem
    if artist is None:
        return _missing_artist()
    albums = client.artist_albums(artist["id"], limit=params.get("limit", DEFAULT_LIMIT))
    name = artist.get("name") or artist.get("id")
    artifact = _artifact(params, client, artist=artist, albums=albums, count=len(albums))
    if not albums:
        return {
            "final_state": "completed",
            "message": (
                f"Deezer lists no releases for {name} (artist {artist.get('id')}). "
                f"(Read live from {DATASET}.)"
            ),
            "artifact": artifact,
            "watch": None,
        }
    lines = []
    for album in albums[:MAX_LISTED]:
        bits = [f"  • {album.get('title') or 'untitled'}"]
        bits.append(str(album.get("release_date") or "release date not reported"))
        bits.append(str(album.get("record_type") or "record type not reported"))
        if album.get("nb_tracks") is not None:
            bits.append(f"{album['nb_tracks']} tracks")
        if album.get("duration_label"):
            bits.append(str(album["duration_label"]))
        lines.append(" - ".join(str(bit) for bit in bits))
    return {
        "final_state": "completed",
        "message": (
            f"{len(albums)} Deezer release(s) for {name}, in Deezer's own order:\n" + "\n".join(lines)
            + f"\nSource: {DATASET} (read live). This is the page order, not a date order - ask for the "
            "artist timeline if you want them by release date."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_track_preview(params: dict, client: DeezerClient) -> dict:
    track_id = params.get("track_id")
    picked_from_search = None
    if track_id is None:
        query = params.get("query")
        if not query:
            return {
                "final_state": "input-required",
                "message": (
                    "Which track? Give me a Deezer track id such as “track 138547415”, or a title "
                    "and artist such as “30 second preview of Creep by Radiohead”."
                ),
                "artifact": None,
                "watch": None,
            }
        matches = client.search(query, limit=1, item_type="track")
        if not matches:
            return {
                "final_state": "completed",
                "message": (
                    f"Deezer matches no track for “{query}”, so there is no preview to hand back. "
                    f"(Read live from {DATASET}.)"
                ),
                "artifact": _artifact(params, client, query=query, track=None),
                "watch": None,
            }
        picked = matches[0]
        track_id = picked.get("id")
        picked_from_search = query
    track = client.track(track_id)
    if track is None:
        return {
            "final_state": "completed",
            "message": (
                f"Deezer has no track with id {track_id}. Search for the title first and use the id "
                f"from the result. (Read live from {DATASET}.)"
            ),
            "artifact": _artifact(params, client, track_id=track_id, track=None),
            "watch": None,
        }
    artist, problem = _resolve_artist({"artist_id": track.get("artist_id")}, client)
    if problem:
        return problem
    name = (artist or {}).get("name") or track.get("artist_name") or "artist not reported"
    artifact = _artifact(params, client, track=track, artist=artist, track_id=track_id,
                         matched_from_search=picked_from_search)
    where = f" on {track['album_title']}" if track.get("album_title") else ""
    if not track.get("preview"):
        return {
            "final_state": "completed",
            "message": (
                f"Deezer publishes no preview for “{track.get('title')}” by {name}{where} "
                f"(track {track_id}). The full record is still live at {track.get('link') or 'Deezer'}. "
                f"(Read live from {DATASET}.)"
            ),
            "artifact": artifact,
            "watch": None,
        }
    preview = track["preview"]
    return {
        "final_state": "completed",
        "message": (
            f"“{track.get('title')}” by {name}{where} - track {track_id}, "
            f"{track.get('duration_label')}"
            + (f", ISRC {track['isrc']}" if track.get("isrc") else "")
            + (", explicit lyrics" if track.get("explicit_lyrics") else "")
            + ".\n"
            f"30-second preview:\n{preview}\n"
            f"Full track on Deezer: {track.get('link') or 'link not reported'}\n"
            f"Source: {DATASET} (read live). The preview URL is Deezer's own and expires, so use it soon."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_chart(params: dict, client: DeezerClient) -> dict:
    tracks = client.chart(limit=params.get("limit", DEFAULT_LIMIT))
    artifact = _artifact(params, client, tracks=tracks, count=len(tracks), scope="global")
    if not tracks:
        return {
            "final_state": "completed",
            "message": f"Deezer's chart came back empty. (Read live from {DATASET}.)",
            "artifact": artifact,
            "watch": None,
        }
    lines = []
    for track in tracks[:MAX_LISTED]:
        title = str(track.get("title_short") or track.get("title") or "untitled")
        bits = [f"  • {track.get('position')}. {title}"]
        if track.get("artist_name"):
            bits.append(f"by {track['artist_name']}")
        if track.get("album_title"):
            bits.append(f"on {track['album_title']}")
        if track.get("duration_label"):
            bits.append(str(track["duration_label"]))
        if track.get("rank"):
            bits.append(f"rank {track['rank']}")
        lines.append(" - ".join(str(bit) for bit in bits))
    return {
        "final_state": "completed",
        "message": (
            f"Deezer global chart, top {len(tracks)}:\n" + "\n".join(lines)
            + f"\nSource: {DATASET} (read live). Rank is Deezer's own popularity number."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_artist_timeline(params: dict, client: DeezerClient, gateway: object) -> dict:
    """Stub: the hosted implementation of this skill was removed in the paywall cleanup."""
    return {
        "final_state": "completed",
        "message": 'Not yet implemented: artist-timeline — its hosted implementation was removed.',
        "artifact": {"removed": True},
        "watch": None,
    }


class DeezerAgent(SkillAgent):
    name = "deezer"
    card_name = "Deezer Music Agent"
    card_description = (
        "Read-only agent over the Deezer public music catalogue: one search across tracks, artists and "
        "albums, an artist's releases as Deezer pages them, a track's 30-second preview link, and the "
        "global chart. Every answer is read live from Deezer."
    )
    env_prefix = "DEEZER"
    datasets = (DATASET,)
    card_skills = CARD_SKILLS

    def __init__(self, client: DeezerClient | None = None,
                 gateway: object | None = None) -> None:
        self.client = client or DeezerClient()
        self.gateway = gateway

    def parse(self, message: dict) -> dict:
        return parse(message)

    def missing(self, skill: str, params: dict) -> list[str]:
        if skill in (SKILL_ARTIST_ALBUMS, SKILL_ARTIST_TIMELINE):
            return [] if (params.get("artist") or params.get("artist_id")) else ["artist"]
        if skill == SKILL_TRACK_PREVIEW:
            return [] if (params.get("track_id") or params.get("query")) else ["track"]
        if skill == SKILL_MUSIC_SEARCH:
            return [] if params.get("query") else ["query"]
        return []

    def input_prompt(self, skill: str, missing: list[str]) -> str:
        if skill == SKILL_ARTIST_ALBUMS or skill == SKILL_ARTIST_TIMELINE:
            return _missing_artist()["message"]
        if skill == SKILL_TRACK_PREVIEW:
            return (
                "Which track? Give me a Deezer track id such as “track 138547415”, or a title "
                "and artist such as “30 second preview of Creep by Radiohead”."
            )
        return "What am I searching Deezer for? A title, an artist or an album."

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
        if skill == SKILL_ARTIST_TIMELINE:
            return run_artist_timeline(params, self.client, self.gateway)
        if skill == SKILL_ARTIST_ALBUMS:
            return run_artist_albums(params, self.client)
        if skill == SKILL_TRACK_PREVIEW:
            return run_track_preview(params, self.client)
        if skill == SKILL_CHART:
            return run_chart(params, self.client)
        if skill == SKILL_MUSIC_SEARCH:
            return run_music_search(params, self.client)
        return {"final_state": "completed", "message": HELP, "artifact": None, "watch": None}


__all__ = [
    "CARD_SKILLS",
    "DEFAULT_LIMIT",
    "HELP",
    "MAX_LISTED",
    "SKILL_ARTIST_ALBUMS",
    "SKILL_ARTIST_TIMELINE",
    "SKILL_CHART",
    "SKILL_MUSIC_SEARCH",
    "SKILL_TRACK_PREVIEW",
    "DeezerAgent",
    "UpstreamError",
    "artist_from_text",
    "message_data",
    "message_text",
    "parse",
    "query_from_text",
    "run_artist_albums",
    "run_artist_timeline",
    "run_chart",
    "run_music_search",
    "run_track_preview",
]
