# theses.fr MCP

French doctoral theses from theses.fr — search by title, subject, author or supervisor, then read the supervisors, jury, subjects, DOI and NNT — keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/theses-fr-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "theses-fr-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/theses-fr-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search` | Search theses with paging. Shows author, defence date, university, discipline and status |
| `record` | One thesis by NNT or id: supervisors, jury, doctoral school, subjects, DOI and page link |

## Example

```
"intelligence artificielle" — 8850 theses, showing 1-3

1. [s431762] Artificial Intelligence and Economic Dynamics
   Thomas Berthelot · not defended yet · CY Cergy Paris Université · Sciences économiques - EM2PSI · in progress
2. [2023STRAB011] Artificial intelligence in science : diffusion and impact
   Pierre Pelletier · defended 23/06/2023 · Strasbourg · Sciences économiques · defended
3. [s372280] L'intelligence artificielle dans les interactions patients/médecins à la croisée de trois disciplines : la médecine, les sciences de l'information et la communication, l'informatique
   Jean Viry-babel · not defended yet · Université Gustave Eiffel · Sciences de l'Information et de la Communication · in progress
```

`record` on `2016REN1S112` prints the supervisors, the doctoral school, the
partners, the French and Rameau subject lists, the NNT and the DOI.

Both defended theses and theses still in progress are included, so `status`
matters when you only want finished work.

## Notes

Reads the public theses.fr API (`theses.fr/api/v1/theses/recherche/`). No key,
no login.

`record` works by asking the search index for the exact id or NNT and refusing
to print anything that is not an exact match — theses.fr has no per-record
endpoint (`/api/v1/theses/<id>` answers 404).

No filters: `annee`, `discipline`, `status`, `etablissement` and the `filtres`
JSON parameter all leave the result count unchanged, so this server does not
offer them.

No sorting: `tri=pertinence`, `tri=date` and `tri=dateSoutenance` all return the
same order.

No facet counts: the response carries only the hit count, the timing and the
theses themselves.

## Licence

MIT
