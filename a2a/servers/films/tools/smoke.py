#!/usr/bin/env python3
"""End-to-end smoke test for the films A2A server.

    python3 servers/films/server.py --port 8877
    python3 servers/films/tools/smoke.py --base http://127.0.0.1:8877

Live network: reads Wikidata's query service and the Internet Archive's feature_films shelf.
Both move, so the checks assert shape and honesty (a source is named, a fact Wikidata lacks is
left out, the Archive's mixed shelf is called mixed) rather than fixed counts.
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

SKILLS = ["film-lookup", "filmmaker-films", "films-to-watch", "archive-item", "film-index", "help"]


def artifact_data(response: dict) -> dict:
    return ((response.get("artifacts") or [{}])[-1].get("parts") or [{}])[0].get("data", {})


def task_text(response: dict) -> str:
    status = response.get("status") or {}
    return ((status.get("message") or {}).get("parts") or [{}])[0].get("text", "")


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="smoke-test the films A2A server")
    parser.add_argument("--base", default="http://127.0.0.1:8877")
    parser.add_argument("--hook", default="http://127.0.0.1:8799/hooks")
    args = parser.parse_args(argv)

    smoke = Smoke(args.base)
    if not smoke.card_checks("Films Agent", SKILLS):
        return 1

    # Live: a film lookup on Wikidata.
    lookup = smoke.rpc("message/send", {
        "message": smoke.user_message("tell me about the prestige")}).get("result", {})
    lookup_data = artifact_data(lookup)
    rows = lookup_data.get("rows") or []
    smoke.check("film-lookup completes", lookup.get("status", {}).get("state") == "completed")
    smoke.check("Wikidata returned the film", bool(rows), str(lookup_data.get("summary")))
    prestige = next((row for row in rows if row.get("title") == "The Prestige"), rows[0])
    smoke.check("the year and the director came with it",
                prestige.get("year") == 2006 and "Christopher Nolan" in (prestige.get("directors") or []),
                f"{prestige.get('year')} {prestige.get('directors')}")
    smoke.check("the answer names Wikidata as the source",
                "query.wikidata.org/sparql" in task_text(lookup))

    # Live: who directed a film is a film question, not a filmography.
    directed = smoke.rpc("message/send", {
        "message": smoke.user_message("who directed inception?")}).get("result", {})
    directed_rows = artifact_data(directed).get("rows") or []
    smoke.check("who-directed completes", directed.get("status", {}).get("state") == "completed")
    smoke.check("the answer is about the film and names Nolan",
                bool(directed_rows)
                and any("Nolan" in ", ".join(row.get("directors") or []) for row in directed_rows),
                str([row.get("title") for row in directed_rows[:2]]))

    # Live: a filmography from Wikidata.
    filmography = smoke.rpc("message/send", {
        "message": smoke.user_message("films by fritz lang")}).get("result", {})
    filmography_data = artifact_data(filmography)
    smoke.check("filmmaker-films completes",
                filmography.get("status", {}).get("state") == "completed")
    smoke.check("Wikidata named the filmmaker",
                (filmography_data.get("person") or {}).get("name") == "Fritz Lang",
                str((filmography_data.get("person") or {}).get("name")))
    smoke.check("a credit list with a year span came back",
                len(filmography_data.get("rows") or []) > 5
                and filmography_data.get("first_year") and filmography_data.get("last_year"),
                f"{len(filmography_data.get('rows') or [])} films, "
                f"{filmography_data.get('first_year')}–{filmography_data.get('last_year')}")

    # Live: the Archive's film shelf, narrowed by decade and subject.
    watch = smoke.rpc("message/send", {
        "message": smoke.user_message("1940s noir I can watch for free")}).get("result", {})
    watch_data = artifact_data(watch)
    watch_rows = watch_data.get("rows") or []
    smoke.check("films-to-watch completes", watch.get("status", {}).get("state") == "completed")
    smoke.check("the decade and subject were recognised",
                watch_data.get("decade") == 1940 and watch_data.get("keyword") == "noir",
                f"{watch_data.get('decade')} {watch_data.get('keyword')}")
    smoke.check("prints came back with identifiers and urls",
                bool(watch_rows)
                and all(row.get("identifier") and row.get("url") for row in watch_rows),
                str(watch_data.get("found")))
    smoke.check("the answer says the shelf is mixed, not that a print is free to reuse",
                "not as free to reuse" in task_text(watch))

    # Live: one Archive item by identifier.
    item = smoke.rpc("message/send", {
        "message": smoke.user_message("what is in scarlet_street_ipod")}).get("result", {})
    item_data = artifact_data(item)
    smoke.check("archive-item completes", item.get("status", {}).get("state") == "completed")
    smoke.check("the item's own metadata came back",
                item_data.get("identifier") == "scarlet_street_ipod"
                and bool(item_data.get("title")), str(item_data.get("title")))

    # input-required -> a bare title as the follow-up.
    first = smoke.rpc("message/send", {
        "message": {"kind": "message", "role": "user", "messageId": "m",
                    "parts": [{"kind": "data", "data": {"skill": "film-lookup"}}]}}).get("result", {})
    smoke.check("film-lookup without a title -> input-required",
                first.get("status", {}).get("state") == "input-required")
    follow = smoke.rpc(
        "message/send",
        {"message": smoke.user_message("the prestige", taskId=first.get("id"),
                                       contextId=first.get("contextId"))},
    ).get("result", {})
    follow_rows = artifact_data(follow).get("rows") or []
    smoke.check("the follow-up looks that film up",
                follow.get("status", {}).get("state") == "completed"
                and any(row.get("title") == "The Prestige" for row in follow_rows),
                str([row.get("title") for row in follow_rows[:2]]))

    index = smoke.rpc("message/send", {
        "message": smoke.user_message("which decade has the most noir films")}).get("result", {})
    index_data = artifact_data(index)
    index_text = task_text(index).lower()
    smoke.check("film-index completes (a refusal is an answer)",
                index.get("status", {}).get("state") == "completed", index_text[:80])
    smoke.check("a refused index carries no numbers", not index_data.get("decades"))

    # Streaming.
    events = smoke.stream("message/stream", {
        "message": smoke.user_message("tell me about inception")})
    kinds = [event.get("kind") for event in events]
    smoke.check("stream starts with task + working status", kinds[:2] == ["task", "status-update"],
                str(kinds))
    smoke.check("stream includes artifact", "artifact-update" in kinds)
    smoke.check("stream ends final",
                bool(events[-1].get("final"))
                and events[-1].get("status", {}).get("state") == "completed")

    # Push config CRUD (this agent has no watch, but every task takes a config).
    task_id = lookup.get("id")
    config = smoke.rpc(
        "tasks/pushNotificationConfig/set",
        {"taskId": task_id, "pushNotificationConfig": {"url": args.hook, "token": "smoke"}},
    ).get("result", {})
    config_id = config.get("pushNotificationConfig", {}).get("id")
    smoke.check("push config set", bool(config_id))
    listed = smoke.rpc("tasks/pushNotificationConfig/list", {"taskId": task_id}).get("result", {})
    smoke.check("push config listed", len(listed.get("configs", [])) == 1)
    smoke.rpc("tasks/pushNotificationConfig/delete",
              {"taskId": task_id, "pushNotificationConfigId": config_id})
    after = smoke.rpc("tasks/pushNotificationConfig/list", {"taskId": task_id}).get("result", {})
    smoke.check("push config deleted", after.get("configs") == [])

    return smoke.finish()


if __name__ == "__main__":
    raise SystemExit(main())
