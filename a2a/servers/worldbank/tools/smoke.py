#!/usr/bin/env python3
"""End-to-end smoke test for the World Bank Indicators A2A server.

    python3 servers/worldbank/server.py --port 8852
    python3 servers/worldbank/tools/smoke.py --base http://127.0.0.1:8852
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

SERVER_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = SERVER_DIR.parents[1]
for path in (str(SERVER_DIR), str(REPO_ROOT)):
    if path not in sys.path:
        sys.path.insert(0, path)

from a2a_kit.smoke import Smoke  # noqa: E402  (path setup must come first)

DATASET = "api.worldbank.org/v2/country"
INDICATOR_DATASET = "api.worldbank.org/v2/indicator"
GDP_PC = "NY.GDP.PCAP.CD"


def artifact_data(response: dict) -> dict:
    return ((response.get("artifacts") or [{}])[-1].get("parts") or [{}])[0].get("data", {})


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="smoke-test the World Bank Indicators A2A server")
    parser.add_argument("--base", default="http://127.0.0.1:8852")
    args = parser.parse_args(argv)

    smoke = Smoke(args.base)
    if not smoke.card_checks(
        "World Bank Indicators Agent",
        ["indicator-value", "country-compare", "indicator-search", "country-info", "indicator-trend"],
    ):
        return 1

    # Live: one indicator for one country, named in words rather than by code.
    value = smoke.rpc(
        "message/send",
        {"message": smoke.user_message(f"what is {GDP_PC} in Norway for 2023?")},
    ).get("result", {})
    value_data = artifact_data(value)
    observations = value_data.get("observations") or []
    smoke.check("indicator-value completes", value.get("status", {}).get("state") == "completed")
    smoke.check("a country written as a name was resolved to a code",
                value_data.get("countries") == ["NOR"], str(value_data.get("countries")))
    smoke.check("the value came back", bool(observations), str(len(observations)))
    smoke.check("the indicator is the Bank's own",
                value_data.get("indicator_code") == GDP_PC
                and "GDP per capita" in str(value_data.get("indicator_name")),
                str(value_data.get("indicator_name")))
    smoke.check("the collection's last-updated date is reported",
                bool(value_data.get("last_updated")), str(value_data.get("last_updated")))
    smoke.check("every observation carries a year and a value",
                all(row.get("year") and row.get("value") is not None for row in observations),
                str([(row.get("year"), row.get("value")) for row in observations[:2]]))

    # Live: a year the Bank has published nothing for must not appear as a zero.
    ranged = smoke.rpc(
        "message/send",
        {"message": smoke.user_message(f"what is {GDP_PC} in Norway for 1960:1961?")},
    ).get("result", {})
    ranged_data = artifact_data(ranged)
    smoke.check("a year with no published value is left out, not zeroed",
                all(row.get("value") not in (0, None) for row in ranged_data.get("observations") or []),
                str([(row.get("year"), row.get("value")) for row in ranged_data.get("observations") or []]))

    # Live: the same indicator for several countries, ranked.
    compare = smoke.rpc(
        "message/send",
        {"message": smoke.user_message(f"compare {GDP_PC} for US, GB and DE in 2023")},
    ).get("result", {})
    compare_data = artifact_data(compare)
    smoke.check("country-compare completes", compare.get("status", {}).get("state") == "completed")
    smoke.check("all three countries were asked for", compare_data.get("countries") == ["US", "GB", "DE"],
                str(compare_data.get("countries")))
    smoke.check("one year of each country came back",
                len({row.get("year") for row in compare_data.get("observations") or []}) == 1,
                str([(row.get("country_iso3"), row.get("year")) for row in
                     compare_data.get("observations") or []]))
    smoke.check("the message ranks the countries", "  1. " in compare.get("status", {})
                .get("message", {}).get("parts", [{}])[0].get("text", ""))

    # Live: the catalogue search.
    search = smoke.rpc(
        "message/send", {"message": smoke.user_message("which indicator measures life expectancy?")}
    ).get("result", {})
    search_data = artifact_data(search)
    indicators = search_data.get("indicators") or []
    smoke.check("indicator-search completes", search.get("status", {}).get("state") == "completed")
    smoke.check("an indicator was found", bool(indicators), str(len(indicators)))
    smoke.check("the best match is ranked first",
                bool(indicators) and indicators[0].get("match_rank") == 0,
                str(indicators[0].get("match_rank")) if indicators else "no rows")
    smoke.check("the search hit the indicator's own name", search_data.get("name_hits", 0) >= 1,
                str(search_data.get("name_hits")))
    smoke.check("the catalogue size is reported", search_data.get("catalogue_size", 0) > 1000,
                str(search_data.get("catalogue_size")))
    smoke.check("indicator rows cite the catalogue dataset",
                (indicators[0] if indicators else {}).get("dataset") == INDICATOR_DATASET)

    # Live: a country reference, by name and by code.
    named = smoke.rpc(
        "message/send", {"message": smoke.user_message("what region is Kenya in?")}
    ).get("result", {})
    named_data = artifact_data(named)
    smoke.check("country-info completes for a name", named.get("status", {}).get("state") == "completed")
    smoke.check("the name was matched to a country", bool(named_data.get("country_matches")),
                str(named_data.get("count")))
    coded = smoke.rpc(
        "message/send", {"message": smoke.user_message('{"skill": "country-info", "country": "NO"}',
                                                      parts=[{"kind": "data",
                                                              "data": {"skill": "country-info",
                                                                       "country": "NO"}}])}
    ).get("result", {})
    coded_data = artifact_data(coded)
    smoke.check("a code gives that country's full record",
                (coded_data.get("country") or {}).get("name") == "Norway",
                str((coded_data.get("country") or {}).get("name")))
    smoke.check("the record has a region and a capital",
                bool((coded_data.get("country") or {}).get("region"))
                and bool((coded_data.get("country") or {}).get("capital_city")))

    # input-required: a series question with no indicator code.
    bare = smoke.rpc(
        "message/send", {"message": smoke.user_message("what is the GDP of Norway?")}
    ).get("result", {})
    smoke.check("a series question with no indicator code -> input-required",
                bare.get("status", {}).get("state") == "input-required")
    smoke.check("the prompt shows a real indicator code",
                GDP_PC in bare.get("status", {}).get("message", {}).get("parts", [{}])[0].get("text", ""))

    trend = smoke.rpc(
        "message/send",
        {"message": smoke.user_message(f"what is the trend in {GDP_PC} in Ireland since 2015?")},
    ).get("result", {})
    trend_data = artifact_data(trend)
    smoke.check("indicator-trend without a key -> completed",
                trend.get("status", {}).get("state") == "completed",
                str(trend.get("status", {}).get("state")))
    smoke.check("the Ireland name resolved before the gate",
                trend_data.get("countries") == "IRL", str(trend_data.get("countries")))

    # Streaming.
    events = smoke.stream("message/stream", {"message": smoke.user_message(
        f"what is {GDP_PC} in Japan for 2023?")})
    kinds = [event.get("kind") for event in events]
    smoke.check("stream starts with task + working status", kinds[:2] == ["task", "status-update"], str(kinds))
    smoke.check("stream includes artifact", "artifact-update" in kinds)
    smoke.check("stream ends final",
                bool(events[-1].get("final"))
                and events[-1].get("status", {}).get("state") == "completed")

    return smoke.finish()


if __name__ == "__main__":
    raise SystemExit(main())
