"""Tests for the SpaceDevs launch-schedule server.

    python3 servers/launches/tests/test_agent.py

No test touches the network: the client is given a fake `fetch` or subclassed.
The premium skill is exercised through a `GatewayClient` whose POST is a
function, so the no-key, bad-key, good-key and dead-gateway paths are all
covered without a key and without a network.
"""

from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

SERVER_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = SERVER_DIR.parents[1]
for path in (str(SERVER_DIR), str(REPO_ROOT)):
    if path not in sys.path:
        sys.path.insert(0, path)

from a2a_kit import GatewayClient  # noqa: E402

from agent import (  # noqa: E402
    CARD_SKILLS,
    GATEWAY_TOOL,
    SKILL_BOARD,
    SKILL_DETAILS,
    SKILL_LOOKUP,
    SKILL_UPCOMING,
    SKILL_WINDOW,
    LaunchLibraryAgent,
    parse,
)
from data import (  # noqa: E402
    DATASET,
    LaunchLibraryClient,
    UpstreamError,
    parse_iso,
)


def _list_record(name, net, status="Go for Launch", agency="SpaceX",
                 mission_type="Communications", **extra):
    return {
        "id": extra.pop("id", "7d1afb26-6f9c-429b-9ccf-29012fd1e519"),
        "slug": extra.pop("slug", "falcon-9-crew-13"),
        "name": name,
        "net": net,
        "net_precision": {"id": 0, "name": "Minute"},
        "window_start": net,
        "window_end": net,
        "status": {"id": 1, "name": status, "abbrev": "GFL"},
        "lsp_name": agency,
        "mission": name.split("|")[-1].strip(),
        "mission_type": mission_type,
        "pad": "LC-39A",
        "location": "Kennedy Space Center, FL, USA",
        **extra,
    }


SCHEDULE = [
    _list_record("Falcon 9 Block 5 | Crew-13", "2026-10-01T15:10:06Z", mission_type="Human Spaceflight"),
    _list_record("Falcon 9 Block 5 | Transporter 18", "2026-10-01T18:18:00Z", id="a1",
                 slug="transporter-18"),
    _list_record("Falcon Heavy | NROL-97", "2026-10-02T03:53:00Z", status="Scheduled",
                 mission_type="Military", id="b2", slug="nrol-97"),
    _list_record("Vega C | Sentinel-2C", "2026-10-05T09:00:00Z", status="In Hold", agency="Arianespace",
                 mission_type="Earth Science", id="c3", slug="sentinel-2c"),
    _list_record("Starship | Flight 15", "2026-10-05T21:00:00Z", status="Launch Successful",
                 mission_type="Technology Development", id="d4", slug="starship-flight-15"),
]

DETAIL = {
    "id": "7d1afb26-6f9c-429b-9ccf-29012fd1e519",
    "slug": "falcon-9-crew-13",
    "name": "Falcon 9 Block 5 | Crew-13",
    "net": "2026-10-01T15:10:06Z",
    "net_precision": {"id": 0, "name": "Minute"},
    "window_start": "2026-10-01T15:10:06Z",
    "window_end": "2026-10-01T15:10:06Z",
    "status": {"id": 1, "name": "Go for Launch", "abbrev": "GFL"},
    "lsp_name": "SpaceX",
    "mission": "Crew-13",
    "mission_type": "Human Spaceflight",
    "pad": "LC-39A",
    "location": "Kennedy Space Center, FL, USA",
    "probability": 90,
    "webcast_live": True,
    "description": "A crewed flight to the International Space Station.",
    "launch_service_provider": {"name": "SpaceX", "abbrev": "SpX", "country_code": "USA",
                                "founded_date": "2002-03-14", "type": "Commercial"},
    "rocket": {"name": "Falcon 9", "height": 72,
               "configuration": {"name": "Falcon 9", "variant": "Block 5",
                                 "full_name": "Falcon 9 Block 5"}},
    "pad": {"name": "LC-39A", "latitude": "28.6080", "longitude": "-80.6041",
            "location": {"name": "Kennedy Space Center, FL, USA"}},
    "missions": [{"name": "Crew-13", "type": "Human Exploration",
                  "description": "Six-person crew rotation to the ISS."}],
    "image": "https://example.com/crew-13.jpg",
}


