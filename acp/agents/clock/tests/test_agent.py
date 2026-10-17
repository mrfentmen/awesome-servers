"""Tests for the clock agent: one zone, several zones, zone lookup, routing and turns.

    python3 agents/clock/tests/test_agent.py

No network: the JSON is injected, shaped like the live payloads read on 2026-09-28
(timeapi.io's `dateTime` and `dstActive` for Asia/Tokyo, America/Santiago and
Europe/London). The IANA database the place names resolve against is the one on
this machine, read through `zoneinfo`.
"""

from __future__ import annotations

import json
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

from agent import route  # noqa: E402
from data import (ClockData, ClockError, ClockNotFound, available_zones,  # noqa: E402
                  offset_minutes, zone_from_text, zones_in_order)

DAYS = ("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")


def feed_for(zone: str, dst: bool) -> dict:
    """A timeapi payload for `zone`, built from the wall clock *right now*.

    A frozen snapshot cannot be used here. The agent compares the feed's wall clock
    with the IANA database's answer for the same instant, and a payload frozen at
    read time would disagree with the live clock on every run after the moment it
    was written - which is a flaky test, not a real disagreement. The shape is the
    one read live on 2026-09-28: `dateTime`, `time`, `date`, `dayOfWeek`, `dstActive`.
    """
    import datetime
    from zoneinfo import ZoneInfo

    now = datetime.datetime.now(ZoneInfo(zone)).replace(second=30, microsecond=0)
    return {
        "year": now.year, "month": now.month, "day": now.day,
        "hour": now.hour, "minute": now.minute, "seconds": 30,
        "dateTime": now.strftime("%Y-%m-%dT%H:%M:%S.000"),
        "date": now.strftime("%m/%d/%Y"),
        "time": now.strftime("%H:%M"),
        "timeZone": zone,
        "dayOfWeek": DAYS[now.weekday()],
        "dstActive": dst,
    }


#: Tokyo has no summer time, Santiago and London both observe it in September, and
#: Kolkata is a half-hour zone so the offset is never a whole number of hours.
TOKYO = feed_for("Asia/Tokyo", False)
SANTIAGO = feed_for("America/Santiago", True)
LONDON = feed_for("Europe/London", True)
KOLKATA = feed_for("Asia/Kolkata", False)

FEEDS = {
    "Asia/Tokyo": TOKYO, "America/Santiago": SANTIAGO,
    "Europe/London": LONDON, "Asia/Kolkata": KOLKATA,
}


class FakeFeeds:
    def __init__(self, feeds=None, fail=False, missing=False):
        self.calls: list[dict] = []
        self.feeds = FEEDS if feeds is None else feeds
        self.fail = fail
        self.missing = missing

    def __call__(self, url: str, params: dict | None = None):
        self.calls.append(dict(params or {}))
        if self.fail:
            raise ClockError("the time feed answered HTTP 503")
        if self.missing:
            raise ClockNotFound("the time feed does not hold that timezone; it is not a "
                                "valid IANA zone name")
        zone = (params or {}).get("timeZone")
        if zone not in self.feeds:
            raise ClockNotFound("the time feed does not hold that timezone; it is not a "
                                "valid IANA zone name")
        return json.dumps(self.feeds[zone])


def make_data(**kw):
    feed = FakeFeeds(**kw)
    return ClockData(fetch=feed), feed


