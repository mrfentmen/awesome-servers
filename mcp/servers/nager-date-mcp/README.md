# Nager.Date MCP

Public holidays for 204 countries — by year, upcoming, with local names and whether each is nationwide or regional. Keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/nager-date-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "nager-date-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/nager-date-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `countries` | List the 204 countries that have data, with their two-letter codes |
| `holidays` | Public holidays for one country in one year |
| `next` | Upcoming public holidays from today |

## Example

```
Public holidays in FR, 2026 — 11

   2026-01-01  New Year's Day (Jour de l'an) [Public]
   2026-04-06  Easter Monday (Lundi de Pâques) [Public]
   2026-05-01  Labour Day (Fête du Travail) [Public]
   2026-05-08  Victory in Europe Day (Victoire 1945) [Public]
```

Each line carries the date, the English name, the local name when it differs,
the holiday type, and the region when a holiday is not nationwide.

## Notes

Reads the public Nager.Date API (`date.nager.at/api/v3`). No key, no login.

Country codes are two letters and upper-cased for you. An unknown code returns a
plain message instead of an empty list.

`holidays` defaults to the current year. Years from 1900 to 2200 are accepted;
some countries have no data for old years, which is reported as such.

Types come from the source and look like `Public`, `Bank`, `School`,
`Authorities`, `Optional` or `Observance`, several per holiday where applicable.

## Licence

MIT
