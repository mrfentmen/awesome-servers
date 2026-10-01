"""World Bank - what a country's numbers actually are, and how fast they move.

The World Bank publishes 1,500 indicators for 217 countries, keyless, and nobody asks them
a plain question. "what is Nigeria's GDP?" gets the newest figure the Bank actually has,
with the year it belongs to; "how does Kenya compare with Ghana" gets both on the same
indicator; and an indicator that the Bank has not reported yet does not get printed as a
zero.

The question the free skills do not answer is how fast a number moved: growth rates over a
window, and where that country sits among its peers. That is arithmetic over a series, and
it is the premium skill, licensed on the gateway.
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

from data import (DATASET, WDI_SOURCE, WorldBankData, WorldBankError,  # noqa: E402
                  WorldBankNotFound, country_from_text, indicator_default_for,
                  indicator_from_text, subject_from_text)

HELP = (
    "I read the World Bank's Open Data API (keyless) - 1498 indicators for 217 countries. Ask me:\n"
    "  - what is Nigeria's GDP?\n"
    "  - what is Kenya's GDP per capita?\n"
    "  - compare GDP per capita in Kenya, Ghana and Nigeria\n"
    "  - Nigeria's GDP per capita over the last 10 years\n"
    "  - which indicator measures life expectancy at birth?\n"
    "  - how fast is Nigeria's GDP per capita growing, and where does it rank? (premium)\n"
    "I always report the newest year the Bank actually has a value for, not the newest year\n"
    "in the file, and I print the indicator id with every figure, because that id is the only\n"
    "unambiguous way to ask again."
)

PERMISSION_KEY = "worldbank-read-world-bank"

SKILLS = ("worldbank-value", "worldbank-compare", "worldbank-series",
          "worldbank-indicators", "worldbank-growth", "help")

#: Words that mean an indicator is being looked for rather than a value.
_INDICATOR_QUESTION = re.compile(
    r"\b(which|what|whats|name|find|look for|list|search)\b.*\b(indicator|indicators|"
    r"measure|measures|measures what|series|data for)\b"
    r"|\bwhich indicator\b|\bindicators?\b.*\b(exist|available|are there)\b",
    re.IGNORECASE)

#: A growth or ranking question is the aggregate, and the aggregate is the paywall.
_GROWTH_WORDS = re.compile(
    r"\b(how fast|growth|growth rate|growing|cagr|compound|rate of|per year|year on year|"
    r"year-over-year|yoy|trending|trend|rank|ranking|ranked|where does .* sit|"
    r"compared to its peers|peer|peers|percent change|percentage change|change over)\b",
    re.IGNORECASE)

_COMPARE_WORDS = re.compile(r"\b(compare|comparison|versus|vs\.?|against|than)\b", re.IGNORECASE)
_SERIES_WORDS = re.compile(r"\b(over the last|past|per year|each year|history|historical|"
                           r"trend|trending|series|since|over time|every year|years)\b",
                           re.IGNORECASE)
_YEARS_RE = re.compile(r"\b(?:last|past|over the last|for)?\s*(\d{1,2})\s+years?\b",
                       re.IGNORECASE)

#: A question about a country's numbers at all.
_DATA_WORDS = re.compile(
    r"\b(gdp|gdp per capita|per capita|income|unemployment|inflation|population|poverty|"
    r"life expectancy|mortality|fertility|exports?|imports?|debt|electricity|"
    r"internet|mobile|co2|carbon|emissions?|health|education|agriculture|manufacturing|"
    r"trade|indicator|indicators|country|countries|nation|nations|economy|economic|"
    r"growth|rate|rank|compare|figure|figures|number|numbers|data|statistic|statistics|"
    r"how much|how many|how fast|average|median|share|percent)\b",
    re.IGNORECASE)


def route(text: str) -> tuple[str, dict]:
    """Deterministic intent routing: (skill, params). Pure function, easy to test."""
    stripped = str(text or "").strip()
    if not stripped or re.search(r"\b(help|what can you do|commands?)\b", stripped, re.IGNORECASE):
        return "help", {}
    if not _DATA_WORDS.search(stripped):
        return "help", {}

    indicator = indicator_from_text(stripped) or indicator_default_for(stripped)
    countries = countries_from_text(stripped)
    years = _YEARS_RE.search(stripped)
    window = int(years.group(1)) if years else 10
    window = max(2, min(window, 60))
    topic = topic_from_text(stripped)

    if _INDICATOR_QUESTION.search(stripped) and not countries:
        return "worldbank-indicators", {"term": topic or "GDP"}
    if _GROWTH_WORDS.search(stripped):
        #: Narrow on purpose: a rate or a rank. "how much is Nigeria's GDP" and
        #: "Nigeria's GDP over 10 years" stay with the free skills below.
        if not countries:
            return "help", {}
        return "worldbank-growth", {"country": countries[0], "indicator": indicator,
                                    "years": window, "peers": countries[1:]}
    if len(countries) > 1 and _COMPARE_WORDS.search(stripped):
        return "worldbank-compare", {"countries": countries[:12], "indicator": indicator}
    if _SERIES_WORDS.search(stripped) and not _COMPARE_WORDS.search(stripped):
        if not countries:
            return "help", {}
        return "worldbank-series", {"country": countries[0], "indicator": indicator,
                                    "years": window}
    if countries:
        if len(countries) > 1:
            return "worldbank-compare", {"countries": countries[:12], "indicator": indicator}
        return "worldbank-value", {"country": countries[0], "indicator": indicator}
    if _INDICATOR_QUESTION.search(stripped):
        return "worldbank-indicators", {"term": topic or "GDP"}
    return "help", {}


_CAPITALISED = re.compile(r"\b([A-Z][A-Za-z'&.-]*(?:\s+[A-Z][A-Za-z'&.-]*)*)\b")

#: Words that are capitalised in a sentence but are not a country.
_NOT_A_COUNTRY = {
    "GDP", "World", "Bank", "USA", "US", "UK", "EU", "What", "How", "Which", "The", "Compare",
    "Give", "Show", "Tell", "Is", "Are", "Does", "Do", "In", "On", "For", "And", "But",
    "Life", "Health", "Education", "Population", "Unemployment", "Inflation", "Exports",
    "Imports", "Trade", "Income", "Growth", "Rate", "Per", "Capita", "Current", "Constant",
    "Annual", "Total", "Male", "Female", "Not", "Available", "Data", "Statistics", "Figures",
}


def countries_from_text(text: str) -> list[str]:
    """Country names in a question, in the order they appear.

    Capitalised runs are the only signal, because the World Bank's own list is the
    authority for what a country is called and a lookup that guesses is a lookup that
    answers about the wrong place. Known aliases ("the US", "the UK") are read directly.
    """
    work = str(text or "").strip()
    found: list[str] = []
    for match in _CAPITALISED.finditer(work):
        run = match.group(1)
        if re.fullmatch(r"[A-Z]{2}\.[A-Za-z0-9_]+\.[A-Z]{2}", run):
            #: An indicator id is capitalised too, and it is not a place.
            continue
        #: "Nigeria GDP" is one capitalised run and one country: the indicator words at
        #: either end are not part of the place name.
        #: "Nigeria's GDP" is a possessive, not part of the name.
        words = [re.sub(r"['’]s$", "", word) for word in run.split()]
        while words and words[0] in _NOT_A_COUNTRY:
            words.pop(0)
        while words and words[-1] in _NOT_A_COUNTRY:
            words.pop()
        phrase = " ".join(words)
        if not phrase or phrase in _NOT_A_COUNTRY or phrase.lower() in _NOT_A_COUNTRY:
            continue
        if phrase not in found:
            found.append(phrase)
    alias = country_from_text(work)
    if alias and alias not in found:
        found.append(alias)
    return found


def topic_from_text(text: str) -> str | None:
    """What an indicator search is looking for, from the question's own words."""
    work = str(text or "").strip()
    quoted = re.findall(r'"([^"]{2,80})"', work)
    if quoted:
        return quoted[0].strip()
    match = re.search(r"(?i)\b(?:measures?|measuring|tracks?|for|about|on)\s+(.+?)\s*[?.!]*$",
                      work)
    if not match:
        match = re.search(r"(?i)\b(?:which|what)\s+indicator\b\s*(?:.*?\bfor\s+)?(.+?)\s*[?.!]*$",
                          work)
    if not match:
        return None
    topic = match.group(1).strip()
    for noise in (r"(?i)\?$", r"(?i)\s+indicator$", r"(?i)\s+series$",
                  r"(?i)\s+data$", r"(?i)\s+is there$", r"(?i)\s+are there$"):
        topic = re.sub(noise, "", topic).strip()
    return topic or None


