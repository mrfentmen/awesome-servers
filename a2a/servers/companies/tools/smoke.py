#!/usr/bin/env python3
"""End-to-end smoke test for the GLEIF companies A2A server.

    python3 servers/companies/server.py --port 8851
    python3 servers/companies/tools/smoke.py --base http://127.0.0.1:8851
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

SERVER_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = SERVER_DIR.parents[1]
for path in (str(SERVER_DIR), str(REPO_ROOT)):
    if path not in sys.path:
        sys.path.insert(0, path)

from a2a_kit.smoke import Smoke  # noqa: E402  (path setup must come first)

DATASET = "api.gleif.org/api/v1/lei-records"
JPMORGAN_LEI = "8I5DZWZKVSZI1NUHU748"
BBC_LEI = "5493000IBP32UQZ0KL24"


def artifact_data(response: dict) -> dict:
    return ((response.get("artifacts") or [{}])[-1].get("parts") or [{}])[0].get("data", {})


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="smoke-test the GLEIF companies A2A server")
    parser.add_argument("--base", default="http://127.0.0.1:8851")
    args = parser.parse_args(argv)

    smoke = Smoke(args.base)
    if not smoke.card_checks(
        "GLEIF Companies Agent",
        ["entity-lookup", "lei-lookup", "ownership", "entities-in-country", "group-rollup"],
    ):
        return 1

    # Live: a legal entity by name, including the exact-spelling retry.
    entity = smoke.rpc(
        "message/send", {"message": smoke.user_message("look up JPMORGAN CHASE & CO")}
    ).get("result", {})
    entity_data = artifact_data(entity)
    records = entity_data.get("records") or []
    smoke.check("entity-lookup completes", entity.get("status", {}).get("state") == "completed")
    smoke.check("an entity came back", bool(records), str(len(records)))
    smoke.check("the record carries a 20-character LEI",
                len(str((records[0] if records else {}).get("lei", ""))) == 20,
                str((records[0] if records else {}).get("lei")))
    smoke.check("the record cites GLEIF", entity_data.get("dataset") == DATASET)
    smoke.check("GLEIF's own spelling is reported, not the caller's",
                entity_data.get("matched_name") == "JPMORGAN CHASE & CO.",
                str(entity_data.get("matched_name")))
    smoke.check("status and country are present",
                bool((records[0] if records else {}).get("status"))
                and bool((records[0] if records else {}).get("country")),
                f"{(records[0] if records else {}).get('status')} / "
                f"{(records[0] if records else {}).get('country')}")

    # Live: one entity from its LEI, with the registration block.
    by_lei = smoke.rpc(
        "message/send", {"message": smoke.user_message(f"what is LEI {JPMORGAN_LEI}?")}
    ).get("result", {})
    by_lei_data = artifact_data(by_lei)
    record = by_lei_data.get("record") or {}
    smoke.check("lei-lookup completes", by_lei.get("status", {}).get("state") == "completed")
    smoke.check("the LEI round-trips", record.get("lei") == JPMORGAN_LEI, str(record.get("lei")))
    smoke.check("a registration block is reported",
                (record.get("registration") or {}).get("registration_status") is not None,
                str((record.get("registration") or {}).get("registration_status")))
    smoke.check("a renewal date is reported",
                bool((record.get("registration") or {}).get("next_renewal_date")),
                str((record.get("registration") or {}).get("next_renewal_date")))
    smoke.check("corroboration level is reported",
                bool((record.get("registration") or {}).get("corroboration_level")),
                str((record.get("registration") or {}).get("corroboration_level")))

    # Live: an LEI the index does not hold.
    unknown = smoke.rpc(
        "message/send", {"message": smoke.user_message("what is LEI 8I5DZWZKVSZI1NUHU799?")}
    ).get("result", {})
    unknown_data = artifact_data(unknown)
    smoke.check("an unknown LEI completes rather than failing",
                unknown.get("status", {}).get("state") == "completed")
    smoke.check("an unknown LEI says so", unknown_data.get("record") is None, str(unknown_data))

    # Live: who a parent owns.
    ownership = smoke.rpc(
        "message/send",
        {"message": smoke.user_message(f"who owns the entities under ultimate parent {BBC_LEI}?")},
    ).get("result", {})
    ownership_data = artifact_data(ownership)
    children = ownership_data.get("records") or []
    smoke.check("ownership completes", ownership.get("status", {}).get("state") == "completed")
    smoke.check("children came back", bool(children), str(len(children)))
    smoke.check("the total is larger than the page",
                (ownership_data.get("total") or 0) >= len(children),
                f"total {ownership_data.get('total')}, showing {len(children)}")
    smoke.check("each child has a country and a status",
                all(row.get("country") and row.get("status") for row in children),
                str([(row.get("name"), row.get("country")) for row in children[:2]]))

    # Live: legal entities in a country, by code and by name.
    country = smoke.rpc(
        "message/send", {"message": smoke.user_message("which legal entities are registered in DE?")}
    ).get("result", {})
    country_data = artifact_data(country)
    smoke.check("entities-in-country completes", country.get("status", {}).get("state") == "completed")
    smoke.check("the country code is what GLEIF filters on", country_data.get("country") == "DE",
                str(country_data.get("country")))
    smoke.check("entities came back for that country", bool(country_data.get("records")),
                str(len(country_data.get("records") or [])))
    smoke.check("every row really is in that country",
                all(row.get("country") == "DE" for row in country_data.get("records") or []),
                str({row.get("country") for row in country_data.get("records") or []}))
    named = smoke.rpc(
        "message/send", {"message": smoke.user_message("show me LEI entities registered in Japan")}
    ).get("result", {})
    smoke.check("a country name resolves to its ISO code",
                artifact_data(named).get("country") == "JP", str(artifact_data(named).get("country")))

    # input-required: an LEI question with no LEI, asked for by skill id so the
    # prompt under test is the LEI one and not the company-name one.
    bare = smoke.rpc(
        "message/send",
        {"message": smoke.user_message("LEI", parts=[
            {"kind": "text", "text": "LEI"},
            {"kind": "data", "data": {"skill": "lei-lookup"}}])},
    ).get("result", {})
    smoke.check("an LEI question with no LEI -> input-required",
                bare.get("status", {}).get("state") == "input-required")
    smoke.check("the prompt shows a real LEI",
                BBC_LEI in bare.get("status", {}).get("message", {}).get("parts", [{}])[0].get("text", ""))

    rollup = smoke.rpc(
        "message/send", {"message": smoke.user_message(f"roll up the group under {BBC_LEI}")}
    ).get("result", {})
    rollup_data = artifact_data(rollup)
    smoke.check("group-rollup without a key -> completed",
                rollup.get("status", {}).get("state") == "completed",
                str(rollup.get("status", {}).get("state")))

    # Streaming.
    events = smoke.stream("message/stream", {"message": smoke.user_message("look up SIEMENS AG")})
    kinds = [event.get("kind") for event in events]
    smoke.check("stream starts with task + working status", kinds[:2] == ["task", "status-update"], str(kinds))
    smoke.check("stream includes artifact", "artifact-update" in kinds)
    smoke.check("stream ends final",
                bool(events[-1].get("final"))
                and events[-1].get("status", {}).get("state") == "completed")

    return smoke.finish()


if __name__ == "__main__":
    raise SystemExit(main())
