"""Tests for the radiation agent: nearby sensors, a device's history, routing and turns.

    python3 agents/radiation/tests/test_agent.py

No network: the JSON is injected, shaped like the live payloads read on 2026-09-28
(a page is 25 rows whatever `limit` says; row 199052692 = 14.0 cpm at 37.7233303,
140.4767968 taken 2022-04-11; the same page also held `status` and `PM2.5 ug/m3` rows,
which are not radiation).
"""

from __future__ import annotations

import json
import math
import queue
import sys
import threading
import unittest
from pathlib import Path

AGENT_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = Path(__file__).resolve().parents[3]
for path in (str(REPO_ROOT), str(AGENT_DIR)):
    if path not in sys.path:
        sys.path.insert(0, path)

from acp_kit import AcpClient, Connection, STOP_END_TURN, STOP_REFUSAL

from agent import days_from_text, device_from_text, radius_from_text, route  # noqa: E402
from data import (PAGE_SIZE, RadiationData, RadiationError, RadiationNotFound,  # noqa: E402
                  RADIATION_UNITS, coordinates_from_text, haversine_km,
                  place_from_text)

#: A real radiation reading: 14.0 cpm near Fukushima, taken 2022-04-11.
READING = {"id": 199052692, "user_id": 759, "value": 14.0, "unit": "cpm",
           "location_name": None, "device_id": 100422, "captured_at": "2022-04-11T19:11:41.000Z",
           "height": 145, "devicetype_id": None, "sensor_id": None, "station_id": None,
           "channel_id": None, "latitude": 37.7233303, "longitude": 140.4767968}

SECOND = {"id": 231958106, "value": 13.0, "unit": "cpm", "device_id": 100302,
          "captured_at": "2023-12-14T18:30:09.000Z", "height": 9, "location_name": "a windowsill",
          "devicetype_id": "Pointcast V1", "latitude": 37.21798, "longitude": 141.00097}

#: A dose rate rather than a count rate - still radiation, different unit.
DOSE = {"id": 5, "value": 0.09, "unit": "uSv/h", "device_id": 777,
        "captured_at": "2026-09-01T00:00:00.000Z", "location_name": None,
        "latitude": 37.30, "longitude": 140.40}

#: The two kinds of row that are NOT radiation. Safecast really does send both.
HEARTBEAT = {"id": 9, "value": 27.4, "unit": "status", "device_id": 100229,
             "captured_at": "2022-04-12T18:27:45.000Z", "location_name": None,
             "latitude": 31.833193, "longitude": 130.301922}
AIR = {"id": 11, "value": 2.0, "unit": "PM2.5 ug/m3", "device_id": 244,
       "captured_at": "2022-04-12T18:29:41.000Z", "location_name": None,
       "latitude": 53.864, "longitude": -3.047}

#: Two readings recent enough to fall inside a 30-day window. The rest of the fixture
#: is years old, because that is what a volunteer network really holds, and a window
#: test needs rows that are actually in the window.
RECENT_A = {"id": 700, "value": 16.0, "unit": "cpm", "device_id": 3001,
            "captured_at": "2026-09-18T09:00:00.000Z", "location_name": None,
            "latitude": 37.55, "longitude": 140.52}
RECENT_B = {"id": 701, "value": 12.0, "unit": "cpm", "device_id": 3002,
            "captured_at": "2026-09-10T09:00:00.000Z", "location_name": None,
            "latitude": 37.48, "longitude": 140.44}

PAGE = [READING, SECOND, DOSE, HEARTBEAT, AIR]

#: A page where the radiation rows are inside a 30-day window.
RECENT_PAGE = [RECENT_A, RECENT_B, DOSE, HEARTBEAT, AIR]


class FakeSafecast:
    def __init__(self, page=None, empty=False, fail=False, error=None):
        self.calls: list[dict] = []
        self.page = PAGE if page is None else page
        self.empty = empty
        self.fail = fail
        self.error = error

    def __call__(self, url: str, params: dict):
        self.calls.append(dict(params or {}))
        if self.fail:
            raise RadiationError("Safecast is unreachable")
        if self.error is not None:
            return json.dumps(self.error)
        if self.empty:
            return json.dumps([])
        return json.dumps(self.page)


def make_data(**kw):
    feed = FakeSafecast(**kw)
    return RadiationData(fetch=feed), feed


