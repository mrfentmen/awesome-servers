# Missing MCP servers — research log (public; 68 monetizable servers moved to private premium-mcps 2026-09-24)

Living list of MCP servers that do **not** exist yet (verified against the MCP
registry, npm, GitHub and the web), plus what was checked and skipped and why.

Updated: 2026-09-22. Repo count at time of writing: 706.

## Verified missing — build next

(none pending — all 10 below built 2026-09-22: `weatherbit-mcp`, `marketstack-mcp`,
`kucoin-mcp`, `bitwarden-mcp`, `suunto-mcp`, `netatmo-mcp`, `switchbot-mcp`,
`doppler-mcp`, `infisical-mcp`, `youtrack-mcp`. Scoped on npm: bitwarden, suunto,
youtrack — plain names were taken. Plus built 2026-09-23: `ns-mcp` (NS Dutch
Railways, Ocp-Apim key), `knmi-mcp` (KNMI open data, raw-key auth), `eccc-mcp`
(Canada GeoMet, keyless), `bom-mcp` (Australia BOM, keyless + geohash encoder),
`seoul-mcp` (Seoul air quality), `tdx-mcp` (Taiwan transport, OAuth). Plus built
2026-09-23: `mgm-mcp` (Turkey keyless + Origin header), `bmkg-mcp` (Indonesia
keyless), `kma-mcp` (Korea data.go.kr key), `bkk-mcp` (Budapest Futar key),
`chmi-mcp` (Czech open-data browser, keyless). Plus built overnight: `statuscake-mcp`,
`pingdom-mcp`, `ohdear-mcp`, `dpla-mcp`, `odysee-mcp` (Lighthouse), `delinea-mcp`,
`cyberark-mcp`, `openpanel-mcp`, `swetrix-mcp`, `split-mcp`, `goatcounter-mcp`,
`deviantart-mcp`, `nanoleaf-mcp`.) Plus built overnight: `ackee-mcp`, `shynet-mcp`,
`rybbit-mcp`, `beaconchain-mcp`, `coinmetrics-mcp`, `hikingproject-mcp`,
`energinet-mcp`, `wpengine-mcp`, `appveyor-mcp`, `isbndb-mcp`, `literal-mcp`,
`synoptic-mcp`, `doab-mcp`, `fingrid-mcp`, `stormglass-mcp`, `quip-mcp`,
`simplecast-mcp`, `blubrry-mcp`, `spreaker-mcp`, `shootproof-mcp`, `turbosquid-mcp`, `cgtrader-mcp`, `playcanvas-mcp`, `seafile-mcp`, `docspell-mcp`, `teedy-mcp`, `filerun-mcp`, `owncloud-mcp`, `pydio-mcp`, `prx-mcp`, `savvycal-mcp`, `commafeed-mcp`, `supernotes-mcp`, `guru-mcp`, `godot-mcp`, `kopia-mcp`, `hermes-mcp`, `chanel-mcp`,
`louisvuitton-mcp`, `gucci-mcp`, `prada-mcp`, `rolex-mcp`, `cartier-mcp`,
`dior-mcp`, `saintlaurent-mcp`, `balenciaga-mcp`, `fendi-mcp`,
`bottegaveneta-mcp`, `icebox-mcp`, `traxnyc-mcp`, `kith-mcp`, `stadiumgoods-mcp`,
`glossier-mcp`, `aimeleondore-mcp`.)

**Luxury brand servers (built 2026-09-24, Fashionphile + Rebag public Shopify JSON;
upgraded to 7 tools: search/list/get/price-overview/compare/find-deals/overview,
with condition/color/material parsing from Rebag data):**
hermes, chanel, louisvuitton, gucci, prada, rolex, cartier, dior,
saintlaurent, balenciaga, fendi, bottegaveneta (all `-mcp`). Brand-owned
sites excluded: edge bot-walls (LV Akamai 403, Hermès Cloudflare 403,
Gucci fingerprint-drop), no public APIs.

## Skipped — already a thing

Do not build; covered by others or by this repo.

