"""The nyc pack: restaurants, filming and street works from one city's open data.

New York City publishes several agencies' operational data on one Socrata endpoint; this
agent is the first of its kind here - not one dataset, one agent, but a pack: four agencies
of answers (health, media affairs, transportation) under one editor session. Every read is
keyless public data, and each answer names the dataset id it came from.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from acp_kit import STOP_END_TURN, STOP_REFUSAL, AcpAgent, SessionContext, prompt_text  # noqa: E402

from datasets import DATASETS, GRADES, NycData, NycError  # noqa: E402

HELP = (
    "I read NYC Open Data (keyless Socrata). Ask me:\n"
    "  - restaurant grades for 10001\n"
    "  - what is filming near Union Square this week?\n"
    "  - why is my street dug up in Manhattan?\n"
    "  - street work in Brooklyn next 3 days\n"
    "Grades are the inspectors' own (A to C, Z or P when closed); film permits and street"
    " permits are the city's own event and works records."
)

BANK = "nyc-read-socrata"

SKILLS = ("restaurants", "film", "streets", "help")

_DAYS_RE = re.compile(r"\b(?:next\s+)?(\d{1,2})\s+days?\b", re.IGNORECASE)
_WEEK_RE = re.compile(r"\bthis week\b|\bnext week\b", re.IGNORECASE)
_TODAY_RE = re.compile(r"\btoday\b|\bright now\b", re.IGNORECASE)
_REST_WORDS = re.compile(r"\brestaurants?\b|\bgr[ae]de\b|\bdinner\b|\beats?\b|\bclean\b", re.IGNORECASE)
_FILM_WORDS = re.compile(r"\bfilm(ing)?\b|\bshoot(ing)?\b|\bmovie(s)?\b", re.IGNORECASE)
_STREET_WORDS = re.compile(r"\bstreet (work|works)\b|\bdug up\b|\bm-closures?\b|\broadwork\b|\bstreet works\b", re.IGNORECASE)
_ZIP_RE = re.compile(r"\b(\d{5})\b")


def zip_of(text: str) -> str | None:
    match = _ZIP_RE.search(str(text or ""))
    return match.group(1) if match else None


def borough_of(text: str) -> str | None:
    lowered = str(text or "").lower()
    for name in ("Staten Island", "Manhattan", "Brooklyn", "Queens", "Bronx"):
        if name.lower() in lowered:
            return name
    return None


def days_from(text: str, default: int = 7) -> int:
    count = _DAYS_RE.search(str(text or ""))
    if count:
        return max(1, min(30, int(count.group(1))))
    if _WEEK_RE.search(str(text or "")):
        return 7
    if _TODAY_RE.search(str(text or "")):
        return 1
    return default


def route(text: str) -> tuple[str, dict]:
    """Deterministic intent routing: (skill, params). Pure function, easy to test."""
    stripped = str(text or "").strip()
    if not stripped or re.search(r"\b(help|what can you do|commands?)\b", stripped, re.IGNORECASE):
        return "help", {}
    skills = [skill for word, skill in ((_REST_WORDS, "restaurants"),
                                        (_FILM_WORDS, "film"),
                                        (_STREET_WORDS, "streets"))
              if word.search(stripped)]
    if len(skills) != 1:  # ambiguous mixes answer as help, the way the pack reads
        return "help", {}
    skill = skills[0]
    if skill == "restaurants":
        return "restaurants", {"zipcode": zip_of(stripped)}
    return skill, {"borough": borough_of(stripped), "days": days_from(stripped,
                                                                     1 if _TODAY_RE.search(stripped) else 7)}


def render_restaurants(reading: dict) -> str:
    tally = reading["tally"]
    lines = [f"NYC DOHMH grades for ZIP {reading['zipcode']} since {reading['since']} "
             f"({reading['read']} checked inspection row(s)):"]
    for grade in ("A", "B", "C", "Z", "P", "N"):
        if tally.get(grade):
            lines.append(f"  - {GRADES.get(grade, grade):<28} {tally[grade]}")
    if reading["critical"]:
        lines.append("  critical finding(s) worth reading first:")
        for row in reading["critical"]:
            wording = (row.get("violation_description") or "")[:70]
            lines.append(f"    - {row.get('dba', 'unknown')}: {wording}")
    if reading["read"] == 0:
        lines.append("  no recently inspected restaurants answered for this ZIP - a real "
                     "quiet week, or a ZIP the health department lists differently.")
    return "\n".join(lines)


def render_film(reading: dict) -> str:
    lines = [f"NYC film permits opening within {reading['window_days']} day(s): "
             f"{reading['in_window']} in window (of {reading['read']} row(s) read)"]
    for row in reading["permits"]:
        where = row.get("borough") or "unlisted borough"
        lines.append(f"  - {row.get('category') or 'film'} at {where}: "
                     f"{row.get('subcategoryname') or row.get('eventtype') or ''}".rstrip(" :"))
    if reading["in_window"] == 0:
        lines.append("  nothing opens in that window.")
    return "\n".join(lines)


def render_streets(reading: dict) -> str:
    kinds = ", ".join(reading["permit_types"]) or "no recorded permit types"
    lines = [f"NYC street permits active over the next {reading['window_days']} day(s) "
             f"in {reading['borough']}: {reading['read']} row(s). Types: {kinds}"]
    for row in reading["permits"]:
        on = (row.get("onstreetname") or "").strip()
        frm = (row.get("fromstreetname") or "").strip()
        lines.append(f"  - {row.get('permittypedesc') or 'permit'}: {on}"
                     + (f" from {frm}" if frm else ""))
    if reading["read"] == 0:
        lines.append("  none active in this window.")
    return "\n".join(lines)


class NycAgent(AcpAgent):
    name = "nyc"
    title = "NYC pack - restaurants, filming and street works from one city's data"
    version = "1.0.0"

    def __init__(self, connection=None, data: NycData | None = None) -> None:
        super().__init__(connection)
        self.data = data or NycData()

    # -- ACP ---------------------------------------------------------------

    def new_session(self, session) -> dict:
        session.remember("agent", "NYC pack session opened. " + HELP.splitlines()[0])
        return {}

    def prompt(self, ctx: SessionContext, prompt: list[dict]) -> str:
        text = prompt_text(prompt)
        skill, params = route(text)
        ctx.plan([
            (f"Route the request ({skill})", "high"),
            ("Read the dataset(s) over Socrata", "medium"),
            ("Report what the city recorded, honestly", "medium"),
        ])

        if skill == "help":
            ctx.stream_text(HELP)
            ctx.message("NYC Open Data is keyless, so what you see is exactly what the city "
                        "publishes - including the recently absent grades.")
            return STOP_END_TURN

        if skill == "restaurants" and not params.get("zipcode"):
            ctx.message("Which ZIP? Restaurant grades are asked per ZIP - for example "
                        "\"restaurant grades for 10001\".")
            return STOP_END_TURN

        tool = f"call_{skill}"
        dataset = DATASETS.get(skill, ("?", "?"))
        title = {"restaurants": f"Read DOHMH inspections for {params.get('zipcode')}",
                 "film": "Read film permits for the window",
                 "streets": f"Read street permits for {params.get('borough', 'the city')}"}[skill]
        ctx.tool_call(tool, title, kind="fetch", name=skill, raw_input=dict(params))
        if not ctx.ask_permission(tool, " Allow NYC to read the public dataset "
                                         f"{dataset[1]} ({dataset[0]})?",
                                  remember_key=BANK):
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content("permission denied"))
            ctx.message("I need permission to read NYC Open Data for you.")
            return STOP_REFUSAL
        ctx.tool_call_update(tool, status="in_progress")

        try:
            if skill == "restaurants":
                reading = self.data.restaurants(params["zipcode"])
                body = render_restaurants(reading)
                summary = f"{reading['read']} row(s) for ZIP {reading['zipcode']}"
            elif skill == "film":
                reading = self.data.film(params.get("days", 7))
                body = render_film(reading)
                summary = f"{reading['in_window']} permit(s) in the window"
            else:
                reading = self.data.streetworks(params.get("borough"), params.get("days", 7))
                body = render_streets(reading)
                summary = f"{reading['read']} permit row(s), {len(reading['permit_types'])} type(s)"
        except (NycError, ValueError) as exc:
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content(str(exc)))
            ctx.message(f"I could not read that: {exc}")
            return STOP_END_TURN

        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(summary))
        ctx.stream_text(body + "\n")
        ctx.message(f"\nSource: NYC Open Data, {dataset[1]} ({dataset[0]}), read live. "
                    "Counts are the dataset's own, not a claim about every business or street.")
        return STOP_END_TURN

    def on_cancel(self, session) -> None:
        return None  # one read, one answer


def main(argv=None) -> int:
    import logging
    logging.basicConfig(level="INFO", stream=sys.stderr,
                        format="%(asctime)s %(levelname)s %(name)s %(message)s")
    try:
        NycAgent().run()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
