"""UK postcode - where it is, which health authority owns it, who governs it.

The ONS Postcodes Directory is published in full and keyless at postcodes.io, with
about sixty fields per postcode: the ward, the Westminster constituency, the NHS
region and the integrated care board, the ONS numeric code for every one of them.
Nobody asks it from an editor. "which NHS region is postcode X in?" gets the health
fields, and "what postcodes are near this one, and which of them fall in a
different district?" is the question a single postcode record cannot answer, so
that one goes to the licence gateway.
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

from data import (DATASET, HEALTH_FIELDS, QUALITY_NOTES, PostcodeData,  # noqa: E402
                  PostcodeError, PostcodeNotFound, normalise, outcode_from_text,
                  postcode_from_text)

HELP = (
    "I read the ONS Postcodes Directory through postcodes.io (keyless, no signup). Ask me:\n"
    "  - where is SW1A 1AA?\n"
    "  - which NHS region is EC1A 1BB in?\n"
    "  - who is the MP for M1 1AE?\n"
    "  - what is in the postcode district LS1?\n"
    "Which postcodes are near EC1A 1BB, how far is each one, and which of them fall in a "
    "different district or NHS area? (premium - one postcode record cannot answer that)\n"
    "A postcode's `quality` is not a score: 1 means live and receiving mail, and 4 or 5 mean the "
    "postcode was withdrawn, so a withdrawn one is reported as withdrawn rather than looked up "
    "as if it were live.\n"
    "Distances here are straight lines between the directory's centroids, not walking distances."
)

PERMISSION_KEY = "uk-postcode-read-directory"

SKILLS = ("uk-postcode", "uk-health", "uk-governance", "uk-outcode", "uk-nearby", "help")

#: The health-authority question, matched on the word a person actually uses for
#: it. These are the fields the directory publishes for health, and a question
#: naming any of them is answered from them.
_HEALTH_WORDS = re.compile(
    r"\b(nhs|health|healthcare|icb|integrated care board|ccg|commissioning group|"
    r"gp|surgery|doctor|hospital|trust|care trust|cancer alliance|"
    r"primary care|am i in)\b", re.IGNORECASE)

#: The political and statistical geography question. Checked after health, because
#: "which NHS region and which constituency" is a two-part question and health is
#: the more specific of the two.
_GOVERNANCE_WORDS = re.compile(
    r"\b(mp|constituency|ward|council|lsoa|msoa|nuts|region|police|parish|"
    r"district|govern\w*|boundar\w*|electoral|who represents)\b", re.IGNORECASE)

#: A proximity question: postcodes plural, or a distance, or a direction. The
#: premium skill is a *set* of answers, so it needs a plural or a distance word,
#: and never fires on a single-postcode question.
_NEARBY_WORDS = re.compile(
    r"\b(near|nearby|nearest|closest|close to|around|next to|by|within|"
    r"postcodes|walking distance|how far|which ones?|what is around)\b", re.IGNORECASE)

_DISTANCE_RE = re.compile(r"\b(\d{1,4}(?:\.\d+)?)\s*(km|kilometres?|kilometers?|miles?|mi)\b",
                          re.IGNORECASE)

#: Kilometres for a stated distance, in km. Miles are converted, and the answer
#: says which one it used.
_MILES_IN_KM = 1.609344


def route(text: str) -> tuple[str, dict]:
    """Deterministic intent routing: (skill, params). Pure function, easy to test."""
    stripped = str(text or "").strip()
    if not stripped or re.search(r"\b(help|what can you do|commands?)\b", stripped, re.IGNORECASE):
        return "help", {}

    postcode = postcode_from_text(stripped)
    outcode = outcode_from_text(stripped) if postcode is None else None

    if postcode:
        params: dict = {"postcode": postcode}
        if _NEARBY_WORDS.search(stripped) and re.search(
                r"\b(postcodes|near|nearby|nearest|closest|around|which|how far|"
                r"walking|distance)\b", stripped, re.IGNORECASE):
            plan = {**params}
            km = _radius_km(stripped)
            if km:
                plan["radius_km"] = km
            return "uk-nearby", plan
        if _HEALTH_WORDS.search(stripped):
            return "uk-health", params
        if _GOVERNANCE_WORDS.search(stripped):
            return "uk-governance", params
        return "uk-postcode", params

    if outcode:
        return "uk-outcode", {"outcode": outcode}
    return "help", {}


def _radius_km(text: str) -> float | None:
    """A stated search distance, as kilometres.

    A distance written in miles is multiplied by 1.609 to get kilometres, not
    divided: 3 miles is about 4.83 km, and dividing would report 1.86 km, which is
    a mile and a bit and would quietly search the wrong amount of ground.
    """
    match = _DISTANCE_RE.search(str(text or ""))
    if not match:
        return None
    value = float(match.group(1))
    unit = match.group(2).lower()
    if unit.startswith("mi"):
        return value * _MILES_IN_KM
    return value


def _unit_is_miles(text: str) -> bool:
    """Whether the distance in the question was written in miles."""
    match = _DISTANCE_RE.search(str(text or ""))
    return bool(match) and match.group(2).lower().startswith(("mi", "miles"))


def _show(value) -> str:
    """A field for a line of text. A null authority is 'none published', not a
    blank line and not an invented value: most districts are not in every list."""
    if value is None or value == "":
        return "none published"
    if isinstance(value, (list, tuple)):
        return ", ".join(str(item) for item in value) if value else "none published"
    return str(value)


def _num(value) -> str:
    """A number for a line of text, or the honest 'not reported'."""
    if value is None or value == "":
        return "not reported"
    try:
        return f"{float(value):g}"
    except (TypeError, ValueError):
        return str(value)


def _quality_line(record: dict) -> str:
    """The `quality` note, which is about a deliverable postcode.

    A postcode *district* is not one, and `/outcodes/` publishes no quality at
    all, so a missing value is reported as the field not applying rather than as
    an unknown code.
    """
    quality = record.get("quality")
    if quality is None:
        return "the directory publishes no quality for a district: quality describes whether a " \
               "single postcode is live, and a district is not one"
    note = QUALITY_NOTES.get(quality, "the directory published a quality value this reader has "
                                       "no note for")
    return f"quality {quality}: {note}"


def render_postcode(record: dict) -> str:
    """One postcode's own record."""
    lines = [f"{record.get('postcode', 'not reported')}"]
    lines.append(f"  {_quality_line(record)}")
    if record.get("date_of_termination"):
        lines.append(f"  terminated: {record['date_of_termination']}")
    for label, key in (("country", "country"), ("region", "region"),
                       ("admin district", "admin_district"), ("parish", "parish"),
                       ("admin ward", "admin_ward"),
                       ("parliamentary constituency", "parliamentary_constituency"),
                       ("outcode", "outcode"), ("incode", "incode")):
        value = record.get(key)
        if value:
            lines.append(f"  {label}: {_show(value)}")
    if record.get("latitude") is not None and record.get("longitude") is not None:
        lines.append(f"  coordinates: {float(record['latitude']):.5f}, "
                     f"{float(record['longitude']):.5f}")
    if record.get("eastings") is not None and record.get("northings") is not None:
        lines.append(f"  grid reference: E {record['eastings']} N {record['northings']}")
    if record.get("index_of_multiple_deprivation") is not None:
        lines.append(f"  index of multiple deprivation: {record['index_of_multiple_deprivation']}")
    codes = record.get("codes") or {}
    if codes:
        interesting = {key: codes[key] for key in ("admin_district", "admin_ward", "ccg",
                                                    "icb", "nuts", "pfa")
                       if key in codes}
        if interesting:
            lines.append("  ONS codes: " + ", ".join(f"{key} {value}"
                                                    for key, value in interesting.items()))
    return "\n".join(lines)


