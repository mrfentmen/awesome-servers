
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

from agent import names_from_text, route  # noqa: E402
from data import (NonprofitData, NonprofitError, NonprofitNotFound,  # noqa: E402
                  ein_from_text, median, name_from_text)

RED_CROSS_EIN = "530196605"


def search_hit(ein, name, city="Washington", state="DC", ntee="P210", score=52.2,
               have_filings=None):
    return {"ein": int(ein), "strein": f"{ein[:2]}-{ein[2:]}", "name": name, "sub_name": name,
            "city": city, "state": state, "ntee_code": ntee, "raw_ntee_code": ntee,
            "subseccd": 3, "has_subseccd": True, "have_filings": have_filings,
            "have_extracts": None, "have_pdfs": None, "score": score}


SEARCH = {"total_results": 190, "num_pages": 8, "cur_page": 0, "page_offset": 0, "per_page": 25,
          "search_query": "red cross", "organizations": [
              search_hit("530196605", "American National Red Cross", score=52.2),
              search_hit("581771391", "Red Cross Civitans", "Climax", "NC", "T30", 51.0),
              search_hit("204801016", "881458 American Red Cross Club", "Fort Wayne", "IN",
                         None, 48.5),
          ]}

RECORD = {"organization": {
    "id": 1, "ein": int(RED_CROSS_EIN), "name": "American National Red Cross",
    "careofname": None, "address": "2011 D St NW", "city": "Washington", "state": "DC",
    "zipcode": "20006", "exemption_number": None, "subsection_code": 3,
    "affiliation_code": None, "classification_codes": "CH", "ruling_date": "1938-12-01",
    "deductibility_code": 1, "foundation_code": None, "activity_codes": None,
    "organization_code": 1, "exempt_organization_status_code": 1, "tax_period": "2025-06-01",
    "asset_code": 7, "income_code": 5, "filing_requirement_code": "A",
    "pf_filing_requirement_code": None, "accounting_period": "0601",
    "asset_amount": 5052941623, "income_amount": 4608946426, "revenue_amount": 3916983933,
    "ntee_code": "P210", "sort_name": "RED CROSS NATIONAL", "created_at": "2016-05-10",
    "updated_at": "2026-05-10", "data_source": "IRS Exempt Organizations Business Master File",
    "have_extracts": None, "have_pdfs": None, "latest_object_id": 1},
    "filings_with_data": [], "filings_without_data": [], "api_version": 2}

SMALL_RECORD = {"organization": {
    "ein": 581771391, "name": "Red Cross Civitans", "city": "Climax", "state": "NC",
    "tax_period": "2025-09-01", "revenue_amount": 11554, "income_amount": 15900,
    "asset_amount": 109299, "ntee_code": "T30", "subsection_code": 4,
    "deductibility_code": 2, "ruling_date": "2014-07-01", "organization_code": 3},
    "filings_with_data": [], "filings_without_data": [], "api_version": 2}

#: One peer reports a blank amount and one reports a real zero: the two are not the same.
ZERO_RECORD = {"organization": {
    "ein": 204801016, "name": "881458 American Red Cross Club", "city": "Fort Wayne",
    "state": "IN", "tax_period": "2024-12-01", "revenue_amount": 0, "income_amount": None,
    "asset_amount": 5150, "ntee_code": None, "subsection_code": 3},
    "filings_with_data": [], "filings_without_data": [], "api_version": 2}

RECORDS = {RED_CROSS_EIN: RECORD, "581771391": SMALL_RECORD, "204801016": ZERO_RECORD}


class FakeFeeds:
    def __init__(self, search=None, records=None, missing=False, fail=False):
        self.calls: list[tuple] = []
        self.search = SEARCH if search is None else search
        self.records = RECORDS if records is None else records
        self.missing = missing
        self.fail = fail

    def __call__(self, url: str, params: dict | None = None):
        self.calls.append((url, dict(params or {})))
        if self.fail:
            raise NonprofitError("ProPublica is unreachable")
        if params:
            #: Never send a filter the API answers 500 for.
            self.assertNoBadFilter(params)
        if self.missing:
            raise NonprofitNotFound("ProPublica answered HTTP 404")
        if "organizations/" in url:
            ein = url.split("organizations/")[1].split(".json")[0]
            if ein not in self.records:
                raise NonprofitNotFound("ProPublica answered HTTP 404")
            return json.dumps(self.records[ein])
        wanted = str((params or {}).get("q") or "").lower()
        if "civitan" in wanted:
            #: The search ranks its own best match first, so a different query ranks a
            #: different organisation first.
            return json.dumps({**self.search, "total_results": 1, "num_pages": 1,
                               "organizations": [self.search["organizations"][1]]})
        return json.dumps(self.search)

    @staticmethod
    def assertNoBadFilter(params: dict):
        for key in ("state", "ntee", "ntee_code"):
            if key in params:
                raise AssertionError(f"{key} answers HTTP 500 and must never be sent")


def make_data(**kw):
    feed = FakeFeeds(**kw)
    return NonprofitData(fetch=feed), feed