def _no_network(*args, **kwargs):
    raise AssertionError("this test must not touch the network")


def fetch_from(payloads, calls=None):
    """A JsonApiClient `fetch` that dispatches on path, so data.py runs for real."""

    def fetch(url, params, headers):
        if calls is not None:
            calls.append((url, dict(params or {})))
        if "upcoming" in url:
            return payloads.get("schedule", {"results": SCHEDULE, "count": len(SCHEDULE)})
        if "/launch/" in url and url.rstrip("/").endswith("launch") is False:
            return payloads["detail"]
        return payloads.get("window", {"results": SCHEDULE, "count": len(SCHEDULE), "next": None})

    return fetch


class FakeLaunches(LaunchLibraryClient):
    """Same interface, no network. The readers it does not override stay real."""

    def __init__(self, schedule=None, detail=None, window=None) -> None:
        super().__init__(fetch=_no_network)
        self.schedule = list(schedule if schedule is not None else SCHEDULE)
        self.detail_row = detail if detail is not None else DETAIL
        self.window_rows = list(window if window is not None else SCHEDULE)
        self.calls = 0

    def _page(self, path, query, ttl):
        self.calls += 1
        if "upcoming" in path:
            return {"results": list(self.schedule), "count": len(self.schedule)}
        return {"results": list(self.window_rows), "count": len(self.window_rows), "next": None}

    def details(self, launch_id):
        return self.detail_summary(self.detail_row) if launch_id == self.detail_row["id"] else None


def _message(text, **data):
    parts = [{"kind": "text", "text": text}]
    if data:
        parts.append({"kind": "data", "data": data})
    return {"parts": parts}


DENIED_TEXT = ("`a2a_launches_board` is a premium tool, but that license key is not valid. "
               "Get a key at https://buy.polar.sh/polar_cl_example")
TOOL_ERROR_TEXT = "`a2a_launches_board` failed: the Launch Library is throttling this address"

#: Shape copied from a live gateway `a2a_launches_board` answer.
BOARD_PAYLOAD = {
    "start": "2026-10-01T00:00:00Z", "end": "2026-11-01T00:00:00Z",
    "generatedAt": "2026-09-29T04:00:00Z",
    "totalLaunches": 5, "days": 31, "activeDays": 3, "pages": 1, "truncated": False,
    "byDay": [
        {"date": "2026-10-01", "count": 2,
         "launches": [{"name": "Falcon 9 Block 5 | Crew-13", "net": "2026-10-01T15:10:06Z",
                       "status": "Go for Launch", "agency": "SpaceX",
                       "missionType": "Human Spaceflight"}],
         "launchesTruncated": 1},
        {"date": "2026-10-05", "count": 2,
         "launches": [{"name": "Vega C | Sentinel-2C", "net": "2026-10-05T09:00:00Z",
                       "status": "In Hold", "agency": "Arianespace",
                       "missionType": "Earth Science"}],
         "launchesTruncated": 1},
    ],
    "byDayTruncated": 1,
    "byAgency": [{"name": "SpaceX", "count": 4}, {"name": "Arianespace", "count": 1}],
    "byMissionType": [{"name": "Communications", "count": 2}],
    "byStatus": [{"name": "Go for Launch", "count": 2}],
    "busiestDay": {"date": "2026-10-01", "count": 2},
    "tightestTurnaround": {"hours": 3.13, "first": "Falcon 9 Block 5 | Crew-13",
                           "second": "Falcon 9 Block 5 | Transporter 18", "at": "2026-10-01T18:18:00Z"},
    "openCount": 4, "heldCount": 1, "closedCount": 1, "meanPerActiveDay": 1.67,
    "method": "Every launch whose NET falls inside the window.",
}


