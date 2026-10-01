"""Dailymed - the official FDA label for a drug, from the label itself.

Every prescription drug in the US has a Structured Product Label on DailyMed, and
DailyMed publishes it keyless. "show me the official label for LIPITOR" answers with
who files each label, when it was last published, and its own table of contents, then
prints the section asked for straight out of the label document. One drug usually has
several labels from different manufacturers, and comparing them is the premium skill.
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

from data import (DATASET, SECTION_PATTERN, DrugLabelData, DrugLabelError,  # noqa: E402
                  DrugLabelNotFound, manufacturer_from_title, phrase_pattern,
                  section_from_text)

HELP = (
    "I read DailyMed's official FDA drug labels (keyless). Ask me:\n"
    "  - show me the official label for LIPITOR\n"
    "  - what does the LIPITOR label say about drug interactions?\n"
    "  - what sections are in the label for ELIQUIS?\n"
    "  - labels from Pfizer\n"
    "One drug usually has more than one label, one per manufacturer, and they are not\n"
    "interchangeable - LIPITOR has three here - so every answer names whose label it is\n"
    "reading rather than quietly picking one.\n"
    "The section text comes out of the label document itself, so it is the FDA-approved\n"
    "wording and not a summary. A label is not medical advice and not a substitute for\n"
    "a pharmacist. Comparing the same drug's labels across manufacturers is a premium\n"
    "skill."
)

PERMISSION_KEY = "dailymed-read-dailymed-labels"

SKILLS = ("dailymed-search", "dailymed-sections", "dailymed-section",
          "dailymed-compare", "help")

_DRUG_WORDS = re.compile(r"\b(label|labels|prescribing information|package insert|"
                         r"drug|drugs|medicine|medication|medications|pharmacology|"
                         r"dosage|indications|contraindications|side effects|adverse|"
                         r"interactions|dailymed|fda|pi sheet)\b", re.IGNORECASE)
_LABELER_RE = re.compile(r"\b(?:labels?|labels? from|from|by|filed by|made by)\s+"
                         r"([A-Z][A-Za-z.&' -]{2,60})\b")
_SECTIONS_ONLY = re.compile(r"\b(what sections|which sections|sections|table of contents|"
                            r"contents|outline|toc|list the sections)\b", re.IGNORECASE)


#: A section name, taken straight from the one table in data.py so the two cannot drift
#: apart. `section_from_text` turns a match back into the canonical name, which is how
#: a question saying "indication and usage" finds the section the label calls
#: "INDICATIONS & USAGE".
_BARE_SECTION = SECTION_PATTERN
#: A question asking for two or more labels to be *set against each other*. The free
#: skills read one label at a time and name its manufacturer, so a plain "show me the
#: label for LIPITOR" and a plain "what does it say about interactions" stay with them.
#: Nothing else is premium.
_COMPARE_TERMS = ("compare", "comparison", "differ", "differs", "difference",
                  "differences", "versus", "vs", "against", "across", "manufacturers",
                  "manufacturer", "brands", "side by side", "changed", "changes between")
_COMPARE_ALTERNATION = phrase_pattern(_COMPARE_TERMS)
_COMPARE_WORDS = re.compile(r"\b(" + _COMPARE_ALTERNATION + r")", re.IGNORECASE)
_BARE_COMPARE = re.compile(_COMPARE_ALTERNATION, re.IGNORECASE)

_OTHER_WORDS = re.compile(r"\b(weather|forecast|tide|earthquake|stock price|crypto|"
                          r"water table|asteroid|stargazing|satellite|water level|"
                          r"radiation level)\b", re.IGNORECASE)
_JUNK = re.compile(
    r"\b(?:show|find|get|give|list|search|look up|pull up|open|what(?:'s| is| are)?|"
    r"which|tell me about|tells|say|says|said|tell|i want|i need|please|"
    r"the|a|an|me|for|of|from|about|with|and|does|do|did|is|are|was|were|"
    r"it|its|this|that|these|those|in|on|to|at|how|why|where|when|"
    r"each other|one another|each|other|between|"
    r"official|label|labels|prescribing information|drug|drugs|medicine|medication|"
    r"section|sections|dailymed|fda|us|usa|table of contents|contents)\b", re.IGNORECASE)


def drug_from_text(text: str) -> str | None:
    """The drug name in the question, with the request words taken out.

    'show me the official label for LIPITOR' asks about 'LIPITOR'. A trailing question
    mark and a section phrase are removed too, so 'what does LIPITOR say about drug
    interactions' still asks about LIPITOR.
    """
    working = re.sub(r"\?+\s*$", "", str(text or "").strip())
    working = _BARE_SECTION.sub(" ", working)
    working = _BARE_COMPARE.sub(" ", working)
    working = _JUNK.sub(" ", working)
    working = re.sub(r"[^\w\s'-]", " ", working, flags=re.UNICODE)
    working = re.sub(r"\s+", " ", working).strip()
    return working or None


def labeler_from_text(text: str) -> str | None:
    """A manufacturer name, when the question names one."""
    match = _LABELER_RE.search(str(text or ""))
    if not match:
        return None
    name = match.group(1).strip(" .,-")
    #: 'labels from what' is a question, not a manufacturer.
    if not name or name.lower() in ("what", "which", "who", "the", "all", "every"):
        return None
    return name

def route(text: str) -> tuple[str, dict]:
    """Deterministic intent routing: (skill, params). Pure function, easy to test."""
    stripped = str(text or "").strip()
    if not stripped or re.search(r"\b(help|what can you do|commands?)\b", stripped, re.IGNORECASE):
        return "help", {}
    if _OTHER_WORDS.search(stripped) and not _DRUG_WORDS.search(stripped):
        return "help", {}

    drug = drug_from_text(stripped)
    labeler = labeler_from_text(stripped)
    #: 'labels from Pfizer' names a manufacturer, not a drug, so the leftover word is
    #: the maker and must not also be sent as the drug to search for.
    if labeler and drug and drug.strip().lower() == labeler.strip().lower():
        drug = None
    section = section_from_text(stripped)

    if not drug and not labeler:
        return "help", {}

    # Checked first, and narrow on purpose: two or more labels set against each other.
    # A single-label question falls through to the free skills below.
    if _COMPARE_WORDS.search(stripped) and (drug or labeler):
        params: dict = {"section": section}
        if drug:
            params["drug"] = drug
        if labeler:
            params["labeler"] = labeler
        return "dailymed-compare", params

    if drug:
        params = {"drug": drug}
        if section:
            params["section"] = section
        #: A manufacturer in the question narrows the search rather than replacing it,
        #: because one drug really does have a label per manufacturer.
        if labeler:
            params["labeler"] = labeler
        if _SECTIONS_ONLY.search(stripped) and not section:
            return "dailymed-sections", params
        if section:
            return "dailymed-section", params
        return "dailymed-search", params

    return "dailymed-search", {"labeler": labeler}


def _num(value, digits: int = 2) -> str:
    """A number for a line of text, or the honest 'not reported'."""
    if value is None or value == "":
        return "not reported"
    try:
        text = f"{float(value):.{digits}f}"
    except (TypeError, ValueError):
        return str(value)
    if "." in text:
        text = text.rstrip("0").rstrip(".")
    return text or "0"


def _where(label: dict) -> str:
    """Whose label this is, and when it was last published."""
    bits = []
    if label.get("manufacturer"):
        bits.append(label["manufacturer"])
    if label.get("published_date"):
        bits.append(f"published {label['published_date']}")
    if label.get("spl_version") is not None:
        bits.append(f"version {label['spl_version']}")
    return ", ".join(bits) or "no publisher or date reported"


def render_search(found: dict) -> str:
    """Every label DailyMed holds for a drug, newest first."""
    what = (f"held by {found['labeler']!r}" if found.get("labeler")
            else f"named {found['query']!r}")
    lines = [f"DailyMed drug labels {what}: {found['returned']} of "
             f"{_num(found.get('total_elements'), 0)}"]
    if found.get("db_published"):
        lines.append(f"  DailyMed's index was last updated {found['db_published']}")
    for label in found["labels"][:15]:
        lines.append(f"  {label.get('title') or '(untitled label)'}")
        lines.append(f"    {_where(label)} | setid {label['setid']}")
    if len(found["labels"]) > 15:
        lines.append(f"    ... and {len(found['labels']) - 15} more label(s)")
    makers = sorted({label["manufacturer"] for label in found["labels"]
                     if label.get("manufacturer")})
    if len(makers) > 1:
        lines.append(f"  {len(makers)} manufacturer(s) file this drug: {', '.join(makers)}")
    lines.append("  these are separate FDA-approved labels, not copies of one another; ask "
                 "for the one from a named manufacturer to read that manufacturer's wording")
    return "\n".join(lines)


def render_sections(index: dict) -> str:
    """A label's own table of contents."""
    lines = [f"{index['setid']}: {index['section_count']} section(s) in the label"]
    if index.get("effective_time"):
        lines.append(f"  label effective {index['effective_time']}"
                     + (f", version {index['version']}" if index.get("version") else ""))
    lines.append(f"  {_num(index.get('total_chars'), 0)} characters of label text in total")
    lines.append(f"  {index['url']}")
    for row in index["sections"][:40]:
        name = row["display_name"] or row["title"] or "untitled section"
        heading = f" - {row['title']}" if row["title"] and row["title"] != name else ""
        lines.append(f"    {name}{heading} ({_num(row['chars'], 0)} chars)")
    if len(index["sections"]) > 40:
        lines.append(f"    ... and {len(index['sections']) - 40} more section(s)")
    return "\n".join(lines)


