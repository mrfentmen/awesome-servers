"""Films — cinema facts and watchable prints as an A2A agent.

The A2A twin of the Films ACP agent. It reads Wikidata for what a film is (year, director,
runtime, genre, IMDb id) and the Internet Archive's feature_films shelf for prints you can
actually watch. The fifth skill, a decade index over the Archive's film collection, runs on the
licence gateway.

Deterministic on purpose: routing is rules, the facts are Wikidata's and the prints are the
Archive's, and nothing is invented. Where a source does not carry a fact, the answer says
"not reported" instead of filling the gap.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

SERVER_DIR = Path(__file__).resolve().parent
REPO_ROOT = SERVER_DIR.parents[1]
for path in (str(SERVER_DIR), str(REPO_ROOT)):
    if path not in sys.path:
        sys.path.insert(0, path)

from a2a_kit import (  # noqa: E402  (path setup must come first)
    GatewayClient,
    SkillAgent,
    empty_premium_answer,
    premium_call,
)
from a2a_kit.errors import UpstreamError  # noqa: E402

from data import (  # noqa: E402
    DATASET_ARCHIVE,
    DATASET_WIKIDATA,
    DEFAULT_LIMIT,
    FilmsClient,
)

SKILL_LOOKUP = "film-lookup"
SKILL_FILMMAKER = "filmmaker-films"
SKILL_WATCH = "films-to-watch"
SKILL_ITEM = "archive-item"
SKILL_INDEX = "film-index"
SKILL_HELP = "help"
SKILLS = (SKILL_LOOKUP, SKILL_FILMMAKER, SKILL_WATCH, SKILL_ITEM, SKILL_INDEX, SKILL_HELP)

#: The gateway tool behind the premium skill, and how many decades it walks back.
PREMIUM_TOOL = "film_decade_index"
PREMIUM_DECADES = 6

HELP = (
    "I read Wikidata for film facts and the Internet Archive's feature-films shelf for prints "
    "you can watch. Ask me:\n"
    "  • tell me about the prestige\n"
    "  • who directed inception\n"
    "  • films by fritz lang\n"
    "  • 1940s noir I can watch for free\n"
    "  • what is in scarlet_street_ipod\n"
    "  • which decade has the most noir films (premium — needs a licence key)\n"
    "Wikidata is a community wiki, so a fact it does not carry is reported as not reported. "
    "The Archive's shelf is mixed: many titles are public domain and the collection does not "
    "say which, so I never promise a print is free to reuse."
)

_HELP_RE = re.compile(r"\b(help|what can you do|commands?)\b", re.IGNORECASE)
_FILMMAKER_RE = re.compile(
    r"\b(films? (?:by|from|of)|filmography|directed by|director of|what has .{2,40} directed)\b",
    re.IGNORECASE)
_WHO_DIRECTED_RE = re.compile(r"\bwho directed\b", re.IGNORECASE)
_WATCH_RE = re.compile(
    r"\b(watch|watching|stream|streaming|download|public domain|free)(?:able)?\b", re.IGNORECASE)
_INDEX_RE = re.compile(
    r"\b(which decade|decade index|index of|across decades|by decade|most downloaded|"
    r"most popular|counts? by decade|tally)\b", re.IGNORECASE)
_DECADE_RE = re.compile(r"\b(1[89]\d0|20\d0)s\b")
_YEAR_RE = re.compile(r"\b(1[89]\d{2}|20\d{2})\b")
_QUOTED_RE = re.compile(r"[\"\u201c\u201d'\u2018\u2019]([^\"\u201c\u201d]{2,60})[\"\u201c\u201d'\u2018\u2019]")
_ITEM_RE = re.compile(r"\bwhat is in\b|\bwhat's in\b|\bitem\b", re.IGNORECASE)

_STOPWORDS = frozenset({
    "help", "what", "which", "who", "how", "many", "much", "does", "do", "is", "are", "was",
    "the", "a", "an", "and", "or", "of", "for", "in", "on", "at", "to", "me", "my", "you",
    "show", "find", "search", "list", "give", "get", "tell", "about", "with", "right", "now",
    "today", "please", "film", "films", "movie", "movies", "picture", "pictures", "cinema",
    "watch", "watching", "stream", "streaming", "download", "free", "public", "domain",
    "decade", "decades", "index", "most", "downloaded", "popular", "counts", "tally", "across",
    "by", "from", "directed", "director", "directors", "filmography", "had", "has", "have",
    "made", "make", "can", "could", "should", "would", "will", "i", "we", "there", "hello",
    "hi", "hey", "thanks", "thank", "like", "any", "some", "it", "this", "that", "these",
    "those", "was", "were", "made", "when", "where", "been", "got",
})


def person_from_text(text: str) -> str | None:
    """The filmmaker's name in a question, or None. The asking words drop out, order is kept."""
    words = re.findall(r"[A-Za-z][A-Za-z'.\-]{1,24}", text)
    kept = [word for word in words if word.lower().strip(".") not in _STOPWORDS]
    if not kept:
        return None
    name = " ".join(kept[:3]).strip(" .,-")
    return name if len(name) >= 3 else None


