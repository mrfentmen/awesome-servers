"""Wiki — Wikipedia and Wikidata inside your editor.

No ACP agent read an encyclopedia before this one. Ask who someone was, what an entity is
in Wikidata, or what happened on this day, and it answers from the Wikimedia feeds with the
article's own words and a link back.

Deterministic on purpose: routing is rules, the words are the article's, and nothing is
invented. It reports a plan, opens one tool call per lookup, asks permission before its
first read, streams the answer, and closes the tool call with a one-line summary.
"""

from __future__ import annotations

import re
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from acp_kit import (STOP_END_TURN, STOP_REFUSAL, AcpAgent, SessionContext, prompt_text,  # noqa: E402
                     GatewayClient, GatewayError, premium_call, empty_premium_answer)

from data import (  # noqa: E402
    DATASET_ONTHISDAY,
    DATASET_WIKI,
    DATASET_WIKIDATA,
    WikiData,
    WikiError,
    WikiNotFound,
)

HELP = (
    "I read Wikipedia and Wikidata (keyless). Ask me:\n"
    "  • who was Ada Lovelace?\n"
    "  • what is the Wikidata entity for Douglas Adams?\n"
    "  • what happened on this day?\n"
    "  • premium: deep dive for Ada Lovelace from 2026-09-23 to 2026-09-29\n"
    "Answers quote the article summary with a link back, or list Wikidata entities by id."
)

PERMISSION_KEY = "wiki-read-public-wikimedia"

SKILLS = ("wiki-summary", "wiki-entity", "wiki-onthisday", "wiki-deep-dive", "help")

_ONTHISDAY_RE = re.compile(r"\b(on this day|today in history|this day in history|anniversary|"
                           r"what happened (?:on this day|today))\b", re.IGNORECASE)
_ENTITY_RE = re.compile(r"\b(wikidata|entity|q\d{1,8}|item)\b", re.IGNORECASE)
_QID_RE = re.compile(r"\b(Q\d{1,8})\b")
_ABOUT_RE = re.compile(
    r"\b(?:who (?:was|is|are)|what (?:was|is|are)|tell me about|look up|about|who's|what's)\s+"
    r"([A-Za-z0-9][\w'\- .,()]{1,60})", re.IGNORECASE)

#: Words that end the title, never part of it.
_STOP_TAIL_WORDS = frozenset({
    "today", "tonight", "right", "now", "please", "for", "me", "and", "or", "the", "a", "an",
    "in", "on", "at", "from", "with", "about", "history", "wikidata", "wikipedia", "page",
})


def title_from_text(text: str) -> str | None:
    """The article title in a question, or None. Keeps the original case."""
    match = _ABOUT_RE.search(text)
    if not match:
        return None
    words = match.group(1).strip(" .,?!()").split()
    while words and words[-1].lower() in _STOP_TAIL_WORDS:
        words.pop()
    title = " ".join(words)
    return title if len(title) >= 2 else None


def entity_query_from_text(text: str) -> str | None:
    """The entity name in a question, taking the words after for/about/of if present."""
    match = re.search(r"\b(?:for|about|of)\s+([A-Za-z0-9][\w'\- .,()]{1,60})", text, re.IGNORECASE)
    if match:
        words = match.group(1).strip(" .,?!()").split()
        while words and words[-1].lower() in _STOP_TAIL_WORDS:
            words.pop()
        phrase = " ".join(words)
        if len(phrase) >= 2 and re.search(r"[A-Za-z0-9]", phrase):
            return phrase
    return title_from_text(text)


def route(text: str) -> tuple[str, dict]:
    """Deterministic intent routing: (skill, params). Pure function, easy to test."""
    if not text.strip() or re.search(r"\b(help|what can you do|commands?)\b", text, re.IGNORECASE):
        return "help", {}

    deep = re.search(r"\bdeep dive\s+(?:for|on|about)\s+(.+?)(?:\s+from\s+(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2}))?[?.!]*$", text, re.IGNORECASE)
    if deep:
        params = {"title": deep.group(1).strip()}
        if deep.group(2):
            try:
                start = datetime.strptime(deep.group(2), "%Y-%m-%d")
                end = datetime.strptime(deep.group(3), "%Y-%m-%d")
                days = (end - start).days + 1
            except ValueError:
                days = 0
            params.update(days=days, end_date=deep.group(3))
        return "wiki-deep-dive", params

    if _ONTHISDAY_RE.search(text):
        return "wiki-onthisday", {}

    params: dict = {}
    qid = _QID_RE.search(text)
    if qid:
        params["query"] = qid.group(1)
        return "wiki-entity", params
    if _ENTITY_RE.search(text):
        return "wiki-entity", {"query": entity_query_from_text(text) or text.strip(" ?.!")}
    title = title_from_text(text)
    if title:
        params["title"] = title
    return "wiki-summary", params


