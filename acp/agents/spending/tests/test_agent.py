
from __future__ import annotations

import datetime
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
from data import (SpendingData, SpendingError, SpendingNotFound,  # noqa: E402
                  current_fiscal_year, fiscal_year_dates, fiscal_year_from_text,
                  last_full_fiscal_year, money, sum_money)

AWARDS = {"spending_level": "awards", "limit": 2, "page_metadata": {
    "page": 1, "hasNext": True, "last_record_unique_id": 306489269,
    "last_record_sort_value": "220454859.34"},
    "messages": ["For searches, time period start and end dates are currently limited to an "
                 "earliest date of 2007-10-01."],
    "results": [
        {"internal_id": 1, "Award ID": "HQ072716C0001", "Recipient Name": "GLOBALFOUNDRIES U.S. 2 LLC",
         "Award Amount": "816516427.74", "Awarding Agency": "Department of Defense",
         "Awarding Sub Agency": "Defense Microelectronics Activity",
         "Description": "TRUSTED FOUNDRY ACCESS 2 - AWARD OF BASE TRANSITION CONTRACT",
         "Start Date": "2016-07-16", "End Date": "2027-09-30", "Award Type": "B",
         "Place of Performance State Code": "VT", "Recipient Location State Code": "DE",
         "generated_internal_id": "CONT_AWD_HQ072716C0001_0001_-None-_-None-"},
        {"internal_id": 2, "Award ID": "47QTCA18D008Z", "Recipient Name": "LOCKHEED MARTIN CORP",
         "Award Amount": "48063737196.35", "Awarding Agency": "Department of Energy",
         "Awarding Sub Agency": "Department of Energy", "Description": "",
         "Start Date": "1993-10-15", "End Date": "2017-04-30", "Award Type": "A",
         "Place of Performance State Code": "NM", "Recipient Location State Code": "MD",
         "generated_internal_id": "CONT_AWD_47QTCA18D008Z_8900_-None-_-None-"},
    ]}

AGENCIES = {"results": [
    {"agency_id": 97, "toptier_code": "097", "abbreviation": "DOD",
     "agency_name": "Department of Defense", "active_fy": "2026", "active_fq": "4",
     "outlay_amount": "1400000000000.00", "obligated_amount": "1429515155907.09",
     "budget_authority_amount": "2500000000000.00"},
    {"agency_id": 75, "toptier_code": "075", "abbreviation": "HHS",
     "agency_name": "Department of Health and Human Services", "active_fy": "2026",
     "active_fq": "4", "outlay_amount": "2600000000000.00",
     "obligated_amount": "2674621212855.86", "budget_authority_amount": "3000000000000.00"},
    {"agency_id": 0, "toptier_code": "", "abbreviation": None, "agency_name": "  ",
     "active_fy": "2026", "active_fq": "4", "outlay_amount": None, "obligated_amount": None,
     "budget_authority_amount": None},
]}


class FakeFeeds:
    def __init__(self, awards=None, agencies=None, empty=False, fail=False):
        self.calls: list[tuple] = []
        self.awards = AWARDS if awards is None else awards
        self.agencies = AGENCIES if agencies is None else agencies
        self.empty = empty
        self.fail = fail

    def __call__(self, url: str, payload):
        self.calls.append((url, dict(payload or {})))
        if self.fail:
            raise SpendingError("USAspending is unreachable")
        if self.empty:
            return json.dumps({"results": []})
        if "toptier_agencies" in url:
            return json.dumps(self.agencies)
        return json.dumps(self.awards)


def make_data(**kw):
    feed = FakeFeeds(**kw)
    return SpendingData(fetch=feed), feed