class HelperTests(unittest.TestCase):
    def test_a_place_resolves_to_its_zone(self):
        self.assertEqual(zone_from_text("Tokyo"), ("Asia/Tokyo", "Tokyo"))
        self.assertEqual(zone_from_text("what time is it in Santiago?")[0], "America/Santiago")
        self.assertEqual(zone_from_text("Nuuk")[0], "America/Nuuk")
        self.assertEqual(zone_from_text("Buenos Aires")[0], "America/Argentina/Buenos_Aires")
        self.assertEqual(zone_from_text("New York")[0], "America/New_York")

    def test_an_explicit_zone_wins_over_a_place_name(self):
        self.assertEqual(zone_from_text("Asia/Tokyo"), ("Asia/Tokyo", "Tokyo"))
        self.assertEqual(zone_from_text("use Europe/London please"),
                         ("Europe/London", "London"))

    def test_a_city_matches_on_a_word_boundary_only(self):
        #: "between" contains "eet", which is the city component of Europe/EET. A
        #: substring search would turn "between London and Tokyo" into three zones.
        self.assertEqual([city for _z, city in zones_in_order("between London and Tokyo")],
                         ["London", "Tokyo"])
        self.assertIsNone(zone_from_text("Riverside"))
        self.assertIsNone(zone_from_text(""))

    def test_several_places_come_back_in_the_order_they_were_written(self):
        found = zones_in_order("what time is it in London and Santiago?")
        self.assertEqual([city for _z, city in found], ["London", "Santiago"])
        found = zones_in_order("Tokyo, London, Santiago and New York")
        self.assertEqual([city for _z, city in found],
                         ["Tokyo", "London", "Santiago", "New York"])
        #: A place is listed once even when it is named twice.
        self.assertEqual([city for _z, city in zones_in_order("London then London")],
                         ["London"])

    def test_a_half_hour_offset_is_not_rounded_to_an_hour(self):
        import datetime

        utc = datetime.datetime(2026, 9, 29, 5, 0, tzinfo=datetime.timezone.utc)
        self.assertEqual(offset_minutes("Asia/Kolkata", utc), 330)
        self.assertEqual(offset_minutes("Europe/London", utc), 60)
        self.assertEqual(offset_minutes("Pacific/Chatham", utc), 825)
        self.assertIsNone(offset_minutes("Nowhere/Nothing", utc))

    def test_the_database_is_the_iana_one(self):
        zones = available_zones()
        self.assertGreater(len(zones), 300)
        self.assertIn("Asia/Tokyo", zones)
        self.assertIn("America/Santiago", zones)


class ReadTests(unittest.TestCase):
    def test_one_zone(self):
        data, feed = make_data()
        reading = data.now("Asia/Tokyo")
        #: The feed's own wall clock, whatever the minute is when this runs.
        self.assertEqual(reading["feed_time"], TOKYO["time"])
        self.assertEqual(reading["zone"], "Asia/Tokyo")
        self.assertEqual(reading["city"], "Tokyo")
        self.assertEqual(reading["dst_active"], False)
        #: The feed publishes no offset, so it is derived from the IANA database.
        self.assertEqual(reading["offset"], "+09:00")
        self.assertEqual(reading["offset_minutes"], 540)
        self.assertEqual(feed.calls[-1]["timeZone"], "Asia/Tokyo")

    def test_a_zone_on_summer_time(self):
        data, _feed = make_data()
        reading = data.now("America/Santiago")
        self.assertEqual(reading["feed_time"], SANTIAGO["time"])
        self.assertEqual(reading["dst_active"], True)
        self.assertEqual(reading["offset"], "-03:00")

    def test_two_zones(self):
        data, _feed = make_data()
        readings = data.compare(["Europe/London", "Asia/Tokyo"])
        self.assertEqual([row["city"] for row in readings], ["London", "Tokyo"])
        self.assertEqual([row["offset"] for row in readings], ["+01:00", "+09:00"])

    def test_a_half_hour_zone(self):
        data, _feed = make_data()
        self.assertEqual(data.now("Asia/Kolkata")["offset"], "+05:30")

    def test_the_two_clocks_are_compared_not_picked_between(self):
        data, _feed = make_data()
        reading = data.now("Asia/Tokyo")
        #: The fixture's wall clock is 13:08 and the IANA database agrees, so the
        #: answer can say so rather than silently preferring one of them.
        self.assertIs(reading["matches_feed"], True)

    def test_a_disagreement_is_reported(self):
        #: Two hours out on purpose, so the disagreement is unambiguous.
        wrong = dict(TOKYO, time="09:08")
        data, _feed = make_data(feeds={"Asia/Tokyo": wrong})
        self.assertIs(data.now("Asia/Tokyo")["matches_feed"], False)

    def test_a_zone_the_feed_does_not_hold(self):
        data, _feed = make_data()
        with self.assertRaises(ClockNotFound):
            data.now("Europe/London" if False else "Nowhere/Nothing")
        data, _feed = make_data(missing=True)
        with self.assertRaises(ClockNotFound):
            data.now("Asia/Tokyo")

    def test_a_dead_api(self):
        data, _feed = make_data(fail=True)
        with self.assertRaises(ClockError):
            data.now("Asia/Tokyo")