class WikiAgent(AcpAgent):
    name = "wiki"
    title = "Wiki — Wikipedia and Wikidata"
    version = "1.0.0"

    def __init__(self, connection=None, data: WikiData | None = None,
                 gateway: GatewayClient | None = None) -> None:
        super().__init__(connection)
        self.data = data or WikiData()
        self.gateway = gateway or GatewayClient()

    # -- ACP ---------------------------------------------------------------

    def new_session(self, session) -> dict:
        session.remember("agent", "Wiki session opened. " + HELP.split("\n", 1)[0])
        return {}

    def prompt(self, ctx: SessionContext, prompt: list[dict]) -> str:
        text = prompt_text(prompt)
        skill, params = route(text)
        ctx.plan([
            (f"Route the request ({skill})", "high"),
            ("Resolve the title or entity", "medium"),
            ("Read the Wikimedia feed", "medium"),
        ])

        if skill == "help":
            ctx.stream_text(HELP)
            ctx.message("I read Wikipedia's summary API, Wikidata's entity search and the "
                        "Wikimedia on-this-day feed. Article text is CC BY-SA, so the answers "
                        "carry the link back to the page.")
            return STOP_END_TURN

        tool = f"call_{skill}"
        ctx.tool_call(tool, f"Read Wikimedia feeds for {skill}", kind="fetch", name=skill,
                      raw_input={"skill": skill, **params})
        if not ctx.ask_permission(tool, "Allow Wiki to read the public Wikipedia and Wikidata feeds?",
                                 remember_key=PERMISSION_KEY):
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content("permission denied"))
            ctx.message("I need permission to read the public Wikimedia feeds before I can answer.")
            return STOP_REFUSAL

        ctx.tool_call_update(tool, status="in_progress")
        try:
            answer, artifact = self._run_skill(skill, params)
        except WikiNotFound as exc:
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content(str(exc)))
            ctx.message(f"I found no page for that title: {exc}")
            return STOP_END_TURN
        except GatewayError as exc:
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content(str(exc)))
            ctx.message(f"I could not finish the deep dive on the licence gateway: {exc}")
            return STOP_END_TURN
        except (WikiError, ValueError) as exc:
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content(str(exc)))
            ctx.message(f"I could not read the Wikimedia feed: {exc}")
            return STOP_END_TURN
        ctx.check_cancelled()
        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(artifact["summary"]))
        ctx.stream_text(answer)
        return STOP_END_TURN

    def on_cancel(self, session) -> None:
        # Reads are bounded; there is no background work.
        return None

    # -- skills ------------------------------------------------------------

    def _run_skill(self, skill: str, params: dict) -> tuple[str, dict]:
        if skill == "wiki-deep-dive":
            return self._deep_dive(params)
        if skill == "wiki-summary":
            return self._summary(params)
        if skill == "wiki-entity":
            return self._entity(params)
        if skill == "wiki-onthisday":
            return self._onthisday()
        return HELP, {"summary": "help", "dataset": None}

    def _deep_dive(self, params: dict) -> tuple[str, dict]:
        """Join claims and readership history on the licence gateway."""
        arguments = {"title": params.get("title", "")}
        for key in ("days", "end_date"):
            if key in params:
                arguments[key] = params[key]
        data, refused = premium_call(self.gateway, "wiki_topic_deep_dive", arguments,
                                     {"agent": "wiki", "skill": "wiki-deep-dive"})
        if refused:
            return refused
        if (not isinstance(data, dict) or not isinstance(data.get("extract"), str)
                or not data["extract"] or type(data.get("totalViews")) is not int
                or not isinstance(data.get("claims"), list)
                or not all(isinstance(row, dict) for row in data["claims"])
                or not isinstance(data.get("trend"), dict)):
            return empty_premium_answer("The gateway returned no readable topic deep dive.",
                                        {"agent": "wiki", "skill": "wiki-deep-dive"})
        lines = [f"Premium deep dive: {data.get('title')}", data["extract"],
                 f"Pageviews {data.get('start')} to {data.get('end')}: {data['totalViews']} "
                 f"across {data.get('reportedDays')} reported days; {data.get('missingDays')} missing."]
        trend = data["trend"]
        change = trend.get("changePercent")
        lines.append(f"First/last {trend.get('spanDays')}-day means: {trend.get('firstMean')} / "
                     f"{trend.get('lastMean')}; change: " +
                     (f"{change:.2f}%." if type(change) in (int, float) else "not reported."))
        for row in data["claims"]:
            lines.append(f"Wikidata {row.get('label')} ({row.get('property')}): {row.get('value')} "
                         f"[rank {row.get('rank')}, precision {row.get('precision')}, "
                         f"point in time {row.get('pointInTime')}]")
        if not data["claims"]:
            lines.append("No selected population or date claims reported.")
        lines.extend([str(data.get("articleUrl", "")), str(data.get("note", ""))])
        summary = f"premium deep dive: {data['totalViews']} pageviews"
        return "\n".join(lines), {"summary": summary, "premium": True, "data": data,
                                   "agent": "wiki", "skill": "wiki-deep-dive"}

    def _summary(self, params: dict) -> tuple[str, dict]:
        title = params.get("title")
        if not title:
            return (
                "Which article should I read? Give me a title or a name, like 'Ada Lovelace' "
                "or 'Cuttlefish'.",
                {"summary": "no title given", "dataset": DATASET_WIKI, "known": False},
            )
        page = self.data.page(title)
        artifact = {
            "summary": f"{DATASET_WIKI}: {page['title']} ({page['wikibase_id']})",
            "dataset": DATASET_WIKI,
            "title": page["title"],
            "description": page["description"],
            "wikibase_id": page["wikibase_id"],
            "url": page["url"],
            "extract": page["extract"],
        }
        lines = [f"{page['title']}" + (f" - {page['description']}" if page["description"] else "")]
        lines.append("")
        lines.append((page["extract"] or "").strip())
        if page["url"]:
            lines.append(f"\nRead more: {page['url']}")
        if page["wikibase_id"]:
            lines.append(f"Wikidata entity: {page['wikibase_id']}")
        lines.append(
            f"\nSource: {DATASET_WIKI} (read live). Text is from Wikipedia, CC BY-SA."
        )
        return "\n".join(lines), artifact

    def _entity(self, params: dict) -> tuple[str, dict]:
        query = params.get("query")
        if not query:
            return (
                "Which entity should I look up? Give me a name, or a Wikidata id like Q42.",
                {"summary": "no entity given", "dataset": DATASET_WIKIDATA, "known": False},
            )
        if _QID_RE.fullmatch(query.strip()):
            entity = self._entity_page(query.strip())
            return entity
        result = self.data.entity(query, limit=3)
        artifact = {
            "summary": f"{DATASET_WIKIDATA}: {len(result['rows'])} entities for {result['query']}",
            "dataset": DATASET_WIKIDATA,
            "query": result["query"],
            "rows": result["rows"],
        }
        lines = [f"Wikidata entities for {result['query']!r}:"]
        if not result["rows"]:
            lines.append("  • no entity matched that name.")
        for row in result["rows"]:
            lines.append(f"  • {row['id']} - {row['label']} - {row['description'] or 'no description'}")
        lines.append(
            f"\nSource: {DATASET_WIKIDATA} (read live). Wikidata ids are stable; the labels "
            "and descriptions come in the language the query asked for (English)."
        )
        return "\n".join(lines), artifact

    def _entity_page(self, qid: str) -> tuple[str, dict]:
        entity = self.data.get_entity(qid)
        label = entity["label"] or "unknown label"
        artifact = {
            "summary": f"{DATASET_WIKIDATA}: {entity['id']} is {label}",
            "dataset": DATASET_WIKIDATA,
            "id": entity["id"],
            "label": entity["label"],
            "description": entity["description"],
            "article": entity["article"],
        }
        lines = [f"{entity['id']} is: {label}"]
        if entity["description"]:
            lines.append(f"  • {entity['description']}")
        if entity["article"]:
            page = self.data.page(entity["article"])
            artifact["url"] = page["url"]
            artifact["extract"] = page["extract"]
            lines.append("")
            lines.append((page["extract"] or "").strip())
            if page["url"]:
                lines.append(f"\nRead more: {page['url']}")
        lines.append(
            f"\nSource: {DATASET_WIKIDATA} (wbgetentities, read live), article text from "
            f"{DATASET_WIKI} under CC BY-SA."
        )
        return "\n".join(lines), artifact

    def _onthisday(self) -> tuple[str, dict]:
        today = datetime.now(timezone.utc)
        result = self.data.on_this_day(today.month, today.day)
        artifact = {
            "summary": f"{DATASET_ONTHISDAY}: {len(result['rows'])} selected events for {result['date']}",
            "dataset": DATASET_ONTHISDAY,
            "date": result["date"],
            "rows": result["rows"],
        }
        lines = [f"On this day ({result['date']}) - selected anniversaries from Wikipedia:"]
        if not result["rows"]:
            lines.append("  • the feed had no selected events for today.")
        for row in result["rows"]:
            year = f"{row['year']} - " if row.get("year") else ""
            lines.append(f"  • {year}{row['text']}")
        lines.append(
            f"\nSource: {DATASET_ONTHISDAY} (read live). Wikipedia picks these for the front "
            "page; it is a curated selection, not everything that happened."
        )
        return "\n".join(lines), artifact


def main(argv=None) -> int:
    import logging

    logging.basicConfig(level="INFO", stream=sys.stderr, format="%(asctime)s %(levelname)s %(name)s %(message)s")
    try:
        WikiAgent().run()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