def render_section(section: dict) -> str:
    """One section, printed as the label writes it."""
    name = section.get("display_name") or section.get("section_title") or "the section"
    lines = [f"{name}  ({section.get('code') or 'code not reported'}) from label "
             f"{section['setid']}"]
    if section.get("label_title"):
        lines.append(f"  label: {section['label_title']}")
    when = section.get("section_effective_time") or section.get("effective_time")
    if when:
        lines.append(f"  this section is effective {when}"
                     + (f", the label as a whole {section['effective_time']}"
                        if section.get("effective_time") and section["effective_time"] != when
                        else ""))
    lines.append(f"  {_num(section['chars'], 0)} characters of FDA-approved wording"
                 + (", the tail is cut here" if section.get("truncated") else ""))
    lines.append("")
    lines.append(section["text"] or "(this section has no text)")
    return "\n".join(lines)


def render_compare(data: dict) -> str:
    """The same drug's labels, set against each other section by section."""
    drug = data.get("drug", "not reported")
    labels = data.get("labels") or []
    lines = [f"{drug} - {data.get('labels_compared', len(labels))} label(s) compared, "
             f"{data.get('sections_compared', 0)} section(s) in common"]
    if data.get("labeler"):
        lines.append(f"  narrowed to manufacturer {data['labeler']!r}")
    for label in labels[:10]:
        lines.append(f"  {label.get('manufacturer') or 'manufacturer not reported'}: "
                     f"published {label.get('published_date') or 'not reported'}, "
                     f"{_num(label.get('section_count'), 0)} section(s), "
                     f"{_num(label.get('total_chars'), 0)} characters of label text")
        if label.get("setid"):
            lines.append(f"    setid {label['setid']}")
    differing = data.get("differing_sections") or []
    lines.append(f"  sections that differ between labels: {_num(len(differing), 0)}")
    for row in differing[:12]:
        lines.append(f"    {row.get('name') or 'untitled section'}: "
                     f"{_num(row.get('labels_with_it'), 0)} of "
                     f"{_num(data.get('labels_compared'))} label(s) carry it")
        if row.get("chars_by_label"):
            spread = ", ".join(f"{_num(chars, 0)}" for chars in row["chars_by_label"])
            lines.append(f"      characters per label: {spread}")
    only = data.get("sections_in_one_label_only") or []
    if only:
        lines.append(f"  present in one label only: {'; '.join(str(name) for name in only[:8])}")
    lines.append(f"  source: {data.get('source', 'not reported')}")
    return "\n".join(lines)