class HelperTests(unittest.TestCase):
    def test_an_ein_with_or_without_its_dash(self):
        self.assertEqual(ein_from_text("EIN 53-0196605"), RED_CROSS_EIN)
        self.assertEqual(ein_from_text("charity 530196605 please"), RED_CROSS_EIN)
        self.assertIsNone(ein_from_text("the Red Cross"))

    def test_a_charity_name_out_of_a_question(self):
        self.assertEqual(names_from_text("what does the Red Cross report as revenue?"),
                         ["Red Cross"])
        self.assertEqual(names_from_text("which charities are named Habitat for Humanity?"),
                         ["Habitat for Humanity"])
        self.assertEqual(names_from_text("compare the Red Cross and Habitat for Humanity"),
                         ["Red Cross", "Habitat for Humanity"])
        self.assertEqual(names_from_text('the charity "Feeding America" please'), ["Feeding America"])
        self.assertEqual(name_from_text('the charity "Feeding America"'), "Feeding America")

    def test_a_median(self):
        self.assertEqual(median([1, 2, 3]), 2)
        self.assertEqual(median([1, 2, 3, 4]), 2.5)
        self.assertIsNone(median([]))


class ReadTests(unittest.TestCase):
    def test_a_name_search_uses_page_zero(self):
        data, feed = make_data()
        found = data.search("red cross")
        self.assertEqual(found["total"], 190)
        self.assertEqual(found["page"], 0)
        self.assertEqual(found["num_pages"], 8)
        self.assertEqual(found["rows"][0]["name"], "American National Red Cross")
        self.assertEqual(found["rows"][0]["ein"], RED_CROSS_EIN)
        #: The pages are zero-based, so the first page asks without a page parameter at
        #: all. Sending page=1 for a one-page answer returns nothing at all.
        self.assertNotIn("page", feed.calls[-1][1])

    def test_one_charitys_own_record(self):
        data, _feed = make_data()
        row = data.organization(RED_CROSS_EIN)
        self.assertEqual(row["name"], "American National Red Cross")
        self.assertEqual(row["revenue"], 3916983933.0)
        self.assertEqual(row["income"], 4608946426.0)
        self.assertEqual(row["assets"], 5052941623.0)
        self.assertEqual(row["tax_period"], "2025-06-01")
        self.assertEqual(row["ruling_date"], "1938-12-01")
        self.assertEqual(row["ntee_code"], "P210")
        self.assertEqual(row["url"],
                         f"https://projects.propublica.org/nonprofits/organizations/{RED_CROSS_EIN}")

    def test_a_blank_amount_is_not_a_zero(self):
        data, _feed = make_data()
        row = data.organization("204801016")
        self.assertEqual(row["revenue"], 0.0)
        self.assertIsNone(row["income"])

    def test_a_name_becomes_the_best_matching_ein(self):
        data, _feed = make_data()
        self.assertEqual(data.find("American National Red Cross")["ein"], RED_CROSS_EIN)

    def test_a_comparison_reads_each_charity(self):
        data, feed = make_data()
        found = data.compare(["Red Cross Civitans", "American National Red Cross"])
        self.assertEqual(len(found["rows"]), 2)
        self.assertEqual(found["rows"][0]["revenue"], 11554.0)
        self.assertEqual(found["rows"][1]["revenue"], 3916983933.0)
        self.assertEqual(found["rows"][1]["tax_period"], "2025-06-01")
        #: Two searches and two detail reads: the name has to become an EIN first, and the
        #: amounts are not in the search.
        self.assertEqual(len(feed.calls), 4)

    def test_a_peer_read_asks_for_one_record_each(self):
        data, feed = make_data()
        found = data.peers("red cross", max_organizations=3, focus_ein=RED_CROSS_EIN)
        self.assertEqual(found["read"], 3)
        self.assertEqual(found["search_total"], 190)
        self.assertEqual(found["focus_ein"], RED_CROSS_EIN)
        self.assertEqual(len(feed.calls), 4)

    def test_a_charity_that_is_not_there(self):
        data, _feed = make_data(search={"total_results": 0, "num_pages": 0, "cur_page": 0,
                                        "organizations": []})
        with self.assertRaises(NonprofitNotFound):
            data.find("Nothing Here")
        data, _feed = make_data(missing=True)
        with self.assertRaises(NonprofitNotFound):
            data.organization(RED_CROSS_EIN)

    def test_bad_arguments(self):
        data, _feed = make_data()
        with self.assertRaises(ValueError):
            data.search("   ")
        with self.assertRaises(ValueError):
            data.compare(["only one"])
        with self.assertRaises(ValueError):
            data.compare(["a", "b", "c", "d", "e"])

    def test_a_dead_api(self):
        data, _feed = make_data(fail=True)
        with self.assertRaises(NonprofitError):
            data.search("red cross")


