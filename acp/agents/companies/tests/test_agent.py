
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
from data import (CompaniesData, CompaniesError, CompaniesNotFound,  # noqa: E402
                  lei_from_text, name_from_text, rank_key)


def record(lei, name, status="ACTIVE", jurisdiction="US-CA", parent=None, children=None,
           ultimate_parent=None, first="2012-06-06", created="1977-01-03", registered="806592",
           other_names=None, category="GENERAL"):
    """One GLEIF record, in the shape api.gleif.org returns."""
    return {
        "type": "lei-records",
        "id": lei,
        "attributes": {
            "lei": lei,
            "entity": {
                "legalName": {"name": name, "language": "en"},
                "otherNames": other_names or [],
                "legalAddress": {"language": "en",
                                 "addressLines": ["C/O C T Corporation System", "330 N. Brand Blvd"],
                                 "city": "Glendale", "region": "US-CA", "country": "US",
                                 "postalCode": "91203"},
                "registeredAt": {"id": "RA000598", "other": None},
                "registeredAs": registered,
                "jurisdiction": jurisdiction,
                "category": category,
                "legalForm": {"id": "H1UM", "other": None},
                "status": status,
                "creationDate": created + "T00:00:00Z" if created else None,
                "expiration": {"date": None, "reason": None},
            },
            "registration": {"initialRegistrationDate": first + "T15:53:00Z" if first else None,
                             "lastUpdateDate": "2026-03-03T16:34:33Z", "status": "ISSUED",
                             "nextRenewalDate": "2027-03-08T17:27:20Z",
                             "managingLou": "5493001KJTIIGC8Y1R12",
                             "corroborationLevel": "FULLY_CORROBORATED"},
        },
        "relationships": {
            "managing-lou": {"data": None},
            "lei-issuer": {"data": None},
            "direct-parent": {"data": parent},
            "ultimate-parent": {"data": ultimate_parent},
            "direct-children": {"data": children or []},
            "ultimate-children": {"data": []},
        },
        "links": {"self": f"https://api.gleif.org/api/v1/lei-records/{lei}"},
    }


APPLE = record("HWUPKR0MPOU8FGXBT394", "Apple Inc.", registered="806592",
               other_names=[{"name": "Apple Computer, Inc.", "type": "PREVIOUS_LEGAL_NAME"}])
APPLE_FABRICS = record("6488000AOMRUL4037J06", "APPLE FABRICS", jurisdiction="IN",
                       registered=None, first="2026-07-28", created=None,
                       category="GENERAL")
GOLDEN_APPLE = record("549300WV2Z00JXQ5YJ24", "GOLDEN APPLE INC", jurisdiction="SC",
                      registered=None, first="2013-01-14", created=None)
OLD_APPLE = record("11111111111111111111", "Apple Inc.", status="LAPSED", jurisdiction="US-NY",
                   registered=None, first="2013-01-14", created=None)
BANK_CHILD = record("254900OPPU84GM83MG36", "BANK OF AMERICA NATIONAL ASSOCIATION",
                    jurisdiction="US-NC", registered=None, first="2014-08-01",
                    parent={"id": "9DJT3UXIJIZJI4WXO774", "type": "lei-records"},
                    ultimate_parent={"id": "9DJT3UXIJIZJI4WXO774", "type": "lei-records"})
BANK_PARENT = record("9DJT3UXIJIZJI4WXO774", "BANK OF AMERICA CORPORATION", jurisdiction="US-DE",
                     registered=None, first="2014-08-01",
                     children=[{"id": "254900OPPU84GM83MG36", "type": "lei-records",
                                "attributes": {"legalName": {"name":
                                                              "BANK OF AMERICA NATIONAL ASSOCIATION"}}}])

BANK_SEARCH = {"meta": {"pagination": {"currentPage": 1, "perPage": 20, "from": 1, "to": 2,
                                       "total": 2, "lastPage": 1}},
               "links": {"first": "https://api.gleif.org/api/v1/lei-records"},
               "data": [BANK_PARENT, BANK_CHILD]}

SEARCH = {"meta": {"pagination": {"currentPage": 1, "perPage": 20, "from": 1, "to": 4,
                                  "total": 370, "lastPage": 19}},
          "links": {"first": "https://api.gleif.org/api/v1/lei-records?page[number]=1"},
          "data": [APPLE_FABRICS, APPLE, GOLDEN_APPLE, OLD_APPLE]}