class HelperTests(unittest.TestCase):
    def test_a_fiscal_year_is_an_october_to_september_window(self):
        self.assertEqual(fiscal_year_dates(2024), ("2023-10-01", "2024-09-30"))
        self.assertEqual(fiscal_year_dates(2025), ("2024-10-01", "2025-09-30"))

    def test_the_fiscal_year_rolls_over_in_october(self):
        self.assertEqual(current_fiscal_year(datetime.date(2026, 9, 30)), 2026)
        self.assertEqual(current_fiscal_year(datetime.date(2026, 10, 1)), 2027)
        #: The default window is the last year that has actually ended.
        self.assertEqual(last_full_fiscal_year(datetime.date(2026, 9, 28)), 2025)

    def test_a_year_in_a_question(self):
        self.assertEqual(fiscal_year_from_text("in 2024"), 2024)
        self.assertEqual(fiscal_year_from_text("FY2024"), 2024)
        self.assertIsNone(fiscal_year_from_text("in 2099"))
        self.assertIsNone(fiscal_year_from_text("no year here"))

    def test_money_is_parsed_and_missing_is_not_zero(self):
        self.assertEqual(money("1,234.50"), 1234.50)
        self.assertEqual(money("$99"), 99.0)
        self.assertIsNone(money(""))
        self.assertIsNone(money(None))
        self.assertIsNone(money("not a number"))
        self.assertEqual(sum_money([1.0, None, 2.0]), 3.0)
        self.assertEqual(sum_money([]), 0)


class ReadTests(unittest.TestCase):
    def test_an_award_search_is_a_post_with_the_filters_that_work(self):
        data, feed = make_data()
        found = data.awards(2025, keyword="semiconductor", limit=2)
        url, body = feed.calls[-1]
        self.assertTrue(url.endswith("search/spending_by_award/"))
        self.assertEqual(body["filters"]["time_period"],
                         [{"start_date": "2024-10-01", "end_date": "2025-09-30"}])
        self.assertEqual(body["filters"]["award_type_codes"], ["A", "B", "C", "D"])
        self.assertEqual(body["filters"]["keywords"], ["semiconductor"])
        self.assertEqual(body["sort"], "Award Amount")
        self.assertEqual(body["order"], "desc")
        self.assertNotIn("recipient_search_text", body["filters"])
        self.assertEqual(found["count"], 2)
        self.assertTrue(found["more_pages"])
        self.assertIn("2007-10-01", found["messages"][0])

    def test_an_award_row(self):
        data, _feed = make_data()
        row = data.awards(2025, keyword="semiconductor", limit=2)["rows"][0]
        self.assertEqual(row["award_id"], "HQ072716C0001")
        self.assertEqual(row["amount"], 816516427.74)
        self.assertEqual(row["agency"], "Department of Defense")
        self.assertEqual(row["place_state"], "VT")
        self.assertIn("CONT_AWD_HQ072716C0001", row["url"])
        #: A description over 200 characters is cut, not printed whole.
        self.assertLessEqual(len(row["description"] or ""), 200)

    def test_a_recipient_search_sums_the_rows_it_shows(self):
        data, feed = make_data()
        found = data.recipient_awards("Microsoft", 2025, limit=2)
        self.assertEqual(feed.calls[-1][1]["filters"]["recipient_search_text"], ["Microsoft"])
        self.assertEqual(found["total_shown"], 48880253624.09)
        self.assertEqual(found["window"], {"start": "2024-10-01", "end": "2025-09-30"})

    def test_the_agency_table_is_sorted_and_blank_rows_dropped(self):
        data, feed = make_data()
        directory = data.agencies()
        self.assertEqual(directory["count"], 2)
        #: HHS out-obligates Defense, so it comes first even though the payload is not sorted.
        self.assertEqual(directory["agencies"][0]["name"],
                         "Department of Health and Human Services")
        self.assertEqual(directory["agencies"][1]["obligated"], 1429515155907.09)
        self.assertIn("toptier_agencies", feed.calls[-1][0])

    def test_one_agency(self):
        data, _feed = make_data()
        agency = data.agency("Department of Defense")
        self.assertEqual(agency["name"], "Department of Defense")
        self.assertEqual(agency["abbreviation"], "DOD")
        self.assertEqual(agency["obligated"], 1429515155907.09)
        self.assertEqual(agency["outlay"], 1400000000000.00)
        self.assertEqual(agency["fiscal_year"], "2026")

    def test_an_agency_that_is_not_in_the_table(self):
        data, _feed = make_data()
        with self.assertRaises(SpendingNotFound):
            data.agency("Department of Unicorns")
        with self.assertRaises(ValueError):
            data.agency("  ")

    def test_the_largest_awards_of_a_year(self):
        data, feed = make_data()
        found = data.top_awards(2025, limit=2)
        self.assertNotIn("keywords", feed.calls[-1][1]["filters"])
        self.assertNotIn("recipient_search_text", feed.calls[-1][1]["filters"])
        self.assertEqual(found["rows"][0]["amount"], 816516427.74)
        self.assertEqual(found["read"], 2)

    def test_a_state_filters_the_rows_that_came_back(self):
        data, _feed = make_data()
        found = data.top_awards(2025, limit=2, state="md")
        #: Case-insensitive, and it matches the place of performance or the recipient state.
        #: VT/NM is where the work happens, DE/MD is where the recipient sits.
        self.assertEqual([row["award_id"] for row in found["rows"]], ["47QTCA18D008Z"])
        self.assertEqual(found["state"], "MD")

    def test_a_state_with_no_row_in_the_largest_awards_says_so(self):
        data, _feed = make_data()
        with self.assertRaises(SpendingNotFound):
            data.top_awards(2025, limit=2, state="ZZ")

    def test_paging_follows_has_next(self):
        data, feed = make_data()
        found = data.award_pages("Microsoft", 2025, max_awards=250)
        #: hasNext is true for every page here, so the reader stops at its own page cap of
        #: five rather than paging forever, and says there are more.
        self.assertEqual(found["pages_read"], 5)
        self.assertEqual(len(found["rows"]), 10)
        self.assertTrue(found["more_pages"])
        self.assertEqual(feed.calls[-1][1]["page"], 5)
        self.assertEqual(feed.calls[-1][1]["limit"], 100)

    def test_paging_stops_when_there_is_no_next_page(self):
        data, _feed = make_data(awards={**AWARDS, "page_metadata": {"page": 1, "hasNext": False}})
        found = data.award_pages("Microsoft", 2025, max_awards=250)
        self.assertEqual(found["pages_read"], 1)
        self.assertEqual(len(found["rows"]), 2)
        self.assertFalse(found["more_pages"])

    def test_a_dead_api_and_a_bad_argument(self):
        data, _feed = make_data(fail=True)
        with self.assertRaises(SpendingError):
            data.awards(2025, keyword="cloud")
        data, _feed = make_data()
        with self.assertRaises(ValueError):
            data.awards(2025)
        with self.assertRaises(ValueError):
            data.awards(1800, keyword="cloud")
        data, _feed = make_data(empty=True)
        with self.assertRaises(SpendingNotFound):
            data.awards(2025, keyword="nothing matches this")


