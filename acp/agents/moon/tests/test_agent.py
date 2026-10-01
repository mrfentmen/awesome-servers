"""Tests for the moon agent: phases, sun times, routing, and the clock each one is in.

    python3 agents/moon/tests/test_agent.py

No network: the observatory, the sun service and the geocoder are injected with payloads shaped
exactly like the live ones read on 2026-09-23.
"""

from __future__ import annotations

import datetime
import json
import os
import queue
import sys
import threading
import unittest
from unittest.mock import Mock, patch
from pathlib import Path

AGENT_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = Path(__file__).resolve().parents[3]
for path in (str(REPO_ROOT), str(AGENT_DIR)):
    if path not in sys.path:
        sys.path.insert(0, path)

from acp_kit import AcpClient, Connection, STOP_END_TURN, STOP_REFUSAL, GatewayClient  # noqa: E402

from agent import phase_from_text, place_from_text, route  # noqa: E402
from data import MoonData, MoonError, day_length, stamp  # noqa: E402

PLACE = {"results": [{"name": "Denver", "latitude": 39.7392, "longitude": -104.9903,
                      "country": "United States", "admin1": "Colorado",
                      "timezone": "America/Denver"}]}

USNO = {"apiversion": "4.0.1", "year": 2026, "month": 9, "day": 23, "numphases": 4,
        "phasedata": [
            {"year": 2026, "month": 9, "day": 26, "time": "16:49", "phase": "Full Moon"},
            {"year": 2026, "month": 10, "day": 3, "time": "13:25", "phase": "Last Quarter"},
            {"year": 2026, "month": 10, "day": 10, "time": "15:50", "phase": "New Moon"},
            {"year": 2026, "month": 10, "day": 18, "time": "16:12", "phase": "First Quarter"},
        ]}

SUN = {"results": {"sunrise": "2026-09-23T06:47:23-06:00", "sunset": "2026-09-23T18:57:06-06:00",
                   "solar_noon": "2026-09-23T12:52:14-06:00", "day_length": 43783,
                   "civil_twilight_begin": "2026-09-23T06:20:11-06:00",
                   "civil_twilight_end": "2026-09-23T19:24:18-06:00",
                   "nautical_twilight_begin": "2026-09-23T05:48:02-06:00",
                   "astronomical_twilight_begin": "2026-09-23T05:15:44-06:00"},
       "status": "OK", "tzid": "America/Denver"}


class FakeFeeds:
    def __init__(self, place=None, usno=None, sun=None, fail: str | None = None):
        self.calls: list[tuple[str, dict]] = []
        self.place = PLACE if place is None else place
        self.usno = usno if usno is not None else USNO
        self.sun = sun if sun is not None else SUN
        self.fail = fail

    def __call__(self, url: str, params: dict):
        self.calls.append((url, dict(params)))
        if self.fail and self.fail in url:
            raise MoonError("the almanac is unreachable")
        if "geocoding" in url:
            return json.dumps(self.place)
        if "usno" in url:
            return json.dumps(self.usno)
        if "sunrise-sunset" in url:
            return json.dumps(self.sun)
        raise AssertionError(f"unexpected url {url}")


def make_data(**kw):
    feed = FakeFeeds(**kw)
    return MoonData(fetch=feed), feed


class HelperTests(unittest.TestCase):
    def test_day_length_reads_as_hours_and_minutes(self):
        self.assertEqual(day_length(43783), "12h 9m")
        self.assertEqual(day_length(3600), "1h 0m")
        self.assertEqual(day_length(None), "unknown")

    def test_a_phase_row_is_stamped_with_its_unit(self):
        self.assertEqual(stamp(2026, 9, 26, "16:49"), "2026-09-26 16:49 UT")


class ReadTests(unittest.TestCase):
    def test_the_next_phases_come_back_in_order_with_their_unit(self):
        data, feed = make_data()
        reading = data.phases(count=4)
        self.assertEqual([row["phase"] for row in reading["phases"]],
                         ["Full Moon", "Last Quarter", "New Moon", "First Quarter"])
        self.assertEqual(reading["phases"][0]["date"], "2026-09-26 16:49 UT")
        self.assertEqual(feed.calls[-1][1]["nump"], 4)

    def test_the_count_is_bounded_and_the_date_is_todays(self):
        data, feed = make_data()
        reading = data.phases(count=99)
        self.assertEqual(feed.calls[-1][1]["nump"], 8)
        self.assertEqual(reading["from"], datetime.date.today().isoformat())

    def test_sun_times_keep_the_places_own_offset(self):
        data, feed = make_data()
        reading = data.sun("Denver")
        self.assertEqual(reading["tzid"], "America/Denver")
        self.assertEqual(reading["day_length"], "12h 9m")
        rows = {row["key"]: row for row in reading["times"]}
        self.assertEqual(rows["sunrise"]["clock"], "06:47")
        self.assertEqual(rows["sunrise"]["offset"], "-06:00")
        self.assertEqual(rows["sunset"]["clock"], "18:57")
        self.assertEqual(feed.calls[-1][1]["tzid"], "America/Denver")

    def test_a_place_the_sun_service_does_not_answer_for_is_an_error(self):
        data, _feed = make_data(sun={"status": "INVALID_REQUEST", "results": {}})
        with self.assertRaises(MoonError):
            data.sun("Denver")

    def test_an_unknown_place(self):
        data, _feed = make_data(place={"results": []})
        with self.assertRaises(ValueError):
            data.sun("Xyzzyville")
        with self.assertRaises(ValueError):
            data.geocode("")

    def test_a_dead_source(self):
        data, _feed = make_data(fail="usno")
        with self.assertRaises(MoonError):
            data.phases()


