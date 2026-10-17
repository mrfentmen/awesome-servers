# openmoji-mcp

Search 4500+ open-source emoji with SVG links - no API key.

## Tools

- `search_emoji` — Search every OpenMoji emoji by annotation, tag, group or subgroup. Returns hexcode and SVG link.
- `get_emoji` — Full record for one emoji: group, subgroup, tags and the official SVG link.
- `list_groups` — The OpenMoji groups with how many emoji each contains.
- `list_subgroups` — Subgroups inside one group, with emoji counts.
- `emojis_in_group` — Browse a group, optionally narrowed to one subgroup.
- `random_emoji` — Pick a random emoji, from the whole set or from one group.
- `emoji_stats` — How big the OpenMoji set is right now: totals, groups, sequences and the largest group.
- `svg_links` — The colour and black SVG files OpenMoji publishes for one emoji, each checked live so the URL, content type and file size are known before it is used.
- `skin_tone_variants` — Every skin-tone variant OpenMoji publishes for an emoji, read from the dataset's own base links and labelled light through dark.
- `compare_emoji` — Compare two emoji on group, subgroup and tags with a tag-overlap score, to tell a near-duplicate apart from a genuinely different choice.

## Setup

No setup. The OpenMoji dataset is fetched once and queried locally.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).


