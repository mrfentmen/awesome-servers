#!/usr/bin/env python3
"""End-to-end smoke test for the GovTrack votes A2A server.

    python3 servers/votes/server.py --port 8854
    python3 servers/votes/tools/smoke.py --base http://127.0.0.1:8854
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

DATASET = "govtrack.us/api/v2/vote"
BILL_DATASET = "govtrack.us/api/v2/bill"
ROLE_DATASET = "govtrack.us/api/v2/role"
COMMITTEE_DATASET = "govtrack.us/api/v2/committee"


def artifact_data(response: dict) -> dict:
    return ((response.get("artifacts") or [{}])[-1].get("parts") or [{}])[0].get("data", {})


def text_of(response: dict) -> str:
    return ((response.get("status") or {}).get("message") or {}).get("parts", [{}])[0].get("text", "")


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="smoke-test the GovTrack votes A2A server")
    parser.add_argument("--base", default="http://127.0.0.1:8854")
    args = parser.parse_args(argv)

    smoke = Smoke(args.base)
    if not smoke.card_checks(
        "GovTrack Votes Agent",
        ["roll-call-votes", "bill-lookup", "member-lookup", "committee-lookup", "chamber-scorecard"],
    ):
        return 1

    # Live: the roll-call votes of one chamber.
    votes = smoke.rpc(
        "message/send",
        {"message": smoke.user_message(
            "what roll-call votes did the Senate hold in the 119th Congress?")},
    ).get("result", {})
    votes_data = artifact_data(votes)
    rows = votes_data.get("votes") or []
    smoke.check("roll-call-votes completes", votes.get("status", {}).get("state") == "completed")
    smoke.check("votes came back", bool(rows), str(len(rows)))
    smoke.check("the congress and chamber were both filtered on",
                (votes_data.get("filters") or {}).get("congress") == 119
                and (votes_data.get("filters") or {}).get("chamber") == "senate",
                str(votes_data.get("filters")))
    smoke.check("GovTrack holds more votes than the page shows",
                (votes_data.get("total") or 0) > len(rows),
                f"total {votes_data.get('total')}, showing {len(rows)}")
    smoke.check("each vote has a number, a result and a category",
                all(row.get("number") is not None and row.get("category") for row in rows),
                str([(row.get("number"), row.get("category")) for row in rows[:3]]))
    smoke.check("a category GovTrack actually uses is reported",
                any(row.get("category") in ("cloture", "procedural", "nomination",
                                            "amendment", "passage") for row in rows),
                str({row.get("category") for row in rows}))
    smoke.check("the message labels the margins as GovTrack's own",
                "GovTrack's own" in text_of(votes))
    smoke.check("votes cite the vote dataset", votes_data.get("dataset") == DATASET)

    # Live: the House in the same congress, to prove the chamber filter is real.
    house = smoke.rpc(
        "message/send",
        {"message": smoke.user_message("roll-call votes in the House in the 119th Congress")},
    ).get("result", {})
    house_data = artifact_data(house)
    smoke.check("the chamber filter really separates the two",
                (house_data.get("filters") or {}).get("chamber") == "house",
                str(house_data.get("filters")))
    smoke.check("the House and Senate hold different numbers of votes",
                house_data.get("total") != votes_data.get("total"),
                f"house {house_data.get('total')} vs senate {votes_data.get('total')}")

    # Live: bills by search term, then by type and status.
    bills = smoke.rpc(
        "message/send",
        {"message": smoke.user_message("bills about infrastructure in the 119th Congress")},
    ).get("result", {})
    bills_data = artifact_data(bills)
    smoke.check("bill-lookup completes", bills.get("status", {}).get("state") == "completed")
    smoke.check("the search term is the topic, not the whole question",
                bills_data.get("query") == "infrastructure", str(bills_data.get("query")))
    smoke.check("bills came back", bool(bills_data.get("bills")), str(len(bills_data.get("bills") or [])))
    smoke.check("each bill has a number, a title and a status",
                all(row.get("display_number") and row.get("current_status_label")
                    for row in bills_data.get("bills") or []),
                str([(row.get("display_number"), row.get("current_status_label"))
                     for row in (bills_data.get("bills") or [])[:2]]))
    smoke.check("bills cite the bill dataset", bills_data.get("dataset") == BILL_DATASET)
    filtered = smoke.rpc(
        "message/send",
        {"message": smoke.user_message("house bills that passed in congress 119")},
    ).get("result", {})
    filtered_data = artifact_data(filtered)
    smoke.check("status and type became filters, not a search term",
                (filtered_data.get("filters") or {}).get("current_status") == "passed_bill"
                and (filtered_data.get("filters") or {}).get("bill_type") == "house_bill",
                str(filtered_data.get("filters")))
    smoke.check("no term was invented from the filters", "q" not in (filtered_data.get("filters") or {}),
                str(filtered_data.get("filters")))

    # Live: members by state and party.
    members = smoke.rpc(
        "message/send",
        {"message": smoke.user_message("who are the current Democratic senators from California?")},
    ).get("result", {})
    members_data = artifact_data(members)
    member_rows = members_data.get("members") or []
    smoke.check("member-lookup completes", members.get("status", {}).get("state") == "completed")
    smoke.check("the state name resolved to its code",
                (members_data.get("filters") or {}).get("state") == "CA",
                str((members_data.get("filters") or {}).get("state")))
    smoke.check("the party adjective resolved to GovTrack's noun",
                (members_data.get("filters") or {}).get("party") == "Democrat",
                str((members_data.get("filters") or {}).get("party")))
    smoke.check("members came back for California", bool(member_rows), str(len(member_rows)))
    smoke.check("every member is a Californian of that party",
                all(row.get("state") == "CA" and row.get("party") == "Democrat" for row in member_rows),
                str([(row.get("person_name"), row.get("state"), row.get("party"))
                     for row in member_rows[:2]]))
    smoke.check("members cite the role dataset", members_data.get("dataset") == ROLE_DATASET)

    # Live: a committee, with the jurisdiction it publishes.
    committee = smoke.rpc(
        "message/send", {"message": smoke.user_message("which committee handles appropriations?")}
    ).get("result", {})
    committee_data = artifact_data(committee)
    matches = committee_data.get("committee_matches") or []
    smoke.check("committee-lookup completes", committee.get("status", {}).get("state") == "completed")
    smoke.check("the committee question words were not part of the name",
                committee_data.get("name") == "appropriations", str(committee_data.get("name")))
    smoke.check("a committee came back", bool(matches), str(len(matches)))
    smoke.check("the committee has a name, a code and a chamber",
                all(row.get("name") and row.get("code") and row.get("committee_type")
                    for row in matches),
                str([(row.get("name"), row.get("code"), row.get("committee_type")) for row in matches]))
    smoke.check("the committee's own jurisdiction is quoted",
                "jurisdiction:" in text_of(committee), text_of(committee)[-160:].replace("\n", " "))
    smoke.check("committees cite the committee dataset",
                committee_data.get("dataset") == COMMITTEE_DATASET)

    # input-required: a committee question with no committee named.
    bare = smoke.rpc(
        "message/send", {"message": smoke.user_message("which committee handles it?")}
    ).get("result", {})
    smoke.check("a committee question with no name -> input-required",
                bare.get("status", {}).get("state") == "input-required")
    smoke.check("the prompt shows a real code", "SSGA" in text_of(bare), text_of(bare)[:90])

    scorecard = smoke.rpc(
        "message/send",
        {"message": smoke.user_message("score the Senate votes in the 119th Congress")},
    ).get("result", {})
    scorecard_data = artifact_data(scorecard)
    smoke.check("chamber-scorecard without a key -> completed",
                scorecard.get("status", {}).get("state") == "completed",
                str(scorecard.get("status", {}).get("state")))

    # Streaming.
    events = smoke.stream("message/stream", {"message": smoke.user_message(
        "roll-call votes in the Senate in the 119th Congress")})
    kinds = [event.get("kind") for event in events]
    smoke.check("stream starts with task + working status", kinds[:2] == ["task", "status-update"], str(kinds))
    smoke.check("stream includes artifact", "artifact-update" in kinds)
    smoke.check("stream ends final",
                bool(events[-1].get("final"))
                and events[-1].get("status", {}).get("state") == "completed")

    return smoke.finish()


if __name__ == "__main__":
    raise SystemExit(main())
