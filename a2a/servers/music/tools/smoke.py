#!/usr/bin/env python3
"""End-to-end smoke test for the Deezer music A2A server.

    DEEZER_ALLOW_PRIVATE_WEBHOOKS=1 python3 servers/music/server.py --port 8805
    python3 servers/music/tools/smoke.py --base http://127.0.0.1:8805
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

DATASET = "api.deezer.com"
TRACK_ID = "138547415"
ARTIST = "Radiohead"


def artifact_data(response: dict) -> dict:
    return ((response.get("artifacts") or [{}])[-1].get("parts") or [{}])[0].get("data", {})


def json_message(smoke, text: str, data: dict) -> dict:
    """A user message carrying both a sentence and a data part, as the protocol wants.

    `Smoke.user_message` takes extra top-level keys, so passing `parts` to it would
    drop the text; the two parts have to be built here.
    """
    return {
        "kind": "message",
        "role": "user",
        "messageId": "smoke-json",
        "parts": [{"kind": "text", "text": text}, {"kind": "data", "data": data}],
    }


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="smoke-test the Deezer music A2A server")
    parser.add_argument("--base", default="http://127.0.0.1:8805")
    parser.add_argument("--hook", default="http://127.0.0.1:8799/hooks")
    args = parser.parse_args(argv)

    smoke = Smoke(args.base)
    if not smoke.card_checks(
        "Deezer Music Agent",
        ["music-search", "artist-albums", "track-preview", "chart", "artist-timeline"],
    ):
        return 1

    # Live: a search that returns all three kinds from one read.
    found = smoke.rpc(
        "message/send", {"message": smoke.user_message("search deezer for creep")}
    ).get("result", {})
    found_data = artifact_data(found)
    results = found_data.get("results") or []
    smoke.check("search skill completes", found.get("status", {}).get("state") == "completed")
    smoke.check("search returned live results", len(results) > 0, str(len(results)))
    smoke.check("search cites the dataset", found_data.get("dataset") == DATASET)
    smoke.check("search reports Deezer's own match count",
                (found_data.get("total_matches") or 0) > 0, str(found_data.get("total_matches")))
    smoke.check("results carry an artist and a length",
                bool(results) and results[0].get("artist_name") and bool(results[0].get("duration_label")),
                f"{results[0].get('artist_name')} {results[0].get('duration_label')}" if results else "none")

    # Live: albums narrowed to one kind.
    albums_only = smoke.rpc(
        "message/send",
        {"message": json_message(smoke, f"search deezer for {ARTIST}",
                                 {"type": "album", "limit": 3})},
    ).get("result", {})
    albums_data = artifact_data(albums_only)
    smoke.check("search narrows to albums",
                albums_data.get("type") == "album"
                and all(row.get("type") == "album" for row in albums_data.get("results") or []),
                str([row.get("type") for row in albums_data.get("results") or []]))

    # Live: an artist's releases.
    releases = smoke.rpc(
        "message/send", {"message": smoke.user_message(f"what albums does {ARTIST} have?")}
    ).get("result", {})
    releases_data = artifact_data(releases)
    rows = releases_data.get("albums") or []
    smoke.check("artist-albums skill completes", releases.get("status", {}).get("state") == "completed")
    smoke.check("releases came back live", len(rows) > 0, str(len(rows)))
    smoke.check("artist resolved to a Deezer artist id",
                (releases_data.get("artist") or {}).get("id") is not None,
                str((releases_data.get("artist") or {}).get("id")))
    smoke.check("release rows carry a title and a record type",
                bool(rows) and bool(rows[0].get("title")) and bool(rows[0].get("record_type")),
                f"{rows[0].get('title')} / {rows[0].get('record_type')}" if rows else "none")

    # Live: the preview link for a known track id.
    preview = smoke.rpc(
        "message/send",
        {"message": json_message(smoke, f"30 second preview of track {TRACK_ID}",
                                 {"track_id": TRACK_ID})},
    ).get("result", {})
    preview_data = artifact_data(preview)
    preview_text = preview.get("status", {}).get("message", {}).get("parts", [{}])[0].get("text", "")
    smoke.check("preview skill completes", preview.get("status", {}).get("state") == "completed")
    smoke.check("preview URL is Deezer's own CDN link", "dzcdn.net" in preview_text, preview_text[:120])
    smoke.check("preview reports its own 30-second length",
                (preview_data.get("track") or {}).get("preview_seconds") == 30,
                str((preview_data.get("track") or {}).get("preview_seconds")))

    # Live: a preview resolved from a title rather than an id.
    by_title = smoke.rpc(
        "message/send", {"message": smoke.user_message("30 second preview of Creep by Radiohead")}
    ).get("result", {})
    by_title_data = artifact_data(by_title)
    smoke.check("preview resolves a title to one track",
                by_title.get("status", {}).get("state") == "completed"
                and (by_title_data.get("track") or {}).get("id") is not None,
                str((by_title_data.get("track") or {}).get("title")))
    smoke.check("preview names the query it matched from",
                bool(by_title_data.get("matched_from_search")),
                str(by_title_data.get("matched_from_search")))

    # Live: the chart.
    chart = smoke.rpc(
        "message/send", {"message": smoke.user_message("top 5 tracks right now")}
    ).get("result", {})
    chart_data = artifact_data(chart)
    chart_rows = chart_data.get("tracks") or []
    smoke.check("chart skill completes", chart.get("status", {}).get("state") == "completed")
    smoke.check("chart returned live tracks", len(chart_rows) > 0, str(len(chart_rows)))
    smoke.check("chart is numbered from one",
                bool(chart_rows) and chart_rows[0].get("position") == 1,
                str(chart_rows[0].get("position") if chart_rows else None))
    smoke.check("chart scope is global", chart_data.get("scope") == "global")

    # input-required -> follow-up carries the artist name through.
    first = smoke.rpc(
        "message/send", {"message": smoke.user_message("what albums does this artist have?")}
    ).get("result", {})
    smoke.check("artist-albums with no artist -> input-required",
                first.get("status", {}).get("state") == "input-required")
    follow = smoke.rpc(
        "message/send",
        {"message": json_message(smoke, ARTIST, {}) | {
            "taskId": first.get("id"), "contextId": first.get("contextId")}},
    ).get("result", {})
    smoke.check("follow-up lists the releases",
                follow.get("status", {}).get("state") == "completed"
                and len(artifact_data(follow).get("albums") or []) > 0,
                str(len(artifact_data(follow).get("albums") or [])))

    # gateway's own wording, not a crash and not a fabricated timeline.

    # Streaming.
    events = smoke.stream("message/stream", {"message": smoke.user_message("search deezer for creep")})
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