def fake_gateway(payload=None, error=None, tool_error=None, key="polar_test_key"):
    calls: list[dict] = []

    def fetch(url, request_payload, headers):
        calls.append({"url": url, "payload": request_payload, "headers": headers})
        if error is not None:
            raise error
        if tool_error is not None:
            return {"jsonrpc": "2.0", "id": 1,
                    "result": {"content": [{"type": "text", "text": tool_error}], "isError": True}}
        if payload is None:
            return {"jsonrpc": "2.0", "id": 1,
                    "result": {"content": [{"type": "text", "text": DENIED_TEXT}],
                               "structuredContent": {"licenceRefusal": True, "reason": "invalid"},
                               "isError": True}}
        return {"jsonrpc": "2.0", "id": 1,
                "result": {"content": [{"type": "text", "text": json.dumps(payload)}]}}

    return GatewayClient(fetch=fetch, key=key), calls


class ParsingTests(unittest.TestCase):
    def test_status_strings_are_matched_case_insensitively(self):
        """The library has used both "Go for Launch" and "Go For Launch"."""
        client = FakeLaunches()
        for spelling in ("Go for Launch", "Go For Launch", "GO FOR LAUNCH"):
            row = client.list_summary({**_list_record("X", "2030-01-01T00:00:00Z"), "status":
                                       {"id": 1, "name": spelling, "abbrev": "GFL"}})
            self.assertTrue(row["is_open"], spelling)
        flown = client.list_summary(_list_record("X", "2030-01-01T00:00:00Z", status="Launch Successful"))
        self.assertFalse(flown["is_open"])
        held = client.list_summary(_list_record("X", "2030-01-01T00:00:00Z", status="In Hold"))
        self.assertTrue(held["is_open"])
        self.assertTrue(held["is_held"])

    def test_parse_iso_handles_microseconds_and_junk(self):
        self.assertIsNotNone(parse_iso("2026-10-01T15:10:06Z"))
        self.assertIsNotNone(parse_iso("2026-10-01T15:10:06.123456Z"))
        self.assertIsNotNone(parse_iso("2026-10-01T15:10:06+00:00"))
        self.assertIsNone(parse_iso("not a time"))
        self.assertIsNone(parse_iso(None))
        self.assertIsNone(parse_iso(""))

    def test_nets_are_only_future_when_they_really_are(self):
        client = FakeLaunches()
        past = client.list_summary(_list_record("Old", "2000-01-01T00:00:00Z"))
        self.assertFalse(past["net_is_future"])
        self.assertFalse(client.list_summary({"net": None})["net_is_future"])


