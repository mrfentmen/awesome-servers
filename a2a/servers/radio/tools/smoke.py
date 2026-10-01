#!/usr/bin/env python3
"""End-to-end smoke test for the radio-browser A2A server.

    RADIO_BROWSER_ALLOW_PRIVATE_WEBHOOKS=1 python3 servers/radio/server.py --port 8806
    python3 servers/radio/tools/smoke.py --base http://127.0.0.1:8806
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

DATASET = "de1.api.radio-browser.info/json"
POINT = "40.7006,-74.0142"


def artifact_data(response: dict) -> dict:
    return ((response.get("artifacts") or [{}])[-1].get("parts") or [{}])[0].get("data", {})


def json_message(text: str, data: dict) -> dict:
    """A user message carrying both a sentence and a data part, as the protocol wants.

    `Smoke.user_message` takes extra top-level keys, so passing `parts` to it would
    drop the text; the two parts have to be built here.
    """
    return {"kind": "message", "role": "user", "messageId": "smoke-json",
            "parts": [{"kind": "text", "text": text}, {"kind": "data", "data": data}]}


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="smoke-test the radio-browser A2A server")
    parser.add_argument("--base", default="http://127.0.0.1:8806")
    parser.add_argument("--hook", default="http://127.0.0.1:8799/hooks")
    args = parser.parse_args(argv)

    smoke = Smoke(args.base)
    if not smoke.card_checks(
        "Radio Browser Agent",
        ["stations-find", "station-detail", "stations-near", "genre-list", "station-roster"],
    ):
        return 1

    # Live: stations by genre tag, the read every other search builds on.
    found = smoke.rpc(
        "message/send", {"message": smoke.user_message("find jazz radio stations")}
    ).get("result", {})
    found_data = artifact_data(found)
    stations = found_data.get("stations") or []
    smoke.check("find skill completes", found.get("status", {}).get("state") == "completed")
    smoke.check("stations came back live", len(stations) > 0, str(len(stations)))
    smoke.check("find cites the dataset", found_data.get("dataset") == DATASET)
    smoke.check("the tag was passed through", (found_data.get("filters") or {}).get("tag") == "jazz",
                str((found_data.get("filters") or {}).get("tag")))
    smoke.check("every station reports its last check",
                all(row.get("health") for row in stations),
                str([row.get("health") for row in stations[:2]]))
    smoke.check("stations carry a stream url and codec",
                bool(stations) and bool(stations[0].get("stream_url"))
                and bool(stations[0].get("codec")),
                f"{stations[0].get('codec')} {stations[0].get('stream_url')}" if stations else "none")

    # Live: the same read narrowed to a country.
    us = smoke.rpc(
        "message/send", {"message": json_message("blues stations", {"tag": "blues", "country": "US",
                                                                     "limit": 5})},
    ).get("result", {})
    us_data = artifact_data(us)
    us_rows = us_data.get("stations") or []
    smoke.check("country filter accepted",
                us.get("status", {}).get("state") == "completed"
                and (us_data.get("filters") or {}).get("country") == "US",
                str((us_data.get("filters") or {}).get("country")))
    smoke.check("country-filtered stations are all US",
                all((row.get("countrycode") or "").upper() == "US" for row in us_rows),
                str([row.get("countrycode") for row in us_rows[:3]]))

    # Live: a station's full record, read from a uuid a live search actually returned.
    live_uuid = stations[0].get("stationuuid") if stations else None
    smoke.check("search returned a uuid to follow", bool(live_uuid), str(live_uuid))
    if live_uuid:
        detail = smoke.rpc(
            "message/send",
            {"message": json_message("station detail", {"uuid": live_uuid})},
        ).get("result", {})
        detail_data = artifact_data(detail)
        record = detail_data.get("station") or {}
        smoke.check("detail skill completes", detail.get("status", {}).get("state") == "completed")
        smoke.check("detail returned the same station",
                    record.get("stationuuid") == live_uuid, str(record.get("name")))
        smoke.check("detail names its tags and health",
                    bool(record.get("tags_list")) and bool(record.get("health")),
                    f"{record.get('health')} / {record.get('tags_list')}")

    # Live: stations near a point.
    near = smoke.rpc(
        "message/send", {"message": smoke.user_message(f"which radio stations are near {POINT}?")}
    ).get("result", {})
    near_data = artifact_data(near)
    near_rows = near_data.get("stations") or []
    smoke.check("near skill completes", near.get("status", {}).get("state") == "completed")
    smoke.check("near answered or said it is empty",
                bool(near_rows) or "no station with coordinates" in
                near.get("status", {}).get("message", {}).get("parts", [{}])[0].get("text", ""),
                str(len(near_rows)))
    if near_rows:
        measured = [row["distance_km"] for row in near_rows if row.get("distance_km") is not None]
        smoke.check("every station near a point holds coordinates",
                    all(row.get("geo_lat") is not None for row in near_rows),
                    str([row.get("geo_lat") for row in near_rows[:3]]))
        smoke.check("distances are measured", len(measured) == len(near_rows),
                    f"{len(measured)} of {len(near_rows)} measured")
        smoke.check("distances are ascending", measured == sorted(measured), str(measured[:5]))
        smoke.check("distance source is named",
                    near_data.get("distance_source") == "computed from the directory's own coordinates",
                    str(near_data.get("distance_source")))

    # Live: the directory's genre vocabulary.
    genres = smoke.rpc(
        "message/send", {"message": smoke.user_message("what genres of radio station are there?")}
    ).get("result", {})
    genres_data = artifact_data(genres)
    tag_rows = genres_data.get("tags") or []
    smoke.check("genre-list skill completes", genres.get("status", {}).get("state") == "completed")
    smoke.check("genre list came back live", len(tag_rows) > 0, str(len(tag_rows)))
    smoke.check("genres are ordered by station count",
                "most stations first" in genres.get("status", {}).get("message", {})
                .get("parts", [{}])[0].get("text", ""))
    counts = [row["stations"] for row in tag_rows if row.get("stations") is not None]
    smoke.check("counts descend", counts == sorted(counts, reverse=True), str(counts[:5]))

    # input-required -> follow-up carries a genre through.
    first = smoke.rpc(
        "message/send", {"message": smoke.user_message("find some radio stations for me")}
    ).get("result", {})
    smoke.check("find with no filter -> input-required",
                first.get("status", {}).get("state") == "input-required")
    follow = smoke.rpc(
        "message/send",
        {"message": json_message("blues", {}) | {
            "taskId": first.get("id"), "contextId": first.get("contextId")}},
    ).get("result", {})
    smoke.check("follow-up searches the directory",
                follow.get("status", {}).get("state") == "completed"
                and len(artifact_data(follow).get("stations") or []) > 0,
                str(len(artifact_data(follow).get("stations") or [])))

    # The premium skill: with no key set this must be a COMPLETED answer carrying the
    # gateway's own wording, not a crash and not a fabricated roster.
    premium = smoke.rpc(
        "message/send",
        {"message": smoke.user_message("give me a roster of jazz, blues and soul stations for tonight")},
    ).get("result", {})
    premium_text = premium.get("status", {}).get("message", {}).get("parts", [{}])[0].get("text", "")
    smoke.check("premium skill answers rather than crashing",
                premium.get("status", {}).get("state") in ("completed", "failed"),
                str(premium.get("status", {}).get("state")))
    smoke.check("premium skill names the licence gate",
                "radio_station_roster" in premium_text or "MCP_LICENSE_KEY" in premium_text,
                premium_text[:120])
    smoke.check("premium skill reports no stations without a licence",
                not artifact_data(premium).get("stations"),
                str(artifact_data(premium).get("reason")))
    smoke.check("premium skill kept the genres it was asked for",
                artifact_data(premium).get("tags") == "jazz,blues,soul",
                str(artifact_data(premium).get("tags")))

    # Streaming.
    events = smoke.stream("message/stream",
                          {"message": smoke.user_message("find jazz radio stations")})
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
    smoke.check("push config deleted", after.get("configs", []) == [])

    return smoke.finish()


if __name__ == "__main__":
    raise SystemExit(main())
