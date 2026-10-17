"""Companies - the legal entity behind a name, and who owns it.

GLEIF hands out the Legal Entity Identifier, a 20-character code that says which legal
entity a bank is dealing with, and almost nobody asks it anything. "what is Apple's LEI?"
gets the real legal name, the country, the registration number and the date the identifier
was first issued; "who owns this legal entity?" walks what the registry itself records.

The question the free skills do not answer is "which one is it?" - a broad name matches
hundreds of entities in hundreds of countries, and answering that means reading across
every page of the match and counting. That is a separate skill, licensed on the gateway.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from acp_kit import STOP_END_TURN, STOP_REFUSAL, AcpAgent, SessionContext, prompt_text

from data import (DATASET, PAGE_SIZE, CompaniesData, CompaniesError,  # noqa: E402
                  CompaniesNotFound, lei_from_text, name_from_text)

HELP = (
    "I read the GLEIF registry of Legal Entity Identifiers (keyless). Ask me:\n"
    "  - what is Apple's LEI?\n"
    "  - look up LEI 549300APXY32KXB1KC12\n"
    "  - who owns Bank of America National Association?\n"
    "  - what subsidiaries does Apple Inc. own?\n"
    "  - which Apple is it, and how many are there? (not implemented here)\n"
    "A legal name search is a *contains* match, so a broad name matches a lot: I rank what\n"
    "comes back - exact name, then a name starting with yours, then one containing it - and\n"
    "tell you how many entities share the name. An LEI identifies a legal entity, not a brand,\n"
    "so one company can have several and two companies can share a name."
)

PERMISSION_KEY = "companies-read-gleif"

SKILLS = ("companies-lookup", "companies-record", "companies-owners", "companies-group",
          "companies-resolve", "help")

#: Ownership words: who is above this entity in the registry's own tree. A subsidiary word
#: is *not* here - "what subsidiaries does X own" asks what the entity owns, not who owns it.
_OWNER_WORDS = re.compile(r"\b(who owns|who owns|owner of|owners of|owned by|parent|"
                          r"ultimate parent|ownership|owned)\b", re.IGNORECASE)
_CHILD_WORDS = re.compile(r"\b(subsidiar\w+|subs|child|children|group|what does .* own|"
                          r"what companies does|companies it owns|entities it owns)\b",
                          re.IGNORECASE)

#: Disambiguating a name is the aggregate question, and the aggregate is the paywall.
_RESOLVE_WORDS = re.compile(
    r"\b(which|who)\s+(?:one\s+of\s+)?(?:these\s+)?(?:apple|them|companies|entities|"
    r"companies is it|company is it|entity is it)\b"
    r"|\bhow many\b.*\b(?:entit(?:y|ies)|compan(?:y|ies)|lei|records?|named|called)\b"
    r"|\bresolve\b|\bdisambiguate\b|\bacross countries\b|\bby country\b|\bcountry breakdown\b"
    r"|\ball (?:the )?(?:entities|companies|records)\b|\bin the registry\b",
    re.IGNORECASE)

#: A question about the registry at all. Without it, "tell me a joke" is not a lookup.
_ENTITY_WORDS = re.compile(
    r"\b(lei|company|companies|corporation|corp|inc|llc|ltd|plc|entity|entities|"
    r"legal entit\w+|registrant|registration|gleif|registry|identifier|identifiers|"
    r"record|records|subsidiary|subsidiaries|owner|owners|own|owns|owned|ownership|parent|"
    r"business|firm|bank|holding|holdings|group|association)\b", re.IGNORECASE)

_COUNT_RE = re.compile(r"\b(?:top|first|show|list|how many)\s+(\d{1,3})\b", re.IGNORECASE)


def route(text: str) -> tuple[str, dict]:
    """Deterministic intent routing: (skill, params). Pure function, easy to test."""
    stripped = str(text or "").strip()
    if not stripped or re.search(r"\b(help|what can you do|commands?)\b", stripped, re.IGNORECASE):
        return "help", {}
    #: A disambiguating question is about entities whether or not it says so: "which
    #: Apple is it" names none, and the resolve branch is the one that answers it.
    if not (_ENTITY_WORDS.search(stripped) or _RESOLVE_WORDS.search(stripped)):
        return "help", {}

    lei = lei_from_text(stripped)
    limit = int(_COUNT_RE.search(stripped).group(1)) if _COUNT_RE.search(stripped) else 10
    limit = max(1, min(limit, 100))
    name = name_from_text(stripped)

    if lei:
        skill = "companies-group" if _CHILD_WORDS.search(stripped) else (
            "companies-owners" if _OWNER_WORDS.search(stripped) else "companies-record")
        return skill, {"lei": lei}
    if not name:
        return "help", {}
    #: Children first: "what subsidiaries does X own" is a question about X's children, and
    #: the only word in it that looks like ownership is "owns".
    if _CHILD_WORDS.search(stripped):
        return "companies-group", {"name": name, "limit": limit}
    if _OWNER_WORDS.search(stripped):
        return "companies-owners", {"name": name}
    if _RESOLVE_WORDS.search(stripped):
        return "companies-resolve", {"name": name, "limit": limit}
    return "companies-lookup", {"name": name, "limit": limit}


def _short(value, width: int = 60) -> str:
    """A field for a line of text, or the honest 'not reported'."""
    if value is None or value == "":
        return "not reported"
    text = str(value)
    return text if len(text) <= width else text[:width - 3].rstrip() + "..."


def render_lookup(found: dict) -> str:
    """The records that matched a name, best match first."""
    lines = [f"{len(found['records'])} of {found['total']} GLEIF record(s) whose legal name "
             f"contains {found['query']!r}"]
    for row in found["records"]:
        lines.append(f"  {row['name']}")
        bits = [f"LEI {row['id']}"]
        if row["status"]:
            bits.append(row["status"])
        if row["jurisdiction"]:
            bits.append(row["jurisdiction"])
        if row["category"]:
            bits.append(row["category"].replace("_", " ").lower())
        lines.append("    " + ", ".join(bit for bit in bits if bit))
        lines.append(f"    {row['url']}")
    if not found["records"]:
        lines.append("  GLEIF holds no record whose legal name contains that")
    if found["total"] and found["total"] > found["read"]:
        lines.append(f"  (GLEIF holds {found['total']} in total; I ranked the {found['read']} "
                     f"that came back in one page of {PAGE_SIZE})")
    return "\n".join(lines)


def render_record(row: dict) -> str:
    """One legal entity, everything the registry records about it."""
    lines = [f"{row['name']}"]
    lines.append(f"  LEI: {row['id']}")
    if row["status"]:
        lines.append(f"  status: {row['status']}")
    if row["jurisdiction"]:
        lines.append(f"  jurisdiction of incorporation: {row['jurisdiction']}")
    if row["category"]:
        lines.append(f"  category: {row['category'].replace('_', ' ').lower()}"
                     + (f", {row['sub_category'].replace('_', ' ').lower()}"
                        if row.get("sub_category") else ""))
    if row["registered_as"]:
        lines.append(f"  registered as: {_short(row['registered_as'], 40)}")
    if row["created"]:
        lines.append(f"  incorporated: {row['created']}")
    where = [bit for bit in (row["city"] and f"city {row['city']}",
                             row["country"] and f"country {row['country']}") if bit]
    if where:
        lines.append("  legal address: " + ", ".join(where)
                     + (f" {row['postal_code']}" if row.get("postal_code") else ""))
    if row["first_known"]:
        lines.append(f"  LEI first issued: {row['first_known']}")
    if row["last_updated"]:
        lines.append(f"  record last updated: {row['last_updated']}")
    if row["next_renewal"]:
        lines.append(f"  next renewal: {row['next_renewal']}")
    if row["corroboration"]:
        lines.append(f"  corroboration: {row['corroboration'].replace('_', ' ').lower()}")
    if row["other_names"]:
        lines.append("  other names: " + "; ".join(row["other_names"][:5]))
    if row["registered_at"]:
        lines.append(f"  registered at (LOU): {row['registered_at']}")
    lines.append(f"  {row['url']}")
    return "\n".join(lines)


def render_owners(resolved: dict) -> str:
    """Who the registry records as above this entity."""
    row = resolved["lei"]
    lines = [f"{row['name']} (LEI {row['id']})"]
    if not resolved["parents"]:
        lines.append("  GLEIF's record for this entity names no parent and no ultimate parent.")
        lines.append("  That is the registry's own answer, not a gap here: an LEI is issued per")
        lines.append("  legal entity and most of them sit outside any corporate tree.")
    for parent in resolved["parents"]:
        lines.append(f"  {('direct parent' if parent.get('lookup') == 'read' else 'parent')}: "
                     f"{parent.get('name') or 'not reported'}")
        bits = [f"LEI {parent.get('id')}"]
        if parent.get("status"):
            bits.append(parent["status"])
        if parent.get("jurisdiction"):
            bits.append(parent["jurisdiction"])
        lines.append("    " + ", ".join(bit for bit in bits if bit))
    if row.get("direct_children"):
        lines.append(f"  direct subsidiaries recorded: {len(row['direct_children'])}")
    if row.get("ultimate_children"):
        lines.append(f"  ultimate subsidiaries recorded: {len(row['ultimate_children'])}")
    lines.append(f"  {row['url']}")
    return "\n".join(lines)


def render_group(found: dict) -> str:
    """What one entity owns, as the record lists it."""
    row = found["lei"]
    lines = [f"{row['name']} (LEI {row['id']}) - subsidiaries in GLEIF's record"]
    for label, key, total in (("direct", "direct_children", found["direct_count"]),
                              ("ultimate", "ultimate_children", found["ultimate_count"])):
        children = found[key]
        if not children:
            lines.append(f"  {label} subsidiaries: none recorded")
            continue
        lines.append(f"  {label} subsidiaries: {total} recorded, showing {len(children)}")
        for child in children:
            lines.append(f"    {child.get('name') or 'name not reported'} "
                         f"(LEI {child.get('id') or 'not reported'})")
    lines.append(f"  {row['url']}")
    return "\n".join(lines)


def _num(value) -> str:
    """A number for a line of text, or the honest 'not reported'."""
    if value is None or value == "":
        return "not reported"
    try:
        return f"{float(value):g}"
    except (TypeError, ValueError):
        return str(value)


def render_resolve(data: dict) -> str:
    """One name, every entity that answers to it, and which one is the likely answer."""
    lines = [f"resolving {data.get('name', 'not reported')!r} across the GLEIF registry"]
    lines.append(f"  records read: {data.get('records_read', 0)}"
                 + (f" of {data.get('records_matching', 0)} that match the name"
                    if data.get("records_matching") else ""))
    resolved = data.get("resolved") or {}
    if resolved.get("id"):
        lines.append(f"  most likely: {resolved.get('name')}")
        lines.append(f"    LEI {resolved['id']}, "
                     f"{_short(resolved.get('status'))}, "
                     f"{_short(resolved.get('jurisdiction'))}")
        if data.get("share_of_matches_pct") is not None:
            lines.append(f"    {_num(data['share_of_matches_pct'])}% of the records read carry "
                         "exactly this legal name")
    countries = data.get("countries") or []
    if countries:
        lines.append("  where those records sit:")
        for row in countries[:10]:
            lines.append(f"    {_short(row.get('country'), 24):<26} {row.get('records', 0)} "
                         f"record(s)")
    others = data.get("other_names") or []
    if others:
        lines.append("  the other legal names that matched:")
        for row in others[:8]:
            lines.append(f"    {_short(row.get('name'), 52)} - {_short(row.get('jurisdiction'), 16)}"
                         f", {_short(row.get('status'), 12)}")
    if data.get("note"):
        lines.append(f"  {data['note']}")
    lines.append(f"  source: {data.get('source', DATASET)}")
    return "\n".join(lines)


class CompaniesAgent(AcpAgent):
    name = "companies"
    title = "Companies - the legal entity behind a name, its LEI, and who owns it"
    version = "1.0.0"

    def __init__(self, connection=None, data: CompaniesData | None = None,
                 gateway=None) -> None:
        super().__init__(connection)
        self.data = data or CompaniesData()
        self.gateway = gateway

    # -- ACP ---------------------------------------------------------------

    def new_session(self, session) -> dict:
        session.remember("agent", "Companies session opened. " + HELP.splitlines()[0])
        return {}

    def prompt(self, ctx: SessionContext, prompt: list[dict]) -> str:
        text = prompt_text(prompt)
        skill, params = route(text)
        ctx.plan([
            (f"Route the request ({skill})", "high"),
            ("Read the GLEIF registry", "medium"),
            ("Report the legal name, the LEI and the jurisdiction", "medium"),
        ])

        if skill == "help":
            ctx.stream_text(HELP)
            ctx.message("An LEI names a legal entity, not a brand. One company can have several.")
            return STOP_END_TURN

        tool = f"call_{skill.replace('-', '_')}"
        ctx.tool_call(tool, "Read the GLEIF registry", kind="fetch", name=skill,
                      raw_input=dict(params))
        if not ctx.ask_permission(tool, "Allow Companies to read GLEIF's public registry?",
                                  remember_key=PERMISSION_KEY):
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content("permission denied"))
            ctx.message("I need permission to read GLEIF's registry first.")
            return STOP_REFUSAL
        ctx.tool_call_update(tool, status="in_progress")

        try:
            if skill == "companies-resolve":
                return self._run_skill(ctx, params, tool)
            if skill == "companies-record":
                row = self.data.record(params["lei"])
                body = render_record(row)
                summary = f"{row['name']}: {row['id']}"
            elif skill in ("companies-owners", "companies-group"):
                lei = params.get("lei") or self._lei_for(params["name"])
                if skill == "companies-group":
                    found = self.data.subsidiaries(lei, limit=params.get("limit") or 25)
                    body = render_group(found)
                    summary = (f"{found['lei']['name']}: {found['direct_count']} direct, "
                               f"{found['ultimate_count']} ultimate subsidiaries")
                else:
                    resolved = self.data.resolve(lei)
                    body = render_owners(resolved)
                    summary = (f"{resolved['lei']['name']}: {len(resolved['parents'])} parent(s), "
                               f"{len(resolved['lei']['direct_children'])} subsidiaries")
            else:
                found = self.data.search_name(params["name"], limit=params.get("limit") or 10)
                body = render_lookup(found)
                summary = (f"{len(found['records'])} of {found['total']} GLEIF record(s) for "
                           f"{found['query']!r}")
        except (CompaniesError, ValueError) as exc:
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content(str(exc)))
            ctx.message(f"I could not read the GLEIF registry: {exc}")
            return STOP_END_TURN

        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(summary))
        ctx.stream_text(body + "\n")
        ctx.message(f"\nSource: {DATASET}, read live. A legal name search is a contains match, so "
                    "a common name matches many entities; the ranking above is the order that "
                    "came back, and an LEI identifies a legal entity rather than a brand.")
        return STOP_END_TURN

    def _lei_for(self, name: str) -> str:
        """The LEI of the best match for a name, so an ownership question can be asked
        without the caller having to know the 20-character code."""
        found = self.data.search_name(name, limit=1)
        if not found["records"]:
            raise CompaniesNotFound(f"GLEIF holds no record whose legal name contains {name!r}")
        return found["records"][0]["id"]

    def _run_skill(self, ctx: SessionContext, params: dict, tool: str) -> str:
        """Stub: the hosted implementation of this skill was removed in the paywall cleanup."""
        message = 'Not yet implemented: run-skill — its hosted implementation was removed.'
        return message, {"summary": "not implemented", "removed": True}

    def on_cancel(self, session) -> None:
        return None  # one lookup, one answer


def main(argv=None) -> int:
    import logging

    logging.basicConfig(level=logging.INFO, stream=sys.stderr,
                        format="%(asctime)s %(levelname)s %(name)s %(message)s")
    try:
        CompaniesAgent().run()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