def render_health(record: dict) -> str:
    """The health-authority answer."""
    lines = [f"health for {record.get('postcode', 'not reported')} "
             f"({_show(record.get('admin_district'))}):"]
    for field in HEALTH_FIELDS:
        value = record.get(field)
        if value is None:
            #: Only the fields that are null are listed, and they are listed as
            #: null: a missing ICB is a fact about that postcode, not a gap here.
            continue
        lines.append(f"  {field}: {_show(value)}")
    if not any(record.get(field) for field in HEALTH_FIELDS):
        lines.append("  the directory publishes no health field at all for this postcode")
    return "\n".join(lines)


def render_governance(record: dict) -> str:
    """The political and statistical geography answer."""
    lines = [f"who governs {record.get('postcode', 'not reported')} "
             f"({_show(record.get('admin_district'))}):"]
    for field in ("parliamentary_constituency", "parliamentary_constituency_2024",
                  "admin_ward", "lsoa", "msoa", "nuts", "pfa", "region",
                  "admin_county", "parish", "european_electoral_region", "bua"):
        value = record.get(field)
        if value is None:
            continue
        lines.append(f"  {field}: {_show(value)}")
    missing = [field for field in ("parliamentary_constituency", "admin_ward", "lsoa", "nuts")
               if not record.get(field)]
    if missing:
        lines.append(f"  not published for this postcode: {', '.join(missing)}")
    return "\n".join(lines)


