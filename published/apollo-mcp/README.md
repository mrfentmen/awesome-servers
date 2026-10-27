# apollo-mcp

Query Apollo.io (free key; set APOLLO_API_KEY, X-Api-Key header): account health, person match, people search.

## Setup

Get a free-tier API key from Apollo, then:

```bash
export APOLLO_API_KEY=your_key
npm install
npm run build
node dist/index.js
```

The key is sent to Apollo as the X-Api-Key header and nowhere else.

## Tools

- `health` — Check that the Apollo API key still works.
- `match_person` — Match one person by email, name or company.
- `search_people` — Prospect search by title, location and company size.

- `people_search` — Prospects by keywords.
- `company_search` — Companies by name.
- `org_enrich` — Company by domain.
- `bulk_match` — Up to 10 emails.
- `get_contact` — Contact by ID.
- `account_search` — Accounts by name.
- `people_search_v1` — Prospects by job title.

## Source

[apollo-mcp](https://github.com/mrfentmen/awesome-servers)
