"""Tests for the f1 agent: calendar, results, standings, drivers, routing and turns.

    python3 agents/f1/tests/test_agent.py

No network: the JSON is injected, shaped like the live payloads read on 2026-09-28
(`/2026/next/` -> round 16 'Bahrain Grand Prix in Malaysia' at Sepang, 2026-10-04 07:00:00Z;
`/current/driverStandings.json` -> round 15, 'antonelli' P1 on 302 with 8 wins;
/current/last/results.json` -> round 15 Azerbaijan Grand Prix, Russell P1 in 1:38:02.143).
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
from data import F1Data, F1Error, F1NotFound, driver_from_text  # noqa: E402


def driver(driver_id, given, family, code, number, nationality, born):
    return {"driverId": driver_id, "permanentNumber": number, "code": code,
            "url": f"https://en.wikipedia.org/wiki/{given}_{family}", "givenName": given,
            "familyName": family, "dateOfBirth": born, "nationality": nationality}


ANTONELLI = driver("antonelli", "Andrea Kimi", "Antonelli", "ANT", "12", "Italian", "2006-08-25")
RUSSELL = driver("russell", "George", "Russell", "RUS", "63", "British", "1996-02-25")
VERSTAPPEN = driver("max_verstappen", "Max", "Verstappen", "VER", "3", "Dutch", "1997-09-30")

NEXT = {"MRData": {"series": "f1", "limit": "30", "total": "1", "RaceTable": {
    "season": "2026", "round": "16", "Races": [{
        "season": "2026", "round": "16", "raceName": "Bahrain Grand Prix in Malaysia",
        "url": "https://en.wikipedia.org/wiki/2026_Bahrain_Grand_Prix", "date": "2026-10-04",
        "time": "07:00:00Z",
        "Circuit": {"circuitId": "sepang", "circuitName": "Sepang International Circuit",
                    "Location": {"lat": "2.76083", "long": "101.738",
                                 "locality": "Kuala Lumpur", "country": "Malaysia"}},
        "FirstPractice": {"date": "2026-10-02", "time": "04:30:00Z"},
        "Qualifying": {"date": "2026-10-03", "time": "10:00:00Z"},
        "Race": {"date": "2026-10-04", "time": "07:00:00Z"}}]}}}

#: A season with nothing left in it: the feed names no next race, which is a real answer.
NO_NEXT = {"MRData": {"series": "f1", "total": "0", "RaceTable": {"season": "2025", "Races": []}}}

LAST = {"MRData": {"series": "f1", "total": "22", "RaceTable": {"season": "2026", "round": "15",
    "Races": [{
        "season": "2026", "round": "15", "raceName": "Azerbaijan Grand Prix",
        "date": "2026-09-26", "time": "11:00:00Z",
        "Circuit": {"circuitName": "Baku City Circuit", "Location": {"locality": "Baku",
                                                                     "country": "Azerbaijan"}},
        "Race": {"date": "2026-09-26", "time": "11:00:00Z"},
        "Results": [
            {"number": "63", "position": "1", "points": "25", "grid": "1", "laps": "51",
             "status": "Finished", "Time": {"millis": "5882143", "time": "1:38:02.143"},
             "FastestLap": {"lap": "49", "AverageSpeed": "206.900"},
             "Driver": RUSSELL, "Constructor": {"name": "Mercedes"}},
            #: No Time at all: the car did not finish, and the feed carries no time for it.
            {"number": "1", "position": "2", "points": "18", "grid": "3", "status": "Accident",
             "Driver": VERSTAPPEN, "Constructor": {"name": "Red Bull"}},
        ]}]}}}

#: The real shape nests the rows one level deeper, under StandingsLists.
DRIVER_STANDINGS = {"MRData": {"series": "f1", "total": "20", "StandingsTable": {
    "season": "2026", "round": "15", "StandingsLists": [
        {"season": "2026", "round": "15", "DriverStandings": [
            {"position": "1", "positionText": "1", "points": "302", "wins": "8",
             "Driver": ANTONELLI, "Constructors": [{"name": "Mercedes"}]},
            {"position": "2", "positionText": "2", "points": "280", "wins": "5",
             "Driver": RUSSELL, "Constructors": [{"name": "Mercedes"}]},
        ]}]}}}

CONSTRUCTOR_STANDINGS = {"MRData": {"series": "f1", "StandingsTable": {
    "season": "2026", "round": "15", "StandingsLists": [
        {"season": "2026", "round": "15", "ConstructorStandings": [
            {"position": "1", "points": "538", "wins": "11", "Constructor": {"name": "Mercedes"}},
            {"position": "2", "points": "378", "wins": "6", "Constructor": {"name": "Ferrari"}},
        ]}]}}}

DRIVER_TABLE = {"MRData": {"series": "f1", "DriverTable": {"Drivers": [VERSTAPPEN]}}}
DRIVER_MISSING = {"MRData": {"series": "f1", "DriverTable": {"Drivers": []}}}


class FakeFeeds:
    def __init__(self, next_race=None, last=None, standings=None, constructors=None,
                 driver_table=None, empty_driver=False, fail=False):
        self.calls: list[str] = []
        self.next_race = next_race if next_race is not None else NEXT
        self.last = last if last is not None else LAST
        self.standings = standings if standings is not None else DRIVER_STANDINGS
        self.constructors = constructors if constructors is not None else CONSTRUCTOR_STANDINGS
        self.driver_table = (DRIVER_MISSING if empty_driver
                             else (driver_table if driver_table is not None else DRIVER_TABLE))
        self.fail = fail

    def __call__(self, url: str):
        self.calls.append(url)
        if self.fail:
            raise F1Error("the F1 feed is unreachable")
        if "/next.json" in url:
            return json.dumps(self.next_race)
        if "/last/results.json" in url:
            return json.dumps(self.last)
        if "/driverStandings.json" in url:
            return json.dumps(self.standings)
        if "/constructorstandings.json" in url:
            return json.dumps(self.constructors)
        if "/drivers/" in url:
            return json.dumps(self.driver_table)
        raise F1Error(f"unexpected url in test: {url}")


def make_data(**kw):
    feed = FakeFeeds(**kw)
    return F1Data(fetch=feed), feed


class HelperTests(unittest.TestCase):
    def test_a_driver_name_is_pulled_from_the_end_of_the_question(self):
        self.assertEqual(driver_from_text("tell me about Lewis Hamilton"), "lewis_hamilton")
        self.assertEqual(driver_from_text("tell me about max_verstappen"), "max_verstappen")
        self.assertEqual(driver_from_text("about Lando Norris"), "lando_norris")
        #: A question with no name in it must not become a driver.
        self.assertIsNone(driver_from_text("who won the last race?"))


class ReadTests(unittest.TestCase):
    def test_the_next_race_with_its_weekend(self):
        data, feed = make_data()
        coming = data.next_race()
        race = coming["races"][0]
        self.assertEqual(race["name"], "Bahrain Grand Prix in Malaysia")
        self.assertEqual(race["round"], "16")
        self.assertEqual(race["date"], "2026-10-04")
        self.assertEqual(race["time"], "07:00:00 UTC")
        self.assertEqual(race["circuit"], "Sepang International Circuit")
        self.assertEqual(race["place"], "Kuala Lumpur, Malaysia")
        self.assertEqual(race["sessions"]["qualifying"], "2026-10-03 10:00:00 UTC")
        self.assertIn("/current/next.json", feed.calls[0])

    def test_a_season_with_no_race_left_is_not_an_error(self):
        data, _feed = make_data(next_race=NO_NEXT)
        coming = data.next_race("2025")
        self.assertEqual(coming["races"], [])
        self.assertIn("no next race", coming["message"])

    def test_the_last_result_keeps_a_missing_time_missing(self):
        data, feed = make_data()
        race = data.last_result(limit=5)
        self.assertEqual(race["name"], "Azerbaijan Grand Prix")
        first, second = race["results"]
        self.assertEqual(first["driver"], "George Russell")
        self.assertEqual(first["time"], "1:38:02.143")
        self.assertEqual(first["constructor"], "Mercedes")
        self.assertEqual(first["fastest_lap"], "lap 49")
        #: P2 crashed. There is no Time in the feed, so it says so rather than inventing one.
        self.assertEqual(second["time"], "did not finish")
        self.assertEqual(second["status"], "Accident")
        self.assertIsNone(second["fastest_lap"])
        self.assertIn("last/results.json?limit=5", feed.calls[0])

    def test_both_championship_tables(self):
        data, feed = make_data()
        drivers = data.driver_standings(limit=5)
        self.assertEqual(drivers["round"], "15")
        self.assertEqual(drivers["rows"][0]["driver"], "Andrea Kimi Antonelli")
        self.assertEqual(drivers["rows"][0]["points"], "302")
        self.assertEqual(drivers["rows"][0]["constructor"], "Mercedes")
        teams = data.constructor_standings(limit=5)
        self.assertEqual(teams["rows"][0]["constructor"], "Mercedes")
        self.assertEqual(teams["rows"][0]["points"], "538")
        self.assertIn("driverStandings.json?limit=5", feed.calls[0])

    def test_one_driver_and_a_driver_the_feed_does_not_have(self):
        data, _feed = make_data()
        record = data.driver("max_verstappen")
        self.assertEqual(record["name"], "Max Verstappen")
        self.assertEqual(record["number"], "3")
        self.assertEqual(record["born"], "1997-09-30")
        self.assertEqual(record["key"], "max_verstappen")
        data, _feed = make_data(empty_driver=True)
        with self.assertRaises(F1NotFound):
            data.driver("nobody_here")
        data, _feed = make_data(fail=True)
        with self.assertRaises(F1Error):
            data.next_race()


class RouteTests(unittest.TestCase):
    def test_the_free_skills(self):
        self.assertEqual(route("when is the next F1 race?"), ("f1-next", {"season": "current"}))
        self.assertEqual(route("who won the last race?"), ("f1-last", {"season": "current"}))
        self.assertEqual(route("what are the driver standings?"),
                         ("f1-standings", {"season": "current"}))
        self.assertEqual(route("who are the constructor standings?"),
                         ("f1-constructors", {"season": "current"}))
        self.assertEqual(route("tell me about max_verstappen"),
                         ("f1-driver", {"driver_id": "max_verstappen"}))
        self.assertEqual(route("F1 schedule 2025"), ("f1-next", {"season": "2025"}))


    def test_help_and_another_subject(self):
        self.assertEqual(route("")[0], "help")
        self.assertEqual(route("what can you do?")[0], "help")
        self.assertEqual(route("what is the weather in Ohio?")[0], "help")


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
        from agent import F1Agent

        agent_conn, client_conn = connected_pair()
        data, feed = make_data(**kw)
        agent = F1Agent(agent_conn, data)
        threading.Thread(target=agent_conn.serve, daemon=True).start()
        client = AcpClient(connection=client_conn, permission=permission)
        client.start()
        client.initialize()
        session_id = client.new_session(cwd="/tmp")
        try:
            return client.prompt(text, session_id), client, feed
        finally:
            client.stop()

    def test_the_next_race_answer(self):
        result, client, _ = self.turn("when is the next F1 race?")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertEqual(len(client.permission_requests), 1)
        #: The season printed is the one the payload carries, not the one asked for.
        self.assertIn("Bahrain Grand Prix in Malaysia - round 16 of the 2026 season",
                      result["text"])
        self.assertIn("date: 2026-10-04 (07:00:00 UTC)", result["text"])
        self.assertIn("circuit: Sepang International Circuit, Kuala Lumpur, Malaysia",
                      result["text"])
        self.assertIn("qualifying: 2026-10-03 10:00:00 UTC", result["text"])

    def test_a_finished_season_says_there_is_no_next_race(self):
        result, _, _ = self.turn("F1 schedule 2025", next_race=NO_NEXT)
        self.assertIn("No next race", result["text"])
        self.assertIn("The season's races are all in the past", result["text"])

    def test_the_last_result_answer(self):
        result, _, _ = self.turn("who won the last race?")
        self.assertIn("Azerbaijan Grand Prix - round 15", result["text"])
        self.assertIn("P1 George Russell - Mercedes, 25 point(s), 51 lap(s), from grid 1, "
                      "fastest lap 49 (1:38:02.143)", result["text"])
        self.assertIn("P2 Max Verstappen - Red Bull, 18 point(s), from grid 3 (did not finish)",
                      result["text"])
        self.assertNotIn("did not finish: None", result["text"])

    def test_the_standings_and_a_constructor_answer(self):
        result, _, _ = self.turn("what are the driver standings?")
        self.assertIn("Drivers' championship after round 15 of 2026", result["text"])
        self.assertIn("P1 Andrea Kimi Antonelli - Mercedes, 8 win(s) (302 point(s))",
                      result["text"])
        result, _, _ = self.turn("who are the constructor standings?")
        self.assertIn("P1 Mercedes - 11 win(s) (538 point(s))", result["text"])

    def test_a_driver_answer(self):
        result, _, _ = self.turn("tell me about max_verstappen")
        self.assertIn("Max Verstappen", result["text"])
        self.assertIn("number 3, code VER, Dutch", result["text"])
        self.assertIn("born: 1997-09-30", result["text"])
        self.assertIn("feed key: max_verstappen", result["text"])

    def test_help_asks_nothing(self):
        result, client, feed = self.turn("what can you do?")
        self.assertIn("Jolpica", result["text"])
        self.assertEqual(client.permission_requests, [])
        self.assertEqual(feed.calls, [])

    def test_permission_denied_and_a_dead_api(self):
        result, _, _ = self.turn("when is the next F1 race?", permission="reject")
        self.assertEqual(result["stopReason"], STOP_REFUSAL)
        result, _, _ = self.turn("when is the next F1 race?", fail=True)
        self.assertIn("I could not read the F1 feed", result["text"])


# ---------------------------------------------------------------------------
#
# ---------------------------------------------------------------------------

#: What `f1_championship_projection` answers for 2026 after round 15 with 5 races left.
PROJECTION_DATA = {
    "season": "2026",
    "afterRound": 15,
    "racesRemaining": 5,
    "leader": "Andrea Kimi Antonelli",
    "leaderPoints": 302,
    "projectedChampion": "Andrea Kimi Antonelli",
    "projectedMargin": 13.3,
    "method": "each driver keeps the average points a race they have scored so far, "
              "added over the races left",
    "drivers": [
        {"position": 1, "driver": "Andrea Kimi Antonelli", "driverId": "antonelli",
         "constructor": "Mercedes", "nationality": "Italian", "points": 302, "wins": 8,
         "pointsPerRace": 20.13, "projectedPoints": 402.7, "gapToLeader": 0,
         "projectedGapToLeader": 0.0},
        {"position": 2, "driver": "George Russell", "driverId": "russell",
         "constructor": "Mercedes", "nationality": "British", "points": 280, "wins": 5,
         "pointsPerRace": 18.67, "projectedPoints": 373.3, "gapToLeader": 22,
         "projectedGapToLeader": -29.3},
    ],
    "source": "Jolpica/Ergast F1 (api.jolpi.ca/ergast)",
}

#: The exact refusal the gateway sends for a key it will not accept.






if __name__ == "__main__":
    unittest.main(verbosity=2)
