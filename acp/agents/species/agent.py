"""Species — iNaturalist observations inside your editor.

What lives here, what was seen lately, and what is around a point. No ACP agent served a
biodiversity feed before this one; it reads iNaturalist's public keyless API and answers
with the observation counts and the records themselves.

Deterministic on purpose: routing is rules, the numbers are the feed's, and nothing is
guessed. It reports a plan, opens one tool call per lookup, asks permission before its
first read, streams the answer, and closes the tool call with a one-line summary.
The premium region board aggregates monthly histograms on the licence gateway.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from acp_kit import GatewayClient, GatewayError, premium_call, empty_premium_answer  # noqa: E402
from acp_kit import STOP_END_TURN, STOP_REFUSAL, AcpAgent, SessionContext, prompt_text  # noqa: E402

from data import DATASET, MAX_RADIUS_KM, SpeciesData, SpeciesError  # noqa: E402

HELP = (
    "I read iNaturalist's public observations (keyless). Ask me:\n"
    "  • how many monarch butterflies are there?\n"
    "  • recent sightings of Danaus plexippus\n"
    "  • what has been seen near 40.71,-74.01 within 10 km?\n"
    "  • region board place 1 taxon 47158 observer 1 from 2024-01 to 2024-03 (premium)\n"
    "Answers carry the count the feed reports and the newest records, with the grade "
    "(research or needs_id) shown as iNaturalist records it."
)

PERMISSION_KEY = "species-read-public-inaturalist"

SKILLS = ("species-count", "species-recent", "species-near", "species-board", "help")

_POINT_RE = re.compile(r"\b(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\b")
_COUNT_RE = re.compile(r"\b(how many|count|number of|total)\b", re.IGNORECASE)
_NEAR_RE = re.compile(r"\b(near|around|close to|within)\b", re.IGNORECASE)
_HOWMANY_RE = re.compile(
    r"\bhow many\s+([A-Za-z][A-Za-z'\- ]{2,40}?)"
    r"(?:\s+(?:are|is|were|was|have|has|live|lives|exist|there)\b|[?.!,]|$)", re.IGNORECASE)
_TAXON_AFTER_RE = re.compile(
    r"\b(?:of|about|for|sightings? of|observations? of|records? of)\s+([A-Za-z][A-Za-z'\- ]{2,40})",
    re.IGNORECASE)
_RADIUS_RE = re.compile(r"\bwithin\s+(\d{1,3})\s*(?:km|kilometres?|kilometers?)\b", re.IGNORECASE)

#: Words that mean a captured phrase is not part of a taxon name.
_STOP_TAIL_WORDS = frozenset({
    "are", "is", "were", "was", "have", "has", "live", "lives", "exist", "there", "in", "on",
    "at", "near", "around", "found", "seen", "today", "right", "now", "recently", "recorded",
    "observed", "reported", "the", "a", "an", "and", "or", "with", "from",
})
_PLACE_PHRASE_RE = re.compile(r"\b(?:in|at|near|around)\s+([A-Za-z][\w'-]*(?:\s+[A-Za-z][\w'-]*){0,2})")


def taxon_from_text(text: str) -> str | None:
    """The species name in a question, or None. Conservative on purpose."""
    for pattern in (_HOWMANY_RE, _TAXON_AFTER_RE):
        match = pattern.search(text)
        if not match:
            continue
        words = match.group(1).strip(" .,?!").split()
        while words and words[-1].lower() in _STOP_TAIL_WORDS:
            words.pop()
        phrase = " ".join(words)
        # "how many observations of X" - drop the leading record words.
        phrase = re.sub(r"^(?:observations?|sightings?|records?|reports?)\s+(?:of|for)\s+", "", phrase,
                        flags=re.IGNORECASE)
        if len(phrase) >= 3 and re.search(r"[A-Za-z]", phrase):
            return phrase.lower()
    return None


def unknown_place_from_text(text: str) -> str | None:
    """A place name the built-in list does not know, so the answer can say so by name."""
    match = _PLACE_PHRASE_RE.search(text)
    if not match:
        return None
    words = match.group(1).strip(" .,?!").split()
    while words and words[-1].lower() in _STOP_TAIL_WORDS:
        words.pop()
    if not words:
        return None
    return " ".join(words).lower()


def radius_from_text(text: str) -> int | None:
    match = _RADIUS_RE.search(text)
    if not match:
        return None
    try:
        return SpeciesData.check_radius(match.group(1))
    except ValueError:
        return None


def route(text: str) -> tuple[str, dict]:
    """Deterministic intent routing: (skill, params). Pure function, easy to test."""
    if not text.strip() or re.search(r"\b(help|what can you do|commands?)\b", text, re.IGNORECASE):
        return "help", {}

    if re.search(r"\bregion board\b", text, re.IGNORECASE):
        params = {}
        for label, field in (("place", "place_id"), ("taxon", "taxon_id"), ("observer", "user_id")):
            match = re.search(rf"\b{label}\s+(\d+)\b", text, re.IGNORECASE)
            if match:
                params[field] = int(match.group(1))
        window = re.search(r"\bfrom\s+(\d{4}-\d{2})\s+to\s+(\d{4}-\d{2})\b", text, re.IGNORECASE)
        if window:
            params.update(start_month=window.group(1), end_month=window.group(2))
        return "species-board", params

    params: dict = {}
    match = _POINT_RE.search(text)
    if match:
        try:
            params["point"] = SpeciesData.check_point(f"{match.group(1)},{match.group(2)}")
        except ValueError:
            pass
    place = SpeciesData.place_from_text(text)
    if place:
        params["place"] = place
        params.setdefault("point", SpeciesData.point_from_place(place))
    elif _NEAR_RE.search(text):
        unknown = unknown_place_from_text(text)
        if unknown:
            params["place"] = unknown
    taxon = taxon_from_text(text)
    if taxon:
        params["taxon"] = taxon
    radius = radius_from_text(text)
    if radius:
        params["radius_km"] = radius

    if _NEAR_RE.search(text) and ("point" in params or "place" in params):
        return "species-near", params
    if _COUNT_RE.search(text):
        return "species-count", params
    return "species-recent", params


class SpeciesAgent(AcpAgent):
    name = "species"
    title = "Species — iNaturalist observations"
    version = "1.0.0"

    def __init__(self, connection=None, data: SpeciesData | None = None,
                 gateway: GatewayClient | None = None) -> None:
        super().__init__(connection)
        self.data = data or SpeciesData()
        self.gateway = gateway or GatewayClient()

    # -- ACP ---------------------------------------------------------------

    def new_session(self, session) -> dict:
        session.remember("agent", "Species session opened. " + HELP.split("\n", 1)[0])
        return {}

    def prompt(self, ctx: SessionContext, prompt: list[dict]) -> str:
        text = prompt_text(prompt)
        skill, params = route(text)
        ctx.plan([
            (f"Route the request ({skill})", "high"),
            ("Resolve the species name and the place", "medium"),
            ("Read the iNaturalist observation feed", "medium"),
        ])

        if skill == "help":
            ctx.stream_text(HELP)
            ctx.message("I read one source: iNaturalist's public observation API. It is "
                        "crowd-sourced: a record is an observation someone uploaded, not a "
                        "population count.")
            return STOP_END_TURN

        tool = f"call_{skill}"
        ctx.tool_call(tool, f"Read iNaturalist observations for {skill}", kind="fetch", name=skill,
                      raw_input={"skill": skill, **params})
        if not ctx.ask_permission(tool, "Allow Species to read iNaturalist's public observation data?",
                                 remember_key=PERMISSION_KEY):
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content("permission denied"))
            ctx.message("I need permission to read the public iNaturalist feed before I can answer.")
            return STOP_REFUSAL

        ctx.tool_call_update(tool, status="in_progress")
        try:
            answer, artifact = self._run_skill(skill, params)
        except (SpeciesError, ValueError, GatewayError) as exc:
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content(str(exc)))
            ctx.message(f"I could not read the iNaturalist feed: {exc}")
            return STOP_END_TURN
        ctx.check_cancelled()
        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(artifact["summary"]))
        ctx.stream_text(answer)
        return STOP_END_TURN

    def on_cancel(self, session) -> None:
        # Reads have bounded timeouts.
        return None

    # -- skills ------------------------------------------------------------

    def _run_skill(self, skill: str, params: dict) -> tuple[str, dict]:
        if skill == "species-board":
            return self._board(params)
        if skill == "species-count":
            return self._count(params)
        if skill == "species-recent":
            return self._recent(params)
        if skill == "species-near":
            return self._near(params)
        return HELP, {"summary": "help", "dataset": None}

    def _board(self, params: dict) -> tuple[str, dict]:
        """Render the gateway's monthly region, taxon and observer comparison."""
        context = {"agent": "species", "skill": "species-board"}
        fields = ("place_id", "taxon_id", "user_id", "start_month", "end_month")
        if any(field not in params for field in fields):
            return ("Use region board place 1 taxon 47158 observer 1 from 2024-01 to 2024-03; "
                    "supply iNaturalist IDs and 2 to 24 whole months.",
                    {"summary": "region board needs IDs and months", **context})
        args = {field: params[field] for field in fields}
        data, refused = premium_call(self.gateway, "species_region_board", args, context)
        if refused:
            return refused
        rows = data.get("monthly") if isinstance(data, dict) else None
        totals = data.get("totals") if isinstance(data, dict) else None
        def count(value):
            return type(value) is int and value >= 0
        if (not isinstance(rows, list) or not 2 <= len(rows) <= 24
                or not isinstance(totals, dict)
                or any(not count(totals.get(key)) for key in ("region", "taxon", "observer"))
                or any(not isinstance(row, dict) or not isinstance(row.get("month"), str)
                       or any(not count(row.get(key)) for key in
                              ("region_count", "taxon_count", "observer_count"))
                       or any(row.get(key) is not None and
                              (type(row.get(key)) not in (int, float) or not 0 <= row[key] <= 100)
                              for key in ("taxon_share_percent", "observer_share_percent"))
                       for row in rows)
                or any(type(data.get(key)) is not int for key in
                       ("taxon_net_change", "observer_net_change"))):
            return empty_premium_answer("The gateway returned no readable monthly region board.", context)
        lines = [f"Premium iNaturalist region board for place {args['place_id']}, "
                 f"taxon {args['taxon_id']}, observer {args['user_id']}:",
                 f"Window totals: {totals['region']:,} region observations; "
                 f"{totals['taxon']:,} taxon; {totals['observer']:,} by this observer of this taxon."]
        def share(value):
            return "not defined" if value is None else f"{value}%"
        for row in rows:
            lines.append(f"  {row['month']}: region {row['region_count']:,}; "
                         f"taxon {row['taxon_count']:,} ({share(row.get('taxon_share_percent'))} of region); "
                         f"observer {row['observer_count']:,} ({share(row.get('observer_share_percent'))} of taxon).")
        lines.append(f"First-to-last month change: taxon {data['taxon_net_change']:+,}; "
                     f"observer {data['observer_net_change']:+,} observations.")
        lines.append("Source: iNaturalist monthly histograms, all quality grades by observation date. "
                     "This is recording effort, affected by seasonality, not population change.")
        return "\n".join(lines), {"summary": f"premium region board: {totals['taxon']} taxon observations",
                                  "premium": True, "data": data, **context}

    @staticmethod
    def _name(row: dict) -> str:
        common, scientific = row.get("common"), row.get("name")
        if common and scientific:
            return f"{common} ({scientific})"
        return common or scientific or "unidentified observation"

    def _count(self, params: dict) -> tuple[str, dict]:
        taxon = params.get("taxon")
        if not taxon:
            return (
                "Which species should I count? Give me a common name (monarch butterfly) or a "
                "scientific one (Danaus plexippus).",
                {"summary": "no species given", "dataset": DATASET, "known": False},
            )
        result = self.data.count(taxon)
        artifact = {
            "summary": f"{DATASET}: {result['total']} observations of {result['taxon']}",
            "dataset": DATASET,
            "taxon": result["taxon"],
            "total": result["total"],
        }
        lines = [
            f"iNaturalist holds {result['total']:,} observations of {result['taxon']}.",
        ]
        sample = result.get("sample")
        if sample:
            lines.append(f"The newest one on file: {sample.get('observed_on')} at "
                         f"{sample.get('place') or 'no place given'} "
                         f"({sample.get('quality') or 'ungraded'}).")
        lines.append(
            f"\nSource: {DATASET} (read live). That is an observation count, not a population "
            "estimate - most wildlife is never uploaded. Ask me for the latest sightings."
        )
        return "\n".join(lines), artifact

    def _recent(self, params: dict) -> tuple[str, dict]:
        taxon = params.get("taxon")
        if not taxon:
            return (
                "Which species should I look up? Give me a common name (monarch butterfly) or a "
                "scientific one (Danaus plexippus).",
                {"summary": "no species given", "dataset": DATASET, "known": False},
            )
        result = self.data.recent(taxon, limit=5)
        artifact = {
            "summary": f"{DATASET}: latest of {result['total']} observations of {result['taxon']}",
            "dataset": DATASET,
            "taxon": result["taxon"],
            "total": result["total"],
            "rows": result["rows"],
        }
        lines = [f"Latest iNaturalist observations of {result['taxon']} "
                 f"({result['total']:,} on file):"]
        if not result["rows"]:
            lines.append("  • no records came back for that name.")
        for row in result["rows"]:
            lines.append(f"  • {row['observed_on']} - {self._name(row)} at "
                         f"{row['place'] or 'no place given'} "
                         f"({row['quality'] or 'ungraded'}, by {row['user'] or 'anonymous'})")
        lines.append(
            f"\nSource: {DATASET} (read live). A record is one uploaded observation; the grade "
            "shows whether the community confirmed the identification."
        )
        return "\n".join(lines), artifact

    def _near(self, params: dict) -> tuple[str, dict]:
        point = params.get("point")
        if not point:
            if params.get("place"):
                return (
                    f"I do not know the place {params['place']!r}, so I will not guess coordinates "
                    "for it. Give me a latitude/longitude point, or a city from my list (New York, "
                    "London, Nairobi, Sydney, Tokyo and so on).",
                    {"summary": "unknown place", "dataset": DATASET, "known": False},
                )
            return (
                "I need a point to search around - a latitude/longitude pair like 40.71,-74.01, "
                "or a city name from my list (New York, London, Nairobi, Sydney, Tokyo and so on).",
                {"summary": "no place given", "dataset": DATASET, "known": False},
            )
        radius = int(params.get("radius_km") or 10)
        result = self.data.nearby(point, radius, limit=5, taxon=params.get("taxon"))
        label = f" within {result['radius_km']} km of {result['point']}"
        artifact = {
            "summary": f"{DATASET}: {result['total']} observations near {result['point']} "
                       f"in {result['radius_km']} km",
            "dataset": DATASET,
            "point": result["point"],
            "radius_km": result["radius_km"],
            "total": result["total"],
            "rows": result["rows"],
        }
        lines = [f"iNaturalist observations{label} ({result['total']:,} on file):"]
        if not result["rows"]:
            lines.append("  • no records came back for that window.")
        for row in result["rows"]:
            lines.append(f"  • {row['observed_on']} - {self._name(row)} at "
                         f"{row['place'] or 'no place given'} "
                         f"({row['quality'] or 'ungraded'})")
        lines.append(
            f"\nSource: {DATASET} (read live). Newest records first; the window is capped at "
            f"{MAX_RADIUS_KM} km because this is a public API."
        )
        return "\n".join(lines), artifact


def main(argv=None) -> int:
    import logging

    logging.basicConfig(level="INFO", stream=sys.stderr, format="%(asctime)s %(levelname)s %(name)s %(message)s")
    try:
        SpeciesAgent().run()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
