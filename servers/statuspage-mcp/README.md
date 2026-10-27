# statuspage-mcp

Query Statuspage management API (key; set STATUSPAGE_API_KEY, OAuth header): pages, page details, incidents. (Public per-page v2 is keyless but page-scoped; this covers management reads.)

## Tools

- `list_pages` — Status pages the key can read, with id and name.
- `get_page` — One status page by id, with components and status.
- `list_incidents` — Recent incidents on a page, newest first.

- `incident_details` — Single incident.
- `incident_updates` — Update timeline.
- `components` — Status components.
- `component_details` — Single component.
- `subscribers` — Page subscribers.
- `upcoming_maintenance` — Scheduled windows.
- `maintenance_details` — Single window.

## Source

[statuspage-mcp](https://github.com/mrfentmen/awesome-servers/tree/main/servers/statuspage-mcp)