class RouteTests(unittest.TestCase):
    def test_one_charitys_numbers(self):
        self.assertEqual(route("what does the Red Cross report as revenue?"),
                         ("nonprofit-organization", {"name": "Red Cross"}))
        self.assertEqual(route("what is charity EIN 53-0196605 income?"),
                         ("nonprofit-organization", {"ein": RED_CROSS_EIN}))

    def test_a_search(self):
        skill, params = route("which charities are named Habitat for Humanity?")
        self.assertEqual(skill, "nonprofit-search")
        self.assertEqual(params["name"], "Habitat for Humanity")
        self.assertEqual(route("show me the top 5 charities named Feeding America")[1]["limit"], 5)

    def test_a_comparison(self):
        self.assertEqual(route("compare the Red Cross and Habitat for Humanity"),
                         ("nonprofit-compare", {"names": ["Red Cross", "Habitat for Humanity"]}))


    def test_a_question_that_is_not_about_a_charity(self):
        for text in ("tell me a joke", "how deep is the water table in Kansas?",
                     "what can you do?", ""):
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
        from agent import NonprofitAgent

        agent_conn, client_conn = connected_pair()
        data, feed = make_data(**kw)
        agent = NonprofitAgent(agent_conn, data)
        threading.Thread(target=agent_conn.serve, daemon=True).start()
        client = AcpClient(connection=client_conn, permission=permission)
        client.start()
        client.initialize()
        session_id = client.new_session(cwd="/tmp")
        try:
            return client.prompt(text, session_id), client, feed
        finally:
            client.stop()

    def test_a_free_answer_reports_real_amounts(self):
        result, client, _ = self.turn("what does the Red Cross report as revenue?")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertEqual(len(client.permission_requests), 1)
        self.assertIn("American National Red Cross", result["text"])
        self.assertIn("revenue: $3,916,983,933.00", result["text"])
        self.assertIn("income: $4,608,946,426.00", result["text"])
        self.assertIn("assets: $5,052,941,623.00", result["text"])
        self.assertIn("tax period: 2025-06-01", result["text"])
        self.assertIn("IRS ruling date: 1938-12-01", result["text"])
        self.assertIn("Business Master File", result["text"])

    def test_a_name_that_matches_many_organisations_says_so(self):
        result, _, _ = self.turn("what does the Red Cross report as revenue?")
        #: "Red Cross" matches 190 organisations and the API's own ranking puts a local
        #: chapter first, so the answer has to name the others rather than quietly pick.
        self.assertIn("ProPublica matches 190 organisation(s) for that name", result["text"])
        self.assertIn("Red Cross Civitans (EIN 581771391", result["text"])
        self.assertIn("in case you meant a different one", result["text"])

    def test_a_reported_zero_is_not_a_blank(self):
        result, _, _ = self.turn("what is charity EIN 204801016's revenue?")
        self.assertIn("revenue: $0.00 (reported as zero)", result["text"])
        self.assertIn("income: not reported", result["text"])

    def test_a_search_answer(self):
        result, _, _ = self.turn("which charities are named Habitat for Humanity?")
        self.assertIn("match 'Habitat for Humanity'", result["text"])
        self.assertIn("EIN 530196605", result["text"])
        self.assertIn("NTEE P210", result["text"])

    def test_a_comparison_answer_says_the_periods_differ(self):
        result, _, _ = self.turn("compare the Red Cross and Habitat for Humanity")
        self.assertIn("2 charities, as the IRS Business Master File has them", result["text"])
        self.assertIn("these are different tax periods", result["text"])

    def test_help_asks_nothing(self):
        result, client, feed = self.turn("what can you do?")
        self.assertIn("Nonprofit", result["text"])
        self.assertEqual(client.permission_requests, [])
        self.assertEqual(feed.calls, [])

    def test_permission_denied(self):
        result, _, _ = self.turn("what does the Red Cross report as revenue?",
                                 permission="reject")
        self.assertEqual(result["stopReason"], STOP_REFUSAL)

    def test_a_dead_api(self):
        result, _, _ = self.turn("what does the Red Cross report as revenue?", fail=True)
        self.assertIn("I could not read ProPublica's charity data", result["text"])


# ---------------------------------------------------------------------------
#
# ---------------------------------------------------------------------------

#: What `nonprofit_peer_standing` answers for a 12-organisation read.
STANDING_DATA = {
    "query": "red cross",
    "focus_name": "American National Red Cross",
    "focus_ein": RED_CROSS_EIN,
    "search_total": 190,
    "read": 12,
    "asked_for": 12,
    "sampled": True,
    "min_revenue": 0,
    "median_revenue": 29809.0,
    "max_revenue": 3916983933.0,
    "rank": 1,
    "ranked_count": 11,
    "percentile": 100,
    "rows": [
        {"ein": RED_CROSS_EIN, "name": "American National Red Cross",
         "revenue": 3916983933.0, "tax_period": "2025-06-01"},
        {"ein": "581771391", "name": "Red Cross Civitans", "revenue": 11554.0,
         "tax_period": "2025-09-01"},
        {"ein": "204801016", "name": "881458 American Red Cross Club", "revenue": 0,
         "tax_period": "2024-12-01"},
    ],
    "note": "12 of the 190 organisations this search returned were read in full, because each "
            "one needs its own request; the rest were not read",
    "source": "ProPublica Nonprofit Explorer (IRS Business Master File)",
}

#: The exact refusal the gateway sends for a key it will not accept.






if __name__ == "__main__":
    unittest.main(verbosity=2)
