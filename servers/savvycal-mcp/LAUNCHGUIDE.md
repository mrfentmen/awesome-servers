# Savvycal MCP

## Tagline
Timezone, business-day and meeting-slot maths - no API key.

## Description
Schedule correctly from your AI assistant: convert times between timezones with daylight saving handled, inspect DST transitions, count and add business days around holidays, find free meeting slots, and work out overlap across a distributed team. No account or key. An independent MCP server. Not affiliated with or endorsed by SavvyCal.

## Setup Requirements
No setup. All timezone and calendar maths uses the IANA database shipped with Node.

## Category
AI

## Features

- Convert time between timezones: Convert a date and time from one timezone to another, using the live IANA database so daylight saving is handled correctly. No account needed.
- Timezone and DST info: Show a timezone's current offset, its standard and summer offsets, whether it observes daylight saving and the exact dates its clocks change this year.
- Count business days: Count the working days between two dates, excluding weekends and any holidays you list, with a configurable weekend.
- Add business days to a date: Move a date forward or back by a number of business days, skipping weekends and any holidays you list.
- Find free meeting slots: Given a date, a timezone, working hours and the times you are already busy, list every free meeting slot of the length you need, optionally shown in other attendees' timezones too.
- World clock: Show the current local time and UTC offset in up to 12 timezones at once.
- Find overlap across timezones: Work out which UTC hours fall inside everyone's working hours for a distributed team, listing each attendee's local time for every workable hour.

## Getting Started

- Ask your assistant about savvycal using this server once installed
- Tool: convert_time — Convert a date and time from one timezone to another, using the live IANA database so daylight saving is handled correctly. No account needed.
- Tool: timezone_info — Show a timezone's current offset, its standard and summer offsets, whether it observes daylight saving and the exact dates its clocks change this year.
- Tool: business_days — Count the working days between two dates, excluding weekends and any holidays you list, with a configurable weekend.
- Tool: add_business_days — Move a date forward or back by a number of business days, skipping weekends and any holidays you list.
- Tool: meeting_slots — Given a date, a timezone, working hours and the times you are already busy, list every free meeting slot of the length you need, optionally shown in other attendees' timezones too.
- Tool: world_clock — Show the current local time and UTC offset in up to 12 timezones at once.
- Tool: team_overlap — Work out which UTC hours fall inside everyone's working hours for a distributed team, listing each attendee's local time for every workable hour.

## Tags
scheduling, timezone, meetings, calendar, productivity, mcp

## Documentation URL
https://github.com/mrfentmen/premium-mcps/tree/main/servers/savvycal-mcp
