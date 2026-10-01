#!/usr/bin/env python3
"""End-to-end smoke test for the CourtListener case-law A2A server.

    python3 servers/courts/server.py --port 8850
    python3 servers/courts/tools/smoke.py --base http://127.0.0.1:8850
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

DATASET = "courtlistener.com/api/rest/v4/search"
COURTS_DATASET = "courtlistener.com/api/rest/v4/courts"


def artifact_data(response: dict) -> dict:
    return ((response.get("artifacts") or [{}])[-1].get("parts") or [{}])[0].get("data", {})


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="smoke-test the CourtListener A2A server")
    parser.add_argument("--base", default="http://127.0.0.1:8850")
    args = parser.parse_args(argv)

    smoke = Smoke(args.base)
    if not smoke.card_checks(
        "CourtListener Case Law Agent",
        ["opinion-search", "case-lookup", "court-info", "judge-lookup", "citation-census"],
    ):
        return 1

    # Live: opinions on a topic.
    opinions = smoke.rpc(
        "message/send", {"message": smoke.user_message("what case law is there on the fourth amendment?")}
    ).get("result", {})
    opinions_data = artifact_data(opinions)
    smoke.check("opinion-search completes", opinions.get("status", {}).get("state") == "completed")
    smoke.check("opinions returned", len(opinions_data.get("opinions") or []) >= 3,
                str(len(opinions_data.get("opinions") or [])))
    smoke.check("opinions cite the search dataset", opinions_data.get("dataset") == DATASET)
    smoke.check("the query was the topic, not the whole question",
                opinions_data.get("query") == "fourth amendment", str(opinions_data.get("query")))
    smoke.check("total hits reported", (opinions_data.get("total_hits") or 0) > 100,
                str(opinions_data.get("total_hits")))
    smoke.check("each opinion carries a case name and a court",
                all(row.get("caseName") and row.get("court") for row in opinions_data.get("opinions") or []))

    # Live: the same search narrowed to one court and a date range.
    scoped = smoke.rpc(
        "message/send",
        {"message": smoke.user_message("privacy opinions in the D.C. Circuit filed after 2021-01-01")},
    ).get("result", {})
    scoped_data = artifact_data(scoped)
    smoke.check("court filter applied", scoped_data.get("court") == "cadc", str(scoped_data.get("court")))
    smoke.check("filed-after filter applied", scoped_data.get("filed_after") == "2021-01-01",
                str(scoped_data.get("filed_after")))
    smoke.check("every scoped opinion is from that court",
                all(row.get("court_id") == "cadc" for row in scoped_data.get("opinions") or []),
                str({row.get("court_id") for row in scoped_data.get("opinions") or []}))

    # Live: a docket by number.
    docket = smoke.rpc(
        "message/send", {"message": smoke.user_message("look up docket 20-5364 in the D.C. Circuit")}
    ).get("result", {})
    docket_data = artifact_data(docket)
    smoke.check("case-lookup completes", docket.get("status", {}).get("state") == "completed")
    smoke.check("a docket came back", len(docket_data.get("dockets") or []) >= 1,
                str(len(docket_data.get("dockets") or [])))
    smoke.check("the docket number used was 20-5364", docket_data.get("query") == "20-5364",
                str(docket_data.get("query")))
    smoke.check("docket rows carry a court", all(row.get("court_id") for row in docket_data.get("dockets") or []))

    # Live: court metadata, by code and by written name.
    court = smoke.rpc("message/send", {"message": smoke.user_message("what court is cadc?")}).get("result", {})
    court_data = artifact_data(court)
    matches = court_data.get("court_matches") or []
    smoke.check("court-info completes", court.get("status", {}).get("state") == "completed")
    smoke.check("cadc resolved", bool(matches) and matches[0].get("id") == "cadc",
                str([row.get("id") for row in matches[:3]]))
    smoke.check("court rows cite the court list", court_data.get("dataset") == COURTS_DATASET)
    written = smoke.rpc(
        "message/send", {"message": smoke.user_message("list the courts in the 9th circuit")}
    ).get("result", {})
    written_data = artifact_data(written)
    smoke.check("a written circuit name resolves to a code",
                (written_data.get("court_matches") or [{}])[0].get("id") == "ca9",
                str(written_data.get("court_matches")))

    # Live: a judge by name.
    judge = smoke.rpc(
        "message/send", {"message": smoke.user_message("look up the judge Ruth Bader Ginsburg")}
    ).get("result", {})
    judge_data = artifact_data(judge)
    people = judge_data.get("people") or []
    smoke.check("judge-lookup completes", judge.get("status", {}).get("state") == "completed")
    smoke.check("a judge came back", bool(people), str(len(people)))
    smoke.check("the judge carries positions",
                bool((people[0] if people else {}).get("positions")),
                str((people[0] if people else {}).get("name")))

    # input-required: a court question with no court named.
    bare = smoke.rpc("message/send", {"message": smoke.user_message("list the courts")}).get("result", {})
    smoke.check("a court question with no code -> input-required",
                bare.get("status", {}).get("state") == "input-required")
    smoke.check("the prompt asks for a code",
                "CourtListener code" in bare.get("status", {}).get("message", {}).get("parts", [{}])[0]
                .get("text", ""))

    # The premium skill with no licence key: a completed answer, not a crash.
    census = smoke.rpc(
        "message/send",
        {"message": smoke.user_message("which authorities does the privacy case law lean on?")},
    ).get("result", {})
    census_data = artifact_data(census)
    smoke.check("citation-census without a key -> completed",
                census.get("status", {}).get("state") == "completed",
                str(census.get("status", {}).get("state")))
    smoke.check("the licence refusal is the answer",
                census_data.get("reason") in ("missing_key", "denied"), str(census_data.get("reason")))
    smoke.check("no authorities leak without a licence", "authorities" not in census_data)
    smoke.check("the premium skill is on the card", True)

    # Streaming.
    events = smoke.stream("message/stream", {"message": smoke.user_message("case law about standing")})
    kinds = [event.get("kind") for event in events]
    smoke.check("stream starts with task + working status", kinds[:2] == ["task", "status-update"], str(kinds))
    smoke.check("stream includes artifact", "artifact-update" in kinds)
    smoke.check("stream ends final",
                bool(events[-1].get("final"))
                and events[-1].get("status", {}).get("state") == "completed")

    return smoke.finish()


if __name__ == "__main__":
    raise SystemExit(main())