class ReaderTests(unittest.TestCase):
    def test_upcoming_reads_one_page_and_flattens_the_status(self):
        calls = []
        client = LaunchLibraryClient(fetch=fetch_from({}, calls))
        launches = client.upcoming(3)
        self.assertEqual(len(launches), 3)
        self.assertEqual(launches[0]["status"], "Go for Launch")
        self.assertEqual(launches[0]["status_abbrev"], "GFL")
        self.assertEqual(launches[0]["net_precision"], "Minute")
        self.assertEqual(launches[0]["lsp_name"], "SpaceX")
        self.assertEqual(launches[0]["dataset"], DATASET)
        url, params = calls[0]
        self.assertIn("upcoming", url)
        self.assertEqual(params["mode"], "list")
        self.assertEqual(params["limit"], 3)

    def test_the_schedule_is_fetched_once_and_then_cached(self):
        calls = []
        client = LaunchLibraryClient(fetch=fetch_from({}, calls))
        client.upcoming(2)
        client.upcoming(2)
        self.assertEqual(len(calls), 1)

    def test_a_window_read_passes_the_bounds_to_the_api(self):
        calls = []
        client = LaunchLibraryClient(fetch=fetch_from({}, calls))
        result = client.in_window("2026-10-01T00:00:00Z", "2026-10-07T00:00:00Z", limit=10)
        self.assertEqual(result["count_in_window"], len(SCHEDULE))
        params = calls[0][1]
        self.assertEqual(params["net__gte"], "2026-10-01T00:00:00Z")
        self.assertEqual(params["net__lte"], "2026-10-07T00:00:00Z")

    def test_a_throttled_feed_is_reported_in_plain_words(self):
        def throttled(url, params, headers):
            raise UpstreamError("LAUNCHES request failed: HTTP Error 429") from None

        client = LaunchLibraryClient(fetch=throttled)
        with self.assertRaises(UpstreamError) as caught:
            client.upcoming(1)
        self.assertIn("throttling", str(caught.exception))
        self.assertIn("30 requests an hour", str(caught.exception))

    def test_a_detail_error_body_becomes_an_upstream_error(self):
        client = LaunchLibraryClient(fetch=lambda url, params, headers: {"detail": "not found"})
        with self.assertRaises(UpstreamError) as caught:
            client.upcoming(1)
        self.assertIn("not found", str(caught.exception))

    def test_details_flatten_the_nested_objects(self):
        launch = LaunchLibraryClient(fetch=fetch_from({"detail": DETAIL})).details(DETAIL["id"])
        self.assertEqual(launch["rocket_full"], "Falcon 9 Block 5")
        self.assertEqual(launch["rocket_variant"], "Block 5")
        self.assertEqual(launch["lsp_country"], "USA")
        self.assertEqual(launch["pad"], "LC-39A")
        self.assertEqual(launch["pad_latitude"], "28.6080")
        self.assertEqual(launch["mission_count"], 1)
        self.assertEqual(launch["missions"][0]["name"], "Crew-13")
        self.assertEqual(launch["probability"], 90)
        self.assertIn("International Space Station", launch["description"])

    def test_an_unknown_launch_id_is_none(self):
        self.assertIsNone(FakeLaunches().details("00000000-0000-0000-0000-000000000000"))

    def test_validation_rejects_bad_input(self):
        client = LaunchLibraryClient(fetch=_no_network)
        self.assertEqual(client.check_days("30"), 30)
        for bad in ("0", "91", "many"):
            with self.assertRaises(ValueError):
                client.check_days(bad)
        self.assertEqual(client.check_date("2026-10-01"), "2026-10-01T00:00:00Z")
        for bad in ("01-10-2026", "2026-13-01", "tomorrow"):
            with self.assertRaises(ValueError):
                client.check_date(bad)
        with self.assertRaises(ValueError):
            client.check_mission_type("Nonsense Type")
        with self.assertRaises(ValueError):
            client.check_limit(0)
        with self.assertRaises(ValueError):
            client.check_id("not-a-uuid")
        self.assertEqual(client.check_mission_type("human spaceflight"), "Human Spaceflight")

    def test_a_search_needs_something_to_search_for(self):
        with self.assertRaises(ValueError):
            FakeLaunches().search()


