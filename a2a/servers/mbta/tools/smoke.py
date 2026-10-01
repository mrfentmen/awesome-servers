#!/usr/bin/env python3
"""End-to-end smoke test for the MBTA A2A server.

    MBTA_ALLOW_PRIVATE_WEBHOOKS=1 python3 servers/mbta/server.py --port 8870
    python3 servers/mbta/tools/smoke.py --base http://127.0.0.1:8870

Live: every check reads the real MBTA v3 feed. The agency rate limits unauthenticated
callers, so the checks below are spread over the few skills that matter most and the
client caches the catalogue feeds.
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

DATASET = "api-v3.mbta.com"
KENDALL = "place-pktrm"
DOWNTOWN_POINT = "42.3519,-71.0601"


def artifact_data(response: dict) -> dict:
    return ((response.get("artifacts") or [{}])[-1].get("parts") or [{}])[0].get("data", {})


def ask(smoke: Smoke, text: str) -> dict:
    return smoke.rpc("message/send", {"message": smoke.user_message(text)}).get("result", {})


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="smoke-test the MBTA A2A server")
    parser.add_argument("--base", default="http://127.0.0.1:8870")
    parser.add_argument("--hook", default="http://127.0.0.1:8819/hooks")
    args = parser.parse_args(argv)

    smoke = Smoke(args.base)
    if not smoke.card_checks(
        "MBTA Transit Agent",
        ["next-departures", "stop-times", "nearby-stops", "route-alerts", "service-alerts",
         "headway-check"],
    ):
        return 1

    # Live: the real-time board at Kendall/GIT.
    board = ask(smoke, f"when is the next train from {KENDALL}?")
    board_data = artifact_data(board)
    arrivals = board_data.get("arrivals") or []
    smoke.check("next-departures completes", board.get("status", {}).get("state") == "completed",
                str(board.get("status", {}).get("state")))
    smoke.check("arrivals returned live", len(arrivals) > 0, str(len(arrivals)))
    smoke.check("arrival carries a line and a direction",
                bool(arrivals) and bool(arrivals[0].get("route_name")) and bool(arrivals[0].get("direction")),
                str(arrivals[0].get("route_name")) if arrivals else "no arrivals")
    smoke.check("arrival times are agency-local",
                bool(arrivals) and bool(arrivals[0].get("at")) and ("+" in arrivals[0]["at"] or "-" in arrivals[0]["at"][10:]),
                str(arrivals[0].get("at")) if arrivals else "no arrivals")
    smoke.check("board cites the dataset", board_data.get("dataset") == DATASET)

    # Live: today's timetable at the same stop.
    timetable = ask(smoke, f"what's the timetable at {KENDALL} today?")
    timetable_data = artifact_data(timetable)
    smoke.check("stop-times completes", timetable.get("status", {}).get("state") == "completed")
    smoke.check("schedule returned", len(timetable_data.get("schedule") or []) > 0,
                str(len(timetable_data.get("schedule") or [])))

    # Live: stops near a point, in downtown Boston.
    nearby = ask(smoke, f"which mbta stops are near {DOWNTOWN_POINT}?")
    nearby_data = artifact_data(nearby)
    stops = nearby_data.get("stops") or []
    smoke.check("nearby-stops completes", nearby.get("status", {}).get("state") == "completed")
    smoke.check("stops returned with real distances",
                bool(stops) and stops[0].get("distance_km") is not None,
                str([(row.get("stop"), row.get("distance_km")) for row in stops[:3]]))
    if len(stops) > 1:
        smoke.check("sorted by distance", stops[0]["distance_km"] <= stops[1]["distance_km"],
                    f"{stops[0]['distance_km']} <= {stops[1]['distance_km']}")

    # Live: alerts for one line, named the way a rider would name it.
    line_alerts = ask(smoke, "any alerts on the Red Line?")
    line_data = artifact_data(line_alerts)
    smoke.check("route-alerts completes", line_alerts.get("status", {}).get("state") == "completed")
    smoke.check("a line name resolves to a route id", line_data.get("route") == "Red",
                str(line_data.get("route")))
    smoke.check("alerts use the agency's own wording",
                all("service_effect" in row or "header" in row
                    for row in (line_data.get("alerts") or [{}])),
                str(len(line_data.get("alerts") or [])))

    # Live: the network-wide view, which must not be captured by a line mention.
    network = ask(smoke, "how is the T running across the whole network?")
    network_data = artifact_data(network)
    smoke.check("service-alerts completes", network.get("status", {}).get("state") == "completed")
    smoke.check("network alerts carry a severity",
                all(row.get("severity_label") for row in (network_data.get("alerts") or [{}])),
                str([row.get("severity_label") for row in (network_data.get("alerts") or [])[:3]]))

    # The premium skill: without a key the gateway's own wording comes back as an answer.
    premium = ask(smoke, f"can I count on a train every 8 minutes from {KENDALL}?")
    premium_data = artifact_data(premium)
    state = premium.get("status", {}).get("state")
    if premium_data.get("premium") and premium_data.get("reason") in ("missing_key", "denied"):
        smoke.check("headway-check with no licence is a completed answer", state == "completed", str(state))
        smoke.check("the refusal names the key", "MCP_LICENSE_KEY" in premium.get("status", {}).get("message", {}).get("parts", [{}])[0].get("text", ""),
                    premium_data.get("reason"))
    else:
        smoke.check("headway-check returned live gaps", state == "completed"
                    and bool(premium_data.get("headway_minutes")), str(state))
        smoke.check("headway reports a median", premium_data.get("headway_minutes", {}).get("median") is not None,
                    str(premium_data.get("headway_minutes")))

    # input-required -> follow-up when no stop is named at all.
    lonely = smoke.rpc("message/send", {"message": smoke.user_message("when is the next train?")}).get("result", {})
    smoke.check("next-departures without a stop -> input-required",
                lonely.get("status", {}).get("state") == "input-required",
                str(lonely.get("status", {}).get("state")))
    follow = smoke.rpc(
        "message/send",
        {"message": smoke.user_message(KENDALL, taskId=lonely.get("id"),
                                       contextId=lonely.get("contextId"))},
    ).get("result", {})
    smoke.check("follow-up with a stop id completes",
                follow.get("status", {}).get("state") == "completed"
                and artifact_data(follow).get("stop") == KENDALL,
                str(artifact_data(follow).get("stop")))

    # Streaming.
    events = smoke.stream("message/stream", {"message": smoke.user_message(f"next bus from {KENDALL}")})
    kinds = [event.get("kind") for event in events]
    smoke.check("stream starts with task + working status", kinds[:2] == ["task", "status-update"], str(kinds))
    smoke.check("stream includes artifact", "artifact-update" in kinds)
    smoke.check("stream ends final",
                bool(events[-1].get("final")) and events[-1].get("status", {}).get("state") == "completed")

    # Push config CRUD.
    task_id = follow.get("id")
    config = smoke.rpc(
        "tasks/pushNotificationConfig/set",
        {"taskId": task_id, "pushNotificationConfig": {"url": args.hook, "token": "smoke"}},
    ).get("result", {})
    config_id = config.get("pushNotificationConfig", {}).get("id")
    smoke.check("push config set", bool(config_id))
    listed = smoke.rpc("tasks/pushNotificationConfig/list", {"taskId": task_id}).get("result", {})
    smoke.check("push config listed", len(listed.get("configs", [])) == 1)
    smoke.rpc("tasks/pushNotificationConfig/delete", {"taskId": task_id, "pushNotificationConfigId": config_id})
    after = smoke.rpc("tasks/pushNotificationConfig/list", {"taskId": task_id}).get("result", {})
    smoke.check("push config deleted", after.get("configs") == [])

    # A stop that does not exist is a question, not a crash.
    unknown = ask(smoke, "when is the next train from place-not-a-station?")
    smoke.check("an unknown stop is reported, not crashed",
                unknown.get("status", {}).get("state") in ("completed", "failed"),
                str(unknown.get("status", {}).get("state")))

    return smoke.finish()


if __name__ == "__main__":
    raise SystemExit(main())