class RouteTests(unittest.TestCase):
    def test_the_next_full_moon(self):
        skill, params = route("when is the next full moon?")
        self.assertEqual(skill, "moon-phases")
        self.assertEqual(params["phase"], "Full Moon")
        self.assertNotIn("place", params)

    def test_a_phase_list(self):
        self.assertEqual(route("what are the moon phases this month?")[1]["count"], 8)
        self.assertEqual(route("next 2 moon phases")[1]["count"], 2)

    def test_sunrise_needs_a_place(self):
        skill, params = route("when does it get dark in Denver tonight?")
        self.assertEqual(skill, "sun-times")
        self.assertEqual(params["place"], "Denver")
        self.assertEqual(route("sunrise in Tokyo tomorrow")[1]["place"], "Tokyo")
        self.assertEqual(route("when does it get dark tonight?")[0], "help")

    def test_daylight_is_a_sun_question(self):
        self.assertEqual(route("how much daylight is there in Oslo today?")[0], "sun-times")

    def test_help(self):
        self.assertEqual(route("")[0], "help")
        self.assertEqual(route("what can you do?")[0], "help")
        self.assertEqual(route("book a flight")[0], "help")

    def test_helpers(self):
        self.assertEqual(phase_from_text("next new moon"), "New Moon")
        self.assertIsNone(phase_from_text("moon phases"))
        self.assertEqual(place_from_text("when does it get dark in Denver tonight?"), "Denver")

    def test_phase_calendar_extracts_explicit_window(self):
        self.assertEqual(route("phase calendar for Denver from 2026-10-01 for 7 nights"),
                         ("phase-calendar", {"place": "Denver", "start": "2026-10-01", "nights": 7}))
        self.assertEqual(route("phase calendar for New York from 2026-11-01 for 2 nights")[1]["place"], "New York")
        self.assertEqual(route("phase calendar")[0], "help")


class QueueReader:
    def __init__(self):
        self._items: queue.Queue = queue.Queue()

    def push(self, text):
        self._items.put(text)

    def close(self):
        self._items.put(None)

    def __iter__(self):
        return self

    def __next__(self):
        item = self._items.get()
        if item is None:
            raise StopIteration
        return item


class WiredWriter:
    def __init__(self, reader):
        self.reader = reader

    def write(self, text):
        self.reader.push(text)

    def flush(self):
        pass

    def close(self):
        self.reader.close()


def connected_pair():
    to_agent, to_client = QueueReader(), QueueReader()
    return (
        Connection(to_agent, WiredWriter(to_client), name="agent"),
        Connection(to_client, WiredWriter(to_agent), name="client"),
    )