class FakeFeeds:
    def __init__(self, search=None, records=None, empty=False, fail=False):
        self.calls: list[str] = []
        self.params: list[dict] = []
        self.search = SEARCH if search is None else search
        self.records = records if records is not None else {
            "HWUPKR0MPOU8FGXBT394": APPLE,
            "9DJT3UXIJIZJI4WXO774": BANK_PARENT,
            "254900OPPU84GM83MG36": BANK_CHILD,
        }
        self.empty = empty
        self.fail = fail

    def __call__(self, url: str, params: dict):
        self.calls.append(url)
        self.params.append(dict(params or {}))
        if self.fail:
            raise CompaniesError("GLEIF is unreachable")
        if self.empty:
            return json.dumps({"meta": {"pagination": {"total": 0}}, "data": []})
        if "lei-records/" in url:
            lei = url.rsplit("/", 1)[-1]
            if lei not in self.records:
                raise CompaniesNotFound(f"GLEIF answered HTTP 404 for {lei}")
            return json.dumps({"data": self.records[lei], "meta": {}})
        wanted = str((params or {}).get("filter[entity.legalName]") or "")
        if "BANK" in wanted.upper():
            return json.dumps(BANK_SEARCH)
        return json.dumps(self.search)


def make_data(**kw):
    feed = FakeFeeds(**kw)
    return CompaniesData(fetch=feed), feed


class HelperTests(unittest.TestCase):
    def test_an_lei_is_twenty_characters_and_may_start_with_letters(self):
        #: "HW" is Honduras, so an LEI does not have to begin with digits.
        self.assertEqual(lei_from_text("look up LEI 549300APXY32KXB1KC12"),
                         "549300APXY32KXB1KC12")
        self.assertEqual(lei_from_text("who owns LEI HWUPKR0MPOU8FGXBT394?"),
                         "HWUPKR0MPOU8FGXBT394")
        self.assertIsNone(lei_from_text("what is Apple's LEI?"))

    def test_a_name_out_of_a_question(self):
        self.assertEqual(name_from_text("what is Apple's LEI?"), "Apple")
        self.assertEqual(name_from_text("what is the LEI for Deutsche Bank?"), "Deutsche Bank")
        self.assertEqual(name_from_text("who owns Bank of America National Association?"),
                         "Bank of America National Association")
        self.assertEqual(name_from_text("what does Boeing own?"), "Boeing")
        self.assertEqual(name_from_text('the legal entity "Apple Inc." please'), "Apple Inc.")
        self.assertEqual(name_from_text("how many entities are named Apple?"), "Apple")

    def test_the_ranking_puts_the_exact_name_first(self):
        rows = [APPLE_FABRICS, APPLE, GOLDEN_APPLE, OLD_APPLE]
        ranked = [row["attributes"]["entity"]["legalName"]["name"]
                  for row in sorted(rows, key=lambda item: rank_key(item, "Apple"))]
        self.assertEqual(ranked, ["Apple Inc.", "Apple Inc.", "APPLE FABRICS", "GOLDEN APPLE INC"])
        #: An active record outranks a lapsed one with the same name.
        #: A prefix match, and the shorter name first; the lapsed one is behind the active
        #: one only because the two are otherwise identical.
        self.assertEqual(rank_key(APPLE, "Apple"), (1, 10, 0, "Apple Inc."))
        self.assertEqual(rank_key(OLD_APPLE, "Apple"), (1, 10, 1, "Apple Inc."))
        #: "Apple Inc." and "Apple Inc" are the same name to the registry.
        self.assertEqual(rank_key(APPLE, "Apple Inc"), (0, 10, 0, "Apple Inc."))