def render_outcode(record: dict) -> str:
    """A postcode district."""
    lines = [f"postcode district {record.get('outcode', 'not reported')}:"]
    lines.append(f"  {_quality_line(record)}")
    lines.append(f"  country: {_show(record.get('country'))}")
    lines.append(f"  admin district: {_show(record.get('admin_district'))}")
    districts = record.get("admin_districts") or []
    if len(districts) > 1:
        lines.append(f"  the district straddles {len(districts)} admin districts: "
                     + ", ".join(str(item) for item in districts))
    parishes = record.get("parishes") or []
    if parishes:
        shown = ", ".join(str(item) for item in parishes[:6])
        lines.append(f"  {len(parishes)} parish(es): {shown}"
                     + (", ..." if len(parishes) > 6 else ""))
    if record.get("parliamentary_constituency"):
        lines.append(f"  parliamentary constituency: {_show(record['parliamentary_constituency'])}")
    if record.get("latitude") is not None and record.get("longitude") is not None:
        lines.append(f"  centroid: {float(record['latitude']):.5f}, "
                     f"{float(record['longitude']):.5f}")
    lines.append(f"  source: {record.get('source', 'not reported')}")
    return "\n".join(lines)


def render_nearby(data: dict, want_miles: bool) -> str:
    """The premium answer: the postcodes near one, and which cross a boundary."""
    unit = "miles" if want_miles else "km"
    lines = [f"what is near {data.get('postcode', 'not reported')} "
             f"({_show(data.get('admin_district'))}):"]
    lines.append(f"  searched a {_num(data.get('radius_km'))} km radius; the directory "
                 f"returned {_num(data.get('found'))} postcode(s)")
    if data.get("coverage"):
        lines.append(f"  coverage: {data['coverage']}")
    for row in (data.get("nearest") or [])[:10]:
        lines.append(f"    {row.get('postcode')}: {_num(row.get('distance_km'))} km / "
                     f"{_num(row.get('distance_miles'))} mi, "
                     f"{row.get('bearing', 'not reported')} ({row.get('compass', '?')}), "
                     f"{_show(row.get('admin_district'))}, NHS {_show(row.get('nhs_region'))}")
    districts = data.get("district_mix") or {}
    if districts:
        lines.append(f"  admin districts covered by the {data.get('found', 0)} returned: "
                     + ", ".join(f"{name} ({count})"
                                 for name, count in sorted(districts.items(),
                                                           key=lambda pair: -pair[1])))
    nhs = data.get("nhs_mix") or {}
    if nhs:
        lines.append("  NHS areas covered: "
                     + ", ".join(f"{name} ({count})"
                                 for name, count in sorted(nhs.items(), key=lambda pair: -pair[1])))
    crossing = data.get("crosses_district") or {}
    lines.append(f"  the search point sits in {_show(crossing.get('from'))}; "
                 f"{_num(crossing.get('inside'))} of {_num(crossing.get('found'))} returned "
                 f"postcode(s) are in it and {_num(crossing.get('outside'))} are not")
    if crossing.get("nearest_outside"):
        row = crossing["nearest_outside"]
        lines.append(f"  the nearest postcode over the edge is {row.get('postcode')} in "
                     f"{_show(row.get('admin_district'))}, {_num(row.get('distance_km'))} km away")
    lines.append(f"  source: {data.get('source', 'not reported')}")
    return "\n".join(lines)