- itch.io — z27fang/itch-io-mcp-ts, itch-community, Vinkius, Apify
- Epic Games Store — pixfishx / meethuhu epic-free-games
- Pirate Weather — pipeworx-io/mcp-pirate-weather
- Tomorrow.io — pipeworx-io/tomorrow-io
- TfNSW — piddlingtuna alerts, danhussey stops/departures, maxim75 trip planner
- HSL Helsinki — devusvulgaris/mcp-hsl (also on npm)
- Xbox — 312-dev/xbox-mcp via OpenXBL
- Raydium — official docs MCP (docs.raydium.io/mcp), kukapay launchlab tools
- Sorare — AnythingMCP 18-tool adapter (bcrypt auth, needs user account)
- Shyft — covered by Shyft's own MCP directory
- Telegram, Strava, Fitbit, Last.fm, OpenLibrary, Brave, Neon (official), ClickHouse (official), Home Assistant (official ha-mcp), Metaplex, SNCF, Stocktwits, Sleeper, OpenWeatherMap (official), Eurostat, StatCan, AccuWeather, AEMET, EODHD — all have registry servers
- bible — this repo (`bible-mcp`) + vineverse, midvash and others
- torah — this repo (`torah-mcp`); JonathanB555/torah-mcp also exists
- Exchanges: Binance, Bybit (mcp-dir/bybit-mcp), and all local ones (coinbase, kraken, okx, bitstamp, gemini, bitfinex, mexc, gateio, bitget, upbit, bithumb, deribit)
- PM/work: Linear (official), Notion, Jira, Confluence, Airtable (official), Asana, ClickUp, Monday (official), Smartsheet, Coda (official + community), Redmine, Shortcut, Bugzilla (kud, 12 tools)
- Fitness: Garmin, Whoop, Oura, Withings, Polar
- Smart home: Home Assistant (official), Shelly, Govee, Tuya (official platform + PyPI), Homey Pro (60 tools)
- Analytics/flags: PostHog (official), Mixpanel (local), Amplitude (official), Matomo, GrowthBook (official), Plausible, Umami, Unleash (official), Flagsmith (official), LaunchDarkly, Statsig (official), Checkly, Honeybadger (official)
- Uptime: UptimeRobot (official), Better Stack
- Incidents: PagerDuty (official), incident.io (official remote MCP), FireHydrant (official), Squadcast, Rootly
- Secrets: 1Password, Vault (official)
- Rail/transit: Deutsche Bahn (3x community), ÖBB, Amtrak (pipeworx), TfNSW (3x), HSL (devusvulgaris), PTV (malamutemayhem), NS (this repo), SBB, GBFS (Gnist hosted), BKK (this repo)
- Weather: FMI (pipeworx), AEMET, Met Office (this repo), HKO (imjac0b + pongiotdevelop), JMA (pipeworx + sasonoda), NEA Singapore (vdineshk), IMGW (bartosz-kuc), KNMI (this repo), MGM (this repo), BMKG (this repo), KMA (this repo), CHMI (this repo), ECCC (this repo), BOM (this repo)
- Games/anime/comics: RAWG (pipeworx/Pipedream), IGDB (official + bielacki), GiantBomb (pipeworx), AniList (smithery), ComicVine (pipeworx), Jikan + MangaDex + OpenBrewery (this repo), Kitsu (official docs MCP + pipeworx)
- Books/music/podcasts: Google Books (pipeworx/Vinkius), Hardcover (3x), Listen Notes (pipeworx/Pipedream/Composio), AcoustID (Vinkius/cynosure), setlist.fm (chrischall/pipeworx), Bandsintown (pipeworx), TVMaze (cyanheads), CocktailDB (pipeworx)
- Energy: EIA (cyanheads + GSA-TTS + missionsquad)
- Space: Launch Library (official + pipeworx)
- Hosting: Vercel (official), Netlify (official), Render (official), Railway (official), Fly.io (official flyctl), Heroku, DigitalOcean, Hetzner, OVH, Scaleway, Linode (takashito), Vultr (rsp2k, 335 tools), Jenkins (kud 38 tools + official plugin), Drone CI (3x), TeamCity (Daghis), Bamboo (hmdmph), CircleCI (official), SonarQube (official), Bitrise (official), Azure DevOps
- HR: HiBob (official), Deel (official), BambooHR, Personio (gyopiazza), Fathom (fathomdx), Linear (official), Notion, Jira, Confluence, Airtable (official), Asana, ClickUp, Monday (official), Smartsheet, Coda (official), Redmine, Shortcut, Bugzilla (kud), YouTrack (this repo)
- Analytics: PostHog (official), Mixpanel (local), Amplitude (official), Matomo, GrowthBook (official), Plausible, Umami, Unleash (official), Flagsmith (official), LaunchDarkly, Statsig (official), Checkly, Honeybadger (official), StatusCake (this repo via Composio alt), Pingdom (this repo via Composio alt), Oh Dear (this repo)
- Secrets: Vault (official), 1Password, Bitwarden (this repo), Doppler (this repo), Infisical (this repo), Akeyless (community RTA)
- Video/social: Odysee (this repo; Apify/oanor alts), Tumblr (viaSocket/Zapier/Bright Data), Rumble (no API), Flickr (local), Vimeo (pipeworx), Twitch (local), YouTube (no verified local)
- Patents: EPO (pipeworx/navisbio/JIBSN), USPTO (cyanheads+), WIPO (no public REST found)
- Culture: Gallica (Galica-MCP), Coursera (3x), Papers Past (API uncertain)

