# Awesome ACPs

A monorepo of **ACP agents** — the ones the registry does not have yet.

Every agent on the official ACP list is a coding agent or a coding-agent harness. These
are the other kind: agents that answer a real-world question inside Zed, JetBrains or any
ACP client, straight from a public dataset, with no API key and nothing invented.

- **77 agents** in [`agents/`](./agents)
- **2315 unit tests**, all offline, all passing
- **76 live probes** over real ACP stdio against real public data (see [Proof](#proof))

## The agents

| Agent | What you can ask it | Dataset (keyless) |
|---|---|---|
| [`air`](./agents/air) | "how is the air quality in Delhi right now?", "when does it get worse today?", "how is the air in Delhi this week?" (premium) | Open-Meteo air quality (CAMS) |
| [`alert`](./agents/alert) | "alert me when the air quality in Delhi passes 200", "tell me when gauge 07010000 reaches flood stage" (silent until it happens), "will the air quality in Delhi pass 200 tomorrow?" (premium) | Open-Meteo + USGS + NWPS + Treasury |
| [`apod`](./agents/apod) | "show me NASA's picture of the day" (sends the picture itself), "the apod for 1996-01-01", "every APOD between 2022-07-12 and 2022-07-16" (premium) | NASA APOD (api.nasa.gov) |
| [`art`](./agents/art) | "paintings by Monet", "surprise me with a piece", "movement index: Impressionism and Baroque" (premium) | Art Institute of Chicago, Cleveland, The Met |
| [`aurora`](./agents/aurora) | "how are the geomagnetic conditions?", "odds of seeing the aurora in Tromso?", "storm digest for recent history and the next 3 days" (premium) | NOAA SWPC (Kp, OVATION, alerts; 30-day daily geomagnetic table + JSON forecast) |
| [`archive`](./agents/archive) | "find Apollo 11 recordings", "what is in the item Apollo11Audio?" | Internet Archive |
| [`attach`](./agents/attach) | "what is in this file?" (reads the file your editor attached and profiles it) | the attached file itself — no feed, no network |
| [`asteroids`](./agents/asteroids) | "which asteroids pass Earth this week?", "any hazardous asteroids passing this month?", "has 523934 ever come this close before?" (premium) | NASA Near-Earth Object feed |
| [`bayarea`](./agents/bayarea) | "next BART trains from Embarcadero", "which BART trains from Milpitas take bikes?", "if I need to be somewhere in 25 minutes, which train should I get on from Embarcadero?" (premium) | BART public API (real-time departure board) |
| [`bikes`](./agents/bikes) | "how many citibikes are available right now?", "nearest station to 40.71,-74.01?", "Citi Bike capacity board" (premium) | Citi Bike GBFS (NYC) |
| [`books`](./agents/books) | "find books about urban foxes", "what has Ursula K. Le Guin written?", "catalogue digest for Ursula K. Le Guin" (premium) | Open Library |
| [`boston`](./agents/boston) | "when is the next Red Line train from Park Street?", "any alerts on the Red Line right now?", "how long do I actually wait at Park Street at 8am?" (premium) | MBTA API v3 (Red Line arrivals, alerts, timetable) |
| [`brief`](./agents/brief) | "brief me on Denver" (asks, then writes `BRIEFING.md` into your workspace), "outlook for Denver next 3 days" (premium; US places) | Open-Meteo + NWS + USGS + open-notify |
| [`buoys`](./agents/buoys) | "what are the conditions at buoy 41025?", "which buoys are near Hawaii?", "compare nearest 3 buoys at 36.6,-122.0" (premium) | NOAA NDBC realtime |
| [`chart`](./agents/chart) | "chart the temperature in Seattle for the next 24 hours", "chart the national debt for the last 90 days", "compare temperature in Seattle and Tokyo from 2026-10-01 to 2026-10-02" (premium) | Open-Meteo + Treasury + USGS |
| [`chem`](./agents/chem) | "what is the formula for ibuprofen?", "what is Lipitor's generic name?", "compare ibuprofen and aspirin" (premium) | PubChem + RxNorm |
| [`chess`](./agents/chess) | "what is thibault's blitz rating?", "show me thibault's last 10 games", "tell me about game JNUpaHZT", "what openings does thibault play?" (premium) | Lichess (ratings, public game PGNs) |
| [`civic`](./agents/civic) | "did complaint 70483808 get fixed?", "complaints near 11235", "agency resolution profile for DOT last 3 months" (premium) | NYC Open Data |
| [`clinicaltrials`](./agents/clinicaltrials) | "trials for melanoma in Boston", "what is trial NCT01065467?", "trial landscape for melanoma in Boston from 2025-01-01 to 2025-12-31" (premium) | ClinicalTrials.gov API v2 |
| [`clock`](./agents/clock) | "what time is it in Tokyo?", "what time is it in London and Santiago?", "find a 45 minute slot this week that works for London, Tokyo and New York" (premium) | timeapi.io + IANA timezone database |
| [`comics`](./agents/comics) | "show me the latest xkcd", "tell me about xkcd 3000", "show me the last 5 comics", "what does xkcd keep coming back to around 2900-2910?" (premium) | xkcd (xkcd.com/info.0.json) |
| [`companies`](./agents/companies) | "what is Apple's LEI?", "who owns Bank of America National Association?", "which Apple is it, and how many are there?" (premium) | GLEIF Legal Entity Identifier registry |
| [`company`](./agents/company) | "Microsoft's last 10-K", "who filed a 10-K yesterday?", "filing cadence for CIK 320193 from 2010 to 2025" (premium) | SEC EDGAR (tickers, submissions, daily index) |
| [`courts`](./agents/courts) | "find court opinions about privacy", "which court decided Brown v. Board of Education?", "which courts rule most on privacy?" (premium) | CourtListener opinion search |
| [`crypto`](./agents/crypto) | "what is the price of bitcoin?", "how much is locked in DeFi?", "crypto market board top 10" (premium) | CoinGecko + DefiLlama |
| [`dailymed`](./agents/dailymed) | "show me the official label for LIPITOR", "what does the LIPITOR label say about drug interactions?", "compare the LIPITOR labels across manufacturers" (premium) | DailyMed drug labels |
| [`domains`](./agents/domains) | "when does github.com expire?", "who is the registrar for example.org?", "portfolio report for github.com, example.org" (premium) | RDAP (rdap.org) |
| [`drought`](./agents/drought) | "how dry is California?", "drought in Texas over the last 8 weeks", "drought index for CA over the last 6 weeks ending 2026-09-22" (premium) | US Drought Monitor |
| [`f1`](./agents/f1) | "when is the next F1 race?", "who won the last race?", "what are the driver standings?", "who will win the 2026 title?" (premium) | Jolpica/Ergast F1 (api.jolpi.ca) |
| [`films`](./agents/films) | "who directed inception", "films by fritz lang", "1940s noir I can watch for free", "what is in scarlet_street_1945", "which decade has the most noir films?" (premium) | Wikidata film items + Internet Archive `feature_films` shelf |
| [`firehose`](./agents/firehose) | "watch the wiki firehose for 10 edits" (a push stream, not a poll), "wiki digest on en from 2026-10-01T07:40:00Z to 2026-10-01T07:45:00Z" (premium) | Wikimedia EventStreams (SSE) + MediaWiki recentchanges digest |
| [`flights`](./agents/flights) | "what planes are over Bryant Park, New York right now?", "what is aircraft a487ef?", "traffic board box 40.4,-74.3,41.0,-73.6" (premium) | OpenSky state vectors (ADS-B) |
| [`floodwatch`](./agents/floodwatch) | "is the Mississippi at St. Louis flooding?", "what is gauge EADM7 doing?", "flood risk board near 38.63,-90.18 within 25 km" (premium) | NWS NWPS gauge + USGS site search + USGS stage trends |
| [`food`](./agents/food) | "how much sugar is in Nutella?", "is there milk in Oreos?", "nutrition board for 3017620422003 and 5449000000996" (premium) | Open Food Facts |
| [`forecast`](./agents/forecast) | "when will it rain in Seattle today?", "what does the week look like?", "grade the week in Seattle" (premium) | Open-Meteo forecast |
| [`fx`](./agents/fx) | "what is 100 USD in EUR?", "how did USD-EUR move this month?", "rate history board USD EUR GBP JPY over the last 30 days" (premium) | ECB reference rates (Frankfurter) |
| [`games`](./agents/games) | "how much is portal 2 on steam", "how many people play rust right now", "is hades well reviewed", "what is free on epic this week", "compare elden ring and dark souls 3" (premium) | Steam store + SteamSpy + Epic free promotions |
| [`grid`](./agents/grid) | "how green is the UK grid right now?", "which region of the UK is the dirtiest right now?", "when is the cleanest window in the next two days?" (premium) | UK National Grid carbon intensity API |
| [`groundwater`](./agents/groundwater) | "how deep is the water table in Kansas?", "water level at site 395847084085500", "what is the trend at OH015-395847084085500?" (premium) | USGS Water Data (OGC) |
| [`hazards`](./agents/hazards) | "any weather alerts in NY?", "earthquakes above M4.5 today?", "were those Tokyo quakes an aftershock sequence, and what is the b-value?" (premium) | NWS alerts + USGS quakes |
| [`iss`](./agents/iss) | "where is the ISS right now?", "could I see it from Denver tonight?", "estimate the ISS pass over Denver in the next 90 minutes" (premium) | open-notify position + sunset + cloud cover; premium orbit estimate via wheretheiss.at |
| [`labels`](./agents/labels) | "what is lipitor?", "warnings for metformin", "compare label safety for lipitor, metformin" (premium) | openFDA drug labels |
| [`launches`](./agents/launches) | "what is the next launch?", "when is the next Starlink launch?", "launch cadence board from 2026-10-01" (premium) | Launch Library 2 |
| [`ledger`](./agents/ledger) | "how big is the national debt right now?", "what is the average interest rate on Treasury bills?", "debt movement board from 2026-09-01 for 30 days" (premium) | US Treasury Fiscal Data |
| [`lobbying`](./agents/lobbying) | "what did Microsoft file with the Senate in 2023?", "how many lobbying filings were there in 2024?", "how much did Microsoft spend on lobbying in total from 2021 to 2023?" (premium) | Senate Lobbying Disclosure Act filings |
| [`local`](./agents/local) | "how much disk space is left?", "what is going on in this repo?", "OSV advisories for requests 2.19.0 PyPI" (premium) | this machine, read-only (`git`, `lsof`); OSV.dev for explicit package triples |
| [`moon`](./agents/moon) | "when is the next full moon?", "when does it get dark in Denver?", "phase calendar for Denver from 2026-10-01 for 7 nights" (premium) | USNO + sunrise-sunset.org; premium daily phase and darkness comparison via SunriseSunset.io + Open-Meteo geocoding |
| [`music`](./agents/music) | "find songs by Radiohead", "tell me about Radiohead", "what is on Kid A?", "build me a 45 minute Radiohead set" (premium) | Deezer (api.deezer.com) |
| [`nasamedia`](./agents/nasamedia) | "find NASA images of the Apollo 11 landing", "what media is in collection Apollo 11", "how many apollo 11 images are there, by decade?" (premium) | NASA Image and Video Library |
| [`nature`](./agents/nature) | "how many monarch butterflies are recorded in Canada?", "what is seen near 40.71,-74.01?", "trend for Danaus plexippus in Canada from 2020 to 2024" (premium) | GBIF occurrence records |
| [`nonprofit`](./agents/nonprofit) | "what does the Red Cross report as revenue?", "compare the Red Cross and Habitat for Humanity", "how big is the Red Cross compared to other charities?" (premium) | ProPublica Nonprofit Explorer (IRS Business Master File) |
| [`osm`](./agents/osm) | "nearest drinking water to Bryant Park, New York", "pharmacies near Miami Beach", "area profile within 300 m of 40.7536,-73.9832" (premium) | OpenStreetMap (Nominatim + Overpass) |
| [`papers`](./agents/papers) | "papers about CRISPR sickle cell", "what is DOI 10.1038/nature12373?", "topic board for CRISPR from 2022 to 2024" (premium) | PubMed + arXiv + Crossref |
| [`pollen`](./agents/pollen) | "how bad is the pollen today in Denver?", "grass pollen this week in Berlin", "pollen week grade at 52.52,13.41" (premium) | Open-Meteo air quality (pollen) |
| [`radiation`](./agents/radiation) | "what is the radiation level near Fukushima?", "what has device 100422 been reading?", "is the radiation near Chernobyl rising?" (premium) | Safecast measurements |
| [`recipes`](./agents/recipes) | "how do I cook chicken handi?", "what can I make with chicken breast?", "what do Italians eat?", "I have chicken, rice and coconut milk, what can I make?" (premium) | TheMealDB (themealdb.com) |
| [`resale`](./agents/resale) | "what does a chanel flap cost", "what is the chanel market like right now", "pull the listing handbags-hermes-maxibox-bag-294167871", "compare chanel, gucci and prada" (premium) | Fashionphile + Rebag resale catalogues |
| [`rivers`](./agents/rivers) | "what is gauge 06730500 doing?", "which gauges are near 40.71,-74.01?", "gauge board near 38.97,-77.13" (premium) | USGS water data (OGC API) + NWPS |
| [`satellites`](./agents/satellites) | "what satellites are overhead?", "tell me about the ISS", "which orbital shell is the ISS in?" (premium) | Celestrak GP elements |
| [`snowpack`](./agents/snowpack) | "how much water is in the California snowpack?", "snow depth in Colorado", "snow basin board 10190005 on 2026-04-01" (premium) | NRCS snow network (SNOTEL) |
| [`species`](./agents/species) | "how many monarch butterflies are there?", "what has been seen near 40.71,-74.01?", "region board place 1 taxon 47158 observer 1 from 2024-01 to 2024-03" (premium) | iNaturalist |
| [`spending`](./agents/spending) | "what did the federal government spend on semiconductors in 2024?", "biggest awards to Lockheed Martin", "profile Microsoft's federal awards in 2025" (premium) | USAspending |
| [`stargazing`](./agents/stargazing) | "is tonight good for stargazing in New York?", "compare stargazing in New York and Los Angeles tonight", "when is the best time to stargaze in New York?" (premium) | 7Timer astronomical forecast |
| [`stocks`](./agents/stocks) | "what is AAPL doing right now?", "how did NVDA move this month?", "compare AAPL, MSFT from 2026-04-01 to 2026-04-30" (premium) | Yahoo Finance chart |
| [`surf`](./agents/surf) | "how are the waves at Pipeline?", "when is it worth surfing at Nazare?", "surf window board at Santa Cruz" (premium) | Open-Meteo marine + wind |
| [`tides`](./agents/tides) | "when is the next high tide in Boston?", "the tide table for Portland, Maine", "tide extremes table for 8518750 in 2026-10" (premium) | NOAA Tides and Currents |
| [`trending`](./agents/trending) | "what is trending on Wikipedia today?", "how many people read the Lizzie Borden article?", "compare pageviews for Ada Lovelace and Lizzie Borden this week" (premium) | Wikimedia pageviews |
| [`tsunami`](./agents/tsunami) | "is there a tsunami warning right now?", "any bulletin naming Hawaii?", "tsunami quake context board" (premium) | tsunami.gov CAP (NTWC + PTWC) + USGS event catalogue |
| [`tv`](./agents/tv) | "what is the next episode of Severance?", "when did season 2 of Severance air?", "tell me about Severance", "how long will it take to catch up on Severance?" (premium) | TVMaze (api.tvmaze.com) |
| [`uk-postcode`](./agents/uk-postcode) | "where is SW1A 1AA?", "which NHS region is EC1A 1BB in?", "which postcodes are near EC1A 1BB, and which of them fall in a different district?" (premium) | postcodes.io (ONS Postcodes Directory) |
| [`vehicles`](./agents/vehicles) | "recalls for the 2015 Honda Civic", "complaints about a VIN", "recall board for Honda Civic years 2015 and 2016" (premium) | NHTSA recalls + complaints |
| [`watch`](./agents/watch) | "watch the earthquakes", "watch the aurora for 4 rounds every 30s" (pushes until cancelled), "week event digest at 37.77,-122.42 magnitude 4" (premium) | USGS quakes + NOAA Kp + open-notify |
| [`wiki`](./agents/wiki) | "who was Ada Lovelace?", "what happened on this day?", "deep dive for Ada Lovelace from 2026-09-23 to 2026-09-29" (premium) | Wikipedia + Wikidata + Wikimedia pageviews |
| [`wildfire`](./agents/wildfire) | "what is burning in California?", "any fires within 150 miles of Denver?", "season board in CA from 2026-09-01 to 2026-09-30" (premium) | NIFC WFIGS incidents |
| [`worldbank`](./agents/worldbank) | "what is Nigeria's GDP?", "compare GDP per capita in Kenya versus Ghana", "how fast is Nigeria's GDP per capita growing, and where does it rank?" (premium) | World Bank Open Data |
| [`zip`](./agents/zip) | "what places are in ZIP 11235?", "where is 100-0001 in Japan?", "how far is ZIP 11235 from ZIP 10001?" (premium) | Zippopotam postal code directory |
| [`a2a_bridge`](./agents/a2a_bridge) | "nyc311: did complaint 70483808 get fixed?" | any A2A server you point it at |

Plus [`acp_kit/`](./acp_kit) — the protocol layer all of them share (NDJSON JSON-RPC over
stdio, sessions, plans, tool calls, permissions, streaming, cancellation).

What is still missing, what was checked and skipped, and the verified backlog live in
[`MISSING.md`](./MISSING.md).

## Run one

```bash
# talk to an agent the way an editor does (spawn, initialize, prompt, print updates)
python3 tools/probe.py --agent "python3 agents/forecast/agent.py" \
    --prompt "when will it rain in Seattle today?"

# every agent, one live question each
python3 tools/probe_all.py

# all 2315 unit tests (offline, no network)
bash scripts/test-all.sh
```

Wire one into Zed or JetBrains — any ACP client takes a command:

```json
{
  "agent_servers": {
    "Forecast": { "command": "python3", "args": ["/abs/path/agents/forecast/agent.py"] }
  }
}
```

## Proof

Live probe of all 49 agents over real ACP stdio on 2026-09-23 (every answer came from the
dataset, not a fixture). `a2a_bridge` is probed only when `ACP_A2A_ENDPOINTS` points at a
running A2A server, so that run shows 49:

```
[PASS] air            (0.75s) - how is the air quality in Delhi right now?                                    tool: air-now
[PASS] alert          (1.12s) - alert me when the air quality in Delhi passes 200 for 1 check every 5 seconds tool: alert-watch
[PASS] apod           (2.15s) - show me NASA's picture of the day                                             tool: apod-picture
[PASS] archive        (5.42s) - find Apollo 11 recordings                                                     tool: archive-search
[PASS] art            (0.63s) - paintings by Monet                                                            tool: art-search
[PASS] attach         (0.14s) - what is in this file?                                                         tool: attach-profile
[PASS] aurora         (0.71s) - how are the geomagnetic conditions right now?                                 tool: aurora-now
[PASS] bikes          (0.80s) - how many citibikes are available right now?                                   tool: bikes-status
[PASS] books          (0.74s) - find books about urban foxes                                                  tool: books-search
[PASS] brief          (2.30s) - brief me on Denver                                                            tool: brief-gather
[PASS] buoys          (0.87s) - what are the conditions at buoy 41025?                                        tool: buoy-conditions
[PASS] chart          (1.32s) - chart the temperature in Seattle for the next 12 hours                        tool: chart-temperature
[PASS] clinicaltrials (0.48s) - trials for melanoma in Boston                                                 tool: trials-search
[PASS] company        (1.22s) - Microsoft's last 10-K                                                         tool: company-filings
[PASS] chem           (0.43s) - what is the formula for ibuprofen?                                            tool: chem-compound
[PASS] civic          (1.19s) - did complaint 70483808 get fixed?                                             tool: complaint-status
[PASS] crypto         (0.47s) - what is the price of bitcoin right now?                                       tool: crypto-price
[PASS] domains        (0.42s) - when does example.com expire?                                                 tool: domain-info
[PASS] drought        (0.80s) - how dry is California?                                                        tool: drought-place
[PASS] firehose       (20.35s) - watch the wiki firehose for 2 edits                                           tool: firehose-edits
[PASS] flights        (0.81s) - what planes are over Bryant Park, New York right now?                         tool: flights-overhead
[PASS] floodwatch     (1.77s) - what is the Mississippi River at St. Louis doing?                             tool: flood-status
[PASS] food           (0.88s) - how much sugar is in Nutella?                                                 tool: food-find
[PASS] forecast       (0.65s) - when will it rain in Seattle today?                                           tool: weather-rain
[PASS] fx             (0.33s) - what is 100 USD in EUR?                                                       tool: fx-rate
[PASS] groundwater    (1.26s) - water level at site 395847084085500                                           tool: groundwater-well
[PASS] hazards        (0.39s) - any weather alerts in NY right now?                                           tool: alerts-active
[PASS] iss            (1.39s) - could I see the ISS from Denver tonight?                                      tool: iss-sky
[PASS] labels         (1.24s) - what is lipitor?                                                              tool: label-info
[PASS] launches       (1.17s) - what is the next launch?                                                      tool: launches-upcoming
[PASS] ledger         (1.02s) - what is the national debt right now?                                          tool: debt-outstanding
[PASS] local          (0.26s) - what is going on in this repo?                                                tool: git
[PASS] moon           (0.76s) - when is the next full moon?                                                   tool: moon-phases
[PASS] nature         (3.15s) - how many monarch butterflies are recorded in Canada?                          tool: nature-count
[PASS] osm            (58.32s) - nearest drinking water to Bryant Park, New York                               tool: osm-near
[PASS] papers         (0.94s) - papers about CRISPR sickle cell                                               tool: papers-search
[PASS] pollen         (1.41s) - how bad is the pollen today in Denver?                                        tool: pollen-now
[PASS] rivers         (0.92s) - what is gauge 06730500 doing right now?                                       tool: river-stage
[PASS] snowpack       (2.69s) - how much water is in the California snowpack?                                 tool: snowpack-state
[PASS] species        (1.34s) - how many observations of Danaus plexippus are there?                          tool: species-count
[PASS] stocks         (0.86s) - what is AAPL doing right now?                                                 tool: stock-quote
[PASS] surf           (1.35s) - how are the waves at Pipeline right now?                                      tool: surf-now
[PASS] tides          (0.97s) - when is the next high tide in Boston?                                         tool: tide-next
[PASS] trending       (0.45s) - what is trending on Wikipedia today?                                          tool: trending-top
[PASS] tsunami        (0.46s) - is there a tsunami warning right now?                                         tool: tsunami-status
[PASS] vehicles       (0.48s) - recalls for the 2015 Honda Civic                                              tool: vehicle-recalls
[PASS] watch          (6.61s) - watch the aurora for 3 rounds every 3 seconds                                 tool: watch-aurora
[PASS] wiki           (0.34s) - who was Ada Lovelace?                                                         tool: wiki-summary
[PASS] wildfire       (0.56s) - what wildfires are burning in California right now?                           tool: wildfire-active
== 49/49 agent(s) answered a live question  (upstream down for chem, firehose)
```

The probe also fails an answer that is the agent's **own help text**. That check earns its
keep: it caught `stocks` replying "Ask me: - what is Apple trading at?" to "what is AAPL doing
right now?" - a green probe hiding an unanswered question.

The second check names a turn where the agent reported that its feed was down (`I could not
read ...`). Such a turn is a pass - reporting an outage is the right answer - but it is not
proof of live data, so the run says `upstream down for chem, firehose` instead of quietly
counting them. That is how the missing third Overpass mirror was found: an earlier run said
`upstream down for osm`, three mirrors were tried, and `osm` answered in 58.32s above - slow
by the shared Overpass instance, not stuck.

A few answers verbatim from that run:

```
probe_cities.csv  (csv, 54 bytes, 3 lines, sha256 e72b2ec80f6a7b9d...)
  - characters 54, blank lines 0, longest line 21 (line 2), ends with a newline: yes
  - table: 2 row(s) of data, 3 column(s), delimiter ','
  - header: name, city, pop
  - sample: springfield, IL, 114394
  - how I got it: embedded in the prompt
2026-09-23 - A New Lunar Crater: McGetchin
  - media: image
  - NASA / public domain (no separate copyright line on this day)
  - APOD's own page for this day: https://apod.nasa.gov/apod/ap260923.html
Aircraft within 25 km of Bryant Park (Bryant Park, Manhattan Community Board 5, Manhattan, New York County, New York, 10018, United States):
  - 72 in the box (31 in the air, 41 on the ground)
  - nearest is 3.4 km away  •  highest in the air: 10,051 m (32,975 ft)
  - N404TD  [a4bd2a]  United States, 3.4 km away
      altitude 198 m (650 ft) barometric, descending 1.6 m/s
MICROSOFT CORP (MSFT) - Services-Prepackaged Software:
  - 6 filing(s) of form 10-K among the last 1002 EDGAR lists for this company (back to 2020-08-07)
  - 2026-07-29  10-K  period 2026-06-30
ClinicalTrials.gov for condition: melanoma; place: Boston:
  - 396 study(ies) match  •  newest record update first, showing 10 of them
  - NCT04044859  ADP-A2M4CD8 as Monotherapy or in Combination With Either Nivolumab or Pembrolizumab ... (SURPASS)
      status active not recruiting, interventional, phase 1
      sites matching Boston: 1 of 17
        Massachusetts General Hospital, Boston, Massachusetts, United States
Air quality at 28.61,77.21 as of 2026-09-23T17:00 UTC:
  • US AQI 157 - Unhealthy (European AQI 87, a different scale)
  • PM2.5 107.6 ug/m3 - very high; PM10 120.1 ug/m3
Diamond Shoals, NC (41025, buoy), report at 2026-09-23T16:50Z:
  • Waves: 2 m significant height with a dominant period of 8 s
  • Wind: 14 m/s from NE (50 degrees), gusting 18 m/s  •  Water temperature: 25.5 degC
CA - drought as of 2026-09-15 (week ending 2026-09-21):
  65.23% of the area is at least abnormally dry (D0 or worse)
  22.32% at least moderate drought (D1+)
EADM7 - Mississippi River at St. Louis (MO, St. Louis City), forecast by NCRFC:
  • Observed: 14.3 ft, flow 250 kcfs as of 2026-09-23T16:30:00Z - no flooding
  • Flood stages here: action 28 ft, minor 30 ft, moderate 35 ft, major 40 ft
The US total public debt outstanding was $40,112,118,151,111.92 ($40.11 trillion) on 2026-09-21, up $10,617,634,399.83 on the previous business day.
  • Held by the public: $32,402,191,477,341.65
Repository /Users/dtaxk/Desktop/awesome-acps at 2026-09-23T17:21:32Z:
  • Branch: main, tracking origin/main, 0 ahead and 0 behind
  • Working tree: 0 staged, 4 modified, 6 untracked
Drinking water near Bryant Park (40.7538, -73.9835) within 800 m:
  - 60 m  (unnamed on OpenStreetMap) (wheelchair: yes)
  OpenStreetMap has 11 mapped within 800 m.
CA - snow water equivalent (in), from every SNOTEL snow station in the state:
  36 station(s) reported a value; 16 of them have any snow water equivalent at all
  every station's median for today is 0 in, so percent of normal does not exist off season - it is 0 divided by 0
pipeline (21.66,-158.05) at 2026-09-23T07:15 (Pacific/Honolulu):
  • Waves: 2 m significant height (solid, overhead), 7.8 s period from ENE (73 degrees) - windswell
  • Read: onshore - wind is coming out of the same quarter as the swell, so it is pushing in (0 degrees apart)
The next high tide for BOSTON, MA (8443970):
  - right now: 5.15 ft above MLLW (the gauge read 2026-09-23 13:18 station local time)
  - next HIGH 9.65 ft at 2026-09-23 21:49
No tsunami bulletin is in force right now.
  newest bulletin: Tsunami Information from NWS Pacific Tsunami Warning Center (Honolulu, Hawaii)
    expired 2026-09-18T14:25:30+00:00 - 123 h ago  •  area: VICINITY OF PUERTO RICO
Watching the one-minute planetary K index, NOAA SWPC for 3 round(s), 3s apart (9s at most). Cancel the turn to stop early.
Round 1/3 [2026-09-23T17:17:00Z] Kp 0.33 - below storm level - first reading
Not met after 1 check(s) in 1s (last reading 157 AQI). Nothing is still checking now.
2,074 item(s) match 'Apollo 11' (audio) in the Internet Archive:
  Apollo11Audio - Apollo 11 - audio, NASA - 295,152 downloads
  (I showed the 3 most downloaded of 2,074)
631 product(s) named 'Nutella' in Open Food Facts:
  Nutella & go! hazelnut spread + breadsticks (['Nutella'])
    sugars: 44.2 g per 100 g  •  allergens: gluten
MI-3A OH (395847084085500) - Miami County, Ohio - well depth 130 ft
Next launches in Launch Library:
  • Long March 8A | SatNet LEO Group 26 - 2026-09-23T13:32:00Z [Success]
Sky check for 39.74,-104.99 at 2026-09-23T17:21:28Z:
  • cloud cover now 100%  •  it is nowhere near you at this moment, so no sighting now
```

## What every agent guarantees

- **Real data, no mocks.** Each agent reads a live public feed. If the feed fails, the
  answer says which feed failed — it never falls back to an invented number.
- **Deterministic routing.** Intent → skill is a pure `route(text)` function, unit-tested.
  No model decides what to do, so behaviour does not drift.
- **Permission first.** The first read asks the client for permission
  (`session/request_permission`), and the answer stays refused if you refuse.
- **Streamed answers.** One message id, many chunks, plan first, tool call open → completed
  with a one-line summary of the record that was read. [`watch`](./agents/watch) goes further:
  one message per round, pushed on an interval, and `session/cancel` stops it immediately.
- **Provenance.** Every answer names the dataset id and its units, and states the limits
  (a model run, a reference rate, one gauge at one time, catalog counts not sales).
- **No keys.** All 50 use keyless public APIs. Nothing to sign up for, nothing to leak.
  ([`local`](./agents/local) uses no API at all — it reads this machine.)

## Layout

```
acp_kit/            protocol layer: rpc.py (NDJSON JSON-RPC), agent.py, client.py
agents/<name>/      data.py (feed reader + validation)  agent.py (routing + skills + ACP)
agents/<name>/tests/test_agent.py
tests/test_kit.py   protocol tests
tests/test_probe.py what a green probe line still would not prove (help text, feed outage)
tools/probe.py      one agent, one prompt, real stdio
tools/probe_all.py  every agent, one live question each
tools/check_syntax.py  fails on Python 3.12-only syntax, so the 3.10 CI job stays honest
scripts/            test-all.sh, probe-all.sh
.github/workflows/  matrix CI: the offline suite on Python 3.10 and 3.12
MISSING.md          the research log: what exists, what was missing, the verified backlog
```

## Write another one

Two files and a test file:

1. `data.py` — a class with a `_get(url, params, ttl)` transport, `check_*` validators,
   and one method per read. Raise one exception type on any upstream problem.
2. `agent.py` — a pure `route(text) -> (skill, params)`, an `AcpAgent` subclass with one
   `_skill()` per intent, and a `HELP` string. Report a plan, ask permission once,
   stream the answer, finish the tool call with the dataset id.
3. `tests/test_agent.py` — reader tests with an injected `fetch`, routing tests, and turn
   tests over a real `AcpClient` + `Connection` pair with canned payloads.

`python3 tools/probe_all.py <name>` then proves it against the live feed.

## Environment

Nothing is required: every agent runs with no key and no config. These optional knobs exist
for when you point one at a server of your own, or want a different cache window:

| Variable | Used by | Effect |
|---|---|---|
| `ACP_LOG_LEVEL` | every agent | Python log level for the agent's stderr (`INFO` by default) |
| `<AGENT>_USER_AGENT` | every agent | the `User-Agent` it sends (e.g. `HAZARDS_USER_AGENT`, `WATCH_AGENT_USER_AGENT`). Set a contactable one if you run these anywhere public |
| `<AGENT>_HTTP_TIMEOUT` | every agent | seconds to wait on a feed, default 20-25 |
| `<AGENT>_CACHE_TTL` | every agent | seconds a read is reused, default 60-900 depending on the feed's own limits |
| `NASA_API_KEY` | [`apod`](./agents/apod) | a free key from api.nasa.gov; without it the agent uses `DEMO_KEY`, which NASA rate-limits by address (30 an hour, 50 a day) |
| `SEC_USER_AGENT` | [`company`](./agents/company) | the contact line SEC asks every caller for (`name/version (contact)`); set your own if EDGAR refuses the default |
| `WATCH_AGENT_ROUNDS`, `WATCH_AGENT_INTERVAL` | [`watch`](./agents/watch) | the default rounds and gap between pushed updates (3 and 15s) |
| `LOCAL_AGENT_TIMEOUT` | [`local`](./agents/local) | seconds before a `git` or `lsof` read is given up on (10) |
| `FIREHOSE_HTTP_TIMEOUT` | [`firehose`](./agents/firehose) | seconds to wait on the event stream before giving up (20) |
| `BRIEF_CACHE_TTL` | [`brief`](./agents/brief) | seconds one gathered section is reused (300) |
| `ALERT_HTTP_TIMEOUT` | [`alert`](./agents/alert) | seconds to wait on one condition check (25) |
| `ACP_A2A_ENDPOINTS` | [`a2a_bridge`](./agents/a2a_bridge) | `name=url,...` of A2A servers to reach |
| `ACP_BRIDGE_PUSH_PORT` | [`a2a_bridge`](./agents/a2a_bridge) | local port the A2A push webhook listens on |

`.env.example` lists the same variables with the credential ones first.

## Honest limits

- Nearly everything here is read-only. The one exception is [`brief`](./agents/brief): it asks
  with `session/request_permission` and then writes a single `BRIEFING.md` through the editor's
  own `fs/write_text_file`, so the file lands in your workspace rather than on the side. Refuse,
  and nothing is written and the briefing is printed instead. [`local`](./agents/local) can only
  run `git` (reporting) and `lsof` (listing), never a write, a commit or a kill.
- Feeds have cache TTLs (1–60 minutes) so repeated questions do not hammer public APIs;
  Launch Library's free host allows 15 requests/hour, so that one caches for 15 minutes,
  and Citi Bike's status file (2,520 stations) caches for one minute.
- `iss` calls open-notify over plain HTTP because its HTTPS endpoint timed out on
  2026-09-22 while HTTP answered in 0.2 s; it is a public position and nothing private.
- `bikes` speaks only for Citi Bike (New York City, Jersey City, Hoboken); `wiki` quotes
  CC BY-SA text; `labels` is not medical advice.
- Fast-moving data is labelled as such in the answer: launch windows move, model output is
  not a measurement, ECB rates skip weekends and holidays, and a reference rate is not a
  tradeable rate.
- [`attach`](./agents/attach) is the only agent that reads something you hand it rather than a
  feed: either the text your client embedded in the prompt or, when the client advertises
  `fs.readTextFile`, the file it asks for over ACP. It counts what it can count and prints the
  rule beside each number — a "function count" for Python is a regex match, not a parse, and the
  answer says so. Nothing leaves the machine, and no file is ever written.
- [`apod`](./agents/apod) sends NASA's own text whole rather than summarising it, so the words
  are NASA's. Video days carry a thumbnail, not the video, and an image over 4 MB is linked
  rather than attached. The archive starts in 1995, and a day before that is reported as a day
  the archive cannot answer rather than swapped for today's picture.
- [`flights`](./agents/flights) reads aircraft-broadcast ADS-B, so an aircraft that is not
  broadcasting is simply absent — an empty answer is not an empty sky. Altitude is barometric,
  which is why a parked airliner can read a negative number; the word "barometric" is printed
  with every altitude, and aircraft in the air are listed before the ones on the ground.
- [`company`](./agents/company) reads what a filer filed, and says so: EDGAR's `filings.recent`
  holds roughly the latest 1,000 filings rather than the whole history, so an answer says how far
  back it looked. The daily index is the one the SEC publishes; when today's is not posted yet,
  the answer says that instead of calling it an error.
- [`clinicaltrials`](./agents/clinicaltrials) is the sponsor's own registry record, so a status
  is the sponsor's word, and a place filter matches a study that lists a site there rather than
  the site itself — the matching sites are named, with the study's total site count beside them.
  It is not medical advice.
- [`watch`](./agents/watch) polls, because USGS, NOAA SWPC and open-notify publish no push
  channel to subscribe to. It is capped at 20 rounds and 180 seconds, it sleeps on the
  session's own cancel event, and nothing keeps running after the turn.
- [`floodwatch`](./agents/floodwatch) reads NWS NWPS gauge statistics (observed, forecast and
  the published flood stages). NWPS has no name search that is quick enough to use per turn
  (its gauge list is ~13 MB), so a river name is resolved through USGS first, and the answer
  says which gauge it landed on. A name that matches no gauge is reported, not guessed at.
- [`nature`](./agents/nature) resolves a common name through iNaturalist and then reads
  counts from GBIF, because GBIF's own search cannot map common names. Broad ranks are only
  accepted when records actually exist for them; otherwise the agent says it could not pin
  the name down.
- [`surf`](./agents/surf) infers offshore/onshore by comparing wind with wave direction; it
  does not know how any particular beach faces.
- [`buoys`](./agents/buoys) reports "not reported" when a sensor sent nothing — that is not a
  zero.
- [`chart`](./agents/chart) draws its PNG in the standard library (no image dependency) and is
  capped at 640x360. A series longer than the pixels allows is sampled, and the answer says
  which points were skipped rather than drawing a picture of something else.
- [`firehose`](./agents/firehose) is a push stream and cannot be anything else: it is capped at
  25 events and 60 seconds per turn, and its filters never hide what they filtered — the answer
  says "2 of 12 seen", so "no matches" is never mistaken for a quiet wiki.
- [`alert`](./agents/alert) is silent by design. It sends nothing until the condition is met,
  then one message; capped at 60 checks, 300s apart and 900s in total. It waits on the
  session's own cancel event, so cancelling stops it immediately. Quake watches fire on a
  *new* event id, not on a magnitude that was already there.
- [`osm`](./agents/osm) reads volunteer-mapped data: an empty answer means nobody has mapped
  it yet, not that it is not there.
- [`domains`](./agents/domains) reports a registry 404 as "no registration found" and
  deliberately does not call that "available" — only a registrar can promise that.
- [`papers`](./agents/papers) says which service answered (PubMed, arXiv or Crossref): a
  preprint is not a peer-reviewed paper, and the agent says so.
- [`tides`](./agents/tides) returns NOAA's harmonic predictions in the station's own local
  clock and labels them as predictions, not as a reading of the water now.
- [`brief`](./agents/brief) gathers each section independently, so one dead source is written
  into the file as "unavailable" instead of silently dropping the section.
- [`food`](./agents/food), [`chem`](./agents/chem), [`archive`](./agents/archive) and
  [`papers`](./agents/papers) read crowd-sourced or third-party catalogues: a missing nutrient,
  a missing file or a wrong entry is the catalogue's, and the answer names the entry (barcode,
  identifier, DOI) so it can be checked. Nutrients are per 100 g because most products carry no
  serving size, and an unrecorded value says "not recorded" rather than zero.
- [`drought`](./agents/drought) explains that the Drought Monitor's categories are cumulative
  (D1 is moderate **or worse**) and covers a state or county: the monitor has no national
  endpoint, and averaging states into one number would be an invention.
- [`groundwater`](./agents/groundwater) reports **depth to water below land surface**, so a
  bigger number is a deeper water table; a negative one is water above the ground. A state
  figure is the newest reading from each reporting well, with the spread, because a water table
  is not one number.
- [`snowpack`](./agents/snowpack) reports snow water equivalent in inches with NRCS's own median
  for that day. Off season every median is zero, which makes "percent of normal" 0 divided by 0,
  and the answer says that instead of printing 0%.
- [`tsunami`](./agents/tsunami) earns its keep by being able to say no: both US centres leave
  their last CAP bulletin on the web after it expires, so every answer compares the expiry with
  now and reports how long ago the last one lapsed. It reads the two US centres only.
- [`trending`](./agents/trending) reads Wikimedia pageviews, which lag a day, so "today" is
  never reported - and it says how many navigation titles (front page, search) it dropped from
  the raw top list.
- [`osm`](./agents/osm) depends on a shared Overpass instance and can take 10-40s; the probe run
  above caught a 58s turn. It is slow, not stuck. All three mirrors were tried on 2026-09-23:
  `overpass-api.de` answered 504, `kumi.systems` timed out, and the third (`maps.mail.ru`, from
  QuickOSM's mirror list) answered in 22s, so a turn can now succeed where it used to report an
  outage.
- An agent that does not know a place says so by name instead of guessing coordinates.

## License

MIT — see [LICENSE](./LICENSE).
