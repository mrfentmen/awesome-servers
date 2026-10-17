"""The place agent: four free skills over two postal feeds, one on a hosted service that was removed.

  - uk-postcode:    a UK postcode to coordinates and its full administrative geography
  - outward-code:   every UK postcode under an outward code, such as SW1A
  - nearest-postcode: the UK postcodes around a point, with real distances
  - zip-code:       a postal code in any of zippopotam's ~65 countries, the US included
  - catchment-area: the administrative shape of a neighbourhood around a point (not implemented here)

The two feeds do not overlap, and this agent does not pretend they do: postcodes.io is
the United Kingdom and carries the ONS ward, parish, constituency and LSOA geography,
while zippopotam covers everywhere except the UK and carries a place name and a state.
A GB code sent to zippopotam is refused here rather than reported as missing.

The premium skill reads the administrative composition of a whole neighbourhood, and
it does that on the gateway.
"""

from __future__ import annotations

import re

from a2a_kit import SkillAgent

from data import (
    MAX_RESULTS,
    REVERSE_LIMIT,
    UK_DATASET,
    UK_OUTWARD_RE,
    UK_POSTCODE_RE,
    WORLD_DATASET,
    PlaceClient,
    UpstreamError,
    normalise_uk_postcode,
)

SKILL_UK_POSTCODE = "uk-postcode"
SKILL_OUTWARD_CODE = "outward-code"
SKILL_NEAREST_POSTCODE = "nearest-postcode"
SKILL_ZIP_CODE = "zip-code"
SKILL_CATCHMENT_AREA = "catchment-area"

MAX_LISTED = 10

