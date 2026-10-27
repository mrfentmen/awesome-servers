"""Tests for the tv agent: shows, episode lists, the next episode, routing and turns.

    python3 agents/tv/tests/test_agent.py

No network: the JSON is injected, shaped like the live payloads read on 2026-09-28
(`/search/shows?q=severance` -> 'Severance' on Apple TV+, running since 2022-02-18, score
0.8896408; `/shows/2/episodes` -> 103 episodes carrying season, number, airdate, airstamp,
runtime and a rating).
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
from data import TvData, TvError, TvNotFound, season_from_text, show_query_from_text  # noqa: E402

SEVERANCE = {
    "score": 0.8896408,
    "show": {
        "id": 5379, "url": "https://www.tvmaze.com/shows/5379/severance",
        "name": "Severance", "type": "Scripted", "language": "English",
        "genres": ["Drama", "Thriller"], "status": "Running", "averageRuntime": 50,
        "premiered": "2022-02-18", "ended": None, "runtime": 50,
        "schedule": {"time": "21:00", "days": ["Friday"], "display": "Fridays at 9:00 PM"},
        "rating": {"average": 8.6}, "weight": 98,
        "network": {"id": 250, "name": "Apple TV+"},
        "officialSite": "https://tv.apple.com/show/severance",
        "image": {"medium": "https://static.tvmaze.com/uploads/images/medium/5379.jpg"},
        "summary": "<p>A team of office workers whose memories have been surgically divided.</p>",
        "_links": {"self": {"href": "https://api.tvmaze.com/shows/5379"}},
    },
}

OTHER = {
    "score": 0.4,
    "show": {
        "id": 5200, "name": "Severance Notes", "type": "Scripted", "status": "Ended",
        "language": "English", "genres": ["Drama"], "premiered": "2019-01-01", "ended": "2019-06-01",
        "averageRuntime": 22, "network": None, "webChannel": {"name": "YouTube"},
        "rating": {"average": None}, "schedule": {},
        "officialSite": None, "image": {}, "summary": "", "url": "https://www.tvmaze.com/shows/5200",
    },
}


def episode(ep_id, season, number, name, airdate, runtime=50, rating=8.6, stamp=None):
    return {
        "id": ep_id, "url": f"https://www.tvmaze.com/episodes/{ep_id}",
        "name": name, "season": season, "number": number, "type": "regular",
        "airdate": airdate, "airtime": "21:00",
        "airstamp": stamp or f"{airdate}T21:00:00+00:00",
        "runtime": runtime, "rating": {"average": rating},
        "image": {}, "summary": "<p>Something happens.</p>", "_links": {},
    }


#: Season 1 aired in 2022, season 2 has a future date, so there is a real next episode.
EPISODES = [
    episode(1, 1, 1, "Good News About Hell", "2022-02-18", 52, 8.9),
    episode(2, 1, 2, "Half Loop", "2022-02-25", 47, 8.7),
    #: A runtime TVMaze does not publish at all - it must not be invented.
    episode(3, 1, 3, "In Perpetual Motion", "2022-03-04", None, 8.5),
    episode(11, 2, 1, "Hello, Ms. Cobel", "2099-03-08", 51, 9.0),
    episode(12, 2, 2, "Woe's Hollow", "2099-03-15", 49, 8.8),
]

#: A finished show: nothing in the future, so there is no next episode to name.
ENDED_EPISODES = [
    episode(1, 1, 1, "Pilot", "2011-09-22", 60, 7.7),
    episode(2, 1, 2, "Many Happy Returns", "2011-09-29", 55, 7.9),
]


class FakeFeeds:
    def __init__(self, search=None, episodes=None, empty=False, fail=False):
        self.calls: list[str] = []
        self.search = search if search is not None else [SEVERANCE, OTHER]
        self.episodes = episodes if episodes is not None else EPISODES
        self.empty = empty
        self.fail = fail

    def __call__(self, url: str):
        self.calls.append(url)
        if self.fail:
            raise TvError("TVMaze is unreachable")
        if self.empty:
            return json.dumps([])
        if "/search/shows" in url:
            return json.dumps(self.search)
        return json.dumps(self.episodes)


def make_data(**kw):
    feed = FakeFeeds(**kw)
    return TvData(fetch=feed), feed


class HelperTests(unittest.TestCase):
    def test_a_show_name_is_pulled_out_of_a_question(self):
        self.assertEqual(show_query_from_text("what is the next episode of severance?"),
                         "severance")
        self.assertEqual(show_query_from_text("when did season 2 of severance air?"),
                         "severance")
        #: "the" is the show's own word after a separator, but a leading article is not.
        self.assertEqual(show_query_from_text("tell me about the bear"), "bear")
        self.assertEqual(show_query_from_text("when did season 1 of house of the dragon air?"),
                         "house of the dragon")
        self.assertIsNone(show_query_from_text("what is next?"))
        self.assertIsNone(show_query_from_text(""))

    def test_a_season_number_is_optional_and_two_forms(self):
        self.assertEqual(season_from_text("when did season 2 of severance air?"), 2)
        self.assertEqual(season_from_text("list s3 of the bear"), 3)
        self.assertIsNone(season_from_text("tell me about severance"))


class ReadTests(unittest.TestCase):
    def test_one_show_is_picked_by_exact_name_not_by_score(self):
        data, feed = make_data()
        show = data.show("severance")
        self.assertEqual(show["name"], "Severance")
        self.assertEqual(show["network"], "Apple TV+")
        self.assertEqual(show["status"], "Running")
        self.assertEqual(show["schedule"], "Fridays at 9:00 PM")
        self.assertEqual(show["rating"], 8.6)
        self.assertEqual(feed.calls[0], "https://api.tvmaze.com/search/shows?q=severance")

    def test_a_show_with_no_network_falls_back_to_the_web_channel(self):
        data, _feed = make_data()
        show = data.show("severance notes")
        self.assertEqual(show["network"], "YouTube")

    def test_episodes_are_sorted_and_a_missing_runtime_stays_missing(self):
        data, feed = make_data()
        episodes = data.episodes(data.show("severance"))
        self.assertEqual([ep["number"] for ep in episodes], [1, 2, 3, 1, 2])
        self.assertEqual(episodes[0]["name"], "Good News About Hell")
        self.assertIsNone(episodes[2]["runtime"])
        self.assertEqual(feed.calls[-1], "https://api.tvmaze.com/shows/5379/episodes")

    def test_one_season_only(self):
        data, _feed = make_data()
        episodes = data.episodes(data.show("severance"), season=2)
        self.assertEqual(len(episodes), 2)
        self.assertEqual({ep["season"] for ep in episodes}, {2})
        with self.assertRaises(TvNotFound):
            data.episodes(data.show("severance"), season=9)

    def test_the_next_episode_is_the_first_one_in_the_future(self):
        data, _feed = make_data()
        show = data.show("severance")
        nxt = data.next_episode(show)
        self.assertEqual(nxt["name"], "Hello, Ms. Cobel")
        self.assertEqual(nxt["airdate"], "2099-03-08")
        already = data.aired(data.episodes(show))
        self.assertEqual([ep["number"] for ep in already], [1, 2, 3])
        self.assertEqual(already[-1]["name"], "In Perpetual Motion")

    def test_a_finished_show_has_no_next_episode_and_that_is_the_answer(self):
        data, _feed = make_data(episodes=ENDED_EPISODES)
        show = data.show("severance")
        self.assertIsNone(data.next_episode(show))
        self.assertEqual(data.aired(data.episodes(show))[-1]["name"], "Many Happy Returns")

    def test_a_search_lists_matches_with_their_score(self):
        data, _feed = make_data()
        rows = data.search("severance", limit=2)
        self.assertEqual([row["name"] for row in rows], ["Severance", "Severance Notes"])
        self.assertAlmostEqual(rows[0]["score"], 0.8896408)

    def test_nothing_found_and_a_dead_api(self):
        data, _feed = make_data(empty=True)
        with self.assertRaises(TvNotFound):
            data.show("severance")
        data, _feed = make_data(fail=True)
        with self.assertRaises(TvError):
            data.show("severance")
        with self.assertRaises(ValueError):
            data.show("   ")


class RouteTests(unittest.TestCase):
    def test_a_next_episode_question(self):
        self.assertEqual(route("what is the next episode of severance?"),
                         ("tv-next", {"query": "severance"}))
        self.assertEqual(route("when is severance on?")[0], "tv-next")

    def test_a_season_question(self):
        self.assertEqual(route("when did season 2 of severance air?"),
                         ("tv-episodes", {"query": "severance", "season": 2}))
        self.assertEqual(route("list the episodes of the bear"),
                         ("tv-episodes", {"query": "bear"}))

    def test_a_show_question_and_a_search_question(self):
        self.assertEqual(route("tell me about severance"), ("tv-show", {"query": "severance"}))
        self.assertEqual(route("find shows like severance"),
                         ("tv-search", {"query": "severance"}))


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
        from agent import TvAgent

        agent_conn, client_conn = connected_pair()
        data, feed = make_data(**kw)
        agent = TvAgent(agent_conn, data)
        threading.Thread(target=agent_conn.serve, daemon=True).start()
        client = AcpClient(connection=client_conn, permission=permission)
        client.start()
        client.initialize()
        session_id = client.new_session(cwd="/tmp")
        try:
            return client.prompt(text, session_id), client, feed
        finally:
            client.stop()

    def test_a_next_episode_answer(self):
        result, client, _ = self.turn("what is the next episode of severance?")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertEqual(len(client.permission_requests), 1)
        self.assertIn("Severance - next episode", result["text"])
        self.assertIn("S02E01 Hello, Ms. Cobel", result["text"])
        self.assertIn("airs: 2099-03-08 at 21:00 local", result["text"])
        self.assertIn("Something happens.", result["text"])
        #: TVMaze writes summaries in HTML, so the tags must not reach the reader.
        self.assertNotIn("<p>", result["text"])

    def test_a_finished_show_says_there_is_no_next_episode(self):
        result, _, _ = self.turn("what is the next episode of severance?",
                                 episodes=ENDED_EPISODES)
        self.assertIn("no air date past the last episode", result["text"])
        self.assertIn("S01E02 Many Happy Returns", result["text"])
        self.assertIn("between seasons", result["text"])

    def test_a_season_answer_lists_every_episode(self):
        result, _, _ = self.turn("when did season 2 of severance air?")
        self.assertIn("Severance - season 2", result["text"])
        self.assertIn("2 episode(s) on TVMaze", result["text"])
        self.assertIn("S02E02 Woe's Hollow - 2099-03-15, 21:00 local (49 min), rated 8.8/10",
                      result["text"])

    def test_help_asks_nothing(self):
        result, client, feed = self.turn("what can you do?")
        self.assertIn("TVMaze", result["text"])
        self.assertEqual(client.permission_requests, [])
        self.assertEqual(feed.calls, [])

    def test_permission_denied_and_a_dead_api(self):
        result, _, _ = self.turn("tell me about severance", permission="reject")
        self.assertEqual(result["stopReason"], STOP_REFUSAL)
        result, _, _ = self.turn("tell me about severance", fail=True)
        self.assertIn("I could not read TVMaze's schedule", result["text"])


# ---------------------------------------------------------------------------
#
# ---------------------------------------------------------------------------

#: What `tv_catchup_plan` answers for a show with 9 aired episodes at 50 minutes each.
CATCHUP_DATA = {
    "show": "Severance",
    "status": "Running",
    "network": "Apple TV+",
    "season": "all seasons",
    "episodesAired": 9,
    "episodesTotal": 19,
    "totalMinutes": 450,
    "totalHours": 7.5,
    "averageRuntimeMinutes": 50,
    "latestEpisode": {"name": "The We We Are", "season": 2, "number": 9, "airedOn": "2026-09-18"},
    "typicalDaysBetweenEpisodes": 7,
    "source": "TVMaze (api.tvmaze.com)",
}

#: The exact refusal the gateway sends for a key it will not accept.






if __name__ == "__main__":
    unittest.main(verbosity=2)