def _num(value) -> str:
    """A number for a line of text, or the honest 'not reported'.

    Never scientific notation: a population of 2,066,290 printed as 2.06629e+06 is a
    number nobody can read off a line of an editor's answer.
    """
    if value is None or value == "":
        return "not reported"
    try:
        number = float(value)
    except (TypeError, ValueError):
        return str(value)
    if abs(number) >= 1000:
        return f"{number:,.0f}" if number == int(number) else f"{number:,.2f}"
    return f"{number:g}"


def render_value(found: dict) -> str:
    """One country's newest figure for one indicator."""
    place, indicator = found["country"], found["indicator"]
    lines = [f"{indicator['name']} in {place['name']}"]
    lines.append(f"  {found['year']}: {_num(found['value'])}"
                 + (f" ({found['unit']})" if found.get("unit") else ""))
    lines.append(f"  indicator id: {indicator['id']}")
    if place.get("region"):
        lines.append(f"  region: {place['region']}")
    if place.get("income"):
        lines.append(f"  income group: {place['income']}")
    lines.append(f"  the World Bank's data was last updated "
                 f"{found.get('source_updated') or 'not reported'}")
    return "\n".join(lines)


def render_compare(found: dict) -> str:
    """Several countries on one indicator, biggest first."""
    lines = [f"{found['indicator_name']} ({found['indicator_id']}), newest year each country has"]
    for row in found["rows"]:
        lines.append(f"  {row['country']['name']}: {_num(row['value'])} in {row['year']}")
    for problem in found["not_reported"]:
        lines.append(f"  not reported: {problem}")
    return "\n".join(lines)


