# Published snapshot

This directory is the code users install. `scripts/mirror-registry.py`
downloads every MCP package the account publishes on npm and keeps the
highest version per slug, so this tree matches the registry rather than
older local work. `servers/` holds the hand-written source and is not what
ships.

Regenerate this summary with `python3 scripts/index-published.py`. Re-run
`mirror-registry.py` only when every local fix has been published — it
overwrites `dist/` from the registry tarballs.

- packages: **960**
- scoped under `@mrfentmen`: **195**
- total size: **15.7 MB**
- carrying a licence gate (`MCP_LICENSE_KEY`): **1**
- carrying tools that answer `Not yet implemented` in the shipped `dist/`: **495**
- whose `src/` still holds the pre-fix source (not shipped, cannot rebuild `dist/`): **36**

| package | version | src? | gate | stubs |
| --- | --- | --- | --- | --- |
| `7timer-mcp` | 1.0.5 | no |  |  |
| `8bitpeoples-mcp` | 1.0.5 | no |  | 2 |
| `abuseipdb-mcp` | 1.1.0 | no |  |  |
| `ackee-mcp` | 1.0.6 | no |  |  |
| `adguardhome-mcp` | 1.0.9 | no |  |  |
| `@mrfentmen/adobe-premiere-mcp` | 1.0.6 | no |  |  |
| `advice-mcp` | 1.0.6 | no |  | 2 |
| `affirmations-mcp` | 1.0.5 | no |  | 2 |
| `agify-mcp` | 1.0.6 | no |  | 2 |
| `ai-tomogotchi-mcp` | 1.0.0 | no |  |  |
| `aimeleondore-mcp` | 1.0.8 | no |  |  |
| `air-quality-mcp` | 1.0.6 | no |  | 2 |
| `@mrfentmen/airtable-mcp` | 1.1.3 | no |  |  |
| `albiononline-mcp` | 1.0.5 | no |  |  |
| `@mrfentmen/algorand-mcp` | 1.0.5 | no |  | 2 |
| `@mrfentmen/alpaca-mcp` | 1.1.3 | no |  |  |
| `alphafold-mcp` | 1.0.5 | no |  |  |
| `@mrfentmen/alphavantage-mcp` | 1.0.8 | no |  |  |
| `amadeus-mcp` | 1.0.6 | no |  |  |
| `anagram-mcp` | 1.0.5 | no |  | 2 |
| `@mrfentmen/anilist-mcp` | 1.1.0 | no |  |  |
| `anime-filler-mcp` | 1.0.5 | no |  |  |
| `ansible-galaxy-mcp` | 1.0.6 | no |  |  |
| `apexlegends-mcp` | 1.0.3 | no |  |  |
| `api-deprecation-radar-mcp` | 1.0.7 | no |  | 2 |
| `apis-guru-mcp` | 1.0.5 | no |  | 2 |
| `@mrfentmen/apollo-mcp` | 1.1.3 | no |  |  |
| `apple-media-search-mcp` | 1.0.0 | no |  |  |
| `appveyor-mcp` | 1.0.8 | no |  |  |
| `appwrite-mcp` | 1.0.6 | no |  |  |
| `arbeitnow-mcp` | 1.1.1 | no |  |  |
| `archive-org-mcp` | 1.0.6 | yes |  |  |
| `archlinux-mcp` | 1.0.5 | no |  | 2 |
| `art-institute-mcp` | 1.0.6 | yes |  |  |
| `artifact-gauge-mcp` | 1.0.7 | no |  |  |
| `@mrfentmen/artifact-hub-mcp` | 1.0.6 | no |  |  |
| `arweave-mcp` | 1.1.2 | no |  |  |
| `arxiv-mcp` | 1.1.0 | no |  |  |
| `@mrfentmen/ashby-mcp` | 1.1.1 | no |  |  |
| `@mrfentmen/assemblyai-mcp` | 1.0.6 | no |  |  |
| `audius-mcp` | 1.0.6 | no |  | 3 |
| `aur-mcp` | 1.0.5 | no |  | 2 |
| `avatar-mcp` | 1.0.5 | no |  | 2 |
| `avianne-mcp` | 1.1.2 | no |  |  |
| `@mrfentmen/aviation-weather-mcp` | 1.0.6 | no |  | 2 |
| `baconipsum-mcp` | 1.0.6 | no |  |  |
| `balenciaga-mcp` | 1.1.1 | no |  |  |
| `@mrfentmen/bandcamp-mcp` | 1.0.5 | no |  | 1 |
| `@mrfentmen/bankofcanada-mcp` | 1.0.5 | no |  |  |
| `barcode-mcp` | 1.0.5 | no |  |  |
| `bart-mcp` | 1.0.5 | no |  | 2 |
| `baserow-mcp` | 1.0.6 | no |  |  |
| `baywheels-mcp` | 1.0.5 | no |  | 2 |
| `beaconchain-mcp` | 1.0.3 | no |  |  |
| `@mrfentmen/beehiiv-mcp` | 1.0.7 | no |  |  |
| `beis-mcp` | 1.1.3 | no |  |  |
| `berlin-bvg-mcp` | 1.0.5 | no |  | 2 |
| `betterstack-mcp` | 1.1.1 | no |  |  |
| `bible-mcp` | 1.0.5 | no |  | 2 |
| `@mrfentmen/bigcommerce-mcp` | 1.0.8 | no |  |  |
| `bigdatacloud-mcp` | 1.0.5 | no |  | 2 |
| `bikeindex-mcp` | 1.0.5 | no |  | 2 |
| `binance-market-mcp` | 1.1.1 | no |  |  |
| `bing-wallpaper-mcp` | 1.0.6 | no |  |  |
| `biorxiv-mcp` | 1.0.5 | no |  | 2 |
| `@mrfentmen/bitbucket-mcp` | 1.0.5 | no |  | 3 |
| `bitcoiner-mcp` | 1.0.5 | no |  | 2 |
| `bitfinex-mcp` | 1.0.5 | no |  | 2 |
| `bitflyer-mcp` | 1.0.5 | no |  | 2 |
| `bitget-mcp` | 1.0.5 | no |  | 2 |
| `@mrfentmen/bithumb-mcp` | 1.0.5 | no |  | 2 |
| `bitso-mcp` | 1.0.5 | no |  | 2 |
| `bitstamp-mcp` | 1.0.5 | no |  | 2 |
| `@mrfentmen/bitwarden-mcp` | 1.0.7 | no |  |  |
| `bkk-mcp` | 1.0.3 | no |  |  |
| `blizzard-mcp` | 1.0.5 | no |  | 1 |
| `blockchain-info-mcp` | 1.1.1 | no |  |  |
| `@mrfentmen/blockchain-mcp` | 1.0.5 | no |  | 2 |
| `blockchair-mcp` | 1.0.5 | no |  | 2 |
| `blockcypher-mcp` | 1.0.5 | no |  | 2 |
| `bls-mcp` | 1.1.0 | no |  |  |
| `blubrry-mcp` | 1.0.7 | no |  |  |
| `@mrfentmen/bluesky-mcp` | 1.0.5 | no |  | 2 |
| `bmkg-mcp` | 1.0.6 | no |  | 2 |
| `boardgamegeek-mcp` | 1.1.0 | no |  |  |
| `bom-mcp` | 1.0.5 | no |  | 3 |
| `books-mcp` | 1.0.4 | no |  | 2 |
| `bored-mcp` | 1.0.5 | no |  | 2 |
| `bottegaveneta-mcp` | 1.1.1 | no |  |  |
| `@mrfentmen/brainrot-mcp` | 1.0.6 | no |  | 2 |
| `@mrfentmen/brave-mcp` | 1.1.4 | no |  |  |
| `@mrfentmen/brawl-stars-mcp` | 1.0.5 | no |  | 2 |
| `brevo-mcp` | 1.0.7 | no |  |  |
| `brewery-mcp` | 1.1.2 | no |  |  |
| `brightsky-mcp` | 1.0.5 | no |  | 2 |
| `@mrfentmen/browser-mcp` | 1.0.6 | no |  | 1 |
| `build-cache-mcp` | 1.0.6 | no |  | 2 |
| `bulbapedia-mcp` | 1.0.5 | no |  | 2 |
| `@mrfentmen/bundlephobia-mcp` | 1.0.5 | no |  | 2 |
| `burberry-mcp` | 1.1.1 | no |  |  |
| `calcom-mcp` | 1.1.4 | no |  |  |
| `car-recalls-mcp` | 1.0.5 | no |  | 2 |
| `carbon-intensity-mcp` | 1.0.5 | no |  | 2 |
| `cartesia-mcp` | 1.0.7 | no |  |  |
| `cartier-mcp` | 1.1.1 | no |  |  |
| `cat-mcp` | 1.0.5 | no |  | 2 |
| `cbr-mcp` | 1.0.5 | no |  | 2 |
| `cdc-data-mcp` | 1.0.5 | no |  | 2 |
| `cdnjs-mcp` | 1.0.5 | no |  | 2 |
| `celestrak-mcp` | 1.0.5 | no |  | 2 |
| `census-geo-mcp` | 1.0.5 | no |  |  |
| `census-mcp` | 1.1.0 | no |  |  |
| `censys-mcp` | 1.0.7 | no |  |  |
| `cern-mcp` | 1.0.6 | no |  |  |
| `certspotter-mcp` | 1.0.5 | no |  | 2 |
| `cex-mcp` | 1.0.5 | no |  | 2 |
| `cfpb-mcp` | 1.0.5 | no |  | 2 |
| `cgtrader-mcp` | 1.1.2 | no |  |  |
| `chanel-mcp` | 1.1.1 | no |  |  |
| `cheapshark-mcp` | 1.1.1 | no |  |  |
| `checkly-mcp` | 1.0.5 | no |  |  |
| `checksum-mcp` | 1.0.7 | no |  |  |
| `chembl-mcp` | 1.0.5 | no |  | 2 |
| `@mrfentmen/chess-mcp` | 1.0.5 | no |  | 2 |
| `@mrfentmen/chesscom-mcp` | 1.0.5 | no |  | 2 |
| `chmi-mcp` | 1.0.5 | no |  | 3 |
| `chocolatey-mcp` | 1.0.5 | no |  | 2 |
| `chord-mcp` | 1.0.5 | no |  | 2 |
| `@mrfentmen/chuck-norris-mcp` | 1.0.5 | no |  | 2 |
| `cisa-kev-mcp` | 1.1.0 | no |  |  |
| `citi-bike-mcp` | 1.0.5 | no |  | 2 |
| `citybikes-mcp` | 1.0.5 | no |  | 2 |
| `civitai-mcp` | 1.0.6 | no |  |  |
| `clerk-mcp` | 1.0.7 | no |  |  |
| `@mrfentmen/cleveland-art-mcp` | 1.0.0 | no |  |  |
| `clevelandart-mcp` | 1.0.5 | no |  | 2 |
| `@mrfentmen/clinical-trials-mcp` | 1.0.0 | no |  |  |
| `@mrfentmen/clinicaltrials-mcp` | 1.1.0 | yes |  |  |
| `clinvar-mcp` | 1.0.5 | no |  | 2 |
| `@mrfentmen/cloudflare-mcp` | 1.1.4 | no |  |  |
| `cocktaildb-mcp` | 1.1.2 | no |  |  |
| `cocktails-mcp` | 1.0.5 | no |  | 2 |
| `codeberg-mcp` | 1.0.5 | no |  | 3 |
| `codeforces-mcp` | 1.0.5 | no |  | 2 |
| `codepet-mcp` | 1.0.7 | no |  |  |
| `codewars-mcp` | 1.0.4 | no |  | 2 |
| `coffee-mcp` | 1.0.5 | no |  | 2 |
| `@mrfentmen/coinbase-mcp` | 1.1.1 | no |  |  |
| `@mrfentmen/coingecko-mcp` | 1.1.2 | yes |  |  |
| `coinlore-mcp` | 1.1.1 | no |  |  |
| `coinmetrics-mcp` | 1.0.5 | no |  | 2 |
| `@mrfentmen/coinpaprika-mcp` | 1.1.0 | no |  |  |
| `college-scorecard-mcp` | 1.1.0 | no |  |  |
| `collegefootballdata-mcp` | 1.0.0 | no |  |  |
| `color-mcp` | 1.0.5 | no |  | 2 |
| `commafeed-mcp` | 1.0.3 | no |  |  |
| `commoncrawl-mcp` | 1.0.5 | no |  | 2 |
| `config-weather-mcp` | 1.0.5 | no |  |  |
| `confluent-mcp` | 1.0.7 | no |  |  |
| `congress-gov-mcp` | 1.1.0 | no |  |  |
| `container-registry-mcp` | 1.0.1 | no |  |  |
| `contract-diff-mcp` | 1.0.6 | no |  | 2 |
| `convertkit-mcp` | 1.0.8 | no |  |  |
| `@mrfentmen/core-mcp` | 1.0.4 | no |  | 2 |
| `countriesnow-mcp` | 1.0.6 | yes |  |  |
| `countryflags-mcp` | 1.0.6 | no |  |  |
| `@mrfentmen/court-records-mcp` | 1.1.0 | no |  |  |
| `courtlistener-mcp` | 1.1.0 | no |  |  |
| `coverartarchive-mcp` | 1.0.5 | no |  | 2 |
| `covid-data-mcp` | 1.0.6 | no |  | 2 |
| `crates-io-mcp` | 1.0.7 | no |  |  |
| `cricapi-mcp` | 1.0.6 | no |  | 1 |
| `@mrfentmen/crisp-mcp` | 1.1.8 | no |  |  |
| `@mrfentmen/cron-mcp` | 1.0.7 | no |  | 2 |
| `crossref-mcp` | 1.1.0 | no |  |  |
| `crypto-com-mcp` | 1.0.5 | no |  | 2 |
| `crypto-tools-mcp` | 1.0.7 | no |  | 2 |
| `cryptorank-mcp` | 1.0.9 | no |  |  |
| `@mrfentmen/csv-mcp` | 1.0.6 | no |  | 2 |
| `ctan-mcp` | 1.0.5 | no |  | 2 |
| `customerio-mcp` | 1.1.4 | no |  |  |
| `cyberark-mcp` | 1.1.1 | no |  |  |
| `dadjoke-mcp` | 1.0.5 | no |  | 3 |
| `dailymed-mcp` | 1.0.5 | no |  | 2 |
| `dailymotion-mcp` | 1.0.5 | no |  | 2 |
| `data-gouv-mcp` | 1.0.5 | no |  | 2 |
| `data-gov-uk-mcp` | 1.0.6 | no |  |  |
| `datacite-mcp` | 1.0.5 | no |  | 2 |
| `datahub-countries-mcp` | 1.0.5 | no |  | 2 |
| `@mrfentmen/datamuse-mcp` | 1.0.5 | no |  | 2 |
| `db-ip-mcp` | 1.0.6 | no |  |  |
| `dblp-mcp` | 1.0.4 | no |  |  |
| `deck-of-cards-mcp` | 1.0.6 | no |  |  |
| `deepgram-mcp` | 1.0.7 | no |  |  |
| `deezer-mcp` | 1.0.5 | no |  | 2 |
| `@mrfentmen/defillama-mcp` | 1.1.2 | yes |  |  |
| `delinea-mcp` | 1.0.3 | no |  |  |
| `demozoo-mcp` | 1.0.5 | no |  | 2 |
| `dependency-drift-mcp` | 1.0.6 | no |  | 2 |
| `dependency-license-change-mcp` | 1.0.5 | no |  | 1 |
| `deps-dev-mcp` | 1.0.6 | no |  |  |
| `deribit-mcp` | 1.1.1 | no |  |  |
| `destiny2-mcp` | 1.0.3 | no |  |  |
| `deviantart-mcp` | 1.0.3 | no |  |  |
| `devrant-mcp` | 1.0.6 | no |  |  |
| `@mrfentmen/devto-mcp` | 1.1.0 | no |  |  |
| `@mrfentmen/dexscreener-mcp` | 1.1.0 | no |  |  |
| `dictionary-mcp` | 1.0.6 | yes |  |  |
| `@mrfentmen/diff-mcp` | 1.0.5 | no |  |  |
| `digimon-mcp` | 1.0.6 | no |  |  |
| `digitalnz-mcp` | 1.0.5 | no |  | 2 |
| `dior-mcp` | 1.1.1 | no |  |  |
| `directus-mcp` | 1.0.7 | no |  |  |
| `@mrfentmen/discogs-mcp` | 1.0.6 | no |  |  |
| `@mrfentmen/discord-mcp` | 1.1.0 | no |  |  |
| `disify-mcp` | 1.1.1 | no |  |  |
| `disney-mcp` | 1.0.5 | no |  | 2 |
| `dnd5e-mcp` | 1.0.5 | no |  | 2 |
| `dns-lookup-mcp` | 1.0.5 | no |  | 2 |
| `dnstwister-mcp` | 1.0.5 | no |  | 2 |
| `doab-mcp` | 1.0.6 | no |  | 3 |
| `doaj-mcp` | 1.0.5 | no |  | 2 |
| `docker-hub-mcp` | 1.0.5 | no |  | 2 |
| `@mrfentmen/dockerhub-mcp` | 1.0.0 | no |  |  |
| `docraptor-mcp` | 1.0.0 | no |  |  |
| `docspell-mcp` | 1.0.3 | no |  |  |
| `documenso-mcp` | 1.0.5 | no |  | 1 |
| `@mrfentmen/document-generator-mcp` | 1.0.6 | no |  | 1 |
| `dog-mcp` | 1.0.5 | no |  | 2 |
| `doh-mcp` | 1.1.1 | no |  |  |
| `doomwiki-mcp` | 1.0.5 | no |  | 2 |
| `doppler-mcp` | 1.0.7 | no |  |  |
| `dpla-mcp` | 1.1.0 | no |  |  |
| `dragonball-mcp` | 1.0.6 | no |  |  |
| `duck-mcp` | 1.0.4 | no |  | 2 |
| `@mrfentmen/duckduckgo-mcp` | 1.0.4 | no |  | 2 |
| `dummyjson-mcp` | 1.0.4 | no |  | 2 |
| `duolingo-mcp` | 1.0.4 | no |  | 2 |
| `dwarffortress-mcp` | 1.0.4 | no |  | 2 |
| `@mrfentmen/ebay-mcp` | 1.1.4 | no |  |  |
| `ebi-search-mcp` | 1.0.4 | no |  | 1 |
| `eccc-mcp` | 1.0.4 | no |  | 3 |
| `ecobee-mcp` | 1.0.4 | no |  | 2 |
| `@mrfentmen/edgar-mcp` | 1.0.3 | no |  | 2 |
| `electricitymap-mcp` | 1.0.5 | no |  |  |
| `email-validator-mcp` | 1.2.1 | no |  |  |
| `emby-mcp` | 1.0.2 | no |  |  |
| `emoji-mcp` | 1.0.4 | no |  | 2 |
| `@mrfentmen/endoflife-mcp` | 1.0.4 | no |  | 2 |
| `energinet-mcp` | 1.0.4 | no |  | 2 |
| `enrico-mcp` | 1.0.5 | no |  |  |
| `ensembl-mcp` | 1.0.4 | no |  | 2 |
| `ensideas-mcp` | 1.0.4 | no |  | 1 |
| `entur-mcp` | 1.0.3 | no |  | 3 |
| `env-contract-mcp` | 1.0.5 | no |  | 2 |
| `envirocar-mcp` | 1.0.4 | no |  | 2 |
| `eol-mcp` | 1.0.4 | no |  | 2 |
| `epa-frs-mcp` | 1.0.4 | no |  | 1 |
| `epic-free-games-mcp` | 1.0.5 | no |  |  |
| `episodate-mcp` | 1.0.4 | no |  | 2 |
| `epo-mcp` | 1.0.6 | no |  |  |
| `er-api-mcp` | 1.0.5 | yes |  |  |
| `ericemanuel-mcp` | 1.1.3 | no |  |  |
| `esm-mcp` | 1.0.4 | no |  | 2 |
| `esplora-mcp` | 1.0.5 | no |  |  |
| `espn-core-mcp` | 1.1.0 | no |  |  |
| `@mrfentmen/etherscan-mcp` | 1.1.4 | no |  |  |
| `ethplorer-mcp` | 1.1.1 | no |  |  |
| `@mrfentmen/etsy-mcp` | 1.0.6 | no |  |  |
| `europepmc-mcp` | 1.0.4 | no |  | 2 |
| `eurostat-mcp` | 1.1.0 | no |  |  |
| `@mrfentmen/eveonline-mcp` | 1.0.3 | no |  | 2 |
| `evidence-diff-mcp` | 1.0.5 | no |  | 2 |
| `@mrfentmen/excel-mcp` | 1.0.5 | no |  | 2 |
| `exoplanet-mcp` | 1.0.0 | no |  |  |
| `exoplanets-mcp` | 1.0.4 | no |  | 2 |
| `f-droid-mcp` | 1.0.4 | no |  | 1 |
| `faceit-mcp` | 1.0.2 | no |  |  |
| `fakestoreapi-mcp` | 1.0.4 | no |  | 2 |
| `@mrfentmen/fauna-mcp` | 1.0.5 | no |  | 1 |
| `fbi-crime-mcp` | 1.0.5 | no |  |  |
| `fbi-wanted-mcp` | 1.0.3 | no |  | 1 |
| `fcc-mcp` | 1.1.0 | no |  |  |
| `fdic-mcp` | 1.1.0 | no |  |  |
| `fear-greed-mcp` | 1.0.3 | no |  | 2 |
| `fec-mcp` | 1.1.0 | no |  |  |
| `@mrfentmen/federal-register-mcp` | 1.0.4 | no |  | 1 |
| `feedly-mcp` | 1.0.5 | no |  |  |
| `fema-mcp` | 1.0.3 | no |  | 1 |
| `fendi-mcp` | 1.0.6 | no |  |  |
| `@mrfentmen/figma-mcp` | 1.1.6 | no |  |  |
| `figshare-mcp` | 1.0.2 | no |  | 1 |
| `filerun-mcp` | 1.0.1 | no |  |  |
| `finalspace-mcp` | 1.0.2 | no |  | 2 |
| `financial-data-mcp` | 1.0.3 | no |  | 3 |
| `fingrid-mcp` | 1.0.3 | no |  | 1 |
| `@mrfentmen/finnhub-mcp` | 1.0.1 | no |  |  |
| `firefox-addons-mcp` | 1.0.2 | no |  | 2 |
| `flaky-history-mcp` | 1.0.3 | no |  | 2 |
| `flathub-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/flickr-mcp` | 1.0.2 | no |  | 1 |
| `flipside-mcp` | 1.0.5 | no |  |  |
| `flood-mcp` | 1.0.2 | no |  | 2 |
| `fmp-mcp` | 1.1.2 | no |  |  |
| `folk-mcp` | 1.0.6 | no |  |  |
| `fontsource-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/footballdata-mcp` | 1.0.1 | no |  |  |
| `formbricks-mcp` | 1.0.1 | no |  |  |
| `@mrfentmen/fortnite-mcp` | 1.0.3 | no |  | 2 |
| `fourchan-mcp` | 1.0.2 | no |  | 2 |
| `fox-mcp` | 1.0.2 | no |  | 2 |
| `frankfurter-mcp` | 1.0.2 | yes |  | 1 |
| `fred-mcp` | 1.1.0 | no |  |  |
| `freegeoip-mcp` | 1.0.2 | no |  | 2 |
| `freeipapi-mcp` | 1.0.2 | no |  | 2 |
| `freetogame-mcp` | 1.0.2 | no |  | 1 |
| `@mrfentmen/freshdesk-mcp` | 1.1.7 | no |  |  |
| `frigate-mcp` | 1.0.2 | no |  |  |
| `fruityvice-mcp` | 1.0.2 | no |  | 2 |
| `fuel-economy-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/fueleconomy-mcp` | 1.0.5 | no |  |  |
| `futurama-mcp` | 1.0.2 | no |  | 1 |
| `gamebanana-mcp` | 1.0.3 | no |  | 3 |
| `gateio-mcp` | 1.0.2 | no |  | 2 |
| `gatus-mcp` | 1.0.6 | no |  |  |
| `gbif-mcp` | 1.1.0 | no |  |  |
| `gdacs-mcp` | 1.0.0 | no |  |  |
| `gdelt-mcp` | 1.0.3 | no |  | 3 |
| `geckoterminal-mcp` | 1.0.8 | no |  |  |
| `@mrfentmen/gemini-mcp` | 1.0.2 | no |  | 2 |
| `genderize-mcp` | 1.0.2 | no |  | 1 |
| `genius-mcp` | 1.1.0 | no |  |  |
| `genrenator-mcp` | 1.0.2 | no |  | 2 |
| `geojs-mcp` | 1.0.2 | no |  | 1 |
| `geolocation-db-mcp` | 1.0.2 | no |  | 1 |
| `ghibli-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/gimp-mcp` | 1.0.3 | no |  |  |
| `git-reflog-archaeologist-mcp` | 1.0.3 | no |  | 1 |
| `@mrfentmen/gitea-mcp` | 1.0.3 | no |  | 2 |
| `github-intel-mcp` | 1.0.2 | no |  |  |
| `@mrfentmen/github-mcp` | 1.1.6 | no |  |  |
| `github-status-mcp` | 1.1.0 | no |  |  |
| `gitignore-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/gitlab-mcp` | 1.2.2 | no |  |  |
| `gleif-mcp` | 1.0.2 | no |  | 2 |
| `glossier-mcp` | 1.0.6 | no |  |  |
| `go-proxy-mcp` | 1.0.5 | yes |  | 2 |
| `goatcounter-mcp` | 1.0.1 | no |  |  |
| `@mrfentmen/godot-mcp` | 1.0.2 | no |  | 2 |
| `gog-mcp` | 1.0.6 | no |  |  |
| `gold-prices-mcp` | 1.0.6 | yes |  |  |
| `google-autocomplete-mcp` | 1.0.2 | no |  | 2 |
| `google-books-mcp` | 1.1.3 | no |  |  |
| `google-fonts-mcp` | 1.0.6 | no |  |  |
| `googlenews-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/gopher-mcp` | 1.0.3 | no |  | 2 |
| `gorjana-mcp` | 1.1.3 | no |  |  |
| `@mrfentmen/got-mcp` | 1.0.4 | no |  | 2 |
| `gotify-mcp` | 1.0.6 | no |  |  |
| `govinfo-mcp` | 1.0.3 | no |  | 2 |
| `govtrack-mcp` | 1.0.2 | no |  | 2 |
| `gpodder-mcp` | 1.0.2 | no |  | 1 |
| `@mrfentmen/greenhouse-mcp` | 1.0.6 | no |  |  |
| `greynoise-mcp` | 1.1.0 | no |  |  |
| `@mrfentmen/groq-mcp` | 1.0.5 | no |  |  |
| `@mrfentmen/guardian-mcp` | 1.0.3 | no |  | 2 |
| `gucci-mcp` | 1.0.6 | no |  |  |
| `guru-mcp` | 1.0.1 | no |  |  |
| `gutenberg-mcp` | 1.0.0 | no |  |  |
| `gutendex-mcp` | 1.0.3 | yes |  | 1 |
| `gw2-mcp` | 1.0.4 | no |  | 2 |
| `@mrfentmen/hacker-news-mcp` | 1.0.1 | no |  | 2 |
| `@mrfentmen/hackernews-mcp` | 1.0.0 | no |  |  |
| `hackertarget-mcp` | 1.1.3 | no |  |  |
| `harry-potter-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/hashnode-mcp` | 1.1.6 | no |  |  |
| `hasura-mcp` | 1.0.3 | no |  |  |
| `hebcal-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/helius-mcp` | 1.0.7 | no |  |  |
| `hermes-mcp` | 1.0.6 | no |  |  |
| `hex-mcp` | 1.0.3 | no |  | 3 |
| `hibp-mcp` | 1.1.5 | no |  |  |
| `hiddenpalace-mcp` | 1.0.3 | no |  | 3 |
| `hikingproject-mcp` | 1.0.1 | no |  |  |
| `hipsum-mcp` | 1.0.2 | no |  | 2 |
| `hn-reddit-mcp` | 1.0.2 | no |  | 2 |
| `holidays-mcp` | 1.0.3 | yes |  | 1 |
| `homebrew-mcp` | 1.0.2 | no |  | 2 |
| `html-meta-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/html-to-markdown-mcp` | 1.0.3 | no |  |  |
| `http-inspector-mcp` | 1.0.2 | no |  | 3 |
| `@mrfentmen/httpbin-mcp` | 1.0.2 | no |  | 3 |
| `htx-mcp` | 1.0.2 | no |  | 1 |
| `hubitat-mcp` | 1.0.3 | no |  | 2 |
| `@mrfentmen/hubspot-mcp` | 1.1.6 | no |  |  |
| `hudsonrock-mcp` | 1.0.2 | no |  | 1 |
| `@mrfentmen/huggingface-mcp` | 1.0.3 | no |  | 3 |
| `iana-tld-mcp` | 1.0.2 | no |  | 1 |
| `iban-validator-mcp` | 1.0.2 | no |  |  |
| `icebox-mcp` | 1.0.6 | no |  |  |
| `ics-generator-mcp` | 1.0.3 | no |  | 2 |
| `ietf-mcp` | 1.0.2 | no |  | 2 |
| `ifandco-mcp` | 1.0.7 | no |  |  |
| `ifdb-mcp-server` | 1.0.0 | no |  |  |
| `@mrfentmen/image-tools-mcp` | 1.0.3 | no |  |  |
| `imf-mcp` | 1.1.0 | no |  |  |
| `@mrfentmen/inaturalist-mcp` | 1.0.4 | no |  | 3 |
| `incident-timeline-mcp` | 1.0.2 | no |  | 1 |
| `independent-reserve-mcp` | 1.0.2 | no |  | 3 |
| `infisical-mcp` | 1.0.3 | no |  | 2 |
| `inngest-mcp` | 1.0.3 | no |  | 2 |
| `inspirobot-mcp` | 1.0.2 | no |  | 2 |
| `interpro-mcp` | 1.0.2 | no |  | 2 |
| `invoice-mcp` | 1.1.2 | no |  |  |
| `ip-geo-mcp` | 1.0.3 | no |  | 3 |
| `ipapi-mcp` | 1.0.2 | no |  | 2 |
| `ipdata-mcp` | 1.0.0 | no |  |  |
| `ipify-mcp` | 1.0.2 | no |  | 1 |
| `ipinfo-mcp` | 1.0.2 | no |  | 1 |
| `ipma-mcp` | 1.0.2 | no |  | 2 |
| `ipwhois-mcp` | 1.0.2 | no |  | 1 |
| `irail-mcp` | 1.0.2 | no |  | 2 |
| `isbndb-mcp` | 1.1.2 | no |  |  |
| `@mrfentmen/iss-mcp` | 1.1.3 | yes |  |  |
| `iss-tracker-mcp` | 1.0.0 | no |  |  |
| `itis-mcp` | 1.0.3 | no |  | 3 |
| `itunes-mcp` | 1.0.3 | yes |  | 2 |
| `@mrfentmen/itunes-search-api-mcp` | 1.0.0 | no |  |  |
| `@mrfentmen/itunes-search-mcp` | 1.0.0 | no |  |  |
| `jacquesmariemage-mcp` | 1.1.3 | no |  |  |
| `@mrfentmen/jellyfin-mcp` | 1.0.2 | no |  |  |
| `jetbrains-mcp` | 1.0.6 | no |  |  |
| `jikan-mcp` | 1.1.0 | no |  |  |
| `jisho-mcp` | 1.0.3 | no |  | 4 |
| `@mrfentmen/job-search-mcp` | 1.0.6 | no |  |  |
| `jobicy-mcp` | 1.0.6 | no |  |  |
| `jokeapi-mcp` | 1.0.5 | no |  |  |
| `jokes-mcp` | 1.0.2 | no |  | 2 |
| `jolpica-mcp` | 1.1.3 | yes |  |  |
| `jpl-fireball-mcp` | 1.0.2 | no |  | 2 |
| `jpl-sbdb-mcp` | 1.0.2 | no |  | 3 |
| `@mrfentmen/jsdelivr-mcp` | 1.0.2 | no |  | 3 |
| `json-schema-store-mcp` | 1.0.3 | no |  | 4 |
| `json-tools-mcp` | 1.0.2 | no |  | 1 |
| `jsonplaceholder-mcp` | 1.0.2 | no |  | 2 |
| `jwt-tools-mcp` | 1.0.2 | no |  | 2 |
| `k6-mcp` | 1.0.5 | no |  |  |
| `@mrfentmen/kanye-mcp` | 1.0.3 | no |  | 2 |
| `kith-mcp` | 1.0.5 | no |  |  |
| `kitsu-mcp` | 1.0.2 | no |  | 2 |
| `kiwi-mcp` | 1.0.5 | no |  |  |
| `@mrfentmen/klaviyo-mcp` | 1.1.6 | no |  |  |
| `kma-mcp` | 1.0.1 | no |  |  |
| `knmi-mcp` | 1.0.1 | no |  |  |
| `kong-mcp` | 1.0.5 | no |  |  |
| `kopia-mcp` | 1.0.1 | no |  |  |
| `kraken-mcp` | 1.0.6 | no |  |  |
| `kucoin-mcp` | 1.0.1 | no |  |  |
| `lago-mcp` | 1.0.5 | no |  |  |
| `languagetool-mcp` | 1.0.3 | no |  | 3 |
| `lastfm-mcp` | 1.0.5 | no |  |  |
| `launch-library-mcp` | 1.0.0 | no |  |  |
| `@mrfentmen/leetcode-mcp` | 1.0.3 | no |  | 2 |
| `lemmy-mcp` | 1.0.4 | no |  | 4 |
| `lemonsqueezy-mcp` | 1.1.3 | no |  |  |
| `lever-mcp` | 1.0.6 | no |  |  |
| `librivox-mcp` | 1.0.5 | no |  |  |
| `license-boundary-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/lichess-mcp` | 1.0.3 | no |  | 2 |
| `lifx-mcp` | 1.0.3 | no |  | 1 |
| `ligo-mcp` | 1.0.3 | no |  | 2 |
| `@mrfentmen/linear-mcp` | 1.1.6 | no |  |  |
| `link-shortener-mcp` | 1.0.2 | no |  | 2 |
| `liquipedia-mcp` | 1.0.2 | no |  | 2 |
| `listenbrainz-mcp` | 1.0.2 | no |  | 2 |
| `listennotes-mcp` | 1.1.6 | no |  |  |
| `literal-mcp` | 1.0.1 | no |  |  |
| `lobsters-mcp` | 1.0.2 | no |  | 1 |
| `loc-mcp` | 1.1.0 | no |  |  |
| `@mrfentmen/lockstep-mcp` | 1.0.1 | no |  |  |
| `@mrfentmen/logseq-mcp` | 1.0.1 | no |  |  |
| `logto-mcp` | 1.0.2 | no |  |  |
| `lol-datadragon-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/loops-mcp` | 1.0.5 | no |  |  |
| `@mrfentmen/lorem-mcp` | 1.0.2 | no |  | 2 |
| `lostmedia-mcp` | 1.0.3 | no |  | 3 |
| `lotr-mcp` | 1.0.2 | no |  | 2 |
| `louisvuitton-mcp` | 1.1.2 | no |  |  |
| `luchtmeetnet-mcp` | 1.0.3 | no |  | 1 |
| `lyrics-mcp` | 1.0.2 | no |  | 2 |
| `mac-lookup-mcp` | 1.0.2 | no |  | 1 |
| `madhappy-mcp` | 1.1.3 | no |  |  |
| `mail-tm-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/mailchimp-mcp` | 1.1.6 | no |  |  |
| `mailgun-mcp` | 1.1.2 | no |  |  |
| `mailjet-mcp` | 1.0.5 | no |  |  |
| `maltiverse-mcp` | 1.0.2 | no |  | 2 |
| `mangadex-mcp` | 1.0.3 | no |  | 2 |
| `marine-forecast-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/markdown-mcp` | 1.0.3 | no |  | 3 |
| `marketstack-mcp` | 1.1.2 | no |  |  |
| `@mrfentmen/mast-mcp` | 1.0.5 | no |  | 1 |
| `@mrfentmen/mastodon-mcp` | 1.1.2 | no |  |  |
| `math-tools-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/maven-central-mcp` | 1.0.0 | no |  |  |
| `maven-info-mcp` | 1.0.2 | no |  | 2 |
| `mbta-mcp` | 1.0.2 | no |  | 2 |
| `mcp-auditor-mcp` | 1.0.5 | no |  |  |
| `mcstatus-mcp` | 1.0.2 | no |  | 1 |
| `mdn-search-mcp` | 1.0.2 | no |  | 2 |
| `medrxiv-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/meilisearch-mcp` | 1.0.2 | no |  |  |
| `@mrfentmen/meme-generator-mcp` | 1.0.2 | yes |  | 2 |
| `meme-reference-mcp` | 1.0.0 | no |  |  |
| `memegen-mcp` | 1.0.3 | no |  | 3 |
| `mempool-mcp` | 1.0.1 | no |  |  |
| `meowfacts-mcp` | 1.0.2 | no |  | 1 |
| `mercury-mcp` | 1.0.5 | no |  |  |
| `merge-conflict-forecaster-mcp` | 1.0.2 | no |  |  |
| `met-no-mcp` | 1.0.0 | no |  |  |
| `@mrfentmen/metmuseum-mcp` | 1.0.2 | yes |  | 2 |
| `metoffice-mcp` | 1.0.1 | no |  |  |
| `metronome-mcp` | 1.0.2 | no |  | 2 |
| `mexc-mcp` | 1.0.2 | no |  | 2 |
| `mgm-mcp` | 1.0.3 | no |  | 2 |
| `microlink-mcp` | 1.0.2 | no |  | 1 |
| `midi-tools-mcp` | 1.0.2 | no |  | 1 |
| `migration-map-mcp` | 1.0.3 | no |  |  |
| `milvus-mcp` | 1.0.3 | no |  |  |
| `minecraft-mojang-mcp` | 1.0.2 | no |  | 2 |
| `missoma-mcp` | 1.1.3 | no |  |  |
| `@mrfentmen/mitre-attack-mcp` | 1.0.3 | no |  | 4 |
| `mixcloud-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/mixpanel-mcp` | 1.0.7 | no |  |  |
| `mlb-mcp` | 1.0.2 | no |  | 2 |
| `mlb-stats-mcp` | 1.0.0 | no |  |  |
| `mobygames-mcp` | 1.1.3 | no |  |  |
| `@mrfentmen/modrinth-mcp` | 1.0.3 | no |  | 2 |
| `moon-phase-mcp` | 1.0.2 | no |  | 2 |
| `mtg-mcp` | 1.0.2 | no |  | 3 |
| `muffinlabs-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/musicbrainz-mcp` | 1.0.2 | no |  | 2 |
| `mygene-mcp` | 1.0.2 | no |  | 2 |
| `myvariant-mcp` | 1.0.2 | no |  | 1 |
| `nager-mcp` | 1.0.5 | no |  |  |
| `name-age-mcp` | 1.0.2 | no |  | 2 |
| `name-generator-mcp` | 1.0.2 | no |  | 2 |
| `nanoleaf-mcp` | 1.0.1 | no |  |  |
| `nasa-eonet-mcp` | 1.0.0 | no |  |  |
| `nasa-epic-mcp` | 1.0.2 | no |  | 2 |
| `nasa-images-mcp` | 1.0.3 | no |  |  |
| `@mrfentmen/nasa-mcp` | 1.1.0 | yes |  |  |
| `nasa-power-mcp` | 1.0.5 | no |  | 2 |
| `nasa-tle-mcp` | 1.0.2 | no |  | 2 |
| `nationalize-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/navidrome-mcp` | 1.0.1 | no |  |  |
| `nbp-mcp` | 1.0.3 | no |  | 2 |
| `ndbc-buoy-mcp` | 1.0.2 | no |  | 2 |
| `netatmo-mcp` | 1.0.1 | no |  |  |
| `netdata-mcp` | 1.0.5 | no |  |  |
| `neverbounce-mcp` | 1.0.0 | no |  |  |
| `nextbus-mcp` | 1.0.2 | no |  | 1 |
| `@mrfentmen/nhl-mcp` | 1.0.2 | no |  | 2 |
| `nhtsa-mcp` | 1.0.0 | no |  |  |
| `nix-packages-mcp` | 1.0.2 | no |  | 2 |
| `noaa-ncei-mcp` | 1.0.2 | no |  | 2 |
| `noahny-mcp` | 1.1.3 | no |  |  |
| `nobel-mcp` | 1.0.3 | no |  | 2 |
| `nodered-mcp` | 1.0.3 | no |  |  |
| `nominatim-mcp` | 1.0.2 | yes |  | 1 |
| `nonprofit-mcp` | 1.0.5 | no |  |  |
| `@mrfentmen/notion-mcp` | 1.1.6 | no |  |  |
| `novu-mcp` | 1.1.6 | no |  |  |
| `npm-search-mcp` | 1.1.0 | no |  |  |
| `npms-mcp` | 1.0.3 | no |  | 2 |
| `nps-mcp` | 1.0.3 | no |  | 2 |
| `@mrfentmen/ns-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/ntfy-mcp` | 1.1.6 | no |  |  |
| `nuget-mcp` | 1.0.2 | no |  | 1 |
| `number-tools-mcp` | 1.0.2 | no |  | 1 |
| `nutritionix-mcp` | 1.0.3 | no |  | 2 |
| `nvd-cve-mcp` | 1.1.0 | no |  |  |
| `nws-mcp` | 1.0.0 | no |  |  |
| `nyc-arrests-mcp` | 1.0.5 | no |  |  |
| `nyc311-mcp` | 1.0.2 | no |  | 2 |
| `nylas-mcp` | 1.0.5 | no |  |  |
| `ocrspace-mcp` | 1.0.5 | no |  |  |
| `odysee-mcp` | 1.0.3 | no |  | 4 |
| `@mrfentmen/oecd-mcp` | 1.1.0 | no |  |  |
| `oeis-mcp` | 1.0.4 | no |  | 1 |
| `office-quotes-mcp` | 1.0.3 | no |  | 3 |
| `ogs-mcp` | 1.0.3 | no |  | 2 |
| `ohdear-mcp` | 1.1.2 | no |  |  |
| `@mrfentmen/okx-mcp` | 1.0.3 | no |  | 3 |
| `omdb-mcp` | 1.1.4 | no |  |  |
| `on-this-day-mcp` | 1.0.2 | no |  | 2 |
| `onesignal-mcp` | 1.1.3 | no |  |  |
| `@mrfentmen/open-food-facts-mcp` | 1.0.3 | no |  | 2 |
| `open-library-mcp` | 1.0.2 | yes |  | 2 |
| `@mrfentmen/open-meteo-mcp` | 1.1.0 | yes |  |  |
| `open-notify-mcp` | 1.0.2 | no |  | 1 |
| `open-vsx-mcp` | 1.0.2 | no |  | 2 |
| `open5e-mcp` | 1.0.2 | no |  | 3 |
| `@mrfentmen/openalex-mcp` | 1.1.0 | no |  |  |
| `openapi-scout-mcp` | 1.0.3 | no |  |  |
| `openbrewery-mcp` | 1.0.2 | yes |  | 2 |
| `openbrewerydb-mcp` | 1.0.0 | no |  |  |
| `openchargemap-mcp` | 1.0.5 | no |  |  |
| `opendota-mcp` | 1.0.2 | no |  | 2 |
| `openf1-mcp` | 1.0.2 | no |  | 3 |
| `@mrfentmen/openfda-api-mcp` | 1.0.0 | no |  |  |
| `openfda-mcp` | 1.1.0 | yes |  |  |
| `@mrfentmen/openlibrary-mcp` | 1.0.6 | no |  |  |
| `openligadb-soccer-mcp` | 1.0.2 | no |  | 1 |
| `openmoji-mcp` | 1.0.6 | no |  |  |
| `openpanel-mcp` | 1.1.2 | no |  |  |
| `openplaques-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/openrouter-mcp` | 1.1.6 | no |  |  |
| `openrouteservice-mcp` | 1.1.3 | no |  |  |
| `@mrfentmen/opensearch-mcp` | 1.0.2 | no |  |  |
| `opensecrets-mcp` | 1.0.3 | no |  |  |
| `opensky-mcp` | 1.0.2 | yes |  | 2 |
| `opentargets-mcp` | 1.0.3 | no |  | 3 |
| `opentdb-mcp` | 1.0.5 | no |  |  |
| `openverse-mcp` | 1.0.2 | no |  | 2 |
| `openwhyd-mcp` | 1.0.2 | no |  | 2 |
| `opnsense-mcp` | 1.0.5 | no |  |  |
| `@mrfentmen/opsgenie-mcp` | 1.0.5 | no |  |  |
| `osf-mcp` | 1.0.3 | no |  | 3 |
| `osm-notes-mcp` | 1.0.0 | no |  |  |
| `osrm-mcp` | 1.0.2 | no |  | 3 |
| `osrs-mcp` | 1.0.5 | no |  |  |
| `osv-mcp` | 1.0.2 | no |  | 2 |
| `otp-mcp` | 1.0.2 | no |  | 2 |
| `otx-mcp` | 1.0.1 | no |  |  |
| `overpass-mcp` | 1.0.3 | no |  | 4 |
| `owncloud-mcp` | 1.0.3 | no |  |  |
| `oyez-mcp` | 1.0.3 | no |  | 3 |
| `@mrfentmen/package-registry-mcp` | 1.0.2 | no |  | 2 |
| `packagist-mcp` | 1.0.3 | no |  |  |
| `paddle-mcp` | 1.0.5 | no |  |  |
| `password-breach-check-mcp` | 1.0.2 | no |  | 1 |
| `password-generator-mcp` | 1.0.2 | no |  | 1 |
| `password-strength-mcp` | 1.0.2 | no |  |  |
| `patents-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/paypal-mcp` | 1.1.6 | no |  |  |
| `pbdb-mcp` | 1.0.2 | no |  | 2 |
| `pdb-mcp` | 1.0.0 | no |  |  |
| `@mrfentmen/pdf-generator-mcp` | 1.0.3 | no |  |  |
| `peakdesign-mcp` | 1.1.3 | no |  |  |
| `peertube-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/pexels-mcp` | 1.0.1 | no |  |  |
| `phemex-mcp` | 1.0.2 | no |  | 2 |
| `phone-validator-mcp` | 1.0.2 | no |  |  |
| `photon-mcp` | 1.0.2 | no |  | 2 |
| `picsum-mcp` | 1.0.3 | no |  | 2 |
| `pihole-mcp` | 1.0.3 | no |  | 2 |
| `@mrfentmen/pinata-mcp` | 1.1.2 | no |  |  |
| `pingdom-mcp` | 1.1.2 | no |  |  |
| `@mrfentmen/pinterest-mcp` | 1.0.7 | no |  |  |
| `pixelfed-mcp` | 1.0.2 | no |  | 3 |
| `placehold-mcp` | 1.0.2 | no |  | 1 |
| `placeholder-images-mcp` | 1.0.2 | yes |  | 2 |
| `plaid-mcp` | 1.1.5 | no |  |  |
| `plain-mcp` | 1.1.3 | no |  |  |
| `playcanvas-mcp` | 1.1.2 | no |  |  |
| `plos-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/pocketbase-mcp` | 1.0.1 | no |  |  |
| `@mrfentmen/pod-upload-mcp` | 1.0.0 | no |  |  |
| `poetry-mcp` | 1.0.2 | no |  | 2 |
| `pokeapi-mcp` | 1.0.3 | no |  | 2 |
| `pokemon-tcg-mcp` | 1.0.3 | no |  | 1 |
| `police-transparency-mcp` | 1.0.2 | no |  | 2 |
| `poloniex-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/polygon-mcp` | 1.1.6 | no |  |  |
| `port-scanner-mcp` | 1.0.3 | no |  | 2 |
| `postcodes-mcp` | 1.0.2 | no |  | 2 |
| `posthog-mcp` | 1.1.6 | no |  |  |
| `postman-echo-mcp` | 1.0.3 | no |  | 4 |
| `@mrfentmen/postmark-mcp` | 1.0.5 | no |  |  |
| `prada-mcp` | 1.0.6 | no |  |  |
| `prayer-times-mcp` | 1.0.2 | no |  | 2 |
| `predictit-mcp` | 1.0.6 | no |  |  |
| `producthunt-mcp` | 1.1.3 | no |  |  |
| `protondb-mcp` | 1.0.2 | no |  | 2 |
| `prx-mcp` | 1.0.3 | no |  | 2 |
| `@mrfentmen/pubchem-mcp` | 1.1.0 | no |  |  |
| `pubg-mcp` | 1.0.1 | no |  |  |
| `public-holidays-mcp` | 1.0.0 | no |  |  |
| `publicwww-mcp` | 1.0.5 | no |  |  |
| `@mrfentmen/pubmed-mcp` | 1.1.0 | no |  |  |
| `pusher-mcp` | 1.1.4 | no |  |  |
| `pvgis-mcp` | 1.0.5 | no |  |  |
| `pydio-mcp` | 1.0.1 | no |  |  |
| `pypi-mcp` | 1.1.0 | no |  |  |
| `pypi-stats-mcp` | 1.0.0 | no |  |  |
| `qbittorrent-mcp` | 1.0.5 | no |  |  |
| `qr-code-mcp` | 1.0.3 | no |  | 2 |
| `quip-mcp` | 1.1.2 | no |  |  |
| `quotes-mcp` | 1.0.2 | yes |  | 1 |
| `quran-mcp` | 1.0.3 | no |  | 3 |
| `radarr-mcp` | 1.0.5 | no |  |  |
| `radio-browser-mcp` | 1.0.3 | no |  | 3 |
| `radio-garden-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/raindrop-mcp` | 1.0.5 | no |  |  |
| `rainviewer-mcp` | 1.0.3 | yes |  | 1 |
| `random-animals-mcp` | 1.0.3 | no |  | 2 |
| `random-word-mcp` | 1.0.2 | no |  | 1 |
| `randomuser-mcp` | 1.0.2 | yes |  | 1 |
| `rawg-mcp` | 1.1.3 | no |  |  |
| `rcsb-pdb-mcp` | 1.0.2 | no |  | 2 |
| `reactome-mcp` | 1.0.3 | no |  | 3 |
| `@mrfentmen/readwise-mcp` | 1.0.5 | no |  |  |
| `rebrickable-mcp` | 1.0.3 | no |  | 2 |
| `@mrfentmen/reddit-mcp` | 1.1.0 | no |  |  |
| `@mrfentmen/regex-mcp` | 1.0.2 | no |  | 2 |
| `release-notes-forge-mcp` | 1.0.2 | no |  | 1 |
| `remoteok-mcp` | 1.0.6 | no |  |  |
| `repo-forensics-mcp` | 1.0.2 | no |  |  |
| `repology-mcp` | 1.0.1 | no |  |  |
| `@mrfentmen/resend-mcp` | 1.1.6 | no |  |  |
| `restful-api-dev-mcp` | 1.0.2 | no |  | 2 |
| `retrogachievements-mcp` | 1.0.3 | no |  | 1 |
| `rhymebrain-mcp` | 1.0.2 | no |  | 1 |
| `rick-and-morty-mcp` | 1.0.2 | no |  | 2 |
| `riddles-mcp` | 1.0.4 | no |  | 4 |
| `riotgames-mcp` | 1.0.1 | no |  |  |
| `rng-mcp` | 1.0.3 | no |  | 2 |
| `@mrfentmen/roblox-mcp` | 1.0.3 | no |  | 3 |
| `robohash-mcp` | 1.0.3 | no |  | 1 |
| `rolex-mcp` | 1.0.6 | no |  |  |
| `rollbar-mcp` | 1.1.3 | no |  |  |
| `@mrfentmen/rom-mcp` | 1.2.1 | no |  |  |
| `ron-swanson-mcp` | 1.0.2 | no |  | 2 |
| `ror-mcp` | 1.0.0 | no |  |  |
| `@mrfentmen/rss-mcp` | 1.0.5 | no |  | 2 |
| `rubygems-mcp` | 1.0.3 | no |  |  |
| `runescape-mcp` | 1.0.2 | yes |  | 1 |
| `runtime-support-mcp` | 1.0.2 | no |  |  |
| `rxnav-mcp` | 1.0.2 | no |  | 2 |
| `rxnorm-mcp` | 1.0.0 | no |  |  |
| `rybbit-mcp` | 1.0.5 | no |  |  |
| `saintlaurent-mcp` | 1.0.6 | no |  |  |
| `satnogs-mcp` | 1.0.3 | no |  | 3 |
| `savvycal-mcp` | 1.1.2 | no |  |  |
| `schema-compatibility-mcp` | 1.0.2 | no |  |  |
| `schema-sieve-mcp` | 1.0.3 | no |  | 1 |
| `scrabble-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/screenplaywriter-mcp` | 1.0.3 | no |  |  |
| `scryfall-mcp` | 1.0.6 | no |  |  |
| `seafile-mcp` | 1.0.1 | no |  |  |
| `seatgeek-mcp` | 1.1.2 | no |  |  |
| `secret-hygiene-mcp` | 1.0.2 | no |  | 1 |
| `sefaria-mcp` | 1.0.2 | no |  | 2 |
| `segaretro-mcp` | 1.0.4 | no |  |  |
| `seismicportal-mcp` | 1.0.2 | no |  | 2 |
| `semantic-scholar-mcp` | 1.0.3 | no |  | 3 |
| `semver-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/sentry-mcp` | 1.1.6 | no |  |  |
| `seoul-mcp` | 1.0.1 | no |  |  |
| `septa-mcp` | 1.0.3 | yes |  | 1 |
| `@mrfentmen/setlist-mcp` | 1.0.3 | no |  |  |
| `shebang-sherpa-mcp` | 1.0.1 | no |  |  |
| `shields-mcp` | 1.0.2 | no |  | 2 |
| `shootproof-mcp` | 1.1.2 | no |  |  |
| `shynet-mcp` | 1.0.1 | no |  |  |
| `simbad-mcp` | 1.0.3 | no |  | 3 |
| `simplecast-mcp` | 1.1.2 | no |  |  |
| `skills-movie-mcp` | 1.0.0 | no |  |  |
| `@mrfentmen/slack-mcp` | 1.1.6 | no |  |  |
| `smartrecruiters-mcp` | 1.0.6 | no |  |  |
| `smithsonian-mcp` | 1.0.3 | no |  |  |
| `smogon-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/solana-mcp` | 1.0.2 | no |  | 3 |
| `somafm-mcp` | 1.0.2 | no |  | 1 |
| `sourceforge-mcp` | 1.0.3 | no |  | 2 |
| `sourcegraph-mcp` | 1.0.2 | no |  | 2 |
| `space-launches-mcp` | 1.0.3 | yes |  | 2 |
| `space-weather-mcp` | 1.0.2 | yes |  | 2 |
| `spacedevs-mcp` | 1.1.5 | no |  |  |
| `spaceflight-news-api-mcp` | 1.0.0 | no |  |  |
| `spaceflight-news-mcp` | 1.0.2 | no |  | 1 |
| `spdx-mcp` | 1.0.2 | no |  | 1 |
| `speedrun-mcp` | 1.0.2 | no |  | 2 |
| `split-mcp` | 1.0.1 | no |  |  |
| `@mrfentmen/spoonacular-mcp` | 1.0.3 | no |  | 2 |
| `@mrfentmen/sports-scores-mcp` | 1.0.2 | no |  | 2 |
| `sportyandrich-mcp` | 1.1.3 | no |  |  |
| `@mrfentmen/spotify-mcp` | 1.1.6 | no |  |  |
| `spreaker-mcp` | 1.1.2 | no |  |  |
| `sql-formatter-mcp` | 1.0.2 | no |  |  |
| `@mrfentmen/sqlite-mcp` | 1.0.1 | no |  |  |
| `squarespace-mcp` | 1.0.5 | no |  |  |
| `ssl-cert-mcp` | 1.0.3 | no |  | 2 |
| `ssl-labs-mcp` | 1.0.2 | no |  | 2 |
| `stackexchange-mcp` | 1.1.0 | no |  |  |
| `stadiamaps-mcp` | 1.0.0 | no |  |  |
| `stadiumgoods-mcp` | 1.0.6 | no |  |  |
| `stapi-mcp` | 1.0.4 | no |  | 4 |
| `star-wars-mcp` | 1.0.2 | no |  | 2 |
| `stardew-wiki-mcp` | 1.0.3 | no |  | 3 |
| `statping-mcp` | 1.1.2 | no |  |  |
| `statuscake-mcp` | 1.1.2 | no |  |  |
| `statuspage-mcp` | 1.1.2 | no |  |  |
| `@mrfentmen/steam-mcp` | 1.0.6 | no |  |  |
| `steamspy-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/stellar-mcp` | 1.0.4 | no |  | 4 |
| `storj-mcp` | 1.0.3 | no |  | 1 |
| `stormglass-mcp` | 1.0.1 | no |  |  |
| `@mrfentmen/storyblok-mcp` | 1.0.4 | no |  |  |
| `string-db-mcp` | 1.0.2 | no |  | 1 |
| `@mrfentmen/stripe-mcp` | 1.1.2 | no |  |  |
| `sudoku-mcp` | 1.0.2 | no |  | 2 |
| `sunrise-sunset-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/supabase-mcp` | 1.1.6 | no |  |  |
| `supercell-mcp` | 1.0.1 | no |  |  |
| `supernotes-mcp` | 1.0.1 | no |  |  |
| `surrealdb-mcp` | 1.0.2 | no |  |  |
| `@mrfentmen/suunto-mcp` | 1.0.1 | no |  |  |
| `svgl-mcp` | 1.0.2 | no |  | 1 |
| `swaggerhub-mcp` | 1.0.2 | no |  | 2 |
| `swapi-mcp` | 1.0.0 | no |  |  |
| `swetrix-mcp` | 1.1.2 | no |  |  |
| `swift-bic-mcp` | 1.0.3 | no |  | 2 |
| `swiss-sbb-mcp` | 1.0.2 | no |  | 2 |
| `switchbot-mcp` | 1.0.1 | no |  |  |
| `synoptic-mcp` | 1.0.3 | no |  | 2 |
| `tally-mcp` | 1.1.5 | no |  |  |
| `@mrfentmen/tarot-mcp` | 1.0.2 | no |  | 2 |
| `tasmota-mcp` | 1.0.2 | no |  |  |
| `tdx-mcp` | 1.0.3 | no |  | 2 |
| `techcrunch-mcp` | 1.0.2 | no |  | 1 |
| `teedy-mcp` | 1.0.1 | no |  |  |
| `@mrfentmen/telegram-mcp` | 1.1.6 | no |  |  |
| `telnetbbs-mcp` | 1.0.3 | no |  | 3 |
| `terraform-registry-mcp` | 1.0.2 | no |  | 2 |
| `test-shape-mcp` | 1.0.3 | no |  | 3 |
| `tetriswiki-mcp` | 1.0.3 | no |  | 4 |
| `text-tools-mcp` | 1.0.3 | no |  | 2 |
| `textfiles-mcp` | 1.0.3 | no |  | 3 |
| `tfl-status-mcp` | 1.0.2 | no |  | 2 |
| `the-trivia-api-mcp` | 1.0.2 | no |  | 1 |
| `theaudiodb-mcp` | 1.0.1 | yes |  |  |
| `thecocktaildb-mcp` | 1.0.0 | no |  |  |
| `thegraph-mcp` | 1.0.1 | no |  |  |
| `themealdb-mcp` | 1.0.2 | yes |  |  |
| `themuse-mcp` | 1.0.5 | no |  |  |
| `theoddsapi-mcp` | 1.1.2 | no |  |  |
| `thesportsdb-mcp` | 1.0.2 | no |  | 2 |
| `tides-mcp` | 1.0.2 | no |  | 2 |
| `tiingo-mcp` | 1.0.5 | no |  |  |
| `time-tools-mcp` | 1.0.2 | no |  | 2 |
| `timeapi-mcp` | 1.0.2 | yes |  | 1 |
| `@mrfentmen/tmdb-mcp` | 1.1.0 | no |  |  |
| `toolchain-lens-mcp` | 1.0.2 | no |  |  |
| `torah-mcp` | 1.0.5 | no |  | 2 |
| `trakt-mcp` | 1.0.2 | no |  |  |
| `translation-mcp` | 1.0.2 | no |  | 1 |
| `traxnyc-mcp` | 1.0.5 | no |  |  |
| `treasury-rates-mcp` | 1.1.0 | no |  |  |
| `trivia-mcp` | 1.0.3 | yes |  | 2 |
| `@mrfentmen/trove-mcp` | 1.0.3 | no |  |  |
| `tunein-mcp` | 1.0.2 | no |  | 2 |
| `turbosquid-mcp` | 1.1.2 | no |  |  |
| `@mrfentmen/tvdb-mcp` | 1.0.1 | no |  |  |
| `tvmaze-mcp` | 1.0.2 | yes |  | 1 |
| `twelvedata-mcp` | 1.1.2 | no |  |  |
| `twilio-mcp-server` | 1.0.8 | no |  |  |
| `@mrfentmen/twitch-mcp` | 1.1.2 | no |  |  |
| `typeform-mcp` | 1.1.6 | no |  |  |
| `ui-avatars-mcp` | 1.0.3 | no |  | 1 |
| `@mrfentmen/ukparliament-mcp` | 1.0.4 | no |  | 1 |
| `@mrfentmen/ukpolice-mcp` | 1.0.3 | no |  | 2 |
| `un-sdg-mcp` | 1.0.2 | no |  | 2 |
| `uncomtrade-mcp` | 1.0.2 | no |  | 2 |
| `unicode-mcp` | 1.0.3 | no |  | 3 |
| `unicode-security-mcp` | 1.0.2 | no |  | 1 |
| `uniprot-mcp` | 1.1.0 | no |  |  |
| `@mrfentmen/unit-converter-mcp` | 1.0.3 | no |  | 1 |
| `@mrfentmen/unpaywall-mcp` | 1.0.2 | no |  | 2 |
| `unpkg-mcp` | 1.0.2 | no |  | 2 |
| `upbit-mcp` | 1.0.2 | no |  | 2 |
| `upcitemdb-mcp` | 1.0.2 | no |  | 2 |
| `uptime-kuma-mcp` | 1.0.6 | no |  |  |
| `uptime-mcp` | 1.0.3 | no |  | 3 |
| `uptimerobot-mcp` | 1.1.2 | no |  |  |
| `@mrfentmen/urban-dictionary-mcp` | 1.0.3 | yes |  | 2 |
| `urlhaus-mcp` | 1.0.7 | no |  |  |
| `urlscan-mcp` | 1.1.0 | no |  |  |
| `usajobs-mcp` | 1.0.5 | no |  |  |
| `@mrfentmen/usaspending-mcp` | 1.1.0 | yes |  |  |
| `usda-food-mcp` | 1.0.3 | yes |  | 1 |
| `uselessfacts-mcp` | 1.0.2 | yes |  |  |
| `usgs-earthquakes-mcp` | 1.0.2 | yes |  | 2 |
| `usgs-mcp` | 1.0.0 | no |  |  |
| `usgs-water-mcp` | 1.0.2 | no |  | 1 |
| `usps-mcp` | 1.0.4 | no |  |  |
| `@mrfentmen/uuid-mcp` | 1.0.5 | no |  | 2 |
| `@mrfentmen/valorant-mcp` | 1.0.2 | no |  | 1 |
| `vam-mcp` | 1.0.4 | no |  | 1 |
| `vapi-mcp` | 1.0.5 | no |  |  |
| `vatcomply-mcp` | 1.0.2 | no |  | 1 |
| `vatsim-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/vercel-mcp` | 1.1.6 | no |  |  |
| `@mrfentmen/vg-resource-mcp` | 1.0.4 | no | 3 |  |
| `vgmdb-mcp` | 1.0.3 | no |  | 3 |
| `vin-decoder-mcp` | 1.0.3 | no |  | 4 |
| `virustotal-mcp` | 1.0.1 | no |  |  |
| `@mrfentmen/vndb-mcp` | 1.0.4 | no |  | 2 |
| `vocadb-mcp` | 1.0.3 | no |  | 4 |
| `@mrfentmen/walkthrough-mcp` | 1.0.1 | no |  |  |
| `waqi-mcp` | 1.0.3 | no |  | 2 |
| `warframe-mcp` | 1.0.3 | no |  | 3 |
| `wargaming-mcp` | 1.0.1 | no |  |  |
| `@mrfentmen/wasabi-mcp` | 1.0.1 | no |  |  |
| `waterdata-mcp` | 1.0.0 | no |  |  |
| `wayback-mcp` | 1.0.5 | no |  |  |
| `@mrfentmen/weather-mcp` | 1.0.3 | yes |  | 2 |
| `weatherbit-mcp` | 1.0.3 | no |  | 2 |
| `weaviate-mcp` | 1.0.3 | no |  | 1 |
| `weightsbiases-mcp` | 1.1.2 | no |  |  |
| `wellcome-mcp` | 1.0.3 | no |  | 4 |
| `@mrfentmen/wger-mcp` | 1.0.5 | no |  | 3 |
| `whiskyhunter-mcp` | 1.0.5 | no |  |  |
| `whitebit-mcp` | 1.0.3 | no |  | 4 |
| `who-mcp` | 1.0.3 | no |  | 3 |
| `@mrfentmen/whois-mcp` | 1.0.3 | yes |  | 3 |
| `wikibooks-mcp` | 1.0.3 | no |  | 4 |
| `@mrfentmen/wikidata-mcp` | 1.0.3 | yes |  | 2 |
| `wikimedia-commons-mcp` | 1.0.3 | yes |  | 2 |
| `wikinews-mcp` | 1.0.3 | no |  | 3 |
| `@mrfentmen/wikipedia-mcp` | 1.0.3 | no |  | 3 |
| `wikipedia-pageviews-mcp` | 1.1.0 | no |  |  |
| `wikiquote-mcp` | 1.0.3 | no |  | 3 |
| `wikisource-mcp` | 1.0.3 | no |  | 3 |
| `wikispecies-mcp` | 1.0.3 | no |  | 2 |
| `wikitrending-mcp` | 1.0.3 | no |  | 3 |
| `wikivoyage-mcp` | 1.0.4 | no |  |  |
| `wiktionary-mcp` | 1.0.3 | no |  | 3 |
| `@mrfentmen/wise-mcp` | 1.1.2 | no |  |  |
| `wordle-helper-mcp` | 1.0.3 | no |  | 4 |
| `@mrfentmen/wordpress-mcp` | 1.0.3 | yes |  | 3 |
| `workable-mcp` | 1.0.5 | no |  |  |
| `worktree-orbit-mcp` | 1.0.2 | no |  |  |
| `@mrfentmen/worldbank-mcp` | 1.0.4 | no |  |  |
| `wpengine-mcp` | 1.0.2 | no |  |  |
| `wttr-mcp` | 1.0.3 | no |  | 4 |
| `wynncraft-mcp` | 1.0.4 | no |  | 2 |
| `xkcd-mcp` | 1.0.3 | no |  | 3 |
| `yaml-mcp` | 1.0.2 | no |  |  |
| `yesno-mcp` | 1.0.4 | no |  |  |
| `@mrfentmen/yfinance-mcp` | 1.0.6 | yes |  |  |
| `@mrfentmen/youtrack-mcp` | 1.0.5 | no |  |  |
| `@mrfentmen/youtube-mcp` | 1.1.7 | no |  |  |
| `yr-metno-mcp` | 1.0.4 | yes |  | 3 |
| `yugioh-mcp` | 1.0.3 | no |  | 1 |
| `zenodo-mcp` | 1.0.3 | no |  | 3 |
| `zip-codes-mcp` | 1.0.3 | no |  | 2 |
| `zitadel-mcp` | 1.0.2 | no |  |  |
| `zork-mcp` | 1.0.3 | no |  | 1 |