class ParseTests(unittest.TestCase):
    def test_the_six_ways_to_ask(self):
        cases = [
            ("what launches are coming up?", SKILL_UPCOMING),
            ("next 5 launches", SKILL_UPCOMING),
            ("what launches are between 2026-10-01 and 2026-10-07?", SKILL_WINDOW),
            ("launches in the next 30 days", SKILL_WINDOW),
            ('find the "crew-13" launch', SKILL_LOOKUP),
            ("tell me about launch 7d1afb26-6f9c-429b-9ccf-29012fd1e519", SKILL_DETAILS),
            ("how busy is the launch calendar this month?", SKILL_BOARD),
            ("how many launches are there between 2026-10-01 and 2026-10-31?", SKILL_BOARD),
        ]
        for text, want in cases:
            self.assertEqual(parse(_message(text))["skill"], want, text)

    def test_a_row_count_is_not_read_as_a_window(self):
        """`next 30 days` is a window; `next 5 launches` is five rows."""
        window = parse(_message("launches in the next 30 days"))
        self.assertEqual(window["params"]["days"], "30")
        self.assertEqual(window["params"]["limit"], 10)
        listing = parse(_message("next 5 launches"))
        self.assertEqual(int(listing["params"]["limit"]), 5)
        self.assertIsNone(listing["params"].get("days"))

    def test_a_range_is_split_into_both_ends(self):
        parsed = parse(_message("what launches are from 2026-10-01 until 2026-10-07?"))
        self.assertEqual(parsed["params"]["start"], "2026-10-01")
        self.assertEqual(parsed["params"]["end"], "2026-10-07")

    def test_a_uuid_is_taken_from_the_text(self):
        parsed = parse(_message("tell me about launch 7d1afb26-6f9c-429b-9ccf-29012fd1e519"))
        self.assertEqual(parsed["params"]["launch_id"], "7d1afb26-6f9c-429b-9ccf-29012fd1e519")

    def test_a_quoted_name_is_the_only_name_source(self):
        self.assertEqual(parse(_message('find the "crew-13" launch'))["params"]["name"], "crew-13")
        self.assertIsNone(parse(_message("what launches are coming up?"))["params"].get("name"))

    def test_explicit_json_wins(self):
        parsed = parse({"parts": [{"kind": "data", "data": {
            "skill": SKILL_BOARD, "start": "2026-10-01", "end": "2026-10-31"}}]})
        self.assertEqual(parsed["skill"], SKILL_BOARD)
        self.assertTrue(parsed["explicit"])

    def test_help_and_empty(self):
        self.assertEqual(parse(_message(""))["skill"], "help")
        self.assertEqual(parse(_message("what can you do?"))["skill"], "help")
        self.assertEqual(parse(_message("hello"))["skill"], SKILL_UPCOMING)


