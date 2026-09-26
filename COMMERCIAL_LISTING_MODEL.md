# AviaInventory Commercial Listing Model

## Core pricing model

Every listing has an explicit **pricing method** and **pricing basis**.

- **Fixed price** — a published price that represents the selected basis.
- **Negotiable price** — an indicative published amount; the final price is negotiated with the supplier.
- **Request quote** — no numeric price is published. Buyers are directed to request a quote.
- **Per unit** — the numeric amount represents one physical unit.
- **Per lot** — the numeric amount represents one defined lot; `units per lot` is required.

A Request Quote listing never renders `0`, `Starting From`, or another placeholder as a price.

## Commercial fields

- Currency
- Quantity available
- Minimum order quantity
- Availability
- Stock location
- Lead time
- Optional Incoterms / named place
- Optional payment terms
- Optional price-valid-until date

## Buyer-facing clarity

Marketplace cards and listing detail explicitly state `per unit` or `per lot (N units)`. Negotiable prices are labelled negotiable/indicative. Request Quote listings show `Request a Quote` instead of a numeric amount.

## Validation

- Fixed/Negotiable requires a real non-negative numeric price.
- Request Quote requires no numeric displayed price.
- Lot pricing requires a positive lot size.
- MOQ must be positive and no greater than available quantity.
- Price validity dates cannot be in the past at save time.

## QA hardening additions

- Quantity and MOQ are whole physical-unit counts.
- Lot size cannot exceed available quantity.
- For lot pricing, MOQ must represent one or more complete lots.
- Supported currency and availability values are constrained at the database boundary.
- Request Quote listings cannot contain a numeric displayed price.