class ReadTests(unittest.TestCase):
    def test_a_name_search_ranks_and_reports_the_whole_count(self):
        data, feed = make_data()
        found = data.search_name("Apple", limit=3)
        self.assertEqual(found["total"], 370)
        self.assertEqual(found["read"], 4)
        self.assertTrue(found["more_pages"])
        #: No record's legal name is exactly "Apple", so this is not an exact match, and
        #: saying otherwise would be a claim the registry does not support.
        self.assertFalse(found["exact_match"])
        self.assertEqual(found["records"][0]["name"], "Apple Inc.")
        self.assertEqual(found["records"][0]["id"], "HWUPKR0MPOU8FGXBT394")
        self.assertEqual(feed.params[-1]["filter[entity.legalName]"], "Apple")

    def test_an_exact_name_match_is_reported_as_one(self):
        data, _feed = make_data()
        found = data.search_name("Apple Inc", limit=3)
        #: "Apple Inc" and the registry's "Apple Inc." are the same legal name.
        self.assertTrue(found["exact_match"])
        self.assertEqual(found["records"][0]["id"], "HWUPKR0MPOU8FGXBT394")

    def test_one_record(self):
        data, _feed = make_data()
        row = data.record("HWUPKR0MPOU8FGXBT394")
        self.assertEqual(row["name"], "Apple Inc.")
        self.assertEqual(row["status"], "ACTIVE")
        self.assertEqual(row["jurisdiction"], "US-CA")
        self.assertEqual(row["registered_as"], "806592")
        self.assertEqual(row["created"], "1977-01-03")
        self.assertEqual(row["first_known"], "2012-06-06")
        self.assertEqual(row["other_names"], ["Apple Computer, Inc."])
        self.assertEqual(row["url"], "https://lei.gleif.org/lei-record/HWUPKR0MPOU8FGXBT394")

    def test_a_record_that_is_not_there(self):
        data, _feed = make_data()
        with self.assertRaises(CompaniesNotFound):
            data.record("00000000000000000000")
        with self.assertRaises(ValueError):
            data.record("   ")
        with self.assertRaises(ValueError):
            data.search_name("")

    def test_owners_are_read_from_the_record_itself(self):
        data, feed = make_data()
        resolved = data.resolve("254900OPPU84GM83MG36")
        self.assertEqual(len(resolved["parents"]), 2)
        self.assertEqual(resolved["parents"][0]["name"], "BANK OF AMERICA CORPORATION")
        self.assertEqual(resolved["parents"][0]["id"], "9DJT3UXIJIZJI4WXO774")
        #: The parent record is fetched, not guessed at.
        self.assertIn("https://api.gleif.org/api/v1/lei-records/9DJT3UXIJIZJI4WXO774",
                      feed.calls)

    def test_a_record_with_no_parents_says_so(self):
        data, _feed = make_data()
        resolved = data.resolve("HWUPKR0MPOU8FGXBT394")
        self.assertEqual(resolved["parents"], [])
        self.assertEqual(resolved["lei"]["name"], "Apple Inc.")

    def test_subsidiaries(self):
        data, _feed = make_data()
        found = data.subsidiaries("9DJT3UXIJIZJI4WXO774", limit=25)
        self.assertEqual(found["direct_count"], 1)
        self.assertEqual(found["direct_children"][0]["name"],
                         "BANK OF AMERICA NATIONAL ASSOCIATION")
        self.assertEqual(found["ultimate_count"], 0)

    def test_a_dead_api(self):
        data, _feed = make_data(fail=True)
        with self.assertRaises(CompaniesError):
            data.search_name("Apple")
        with self.assertRaises(CompaniesError):
            data.record("HWUPKR0MPOU8FGXBT394")


