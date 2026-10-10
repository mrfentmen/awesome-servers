# Have I Been Pwned MCP

## Tagline
Data breach catalogue and password leak checks - no API key.

## Description
Search the Have I Been Pwned catalogue of disclosed breaches from your AI assistant: filter by domain or year, read any breach in full, see what was added most recently, get catalogue-wide statistics, rank the kinds of data that leak most often, and check whether a password has already appeared in a dump using k-anonymity so the password never leaves the server. No account or key. An independent MCP server using the public Have I Been Pwned API. Not affiliated with or endorsed by Have I Been Pwned or Troy Hunt.

## Setup Requirements
No setup. The catalogue and the password range API are public, so there is no key or account.

## Category
Developer Tools

## Features

- Breach catalogue: Search the Have I Been Pwned catalogue of disclosed breaches, largest first, filtered by domain or year.
- Breach detail: Full record for one breach by its catalogue name, including the account count, data classes and description.
- Recent breaches: Breaches most recently added to the catalogue, newest first, optionally limited to the last N days.
- Breach statistics: Aggregate picture of the breach catalogue: accounts exposed, verification rate, breaches per year and the data types leaked most.
- Data classes: Which kinds of personal data leak most often, ranked by how many breaches exposed each type.
- Password exposure: Check one password against known breach dumps. Uses k-anonymity, so the password is never transmitted.
- Audit passwords: Check up to 10 passwords at once and report which have already appeared in a breach.
- Latest breach: The newest breach added to Have I Been Pwned: domain, date, account count and exposed data.
- Password strength: Entropy and crack-time estimate for a password, plus whether it already appears in a breach.

## Getting Started

- Ask your assistant about hibp using this server once installed
- Tool: breach_catalog — Search the Have I Been Pwned catalogue of disclosed breaches, largest first, filtered by domain or year.
- Tool: breach_detail — Full record for one breach by its catalogue name, including the account count, data classes and description.
- Tool: recent_breaches — Breaches most recently added to the catalogue, newest first, optionally limited to the last N days.
- Tool: breach_stats — Aggregate picture of the breach catalogue: accounts exposed, verification rate, breaches per year and the data types leaked most.
- Tool: data_classes — Which kinds of personal data leak most often, ranked by how many breaches exposed each type.
- Tool: password_exposure — Check one password against known breach dumps. Uses k-anonymity, so the password is never transmitted.
- Tool: password_audit — Check up to 10 passwords at once and report which have already appeared in a breach.
- Tool: latest_breach — The newest breach added to Have I Been Pwned: domain, date, account count and exposed data.
- Tool: password_strength — Entropy and crack-time estimate for a password, plus whether it already appears in a breach.

## Tags
breach, hibp, passwords, security, leaks, mcp

## Documentation URL
https://github.com/mrfentmen/premium-mcps/tree/main/servers/hibp-mcp
