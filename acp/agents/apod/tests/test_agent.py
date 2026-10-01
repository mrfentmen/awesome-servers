"""Tests for the apod agent: the payload, the dates, the routing and the image block.

    python3 agents/apod/tests/test_agent.py

No network: NASA's answers are injected, as is the image. The fixtures are the live payloads read
on 2026-09-23 - including the two shapes this reader exists to survive:

  * a day NASA published as a **video**, which has a `thumbnail_url` and no picture, and
  * a day whose picture is far over the size this agent will attach.

The last turn test checks the thing that makes this agent new: an `image` content block really
arrives, carrying the bytes that were fetched, not a link.
"""

from __future__ import annotations

import datetime
import io
import json
import json
import os
import queue
import sys
import threading
import unittest
import urllib.error
from pathlib import Path

AGENT_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = Path(__file__).resolve().parents[3]
for path in (str(REPO_ROOT), str(AGENT_DIR)):
    if path not in sys.path:
        sys.path.insert(0, path)

from acp_kit import (  # noqa: E402
    AcpClient,
    Connection,
    GatewayClient,
    STOP_END_TURN,
    STOP_REFUSAL,
)

from agent import (  # noqa: E402
    ATTACH_LIMIT,
    FIRST_DAY,
    HELP,
    count_from_text,
    date_from_text,
    date_problem,
    named_date,
    render,
    route,
)
from data import (  # noqa: E402
    DEMO_KEY,
    MAX_IMAGE_BYTES,
    MAX_RANDOM,
    ApodData,
    ApodError,
    clean_text,
    credit,
    iso_date,
    mime_for,
    page_url,
    rate_line,
)

TODAY = datetime.date(2026, 9, 23)

IMAGE_DAY = {
    "date": "2026-09-23",
    "title": "A New Lunar Crater: McGetchin",
    "explanation": "A once-in-a-lifetime crater has appeared on the Moon!",
    "media_type": "image",
    "url": "https://apod.nasa.gov/apod/image/2609/mcgetchin_after.jpg",
    "hdurl": "https://apod.nasa.gov/apod/image/2609/mcgetchin_after.jpg",
    "service_version": "v1",
}

VIDEO_DAY = {
    "date": "2026-08-11",
    "title": "A Tour of the Solar System",
    "explanation": "A guided tour, narrated.",
    "media_type": "video",
    "url": "https://www.youtube.com/embed/abc123",
    "thumbnail_url": "https://img.youtube.com/vi/abc123/hqdefault.jpg",
    "service_version": "v1",
}

COPYRIGHT_DAY = dict(IMAGE_DAY, date="2018-02-16", copyright="JoAnn McDonald")

JPEG = b"\xff\xd8\xff\xe0" + b"x" * 4096


class FakeNasa:
    """NASA's answers by url, plus the image bytes. Records what was asked for."""

    def __init__(self, payload=None, random_payload=None, image=JPEG, image_error=None,
                 fail=None) -> None:
        self.calls: list[str] = []
        self.images: list[str] = []
        self.payload = IMAGE_DAY if payload is None else payload
        self.random_payload = random_payload if random_payload is not None else [IMAGE_DAY]
        self.image = image
        self.image_error = image_error
        self.fail = fail

    def __call__(self, url: str) -> str:
        self.calls.append(url)
        if self.fail:
            raise ApodError(self.fail)
        if "count=" in url:
            return json.dumps(self.random_payload)
        return json.dumps(self.payload)

    def image_bytes(self, url: str) -> bytes:
        self.images.append(url)
        if self.image_error:
            raise ApodError(self.image_error)
        return self.image


def data_for(**kw) -> tuple[ApodData, FakeNasa]:
    feed = FakeNasa(**kw)
    return ApodData(fetch=feed, fetch_bytes=feed.image_bytes, key=DEMO_KEY), feed


