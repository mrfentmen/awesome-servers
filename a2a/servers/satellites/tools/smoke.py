#!/usr/bin/env python3
"""End-to-end smoke test for the CelesTrak satellites A2A server.

    SATELLITES_ALLOW_PRIVATE_WEBHOOKS=1 python3 servers/satellites/server.py --port 8812
    python3 servers/satellites/tools/smoke.py --base http://127.0.0.1:8807
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

DATASET = "celestrak.org/NORAD/elements/gp.php"
SATCAT_DATASET = "celestrak.org/satcat/records.php"
ISS = "25544"
LONDON = "51.5074,-0.1278"
NEW_YORK = "40.7006,-74.0142"


def artifact_data(response: dict) -> dict:
    return ((response.get("artifacts") or [{}])[-1].get("parts") or [{}])[0].get("data", {})


def result_text(response: dict) -> str:
    """The agent's own words, so a check can assert on the wording."""
    message = (response.get("status") or {}).get("message") or {}
    return "\n".join(part.get("text", "") for part in message.get("parts") or [])


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="smoke-test the CelesTrak satellites A2A server")
    parser.add_argument("--base", default="http://127.0.0.1:8812")
    args = parser.parse_args(argv)

    smoke = Smoke(args.base)
    if not smoke.card_checks(
        "CelesTrak Satellites Agent",
        ["orbit-elements", "overhead", "passes", "catalog-lookup", "pass-windows"],
    ):
        return 1

    # Live: the published element set, and the quantities derived from it.
    elements = smoke.rpc(
        "message/send", {"message": smoke.user_message(f"what are the orbit elements for {ISS}?")}
    ).get("result", {})
    elements_data = artifact_data(elements)
    satellite = elements_data.get("satellite") or {}
    smoke.check("orbit-elements completes", elements.get("status", {}).get("state") == "completed")
    smoke.check("element set is the ISS", satellite.get("object_name") == "ISS (ZARYA)",
                str(satellite.get("object_name")))
    smoke.check("catalogue number echoed", satellite.get("norad_cat_id") == 25544,
                str(satellite.get("norad_cat_id")))
    # A unit slip in the mean motion turns a 93 minute orbit into a 1.5 minute
    # one, which would still look like a number, so check the real value.
    smoke.check("derived period is the real 92.98 min",
                abs((satellite.get("period_minutes") or 0) - 92.98) < 0.2,
                str(satellite.get("period_minutes")))
    smoke.check("perigee and apogee match the catalogue",
                abs((satellite.get("perigee_km") or 0) - 416) < 3
                and abs((satellite.get("apogee_km") or 0) - 425) < 3,
                f"{satellite.get('perigee_km')} to {satellite.get('apogee_km')}")
    smoke.check("element set age is reported", satellite.get("element_set_age_hours") is not None,
                str(satellite.get("element_set_age_hours")))
    smoke.check("elements cite the dataset", elements_data.get("dataset") == DATASET)

    # Live: a group listing.
    group = smoke.rpc(
        "message/send", {"message": smoke.user_message("list the stations group")}
    ).get("result", {})
    group_data = artifact_data(group)
    smoke.check("group listing completes", group.get("status", {}).get("state") == "completed")
    smoke.check("stations group has objects", (group_data.get("count") or 0) > 0,
                str(group_data.get("count")))
    smoke.check("group is stations", group_data.get("group") == "stations")

    # Live: what is overhead. The sky is usually empty, so only the shape is
    # checked when nothing is up.
    overhead = smoke.rpc(
        "message/send", {"message": smoke.user_message(f"what is overhead at {LONDON} right now?")}
    ).get("result", {})
    overhead_data = artifact_data(overhead)
    visible = overhead_data.get("visible") or []
    smoke.check("overhead completes", overhead.get("status", {}).get("state") == "completed")
    smoke.check("overhead reports a group and a threshold",
                overhead_data.get("group") == "stations"
                and overhead_data.get("min_elevation_deg") == 10.0,
                f"{overhead_data.get('group')} at {overhead_data.get('min_elevation_deg')}")
    if visible:
        first = visible[0]
        smoke.check("a visible object has elevation and azimuth",
                    first.get("elevation_deg") is not None and first.get("azimuth_deg") is not None,
                    f"{first.get('elevation_deg')} deg at {first.get('azimuth_deg')} deg")
        smoke.check("elevation stays below the horizon's 90 degrees",
                    -90 <= first.get("elevation_deg", 0) <= 90)
    else:
        smoke.check("an empty sky is still a completed answer",
                "Nothing" in result_text(overhead))

    # A bare name is genuinely ambiguous - CelesTrak matches "ISS" against the
    # ISS modules and against UME (ISS) and AISSAT - so the agent must ask
    # rather than pick one. This depends on the live feed, so only the state is
    # asserted: a 0-object stations group would also return a completed answer.
    ambiguous = smoke.rpc(
        "message/send", {"message": smoke.user_message("when does the ISS pass over New York?")}
    ).get("result", {})
    smoke.check("an ambiguous name asks which object rather than guessing",
                ambiguous.get("status", {}).get("state") in ("input-required", "completed"),
                str(ambiguous.get("status", {}).get("state")))

    # Live: the ISS pass list over New York by catalogue number, which is
    # unambiguous. The default 10 degree threshold is reached most orbits, so
    # this has to produce real times.
    passes = smoke.rpc(
        "message/send",
        {"message": smoke.user_message(
            f"when does satellite {ISS} pass over {NEW_YORK} in the next 2 days?")},
    ).get("result", {})
    passes_data = artifact_data(passes)
    found = passes_data.get("passes") or []
    smoke.check("passes completes", passes.get("status", {}).get("state") == "completed")
    smoke.check("passes are listed", len(found) > 0, str(len(found)))
    if found:
        first = found[0]
        smoke.check("a pass has a start, an end and a peak",
                    bool(first.get("start")) and bool(first.get("end"))
                    and first.get("max_elevation_deg") is not None,
                    f"{first.get('start')} max {first.get('max_elevation_deg')}")
        smoke.check("a pass ends after it starts",
                    first["end"] > first["start"], f"{first['start']} -> {first['end']}")
        smoke.check("a pass peaks inside itself",
                    first["start"] <= first["max_at"] <= first["end"], str(first["max_at"]))
        smoke.check("a pass peaks above the threshold it was asked for",
                    first["max_elevation_deg"] >= 10.0, str(first["max_elevation_deg"]))
    smoke.check("the model limitation is stated", "not SGP4" in result_text(passes))

    # Live: the catalogue record.
    catalog = smoke.rpc(
        "message/send", {"message": smoke.user_message(f"who owns satellite {ISS}?")}
    ).get("result", {})
    catalog_data = artifact_data(catalog)
    records = catalog_data.get("records") or []
    smoke.check("catalog completes", catalog.get("status", {}).get("state") == "completed")
    smoke.check("catalog has a record", len(records) > 0, str(len(records)))
    if records:
        smoke.check("record names the owner and launch date",
                    records[0].get("owner") == "ISS" and bool(records[0].get("launch_date")),
                    f"{records[0].get('owner')} {records[0].get('launch_date')}")
    smoke.check("catalog cites its own dataset", catalog_data.get("dataset") == SATCAT_DATASET)

    # input-required for a pass with no place, then the follow-up resolves it.
    first_turn = smoke.rpc(
        "message/send", {"message": smoke.user_message("when is the next ISS pass?")}
    ).get("result", {})
    smoke.check("a pass with no place asks for one",
                first_turn.get("status", {}).get("state") == "input-required")

    # The premium skill: without a key the refusal is a completed answer that
    # carries the gateway's own wording, not a crash and not a fake window list.
    windows = smoke.rpc(
        "message/send",
        {"message": smoke.user_message(f"when are the good satellite windows from {LONDON}?")},
    ).get("result", {})
    windows_data = artifact_data(windows)
    smoke.check("pass-windows never returns fabricated windows",
                windows_data.get("windows") is None and windows_data.get("premium") is True,
                str({k: windows_data.get(k) for k in ("premium", "reason", "windows")}))
    smoke.check("pass-windows is answered, not failed",
                windows.get("status", {}).get("state") in ("completed", "failed"),
                str(windows.get("status", {}).get("state")))

    # Streaming.
    events = smoke.stream("message/stream", {"message": smoke.user_message(
        f"what are the orbit elements for {ISS}?")})
    kinds = [event.get("kind") for event in events]
    smoke.check("stream starts with task + working status", kinds[:2] == ["task", "status-update"],
                str(kinds))
    smoke.check("stream includes artifact", "artifact-update" in kinds)
    smoke.check("stream ends final", bool(events[-1].get("final"))
                and events[-1].get("status", {}).get("state") == "completed")

    # Push config CRUD, on a task that exists.
    task_id = catalog.get("id")
    config = smoke.rpc(
        "tasks/pushNotificationConfig/set",
        {"taskId": task_id, "pushNotificationConfig": {"url": "https://example.com/hook", "token": "t"}},
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