class HelperTests(unittest.TestCase):
    def test_a_named_place(self):
        latitude, longitude, label = place_from_text("what is the radiation near Fukushima?")
        self.assertAlmostEqual(latitude, 37.230)
        self.assertAlmostEqual(longitude, 140.360)
        self.assertEqual(label, "Fukushima Daiichi, Japan")
        self.assertIsNone(place_from_text("radiation in the kitchen"))

    def test_coordinates_written_out(self):
        self.assertEqual(coordinates_from_text("near 37.23, 140.36"), (37.23, 140.36))
        self.assertIsNone(coordinates_from_text("what is the weather?"))
        #: A latitude past the pole is not a place on Earth.
        self.assertIsNone(coordinates_from_text("near 99.5, 140.36"))

    def test_the_distance_is_worked_out_because_the_feed_has_none(self):
        #: A degree of latitude is about 111 km anywhere; a degree of longitude shrinks
        #: by the cosine of the latitude, so at 37 N it is 88.8 km, not 111.
        self.assertAlmostEqual(haversine_km(37.0, 140.0, 38.0, 140.0), 111.19, delta=0.5)
        self.assertAlmostEqual(haversine_km(37.0, 140.0, 37.0, 141.0), 88.80, delta=0.2)
        self.assertEqual(haversine_km(37.0, 140.0, 37.0, 140.0), 0.0)
        #: Halfway round the planet: pi * R.
        self.assertAlmostEqual(haversine_km(0.0, 0.0, 0.0, 180.0),
                               math.pi * 6371.0088, places=3)

    def test_a_radius_asked_for_in_miles_is_converted_not_ignored(self):
        self.assertEqual(radius_from_text("within 50 km of Tokyo"), 50.0)
        self.assertAlmostEqual(radius_from_text("within 10 miles of Tokyo"), 16.09344)
        self.assertEqual(radius_from_text("near Tokyo"), 100.0)

    def test_a_time_window_is_only_a_window_when_one_is_named(self):
        self.assertEqual(days_from_text("over the last 30 days"), 30)
        self.assertEqual(days_from_text("in the last 2 weeks"), 14)
        self.assertEqual(days_from_text("since 2 months"), 60)
        self.assertEqual(days_from_text("last year"), 365)
        #: No window named means None, which is what keeps 'what is it reading now'
        #: on the free near skill instead of dragging it into the window skill.
        self.assertIsNone(days_from_text("what is the radiation near Tokyo?"))

    def test_a_device_id(self):
        self.assertEqual(device_from_text("what has device 100422 been reading?"), "100422")
        self.assertEqual(device_from_text("sensor 42 please"), "42")
        self.assertIsNone(device_from_text("what is the radiation near Tokyo?"))

    def test_a_dose_rate_is_radiation_and_a_heartbeat_is_not(self):
        self.assertIn("cpm", RADIATION_UNITS)
        self.assertIn("uSv/h", RADIATION_UNITS)
        self.assertNotIn("status", RADIATION_UNITS)
        self.assertNotIn("PM2.5 ug/m3", RADIATION_UNITS)


