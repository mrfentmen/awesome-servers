# Fuel Economy MCP

## Tagline
US EPA car MPG, CO2 and pump prices - no API key.

## Description
Explore the US EPA fuel economy database from your AI assistant: model years, makes, models and trims, full MPG and CO2 records, side-by-side vehicle comparisons, and current national pump prices for every fuel type. No account or key. An independent MCP server. Not affiliated with or endorsed by the US Department of Energy.

## Setup Requirements
No setup. All data comes from the public fueleconomy.gov API.

## Category
Other

## Features

- List model years: Model years the US fuel economy database covers. Start here when you know nothing else.
- List makes: Every car make with EPA data for a model year.
- List models: Models a make sold in a given model year.
- List trims and vehicle ids: Trims/engines for a model, each with the vehicle id needed by vehicle_details.
- Vehicle details: Full EPA record for one vehicle id: MPG city/highway/combined, CO2, annual fuel cost, engine, class and scores.
- Compare vehicles: Compare up to 6 vehicles side by side on MPG, CO2 and running cost, and name the most efficient one.
- Fuel prices: Current US national average prices for regular, midgrade, premium, diesel, E85, CNG, LPG and electricity.
- Running cost: Estimated annual fuel cost for one vehicle at a chosen mileage, using its EPA combined MPG and either your fuel price or the national average for that fuel.
- Compare running costs: Rank two to six vehicles by estimated annual fuel cost at the same mileage, with CO2, from their EPA records.

## Getting Started

- Ask your assistant about fueleconomy using this server once installed
- Tool: list_years — Model years the US fuel economy database covers. Start here when you know nothing else.
- Tool: list_makes — Every car make with EPA data for a model year.
- Tool: list_models — Models a make sold in a given model year.
- Tool: list_options — Trims/engines for a model, each with the vehicle id needed by vehicle_details.
- Tool: vehicle_details — Full EPA record for one vehicle id: MPG city/highway/combined, CO2, annual fuel cost, engine, class and scores.
- Tool: compare_vehicles — Compare up to 6 vehicles side by side on MPG, CO2 and running cost, and name the most efficient one.
- Tool: fuel_prices — Current US national average prices for regular, midgrade, premium, diesel, E85, CNG, LPG and electricity.
- Tool: running_cost — Estimated annual fuel cost for one vehicle at a chosen mileage, using its EPA combined MPG and either your fuel price or the national average for that fuel.
- Tool: compare_costs — Rank two to six vehicles by estimated annual fuel cost at the same mileage, with CO2, from their EPA records.

## Tags
cars, fuel, epa, mpg, emissions, mcp

## Documentation URL
https://github.com/mrfentmen/premium-mcps/tree/main/servers/fueleconomy-mcp
