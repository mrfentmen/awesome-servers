"""Films — cinema facts and watchable prints inside your editor.

No ACP agent could look a film up before this one. It reads Wikidata for what a film is (year,
director, runtime, genre, IMDb id) and the Internet Archive's feature_films shelf for prints you
can actually watch. The fifth skill, a decade index over the Archive's film collection, runs on
the licence gateway.

Deterministic on purpose: routing is rules, the facts are Wikidata's and the prints are the
Archive's, and nothing is invented. Where a source does not carry a fact, the answer says
"not reported" instead of filling the gap.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from acp_kit import STOP_END_TURN, STOP_REFUSAL, AcpAgent, SessionContext, prompt_text

from data import (  # noqa: E402
    DATASET_ARCHIVE,
    DATASET_WIKIDATA,
    FilmsData,
    FilmsError,
)

HELP = (
    "I read Wikidata for film facts and the Internet Archive's feature-films shelf for prints "
    "you can watch. Ask me:\n"
    "  • tell me about the prestige\n"
    "  • who directed inception\n"
    "  • films by fritz lang\n"
    "  • 1940s noir I can watch for free\n"
    "  • what is in scarlet_street_1945\n"
    "  • which decade has the most noir films (not implemented here)\n"
    "Wikidata is a community wiki, so a fact it does not carry is reported as not reported. "
    "The Archive's shelf is mixed: many titles are public domain and the collection does not "
    "say which, so I never promise a print is free to reuse."
)

PERMISSION_KEY = "films-read-public-cinema-sources"

SKILLS = ("film-lookup", "filmmaker-films", "films-to-watch", "archive-item", "film-index", "help")

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
    """The film title in a question: quoted text wins, otherwise the leftover name words."""
    quoted = [q.strip() for q in _QUOTED_RE.findall(text) if len(q.strip()) >= 2]
    if quoted:
        return quoted[0]
    return person_from_text(text)


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
        return "help", {}

    decade = decade_from_text(text)
    if _INDEX_RE.search(text):
        return "film-index", {"keyword": person_from_text(text), "decade": decade}
    # "who directed inception" asks about a film, not about a person's filmography.
    who = _WHO_DIRECTED_RE.search(text)
    if who:
        return "film-lookup", {"title": title_from_text(text[:who.start()] + " " + text[who.end():])}
    if _FILMMAKER_RE.search(text):
        return "filmmaker-films", {"person": person_from_text(_FILMMAKER_RE.sub(" ", text))}
    if _WATCH_RE.search(text):
        return "films-to-watch", {"keyword": person_from_text(text), "decade": decade}
    identifier = re.search(r"\b([a-z0-9][a-z0-9._-]{4,60})\b", text)
    if re.search(r"\bwhat is in\b|\bwhat's in\b|\bitem\b", text, re.IGNORECASE) and identifier:
        return "archive-item", {"identifier": identifier.group(1)}
    return "film-lookup", {"title": title_from_text(text)}


class FilmsAgent(AcpAgent):
    name = "films"
    title = "Films — Wikidata and the Internet Archive"
    version = "1.0.0"

    def __init__(self, connection=None, data: FilmsData | None = None,
                 gateway: object | None = None) -> None:
        super().__init__(connection)
        self.data = data or FilmsData()
        self.gateway = gateway

    # -- ACP ---------------------------------------------------------------

    def new_session(self, session) -> dict:
        session.remember("agent", "Films session opened. " + HELP.split("\n", 1)[0])
        return {}

    def prompt(self, ctx: SessionContext, prompt: list[dict]) -> str:
        text = prompt_text(prompt)
        skill, params = route(text)
        ctx.plan([
            (f"Route the request ({skill})", "high"),
            ("Read Wikidata for the facts, the Internet Archive for prints", "medium"),
            ("Report the source's own answer", "medium"),
        ])

        if skill == "help":
            ctx.stream_text(HELP)
            ctx.message("I read two keyless sources: Wikidata's film items through its query "
                        "service, and the Internet Archive's feature-films shelf. Neither source "
                        "is mine, and I quote what it says.")
            return STOP_END_TURN

        tool = f"call_{skill}"
        ctx.tool_call(tool, f"Read the public cinema sources for {skill}", kind="fetch", name=skill,
                      raw_input={"skill": skill, **params})
        if not ctx.ask_permission(
                tool, "Allow Films to read Wikidata and the Internet Archive's public film data?",
                remember_key=PERMISSION_KEY):
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content("permission denied"))
            ctx.message("I need permission to read the public film sources before I can answer.")
            return STOP_REFUSAL

        ctx.tool_call_update(tool, status="in_progress")
        try:
            answer, artifact = self._run_skill(skill, params)
        except (FilmsError, ValueError) as exc:
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content(str(exc)))
            ctx.message(f"I could not read the film sources: {exc}")
            return STOP_END_TURN
        ctx.check_cancelled()
        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(artifact["summary"]))
        ctx.stream_text(answer)
        return STOP_END_TURN

    def on_cancel(self, session) -> None:
        # Every skill is a couple of HTTP reads; nothing long-running to interrupt.
        return None

    # -- skills ------------------------------------------------------------

    def _run_skill(self, skill: str, params: dict) -> tuple[str, dict]:
        if skill == "film-lookup":
            return self._lookup(params)
        if skill == "filmmaker-films":
            return self._filmmaker(params)
        if skill == "films-to-watch":
            return self._watch(params)
        if skill == "archive-item":
            return self._item(params)
        if skill == "film-index":
            return self._index(params)
        return HELP, {"summary": "help", "dataset": None}

    @staticmethod
    def _fact_line(row: dict) -> str:
        bits = [row["title"] or "untitled"]
        if row.get("year"):
            bits.append(str(row["year"]))
        if row.get("directors"):
            bits.append("dir. " + ", ".join(row["directors"]))
        if row.get("runtime"):
            bits.append(f"{row['runtime']} min")
        return " — ".join(bits)

    def _lookup(self, params: dict) -> tuple[str, dict]:
        title = params.get("title")
        if not title:
            return (
                "Which film should I look up? A title works — 'the prestige', 'inception' — and I "
                "will read Wikidata's item for it.",
                {"summary": "no title given", "known": False},
            )
        result = self.data.film(title)
        rows = result["rows"]
        artifact = {
            "summary": f"{rows[0]['title']} ({rows[0].get('year') or 'year not reported'})",
            "dataset": DATASET_WIKIDATA,
            "title": title,
            "rows": rows,
        }
        lines = [f"Wikidata lists {len(rows)} film(s) for {title!r}:"]
        for row in rows:
            lines.append(f"  • {self._fact_line(row)}")
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
        return "\n".join(lines), artifact

    def _filmmaker(self, params: dict) -> tuple[str, dict]:
        person = params.get("person")
        if not person:
            return (
                "Whose films? Name the director — 'fritz lang', 'christopher nolan' — and I will "
                "read what Wikidata credits them with.",
                {"summary": "no filmmaker given", "known": False},
            )
        result = self.data.filmography(person)
        who, rows = result["person"], result["rows"]
        artifact = {
            "summary": f"{who['name']}: {len(rows)} films, {result['first_year']}–"
                       f"{result['last_year']} (Wikidata)",
            "dataset": DATASET_WIKIDATA,
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
        return "\n".join(lines), artifact

    def _watch(self, params: dict) -> tuple[str, dict]:
        decade = params.get("decade")
        keyword = params.get("keyword")
        result = self.data.archive_films(keyword=keyword, decade=decade)
        rows = result["rows"]
        what = ", ".join(part for part in (
            f"{decade}s" if decade else None, keyword) if part) or "any decade"
        artifact = {
            "summary": f"{DATASET_ARCHIVE}: {len(rows)} of {result['found']:,} prints ({what})",
            "dataset": DATASET_ARCHIVE,
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
        return "\n".join(lines), artifact

    def _item(self, params: dict) -> tuple[str, dict]:
        identifier = params.get("identifier")
        if not identifier:
            return ("Give me an Internet Archive identifier and I will describe that print.",
                    {"summary": "no identifier given", "known": False})
        item = self.data.archive_item(identifier)
        artifact = {
            "summary": f"{item['title'] or identifier} ({item['year'] or 'year not reported'}), "
                       f"{len(item['files'])} film file(s)",
            "dataset": DATASET_ARCHIVE,
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
        return "\n".join(lines), artifact

    def _index(self, params: dict) -> tuple[str, dict]:
        """Stub: the hosted implementation of this skill was removed in the paywall cleanup."""
        message = 'Not yet implemented: index — its hosted implementation was removed.'
        return message, {"summary": "not implemented", "removed": True}


def main(argv=None) -> int:
    import logging

    logging.basicConfig(level="INFO", stream=sys.stderr,
                        format="%(asctime)s %(levelname)s %(name)s %(message)s")
    try:
        FilmsAgent().run()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
