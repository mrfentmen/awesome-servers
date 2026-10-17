#!/usr/bin/env python3
"""End-to-end smoke test for the postal code A2A server.

    PLACE_ALLOW_PRIVATE_WEBHOOKS=1 python3 servers/place/server.py --port 8873
    python3 servers/place/tools/smoke.py --base http://127.0.0.1:8873

Live: every check reads the real postcodes.io or zippopotam.us. The checks assert on
the shape of what comes back and on the two feeds' different coverage rather than on
a particular place existing.
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

UK_DATASET = "api.postcodes.io"
WORLD_DATASET = "api.zippopotam.us"
BUCKINGHAM_PALACE = "SW1A 1AA"
LONDON_POINT = "51.5010,-0.1416"
MANCHESTER_POINT = "53.4808,-2.2426"
US_ZIP = "11235"


def artifact_data(response: dict) -> dict:
    return ((response.get("artifacts") or [{}])[-1].get("parts") or [{}])[0].get("data", {})


def ask(smoke: Smoke, text: str) -> dict:
    return smoke.rpc("message/send", {"message": smoke.user_message(text)}).get("result", {})


def ask_structured(smoke: Smoke, **fields) -> dict:
    """A message with explicit data parts, for a question text cannot express."""
    message = smoke.user_message("")
    message["parts"].append({"kind": "data", "data": dict(fields)})
    return smoke.rpc("message/send", {"message": message}).get("result", {})


def text_of(response: dict) -> str:
    return response.get("status", {}).get("message", {}).get("parts", [{}])[0].get("text", "")


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="smoke-test the postal code A2A server")
    parser.add_argument("--base", default="http://127.0.0.1:8873")
    parser.add_argument("--hook", default="http://127.0.0.1:8822/hooks")
    args = parser.parse_args(argv)

    smoke = Smoke(args.base)
    if not smoke.card_checks(
        "Postal Code Agent",
        ["uk-postcode", "outward-code", "nearest-postcode", "zip-code", "catchment-area"],
    ):
        return 1

    # Live: a UK postcode with its ONS geography.
    uk = ask(smoke, f"what is in postcode {BUCKINGHAM_PALACE}?")
    uk_data = artifact_data(uk)
    record = uk_data.get("postcode_record") or {}
    smoke.check("uk-postcode completes", uk.get("status", {}).get("state") == "completed",
                str(uk.get("status", {}).get("state")))
    smoke.check("the postcode resolved", record.get("postcode") == BUCKINGHAM_PALACE,
                str(record.get("postcode")))
    smoke.check("coordinates come back", record.get("latitude") is not None
                and record.get("longitude") is not None,
                f"{record.get('latitude')},{record.get('longitude')}")
    smoke.check("ONS geography comes with it",
                bool(record.get("admin_district")) and bool(record.get("parliamentary_constituency")),
                f"district={record.get('admin_district')} ward={record.get('admin_ward')}")
    smoke.check("uk-postcode cites postcodes.io", uk_data.get("dataset") == UK_DATASET)
    # A postcode with no space is the same postcode.
    unspaced = ask(smoke, "where is SW1A1AA?")
    smoke.check("the space in a UK postcode is optional",
                (artifact_data(unspaced).get("postcode_record") or {}).get("postcode")
                == BUCKINGHAM_PALACE,
                str((artifact_data(unspaced).get("postcode_record") or {}).get("postcode")))

    # Live: every postcode under an outward code.
    outward = ask(smoke, "what postcodes are in SW1A?")
    outward_data = artifact_data(outward)
    rows = outward_data.get("postcodes") or []
    smoke.check("outward-code completes", outward.get("status", {}).get("state") == "completed")
    smoke.check("postcodes returned under the outward code",
                bool(rows) and all(str(row.get("postcode", "")).startswith("SW1A") for row in rows),
                str([row.get("postcode") for row in rows[:5]]))

    # Live: the reverse lookup, UK only.
    near = ask(smoke, f"which postcodes are near {LONDON_POINT}?")
    near_data = artifact_data(near)
    nearest = near_data.get("postcodes") or []
    smoke.check("nearest-postcode completes", near.get("status", {}).get("state") == "completed")
    smoke.check("postcodes returned with real distances",
                bool(nearest) and nearest[0].get("distance_km") is not None,
                str([(row.get("postcode"), row.get("distance_km")) for row in nearest[:3]]))
    smoke.check("sorted by distance",
                all(nearest[i]["distance_km"] <= nearest[i + 1]["distance_km"]
                    for i in range(len(nearest) - 1)))
    # A point in the United States is outside this dataset, and says so.
    outside = ask(smoke, "which postcodes are near 40.7580,-73.9855?")
    smoke.check("a point outside the UK is reported, not guessed",
                outside.get("status", {}).get("state") == "completed"
                and "no postcode within" in text_of(outside),
                text_of(outside)[:140])

    # Live: a postal code outside the UK, on the other feed.
    world = ask(smoke, f"what is ZIP code {US_ZIP}?")
    world_data = artifact_data(world)
    places = world_data.get("places") or []
    smoke.check("zip-code completes", world.get("status", {}).get("state") == "completed")
    smoke.check("a place came back with coordinates",
                bool(places) and places[0].get("latitude") is not None,
                str([(row.get("place"), row.get("state_code")) for row in places]))
    smoke.check("zip-code cites zippopotam", world_data.get("dataset") == WORLD_DATASET)
    # A UK postcode is read from postcodes.io even when the question says "ZIP code",
    # and the world feed is never asked for it.
    uk_via_world = artifact_data(ask(smoke, f"what is ZIP code {BUCKINGHAM_PALACE}?"))
    smoke.check("a UK code is read from the UK feed, not the world one",
                uk_via_world.get("dataset") == UK_DATASET, str(uk_via_world.get("dataset")))
    # And the world feed's own gap is explained rather than reported as "not found".
    gap = ask_structured(smoke, skill="zip-code",
                         postal_code=BUCKINGHAM_PALACE.replace(" ", ""), country="gb")
    smoke.check("the world's gap on the UK is explained",
                "does not cover the United Kingdom" in text_of(gap), text_of(gap)[:140])


    # input-required -> follow-up when nothing to look up was named.
    lonely = ask(smoke, "what is in that postcode?")
    smoke.check("uk-postcode without a postcode -> input-required",
                lonely.get("status", {}).get("state") == "input-required",
                str(lonely.get("status", {}).get("state")))
    follow = smoke.rpc(
        "message/send",
        {"message": smoke.user_message(BUCKINGHAM_PALACE, taskId=lonely.get("id"),
                                       contextId=lonely.get("contextId"))},
    ).get("result", {})
    smoke.check("follow-up with a postcode completes",
                follow.get("status", {}).get("state") == "completed"
                and (artifact_data(follow).get("postcode_record") or {}).get("postcode")
                == BUCKINGHAM_PALACE,
                text_of(follow)[:120])

    # A postcode the feed does not hold is reported, not invented.
    absent = ask(smoke, "what is in postcode ZZ99 9ZZ?")
    smoke.check("an unknown postcode is reported, not guessed",
                absent.get("status", {}).get("state") == "completed"
                and "holds no UK postcode" in text_of(absent),
                text_of(absent)[:140])

    # Streaming.
    events = smoke.stream("message/stream", {"message": smoke.user_message(f"what is ZIP code {US_ZIP}?")})
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