class DateTests(unittest.TestCase):
    def test_iso_and_slash_dates(self):
        self.assertEqual(named_date("the apod for 1996-01-01", TODAY), datetime.date(1996, 1, 1))
        self.assertEqual(named_date("apod 2026/9/1", TODAY), datetime.date(2026, 9, 1))

    def test_month_names_in_both_orders(self):
        self.assertEqual(named_date("July 20 1996", TODAY), datetime.date(1996, 7, 20))
        self.assertEqual(named_date("20 July 1996", TODAY), datetime.date(1996, 7, 20))
        self.assertEqual(named_date("July 20th, 1996", TODAY), datetime.date(1996, 7, 20))

    def test_yesterday_is_a_day(self):
        self.assertEqual(named_date("apod yesterday", TODAY), datetime.date(2026, 9, 22))

    def test_a_question_with_no_day_names_none(self):
        self.assertIsNone(named_date("picture of the day", TODAY))
        self.assertIsNone(date_from_text("picture of the day", TODAY))

    def test_a_day_before_the_archive_is_reported_not_swapped(self):
        problem = date_problem("the apod for 1969-07-20", TODAY)
        self.assertIn("APOD's first picture is 1996-06-16".replace("1996", "1995"), problem)
        self.assertIn("no picture for 1969-07-20", problem)
        self.assertIsNone(date_from_text("the apod for 1969-07-20", TODAY))
        self.assertEqual(FIRST_DAY, datetime.date(1995, 6, 16))

    def test_a_future_day_is_reported(self):
        self.assertIn("in the future", date_problem("apod 2027-01-01", TODAY))
        self.assertIsNone(date_from_text("apod 2027-01-01", TODAY))

    def test_a_day_that_is_not_on_the_calendar_is_reported(self):
        self.assertIn("not a day on the calendar", date_problem("apod for February 30 2001", TODAY))
        self.assertIsNone(date_from_text("apod for February 30 2001", TODAY))

    def test_a_day_the_archive_has_is_a_day(self):
        self.assertEqual(date_from_text("apod 1996-01-01", TODAY), "1996-01-01")
        self.assertIsNone(date_problem("apod 1996-01-01", TODAY))

    def test_iso_date_of_garbage_is_today(self):
        self.assertEqual(iso_date("not a date"), datetime.date.today().isoformat())
        self.assertEqual(iso_date(None), datetime.date.today().isoformat())
        self.assertEqual(iso_date(TODAY), "2026-09-23")

    def test_the_apod_page_url(self):
        self.assertEqual(page_url("2026-09-23"), "https://apod.nasa.gov/apod/ap260923.html")
        self.assertIn("astropix", page_url("nonsense"))