## Dropped — no usable public API or dead endpoints

- Underdog Fantasy / PrizePicks — no public API
- Drift Protocol — api.drift.trade unreachable, no documented public REST
- SMHI — metfcst point endpoint 404s (API shape changed, needs re-research)
- Hellomoon — rest.hellomoon.io unreachable
- Kagi — API requires a paid plan
- Auckland Transport — api.at.govt.nz routes unverifiable from here (portal docs are JS-driven, no swagger found)
- Trafiklab/SL — api.sl.se + dev.trafiklab.se unreachable from here
- DMI Denmark — dmigw.govcloud.dk + api.dmi.dk unreachable from here
- Météo-France — public API base unverified (404)
- Tado / Hue / VIA Rail / Indian Railways / DSB — unofficial, pairing-gated, or no public API
- Counter.dev, Bucket.co — API hosts dead
- Maze.co, WIPO, Papers Past — API shapes unverifiable
- Rumble, Contra, Zumper, Remote.com (ambiguous squat) — no usable API or unclear ownership
- Shynet, Rybbit, Ackee — self-hosted API schemas need instance docs to verify
- Daikin, Viessmann, NIBE — vendor hosts unreachable from here, retry later
- Marvel API — RETIRED by Marvel, unusable
- JPL Horizons — ssd.jpl.nasa.gov unreachable from here (5 attempts; other .gov works, so likely bot-filtering)
- Copernicus (marine/climate) — guessed paths 404, needs account + docs
- Auckland Transport — api.at.govt.nz routes unverifiable from here (portal docs are JS-driven, no swagger found)

## To research (untouched territory)

Covered by the Build backlog below — this section retired 2026-09-23.

## Build backlog (fresh leads, free APIs known — verify then build)

Auth = free key unless noted keyless. Verify registry+npm+web before building.

**Verified missing on registry (local also missing) — prime build queue:**
- Secrets/flags: Delinea, CyberArk, Split.io, Harness.io, Bucket.co
- Analytics: GoatCounter, Ackee, Shynet, OpenPanel, Rybbit, Fathom Analytics, Counter.dev, Swetrix
- Uptime: OhDear, StatusCake, Pingdom
- Hosting/dev: Render.com, Railway.com, Fly.io, Vercel, Netlify, Linode, Vultr, Coveralls, DeepSource, Jenkins CI, Drone CI, Harness.io (OFFICIAL harness/mcp-server, skip), Maze.co, DPLA, edX
- Jobs/HR: HiBob, Deel, Remote.com, Oyster, Zumper, Personio HR API, Contra
- Legal: CaseLaw Access Project (cap.law)
- Social/video: Rumble, Odysee, DeviantArt
- Registries/IoT: Maven Central, crates.io, CRAN, Daikin, Viessmann, NIBE, Nanoleaf
- Patents: WIPO PATENTSCOPE
- Oceans: OBIS
- Outdoors: Trailforks
- Culture: Gallica BnF, Papers Past NZ, Coursera, BBC (Nitro keys staff/partners only, skip), NPR (Story API retired; CDS gated to members, skip), Radiotopia (PRX network — covered by prx-mcp, no separate API)
- Programs (genres 1-12 sweep): Quip (built), Simplecast (built), Gab (Cloudflare-walled, drop), Dreamwidth (host dead, drop), plus unverified backlog below