def render_series(series: dict) -> str:
    """One country, one indicator, year by year."""
    values = series["values"]
    lines = [f"{series['indicator']['name']} in {series['country']['name']}, "
             f"{series['from']} to {series['to']} ({series['indicator']['id']})"]
    for row in values:
        lines.append(f"  {row['year']}: {_num(row['value'])}")
    if series["missing_years"]:
        lines.append(f"  {len(values)} of the {series['asked_years']} years asked for have a "
                     "value; the rest are absent from the Bank's data, not zero")
    return "\n".join(lines)


def render_indicators(found: dict) -> str:
    """The indicators that match a phrase, with their ids."""
    lines = [f"{len(found['indicators'])} of the {found['matched']} World Development "
             f"Indicators whose name contains {found['term']!r} (of {found.get('total', 0)} in "
             "the collection)"]
    for entry in found["indicators"]:
        lines.append(f"  {entry['id']} - {entry['name']}")
        if entry.get("unit"):
            lines.append(f"    unit: {entry['unit']}")
    return "\n".join(lines)


def render_growth(data: dict) -> str:
    """How fast a number moved, and where the country sits."""
    lines = [f"{data.get('indicator_name', 'not reported')} in "
             f"{data.get('country', 'not reported')} "
             f"({data.get('indicator_id', 'not reported')})"]
    window = data.get("window") or {}
    lines.append(f"  window: {window.get('from', 'not reported')} to "
                 f"{window.get('to', 'not reported')} ({data.get('years_used', 0)} year(s) with "
                 "a value)")
    lines.append(f"  from: {_num(data.get('first_value'))} in {data.get('first_year')}")
    lines.append(f"  to: {_num(data.get('last_value'))} in {data.get('last_year')}")
    lines.append(f"  change: {_num(data.get('absolute_change'))} "
                 f"({_num(data.get('percent_change'))}% over the window)")
    lines.append(f"  compound annual growth rate: {_num(data.get('cagr_pct'))}% a year")
    if data.get("average_annual_pct") is not None:
        lines.append(f"  average year-on-year change: {_num(data['average_annual_pct'])}%")
    if data.get("volatility_pct") is not None:
        lines.append(f"  year-to-year swings: {_num(data['volatility_pct'])}% standard deviation")
    if data.get("peak") and data.get("trough"):
        lines.append(f"  highest year: {_num(data['peak']['value'])} in {data['peak']['year']}")
        lines.append(f"  lowest year: {_num(data['trough']['value'])} in {data['trough']['year']}")
    if data.get("rank") is not None:
        lines.append(f"  rank among the countries compared: {data['rank']} of "
                     f"{data.get('ranked_count', 'not reported')}")
    if data.get("peers"):
        lines.append("  the same window, country by country:")
        for row in data["peers"][:12]:
            lines.append(f"    {row.get('country', 'not reported')}: {_num(row.get('cagr_pct'))}% "
                         f"a year, {_num(row.get('last_value'))} in {row.get('last_year')}")
    if data.get("note"):
        lines.append(f"  {data['note']}")
    lines.append(f"  source: {data.get('source', DATASET)}")
    return "\n".join(lines)


