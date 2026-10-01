"""The GLEIF agent: four free skills over the legal-entity index, one premium roll-up.

  - entity-lookup:       a legal entity by its registered name
  - lei-lookup:          one entity from its 20-character LEI
  - ownership:           who a parent owns — every entity whose ultimate parent it is
  - entities-in-country: the legal entities registered in one country
  - group-rollup:        a parent rolled up across its whole group (premium)

The roll-up is premium because it is the one question the free skills cannot answer
without you doing the work: `ownership` lists the children in one page, and turning
that into a status and country breakdown, with each child's own registration record
read to say how fresh it is, means re-reading every subsidiary. That is done on the
licence gateway, so an unpaid caller gets the gateway's own message and no roll-up.

An LEI says an entity has filed identifying data with a Local Operating Unit. It is
not a company register: GLEIF holds entities of every kind, and a lapsed LEI means
the record stopped being renewed, not that the entity stopped existing.
"""

from __future__ import annotations

import re

from a2a_kit import GatewayClient, SkillAgent, empty_premium_answer, premium_call

from data import (
    DATASET,
    PRODUCT,
    GleifClient,
    UpstreamError,
)

SKILL_ENTITY_LOOKUP = "entity-lookup"
SKILL_LEI_LOOKUP = "lei-lookup"
SKILL_OWNERSHIP = "ownership"
SKILL_ENTITIES_IN_COUNTRY = "entities-in-country"
SKILL_GROUP_ROLLUP = "group-rollup"

SOURCE = "Global Legal Entity Identifier Foundation (GLEIF)"
MAX_LISTED = 8
GATEWAY_TOOL = "companies_group_rollup"
#: Used when the caller gives a name for a skill that needs an LEI.
BBC_LEI = "5493000IBP32UQZ0KL24"