class DailymedAgent(AcpAgent):
    name = "dailymed"
    title = "Dailymed - the official FDA label for a drug"
    version = "1.0.0"

    def __init__(self, connection=None, data: DrugLabelData | None = None,
                 gateway=None) -> None:
        super().__init__(connection)
        self.data = data or DrugLabelData()
        # The licence check lives on the gateway, not here, so deleting a line
        # from this repository buys nobody the answer.
        self.gateway = gateway or GatewayClient()

    # -- ACP ---------------------------------------------------------------

    def new_session(self, session) -> dict:
        session.remember("agent", "Dailymed session opened. " + HELP.splitlines()[0])
        return {}

    def prompt(self, ctx: SessionContext, prompt: list[dict]) -> str:
        text = prompt_text(prompt)
        skill, params = route(text)
        ctx.plan([
            (f"Route the request ({skill})", "high"),
            ("Read DailyMed's label index and the label document", "medium"),
            ("Report who files it, when, and the section's own text", "medium"),
        ])

        if skill == "help":
            ctx.stream_text(HELP)
            ctx.message("DailyMed is keyless. Only the cross-label comparison is premium.")
            return STOP_END_TURN

        tool = f"call_{skill.replace('-', '_')}"
        ctx.tool_call(tool, "Read DailyMed's labels", kind="fetch", name=skill,
                      raw_input=dict(params))
        if not ctx.ask_permission(tool, "Allow Dailymed to read DailyMed's public labels?",
                                  remember_key=PERMISSION_KEY):
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content("permission denied"))
            ctx.message("I need permission to read DailyMed's labels first.")
            return STOP_REFUSAL
        ctx.tool_call_update(tool, status="in_progress")

        try:
            if skill == "dailymed-compare":
                return self._run_skill(ctx, params, tool)
            if skill == "dailymed-sections":
                labels = self._labels_for(params)
                index = self.data.label_index(labels[0]["setid"])
                body = render_sections(index)
                summary = (f"{labels[0].get('manufacturer') or labels[0]['setid']}: "
                           f"{index['section_count']} section(s)")
            elif skill == "dailymed-section":
                labels = self._labels_for(params)
                section = self.data.section(labels[0]["setid"], params.get("section"))
                body = render_section(section)
                summary = (f"{section.get('display_name') or 'section'} from "
                           f"{labels[0].get('manufacturer') or labels[0]['setid']}")
            else:
                found = self.data.search(params.get("drug"),
                                         labeler=params.get("labeler"))
                body = render_search(found)
                summary = (f"{found['query'] or found['labeler']}: {found['returned']} label(s)")
        except (DrugLabelError, GatewayError, ValueError) as exc:
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content(str(exc)))
            ctx.message(f"I could not read DailyMed's labels: {exc}")
            return STOP_END_TURN

        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(summary))
        ctx.stream_text(body + "\n")
        ctx.message(f"\nSource: {DATASET}, read live. The section text is the label's own "
                    "FDA-approved wording, not a summary of it, and it is only as current as "
                    "the date the label was last published. This is reference information, not "
                    "medical advice: doses, interactions and who should not take a drug are a "
                    "pharmacist's call, not a search result's.")
        return STOP_END_TURN

    def _labels_for(self, params: dict) -> list[dict]:
        """The label a question means: the newest one for that drug, or for that maker."""
        found = self.data.search(params.get("drug"), labeler=params.get("labeler"))
        return found["labels"]

    def _run_skill(self, ctx: SessionContext, params: dict, tool: str) -> str:
        """The premium skill. The licence is checked on the gateway, not here."""
        arguments: dict = {}
        if params.get("drug"):
            arguments["drug"] = str(params["drug"])
        if params.get("labeler"):
            arguments["labeler"] = str(params["labeler"])
        if params.get("section"):
            arguments["section"] = str(params["section"])

        data, refused = premium_call(self.gateway, "dailymed_label_comparison_board", arguments,
                                    {"agent": "dailymed"})
        if refused:
            # Already an (answer, artifact) pair, worded by the gateway.
            answer, artifact = refused
            ctx.tool_call_update(tool, status="completed",
                                 content=ctx.text_content(artifact["summary"]))
            ctx.stream_text(answer + "\n")
            ctx.message("That is a premium skill, so the answer comes from the licence gateway. "
                        "The wording above is the gateway's own.")
            return STOP_END_TURN

        if not isinstance(data, dict) or "labels" not in data:
            answer, artifact = empty_premium_answer(
                "The licence gateway did not send back a label comparison.",
                {"agent": "dailymed"})
            ctx.tool_call_update(tool, status="completed",
                                 content=ctx.text_content(artifact["summary"]))
            ctx.stream_text(answer + "\n")
            ctx.message("I could not read a comparison out of what the gateway sent.")
            return STOP_END_TURN

        body = render_compare(data)
        summary = (f"{data.get('drug', 'not reported')}: {data.get('labels_compared', 0)} label(s), "
                   f"{len(data.get('differing_sections') or [])} section(s) differ")
        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(summary))
        ctx.stream_text(body + "\n")
        ctx.message(f"\nSource: {data.get('source', DATASET)}, compared on the licence gateway. "
                    "A character count is not a measure of safety: a longer section can mean a "
                    "stricter trial requirement or a new warning, and only someone who reads "
                    "both labels can say which. Two manufacturers' wording may differ and both "
                    "may be perfectly current.")
        return STOP_END_TURN

    def on_cancel(self, session) -> None:
        return None  # one index read, one answer


def main(argv=None) -> int:
    import logging

    logging.basicConfig(level=logging.INFO, stream=sys.stderr,
                        format="%(asctime)s %(levelname)s %(name)s %(message)s")
    try:
        DailymedAgent().run()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
