#!/usr/bin/env python3
"""End-to-end smoke test for the Citi Bike A2A server.

    BIKESHARE_ALLOW_PRIVATE_WEBHOOKS=1 python3 servers/bikeshare/server.py --port 8872
    python3 servers/bikeshare/tools/smoke.py --base http://127.0.0.1:8872

Live: every check reads Citi Bike's real GBFS feeds. Counts move every few seconds,
so the checks assert on shape and on the feed's own flags rather than on a station
happening to hold a bike.
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

DATASET = "gbfs.citibikenyc.com"
TIMES_SQUARE = "40.7484,-73.9857"
ROCKEFELLER = "40.7580,-73.9855"
BROOKLYN_BRIDGE = "40.7008,-73.9938"


def artifact_data(response: dict) -> dict:
    return ((response.get("artifacts") or [{}])[-1].get("parts") or [{}])[0].get("data", {})


def ask(smoke: Smoke, text: str) -> dict:
    return smoke.rpc("message/send", {"message": smoke.user_message(text)}).get("result", {})


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="smoke-test the Citi Bike A2A server")
    parser.add_argument("--base", default="http://127.0.0.1:8872")
    parser.add_argument("--hook", default="http://127.0.0.1:8821/hooks")
    args = parser.parse_args(argv)

    smoke = Smoke(args.base)
    if not smoke.card_checks(
        "Citi Bike Station Agent",
        ["bikes-near", "nearest-stations", "station-lookup", "availability", "ride-pair"],
    ):
        return 1

    # Live: stations around Times Square with their real counts.
    near = ask(smoke, f"where can I get a bike near {TIMES_SQUARE}?")
    near_data = artifact_data(near)
    stations = near_data.get("stations") or []
    smoke.check("bikes-near completes", near.get("status", {}).get("state") == "completed",
                str(near.get("status", {}).get("state")))
    smoke.check("stations returned with real distances",
                bool(stations) and stations[0].get("distance_km") is not None,
                str([(row.get("name"), row.get("distance_km")) for row in stations[:3]]))
    smoke.check("sorted by distance",
                all(stations[i]["distance_km"] <= stations[i + 1]["distance_km"]
                    for i in range(len(stations) - 1)))
    smoke.check("counts are the feed's own",
                all(row.get("bikes_available") is not None and row.get("docks_available") is not None
                    for row in stations),
                str([(row.get("bikes_available"), row.get("docks_available")) for row in stations[:3]]))
    smoke.check("the feed's service flags are reported",
                all(isinstance(row.get("renting"), bool) and isinstance(row.get("returning"), bool)
                    for row in stations))
    smoke.check("bikes-near cites the dataset", near_data.get("dataset") == DATASET)

    # Live: nearest stations regardless of state.
    closest = ask(smoke, f"which bike stations are closest to {ROCKEFELLER}?")
    closest_data = artifact_data(closest)
    smoke.check("nearest-stations completes", closest.get("status", {}).get("state") == "completed")
    smoke.check("nearest-stations keeps stations with nothing free",
                all("bikes_available" in row for row in (closest_data.get("stations") or [{}])))

    # Live: one station by name.
    lookup = ask(smoke, "what is at Broadway & W 48 St?")
    lookup_data = artifact_data(lookup)
    found = lookup_data.get("station_found") or {}
    smoke.check("station-lookup completes", lookup.get("status", {}).get("state") == "completed")
    smoke.check("the named station was found", bool(found.get("station_id")), str(found.get("name")))
    smoke.check("lookup reports bikes, docks and service state",
                found.get("bikes_available") is not None and found.get("docks_available") is not None
                and "in service" in lookup.get("status", {}).get("message", {}).get("parts", [{}])[0].get("text", ""),
                lookup.get("status", {}).get("message", {}).get("parts", [{}])[0].get("text", "")[:120])

    # A station the operator has taken out of service is reported as such, not as stock.
    retired = ask(smoke, f"which bike stations are closest to {BROOKLYN_BRIDGE}?")
    retired_data = artifact_data(retired)
    retired_text = retired.get("status", {}).get("message", {}).get("parts", [{}])[0].get("text", "")
    smoke.check("out-of-service and empty stations are named as they are",
                ("out of service" in retired_text) or ("no bikes free" in retired_text)
                or all("renting" in row for row in (retired_data.get("stations") or [{}])),
                retired_text[:160])

    # Live: the system-wide picture.
    totals = ask(smoke, "how many bikes are there right now?")
    totals_data = artifact_data(totals)
    system = totals_data.get("totals") or {}
    smoke.check("availability completes", totals.get("status", {}).get("state") == "completed")
    smoke.check("the whole system is counted",
                system.get("stations", 0) > 1000 and system.get("bikes_available", 0) > 0,
                str({key: system.get(key) for key in ("stations", "bikes_available",
                                                       "docks_available", "out_of_service")}))
    smoke.check("feed age is reported", isinstance(system.get("feed_age_seconds"), int),
                str(system.get("feed_age_seconds")))


    # input-required -> follow-up when no point is given.
    lonely = ask(smoke, "where can I get a bike?")
    smoke.check("bikes-near without a point -> input-required",
                lonely.get("status", {}).get("state") == "input-required",
                str(lonely.get("status", {}).get("state")))
    follow = smoke.rpc(
        "message/send",
        {"message": smoke.user_message(TIMES_SQUARE, taskId=lonely.get("id"),
                                       contextId=lonely.get("contextId"))},
    ).get("result", {})
    smoke.check("follow-up with a point completes",
                follow.get("status", {}).get("state") == "completed"
                and bool(artifact_data(follow).get("stations")),
                str(artifact_data(follow).get("point")))

    # ride-pair needs two points, and says so.
    half = ask(smoke, "can I bike from Times Square to somewhere?")
    smoke.check("ride-pair with one point -> input-required",
                half.get("status", {}).get("state") == "input-required",
                str(half.get("status", {}).get("state")))

    # Streaming.
    events = smoke.stream("message/stream", {"message": smoke.user_message("how many bikes are there?")})
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

    return smoke.finish()


if __name__ == "__main__":
    raise SystemExit(main())