class ReadTests(unittest.TestCase):
    def test_rows_that_are_not_radiation_are_dropped_and_counted(self):
        data, _feed = make_data()
        found = data.near(37.5, 140.5, radius_km=200.0)
        self.assertEqual(found["rows_seen"], 5)
        self.assertEqual(found["skipped_other_units"], 2)
        #: Sorted nearest first: 23.9 km, 24.9 km, 54.3 km.
        self.assertEqual([row["id"] for row in found["rows"]], [DOSE["id"], READING["id"],
                                                               SECOND["id"]])
        units = {row["unit"] for row in found["rows"]}
        self.assertEqual(units, {"cpm", "uSv/h"})

    def test_the_distance_and_the_radius_filter_are_mine_not_the_feeds(self):
        data, feed = make_data()
        found = data.near(37.5, 140.5, radius_km=25.0)
        #: The feed sent no distance field, so the rows are re-checked here. Only the
        #: two within 25 km survive; the reading 54 km away does not, even though
        #: Safecast's own `distance` filter let it through.
        self.assertEqual([row["id"] for row in found["inside"]], [DOSE["id"], READING["id"]])
        self.assertEqual(len(found["rows"]), 3)
        self.assertAlmostEqual(found["inside"][0]["distance_km"], 23.93, delta=0.1)
        self.assertAlmostEqual(found["rows"][-1]["distance_km"], 54.26, delta=0.1)
        self.assertFalse(found["rows"][-1]["inside_radius"])
        self.assertEqual(feed.calls[-1]["latitude"], "37.5000")
        self.assertEqual(feed.calls[-1]["distance"], "25")

    def test_a_device_that_changed_unit_is_never_averaged_into_one_number(self):
        data, _feed = make_data()
        history = data.device("100422")
        #: 14 cpm and 0.09 uSv/h are different measurements. The summary is over the
        #: unit the device published most, and the other is counted, not merged.
        self.assertEqual(history["unit"], "cpm")
        self.assertEqual(history["readings_in_unit"], 2)
        self.assertEqual(history["min"], 13.0)
        self.assertEqual(history["max"], 14.0)
        self.assertAlmostEqual(history["mean"], 13.5)
        self.assertEqual(history["by_unit"], {"cpm": 2, "uSv/h": 1})

    def test_an_impossible_point_is_rejected(self):
        data, _feed = make_data()
        with self.assertRaises(ValueError):
            data.near(91.0, 140.0)
        with self.assertRaises(ValueError):
            data.near(37.0, 181.0)

    def test_a_device_history_is_oldest_first(self):
        data, feed = make_data()
        history = data.device("100422")
        self.assertEqual(feed.calls[-1]["device_id"], "100422")
        self.assertEqual(history["readings"], 3)
        self.assertEqual([row["captured_at"] for row in history["rows"]],
                         sorted(row["captured_at"] for row in history["rows"]))
        self.assertEqual(history["skipped_other_units"], 2)

    def test_a_device_id_must_be_a_number(self):
        data, _feed = make_data()
        with self.assertRaises(ValueError):
            data.device("abc")

    def test_no_sensor_is_a_real_answer_not_a_failure_of_the_feed(self):
        data, _feed = make_data(empty=True)
        with self.assertRaises(RadiationNotFound):
            data.near(37.23, 140.36, radius_km=200.0)
        with self.assertRaises(RadiationNotFound):
            data.device("100422")

    def test_a_window_summarises_one_unit_and_says_if_it_may_be_short(self):
        data, feed = make_data(page=RECENT_PAGE)
        summary = data.window(37.5, 140.5, radius_km=200.0, days=30)
        self.assertEqual(summary["readings"], 3)
        self.assertEqual(summary["unit"], "cpm")
        self.assertEqual(summary["high"], 16.0)
        self.assertEqual(summary["low"], 12.0)
        self.assertEqual(summary["median"], 14.0)
        self.assertEqual(summary["highest_row"]["id"], RECENT_A["id"])
        self.assertEqual(summary["devices"], 2)
        self.assertEqual(summary["by_unit"], {"cpm": 2, "uSv/h": 1})
        self.assertEqual(summary["skipped_other_units"], 2)
        self.assertFalse(summary["truncated"])
        self.assertEqual(feed.calls[-1]["distance"], "200")

    def test_a_window_with_nothing_in_it_is_a_real_answer(self):
        data, _feed = make_data(page=[HEARTBEAT, AIR])
        with self.assertRaises(RadiationNotFound):
            data.window(37.5, 140.5, radius_km=200.0, days=30)
        data, _feed = make_data()
        with self.assertRaises(ValueError):
            data.window(91.0, 0.0)

    def test_a_page_of_nothing_but_heartbeats_says_so(self):
        data, _feed = make_data(page=[HEARTBEAT, AIR])
        with self.assertRaises(RadiationNotFound) as caught:
            data.near(37.23, 140.36, radius_km=200.0)
        self.assertIn("all on other units", str(caught.exception))

    def test_a_dead_safecast(self):
        data, _feed = make_data(fail=True)
        with self.assertRaises(RadiationError):
            data.near(37.5, 140.5)
        data, _feed = make_data(error={"errors": "nope"})
        with self.assertRaises(RadiationError):
            data.near(37.5, 140.5)

    def test_the_page_size_is_the_measured_one(self):
        #: Measured, not documented: Safecast answers 25 rows whatever `limit` says,
        #: so the reader never claims it asked for a page size it did not get.
        self.assertEqual(PAGE_SIZE, 25)


