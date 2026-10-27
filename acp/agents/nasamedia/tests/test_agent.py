"""Tests for the nasamedia agent: search, collections, one item, routing and turns.

    python3 agents/nasamedia/tests/test_agent.py

No network: the JSON is injected, shaped like the live payloads read on 2026-09-28
(search 'apollo 11' as image -> 1522 total_hits, 100 items on page 1, first item
jsc2007e034221 'Apollo 11 spacecraft pre-launch' 1969-07-11 centre JSC; the asset
endpoint for that id returns 6 hrefs).
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

from agent import group_by_collection, media_type_from_text, route  # noqa: E402
from data import (NasaMediaData, NasaMediaError, NasaMediaNotFound,  # noqa: E402
                  decade_of, normalise_media_type)

ITEM = {
    "nasa_id": "jsc2007e034221",
    "title": "Apollo 11 spacecraft pre-launch",
    "date_created": "1969-07-11T00:00:00Z",
    "center": "JSC",
    "media_type": "image",
    "album": ["KSC_50th_Anniversary"],
    "keywords": ["Apollo", "Apollo 11", "Launch"],
    "description": "Personnel atop the 402-ft. Mobile Service Structure look back at the "
                   "Apollo 11 spacecraft as the tower is moved away.",
}

SECOND_ITEM = {
    "nasa_id": "jsc2007e034999",
    "title": "Apollo 11 crew during a centrifuge test",
    "date_created": "1969-04-01T00:00:00Z",
    "center": "JSC",
    "media_type": "image",
    "album": ["Apollo 11", "KSC_50th_Anniversary"],
    "keywords": ["Apollo 11"],
    "description": None,
}

#: An item with no date at all - NASA does send these, and a decade cannot be made of it.
UNDATED_ITEM = {
    "nasa_id": "jsc00000000001",
    "title": "Undated training image",
    "date_created": None,
    "center": "JSC",
    "media_type": "video",
    "album": [],
    "keywords": [],
    "description": None,
}

SEARCH = {"collection": {"version": "1.1", "metadata": {"total_hits": 1522}, "items": [
    {"href": "https://images-assets.nasa.gov/image/jsc2007e034221/collection.json",
     "data": [ITEM],
     "links": [
         {"href": "https://images-assets.nasa.gov/image/jsc2007e034221/"
                  "jsc2007e034221~orig.jpg", "rel": "canonical", "render": "image",
          "width": 2341, "height": 3072, "size": 1402000},
         {"href": "https://images-assets.nasa.gov/image/jsc2007e034221/"
                  "jsc2007e034221~thumb.jpg", "rel": "preview", "render": "image",
          "width": 487, "height": 640, "size": 60000},
     ]},
    {"href": "https://images-assets.nasa.gov/video/jsc2007e034999/collection.json",
     "data": [SECOND_ITEM],
     "links": [{"href": "https://images-assets.nasa.gov/video/jsc2007e034999/"
                         "jsc2007e034999~orig.mp4", "rel": "canonical", "render": "video",
                "size": 42000000}]},
    {"href": "https://images-assets.nasa.gov/video/jsc00000000001/collection.json",
     "data": [UNDATED_ITEM],
     "links": []},
]}}

ASSET = {"collection": {"version": "1.1", "items": [
    {"href": "http://images-assets.nasa.gov/image/jsc2007e034221/jsc2007e034221~orig.jpg"},
    {"href": "http://images-assets.nasa.gov/image/jsc2007e034221/jsc2007e034221~large.jpg"},
    {"href": "http://images-assets.nasa.gov/image/jsc2007e034221/jsc2007e034221~medium.jpg"},
    {"href": "http://images-assets.nasa.gov/image/jsc2007e034221/jsc2007e034221~small.jpg"},
    {"href": "http://images-assets.nasa.gov/image/jsc2007e034221/jsc2007e034221~thumb.jpg"},
    {"href": "http://images-assets.nasa.gov/image/jsc2007e034221/metadata.json"},
]}}


class FakeLibrary:
    def __init__(self, search=None, asset=None, empty=False, fail=False):
        self.calls: list[str] = []
        self.params: list[dict] = []
        self.search = SEARCH if search is None else search
        self.asset = ASSET if asset is None else asset
        self.empty = empty
        self.fail = fail

    def __call__(self, url: str, params: dict):
        self.calls.append(url)
        self.params.append(dict(params or {}))
        if self.fail:
            raise NasaMediaError("the NASA library is unreachable")
        if self.empty:
            return json.dumps({"collection": {"items": []}})
        if "/asset/" in url:
            return json.dumps(self.asset)
        return json.dumps(self.search)


def make_data(**kw):
    library = FakeLibrary(**kw)
    return NasaMediaData(fetch=library), library


class HelperTests(unittest.TestCase):
    def test_a_media_type_the_library_actually_holds(self):
        self.assertEqual(normalise_media_type("image"), "image")
        self.assertEqual(media_type_from_text("find me pictures of the apollo 11 landing"), "image")
        self.assertEqual(media_type_from_text("show me video of the mars landing"), "video")
        self.assertIsNone(media_type_from_text("find me apollo 11 landing"))
        #: The library holds image/video/audio. A type it does not hold is an error, not
        #: a silent fallback to everything.
        with self.assertRaises(ValueError):
            normalise_media_type("hologram")

    def test_a_decade_needs_a_year(self):
        self.assertEqual(decade_of("1969-07-11T00:00:00Z"), 1960)
        self.assertEqual(decade_of("2021-01-01"), 2020)
        self.assertIsNone(decade_of(None))
        self.assertIsNone(decade_of("not a date"))

    def test_collections_are_counted_from_the_album_field(self):
        rows = [{"album": ["A", "B"]}, {"album": ["B"]}, {"album": []}]
        self.assertEqual(group_by_collection(rows), [("B", 2), ("A", 1)])


class ReadTests(unittest.TestCase):
    def test_a_search_page(self):
        data, library = make_data()
        result = data.search("apollo 11", media_type="image")
        self.assertEqual(result["total_hits"], 1522)
        self.assertEqual(result["returned"], 3)
        self.assertEqual(result["page_size"], 100)
        self.assertTrue(result["more_pages"])
        self.assertEqual(result["items"][0]["nasa_id"], "jsc2007e034221")
        self.assertEqual(result["items"][0]["date_created"], "1969-07-11")
        self.assertEqual(result["items"][0]["decade"], 1960)
        self.assertEqual(library.params[-1], {"q": "apollo 11", "media_type": "image"})

    def test_a_search_strips_the_preview_thumbnail_and_sorts_by_size(self):
        data, _library = make_data()
        assets = data.search("apollo 11", media_type="image")["items"][0]["assets"]
        self.assertEqual([row["rel"] for row in assets], ["canonical"])
        self.assertEqual(assets[0]["width"], 2341)
        self.assertNotIn("thumb", assets[0]["href"])

    def test_an_undated_item_reports_no_decade_rather_than_guessing_one(self):
        data, _library = make_data()
        row = data.search("apollo 11")["items"][2]
        self.assertIsNone(row["decade"])
        self.assertIsNone(row["date_created"])

    def test_one_item_and_its_files(self):
        data, library = make_data()
        row = data.entry("jsc2007e034221")
        self.assertEqual(row["title"], "Apollo 11 spacecraft pre-launch")
        self.assertEqual(len(row["files"]), 6)
        self.assertIn("metadata.json", row["files"][-1]["href"])
        self.assertTrue(any("/asset/" in call for call in library.calls))

    def test_nothing_found_is_not_a_failure(self):
        data, _library = make_data(empty=True)
        with self.assertRaises(NasaMediaNotFound):
            data.search("kryptonite")
        with self.assertRaises(ValueError):
            data.search("   ")
        with self.assertRaises(ValueError):
            data.entry("")

    def test_a_dead_library(self):
        data, _library = make_data(fail=True)
        with self.assertRaises(NasaMediaError):
            data.search("apollo 11")


class RouteTests(unittest.TestCase):
    def test_a_plain_search(self):
        skill, params = route("find NASA images of the Apollo 11 landing")
        self.assertEqual(skill, "nasamedia-search")
        self.assertEqual(params["query"], "apollo 11 landing")
        self.assertEqual(params["media_type"], "image")

    def test_a_collection_question(self):
        self.assertEqual(route("what media is in collection Apollo 11")[0],
                         "nasamedia-collection")
        self.assertEqual(route("what is in the Apollo 11 album?")[0],
                         "nasamedia-collection")

    def test_an_item_id(self):
        self.assertEqual(route("show me item jsc2007e034221"),
                         ("nasamedia-item", {"nasa_id": "jsc2007e034221"}))

    def test_a_year_filter(self):
        _skill, params = route("show me images of the apollo 11 landing in 1969")
        self.assertEqual(params["year_start"], 1969)
        self.assertEqual(params["year_end"], 1969)
        _skill, params = route("apollo 11 images between 1967 and 1970")
        self.assertEqual(params["year_start"], 1967)
        self.assertEqual(params["year_end"], 1970)

    def test_help_and_nonsense(self):
        self.assertEqual(route("")[0], "help")
        self.assertEqual(route("what can you do?")[0], "help")
        self.assertEqual(route("what is the weather in Kansas?")[0], "help")


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
        from agent import NasaMediaAgent

        agent_conn, client_conn = connected_pair()
        data, library = make_data(**kw)
        agent = NasaMediaAgent(agent_conn, data)
        threading.Thread(target=agent_conn.serve, daemon=True).start()
        client = AcpClient(connection=client_conn, permission=permission)
        client.start()
        client.initialize()
        session_id = client.new_session(cwd="/tmp")
        try:
            return client.prompt(text, session_id), client, library
        finally:
            client.stop()

    def test_a_free_search_returns_real_items(self):
        result, client, _ = self.turn("find NASA images of the Apollo 11 landing")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertEqual(len(client.permission_requests), 1)
        self.assertIn("3 item(s) as image matching 'apollo 11 landing'", result["text"])
        self.assertIn("the library reports 1522 hit(s) in total", result["text"])
        self.assertIn("(more pages exist)", result["text"])
        self.assertIn("Apollo 11 spacecraft pre-launch  [jsc2007e034221]", result["text"])
        self.assertIn("jsc2007e034221~orig.jpg", result["text"])

    def test_a_long_page_is_capped_so_one_search_stays_readable(self):
        result, _, _ = self.turn("show me top 2 images of the apollo 11 landing")
        self.assertIn("showing the first 2 of the 3 on this page", result["text"])

    def test_a_collection_answer_groups_by_album(self):
        result, _, _ = self.turn("what media is in collection Apollo 11")
        self.assertIn("no collection endpoint", result["text"])
        self.assertIn("KSC_50th_Anniversary: 2 of these 3 item(s)", result["text"])
        self.assertIn("an item can sit in more than one collection", result["text"])

    def test_an_item_answer_lists_its_files(self):
        result, _, _ = self.turn("show me item jsc2007e034221")
        self.assertIn("Apollo 11 spacecraft pre-launch  [jsc2007e034221]", result["text"])
        self.assertIn("1969-07-11 | centre JSC | image", result["text"])
        self.assertIn("metadata.json", result["text"])

    def test_help_asks_nothing(self):
        result, client, library = self.turn("what can you do?")
        self.assertIn("NASA's image, video and audio library", result["text"])
        self.assertEqual(client.permission_requests, [])
        self.assertEqual(library.calls, [])

    def test_permission_denied(self):
        result, _, _ = self.turn("find NASA images of the Apollo 11 landing", permission="reject")
        self.assertEqual(result["stopReason"], STOP_REFUSAL)

    def test_a_dead_library(self):
        result, _, _ = self.turn("find NASA images of the Apollo 11 landing", fail=True)
        self.assertIn("I could not read NASA's image library", result["text"])


# ---------------------------------------------------------------------------
#
# ---------------------------------------------------------------------------

#: What `nasamedia_coverage_board` answers for 'apollo 11' read over 2 pages.
COVERAGE_DATA = {
    "query": "apollo 11",
    "media_type": "image",
    "total_hits": 1522,
    "pages_read": 2,
    "items_read": 200,
    "sampled": True,
    "counts": {"image": 198, "video": 2},
    "by_decade": {"1960": 12, "1970": 3},
    "by_center": {"JSC": 150, "KSC": 40, "HQ": 10},
    "top_keywords": ["Apollo 11", "Apollo", "Launch", "Lunar"],
    "source": "NASA Image and Video Library (images-api.nasa.gov)",
}

#: The exact refusal the gateway sends for a key it will not accept.






if __name__ == "__main__":
    unittest.main(verbosity=2)