class PayloadTests(unittest.TestCase):
    def test_an_image_day(self):
        data, feed = data_for()
        entry = data.day()
        self.assertEqual(entry["date"], "2026-09-23")
        self.assertEqual(entry["media_type"], "image")
        self.assertEqual(entry["image_url"], IMAGE_DAY["url"])
        self.assertEqual(entry["image_kind"], "the picture")
        self.assertIn("public domain", entry["credit"])
        self.assertIn("thumbs=true", feed.calls[0])
        self.assertIn("date=", data.url_for(date="2026-09-01"))

    def test_a_video_day_offers_its_thumbnail_and_says_so(self):
        data, _ = data_for(payload=VIDEO_DAY)
        entry = data.day()
        self.assertEqual(entry["media_type"], "video")
        self.assertNotEqual(entry["image_url"], entry["url"])
        self.assertIn("youtube", entry["url"])
        self.assertIn("thumbnail", entry["image_kind"])
        self.assertIn("video", render(entry))

    def test_a_video_day_with_no_thumbnail_has_nothing_to_attach(self):
        data, _ = data_for(payload=dict(VIDEO_DAY, thumbnail_url=""))
        entry = data.day()
        self.assertEqual(entry["image_url"], "")
        self.assertIsNone(data.attachable(entry))

    def test_an_unknown_media_type_is_named_unknown(self):
        data, _ = data_for(payload=dict(IMAGE_DAY, media_type="hologram"))
        self.assertEqual(data.day()["media_type"], "other")

    def test_missing_fields_do_not_crash_the_card(self):
        data, _ = data_for(payload={"media_type": "image"})
        entry = data.day()
        self.assertEqual(entry["title"], "(NASA sent no title)")
        self.assertEqual(entry["date"], datetime.date.today().isoformat())
        self.assertEqual(entry["credit"], "NASA / public domain (no separate copyright line on "
                                          "this day)")

    def test_a_copyright_line_is_credited_to_its_owner(self):
        data, _ = data_for(payload=COPYRIGHT_DAY)
        entry = data.day()
        self.assertEqual(entry["credit"], "copyright JoAnn McDonald")
        self.assertEqual(credit("Copyright 2018 Someone"), "Copyright 2018 Someone")
        self.assertEqual(credit("© Someone"), "© Someone")

    def test_random_days_come_back_as_a_list_and_one_object_is_still_a_day(self):
        data, _ = data_for(random_payload=[IMAGE_DAY, VIDEO_DAY])
        entries = data.random(count=2)
        self.assertEqual([entry["date"] for entry in entries],
                         ["2026-09-23", "2026-08-11"])
        data, _ = data_for(random_payload=IMAGE_DAY)
        self.assertEqual(len(data.random(count=1)), 1)

    def test_random_with_nothing_raises(self):
        data, _ = data_for(random_payload=[])
        with self.assertRaises(ApodError) as caught:
            data.random(count=1)
        self.assertIn("no pictures", str(caught.exception))

    def test_the_count_is_capped_by_what_this_agent_will_send(self):
        data, _ = data_for()
        self.assertEqual(data.url_for(count=99), data.url_for(count=MAX_RANDOM))
        self.assertIn(f"count={MAX_RANDOM}", data.url_for(count=99))
        self.assertIn("thumbs=true", data.url_for(date="2026-09-01"))

    def test_a_payload_that_is_not_json_is_an_error(self):
        data = ApodData(fetch=lambda url: "<html>not json</html>", fetch_bytes=lambda url: JPEG)
        with self.assertRaises(ApodError) as caught:
            data.day()
        self.assertIn("not JSON", str(caught.exception))

    def test_a_list_where_one_day_was_expected_is_an_error(self):
        data = ApodData(fetch=lambda url: json.dumps([IMAGE_DAY]),
                        fetch_bytes=lambda url: JPEG)
        with self.assertRaises(ApodError) as caught:
            data.day()
        self.assertIn("list where one day was expected", str(caught.exception))

    def test_the_image_type_comes_from_the_file_name(self):
        self.assertEqual(mime_for("a/b/c.JPG"), "image/jpeg")
        self.assertEqual(mime_for("x.png?v=2"), "image/png")
        self.assertEqual(mime_for("x.gif"), "image/gif")
        self.assertEqual(mime_for("x.tif"), "image/tiff")
        self.assertEqual(mime_for("x"), "image/jpeg")

    def test_text_and_credit_lines_are_tidied_not_cut(self):
        self.assertEqual(clean_text("a  b\n\nc "), "a b c")
        self.assertEqual(clean_text(None), "")

    def test_an_oversized_image_is_refused_by_the_transport(self):
        error = urllib.error.HTTPError("https://apod.nasa.gov/x.jpg", 429, "Too Many Requests",
                                       {}, io.BytesIO(b'{"error": {"message": "quota exceeded"}}'))
        said = ApodData(key=DEMO_KEY)._say(error)
        self.assertIn("429", said)
        self.assertIn("rate limit", said)
        self.assertIn("quota exceeded", said)

    def test_a_refused_key_says_which_key_and_what_to_set(self):
        error = urllib.error.HTTPError("https://api.nasa.gov/planetary/apod", 403, "Forbidden", {},
                                       io.BytesIO(b'{"error": {"message": "API_KEY_INVALID"}}'))
        said = ApodData(key="NOPE")._say(error)
        self.assertIn("NOPE", said)
        self.assertIn("API_KEY_INVALID", said)
        self.assertIn("NASA_API_KEY", said)

    def test_the_size_cap_is_a_number_a_person_can_read(self):
        self.assertEqual(MAX_IMAGE_BYTES, 4_000_000)
        self.assertIn("DEMO_KEY", rate_line())


