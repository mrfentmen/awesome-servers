"""APOD - NASA's picture of the day, sent as a picture.

`chart` proved an ACP agent can answer with an image block; this is the second one, and it is the
first agent in any editor that answers "show me NASA's picture of the day" with the picture
attached rather than a link to it. The bytes are fetched from apod.nasa.gov, sent as an
`image` content block, and the day's own title, credit and NASA's explanation go with it.

Three days out of the week NASA publishes a video instead of a picture. Those answers send the
thumbnail NASA publishes with a line saying that is what it is, and never claim a video frame
was the day's photograph.
"""

from __future__ import annotations

import datetime
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from acp_kit import (  # noqa: E402
    STOP_END_TURN,
    STOP_REFUSAL,
    AcpAgent,
    GatewayClient,
    GatewayError,
    SessionContext,
    empty_premium_answer,
    premium_call,
    prompt_text,
)

from data import (  # noqa: E402
    DATASET,
    DEMO_KEY,
    MAX_IMAGE_BYTES,
    MAX_RANDOM,
    ApodData,
    ApodError,
    rate_line,
)

HELP = (
    "I read NASA's Astronomy Picture of the Day (API key: DEMO_KEY unless you set NASA_API_KEY) "
    "and I send the picture, not a link. Ask me:\n"
    "  - show me NASA's picture of the day\n"
    "  - what is today's astronomy picture?\n"
    "  - the apod for 1996-01-01\n"
    "  - NASA's picture for July 20 1996\n"
    "  - show me 3 random space pictures\n"
    "Each answer carries the day's title, its credit line and NASA's own explanation. Days NASA "
    "published as a video are sent as their thumbnail, and the answer says so. The archive starts "
    "on 1995-06-16, so a day before that has no picture to show.\n"
    "Ask me for a span of days (premium, digested on the licence gateway) to browse a whole run of "
    "them at once:\n"
    "  - what did APOD publish around the Webb launch?\n"
    "  - every APOD between 2022-07-12 and 2022-07-16\n"
    "  - show me July 2021 in APOD"
)

PERMISSION_KEY = "apod-read-nasa"

SKILLS = ("apod-picture", "apod-random", "apod-archive", "apod-nodate", "apod-help")

#: One image per answer, so a random set does not arrive as ten megabytes.
ATTACH_LIMIT = 1

_RANDOM = re.compile(r"\b(random|any|some|surprise|shuffle|pick)\b", re.IGNORECASE)
_COUNT = re.compile(r"\b(\d{1,2})\b")
_TODAY = re.compile(r"\b(today|tonight|current|latest|now)\b", re.IGNORECASE)
_DATE_ISO = re.compile(r"\b(\d{4})-(\d{2})-(\d{2})\b")
_DATE_SLASH = re.compile(r"\b(\d{4})/(\d{1,2})/(\d{1,2})\b")
_MONTHS = {name.lower(): number for number, name in enumerate(
    ("January", "February", "March", "April", "May", "June", "July", "August", "September",
     "October", "November", "December"), start=1)}
_MONTH_DAY_YEAR = re.compile(
    r"\b(" + "|".join(_MONTHS) + r")\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b", re.IGNORECASE)
_DAY_MONTH_YEAR = re.compile(
    r"\b(\d{1,2})(?:st|nd|rd|th)?\s+(" + "|".join(_MONTHS) + r"),?\s+(\d{4})\b", re.IGNORECASE)
_YESTERDAY = re.compile(r"\byesterday\b", re.IGNORECASE)
_MONTH_ONLY = re.compile(r"\b(" + "|".join(_MONTHS) + r")\s+(\d{4})\b", re.IGNORECASE)
_PICTURE = re.compile(r"\b(picture|photo|image|apod|astronomy picture|space picture)\b",
                      re.IGNORECASE)

#: APOD started on 1995-06-16, and asking for a day before that is a question with no answer.
FIRST_DAY = datetime.date(1995, 6, 16)


def date_or_none(year: int, month: int, day: int) -> datetime.date | None:
    try:
        return datetime.date(year, month, day)
    except ValueError:
        return None


