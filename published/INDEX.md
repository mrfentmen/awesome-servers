# Published snapshot

This directory is the code users install. It was mirrored from the npm
registry by `scripts/sync-published-snapshot.py`, then repaired in place:
every tool that answered `Not yet implemented` has a real implementation,
and no package carries a licence gate. `servers/` holds the older source
and is not what ships.

Regenerate this summary with `python3 scripts/index-published.py`. Re-run
`sync-published-snapshot.py` only when every local fix has been published —
it overwrites `dist/` from the registry tarballs.

- packages: **230**
- scoped under `@mrfentmen`: **63**
- total size: **6.1 MB**
- carrying a licence gate (`MCP_LICENSE_KEY`): **11**
- carrying tools that answer `Not yet implemented` in the shipped `dist/`: **0**
- whose `src/` still holds the pre-fix source (not shipped): **4**

| package | version | src? | gate | stubs |
| --- | --- | --- | --- | --- |
| `adguardhome-mcp` | 1.0.6 | no |  |  |
| `aimeleondore-mcp` | 1.0.6 | no |  |  |
| `@mrfentmen/airtable-mcp` | 1.1.1 | no |  |  |
| `@mrfentmen/alpaca-mcp` | 1.1.1 | no |  |  |
| `@mrfentmen/alphavantage-mcp` | 1.0.6 | no |  |  |
| `amadeus-mcp` | 1.0.4 | no |  |  |
| `@mrfentmen/apollo-mcp` | 1.1.1 | no |  |  |
| `appveyor-mcp` | 1.0.6 | no |  |  |
| `appwrite-mcp` | 1.0.3 | no |  |  |
| `arbeitnow-mcp` | 1.1.0 | no |  |  |
| `arweave-mcp` | 1.1.0 | no |  |  |
| `@mrfentmen/ashby-mcp` | 1.1.0 | no |  |  |
| `@mrfentmen/assemblyai-mcp` | 1.0.3 | no |  |  |
| `avianne-mcp` | 1.1.0 | no |  |  |
| `balenciaga-mcp` | 1.1.0 | no |  |  |
| `baserow-mcp` | 1.0.3 | no |  |  |
| `@mrfentmen/beehiiv-mcp` | 1.0.5 | no |  |  |
| `beis-mcp` | 1.1.0 | no |  |  |
| `betterstack-mcp` | 1.1.0 | no |  |  |
| `@mrfentmen/bigcommerce-mcp` | 1.0.6 | no |  |  |
| `binance-market-mcp` | 1.1.0 | no |  |  |
| `@mrfentmen/bitwarden-mcp` | 1.0.5 | no |  |  |
| `blockchain-info-mcp` | 1.1.0 | no |  |  |
| `blubrry-mcp` | 1.0.5 | no |  |  |
| `bottegaveneta-mcp` | 1.1.0 | no |  |  |
| `@mrfentmen/brave-mcp` | 1.1.2 | no |  |  |
| `brevo-mcp` | 1.0.5 | no |  |  |
| `brewery-mcp` | 1.1.0 | no |  |  |
| `burberry-mcp` | 1.1.0 | no |  |  |
| `calcom-mcp` | 1.1.2 | no |  |  |
| `cartesia-mcp` | 1.0.4 | no |  |  |
| `cartier-mcp` | 1.1.0 | no |  |  |
| `censys-mcp` | 1.0.4 | no |  |  |
| `cgtrader-mcp` | 1.1.0 | no |  |  |
| `chanel-mcp` | 1.1.0 | no |  |  |
| `cheapshark-mcp` | 1.1.0 | no |  |  |
| `checkly-mcp` | 1.0.3 | no |  |  |
| `clerk-mcp` | 1.0.4 | no |  |  |
| `@mrfentmen/cloudflare-mcp` | 1.1.2 | no |  |  |
| `cocktaildb-mcp` | 1.1.0 | no |  |  |
| `@mrfentmen/coinbase-mcp` | 1.1.0 | no |  |  |
| `@mrfentmen/coingecko-mcp` | 1.1.0 | yes |  |  |
| `coinlore-mcp` | 1.1.0 | no |  |  |
| `confluent-mcp` | 1.0.5 | no |  |  |
| `convertkit-mcp` | 1.0.6 | no |  |  |
| `@mrfentmen/crisp-mcp` | 1.1.5 | no |  |  |
| `cryptorank-mcp` | 1.0.7 | no |  |  |
| `customerio-mcp` | 1.1.2 | no |  |  |
| `cyberark-mcp` | 1.1.0 | no |  |  |
| `deepgram-mcp` | 1.0.4 | no |  |  |
| `@mrfentmen/defillama-mcp` | 1.1.0 | yes |  |  |
| `deribit-mcp` | 1.1.0 | no |  |  |
| `dior-mcp` | 1.1.0 | no |  |  |
| `directus-mcp` | 1.0.4 | no |  |  |
| `disify-mcp` | 1.1.0 | no |  |  |
| `doh-mcp` | 1.1.0 | no |  |  |
| `doppler-mcp` | 1.0.5 | no |  |  |
| `@mrfentmen/ebay-mcp` | 1.1.2 | no |  |  |
| `email-validator-mcp` | 1.2.0 | no |  |  |
| `epo-mcp` | 1.0.3 | no |  |  |
| `ericemanuel-mcp` | 1.1.0 | no |  |  |
| `@mrfentmen/etherscan-mcp` | 1.1.2 | no |  |  |
| `ethplorer-mcp` | 1.1.0 | no |  |  |
| `@mrfentmen/etsy-mcp` | 1.0.4 | no |  |  |
| `fbi-crime-mcp` | 1.0.2 | no |  |  |
| `feedly-mcp` | 1.0.2 | no |  |  |
| `fendi-mcp` | 1.0.5 | no |  |  |
| `@mrfentmen/figma-mcp` | 1.1.4 | no |  |  |
| `flipside-mcp` | 1.0.3 | no |  |  |
| `fmp-mcp` | 1.1.0 | no |  |  |
| `folk-mcp` | 1.0.3 | no |  |  |
| `@mrfentmen/freshdesk-mcp` | 1.1.5 | no |  |  |
| `@mrfentmen/fueleconomy-mcp` | 1.0.4 | no |  |  |
| `gatus-mcp` | 1.0.5 | no |  |  |
| `geckoterminal-mcp` | 1.0.7 | no |  |  |
| `@mrfentmen/github-mcp` | 1.1.4 | no |  |  |
| `@mrfentmen/gitlab-mcp` | 1.2.0 | no |  |  |
| `glossier-mcp` | 1.0.5 | no |  |  |
| `gog-mcp` | 1.0.5 | no |  |  |
| `gold-prices-mcp` | 1.0.5 | yes |  |  |
| `google-books-mcp` | 1.1.0 | no |  |  |
| `google-fonts-mcp` | 1.0.3 | no |  |  |
| `gorjana-mcp` | 1.1.0 | no |  |  |
| `gotify-mcp` | 1.0.3 | no |  |  |
| `@mrfentmen/greenhouse-mcp` | 1.0.5 | no |  |  |
| `@mrfentmen/groq-mcp` | 1.0.3 | no |  |  |
| `gucci-mcp` | 1.0.5 | no |  |  |
| `hackertarget-mcp` | 1.1.0 | no |  |  |
| `@mrfentmen/hashnode-mcp` | 1.1.4 | no |  |  |
| `@mrfentmen/helius-mcp` | 1.0.4 | no |  |  |
| `hermes-mcp` | 1.0.5 | no |  |  |
| `hibp-mcp` | 1.1.4 | no |  |  |
| `@mrfentmen/hubspot-mcp` | 1.1.4 | no |  |  |
| `icebox-mcp` | 1.0.5 | no |  |  |
| `ifandco-mcp` | 1.0.5 | no |  |  |
| `invoice-mcp` | 1.1.0 | no |  |  |
| `isbndb-mcp` | 1.1.0 | no |  |  |
| `@mrfentmen/iss-mcp` | 1.1.0 | yes |  |  |
| `jacquesmariemage-mcp` | 1.1.0 | no |  |  |
| `jetbrains-mcp` | 1.0.5 | no |  |  |
| `@mrfentmen/job-search-mcp` | 1.0.5 | no |  |  |
| `jobicy-mcp` | 1.0.5 | no |  |  |
| `jokeapi-mcp` | 1.0.4 | no |  |  |
| `jolpica-mcp` | 1.1.0 | yes |  |  |
| `k6-mcp` | 1.0.2 | no |  |  |
| `kith-mcp` | 1.0.3 | no | 3 |  |
| `kiwi-mcp` | 1.0.3 | no |  |  |
| `@mrfentmen/klaviyo-mcp` | 1.1.4 | no |  |  |
| `kong-mcp` | 1.0.2 | no |  |  |
| `kraken-mcp` | 1.0.5 | no |  |  |
| `lago-mcp` | 1.0.2 | no |  |  |
| `lastfm-mcp` | 1.0.2 | no |  |  |
| `lemonsqueezy-mcp` | 1.1.0 | no |  |  |
| `lever-mcp` | 1.0.5 | no |  |  |
| `@mrfentmen/linear-mcp` | 1.1.2 | no | 3 |  |
| `listennotes-mcp` | 1.1.4 | no |  |  |
| `@mrfentmen/loops-mcp` | 1.0.3 | no |  |  |
| `louisvuitton-mcp` | 1.1.0 | no |  |  |
| `madhappy-mcp` | 1.1.0 | no |  |  |
| `@mrfentmen/mailchimp-mcp` | 1.1.4 | no |  |  |
| `mailgun-mcp` | 1.1.0 | no |  |  |
| `mailjet-mcp` | 1.0.3 | no |  |  |
| `marketstack-mcp` | 1.1.0 | no |  |  |
| `@mrfentmen/mastodon-mcp` | 1.1.0 | no |  |  |
| `mcp-auditor-mcp` | 1.0.4 | no |  |  |
| `mercury-mcp` | 1.0.2 | no |  |  |
| `missoma-mcp` | 1.1.0 | no |  |  |
| `@mrfentmen/mixpanel-mcp` | 1.0.5 | no |  |  |
| `mobygames-mcp` | 1.1.0 | no |  |  |
| `nager-mcp` | 1.0.4 | no |  |  |
| `netdata-mcp` | 1.0.2 | no |  |  |
| `noahny-mcp` | 1.1.0 | no |  |  |
| `nonprofit-mcp` | 1.0.4 | no |  |  |
| `@mrfentmen/notion-mcp` | 1.1.4 | no |  |  |
| `novu-mcp` | 1.1.4 | no |  |  |
| `@mrfentmen/ntfy-mcp` | 1.1.4 | no |  |  |
| `nyc-arrests-mcp` | 1.0.2 | no | 3 |  |
| `nylas-mcp` | 1.0.2 | no |  |  |
| `ocrspace-mcp` | 1.0.2 | no |  |  |
| `ohdear-mcp` | 1.1.0 | no |  |  |
| `omdb-mcp` | 1.1.1 | no |  |  |
| `onesignal-mcp` | 1.1.0 | no |  |  |
| `openchargemap-mcp` | 1.0.2 | no |  |  |
| `@mrfentmen/openlibrary-mcp` | 1.0.4 | no |  |  |
| `openmoji-mcp` | 1.0.5 | no |  |  |
| `openpanel-mcp` | 1.1.0 | no |  |  |
| `@mrfentmen/openrouter-mcp` | 1.1.4 | no |  |  |
| `openrouteservice-mcp` | 1.1.0 | no |  |  |
| `opentdb-mcp` | 1.0.4 | no |  |  |
| `opnsense-mcp` | 1.0.2 | no |  |  |
| `@mrfentmen/opsgenie-mcp` | 1.0.2 | no |  |  |
| `osrs-mcp` | 1.0.4 | no |  |  |
| `paddle-mcp` | 1.0.2 | no |  |  |
| `@mrfentmen/paypal-mcp` | 1.1.4 | no |  |  |
| `peakdesign-mcp` | 1.1.0 | no |  |  |
| `@mrfentmen/pinata-mcp` | 1.1.0 | no |  |  |
| `pingdom-mcp` | 1.1.0 | no |  |  |
| `@mrfentmen/pinterest-mcp` | 1.0.4 | no |  |  |
| `plaid-mcp` | 1.1.2 | no | 3 |  |
| `plain-mcp` | 1.1.0 | no |  |  |
| `playcanvas-mcp` | 1.1.0 | no |  |  |
| `@mrfentmen/polygon-mcp` | 1.1.4 | no |  |  |
| `posthog-mcp` | 1.1.4 | no |  |  |
| `@mrfentmen/postmark-mcp` | 1.0.2 | no |  |  |
| `prada-mcp` | 1.0.5 | no |  |  |
| `predictit-mcp` | 1.0.5 | no |  |  |
| `producthunt-mcp` | 1.1.0 | no |  |  |
| `publicwww-mcp` | 1.0.2 | no |  |  |
| `pusher-mcp` | 1.1.1 | no |  |  |
| `pvgis-mcp` | 1.0.4 | no |  |  |
| `qbittorrent-mcp` | 1.0.2 | no |  |  |
| `quip-mcp` | 1.1.0 | no |  |  |
| `radarr-mcp` | 1.0.2 | no |  |  |
| `@mrfentmen/raindrop-mcp` | 1.0.2 | no |  |  |
| `rawg-mcp` | 1.1.0 | no |  |  |
| `@mrfentmen/readwise-mcp` | 1.0.2 | no |  |  |
| `remoteok-mcp` | 1.0.5 | no |  |  |
| `@mrfentmen/resend-mcp` | 1.1.4 | no |  |  |
| `rolex-mcp` | 1.0.5 | no |  |  |
| `rollbar-mcp` | 1.1.0 | no |  |  |
| `rybbit-mcp` | 1.0.3 | no |  |  |
| `saintlaurent-mcp` | 1.0.5 | no |  |  |
| `savvycal-mcp` | 1.1.0 | no |  |  |
| `scryfall-mcp` | 1.0.5 | no |  |  |
| `seatgeek-mcp` | 1.1.0 | no |  |  |
| `@mrfentmen/sentry-mcp` | 1.1.4 | no |  |  |
| `shootproof-mcp` | 1.1.0 | no |  |  |
| `simplecast-mcp` | 1.1.0 | no |  |  |
| `@mrfentmen/slack-mcp` | 1.1.4 | no |  |  |
| `smartrecruiters-mcp` | 1.0.5 | no |  |  |
| `spacedevs-mcp` | 1.1.4 | no |  |  |
| `sportyandrich-mcp` | 1.1.0 | no |  |  |
| `@mrfentmen/spotify-mcp` | 1.1.4 | no |  |  |
| `spreaker-mcp` | 1.1.0 | no |  |  |
| `squarespace-mcp` | 1.0.3 | no |  |  |
| `stadiumgoods-mcp` | 1.0.5 | no |  |  |
| `statping-mcp` | 1.1.0 | no |  |  |
| `statuscake-mcp` | 1.1.0 | no |  |  |
| `statuspage-mcp` | 1.1.0 | no |  |  |
| `@mrfentmen/steam-mcp` | 1.0.4 | no | 3 |  |
| `@mrfentmen/storyblok-mcp` | 1.0.2 | no |  |  |
| `@mrfentmen/stripe-mcp` | 1.1.0 | no |  |  |
| `@mrfentmen/supabase-mcp` | 1.1.4 | no |  |  |
| `swetrix-mcp` | 1.1.0 | no |  |  |
| `tally-mcp` | 1.1.2 | no |  |  |
| `@mrfentmen/telegram-mcp` | 1.1.4 | no |  |  |
| `themuse-mcp` | 1.0.3 | no | 3 |  |
| `theoddsapi-mcp` | 1.1.0 | no |  |  |
| `tiingo-mcp` | 1.0.3 | no |  |  |
| `traxnyc-mcp` | 1.0.3 | no | 3 |  |
| `turbosquid-mcp` | 1.1.0 | no |  |  |
| `twelvedata-mcp` | 1.1.0 | no |  |  |
| `twilio-mcp` | 1.0.0 | no |  |  |
| `@mrfentmen/twitch-mcp` | 1.1.0 | no |  |  |
| `typeform-mcp` | 1.1.4 | no |  |  |
| `uptime-kuma-mcp` | 1.0.2 | no |  |  |
| `uptimerobot-mcp` | 1.1.0 | no |  |  |
| `urlhaus-mcp` | 1.0.4 | no |  |  |
| `usajobs-mcp` | 1.0.3 | no |  |  |
| `usps-mcp` | 1.0.2 | no |  |  |
| `vapi-mcp` | 1.0.2 | no |  |  |
| `@mrfentmen/vercel-mcp` | 1.1.4 | no |  |  |
| `wayback-mcp` | 1.0.2 | no | 3 |  |
| `weightsbiases-mcp` | 1.1.0 | no |  |  |
| `whiskyhunter-mcp` | 1.0.3 | no | 3 |  |
| `@mrfentmen/wise-mcp` | 1.1.0 | no |  |  |
| `workable-mcp` | 1.0.3 | no | 3 |  |
| `@mrfentmen/yfinance-mcp` | 1.0.3 | yes | 3 |  |
| `@mrfentmen/youtrack-mcp` | 1.0.3 | no |  |  |
| `@mrfentmen/youtube-mcp` | 1.1.5 | no |  |  |