class RouteTests(unittest.TestCase):
    def test_the_picture_of_the_day(self):
        self.assertEqual(route("show me NASA's picture of the day")[0], "apod-picture")
        self.assertEqual(route("today's astronomy picture")[0], "apod-picture")
        self.assertEqual(route("apod")[0], "apod-picture")

    def test_a_named_day(self):
        self.assertEqual(route("the apod for 1996-01-01"),
                         ("apod-picture", {"date": "1996-01-01"}))

    def test_an_impossible_day_is_its_own_skill(self):
        skill, params = route("the apod for 1969-07-20")
        self.assertEqual(skill, "apod-nodate")
        self.assertIn("1995-06-16", params["why"])

    def test_random_pictures(self):
        self.assertEqual(route("show me 3 random space pictures"),
                         ("apod-random", {"count": 3}))
        self.assertEqual(route("surprise me"), ("apod-random", {"count": 1}))

    def test_counts_are_capped(self):
        self.assertEqual(count_from_text("give me 40 random pictures"), MAX_RANDOM)

    def test_nothing_to_show_gets_help(self):
        self.assertEqual(route("")[0], "apod-help")
        self.assertEqual(route("what can you do?")[0], "apod-help")
        self.assertEqual(route("hello there")[0], "apod-help")

    def test_the_help_text_names_the_archive_start(self):
        self.assertIn("1995-06-16", HELP)
        self.assertIn("1996-01-01", HELP)