class RouteTests(unittest.TestCase):
    def test_one_place(self):
        skill, params = route("what time is it in Tokyo?")
        self.assertEqual(skill, "clock-now")
        self.assertEqual(params["zones"], ["Asia/Tokyo"])
        self.assertEqual(params["cities"], ["Tokyo"])

    def test_two_places(self):
        skill, params = route("what time is it in London and Santiago?")
        self.assertEqual(skill, "clock-compare")
        self.assertEqual(params["cities"], ["London", "Santiago"])

    def test_a_zone_question_is_not_a_clock_reading(self):
        skill, params = route("what is the timezone for Santiago?")
        self.assertEqual(skill, "clock-zone")
        self.assertEqual(params["zones"], ["America/Santiago"])

    def test_a_count_of_the_database(self):
        self.assertEqual(route("how many timezones are there?"), ("clock-zones", {}))
        self.assertEqual(route("list every timezone")[0], "clock-zones")

    def test_the_meeting(self):
        skill, params = route("find a 45 minute slot this week that works for London, "
                              "Tokyo and New York")
        self.assertEqual(skill, "clock-meet")
        self.assertEqual(params["minutes"], 45)
        self.assertEqual(params["zones"],
                         ["Europe/London", "Asia/Tokyo", "America/New_York"])
        self.assertEqual(route("when can we meet for half an hour between London and "
                               "Tokyo")[1]["minutes"], 30)
        self.assertEqual(route("a 2 hour call between London and Tokyo")[1]["minutes"], 120)

    def test_a_meeting_needs_two_places_and_a_length(self):
        self.assertEqual(route("when can I meet with someone?")[0], "help")
        self.assertEqual(route("find a 45 minute slot for London")[0], "clock-now")

    def test_a_reading_is_never_a_meeting(self):
        self.assertEqual(route("what time is it in London and Tokyo?")[0], "clock-compare")
        self.assertEqual(route("what is the current time in London and Tokyo?")[0],
                         "clock-compare")

    def test_help_and_nonsense(self):
        self.assertEqual(route("")[0], "help")
        self.assertEqual(route("what can you do?")[0], "help")
        self.assertEqual(route("tell me a joke")[0], "help")


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
        from agent import ClockAgent

        agent_conn, client_conn = connected_pair()
        data, feed = make_data(**kw)
        agent = ClockAgent(agent_conn, data)
        threading.Thread(target=agent_conn.serve, daemon=True).start()
        client = AcpClient(connection=client_conn, permission=permission)
        client.start()
        client.initialize()
        session_id = client.new_session(cwd="/tmp")
        try:
            return client.prompt(text, session_id), client, feed
        finally:
            client.stop()

    def test_a_now_answer(self):
        result, client, _ = self.turn("what time is it in Tokyo?")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertEqual(len(client.permission_requests), 1)
        import datetime
        from zoneinfo import ZoneInfo

        now = datetime.datetime.now(ZoneInfo("Asia/Tokyo"))
        self.assertIn(f"Tokyo (Asia/Tokyo) is {now:%H:%M} on {now:%m/%d/%Y} ({now:%A})",
                      result["text"])
        self.assertIn("UTC offset: +09:00 (9 h ahead of UTC)", result["text"])
        self.assertIn("summer time in force there right now: no", result["text"])
        self.assertIn("agree to the minute", result["text"])

    def test_a_compare_answer(self):
        result, _, _ = self.turn("what time is it in London and Santiago?")
        self.assertIn("the time in 2 places, right now", result["text"])
        self.assertIn("London", result["text"])
        self.assertIn("Santiago", result["text"])
        #: The spread is London's offset minus Santiago's, whatever they are today.
        self.assertRegex(result["text"], r"widest spread here is London to Santiago: \d+ h")
        self.assertIn("summer time yes", result["text"])

    def test_a_zone_answer(self):
        result, _, _ = self.turn("what is the timezone for Santiago?")
        self.assertIn("the timezone for Santiago:", result["text"])
        self.assertIn("Santiago: America/Santiago", result["text"])
        self.assertIn("a place resolves only when the IANA zone is named after a city",
                      result["text"])
        #: The zone list costs no call, and this one did not even use the feed.
        self.assertEqual(result["stopReason"], STOP_END_TURN)

    def test_the_zone_list_costs_nothing(self):
        result, client, feed = self.turn("how many timezones are there?")
        self.assertIn("IANA timezone database holds", result["text"])
        self.assertIn("zones.", result["text"])
        self.assertEqual(feed.calls, [])
        self.assertEqual(client.permission_requests, [])

    def test_help_asks_nothing(self):
        result, client, feed = self.turn("what can you do?")
        self.assertIn("what time is it in Tokyo?", result["text"])
        self.assertIn("what is the timezone for Santiago?", result["text"])
        self.assertEqual(client.permission_requests, [])
        self.assertEqual(feed.calls, [])

    def test_permission_denied(self):
        result, _, _ = self.turn("what time is it in Tokyo?", permission="reject")
        self.assertEqual(result["stopReason"], STOP_REFUSAL)

    def test_a_dead_api(self):
        result, _, _ = self.turn("what time is it in Tokyo?", fail=True)
        self.assertIn("I could not read the time", result["text"])

    def test_a_place_the_database_does_not_know(self):
        result, _, _ = self.turn("what time is it in Riverside?")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn("what time is it in Tokyo?", result["text"])


