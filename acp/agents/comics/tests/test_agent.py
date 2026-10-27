"""Tests for the comics agent: latest, one comic, a run, routing and turns.

    python3 agents/comics/tests/test_agent.py

No network: the JSON is injected, shaped like the live payloads read on 2026-09-28
(`/info.0.json` -> num 3303 'Slab Graveyard' dated 2026-09-26; `/3000/info.0.json` -> 'Experimental
Astrophysics', 2024-10-18; comic 1600 has a 596-character transcript and 1650 has an empty
one, because xkcd stopped publishing transcripts).
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
from data import (ComicsData, ComicsError, ComicsNotFound,  # noqa: E402
                  count_from_text, number_from_text, range_from_text)


def info(num, title, year, month, day, alt, transcript="", link=""):
    return {"num": num, "title": title, "year": year, "month": month, "day": day,
            "alt": alt, "transcript": transcript, "news": "",
            "link": link, "img": f"https://imgs.xkcd.com/comics/{title.lower().replace(' ', '_')}.png"}


#: `/info.0.json` is the newest comic, not comic zero.
LATEST = info(3303, "Slab Graveyard", "2026", "9", "26",
              "It's ok if you want to close close your eyes for the slab graveyard!")

COMIC_3000 = info(3000, "Experimental Astrophysics", "2024", "10", "18",
                  "Our experiment will be expensive, but we believe it will produce "
                  "important spin-offs, especially if we fire them into space.")

COMIC_1500 = info(1500, "Weather", "2012", "7", "27",
                  "This is a local weather forecast.",
                  transcript="[[A man is sitting in a chair reading a newspaper.]]\n"
                             "MAN: This is a local weather forecast.")

COMIC_1600 = info(1600, "Tour de France", "2014", "1", "6",
                  "What are these French guys doing?",
                  transcript="[[Two cyclists are racing down a road.]]\nCYCLIST: The peloton!")

COMIC_1601 = info(1601, "Duty", "2014", "1", "8", "I have to report for duty.")


class FakeFeeds:
    def __init__(self, latest=None, comics=None, fail=False):
        self.calls: list[str] = []
        self.latest = latest if latest is not None else LATEST
        #: Every comic number the fake knows about, and what it answers with.
        self.comics = comics if comics is not None else {
            3000: COMIC_3000, 1500: COMIC_1500, 1600: COMIC_1600, 1601: COMIC_1601,
            1602: info(1602, "Gardening", "2014", "1", "10", "I am growing potatoes."),
            2998: info(2998, "Old Comic", "2024", "10", "16", "An old joke about a duck."),
            3301: info(3301, "Prior", "2026", "9", "24", "A comic about a prior."),
            3302: info(3302, "Pylon", "2026", "9", "25", "A comic about a pylon."),
            3303: info(3303, "Slab Graveyard", "2026", "9", "26",
                       "It's ok if you want to close close your eyes for the slab graveyard!"),
        }
        self.fail = fail

    def __call__(self, url: str):
        self.calls.append(url)
        if self.fail:
            raise ComicsError("xkcd is unreachable")
        if url == "https://xkcd.com/info.0.json":
            #: The latest-comic URL has no number in it; every other one does.
            return json.dumps(self.latest)
        number = int(url.rstrip("/").split("/")[-2])
        if number not in self.comics:
            return json.dumps({"message": "Not Found", "status": 404})
        return json.dumps(self.comics[number])


def make_data(**kw):
    feed = FakeFeeds(**kw)
    return ComicsData(fetch=feed), feed


class HelperTests(unittest.TestCase):
    def test_a_comic_number_in_the_three_ways_it_is_written(self):
        self.assertEqual(number_from_text("tell me about xkcd 3000"), 3000)
        self.assertEqual(number_from_text("comic #1500"), 1500)
        self.assertEqual(number_from_text("comic number 1601 please"), 1601)
        self.assertIsNone(number_from_text("show me the latest xkcd"))
        #: Six digits is not a comic number, and must not be truncated to one.
        self.assertIsNone(number_from_text("what is comic 999999"))

    def test_a_range_and_a_count(self):
        self.assertEqual(range_from_text("what is comic 2998-3002 about?"), (2998, 3002))
        self.assertEqual(range_from_text("comics 2900 through 2910"), (2900, 2910))
        self.assertIsNone(range_from_text("comics 3002-2998"))
        #: A run of a thousand is not a run, and asking for it is refused rather than paged.
        self.assertIsNone(range_from_text("comics 1-1000"))
        self.assertEqual(count_from_text("show me the last 5 comics"), 5)
        self.assertIsNone(count_from_text("the last 900 comics"))


class ReadTests(unittest.TestCase):
    def test_the_latest_comic(self):
        data, feed = make_data()
        comic = data.latest()
        self.assertEqual(comic["num"], 3303)
        self.assertEqual(comic["title"], "Slab Graveyard")
        self.assertEqual(comic["date"], "2026-09-26")
        self.assertIn("slab graveyard", comic["alt"])
        self.assertEqual(feed.calls, ["https://xkcd.com/info.0.json"])

    def test_one_comic_by_number(self):
        data, feed = make_data()
        comic = data.comic(3000)
        self.assertEqual(comic["title"], "Experimental Astrophysics")
        self.assertEqual(comic["date"], "2024-10-18")
        self.assertEqual(feed.calls, ["https://xkcd.com/3000/info.0.json"])
        self.assertEqual(comic["link"], "https://xkcd.com/3000/")

    def test_a_transcript_is_only_there_when_xkcd_published_one(self):
        data, _feed = make_data()
        self.assertIn("The peloton!", data.comic(1600)["transcript"])
        #: Comic 3000 has an alt text and no transcript, and the reader must be told so.
        self.assertIsNone(data.comic(3000)["transcript"])
        self.assertIsNotNone(data.comic(3000)["alt"])

    def test_a_run_of_comics_is_oldest_first(self):
        data, _feed = make_data()
        comics = data.run(1600, 1602)
        self.assertEqual([comic["num"] for comic in comics], [1600, 1601, 1602])
        with self.assertRaises(ValueError):
            data.run(1602, 1600)
        with self.assertRaises(ValueError):
            data.run(1, 40)

    def test_a_number_outside_the_range_and_a_comic_that_does_not_exist(self):
        data, _feed = make_data()
        with self.assertRaises(ValueError):
            data.comic(0)
        with self.assertRaises(ValueError):
            data.comic(999999)
        with self.assertRaises(ComicsNotFound):
            data.comic(1610)
        data, _feed = make_data(fail=True)
        with self.assertRaises(ComicsError):
            data.latest()


class RouteTests(unittest.TestCase):
    def test_latest_by_number_and_a_run(self):
        self.assertEqual(route("show me the latest xkcd"), ("comics-latest", {}))
        self.assertEqual(route("tell me about xkcd 3000"),
                         ("comics-by-number", {"num": 3000}))
        self.assertEqual(route("show me the last 5 comics"), ("comics-run", {"count": 5}))
        self.assertEqual(route("what is comic 2998-3002 about?"),
                         ("comics-run", {"from": 2998, "to": 3002}))


    def test_a_single_number_is_not_a_run_of_comics(self):
        #: One comic cannot have a recurring word, so a window would have to be invented.
        self.assertEqual(route("xkcd 3000 running gag")[0], "help")
        self.assertEqual(route("what is comic 999999")[0], "help")

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
        from agent import ComicsAgent

        agent_conn, client_conn = connected_pair()
        data, feed = make_data(**kw)
        agent = ComicsAgent(agent_conn, data)
        threading.Thread(target=agent_conn.serve, daemon=True).start()
        client = AcpClient(connection=client_conn, permission=permission)
        client.start()
        client.initialize()
        session_id = client.new_session(cwd="/tmp")
        try:
            return client.prompt(text, session_id), client, feed
        finally:
            client.stop()

    def test_the_latest_comic_answer(self):
        result, client, _ = self.turn("show me the latest xkcd")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertEqual(len(client.permission_requests), 1)
        self.assertIn("xkcd latest 3303 - Slab Graveyard", result["text"])
        self.assertIn("published: 2026-09-26", result["text"])
        self.assertIn("alt text: It's ok if you want to close close your eyes", result["text"])
        self.assertIn("transcript: xkcd publishes none for this comic", result["text"])

    def test_a_comic_with_a_transcript_says_so(self):
        result, _, _ = self.turn("tell me about comic 1600")
        self.assertIn("xkcd 1600 - Tour de France", result["text"])
        self.assertIn("transcript opens: [[Two cyclists are racing down a road.]]",
                      result["text"])

    def test_a_run_answer(self):
        result, _, _ = self.turn("show me the last 3 comics")
        self.assertIn("3 comic(s), 3301 to 3303", result["text"])

    def test_help_asks_nothing(self):
        result, client, feed = self.turn("what can you do?")
        self.assertIn("xkcd", result["text"])
        self.assertEqual(client.permission_requests, [])
        self.assertEqual(feed.calls, [])

    def test_permission_denied_and_a_dead_api(self):
        result, _, _ = self.turn("show me the latest xkcd", permission="reject")
        self.assertEqual(result["stopReason"], STOP_REFUSAL)
        result, _, _ = self.turn("show me the latest xkcd", fail=True)
        self.assertIn("I could not read xkcd's API", result["text"])


# ---------------------------------------------------------------------------
#
# ---------------------------------------------------------------------------

#: What `comics_recurring_terms` answers over comics 100-111, all with transcripts.
RECURRING_DATA = {
    "from": 100,
    "to": 111,
    "requestedRange": {"from": 100, "to": 111, "count": 12},
    "comicsRead": 12,
    "comicsWithTranscript": 12,
    "comicsWithAltTextOnly": 0,
    "countedFrom": "transcript",
    "truncated": False,
    "cap": 12,
    "termsFound": 2,
    "terms": [
        {"word": "duck", "comics": 4, "numbers": [101, 104, 107, 110]},
        {"word": "flag", "comics": 2, "numbers": [104, 109]},
    ],
    "source": "xkcd (xkcd.com/info.0.json)",
}

#: A range past the newest comic: the gateway reports the cap rather than reading 4000.
TRUNCATED_DATA = dict(RECURRING_DATA, **{
    "from": 2900, "to": 2911, "requestedRange": {"from": 2900, "to": 2911, "count": 12},
    "comicsRead": 12, "comicsWithTranscript": 0, "comicsWithAltTextOnly": 12,
    "countedFrom": "alt text", "truncated": True,
    "termsFound": 1, "terms": [{"word": "brain", "comics": 3, "numbers": [2900, 2905, 2911]}],
})

#: The exact refusal the gateway sends for a key it will not accept.






if __name__ == "__main__":
    unittest.main(verbosity=2)