class RenderTests(unittest.TestCase):
    def test_the_card_carries_the_credit_and_the_page(self):
        data, _ = data_for()
        card = render(data.day())
        self.assertIn("2026-09-23 - A New Lunar Crater: McGetchin", card)
        self.assertIn("  - media: image", card)
        self.assertIn("https://apod.nasa.gov/apod/ap260923.html", card)

    def test_the_card_shows_the_full_resolution_only_when_it_differs(self):
        data, _ = data_for(payload=dict(IMAGE_DAY, hdurl="https://x.test/huge.jpg"))
        self.assertIn("full resolution: https://x.test/huge.jpg", render(data.day()))
        data, _ = data_for()
        self.assertNotIn("full resolution", render(data.day()))


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
    def turn(self, text, permission="allow-once", **kw):
        from agent import ApodAgent

        agent_conn, client_conn = connected_pair()
        data, feed = data_for(**kw)
        agent = ApodAgent(agent_conn, data)
        threading.Thread(target=agent_conn.serve, daemon=True).start()
        client = AcpClient(connection=client_conn, permission=permission)
        client.start()
        client.initialize()
        session_id = client.new_session(cwd="/tmp")
        try:
            return client.prompt(text, session_id), client, feed
        finally:
            client.stop()

    def images(self, client):
        """The image blocks this client received. A tool call carries a list, a chunk a dict."""
        return [update["content"] for update in client.updates
                if update.get("sessionUpdate") == "agent_message_chunk"
                and isinstance(update.get("content"), dict)
                and update["content"].get("type") == "image"]

    def test_the_picture_of_the_day_arrives_as_an_image_block(self):
        result, client, feed = self.turn("show me NASA's picture of the day")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertEqual(len(client.permission_requests), 1)
        blocks = self.images(client)
        self.assertEqual(len(blocks), 1)
        self.assertEqual(blocks[0]["mimeType"], "image/jpeg")
        import base64

        self.assertEqual(base64.b64decode(blocks[0]["data"]), JPEG)
        self.assertEqual(feed.images, [IMAGE_DAY["url"]])
        self.assertIn("2026-09-23 - A New Lunar Crater: McGetchin", result["text"])
        self.assertIn("NASA's explanation for 2026-09-23", result["text"])
        self.assertIn("printed whole", result["text"])

    def test_a_named_day_is_the_day_that_was_asked_for(self):
        result, client, feed = self.turn("the apod for 2026-09-01")
        self.assertIn("date=2026-09-01", feed.calls[0])
        self.assertTrue(self.images(client))

    def test_a_video_day_sends_its_thumbnail_and_says_what_it_is(self):
        result, client, _ = self.turn("show me the picture of the day", payload=VIDEO_DAY)
        blocks = self.images(client)
        self.assertEqual(len(blocks), 1)
        self.assertIn("thumbnail", result["text"])
        self.assertIn("NASA published a video", result["text"])
        self.assertIn("youtube", result["text"])

    def test_random_days_send_one_picture_and_describe_the_rest(self):
        result, client, feed = self.turn("show me 3 random space pictures",
                                        random_payload=[IMAGE_DAY, VIDEO_DAY])
        self.assertIn("count=3", feed.calls[0])
        self.assertEqual(len(self.images(client)), ATTACH_LIMIT)
        self.assertIn("2026-08-11", result["text"])
        self.assertIn("Not attached (a link is above or here)", result["text"])

    def test_an_image_over_the_size_cap_is_linked_not_attached(self):
        result, client, _ = self.turn(
            "show me NASA's picture of the day",
            image_error=f"the image at https://apod.nasa.gov/x.jpg is 40.0 MB, over the "
                        f"{MAX_IMAGE_BYTES / 1_000_000:.0f} MB this agent will attach")
        self.assertEqual(self.images(client), [])
        self.assertIn("Not attached", result["text"])
        self.assertIn("40.0 MB", result["text"])

    def test_a_day_with_no_picture_reads_nothing_and_asks_nothing(self):
        result, client, feed = self.turn("the apod for 1969-07-20")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertEqual(client.permission_requests, [])
        self.assertEqual(feed.calls, [])
        self.assertIn("I cannot show that one", result["text"])
        self.assertIn("archivepix", result["text"])

    def test_permission_denied_stops_with_a_refusal(self):
        result, client, feed = self.turn("show me NASA's picture of the day", permission="reject")
        self.assertEqual(result["stopReason"], STOP_REFUSAL)
        self.assertEqual(feed.images, [])
        self.assertIn("I need permission", result["text"])

    def test_a_rate_limited_key_is_reported(self):
        result, _, _ = self.turn("show me NASA's picture of the day",
                                fail="NASA answered 429: the key DEMO_KEY is over its rate limit")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn("I could not read that", result["text"])
        self.assertIn("429", result["text"])

    def test_help_reads_nothing(self):
        result, client, feed = self.turn("what can you do?")
        self.assertEqual(client.permission_requests, [])
        self.assertEqual(feed.calls, [])
        self.assertIn("I read NASA's Astronomy Picture of the Day", result["text"])

    def test_the_tool_call_completes_with_what_was_sent(self):
        _, client, _ = self.turn("show me NASA's picture of the day")
        done = [update for update in client.updates
                if update.get("sessionUpdate") == "tool_call_update"
                and update.get("status") == "completed"]
        self.assertEqual(len(done), 1)
        self.assertIn("sent", done[0]["content"][0]["content"]["text"])


# ---------------------------------------------------------------------------
# Premium: apod-archive digests a span of days on the licence gateway
# ---------------------------------------------------------------------------

DIGEST_PAYLOAD = {
    "startDate": "2022-07-12", "endDate": "2022-07-16",
    "daysPublished": 5, "daysReturned": 5, "spanDays": 5, "truncated": False,
    "byMediaType": {"image": 4, "video": 1},
    "first": "2022-07-12", "last": "2022-07-16",
    "days": [
        {"date": "2022-07-12", "title": "Webb's First Deep Field", "media_type": "image",
         "credit": "NASA, ESA, CSA, STScI", "summary": "The James Webb Space Telescope's first deep field.",
         "page": "https://apod.nasa.gov/apod/ap220712.html"},
        {"date": "2022-07-13", "title": "A Video from the Deep", "media_type": "video",
         "credit": None, "summary": None, "page": "https://apod.nasa.gov/apod/ap220713.html"},
    ],
}