CARD_SKILLS = [
    {
        "id": SKILL_ENTITY_LOOKUP,
        "name": "Company lookup by name",
        "description": (
            "The legal entities GLEIF holds under an exact registered name, with LEI, status, "
            "jurisdiction, company-registration number, category, other names and registered "
            "address. Give the name as the entity files it."
        ),
        "tags": ["companies", "gleif", "lei", "lookup", "free"],
        "examples": [
            "look up JPMORGAN CHASE & CO.",
            "which legal entities are named Apple Inc?",
            '{"skill": "entity-lookup", "name": "SIEMENS AG", "limit": 5}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_LEI_LOOKUP,
        "name": "LEI to entity",
        "description": (
            "One legal entity from its 20-character Legal Entity Identifier: the registered name, "
            "ACTIVE or INACTIVE, jurisdiction, address, registration dates, the Local Operating "
            "Unit that maintains it, and how well corroborated GLEIF says the data is."
        ),
        "tags": ["companies", "gleif", "lei", "entity", "free"],
        "examples": [
            "what is LEI 8I5DZWZKVSZI1NUHU748?",
            "look up the entity for LEI 5493000IBP32UQZ0KL24",
            '{"skill": "lei-lookup", "lei": "8I5DZWZKVSZI1NUHU748"}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_OWNERSHIP,
        "name": "Who owns whom",
        "description": (
            "Every legal entity in GLEIF whose ultimate parent is a given LEI: the subsidiaries and "
            "branches, with each one's country, status and company-registration number. GLEIF "
            "publishes the parent as a filter rather than as a field, so the parent is what you "
            "search on."
        ),
        "tags": ["companies", "gleif", "ownership", "parent", "subsidiaries", "free"],
        "examples": [
            "who owns the entities under ultimate parent 5493000IBP32UQZ0KL24?",
            "list the subsidiaries of LEI 5493000IBP32UQZ0KL24",
            '{"skill": "ownership", "lei": "5493000IBP32UQZ0KL24", "limit": 20}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_ENTITIES_IN_COUNTRY,
        "name": "Legal entities in a country",
        "description": (
            "The legal entities GLEIF holds whose registered address is in one ISO country code, with "
            "each one's name, status and jurisdiction. Useful for seeing what kind of entity actually "
            "registers an LEI in a given country."
        ),
        "tags": ["companies", "gleif", "country", "entities", "free"],
        "examples": [
            "which legal entities are registered in DE?",
            "show me LEI entities registered in Japan",
            '{"skill": "entities-in-country", "country": "SG", "limit": 10}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_GROUP_ROLLUP,
        "name": "Group roll-up",
        "description": (
            "A parent rolled up across its whole group: how many entities sit under it, how many are "
            "ACTIVE and how many INACTIVE, which countries they are registered in, the subsidiary "
            "whose LEI renews soonest, and each subsidiary's own registration date and corroboration "
            "level read individually. Premium: the roll-up runs behind a licence check on the gateway."
        ),
        "tags": ["companies", "gleif", "group", "rollup", "analysis", "premium"],
        "examples": [
            "roll up the group under ultimate parent 5493000IBP32UQZ0KL24",
            "how is the BBC Worldwide group split by country and status?",
            '{"skill": "group-rollup", "lei": "5493000IBP32UQZ0KL24", "limit": 100}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
]

_LEI_RE = re.compile(r"\b([A-Z0-9]{18}[0-9]{2})\b", re.IGNORECASE)
_COUNTRY_RE = re.compile(r"\b([A-Z]{2})\b")
#: GLEIF filters on the ISO 3166-1 alpha-2 code, but people write country names. These
#: are the ones worth translating; anything else is asked for as a code.
_COUNTRY_NAMES = {
    "argentina": "AR", "australia": "AU", "austria": "AT", "belgium": "BE", "brazil": "BR",
    "canada": "CA", "china": "CN", "denmark": "DK", "finland": "FI", "france": "FR",
    "germany": "DE", "greece": "GR", "hong kong": "HK", "hungary": "HU", "iceland": "IS",
    "india": "IN", "indonesia": "ID", "ireland": "IE", "israel": "IL", "italy": "IT",
    "japan": "JP", "korea": "KR", "luxembourg": "LU", "malaysia": "MY", "mexico": "MX",
    "netherlands": "NL", "new zealand": "NZ", "norway": "NO", "poland": "PL", "portugal": "PT",
    "romania": "RO", "russia": "RU", "saudi arabia": "SA", "singapore": "SG", "south africa": "ZA",
    "spain": "ES", "sweden": "SE", "switzerland": "CH", "taiwan": "TW", "thailand": "TH",
    "turkey": "TR", "ukraine": "UA", "united arab emirates": "AE", "united kingdom": "GB",
    "united states": "US", "vietnam": "VN",
}
_COUNTRY_NAME_RE = re.compile(
    r"\b(" + "|".join(sorted((re.escape(name) for name in _COUNTRY_NAMES), key=len, reverse=True)) + r")\b",
    re.IGNORECASE,
)
_QUOTED_RE = re.compile(r"[\"“]([^\"”]{2,90})[\"”]")
#: Words that describe the question rather than the company being asked about.
_QUERY_STOP = frozenset("""
    a about all an and any are as at be been being but by can could do does did for from
    get give has have how i in into is it its just know like list make many me much my need
    of on one only or please see show so some tell that the their them there these this
    those to up us was were what when where which who whom whose why will with would
    company companies entity entities legal lei leis identifier identifiers look lookup
    find search registered registration register holds hold tell me name names
    parent ultimate subsidiary subsidiaries owns own owned under group roll
""".split())

_PARENT_WORDS = re.compile(
    r"\b(who owns|whom does|what does .{0,30}own|subsidiar(?:y|ies)|owned by|"
    r"ultimate parent|parent (?:company|entity|of)|under (?:the )?(?:lei|parent))\b",
    re.IGNORECASE,
)
_COUNTRY_WORDS = re.compile(
    r"\b(registered in|based in|located in|entities in|companies in|leis in|"
    r"legal entities in|which (?:entities|companies) (?:are )?(?:in|of))\b",
    re.IGNORECASE,
)
#: The roll-up asks for a breakdown across the whole group, not for a list of it.
_ROLLUP_WORDS = re.compile(
    r"\b(roll[- ]?up|group (?:roll[- ]?up|profile|breakdown|summary|structure)|"
    r"break(?:ing)? (?:the )?group down|breakdown (?:of|across) the (?:group|subsidiaries)|"
    r"across the (?:whole )?group|split by (?:country|status)|"
    r"how (?:is|are) the .{0,30}(?:group|subsidiaries) (?:split|broken))\b",
    re.IGNORECASE,
)
_DETAIL_WORDS = re.compile(
    r"\b(detail|details|profile|record|registration|registered|renewal|renew|corroborat\w*|"
    r"how fresh|when does)\b",
    re.IGNORECASE,
)
_LOOKUP_WORDS = re.compile(
    r"\b(look ?up|what is|what's|who is|details? (?:on|of|for)|record for|find)\b",
    re.IGNORECASE,
)

HELP = (
    "I read GLEIF, the global index of legal entities that hold an LEI. Ask me:\n"
    "  • look up JPMORGAN CHASE & CO.\n"
    "  • what is LEI 8I5DZWZKVSZI1NUHU748?\n"
    "  • who owns the entities under ultimate parent 5493000IBP32UQZ0KL24?\n"
    "  • which legal entities are registered in DE?\n"
    "  • roll up the group under 5493000IBP32UQZ0KL24  (premium)\n"
    "A name has to be the one the entity files — GLEIF matches legal names exactly, so a\n"
    "trading name finds nothing. An LEI is not proof a company is trading: it means the\n"
    "entity filed identifying data with a Local Operating Unit."
)


def message_text(message: dict) -> str:
    parts = message.get("parts") or []
    return " ".join(part.get("text", "") for part in parts if part.get("kind") == "text").strip()


def message_data(message: dict) -> dict:
    merged: dict = {}
    for part in message.get("parts") or []:
        if part.get("kind") == "data" and isinstance(part.get("data"), dict):
            merged.update(part["data"])
    return merged


def _first(params: dict, *names, default=None):
    for name in names:
        if name in params and params[name] not in (None, ""):
            return params[name]
    return default


def name_from_text(text: str, name: str | None) -> str | None:
    """A company name only when the text offers one — never the whole question."""
    if name:
        return None
    match = _QUOTED_RE.search(text)
    if match:
        return match.group(1).strip()
    words = [word for word in re.findall(r"[A-Za-z0-9&][A-Za-z0-9.'’&/\-()]*", text)
             if word.lower() not in _QUERY_STOP and not _LEI_RE.fullmatch(word)
             and not _COUNTRY_NAME_RE.fullmatch(word)]
    if len(words) < 2:
        return None
    return " ".join(words[:8]).strip(" .,'’-")


def parse(message: dict) -> dict:
    """Incoming message -> {skill, params, explicit}. Never raises."""
    text = message_text(message)
    data = message_data(message)
    requested = _first(data, "skill", "skill_id")

    lei = _first(data, "lei", "lei_id")
    if lei is None:
        match = _LEI_RE.search(text)
        lei = match.group(1).upper() if match else None
    country = _first(data, "country", "country_code")
    if country is None:
        match = _COUNTRY_RE.search(text)
        if match:
            country = match.group(1)
        else:
            named = _COUNTRY_NAME_RE.search(text)
            country = _COUNTRY_NAMES[named.group(1).lower()] if named else None
    name = _first(data, "name", "company", "entity", "legal_name")
    if name is None:
        name = name_from_text(text, None)
    limit = _first(data, "limit", default=10)

    all_skills = (SKILL_ENTITY_LOOKUP, SKILL_LEI_LOOKUP, SKILL_OWNERSHIP,
                  SKILL_ENTITIES_IN_COUNTRY, SKILL_GROUP_ROLLUP)
    asked_for_rollup = bool(_ROLLUP_WORDS.search(text))
    asked_for_country = bool(_COUNTRY_WORDS.search(text))
    if requested in all_skills:
        skill = requested
    elif asked_for_rollup:
        skill = SKILL_GROUP_ROLLUP
    elif asked_for_country:
        # Routed on the words, not on whether a code was found, so "registered in
        # Japan" asks for the ISO code instead of being answered as a name search.
        skill = SKILL_ENTITIES_IN_COUNTRY
    elif _PARENT_WORDS.search(text):
        skill = SKILL_OWNERSHIP
    elif lei and _DETAIL_WORDS.search(text):
        skill = SKILL_LEI_LOOKUP
    elif lei and _LOOKUP_WORDS.search(text):
        skill = SKILL_LEI_LOOKUP
    elif lei and not name:
        skill = SKILL_LEI_LOOKUP
    else:
        skill = SKILL_ENTITY_LOOKUP

    # A country is only a filter for the country skill: "look up APPLE INC" must not
    # inherit a stray two-letter word as a country.
    if skill != SKILL_ENTITIES_IN_COUNTRY:
        country = None
    # Only the skills that read a name carry one.
    if skill not in (SKILL_ENTITY_LOOKUP,):
        name = None

    params: dict = {"limit": limit}
    for key, value in (("lei", lei), ("country", country), ("name", name)):
        if value is not None:
            params[key] = value
    if skill == SKILL_GROUP_ROLLUP:
        params["limit"] = _first(data, "limit", default=100)
    if not requested and (not text.strip()
                         or re.search(r"\b(help|what can you do|commands?)\b", text, re.IGNORECASE)):
        skill, params = "help", {}
    explicit = bool(requested or asked_for_rollup or asked_for_country
                    or _PARENT_WORDS.search(text) or _DETAIL_WORDS.search(text)
                    or _LOOKUP_WORDS.search(text))
    return {"skill": skill, "params": params, "explicit": explicit}


# -- shared shape ---------------------------------------------------------


def _artifact(params: dict, client: GleifClient, **extra) -> dict:
    artifact = {
        "dataset": DATASET,
        "product": PRODUCT,
        "source": SOURCE,
        "freshness": client.freshness(),
    }
    artifact.update(extra)
    return artifact


def _entity_line(record: dict) -> str:
    return (
        f"{record.get('name') or 'unnamed entity'} — LEI {record.get('lei') or 'not reported'}, "
        f"{record.get('status') or 'status not reported'}, "
        f"jurisdiction {record.get('jurisdiction') or 'not reported'}, "
        f"company number {record.get('registered_as') or 'not reported'}"
    )


# -- skills ---------------------------------------------------------------


def run_entity_lookup(params: dict, client: GleifClient) -> dict:
    try:
        result = client.by_name(params.get("name"), limit=params.get("limit", 10))
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    records = result["records"]
    artifact = _artifact(params, client, **result)
    if not records:
        return {
            "final_state": "completed",
            "message": (
                f"No legal entity in GLEIF files the exact name “{result['query']}”. GLEIF matches "
                "legal names exactly, so try the name as the entity files it (often all capitals, "
                "with “CO.” or “AG” spelled out), or search by the country instead."
            ),
            "artifact": artifact,
            "watch": None,
        }
    listing = "\n".join(f"  • {_entity_line(record)}" for record in records[:MAX_LISTED])
    filed = result.get("matched_name")
    spelling = "" if filed == result["query"] else f", which GLEIF files as “{filed}”"
    return {
        "final_state": "completed",
        "message": (
            f"{result['total']:,} legal entit{'y' if result['total'] == 1 else 'ies'} in GLEIF file "
            f"the exact name “{result['query']}”{spelling} (showing {len(records)}):\n{listing}\n"
            f"Source: {DATASET} (read live). An LEI means the entity filed identifying data, "
            "not that it is a trading company."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_lei_lookup(params: dict, client: GleifClient) -> dict:
    try:
        record = client.by_lei(params.get("lei"))
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    artifact = _artifact(params, client, record=record)
    if record is None:
        return {
            "final_state": "completed",
            "message": (
                f"GLEIF holds no legal entity under LEI {params['lei']}. A lapsed record is not the "
                "same as a missing one: ask the entity for the LEI on its own paperwork."
            ),
            "artifact": artifact,
            "watch": None,
        }
    registration = record.get("registration") or {}
    listing = "\n".join([
        f"  • name            {record.get('name') or 'not reported'}",
        f"  • status          {record.get('status') or 'not reported'}"
        + (f" (registration {registration.get('registration_status') or 'not reported'})"
           if registration.get("registration_status") else ""),
        f"  • jurisdiction    {record.get('jurisdiction') or 'not reported'}"
        + (f", legal form {record['legal_form']}" if record.get("legal_form") else ""),
        f"  • company number  {record.get('registered_as') or 'not reported'}",
        f"  • address         {record.get('address') or 'not reported'}",
        f"  • category        {record.get('category') or 'not reported'}"
        + (f" / {record['sub_category']}" if record.get("sub_category") else ""),
        f"  • created         {record.get('creation_date') or 'not reported'}",
        f"  • registered      {registration.get('initial_registration_date') or 'not reported'}, "
        f"last updated {registration.get('last_update_date') or 'not reported'}",
        f"  • renews          {registration.get('next_renewal_date') or 'not reported'}",
        f"  • corroboration   {registration.get('corroboration_level') or 'not reported'}"
        + (f", LOU {registration['managing_lou']}" if registration.get("managing_lou") else ""),
    ])
    other_names = record.get("other_names") or []
    if other_names:
        listing += "\n  • other names     " + ", ".join(str(name) for name in other_names[:MAX_LISTED])
    return {
        "final_state": "completed",
        "message": f"LEI {record.get('lei')}:\n{listing}\nSource: {DATASET} (read live).",
        "artifact": artifact,
        "watch": None,
    }


def run_ownership(params: dict, client: GleifClient) -> dict:
    try:
        result = client.children_of(params.get("lei"), limit=params.get("limit", 20))
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    records = result["records"]
    artifact = _artifact(params, client, **result)
    if not records:
        return {
            "final_state": "completed",
            "message": (
                f"GLEIF lists no legal entity whose ultimate parent is {result['ultimate_parent']}. "
                "That means the index holds no parent-child record for it, which is not proof the "
                "parent owns nothing."
            ),
            "artifact": artifact,
            "watch": None,
        }
    listing = "\n".join(f"  • {_entity_line(record)}" for record in records[:MAX_LISTED])
    suffix = ""
    if len(records) > MAX_LISTED:
        suffix = f"\n  • ... {len(records) - MAX_LISTED} more in the artifact."
    return {
        "final_state": "completed",
        "message": (
            f"{result['total']:,} legal entit{'y' if result['total'] == 1 else 'ies'} in GLEIF have "
            f"{result['ultimate_parent']} as their ultimate parent (showing {len(records)}):\n"
            f"{listing}{suffix}\n"
            f"Source: {DATASET} (read live). GLEIF holds the parent link as a filter, not a field, so "
            "this is the parent side of the relationship; the child's own record does not name its parent."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_entities_in_country(params: dict, client: GleifClient) -> dict:
    try:
        country = client.check_country(params.get("country"))
        if country is None:
            raise ValueError("which country? Give me an ISO 3166-1 alpha-2 code, for example DE or SG")
        result = client.records({"filter[entity.legalAddress.country]": country},
                                limit=params.get("limit", 10))
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    result["country"] = country
    records = result["records"]
    artifact = _artifact(params, client, **result)
    if not records:
        return {
            "final_state": "completed",
            "message": (
                f"GLEIF holds no legal entity whose registered address is in {country}. Check the "
                "code — ISO 3166-1 alpha-2, two letters, for example DE, SG, US."
            ),
            "artifact": artifact,
            "watch": None,
        }
    listing = "\n".join(
        f"  • {record.get('name') or 'unnamed entity'} — LEI {record.get('lei') or 'not reported'}, "
        f"{record.get('status') or 'status not reported'}, "
        f"jurisdiction {record.get('jurisdiction') or 'not reported'}"
        for record in records[:MAX_LISTED]
    )
    return {
        "final_state": "completed",
        "message": (
            f"{result['total']:,} legal entit{'y' if result['total'] == 1 else 'ies'} in GLEIF have "
            f"their registered address in {country} (showing {len(records)}):\n{listing}\n"
            f"Source: {DATASET} (read live). This is GLEIF's index, so it is a slice of the entities "
            "that chose to hold an LEI, not a company register."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_group_rollup(params: dict, client: GleifClient, gateway: GatewayClient) -> dict:
    """The premium group roll-up. Nothing here reads GLEIF.

    The gateway reads every subsidiary's own record and does the tally behind its
    licence check, so a caller who has not paid gets the gateway's own message and
    no roll-up at all.
    """
    try:
        lei = client.check_lei(params.get("lei"))
        limit = client.check_limit(params.get("limit") or 100)
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    read, refused = premium_call(gateway, GATEWAY_TOOL, {"lei": lei, "limit": limit},
                                 {"dataset": DATASET, "ultimate_parent": lei})
    if refused:
        return refused
    if not isinstance(read, dict) or read.get("read") is None:
        return empty_premium_answer(
            "The licence gateway answered without a group roll-up, so there is nothing to report.",
            {"dataset": DATASET, "ultimate_parent": lei},
        )

    subsidiaries = read.get("subsidiaries") or []
    lines = [
        f"Group roll-up for ultimate parent {read.get('ultimateParent')}"
        + (f" — {read['ultimateParentName']}" if read.get("ultimateParentName") else "")
        + f": GLEIF lists {read.get('total')} entit{'y' if read.get('total') == 1 else 'ies'}, "
          f"and this run read {read.get('read')} of them individually."
    ]
    if not subsidiaries:
        lines.append("  • No entity in GLEIF files this LEI as its ultimate parent.")
    else:
        lines.append(
            f"  • {read.get('active', 0)} ACTIVE, {read.get('inactive', 0)} INACTIVE"
            f", {read.get('unknownStatus', 0)} status not reported."
        )
        lines.append("  • Countries: " + _counts(read.get("countries")))
        lines.append("  • Jurisdictions: " + _counts(read.get("jurisdictions")))
        renewal = read.get("soonestRenewal") or {}
        if renewal:
            lines.append(
                f"  • Renews soonest: {renewal.get('name') or 'unnamed entity'} "
                f"({renewal.get('lei') or 'LEI not reported'}) on {renewal.get('nextRenewalDate') or 'not reported'}."
            )
        else:
            lines.append("  • Renews soonest: not reported.")
        lines.append("  • Subsidiaries:")
        for row in subsidiaries[:MAX_LISTED]:
            lines.append(
                f"      {row.get('name') or 'unnamed entity'} — LEI {row.get('lei') or 'not reported'}, "
                f"{row.get('status') or 'status not reported'}, {row.get('country') or 'country not reported'}"
                + (f", registered as {row['registeredAs']}" if row.get("registeredAs") else "")
                + (f", LEI {row['registrationStatus']}" if row.get("registrationStatus") else "")
                + (f", renews {row['nextRenewalDate'][:10]}" if row.get("nextRenewalDate") else "")
            )
        if len(subsidiaries) > MAX_LISTED:
            lines.append(f"      ... {len(subsidiaries) - MAX_LISTED} more in the artifact.")
    lines.append(
        "\nRolled up on the MCP gateway behind its licence check, from GLEIF's LEI records "
        f"({DATASET}). Status and country come from the subsidiary list GLEIF returned; the "
        f"registration status and renewal date were read from {read.get('detailRead')} of the "
        "subsidiaries' own records, so an empty renewal date means not read, not absent. The "
        "parent name is the registered name of the parent LEI, not a brand."
    )
    artifact = {
        "dataset": DATASET,
        "source": SOURCE,
        "premium": True,
        "ultimate_parent": read.get("ultimateParent"),
        "ultimate_parent_name": read.get("ultimateParentName"),
        "total": read.get("total"),
        "read": read.get("read"),
        "detail_read": read.get("detailRead"),
        "active": read.get("active"),
        "inactive": read.get("inactive"),
        "unknown_status": read.get("unknownStatus"),
        "countries": read.get("countries"),
        "jurisdictions": read.get("jurisdictions"),
        "soonest_renewal": read.get("soonestRenewal"),
        "subsidiaries": subsidiaries,
    }
    return {"final_state": "completed", "message": "\n".join(lines), "artifact": artifact, "watch": None}


class GleifAgent(SkillAgent):
    name = "gleif-companies"
    card_name = "GLEIF Companies Agent"
    card_description = (
        "Read-only agent over GLEIF, the global index of legal entities that hold an LEI: entity "
        "lookup by registered name, one entity from its 20-character LEI with its registration dates "
        "and corroboration level, the entities a parent owns, and the legal entities registered in a "
        "country — plus a group roll-up that reads every subsidiary individually on a licence-gated "
        "gateway. Every answer is read live from GLEIF."
    )
    env_prefix = "COMPANIES"
    datasets = (DATASET,)
    card_skills = CARD_SKILLS

    def __init__(self, client: GleifClient | None = None,
                 gateway: GatewayClient | None = None) -> None:
        self.client = client or GleifClient()
        self.gateway = gateway or GatewayClient()

    def parse(self, message: dict) -> dict:
        return parse(message)

    def missing(self, skill: str, params: dict) -> list[str]:
        if skill == "help":
            return []
        if skill == SKILL_ENTITIES_IN_COUNTRY:
            return [] if params.get("country") else ["country"]
        if skill == SKILL_ENTITY_LOOKUP:
            return [] if params.get("name") else ["name"]
        return [] if params.get("lei") else ["lei"]

    def input_prompt(self, skill: str, missing: list[str]) -> str:
        if skill == SKILL_ENTITIES_IN_COUNTRY:
            return (
                "Which country? Give me an ISO 3166-1 alpha-2 code, for example DE, SG or US — "
                "GLEIF filters on the country of the registered address."
            )
        if skill == SKILL_ENTITY_LOOKUP:
            return (
                "Which company? Give me the legal name as the entity files it — GLEIF matches legal "
                "names exactly, so “JPMORGAN CHASE & CO.” rather than “JPMorgan”."
            )
        return (
            "Which LEI? Give me the 20-character Legal Entity Identifier, for example "
            f"{BBC_LEI} (the BBC), or ask me to look the company up by name first."
        )

    def run(self, request: dict) -> dict:
        skill = request["skill"]
        params = request["params"]
        if request["missing"]:
            return {
                "final_state": "input-required",
                "message": self.input_prompt(skill, request["missing"]),
                "artifact": None,
                "watch": None,
            }
        if skill == SKILL_ENTITY_LOOKUP:
            return run_entity_lookup(params, self.client)
        if skill == SKILL_LEI_LOOKUP:
            return run_lei_lookup(params, self.client)
        if skill == SKILL_OWNERSHIP:
            return run_ownership(params, self.client)
        if skill == SKILL_ENTITIES_IN_COUNTRY:
            return run_entities_in_country(params, self.client)
        if skill == SKILL_GROUP_ROLLUP:
            return run_group_rollup(params, self.client, self.gateway)
        if skill == "help":
            return {"final_state": "completed", "message": HELP, "artifact": None, "watch": None}
        return {
            "final_state": "input-required",
            "message": "I did not catch which skill that is. Try “what is LEI 8I5DZWZKVSZI1NUHU748?”.",
            "artifact": None,
            "watch": None,
        }


def _counts(rows) -> str:
    """A tally rendered as text: `GB (10), IN (2)`. Always labelled, never dropped."""
    if not rows:
        return "not reported"
    return ", ".join(f"{row.get('name') or 'not reported'} ({row.get('count', 0)})" for row in rows[:MAX_LISTED])


__all__ = [
    "BBC_LEI",
    "CARD_SKILLS",
    "GATEWAY_TOOL",
    "GleifAgent",
    "HELP",
    "MAX_LISTED",
    "SKILL_ENTITIES_IN_COUNTRY",
    "SKILL_ENTITY_LOOKUP",
    "SKILL_GROUP_ROLLUP",
    "SKILL_LEI_LOOKUP",
    "SKILL_OWNERSHIP",
    "UpstreamError",
    "message_data",
    "message_text",
    "name_from_text",
    "parse",
    "run_entities_in_country",
    "run_entity_lookup",
    "run_group_rollup",
    "run_lei_lookup",
    "run_ownership",
]