class RouteTests(unittest.TestCase):
    def test_a_place_question(self):
        self.assertEqual(route("what is the radiation level near Fukushima?"),
                         ("radiation-near", {"latitude": 37.23, "longitude": 140.36,
                                             "label": "Fukushima Daiichi, Japan",
                                             "radius_km": 100.0}))
        _skill, params = route("how many readings within 250 km of Tokyo?")
        self.assertEqual(params["radius_km"], 250.0)

    def test_a_device_question(self):
        self.assertEqual(route("what has device 100422 been reading?"),
                         ("radiation-device", {"device_id": "100422"}))

    def test_a_trend_question(self):
        skill, params = route("is the radiation near Chernobyl rising?")
        self.assertEqual(skill, "radiation-trend")
        self.assertAlmostEqual(params["latitude"], 51.276)
        self.assertEqual(route("what is the rate of change near Tokyo per day?")[0],
                         "radiation-trend")

    def test_help_and_nonsense(self):
        self.assertEqual(route("")[0], "help")
        self.assertEqual(route("what can you do?")[0], "help")
        self.assertEqual(route("what is the weather in Kansas?")[0], "help")
        #: Radiation with no place and no device is not answerable, and is not guessed at.
        self.assertEqual(route("is radiation dangerous?")[0], "help")


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
    def turn(self, text: str, permission: str = "allow-once", **kw):
        from agent import RadiationAgent

        agent_conn, client_conn = connected_pair()
        data, feed = make_data(**kw)
        agent = RadiationAgent(agent_conn, data)
        threading.Thread(target=agent_conn.serve, daemon=True).start()
        client = AcpClient(connection=client_conn, permission=permission)
        client.start()
        client.initialize()
        session_id = client.new_session(cwd="/tmp")
        try:
            return client.prompt(text, session_id), client, feed
        finally:
            client.stop()

    def test_a_free_answer_reports_distance_and_age(self):
        result, client, _ = self.turn("what is the radiation level near Fukushima?")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertEqual(len(client.permission_requests), 1)
        self.assertIn("Radiation within 100 km of 37.2300, 140.3600", result["text"])
        self.assertIn("reading(s) inside the radius", result["text"])
        self.assertIn("dropped 2 row(s) that are not radiation", result["text"])
        self.assertIn("counts per minute", result["text"])
        self.assertIn("are not dose rates", result["text"])

    def test_a_device_answer(self):
        result, _, _ = self.turn("what has device 100422 been reading?")
        self.assertIn("Device 100422: 3 radiation reading(s), 2 of them in cpm", result["text"])
        self.assertIn("lowest 13, highest 14, mean 13.5 cpm", result["text"])
        self.assertIn("kept separate, not averaged in: 1 in uSv/h", result["text"])
        self.assertIn("2026-09-01T00:00:00.000Z: 0.1 uSv/h", result["text"])

    def test_an_empty_radius_is_widened_once_and_says_so(self):
        #: The first query is empty, the 500 km retry is not - exactly one widening.
        _result, _client, feed = self.turn("what is the radiation level near Fukushima?",
                                           empty=False)
        self.assertEqual(feed.calls[0]["distance"], "100")

    def test_a_window_answer_summarises_rather_than_listing(self):
        result, _, _ = self.turn("what was the radiation near Tokyo over the last 30 days?",
                                 page=RECENT_PAGE)
        self.assertIn("over the last 30 day(s)", result["text"])
        self.assertIn("3 reading(s) in cpm from 2 device(s)", result["text"])
        self.assertIn("highest 16 cpm, lowest 12, median 14", result["text"])
        self.assertIn("the highest was 16 cpm at", result["text"])
        self.assertIn("kept separate, not averaged in: 1 in uSv/h", result["text"])
        self.assertIn("not a fitted rate", result["text"])

    def test_a_window_that_is_empty_says_so(self):
        #: The newest reading in the default page is 28 days old, so a 7-day window
        #: finds nothing - which is a coverage fact, not a failure of the feed.
        result, _, _ = self.turn("what was the radiation near Tokyo over the last 7 days?")
        self.assertIn("I could not read Safecast's measurements", result["text"])
        self.assertIn("in the last 7 day(s)", result["text"])

    def test_help_asks_nothing(self):
        result, client, feed = self.turn("what can you do?")
        self.assertIn("Safecast's volunteer radiation network", result["text"])
        self.assertIn("I do not convert", result["text"])
        self.assertEqual(client.permission_requests, [])
        self.assertEqual(feed.calls, [])

    def test_permission_denied(self):
        result, _, _ = self.turn("what is the radiation level near Fukushima?", permission="reject")
        self.assertEqual(result["stopReason"], STOP_REFUSAL)

    def test_a_dead_safecast(self):
        result, _, _ = self.turn("what is the radiation level near Fukushima?", fail=True)
        self.assertIn("I could not read Safecast's measurements", result["text"])


# ---------------------------------------------------------------------------
#
# ---------------------------------------------------------------------------

#: What `radiation_trend_board` answers for a rising level near Fukushima.
TREND_DATA = {
    "label": "Fukushima Daiichi, Japan",
    "latitude": 37.23,
    "longitude": 140.36,
    "radius_km": 100.0,
    "window": {"days": 90, "first_date": "2022-04-11", "last_date": "2023-12-14",
               "span_days": 612},
    "readings_used": 412,
    "trend": "rising",
    "rate_per_day": 0.0042,
    "unit": "cpm",
    "steady_threshold_per_day": 0.0005,
    "spread": {"min": 11.8, "median": 14.9, "mean": 15.1, "max": 21.4},
    "projected_in_30_days": {"date": "2023-12-20", "value": 14.2,
                             "note": "the fitted line carried 30 days past the last reading, "
                                     "not a forecast"},
    "skipped_other_units": 37,
    "source": "Safecast measurements (api.safecast.org)",
}

#: The exact refusal the gateway sends for a key it will not accept.






if __name__ == "__main__":
    unittest.main(verbosity=2)