def named_date(text: str, today: datetime.date | None = None) -> datetime.date | None:
    """The day a question names, whatever it is - including days APOD cannot answer for."""
    work = str(text or "").strip()
    for pattern in (_DATE_ISO, _DATE_SLASH):
        found = pattern.search(work)
        if found:
            year, month, day = (int(bit) for bit in found.groups())
            return date_or_none(year, month, day)
    found = _MONTH_DAY_YEAR.search(work)
    if found:
        # "July 20 1969": the month is named first, the day is second.
        return date_or_none(int(found.group(3)), _MONTHS.get(found.group(1).lower(), 0),
                            int(found.group(2)))
    found = _DAY_MONTH_YEAR.search(work)
    if found:
        # "20 July 1969": the day comes first, the month is second.
        return date_or_none(int(found.group(3)), _MONTHS.get(found.group(2).lower(), 0),
                            int(found.group(1)))
    if _YESTERDAY.search(work):
        return (today or datetime.date.today()) - datetime.timedelta(days=1)
    return None


def date_from_text(text: str, today: datetime.date | None = None) -> str | None:
    """A day APOD can answer for, or None. A day it cannot is reported, never swapped."""
    when = named_date(text, today)
    if when is None:
        return None
    return when.isoformat() if not date_problem(text, today) else None


def date_problem(text: str, today: datetime.date | None = None) -> str | None:
    """Why the day a question names cannot be shown, or None when it can."""
    work = str(text or "").strip()
    when = named_date(work, today)
    if when is None:
        for pattern in (_DATE_ISO, _DATE_SLASH, _MONTH_DAY_YEAR, _DAY_MONTH_YEAR):
            found = pattern.search(work)
            if found:
                # A date was named and does not exist as a date - 'February 30' is not a day,
                # and answering with some other day's picture would be a swap, not an answer.
                return (f"{found.group(0).strip()} is not a day on the calendar, and "
                        f"{found.group(0).strip()} has no picture")
        return None
    if when > (today or datetime.date.today()):
        return f"{when.isoformat()} is in the future"
    if when < FIRST_DAY:
        return f"APOD's first picture is {FIRST_DAY.isoformat()}, so there is no picture for " \
               f"{when.isoformat()}"
    return None


def count_from_text(text: str) -> int:
    """How many random pictures were asked for, within what this agent will send."""
    wanted = _COUNT.search(str(text or ""))
    if not wanted:
        return 1
    return max(1, min(int(wanted.group(1)), MAX_RANDOM))


def month_year_range(text: str) -> tuple[str, str] | None:
    """A whole month named in the text, as (first day, last day), or None.

    "July 2021" is a span, not a day, so it is the one phrasing that means a range
    without two dates in it.
    """
    found = _MONTH_ONLY.search(text)
    if not found:
        return None
    month = _MONTHS.get(found.group(1).lower())
    year = int(found.group(2))
    try:
        first = datetime.date(year, month, 1)
    except ValueError:
        return None
    following = datetime.date(year + (month == 12), 1 if month == 12 else month + 1, 1)
    return first.isoformat(), (following - datetime.timedelta(days=1)).isoformat()


def range_from_text(text: str) -> tuple[str, str] | None:
    """A span of days, or None. Two dates, or one month, is a range; one date is a day."""
    days = set()
    for pattern in (_DATE_ISO, _DATE_SLASH):
        for found in pattern.finditer(text):
            days.add(f"{found.group(1)}-{int(found.group(2)):02d}-{int(found.group(3)):02d}")
    for pattern in (_MONTH_DAY_YEAR, _DAY_MONTH_YEAR):
        for found in pattern.finditer(text):
            when = named_date(found.group(0))
            if when:
                days.add(when)
    if len(days) >= 2:
        return min(days), max(days)
    if days:
        return None
    return month_year_range(text)


def route(text: str) -> tuple[str, dict]:
    """Deterministic intent routing: (skill, params). Pure function, easy to test."""
    stripped = str(text or "").strip()
    if not stripped or re.search(r"\b(help|what can you do|commands?)\b", stripped, re.IGNORECASE):
        return "apod-help", {}
    params: dict = {}
    if _RANDOM.search(stripped):
        params["count"] = count_from_text(stripped)
        return "apod-random", params
    # A span of days is the one thing the free skills cannot answer: apod-picture sends
    # exactly one picture. Checked after `random` so an ambiguous "3 random pictures from
    # July 2021" stays with the free skill.
    span = range_from_text(stripped)
    if span:
        return "apod-archive", {"start_date": span[0], "end_date": span[1]}

    problem = date_problem(stripped)
    if problem:
        return "apod-nodate", {"why": problem}
    date = date_from_text(stripped)
    if date:
        params["date"] = date
        return "apod-picture", params
    if _TODAY.search(stripped) or _PICTURE.search(stripped):
        return "apod-picture", params
    return "apod-help", {}