def title_from_text(text: str) -> str | None:
    """The film title in a question: quoted text wins, otherwise the leftover name words.

    A leading "the" is kept ("the prestige", not "prestige"): film titles carry their article
    and Wikidata's search answers better with it than without.
    """
    quoted = [q.strip() for q in _QUOTED_RE.findall(text) if len(q.strip()) >= 2]
    if quoted:
        return quoted[0]
    words = re.findall(r"[A-Za-z][A-Za-z'.\-]{1,24}", text)
    kept = [index for index, word in enumerate(words)
            if word.lower().strip(".") not in _STOPWORDS]
    if not kept:
        return None
    start = kept[0]
    if start > 0 and words[start - 1].lower() == "the":
        start -= 1
    name = " ".join(words[start:start + 3]).strip(" .,-")
    return name if len(name) >= 3 else None


def decade_from_text(text: str) -> int | None:
    """The decade a question names, as its first year: '1940s' -> 1940."""
    match = _DECADE_RE.search(text)
    if match:
        return int(match.group(1))
    match = _YEAR_RE.search(text)
    if match:
        return (int(match.group(1)) // 10) * 10
    return None


def route(text: str) -> tuple[str, dict]:
    """Deterministic intent routing: (skill, params). Pure function, easy to test."""
    if not text.strip() or _HELP_RE.search(text):
        return SKILL_HELP, {}

    decade = decade_from_text(text)
    if _INDEX_RE.search(text):
        return SKILL_INDEX, {"keyword": person_from_text(text), "decade": decade}
    # "who directed inception" asks about a film, not about a person's filmography.
    who = _WHO_DIRECTED_RE.search(text)
    if who:
        return SKILL_LOOKUP, {
            "title": title_from_text(text[:who.start()] + " " + text[who.end():])}
    if _FILMMAKER_RE.search(text):
        return SKILL_FILMMAKER, {"person": person_from_text(_FILMMAKER_RE.sub(" ", text))}
    if _WATCH_RE.search(text):
        return SKILL_WATCH, {"keyword": person_from_text(text), "decade": decade}
    identifier = re.search(r"\b([a-z0-9][a-z0-9._-]{4,60})\b", text)
    if _ITEM_RE.search(text) and identifier:
        return SKILL_ITEM, {"identifier": identifier.group(1)}
    return SKILL_LOOKUP, {"title": title_from_text(text)}


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


def parse(message: dict) -> dict:
    """Incoming message -> {skill, params, explicit}. Never raises.

    "explicit" says whether the caller actually named a skill or asked a question this server
    can route, so the protocol knows a bare title ("the prestige") answers the question it just
    asked rather than starting a fresh lookup.
    """
    text = message_text(message)
    data = message_data(message)
    requested = _first(data, "skill", "skill_id")

    title = _first(data, "title", "film")
    person = _first(data, "person", "director", "filmmaker")
    keyword = _first(data, "keyword", "subject", "q", "query")
    decade = _first(data, "decade")
    identifier = _first(data, "identifier", "item")
    limit = _first(data, "limit", "count")

    routed_skill, routed = route(text)
    asked_for_help = bool(_HELP_RE.search(text))

    if not identifier:
        identifier = routed.get("identifier")
    if not decade:
        decade = routed.get("decade")
    if not title and routed_skill == SKILL_LOOKUP:
        title = routed.get("title")
    if not person and routed_skill == SKILL_FILMMAKER:
        person = routed.get("person")
    if not keyword and routed_skill in (SKILL_WATCH, SKILL_INDEX):
        keyword = routed.get("keyword")

    if requested in SKILLS:
        skill = requested
    elif identifier:
        skill = SKILL_ITEM
    elif title and not text.strip():
        skill = SKILL_LOOKUP
    elif person and not text.strip():
        skill = SKILL_FILMMAKER
    elif (keyword or decade) and not text.strip():
        skill = SKILL_WATCH
    else:
        skill = routed_skill

    params: dict = {}
    if skill == SKILL_LOOKUP:
        params["title"] = title
        params["limit"] = limit
    elif skill == SKILL_FILMMAKER:
        params["person"] = person
    elif skill == SKILL_WATCH:
        params["keyword"] = keyword
        params["decade"] = int(decade) if decade else None
        params["limit"] = limit
    elif skill == SKILL_ITEM:
        params["identifier"] = identifier
    elif skill == SKILL_INDEX:
        params["keyword"] = keyword
    # A bare title ("the prestige") answers the question this server just asked: it names
    # nothing new to route on, so the protocol keeps the pending skill rather than starting over.
    explicit = bool(requested or identifier or title and not text.strip() or person and not text.strip()
                    or keyword and not text.strip() or decade and not text.strip() or asked_for_help
                    or (text.strip() and routed_skill not in (SKILL_LOOKUP, SKILL_HELP)))
    return {"skill": skill, "params": params, "explicit": explicit}


def run_lookup(params: dict, client: FilmsClient) -> dict:
    result = client.film(params["title"], limit=params.get("limit") or DEFAULT_LIMIT)
    rows = result["rows"]
    artifact = {
        "dataset": DATASET_WIKIDATA,
        "skill": SKILL_LOOKUP,
        "summary": f"{rows[0]['title']} ({rows[0].get('year') or 'year not reported'})",
        "title": params["title"],
        "rows": rows,
    }
    lines = [f"Wikidata lists {len(rows)} film(s) for {params['title']!r}:"]
    for row in rows:
        lines.append(f"  • {fact_line(row)}")
        if row.get("genres"):
            lines.append(f"    genres: {', '.join(row['genres'])}")
        if row.get("imdb"):
            lines.append(f"    IMDb: {row['imdb']}")
        if row.get("url"):
            lines.append(f"    {row['url']}")
    lines.append(
        f"\nSource: {DATASET_WIKIDATA} (read live). Wikidata is a community wiki: a fact it "
        "does not carry is left out rather than filled in from somewhere else."
    )
    return {"final_state": "completed", "message": "\n".join(lines), "artifact": artifact,
            "watch": None}


def fact_line(row: dict) -> str:
    """One film as its own facts, in the order a reader wants them."""
    bits = [row["title"] or "untitled"]
    if row.get("year"):
        bits.append(str(row["year"]))
    if row.get("directors"):
        bits.append("dir. " + ", ".join(row["directors"]))
    if row.get("runtime"):
        bits.append(f"{row['runtime']} min")
    return " — ".join(bits)


def run_filmmaker(params: dict, client: FilmsClient) -> dict:
    result = client.filmography(params["person"])
    who, rows = result["person"], result["rows"]
    artifact = {
        "dataset": DATASET_WIKIDATA,
        "skill": SKILL_FILMMAKER,
        "summary": f"{who['name']}: {len(rows)} films, {result['first_year']}–"
                   f"{result['last_year']} (Wikidata)",
        "person": who,
        "rows": rows,
        "first_year": result["first_year"],
        "last_year": result["last_year"],
    }
    lines = [f"Wikidata credits {who['name']} with {len(rows)} films "
             f"({result['first_year']}–{result['last_year']}):"]
    for row in rows[:20]:
        runtime = f" — {row['runtime']} min" if row.get("runtime") else ""
        lines.append(f"  • {row['year'] or 'year not reported'} — {row['title']}{runtime}")
    if len(rows) > 20:
        lines.append(f"  • ... {len(rows) - 20} more in the artifact")
    lines.append(f"\nSource: {DATASET_WIKIDATA} (read live), from {who['url']}.")
    return {"final_state": "completed", "message": "\n".join(lines), "artifact": artifact,
            "watch": None}


def run_watch(params: dict, client: FilmsClient) -> dict:
    decade = params.get("decade")
    keyword = params.get("keyword")
    result = client.archive_films(keyword=keyword, decade=decade,
                                  limit=params.get("limit") or DEFAULT_LIMIT)
    rows = result["rows"]
    what = ", ".join(part for part in (
        f"{decade}s" if decade else None, keyword) if part) or "any decade"
    artifact = {
        "dataset": DATASET_ARCHIVE,
        "skill": SKILL_WATCH,
        "summary": f"{DATASET_ARCHIVE}: {len(rows)} of {result['found']:,} prints ({what})",
        "keyword": keyword,
        "decade": decade,
        "found": result["found"],
        "rows": rows,
    }
    lines = [f"Feature films on the Internet Archive for {what}, most downloaded first:"]
    for row in rows:
        bits = [row["title"] or row["identifier"]]
        if row.get("year"):
            bits.append(str(row["year"]))
        if row.get("creator"):
            bits.append(row["creator"][:60])
        lines.append(f"  • {' — '.join(bits)}")
        if row.get("downloads"):
            lines.append(f"    {row['downloads']:,} downloads; {row['url']}")
        else:
            lines.append(f"    {row['url']}")
    lines.append(
        f"\nSource: {DATASET_ARCHIVE} (read live, {result['found']:,} titles in that query). "
        "The shelf is mixed — many of these are public domain and the collection does not "
        "state which — so treat the print as watchable, not as free to reuse."
    )
    return {"final_state": "completed", "message": "\n".join(lines), "artifact": artifact,
            "watch": None}


def run_item(params: dict, client: FilmsClient) -> dict:
    identifier = params["identifier"]
    item = client.archive_item(identifier)
    artifact = {
        "dataset": DATASET_ARCHIVE,
        "skill": SKILL_ITEM,
        "summary": f"{item['title'] or identifier} ({item['year'] or 'year not reported'}), "
                   f"{len(item['files'])} film file(s)",
        **item,
    }
    lines = [f"{item['title'] or identifier} — Internet Archive item {identifier}"]
    lines.append(f"  • year: {item['year'] or 'not reported'}; "
                 f"creator: {item['creator'] or 'not reported'}; "
                 f"runtime: {item['runtime'] or 'not reported'}")
    if item.get("language"):
        lines.append(f"  • language: {item['language']}")
    if item.get("subjects"):
        lines.append(f"  • subjects: {', '.join(item['subjects'])}")
    for film_file in item["files"]:
        size = f", {film_file['size_mb']} MB" if film_file.get("size_mb") else ""
        lines.append(f"  • file: {film_file['name']} ({film_file['format']}{size})")
    if item.get("description"):
        lines.append(f"  • {item['description']}")
    lines.append(f"\nSource: archive.org/metadata (read live). Watch it at {item['url']}.")
    return {"final_state": "completed", "message": "\n".join(lines), "artifact": artifact,
            "watch": None}


def run_index(params: dict, gateway: GatewayClient) -> dict:
    """Premium: the decade index is computed on the gateway, not here."""
    keyword = params.get("keyword")
    data, refused = premium_call(
        gateway,
        PREMIUM_TOOL,
        {"keyword": keyword, "decades": PREMIUM_DECADES},
        {"dataset": DATASET_ARCHIVE, "skill": SKILL_INDEX, "asked": keyword},
    )
    if refused:
        return refused
    decades = data.get("decades") if isinstance(data, dict) else None
    if not isinstance(decades, list) or not decades:
        return empty_premium_answer(
            "The licence gateway returned no decades for that shelf, so I have nothing to "
            "report. Try a subject word like 'noir' or 'western'.",
            {"dataset": DATASET_ARCHIVE, "skill": SKILL_INDEX, "asked": keyword},
        )
    artifact = {
        "dataset": DATASET_ARCHIVE,
        "skill": SKILL_INDEX,
        "premium": True,
        "summary": f"premium decade index for {keyword or 'the collection'}: "
                   f"{len(decades)} decades, best {data.get('bestDecade', {}).get('decade')}",
        "keyword": keyword,
        "decades": decades,
        "scanned": data.get("scanned"),
        "best_decade": data.get("bestDecade"),
        "most_downloaded": data.get("mostDownloaded"),
    }
    lines = [f"Premium decade index over the Archive's feature films"
             f"{' tagged ' + keyword if keyword else ''} "
             "(computed on the licence gateway):"]
    for entry in decades:
        top = entry.get("mostDownloaded") or {}
        lines.append(
            f"  • {entry.get('decade')}: {entry.get('count')} films, top-ten average "
            f"{int(entry.get('averageDownloads') or 0):,} downloads"
            + (f", most downloaded {top.get('title')}" if top.get("title") else "")
        )
    best, most = data.get("bestDecade") or {}, data.get("mostDownloaded") or {}
    if best:
        lines.append(f"\nMost films: {best.get('decade')} with {best.get('count')} titles.")
    if most:
        lines.append(f"Single most downloaded: {most.get('title')} "
                     f"({int(most.get('downloads') or 0):,} downloads).")
    lines.append(
        f"\nSource: {DATASET_ARCHIVE}, read on the licence gateway ({data.get('scanned', 0):,} "
        "titles counted). Same shelf as the free skills — the gateway adds the decade tally, "
        "and a caller without a key never gets the numbers."
    )
    return {"final_state": "completed", "message": "\n".join(lines), "artifact": artifact,
            "watch": None}


def run_help() -> dict:
    return {
        "final_state": "completed",
        "message": HELP,
        "artifact": {"dataset": [DATASET_WIKIDATA, DATASET_ARCHIVE],
                     "skill": SKILL_HELP, "skills": list(SKILLS)},
        "watch": None,
    }


class FilmsAgent(SkillAgent):
    name = "films"
    card_name = "Films Agent"
    card_description = (
        "Read-only agent over Wikidata's film facts and the Internet Archive's feature-films "
        "shelf: a film's year, directors, runtime, genres and IMDb id, everything Wikidata "
        "credits a filmmaker with, feature films you can actually watch (most downloaded "
        "first, optionally by subject or decade), and one Archive item's metadata and film "
        "files. Wikidata is a community wiki, so a fact it does not carry is reported as not "
        "reported. A decade index over the Archive's shelf runs behind a licence check on the "
        "gateway."
    )
    env_prefix = "FILMS"
    datasets = (DATASET_WIKIDATA, DATASET_ARCHIVE)
    card_skills = [
        {
            "id": SKILL_LOOKUP,
            "name": "Look a film up",
            "description": (
                "Films matching a title, from Wikidata: year, director(s), runtime, genres and "
                "the IMDb id, with the Wikidata item link. A fact Wikidata does not carry is "
                "reported as not reported."
            ),
            "tags": ["films", "wikidata", "facts", "director", "runtime"],
            "examples": [
                "Tell me about the prestige",
                "Who directed inception?",
                '{"skill": "film-lookup", "title": "the prestige"}',
            ],
            "inputModes": ["text/plain", "application/json"],
            "outputModes": ["application/json", "text/plain"],
        },
        {
            "id": SKILL_FILMMAKER,
            "name": "Everything a filmmaker directed",
            "description": (
                "Wikidata's filmography for a director, oldest first, with years and runtimes "
                "and the span the credits cover."
            ),
            "tags": ["films", "wikidata", "director", "filmography"],
            "examples": [
                "Films by fritz lang",
                '{"skill": "filmmaker-films", "person": "christopher nolan"}',
            ],
            "inputModes": ["text/plain", "application/json"],
            "outputModes": ["application/json", "text/plain"],
        },
        {
            "id": SKILL_WATCH,
            "name": "Films you can watch",
            "description": (
                "Feature films on the Internet Archive's feature_films shelf, most downloaded "
                "first, optionally narrowed by a subject word and/or a decade. The shelf is "
                "mixed, so the answer never promises a print is free to reuse."
            ),
            "tags": ["films", "archive", "watch", "public-domain"],
            "examples": [
                "1940s noir I can watch for free",
                '{"skill": "films-to-watch", "keyword": "noir", "decade": 1940}',
            ],
            "inputModes": ["text/plain", "application/json"],
            "outputModes": ["application/json", "text/plain"],
        },
        {
            "id": SKILL_ITEM,
            "name": "One Archive item",
            "description": (
                "One Internet Archive item by identifier: its metadata (title, year, creator, "
                "runtime, language, subjects, description) and the film files it actually holds "
                "with their formats and sizes."
            ),
            "tags": ["films", "archive", "item", "files"],
            "examples": [
                "What is in scarlet_street_1945?",
                '{"skill": "archive-item", "identifier": "scarlet_street_ipod"}',
            ],
            "inputModes": ["text/plain", "application/json"],
            "outputModes": ["application/json", "text/plain"],
        },
        {
            "id": SKILL_INDEX,
            "name": "Decade index over the Archive (premium)",
            "description": (
                "How many feature films the Archive's shelf holds in each of the last six "
                "decades, the top-ten average downloads per decade, and the single most "
                "downloaded title, optionally for a subject word like 'noir'. Premium: it runs "
                "behind a licence check on the gateway, so the numbers only exist for a caller "
                "with a key."
            ),
            "tags": ["films", "archive", "premium", "decades", "index"],
            "examples": [
                "Which decade has the most noir films?",
                '{"skill": "film-index", "keyword": "noir"}',
            ],
            "inputModes": ["text/plain", "application/json"],
            "outputModes": ["application/json", "text/plain"],
        },
        {
            "id": SKILL_HELP,
            "name": "What this agent reads",
            "description": (
                "The two sources this agent reads, the questions it answers, the premium decade "
                "index, and the two things it will not do: invent a fact Wikidata lacks, or "
                "call a print public domain when the collection does not say so."
            ),
            "tags": ["films", "help"],
            "examples": ["What can you do?"],
            "inputModes": ["text/plain"],
            "outputModes": ["text/plain"],
        },
    ]

    def __init__(self, client: FilmsClient | None = None,
                 gateway: GatewayClient | None = None) -> None:
        self.client = client or FilmsClient()
        self.gateway = gateway or GatewayClient()

    def parse(self, message: dict) -> dict:
        return parse(message)

    def missing(self, skill: str, params: dict) -> list[str]:
        if skill == SKILL_LOOKUP and not params.get("title"):
            return ["a film title"]
        if skill == SKILL_FILMMAKER and not params.get("person"):
            return ["a filmmaker's name"]
        if skill == SKILL_ITEM and not params.get("identifier"):
            return ["an Internet Archive identifier"]
        return []

    def input_prompt(self, skill: str, missing: list[str]) -> str:
        if skill == SKILL_FILMMAKER:
            return ("Whose films? Name the director — 'fritz lang', 'christopher nolan' — and I "
                    "will read what Wikidata credits them with.")
        if skill == SKILL_ITEM:
            return "Give me an Internet Archive identifier and I will describe that print."
        return ("Which film should I look up? A title works — 'the prestige', 'inception' — and I "
                "will read Wikidata's item for it.")

    def run(self, request: dict) -> dict:
        if request["missing"]:
            return {
                "final_state": "input-required",
                "message": self.input_prompt(request["skill"], request["missing"]),
                "artifact": None,
                "watch": None,
            }
        skill, params = request["skill"], request["params"]
        try:
            if skill == SKILL_LOOKUP:
                return run_lookup(params, self.client)
            if skill == SKILL_FILMMAKER:
                return run_filmmaker(params, self.client)
            if skill == SKILL_WATCH:
                return run_watch(params, self.client)
            if skill == SKILL_ITEM:
                return run_item(params, self.client)
            if skill == SKILL_INDEX:
                return run_index(params, self.gateway)
        except (UpstreamError, ValueError) as exc:
            return {
                "final_state": "failed",
                "message": f"I could not read the film sources: {exc}",
                "artifact": {"dataset": list(self.datasets), "skill": skill},
                "watch": None,
            }
        return run_help()


__all__ = [
    "FilmsAgent",
    "HELP",
    "PREMIUM_DECADES",
    "PREMIUM_TOOL",
    "SKILLS",
    "SKILL_FILMMAKER",
    "SKILL_HELP",
    "SKILL_INDEX",
    "SKILL_ITEM",
    "SKILL_LOOKUP",
    "SKILL_WATCH",
    "decade_from_text",
    "fact_line",
    "parse",
    "person_from_text",
    "route",
    "run_filmmaker",
    "run_help",
    "run_index",
    "run_item",
    "run_lookup",
    "run_watch",
    "title_from_text",
]