class UkPostcodeAgent(AcpAgent):
    name = "uk-postcode"
    title = "UK postcode - where it is, which NHS area, and what is next door"
    version = "1.0.0"

    def __init__(self, connection=None, data: PostcodeData | None = None,
                 gateway=None) -> None:
        super().__init__(connection)
        self.data = data or PostcodeData()
        # The licence check lives on the gateway, not here, so deleting a line
        # from this repository buys nobody the answer.
        self.gateway = gateway or GatewayClient()

    # -- ACP ---------------------------------------------------------------

    def new_session(self, session) -> dict:
        session.remember("agent", "UK postcode session opened. " + HELP.splitlines()[0])
        return {}

    def prompt(self, ctx: SessionContext, prompt: list[dict]) -> str:
        text = prompt_text(prompt)
        skill, params = route(text)
        ctx.plan([
            (f"Route the request ({skill})", "high"),
            ("Read the ONS Postcodes Directory", "medium"),
            ("Report the record, the authority or the neighbours", "medium"),
        ])

        if skill == "help":
            ctx.stream_text(HELP)
            ctx.message("Distances here are straight lines between the directory's centroids, "
                        "not walking distances.")
            return STOP_END_TURN

        tool = f"call_{skill.replace('-', '_')}"
        label = ("Ask the licence gateway for the neighbouring postcodes" if skill == "uk-nearby"
                 else "Read the ONS Postcodes Directory")
        ctx.tool_call(tool, label, kind="fetch", name=skill, raw_input=dict(params))
        if not ctx.ask_permission(tool, "Allow UK Postcode to read the Postcodes Directory?",
                                  remember_key=PERMISSION_KEY):
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content("permission denied"))
            ctx.message("I need permission to read the Postcodes Directory first.")
            return STOP_REFUSAL
        ctx.tool_call_update(tool, status="in_progress")

        try:
            if skill == "uk-nearby":
                return self._run_skill(ctx, params, tool, _unit_is_miles(text))

            if skill == "uk-outcode":
                record = self.data.outcode(params["outcode"])
                body = render_outcode(record)
                summary = f"{record['outcode']}: {_show(record.get('admin_district'))}"
            else:
                record = self.data.postcode(params["postcode"])
                if skill == "uk-health":
                    body = render_health(record)
                    summary = (f"{record['postcode']}: NHS {_show(record.get('nhs_region'))}, "
                               f"ICB {_show(record.get('icb'))}")
                elif skill == "uk-governance":
                    body = render_governance(record)
                    summary = (f"{record['postcode']}: "
                               f"{_show(record.get('parliamentary_constituency'))}, "
                               f"ward {_show(record.get('admin_ward'))}")
                else:
                    body = render_postcode(record)
                    summary = (f"{record['postcode']}: "
                               f"{_show(record.get('admin_district'))}, "
                               f"{_show(record.get('region'))}")
        except (PostcodeError, GatewayError, ValueError) as exc:
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content(str(exc)))
            ctx.message(f"I could not read the Postcodes Directory: {exc}")
            return STOP_END_TURN

        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(summary))
        ctx.stream_text(body + "\n")
        ctx.message(f"\nSource: {DATASET}, read live. A field reading 'none published' means the "
                    "directory has nothing for that postcode, which is a real answer: some "
                    "postcodes genuinely fall in no parliamentary constituency or no health "
                    "board, and guessing one would be worse than saying so.")
        return STOP_END_TURN

    def _run_skill(self, ctx: SessionContext, params: dict, tool: str, want_miles: bool) -> str:
        """The premium skill. The licence is checked on the gateway, not here."""
        arguments: dict = {"postcode": normalise(params["postcode"])}
        if params.get("radius_km"):
            arguments["radius_km"] = round(float(params["radius_km"]), 2)

        data, refused = premium_call(self.gateway, "uk_postcode_nearby", arguments,
                                    {"agent": "uk-postcode"})
        if refused:
            # Already an (answer, artifact) pair, worded by the gateway.
            answer, artifact = refused
            ctx.tool_call_update(tool, status="completed",
                                 content=ctx.text_content(artifact["summary"]))
            ctx.stream_text(answer + "\n")
            ctx.message("That is a premium skill, so the answer comes from the licence gateway. "
                        "The wording above is the gateway's own.")
            return STOP_END_TURN

        if not isinstance(data, dict) or not data.get("postcode"):
            answer, artifact = empty_premium_answer(
                "The licence gateway did not send back the neighbouring postcodes.",
                {"agent": "uk-postcode"})
            ctx.tool_call_update(tool, status="completed",
                                 content=ctx.text_content(artifact["summary"]))
            ctx.stream_text(answer + "\n")
            ctx.message("I could not read a neighbourhood out of what the gateway sent.")
            return STOP_END_TURN

        body = render_nearby(data, want_miles)
        summary = (f"{data['postcode']}: {_num(data.get('found'))} postcodes within "
                   f"{_num(data.get('radius_km'))} km")
        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(summary))
        ctx.stream_text(body + "\n")
        ctx.message("\nSource: the ONS Postcodes Directory, worked out on the licence gateway. Every "
                    "distance is a straight line between the two postcodes' published centroids, so "
                    "a figure here is not a walking distance and a street can cross a district "
                    "boundary the centroid distance says it does not.")
        return STOP_END_TURN

    def on_cancel(self, session) -> None:
        return None  # one read, one answer


def main(argv=None) -> int:
    import logging

    logging.basicConfig(level=logging.INFO, stream=sys.stderr,
                        format="%(asctime)s %(levelname)s %(name)s %(message)s")
    try:
        UkPostcodeAgent().run()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
