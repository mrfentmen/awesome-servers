"""Comics - the latest xkcd, one comic by number, or a short run of them.

xkcd publishes every comic's metadata, image and alt text as keyless JSON, and nobody asks it
from an editor. "show me the latest xkcd" is one request, because xkcd's `info.0.json` is the
newest comic rather than comic zero. "tell me about xkcd 3000" gets the joke in words, which
is the alt text. What xkcd keeps coming back to across a run of comics is a separate skill.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from acp_kit import STOP_END_TURN, STOP_REFUSAL, AcpAgent, SessionContext, prompt_text

from data import (DATASET, ComicsData, ComicsError, ComicsNotFound,  # noqa: E402
                  count_from_text, number_from_text, range_from_text)

HELP = (
    "I read xkcd's own comic API (keyless) - every comic's number, date, image and alt text.\n"
    "Ask me:\n"
    "  - show me the latest xkcd\n"
    "  - tell me about xkcd 3000\n"
    "  - show me the last 5 comics\n"
    "  - what is comic 2998-3002 about?\n"
    "The alt text is the joke in words, and it is published for every comic. xkcd also\n"
    "published transcripts for the early run only - comic 1600 has one and 1650 does not - so\n"
    "for a recent comic there is no transcript and I do not invent one. Mining the recurring\n"
    "words out of a run of comics is a separate skill."
)

PERMISSION_KEY = "comics-read-xkcd-api"

SKILLS = ("comics-latest", "comics-by-number", "comics-run", "comics-recurring", "help")

_LATEST_WORDS = re.compile(
    r"\b(latest|newest|new one|today'?s|today|just posted|last post|most recent)\b",
    re.IGNORECASE,
)
_RUN_WORDS = re.compile(
    r"\b(last|past|recent|previous|before|run|range|stretch|comics?)\b", re.IGNORECASE,
)
_OTHER_WORDS = re.compile(
    r"\b(weather|recipe|episode|season|water table|quake|flight|stock|package|song|album)\b",
    re.IGNORECASE,
)
#: The premium question, and the only one. The free skills read one comic or list a run's
#: numbers and titles; this counts the words that come back across the run. It needs the
#: words, so "what is comic 3000 about" stays free.
_RECURRING_WORDS = re.compile(
    r"\b(keeps? (?:coming back|coming up|repeating)|recurring|recurs|repeats?|over and over|"
    r"themes?|motifs?|running gags?|words? .*(?:recur|repeat|come up)|"
    r"what .*keep .*(?:on|about)|common (?:words?|terms?)|favorite words?|pet words?)\b",
    re.IGNORECASE,
)


def route(text: str) -> tuple[str, dict]:
    """Deterministic intent routing: (skill, params). Pure function, easy to test."""
    stripped = str(text or "").strip()
    if not stripped or re.search(r"\b(help|what can you do|commands?)\b", stripped, re.IGNORECASE):
        return "help", {}
    if _OTHER_WORDS.search(stripped):
        return "help", {}
    # Checked before the free routes, and narrow on purpose: a recurring-words question over
    # a range. "tell me about xkcd 3000" carries none of these words and stays free.
    if _RECURRING_WORDS.search(stripped):
        #: A wider run than the free skill reads: the gateway caps the read itself and
        #: reports the cap, so a 20-comic ask is not refused before it gets there.
        span = range_from_text(stripped, max_span=60)
        if span:
            return "comics-recurring", {"from": span[0], "to": span[1]}
        if range_from_text(stripped, max_span=60) or number_from_text(stripped):
            #: One comic cannot have a recurring word, so a single number is not a run. The
            #: window would have to be invented, and the help text says how to ask instead.
            return "help", {}
        return "help", {}
    if _LATEST_WORDS.search(stripped):
        return "comics-latest", {}
    span = range_from_text(stripped)
    if span:
        return "comics-run", {"from": span[0], "to": span[1]}
    number = number_from_text(stripped)
    if number:
        return "comics-by-number", {"num": number}
    count = count_from_text(stripped)
    if count:
        return "comics-run", {"count": count}
    if re.search(r"\d{3,}", stripped):
        #: A number that is not a comic number must not quietly become "the last 5".
        return "help", {}
    if _RUN_WORDS.search(stripped):
        return "comics-run", {"count": 5}
    return "help", {}


def render_comic(comic: dict, head: str = "xkcd") -> str:
    """One comic: what it is, when it ran, and the joke in words."""
    lines = [f"{head} {comic['num']} - {comic['title']}"]
    lines.append(f"  published: {comic['date']}")
    if comic["alt"]:
        lines.append(f"  alt text: {comic['alt']}")
    if comic["transcript"]:
        first = comic["transcript"].strip().splitlines()[0]
        lines.append(f"  transcript opens: {first}")
    else:
        lines.append("  transcript: xkcd publishes none for this comic")
    if comic["image"]:
        lines.append(f"  image: {comic['image']}")
    lines.append(f"  {comic['link']}")
    return "\n".join(lines)


def render_run(comics: list[dict]) -> str:
    """A run of comics: the numbers, the titles, the dates and the alt text."""
    lines = [f"{len(comics)} comic(s), {comics[0]['num']} to {comics[-1]['num']}:"]
    for comic in comics:
        lines.append(f"  {comic['num']} {comic['title']} ({comic['date']})")
        if comic["alt"]:
            lines.append(f"      {comic['alt']}")
    return "\n".join(lines)


def _num(value) -> str:
    """A number for a line of text, or the honest 'not reported'."""
    if value is None or value == "":
        return "not reported"
    try:
        return f"{float(value):g}"
    except (TypeError, ValueError):
        return str(value)


def render_recurring(data: dict) -> str:
    """The words that come back across a run, and the comics each one shows up in."""
    lines = [f"xkcd {data.get('from', 'not reported')}-{data.get('to', 'not reported')}"
             " - words that come back"]
    span = data.get('requestedRange') or {}
    lines.append(f"  read {_num(data.get('comicsRead'))} comic(s)"
                 + (f" of the {span.get('count')} asked for"
                    if data.get('truncated') else ""))
    lines.append(f"  counted from the {data.get('countedFrom', 'not reported')}: "
                 f"{_num(data.get('comicsWithTranscript'))} transcript(s), "
                 f"{_num(data.get('comicsWithAltTextOnly'))} alt text only")
    terms = data.get("terms") or []
    if not terms:
        lines.append("  no word came back in more than one of these comics")
    for term in terms:
        lines.append(f"  {term['word']} - {term['comics']} comic(s): "
                     + ", ".join(str(num) for num in term["numbers"]))
    lines.append(f"  source: {data.get('source', 'not reported')}")
    return "\n".join(lines)


class ComicsAgent(AcpAgent):
    name = "comics"
    title = "Comics - the latest xkcd, any comic by number, and what xkcd keeps repeating"
    version = "1.0.0"

    def __init__(self, connection=None, data: ComicsData | None = None, gateway=None) -> None:
        super().__init__(connection)
        self.data = data or ComicsData()
        self.gateway = gateway

    # -- ACP ---------------------------------------------------------------

    def new_session(self, session) -> dict:
        session.remember("agent", "Comics session opened. " + HELP.splitlines()[0])
        return {}

    def prompt(self, ctx: SessionContext, prompt: list[dict]) -> str:
        text = prompt_text(prompt)
        skill, params = route(text)
        ctx.plan([
            (f"Route the request ({skill})", "high"),
            ("Read xkcd's comic API", "medium"),
            ("Report the comic, its date and its alt text", "medium"),
        ])

        if skill == "help":
            ctx.stream_text(HELP)
            ctx.message("xkcd's info.0.json is the newest comic, not comic zero.")
            return STOP_END_TURN

        tool = f"call_{skill.replace('-', '_')}"
        ctx.tool_call(tool, "Read xkcd's comic API", kind="fetch", name=skill,
                      raw_input=dict(params))
        if not ctx.ask_permission(tool, "Allow Comics to read xkcd's public comic API?",
                                  remember_key=PERMISSION_KEY):
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content("permission denied"))
            ctx.message("I need permission to read xkcd's API first.")
            return STOP_REFUSAL
        ctx.tool_call_update(tool, status="in_progress")

        try:
            if skill == "comics-recurring":
                return self._run_skill(ctx, params, tool)
            if skill == "comics-latest":
                comic = self.data.latest()
                body = render_comic(comic, head="xkcd latest")
                summary = f"xkcd {comic['num']} {comic['title']} ({comic['date']})"
            elif skill == "comics-by-number":
                comic = self.data.comic(params["num"])
                body = render_comic(comic)
                summary = f"xkcd {comic['num']} {comic['title']} ({comic['date']})"
            else:
                if params.get("count"):
                    last = self.data.latest()["num"]
                    first = max(1, last - int(params["count"]) + 1)
                else:
                    first, last = int(params["from"]), int(params["to"])
                comics = self.data.run(first, last)
                body = render_run(comics)
                summary = f"xkcd {comics[0]['num']}-{comics[-1]['num']}: {len(comics)} comic(s)"
        except (ComicsError, ValueError) as exc:
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content(str(exc)))
            ctx.message(f"I could not read xkcd's API: {exc}")
            return STOP_END_TURN

        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(summary))
        ctx.stream_text(body + "\n")
        ctx.message(f"\nSource: {DATASET}, read live. The alt text is xkcd's own description of "
                    "the joke and is published for every comic; a transcript only exists for the "
                    "early run, so a recent comic has none.")
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
        ComicsAgent().run()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