**Still to verify (registry not yet probed):**
- Docs/notes: Guru (built), HedgeDoc (taken 3x, skip), RemNote (backend REST disabled, plugin SDK only, skip), SuperNotes (built), Craft (OFFICIAL MCP mcp.craft.do + community craft-mcp, skip), CommaFeed (built)
- Podcast: Podbean (taken), Libsyn (no public podcast API — status-page API + cookie-scrape only, skip), Blubrry (built), Spreaker (built), RedCircle (api base 404, skip), RSS.com (Express 404 on guessed paths, skip), Acast (host blocked 000, skip), Restream (OFFICIAL MCP at developers.restream.io/mcp-server, skip), Zencastr (no public API, skip), BBC, Radiotopia, PRX (built)
- Photo: Zenfolio (SOAP .asmx API only, skip), Pixieset (unofficial only, skip), ShootProof (built), PicTime (no public API — Zapier/partners only, skip)
- 3D: TurboSquid (built — Token header required on all calls), CGTrader (built), Godot assets (built, scoped @mrfentmen — plain name taken), PlayCanvas (built), Verge3D (JS engine API only, no REST, skip), Vectary (embed postMessage API only, no REST, skip)
- EDA: OSH Park (API access by support request only, skip), Aisler (Part API key on request via form, no public docs, skip), SnapEDA/SnapMagic (API on request via form, no public docs, skip), Ultra Librarian (enterprise CAD-vendor integrations only, no public API, skip), SamacSys/CSE (subscription API + community pcbparts-mcp, skip)
- Self-hosted docs: Docspell (built), Teedy (built), FileRun (built), ownCloud (built), Seafile (built), Pydio (built), Resilio (Connect API enterprise-licensed, Sync no API, skip), Kopia (built)
- NYC/monetization research (2026-09-24): Socrata TAKEN (cyanheads 6-tool + pipeworx cityofnewyork pack + our nyc311-mcp) — skip; NYT contested (jeffmm, pipeworx, cooking — all ~1 star) — low priority; KITH/Stadium/Glossier/ALD WIDE OPEN (no npm/registry/GitHub hits, Shopify JSON live) — BUILD; MoMA open but API key-gated/unclear (/collection errors, home page exists) — secondary; B&H no self-serve API (affiliate-gated; scraper actors exist) — skip; Adorama/TodayTix/Warby no public API found — skip.
- Marketplace validity fix (2026-09-24): all 70 premium pkgs republished locally w/ repository.url=premium-mcps.git (npm metadata fixed; 68 OK 0 FAIL). Remaining: listing GitHub URLs must be premium-mcps tree paths + EXACT npm names (scoped where scoped: @mrfentmen/ashby, beehiiv, coinbase, etsy, greenhouse, helius, job-search, loops, mixpanel, pinterest, steam, wise, yfinance, youtrack, alphavantage + twilio-mcp-server) then rescan. CI on premium-mcps is scheduler-blocked (even hello-world fails; billing/quota?) — publishing done locally via ~/.npmrc. Mapping: /tmp/listing-map.csv (regenerate if needed).
- Research: Mendeley (taken), SciFlow (enterprise, skip), Curvenote (CLI only, skip), PubPub (SDK only, skip)
- Scheduling: Amie (OFFICIAL MCP, skip), Ellie (first-party MCP beta, skip), Sunsama (no official API, unofficial wrappers only, skip), SavvyCal (built)
- Design/social: Penpot (paths uncertain, skip), Canva (official, skip), VK (taken 2x, skip), Minds (no official public API — session/XSRF only, skip), Framer (dead host, skip)
- CAD remainder (SketchUp, Rhino, Tekla, VectorWorks, BricsCAD, DraftSight, Shapr3D): desktop programs, no public cloud APIs — skip batch