class RouteTests(unittest.TestCase):
    def test_a_name_question(self):
        self.assertEqual(route("what is Apple's LEI?"),
                         ("companies-lookup", {"name": "Apple", "limit": 10}))
        self.assertEqual(route("what is the LEI for Deutsche Bank?")[1]["name"], "Deutsche Bank")

    def test_an_lei_question(self):
        self.assertEqual(route("look up LEI 549300APXY32KXB1KC12"),
                         ("companies-record", {"lei": "549300APXY32KXB1KC12"}))
        self.assertEqual(route("parent company of 549300APXY32KXB1KC12"),
                         ("companies-owners", {"lei": "549300APXY32KXB1KC12"}))

    def test_ownership_and_subsidiaries_are_different_questions(self):
        self.assertEqual(route("who owns Bank of America National Association?")[0],
                         "companies-owners")
        self.assertEqual(route("what subsidiaries does Apple Inc. own?")[0], "companies-group")
        self.assertEqual(route("what does Boeing own?")[0], "companies-group")

    def test_the_resolve_question(self):
        for text in ("which Apple is it, and how many are there?",
                     "how many entities are named Apple?",
                     "resolve Apple across countries"):
            self.assertEqual(route(text)[0], "companies-resolve", text)

    def test_a_question_that_is_not_about_entities(self):
        for text in ("tell me a joke", "how deep is the water table in Kansas?", ""):
            self.assertEqual(route(text), ("help", {}), text)


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
        from agent import CompaniesAgent

        agent_conn, client_conn = connected_pair()
        data, feed = make_data(**kw)
        agent = CompaniesAgent(agent_conn, data)
        threading.Thread(target=agent_conn.serve, daemon=True).start()
        client = AcpClient(connection=client_conn, permission=permission)
        client.start()
        client.initialize()
        session_id = client.new_session(cwd="/tmp")
        try:
            return client.prompt(text, session_id), client, feed
        finally:
            client.stop()

    def test_a_free_answer_reports_real_records(self):
        result, client, _ = self.turn("what is Apple's LEI?")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertEqual(len(client.permission_requests), 1)
        self.assertIn("4 of 370 GLEIF record(s) whose legal name contains 'Apple'",
                      result["text"])
        self.assertIn("Apple Inc.", result["text"])
        self.assertIn("LEI HWUPKR0MPOU8FGXBT394, ACTIVE, US-CA", result["text"])
        self.assertIn("https://lei.gleif.org/lei-record/HWUPKR0MPOU8FGXBT394", result["text"])
        self.assertIn("GLEIF holds 370 in total", result["text"])
        self.assertIn("a legal entity rather than a brand", result["text"])

    def test_a_record_answer(self):
        result, _, _ = self.turn("look up LEI 254900OPPU84GM83MG36")
        self.assertIn("BANK OF AMERICA NATIONAL ASSOCIATION", result["text"])
        self.assertIn("LEI: 254900OPPU84GM83MG36", result["text"])
        self.assertIn("jurisdiction of incorporation: US-NC", result["text"])
        #: A record answer is the record; the owner is a separate question.
        self.assertNotIn("BANK OF AMERICA CORPORATION", result["text"])

    def test_an_owners_answer_says_when_there_is_no_parent(self):
        result, _, _ = self.turn("who owns Apple?")
        self.assertIn("names no parent and no ultimate parent", result["text"])
        result, _, _ = self.turn("who owns Bank of America National Association?")
        self.assertIn("parent: BANK OF AMERICA CORPORATION", result["text"])
        self.assertIn("LEI 9DJT3UXIJIZJI4WXO774", result["text"])

    def test_a_group_answer(self):
        result, _, _ = self.turn("what does Boeing own?")
        self.assertIn("subsidiaries in GLEIF's record", result["text"])
        self.assertIn("none recorded", result["text"])

    def test_help_asks_nothing(self):
        result, client, feed = self.turn("what can you do?")
        self.assertIn("GLEIF", result["text"])
        self.assertEqual(client.permission_requests, [])
        self.assertEqual(feed.calls, [])

    def test_permission_denied(self):
        result, _, _ = self.turn("what is Apple's LEI?", permission="reject")
        self.assertEqual(result["stopReason"], STOP_REFUSAL)

    def test_a_dead_api(self):
        result, _, _ = self.turn("what is Apple's LEI?", fail=True)
        self.assertIn("I could not read the GLEIF registry", result["text"])


# ---------------------------------------------------------------------------
#
# ---------------------------------------------------------------------------

#: What `companies_resolve` answers for a 200-record read of "Apple".
RESOLVE_DATA = {
    "name": "Apple",
    "records_matching": 370,
    "records_read": 200,
    "pages_read": 10,
    "resolved": {"id": "HWUPKR0MPOU8FGXBT394", "name": "Apple Inc.", "status": "ACTIVE",
                 "jurisdiction": "US-CA"},
    "share_of_matches_pct": 0.27,
    "countries": [
        {"country": "US", "records": 41},
        {"country": "IN", "records": 12},
        {"country": "SC", "records": 3},
    ],
    "other_names": [
        {"name": "APPLE FABRICS", "jurisdiction": "IN", "status": "ACTIVE"},
        {"name": "GOLDEN APPLE INC", "jurisdiction": "SC", "status": "ACTIVE"},
    ],
    "note": "GLEIF matched 370 records for this name; 200 were read across 10 pages, so the "
            "country counts cover those 200 and not the whole match",
    "source": "GLEIF Legal Entity Identifier registry (api.gleif.org)",
}

#: The exact refusal the gateway sends for a key it will not accept.






if __name__ == "__main__":
    unittest.main(verbosity=2)