REFUSAL_TEXT = (
    "This is a premium skill and needs a valid license key. "
    "Get one at https://polar.sh/mrfentmen and set MCP_LICENSE_KEY."
)


def mcp_result(payload, is_error=False, structured=None):
    result = {"content": [{"type": "text", "text": json.dumps(payload)}]}
    if is_error:
        result["isError"] = True
    if structured is not None:
        result["structuredContent"] = structured
    return {"jsonrpc": "2.0", "id": 1, "result": result}


def make_gateway(key, result):
    """A real GatewayClient with the transport injected - no network, ever."""
    calls = []

    def fetch(url, payload, headers):
        calls.append({"tool": payload["params"]["name"],
                      "arguments": payload["params"]["arguments"],
                      "authorized": "Authorization" in headers})
        return result

    client = GatewayClient(fetch=fetch, url="http://127.0.0.1:8787/mcp", key=key)
    client.calls = calls
    return client


class PremiumArchiveTests(unittest.TestCase):
    def archive_turn(self, text, gateway, permission="allow-once", **kw):
        from agent import ApodAgent

        agent_conn, client_conn = connected_pair()
        data, feed = data_for(**kw)
        agent = ApodAgent(agent_conn, data, gateway)
        threading.Thread(target=agent_conn.serve, daemon=True).start()
        client = AcpClient(connection=client_conn, permission=permission)
        client.start()
        client.initialize()
        session_id = client.new_session(cwd="/tmp")
        try:
            return client.prompt(text, session_id), client, feed
        finally:
            client.stop()

    def test_no_key_returns_the_gateways_own_wording(self):
        saved = os.environ.pop("MCP_LICENSE_KEY", None)
        try:
            result, _, _ = self.archive_turn("every APOD between 2022-07-12 and 2022-07-16",
                                             make_gateway("", mcp_result(DIGEST_PAYLOAD)))
        finally:
            if saved is not None:
                os.environ["MCP_LICENSE_KEY"] = saved
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn("premium skill", result["text"])
        self.assertIn("MCP_LICENSE_KEY", result["text"])

    def test_a_bad_key_is_answered_not_crashed(self):
        gateway = make_gateway("lic_rejected", mcp_result(
            REFUSAL_TEXT, is_error=True,
            structured={"licenceRefusal": True, "reason": "denied"}))
        result, _, _ = self.archive_turn("every APOD between 2022-07-12 and 2022-07-16", gateway)
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn("polar.sh/mrfentmen", result["text"])
        self.assertIn("needs a valid license key", result["text"])

    def test_a_good_key_returns_the_digest(self):
        gateway = make_gateway("lic_granted", mcp_result(DIGEST_PAYLOAD))
        result, client, feed = self.archive_turn(
            "every APOD between 2022-07-12 and 2022-07-16", gateway)
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn("5 day(s) published, 2 listed", result["text"])
        self.assertIn("2022-07-12: Webb's First Deep Field [image]", result["text"])
        self.assertIn("2022-07-13: A Video from the Deep [video]", result["text"])
        self.assertIn("4 image, 1 video", result["text"])
        tools = [u for u in result["updates"] if u.get("sessionUpdate") == "tool_call"]
        self.assertEqual(tools[0]["name"], "apod-archive")
        self.assertEqual(gateway.calls[0]["tool"], "apod_archive_digest")
        self.assertTrue(gateway.calls[0]["authorized"])
        self.assertEqual(gateway.calls[0]["arguments"],
                         {"start_date": "2022-07-12", "end_date": "2022-07-16"})
        # The digest lists days: NASA itself was never asked for a picture.
        self.assertEqual(feed.calls, [])

    def test_a_missing_field_reads_as_not_reported(self):
        thin = dict(DIGEST_PAYLOAD, days=[{"date": "2022-07-12", "title": None,
                                           "media_type": None, "credit": None,
                                           "summary": None, "page": None}],
                    byMediaType={})
        gateway = make_gateway("lic_granted", mcp_result(thin))
        result, _, _ = self.archive_turn("every APOD between 2022-07-12 and 2022-07-16", gateway)
        self.assertIn("2022-07-12: not reported [not reported]", result["text"])

    def test_a_truncated_digest_says_so(self):
        gateway = make_gateway("lic_granted", mcp_result(dict(DIGEST_PAYLOAD, truncated=True)))
        result, _, _ = self.archive_turn("every APOD between 2022-07-12 and 2022-07-16", gateway)
        self.assertIn("this is a part of it", result["text"])

    def test_a_dead_gateway_is_a_failed_lookup(self):
        def boom(url, payload, headers):
            raise OSError("connection refused")

        client = GatewayClient(fetch=boom, url="http://127.0.0.1:8787/mcp", key="lic_granted")
        result, _, _ = self.archive_turn("every APOD between 2022-07-12 and 2022-07-16", client)
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn("could not finish that on the licence gateway", result["text"])
        statuses = [u.get("status") for u in result["updates"]
                    if u.get("sessionUpdate") == "tool_call_update"]
        self.assertIn("failed", statuses)

    def test_permission_is_asked_before_the_gateway(self):
        gateway = make_gateway("lic_granted", mcp_result(DIGEST_PAYLOAD))
        result, _, _ = self.archive_turn("every APOD between 2022-07-12 and 2022-07-16",
                                         gateway, permission="reject")
        self.assertEqual(result["stopReason"], STOP_REFUSAL)
        self.assertIn("need permission", result["text"])
        self.assertEqual(gateway.calls, [], "a rejected permission must not call the gateway")

    def test_routing_is_narrow_and_free_skills_keep_their_questions(self):
        # A span of days is the premium digest.
        self.assertEqual(route("every APOD between 2022-07-12 and 2022-07-16")[0], "apod-archive")
        self.assertEqual(route("show me July 2021 in APOD")[0], "apod-archive")
        self.assertEqual(route("what did APOD publish from 2021-01-01 to 2021-01-05?")[0], "apod-archive")
        # A single day, a random set and help stay exactly where they were.
        self.assertEqual(route("the apod for 1996-01-01")[0], "apod-picture")
        self.assertEqual(route("show me NASA's picture for July 20 1996")[0], "apod-picture")
        self.assertEqual(route("show me NASA's picture of the day")[0], "apod-picture")
        self.assertEqual(route("show me 3 random space pictures")[0], "apod-random")
        self.assertEqual(route("what can you do?")[0], "apod-help")
        # A day before the archive began is still reported, not digested.
        self.assertEqual(route("the apod for 1969-07-20")[0], "apod-nodate")

    def test_the_range_is_read_from_the_text(self):
        self.assertEqual(route("every APOD between 2022-07-12 and 2022-07-16")[1],
                         {"start_date": "2022-07-12", "end_date": "2022-07-16"})
        # Reversed phrasing is normalised so the range still reads forwards.
        self.assertEqual(route("every APOD between 2022-07-16 and 2022-07-12")[1]["start_date"],
                         "2022-07-12")
        self.assertEqual(route("show me July 2021 in APOD")[1],
                         {"start_date": "2021-07-01", "end_date": "2021-07-31"})
        # A December month rolls the year over rather than landing in month 13.
        self.assertEqual(route("show me December 2021 in APOD")[1]["end_date"], "2021-12-31")

    def test_free_skills_never_reach_the_gateway(self):
        gateway = make_gateway("lic_granted", mcp_result(DIGEST_PAYLOAD))
        for text in ("the apod for 1996-01-01", "show me 3 random space pictures",
                     "what can you do?"):
            result, _, _ = self.archive_turn(text, gateway)
            self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertEqual(gateway.calls, [])


if __name__ == "__main__":
    unittest.main(verbosity=2)