# ---------------------------------------------------------------------------
#
# ---------------------------------------------------------------------------

#: What `clock_meeting_slots` answers for London, New York and Chicago: a 6 hour
#: spread and 14 overlapping slots, the first at 13:00 UTC.
MEET_DATA = {
    "zones": [
        {"zone": "Europe/London", "city": "London", "wall_clock": "2026-09-29T05:08:55",
         "dst_active": True, "day_of_week": "Tuesday", "offset_minutes": 60, "offset": "+01:00"},
        {"zone": "America/New_York", "city": "New York",
         "wall_clock": "2026-09-29T01:08:55", "dst_active": True, "day_of_week": "Tuesday",
         "offset_minutes": -240, "offset": "-04:00"},
        {"zone": "America/Chicago", "city": "Chicago", "wall_clock": "2026-09-29T00:08:55",
         "dst_active": True, "day_of_week": "Tuesday", "offset_minutes": -300,
         "offset": "-05:00"},
    ],
    "minutes": 60,
    "days": 7,
    "span": 360,
    "span_text": "6 h",
    "closest_to_utc": {"zone": "Europe/London", "city": "London", "offset": "+01:00"},
    "slots_found": 14,
    "slots": [{
        "start_utc": "2026-09-29T13:00:00", "end_utc": "2026-09-29T14:00:00",
        "start_local": "14:00", "end_local": "15:00", "minutes": 60,
        "local": [
            {"city": "London", "zone": "Europe/London", "offset": "+01:00", "local": "14:00"},
            {"city": "New York", "zone": "America/New_York", "offset": "-04:00", "local": "09:00"},
            {"city": "Chicago", "zone": "America/Chicago", "offset": "-05:00", "local": "08:00"},
        ],
    }],
    "working_window": {
        "start_utc": "08:00", "end_utc": "18:00",
        "note": "a published round figure, not a country holiday calendar",
    },
    "reason": None,
    "accuracy": "offsets are the ones in force at the moment of this call",
    "source": "timeapi.io current time (api.timeapi.io)",
}

#: A set that genuinely cannot meet: 23 hours apart.
NO_MEET_DATA = {
    "zones": [
        {"zone": "Pacific/Auckland", "city": "Auckland", "wall_clock": "2026-09-29T18:08:55",
         "dst_active": False, "day_of_week": "Tuesday", "offset_minutes": 780, "offset": "+13:00"},
        {"zone": "Pacific/Honolulu", "city": "Honolulu", "wall_clock": "2026-09-28T16:08:55",
         "dst_active": False, "day_of_week": "Monday", "offset_minutes": -600,
         "offset": "-10:00"},
    ],
    "minutes": 60, "days": 7, "span": 1380, "span_text": "23 h",
    "closest_to_utc": {"zone": "Pacific/Honolulu", "city": "Honolulu", "offset": "-10:00"},
    "slots_found": 0, "slots": [],
    "working_window": {"start_utc": "08:00", "end_utc": "18:00", "note": "a round figure"},
    "reason": "these zones are 23 h apart, so no 1 h slot is inside the working window for all "
              "of them",
    "accuracy": "offsets are the ones in force at the moment of this call",
    "source": "timeapi.io current time (api.timeapi.io)",
}

#: The exact refusal the gateway sends for a key it will not accept.






if __name__ == "__main__":
    unittest.main(verbosity=2)
