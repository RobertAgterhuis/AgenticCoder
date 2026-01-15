# azure-pricing-mcp

Status: minimal working CLI using Azure Retail Prices API with retries and optional region/currency filters. Implements `ping`, `price_search`, and `cost_estimate`.

## Quickstart

```bash
python -m azure_pricing_mcp ping
python -m azure_pricing_mcp price_search Standard_B2s --region eastus --currency USD
python -m azure_pricing_mcp cost_estimate Standard_B2s 2 --region eastus --currency USD
python -m azure_pricing_mcp mcp
python health_check.py
```

Tests (from this folder):

```bash
python -m unittest discover -s tests -t .
```

Notes:
- Uses Azure Retail Prices public API; no auth required but needs outbound internet.
- `cost_estimate` multiplies unit retail price by quantity * 730 (hours/month) for a rough monthly USD estimate.

Environment (optional):
- `AZURE_PRICING_API` (default https://prices.azure.com/api/retail/prices)
- `AZURE_PRICING_TIMEOUT` (seconds, default 10)
- `AZURE_PRICING_RETRIES` (default 3)
- `AZURE_PRICING_BACKOFF` (seconds, base for exponential, default 0.5)
- `AZURE_PRICING_REGION` (default region filter)
- `AZURE_PRICING_CURRENCY` (default currency code)

## TODO
- Add richer tools: price_compare, region_recommend, discover_skus, sku_discovery.
- Add caching and better paging/selection logic.
- Expand test coverage.