def render(entry: dict) -> str:
    """The day's card: what it is, who gets the credit, and NASA's text whole."""
    lines = [f"{entry['date']} - {entry['title']}"]
    lines.append(f"  - media: {entry['media_type']}")
    lines.append(f"  - {entry['credit']}")
    if entry["media_type"] != "image":
        lines.append(f"  - NASA published this day as a {entry['media_type']}: {entry['url']}")
    lines.append(f"  - APOD's own page for this day: {entry['page']}")
    if entry["hdurl"] and entry["hdurl"] != entry["url"]:
        lines.append(f"  - full resolution: {entry['hdurl']}")
    return "\n".join(lines)


class ApodAgent(AcpAgent):
    name = "apod"
    title = "APOD - NASA's picture of the day, sent as a picture"
    version = "1.0.0"

    def __init__(self, connection=None, data: ApodData | None = None,
                 gateway: GatewayClient | None = None) -> None:
        super().__init__(connection)
        self.data = data or ApodData()
        self.gateway = gateway or GatewayClient()

    # -- ACP ---------------------------------------------------------------

    def new_session(self, session) -> dict:
        session.remember("agent", "APOD session opened. " + HELP.splitlines()[0])
        return {}

    def prompt(self, ctx: SessionContext, prompt: list[dict]) -> str:
        text = prompt_text(prompt)
        skill, params = route(text)
        ctx.plan([
            (f"Route the request ({skill})", "high"),
            ("Read NASA's picture of the day", "medium"),
            ("Send the picture itself, then NASA's words with the credit", "medium"),
        ])

        if skill == "apod-help":
            ctx.stream_text(HELP)
            ctx.message("\n" + rate_line() + ".")
            return STOP_END_TURN

        if skill == "apod-archive":
            return self._run_archive(ctx, params)

        if skill == "apod-nodate":
            # A day with no picture is answered with the reason, never with a different day's
            # picture dressed up as the one that was asked for.
            ctx.stream_text(f"I cannot show that one: {params['why']}.\n"
                            f"  - the whole archive is at "
                            f"https://apod.nasa.gov/apod/archivepix.html\n"
                            f"  - a day I can show looks like 'the apod for 1996-01-01'")
            return STOP_END_TURN

        tool = f"call_{skill.replace('-', '_')}"
        asking = (f"{params['count']} random space pictures" if skill == "apod-random"
                  else f"the picture for {params.get('date') or 'today'}")
        ctx.tool_call(tool, f"Read NASA for {asking}", kind="fetch", name=skill,
                      raw_input=dict(params))
        if not ctx.ask_permission(tool, "Allow APOD to read and send NASA's picture?",
                                  remember_key=PERMISSION_KEY):
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content("permission denied"))
            ctx.message("I need permission to read NASA's picture of the day first.")
            return STOP_REFUSAL
        ctx.tool_call_update(tool, status="in_progress")

        try:
            if skill == "apod-random":
                entries = self.data.random(count=params.get("count") or 1)
            else:
                entries = [self.data.day(date=params.get("date"))]
        except ApodError as exc:
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content(str(exc)))
            ctx.message(f"I could not read that: {exc}")
            return STOP_END_TURN

        sent, linked, sizes = 0, [], []
        for entry in entries:
            ctx.stream_text(render(entry) + "\n")
            attached = False
            if sent < ATTACH_LIMIT:
                try:
                    payload = self.data.attachable(entry)
                except ApodError as exc:
                    linked.append(f"{entry['date']}: {exc}")
                    payload = None
                if payload:
                    blob, mime = payload
                    ctx.image(blob, mime)
                    sizes.append(f"{len(blob) / 1000:.0f} KB {mime.split('/')[-1]}")
                    attached = True
                    sent += 1
            if not attached:
                linked.append(f"{entry['date']}: {entry['image_url'] or entry['url']}")
            if entry["explanation"]:
                ctx.message(f"\nNASA's explanation for {entry['date']}:\n{entry['explanation']}")
            if entry["media_type"] != "image" and attached:
                ctx.message(f"\nThat picture is {entry['image_kind']}: NASA published a "
                            f"{entry['media_type']} for {entry['date']}, and the link above is the "
                            f"video itself.")

        if sent:
            done = f"sent {sizes[0]}"
        elif linked:
            done = "linked instead of attached"
        else:
            done = "nothing to attach"
        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(done))
        if linked:
            ctx.message("\nNot attached (a link is above or here):\n  - "
                        + "\n  - ".join(linked))
        note = (f"\nNothing left this machine except the request to NASA. Images over "
                f"{MAX_IMAGE_BYTES / 1_000_000:.0f} MB are linked rather than attached, and the "
                f"text above is NASA's own, printed whole.")
        if self.data.key == DEMO_KEY:
            note += f" {rate_line()}."
        ctx.message(note)
        return STOP_END_TURN

    # -- premium: a span of days -------------------------------------------

    def _run_archive(self, ctx: SessionContext, params: dict) -> str:
        """Browse a run of days at once.

        The digest is built on the licence gateway, so the list cannot be reproduced from
        this repository. A missing or rejected key is a finished answer, not a failure.
        """
        start, end = params["start_date"], params["end_date"]
        tool = "apod_archive"
        ctx.tool_call(tool, f"Digest APOD from {start} to {end}", kind="fetch",
                      name="apod-archive", raw_input=dict(params))
        if not ctx.ask_permission(tool, "Allow APOD to digest that range on the licence gateway?",
                                  remember_key=PERMISSION_KEY):
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content("permission denied"))
            ctx.message("I need permission to ask the licence gateway for that range first.")
            return STOP_REFUSAL
        ctx.tool_call_update(tool, status="in_progress")

        try:
            answer, artifact = self._archive(start, end)
        except GatewayError as exc:
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content(str(exc)))
            ctx.message(f"I could not finish that on the licence gateway: {exc}")
            return STOP_END_TURN
        ctx.check_cancelled()
        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(artifact["summary"]))
        ctx.stream_text(answer)
        return STOP_END_TURN

    def _archive(self, start: str, end: str) -> tuple[str, dict]:
        data, refused = premium_call(
            self.gateway,
            "apod_archive_digest",
            {"start_date": start, "end_date": end},
            {"agent": "apod", "skill": "apod-archive"},
        )
        if refused:
            return refused
        days = data.get("days") if isinstance(data, dict) else None
        if not isinstance(days, list) or not days:
            return empty_premium_answer(
                f"The licence gateway sent back no days for {start} to {end}, so I have nothing "
                "to list. The archive starts on 1995-06-16.",
                {"agent": "apod", "skill": "apod-archive", "dataset": DATASET},
            )

        def shown(value, fallback: str = "not reported") -> str:
            return fallback if value is None or value == "" else str(value)

        kinds = ", ".join(f"{count} {kind}" for kind, count in sorted((data.get("byMediaType") or {}).items()))
        artifact = {
            "summary": (f"premium digest {start} to {end}: {data.get('daysPublished')} day(s) published, "
                        f"{len(days)} listed, {kinds or 'no media types'}"),
            "dataset": DATASET,
            "premium": True,
            "start_date": start,
            "end_date": end,
            "days_published": data.get("daysPublished"),
            "days_returned": len(days),
            "truncated": data.get("truncated"),
            "by_media_type": data.get("byMediaType"),
            "days": days,
        }
        lines = [f"Premium digest of APOD from {start} to {end}: "
                 f"{shown(data.get('daysPublished'), '0')} day(s) published, "
                 f"{len(days)} listed ({kinds or 'no media types'})."]
        for day in days[:30]:
            lines.append(f"  - {shown(day.get('date'))}: {shown(day.get('title'))} "
                         f"[{shown(day.get('media_type'))}]")
            credit = day.get("credit")
            if credit:
                lines.append(f"      {credit}")
            if day.get("summary"):
                lines.append(f"      {day['summary']}")
        if len(days) > 30:
            lines.append(f"  - ... {len(days) - 30} more day(s) in the artifact")
        if data.get("truncated"):
            lines.append("The range was longer than one digest, so this is a part of it - "
                         "ask me for the rest.")
        lines.append(
            f"\nSource: {DATASET}, digested on the licence gateway. This is NASA's index of the "
            "run, not the pictures: ask me for any one of these days and I will send that image."
        )
        return "\n".join(lines), artifact

    def on_cancel(self, session) -> None:
        return None  # one read, one answer


def main(argv=None) -> int:
    import logging

    logging.basicConfig(level="INFO", stream=sys.stderr,
                        format="%(asctime)s %(levelname)s %(name)s %(message)s")
    try:
        ApodAgent().run()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
