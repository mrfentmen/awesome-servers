# fueleconomy-mcp

US EPA car MPG, CO2 and pump prices - no API key.

## Tools

- `list_years` — Model years the US fuel economy database covers. Start here when you know nothing else.
- `list_makes` — Every car make with EPA data for a model year.
- `list_models` — Models a make sold in a given model year.
- `list_options` — Trims/engines for a model, each with the vehicle id needed by vehicle_details.
- `vehicle_details` — Full EPA record for one vehicle id: MPG city/highway/combined, CO2, annual fuel cost, engine, class and scores.
- `compare_vehicles` — Compare up to 6 vehicles side by side on MPG, CO2 and running cost, and name the most efficient one.
- `fuel_prices` — Current US national average prices for regular, midgrade, premium, diesel, E85, CNG, LPG and electricity.

## Setup

No setup. All data comes from the public fueleconomy.gov API.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).