class SkillTests(unittest.TestCase):
    def run_skill(self, skill, client=None, gateway=None, **params):
        agent = LaunchLibraryAgent(client=client or FakeLaunches(),
                                   gateway=gateway or fake_gateway()[0])
        return agent.run({"skill": skill, "params": params, "missing": agent.missing(skill, params)})

    def test_upcoming_lists_the_schedule(self):
        result = self.run_skill(SKILL_UPCOMING, limit=3)
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("Crew-13", result["message"])
        self.assertIn("SpaceX", result["message"])
        self.assertIn("precise to the minute", result["message"])
        self.assertIn(DATASET, result["message"])
        self.assertEqual(result["artifact"]["count"], 3)

    def test_upcoming_needs_nothing(self):
        agent = LaunchLibraryAgent(client=FakeLaunches(), gateway=fake_gateway()[0])
        self.assertEqual(agent.missing(SKILL_UPCOMING, {}), [])

    def test_window_lists_a_range(self):
        result = self.run_skill(SKILL_WINDOW, start="2026-10-01", end="2026-10-07", limit=10)
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("between 2026-10-01 and 2026-10-07", result["message"])
        self.assertIn("Crew-13", result["message"])

    def test_window_accepts_a_day_count(self):
        result = self.run_skill(SKILL_WINDOW, days=14, limit=10)
        self.assertEqual(result["final_state"], "completed")
        self.assertEqual(result["artifact"]["count"], 5)

    def test_one_sided_a_range_comes_back_as_a_question(self):
        result = self.run_skill(SKILL_WINDOW, start="2026-10-01")
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("both ends", result["message"])

    def test_a_bad_date_comes_back_as_a_question(self):
        result = self.run_skill(SKILL_WINDOW, start="01-10-2026", end="2026-10-07")
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("YYYY-MM-DD", result["message"])

    def test_lookup_finds_a_unique_name(self):
        result = self.run_skill(SKILL_LOOKUP, name="crew-13")
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("matches one launch", result["message"])
        self.assertIn("7d1afb26-6f9c-429b-9ccf-29012fd1e519", result["message"])
        self.assertTrue(result["artifact"]["matched_exactly"])

    def test_lookup_asks_which_one_when_ambiguous(self):
        client = FakeLaunches(schedule=[_list_record("Falcon 9 | Starlink", "2026-10-01T00:00:00Z",
                                                     id="x1"),
                                        _list_record("Falcon 9 | Starlink 2", "2026-10-02T00:00:00Z",
                                                     id="x2")])
        result = self.run_skill(SKILL_LOOKUP, client=client, name="starlink")
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("matches 2 launches", result["message"])

    def test_lookup_reports_no_match(self):
        client = FakeLaunches()
        result = self.run_skill(SKILL_LOOKUP, client=client, name="voyager-interstellar")
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("Nothing in the published schedule matches", result["message"])

    def test_lookup_without_text_asks_for_it(self):
        agent = LaunchLibraryAgent(client=FakeLaunches(), gateway=fake_gateway()[0])
        self.assertEqual(agent.missing(SKILL_LOOKUP, {}), ["name"])
        result = agent.run({"skill": SKILL_LOOKUP, "params": {}, "missing": ["name"]})
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("crew-13", result["message"])

    def test_details_reports_rocket_pad_provider_and_mission(self):
        result = self.run_skill(SKILL_DETAILS, launch_id=DETAIL["id"])
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("Falcon 9 Block 5", result["message"])
        self.assertIn("LC-39A", result["message"])
        self.assertIn("USA", result["message"])
        self.assertIn("Crew-13", result["message"])
        self.assertIn("28.6080", result["message"])
        self.assertIn("go probability 90", result["message"])
        self.assertIn(DATASET, result["message"])

    def test_an_unknown_launch_id_is_reported(self):
        result = self.run_skill(SKILL_DETAILS, launch_id="00000000-0000-0000-0000-000000000000")
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("no launch with id", result["message"])

    def test_a_throttle_is_a_failed_task_not_a_wrong_answer(self):
        class Throttled(FakeLaunches):
            def _page(self, path, query, ttl):
                raise UpstreamError("the Launch Library is throttling this address")

        result = self.run_skill(SKILL_UPCOMING, client=Throttled())
        self.assertEqual(result["final_state"], "failed")
        self.assertIn("throttling", result["message"])

    def test_help_does_not_touch_the_feed(self):
        client = FakeLaunches()
        result = self.run_skill("help", client=client)
        self.assertIn("Launch Library", result["message"])
        self.assertIsNone(result["artifact"])
        self.assertEqual(client.calls, 0)

    def test_card_has_five_skills_and_exactly_one_premium(self):
        ids = [skill["id"] for skill in CARD_SKILLS]
        self.assertEqual(ids, [SKILL_UPCOMING, SKILL_WINDOW, SKILL_LOOKUP, SKILL_DETAILS, SKILL_BOARD])
        premium = [skill["id"] for skill in CARD_SKILLS if "premium" in skill["tags"]]
        self.assertEqual(premium, [SKILL_BOARD])
        agent = LaunchLibraryAgent(client=FakeLaunches(), gateway=fake_gateway()[0])
        self.assertEqual(agent.env_prefix, "LAUNCHES")
        self.assertEqual(agent.datasets, (DATASET,))
        self.assertEqual(GATEWAY_TOOL, "a2a_launches_board")