CARD_SKILLS = [
    {
        "id": SKILL_UK_POSTCODE,
        "name": "UK postcode",
        "description": (
            "One UK postcode resolved to its coordinates and the administrative areas it sits in: "
            "region, admin district, county, ward, parish, LSOA, MSOA, parliamentary constituency and "
            "European electoral region. Give the postcode with or without its space."
        ),
        "tags": ["place", "postcode", "uk", "geography", "admin"],
        "examples": [
            "what is in postcode SW1A 1AA?",
            "where is M1 1AE?",
            '{"skill": "uk-postcode", "postcode": "SW1A1AA"}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_OUTWARD_CODE,
        "name": "Postcodes under an outward code",
        "description": (
            "Every UK postcode the ONS file holds under one outward code — SW1A, M1, EH12 — with each "
            "postcode's district, ward and constituency. The way to see how big an area an outward "
            "code actually covers."
        ),
        "tags": ["place", "postcode", "uk", "search", "outward-code"],
        "examples": [
            "what postcodes are in SW1A?",
            "list the M1 postcodes",
            '{"skill": "outward-code", "outward_code": "SW1A", "limit": 5}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_NEAREST_POSTCODE,
        "name": "Postcodes near a point",
        "description": (
            "The UK postcodes nearest a latitude/longitude point, each with its real distance and its "
            "ward and district, nearest first. The reverse lookup, and it is honest that the feed caps "
            "how many it will return."
        ),
        "tags": ["place", "postcode", "uk", "nearby", "reverse"],
        "examples": [
            "which postcodes are near 51.5010,-0.1416?",
            "what is the nearest postcode to 53.4808,-2.2426?",
            '{"skill": "nearest-postcode", "point": "51.5010,-0.1416", "limit": 5}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_ZIP_CODE,
        "name": "Postal code anywhere",
        "description": (
            "A postal code in any of zippopotam's countries resolved to the places it covers, with "
            "coordinates and, where the country publishes one, its state: US ZIP, German PLZ, French "
            "code, Japanese postal code and so on. The UK is not covered here — use the UK postcode "
            "skill for that."
        ),
        "tags": ["place", "postcode", "zip", "world", "geocoding"],
        "examples": [
            "what is ZIP code 11235?",
            "where is 100-0001 in Japan?",
            '{"skill": "zip-code", "postal_code": "11235", "country": "US"}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_CATCHMENT_AREA,
        "name": "What is this corner actually in?",
        "description": (
            "The administrative shape of a whole neighbourhood from postcodes.io: the postcodes within "
            "a radius of a point, and a tally of which region, district, county, ward, parish, "
            "constituency and electoral region each share of them falls into — so you can see which ward "
            "really covers the corner rather than which one the nearest postcode says. Premium: it "
            "runs on a hosted service that was removed."
        ),
        "tags": ["place", "postcode", "uk", "catchment", "wards",],
        "examples": [
            "which ward covers the area around 53.4808,-2.2426?",
            "what is the administrative make-up around 51.5010,-0.1416?",
            '{"skill": "catchment-area", "point": "53.4808,-2.2426", "radius_km": 2}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
]

_POINT_RE = re.compile(r"\b(-?\d{1,2}(?:\.\d+)?,\s?-?\d{1,3}(?:\.\d+)?)\b")
#: A UK postcode in running text: an outward code, then an inward code.
_UK_POSTCODE_RE = re.compile(r"\b([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})\b")
#: An outward code on its own, e.g. "what postcodes are in SW1A".
_OUTWARD_AFTER = re.compile(
    r"\b(?:in|for|under|of|are in|is in|within)\s+(?:the\s+)?([A-Z]{1,2}\d[A-Z\d]?)\b")
#: "the EH12 postcodes" names an outward code just as clearly as "in EH12" does.
_OUTWARD_BEFORE = re.compile(r"\b([A-Z]{1,2}\d[A-Z\d]?)\s+postcodes?\b")
_AREA_WORDS = re.compile(
    r"\b(?:ward|wards|district|districts|parish|parishes|constituency|constituencies|"
    r"county|counties|electoral region|electoral regions|catchment|boundary|boundaries|"
    r"which (?:ward|district|constituency|parish))\b",
    re.IGNORECASE,
)
_CATCHMENT_PHRASES = re.compile(
    r"\b(?:what(?:'s| is)|which)\b[^.?]{0,50}\b(?:make ?-?up|composition|catchment|cover(?:s|ed)?)\b|"
    r"\b(?:around|near|nearby|about)\b[^.?]{0,30}\b(?:ward|district|constituency|area)\b|"
    r"\bwhat is (?:this|the) (?:corner|point|place|area|spot) (?:actually )?in\b|"
    r"\bhow many wards\b",
    re.IGNORECASE,
)
_UK_WORDS = re.compile(
    r"\b(?:uk|united kingdom|britain|british|england|scotland|wales|northern ireland|"
    r"postcode|outward code)\b",
    re.IGNORECASE,
)
_NEAREST_WORDS = re.compile(
    r"\b(?:near(?:by|est)?|closest|nearest|around|reverse|from this point|from here|"
    r"what(?:'s| is) here|where am i)\b",
    re.IGNORECASE,
)
_OUTWARD_SEARCH = re.compile(
    r"\b(?:what|which|list|all|every)\s+postcodes?\b|\bpostcodes?\s+(?:are\s+)?(?:in|under)\b",
    re.IGNORECASE,
)
_ZIP_WORDS = re.compile(
    r"\b(?:zip(?:\s*code)?|post(?:al)?\s*code|postcode|plz|pin|cp)\b",
    re.IGNORECASE,
)
#: A non-UK postal code in running text. Three shapes cover what zippopotam holds:
#: plain digits (11235), a letter prefix (100-0001, K1A 0B1), and a digit-letter
#: pair (ON M5G). Anything looser starts eating the question — "zip code 11235"
#: would otherwise read as the code "code 11235".
#: The hyphenated shape is tried first so "100-0001" is not read as "100", and the
#: letter prefix never takes a space, so "is 100" is not read as one postal code.
_WORLD_CODE_RE = re.compile(
    r"\b((?:\d{1,6}-[A-Za-z0-9]{1,6})|(?:\d{3,6})|(?:[A-Za-z]{1,3}-?\d{2,6})|"
    r"(?:\d{1,4}[\s-][A-Za-z0-9]{1,4}(?:\s[A-Za-z0-9]{1,4})?))\b"
)
#: A country name or code the caller named, so "ZIP in Canada" resolves.
_COUNTRY_HINT = {
    "us": "us", "usa": "us", "united states": "us", "america": "us",
    "ca": "ca", "canada": "ca",
    "de": "de", "germany": "de", "deutschland": "de",
    "fr": "fr", "france": "fr",
    "jp": "jp", "japan": "jp",
    "au": "au", "australia": "au",
    "nl": "nl", "netherlands": "nl", "holland": "nl",
    "es": "es", "spain": "es", "espana": "es",
    "it": "it", "italy": "it", "italia": "it",
    "in": "in", "india": "in",
    "br": "br", "brazil": "br", "brasil": "br",
    "mx": "mx", "mexico": "mx",
    "at": "at", "austria": "at", "österreich": "at",
    "ch": "ch", "switzerland": "ch", "schweiz": "ch",
    "se": "se", "sweden": "se", "sverige": "se",
    "no": "no", "norway": "no", "norge": "no",
    "dk": "dk", "denmark": "dk", "danmark": "dk",
    "fi": "fi", "finland": "fi", "suomi": "fi",
    "ie": "ie", "ireland": "ie", "eire": "ie",
    "pl": "pl", "poland": "pl", "polska": "pl",
    "pt": "pt", "portugal": "pt",
    "nz": "nz", "new zealand": "nz",
    "kr": "kr", "korea": "kr", "south korea": "kr",
    "sg": "sg", "singapore": "sg",
    "za": "za", "south africa": "za",
}
_COUNTRY_RE = re.compile(
    r"\b(?:in|for|of)\s+(?:the\s+)?([A-Za-z]+(?:[\s-][A-Za-z]+){0,2})\b(?=\s*[,?]|$|\s+(?:is|are|does|do|zip|postal|post))"
)

HELP = (
    "I read two postal feeds: postcodes.io for the United Kingdom, with the full ONS administrative "
    "geography, and zippopotam for postal codes in about 65 other countries. Ask me:\n"
    "  • what is in postcode SW1A 1AA?\n"
    "  • what postcodes are in SW1A?\n"
    "  • which postcodes are near 51.5010,-0.1416?\n"
    "  • what is ZIP code 11235?\n"
    "  • which ward covers the area around 53.4808,-2.2426? (not implemented here)\n"
    "The two feeds do not overlap. postcodes.io is the UK and gives you wards, parishes and "
    "constituencies; zippopotam is everywhere except the UK and gives you a place name."
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


def country_from_text(text: str) -> str | None:
    """A country the caller named, as the two-letter code zippopotam wants."""
    match = _COUNTRY_RE.search(text)
    if match:
        found = _COUNTRY_HINT.get(re.sub(r"\s+", " ", match.group(1).strip().lower()))
        if found:
            return found
    # "postcode 10115, Germany" names the country as a trailing aside.
    tail = text.rsplit(",", 1)
    if len(tail) == 2:
        return _COUNTRY_HINT.get(tail[1].strip().lower().strip(".?"))
    return None


def _uk_postcode_from_text(text: str) -> str | None:
    match = _UK_POSTCODE_RE.search(text.upper())
    if not match:
        return None
    return f"{match.group(1)} {match.group(2)}"


def _outward_from_text(text: str) -> str | None:
    for pattern in (_OUTWARD_AFTER, _OUTWARD_BEFORE):
        match = pattern.search(text)
        if not match:
            continue
        candidate = match.group(1).upper()
        if UK_OUTWARD_RE.match(candidate):
            return candidate
    return None


def _world_code_from_text(text: str, point: str | None = None) -> str | None:
    """A non-UK postal code: a digit-bearing token that is not a UK postcode or a point."""
    if _uk_postcode_from_text(text):
        return None
    haystack = text
    if point:
        # A coordinate is not a postal code, and it matches the code pattern.
        haystack = text.replace(point, " ")
    for match in _WORLD_CODE_RE.finditer(haystack):
        candidate = match.group(1).strip()
        if not any(character.isdigit() for character in candidate):
            continue
        if PlaceClient.looks_like_uk_postcode(candidate):
            continue
        if UK_OUTWARD_RE.match(candidate.upper()):
            # An outward code is a UK search term, never a world postal code.
            continue
        return candidate
    return None


def parse(message: dict) -> dict:
    """Incoming message -> {skill, params, explicit}. Never raises."""
    text = message_text(message)
    data = message_data(message)
    requested = _first(data, "skill", "skill_id")

    postcode = _first(data, "postcode", "postal_code", "zip", "zipcode", "code")
    outward = _first(data, "outward_code", "outward")
    country = _first(data, "country", "country_code")
    point = _first(data, "point", "lat_lon")
    if point is None:
        match = _POINT_RE.search(text)
        if match:
            point = re.sub(r"\s+", "", match.group(1))
    limit = _first(data, "limit")
    radius_km = _first(data, "radius_km", "radius")

    if postcode is None:
        postcode = _uk_postcode_from_text(text) or _world_code_from_text(text, point)
    if outward is None:
        outward = _outward_from_text(text)
    if outward and postcode and not PlaceClient.looks_like_uk_postcode(postcode):
        # "what is in EH12" names an outward code, not a world postal code.
        outward = outward
        postcode = None
    if country is None:
        country = country_from_text(text)
    if country is None and re.search(r"\bzip\b", text, re.IGNORECASE):
        # "zip" is United States terminology, so the country is not really missing.
        country = "us"

    # Either the question asks about a make-up, or it names an administrative area and
    # gives only a point — which is the catchment question however it is phrased.
    asked_for_catchment = (bool(_CATCHMENT_PHRASES.search(text))
                           or (bool(_AREA_WORDS.search(text)) and bool(point) and not postcode))
    asked_for_uk = bool(_UK_WORDS.search(text))
    asked_for_nearest = bool(_NEAREST_WORDS.search(text))
    asked_for_outward = bool(_OUTWARD_SEARCH.search(text))
    asked_for_zip = bool(_ZIP_WORDS.search(text))

    if requested in (SKILL_UK_POSTCODE, SKILL_OUTWARD_CODE, SKILL_NEAREST_POSTCODE,
                     SKILL_ZIP_CODE, SKILL_CATCHMENT_AREA):
        skill = requested
    elif asked_for_catchment:
        skill = SKILL_CATCHMENT_AREA
    elif asked_for_outward and outward:
        skill = SKILL_OUTWARD_CODE
    elif asked_for_nearest and point:
        skill = SKILL_NEAREST_POSTCODE
    elif postcode and PlaceClient.looks_like_uk_postcode(postcode):
        skill = SKILL_UK_POSTCODE
    elif postcode:
        skill = SKILL_ZIP_CODE
    elif asked_for_zip and country:
        skill = SKILL_ZIP_CODE
    elif asked_for_uk:
        skill = SKILL_UK_POSTCODE
    elif asked_for_nearest and point:
        skill = SKILL_NEAREST_POSTCODE
    elif outward:
        # An outward code named on its own is a search, whatever the question said.
        skill = SKILL_OUTWARD_CODE
    else:
        skill = SKILL_ZIP_CODE

    # An outward code named on its own is a search, not a full postcode.
    if skill == SKILL_UK_POSTCODE and postcode and not PlaceClient.looks_like_uk_postcode(postcode):
        outward = outward or postcode.upper()
        skill = SKILL_OUTWARD_CODE
        postcode = None

    params: dict = {}
    for key, value in (("postcode", postcode), ("outward_code", outward), ("country", country),
                       ("point", point), ("limit", limit), ("radius_km", radius_km)):
        if value is not None:
            params[key] = value
    if skill in (SKILL_UK_POSTCODE, SKILL_ZIP_CODE, SKILL_OUTWARD_CODE):
        params.setdefault("limit", MAX_LISTED)
    if skill == SKILL_NEAREST_POSTCODE:
        params.setdefault("limit", MAX_LISTED)
    if skill == SKILL_CATCHMENT_AREA:
        params.setdefault("radius_km", 2)
    if not requested and (not text.strip() or re.search(r"\b(help|what can you do|commands?)\b", text, re.IGNORECASE)):
        skill, params = "help", {}
    explicit = bool(requested or asked_for_catchment or asked_for_outward or asked_for_nearest
                    or asked_for_zip or asked_for_uk)
    return {"skill": skill, "params": params, "explicit": explicit}


# -- shared shape ---------------------------------------------------------


def _artifact(params: dict, client: PlaceClient, **extra) -> dict:
    artifact = {
        "dataset": UK_DATASET,
        "product": "postcodes.io UK postcode and administrative-area data",
        "source": "postcodes.io (ONS Open Postcode Directory)",
        "freshness": client.freshness(),
    }
    artifact.update(extra)
    return artifact


def _missing(skill: str) -> dict:
    if skill == SKILL_NEAREST_POSTCODE or skill == SKILL_CATCHMENT_AREA:
        message = (
            "Which point? Give me a latitude/longitude such as 51.5010,-0.1416 and I will read the "
            "postcodes around it."
        )
    elif skill == SKILL_OUTWARD_CODE:
        message = "Which outward code? Give me a UK one such as SW1A, M1 or EH12."
    else:
        message = (
            "Which postal code? A UK one is an outward code and an inward code, such as SW1A 1AA; "
            "anywhere else is a code plus its country, such as 11235 in the US."
        )
    return {"final_state": "input-required", "message": message, "artifact": None, "watch": None}


def _uk_line(row: dict) -> str:
    parts = [f"  • {row.get('postcode', 'postcode not reported')}"]
    place = row.get("admin_district") or row.get("region")
    if place:
        parts[0] += f" — {place}"
    if "distance_km" in row:
        parts[0] += f" ({row['distance_km']} km away)"
    for field, label in (("admin_ward", "ward"), ("parish", "parish"),
                         ("parliamentary_constituency", "constituency")):
        if row.get(field):
            parts.append(f"{label} {row[field]}")
    return " · ".join(parts)


def _world_line(place: dict) -> str:
    parts = [f"  • {place.get('place', 'place not reported')}"]
    if place.get("state"):
        parts[0] += f", {place['state']}"
    if place.get("latitude") is not None and place.get("longitude") is not None:
        parts[0] += f" at {place['latitude']},{place['longitude']}"
    return "".join(parts)


# -- skills ---------------------------------------------------------------


def run_uk_postcode(params: dict, client: PlaceClient) -> dict:
    row = client.uk_postcode(params["postcode"])
    artifact = _artifact(params, client, postcode=params["postcode"], found=row)
    if row is None:
        try:
            wanted = normalise_uk_postcode(params["postcode"])
        except ValueError as exc:
            return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
        return {
            "final_state": "completed",
            "message": (
                f"postcodes.io holds no UK postcode “{wanted}”. Check the outward and inward code — "
                f"SW1A 1AA is the shape — or ask what postcodes are under the outward code instead. "
                f"(Read live from {UK_DATASET}.)"
            ),
            "artifact": artifact,
            "watch": None,
        }
    artifact = {**artifact, "postcode_record": row}
    lines = [
        f"{row['postcode']} is at {row.get('latitude')},{row.get('longitude')} in "
        f"{row.get('country', 'country not reported')}"
        + (f", region {row['region']}" if row.get("region") else "") + ".",
    ]
    for field, label in (("admin_district", "admin district"), ("admin_county", "county"),
                         ("admin_ward", "ward"), ("parish", "parish"),
                         ("lsoa", "lower layer super output area"), ("msoa", "middle layer super output area"),
                         ("parliamentary_constituency", "parliamentary constituency"),
                         ("european_electoral_region", "European electoral region")):
        if row.get(field):
            lines.append(f"  • {label}: {row[field]}")
    lines.append(f"Read live from {UK_DATASET} (the ONS Open Postcode Directory).")
    return {
        "final_state": "completed",
        "message": "\n".join(lines),
        "artifact": artifact,
        "watch": None,
    }


def run_outward_code(params: dict, client: PlaceClient) -> dict:
    outward = params["outward_code"]
    rows = client.uk_search(outward, limit=params.get("limit", MAX_LISTED))
    artifact = _artifact(params, client, outward_code=outward, postcodes=rows, count=len(rows))
    if not rows:
        return {
            "final_state": "completed",
            "message": (
                f"postcodes.io holds no postcode under the outward code “{outward}”. UK outward codes "
                f"look like SW1A, M1 or EH12. (Read live from {UK_DATASET}.)"
            ),
            "artifact": artifact,
            "watch": None,
        }
    listing = "\n".join(_uk_line(row) for row in rows[:MAX_LISTED])
    districts = sorted({row["admin_district"] for row in rows if row.get("admin_district")})
    return {
        "final_state": "completed",
        "message": (
            f"{len(rows)} UK postcode(s) under {outward} (postcodes.io returned this many):\n{listing}\n"
            + (f"District(s) covered: {', '.join(districts)}. " if districts else "")
            + f"Source: {UK_DATASET} (read live)."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_nearest_postcode(params: dict, client: PlaceClient) -> dict:
    lat, lon = client.check_point(params["point"])
    radius = client.check_radius_km(params.get("radius_km", 2))
    rows = client.uk_nearest(f"{lat},{lon}", radius_km=radius, limit=params.get("limit", MAX_LISTED))
    artifact = _artifact(params, client, point=f"{lat},{lon}", radius_km=radius,
                         postcodes=rows, count=len(rows))
    if not rows:
        return {
            "final_state": "completed",
            "message": (
                f"postcodes.io holds no postcode within {radius} km of {lat},{lon} — outside the "
                f"United Kingdom, or the middle of a large rural postcode unit. (Read live from "
                f"{UK_DATASET}.)"
            ),
            "artifact": artifact,
            "watch": None,
        }
    listing = "\n".join(_uk_line(row) for row in rows[:MAX_LISTED])
    note = ""
    if len(rows) >= REVERSE_LIMIT:
        note = (f" postcodes.io caps this lookup at {REVERSE_LIMIT} postcodes, so that is the whole "
                f"list it will give for that radius.")
    return {
        "final_state": "completed",
        "message": (
            f"{len(rows)} UK postcode(s) within {radius} km of {lat},{lon}, nearest first:\n{listing}\n"
            f"Distances are straight-line.{note} Source: {UK_DATASET} (read live)."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_zip_code(params: dict, client: PlaceClient) -> dict:
    code = params["postcode"]
    country = params.get("country")
    if not country:
        if PlaceClient.looks_like_uk_postcode(code):
            return {
                "final_state": "completed",
                "message": (
                    f"“{code}” is a UK postcode, and zippopotam.us does not cover the United Kingdom. "
                    f"Ask for the UK postcode instead and I will read its ward, parish and constituency."
                ),
                "artifact": _artifact(params, client, postal_code=code, places=[]),
                "watch": None,
            }
        raise ValueError(
            "tell me which country that postal code is in, for example "
            '{"skill": "zip-code", "postal_code": "11235", "country": "US"}'
        )
    places = client.world_postcode(country, code)
    artifact = _artifact(params, client, postal_code=code, country=country.upper(),
                         dataset=WORLD_DATASET, places=places or [], count=len(places or []))
    if not places:
        return {
            "final_state": "completed",
            "message": (
                f"zippopotam.us holds no postal code “{code}” for {country.upper()}. It covers about "
                f"65 countries but not the United Kingdom. (Read live from {WORLD_DATASET}.)"
            ),
            "artifact": artifact,
            "watch": None,
        }
    listing = "\n".join(_world_line(place) for place in places[:MAX_LISTED])
    return {
        "final_state": "completed",
        "message": (
            f"{places[0]['postal_code']}, {places[0]['country']}: {len(places)} place(s):\n{listing}\n"
            f"zippopotam.us carries a place name and a state, not an administrative breakdown. "
            f"Source: {WORLD_DATASET} (read live)."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_catchment_area(params: dict, client: PlaceClient, gateway: object) -> dict:
    """Stub: the hosted implementation of this skill was removed in the paywall cleanup."""
    return {
        "final_state": "completed",
        "message": 'Not yet implemented: catchment-area — its hosted implementation was removed.',
        "artifact": {"removed": True},
        "watch": None,
    }


class PlaceAgent(SkillAgent):
    name = "place"
    card_name = "Postal Code Agent"
    card_description = (
        "Read-only agent over two postal feeds: a UK postcode resolved with its full ONS administrative "
        "geography — ward, parish, constituency, LSOA — every postcode under an outward code, the UK "
        "postcodes nearest any point, and postal codes in about 65 other countries through zippopotam. "
        "One premium skill tallies which wards, districts and constituencies a whole neighbourhood "
        "falls into, and it runs on a hosted service that was removed."
    )
    env_prefix = "PLACE"
    datasets = (UK_DATASET, WORLD_DATASET)
    card_skills = CARD_SKILLS

    def __init__(self, client: PlaceClient | None = None, gateway: object | None = None) -> None:
        self.client = client or PlaceClient()
        self.gateway = gateway

    def parse(self, message: dict) -> dict:
        return parse(message)

    def missing(self, skill: str, params: dict) -> list[str]:
        if skill in (SKILL_NEAREST_POSTCODE, SKILL_CATCHMENT_AREA):
            return [] if params.get("point") else ["point"]
        if skill == SKILL_OUTWARD_CODE:
            return [] if params.get("outward_code") else ["outward_code"]
        if skill in (SKILL_UK_POSTCODE, SKILL_ZIP_CODE):
            return [] if params.get("postcode") else ["postcode"]
        return []

    def input_prompt(self, skill: str, missing: list[str]) -> str:
        return _missing(skill)["message"]

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
        try:
            if skill == SKILL_CATCHMENT_AREA:
                return run_catchment_area(params, self.client, self.gateway)
            if skill == SKILL_UK_POSTCODE:
                return run_uk_postcode(params, self.client)
            if skill == SKILL_OUTWARD_CODE:
                return run_outward_code(params, self.client)
            if skill == SKILL_NEAREST_POSTCODE:
                return run_nearest_postcode(params, self.client)
            if skill == SKILL_ZIP_CODE:
                return run_zip_code(params, self.client)
        except UpstreamError as exc:
            return {"final_state": "failed", "message": str(exc), "artifact": None, "watch": None}
        except ValueError as exc:
            return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
        return {"final_state": "completed", "message": HELP, "artifact": None, "watch": None}


__all__ = [
    "CARD_SKILLS",
    "HELP",
    "MAX_LISTED",
    "PlaceAgent",
    "PlaceClient",
    "SKILL_CATCHMENT_AREA",
    "SKILL_NEAREST_POSTCODE",
    "SKILL_OUTWARD_CODE",
    "SKILL_UK_POSTCODE",
    "SKILL_ZIP_CODE",
    "UpstreamError",
    "country_from_text",
    "message_data",
    "message_text",
    "parse",
    "run_catchment_area",
    "run_nearest_postcode",
    "run_outward_code",
    "run_uk_postcode",
    "run_zip_code",
]
