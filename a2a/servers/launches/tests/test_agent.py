
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





class BoardTests(unittest.TestCase):
    """The premium skill: parsing stays local, the counting happens on the gateway."""

    def run_board(self, gateway, **params):
        return LaunchLibraryAgent(FakeLaunches(), gateway=gateway).run({
            "skill": SKILL_BOARD, "params": params, "missing": [],
        })











def Date_diff(start, end):
    """Whole days between two ISO instants, for the day-count test."""
    from datetime import datetime

    fmt = "%Y-%m-%dT%H:%M:%SZ"
    return (datetime.strptime(end, fmt) - datetime.strptime(start, fmt)).days


if __name__ == "__main__":
    unittest.main()