class BoardTests(unittest.TestCase):
    """The premium skill: parsing stays local, the counting happens on the gateway."""

    def run_board(self, gateway, **params):
        return LaunchLibraryAgent(FakeLaunches(), gateway=gateway).run({
            "skill": SKILL_BOARD, "params": params, "missing": [],
        })

    def test_the_message_reports_the_gateways_board(self):
        gateway, calls = fake_gateway(BOARD_PAYLOAD)
        result = self.run_board(gateway, start="2026-10-01", end="2026-11-01")
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("5 launch(es) over 31 day(s)", result["message"])
        self.assertIn("2026-10-01: 2 launch(es)", result["message"])
        self.assertIn("+1 more", result["message"])
        self.assertIn("SpaceX 4", result["message"])
        self.assertIn("Busiest day 2026-10-01 with 2 launch(es)", result["message"])
        self.assertIn("Tightest turnaround 3.13 h", result["message"])
        self.assertIn("4 still to fly, 1 in hold, 1 already flown", result["message"])
        self.assertIn(DATASET, result["message"])
        self.assertTrue(result["artifact"]["premium"])
        self.assertEqual(result["artifact"]["total_launches"], 5)
        self.assertEqual(result["artifact"]["busiest_day"]["date"], "2026-10-01")

        # The Launch Library was read on the gateway, not here.
        self.assertEqual(len(calls), 1)
        sent = calls[0]["payload"]["params"]
        self.assertEqual(sent["name"], GATEWAY_TOOL)
        self.assertEqual(sent["arguments"]["start"], "2026-10-01T00:00:00Z")
        self.assertEqual(sent["arguments"]["end"], "2026-11-01T00:00:00Z")

    def test_a_day_count_becomes_a_window(self):
        gateway, calls = fake_gateway(BOARD_PAYLOAD)
        result = self.run_board(gateway, days=30)
        self.assertEqual(result["final_state"], "completed")
        sent = calls[0]["payload"]["params"]["arguments"]
        self.assertTrue(sent["start"].endswith("T00:00:00Z"))
        self.assertGreaterEqual(Date_diff(sent["start"], sent["end"]), 29)

    def test_without_a_licence_the_caller_is_told_how_to_get_one(self):
        gateway, calls = fake_gateway(key="")
        result = self.run_board(gateway, start="2026-10-01", end="2026-11-01")
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("MCP_LICENSE_KEY", result["message"])
        self.assertEqual(result["artifact"]["reason"], "missing_key")
        self.assertNotIn("by_day", result["artifact"])
        self.assertEqual(calls, [], "a keyless caller must not reach the gateway")

    def test_a_licence_refusal_keeps_the_gateways_wording(self):
        gateway, _ = fake_gateway()
        result = self.run_board(gateway, start="2026-10-01", end="2026-11-01")
        self.assertEqual(result["final_state"], "completed")
        self.assertEqual(result["message"], DENIED_TEXT)
        self.assertEqual(result["artifact"]["reason"], "denied")

    def test_a_dead_gateway_fails_instead_of_inventing_a_board(self):
        gateway, _ = fake_gateway(error=OSError("connection refused"))
        result = self.run_board(gateway, start="2026-10-01", end="2026-11-01")
        self.assertEqual(result["final_state"], "failed")
        self.assertIn("could not be reached", result["message"])
        self.assertIsNone(result["artifact"].get("by_day"))

    def test_a_tool_error_is_not_sold_as_a_licence_problem(self):
        gateway, _ = fake_gateway(tool_error=TOOL_ERROR_TEXT)
        result = self.run_board(gateway, start="2026-10-01", end="2026-11-01")
        self.assertEqual(result["final_state"], "failed")
        self.assertNotIn("MCP_LICENSE_KEY", result["message"])
        self.assertIn("throttling", result["message"])

    def test_an_unusable_answer_fails_rather_than_showing_nothing(self):
        gateway, _ = fake_gateway({"nothing_useful": True})
        result = self.run_board(gateway, start="2026-10-01", end="2026-11-01")
        self.assertEqual(result["final_state"], "failed")
        self.assertIn("without a launch board", result["message"])

    def test_an_empty_window_is_still_a_completed_board(self):
        payload = {**BOARD_PAYLOAD, "totalLaunches": 0, "activeDays": 0, "byDay": [],
                   "byAgency": [], "byMissionType": [], "busiestDay": None,
                   "tightestTurnaround": None, "openCount": 0, "heldCount": 0, "closedCount": 0}
        gateway, _ = fake_gateway(payload)
        result = self.run_board(gateway, start="2030-01-01", end="2030-02-01")
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("0 launch(es)", result["message"])

    def test_bad_arguments_never_reach_the_gateway(self):
        gateway, calls = fake_gateway(BOARD_PAYLOAD)
        result = self.run_board(gateway, start="01-10-2026", end="2026-11-01")
        self.assertEqual(result["final_state"], "input-required")
        self.assertEqual(calls, [])


def Date_diff(start, end):
    """Whole days between two ISO instants, for the day-count test."""
    from datetime import datetime

    fmt = "%Y-%m-%dT%H:%M:%SZ"
    return (datetime.strptime(end, fmt) - datetime.strptime(start, fmt)).days


if __name__ == "__main__":
    unittest.main()
