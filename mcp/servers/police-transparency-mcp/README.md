# police-transparency-mcp

A deliberately narrow public-data server for aggregate historical NYC police complaint statistics. It is intended for journalism, civic research, and year-over-year trend exploration, not operational policing.

## Tool

- `summarize_complaints`: count historic NYPD complaints grouped by borough, broad law category, or offense description, with an optional year and borough filter.

The server does not expose names, addresses, coordinates, demographics, incident rows, live dispatch, surveillance, targeting, person lookup, or operational controls. Aggregate groups with fewer than five records are suppressed. NYPD complaint data is historical, reported data with known limitations and potential classification or reporting bias. It should not be used to infer individual behavior or make decisions about a person.

## Run

```bash
npm install
npm run build
node dist/index.js
```
