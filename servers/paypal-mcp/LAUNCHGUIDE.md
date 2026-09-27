# PayPal Sandbox MCP

## Tagline
Orders and plans. Sandbox ID + secret.

## Description
Orders and plans. Sandbox ID + secret. Not affiliated with the vendor.

## Setup Requirements
- API credentials (free tier/sandbox). See server README.

## Category
Finance

## Features
- plan_details: Billing plan.
- list_products: Catalog products.
- product_details: Catalog product.
- subscription_details: Subscription details.
- payout_details: Payout batch.
- list_webhooks: Registered webhooks.
- dispute_details: Customer dispute.

- Get order: One order by id, with status, amount and payer.
- Get capture: One payment capture by id, with amount and status.
- List plans: Billing plans on the account, with id and status.

## Getting Started

- "Sandbox orders?"
- Tool: get_order — One order by id, with status, amount and payer.
- Tool: get_capture — One payment capture by id, with amount and status.
- Tool: list_plans — Billing plans on the account, with id and status.

## Tags
paypal, payments, sandbox

## Documentation URL
https://github.com/mrfentmen/premium-mcps/tree/main/servers/paypal-mcp
