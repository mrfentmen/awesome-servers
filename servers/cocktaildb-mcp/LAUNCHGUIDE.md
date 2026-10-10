# Cocktail Recipes MCP

## Tagline
Cocktail search, recipes and random. Keyless.

## Description
CocktailDB recipes: search, lookup, random, ingredients. Keyless.

## Setup Requirements
- No configuration required. Works out of the box with no API keys.

## Category
Other

## Features

- Search cocktails: Find cocktails by name. Returns matching drinks with their category, glass and id — pass an id to get_cocktail for the full recipe.
- Get cocktail: Full recipe for one drink: ingredients with measures, instructions, glass, category and image URL. Needs a drink id from search_cocktails or filter_cocktails.
- Random cocktail: One or more random cocktail recipes, useful for suggestions and inspiration.
- List ingredients: Known ingredients in the cocktail database, optionally filtered by a substring. Use the exact names with filter_cocktails and ingredient_info.
- Filter cocktails: Browse cocktails by one attribute: an ingredient they contain, a category, a glass type, or an alcohol option. Returns drink names with ids.
- Ingredient info: Profile of one ingredient: type, whether it contains alcohol, ABV, and a description of what it is.
- List filters: The valid values for filter_cocktails: drink categories, glass types and alcohol options.
- Browse by letter: List every cocktail whose name starts with one letter, for browsing the database alphabetically.
- Filter by several ingredients: Cocktails that contain all of the listed ingredients at once, e.g. Gin and Tonic water — the recipe finder for what is already in the bar.

## Getting Started

- "How do I make a margarita?"
- "Give me a random cocktail"
- Tool: search_cocktails — Find cocktails by name. Returns matching drinks with their category, glass and id — pass an id to get_cocktail for the full recipe.
- Tool: get_cocktail — Full recipe for one drink: ingredients with measures, instructions, glass, category and image URL. Needs a drink id from search_cocktails or filter_cocktails.
- Tool: random_cocktail — One or more random cocktail recipes, useful for suggestions and inspiration.
- Tool: list_ingredients — Known ingredients in the cocktail database, optionally filtered by a substring. Use the exact names with filter_cocktails and ingredient_info.
- Tool: filter_cocktails — Browse cocktails by one attribute: an ingredient they contain, a category, a glass type, or an alcohol option. Returns drink names with ids.
- Tool: ingredient_info — Profile of one ingredient: type, whether it contains alcohol, ABV, and a description of what it is.
- Tool: list_filters — The valid values for filter_cocktails: drink categories, glass types and alcohol options.
- Tool: search_by_letter — List every cocktail whose name starts with one letter, for browsing the database alphabetically.
- Tool: filter_multi_ingredient — Cocktails that contain all of the listed ingredients at once, e.g. Gin and Tonic water — the recipe finder for what is already in the bar.

## Tags
cocktails, recipes, drinks, bar, keyless

## Documentation URL
https://github.com/mrfentmen/premium-mcps/tree/main/servers/cocktaildb-mcp
