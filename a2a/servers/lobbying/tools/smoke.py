#!/usr/bin/env python3
"""End-to-end smoke test for the Senate lobbying A2A server.

    python3 servers/lobbying/server.py --port 8853
    python3 servers/lobbying/tools/smoke.py --base http://127.0.0.1:8853
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

DATASET = "lda.gov/api/v1/filings"
LOCKHEED_UUID = "9ad88323-8325-40eb-9036-eb5ea7c6827f"


def artifact_data(response: dict) -> dict:
    return ((response.get("artifacts") or [{}])[-1].get("parts") or [{}])[0].get("data", {})


def text_of(response: dict) -> str:
    return ((response.get("status") or {}).get("message") or {}).get("parts", [{}])[0].get("text", "")


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="smoke-test the Senate lobbying A2A server")
    parser.add_argument("--base", default="http://127.0.0.1:8853")
    args = parser.parse_args(argv)

    smoke = Smoke(args.base)
    if not smoke.card_checks(
        "Senate Lobbying Agent",
        ["client-filings", "filing-detail", "lobbyist-filings", "client-issues", "client-spend"],
    ):
        return 1

    # Live: a lobbying firm's filings for a year.
    filings = smoke.rpc(
        "message/send",
        {"message": smoke.user_message("which lobbying filings did Lockheed Martin make in 2024?")},
    ).get("result", {})
    filings_data = artifact_data(filings)
    rows = filings_data.get("filings") or []
    smoke.check("client-filings completes", filings.get("status", {}).get("state") == "completed")
    smoke.check("filings came back", bool(rows), str(len(rows)))
    smoke.check("the year and registrant were both filtered on",
                (filings_data.get("filters") or {}).get("filing_year") == 2024
                and "lockheed" in str((filings_data.get("filters") or {}).get("registrant_name", "")).lower(),
                str(filings_data.get("filters")))
    smoke.check("each filing carries a client, an amount and a posting date",
                all(row.get("client_name") and row.get("dt_posted") for row in rows),
                str([(row.get("client_name"), row.get("dt_posted")) for row in rows[:2]]))
    smoke.check("a filing with no amount says so rather than reporting zero",
                "no amount reported" in text_of(filings)
                or all(row.get("expenses") for row in rows),
                "LDA registrations and amendments report no amount")
    smoke.check("the message explains registrant vs client",
                "registrant is the lobbying firm" in text_of(filings))

    # Live: the same registrant narrowed to one quarter.
    quarter = smoke.rpc(
        "message/send",
        {"message": smoke.user_message("Lockheed Martin filings 2024, second quarter only")},
    ).get("result", {})
    quarter_data = artifact_data(quarter)
    smoke.check("a quarter is a filter, not part of the name",
                (quarter_data.get("filters") or {}).get("filing_type") == "Q2",
                str((quarter_data.get("filters") or {}).get("filing_type")))
    smoke.check("only that quarter came back",
                all(row.get("filing_type") == "Q2" for row in quarter_data.get("filings") or []),
                str([row.get("filing_type") for row in quarter_data.get("filings") or []]))

    # Live: one filing in full, with its issues and lobbyists.
    detail = smoke.rpc(
        "message/send", {"message": smoke.user_message(f"show me filing {LOCKHEED_UUID}")}
    ).get("result", {})
    detail_data = artifact_data(detail)
    filing = detail_data.get("filing") or {}
    activities = filing.get("activities") or []
    smoke.check("filing-detail completes", detail.get("status", {}).get("state") == "completed")
    smoke.check("the filing came back by uuid", filing.get("filing_uuid") == LOCKHEED_UUID,
                str(filing.get("filing_uuid")))
    smoke.check("its issue areas are listed", bool(activities), str(len(activities)))
    smoke.check("an issue carries its LDA code and the filer's own description",
                all(row.get("issue_code") and row.get("issue") for row in activities),
                str([(row.get("issue_code"), row.get("issue")) for row in activities[:3]]))
    smoke.check("its lobbyists are named with their covered positions",
                all(entry.get("name") for row in activities for entry in (row.get("lobbyists") or [])),
                str([entry.get("name") for row in activities[:1] for entry in (row.get("lobbyists") or [])]))
    smoke.check("the message says where the issues came from",
                "issue filters are accepted and then ignored" in text_of(detail))

    # Live: the filings a lobbyist appears on.
    lobbyist = smoke.rpc(
        "message/send",
        {"message": smoke.user_message("which filings is the lobbyist BRETT GARSON on in 2024?")},
    ).get("result", {})
    lobbyist_data = artifact_data(lobbyist)
    smoke.check("lobbyist-filings completes or reports no match",
                lobbyist.get("status", {}).get("state") == "completed",
                str(lobbyist.get("status", {}).get("state")))
    smoke.check("the lobbyist name was the filter",
                "GARSON" in str((lobbyist_data.get("filters") or {}).get("lobbyist_name", "")).upper()
                or "No filing in LDA names a lobbyist" in text_of(lobbyist),
                str((lobbyist_data.get("filters") or {}).get("lobbyist_name")))
    if lobbyist_data.get("filings"):
        smoke.check("each filing names its registrant",
                    all(row.get("registrant_name") for row in lobbyist_data["filings"]),
                    str([row.get("registrant_name") for row in lobbyist_data["filings"][:2]]))

    # Live: the issue areas a registrant covered.
    issues = smoke.rpc(
        "message/send",
        {"message": smoke.user_message("what issues did Lockheed Martin lobby on in 2024?")},
    ).get("result", {})
    issues_data = artifact_data(issues)
    smoke.check("client-issues completes", issues.get("status", {}).get("state") == "completed")
    smoke.check("the issue counts were read from the filings themselves",
                any("of" in line and "filing(s)" in line for line in text_of(issues).splitlines()),
                text_of(issues).splitlines()[1][:90] if len(text_of(issues).splitlines()) > 1 else "")
    smoke.check("the filings behind the issues are in the artifact",
                bool(issues_data.get("filings")),
                str(len(issues_data.get("filings") or [])))
    smoke.check("the message admits LDA has no issue filter",
                "accepts an issue filter and then ignores it" in text_of(issues))

    # input-required: a registrant question with no registrant named.
    bare = smoke.rpc(
        "message/send", {"message": smoke.user_message("which lobbying filings were made in 2024?")}
    ).get("result", {})
    smoke.check("a registrant question with no name -> input-required",
                bare.get("status", {}).get("state") == "input-required")
    smoke.check("the prompt names a real registrant",
                "Lockheed Martin" in text_of(bare), text_of(bare)[:80])

    # The premium skill with no licence key: a completed answer, not a crash.
    spend = smoke.rpc(
        "message/send",
        {"message": smoke.user_message(
            "how much did Lockheed Martin disclose for lobbying in 2024?")},
    ).get("result", {})
    spend_data = artifact_data(spend)
    smoke.check("client-spend without a key -> completed",
                spend.get("status", {}).get("state") == "completed",
                str(spend.get("status", {}).get("state")))
    smoke.check("the licence refusal is the answer",
                spend_data.get("reason") in ("missing_key", "denied"), str(spend_data.get("reason")))
    smoke.check("no total leaks without a licence",
                "total_expenses" not in spend_data and "Disclosed expenses" not in text_of(spend))

    # Streaming.
    events = smoke.stream("message/stream", {"message": smoke.user_message(
        "which lobbying filings did Lockheed Martin make in 2024?")})
    kinds = [event.get("kind") for event in events]
    smoke.check("stream starts with task + working status", kinds[:2] == ["task", "status-update"], str(kinds))
    smoke.check("stream includes artifact", "artifact-update" in kinds)
    smoke.check("stream ends final",
                bool(events[-1].get("final"))
                and events[-1].get("status", {}).get("state") == "completed")

    return smoke.finish()


if __name__ == "__main__":
    raise SystemExit(main())
