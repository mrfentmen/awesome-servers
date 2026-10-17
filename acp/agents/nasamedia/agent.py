"""Nasamedia - NASA pictures, video and audio for a mission, a place or a year.

NASA's image library holds 140,000+ items and answers a keyword search keyless, and
nobody asks it from an editor. "find me the Apollo 11 landing" returns real JSC and
KSC items with the date, the centre that holds them and a direct file link, and
"what media is in collection X" groups what the library actually returns by the
`album` field, which is what a collection is in this API.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from acp_kit import STOP_END_TURN, STOP_REFUSAL, AcpAgent, SessionContext, prompt_text

from data import (DATASET, MEDIA_TYPES, NasaMediaData, NasaMediaError,  # noqa: E402
                  NasaMediaNotFound, normalise_media_type)

HELP = (
    "I search NASA's image, video and audio library (keyless, 140,000+ items). Ask me:\n"
    "  - find NASA images of the Apollo 11 landing\n"
    "  - show me video of the Mars landing\n"
    "  - what media is in collection Apollo 11\n"
    "  - show me item jsc2007e034221\n"
    "Every result carries its date, the centre that holds it and a direct link to the\n"
    "file. A search page is 100 items: when the library reports more hits than that I\n"
    "say so, and for the real totals across every page, broken down by centre, decade\n"
    "and media type, that is a premium skill.\n"
    "This API has no way to ask for a collection by id - `collection_id` is refused with\n"
    "HTTP 400 and the catalogue endpoint 404s - so a collection question is answered by\n"
    "the `album` field on what a keyword search returns, which is honest about the limit."
)

PERMISSION_KEY = "nasamedia-read-nasa-library"

SKILLS = ("nasamedia-search", "nasamedia-collection", "nasamedia-item",
          "nasamedia-coverage", "help")

_MEDIA_WORDS = re.compile(r"\b(image|images|picture|pictures|photo|photos|photograph|"
                          r"video|videos|movie|movies|film|audio|sound|sounds|"
                          r"animation|animations)\b", re.IGNORECASE)
_MEDIA_CANON = {"picture": "image", "pictures": "image", "photo": "image",
                "photos": "image", "photograph": "image", "movie": "video",
                "movies": "video", "film": "video", "sound": "audio", "sounds": "audio",
                "animation": "video", "animations": "video"}
#: The plural of a media type is the same request: 'images' asks for images.
_MEDIA_PLURAL = {"images": "image", "videos": "video", "audios": "audio"}
_NASA_WORDS = re.compile(r"\b(nasa|apollo|shuttle|iss|soyuz|gemini|mercury|voyager|"
                         r"curiosity|perseverance|mars|moon|earth|hubble|webb|"
                         r"saturn|jupiter|skyview|spacesuit|suit|astronaut|splashdown|"
                         r"liftoff|launch|landing|rover|lander|orbit|space station|"
                         r"solar system|nebula|galaxy|comet|asteroid|artemis)\b",
                         re.IGNORECASE)
_COLLECTION_WORDS = re.compile(r"\b(collection|collections|album|albums|series|"
                               r"what media is in|what is in|contents of|"
                               r"how much media|what media)\b", re.IGNORECASE)
_YEAR_RE = re.compile(r"\b(?:19|20)\d{2}\b")
_LIMIT_RE = re.compile(r"\b(?:top|first|sample|show|list)\s+(\d{1,3})\b", re.IGNORECASE)
_PAGES_RE = re.compile(r"\b(?:over|across|throughout|every|all)\s+(\d{1,2})\s+pages?\b",
                       re.IGNORECASE)
_OTHER_WORDS = re.compile(r"\b(weather|forecast|tide|earthquake|air quality|water|"
                          r"stock price|crypto|news)\b", re.IGNORECASE)

#: A NASA item id: a short centre prefix and digits, e.g. jsc2007e034221. Only this
#: form reaches the item skill - it is the one thing a keyword search cannot find.
_NASA_ID_RE = re.compile(r"\b[a-z]{2,6}\d{4}[a-z0-9]{2,}\b", re.IGNORECASE)

#: A question about the *shape* of a result set rather than the results themselves:
#: totals, a breakdown, or a count across more than one page. The free search skill
#: prints page 1 and says how many hits there were, so a plain "show me images of X"
#: stays with it. Nothing else is premium.
_COVERAGE_WORDS = re.compile(
    r"\b(break ?down|broken down|split by|grouped by|by centre|by center|by decade|"
    r"by year|by media type|per centre|per center|coverage|how many (?:pictures|images|"
    r"photos|videos|items|assets|media)|how much|distribution|breakdown|statistics|stats|"
    r"across (?:all|every|the whole|multiple) pages|every page|all pages|over \d+ pages)\b",
    re.IGNORECASE,
)


def media_type_from_text(text: str) -> str | None:
    """The media type asked for, or None. Raises for a type the library does not hold."""
    for word in _MEDIA_WORDS.findall(text or ""):
        lowered = word.lower()
        canonical = _MEDIA_CANON.get(lowered) or _MEDIA_PLURAL.get(lowered, lowered)
        if canonical in MEDIA_TYPES:
            return canonical
    return None


def _query_from_text(text: str, drop_id: str | None = None) -> str:
    """The search phrase, with NASA's own question words taken out.

    The words that name the *request* are not the words the library should be asked
    for, so 'show me top 5 images of the apollo 11 landing' searches for
    'apollo 11 landing'. Numbers are kept - '11' is part of the mission name - and
    only a year, which is a filter rather than a keyword, comes out.
    """
    drop = re.compile(
        r"^\s*(?:please\s+)?(?:can you\s+)?(?:show|find|get|give|list|search(?:\s+for)?|"
        r"look\s+up|pull\s+up|open|what(?:'s| is| are)?|which|who|tell me about|"
        r"i want|i need|how many|how much)\b[\s:]*", re.IGNORECASE)
    junk = re.compile(
        r"\b(?:nasa|the|a|an|me|for|of|from|about|with|and|any|some|in|on|at|to|by|"
        r"its|is|are|was|were|be|images|image|"
        r"pictures|picture|photo|photos|videos|video|audio|media|item|items|"
        r"please|thanks|thank you|top|first|sample|page|pages|collection|album|"
        r"item|items|is|are|was|were|be|been|does|did|do|has|have|had|there|it|its|"
        r"that|this|all|only|just|also|too|very|really|here|there)\b", re.IGNORECASE)
    working = str(text or "").strip()
    if drop_id:
        working = working.replace(drop_id, " ")
    working = drop.sub("", working)
    working = _COLLECTION_WORDS.sub(" ", working)
    working = _COVERAGE_WORDS.sub(" ", working)
    working = junk.sub(" ", working)
    working = re.sub(r"\btop\s+\d{1,3}\b", " ", working, flags=re.IGNORECASE)
    #: A year is a filter, not a keyword. '11' is not, so it stays.
    working = re.sub(r"\b(?:19|20)\d{2}\b", " ", working)
    working = re.sub(r"[^\w\s'-]", " ", working, flags=re.UNICODE)
    return re.sub(r"\s+", " ", working).strip().lower()


def group_by_collection(rows: list[dict]) -> list[tuple[str, int]]:
    """(collection, items) for every album in these rows, biggest first.

    An item sits in more than one collection, so the counts here are 'how many of
    these items name this collection', not the size of the collection.
    """
    counts: dict[str, int] = {}
    for row in rows:
        for name in row.get("album") or []:
            counts[name] = counts.get(name, 0) + 1
    return sorted(counts.items(), key=lambda pair: (-pair[1], pair[0]))


def route(text: str) -> tuple[str, dict]:
    """Deterministic intent routing: (skill, params). Pure function, easy to test."""
    stripped = str(text or "").strip()
    if not stripped or re.search(r"\b(help|what can you do|commands?)\b", stripped, re.IGNORECASE):
        return "help", {}
    if _OTHER_WORDS.search(stripped):
        return "help", {}

    media_type = media_type_from_text(stripped)
    ident = _NASA_ID_RE.search(stripped)
    query = _query_from_text(stripped, drop_id=ident.group(0) if ident else None)
    limit_match = _LIMIT_RE.search(stripped)
    limit = int(limit_match.group(1)) if limit_match else 5
    years = [int(year) for year in _YEAR_RE.findall(stripped)]

    # Checked first, and narrow on purpose: a breakdown or a count across more than
    # one page. A plain search, a collection question and an item id all fall through
    # to the free skills below.
    if query and _COVERAGE_WORDS.search(stripped) and _NASA_WORDS.search(stripped):
        params: dict = {"query": query, "limit": limit}
        if media_type:
            params["media_type"] = media_type
        pages = _PAGES_RE.search(stripped)
        if pages:
            params["pages"] = int(pages.group(1))
        if years:
            params["year_start"], params["year_end"] = min(years), max(years)
        return "nasamedia-coverage", params

    if ident and not query:
        return "nasamedia-item", {"nasa_id": ident.group(0)}

    if query and _COLLECTION_WORDS.search(stripped):
        params = {"query": query, "limit": limit}
        if media_type:
            params["media_type"] = media_type
        return "nasamedia-collection", params

    if query:
        params = {"query": query, "limit": limit}
        if media_type:
            params["media_type"] = media_type
        if len(years) == 1:
            params["year_start"] = years[0]
            params["year_end"] = years[0]
        elif len(years) >= 2:
            params["year_start"], params["year_end"] = min(years), max(years)
        return "nasamedia-search", params

    return "help", {}


def _size(size) -> str:
    """A byte count as KB/MB, or the honest 'not reported'."""
    if not isinstance(size, (int, float)) or size <= 0:
        return "size not reported"
    if size >= 1_000_000:
        return f"{size / 1_000_000:.1f} MB"
    return f"{max(1, round(size / 1000))} KB"


def render_item(row: dict) -> str:
    """One library item: who took it, when, and how to get the file."""
    lines = [f"{row.get('title') or '(untitled)'}  [{row.get('nasa_id') or 'no id'}]"]
    bits = []
    if row.get("date_created"):
        bits.append(row["date_created"])
    if row.get("center"):
        bits.append(f"centre {row['center']}")
    if row.get("media_type"):
        bits.append(row["media_type"])
    if bits:
        lines.append("  " + " | ".join(bits))
    if row.get("description"):
        text = " ".join(str(row["description"]).split())
        lines.append(f"  {text[:220]}{'...' if len(text) > 220 else ''}")
    if row.get("keywords"):
        lines.append("  keywords: " + ", ".join(row["keywords"][:8]))
    if row.get("album"):
        lines.append("  collections: " + ", ".join(row["album"]))
    files = row.get("files") or row.get("assets") or []
    for entry in files[:6]:
        name = entry.get("href", "").rsplit("/", 1)[-1]
        dimensions = ""
        if entry.get("width") and entry.get("height"):
            dimensions = f", {entry['width']}x{entry['height']}"
        lines.append(f"  {name} ({_size(entry.get('size'))}{dimensions})")
        lines.append(f"    {entry.get('href')}")
    if not files:
        lines.append("  no media file is published for this item")
    return "\n".join(lines)


def render_search(result: dict, limit: int = 5) -> str:
    """One page of results, and an honest word about the rest."""
    where = f" as {result['media_type']}" if result.get("media_type") else ""
    wanted = max(1, min(int(limit or 5), 25))
    shown = result["items"][:wanted]
    lines = [f"NASA's library: {result['returned']} item(s){where} matching "
             f"{result['query']!r} on page {result['page']} of the search results"]
    if result.get("total_hits") is not None:
        more = " (more pages exist)" if result.get("more_pages") else " (that is the whole set)"
        lines.append(f"  the library reports {result['total_hits']} hit(s) in total{more}, "
                     f"a page holds {result['page_size']}")
    if len(shown) < result["returned"]:
        lines.append(f"  showing the first {len(shown)} of the {result['returned']} on this page")
    for row in shown:
        best = row["assets"][0]["href"].rsplit("/", 1)[-1] if row["assets"] else "no file link"
        lines.append(f"  {row.get('date_created') or 'no date'}  {row.get('title') or '(untitled)'}"
                     f"  [{row.get('nasa_id') or 'no id'}]")
        detail = [bit for bit in (row.get("center"), row.get("media_type")) if bit]
        if row.get("album"):
            detail.append("collection " + ", ".join(row["album"]))
        if detail:
            lines.append("    " + " | ".join(detail))
        lines.append(f"    {best}")
    return "\n".join(lines)


def render_collection(result: dict) -> str:
    """A collection question: what the library returned, grouped by `album`."""
    lines = [f"NASA's library has no collection endpoint, so this is what a keyword search "
             f"for {result['query']!r} actually returns"]
    lines.append(f"  {result['returned']} item(s) on page {result['page']}"
                 + (f", {result['total_hits']} hit(s) in total" if result.get("total_hits")
                    is not None else ""))
    groups = group_by_collection(result["items"])
    if not groups:
        lines.append("  none of these items names a collection (`album` is empty on all of them)")
    else:
        lines.append(f"  {len(groups)} collection(s) named by these items:")
        for name, count in groups[:12]:
            lines.append(f"    {name}: {count} of these {result['returned']} item(s)")
    for row in result["items"][:3]:
        lines.append(f"  sample item: {row.get('title') or '(untitled)'} "
                     f"[{row.get('nasa_id') or 'no id'}]"
                     + (f", {row['date_created']}" if row.get("date_created") else ""))
    lines.append("  note: an item can sit in more than one collection, so these counts are "
                 "'how many of these items name it', not the size of the collection")
    return "\n".join(lines)


def _num(value) -> str:
    """A number for a line of text, or the honest 'not reported'."""
    if value is None or value == "":
        return "not reported"
    try:
        return f"{float(value):g}"
    except (TypeError, ValueError):
        return str(value)


def render_coverage(data: dict) -> str:
    """The coverage board: totals across every page, broken down."""
    counts = data.get("counts") or {}
    by_decade = data.get("by_decade") or {}
    lines = [f"{data.get('query', 'not reported')} - NASA's library coverage across "
             f"{_num(data.get('pages_read'))} page(s) of results"]
    lines.append(f"  items read: {_num(data.get('items_read'))} of the "
                 f"{_num(data.get('total_hits'))} hit(s) the library reports"
                 + (", so these are a sample" if data.get("sampled") else ""))
    lines.append(f"  media types: " + ", ".join(
        f"{name} {_num(counts.get(name))}" for name in sorted(counts)) if counts
        else "  media types: not reported")
    if by_decade:
        #: Decades read oldest first: a timeline that starts at the present is not a timeline.
        span = ", ".join(f"{year}s {_num(by_decade[year])}"
                         for year in sorted(by_decade, key=lambda k: int(k))[:12])
        lines.append(f"  by decade: {span}")
    else:
        lines.append("  by decade: not reported (NASA left `date_created` empty on these items)")
    centres = data.get("by_center") or {}
    if centres:
        span = ", ".join(f"{name} {_num(centres[name])}"
                         for name in sorted(centres, key=lambda k: -centres[k])[:8])
        lines.append(f"  by centre: {span}")
    else:
        lines.append("  by centre: not reported")
    keywords = data.get("top_keywords") or []
    lines.append("  top keywords: " + (", ".join(keywords[:12]) if keywords else "not reported"))
    return "\n".join(lines)


class NasaMediaAgent(AcpAgent):
    name = "nasamedia"
    title = "Nasamedia - NASA pictures, video and audio by mission, place or year"
    version = "1.0.0"

    def __init__(self, connection=None, data: NasaMediaData | None = None,
                 gateway=None) -> None:
        super().__init__(connection)
        self.data = data or NasaMediaData()
        self.gateway = gateway

    # -- ACP ---------------------------------------------------------------

    def new_session(self, session) -> dict:
        session.remember("agent", "Nasamedia session opened. " + HELP.splitlines()[0])
        return {}

    def prompt(self, ctx: SessionContext, prompt: list[dict]) -> str:
        text = prompt_text(prompt)
        skill, params = route(text)
        ctx.plan([
            (f"Route the request ({skill})", "high"),
            ("Read NASA's image and video library", "medium"),
            ("Report the items, the dates and the file links", "medium"),
        ])

        if skill == "help":
            ctx.stream_text(HELP)
            ctx.message("Searches are free and keyless. Totals across every page are premium.")
            return STOP_END_TURN

        tool = f"call_{skill.replace('-', '_')}"
        ctx.tool_call(tool, "Read NASA's image and video library", kind="fetch", name=skill,
                      raw_input=dict(params))
        if not ctx.ask_permission(tool, "Allow Nasamedia to search NASA's public image library?",
                                  remember_key=PERMISSION_KEY):
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content("permission denied"))
            ctx.message("I need permission to search NASA's image library first.")
            return STOP_REFUSAL
        ctx.tool_call_update(tool, status="in_progress")

        try:
            if skill == "nasamedia-coverage":
                return self._run_skill(ctx, params, tool)
            if skill == "nasamedia-item":
                row = self.data.entry(params["nasa_id"])
                body = render_item(row)
                summary = f"{row.get('title') or row['nasa_id']}: {len(row.get('files') or [])} file(s)"
            elif skill == "nasamedia-collection":
                result = self.data.search(params["query"],
                                          media_type=params.get("media_type"))
                body = render_collection(result)
                groups = group_by_collection(result["items"])
                summary = (f"{params['query']}: {result['returned']} item(s), "
                           f"{len(groups)} collection(s) named")
            else:
                result = self.data.search(params["query"],
                                          media_type=params.get("media_type"),
                                          year_start=params.get("year_start"),
                                          year_end=params.get("year_end"))
                body = render_search(result, limit=params.get("limit") or 5)
                summary = f"{result['query']}: {result['returned']} item(s)"
        except (NasaMediaError, ValueError) as exc:
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content(str(exc)))
            ctx.message(f"I could not read NASA's image library: {exc}")
            return STOP_END_TURN

        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(summary))
        ctx.stream_text(body + "\n")
        ctx.message(f"\nSource: {DATASET}, read live. Every item links straight to the file "
                    "NASA publishes, largest first. One page is 100 items, so a search that "
                    "reports more hits than that is a sample, not the whole set.")
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
        NasaMediaAgent().run()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