**Still to verify (registry not yet probed):**
- Health/edu: CDC WONDER, NCES, GreatSchools, ISBNdb, Literal
- Patents: J-PlatPat, KIPRIS, IP Australia, CIPO, EUIPO, Lens.org
- Standards: ETSI, W3C, OGC, FIDO, OpenID, FHIR servers
- Oceans: PSMSL, IOOS, Argo, GEBCO, EMODnet, Observation.org, Movebank, Motus
- Outdoors: Hiking Project, Outdooractive, ABRP, Tronity, evcc
- Space data: Earthdata CMR, NSIDC, GHCN, MesoWest
- Auto: Carfax (no), Copart (member), IAAI, BringATrailer (no API), Classic.com
- Classifieds: Craigslist RSS, OLX (no), Mercari (no), Poshmark (no), Depop (no), Vinted (no), ThredUp (no)
- Logistics: Global Fishing Watch, SeaRates, project44, FourKites
- Universities: QS, THE, ARWU, Study.eu
- Lotteries: Powerball, Mega Millions, EuroMillions, UK Lotto
- Social: YouTube (key), TikTok (approval), 500px, Dribbble, BeReal, Nextdoor, Viber, Line, Kakao, ArtStation (no API), Behance (no API)
- Music: Apple Music, Tidal, Qobuz, Napster, Pandora, SiriusXM, Libby, Hoopla, Kanopy
- Smart home: Tapo/Kasa/Wyze/Eufy/Ring (unofficial), Resideo, LG ThinQ (unofficial)
- Salaries/others: Levels.fyi (no API), Glassdoor (partner-only), PayScale (no API), Zoopla (member), Idealista (paid), Justia (no API), Toptal (no API)
- Transit: VIA Rail, Indian Railways (no public API found yet — recheck)

## Monetization playbook (2026-09-24, $0 budget)
- SELL WHERE: mcp-marketplace.io = only true marketplace (15% commission, keep 85%, Stripe Connect payouts, ~24h approval, free+paid tiers). Smithery = free listing + free 50K RPC hosting, NO revenue share (bring own billing; MCP Hive offers per-response metering). Free directories: official registry (done via CI, crawled by mcp.directory/Glama/PulseMCP), mcpservers.org (free form), mcp.so (free w/ review), LobeHub (free CLI but aggressive GitHub OAuth — caution), Awesome MCP Servers PR. Glama skipped (costs). PulseMCP paused.
- EARN HOW: (1) marketplace paid tiers via Stripe (free account + payment links), (2) affiliate tags on shopping-server product URLs, (3) DEV article per server (free distribution; proven pattern: npm -> Smithery -> Stripe -> article).
- A2A: no central marketplace found (agent cards + awesome lists only) — sell via same direct channels.
- ACP = two protocols: Zed Agent Client Protocol (registry via GitHub PR, free, curated, auth required) vs IBM BeeAI ACP (self-hosted /agents + BeeAI Platform). Confirm which before listing.
- NEXT BUILDS (demand cats): jobs wave (Greenhouse/Lever/Ashby/SmartRecruiters public keyless ATS APIs), sports odds (The Odds API free NBA+MLB / BetStack free-forever), MoMA (gated, secondary), more Shopify streetwear (Supreme/Flight Club/Ben Baller unchecked).
- Wave-2 money move (2026-09-24): 34 more to premium-mcps (crypto/data, dev SaaS, monitoring, analytics, validation, books, business SaaS, security, podcast hosting). Public 727 -> 693, premium 70 -> 104. All republished w/ premium repo URLs (34 OK 0 FAIL).