class TurnTests(unittest.TestCase):
    def turn(self, text: str, permission: str = "allow-once", gateway=None, **kw):
        from agent import MoonAgent

        agent_conn, client_conn = connected_pair()
        data, feed = make_data(**kw)
        agent = MoonAgent(agent_conn, data, gateway=gateway)
        threading.Thread(target=agent_conn.serve, daemon=True).start()
        client = AcpClient(connection=client_conn, permission=permission)
        client.start()
        client.initialize()
        session_id = client.new_session(cwd="/tmp")
        try:
            return client.prompt(text, session_id), client, feed
        finally:
            client.stop()

    def test_the_full_moon_answer_names_the_ut_clock(self):
        result, client, _ = self.turn("when is the next full moon?")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertEqual(len(client.permission_requests), 1)
        self.assertIn("Next full moon:", result["text"])
        self.assertIn("2026-09-26 16:49 UT", result["text"])
        self.assertIn("<-", result["text"])
        self.assertIn("Phase times are UT", result["text"])

    def test_the_sun_answer_is_in_the_places_clock(self):
        result, _, _ = self.turn("when does it get dark in Denver tonight?")
        self.assertIn("Sun times for Denver, Colorado, United States", result["text"])
        self.assertIn("(America/Denver)", result["text"])
        self.assertIn("sunset                     18:57 (UTC-06:00)", result["text"])
        self.assertIn("day length                 12h 9m", result["text"])

    def test_help_asks_nothing(self):
        result, client, feed = self.turn("what can you do?")
        self.assertIn("US Naval Observatory", result["text"])
        self.assertEqual(client.permission_requests, [])
        self.assertEqual(feed.calls, [])

    def test_permission_denied(self):
        result, _, _ = self.turn("when is the next new moon?", permission="reject")
        self.assertEqual(result["stopReason"], STOP_REFUSAL)

    def test_a_dead_source_is_reported(self):
        result, _, _ = self.turn("when is the next full moon?", fail="usno")
        self.assertIn("I could not read that", result["text"])

    def test_premium_without_key_uses_gateway_wording(self):
        with patch.dict(os.environ):
            os.environ.pop("MCP_LICENSE_KEY", None)
            fetch = Mock(side_effect=AssertionError("missing key must not authorize a request"))
            gateway = GatewayClient(fetch=fetch)
            gateway.call = Mock(wraps=gateway.call)
            result, _, feeds = self.turn("phase calendar for Denver from 2026-10-01 for 2 nights", gateway=gateway)
        self.assertIn("`moon_phase_calendar` is a premium skill and no licence key is set. "
                      "Put a Polar key in MCP_LICENSE_KEY and ask again.", result["text"])
        gateway.call.assert_called_once_with("moon_phase_calendar", {"place": "Denver", "start": "2026-10-01", "nights": 2})
        fetch.assert_not_called()
        self.assertEqual(feeds.calls, [])

    def test_premium_rejected_key_uses_gateway_wording(self):
        def fetch(url, payload, headers):
            self.assertEqual(headers["Authorization"], "Bearer lic_live_but_rejected")
            return {"result": {"isError": True, "content": [{"type": "text", "text": "moon_phase_calendar was refused: revoked licence"}],
                               "structuredContent": {"licenceRefusal": True, "reason": "revoked"}}}
        with patch.dict(os.environ, {"MCP_LICENSE_KEY": "lic_live_but_rejected"}):
            gateway = GatewayClient(fetch=fetch)
            gateway.call = Mock(wraps=gateway.call)
            result, _, _ = self.turn("phase calendar for Denver from 2026-10-01 for 2 nights", gateway=gateway)
        self.assertIn("revoked licence", result["text"])
        gateway.call.assert_called_once()

    def test_premium_good_key_renders_gateway_numbers(self):
        def fetch(url, payload, headers):
            self.assertEqual(headers["Authorization"], "Bearer lic_granted")
            self.assertEqual(payload["params"], {"name": "moon_phase_calendar", "arguments": {
                "place": "Denver", "start": "2026-10-01", "nights": 2}})
            data = {"place": "Denver", "days": [
                    {"date": "2026-10-01", "timezone": "America/Denver", "phase": "Waning Gibbous",
                     "illumination_percent": 70.33, "moonrise": "21:49:51", "moonset": "12:52:45",
                     "sunrise": "06:49:04", "sunset": "18:49:20", "darkness": {"start_local": "2026-10-01 20:19:04", "end_local": "2026-10-02 05:19:09", "minutes": 540}},
                    {"date": "2026-10-02", "timezone": "America/Denver", "phase": "Waning Gibbous",
                     "illumination_percent": 62, "moonrise": "22:00:00", "moonset": "13:00:00",
                     "sunrise": "06:50:00", "sunset": "18:48:00", "darkness": None}],
                    "ranked_dates": ["2026-10-01"], "total_darkness_minutes": 540}
            return {"result": {"content": [{"type": "text", "text": json.dumps(data)}]}}
        gateway = GatewayClient(fetch=fetch, key="lic_granted")
        gateway.call = Mock(wraps=gateway.call)
        result, _, _ = self.turn("phase calendar for Denver from 2026-10-01 for 2 nights", gateway=gateway)
        self.assertIn("70.33%", result["text"])
        self.assertIn("540 minutes", result["text"])
        gateway.call.assert_called_once_with("moon_phase_calendar", {"place": "Denver", "start": "2026-10-01", "nights": 2})

    def test_free_question_never_calls_gateway(self):
        class Never:
            def call(self, tool, args): raise AssertionError("free skill reached gateway")
        for question, answer in [("when is the next full moon?", "Next full moon:"),
                                 ("when does it get dark in Denver?", "Sun times for Denver")]:
            result, _, _ = self.turn(question, gateway=Never())
            self.assertIn(answer, result["text"])

    def test_unreadable_premium_payload_stays_empty(self):
        from agent import MoonAgent
        for payload in ({}, {"place": "Denver", "days": [None, None]},
                        {"place": "Denver", "days": [{"date": "2026-10-01", "timezone": "UTC", "darkness": []}] * 2}):
            gateway = Mock()
            gateway.call.return_value = payload
            body, artifact = MoonAgent(gateway=gateway)._phase_calendar({"place": "Denver", "start": "2026-10-01", "nights": 2})
            self.assertIn("no readable phase calendar", body)
            self.assertTrue(artifact["premium"])
            self.assertTrue(artifact["failed"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