class WorldBankAgent(AcpAgent):
    name = "worldbank"
    title = "World Bank - a country's numbers, side by side, and how fast they move"
    version = "1.0.0"

    def __init__(self, connection=None, data: WorldBankData | None = None,
                 gateway=None) -> None:
        super().__init__(connection)
        self.data = data or WorldBankData()
        # The licence check lives on the gateway, not here, so deleting a line
        # from this repository buys nobody the answer.
        self.gateway = gateway or GatewayClient()

    # -- ACP ---------------------------------------------------------------

    def new_session(self, session) -> dict:
        session.remember("agent", "World Bank session opened. " + HELP.splitlines()[0])
        return {}

    def prompt(self, ctx: SessionContext, prompt: list[dict]) -> str:
        text = prompt_text(prompt)
        skill, params = route(text)
        ctx.plan([
            (f"Route the request ({skill})", "high"),
            ("Read the World Bank's Open Data API", "medium"),
            ("Report the figure, the year and the indicator id", "medium"),
        ])

        if skill == "help":
            ctx.stream_text(HELP)
            ctx.message("A missing year is missing, not zero. I print the year every figure "
                        "belongs to.")
            return STOP_END_TURN

        tool = f"call_{skill.replace('-', '_')}"
        ctx.tool_call(tool, "Read the World Bank's Open Data API", kind="fetch", name=skill,
                      raw_input=dict(params))
        if not ctx.ask_permission(tool, "Allow Worldbank to read the World Bank's public data?",
                                  remember_key=PERMISSION_KEY):
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content("permission denied"))
            ctx.message("I need permission to read the World Bank's data first.")
            return STOP_REFUSAL
        ctx.tool_call_update(tool, status="in_progress")

        try:
            if skill == "worldbank-growth":
                return self._run_skill(ctx, params, tool)
            #: A question that does not name an indicator id gets its subject looked up
            #: in the real catalogue, so "New Zealand population" is the population series
            #: and not whatever the default happens to be.
            if not params.get("indicator") and skill in ("worldbank-value", "worldbank-series",
                                                         "worldbank-compare", "worldbank-growth"):
                params["indicator"] = self._indicator_for(text, params)
                if not params["indicator"]:
                    raise ValueError(
                        "tell me which indicator, either by id like NY.GDP.PCAP.CD or by "
                        "words, for example life expectancy at birth")
            if skill == "worldbank-value":
                found = self.data.value(params["country"], params["indicator"])
                body = render_value(found)
                summary = f"{found['country']['name']} {found['indicator']['id']} " \
                          f"{found['year']}: {_num(found['value'])}"
            elif skill == "worldbank-compare":
                found = self.data.compare(params["countries"], params["indicator"])
                body = render_compare(found)
                summary = f"{len(found['rows'])} countries on {found['indicator_id']}"
            elif skill == "worldbank-series":
                series = self.data.series(params["country"], params["indicator"],
                                          years=params.get("years") or 10)
                body = render_series(series)
                summary = (f"{series['country']['name']} {series['indicator']['id']}: "
                           f"{len(series['values'])} year(s)")
            else:
                found = self.data.search_indicators(params["term"], limit=8)
                body = render_indicators(found)
                summary = f"{len(found['indicators'])} indicator(s) for {found['term']!r}"
        except (WorldBankError, GatewayError, ValueError) as exc:
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content(str(exc)))
            ctx.message(f"I could not read the World Bank's data: {exc}")
            return STOP_END_TURN

        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(summary))
        ctx.stream_text(body + "\n")
        ctx.message(f"\nSource: {DATASET}, read live. The collection searched is source "
                    f"{WDI_SOURCE} (World Development Indicators). A year with no value is a "
                    "year the Bank has not reported, which is not the same as a zero, and the "
                    "newest year differs from country to country because reporting lags.")
        return STOP_END_TURN

    def _indicator_for(self, text: str, params: dict) -> str | None:
        """The indicator id a question means, resolved against the catalogue."""
        countries = params.get("countries") or ([params["country"]] if params.get("country") else [])
        subject = subject_from_text(text, countries)
        if not subject:
            return None
        found = self.data.search_indicators(subject, limit=1)
        return found["indicators"][0]["id"] if found["indicators"] else None

    def _run_skill(self, ctx: SessionContext, params: dict, tool: str) -> str:
        """The premium skill. The licence is checked on the gateway, not here."""
        arguments: dict = {"country": params["country"], "indicator": params["indicator"],
                           "years": int(params.get("years") or 10)}
        if params.get("peers"):
            arguments["compare_with"] = list(params["peers"])[:8]

        data, refused = premium_call(self.gateway, "worldbank_growth", arguments,
                                    {"agent": "worldbank"})
        if refused:
            # Already an (answer, artifact) pair, worded by the gateway.
            answer, artifact = refused
            ctx.tool_call_update(tool, status="completed",
                                 content=ctx.text_content(artifact["summary"]))
            ctx.stream_text(answer + "\n")
            ctx.message("That is a premium skill, so the answer comes from the licence gateway. "
                        "The wording above is the gateway's own.")
            return STOP_END_TURN

        if not isinstance(data, dict) or not data.get("years_used"):
            answer, artifact = empty_premium_answer(
                "The licence gateway did not send back a growth rate for that country.",
                {"agent": "worldbank"})
            ctx.tool_call_update(tool, status="completed",
                                 content=ctx.text_content(artifact["summary"]))
            ctx.stream_text(answer + "\n")
            ctx.message("I could not read a growth figure out of what the gateway sent.")
            return STOP_END_TURN

        body = render_growth(data)
        summary = (f"{data.get('country', '?')}: {data.get('cagr_pct')}% a year over "
                   f"{data.get('years_used', 0)} year(s)")
        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(summary))
        ctx.stream_text(body + "\n")
        ctx.message("\nSource: World Bank, computed on the licence gateway. A compound rate is "
                    "arithmetic on the first and last values of the window, so a year the Bank "
                    "skipped changes the rate, and the peer rows are the same calculation for "
                    "each country rather than a ranking the Bank publishes.")
        return STOP_END_TURN

    def on_cancel(self, session) -> None:
        return None  # one read, one answer


def main(argv=None) -> int:
    import logging

    logging.basicConfig(level=logging.INFO, stream=sys.stderr,
                        format="%(asctime)s %(levelname)s %(name)s %(message)s")
    try:
        WorldBankAgent().run()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
