"""Tests for the music agent: search, artists, albums, the chart, routing and turns.

    python3 agents/music/tests/test_agent.py

No network: the JSON is injected, shaped like the live payloads read on 2026-09-28
(`/search?q=creep` -> 'Creep' id 138547415, 238 s = 3:58, rank 978547, with a 30 s preview;
`/search/artist?q=radiohead` -> id 399 'Radiohead' with 45 albums and 4097098 fans,
listed ahead of a 64-fan namesake; `/album/302127` -> 'Discovery', 2001-03-07, 14 tracks).
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

from acp_kit import (AcpClient, Connection, GatewayClient,  # noqa: E402
                     STOP_END_TURN, STOP_REFUSAL)

from agent import route  # noqa: E402
from data import (MusicData, MusicError, MusicNotFound,  # noqa: E402
                  is_alternate_version, query_from_text)

PREVIEW = "https://cdnt-preview.dzcdn.net/api/1/1/9/c/0/b9c4.mp3"

SEARCH = {"data": [
    {"id": 138547415, "title": "Creep", "title_short": "Creep", "duration": 238,
     "rank": 978547, "explicit_lyrics": True,
     "preview": PREVIEW, "link": "https://www.deezer.com/track/138547415",
     "artist": {"id": 399, "name": "Radiohead"},
     "album": {"id": 38115, "title": "Pablo Honey"}},
    {"id": 1, "title": "Creep (Remastered 2011)", "duration": 238, "rank": 400000,
     "explicit_lyrics": False, "preview": None, "link": "https://www.deezer.com/track/1",
     "artist": {"id": 399, "name": "Radiohead"},
     "album": {"id": 38115, "title": "Pablo Honey"}},
]}

#: The exact-name artist is listed second, behind a 64-fan namesake.
ARTIST_SEARCH = {"data": [
    {"id": 53477202, "name": "DJ Radiohead", "nb_album": 30, "nb_fan": 64,
     "link": "https://www.deezer.com/artist/53477202"},
    {"id": 399, "name": "Radiohead", "nb_album": 45, "nb_fan": 4097098,
     "picture_medium": "https://api.deezer.com/artist/399/image.jpg",
     "link": "https://www.deezer.com/artist/399"},
]}

TOP = {"data": [
    {"id": 3135556, "title": "Harder, Better, Faster, Stronger", "duration": 226,
     "rank": 810329, "explicit_lyrics": False, "preview": PREVIEW,
     "link": "https://www.deezer.com/track/3135556",
     "artist": {"id": 399, "name": "Radiohead"},
     "album": {"id": 9413, "title": "OK Computer"}},
    {"id": 2, "title": "Weird Fishes / Arpeggi", "duration": 300, "rank": 700000,
     "explicit_lyrics": False, "preview": None, "link": "https://www.deezer.com/track/2",
     "artist": {"id": 399, "name": "Radiohead"},
     "album": {"id": 9413, "title": "OK Computer"}},
]}

ALBUMS = {"data": [
    {"id": 14880741, "title": "Kid A", "release_date": "2000-10-02", "fans": 90708,
     "cover_medium": "https://api.deezer.com/album/14880741/cover.jpg",
     "link": "https://www.deezer.com/album/14880741",
     "artist": {"id": 399, "name": "Radiohead"}},
    {"id": 302127, "title": "Amnesiac", "release_date": "2001-05-01", "fans": 61000,
     "cover_medium": None, "link": "https://www.deezer.com/album/302127",
     "artist": {"id": 399, "name": "Radiohead"}},
]}

#: "Kid" is an album of its own, and it outranks nothing: the most-followed match wins.
ALBUM_SEARCH = {"data": [
    {"id": 47476942, "title": "Kid", "release_date": "2017-10-06", "fans": 35930,
     "cover_medium": None, "link": "https://www.deezer.com/album/47476942",
     "artist": {"id": 99001, "name": "Eddy de Pretto"}},
    {"id": 14880741, "title": "Kid A", "release_date": "2000-10-02", "fans": 90708,
     "cover_medium": "https://api.deezer.com/album/14880741/cover.jpg",
     "link": "https://www.deezer.com/album/14880741",
     "artist": {"id": 399, "name": "Radiohead"}},
]}

ALBUM_DETAIL = {
    "id": 14880741, "title": "Kid A", "release_date": "2000-10-02", "nb_tracks": 11,
    "fans": 90708, "explicit_lyrics": False, "cover_medium": "https://cover.jpg",
    "link": "https://www.deezer.com/album/14880741",
    "artist": {"id": 399, "name": "Radiohead"},
    "tracks": {"data": [
        {"id": 10, "title": "Everything In Its Right Place", "duration": 251, "rank": 620000,
         "explicit_lyrics": False, "preview": PREVIEW, "link": "https://www.deezer.com/track/10",
         "artist": {"id": 399, "name": "Radiohead"},
         "album": {"id": 14880741, "title": "Kid A"}},
        {"id": 11, "title": "Idioteque", "duration": 156, "rank": 590000,
         "explicit_lyrics": False, "preview": None, "link": "https://www.deezer.com/track/11",
         "artist": {"id": 399, "name": "Radiohead"},
         "album": {"id": 14880741, "title": "Kid A"}},
    ]},
}

CHART = {"data": [
    {"id": 100, "title": "Dracula (with JENNIE)", "duration": 190, "rank": 982905,
     "explicit_lyrics": False, "preview": PREVIEW, "link": "https://www.deezer.com/track/100",
     "artist": {"id": 1, "name": "Tame Impala"},
     "album": {"id": 1, "title": "Dracula"}},
    {"id": 101, "title": "Boston", "duration": 165, "rank": 873262,
     "explicit_lyrics": False, "preview": None, "link": "https://www.deezer.com/track/101",
     "artist": {"id": 2, "name": "STELLA LEFTY"},
     "album": {"id": 2, "title": "Boston"}},
]}


class FakeFeeds:
    def __init__(self, search=None, artist=None, top=None, albums=None, album=None,
                 album_search=None, detail=None, chart=None, empty=False, fail=False):
        self.calls: list[str] = []
        self.search = search if search is not None else SEARCH
        self.artist = artist if artist is not None else ARTIST_SEARCH
        self.top = top if top is not None else TOP
        self.albums = albums if albums is not None else ALBUMS
        self.album_search = album_search if album_search is not None else ALBUM_SEARCH
        self.detail = detail if detail is not None else ALBUM_DETAIL
        self.chart = chart if chart is not None else CHART
        self.empty = empty
        self.fail = fail

    def __call__(self, url: str):
        self.calls.append(url)
        if self.fail:
            raise MusicError("Deezer is unreachable")
        if self.empty:
            return json.dumps({"data": []})
        if "search/artist" in url:
            return json.dumps(self.artist)
        if "search/album" in url:
            return json.dumps(self.album_search)
        if "/search?" in url:
            return json.dumps(self.search)
        if "/artist/" in url and "/top" in url:
            return json.dumps(self.top)
        if "/artist/" in url and "/albums" in url:
            return json.dumps(self.albums)
        if "/album/" in url:
            return json.dumps(self.detail)
        if "/chart/" in url:
            return json.dumps(self.chart)
        raise MusicError(f"unexpected url in test: {url}")


def make_data(**kw):
    feed = FakeFeeds(**kw)
    return MusicData(fetch=feed), feed


class HelperTests(unittest.TestCase):
    def test_an_artist_name_is_pulled_out_of_a_question(self):
        self.assertEqual(query_from_text("find songs by Radiohead"), "Radiohead")
        self.assertEqual(query_from_text("songs from Back in Black"), "Back in Black")
        self.assertEqual(query_from_text("search creep"), "creep")
        self.assertEqual(query_from_text("what is charting?"), "charting")

    def test_an_alternate_version_is_told_from_the_recording(self):
        self.assertTrue(is_alternate_version("Creep (Remastered 2011)"))
        self.assertTrue(is_alternate_version("Nude - Live at Wembley"))
        self.assertTrue(is_alternate_version("Idioteque (Radio Edit)"))
        self.assertFalse(is_alternate_version("Creep"))
        self.assertFalse(is_alternate_version("Everything In Its Right Place"))


class ReadTests(unittest.TestCase):
    def test_a_track_carries_its_runtime_rank_and_preview(self):
        data, _feed = make_data()
        tracks = data.search("creep", limit=2)
        first = tracks[0]
        self.assertEqual(first["title"], "Creep")
        #: 238 seconds is 3:58 - the raw seconds are never printed at a reader.
        self.assertEqual(first["length"], "3:58")
        self.assertEqual(first["rank"], 978547)
        self.assertTrue(first["explicit"])
        self.assertEqual(first["preview"], PREVIEW)
        self.assertEqual(first["album"], "Pablo Honey")

    def test_the_exact_artist_name_beats_the_namesake(self):
        data, feed = make_data()
        artist = data.artist("radiohead")
        self.assertEqual(artist["name"], "Radiohead")
        self.assertEqual(artist["id"], 399)
        self.assertEqual(artist["fans"], 4097098)
        self.assertIn("search/artist?q=radiohead", feed.calls[0])

    def test_an_artist_with_no_exact_name_falls_back_to_the_most_followed(self):
        data, _feed = make_data()
        self.assertEqual(data.artist("radiohea")["name"], "Radiohead")

    def test_top_tracks_and_albums(self):
        data, feed = make_data()
        artist = data.artist("Radiohead")
        top = data.top_tracks(artist["id"], limit=2)
        self.assertEqual([row["title"] for row in top],
                         ["Harder, Better, Faster, Stronger", "Weird Fishes / Arpeggi"])
        albums = data.albums(artist["id"])
        self.assertEqual(albums[0]["title"], "Kid A")
        self.assertIn("/artist/399/top?limit=2", feed.calls[-2])
        self.assertIn("/artist/399/albums?limit=25", feed.calls[-1])

    def test_the_most_followed_album_wins_because_titles_repeat(self):
        data, feed = make_data()
        album = data.album("Kid")
        #: "Kid" by Eddy de Pretto matches the title exactly and has 35930 fans; "Kid A" has
        #: 90708. The reader asked for Kid A, and the fan count is the honest tie-break.
        self.assertEqual(album["title"], "Kid A")
        self.assertEqual(album["track_count"], 11)
        self.assertEqual(len(album["tracks"]), 2)
        self.assertEqual(album["tracks"][0]["length"], "4:11")
        self.assertIn("/album/14880741", feed.calls[-1])

    def test_the_chart_keeps_deezers_order(self):
        data, _feed = make_data()
        chart = data.chart(limit=2)
        self.assertEqual([row["title"] for row in chart],
                         ["Dracula (with JENNIE)", "Boston"])
        self.assertEqual(chart[0]["rank"], 982905)

    def test_nothing_found_and_a_dead_api(self):
        data, _feed = make_data(empty=True)
        with self.assertRaises(MusicNotFound):
            data.search("creep")
        data, _feed = make_data(fail=True)
        with self.assertRaises(MusicError):
            data.artist("Radiohead")
        data, _feed = make_data()
        with self.assertRaises(ValueError):
            data.artist("   ")


class RouteTests(unittest.TestCase):
    def test_a_search_an_artist_and_an_album(self):
        self.assertEqual(route("find songs by Radiohead"),
                         ("music-search", {"query": "Radiohead"}))
        self.assertEqual(route("tell me about Radiohead"),
                         ("music-artist", {"query": "Radiohead"}))
        self.assertEqual(route("what is on Kid A?"), ("music-album", {"query": "Kid"}))
        self.assertEqual(route("what is the album Jaguar II"),
                         ("music-album", {"query": "Jaguar II"}))

    def test_the_chart(self):
        self.assertEqual(route("what is charting on Deezer?"), ("music-chart", {}))
        self.assertEqual(route("deezer chart"), ("music-chart", {}))

    def test_a_set_request_goes_to_the_premium_skill(self):
        self.assertEqual(route("build me a 45 minute Radiohead set"),
                         ("music-set", {"artist": "Radiohead", "max_minutes": 45}))
        self.assertEqual(route("make me a 1 hour clean Radiohead playlist"),
                         ("music-set", {"artist": "Radiohead", "max_minutes": 60,
                                        "allow_explicit": False}))

    def test_help_and_another_subject(self):
        self.assertEqual(route("")[0], "help")
        self.assertEqual(route("what can you do?")[0], "help")
        self.assertEqual(route("what is the next episode of severance?")[0], "help")


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
        from agent import MusicAgent

        agent_conn, client_conn = connected_pair()
        data, feed = make_data(**kw)
        agent = MusicAgent(agent_conn, data)
        threading.Thread(target=agent_conn.serve, daemon=True).start()
        client = AcpClient(connection=client_conn, permission=permission)
        client.start()
        client.initialize()
        session_id = client.new_session(cwd="/tmp")
        try:
            return client.prompt(text, session_id), client, feed
        finally:
            client.stop()

    def test_a_search_answer_with_previews(self):
        result, client, _ = self.turn("find songs by Radiohead")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertEqual(len(client.permission_requests), 1)
        self.assertIn("1. Creep - Radiohead [Pablo Honey]  (3:58, popularity 978547, explicit)",
                      result["text"])
        self.assertIn(f"30s preview: {PREVIEW}", result["text"])
        self.assertIn("2. Creep (Remastered 2011)", result["text"])

    def test_an_artist_answer(self):
        result, _, _ = self.turn("tell me about Radiohead")
        self.assertIn("Radiohead on Deezer", result["text"])
        self.assertIn("45 album(s), 4097098 follower(s)", result["text"])
        self.assertIn("Most played (2 of Deezer's top tracks)", result["text"])
        self.assertIn("albums, newest first: Kid A (2000-10-02)", result["text"])
        #: The rank is a popularity score, and the answer has to say so.
        self.assertIn("only means something beside another track's", result["text"])

    def test_an_album_answer_uses_the_most_followed_match(self):
        result, _, _ = self.turn("what is on Kid A?")
        self.assertIn("Kid A - Radiohead", result["text"])
        self.assertIn("released 2000-10-02, 11 track(s), 90708 fan(s)", result["text"])
        self.assertIn("1. Everything In Its Right Place  (4:11", result["text"])
        self.assertIn("2. Idioteque  (2:36, popularity 590000)", result["text"])

    def test_the_chart_answer(self):
        result, _, _ = self.turn("what is charting on Deezer?")
        self.assertIn("Deezer's chart, top 2 right now", result["text"])
        self.assertIn("1. Dracula (with JENNIE) - Tame Impala", result["text"])

    def test_help_asks_nothing(self):
        result, client, feed = self.turn("what can you do?")
        self.assertIn("Deezer", result["text"])
        self.assertEqual(client.permission_requests, [])
        self.assertEqual(feed.calls, [])

    def test_permission_denied_and_a_dead_api(self):
        result, _, _ = self.turn("tell me about Radiohead", permission="reject")
        self.assertEqual(result["stopReason"], STOP_REFUSAL)
        result, _, _ = self.turn("tell me about Radiohead", fail=True)
        self.assertIn("I could not read Deezer's catalogue", result["text"])


# ---------------------------------------------------------------------------
# The premium skill: music-set
#
# No network: the licence check and the work both happen on the gateway, and the
# gateway's own JSON-RPC answers are injected into the real GatewayClient.
# ---------------------------------------------------------------------------

#: What `music_listening_set` answers for a 45-minute clean Radiohead set.
SET_DATA = {
    "artist": "Radiohead",
    "artistId": 399,
    "fanBase": 4097098,
    "tracksConsidered": 100,
    "setSize": 10,
    "setMinutes": 44.4,
    "requestedMinutes": 45,
    "tracks": [
        {"title": "Harder, Better, Faster, Stronger", "seconds": 226, "minutes": 3.8,
         "popularityPermille": 810, "album": "OK Computer"},
        {"title": "Weird Fishes / Arpeggi", "seconds": 300, "minutes": 5.0,
         "popularityPermille": 700, "album": "OK Computer"},
    ],
    "skipped": [
        {"title": "Creep (Remastered 2011)", "seconds": 238, "minutes": 4.0,
         "popularityPermille": 400, "album": "Pablo Honey",
         "reason": "live, remix, remaster or other alternate version"},
        {"title": "Nude - Live at Wembley", "seconds": 260, "minutes": 4.3,
         "popularityPermille": 300, "album": "OK Computer NOT",
         "reason": "live, remix, remaster or other alternate version"},
    ],
    "source": "Deezer (api.deezer.com)",
}

#: The exact refusal the gateway sends for a key it will not accept.
GATEWAY_DENIAL = ("`music_listening_set` is a premium tool, but that licence key was rejected. "
                  "Check MCP_LICENSE_KEY, or get a key at https://polar.sh/mrfentmen")


def gateway_answer(text, is_error=False, structured=None):
    """A fake transport that answers every premium call with one JSON-RPC reply."""
    def fetch(url, payload, headers):
        fetch.calls.append({"url": url, "payload": payload, "headers": headers})
        result = {"content": [{"type": "text", "text": text}]}
        if is_error:
            result["isError"] = True
        if structured is not None:
            result["structuredContent"] = structured
        return {"jsonrpc": "2.0", "id": payload.get("id", 1), "result": result}

    fetch.calls = []
    return fetch


class PremiumTests(unittest.TestCase):
    """No key, a bad key and a good key, plus the routing that gets there."""

    def turn(self, text: str, fetch, key: str, **kw):
        from agent import MusicAgent

        agent_conn, client_conn = connected_pair()
        data, _feed = make_data(**kw)
        gateway = GatewayClient(fetch=fetch, key=key, url="https://gateway.test/mcp")
        agent = MusicAgent(agent_conn, data, gateway=gateway)
        threading.Thread(target=agent_conn.serve, daemon=True).start()
        client = AcpClient(connection=client_conn, permission="allow-once")
        client.start()
        client.initialize()
        session_id = client.new_session(cwd="/tmp")
        try:
            return client.prompt(text, session_id), client
        finally:
            client.stop()

    def test_no_key_answers_with_the_missing_key_wording(self):
        fetch = gateway_answer("")
        result, client = self.turn("build me a 45 minute Radiohead set", fetch, "")
        #: An answer, not a crash, and not a failed lookup either.
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn("premium skill", result["text"])
        self.assertIn("MCP_LICENSE_KEY", result["text"])
        self.assertIn("no licence key is set", result["text"])
        self.assertEqual(len(client.permission_requests), 1)
        #: Nothing was spent on a call the gate was never going to let through.
        self.assertEqual(fetch.calls, [])

    def test_a_bad_key_returns_the_gateways_own_wording(self):
        fetch = gateway_answer(GATEWAY_DENIAL, is_error=True,
                               structured={"licenceRefusal": True, "reason": "denied"})
        result, _ = self.turn("build me a 45 minute Radiohead set", fetch, "not-a-real-key")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn(GATEWAY_DENIAL, result["text"])
        self.assertIn("premium", result["text"])
        self.assertEqual(len(fetch.calls), 1)
        self.assertEqual(fetch.calls[0]["payload"]["params"]["name"], "music_listening_set")

    def test_a_good_key_returns_the_built_set(self):
        fetch = gateway_answer(json.dumps(SET_DATA))
        result, _ = self.turn("build me a 45 minute Radiohead set", fetch, "k_paid")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn("Radiohead - listening set", result["text"])
        self.assertIn("10 track(s), 44.4 min of a 45 min budget", result["text"])
        self.assertIn("1. Harder, Better, Faster, Stronger [OK Computer]  (3.8 min)",
                      result["text"])
        self.assertIn("left out (2)", result["text"])
        self.assertIn("Creep (Remastered 2011) - live, remix, remaster or other "
                      "alternate version", result["text"])
        #: The licence key travels in a header and is never echoed back.
        self.assertEqual(fetch.calls[0]["headers"]["Authorization"], "Bearer k_paid")
        self.assertNotIn("k_paid", result["text"])

    def test_a_good_key_sends_the_budget_it_was_asked_for(self):
        fetch = gateway_answer(json.dumps(SET_DATA))
        self.turn("make me a 90 minute clean Radiohead playlist", fetch, "k_paid")
        arguments = fetch.calls[0]["payload"]["params"]["arguments"]
        self.assertEqual(arguments, {"artist": "Radiohead", "max_minutes": 90,
                                    "allow_explicit": False})

    def test_a_set_with_no_artist_asks_instead_of_inventing_one(self):
        fetch = gateway_answer(json.dumps(SET_DATA))
        result, _ = self.turn("give me a playlist for my drive", fetch, "k_paid")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn("Tell me which artist", result["text"])
        #: The gateway was never asked, so nothing was spent on a guess.
        self.assertEqual(fetch.calls, [])

    def test_a_dead_gateway_is_a_failed_lookup(self):
        def fetch(url, payload, headers):
            raise OSError("connection refused")

        result, _ = self.turn("build me a 45 minute Radiohead set", fetch, "k_paid")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn("I could not read Deezer's catalogue", result["text"])

    def test_the_routing_is_narrow(self):
        #: A free question keeps its own free skill even when it is about songs by an artist.
        free = [
            ("find songs by Radiohead", "music-search"),
            ("tell me about Radiohead", "music-artist"),
            ("what is on Kid A?", "music-album"),
            ("what is the album Jaguar II", "music-album"),
            ("what is charting on Deezer?", "music-chart"),
            ("songs from Back in Black", "music-search"),
            ("search creep", "music-search"),
            ("what can you do?", "help"),
            ("", "help"),
        ]
        for text, expected in free:
            self.assertEqual(route(text)[0], expected, text)

        premium = [
            "build me a 45 minute Radiohead set",
            "make me a Radiohead playlist",
            "queue up some Radiohead for my commute",
            "mix me something from Radiohead",
        ]
        for text in premium:
            self.assertEqual(route(text)[0], "music-set", text)

    def test_the_premium_skill_id_is_published(self):
        from agent import SKILLS

        self.assertIn("music-set", SKILLS)


if __name__ == "__main__":
    unittest.main(verbosity=2)
