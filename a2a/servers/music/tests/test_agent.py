"""Tests for the Deezer music server.

    python3 servers/music/tests/test_agent.py
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
    SKILL_ARTIST_TIMELINE,
    DeezerAgent,
    artist_from_text,
    parse,
)
from data import (  # noqa: E402
    DATASET,
    DeezerClient,
    duration_label,
)

TRACK = {
    "id": 138547415,
    "readable": True,
    "title": "Creep",
    "title_short": "Creep",
    "title_version": "",
    "isrc": "GBAYE9200070",
    "link": "https://www.deezer.com/track/138547415",
    "duration": 238,
    "rank": 978547,
    "explicit_lyrics": True,
    "explicit_content_cover": 0,
    "preview": "https://cdnt-preview.dzcdn.net/api/1/1/b/9/c/0/b9c4.mp3?hdnea=exp=1790651100",
    "md5_image": "1dd56fd8824492e1a5106c99a00a85ec",
    "type": "track",
    "artist": {"id": 399, "name": "Radiohead", "link": "https://www.deezer.com/artist/399"},
    "album": {"id": 64066, "title": "Pablo Honey", "link": "https://www.deezer.com/album/64066"},
}

OTHER_TRACK = {
    **TRACK,
    "id": 138547416,
    "title": "Creep (acoustic)",
    "title_short": "Creep (acoustic)",
    "rank": 41233,
    "artist": {"id": 400, "name": "Someone Else"},
    "album": {"id": 64067, "title": "Covers"},
}

ARTIST_ROW = {
    "id": 399,
    "name": "Radiohead",
    "link": "https://www.deezer.com/artist/399",
    "picture_big": "https://api.deezer.com/artist/399/image",
    "nb_album": 10,
    "nb_fan": 3891244,
    "type": "artist",
}

ALBUM_ROW = {
    "id": 792320571,
    "title": "Hail to the Thief (Live Recordings 2003-2009)",
    "link": "https://www.deezer.com/album/792320571",
    "cover_big": "https://cdn-images.dzcdn.net/images/cover/93741fef/1000x1000.jpg",
    "nb_tracks": 12,
    "duration": 2860,
    "record_type": "album",
    "release_date": "2025-08-13",
    "explicit_lyrics": True,
    "type": "album",
    "artist": ARTIST_ROW,
}

SEARCH_PAYLOAD = {"data": [TRACK, OTHER_TRACK, ARTIST_ROW, ALBUM_ROW], "total": 512, "next": None}
ALBUMS_PAYLOAD = {"data": [ALBUM_ROW], "total": 10, "next": None}
ARTIST_PAYLOAD = ARTIST_ROW
ALBUM_PAYLOAD = {**ALBUM_ROW, "artist": ARTIST_ROW}
TRACK_PAYLOAD = TRACK
CHART_PAYLOAD = {"data": [TRACK, OTHER_TRACK], "total": 200}

_NO_PREVIEW_TRACK = {**TRACK, "preview": ""}


def _no_network(*args, **kwargs):
    raise AssertionError("FakeDeezer must not touch the network")


def fetch_from(payloads, calls=None):
    """A JsonApiClient `fetch` that dispatches on path, so data.py runs for real."""

    def fetch(url, params, headers):
        if calls is not None:
            calls.append((url, dict(params)))
        path = url.split("?")[0]
        if path.endswith("/search/artist"):
            return payloads["artist_search"]
        if path.endswith("/search"):
            return payloads["search"]
        if "/artist/" in path and path.endswith("/albums"):
            return payloads["albums"]
        if "/artist/" in path:
            return payloads["artist"]
        if "/album/" in path:
            return payloads["album"]
        if "/track/" in path:
            return payloads["track"]
        if "/chart/" in path:
            return payloads["chart"]
        raise AssertionError(f"unexpected url {url}")

    return fetch


def client(**payloads):
    base = {"search": {"data": [], "total": 0}, "artist_search": {"data": []},
            "albums": {"data": []}, "artist": ARTIST_PAYLOAD, "album": ALBUM_PAYLOAD,
            "track": TRACK_PAYLOAD, "chart": {"data": []}}
    base.update(payloads)
    return DeezerClient(fetch=fetch_from(base))


def live_client(calls):
    return DeezerClient(fetch=fetch_from(
        {"search": SEARCH_PAYLOAD, "artist_search": {"data": [ARTIST_ROW]},
         "albums": ALBUMS_PAYLOAD, "artist": ARTIST_PAYLOAD, "album": ALBUM_PAYLOAD,
         "track": TRACK_PAYLOAD, "chart": CHART_PAYLOAD}, calls))


class ValidationTests(unittest.TestCase):
    def test_check_name_and_id(self):
        self.assertEqual(DeezerClient.check_name(" Creep "), "Creep")
        with self.assertRaises(ValueError):
            DeezerClient.check_name("")
        self.assertEqual(DeezerClient.check_id("399", "artist"), 399)
        for bad in ("abc", "-1", "1.5"):
            with self.assertRaises(ValueError):
                DeezerClient.check_id(bad, "artist")

    def test_check_limit_and_type(self):
        self.assertEqual(DeezerClient.check_limit("5"), 5)
        self.assertEqual(DeezerClient.check_limit(None, default=7), 7)
        for bad in ("0", "51"):
            with self.assertRaises(ValueError):
                DeezerClient.check_limit(bad)
        self.assertEqual(DeezerClient.check_item_type("ALBUMS"), "album")
        with self.assertRaises(ValueError):
            DeezerClient.check_item_type("podcast")

    def test_check_release_date(self):
        self.assertEqual(DeezerClient.check_release_date("2003-06-09"), "2003-06-09")
        with self.assertRaises(ValueError):
            DeezerClient.check_release_date("09/06/2003")

    def test_duration_label(self):
        self.assertEqual(duration_label(238), "3:58")
        self.assertEqual(duration_label(45), "45s")
        self.assertEqual(duration_label(None), "length not reported")


class ReaderTests(unittest.TestCase):
    def test_search_returns_mixed_kinds_with_one_read(self):
        calls = []
        api = live_client(calls)
        found = api.search("creep", limit=10)
        kinds = [entry["type"] for entry in found]
        self.assertEqual(kinds, ["track", "track", "artist", "album"])
        self.assertEqual(found[0]["artist_name"], "Radiohead")
        self.assertEqual(found[0]["album_title"], "Pablo Honey")
        self.assertEqual(found[0]["duration_label"], "3:58")
        # One read for all three kinds, not three.
        self.assertEqual(len(calls), 1)
        self.assertEqual(calls[0][1]["q"], "creep")

    def test_search_filters_to_one_kind(self):
        calls = []
        api = live_client(calls)
        albums = api.search("radiohead", limit=5, item_type="album")
        self.assertEqual([entry["title"] for entry in albums],
                         ["Hail to the Thief (Live Recordings 2003-2009)"])
        self.assertEqual(albums[0]["release_year"], "2025")
        self.assertEqual(len(calls), 1)

    def test_search_total_is_dezzers_own_count(self):
        self.assertEqual(live_client([]).search_total("creep"), 512)

    def test_search_with_no_match(self):
        self.assertEqual(client().search("zzzznotatrack"), [])

    def test_artist_by_name_and_id(self):
        calls = []
        api = live_client(calls)
        self.assertEqual(api.artist("Radiohead")["id"], 399)
        self.assertEqual(api.artist("399")["id"], 399)
        self.assertTrue(any("/search/artist" in url for url, _ in calls))

    def test_artist_with_no_match_is_none(self):
        self.assertIsNone(client(artist_search={"data": []}).artist("Nobody At All"))
        with self.assertRaises(ValueError):
            client().artist("")

    def test_artist_albums(self):
        api = live_client([])
        albums = api.artist_albums(399, limit=5)
        self.assertEqual(albums[0]["id"], 792320571)
        self.assertEqual(albums[0]["record_type"], "album")
        self.assertEqual(albums[0]["duration_label"], "47:40")

    def test_album_carries_the_release_date(self):
        album = client().album(792320571)
        self.assertEqual(album["release_date"], "2025-08-13")
        self.assertEqual(album["artist_name"], "Radiohead")

    def test_track_keeps_the_preview_url_as_deezer_wrote_it(self):
        track = client().track(138547415)
        self.assertEqual(track["preview"], TRACK["preview"])
        self.assertEqual(track["preview_seconds"], 30)
        self.assertEqual(track["album_title"], "Pablo Honey")
        self.assertEqual(track["isrc"], "GBAYE9200070")

    def test_track_without_a_preview_says_so(self):
        track = client(track=_NO_PREVIEW_TRACK).track(138547415)
        self.assertIsNone(track["preview"])
        self.assertIsNone(track["preview_seconds"])

    def test_chart_is_numbered_from_one(self):
        tracks = client(chart=CHART_PAYLOAD).chart(limit=2)
        self.assertEqual([row["position"] for row in tracks], [1, 2])
        self.assertEqual(tracks[0]["title"], "Creep")

    def test_albums_for_an_unknown_artist_shape(self):
        from a2a_kit import UpstreamError

        def bad(url, params, headers):
            return {"error": {"type": "DataException", "message": "no data"}}

        with self.assertRaises(UpstreamError):
            DeezerClient(fetch=bad).artist_albums(399)


class ParseTests(unittest.TestCase):
    def text(self, value):
        return parse({"parts": [{"kind": "text", "text": value}]})

    def test_search_is_the_default(self):
        request = self.text("creep")
        self.assertEqual(request["skill"], "music-search")
        self.assertEqual(request["params"]["query"], "creep")

    def test_albums_of_an_artist(self):
        request = self.text("what albums does Radiohead have?")
        self.assertEqual(request["skill"], "artist-albums")
        self.assertEqual(request["params"]["artist"], "Radiohead")

    def test_discography_wording(self):
        self.assertEqual(self.text("discography of Radiohead")["params"]["artist"], "Radiohead")

    def test_preview_by_title_and_by_id(self):
        request = self.text("30 second preview of Creep by Radiohead")
        self.assertEqual(request["skill"], "track-preview")
        self.assertEqual(request["params"]["query"], "Creep by Radiohead")
        by_id = self.text("preview for track 138547415")
        self.assertEqual(by_id["params"]["track_id"], "138547415")

    def test_chart_wording_including_a_number(self):
        self.assertEqual(self.text("what is on the music chart?")["skill"], "chart")
        request = self.text("top 5 tracks right now")
        self.assertEqual(request["skill"], "chart")
        self.assertEqual(request["params"]["limit"], "5")

    def test_timeline_routing(self):
        for value in ("when did Radiohead actually release things?",
                      "build me a release timeline for Radiohead"):
            request = self.text(value)
            self.assertEqual(request["skill"], "artist-timeline", value)
            self.assertEqual(request["params"]["artist"], "Radiohead", value)

    def test_album_wording_keeps_its_own_skill(self):
        self.assertEqual(self.text("what albums does Radiohead have?")["skill"], "artist-albums")

    def test_help_and_empty(self):
        self.assertEqual(self.text("")["skill"], "help")
        self.assertEqual(self.text("what can you do?")["skill"], "help")

    def test_explicit_json_wins(self):
        request = parse({"parts": [{"kind": "data", "data": {
            "skill": "music-search", "query": "Radiohead", "type": "album", "limit": 3}}]})
        self.assertEqual(request["skill"], "music-search")
        self.assertEqual(request["params"]["type"], "album")
        self.assertEqual(request["params"]["limit"], 3)
        self.assertTrue(request["explicit"])

    def test_artist_extraction_is_conservative(self):
        self.assertEqual(artist_from_text("discography of Radiohead", None), "Radiohead")
        self.assertEqual(artist_from_text("albums by The Beatles", None), "The Beatles")
        self.assertEqual(artist_from_text("discography of Radiohead", "Radiohead"), None)


class SkillTests(unittest.TestCase):
    def run_skill(self, skill, api=None, gateway=None, **params):
        agent = DeezerAgent(client=api or client(), gateway=gateway or GatewayClient(fetch=_no_network))
        request = {"skill": skill, "params": params, "missing": agent.missing(skill, params)}
        return agent.run(request)

    def test_search_cites_the_dataset_and_total(self):
        result = self.run_skill("music-search", api=live_client([]), query="creep")
        self.assertEqual(result["final_state"], "completed")
        self.assertIn(DATASET, result["message"])
        self.assertIn("Creep", result["message"])
        self.assertIn("Radiohead", result["message"])
        self.assertIn("512 match(es)", result["message"])
        self.assertEqual(result["artifact"]["total_matches"], 512)
        self.assertEqual(result["artifact"]["count"], 4)

    def test_search_narrowed_to_albums(self):
        result = self.run_skill("music-search", api=live_client([]), query="radiohead", type="album")
        self.assertIn("Hail to the Thief", result["message"])
        self.assertIn("of type album", result["message"])
        self.assertEqual(result["artifact"]["count"], 1)

    def test_search_with_no_match(self):
        result = self.run_skill("music-search", query="zzzznotatrack")
        self.assertIn("Deezer matches nothing", result["message"])
        self.assertEqual(result["artifact"]["count"], 0)

    def test_search_without_a_query_asks(self):
        result = self.run_skill("music-search")
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("What am I searching", result["message"])

    def test_artist_albums_lists_releases(self):
        result = self.run_skill("artist-albums", api=live_client([]), artist="Radiohead")
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("Hail to the Thief", result["message"])
        self.assertIn("2025-08-13", result["message"])
        self.assertIn("47:40", result["message"])
        self.assertIn("not a date order", result["message"])
        self.assertEqual(result["artifact"]["artist"]["id"], 399)

    def test_artist_albums_when_there_are_none(self):
        result = self.run_skill("artist-albums",
                                api=client(albums={"data": []}, artist_search={"data": [ARTIST_ROW]}),
                                artist="Radiohead")
        self.assertIn("lists no releases", result["message"])
        self.assertEqual(result["artifact"]["count"], 0)

    def test_preview_hands_back_the_preview_url(self):
        result = self.run_skill("track-preview", api=live_client([]), track_id="138547415")
        self.assertEqual(result["final_state"], "completed")
        self.assertIn(TRACK["preview"], result["message"])
        self.assertIn("30-second preview", result["message"])
        self.assertIn("Radiohead", result["message"])
        self.assertIn("GBAYE9200070", result["message"])
        self.assertEqual(result["artifact"]["track"]["preview_seconds"], 30)

    def test_preview_resolves_a_title_and_says_which_match(self):
        result = self.run_skill("track-preview", api=live_client([]), query="Creep")
        self.assertEqual(result["final_state"], "completed")
        self.assertEqual(result["artifact"]["matched_from_search"], "Creep")
        self.assertEqual(result["artifact"]["track_id"], 138547415)

    def test_preview_with_no_match(self):
        result = self.run_skill("track-preview", query="zzzznotatrack")
        self.assertIn("matches no track", result["message"])

    def test_preview_when_deezer_has_none(self):
        result = self.run_skill("track-preview", api=client(track=_NO_PREVIEW_TRACK), track_id="138547415")
        self.assertIn("publishes no preview", result["message"])
        self.assertNotIn("cdnt-preview", result["message"])

    def test_preview_without_a_track_asks(self):
        agent = DeezerAgent(client=client())
        self.assertEqual(agent.missing("track-preview", {}), ["track"])
        result = agent.run({"skill": "track-preview", "params": {}, "missing": ["track"]})
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("Deezer track id", result["message"])

    def test_chart_lists_positions(self):
        result = self.run_skill("chart", api=client(chart=CHART_PAYLOAD), limit=2)
        self.assertIn("1. Creep", result["message"])
        self.assertIn("2. Creep (acoustic)", result["message"])
        self.assertIn("global chart", result["message"])

    def test_chart_when_empty(self):
        result = self.run_skill("chart")
        self.assertIn("chart came back empty", result["message"])

    def test_artist_skills_require_a_name(self):
        agent = DeezerAgent(client=client())
        self.assertEqual(agent.missing("artist-albums", {}), ["artist"])
        self.assertEqual(agent.missing("artist-timeline", {}), ["artist"])
        result = agent.run({"skill": "artist-albums", "params": {}, "missing": ["artist"]})
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("Deezer artist id", result["message"])

    def test_an_unknown_artist_is_a_completed_answer(self):
        result = self.run_skill("artist-albums", api=client(artist_search={"data": []}),
                                artist="Nobody At All")
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("Deezer has no artist matching", result["message"])
        self.assertIsNone(result["artifact"].get("albums"))

    def test_help_does_not_touch_the_feed(self):
        result = self.run_skill("help")
        self.assertIn("Deezer", result["message"])
        self.assertIsNone(result["artifact"])

    def test_the_prefixed_gateway_url_override_is_wired_up(self):
        import os

        os.environ["DEEZER_GATEWAY_URL"] = "http://127.0.0.1:9/mcp"
        try:
            agent = DeezerAgent(client=client() if "music" != "tv" else FakeTvmaze()
                          if "music" == "tv" else None)
        finally:
            del os.environ["DEEZER_GATEWAY_URL"]
        self.assertEqual(agent.gateway.url, "http://127.0.0.1:9/mcp",
                         "the .env.example documents this override, so it has to work")

    def test_card_skills_and_env_prefix(self):
        ids = [skill["id"] for skill in CARD_SKILLS]
        self.assertEqual(ids, ["music-search", "artist-albums", "track-preview", "chart",
                               "artist-timeline"])
        premium = [skill for skill in CARD_SKILLS if skill["id"] == "artist-timeline"][0]
        self.assertIn("premium", premium["tags"])
        self.assertEqual(DeezerAgent(client=client()).env_prefix, "DEEZER")


#: Shape copied from a live `music_artist_timeline` answer for Radiohead.
TIMELINE_PAYLOAD = {
    "artist": "Radiohead",
    "artistId": 399,
    "releasesFound": 10,
    "releasesRead": 3,
    "releasesUndated": 1,
    "firstRelease": "1997-06-09",
    "latestRelease": "2025-08-13",
    "spanYears": 3,
    "releasesPerYear": 1.0,
    "totalTracks": 36,
    "totalMinutes": 7140,
    "totalHours": 119.0,
    "albumsMissingRuntime": 0,
    "longestGap": {"months": 72, "from": "1997-06-09", "to": "2003-06-09",
                   "between": "OK Computer and Hail to the Thief"},
    "releasesByType": {"album": 2, "compilation": 1},
    "byYear": [{"year": 1997, "releases": 1}, {"year": 2003, "releases": 1},
               {"year": 2025, "releases": 1}],
    "releases": [
        {"title": "OK Computer", "releaseDate": "1997-06-09", "recordType": "album",
         "tracks": 12, "minutes": 2820},
        {"title": "Hail to the Thief", "releaseDate": "2003-06-09", "recordType": "album",
         "tracks": 14, "minutes": 3660},
        {"title": "Hail to the Thief (Live Recordings 2003-2009)", "releaseDate": "2025-08-13",
         "recordType": "compilation", "tracks": 12, "minutes": 2860},
    ],
    "note": None,
}

DENIED_TEXT = ("`music_artist_timeline` is a premium tool, but that license key is not valid. "
               "Get a key at https://buy.polar.sh/polar_cl_example")
TOOL_ERROR_TEXT = "`music_artist_timeline` failed: Deezer returned HTTP 429"


def _message(text, **extra):
    payload = {"kind": "message", "role": "user", "messageId": "test-message",
               "parts": [{"kind": "text", "text": text}]}
    payload.update(extra)
    return payload


def fake_gateway(payload=None, error=None, text=None, tool_error=None, key="polar_test_key"):
    """A GatewayClient whose HTTP POST is a function, so no test touches the network."""
    calls: list[dict] = []

    def fetch(url, request_payload, headers):
        calls.append({"url": url, "payload": request_payload, "headers": headers})
        if error is not None:
            raise error
        if tool_error is not None:
            # Failed after the gate let it through: no licenceRefusal marker.
            return {"jsonrpc": "2.0", "id": 1,
                    "result": {"content": [{"type": "text", "text": tool_error}], "isError": True}}
        if payload is None and text is None:
            # The gateway's licence refusal, marker included: the marker is what tells a
            # refusal apart from a tool that failed after the gate had let it through.
            return {"jsonrpc": "2.0", "id": 1,
                    "result": {"content": [{"type": "text", "text": DENIED_TEXT}],
                               "structuredContent": {"licenceRefusal": True, "reason": "invalid"},
                               "isError": True}}
        body = text if text is not None else json.dumps(payload)
        return {"jsonrpc": "2.0", "id": 1, "result": {"content": [{"type": "text", "text": body}]}}

    return GatewayClient(fetch=fetch, key=key), calls


class ArtistTimelineTests(unittest.TestCase):
    """The premium skill: parsing stays local, the ordering comes from the gateway."""

    def test_when_did_things_come_out_routes_to_the_premium_skill(self):
        for text in ("when did Radiohead actually release things?",
                     "build me a release timeline for Radiohead",
                     "how often does Radiohead release albums"):
            parsed = parse(_message(text))
            self.assertEqual(parsed["skill"], SKILL_ARTIST_TIMELINE, text)
            self.assertTrue(parsed["explicit"], text)

    def test_the_free_skills_keep_their_own_questions(self):
        self.assertEqual(parse(_message("search deezer for creep"))["skill"], "music-search")
        self.assertEqual(parse(_message("what albums does Radiohead have?"))["skill"],
                         "artist-albums")
        self.assertEqual(parse(_message("30 second preview of Creep by Radiohead"))["skill"],
                         "track-preview")
        self.assertEqual(parse(_message("what is on the music chart?"))["skill"], "chart")

    def test_an_explicit_skill_id_is_honoured(self):
        parsed = parse(_message("anything at all", parts=[
            {"kind": "data", "data": {"skill": SKILL_ARTIST_TIMELINE, "artist": "Radiohead",
                                      "limit": 20}}]))
        self.assertEqual(parsed["skill"], SKILL_ARTIST_TIMELINE)
        self.assertEqual(parsed["params"]["artist"], "Radiohead")
        self.assertEqual(parsed["params"]["limit"], 20)

    def test_the_message_reports_the_gateways_timeline(self):
        gateway, calls = fake_gateway(TIMELINE_PAYLOAD)
        result = DeezerAgent(client(), gateway=gateway).run(
            {"skill": SKILL_ARTIST_TIMELINE, "params": {"artist": "Radiohead", "limit": 3},
             "missing": []})
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("1997-06-09 - OK Computer", result["message"])
        self.assertIn("Longest gap 72 months", result["message"])
        self.assertIn("119.0 h of music", result["message"])
        self.assertIn("1997: 1", result["message"])
        self.assertIn(DATASET, result["message"])
        self.assertTrue(result["artifact"]["premium"])
        self.assertEqual(result["artifact"]["releases_read"], 3)

        # Deezer's album pages were read behind the gate, not here.
        self.assertEqual(len(calls), 1)
        sent = calls[0]["payload"]["params"]
        self.assertEqual(sent["name"], "music_artist_timeline")
        self.assertEqual(sent["arguments"]["artist"], "Radiohead")
        self.assertEqual(sent["arguments"]["limit"], 3)

    def test_a_bad_limit_never_reaches_the_gateway(self):
        gateway, calls = fake_gateway(TIMELINE_PAYLOAD)
        result = DeezerAgent(client(), gateway=gateway).run(
            {"skill": SKILL_ARTIST_TIMELINE, "params": {"artist": "Radiohead", "limit": "999"},
             "missing": []})
        self.assertEqual(result["final_state"], "input-required")
        self.assertEqual(calls, [], "a bad argument never reaches the gateway")

    def test_without_a_licence_the_caller_is_told_how_to_get_one(self):
        gateway, calls = fake_gateway(key="")
        result = DeezerAgent(client(), gateway=gateway).run(
            {"skill": SKILL_ARTIST_TIMELINE, "params": {"artist": "Radiohead"}, "missing": []})
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("MCP_LICENSE_KEY", result["message"])
        self.assertEqual(result["artifact"]["reason"], "missing_key")
        self.assertEqual(calls, [], "a keyless caller must not reach the gateway")

    def test_a_licence_refusal_keeps_the_gateways_wording(self):
        gateway, _ = fake_gateway()  # nothing but a refusal
        result = DeezerAgent(client(), gateway=gateway).run(
            {"skill": SKILL_ARTIST_TIMELINE, "params": {"artist": "Radiohead"}, "missing": []})
        self.assertEqual(result["final_state"], "completed")
        self.assertEqual(result["message"], DENIED_TEXT)
        self.assertEqual(result["artifact"]["reason"], "denied")

    def test_a_dead_gateway_fails_instead_of_inventing_a_timeline(self):
        gateway, _ = fake_gateway(error=OSError("connection refused"))
        result = DeezerAgent(client(), gateway=gateway).run(
            {"skill": SKILL_ARTIST_TIMELINE, "params": {"artist": "Radiohead"}, "missing": []})
        self.assertEqual(result["final_state"], "failed")
        self.assertIn("could not be reached", result["message"])
        self.assertIsNone(result["artifact"].get("releases"))

    def test_a_tool_error_is_not_sold_as_a_licence_problem(self):
        gateway, _ = fake_gateway(tool_error=TOOL_ERROR_TEXT)
        result = DeezerAgent(client(), gateway=gateway).run(
            {"skill": SKILL_ARTIST_TIMELINE, "params": {"artist": "Radiohead"}, "missing": []})
        self.assertEqual(result["final_state"], "failed")
        self.assertNotIn("MCP_LICENSE_KEY", result["message"])
        self.assertIn("HTTP 429", result["message"])

    def test_a_missing_total_runtime_is_reported_not_shown_as_zero(self):
        payload = {**TIMELINE_PAYLOAD, "totalHours": None, "totalMinutes": None,
                   "totalTracks": None, "albumsMissingRuntime": 3,
                   "runtimeSource": "Deezer's album list publishes no track count or runtime"}
        gateway, _ = fake_gateway(payload)
        result = DeezerAgent(client(), gateway=gateway).run(
            {"skill": SKILL_ARTIST_TIMELINE, "params": {"artist": "Radiohead"}, "missing": []})
        self.assertIn("publishes no track count or runtime", result["message"])
        self.assertNotIn("h of music in all", result["message"])

    def test_undated_releases_are_reported_not_dropped(self):
        gateway, _ = fake_gateway(TIMELINE_PAYLOAD)
        result = DeezerAgent(client(), gateway=gateway).run(
            {"skill": SKILL_ARTIST_TIMELINE, "params": {"artist": "Radiohead"}, "missing": []})
        self.assertIn("carry no release date", result["message"])


if __name__ == "__main__":
    unittest.main()