class RouteTests(unittest.TestCase):
    def test_a_topic_question(self):
        self.assertEqual(route("what did the federal government spend on semiconductors in 2024?"),
                         ("spending-awards", {"keyword": "semiconductors", "fiscal_year": 2024,
                                              "limit": 10}))
        self.assertEqual(route("show me the top 5 awards for cloud computing")[1]["limit"], 5)

    def test_a_recipient_question(self):
        self.assertEqual(route("biggest awards to Lockheed Martin"),
                         ("spending-recipient", {"recipient": "Lockheed Martin",
                                                 "fiscal_year": last_full_fiscal_year(),
                                                 "limit": 10}))
        self.assertEqual(route("how much federal money went to Boeing?")[1]["recipient"], "Boeing")
        self.assertEqual(route("how much did Acme Corp get in 2023?")[1]["fiscal_year"], 2023)

    def test_an_agency_is_not_a_recipient(self):
        skill, params = route("how much did the Department of Defense obligate?")
        self.assertEqual(skill, "spending-agency")
        self.assertEqual(params["agency"], "Department of Defense")
        self.assertEqual(route("how much did NASA obligate?")[1]["agency"], "NASA")
        #: "of Defense" inside the agency's own name is never a search word.
        self.assertNotIn("keyword", params)

    def test_the_agency_table(self):
        self.assertEqual(route("which agencies obligate the most money?"),
                         ("spending-agencies", {}))
        self.assertEqual(route("which agency gets the most grant money?"),
                         ("spending-agencies", {}))

    def test_the_largest_awards(self):
        self.assertEqual(route("show me the 20 biggest contracts in 2023"),
                         ("spending-top", {"fiscal_year": 2023, "limit": 20, "state": None,
                                           "state_name": None}))
        skill, params = route("biggest awards performed in Texas")
        self.assertEqual(skill, "spending-top")
        #: The API reports states as two-letter codes, so the code is what travels.
        self.assertEqual(params["state"], "TX")
        self.assertEqual(params["state_name"], "Texas")


    def test_a_question_that_is_not_about_money(self):
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
        from agent import SpendingAgent

        agent_conn, client_conn = connected_pair()
        data, feed = make_data(**kw)
        agent = SpendingAgent(agent_conn, data)
        threading.Thread(target=agent_conn.serve, daemon=True).start()
        client = AcpClient(connection=client_conn, permission=permission)
        client.start()
        client.initialize()
        session_id = client.new_session(cwd="/tmp")
        try:
            return client.prompt(text, session_id), client, feed
        finally:
            client.stop()

    def test_a_free_answer_reports_real_awards(self):
        result, client, _ = self.turn("what did the government spend on semiconductors in 2024?")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertEqual(len(client.permission_requests), 1)
        self.assertIn("award(s) matching 'semiconductors' in federal fiscal year 2024",
                      result["text"])
        self.assertIn("$816,516,427.74 - GLOBALFOUNDRIES U.S. 2 LLC", result["text"])
        self.assertIn("Department of Defense, Defense Microelectronics Activity", result["text"])
        self.assertIn("performed in VT", result["text"])
        self.assertIn("USAspending has more pages", result["text"])
        self.assertIn("fiscal year runs 1 October", result["text"])

    def test_a_recipient_answer_says_the_total_is_only_the_rows_shown(self):
        result, _, _ = self.turn("biggest awards to Lockheed Martin")
        self.assertIn("biggest federal awards to Lockheed Martin in fiscal year", result["text"])
        self.assertIn("these 2 award(s) add up to $48,880,253,624.09", result["text"])
        self.assertIn("not the recipient's whole federal total", result["text"])

    def test_an_agency_answer(self):
        result, _, _ = self.turn("how much did the Department of Defense obligate?")
        self.assertIn("Department of Defense", result["text"])
        self.assertIn("obligations: $1,429,515,155,907.09", result["text"])
        self.assertIn("outlays (cash already paid out): $1,400,000,000,000.00", result["text"])
        self.assertIn("fiscal year: 2026, quarter 4", result["text"])

    def test_the_largest_awards_answer(self):
        result, _, _ = self.turn("show me the 20 biggest contracts in 2023")
        self.assertIn("the 2 largest federal awards of fiscal year 2023", result["text"])
        self.assertIn("they add up to $48,880,253,624.09", result["text"])
        self.assertIn("there are more pages of awards after these", result["text"])

    def test_a_state_answer_says_how_it_was_filtered(self):
        result, _, _ = self.turn("biggest awards performed in Texas", empty=True)
        self.assertIn("I could not read USAspending", result["text"])
        result, _, _ = self.turn("biggest awards performed in Delaware")
        self.assertIn("performed in or awarded to Delaware", result["text"])
        self.assertIn("no state filter", result["text"])

    def test_help_asks_nothing(self):
        result, client, feed = self.turn("what can you do?")
        self.assertIn("USAspending", result["text"])
        self.assertEqual(client.permission_requests, [])
        self.assertEqual(feed.calls, [])

    def test_permission_denied(self):
        result, _, _ = self.turn("biggest awards to Lockheed Martin", permission="reject")
        self.assertEqual(result["stopReason"], STOP_REFUSAL)

    def test_a_dead_api(self):
        result, _, _ = self.turn("biggest awards to Lockheed Martin", fail=True)
        self.assertIn("I could not read USAspending", result["text"])


# ---------------------------------------------------------------------------
#
# ---------------------------------------------------------------------------

#: What `spending_recipient_profile` answers for a 300-award read.
PROFILE_DATA = {
    "recipient": "MICROSOFT CORPORATION",
    "fiscal_year": 2025,
    "awards_read": 300,
    "awards_asked_for": 300,
    "more_awards": False,
    "pages_read": 3,
    "total_obligated": 553686952.17,
    "median_award": 250000.0,
    "largest_award": {"amount": 220454859.34, "agency": "Department of Defense",
                      "award_id": "47QTCA18D008Z"},
    "largest_share_pct": 39.82,
    "distinct_agencies": 6,
    "agencies": [
        {"agency": "Department of Defense", "amount": 420000000.0, "awards": 210,
         "share_pct": 75.85},
        {"agency": "Department of Energy", "amount": 90000000.0, "awards": 45,
         "share_pct": 16.27},
    ],
    "note": "300 of the awards USAspending returned were read; this is the sum of those, "
            "not every federal dollar this recipient has",
    "source": "USAspending (api.usaspending.gov)",
}

#: The exact refusal the gateway sends for a key it will not accept.






if __name__ == "__main__":
    unittest.main(verbosity=2)
